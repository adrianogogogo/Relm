import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { PaymentsService, PaymentActor } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

// Controlador da equipe Relm (admin/gerente). Registra pagamentos que já nascem
// CONFIRMED e confirma/cancela os pendentes registrados pelas lojas.
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN_RELM', 'GERENTE_RELM')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  private actor(req: any): PaymentActor {
    return { id: req.user.userId, type: 'USER' };
  }

  @Get('annual-fee')
  getAnnualFee() {
    return this.paymentsService
      .getAnnualFee()
      .then((amount) => ({ amount }));
  }

  @Post()
  register(@Body() dto: CreatePaymentDto, @Request() req: any) {
    return this.paymentsService.register(dto, this.actor(req));
  }

  @Get()
  findAll(
    @Query('status') status?: PaymentStatus,
    @Query('customerId') customerId?: string,
  ) {
    return this.paymentsService.findAll({ status, customerId });
  }

  @Patch(':id/confirm')
  confirm(@Param('id') id: string, @Request() req: any) {
    return this.paymentsService.confirm(id, this.actor(req));
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @Request() req: any) {
    return this.paymentsService.cancel(id, this.actor(req));
  }
}
