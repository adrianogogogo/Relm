import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Iniciando a limpeza dos dados do banco de dados...');

  try {
    // 1. Limpar tabelas relacionadas a garantias
    console.log('- Removendo eventos de garantia...');
    await prisma.warrantyEvent.deleteMany({});

    console.log('- Removendo tarefas de garantia...');
    await prisma.warrantyTask.deleteMany({});

    console.log('- Removendo anexos de garantia...');
    await prisma.warrantyAttachment.deleteMany({});

    console.log('- Removendo chamados de garantia...');
    await prisma.warrantyClaim.deleteMany({});

    // 2. Limpar tabelas de benefícios e outros módulos vinculados a clientes
    console.log('- Removendo resgates de benefícios...');
    await prisma.benefitRedemption.deleteMany({});

    console.log('- Removendo assinaturas de benefícios...');
    await prisma.benefitMembership.deleteMany({});

    console.log('- Removendo inscrições em eventos...');
    await prisma.eventRegistration.deleteMany({});

    console.log('- Removendo cotações de seguros...');
    await prisma.insuranceQuote.deleteMany({});

    console.log('- Removendo inscrições de newsletter...');
    await prisma.newsletterSubscription.deleteMany({});

    console.log('- Removendo consentimentos de privacidade...');
    await prisma.privacyConsent.deleteMany({});

    // 3. Limpar Clientes
    console.log('- Removendo clientes...');
    await prisma.customer.deleteMany({});

    // 4. Limpar Lojistas (StoreUser) e desvincular Lojas de usuários da equipe
    console.log('- Removendo usuários de lojas (StoreUser)...');
    await prisma.storeUser.deleteMany({});

    console.log('- Removendo usuários com role LOJA da tabela User...');
    await prisma.user.deleteMany({
      where: { role: 'LOJA' }
    });

    console.log('- Desvinculando lojas restantes da tabela User...');
    await prisma.user.updateMany({
      data: { storeId: null }
    });

    // 5. Limpar Produtos
    console.log('- Removendo produtos...');
    await prisma.product.deleteMany({});

    // 6. Limpar Lojas
    console.log('- Removendo lojas...');
    await prisma.store.deleteMany({});

    console.log('✨ Limpeza concluída com sucesso no banco de dados local!');
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
