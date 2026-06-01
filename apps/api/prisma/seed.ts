import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

// Use string literals — Role enum may not be generated yet at seed time
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const adminHash = await argon2.hash('admin123');
  const empHash   = await argon2.hash('123456');

  const admin = await prisma.employee.upsert({
    where:  { email: 'admin@academia.com' },
    update: {},
    create: {
      name:         'Administrador',
      email:        'admin@academia.com',
      passwordHash: adminHash,
      role:         'ADMIN',
    },
  });

  const joao = await prisma.employee.upsert({
    where:  { email: 'joao@academia.com' },
    update: {},
    create: {
      name:         'João Silva',
      email:        'joao@academia.com',
      passwordHash: empHash,
      role:         'EMPLOYEE',
    },
  });

  const maria = await prisma.employee.upsert({
    where:  { email: 'maria@academia.com' },
    update: {},
    create: {
      name:         'Maria Santos',
      email:        'maria@academia.com',
      passwordHash: empHash,
      role:         'EMPLOYEE',
    },
  });

  for (const emp of [joao, maria]) {
    const existing = await prisma.workSchedule.findFirst({
      where: { employeeId: emp.id, active: true },
    });
    if (!existing) {
      await prisma.workSchedule.create({
        data: {
          employeeId:    emp.id,
          expectedStart: '08:00',
          expectedEnd:   '17:00',
          breakMinutes:  60,
          weekdays:      [1, 2, 3, 4, 5],
        },
      });
    }
  }

  console.log('✅ Seed concluído!');
  console.log('   admin@academia.com  / admin123');
  console.log('   joao@academia.com   / 123456');
  console.log('   maria@academia.com  / 123456');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
