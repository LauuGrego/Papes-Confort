import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath, override: true });

import { prisma } from '@papes-confort/database';
import { hash } from 'bcryptjs';

async function main() {
  console.log('Restableciendo contraseña de administrador...');
  
  // Buscar el usuario administrador
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN', deletedAt: null },
  });

  if (!admin) {
    console.error('Error: No se encontró ningún usuario con rol ADMIN en la base de datos.');
    process.exit(1);
  }

  console.log(`Usuario encontrado: ${admin.email} (ID: ${admin.id})`);

  // Hashear contraseña "admin"
  const passwordHash = await hash('admin', 12);

  // Actualizar en base de datos
  await prisma.user.update({
    where: { id: admin.id },
    data: { password: passwordHash },
  });

  console.log('Contraseña de administrador restablecida con éxito a "admin"!');
}

main()
  .catch((error) => {
    console.error('Error al restablecer contraseña:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
