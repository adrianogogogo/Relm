import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from './prisma/prisma.service';
import { CronHealthService } from './common/cron-health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private cronHealth: CronHealthService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Health check' })
  async check() {
    // B-02 — Endpoint público: não vaza uptime, detalhes de conexão nem
    // mensagens de erro do banco. Apenas status ok/error.
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok' };
    } catch {
      throw new ServiceUnavailableException({ status: 'error' });
    }
  }

  @Get('crons')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Observabilidade dos cron jobs (última execução/status)' })
  crons() {
    // Leitura pública: expõe apenas nome do job, timestamps e mensagem de erro
    // (sem stack, sem dados de cliente). Útil para alertas externos/uptime.
    const jobs = this.cronHealth.snapshot();
    return {
      status: jobs.every((j) => !j.lastError) ? 'ok' : 'degraded',
      jobs,
    };
  }
}
