import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

const PROD_URL = "postgresql://postgres.rqifmdlvednxdynboiup:Grego.121103.@aws-0-us-east-1.pooler.supabase.com:5432/postgres";
const LOCAL_URL = "postgresql://postgres:postgres@127.0.0.1:5433/papes_confort";

async function main() {
  console.log('Iniciando copia de base de datos de Producción (Supabase) a Local...');

  // 1. Sincronizar esquema local
  console.log('  Sincronizando esquema en base de datos local...');
  try {
    const { stdout, stderr } = await execPromise('npx prisma db push --accept-data-loss --skip-generate', {
      env: {
        ...process.env,
        DATABASE_URL: LOCAL_URL,
        DIRECT_URL: LOCAL_URL,
      }
    });
    if (stdout) console.log(`    Prisma DB Push: ${stdout.trim()}`);
    if (stderr) console.warn(`    Prisma DB Push warnings:\n${stderr}`);
  } catch (error: any) {
    console.error('Error al sincronizar el esquema en local:', error.message || error);
    process.exit(1);
  }

  // 2. Inicializar clientes Prisma
  const prodPrisma = new PrismaClient({
    datasources: { db: { url: PROD_URL } },
  });

  const localPrisma = new PrismaClient({
    datasources: { db: { url: LOCAL_URL } },
  });

  try {
    await prodPrisma.$connect();
    await localPrisma.$connect();
    console.log('  Conectado con éxito a ambas bases de datos.');

    console.log('  Iniciando transacción de copia de datos...');
    await localPrisma.$transaction(async (tx) => {
      // Desactivar temporalmente restricciones de claves foráneas
      console.log('    Desactivando restricciones de claves foráneas...');
      await tx.$executeRawUnsafe("SET session_replication_role = 'replica';");

      const copyTable = async (tableName: string, txModel: any, prodModel: any) => {
        console.log(`    Copiando tabla "${tableName}"...`);
        console.log(`      Limpiando datos antiguos en local...`);
        await txModel.deleteMany();

        console.log(`      Obteniendo datos de producción...`);
        const data = await prodModel.findMany();
        console.log(`      Encontrados ${data.length} registros.`);

        if (data.length > 0) {
          console.log(`      Insertando ${data.length} registros en local...`);
          const chunkSize = 200; // tamaño de lote seguro
          for (let i = 0; i < data.length; i += chunkSize) {
            const chunk = data.slice(i, i + chunkSize);
            await txModel.createMany({ data: chunk });
          }
        }
      };

      // Copiar tablas una por una
      await copyTable('users', tx.user, prodPrisma.user);
      await copyTable('brands', tx.brand, prodPrisma.brand);
      await copyTable('product_types', tx.productFamily, prodPrisma.productFamily);
      await copyTable('product_categories', tx.productCategory, prodPrisma.productCategory);
      await copyTable('products', tx.product, prodPrisma.product);
      await copyTable('product_images', tx.productImage, prodPrisma.productImage);
      await copyTable('tags', tx.tag, prodPrisma.tag);
      await copyTable('product_tags', tx.productTag, prodPrisma.productTag);
      await copyTable('bank_accounts', tx.bankAccount, prodPrisma.bankAccount);
      await copyTable('bank_promotions', tx.bankPromotion, prodPrisma.bankPromotion);
      await copyTable('customers', tx.customer, prodPrisma.customer);
      await copyTable('orders', tx.order, prodPrisma.order);
      await copyTable('order_items', tx.orderItem, prodPrisma.orderItem);
      await copyTable('carts', tx.cart, prodPrisma.cart);
      await copyTable('cart_items', tx.cartItem, prodPrisma.cartItem);
      await copyTable('warranties', tx.warranty, prodPrisma.warranty);
      await copyTable('settings', tx.setting, prodPrisma.setting);
      await copyTable('sync_logs', tx.syncLog, prodPrisma.syncLog);
      await copyTable('offers', tx.offer, prodPrisma.offer);
      await copyTable('offer_products', tx.offerProduct, prodPrisma.offerProduct);

      console.log('    Restaurando restricciones de claves foráneas...');
      await tx.$executeRawUnsafe("SET session_replication_role = 'origin';");
    }, {
      timeout: 180000 // 3 minutos
    });

    console.log('Copia de base de datos de Producción a Local completada con éxito!');
  } catch (error: any) {
    console.error('Error crítico durante la copia:', error.message || error);
    try {
      await localPrisma.$executeRawUnsafe("SET session_replication_role = 'origin';").catch(() => {});
    } catch {}
    process.exit(1);
  } finally {
    await prodPrisma.$disconnect();
    await localPrisma.$disconnect();
  }
}

main();
