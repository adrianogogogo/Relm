import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PaymentMethod, PaymentStatus, Prisma, SubStatus, TierLevel } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { NotificationsService } from '../notifications/notifications.service';
import { GamificationService } from '../gamification/gamification.service';
import {
  PAYMENT_GATEWAY,
  PaymentGatewayService,
} from './gateway/payment-gateway.interface';

// Chaves calibráveis em ClubSettings (seed em prisma/seed.ts).
export const SETTING_PLUS_ANNUAL_FEE = 'plus_annual_fee';
export const SETTING_POINT_VALUE_BRL = 'point_value_brl';

// Ator que registra/confirma um pagamento (equipe Relm ou lojista).
export interface PaymentActor {
  id: string;
  type: 'USER' | 'STORE_USER';
  storeId?: string; // presente quando type === STORE_USER
}

export interface RegisterPaymentInput {
  customerId: string;
  amount?: number;
  method?: 'MANUAL_LOJA' | 'MANUAL_RELM';
  notes?: string;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly notifications: NotificationsService,
    private readonly gamification: GamificationService,
    @Inject(PAYMENT_GATEWAY)
    private readonly gateway: PaymentGatewayService,
  ) {}

  /** Valor da anuidade Plus vindo de ClubSettings (fallback 0 se ausente). */
  async getAnnualFee(): Promise<number> {
    const setting = await this.prisma.clubSettings.findUnique({
      where: { key: SETTING_PLUS_ANNUAL_FEE },
    });
    return setting ? Number(setting.value) : 0;
  }

  /**
   * Registra um pagamento da anuidade.
   * - STORE_USER: valor sempre vindo de ClubSettings (anti-tampering); cliente
   *   deve pertencer à mesma loja (anti-IDOR). Nasce PENDING.
   * - USER (equipe Relm): valor customizado permitido (>0) mas desvio é auditado.
   *   Todo o fluxo create+confirm+renew ocorre em UMA transação.
   */
  async register(input: RegisterPaymentInput, actor: PaymentActor) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: input.customerId },
      include: { subscription: true },
    });
    if (!customer) {
      throw new NotFoundException('Cliente não encontrado');
    }

    // [FINDING 2] Cross-store IDOR: loja só pode registrar para seus próprios clientes.
    if (actor.type === 'STORE_USER') {
      if (customer.storeId !== actor.storeId) {
        throw new ForbiddenException('Cliente não pertence a esta loja');
      }
    }

    // [FINDING 1] Valor da anuidade: loja sempre usa ClubSettings; Relm pode
    // customizar mas o valor deve ser > 0.
    const configuredFee = await this.getAnnualFee();
    let amount: number;
    let amountDeviation: number | undefined;

    if (actor.type === 'STORE_USER') {
      // Ignora completamente o valor enviado pelo lojista.
      amount = configuredFee;
    } else {
      // USER (equipe Relm): aceita custom mas registra desvio no audit.
      amount = input.amount ?? configuredFee;
      if (amount !== configuredFee) {
        amountDeviation = amount - configuredFee;
      }
    }

    // [FINDING 1] Rejeita explicitamente amount <= 0 (não confia em falsy 0).
    if (amount <= 0) {
      throw new BadRequestException(
        'Valor da anuidade não informado e não configurado em ClubSettings (plus_annual_fee)',
      );
    }

    const method: PaymentMethod =
      actor.type === 'STORE_USER'
        ? PaymentMethod.MANUAL_LOJA
        : (input.method as PaymentMethod) ?? PaymentMethod.MANUAL_RELM;

    if (actor.type === 'USER') {
      // [FINDING 4] USER: create+confirm+renew em UMA transação — sem janela de PENDING órfão.
      return this._registerAndConfirmAtomic(customer, amount, method, actor, amountDeviation, input.notes);
    }

    // STORE_USER: nasce PENDING (confirmação pela Relm em dois passos).
    // [FINDING 6] Fallback subscription.create dentro da mesma transação.
    const result = await this.prisma.$transaction(async (tx) => {
      const subscription =
        customer.subscription ??
        (await tx.subscription.create({
          data: {
            customerId: customer.id,
            tier: TierLevel.CARE,
            status: SubStatus.ACTIVE,
          },
        }));

      const payment = await tx.payment.create({
        data: {
          subscriptionId: subscription.id,
          customerId: customer.id,
          // [FINDING 5] Decimal precision.
          amount: new Prisma.Decimal(amount.toString()),
          method,
          status: PaymentStatus.PENDING,
          registeredById: actor.id,
          registeredByType: actor.type,
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
        },
      });

      await tx.auditLog.create({
        data: {
          userId: null,
          action: 'CREATE',
          entity: 'payments',
          entityId: payment.id,
          metadata: {
            reason: 'Registro de pagamento da anuidade (loja)',
            method,
            amount,
            configuredFee,
            registeredByType: actor.type,
            registeredById: actor.id,
          },
        },
      });

      return { payment, subscription };
    });

    // Cria a cobrança no gateway (no manual é no-op, gatewayId nulo).
    const charge = await this.gateway.createCharge({
      paymentId: result.payment.id,
      customerId: customer.id,
      amount,
    });
    if (charge.gatewayId) {
      await this.prisma.payment.update({
        where: { id: result.payment.id },
        data: { gatewayId: charge.gatewayId },
      });
    }

    // Avisa a equipe Relm que há confirmação pendente.
    await this.notifications.notifyTeam({
      type: 'PAYMENT_PENDING',
      title: 'Pagamento de anuidade aguardando confirmação',
      message: `A loja registrou um pagamento de anuidade para ${customer.fullName}. Confirme para renovar a assinatura.`,
      link: '/admin/pagamentos',
    });

    return this.prisma.payment.findUnique({ where: { id: result.payment.id } });
  }

  /**
   * [FINDING 4] Cria, confirma e renova em UMA única transação para atores USER
   * (equipe Relm), eliminando a janela de PENDING órfão.
   */
  private async _registerAndConfirmAtomic(
    customer: any,
    amount: number,
    method: PaymentMethod,
    actor: PaymentActor,
    amountDeviation?: number,
    notes?: string,
  ) {
    const configuredFee = await this.getAnnualFee();
    const gatewayResult = { confirmed: true, paidAt: new Date(), gatewayId: null as string | null };

    const result = await this.prisma.$transaction(async (tx) => {
      const subscription =
        customer.subscription ??
        (await tx.subscription.create({
          data: {
            customerId: customer.id,
            tier: TierLevel.CARE,
            status: SubStatus.ACTIVE,
          },
        }));

      const payment = await tx.payment.create({
        data: {
          subscriptionId: subscription.id,
          customerId: customer.id,
          amount: new Prisma.Decimal(amount.toString()),
          method,
          status: PaymentStatus.CONFIRMED,
          registeredById: actor.id,
          registeredByType: actor.type,
          paidAt: gatewayResult.paidAt,
          ...(notes !== undefined ? { notes } : {}),
        },
      });

      await tx.auditLog.create({
        data: {
          userId: actor.id,
          action: 'CREATE',
          entity: 'payments',
          entityId: payment.id,
          metadata: {
            reason: 'Registro de pagamento da anuidade (Relm)',
            method,
            amount,
            configuredFee,
            ...(amountDeviation !== undefined ? { amountDeviation } : {}),
            registeredByType: actor.type,
            registeredById: actor.id,
          },
        },
      });

      // [FINDING 9] Passa actor para renewFromPayment.
      const { subscription: renewedSub, isRenewal } =
        await this.subscriptionsService.renewFromPayment(customer.id, tx, actor);

      await tx.auditLog.create({
        data: {
          userId: actor.id,
          action: 'UPDATE_SENSITIVE',
          entity: 'payments',
          entityId: payment.id,
          metadata: {
            reason: 'Confirmação imediata (registro pela Relm)',
            subscriptionId: renewedSub.id,
            isRenewal,
            confirmedByType: actor.type,
            confirmedById: actor.id,
          },
        },
      });

      return { payment, subscription: renewedSub };
    });

    this.logger.log(
      `Pagamento ${result.payment.id} criado e confirmado atomicamente; assinatura ${result.subscription.id} renovada.`,
    );

    // Gamificação best-effort — nunca quebra o fluxo de pagamento.
    this.gamification.checkAndGrant(customer.id).catch((err) =>
      this.logger.error(`checkAndGrant falhou após pagamento atômico: ${err?.message}`),
    );

    return result.payment;
  }

  /**
   * Confirma um pagamento PENDING → renova a assinatura por 1 ano, credita bônus
   * (via subscriptions) e notifica o cliente/loja.
   */
  async confirm(paymentId: string, actor: PaymentActor) {
    // Early check para erro amigável (sem atomicidade).
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) throw new NotFoundException('Pagamento não encontrado');
    if (payment.status === PaymentStatus.CONFIRMED) {
      throw new ConflictException('Pagamento já confirmado ou cancelado');
    }
    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException(
        'Somente pagamentos pendentes podem ser confirmados',
      );
    }

    const gatewayResult = await this.gateway.confirmPayment(payment.id);
    if (!gatewayResult.confirmed) {
      throw new BadRequestException('Gateway não confirmou o pagamento');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // [FINDING 3] updateMany com WHERE id+status PENDING para atomicidade (anti double-confirm).
      const updateResult = await tx.payment.updateMany({
        where: { id: payment.id, status: PaymentStatus.PENDING },
        data: {
          status: PaymentStatus.CONFIRMED,
          paidAt: gatewayResult.paidAt,
          gatewayId: gatewayResult.gatewayId ?? payment.gatewayId,
        },
      });

      if (updateResult.count === 0) {
        throw new ConflictException('Pagamento já confirmado ou cancelado');
      }

      const updated = await tx.payment.findUnique({ where: { id: payment.id } });

      // [FINDING 9] Passa actor para renewFromPayment.
      const { subscription, isRenewal } =
        await this.subscriptionsService.renewFromPayment(payment.customerId, tx, actor);

      await tx.auditLog.create({
        data: {
          userId: actor.type === 'USER' ? actor.id : null,
          action: 'UPDATE_SENSITIVE',
          entity: 'payments',
          entityId: payment.id,
          metadata: {
            reason: 'Confirmação de pagamento da anuidade',
            subscriptionId: subscription.id,
            isRenewal,
            confirmedByType: actor.type,
            confirmedById: actor.id,
          },
        },
      });

      return { updated, subscription };
    });

    // Notifica o cliente (best-effort — nunca quebra o fluxo).
    const customer = await this.prisma.customer.findUnique({
      where: { id: payment.customerId },
      select: { storeId: true, fullName: true },
    });
    if (customer?.storeId) {
      await this.notifications.notifyStore(customer.storeId, {
        type: 'PAYMENT_CONFIRMED',
        title: 'Pagamento de anuidade confirmado',
        message: `A anuidade de ${customer.fullName} foi confirmada e a assinatura Care Plus foi renovada por 1 ano.`,
      });
    }

    this.logger.log(
      `Pagamento ${payment.id} confirmado; assinatura ${result.subscription.id} renovada.`,
    );

    // Gamificação best-effort — nunca quebra o fluxo de confirmação.
    this.gamification.checkAndGrant(payment.customerId).catch((err) =>
      this.logger.error(`checkAndGrant falhou após confirmação de pagamento: ${err?.message}`),
    );

    return result.updated;
  }

  /** Cancela um pagamento (não confirmado). */
  async cancel(paymentId: string, actor: PaymentActor) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) throw new NotFoundException('Pagamento não encontrado');
    if (payment.status === PaymentStatus.CONFIRMED) {
      throw new BadRequestException(
        'Pagamento já confirmado não pode ser cancelado',
      );
    }
    if (payment.status === PaymentStatus.CANCELLED) return payment;

    const updated = await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.CANCELLED },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: actor.type === 'USER' ? actor.id : null,
        action: 'UPDATE_SENSITIVE',
        entity: 'payments',
        entityId: payment.id,
        metadata: {
          reason: 'Cancelamento de pagamento da anuidade',
          cancelledByType: actor.type,
          cancelledById: actor.id,
        },
      },
    });
    return updated;
  }

  /** Lista admin com filtros. */
  async findAll(filters: { status?: PaymentStatus; customerId?: string }) {
    return this.prisma.payment.findMany({
      where: {
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.customerId ? { customerId: filters.customerId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, fullName: true, email: true } },
      },
    });
  }

  /** Pagamentos registrados por uma loja específica. */
  async findForStore(storeId: string) {
    return this.prisma.payment.findMany({
      where: { registeredByType: 'STORE_USER', customer: { storeId } },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, fullName: true, email: true } },
      },
    });
  }

  /** Histórico do cliente logado (portal). */
  async findForCustomer(customerId: string) {
    return this.prisma.payment.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        amount: true,
        method: true,
        status: true,
        paidAt: true,
        createdAt: true,
      },
    });
  }
}
