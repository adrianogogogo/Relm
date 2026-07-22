import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService, PaymentActor } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { StorePaymentsGuard } from './store-payments.guard';

// Controlador do portal da loja. Registra pagamentos que nascem PENDING
// (aguardando confirmação da Relm) e lista os pagamentos da própria loja.
@Controller('store/payments')
@UseGuards(StorePaymentsGuard)
export class StorePaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  private actor(req: any): PaymentActor {
    return {
      id: req.user.storeUserId,
      type: 'STORE_USER',
      storeId: req.user.storeId,
    };
  }

  @Get('annual-fee')
  getAnnualFee() {
    return this.paymentsService.getAnnualFee().then((amount) => ({ amount }));
  }

  @Post()
  register(@Body() dto: CreatePaymentDto, @Request() req: any) {
    // A loja não escolhe o método — é sempre MANUAL_LOJA (definido no service).
    return this.paymentsService.register(dto, this.actor(req));
  }

  @Get()
  findMine(@Request() req: any) {
    return this.paymentsService.findForStore(req.user.storeId);
  }
}
