import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CustomerPortalService } from './customer-portal.service';
import { CustomerJwtGuard } from '../customer-auth/customer-jwt.guard';

@ApiTags('customer-portal')
@Controller('customer-portal')
@UseGuards(CustomerJwtGuard)
@ApiBearerAuth()
export class CustomerPortalController {
  constructor(private customerPortalService: CustomerPortalService) {}

  @Get('me')
  getProfile(@Request() req: any) {
    return this.customerPortalService.getProfile(req.user.customerId);
  }

  @Get('warranties')
  getWarranties(@Request() req: any) {
    return this.customerPortalService.getWarranties(req.user.customerId);
  }

  @Get('insurance-quotes')
  getInsuranceQuotes(@Request() req: any) {
    return this.customerPortalService.getInsuranceQuotes(req.user.customerId);
  }

  @Get('events')
  getEvents(@Request() req: any) {
    return this.customerPortalService.getEvents(req.user.customerId);
  }

  @Get('benefits')
  getBenefits() {
    return this.customerPortalService.getBenefits();
  }
}
