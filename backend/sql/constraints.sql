-- BrightBuy DB constraints (extracted)
SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE order_items
  ADD COLUMN isBackOrdered TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE payments
  ADD COLUMN paymentIntentId VARCHAR(255) NULL;

ALTER TABLE orders
  ADD COLUMN cancelReason VARCHAR(255) NULL;

ALTER TABLE product_categories
  ADD UNIQUE KEY uk_product_categories_product_category (productId, categoryId);

ALTER TABLE product_variants
  ADD CONSTRAINT chk_product_variants_stock_nonneg CHECK (stockQnt >= 0),
  ADD CONSTRAINT chk_product_variants_price_nonneg CHECK (price >= 0);

ALTER TABLE order_items
  ADD CONSTRAINT chk_order_items_qty_pos CHECK (quantity > 0),
  ADD CONSTRAINT chk_order_items_price_nonneg CHECK (unitPrice >= 0 AND totalPrice >= 0);

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

-- End of constraints.sql
