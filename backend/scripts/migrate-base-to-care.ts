/**
 * ONDA 8 — Migração da base atual.
 *
 * Cria uma Subscription CARE (status ACTIVE) para todo Customer que ainda não
 * possui assinatura. Idempotente por construção: `Subscription.customerId` é
 * @unique, então usamos createMany({ skipDuplicates: true }) em lotes de 500.
 * Rodar de novo não cria duplicatas nem altera assinaturas existentes.
 *
 * Uso:
 *   npx ts-node scripts/migrate-base-to-care.ts            # aplica
 *   npx ts-node scripts/migrate-base-to-care.ts --dry-run  # só reporta contagens
 *   npm run migrate:base-to-care -- --dry-run
 */
import { PrismaClient, SubStatus, TierLevel } from '@prisma/client';

const prisma = new PrismaClient();
const BATCH_SIZE = 500;

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const startedAt = Date.now();

  console.log(`[migrate-base-to-care] iniciando ${dryRun ? '(DRY-RUN)' : '(APLICANDO)'}`);

  const totalCustomers = await prisma.customer.count();
  // Customers sem assinatura (relação 1-1 opcional Subscription).
  const missing = await prisma.customer.count({ where: { subscription: null } });

  console.log(`[migrate-base-to-care] clientes totais: ${totalCustomers}`);
  console.log(`[migrate-base-to-care] clientes SEM assinatura: ${missing}`);

  if (dryRun) {
    console.log(`[migrate-base-to-care] DRY-RUN: nenhuma alteração feita. ${missing} seriam criadas.`);
    return;
  }

  if (missing === 0) {
    console.log('[migrate-base-to-care] nada a fazer — todos os clientes já têm assinatura.');
    return;
  }

  let created = 0;
  let processed = 0;

  // Paginação por cursor para não carregar toda a base em memória.
  let cursorId: string | undefined = undefined;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const batch = await prisma.customer.findMany({
      where: { subscription: null },
      select: { id: true },
      take: BATCH_SIZE,
      ...(cursorId ? { skip: 1, cursor: { id: cursorId } } : {}),
      orderBy: { id: 'asc' },
    });

    if (batch.length === 0) break;

    const result = await prisma.subscription.createMany({
      data: batch.map((c) => ({
        customerId: c.id,
        tier: TierLevel.CARE,
        status: SubStatus.ACTIVE,
      })),
      skipDuplicates: true, // idempotência contra o @unique(customerId)
    });

    created += result.count;
    processed += batch.length;
    cursorId = batch[batch.length - 1].id;

    console.log(
      `[migrate-base-to-care] lote: processados=${batch.length} criados=${result.count} (acumulado criados=${created}/${processed})`,
    );

    if (batch.length < BATCH_SIZE) break;
  }

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(
    `[migrate-base-to-care] concluído: ${created} assinaturas CARE criadas em ${elapsed}s.`,
  );
}

main()
  .catch((err) => {
    console.error('[migrate-base-to-care] ERRO:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
