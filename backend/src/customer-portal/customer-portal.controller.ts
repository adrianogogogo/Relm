import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  UseGuards,
  Request,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CustomerPortalService } from './customer-portal.service';
import { CustomerJwtGuard } from '../customer-auth/customer-jwt.guard';
import { EngagementService } from '../engagement/engagement.service';
import { UpdateCustomerProfileDto } from './dto/update-profile.dto';
import { UpdateCustomerPasswordDto } from './dto/update-password.dto';

@ApiTags('customer-portal')
@Controller('customer-portal')
@UseGuards(CustomerJwtGuard)
@ApiBearerAuth()
export class CustomerPortalController {
  constructor(
    private customerPortalService: CustomerPortalService,
    private engagementService: EngagementService,
  ) {}

  @Get('me')
  getProfile(@Request() req: any) {
    return this.customerPortalService.getProfile(req.user.customerId);
  }

  @Put('profile')
  updateProfile(@Request() req: any, @Body() dto: UpdateCustomerProfileDto) {
    return this.customerPortalService.updateProfile(req.user.customerId, dto);
  }

  @Put('password')
  updatePassword(@Request() req: any, @Body() dto: UpdateCustomerPasswordDto) {
    return this.customerPortalService.updatePassword(req.user.customerId, dto);
  }

  @Get('warranties')
  getWarranties(@Request() req: any) {
    return this.customerPortalService.getWarranties(req.user.customerId);
  }

  @Get('purchases')
  getPurchases(@Request() req: any) {
    return this.customerPortalService.getPurchases(req.user.customerId);
  }

  @Get('insurance-quotes')
  getInsuranceQuotes(@Request() req: any) {
    return this.customerPortalService.getInsuranceQuotes(req.user.customerId);
  }

  @Get('events')
  getEvents(@Request() req: any) {
    return this.customerPortalService.getEvents(req.user.customerId);
  }

  @Post('events/:id/register')
  @HttpCode(HttpStatus.CREATED)
  registerEvent(@Request() req: any, @Param('id') eventId: string) {
    return this.customerPortalService.registerEvent(req.user.customerId, eventId);
  }

  @Get('benefits')
  getBenefits() {
    return this.customerPortalService.getBenefits();
  }

  /** Retorna o código de indicação do cliente (lazy) + lista de referrals enviados. */
  @Get('referral')
  async getReferral(@Request() req: any) {
    const customerId = req.user.customerId;
    const [code, referrals] = await Promise.all([
      this.engagementService.getOrCreateReferralCode(customerId),
      this.engagementService.getReferrals(customerId),
    ]);
    return {
      referralCode: code,
      referrals,
      completedCount: referrals.filter((r) => r.status === 'COMPLETED').length,
    };
  }
}
