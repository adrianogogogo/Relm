import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  // DEAD-03 — No Prisma 5 o evento 'beforeExit' do engine não é mais
  // emitido para SIGINT/SIGTERM. Em vez de um enableShutdownHooks manual
  // baseado em $on('beforeExit'), confiamos no lifecycle do Nest: o
  // app.enableShutdownHooks() em main.ts dispara onModuleDestroy, que
  // desconecta o cliente Prisma de forma limpa.
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
