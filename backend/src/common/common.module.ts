import { Global, Module } from '@nestjs/common';
import { CronHealthService } from './cron-health.service';

/**
 * Módulo global de utilidades transversais. Exporta o CronHealthService para
 * que os serviços com @Cron reportem observabilidade sem acoplar módulos.
 */
@Global()
@Module({
  providers: [CronHealthService],
  exports: [CronHealthService],
})
export class CommonModule {}
