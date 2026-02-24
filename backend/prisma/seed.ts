import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Criar usuário admin se não existir
  const adminEmail = 'admin@relmbikes.com.br';
  
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('Admin@2024', 10);
    
    await prisma.user.create({
      data: {
        name: 'Administrador Relm',
        email: adminEmail,
        passwordHash: hashedPassword,
        role: 'ADMIN_RELM',
        active: true,
      },
    });
    
    console.log('✅ Usuário admin criado com sucesso!');
  } else {
    console.log('ℹ️ Usuário admin já existe.');
  }
}

main()
  .catch((e) => {
    console.error('❌ Erro ao criar usuário admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
