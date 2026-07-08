/**
 * Contrato de gateway de pagamento. Hoje há uma única implementação
 * (`ManualGatewayService`) que apenas registra a cobrança fechada na loja ou
 * com a Relm. Um gateway real (Asaas/Mercado Pago/etc.) no futuro é uma nova
 * implementação desta mesma interface — nenhuma mudança em payments.service,
 * subscriptions ou frontend.
 */

export interface CreateChargeInput {
  paymentId: string;
  customerId: string;
  amount: number;
  description?: string;
}

export interface CreateChargeResult {
  // Id externo da cobrança no gateway. null no registro manual.
  gatewayId: string | null;
  // No manual a cobrança já nasce "pendente de confirmação" (sem link externo).
  checkoutUrl?: string | null;
}

export interface ConfirmPaymentResult {
  confirmed: boolean;
  paidAt: Date;
  gatewayId: string | null;
}

export interface PaymentGatewayService {
  createCharge(input: CreateChargeInput): Promise<CreateChargeResult>;
  confirmPayment(paymentId: string): Promise<ConfirmPaymentResult>;
}

/** Token de injeção — permite trocar a implementação sem tocar nos consumidores. */
export const PAYMENT_GATEWAY = 'PAYMENT_GATEWAY';
