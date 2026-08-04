import { PrismaClient, PlusCoverageRule } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🛠️ Atualizando Catálogo Mestre de Serviços (Inspiração Casa TRI e Oficinas Especializadas)...');

  const masterServicesData = [
    // 1. Revisões Periódicas
    {
      name: 'Limpeza & Lubrificação de Alta Performance',
      description: 'Lavagem detalhada da bicicleta com desengraxante biodegradável, limpeza da relação e lubrificação da corrente com cera cerâmica.',
      category: 'Revisões Periódicas',
      defaultEstimatedMinutes: 45,
      defaultPrice: 90,
      plusRule: PlusCoverageRule.FREE,
      plusDiscountPercent: null,
    },
    {
      name: 'Revisão Standard',
      description: 'Lavagem completa, lubrificação, desmontagem e limpeza de cassete, corrente e polias, alinhamento de gancheira e regulagem de câmbios e freios.',
      category: 'Revisões Periódicas',
      defaultEstimatedMinutes: 60,
      defaultPrice: 140,
      plusRule: PlusCoverageRule.FREE,
      plusDiscountPercent: null,
    },
    {
      name: 'Revisão Pró (Transmissão & Direção)',
      description: 'Focada na transmissão completa e caixa de direção: desmontagem do central, direção, cubos, corrente, polias e cassete com limpeza ultrassônica e lubrificação de rolamentos.',
      category: 'Revisões Periódicas',
      defaultEstimatedMinutes: 120,
      defaultPrice: 240,
      plusRule: PlusCoverageRule.DISCOUNT_PERCENT,
      plusDiscountPercent: 20,
    },
    {
      name: 'Revisão Master Full',
      description: 'Desmontagem 100% integral da bicicleta (deixando o quadro limpo), substituição/limpeza de cabos e conduítes, graxa sintética nos rolamentos de rodas, caixa e central, regulagens biomecânicas e torqueamento.',
      category: 'Revisões Periódicas',
      defaultEstimatedMinutes: 240,
      defaultPrice: 380,
      plusRule: PlusCoverageRule.DISCOUNT_PERCENT,
      plusDiscountPercent: 25,
    },

    // 2. Freios & Hidráulica
    {
      name: 'Sangria de Freios Hidráulicos (Par)',
      description: 'Troca de fluido mineral ou DOT, eliminação de bolhas de ar do sistema hidráulico, alinhamento de pinças e desamassamento de rotores.',
      category: 'Freios & Hidráulica',
      defaultEstimatedMinutes: 45,
      defaultPrice: 120,
      plusRule: PlusCoverageRule.DISCOUNT_PERCENT,
      plusDiscountPercent: 20,
    },
    {
      name: 'Troca & Assentamento de Pastilhas e Rotores',
      description: 'Substituição de pastilhas de freio, descontaminação/limpeza de discos e brunimento de segurança.',
      category: 'Freios & Hidráulica',
      defaultEstimatedMinutes: 30,
      defaultPrice: 70,
      plusRule: PlusCoverageRule.DISCOUNT_PERCENT,
      plusDiscountPercent: 20,
    },

    // 3. Rodas, Pneus & Tubeless
    {
      name: 'Conversão & Instalação Tubeless (Par)',
      description: 'Aplicação de fita de vedação de aro de alta pressão, instalação de válvulas tubeless de alumínio e aplicação de selante líquido de alta vedação.',
      category: 'Rodas & Tubeless',
      defaultEstimatedMinutes: 60,
      defaultPrice: 160,
      plusRule: PlusCoverageRule.DISCOUNT_PERCENT,
      plusDiscountPercent: 20,
    },
    {
      name: 'Recarga & Limpeza de Selante Tubeless',
      description: 'Remoção de resíduos de selante antigo seco e recarga com novo selante líquido de alta performance.',
      category: 'Rodas & Tubeless',
      defaultEstimatedMinutes: 30,
      defaultPrice: 60,
      plusRule: PlusCoverageRule.FREE,
      plusDiscountPercent: null,
    },
    {
      name: 'Centragem & Tensão de Raios',
      description: 'Alinhamento lateral e radial em centrador de precisão com aferição de tensão de raios via tensiômetro digital.',
      category: 'Rodas & Tubeless',
      defaultEstimatedMinutes: 45,
      defaultPrice: 85,
      plusRule: PlusCoverageRule.DISCOUNT_PERCENT,
      plusDiscountPercent: 20,
    },

    // 4. Suspensão & Amortecedores
    {
      name: 'Revisão de Suspensão Dianteira (50h / 100h)',
      description: 'Desmontagem das canelas, limpeza interna, troca de óleo hidráulico e retentores/raspadores de poeira.',
      category: 'Suspensão & Amortecedores',
      defaultEstimatedMinutes: 90,
      defaultPrice: 220,
      plusRule: PlusCoverageRule.DISCOUNT_PERCENT,
      plusDiscountPercent: 20,
    },
    {
      name: 'Revisão de Shock Traseiro (Amortecedor)',
      description: 'Limpeza da câmara de ar, substituição do kit de vedações/o-rings e óleo amortecedor específico.',
      category: 'Suspensão & Amortecedores',
      defaultEstimatedMinutes: 90,
      defaultPrice: 240,
      plusRule: PlusCoverageRule.DISCOUNT_PERCENT,
      plusDiscountPercent: 20,
    },

    // 5. Ergonomia & Biomecânica
    {
      name: 'Bike Fit Biomecânico Completo',
      description: 'Ajuste antropométrico e dinâmico da posição do ciclista na bicicleta (altura/recuo de selim, tacos de sapatilha, mesa e guidão) para otimização de potência e prevenção de lesões.',
      category: 'Ergonomia & Biomecânica',
      defaultEstimatedMinutes: 120,
      defaultPrice: 350,
      plusRule: PlusCoverageRule.DISCOUNT_PERCENT,
      plusDiscountPercent: 30,
    },

    // 6. Logística & E-Bikes
    {
      name: 'Serviço Leva-e-Traz (Busca & Entrega)',
      description: 'Coleta da bicicleta na residência ou escritório do cliente e devolução pós-serviço em transporte especializado com trava de segurança.',
      category: 'Logística & E-Bikes',
      defaultEstimatedMinutes: 60,
      defaultPrice: 80,
      plusRule: PlusCoverageRule.FREE,
      plusDiscountPercent: null,
    },
    {
      name: 'Diagnóstico Eletrônico & Atualização E-Bike',
      description: 'Leitura via scanner de erros e saúde da bateria/motor (Shimano Steps, Bosch, Mahle, Fazua) e atualização de firmware.',
      category: 'Logística & E-Bikes',
      defaultEstimatedMinutes: 45,
      defaultPrice: 150,
      plusRule: PlusCoverageRule.FREE,
      plusDiscountPercent: null,
    },
  ];

  const createdMasters: any[] = [];
  for (const ms of masterServicesData) {
    let existing = await prisma.masterService.findFirst({ where: { name: ms.name } });
    if (existing) {
      existing = await prisma.masterService.update({
        where: { id: existing.id },
        data: {
          description: ms.description,
          category: ms.category,
          defaultEstimatedMinutes: ms.defaultEstimatedMinutes,
          active: true,
        },
      });
    } else {
      existing = await prisma.masterService.create({
        data: {
          name: ms.name,
          description: ms.description,
          category: ms.category,
          defaultEstimatedMinutes: ms.defaultEstimatedMinutes,
          active: true,
        },
      });
    }
    createdMasters.push({ ...existing, ...ms });
  }

  const stores = await prisma.store.findMany();
  console.log(`📍 Lojas encontradas no sistema: ${stores.length}`);

  for (const s of stores) {
    for (const ms of createdMasters) {
      await prisma.storeService.upsert({
        where: {
          storeId_masterServiceId: {
            storeId: s.id,
            masterServiceId: ms.id,
          },
        },
        update: {
          price: ms.defaultPrice,
          plusRule: ms.plusRule,
          plusDiscountPercent: ms.plusDiscountPercent,
          estimatedMinutes: ms.defaultEstimatedMinutes,
          active: true,
        },
        create: {
          storeId: s.id,
          masterServiceId: ms.id,
          price: ms.defaultPrice,
          plusRule: ms.plusRule,
          plusDiscountPercent: ms.plusDiscountPercent,
          estimatedMinutes: ms.defaultEstimatedMinutes,
          active: true,
        },
      });
    }
  }

  console.log(`✅ ${createdMasters.length} Serviços Mestres vinculados com sucesso às ${stores.length} lojas parceiras!\n`);
}

main()
  .catch((e) => {
    console.error('❌ Erro ao atualizar serviços:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
