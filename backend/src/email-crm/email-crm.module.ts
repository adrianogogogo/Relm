import { Module } from '@nestjs/common';
import { EmailCrmService } from './email-crm.service';
import { EmailCrmController } from './email-crm.controller';
import { PrismaModule } from '../prisma/prisma.module';

// Sem EmailModule: este módulo gera e exporta HTML, não envia.
@Module({
  imports: [PrismaModule],
  controllers: [EmailCrmController],
  providers: [EmailCrmService],
  exports: [EmailCrmService],
})
export class EmailCrmModule {}
