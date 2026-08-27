-- AlterTable
ALTER TABLE "carts" ADD COLUMN "customer_id" TEXT;

-- AlterTable
ALTER TABLE "customers" ADD COLUMN "cuil_cuit" TEXT,
ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "marketing_opt_in" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "password" TEXT NOT NULL DEFAULT '',
ADD COLUMN "password_changed_at" TIMESTAMP(3),
ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "carts_customer_id_idx" ON "carts"("customer_id");

-- CreateIndex
CREATE INDEX "customers_cuil_cuit_idx" ON "customers"("cuil_cuit");

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
