import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { PointsService } from '../points/points.service';
import { GamificationService } from '../gamification/gamification.service';
import { ReferralStatus, SubStatus } from '@prisma/client';
import * as crypto from 'crypto';

// ClubSettings keys (Wave 3)
export const SETTING_REFERRAL_BONUS_POINTS      = 'referral_bonus_points';
export const SETTING_BIRTHDAY_BONUS_POINTS      = 'birthday_bonus_points';
export const SETTING_EVENT_PARTICIPATION_POINTS = 'event_participation_points';

@Injectable()
export class EngagementService {
  private readonly logger = new Logger(EngagementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pointsService: PointsService,
    private readonly gamification: GamificationService,
  ) {}

  // ──────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ──────────────────────────────────────────────────────────────────────────

  private async getSetting(key: string, defaultValue: number): Promise<number> {
    const row = await this.prisma.clubSettings.findUnique({ where: { key } });
    return row ? parseInt(row.value, 10) || defaultValue : defaultValue;
  }

  /** Gera um código único de 7 caracteres (sem ambiguidade: sem 0/O/I/l/1). */
  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    const bytes = crypto.randomBytes(7);
    for (const b of bytes) {
      code += chars[b % chars.length];
    }
    return code;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // REFERRAL FLOW
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Retorna o código de indicação do cliente (geração lazy).
   * Garante unicidade por retry em colisão (extremamente raro).
   */
  async getOrCreateReferralCode(customerId: string): Promise<string> {
    const customer = await this.prisma.customer.findUniqueOrThrow({
      where: { id: customerId },
      select: { referralCode: true },
    });

    if (customer.referralCode) return customer.referralCode;

    // Geração lazy com retry em colisão
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = this.generateCode();
      try {
        const updated = await this.prisma.customer.update({
          where: { id: customerId },
          data: { referralCode: code },
          select: { referralCode: true },
        });
        return updated.referralCode!;
      } catch {
        // violação de unique → tenta outro código
        continue;
      }
    }
    throw new Error('Não foi possível gerar código de indicação único. Tente novamente.');
  }

  /** Lista os referrals enviados pelo cliente (como referrer). */
  async getReferrals(referrerId: string) {
    return this.prisma.referral.findMany({
      where: { referrerId },
      select: {
        id: true,
        status: true,
        pointsAwarded: true,
        completedAt: true,
        createdAt: true,
        referred: { select: { fullName: true, createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Aplica um código de indicação durante o cadastro de um novo cliente.
   * Cria um Referral PENDING. Chamado dentro de uma transação Prisma.
   * @returns true se o código foi aplicado, false se ausente ou inválido.
   */
  async applyReferralCode(
    newCustomerId: string,
    referralCode: string | undefined,
    tx: any,
  ): Promise<boolean> {
    if (!referralCode) return false;

    const referrer = await tx.customer.findUnique({
      where: { referralCode },
      select: { id: true },
    });

    if (!referrer) return false; // código inexistente — silencioso, não bloqueia cadastro
    if (referrer.id === newCustomerId) return false; // auto-referral

    // Cria o vínculo PENDING (idempotência: referred_id é @unique, upsert seguro)
    try {
      await tx.referral.create({
        data: {
          referrerId: referrer.id,
          referredId: newCustomerId,
          status: ReferralStatus.PENDING,
        },
      });

      // Atualiza o referred_by_id no customer para rastreabilidade
      await tx.customer.update({
        where: { id: newCustomerId },
        data: { referredById: referrer.id },
      });

      return true;
    } catch {
      // colisão de unique (cliente já foi indicado por outra pessoa) — ignora
      return false;
    }
  }

  /**
   * Chamado após o primeiro pagamento confirmado de um cliente indicado.
   * Premia o referrer com referral_bonus_points e marca o Referral COMPLETED.
   * Idempotente: só age se o Referral existe e está PENDING.
   */
  async completeReferral(referredCustomerId: string, tx: any): Promise<void> {
    const referral = await tx.referral.findUnique({
      where: { referredId: referredCustomerId },
    });

    if (!referral || referral.status !== ReferralStatus.PENDING) return;

    const points = await this.getSetting(SETTING_REFERRAL_BONUS_POINTS, 500);

    // Flip atômico PENDING→COMPLETED: em corrida, só uma execução premia.
    const flipped = await tx.referral.updateMany({
      where: { id: referral.id, status: ReferralStatus.PENDING },
      data: {
        status: ReferralStatus.COMPLETED,
        pointsAwarded: points,
        completedAt: new Date(),
      },
    });
    if (flipped.count === 0) return;

    await this.pointsService.earnPoints(
      referral.referrerId,
      points,
      'Bônus de indicação — primeiro pedido do indicado',
      referral.id,
      tx,
    );

    this.logger.log(
      `Referral ${referral.id} completed: ${points} pts → referrer ${referral.referrerId}`,
    );

    // Gamificação best-effort — nunca quebra o fluxo de referral.
    this.gamification.checkAndGrant(referral.referrerId).catch((err) =>
      this.logger.error(`checkAndGrant falhou após referral: ${err?.message}`),
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // BIRTHDAY CRON
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Cron diário às 08:00: credita birthday_bonus_points a clientes com
   * assinatura ativa cujo aniversário é hoje.
   * Idempotência: verifica se já existe um lançamento EARN com referenceId
   * igual ao "birthday-<year>-<customerId>" no ledger.
   */
  @Cron('0 8 * * *')
  async handleBirthdayBonus(): Promise<void> {
    this.logger.log('Running birthday bonus cron...');
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const day   = now.getDate();
    const year  = now.getFullYear();

    // Clientes com assinatura ACTIVE e birthDate no mês+dia de hoje
    const customers = await this.prisma.customer.findMany({
      where: {
        birthDate: { not: null },
        subscription: { status: SubStatus.ACTIVE },
      },
      select: { id: true, birthDate: true },
    });

    // Ano não bissexto: aniversariantes de 29/02 são celebrados em 28/02.
    const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    const todayBirthdays = customers.filter((c) => {
      const d = c.birthDate!;
      const bMonth = d.getUTCMonth() + 1;
      const bDay = d.getUTCDate();
      if (bMonth === month && bDay === day) return true;
      return bMonth === 2 && bDay === 29 && month === 2 && day === 28 && !isLeap(year);
    });

    this.logger.log(`Found ${todayBirthdays.length} birthday customers.`);

    const points = await this.getSetting(SETTING_BIRTHDAY_BONUS_POINTS, 200);

    for (const { id: customerId } of todayBirthdays) {
      try {
        const idempotencyKey = `birthday-${year}-${customerId}`;

        // Verifica se já creditamos este ano
        const existing = await this.prisma.pointsLedger.findFirst({
          where: { customerId, referenceId: idempotencyKey },
        });
        if (existing) continue;

        await this.pointsService.earnPoints(
          customerId,
          points,
          'Bônus de aniversário 🎂',
          idempotencyKey,
        );
      } catch (err) {
        this.logger.error(`Birthday bonus failed for ${customerId}: ${err.message}`);
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // EVENT ATTENDANCE
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Marca presença em um evento e credita event_participation_points.
   * Só age na transição false→true (idempotente para chamadas repetidas).
   */
  async markAttendance(registrationId: string): Promise<{ attended: boolean; pointsAwarded: number | null }> {
    const reg = await this.prisma.eventRegistration.findUniqueOrThrow({
      where: { id: registrationId },
    });

    if (reg.attended) {
      return { attended: true, pointsAwarded: null }; // já marcado, idempotente
    }

    const points = await this.getSetting(SETTING_EVENT_PARTICIPATION_POINTS, 100);

    let awarded = false;
    await this.prisma.$transaction(async (tx) => {
      // Transição atômica false→true: em corrida (duplo clique), só uma credita.
      const flipped = await tx.eventRegistration.updateMany({
        where: { id: registrationId, attended: false },
        data: { attended: true, attendedAt: new Date() },
      });
      if (flipped.count === 0) return;

      await this.pointsService.earnPoints(
        reg.customerId,
        points,
        'Participação em evento',
        registrationId,
        tx,
      );
      awarded = true;
    });

    // Gamificação best-effort — nunca quebra o fluxo de presença.
    if (awarded) {
      this.gamification.checkAndGrant(reg.customerId).catch((err) =>
        this.logger.error(`checkAndGrant falhou após presença: ${err?.message}`),
      );
    }

    return { attended: true, pointsAwarded: awarded ? points : null };
  }
}
