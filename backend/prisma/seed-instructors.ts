import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

/**
 * Seed de instrutores FICTÍCIOS para teste do plano 012.
 *
 * Rodar: `npx ts-node prisma/seed-instructors.ts` de dentro de `backend/`.
 *
 * Idempotente: pode rodar quantas vezes quiser. Só cria dados de teste —
 * e-mails `@relm.test` e nomes com "(teste)" — para dar para limpar depois com
 * um único filtro. NÃO cria usuário administrativo: se este arquivo rodar por
 * acidente em produção, o pior caso é um instrutor de teste na lista, não uma
 * conta com acesso ao painel da Relm.
 */
const prisma = new PrismaClient();

const SENHA_TESTE = 'Instrutor@2026';

const ESPECIALIDADES = [
  'Treino de estrada',
  'Mountain bike',
  'Triatlo',
  'Preparação para provas',
  'Análise de potência',
];

async function main() {
  console.log('🚴 Semeando instrutores fictícios (plano 012)...');

  // 1) Especialidades — `name` é único, então upsert por nome.
  const especialidades = [];
  for (const name of ESPECIALIDADES) {
    especialidades.push(
      await prisma.instructorSpecialty.upsert({
        where: { name },
        update: { active: true },
        create: { name },
      }),
    );
  }
  console.log(`   ✓ ${especialidades.length} especialidades`);

  // 2) Dois instrutores: um presencial e um remoto. O segundo existe para
  //    provar o isolamento — instrutor A não pode consultar credencial de B.
  const perfis = [
    {
      name: 'Assessoria Pedal Forte (teste)',
      email: 'pedalforte@relm.test',
      userName: 'Carla — Pedal Forte',
      description:
        'Assessoria esportiva com acompanhamento semanal de treinos e análise de dados de potência.',
      benefit: '5% de desconto na mensalidade',
      benefitPlus: '15% de desconto na mensalidade',
      phone: '11912340001',
      link: 'https://instagram.com/pedalforte.teste',
      city: 'São Paulo',
      state: 'SP',
      remote: false,
      specialties: ['Treino de estrada', 'Preparação para provas', 'Análise de potência'],
    },
    {
      name: 'Coach Trilha Livre (teste)',
      email: 'trilhalivre@relm.test',
      userName: 'Rafa — Trilha Livre',
      description: 'Treinamento remoto para MTB e provas de longa distância.',
      benefit: '8% de desconto no plano trimestral',
      benefitPlus: '20% de desconto no plano trimestral',
      phone: '31912340002',
      link: null,
      city: 'Belo Horizonte',
      state: 'MG',
      remote: true,
      specialties: ['Mountain bike', 'Triatlo'],
    },
  ];

  const passwordHash = await bcrypt.hash(SENHA_TESTE, 10);

  for (const perfil of perfis) {
    const specialtyIds = especialidades
      .filter((e) => perfil.specialties.includes(e.name))
      .map((e) => ({ id: e.id }));

    // `name` não é único no schema, então procura antes em vez de upsert.
    const existente = await prisma.instructor.findFirst({ where: { name: perfil.name } });

    const instructor = existente
      ? await prisma.instructor.update({
          where: { id: existente.id },
          data: {
            description: perfil.description,
            benefit: perfil.benefit,
            benefitPlus: perfil.benefitPlus,
            phone: perfil.phone,
            link: perfil.link,
            city: perfil.city,
            state: perfil.state,
            remote: perfil.remote,
            active: true,
            specialties: { set: specialtyIds },
          },
        })
      : await prisma.instructor.create({
          data: {
            name: perfil.name,
            description: perfil.description,
            benefit: perfil.benefit,
            benefitPlus: perfil.benefitPlus,
            phone: perfil.phone,
            link: perfil.link,
            city: perfil.city,
            state: perfil.state,
            remote: perfil.remote,
            specialties: { connect: specialtyIds },
          },
        });

    // Login do instrutor. `instructorId` é obrigatório para a role INSTRUTOR:
    // sem ele a conta loga e o painel responde erro em todo endpoint.
    await prisma.user.upsert({
      where: { email: perfil.email },
      update: {
        passwordHash,
        role: 'INSTRUTOR',
        instructorId: instructor.id,
        active: true,
      },
      create: {
        name: perfil.userName,
        email: perfil.email,
        passwordHash,
        role: 'INSTRUTOR',
        instructorId: instructor.id,
        active: true,
      },
    });

    console.log(
      `   ✓ ${perfil.name} — login ${perfil.email} (${
        perfil.remote ? 'online' : `${perfil.city}/${perfil.state}`
      })`,
    );
  }

  console.log(`\n   Senha dos dois logins: ${SENHA_TESTE}`);
  console.log('   Termo de aceite: pendente de propósito — o painel deve barrar até o aceite.');
  console.log('   Para limpar: instrutores com "(teste)" no nome e usuários @relm.test.');
}

main()
  .catch((e) => {
    console.error('❌ Falhou:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
