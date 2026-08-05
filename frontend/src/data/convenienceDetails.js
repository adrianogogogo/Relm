// Dicionário com informações enriquecidas, facilidades inclusas e regras de uso das conveniências do ciclista

export const CONVENIENCE_DETAILS = {
  DUCHA: {
    key: 'DUCHA',
    name: "Uso de Ducha & Vestiário (Park 'n Shower)",
    icon: '🚿',
    shortTitle: 'Ducha & Vestiário',
    category: 'Conveniências & Hub do Ciclista',
    estimatedTime: '30 minutos',
    summary: 'Vestiário privativo com chuveiro quente, toalhas limpas, secador e armário rotativo para você se trocar em segurança após o pedal.',
    itemsIncluded: [
      { icon: '🚿', label: 'Chuveiro Quente com Ducha Pressurizada' },
      { icon: '🧺', label: 'Toalhas Higienizadas & Embaladas' },
      { icon: '🔒', label: 'Armário Rotativo com Chave' },
      { icon: '🧴', label: 'Kit Banho (Sabonete & Shampoo)' },
      { icon: '💨', label: 'Secador de Cabelos & Espelho' },
    ],
    rules: [
      'Apresente seu QR Code ou número do voucher no balcão da loja parceira.',
      'O tempo recomendado de permanência no vestiário é de até 30 minutos por atendimento.',
      'Toalhas e insumos de banho são fornecidos pela loja e inclusos gratuitamente para membros Relm Plus.',
    ],
    plusBenefitText: 'GRATUITO E ILIMITADO NO RELM PLUS',
    carePriceText: 'R$ 25,00 por uso (Membros Care Padrão)',
  },

  GUARDA_BIKE: {
    key: 'GUARDA_BIKE',
    name: 'Guarda-Bike Seguro (Day Use)',
    icon: '🔒',
    shortTitle: 'Guarda-Bike Seguro',
    category: 'Conveniências & Hub do Ciclista',
    estimatedTime: 'Até 12 horas (Day Use)',
    summary: 'Estacionamento interno monitorado 24h com apólice de seguro contra roubo e furto enquanto você trabalha ou cumpre compromissos na região.',
    itemsIncluded: [
      { icon: '🏢', label: 'Estacionamento Coberto e Monitorado' },
      { icon: '🛡️', label: 'Seguro Integrado Contra Roubo & Furto' },
      { icon: '🏷️', label: 'Etiqueta Numérica de Trava & Identificação' },
      { icon: '🔒', label: 'Chaveiro / Trava de Alta Segurança' },
    ],
    rules: [
      'Válido dentro do horário de funcionamento comercial da loja parceira.',
      'É obrigatória a apresentação de documento com foto e etiqueta numerada no momento da retirada.',
      'Gratuito no plano Relm Plus para diárias de até 12 horas.',
    ],
    plusBenefitText: 'GRATUITO NO RELM PLUS (DAY USE)',
    carePriceText: 'R$ 20,00 por diária (Membros Care Padrão)',
  },

  PIT_STOP: {
    key: 'PIT_STOP',
    name: 'Pit Stop, Calibragem & Ferramentas Self-Service',
    icon: '🧰',
    shortTitle: 'Pit Stop & Ferramentas',
    category: 'Conveniências & Hub do Ciclista',
    estimatedTime: '15 minutos',
    summary: 'Ponto aberto com compressor de precisão, bomba de alta pressão, suporte de manutenção e ferramentas para regulagens rápidas de cortesia.',
    itemsIncluded: [
      { icon: '💨', label: 'Compressor Digital com Medidor PSI' },
      { icon: '🛠️', label: 'Bancada com Suporte de Elevação para Bike' },
      { icon: '🔧', label: 'Jogo Completo de Chaves Allen, Torx & Extrator de Corrente' },
      { icon: '🚲', label: 'Bomba de Pé para Válvulas Presta & Schrader' },
      { icon: '🧼', label: 'Panos para Limpeza Rápida das Mãos' },
    ],
    rules: [
      'Espaço de uso livre e cortesia para todos os ciclistas na fachada ou entrada da loja.',
      'Por favor, mantenha as ferramentas organizadas no suporte após a utilização.',
      'Necessitando de auxílio técnico especializado, consulte um mecânico da loja.',
    ],
    plusBenefitText: 'CORTESIA ABERTA PARA TODOS OS CICLISTAS',
    carePriceText: 'Gratuito (Cortesia da Rede Relm)',
  },

  BIKE_CAFE: {
    key: 'BIKE_CAFE',
    name: 'Espaço Lounge & Bike Café (Hidratação & Convivência)',
    icon: '☕',
    shortTitle: 'Bike Café & Lounge',
    category: 'Conveniências & Hub do Ciclista',
    estimatedTime: '30 a 60 minutos',
    summary: 'Lounge climatizado com Wi-Fi ultra-rápido, café espresso gourmet cortesia, água gelada e ilha de hidratação isotônica.',
    itemsIncluded: [
      { icon: '☕', label: 'Café Espresso Gourmet Fresco' },
      { icon: '📶', label: 'Wi-Fi 5G Ultra-Rápido Dedicado' },
      { icon: '🛋️', label: 'Lounge Climatizado com Sofás Confortáveis' },
      { icon: '💧', label: 'Ilha de Água Filtrada & Isotônico' },
      { icon: '🔌', label: 'Tomadas para Carregar Celular & Ciclocomputador' },
    ],
    rules: [
      'Acesso ao lounge climatizado com consumo cortesia de café gourmet e isotônico para membros Relm Plus.',
      'Permitida a entrada com vestuário de ciclismo e sapatilhas (piso antiderrapante seguro).',
    ],
    plusBenefitText: 'CONSUMO CORTESIA NO RELM PLUS',
    carePriceText: 'R$ 15,00 por acesso / consumo (Membros Care)',
  },

  RECARGA_EBIKE: {
    key: 'RECARGA_EBIKE',
    name: 'Ponto de Recarga Rápida para E-Bikes',
    icon: '⚡',
    shortTitle: 'Recarga E-Bike',
    category: 'Conveniências & Hub do Ciclista',
    estimatedTime: '60 minutos',
    summary: 'Estação de recarga elétrica de alta velocidade compatível com baterias Shimano Steps, Bosch, Specialized, Mahle e fontes universais.',
    itemsIncluded: [
      { icon: '⚡', label: 'Carregadores de Alta Amperagem (Fast Charge)' },
      { icon: '🔌', label: 'Conectores Shimano, Bosch, Specialized, Mahle' },
      { icon: '🔋', label: 'Bancada Segura para Apoio da Bateria/Bike' },
      { icon: '🛡️', label: 'Proteção Contra Surtos Elétricos & Sobrecarga' },
    ],
    rules: [
      'Inspeção visual rápida da bateria antes de conectar à rede elétrica da loja.',
      'O tempo médio estimado de recarga parcial é de 45 a 60 minutos.',
      'Gratuito para membros Relm Plus.',
    ],
    plusBenefitText: 'RECARGA GRATUITA NO RELM PLUS',
    carePriceText: 'R$ 15,00 por hora de recarga (Membros Care)',
  },

  SOCORRO_EMERGENCIAL: {
    key: 'SOCORRO_EMERGENCIAL',
    name: 'Socorro Mecânico Emergencial (Resgate em Trânsito)',
    icon: '🚑',
    shortTitle: 'Socorro & Resgate',
    category: 'Conveniências & Hub do Ciclista',
    estimatedTime: 'Resgate em até 45 minutos',
    summary: 'Atendimento de socorro e resgate na cidade com veículo de apoio da loja em caso de quebra de corrente, pneu rasgado ou imprevistos no pedal.',
    itemsIncluded: [
      { icon: '🚐', label: 'Veículo de Apoio Equipado com Suporte de Bike' },
      { icon: '🛠️', label: 'Mecânico a Bordo para Reparos Rápidos no Local' },
      { icon: '🗺️', label: 'Cobertura Urbana no Raio de Atuação da Loja' },
      { icon: '🏥', label: 'Kit de Primeiros Socorros Básico para o Ciclista' },
    ],
    rules: [
      'Acionamento direto via botão de WhatsApp de Emergência no Portal Relm.',
      'Cobertura dentro do perímetro urbano municipal da loja credenciada.',
      'Gratuito no plano Relm Plus em emergências no pedal.',
    ],
    plusBenefitText: 'RESGATE GRATUITO NO RELM PLUS',
    carePriceText: 'R$ 90,00 por acionamento (Membros Care)',
  },

  MALA_BIKE: {
    key: 'MALA_BIKE',
    name: 'Empréstimo & Aluguel de Mala-Bike e Racks',
    icon: '🧳',
    shortTitle: 'Mala-Bike & Racks',
    category: 'Conveniências & Hub do Ciclista',
    estimatedTime: 'Diárias (1 a 7 dias)',
    summary: 'Mala-bike rígida com rodízios para viagens aéreas e racks de teto/engate para transporte veicular com total segurança para sua bicicleta.',
    itemsIncluded: [
      { icon: '🧳', label: 'Mala-Bike Rígida de Alta Resistência com Rodízios' },
      { icon: '🚗', label: 'Racks de Carro para Engate de Reboque ou Teto' },
      { icon: '🛡️', label: 'Kit com Espumas e Protetores de Quadro & Disco' },
      { icon: '🔒', label: 'Cadeado TSA com Segredo Integrado' },
    ],
    rules: [
      'Necessário agendamento prévio no portal para verificação de disponibilidade de datas.',
      'Vistoria de retirada e devolução realizada junto com o técnico da loja parceira.',
      'Descontos exclusivos e diárias bônus para membros Relm Plus.',
    ],
    plusBenefitText: 'DESCONTO EXCLUSIVO + 1 DIÁRIA BÔNUS NO PLUS',
    carePriceText: 'Valor sob consulta por diária (Membros Care)',
  },
};

// Helper para encontrar os detalhes enriquecidos a partir do nome do MasterService
export function getConvenienceDetailsByName(serviceName = '') {
  if (!serviceName) return null;
  const nameLower = serviceName.toLowerCase();

  if (nameLower.includes('ducha') || nameLower.includes('vestiário') || nameLower.includes('shower')) {
    return CONVENIENCE_DETAILS.DUCHA;
  }
  if (nameLower.includes('guarda-bike') || nameLower.includes('estacionamento') || nameLower.includes('day use')) {
    return CONVENIENCE_DETAILS.GUARDA_BIKE;
  }
  if (nameLower.includes('pit stop') || nameLower.includes('ferramentas') || nameLower.includes('calibragem')) {
    return CONVENIENCE_DETAILS.PIT_STOP;
  }
  if (nameLower.includes('café') || nameLower.includes('lounge') || nameLower.includes('hidratação')) {
    return CONVENIENCE_DETAILS.BIKE_CAFE;
  }
  if (nameLower.includes('recarga') || nameLower.includes('e-bike') || nameLower.includes('bateria')) {
    return CONVENIENCE_DETAILS.RECARGA_EBIKE;
  }
  if (nameLower.includes('socorro') || nameLower.includes('resgate') || nameLower.includes('emergencial')) {
    return CONVENIENCE_DETAILS.SOCORRO_EMERGENCIAL;
  }
  if (nameLower.includes('mala-bike') || nameLower.includes('racks') || nameLower.includes('empréstimo')) {
    return CONVENIENCE_DETAILS.MALA_BIKE;
  }

  return null;
}
