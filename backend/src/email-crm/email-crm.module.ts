import { Module } from '@nestjs/common';
import { EmailCrmService } from './email-crm.service';
import { EmailCrmController } from './email-crm.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [EmailCrmController],
  providers: [EmailCrmService],
  exports: [EmailCrmService],
})
export class EmailCrmModule {}
