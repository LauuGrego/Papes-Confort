import { PrismaClient } from '@papes-confort/database';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

async function runBackup() {
  console.log('Starting programmatic database backup from primary (Supabase) to backup (Railway)...');
  
  const primaryUrl = process.env.DATABASE_URL;
  const backupUrl = process.env.BACKUP_DATABASE_URL;
  
  if (!primaryUrl) {
    console.error('Error: DATABASE_URL (Primary DB) is not defined.');
    process.exit(1);
  }
  
  if (!backupUrl) {
    console.error('Error: BACKUP_DATABASE_URL (Backup DB) is not defined.');
    process.exit(1);
  }

  // Initialize clients
  const primaryPrisma = new PrismaClient({
    datasources: { db: { url: primaryUrl } },
  });
  
  const backupPrisma = new PrismaClient({
    datasources: { db: { url: backupUrl } },
  });

  try {
    console.log('  Ensuring database schema exists on backup database...');
    // We execute prisma db push using backupUrl as the database connection URL
    const { stdout, stderr } = await execPromise('npx prisma db push --accept-data-loss --skip-generate --schema ../../packages/database/prisma/schema.prisma', {
      env: {
        ...process.env,
        DATABASE_URL: backupUrl,
        DIRECT_URL: backupUrl,
      }
    });
    if (stdout) console.log(`    Prisma DB Push: ${stdout.trim()}`);
    if (stderr) console.warn(`    Prisma DB Push warnings:\n${stderr}`);

    console.log('  Connecting to databases...');
    await primaryPrisma.$connect();
    await backupPrisma.$connect();

    console.log('  Starting data migration transaction...');
    await backupPrisma.$transaction(async (tx) => {
      // Temporarily disable foreign keys and triggers on backup database
      console.log('    Disabling foreign key constraints...');
      await tx.$executeRawUnsafe("SET session_replication_role = 'replica';");

      // Table copying helper
      const copyTable = async (tableName: string, txModel: any, primaryModel: any) => {
        console.log(`    Processing table "${tableName}"...`);
        console.log(`      Clearing old data from backup table...`);
        await txModel.deleteMany();

        console.log(`      Fetching data from primary table...`);
        const data = await primaryModel.findMany();
        console.log(`      Found ${data.length} records.`);

        if (data.length > 0) {
          console.log(`      Inserting ${data.length} records into backup table...`);
          // We batch the insertions in chunks of 500 to prevent database query size limits
          const chunkSize = 500;
          for (let i = 0; i < data.length; i += chunkSize) {
            const chunk = data.slice(i, i + chunkSize);
            await txModel.createMany({ data: chunk });
          }
        }
      };

      // Copy all tables
      await copyTable('users', tx.user, primaryPrisma.user);
      await copyTable('brands', tx.brand, primaryPrisma.brand);
      await copyTable('product_types', tx.productFamily, primaryPrisma.productFamily);
      await copyTable('product_categories', tx.productCategory, primaryPrisma.productCategory);
      await copyTable('products', tx.product, primaryPrisma.product);
      await copyTable('product_images', tx.productImage, primaryPrisma.productImage);
      await copyTable('tags', tx.tag, primaryPrisma.tag);
      await copyTable('product_tags', tx.productTag, primaryPrisma.productTag);
      await copyTable('bank_accounts', tx.bankAccount, primaryPrisma.bankAccount);
      await copyTable('bank_promotions', tx.bankPromotion, primaryPrisma.bankPromotion);
      await copyTable('customers', tx.customer, primaryPrisma.customer);
      await copyTable('orders', tx.order, primaryPrisma.order);
      await copyTable('order_items', tx.orderItem, primaryPrisma.orderItem);
      await copyTable('carts', tx.cart, primaryPrisma.cart);
      await copyTable('cart_items', tx.cartItem, primaryPrisma.cartItem);
      await copyTable('warranties', tx.warranty, primaryPrisma.warranty);
      await copyTable('settings', tx.setting, primaryPrisma.setting);
      await copyTable('sync_logs', tx.syncLog, primaryPrisma.syncLog);
      await copyTable('offers', tx.offer, primaryPrisma.offer);
      await copyTable('offer_products', tx.offerProduct, primaryPrisma.offerProduct);

      // Restore foreign keys and triggers
      console.log('    Restoring foreign key constraints...');
      await tx.$executeRawUnsafe("SET session_replication_role = 'origin';");
    }, {
      timeout: 120000 // 2 minutes timeout for safety
    });

    console.log('Database backup completed successfully!');
  } catch (error: any) {
    console.error('Critical error during database backup:', error.message || error);
    try {
      // Attempt to reset session_replication_role just in case
      await backupPrisma.$executeRawUnsafe("SET session_replication_role = 'origin';").catch(() => {});
    } catch {}
    process.exit(1);
  } finally {
    await primaryPrisma.$disconnect();
    await backupPrisma.$disconnect();
  }
}

runBackup();
