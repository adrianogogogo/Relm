import { PrismaClient, UserRole, WarrantyStatus, LinkStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...\n');

  // ============================================
  // 1. Privacy Policy
  // ============================================
  console.log('📄 Criando Política de Privacidade...');
  const privacyPolicy = await prisma.privacyPolicyVersion.upsert({
    where: { version: '1.0.0' },
    update: {},
    create: {
      version: '1.0.0',
      content: `# Política de Privacidade Relm Care+

Esta é a Política de Privacidade da Relm Bikes em conformidade com a LGPD (Lei 13.709/2018).

## 1. Dados Coletados
Coletamos apenas os dados necessários para prestação dos serviços.

## 2. Finalidade
Os dados são utilizados para gestão de garantias, clube de vantagens e comunicações.

## 3. Compartilhamento
Não compartilhamos seus dados com terceiros sem consentimento.

## 4. Direitos do Titular
Você pode solicitar acesso, correção ou exclusão dos seus dados.

## 5. Contato
dpo@relmbikes.com.br`,
      active: true,
    },
  });
  console.log(`✅ Política ${privacyPolicy.version} criada\n`);

  // ============================================
  // 2. Distributors
  // ============================================
  console.log('🏢 Criando Distribuidores...');
  const distributor1 = await prisma.distributor.upsert({
    where: { cnpj: '12345678000190' },
    update: {},
    create: {
      tradeName: 'Distribuidor Sul',
      legalName: 'Distribuidor Sul Bikes LTDA',
      cnpj: '12345678000190',
      active: true,
    },
  });
  console.log(`✅ ${distributor1.tradeName} criado\n`);

  // ============================================
  // 3. Stores
  // ============================================
  console.log('🏪 Criando Lojas...');
  
  const store1 = await prisma.store.upsert({
    where: { cnpj: '98765432000199' },
    update: {},
    create: {
      tradeName: 'Bike Shop São Paulo',
      legalName: 'Bike Shop SP Comercio LTDA',
      cnpj: '98765432000199',
      aliases: ['Bike Shop SP', 'Bikeshop São Paulo', 'Bike Shop Paulista'],
      email: 'contato@bikeshopsp.com.br',
      phone: '11987654321',
      address: 'Av. Paulista, 1000',
      city: 'São Paulo',
      state: 'SP',
      active: true,
    },
  });

  const store2 = await prisma.store.upsert({
    where: { cnpj: '11223344000188' },
    update: {},
    create: {
      tradeName: 'Ciclismo Rio',
      legalName: 'Ciclismo Rio de Janeiro EIRELI',
      cnpj: '11223344000188',
      aliases: ['Ciclismo RJ', 'Ciclismo Rio de Janeiro'],
      email: 'contato@ciclismorj.com.br',
      phone: '21987654321',
      address: 'Rua das Laranjeiras, 500',
      city: 'Rio de Janeiro',
      state: 'RJ',
      active: true,
    },
  });

  const store3 = await prisma.store.upsert({
    where: { cnpj: '55667788000177' },
    update: {},
    create: {
      tradeName: 'Pedal Forte Curitiba',
      legalName: 'Pedal Forte Curitiba Bikes LTDA',
      cnpj: '55667788000177',
      aliases: ['Pedal Forte', 'Pedal Forte CWB'],
      email: 'contato@pedalforte.com.br',
      phone: '41987654321',
      address: 'Rua XV de Novembro, 300',
      city: 'Curitiba',
      state: 'PR',
      active: true,
    },
  });

  console.log(`✅ ${store1.tradeName} criada`);
  console.log(`✅ ${store2.tradeName} criada`);
  console.log(`✅ ${store3.tradeName} criada\n`);

  // ============================================
  // 4. Users
  // ============================================
  console.log('👥 Criando Usuários...');

  const hashedPassword = await bcrypt.hash('Admin@2024', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@relmbikes.com.br' },
    update: {},
    create: {
      name: 'Administrador Relm',
      email: 'admin@relmbikes.com.br',
      passwordHash: hashedPassword,
      role: UserRole.ADMIN_RELM,
      active: true,
    },
  });

  const gerenteUser = await prisma.user.upsert({
    where: { email: 'gerente@relmbikes.com.br' },
    update: {},
    create: {
      name: 'Gerente Relm',
      email: 'gerente@relmbikes.com.br',
      passwordHash: await bcrypt.hash('Gerente@2024', 10),
      role: UserRole.GERENTE_RELM,
      active: true,
    },
  });

  const suporteUser = await prisma.user.upsert({
    where: { email: 'suporte@relmbikes.com.br' },
    update: {},
    create: {
      name: 'Suporte Relm',
      email: 'suporte@relmbikes.com.br',
      passwordHash: await bcrypt.hash('Suporte@2024', 10),
      role: UserRole.SUPORTE_RELM,
      active: true,
    },
  });

  const lojaUser = await prisma.user.upsert({
    where: { email: 'loja@bikeshopsp.com.br' },
    update: {},
    create: {
      name: 'Usuário Bike Shop SP',
      email: 'loja@bikeshopsp.com.br',
      passwordHash: await bcrypt.hash('Loja@2024', 10),
      role: UserRole.LOJA,
      storeId: store1.id,
      active: true,
    },
  });

  const distribuidorUser = await prisma.user.upsert({
    where: { email: 'distribuidor@distrisul.com.br' },
    update: {},
    create: {
      name: 'Usuário Distribuidor Sul',
      email: 'distribuidor@distrisul.com.br',
      passwordHash: await bcrypt.hash('Distri@2024', 10),
      role: UserRole.DISTRIBUIDOR,
      distributorId: distributor1.id,
      active: true,
    },
  });

  console.log(`✅ ${adminUser.name} (${adminUser.email}) - Senha: Admin@2024`);
  console.log(`✅ ${gerenteUser.name} (${gerenteUser.email}) - Senha: Gerente@2024`);
  console.log(`✅ ${suporteUser.name} (${suporteUser.email}) - Senha: Suporte@2024`);
  console.log(`✅ ${lojaUser.name} (${lojaUser.email}) - Senha: Loja@2024`);
  console.log(`✅ ${distribuidorUser.name} (${distribuidorUser.email}) - Senha: Distri@2024\n`);

  // ============================================
  // 5. Customers (exemplo)
  // ============================================
  console.log('👤 Criando Clientes de Exemplo...');

  const customer1 = await prisma.customer.upsert({
    where: { email: 'joao.silva@example.com' },
    update: {},
    create: {
      email: 'joao.silva@example.com',
      passwordHash: await bcrypt.hash('Cliente@2024', 10),
      fullName: 'João Silva',
      phone: '11987654321',
      cpf: '12345678901',
      birthDate: new Date('1985-03-15'),
      address: 'Rua das Flores, 123',
      city: 'São Paulo',
      state: 'SP',
      country: 'Brasil',
      zipCode: '01234567',
      marketingConsent: true,
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { email: 'maria.santos@example.com' },
    update: {},
    create: {
      email: 'maria.santos@example.com',
      passwordHash: await bcrypt.hash('Cliente@2024', 10),
      fullName: 'Maria Santos',
      phone: '21987654321',
      cpf: '98765432100',
      address: 'Av. Rio Branco, 456',
      city: 'Rio de Janeiro',
      state: 'RJ',
      country: 'Brasil',
      zipCode: '20040001',
      marketingConsent: true,
    },
  });

  console.log(`✅ ${customer1.fullName} criado`);
  console.log(`✅ ${customer2.fullName} criada\n`);

  // ============================================
  // 6. Products
  // ============================================
  console.log('🚴 Criando Produtos...');

  const product1 = await prisma.product.upsert({
    where: { serialNumber: 'RELM2024ROAD001' },
    update: {},
    create: {
      serialNumber: 'RELM2024ROAD001',
      brand: 'Relm Bikes',
      productType: 'Road',
      model: 'Apex Pro 2024',
      purchaseDate: new Date('2024-01-15'),
      purchaseInvoiceNumber: 'NF-12345',
      purchaseStoreName: 'Bike Shop São Paulo',
      storeId: store1.id,
    },
  });

  const product2 = await prisma.product.upsert({
    where: { serialNumber: 'RELM2024MTB002' },
    update: {},
    create: {
      serialNumber: 'RELM2024MTB002',
      brand: 'Relm Bikes',
      productType: 'MTB',
      model: 'Summit Trail 29',
      purchaseDate: new Date('2024-02-10'),
      purchaseInvoiceNumber: 'NF-54321',
      purchaseStoreName: 'Ciclismo Rio',
      storeId: store2.id,
    },
  });

  console.log(`✅ ${product1.model} (${product1.serialNumber})`);
  console.log(`✅ ${product2.model} (${product2.serialNumber})\n`);

  // ============================================
  // 7. Warranty Claims
  // ============================================
  console.log('📋 Criando Garantias de Exemplo...');

  const warranty1 = await prisma.warrantyClaim.create({
    data: {
      protocolNumber: 'GRT-2024-00001',
      customerId: customer1.id,
      productId: product1.id,
      storeId: store1.id,
      invoiceNumber: 'NF-12345',
      purchaseStoreName: 'Bike Shop São Paulo',
      purchaseStoreCity: 'São Paulo',
      purchaseStoreState: 'SP',
      linkStatus: LinkStatus.CONFIRMED,
      status: WarrantyStatus.EM_ANALISE,
      customerNotes: 'Problema no câmbio traseiro, não troca as marchas corretamente.',
      adminNotes: 'Cliente informou uso normal, dentro da garantia.',
    },
  });

  const warranty2 = await prisma.warrantyClaim.create({
    data: {
      protocolNumber: 'GRT-2024-00002',
      customerId: customer2.id,
      productId: product2.id,
      storeId: store2.id,
      invoiceNumber: 'NF-54321',
      purchaseStoreName: 'Ciclismo Rio',
      purchaseStoreCity: 'Rio de Janeiro',
      purchaseStoreState: 'RJ',
      linkStatus: LinkStatus.CONFIRMED,
      status: WarrantyStatus.RECEBIDO,
      customerNotes: 'Freio a disco fazendo barulho anormal.',
    },
  });

  console.log(`✅ ${warranty1.protocolNumber} criada`);
  console.log(`✅ ${warranty2.protocolNumber} criada\n`);

  // ============================================
  // 8. Warranty Events
  // ============================================
  console.log('📝 Criando Eventos de Garantia...');

  await prisma.warrantyEvent.create({
    data: {
      claimId: warranty1.id,
      eventType: 'STATUS_CHANGE',
      fromStatus: 'RECEBIDO',
      toStatus: 'EM_ANALISE',
      comment: 'Garantia recebida e iniciada análise técnica.',
      createdByUserId: suporteUser.id,
    },
  });

  console.log(`✅ Eventos criados\n`);

  // ============================================
  // 9. Benefits
  // ============================================
  console.log('🎁 Criando Benefícios...');

  const benefit1 = await prisma.benefit.create({
    data: {
      title: '10% de desconto em acessórios',
      description: 'Desconto de 10% em todos os acessórios Relm para clientes do Clube de Vantagens.',
      terms: 'Válido apenas em lojas revendedoras autorizadas Relm. Não cumulativo com outras promoções.',
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2028-12-31'),
      active: true,
      targetRoles: ['CLIENTE'],
    },
  });

  const benefit2 = await prisma.benefit.create({
    data: {
      title: 'Frete grátis em compras acima de R$ 500',
      description: 'Frete grátis para todo Brasil em compras acima de R$ 500 no site Relm.',
      terms: 'Válido para produtos vendidos e entregues pela Relm Bikes.',
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2028-12-31'),
      active: true,
      targetRoles: ['CLIENTE'],
    },
  });

  const benefit3 = await prisma.benefit.create({
    data: {
      title: 'Material de merchandising gratuito',
      description: 'Kits de merchandising Relm para lojas revendedoras.',
      terms: 'Disponível mediante solicitação e análise de volume de vendas.',
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2028-12-31'),
      active: true,
      targetRoles: ['LOJA'],
    },
  });

  console.log(`✅ ${benefit1.title}`);
  console.log(`✅ ${benefit2.title}`);
  console.log(`✅ ${benefit3.title}\n`);

  // ============================================
  // 10. Benefit Memberships
  // ============================================
  console.log('💳 Criando Memberships...');

  await prisma.benefitMembership.create({
    data: {
      customerId: customer1.id,
      status: 'ACTIVE',
      tier: 'STANDARD',
    },
  });

  console.log(`✅ Membership criado para ${customer1.fullName}\n`);

  // ============================================
  // 11. Events
  // ============================================
  console.log('📅 Criando Eventos...');

  const event1 = await prisma.event.create({
    data: {
      title: 'Lançamento Nova Linha 2025',
      description: 'Evento de lançamento da nova linha de bikes Relm 2025. Venha conhecer as novidades!',
      location: 'São Paulo Expo - Rodovia dos Imigrantes, SP',
      startAt: new Date('2024-11-15T09:00:00'),
      endAt: new Date('2024-11-15T18:00:00'),
      maxParticipants: 500,
      active: true,
    },
  });

  const event2 = await prisma.event.create({
    data: {
      title: 'Pedal Relm Tour - Etapa Rio',
      description: 'Pedal em grupo pela orla do Rio de Janeiro com a equipe Relm.',
      location: 'Posto 6, Copacabana - Rio de Janeiro, RJ',
      startAt: new Date('2024-12-10T07:00:00'),
      endAt: new Date('2024-12-10T12:00:00'),
      maxParticipants: 100,
      active: true,
    },
  });

  console.log(`✅ ${event1.title}`);
  console.log(`✅ ${event2.title}\n`);

  // ============================================
  // 12. Content Items
  // ============================================
  console.log('📰 Criando Conteúdos...');

  await prisma.contentItem.create({
    data: {
      title: 'Manual de Montagem - Linha Road',
      body: `# Manual de Montagem - Linha Road

## Ferramentas necessárias
- Chave allen 4mm, 5mm, 6mm
- Chave de torque

## Passo a passo
1. Montagem do quadro...
2. Instalação do guidão...
3. Ajuste dos freios...`,
      category: 'Manuais',
      targetRole: 'LOJA',
      publishedAt: new Date(),
      active: true,
    },
  });

  await prisma.contentItem.create({
    data: {
      title: 'Catálogo de Produtos 2024',
      body: `# Catálogo Relm Bikes 2024

Acesse o catálogo completo em PDF: [link]

## Destaques
- Nova linha Apex Pro
- Summit Trail 29"
- E-bikes Urban`,
      category: 'Catálogos',
      targetRole: 'DISTRIBUIDOR',
      publishedAt: new Date(),
      active: true,
    },
  });

  console.log(`✅ Conteúdos criados\n`);

  // ============================================
  // 13. Announcements
  // ============================================
  console.log('📢 Criando Comunicados...');

  await prisma.announcement.create({
    data: {
      title: 'Nova tabela de preços vigente a partir de 01/03/2024',
      message: 'Informamos que a nova tabela de preços entrará em vigor a partir de 01/03/2024. Acesse o portal para visualizar.',
      targetRole: 'LOJA',
      publishedAt: new Date(),
      active: true,
    },
  });

  await prisma.announcement.create({
    data: {
      title: 'Black Friday Relm 2024 - Condições especiais',
      message: 'Confira as condições especiais de desconto para a Black Friday 2024.',
      targetRole: null, // Todos
      publishedAt: new Date(),
      active: true,
    },
  });

  console.log(`✅ Comunicados criados\n`);

  // ============================================
  // 14. Newsletter
  // ============================================
  console.log('📧 Criando Inscrições Newsletter...');

  await prisma.newsletterSubscription.create({
    data: {
      email: customer1.email,
      customerId: customer1.id,
      status: 'ACTIVE',
    },
  });

  console.log(`✅ Newsletter criada\n`);

  // ============================================
  // 15. Club Settings (configurações calibráveis do clube)
  // ============================================
  console.log('⚙️  Criando Configurações do Clube...');

  const clubSettings: { key: string; value: string }[] = [
    // Valor da anuidade Care Plus em R$ (placeholder calibrável — deck slide 16).
    { key: 'plus_annual_fee', value: '299.00' },
    // Valor de 1 ponto em R$ (passivo contábil de pontos — Onda 7). Placeholder.
    { key: 'point_value_brl', value: '0.05' },
    // Wave 3 — Engajamento
    { key: 'referral_bonus_points',      value: '500' },
    { key: 'birthday_bonus_points',      value: '200' },
    { key: 'event_participation_points', value: '100' },
  ];

  for (const setting of clubSettings) {
    await prisma.clubSettings.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log(`✅ Configurações do Clube criadas\n`);

  console.log('✅ Seed concluído com sucesso! 🎉\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
