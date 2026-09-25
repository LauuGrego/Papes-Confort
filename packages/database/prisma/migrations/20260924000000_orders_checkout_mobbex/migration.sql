-- DropIndex
DROP INDEX IF EXISTS "orders_mercadopago_payment_id_idx";

-- DropIndex
DROP INDEX IF EXISTS "orders_mercadopago_payment_id_key";

-- AlterTable
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "avatar_url" TEXT,
ADD COLUMN IF NOT EXISTS "google_id" TEXT,
ALTER COLUMN "password" DROP NOT NULL,
ALTER COLUMN "password" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "orders" DROP COLUMN IF EXISTS "mercadopago_payment_id",
ADD COLUMN IF NOT EXISTS "cancelled_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "gateway_checkout_id" TEXT,
ADD COLUMN IF NOT EXISTS "gateway_payment_id" TEXT,
ADD COLUMN IF NOT EXISTS "installments_count" INTEGER,
ADD COLUMN IF NOT EXISTS "payment_status" TEXT,
ADD COLUMN IF NOT EXISTS "payment_url" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "customers_google_id_key" ON "customers"("google_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "customers_google_id_idx" ON "customers"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "orders_gateway_payment_id_key" ON "orders"("gateway_payment_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "orders_gateway_checkout_id_key" ON "orders"("gateway_checkout_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "orders_paymentMethod_idx" ON "orders"("paymentMethod");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "orders_created_at_idx" ON "orders"("created_at");
