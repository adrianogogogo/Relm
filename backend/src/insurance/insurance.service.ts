import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Prisma, PolicyStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CustomersService } from '../customers/customers.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateInsurancePublicDto } from './dto/create-insurance-public.dto';
import { CronHealthService } from '../common/cron-health.service';
import * as crypto from 'crypto';

// Janelas (em dias) de aviso de vencimento da apólice. O cron dispara exatamente
// nos dias em que expiresAt - Nd cai hoje (idempotente por definição — cada
// janela ocorre uma única vez por apólice).
const EXPIRY_WARNING_DAYS = [30, 7];

// Cobertura padrão da apólice genérica "RELM Bike Protect" (bikes de alto
// desempenho). Usada quando a seguradora parceira ainda não definiu texto próprio.
export const GENERIC_COVERAGE =
  'RELM Bike Protect — Coberturas: roubo e furto qualificado; danos acidentais ' +
  '(queda, colisão, incêndio, raio, explosão, vandalismo); danos em transporte ' +
  'terrestre; acessórios fixos até 20% do valor da bike. Exclusões: furto simples, ' +
  'desgaste natural, mau uso, competições (salvo cobertura adicional), danos ' +
  'estéticos. Franquia: 10% da indenização. Vigência: 12 meses.';

@Injectable()
export class InsuranceService {
  private readonly logger = new Logger(InsuranceService.name);

  constructor(
    private prisma: PrismaService,
    private customersService: CustomersService,
    private notificationsService: NotificationsService,
    private cronHealth: CronHealthService,
  ) {}

  // Gera número de protocolo único e resistente a concorrência.
  //
  // DECISÃO (SEC-01/BUG-01/ORG-02): a estratégia anterior "último + 1" estava
  // duplicada em create() e createAdminQuote() e sofria de race condition
  // (protocolos duplicados em requests concorrentes, violando o @unique) e de
  // NaN no parseInt. Trocada por sufixo aleatório via crypto.randomBytes, com
  // ano dinâmico (não mais 2024 hardcoded). Lógica única extraída para este
  // método privado e reusada nos dois pontos de criação.
  private generateProtocolNumber(): string {
    const year = new Date().getFullYear();
    const suffix = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `SEG-${year}-${suffix}`;
  }

  // Número de apólice único (POL-<ano>-<hex>). Mesmo padrão anti-colisão do
  // protocolo de cotação.
  private generatePolicyNumber(): string {
    const year = new Date().getFullYear();
    const suffix = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `POL-${year}-${suffix}`;
  }

  /** Vigência padrão de 1 ano a partir de `from`. */
  private oneYearFrom(from: Date): Date {
    const to = new Date(from);
    to.setFullYear(to.getFullYear() + 1);
    return to;
  }

  async create(data: CreateInsurancePublicDto) {
    // Resolve/cria o cliente pelo email a partir dos dados públicos.
    // Não confiamos no body para customerId/status/quoteValue/protocolNumber.
    const customer = await this.customersService.upsertByEmail({
      email: data.email,
      fullName: data.fullName,
      phone: data.phone,
      city: data.city,
      state: data.state,
    });

    const protocolNumber = this.generateProtocolNumber();

    // Campos definidos explicitamente pelo servidor (sem spread do body).
    const quote = await this.prisma.insuranceQuote.create({
      data: {
        protocolNumber,
        customerId: customer.id,
        bikeValue: data.bikeValue,
        city: data.city,
        state: data.state,
        status: 'PENDING',
      },
    });

    // Notificação best-effort para a equipe Relm (nunca quebra a cotação).
    await this.notificationsService.notifyTeam({
      type: 'INSURANCE_NEW',
      title: 'Nova cotação de seguro',
      message: `Protocolo ${quote.protocolNumber} — ${customer.fullName}.`,
      link: `/admin/insurances`,
    });

    return quote;
  }

  async findAll(filters?: { storeId?: string; customerId?: string; status?: string }) {
    const where: any = {};

    if (filters?.status) where.status = filters.status;

    if (filters?.customerId) {
      where.customerId = filters.customerId;
    } else if (filters?.storeId) {
      where.customer = { storeId: filters.storeId };
    }

    return this.prisma.insuranceQuote.findMany({
      where,
      include: {
        customer: { select: { id: true, fullName: true, email: true, phone: true, cpf: true } },
        product: { select: { id: true, model: true, serialNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const quote = await this.prisma.insuranceQuote.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, fullName: true, email: true, phone: true, cpf: true } },
        product: { select: { id: true, model: true, serialNumber: true } },
      },
    });

    if (!quote) throw new NotFoundException('Cotação não encontrada');
    return quote;
  }

  async approve(id: string, data: { quoteValue: number; insuranceCompany: string }) {
    const quote = await this.prisma.insuranceQuote.findUnique({ where: { id } });
    if (!quote) throw new NotFoundException('Cotação não encontrada');

    return this.prisma.insuranceQuote.update({
      where: { id },
      data: {
        status: 'APPROVED',
        quoteValue: data.quoteValue,
        insuranceCompany: data.insuranceCompany,
      },
      include: {
        customer: { select: { id: true, fullName: true, email: true, phone: true, cpf: true } },
      },
    });
  }

  async reject(id: string) {
    const quote = await this.prisma.insuranceQuote.findUnique({ where: { id } });
    if (!quote) throw new NotFoundException('Cotação não encontrada');

    return this.prisma.insuranceQuote.update({
      where: { id },
      data: { status: 'REJECTED' },
      include: {
        customer: { select: { id: true, fullName: true, email: true, phone: true, cpf: true } },
      },
    });
  }

  /**
   * Converte a cotação em apólice: atualiza o status da cotação para CONVERTED e
   * cria a InsurancePolicy na MESMA transação. A seguradora vem da cotação
   * (insuranceCompany); o prêmio, do quoteValue quando presente. Vigência de 1
   * ano a partir de agora.
   */
  async convert(id: string) {
    const quote = await this.prisma.insuranceQuote.findUnique({ where: { id } });
    if (!quote) throw new NotFoundException('Cotação não encontrada');
    if (quote.status === 'CONVERTED') {
      throw new ConflictException('Cotação já foi convertida em apólice.');
    }

    const now = new Date();
    const policyNumber = this.generatePolicyNumber();

    const { quote: updatedQuote, policy } = await this.prisma.$transaction(async (tx) => {
      // updateMany com filtro de status torna a conversão atômica: em corrida,
      // apenas uma request flipa o status; a outra cai no ConflictException.
      const flipped = await tx.insuranceQuote.updateMany({
        where: { id, status: { not: 'CONVERTED' } },
        data: { status: 'CONVERTED' },
      });
      if (flipped.count === 0) {
        throw new ConflictException('Cotação já foi convertida em apólice.');
      }
      const updatedQuote = await tx.insuranceQuote.findUniqueOrThrow({
        where: { id },
        include: { customer: { select: { id: true, fullName: true, email: true } } },
      });

      const policy = await tx.insurancePolicy.create({
        data: {
          policyNumber,
          insurer: quote.insuranceCompany ?? 'A definir',
          coverage: GENERIC_COVERAGE,
          premium: quote.quoteValue ?? null,
          status: PolicyStatus.ACTIVE,
          startsAt: now,
          expiresAt: this.oneYearFrom(now),
          quoteId: quote.id,
          customerId: quote.customerId,
          productId: quote.productId ?? null,
        },
      });

      return { quote: updatedQuote, policy };
    });

    await this.notificationsService.notifyTeam({
      type: 'INSURANCE_POLICY_ISSUED',
      title: 'Apólice de seguro emitida',
      message: `Apólice ${policy.policyNumber} emitida para ${updatedQuote.customer.fullName}.`,
      link: '/admin/insurances',
    });

    return { ...updatedQuote, policy };
  }

  /**
   * Renova a cotação. DECISÃO (renew): mantém o comportamento existente da
   * cotação (volta a PENDING para nova negociação) e, se houver apólice
   * convertida, cria um NOVO período de apólice (nova linha) de 1 ano marcando a
   * apólice ativa anterior como EXPIRED — em vez de mutar expiresAt. Motivo:
   * preserva o histórico de vigências (auditoria) e cada linha representa um
   * período contratado, coerente com a numeração POL-* por emissão. É a opção
   * mínima que mantém a apólice como entidade de 1ª classe sem perder rastro.
   */
  async renew(id: string) {
    const quote = await this.prisma.insuranceQuote.findUnique({ where: { id } });
    if (!quote) throw new NotFoundException('Cotação não encontrada');

    const now = new Date();
    const policyNumber = this.generatePolicyNumber();

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedQuote = await tx.insuranceQuote.update({
        where: { id },
        data: { status: 'PENDING' },
        include: { customer: { select: { id: true, fullName: true, email: true } } },
      });

      // Encerra a(s) apólice(s) ativa(s) desta cotação.
      const previous = await tx.insurancePolicy.findFirst({
        where: { quoteId: quote.id, status: PolicyStatus.ACTIVE },
        orderBy: { expiresAt: 'desc' },
      });

      // Só cria novo período se a cotação já havia sido convertida em apólice.
      let policy = null;
      if (previous) {
        await tx.insurancePolicy.updateMany({
          where: { quoteId: quote.id, status: PolicyStatus.ACTIVE },
          data: { status: PolicyStatus.EXPIRED },
        });

        policy = await tx.insurancePolicy.create({
          data: {
            policyNumber,
            insurer: previous.insurer,
            coverage: previous.coverage,
            premium: previous.premium,
            status: PolicyStatus.ACTIVE,
            startsAt: now,
            expiresAt: this.oneYearFrom(now),
            quoteId: quote.id,
            customerId: quote.customerId,
            productId: previous.productId,
          },
        });
      }

      return { updatedQuote, policy };
    });

    return { ...result.updatedQuote, policy: result.policy };
  }

  async createAdminQuote(data: {
    customerId: string;
    productId?: string;
    bikeValue?: number;
    city?: string;
    state?: string;
  }) {
    const protocolNumber = this.generateProtocolNumber();

    return this.prisma.insuranceQuote.create({
      data: { ...data, protocolNumber, status: 'PENDING' },
      include: {
        customer: { select: { id: true, fullName: true, email: true } },
      },
    });
  }

  // ── Apólices (entidade de 1ª classe) ─────────────────────────────────────────

  /**
   * Cria uma apólice sem cotação (ex.: 1º ano incluído para quem compra bike e
   * ganha Plus). Vigência de 1 ano a partir de agora, salvo `startsAt` informado.
   */
  async createPolicyDirect(
    data: {
      customerId: string;
      insurer: string;
      coverage?: string;
      premium?: number;
      productId?: string;
      startsAt?: Date;
      policyNumber?: string;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx ?? this.prisma;
    const startsAt = data.startsAt ?? new Date();
    return db.insurancePolicy.create({
      data: {
        policyNumber: data.policyNumber ?? this.generatePolicyNumber(),
        insurer: data.insurer,
        coverage: data.coverage ?? null,
        premium: data.premium ?? null,
        status: PolicyStatus.ACTIVE,
        startsAt,
        expiresAt: this.oneYearFrom(startsAt),
        customerId: data.customerId,
        productId: data.productId ?? null,
      },
    });
  }

  async findAllPolicies(filters?: { status?: string; customerId?: string; page?: number; pageSize?: number }) {
    const where: Prisma.InsurancePolicyWhereInput = {};
    if (filters?.status) where.status = filters.status as PolicyStatus;
    if (filters?.customerId) where.customerId = filters.customerId;

    const pageSize = Math.min(filters?.pageSize ?? 100, 200);
    const page = Math.max(filters?.page ?? 1, 1);

    return this.prisma.insurancePolicy.findMany({
      where,
      take: pageSize,
      skip: (page - 1) * pageSize,
      include: {
        customer: { select: { id: true, fullName: true, email: true, phone: true, cpf: true } },
        product: { select: { id: true, model: true, serialNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOnePolicy(id: string) {
    const policy = await this.prisma.insurancePolicy.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, fullName: true, email: true, phone: true, cpf: true } },
        product: { select: { id: true, model: true, serialNumber: true } },
        quote: { select: { id: true, protocolNumber: true } },
      },
    });
    if (!policy) throw new NotFoundException('Apólice não encontrada');
    return policy;
  }

  /** Apólices do cliente logado (portal). */
  async findPoliciesForCustomer(customerId: string) {
    return this.prisma.insurancePolicy.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        policyNumber: true,
        insurer: true,
        coverage: true,
        premium: true,
        status: true,
        startsAt: true,
        expiresAt: true,
        createdAt: true,
        product: { select: { model: true, productType: true, serialNumber: true } },
      },
    });
  }

  async cancelPolicy(id: string) {
    const policy = await this.prisma.insurancePolicy.findUnique({ where: { id } });
    if (!policy) throw new NotFoundException('Apólice não encontrada');

    return this.prisma.insurancePolicy.update({
      where: { id },
      data: { status: PolicyStatus.CANCELLED },
    });
  }

  /**
   * Cron diário (03:00): expira apólices vencidas e envia avisos de vencimento a
   * 30 e 7 dias. O aviso é idempotente por construção — dispara apenas nos dias
   * em que `expiresAt - Nd` cai exatamente hoje.
   */
  @Cron('0 3 * * *')
  async handlePolicyExpiration() {
    return this.cronHealth.track('insurance-policy-expiration', () =>
      this._handlePolicyExpiration(),
    );
  }

  private async _handlePolicyExpiration() {
    this.logger.log('Running daily insurance policy expiration cron job...');
    const now = new Date();

    // 1) Marca ACTIVE vencidas como EXPIRED.
    const expired = await this.prisma.insurancePolicy.updateMany({
      where: { status: PolicyStatus.ACTIVE, expiresAt: { lt: now } },
      data: { status: PolicyStatus.EXPIRED },
    });
    if (expired.count > 0) {
      this.logger.log(`Expired ${expired.count} insurance policies.`);
    }

    // 2) Avisos de vencimento em janelas exatas (30/7 dias).
    for (const days of EXPIRY_WARNING_DAYS) {
      const [start, end] = this.dayWindow(now, days);
      const policies = await this.prisma.insurancePolicy.findMany({
        where: {
          status: PolicyStatus.ACTIVE,
          expiresAt: { gte: start, lt: end },
        },
        include: { customer: { select: { fullName: true } } },
      });

      for (const policy of policies) {
        await this.notificationsService.notifyTeam({
          type: 'INSURANCE_POLICY_EXPIRING',
          title: `Apólice vence em ${days} dias`,
          message: `Apólice ${policy.policyNumber} de ${policy.customer.fullName} vence em ${new Date(
            policy.expiresAt,
          ).toLocaleDateString('pt-BR')}.`,
          link: '/admin/insurances',
        });
      }
    }
  }

  /** Janela [start, end) do dia que cai exatamente `days` dias à frente de `now`. */
  private dayWindow(now: Date, days: number): [Date, Date] {
    // UTC para não perder/duplicar janelas por fuso local (America/Sao_Paulo) ou DST
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    start.setUTCDate(start.getUTCDate() + days);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    return [start, end];
  }
}
