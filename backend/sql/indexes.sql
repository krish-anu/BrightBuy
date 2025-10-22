-- BrightBuy DB indexes (extracted)
SET NAMES utf8mb4;

CREATE INDEX idx_products_name ON products (name);
CREATE INDEX idx_products_brand ON products (brand);

CREATE INDEX idx_product_variants_productId ON product_variants (productId);
CREATE INDEX idx_product_variants_sku ON product_variants (SKU);

CREATE INDEX idx_product_categories_productId ON product_categories (productId);
CREATE INDEX idx_product_categories_categoryId ON product_categories (categoryId);

CREATE INDEX idx_categories_parentId ON categories (parentId);

CREATE INDEX idx_users_role ON users (role);

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

-- End of indexes.sql
