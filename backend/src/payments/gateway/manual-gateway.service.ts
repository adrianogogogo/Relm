import { Injectable } from '@nestjs/common';
import {
  ConfirmPaymentResult,
  CreateChargeInput,
  CreateChargeResult,
  PaymentGatewayService,
} from './payment-gateway.interface';

/**
 * Implementação de registro manual: a cobrança é fechada presencialmente na
 * loja ou direto com a Relm. Não há integração externa — `createCharge` apenas
 * marca a cobrança como criada localmente e `confirmPayment` registra o instante
 * da confirmação humana. Sem gatewayId (é nulo).
 */
@Injectable()
export class ManualGatewayService implements PaymentGatewayService {
  async createCharge(_input: CreateChargeInput): Promise<CreateChargeResult> {
    return { gatewayId: null, checkoutUrl: null };
  }

  async confirmPayment(_paymentId: string): Promise<ConfirmPaymentResult> {
    return { confirmed: true, paidAt: new Date(), gatewayId: null };
  }
}
