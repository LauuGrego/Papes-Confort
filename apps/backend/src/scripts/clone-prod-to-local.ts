import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

async function cloneProdToLocal() {
  console.log('=== Iniciando clonación de Base de Datos Producción -> Local ===\n');

  const envPath = path.resolve(__dirname, '../../.env');
  const envContent = fs.readFileSync(envPath, 'utf8');

  // Buscar URL de producción (comentada como # DATABASE_URL=... o PROD_DATABASE_URL)
  let prodUrl = process.env.PROD_DATABASE_URL;
  if (!prodUrl) {
    const line = envContent
      .split('\n')
      .find((l) => l.trim().startsWith('# DATABASE_URL=') || l.trim().startsWith('#DATABASE_URL='));
    if (line) {
      prodUrl = line.replace(/^#\s*DATABASE_URL=/, '').trim();
    }
  }

  const localUrl =
    process.env.LOCAL_DATABASE_URL ||
    'postgresql://postgres:postgres@127.0.0.1:5433/papes_confort?schema=public';

  if (!prodUrl) {
    console.error('Error: No se encontró la URL de producción (Supabase) en .env');
    process.exit(1);
  }

  console.log(`[ORIGEN  PRODUCCIÓN] : ${prodUrl.split('@')[1]?.split('?')[0] || 'remoto'}`);
  console.log(`[DESTINO LOCAL DOCKER]: ${localUrl.split('@')[1] || localUrl}\n`);

  const prodPrisma = new PrismaClient({
    datasources: { db: { url: prodUrl } },
  });

  const localPrisma = new PrismaClient({
    datasources: { db: { url: localUrl } },
  });

  try {
    console.log('Conectando con ambas bases de datos...');
    await prodPrisma.$connect();
    await localPrisma.$connect();
    console.log('Conexión exitosa.\n');

    // Desactivar temporalmente constraints en la base local para volcar datos
    console.log('Desactivando foreign keys en base de datos local...');
    await localPrisma.$executeRawUnsafe("SET session_replication_role = 'replica';");

    const copyTable = async (
      tableName: string,
      prodModel: any,
      localModel: any,
      transformFn?: (record: any) => any
    ) => {
      process.stdout.write(`  Copiando "${tableName}"... `);

      // Limpiar datos existentes en local
      await localModel.deleteMany({});

      // Leer registros desde producción
      const records = await prodModel.findMany({});

      if (records.length === 0) {
        console.log(`0 registros.`);
        return;
      }

      // Preparar datos si hay transformación
      const toInsert = transformFn ? records.map(transformFn) : records;

      // Insertar por lotes de 500
      const chunkSize = 500;
      for (let i = 0; i < toInsert.length; i += chunkSize) {
        const chunk = toInsert.slice(i, i + chunkSize);
        await localModel.createMany({ data: chunk });
      }

      console.log(`✓ ${records.length} registros copiados.`);
    };

    // Copiar tablas en orden
    await copyTable('users', prodPrisma.user, localPrisma.user);
    await copyTable('brands', prodPrisma.brand, localPrisma.brand);
    await copyTable('product_types', prodPrisma.productFamily, localPrisma.productFamily);
    await copyTable('product_categories', prodPrisma.productCategory, localPrisma.productCategory);
    await copyTable('products', prodPrisma.product, localPrisma.product);
    await copyTable('product_images', prodPrisma.productImage, localPrisma.productImage);
    await copyTable('tags', prodPrisma.tag, localPrisma.tag);
    await copyTable('product_tags', prodPrisma.productTag, localPrisma.productTag);
    await copyTable('bank_accounts', prodPrisma.bankAccount, localPrisma.bankAccount);
    await copyTable('bank_promotions', prodPrisma.bankPromotion, localPrisma.bankPromotion);
    await copyTable('customers', prodPrisma.customer, localPrisma.customer);

    // Orders: usar queryRawUnsafe para soportar esquema de producción previo a la migración
    process.stdout.write(`  Copiando "orders"... `);
    await localPrisma.order.deleteMany({});
    const prodOrders: any[] = await prodPrisma.$queryRawUnsafe('SELECT * FROM orders;');
    if (prodOrders.length > 0) {
      const ordersToInsert = prodOrders.map((o) => ({
        id: o.id,
        orderNumber: o.order_number,
        customerId: o.customer_id ?? null,
        status: o.status,
        paymentMethod: o.payment_method,
        subtotal: o.subtotal,
        shippingCost: o.shipping_cost ?? 0,
        bankDiscount: o.bank_discount ?? 0,
        total: o.total,
        shippingType: o.shipping_type,
        customerEmail: o.customer_email,
        customerName: o.customer_name,
        customerPhone: o.customer_phone ?? null,
        shippingAddress: o.shipping_address,
        shippingCity: o.shipping_city,
        shippingPostalCode: o.shipping_postal_code,
        notes: o.notes ?? null,
        gatewayPaymentId: o.gateway_payment_id ?? o.payment_id ?? null,
        gatewayCheckoutId: o.gateway_checkout_id ?? null,
        paymentUrl: o.payment_url ?? null,
        installmentsCount: o.installments_count ?? null,
        paymentStatus: o.payment_status ?? null,
        gatewayExpiresAt: o.gateway_expires_at ?? null,
        cancelledAt: o.cancelled_at ?? null,
        bankAccountId: o.bank_account_id ?? null,
        transferConfirmedAt: o.transfer_confirmed_at ?? null,
        transferConfirmedById: o.transfer_confirmed_by ?? null,
        notificationSentAt: o.notification_sent_at ?? null,
        createdAt: o.created_at,
        updatedAt: o.updated_at,
        deletedAt: o.deleted_at ?? null,
      }));
      await localPrisma.order.createMany({ data: ordersToInsert });
    }
    console.log(`✓ ${prodOrders.length} registros copiados.`);

    // Order items: usar queryRawUnsafe
    process.stdout.write(`  Copiando "order_items"... `);
    await localPrisma.orderItem.deleteMany({});
    const prodOrderItems: any[] = await prodPrisma.$queryRawUnsafe('SELECT * FROM order_items;');
    if (prodOrderItems.length > 0) {
      const itemsToInsert = prodOrderItems.map((i) => ({
        id: i.id,
        orderId: i.order_id,
        productId: i.product_id,
        quantity: i.quantity,
        unitPrice: i.unit_price,
        discount: i.discount ?? 0,
        total: i.total,
        productNameSnapshot: i.product_name_snapshot ?? i.product_name ?? 'Producto',
        skuSnapshot: i.sku_snapshot ?? i.sku ?? 'S/SKU',
      }));
      await localPrisma.orderItem.createMany({ data: itemsToInsert });
    }
    console.log(`✓ ${prodOrderItems.length} registros copiados.`);

    await copyTable('carts', prodPrisma.cart, localPrisma.cart);
    await copyTable('cart_items', prodPrisma.cartItem, localPrisma.cartItem);
    await copyTable('warranties', prodPrisma.warranty, localPrisma.warranty);
    await copyTable('settings', prodPrisma.setting, localPrisma.setting);
    await copyTable('sync_logs', prodPrisma.syncLog, localPrisma.syncLog);
    await copyTable('offers', prodPrisma.offer, localPrisma.offer);
    await copyTable('offer_products', prodPrisma.offerProduct, localPrisma.offerProduct);

    // Reactivar foreign keys en base de datos local
    console.log('\nReactivando foreign keys en base de datos local...');
    await localPrisma.$executeRawUnsafe("SET session_replication_role = 'origin';");

    console.log('\n🎉 ¡Clonación de producción a local completada con total éxito!');
  } catch (err: any) {
    console.error('\n❌ Error durante la clonación:', err.message || err);
    try {
      await localPrisma.$executeRawUnsafe("SET session_replication_role = 'origin';");
    } catch {}
    process.exit(1);
  } finally {
    await prodPrisma.$disconnect();
    await localPrisma.$disconnect();
  }
}

cloneProdToLocal();
