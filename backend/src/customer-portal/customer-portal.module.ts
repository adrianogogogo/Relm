import { Module } from '@nestjs/common';
import { CustomerPortalController } from './customer-portal.controller';
import { CustomerPortalService } from './customer-portal.service';
import { CustomerAuthModule } from '../customer-auth/customer-auth.module';
import { EngagementModule } from '../engagement/engagement.module';

@Module({
  imports: [CustomerAuthModule, EngagementModule],
  controllers: [CustomerPortalController],
  providers: [CustomerPortalService],
})
export class CustomerPortalModule {}
