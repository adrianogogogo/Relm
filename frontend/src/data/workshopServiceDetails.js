// Dicionário com Fichas Técnicas, Procedimentos, Insumos e Recomendações dos Serviços de Oficina & Manutenção

export const WORKSHOP_SERVICE_DETAILS = {
  LIMPEZA_LUBRIFICACAO: {
    key: 'LIMPEZA_LUBRIFICACAO',
    name: 'Limpeza & Lubrificação de Alta Performance',
    icon: '🧼',
    category: 'Revisões Periódicas',
    estimatedTime: '45 minutos',
    summary: 'Lavagem detalhada da bicicleta com desengraxante biodegradável de alta eficiência, remoção completa de resíduos da transmissão e lubrificação da corrente com cera cerâmica.',
    steps: [
      { icon: '🧼', label: 'Lavagem Detalhada com Desengraxante Biodegradável (sem agredir vedações)' },
      { icon: '⚙️', label: 'Limpeza e Escovação Manual de Corrente, Cassete e Polias' },
      { icon: '💨', label: 'Secagem Técnica com Ar Comprimido para evitar oxidação' },
      { icon: '🛢️', label: 'Aplicação de Cera Cerâmica de Alta Performance na Relação' },
      { icon: '🔍', label: 'Inspeção Visual de Desgaste de Corrente com Calibrador Digital' },
    ],
    productsUsed: [
      'Desengraxante Biodegradável de Alta Performance',
      'Lubrificante à Base de Cera Cerâmica (Seco / Úmido)',
      'Shampoo Neutro para Quadros de Carbono e Alumínio',
    ],
    recommendations: [
      'Recomendado a cada 15 a 20 dias para pedais frequentes ou pós-pedal na chuva/lama.',
      'Prolonga a vida útil da corrente, cassete e coroas em até 40%.',
    ],
    plusBenefitText: '100% GRATUITO E ILIMITADO NO RELM PLUS',
    carePriceText: 'R$ 90,00 por serviço (Membros Care Padrão)',
  },

  REVISAO_STANDARD: {
    key: 'REVISAO_STANDARD',
    name: 'Revisão Standard',
    icon: '⚙️',
    category: 'Revisões Periódicas',
    estimatedTime: '60 minutos',
    summary: 'Lavagem completa, lubrificação, desmontagem e limpeza de cassete, corrente e polias, alinhamento de gancheira e regulagem precisa de câmbios e freios.',
    steps: [
      { icon: '🧼', label: 'Lavagem Geral & Desengraxamento da Relação' },
      { icon: '⚙️', label: 'Desmontagem, Limpeza e Lubrificação de Cassete, Corrente e Polias' },
      { icon: '📐', label: 'Alinhamento da Gancheira do Câmbio Traseiro com Alinhador Geométrico' },
      { icon: '🔧', label: 'Regulagem Micrométrica dos Câmbios Dianteiro e Traseiro' },
      { icon: '🛑', label: 'Ajuste de Tensão de Cabos e Alinhamento das Pinças de Freio' },
      { icon: '🪛', label: 'Checagem e Torqueamento Geral de Parafusos com Torquímetro Digital' },
    ],
    productsUsed: [
      'Cera Cerâmica de Corrente',
      'Desengraxante Industrial Específico para Bikes',
      'Pasta Antideslizante para Canote e Guidão de Carbono',
    ],
    recommendations: [
      'Recomendada a cada 3 a 6 meses para manter a precisão das trocas de marcha.',
      'Garante segurança em treinos cotidianos e pedais de fim de semana.',
    ],
    plusBenefitText: '100% GRATUITO NO RELM PLUS',
    carePriceText: 'R$ 140,00 por serviço (Membros Care Padrão)',
  },

  REVISAO_PRO: {
    key: 'REVISAO_PRO',
    name: 'Revisão Pró (Transmissão & Direção)',
    icon: '🔧',
    category: 'Revisões Periódicas',
    estimatedTime: '120 minutos',
    summary: 'Focada na transmissão completa e caixa de direção: desmontagem do central, direção, cubos, corrente, polias e cassete com limpeza ultrassônica e lubrificação de rolamentos.',
    steps: [
      { icon: '🧰', label: 'Desmontagem Completa da Transmissão (Pedivela, Central, Cassete, Corrente, Câmbios)' },
      { icon: '🔊', label: 'Limpeza Ultrassônica da Relação para Remoção de Sujeiras Microcópicas' },
      { icon: '⚙️', label: 'Desmontagem e Limpeza da Caixa de Direção & Movimento Central' },
      { icon: '🛢️', label: 'Revisão e Aplicação de Graxa Sintética nos Rolamentos' },
      { icon: '🌀', label: 'Centragem Básica de Rodas em Centrador de Precisão' },
      { icon: '🪛', label: 'Montagem com Torqueamento Nominal de Factualização dos Componentes' },
    ],
    productsUsed: [
      'Graxa Sintética de Lítio / Teflon para Rolamentos',
      'Solução Ultrassônica Biodegradável',
      'Graxa Marinha Resistentíssima à Água',
    ],
    recommendations: [
      'Recomendada antes de provas, maratonas ou a cada 6 meses de uso intenso.',
      'Evita estalos no movimento central e na caixa de direção.',
    ],
    plusBenefitText: '20% DE DESCONTO NO RELM PLUS',
    carePriceText: 'R$ 240,00 por serviço (Membros Care Padrão)',
  },

  REVISAO_MASTER_FULL: {
    key: 'REVISAO_MASTER_FULL',
    name: 'Revisão Master Full',
    icon: '🚲',
    category: 'Revisões Periódicas',
    estimatedTime: '240 minutos (4 horas)',
    summary: 'Desmontagem 100% integral da bicicleta (deixando o quadro completamente limpo), substituição/limpeza de cabos e conduítes, graxa sintética nos rolamentos de rodas, caixa e central, regulagens biomecânicas e torqueamento.',
    steps: [
      { icon: '🚲', label: 'Desmontagem 100% Integral da Bike (deixando apenas o quadro nu)' },
      { icon: '🧼', label: 'Limpeza Química e Polimento de Proteção do Quadro (Carbono/Alumínio)' },
      { icon: '⚙️', label: 'Revisão Completa de Cubos de Roda, Movimento Central e Caixa de Direção' },
      { icon: '🧵', label: 'Substituição Completa de Cabos e Conduítes (Inox/Teflonado)' },
      { icon: '🩸', label: 'Sangria do Sistema Hidráulico de Freios (Par)' },
      { icon: '🌀', label: 'Centragem e Tensão de Raios das Duas Rodas com Tensiômetro' },
      { icon: '📐', label: 'Ajustes de Posição Biomecânica Básica e Torqueamento de 100% dos Parafusos' },
    ],
    productsUsed: [
      'Cabos de Aço Inox Teflonados e Conduítes Selados',
      'Fluido Hidráulico de Alta Eficiência Termo-Resistente',
      'Cera de Polimento Proteção UV para Quadros',
      'Graxa Sintética de Alta Performance para Competição',
    ],
    recommendations: [
      'Recomendada 1 vez ao ano (Revisão Anual de Zero-KM) ou pré-temporada de competições.',
      'Deixa a bicicleta com sensação de recém-saída da caixa de fábrica.',
    ],
    plusBenefitText: '25% DE DESCONTO NO RELM PLUS',
    carePriceText: 'R$ 380,00 por serviço (Membros Care Padrão)',
  },

  SANGRIA_FREIOS: {
    key: 'SANGRIA_FREIOS',
    name: 'Sangria de Freios Hidráulicos (Par)',
    icon: '🩸',
    category: 'Freios & Hidráulica',
    estimatedTime: '45 minutos',
    summary: 'Troca de fluido mineral ou DOT, eliminação de bolhas de ar do sistema hidráulico, alinhamento de pinças e desamassamento de rotores.',
    steps: [
      { icon: '🩸', label: 'Drenagem do Fluido Antigo Contaminado / Degradado' },
      { icon: '💉', label: 'Injeção sob Pressão de Novo Fluido Hidráulico Mineral ou DOT' },
      { icon: '💨', label: 'Eliminação Completa de Bolhas de Ar da Manete e Pinça' },
      { icon: '🛑', label: 'Alinhamento Micrométrico de Pinças e Ajuste de Pistões' },
      { icon: '💿', label: 'Desamassamento e Limpeza Química dos Discos de Freio' },
    ],
    productsUsed: [
      'Fluido Hidráulico Mineral Shimano / Royal Blood / DOT 5.1',
      'Álcool Isopropílico 99.8% para Descontaminação de Rotores',
    ],
    recommendations: [
      'Recomendado a cada 6 a 12 meses ou quando a manete de freio apresentar sensação borracheira.',
      'Fundamental para segurança em descidas longas e serras.',
    ],
    plusBenefitText: '20% DE DESCONTO NO RELM PLUS',
    carePriceText: 'R$ 120,00 por serviço (Membros Care Padrão)',
  },

  TROCA_PASTILHAS: {
    key: 'TROCA_PASTILHAS',
    name: 'Troca & Assentamento de Pastilhas e Rotores',
    icon: '🛑',
    category: 'Freios & Hidráulica',
    estimatedTime: '30 minutos',
    summary: 'Substituição de pastilhas de freio, descontaminação/limpeza de discos e brunimento de segurança.',
    steps: [
      { icon: '🛑', label: 'Remoção de Pastilhas Gastas e Limpeza dos Pistões da Pinça' },
      { icon: '💿', label: 'Medição da Espessura dos Rotores com Paquímetro Digital' },
      { icon: '🪨', label: 'Brunimento Técnico da Superfície do Disco para Eliminar Espelhamento' },
      { icon: '🔧', label: 'Instalação das Novas Pastilhas (Resina, Semimetálica ou Metálica)' },
      { icon: '🔥', label: 'Procedimento de Assentamento Térmico de Segurança' },
    ],
    productsUsed: [
      'Pastilhas de Freio Originais (Resina / Metálica)',
      'Descontaminante Específico de Discos de Freio',
    ],
    recommendations: [
      'Substituir antes que a massa de atrito da pastilha chegue a menos de 1mm.',
    ],
    plusBenefitText: '20% DE DESCONTO NO RELM PLUS',
    carePriceText: 'R$ 70,00 por serviço (Membros Care Padrão)',
  },

  CONVERSAO_TUBELESS: {
    key: 'CONVERSAO_TUBELESS',
    name: 'Conversão & Instalação Tubeless (Par)',
    icon: '🛠️',
    category: 'Rodas & Tubeless',
    estimatedTime: '60 minutos',
    summary: 'Aplicação de fita de vedação de aro de alta pressão, instalação de válvulas tubeless de alumínio e aplicação de selante líquido de alta vedação.',
    steps: [
      { icon: '🧼', label: 'Remoção da Fita Antiga e Limpeza Química da Cama do Aro' },
      { icon: '🎗️', label: 'Aplicação de Fita Tubeless de Alta Pressão sob Tensão' },
      { icon: '🔩', label: 'Instalação de Válvulas Tubeless de Alumínio Usinado' },
      { icon: '🛞', label: 'Montagem dos Pneus Tubeless Ready e Talonamento sob Pressão' },
      { icon: '💧', label: 'Aplicação de Selante Líquido Amoniacal / Não-Amoniacal' },
    ],
    productsUsed: [
      'Fita de Vedação Tubeless Específica para a Largura do Aro',
      'Válvulas Tubeless com Núcleo Removível',
      'Selante Líquido de Alta Vedação (Furos até 6mm)',
    ],
    recommendations: [
      'Elimina o risco de furos por espinhos e cobras no MTB e Road.',
      'Permite rodar com menor calibragem, aumentando a tração e conforto.',
    ],
    plusBenefitText: '20% DE DESCONTO NO RELM PLUS',
    carePriceText: 'R$ 160,00 por serviço (Membros Care Padrão)',
  },

  RECARGA_TUBELESS: {
    key: 'RECARGA_TUBELESS',
    name: 'Recarga & Limpeza de Selante Tubeless',
    icon: '💧',
    category: 'Rodas & Tubeless',
    estimatedTime: '30 minutos',
    summary: 'Remoção de resíduos de selante antigo seco e recarga com novo selante líquido de alta performance.',
    steps: [
      { icon: '🔍', label: 'Checagem do Nível e Estado do Selante Atual' },
      { icon: '🧽', label: 'Limpeza de Resíduos Secos e "Ovos" de Selante Antigo' },
      { icon: '💉', label: 'Injeção da Dose Recomendada de Selante Novo pela Válvula' },
      { icon: '💨', label: 'Calibragem de Precisão e Teste de Vedação da Válvula' },
    ],
    productsUsed: [
      'Selante Líquido de Alta Eficiência',
    ],
    recommendations: [
      'A recarga deve ser feita a cada 2 a 4 meses (dependendo do clima da região).',
    ],
    plusBenefitText: '100% GRATUITO NO RELM PLUS',
    carePriceText: 'R$ 60,00 por serviço (Membros Care Padrão)',
  },

  CENTRAGEM_RAIOS: {
    key: 'CENTRAGEM_RAIOS',
    name: 'Centragem & Tensão de Raios',
    icon: '🌀',
    category: 'Rodas & Tubeless',
    estimatedTime: '45 minutos',
    summary: 'Alinhamento lateral e radial em centrador de precisão com aferição de tensão de raios via tensiômetro digital.',
    steps: [
      { icon: '🌀', label: 'Montagem da Roda em Centrador Profissional' },
      { icon: '📐', label: 'Eliminação de Desvios Laterais (Pulo) e Radiais (Guarda)' },
      { icon: '📊', label: 'Aferição da Tensão de Todos os Raios com Tensiômetro Digital' },
      { icon: '🔧', label: 'Ajuste e Igualação de Torques nos Nipples' },
    ],
    productsUsed: [
      'Nipples de Latão / Alumínio (caso substituição)',
      'Trava Químia para Nipples (evita afrouxamento)',
    ],
    recommendations: [
      'Aumenta a rigidez estrutural da roda e evita quebra constante de raios.',
    ],
    plusBenefitText: '20% DE DESCONTO NO RELM PLUS',
    carePriceText: 'R$ 85,00 por serviço (Membros Care Padrão)',
  },

  SUSPENSAO_DIANTEIRA: {
    key: 'SUSPENSAO_DIANTEIRA',
    name: 'Revisão de Suspensão Dianteira (50h / 100h)',
    icon: '⚙️',
    category: 'Suspensão & Amortecedores',
    estimatedTime: '90 minutos',
    summary: 'Desmontagem das canelas, limpeza interna, troca de óleo hidráulico e retentores/raspadores de poeira.',
    steps: [
      { icon: '🪛', label: 'Desmontagem das Canelas e Cartucho Hidráulico' },
      { icon: '🧼', label: 'Limpeza Química Interna das Hastes e Hastes de Ar' },
      { icon: '🛑', label: 'Substituição de Retentores, Raspadores e Anéis O-Ring' },
      { icon: '🛢️', label: 'Injeção de Óleo Hidráulico Específico (Viscosidade Nominal)' },
      { icon: '💨', label: 'Calibragem de Pressão Positiva/Negativa conforme Peso do Piloto' },
    ],
    productsUsed: [
      'Kits de Retentores Originais (RockShox / Fox / Marzocchi)',
      'Óleo Hidráulico Específico para Suspensões (5W / 10W / 15W)',
      'Graxa de Suspensão Sintética PM600 / Slick Honey',
    ],
    recommendations: [
      'Recomendada a cada 50h (revisão básica) ou 100h / 1 ano (revisão completa).',
      'Evita o desgaste irreversível das hastes de alumínio.',
    ],
    plusBenefitText: '20% DE DESCONTO NO RELM PLUS',
    carePriceText: 'R$ 220,00 por serviço (Membros Care Padrão)',
  },

  SUSPENSAO_TRASEIRA: {
    key: 'SUSPENSAO_TRASEIRA',
    name: 'Revisão de Amortecedor Traseiro / Shock (50h / 100h)',
    icon: '🌀',
    category: 'Suspensão & Amortecedores',
    estimatedTime: '90 minutos',
    summary: 'Desmontagem da lata de ar, substituição de vedações hidráulicas, graxa sintética e pressurização com nitrogênio/ar.',
    steps: [
      { icon: '🪛', label: 'Desmontagem da Lata de Ar (Air Can) e Cartucho Damper' },
      { icon: '🧼', label: 'Limpeza dos Pistões e Vedações Internas' },
      { icon: '🛑', label: 'Substituição do Kit de Gaxetas e Raspadores' },
      { icon: '🛢️', label: 'Recarga de Fluido Hidráulico e Nitrogênio/Ar de Alta Pressão' },
      { icon: '📐', label: 'Ajuste de SAG e Retorno (Rebound)' },
    ],
    productsUsed: [
      'Kit de Vedações e Gaxetas Originais',
      'Fluido Hidráulico de Shock de Alta Viscosidade',
    ],
    recommendations: [
      'Vital para manter a leitura do terreno e tração na roda traseira em bikes Full Suspension.',
    ],
    plusBenefitText: '20% DE DESCONTO NO RELM PLUS',
    carePriceText: 'R$ 240,00 por serviço (Membros Care Padrão)',
  },

  BIKE_FIT: {
    key: 'BIKE_FIT',
    name: 'Bike Fit Biomecânico & Ergonomia',
    icon: '📐',
    category: 'Ergonomia & Biomecânica',
    estimatedTime: '90 minutos',
    summary: 'Análise goniométrica visual, ajuste de tacos nas sapatilhas, altura e recuo de selim, avanço e inclinação de guidão para prevenir dores e maximizar potência.',
    steps: [
      { icon: '📋', label: 'Entrevista de Histórico Físico, Lesões e Objetivos no Ciclismo' },
      { icon: '🦶', label: 'Ajuste de Ângulo e Posição dos Tacos nas Sapatilhas' },
      { icon: '📐', label: 'Aferição de Ângulo de Joelho, Quadril e Ombros com Goniômetro' },
      { icon: '🛋️', label: 'Ajuste de Altura, Recuo e Inclinacão do Selim' },
      { icon: '🚲', label: 'Ajuste de Altura, Ângulo de Manetes e Avanço de Guidão' },
    ],
    productsUsed: [
      'Goniômetro Digital / Software de Análise Biomecânica',
      'Gabarito de Ajuste de Tacos de Sapatilha',
    ],
    recommendations: [
      'Indispensável para quem sente dores nos joelhos, costas, formigamento nas mãos ou pés.',
    ],
    plusBenefitText: '20% DE DESCONTO NO RELM PLUS',
    carePriceText: 'R$ 250,00 por sessão (Membros Care Padrão)',
  },

  LEVA_TRAZ: {
    key: 'LEVA_TRAZ',
    name: 'Leva & Traz Especializado (Leva e Traz de Bikes)',
    icon: '🚚',
    category: 'Logística & E-Bikes',
    estimatedTime: '60 minutos',
    summary: 'Coleta da bicicleta na residência ou escritório do cliente e devolução pós-serviço em transporte especializado com trava de segurança.',
    steps: [
      { icon: '🚐', label: 'Transporte em Veículo Adaptado com Suportes Internos Emborrachados' },
      { icon: '📋', label: 'Vistoria e Checklist de Entrada da Bike com Fotos' },
      { icon: '🔒', label: 'Fixação por Trava de Quadro (sem contato com a pintura)' },
      { icon: '🏠', label: 'Devolução Agendada na Residência ou Escritório' },
    ],
    productsUsed: [
      'Mantas de Proteção Neoprene para Quadros de Carbono',
    ],
    recommendations: [
      'Praticidade total para quem não tem suporte de carro ou tempo de ir até a loja.',
    ],
    plusBenefitText: '100% GRATUITO NO RELM PLUS',
    carePriceText: 'R$ 80,00 por transporte (Membros Care Padrão)',
  },

  DIAGNOSTICO_EBIKE: {
    key: 'DIAGNOSTICO_EBIKE',
    name: 'Diagnóstico Eletrônico & Atualização E-Bike',
    icon: '⚡',
    category: 'Logística & E-Bikes',
    estimatedTime: '45 minutos',
    summary: 'Leitura via scanner de erros e saúde da bateria/motor (Shimano Steps, Bosch, Mahle, Fazua) e atualização de firmware.',
    steps: [
      { icon: '💻', label: 'Conexão da E-Bike ao Scanner Diagnóstico Profissional' },
      { icon: '🔋', label: 'Leitura da Saúde da Bateria (SOH) e Ciclos de Carga' },
      { icon: '⚡', label: 'Análise de Código de Erros do Motor e Sensores de Torque' },
      { icon: '🌐', label: 'Atualização do Firmware Oficial do Fabricante' },
      { icon: '📄', label: 'Emissão de Relatório Diagnóstico Digital em PDF' },
    ],
    productsUsed: [
      'Scanners e Cabos Oficiais Shimano SM-PCE02 / Bosch DiagnosticTool / Mahle Service',
    ],
    recommendations: [
      'Recomendado a cada 6 meses ou antes da compra/venda de uma E-Bike usada.',
    ],
    plusBenefitText: '100% GRATUITO NO RELM PLUS',
    carePriceText: 'R$ 150,00 por diagnóstico (Membros Care Padrão)',
  },
};

// Helper para encontrar os detalhes de oficina pelo nome do serviço
export function getWorkshopServiceDetailsByName(serviceName = '') {
  if (!serviceName) return null;
  const nameLower = serviceName.toLowerCase();

  if (nameLower.includes('limpeza') || nameLower.includes('alta performance')) {
    return WORKSHOP_SERVICE_DETAILS.LIMPEZA_LUBRIFICACAO;
  }
  if (nameLower.includes('revisão standard') || nameLower.includes('standard')) {
    return WORKSHOP_SERVICE_DETAILS.REVISAO_STANDARD;
  }
  if (nameLower.includes('revisão pró') || nameLower.includes('transmissão & direção')) {
    return WORKSHOP_SERVICE_DETAILS.REVISAO_PRO;
  }
  if (nameLower.includes('master full') || nameLower.includes('desmontagem')) {
    return WORKSHOP_SERVICE_DETAILS.REVISAO_MASTER_FULL;
  }
  if (nameLower.includes('sangria') || nameLower.includes('freios hidráulicos')) {
    return WORKSHOP_SERVICE_DETAILS.SANGRIA_FREIOS;
  }
  if (nameLower.includes('pastilhas') || nameLower.includes('rotores')) {
    return WORKSHOP_SERVICE_DETAILS.TROCA_PASTILHAS;
  }
  if (nameLower.includes('conversão') && nameLower.includes('tubeless')) {
    return WORKSHOP_SERVICE_DETAILS.CONVERSAO_TUBELESS;
  }
  if (nameLower.includes('recarga') && nameLower.includes('selante')) {
    return WORKSHOP_SERVICE_DETAILS.RECARGA_TUBELESS;
  }
  if (nameLower.includes('centragem') || nameLower.includes('tensão de raios')) {
    return WORKSHOP_SERVICE_DETAILS.CENTRAGEM_RAIOS;
  }
  if (nameLower.includes('suspensão dianteira') || nameLower.includes('suspensão')) {
    return WORKSHOP_SERVICE_DETAILS.SUSPENSAO_DIANTEIRA;
  }
  if (nameLower.includes('amortecedor traseiro') || nameLower.includes('shock')) {
    return WORKSHOP_SERVICE_DETAILS.SUSPENSAO_TRASEIRA;
  }
  if (nameLower.includes('bike fit') || nameLower.includes('ergonomia')) {
    return WORKSHOP_SERVICE_DETAILS.BIKE_FIT;
  }
  if (nameLower.includes('leva & traz') || nameLower.includes('leva e traz')) {
    return WORKSHOP_SERVICE_DETAILS.LEVA_TRAZ;
  }
  if (nameLower.includes('diagnóstico') || nameLower.includes('e-bike')) {
    return WORKSHOP_SERVICE_DETAILS.DIAGNOSTICO_EBIKE;
  }

  return null;
}
