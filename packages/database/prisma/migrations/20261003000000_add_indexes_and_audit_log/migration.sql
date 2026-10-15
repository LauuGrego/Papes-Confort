-- CreateTable
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "entity_id" TEXT,
    "ip" TEXT,
    "user_agent" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "products_base_price_idx" ON "products"("base_price");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "products_discount_percent_idx" ON "products"("discount_percent");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "products_is_active_deleted_at_stock_idx" ON "products"("is_active", "deleted_at", "stock");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "product_images_is_primary_idx" ON "product_images"("is_primary");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "orders_customer_email_idx" ON "orders"("customer_email");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sync_logs_started_at_idx" ON "sync_logs"("started_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "audit_logs_action_created_at_idx" ON "audit_logs"("action", "created_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "audit_logs_user_id_idx" ON "audit_logs"("user_id");
