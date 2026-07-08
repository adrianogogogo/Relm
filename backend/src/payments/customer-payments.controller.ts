import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CustomerJwtGuard } from '../customer-auth/customer-jwt.guard';

// Portal do cliente: histórico de pagamentos da própria anuidade.
@Controller('payments')
@UseGuards(CustomerJwtGuard)
export class CustomerPaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('my')
  findMine(@Request() req: any) {
    return this.paymentsService.findForCustomer(req.user.customerId);
  }
}
