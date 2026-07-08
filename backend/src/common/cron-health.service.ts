import { Injectable } from '@nestjs/common';

/**
 * Estado observável (em memória) de cada cron job do sistema.
 * Reiniciado a cada boot do processo — não persiste em banco. Serve para o
 * endpoint GET /health/crons expor a última execução/status de cada job.
 */
export interface CronJobHealth {
  jobName: string;
  lastRunAt: string | null; // ISO 8601
  lastSuccessAt: string | null;
  lastError: string | null; // mensagem da última falha (sem stack/dado sensível)
  runCount: number;
  errorCount: number;
}

@Injectable()
export class CronHealthService {
  private readonly jobs = new Map<string, CronJobHealth>();

  private ensure(jobName: string): CronJobHealth {
    let job = this.jobs.get(jobName);
    if (!job) {
      job = {
        jobName,
        lastRunAt: null,
        lastSuccessAt: null,
        lastError: null,
        runCount: 0,
        errorCount: 0,
      };
      this.jobs.set(jobName, job);
    }
    return job;
  }

  /** Marca o início de uma execução do cron. */
  markStart(jobName: string): void {
    const job = this.ensure(jobName);
    job.lastRunAt = new Date().toISOString();
    job.runCount += 1;
  }

  /** Marca sucesso da última execução. */
  markSuccess(jobName: string): void {
    const job = this.ensure(jobName);
    job.lastSuccessAt = new Date().toISOString();
    job.lastError = null;
  }

  /** Marca falha da última execução (mensagem apenas, sem stack). */
  markError(jobName: string, error: unknown): void {
    const job = this.ensure(jobName);
    job.errorCount += 1;
    job.lastError =
      error instanceof Error ? error.message : String(error ?? 'unknown error');
  }

  /**
   * Wrapper conveniente: mede uma execução de cron reportando start/success/error.
   * Re-lança o erro para não alterar o comportamento do @nestjs/schedule.
   */
  async track<T>(jobName: string, fn: () => Promise<T>): Promise<T> {
    this.markStart(jobName);
    try {
      const result = await fn();
      this.markSuccess(jobName);
      return result;
    } catch (err) {
      this.markError(jobName, err);
      throw err;
    }
  }

  /** Snapshot de todos os jobs conhecidos, para o endpoint de health. */
  snapshot(): CronJobHealth[] {
    return Array.from(this.jobs.values()).map((j) => ({ ...j }));
  }
}
