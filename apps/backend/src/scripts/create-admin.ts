import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath, override: false });

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

async function main() {
  const dbUrl = process.env.TARGET_DB_URL || process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL no está definida.');
  }

  console.log(`[CREATING ADMIN] Email: lautarogrego@gmail.com`);
  console.log(`[TARGET DB]: ${dbUrl.split('@')[1] || dbUrl}`);

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });

  try {
    const email = 'lautarogrego@gmail.com';
    const plainPassword = '121103grego';
    const name = 'Lautaro Grego';

    const hashedPassword = await hash(plainPassword, 12);

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const updated = await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          role: 'ADMIN',
          isActive: true,
        },
      });
      console.log(`[SUCCESS] Usuario existente actualizado a ADMIN en la BDD. ID: ${updated.id}`);
    } else {
      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: 'ADMIN',
          isActive: true,
        },
      });
      console.log(`[SUCCESS] Nuevo usuario ADMIN creado con éxito en la BDD. ID: ${newUser.id}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('[ERROR]', error);
  process.exit(1);
});
