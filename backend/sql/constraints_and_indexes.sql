-- BrightBuy DB constraints and indexes (MySQL 8.0+)
-- Goal: Enforce referential integrity (PK/FK), add unique constraints, and add
-- indexes to support query patterns and guarantee consistency at the DB layer.
--
-- Notes:
-- - Run on a clean/dev database first to avoid FK conflicts with legacy rows.
-- - In production, validate data quality before adding FKs.
-- - All tables are assumed InnoDB.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Primary keys already exist on all main tables per seed.sql.

-- Bring schema in sync with application code (idempotent column additions)
ALTER TABLE order_items
  ADD COLUMN isBackOrdered TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE payments
  ADD COLUMN paymentIntentId VARCHAR(255) NULL;

ALTER TABLE orders
  ADD COLUMN cancelReason VARCHAR(255) NULL;

-- Unique constraints to prevent duplicate mappings
ALTER TABLE product_categories
  ADD UNIQUE KEY uk_product_categories_product_category (productId, categoryId);

-- Some MySQL versions don't support IF NOT EXISTS with ADD UNIQUE KEY.
-- If your server errors, drop the IF NOT EXISTS above and run this idempotently:
--   CREATE UNIQUE INDEX uk_product_categories_product_category
--     ON product_categories (productId, categoryId);

-- Helpful non-unique indexes (some may be implicit via FKs; adding explicitly is safe)
CREATE INDEX idx_products_name ON products (name);
CREATE INDEX idx_products_brand ON products (brand);

CREATE INDEX idx_product_variants_productId ON product_variants (productId);
CREATE INDEX idx_product_variants_sku ON product_variants (SKU);

CREATE INDEX idx_product_categories_productId ON product_categories (productId);
CREATE INDEX idx_product_categories_categoryId ON product_categories (categoryId);

CREATE INDEX idx_categories_parentId ON categories (parentId);

CREATE INDEX idx_users_role ON users (role);
-- removed: users.addressId no longer exists (addresses link to user)

CREATE INDEX idx_orders_userId ON orders (userId);
CREATE INDEX idx_orders_status ON orders (status);
CREATE INDEX idx_orders_orderDate ON orders (orderDate);
CREATE INDEX idx_orders_deliveryAddressId ON orders (deliveryAddressId);

CREATE INDEX idx_order_items_orderId ON order_items (orderId);
CREATE INDEX idx_order_items_variantId ON order_items (variantId);

CREATE INDEX idx_deliveries_orderId ON deliveries (orderId);
CREATE INDEX idx_deliveries_staffId ON deliveries (staffId);
CREATE INDEX idx_deliveries_status ON deliveries (status);

CREATE INDEX idx_payments_userId ON payments (userId);
CREATE INDEX idx_payments_orderId ON payments (orderId);
CREATE INDEX idx_payments_status ON payments (status);

-- CHECK constraints (MySQL 8.0.16+) for basic domain integrity
ALTER TABLE product_variants
  ADD CONSTRAINT chk_product_variants_stock_nonneg CHECK (stockQnt >= 0),
  ADD CONSTRAINT chk_product_variants_price_nonneg CHECK (price >= 0);

ALTER TABLE order_items
  ADD CONSTRAINT chk_order_items_qty_pos CHECK (quantity > 0),
  ADD CONSTRAINT chk_order_items_price_nonneg CHECK (unitPrice >= 0 AND totalPrice >= 0);

-- Foreign Keys (add where they don't already exist)
-- Note: If you get errors about existing constraints, remove IF NOT EXISTS or adjust names.

-- removed: fk_users_address (users.addressId)

ALTER TABLE categories
  ADD CONSTRAINT fk_categories_parent
    FOREIGN KEY (parentId) REFERENCES categories(id)
    ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE product_variants
  ADD CONSTRAINT fk_product_variants_product
    FOREIGN KEY (productId) REFERENCES products(id)
    ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE product_categories
  ADD CONSTRAINT fk_product_categories_product
    FOREIGN KEY (productId) REFERENCES products(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  ADD CONSTRAINT fk_product_categories_category
    FOREIGN KEY (categoryId) REFERENCES categories(id)
    ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE category_attributes
  ADD CONSTRAINT fk_category_attributes_category
    FOREIGN KEY (categoryId) REFERENCES categories(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  ADD CONSTRAINT fk_category_attributes_attribute
    FOREIGN KEY (attributeId) REFERENCES variant_attributes(id)
    ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE product_variant_options
  ADD CONSTRAINT fk_pvo_variant
    FOREIGN KEY (variantId) REFERENCES product_variants(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  ADD CONSTRAINT fk_pvo_attribute
    FOREIGN KEY (attributeId) REFERENCES variant_attributes(id)
    ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE orders
  ADD CONSTRAINT fk_orders_user
    FOREIGN KEY (userId) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT fk_orders_address
    FOREIGN KEY (deliveryAddressId) REFERENCES addresses(id)
    ON UPDATE CASCADE ON DELETE SET NULL;
  ADD CONSTRAINT chk_delivery_address
    CHECK (deliveryMode = 'Standard Delivery' AND deliveryAddressId IS NOT NULL)
    OR (deliveryMode='Store Pickup' AND deliveryAddressId IS NULL);

ALTER TABLE order_items
  ADD CONSTRAINT fk_order_items_order
    FOREIGN KEY (orderId) REFERENCES orders(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  ADD CONSTRAINT fk_order_items_variant
    FOREIGN KEY (variantId) REFERENCES product_variants(id)
    ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE deliveries
  ADD CONSTRAINT fk_deliveries_order
    FOREIGN KEY (orderId) REFERENCES orders(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  ADD CONSTRAINT fk_deliveries_staff
    FOREIGN KEY (staffId) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE payments
  ADD CONSTRAINT fk_payments_user
    FOREIGN KEY (userId) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT fk_payments_order
    FOREIGN KEY (orderId) REFERENCES orders(id)
    ON UPDATE CASCADE ON DELETE CASCADE;

SET FOREIGN_KEY_CHECKS = 1;

-- End of constraints_and_indexes.sql
