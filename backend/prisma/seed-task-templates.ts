/**
 * Seed: Templates de tarefas automáticas por transição de status (Onda 7).
 *
 * Uso:  npx ts-node prisma/seed-task-templates.ts
 *
 * Cada template define uma tarefa que será criada automaticamente quando
 * a garantia transicionar para o status `toStatus`.
 */
import { PrismaClient, WarrantyStatus, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

interface TemplateInput {
  toStatus: WarrantyStatus;
  title: string;
  description: string;
  targetRole: UserRole;
  sortOrder: number;
}

const TEMPLATES: TemplateInput[] = [
  // → EM_ANALISE
  {
    toStatus: 'EM_ANALISE',
    title: 'Verificar nota fiscal e dados do produto',
    description: 'Conferir se a nota fiscal é válida, se o produto está no prazo de garantia e se os dados do cliente estão corretos.',
    targetRole: 'SUPORTE_RELM',
    sortOrder: 1,
  },
  {
    toStatus: 'EM_ANALISE',
    title: 'Analisar defeito relatado e fotos',
    description: 'Avaliar as fotos e a descrição do defeito informado pelo cliente. Verificar se o defeito é coberto pela garantia.',
    targetRole: 'GERENTE_RELM',
    sortOrder: 2,
  },
  {
    toStatus: 'EM_ANALISE',
    title: 'Definir custo estimado da garantia',
    description: 'Estimar o custo da peça de reposição e frete para a empresa. Registrar no campo de custo do ticket.',
    targetRole: 'GERENTE_RELM',
    sortOrder: 3,
  },

  // → AGUARDANDO_CLIENTE
  {
    toStatus: 'AGUARDANDO_CLIENTE',
    title: 'Acompanhar resposta do cliente',
    description: 'Monitorar se o cliente respondeu via plataforma, WhatsApp ou e-mail. Retornar para análise quando obtiver resposta.',
    targetRole: 'SUPORTE_RELM',
    sortOrder: 1,
  },

  // → APROVADO
  {
    toStatus: 'APROVADO',
    title: 'Solicitar peça ao fornecedor',
    description: 'Entrar em contato com o fornecedor para solicitar a peça de reposição conforme análise técnica.',
    targetRole: 'GERENTE_RELM',
    sortOrder: 1,
  },
  {
    toStatus: 'APROVADO',
    title: 'Organizar envio da peça ao cliente',
    description: 'Definir a transportadora, embalagem e endereço de destino para o envio da peça de reposição.',
    targetRole: 'SUPORTE_RELM',
    sortOrder: 2,
  },
  {
    toStatus: 'APROVADO',
    title: 'Registrar código de rastreio',
    description: 'Após despacho, registrar o código de rastreio e informar ao cliente.',
    targetRole: 'SUPORTE_RELM',
    sortOrder: 3,
  },

  // → REPROVADO
  {
    toStatus: 'REPROVADO',
    title: 'Enviar comunicado de rejeição ao cliente',
    description: 'Comunicar ao cliente o motivo da rejeição por e-mail ou telefone e esclarecer dúvidas.',
    targetRole: 'SUPORTE_RELM',
    sortOrder: 1,
  },

  // → FINALIZADO
  {
    toStatus: 'FINALIZADO',
    title: 'Confirmar recebimento com o cliente',
    description: 'Entrar em contato com o cliente para confirmar que a peça foi recebida e que o problema foi resolvido.',
    targetRole: 'SUPORTE_RELM',
    sortOrder: 1,
  },
  {
    toStatus: 'FINALIZADO',
    title: 'Atualizar relatório financeiro',
    description: 'Registrar os custos finais da garantia no relatório financeiro mensal.',
    targetRole: 'ADMIN_RELM',
    sortOrder: 2,
  },
];

async function main() {
  console.log('🔧 Inserindo templates de tarefas automáticas...');

  for (const tpl of TEMPLATES) {
    // Upsert por (toStatus + title) para ser idempotente
    const existing = await prisma.warrantyTaskTemplate.findFirst({
      where: { toStatus: tpl.toStatus, title: tpl.title },
    });

    if (existing) {
      console.log(`  ⏩ Já existe: [${tpl.toStatus}] "${tpl.title}"`);
      continue;
    }

    await prisma.warrantyTaskTemplate.create({ data: tpl });
    console.log(`  ✅ Criado: [${tpl.toStatus}] "${tpl.title}" → ${tpl.targetRole}`);
  }

  console.log(`\n✅ ${TEMPLATES.length} templates processados.`);
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
