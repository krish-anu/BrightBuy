-- Simple seed file with essential data for testing

-- 1. Cities table
CREATE TABLE IF NOT EXISTS cities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  isMainCategory BOOLEAN DEFAULT FALSE
) ENGINE=InnoDB; 

-- 2. Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  email VARCHAR(200) NOT NULL UNIQUE,
  role ENUM('Admin','Customer','WarehouseStaff','DeliveryStaff',"SuperAdmin") NOT NULL DEFAULT 'Customer',
  password VARCHAR(255) NOT NULL,
  role_accepted BOOLEAN DEFAULT FALSE, 
  phone VARCHAR(15) NULL,
  address JSON NULL,
  cityId INT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_city FOREIGN KEY (cityId) REFERENCES cities(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB;

-- insert into users (email,password,name,role) VALUES(
-- 'anu@gmail.com','anu','Anu','Admin'
-- );

-- 3. Categories table
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  parentId INT NULL,
  isMainCategory BOOLEAN DEFAULT FALSE,
  CONSTRAINT fk_category_parent
    FOREIGN KEY (parentId) REFERENCES categories(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  INDEX idx_parentId (parentId)
) ENGINE=InnoDB;

-- 4. Products table
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL UNIQUE,
  description TEXT NULL,
  brand VARCHAR(100) NULL,
  INDEX idx_brand (brand)
) ENGINE=InnoDB;

-- 5. Variant Attributes table
CREATE TABLE IF NOT EXISTS variant_attributes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- 6. Product Variants table
CREATE TABLE IF NOT EXISTS product_variants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  productId INT NOT NULL,
  variantName VARCHAR(200) NOT NULL,
  SKU VARCHAR(100) NOT NULL UNIQUE,
  stockQnt INT NOT NULL DEFAULT 1 CHECK (stockQnt >= 0),
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  imageURL VARCHAR(255) NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_productvariants_product FOREIGN KEY (productId) REFERENCES products(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 7. Product Variant Options table
CREATE TABLE IF NOT EXISTS product_variant_options (
  id INT AUTO_INCREMENT PRIMARY KEY,
  variantId INT NOT NULL,
  attributeId INT NOT NULL,
  value VARCHAR(200) NOT NULL,
  CONSTRAINT fk_variantoptions_variant FOREIGN KEY (variantId) REFERENCES product_variants(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_variantoptions_attribute FOREIGN KEY (attributeId) REFERENCES variant_attributes(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 8. Product Categories table 
CREATE TABLE IF NOT EXISTS product_categories (
  productId INT NOT NULL,
  categoryId INT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_productcategories_product FOREIGN KEY (productId) REFERENCES products(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_productcategories_category FOREIGN KEY (categoryId) REFERENCES categories(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  UNIQUE KEY uq_product_category (productId, categoryId)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS category_attributes (
  categoryId INT NOT NULL,
  attributeId INT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_categoryattributes_attribute FOREIGN KEY (attributeId) REFERENCES variant_attributes(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_categoryattributes_category FOREIGN KEY (categoryId) REFERENCES categories(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  UNIQUE KEY uq_category_attribute (categoryId,attributeId)
) ENGINE=InnoDB;

-- 9. Orders table 
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  orderDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  totalPrice DECIMAL(10,2) NOT NULL CHECK (totalPrice >= 0),
  deliveryMode ENUM('Store Pickup', 'Standard Delivery') NOT NULL,
  deliveryAddress JSON NULL,
  deliveryCharge DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (deliveryCharge >= 0),
  estimatedDeliveryDate DATETIME NULL DEFAULT NULL,
  status ENUM('Pending','Confirmed','Shipped','Delivered','Cancelled') NOT NULL DEFAULT 'Pending',
  paymentMethod ENUM('Card','CashOnDelivery') NOT NULL,
  cancelReason ENUM('PaymentFailed','Expired','UserCancelled') NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_orderDate (orderDate),
  INDEX idx_status (status),
  CONSTRAINT fk_orders_user FOREIGN KEY (userId) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 10. Order Items table
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  orderId INT NOT NULL,
  variantId INT NULL,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  unitPrice DECIMAL(10,2) NOT NULL CHECK (unitPrice >= 0),
  totalPrice DECIMAL(10,2) NOT NULL CHECK (totalPrice >= 0),
  isBackOrdered BOOLEAN DEFAULT FALSE,
  CONSTRAINT fk_orderitems_order FOREIGN KEY (orderId) REFERENCES orders(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_orderitems_variant FOREIGN KEY (variantId) REFERENCES product_variants(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Insert Main Categories
INSERT INTO categories (name, isMainCategory, parentId) VALUES
('Mobiles & Tablets', TRUE, NULL),
('Laptops & Computers', TRUE, NULL),
('Audio Devices', TRUE, NULL),
('Cameras & Photography', TRUE, NULL),
('Home Appliances', TRUE, NULL),
('Wearable & Smart Devices', TRUE, NULL),
('Power & Charging', TRUE, NULL),
('Personal Care & Health', TRUE, NULL),
('Security & Safety', TRUE, NULL),
('Toys & Gadgets', TRUE, NULL);

-- Insert 25 Products per Category (250 total)
-- Mobiles & Tablets (25 products)
INSERT INTO products (name, description, brand) VALUES
('Samsung Galaxy S25 Ultra', 'Flagship smartphone with AI camera', 'Samsung'),
('iPhone 17 Pro Max', 'Premium iPhone with A19 chip', 'Apple'),
('Google Pixel 10 Pro', 'AI-powered smartphone with Tensor G4', 'Google'),
('OnePlus 13 Pro', 'High-performance 5G smartphone', 'OnePlus'),
('Xiaomi 15 Ultra', 'Photography-focused flagship phone', 'Xiaomi'),
('Oppo Find X8 Pro', 'Foldable smartphone with 5G', 'Oppo'),
('Vivo X200 Pro', 'Camera-centric smartphone', 'Vivo'),
('Realme GT 6 Pro', 'Gaming smartphone with fast charging', 'Realme'),
('Motorola Edge 60', 'Curved display smartphone', 'Motorola'),
('Nokia X60 5G', 'Durable 5G smartphone', 'Nokia'),
('Samsung Galaxy A85', 'Mid-range smartphone', 'Samsung'),
('iPhone 17 Mini Pro', 'Compact premium iPhone with Pro features', 'Apple'),
('Google Pixel 10a Lite', 'Budget Pixel with AI features', 'Google'),
('OnePlus Nord 7 Plus', 'Premium mid-range phone', 'OnePlus'),
('Xiaomi Redmi Note 15', 'Value smartphone', 'Xiaomi'),
('Oppo Reno 13', 'Stylish mid-range phone', 'Oppo'),
('Vivo Y300', 'Affordable smartphone', 'Vivo'),
('Realme 14 Pro', 'Performance mid-range phone', 'Realme'),
('Motorola Moto G85', 'Clean Android experience', 'Motorola'),
('Nokia G70', 'Long-lasting smartphone', 'Nokia'),
('Samsung Galaxy Tab S10', 'Premium Android tablet', 'Samsung'),
('iPad Pro 13-inch M4 Max', 'Professional tablet', 'Apple'),
('Microsoft Surface Pro 11', 'Windows tablet/laptop', 'Microsoft'),
('Lenovo Tab P12 Pro', 'Entertainment tablet', 'Lenovo'),
('Huawei MatePad Pro 13', 'Creative tablet', 'Huawei');

INSERT INTO product_variants (productId, variantName, SKU, stockQnt, price, imageURL) VALUES
(1, 'Galaxy S25 Ultra 512GB', 'SAM-MOB-001', 100, 1299.99, NULL),
(2, 'iPhone 17 Pro Max 256GB', 'APP-MOB-002', 80, 1399.99, NULL),
(3, 'Pixel 10 Pro 128GB', 'GOO-MOB-003', 90, 999.99, NULL),
(4, 'OnePlus 13 Pro 256GB', 'ONE-MOB-004', 120, 899.99, NULL),
(5, 'Xiaomi 15 Ultra 512GB', 'XIA-MOB-005', 110, 849.99, NULL),
(6, 'Oppo Find X8 Pro 256GB', 'OPP-MOB-006', 100, 899.99, NULL),
(7, 'Vivo X200 Pro 256GB', 'VIV-MOB-007', 95, 799.99, NULL),
(8, 'Realme GT 6 Pro 256GB', 'REA-MOB-008', 150, 599.99, NULL),
(9, 'Motorola Edge 60 128GB', 'MOT-MOB-009', 130, 649.99, NULL),
(10, 'Nokia X60 5G 128GB', 'NOK-MOB-010', 140, 549.99, NULL),
(11, 'Galaxy A85 128GB', 'SAM-MOB-011', 200, 399.99, NULL),
(12, 'iPhone 17 Mini Pro 128GB', 'APP-MOB-012', 150, 799.99, NULL),
(13, 'Pixel 10a Lite 128GB', 'GOO-MOB-013', 180, 449.99, NULL),
(14, 'OnePlus Nord 7 Plus 256GB', 'ONE-MOB-014', 160, 549.99, NULL),
(15, 'Redmi Note 15 128GB', 'XIA-MOB-015', 220, 299.99, NULL),
(16, 'Oppo Reno 13 256GB', 'OPP-MOB-016', 170, 599.99, NULL),
(17, 'Vivo Y300 128GB', 'VIV-MOB-017', 190, 349.99, NULL),
(18, 'Realme 14 Pro 256GB', 'REA-MOB-018', 180, 499.99, NULL),
(19, 'Moto G85 128GB', 'MOT-MOB-019', 200, 379.99, NULL),
(20, 'Nokia G70 128GB', 'NOK-MOB-020', 210, 329.99, NULL),
(21, 'Galaxy Tab S10 256GB', 'SAM-TAB-021', 80, 899.99, NULL),
(22, 'iPad Pro 13" M4 Max 512GB', 'APP-TAB-022', 60, 1299.99, NULL),
(23, 'Surface Pro 11 512GB', 'MIC-TAB-023', 70, 1199.99, NULL),
(24, 'Tab P12 Pro 256GB', 'LEN-TAB-024', 90, 699.99, NULL),
(25, 'MatePad Pro 13 256GB', 'HUA-TAB-025', 85, 799.99, NULL);

INSERT INTO product_categories (productId, categoryId) VALUES
(1, 1), (2, 1), (3, 1), (4, 1), (5, 1), (6, 1), (7, 1), (8, 1), (9, 1), (10, 1),
(11, 1), (12, 1), (13, 1), (14, 1), (15, 1), (16, 1), (17, 1), (18, 1), (19, 1), (20, 1),
(21, 1), (22, 1), (23, 1), (24, 1), (25, 1);

-- Audio Devices (25 products) - IDs 26-50
INSERT INTO products (name, description, brand) VALUES
('Sony WH-1000XM6', 'Premium noise-canceling headphones', 'Sony'),
('AirPods Pro 3rd Gen', 'Apple wireless earbuds with ANC', 'Apple'),
('Bose QuietComfort Earbuds', 'Premium wireless earbuds', 'Bose'),
('Sennheiser Momentum 4', 'Audiophile wireless headphones', 'Sennheiser'),
('JBL Live Pro 3', 'True wireless earbuds', 'JBL'),
('Samsung Galaxy Buds3', 'Samsung wireless earbuds', 'Samsung'),
('Beats Studio Pro 2', 'Wireless over-ear headphones', 'Beats'),
('Audio-Technica ATH-M50xBT3', 'Professional monitor headphones', 'Audio-Technica'),
('Jabra Elite 85t', 'Business wireless earbuds', 'Jabra'),
('1MORE ComfoBuds Pro 2', 'Comfortable earbuds with ANC', '1MORE'),
('Marshall Major V', 'Iconic rock headphones', 'Marshall'),
('Shure AONIC 50', 'Professional headphones', 'Shure'),
('Bang & Olufsen Beoplay H95', 'Luxury headphones', 'Bang & Olufsen'),
('Grado SR325x', 'Open-back headphones', 'Grado'),
('Focal Bathys', 'High-end wireless headphones', 'Focal'),
('Audeze LCD-5', 'Planar magnetic headphones', 'Audeze'),
('HiFiMan Arya Stealth', 'Open-back planar headphones', 'HiFiMan'),
('Beyerdynamic DT 1990 Pro', 'Studio reference headphones', 'Beyerdynamic'),
('AKG K812', 'Professional reference headphones', 'AKG'),
('Philips Fidelio X3', 'Hi-Res audio headphones', 'Philips'),
('SteelSeries Arctis Nova Pro', 'Gaming headset', 'SteelSeries'),
('Razer BlackShark V2 Pro', 'Wireless gaming headset', 'Razer'),
('Logitech G Pro X 2', 'Pro gaming headset', 'Logitech'),
('HyperX Cloud Alpha Wireless', 'Gaming headset', 'HyperX'),
('Corsair Virtuoso RGB Wireless', 'Premium gaming headset', 'Corsair');

INSERT INTO product_variants (productId, variantName, SKU, stockQnt, price, imageURL) VALUES
(26, 'Sony WH-1000XM6', 'SON-AUD-026', 150, 399.99, NULL),
(27, 'AirPods Pro 3rd Gen', 'APP-AUD-027', 200, 299.99, NULL),
(28, 'Bose QuietComfort Earbuds', 'BOS-AUD-028', 120, 329.99, NULL),
(29, 'Sennheiser Momentum 4', 'SEN-AUD-029', 100, 379.99, NULL),
(30, 'JBL Live Pro 3', 'JBL-AUD-030', 180, 199.99, NULL),
(31, 'Galaxy Buds3', 'SAM-AUD-031', 160, 249.99, NULL),
(32, 'Beats Studio Pro 2', 'BEA-AUD-032', 140, 349.99, NULL),
(33, 'ATH-M50xBT3', 'AUD-AUD-033', 110, 199.99, NULL),
(34, 'Jabra Elite 85t', 'JAB-AUD-034', 130, 279.99, NULL),
(35, 'ComfoBuds Pro 2', 'ONE-AUD-035', 170, 129.99, NULL),
(36, 'Marshall Major V', 'MAR-AUD-036', 90, 149.99, NULL),
(37, 'Shure AONIC 50', 'SHU-AUD-037', 80, 299.99, NULL),
(38, 'Beoplay H95', 'BAN-AUD-038', 50, 899.99, NULL),
(39, 'Grado SR325x', 'GRA-AUD-039', 70, 295.99, NULL),
(40, 'Focal Bathys', 'FOC-AUD-040', 60, 699.99, NULL),
(41, 'Audeze LCD-5', 'AUD-AUD-041', 30, 4499.99, NULL),
(42, 'HiFiMan Arya Stealth', 'HIF-AUD-042', 40, 1599.99, NULL),
(43, 'DT 1990 Pro', 'BEY-AUD-043', 85, 599.99, NULL),
(44, 'AKG K812', 'AKG-AUD-044', 65, 1499.99, NULL),
(45, 'Philips Fidelio X3', 'PHI-AUD-045', 95, 349.99, NULL),
(46, 'Arctis Nova Pro', 'STE-GAM-046', 120, 349.99, NULL),
(47, 'BlackShark V2 Pro', 'RAZ-GAM-047', 110, 179.99, NULL),
(48, 'G Pro X 2', 'LOG-GAM-048', 100, 249.99, NULL),
(49, 'Cloud Alpha Wireless', 'HYP-GAM-049', 130, 199.99, NULL),
(50, 'Virtuoso RGB Wireless', 'COR-GAM-050', 90, 279.99, NULL);

INSERT INTO product_categories (productId, categoryId) VALUES
(26, 3), (27, 3), (28, 3), (29, 3), (30, 3), (31, 3), (32, 3), (33, 3), (34, 3), (35, 3),
(36, 3), (37, 3), (38, 3), (39, 3), (40, 3), (41, 3), (42, 3), (43, 3), (44, 3), (45, 3),
(46, 3), (47, 3), (48, 3), (49, 3), (50, 3);

-- Sample users for orders
INSERT IGNORE INTO users (id, name, email, role, password, phone) VALUES
(2, 'John Doe', 'john@customer.com', 'Customer', 'password123', '1234567890'),
(3, 'Jane Smith', 'jane@customer.com', 'Customer', 'password123', '0987654321'),
(4, 'Mike Johnson', 'mike@customer.com', 'Customer', 'password123', '5551234567'),
(5, 'Sarah Wilson', 'sarah@customer.com', 'Customer', 'password123', '5559876543'),
(6, 'David Brown', 'david@customer.com', 'Customer', 'password123', '5551122334');

-- Sample orders with category distribution
INSERT IGNORE INTO orders (id, userId, deliveryMode, deliveryAddress, totalPrice, deliveryCharge, paymentMethod, status) VALUES
(1, 2, 'Standard Delivery', '{"street": "123 Main St", "city": "City", "state": "State", "zipCode": "12345"}', 1299.99, 15.00, 'Card', 'Delivered'),
(2, 3, 'Store Pickup', NULL, 299.99, 0.00, 'Card', 'Confirmed'),
(3, 4, 'Standard Delivery', '{"street": "456 Oak Ave", "city": "City", "state": "State", "zipCode": "67890"}', 399.99, 10.00, 'CashOnDelivery', 'Shipped'),
(4, 5, 'Standard Delivery', '{"street": "789 Pine St", "city": "City", "state": "State", "zipCode": "11111"}', 199.99, 20.00, 'Card', 'Processing'),
(5, 6, 'Store Pickup', NULL, 249.99, 0.00, 'Card', 'Pending'),
(6, 2, 'Standard Delivery', '{"street": "123 Main St", "city": "City", "state": "State", "zipCode": "12345"}', 599.99, 15.00, 'Card', 'Delivered'),
(7, 3, 'Store Pickup', NULL, 899.99, 0.00, 'Card', 'Delivered'),
(8, 4, 'Standard Delivery', '{"street": "456 Oak Ave", "city": "City", "state": "State", "zipCode": "67890"}', 349.99, 15.00, 'CashOnDelivery', 'Shipped');

-- Sample order items using valid variant IDs from our products
INSERT IGNORE INTO order_items (id, orderId, variantId, quantity, unitPrice, totalPrice) VALUES
-- Order 1: Mobiles & Tablets 
(1, 1, 1, 1, 1299.99, 1299.99),  -- Galaxy S25 Ultra
-- Order 2: Audio Devices
(2, 2, 27, 1, 299.99, 299.99),   -- AirPods Pro 3rd Gen
-- Order 3: Audio Devices
(3, 3, 26, 1, 399.99, 399.99),   -- Sony WH-1000XM6
-- Order 4: Audio Devices
(4, 4, 30, 1, 199.99, 199.99),   -- JBL Live Pro 3
-- Order 5: Audio Devices
(5, 5, 31, 1, 249.99, 249.99),   -- Galaxy Buds3
-- Order 6: Mobiles & Tablets
(6, 6, 3, 1, 999.99, 999.99),    -- But price adjusted to 599.99 in order
-- Order 7: Mobiles & Tablets  
(7, 7, 4, 1, 899.99, 899.99),    -- OnePlus 13 Pro
-- Order 8: Audio Devices
(8, 8, 32, 1, 349.99, 349.99);   -- Beats Studio Pro 2

-- Insert Subcategories (continuing from main categories which are already inserted)
-- Mobiles & Tablets Subcategories
INSERT INTO categories (name, isMainCategory, parentId) VALUES
('Smartphones', FALSE, 1),
('Tablets', FALSE, 1),
('Mobile Accessories', FALSE, 1);

-- Laptops & Computers Subcategories
INSERT INTO categories (name, isMainCategory, parentId) VALUES
('Laptops', FALSE, 2),
('Storage Devices', FALSE, 2),
('Cables & Adapters', FALSE, 2),
('Computer Accessories', FALSE, 2);

-- Audio Devices Subcategories
INSERT INTO categories (name, isMainCategory, parentId) VALUES
('Earphones & Headphones', FALSE, 3),
('Wireless Earbuds', FALSE, 3),
('Speakers', FALSE, 3);

-- Cameras & Photography Subcategories
INSERT INTO categories (name, isMainCategory, parentId) VALUES
('Digital Cameras', FALSE, 4),
('Action Cameras', FALSE, 4),
('Camera Accessories', FALSE, 4);

-- Home Appliances Subcategories
INSERT INTO categories (name, isMainCategory, parentId) VALUES
('Kitchen Appliances', FALSE, 5),
('Washing Machines', FALSE, 5),
('Televisions', FALSE, 5);

-- Wearable & Smart Devices Subcategories
INSERT INTO categories (name, isMainCategory, parentId) VALUES
('Smartwatches', FALSE, 6),
('Fitness Bands', FALSE, 6),
('VR Devices', FALSE, 6);

-- Power & Charging Subcategories
INSERT INTO categories (name, isMainCategory, parentId) VALUES
('Power Banks', FALSE, 7),
('Chargers & Docking Stations', FALSE, 7),
('Batteries', FALSE, 7);

-- Personal Care & Health Subcategories
INSERT INTO categories (name, isMainCategory, parentId) VALUES
('Grooming Devices', FALSE, 8),
('Health Devices', FALSE, 8);

-- Security & Safety Subcategories
INSERT INTO categories (name, isMainCategory, parentId) VALUES
('CCTV Cameras', FALSE, 9),
('Alarms', FALSE, 9),
('Smart Security Systems', FALSE, 9);

-- Toys & Gadgets Subcategories
INSERT INTO categories (name, isMainCategory, parentId) VALUES
('Electronic Toys', FALSE, 10),
('Learning Gadgets', FALSE, 10),
('Fun Gadgets', FALSE, 10);

-- Additional Products for more comprehensive catalog
-- Products 51-100 will be added to reach our target

-- Additional Mobiles & Tablets (Products 51-60)
INSERT INTO products (name, description, brand) VALUES
('Galaxy Z Fold 7 Pro', 'Foldable smartphone with 7.6-inch AMOLED display.', 'Samsung'),
('iPhone 17 Compact', 'Compact smartphone with A19 chip and 5.4-inch display.', 'Apple'),
('Google Pixel Fold 2', 'Foldable phone with Tensor G5 and AI features.', 'Google'),
('Poco F7 Pro', 'High-performance phone with Snapdragon 8 Gen 5.', 'Poco'),
('Sony Xperia 1 VII', 'Cinematic smartphone with 4K HDR display.', 'Sony'),
('Galaxy A75 5G', 'Mid-range smartphone with excellent camera.', 'Samsung'),
('Pixel 10a Pro', 'Budget-friendly phone with AI features.', 'Google'),
('OnePlus Nord 6 Pro', 'Premium mid-range phone with OxygenOS.', 'OnePlus'),
('Xiaomi Redmi Note 14', 'Value smartphone with MIUI 16.', 'Xiaomi'),
('iPad Pro 13-inch M4', 'Professional tablet with M4 chip.', 'Apple');

INSERT INTO product_variants (productId, variantName, SKU, stockQnt, price, imageURL) VALUES
(51, 'Galaxy Z Fold 7 Pro 512GB', 'SAMSUNG-MOB-051', 90, 1799.99, NULL),
(52, 'iPhone 17 Compact 128GB', 'APPLE-MOB-052', 100, 799.99, NULL),
(53, 'Pixel Fold 2 256GB', 'GOOGLE-MOB-053', 80, 1699.99, NULL),
(54, 'Poco F7 Pro 256GB', 'POCO-MOB-054', 120, 649.99, NULL),
(55, 'Sony Xperia 1 VII 256GB', 'SONY-MOB-055', 85, 1299.99, NULL),
(56, 'Galaxy A75 5G 128GB', 'SAMSUNG-MOB-056', 200, 399.99, NULL),
(57, 'Pixel 10a Pro 128GB', 'GOOGLE-MOB-057', 180, 449.99, NULL),
(58, 'OnePlus Nord 6 Pro 256GB', 'ONEPLUS-MOB-058', 160, 549.99, NULL),
(59, 'Xiaomi Redmi Note 14 128GB', 'XIAOMI-MOB-059', 220, 299.99, NULL),
(60, 'iPad Pro 13" M4 512GB', 'APPLE-TAB-060', 60, 1299.99, NULL);

-- Additional Laptops & Computers (Products 61-70)
INSERT INTO products (name, description, brand) VALUES
('MacBook Air M3 15-inch', 'Ultra-thin laptop with M3 chip and 15-inch display.', 'Apple'),
('Lenovo Legion Pro 7i Gen 9', 'Gaming laptop with Intel Core Ultra 9 and RTX 5080.', 'Lenovo'),
('HP Omen 16 2025', 'High-performance gaming laptop with 240Hz display.', 'HP'),
('Asus ROG Zephyrus G16 2025', 'Sleek gaming laptop with OLED screen.', 'Asus'),
('Dell Inspiron 14 Plus', 'Versatile laptop for productivity and entertainment.', 'Dell'),
('Surface Laptop Studio 6', 'Sleek laptop with Windows 12.', 'Microsoft'),
('ThinkPad X1 Carbon Gen 13', 'Business laptop with excellent keyboard.', 'Lenovo'),
('ASUS ZenBook 14X OLED', 'Ultrabook with OLED display.', 'ASUS'),
('Acer Swift 3 OLED', 'Affordable laptop for students.', 'Acer'),
('LG Gram 17 2025', 'Ultra-light 17-inch laptop.', 'LG');

INSERT INTO product_variants (productId, variantName, SKU, stockQnt, price, imageURL) VALUES
(61, 'MacBook Air M3 15-inch 512GB', 'APPLE-LAP-061', 90, 1499.99, NULL),
(62, 'Legion Pro 7i Gen 9 1TB', 'LENOVO-LAP-062', 70, 2699.99, NULL),
(63, 'HP Omen 16 2025 512GB', 'HP-LAP-063', 80, 1799.99, NULL),
(64, 'ROG Zephyrus G16 2025 1TB', 'ASUS-LAP-064', 75, 1999.99, NULL),
(65, 'Inspiron 14 Plus 256GB', 'DELL-LAP-065', 100, 899.99, NULL),
(66, 'Surface Laptop Studio 6 512GB', 'MICROSOFT-LAP-066', 120, 1299.99, NULL),
(67, 'ThinkPad X1 Carbon Gen 13', 'LENOVO-LAP-067', 100, 1899.99, NULL),
(68, 'ASUS ZenBook 14X OLED', 'ASUS-LAP-068', 110, 999.99, NULL),
(69, 'Acer Swift 3 OLED 256GB', 'ACER-LAP-069', 150, 799.99, NULL),
(70, 'LG Gram 17 2025 512GB', 'LG-LAP-070', 90, 1399.99, NULL);

-- Additional Cameras & Photography (Products 81-90)
INSERT INTO products (name, description, brand) VALUES
('Canon PowerShot G7 X Mark IV', 'Compact camera for vloggers.', 'Canon'),
('Sony Alpha 6700', 'APS-C mirrorless camera with AI autofocus.', 'Sony'),
('GoPro MAX 2', '360-degree action camera with 6K video.', 'GoPro'),
('Fujifilm Instax Mini 99', 'Instant camera with creative modes.', 'Fujifilm'),
('DJI Pocket 3', 'Gimbal camera for stabilized 4K video.', 'DJI'),
('Sony A7R VI', 'High-resolution mirrorless camera.', 'Sony'),
('Canon EOS R6 Mark III', 'Professional mirrorless camera.', 'Canon'),
('Nikon Z9 II', 'Flagship camera with 8K video.', 'Nikon'),
('Leica Q3', 'Premium compact camera.', 'Leica'),
('Insta360 X4', '360-degree action camera.', 'Insta360');

INSERT INTO product_variants (productId, variantName, SKU, stockQnt, price, imageURL) VALUES
(81, 'PowerShot G7 X Mark IV', 'CANON-CAM-081', 100, 799.99, NULL),
(82, 'Sony Alpha 6700 Body', 'SONY-CAM-082', 70, 1499.99, NULL),
(83, 'GoPro MAX 2', 'GOPRO-CAM-083', 120, 599.99, NULL),
(84, 'Instax Mini 99', 'FUJIFILM-CAM-084', 150, 199.99, NULL),
(85, 'DJI Pocket 3', 'DJI-CAM-085', 90, 499.99, NULL),
(86, 'Sony A7R VI Body', 'SONY-CAM-086', 50, 3899.99, NULL),
(87, 'Canon EOS R6 Mark III', 'CANON-CAM-087', 60, 2999.99, NULL),
(88, 'Nikon Z9 II Body', 'NIKON-CAM-088', 40, 4299.99, NULL),
(89, 'Leica Q3', 'LEICA-CAM-089', 30, 5999.99, NULL),
(90, 'Insta360 X4', 'INSTA360-CAM-090', 120, 599.99, NULL);

-- Additional Home Appliances (Products 91-100)
INSERT INTO products (name, description, brand) VALUES
('Samsung Family Hub Fridge', 'Smart refrigerator with 21.5-inch touchscreen.', 'Samsung'),
('LG ThinQ Dryer', 'Smart dryer with AI fabric sensing.', 'LG'),
('Philips PerfectCare Steam Iron', 'Steam iron with auto temperature control.', 'Philips'),
('LG OLED G4 65"', 'Premium OLED TV with AI processing.', 'LG'),
('Instant Vortex Air Fryer', '6-quart air fryer with smart controls.', 'Instant'),
('Samsung QN95D 55"', 'Neo QLED TV with Quantum Matrix.', 'Samsung'),
('Dyson V15 Detect', 'Laser detect vacuum cleaner.', 'Dyson'),
('Ninja Foodi XL', 'Pressure cooker air fryer combo.', 'Ninja'),
('KitchenAid Stand Mixer', 'Professional 6-quart stand mixer.', 'KitchenAid'),
('Breville Barista Express', 'Espresso machine with grinder.', 'Breville');

INSERT INTO product_variants (productId, variantName, SKU, stockQnt, price, imageURL) VALUES
(91, 'Family Hub Fridge', 'SAMSUNG-APP-091', 50, 3499.99, NULL),
(92, 'LG ThinQ Dryer', 'LG-APP-092', 60, 1199.99, NULL),
(93, 'PerfectCare Steam Iron', 'PHILIPS-APP-093', 130, 149.99, NULL),
(94, 'LG OLED G4 65"', 'LG-TV-094', 40, 2499.99, NULL),
(95, 'Instant Vortex Air Fryer', 'INSTANT-APP-095', 120, 129.99, NULL),
(96, 'Samsung QN95D 55"', 'SAMSUNG-TV-096', 50, 1899.99, NULL),
(97, 'Dyson V15 Detect', 'DYSON-APP-097', 120, 749.99, NULL),
(98, 'Ninja Foodi XL', 'NINJA-APP-098', 250, 199.99, NULL),
(99, 'KitchenAid Stand Mixer', 'KITCHENAID-APP-099', 120, 599.99, NULL),
(100, 'Breville Barista Express', 'BREVILLE-APP-100', 110, 699.99, NULL);

-- Associate all products with their respective categories
INSERT INTO product_categories (productId, categoryId) VALUES
-- Mobiles & Tablets
(1, 1), (2, 1), (3, 1), (4, 1), (5, 1), (6, 1), (7, 1), (8, 1), (9, 1), (10, 1),
(51, 1), (52, 1), (53, 1), (54, 1), (55, 1), (56, 1), (57, 1), (58, 1), (59, 1), (60, 1),
-- Laptops & Computers
(11, 2), (12, 2), (13, 2), (14, 2), (15, 2), (16, 2), (17, 2), (18, 2), (19, 2), (20, 2),
(61, 2), (62, 2), (63, 2), (64, 2), (65, 2), (66, 2), (67, 2), (68, 2), (69, 2), (70, 2),
-- Audio Devices
(21, 3), (22, 3), (23, 3), (24, 3), (25, 3), (26, 3), (27, 3), (28, 3), (29, 3), (30, 3),
-- Cameras & Photography
(31, 4), (32, 4), (33, 4), (34, 4), (35, 4), (36, 4), (37, 4), (38, 4), (39, 4), (40, 4),
(81, 4), (82, 4), (83, 4), (84, 4), (85, 4), (86, 4), (87, 4), (88, 4), (89, 4), (90, 4),
-- Home Appliances
(41, 5), (42, 5), (43, 5), (44, 5), (45, 5), (46, 5), (47, 5), (48, 5), (49, 5), (50, 5),
(91, 5), (92, 5), (93, 5), (94, 5), (95, 5), (96, 5), (97, 5), (98, 5), (99, 5), (100, 5);

-- 3. Audio Devices (categoryId = 3)
INSERT INTO products (name, description, brand) VALUES
('AirPods Pro 2', 'Wireless earbuds with active noise cancellation.', 'Apple'),
('Sony WH-1000XM6', 'Premium noise-cancelling headphones.', 'Sony'),
('JBL Tour One M3', 'Flagship headphones with touchscreen transmitter.', 'JBL'),
('Bose QuietComfort Ultra', 'Wireless earbuds with immersive audio.', 'Bose'),
('Anker Soundcore Liberty 4', 'Budget-friendly true wireless earbuds.', 'Anker'),
('Sennheiser Momentum True Wireless 3', 'Premium true wireless earbuds.', 'Sennheiser'),
('Beats Studio Pro', 'Stylish headphones with spatial audio.', 'Beats'),
('Jabra Elite 10', 'Earbuds with AI call noise cancellation.', 'Jabra'),
('Govee Table Lamp 2 Pro', 'Bluetooth speaker with pulsing lights.', 'Govee'),
('Sonos Arc', 'Premium soundbar for home theater.', 'Sonos');

INSERT INTO product_variants (productId, variantName, SKU, stockQnt, price, imageURL) VALUES
(21, 'AirPods Pro 2', 'APPLE-AUD-021', 150, 249.99, NULL),
(22, 'Sony WH-1000XM6 Black', 'SONY-AUD-022', 100, 399.99, NULL),
(23, 'JBL Tour One M3', 'JBL-AUD-023', 90, 349.99, NULL),
(24, 'Bose QuietComfort Ultra', 'BOSE-AUD-024', 110, 299.99, NULL),
(25, 'Soundcore Liberty 4', 'ANKER-AUD-025', 200, 129.99, NULL),
(26, 'Sennheiser Momentum True Wireless 3', 'SENNHEISER-AUD-026', 80, 249.99, NULL),
(27, 'Beats Studio Pro', 'BEATS-AUD-027', 120, 349.99, NULL),
(28, 'Jabra Elite 10', 'JABRA-AUD-028', 130, 229.99, NULL),
(29, 'Govee Table Lamp 2 Pro', 'GOVEE-AUD-029', 100, 149.99, NULL),
(30, 'Sonos Arc', 'SONOS-AUD-030', 70, 899.99, NULL);

INSERT INTO product_categories (productId, categoryId) VALUES
(21, 3), (22, 3), (23, 3), (24, 3), (25, 3), (26, 3), (27, 3), (28, 3), (29, 3), (30, 3);

-- 4. Cameras & Photography (categoryId = 4)
INSERT INTO products (name, description, brand) VALUES
('Sony Alpha 7 V', 'Full-frame mirrorless camera with 8K video.', 'Sony'),
('Canon EOS R5 Mark II', 'Professional camera with 45MP sensor.', 'Canon'),
('Nikon Z9 II', 'Flagship mirrorless for sports photography.', 'Nikon'),
('GoPro HERO 13 Black', 'Action camera with 5.3K video.', 'GoPro'),
('Fujifilm X-T6', 'Compact mirrorless with retro design.', 'Fujifilm'),
('DJI Osmo Action 5', 'Rugged action camera for adventures.', 'DJI'),
('Panasonic Lumix S5 III', 'Hybrid camera for video and stills.', 'Panasonic'),
('Insta360 X4', '360-degree action camera for immersive shots.', 'Insta360'),
('Sony ZV-1 II', 'Vlogging camera with flip-out screen.', 'Sony'),
('Olympus OM-1 Mark II', 'Micro Four Thirds camera for portability.', 'Olympus');

INSERT INTO product_variants (productId, variantName, SKU, stockQnt, price, imageURL) VALUES
(31, 'Sony Alpha 7 V Body', 'SONY-CAM-031', 60, 2499.99, NULL),
(32, 'Canon EOS R5 Mark II', 'CANON-CAM-032', 50, 3999.99, NULL),
(33, 'Nikon Z9 II Body', 'NIKON-CAM-033', 40, 5499.99, NULL),
(34, 'GoPro HERO 13 Black', 'GOPRO-CAM-034', 150, 399.99, NULL),
(35, 'Fujifilm X-T6 Body', 'FUJIFILM-CAM-035', 80, 1499.99, NULL),
(36, 'DJI Osmo Action 5', 'DJI-CAM-036', 120, 349.99, NULL),
(37, 'Lumix S5 III Body', 'PANASONIC-CAM-037', 70, 1999.99, NULL),
(38, 'Insta360 X4', 'INSTA360-CAM-038', 100, 499.99, NULL),
(39, 'Sony ZV-1 II', 'SONY-CAM-039', 110, 899.99, NULL),
(40, 'Olympus OM-1 Mark II', 'OLYMPUS-CAM-040', 90, 2399.99, NULL);

INSERT INTO product_categories (productId, categoryId) VALUES
(31, 4), (32, 4), (33, 4), (34, 4), (35, 4), (36, 4), (37, 4), (38, 4), (39, 4), (40, 4);

-- 5. Home Appliances (categoryId = 5)
INSERT INTO products (name, description, brand) VALUES
('Dyson Airwrap Complete', 'Multi-functional hair styling appliance.', 'Dyson'),
('Samsung Bespoke Refrigerator', 'Smart fridge with customizable panels.', 'Samsung'),
('LG InstaView Washer', 'Smart washing machine with AI wash.', 'LG'),
('TCL QM6K 55-inch', '4K Mini-LED smart TV with Google TV.', 'TCL'),
('Philips Air Fryer XXL', 'Large-capacity air fryer for healthy cooking.', 'Philips'),
('Bosch Serie 8 Oven', 'Smart oven with Home Connect.', 'Bosch'),
('Instant Pot Pro Plus', 'Multi-cooker with Wi-Fi connectivity.', 'Instant'),
('LG OLED G5 65-inch', 'Premium OLED TV with AI picture.', 'LG'),
('Whirlpool Dishwasher', 'Quiet dishwasher with smart features.', 'Whirlpool'),
('Nespresso Vertuo Next', 'Coffee machine with capsule recognition.', 'Nespresso');

INSERT INTO product_variants (productId, variantName, SKU, stockQnt, price, imageURL) VALUES
(41, 'Dyson Airwrap Complete', 'DYSON-HAP-041', 80, 599.99, NULL),
(42, 'Samsung Bespoke 4-Door', 'SAMSUNG-HAP-042', 50, 2999.99, NULL),
(43, 'LG InstaView Washer', 'LG-HAP-043', 60, 1299.99, NULL),
(44, 'TCL QM6K 55-inch', 'TCL-HAP-044', 100, 799.99, NULL),
(45, 'Philips Air Fryer XXL', 'PHILIPS-HAP-045', 120, 249.99, NULL),
(46, 'Bosch Serie 8 Oven', 'BOSCH-HAP-046', 70, 1499.99, NULL),
(47, 'Instant Pot Pro Plus', 'INSTANT-HAP-047', 150, 199.99, NULL),
(48, 'LG OLED G5 65-inch', 'LG-HAP-048', 60, 2499.99, NULL),
(49, 'Whirlpool Dishwasher', 'WHIRLPOOL-HAP-049', 80, 699.99, NULL),
(50, 'Nespresso Vertuo Next', 'NESPRESSO-HAP-050', 130, 179.99, NULL);

INSERT INTO product_categories (productId, categoryId) VALUES
(41, 5), (42, 5), (43, 5), (44, 5), (45, 5), (46, 5), (47, 5), (48, 5), (49, 5), (50, 5);

-- 6. Wearable & Smart Devices (categoryId = 6)
INSERT INTO products (name, description, brand) VALUES
('Apple Watch Series 10', 'Advanced smartwatch with ECG and AFib detection.', 'Apple'),
('Samsung Galaxy Watch 8', 'Health-focused smartwatch with 5G.', 'Samsung'),
('Fitbit Charge 6', 'Fitness tracker with heart rate monitoring.', 'Fitbit'),
('Garmin Venu 3', 'Sports smartwatch with AMOLED display.', 'Garmin'),
('Circular Ring 2', 'Smart ring with FDA-approved AFib detection.', 'Circular'),
('Huawei Watch GT 5', 'Long-battery-life smartwatch.', 'Huawei'),
('Oura Ring Gen 4', 'Sleep-tracking smart ring.', 'Oura'),
('Amazfit T-Rex 3', 'Rugged fitness tracker for outdoor use.', 'Amazfit'),
('Meta Orion Glasses', 'AI-powered AR glasses for productivity.', 'Meta'),
('Ray-Ban Meta AI Glasses', 'Smart glasses with built-in AI vision.', 'Ray-Ban');

INSERT INTO product_variants (productId, variantName, SKU, stockQnt, price, imageURL) VALUES
(51, 'Apple Watch Series 10 46mm', 'APPLE-WEA-051', 100, 429.99, NULL),
(52, 'Galaxy Watch 8 44mm', 'SAMSUNG-WEA-052', 90, 349.99, NULL),
(53, 'Fitbit Charge 6', 'FITBIT-WEA-053', 150, 159.99, NULL),
(54, 'Garmin Venu 3', 'GARMIN-WEA-054', 80, 449.99, NULL),
(55, 'Circular Ring 2', 'CIRCULAR-WEA-055', 120, 199.99, NULL),
(56, 'Huawei Watch GT 5', 'HUAWEI-WEA-056', 100, 279.99, NULL),
(57, 'Oura Ring Gen 4', 'OURA-WEA-057', 110, 349.99, NULL),
(58, 'Amazfit T-Rex 3', 'AMAZFIT-WEA-058', 130, 199.99, NULL),
(59, 'Meta Orion Glasses', 'META-WEA-059', 50, 9999.99, NULL),
(60, 'Ray-Ban Meta AI Glasses', 'RAYBAN-WEA-060', 90, 499.99, NULL);

INSERT INTO product_categories (productId, categoryId) VALUES
(51, 6), (52, 6), (53, 6), (54, 6), (55, 6), (56, 6), (57, 6), (58, 6), (59, 6), (60, 6);

-- 7. Power & Charging (categoryId = 7)
INSERT INTO products (name, description, brand) VALUES
('Anker PowerCore 10000', 'Compact 10000mAh power bank.', 'Anker'),
('Ambrane Aerosync Snap', 'MagSafe 10000mAh power bank.', 'Ambrane'),
('Belkin BoostCharge Pro', '65W GaN charger for fast charging.', 'Belkin'),
('Samsung 45W Charger', 'Super-fast USB-C charger.', 'Samsung'),
('Bluetti Pioneer Na', 'Sodium-ion portable power station.', 'Bluetti'),
('Jackery HomePower 3600', '3600W power station for home use.', 'Jackery'),
('EcoFlow Delta Mini', 'Portable power station for camping.', 'EcoFlow'),
('RAVPower PD Pioneer', '60W USB-C charger with GaN tech.', 'RAVPower'),
('Xiaomi 120W Charger', 'Hyper-fast charger for smartphones.', 'Xiaomi'),
('Zendure SuperTank Pro', 'High-capacity power bank with OLED display.', 'Zendure');

INSERT INTO product_variants (productId, variantName, SKU, stockQnt, price, imageURL) VALUES
(61, 'Anker PowerCore 10000', 'ANKER-POW-061', 200, 29.99, NULL),
(62, 'Ambrane Aerosync Snap', 'AMBRANE-POW-062', 150, 49.99, NULL),
(63, 'Belkin BoostCharge Pro', 'BELKIN-POW-063', 130, 59.99, NULL),
(64, 'Samsung 45W Charger', 'SAMSUNG-POW-064', 140, 39.99, NULL),
(65, 'Bluetti Pioneer Na', 'BLUETTI-POW-065', 70, 299.99, NULL),
(66, 'Jackery HomePower 3600', 'JACKERY-POW-066', 50, 1999.99, NULL),
(67, 'EcoFlow Delta Mini', 'ECOFLOW-POW-067', 80, 799.99, NULL),
(68, 'RAVPower PD Pioneer', 'RAVPOWER-POW-068', 120, 49.99, NULL),
(69, 'Xiaomi 120W Charger', 'XIAOMI-POW-069', 150, 59.99, NULL),
(70, 'Zendure SuperTank Pro', 'ZENDURE-POW-070', 100, 199.99, NULL);

INSERT INTO product_categories (productId, categoryId) VALUES
(61, 7), (62, 7), (63, 7), (64, 7), (65, 7), (66, 7), (67, 7), (68, 7), (69, 7), (70, 7);

-- 8. Personal Care & Health (categoryId = 8)
-- 8. Personal Care & Health (categoryId = 8)
INSERT INTO products (name, description, brand) VALUES
('Philips Series 9000', 'Electric shaver with SkinIQ technology.', 'Philips'),
('Dyson Supersonic', 'High-speed hair dryer with heat control.', 'Dyson'),
('Braun Series 9 Pro', 'Premium electric trimmer for precision.', 'Braun'),
('Omron Platinum BP', 'Blood pressure monitor with Bluetooth.', 'Omron'),
('Withings Body+', 'Smart scale with body composition.', 'Withings'),
('iHealth Track', 'Smart blood pressure monitor.', 'iHealth'),
('LOreal Cell BioPrint', 'Tabletop skin diagnostic device using microfluidics and proteomics for personalized analysis.', 'LOreal'),
('Beurer Pulse Oximeter', 'Portable oximeter for oxygen levels.', 'Beurer'),
('Oral-B iO Series 10', 'Smart toothbrush with AI brushing.', 'Oral-B'),
('Theragun Elite', 'Percussive therapy device for muscle relief.', 'Theragun');

INSERT INTO product_variants (productId, variantName, SKU, stockQnt, price, imageURL) VALUES
(71, 'Philips Series 9000', 'PHILIPS-HEA-071', 100, 299.99, NULL),
(72, 'Dyson Supersonic', 'DYSON-HEA-072', 80, 399.99, NULL),
(73, 'Braun Series 9 Pro', 'BRAUN-HEA-073', 90, 249.99, NULL),
(74, 'Omron Platinum BP', 'OMRON-HEA-074', 120, 129.99, NULL),
(75, 'Withings Body+', 'WITHINGS-HEA-075', 110, 99.99, NULL),
(76, 'iHealth Track', 'IHEALTH-HEA-076', 130, 79.99, NULL),
(77, 'LOreal Cell BioPrint', 'LOREAL-HEA-077', 60, 499.99, NULL),
(78, 'Beurer Pulse Oximeter', 'BEURER-HEA-078', 150, 49.99, NULL),
(79, 'Oral-B iO Series 10', 'ORALB-HEA-079', 100, 199.99, NULL),
(80, 'Theragun Elite', 'THERAGUN-HEA-080', 90, 399.99, NULL);

INSERT INTO product_categories (productId, categoryId) VALUES
(71, 8), (72, 8), (73, 8), (74, 8), (75, 8), (76, 8), (77, 8), (78, 8), (79, 8), (80, 8);
-- 9. Security & Safety (categoryId = 9)
INSERT INTO products (name, description, brand) VALUES
('Arlo Pro 5S', '2K wireless security camera with spotlight.', 'Arlo'),
('Ring Home Premium', 'Smart doorbell with 3D motion detection.', 'Ring'),
('Google Nest Cam', 'Battery-powered outdoor security camera.', 'Google'),
('Blink Outdoor 4', 'Affordable HD security camera.', 'Blink'),
('Eufy Security SoloCam', 'No-subscription 2K security camera.', 'Eufy'),
('Wyze Cam v4', 'Budget-friendly 4K security camera.', 'Wyze'),
('SimpliSafe Pro', 'Smart home security system with sensors.', 'SimpliSafe'),
('Abode Security Kit', 'Customizable smart security system.', 'Abode'),
('Yale Smart Alarm', 'App-controlled home alarm system.', 'Yale'),
('Reolink Argus 4', 'Solar-powered wireless security camera.', 'Reolink');

INSERT INTO product_variants (productId, variantName, SKU, stockQnt, price, imageURL) VALUES
(81, 'Arlo Pro 5S', 'ARLO-SEC-081', 120, 249.99, NULL),
(82, 'Ring Home Premium', 'RING-SEC-082', 100, 199.99, NULL),
(83, 'Google Nest Cam', 'GOOGLE-SEC-083', 110, 179.99, NULL),
(84, 'Blink Outdoor 4', 'BLINK-SEC-084', 150, 99.99, NULL),
(85, 'Eufy Security SoloCam', 'EUFY-SEC-085', 130, 129.99, NULL),
(86, 'Wyze Cam v4', 'WYZE-SEC-086', 200, 59.99, NULL),
(87, 'SimpliSafe Pro', 'SIMPLISAFE-SEC-087', 80, 299.99, NULL),
(88, 'Abode Security Kit', 'ABODE-SEC-088', 90, 279.99, NULL),
(89, 'Yale Smart Alarm', 'YALE-SEC-089', 100, 249.99, NULL),
(90, 'Reolink Argus 4', 'REOLINK-SEC-090', 120, 149.99, NULL);

INSERT INTO product_categories (productId, categoryId) VALUES
(81, 9), (82, 9), (83, 9), (84, 9), (85, 9), (86, 9), (87, 9), (88, 9), (89, 9), (90, 9);

-- 10. Toys & Gadgets (categoryId = 10)
INSERT INTO products (name, description, brand) VALUES
('DJI Avata 2', 'FPV drone for immersive flying.', 'DJI'),
('Lego Mindstorms EV4', 'Programmable robotics kit for learning.', 'Lego'),
('Sphero BOLT+', 'App-controlled robotic ball.', 'Sphero'),
('Anki Vector 2.0', 'AI-powered home robot with voice control.', 'Anki'),
('Osmo Coding Starter Kit', 'Interactive coding game for kids.', 'Osmo'),
('Tamagotchi Uni', 'Modern digital pet with Wi-Fi.', 'Tamagotchi'),
('Nintendo Switch 2', 'Next-gen hybrid gaming console.', 'Nintendo'),
('Razor Turbo A', 'Electric scooter for kids.', 'Razor'),
('WowWee MiP Arcade', 'Interactive robot with games.', 'WowWee'),
('Snap Circuits Pro', 'Educational electronics kit for kids.', 'Snap Circuits');

INSERT INTO product_variants (productId, variantName, SKU, stockQnt, price, imageURL) VALUES
(91, 'DJI Avata 2', 'DJI-TOY-091', 80, 999.99, NULL),
(92, 'Lego Mindstorms EV4', 'LEGO-TOY-092', 100, 349.99, NULL),
(93, 'Sphero BOLT+', 'SPHERO-TOY-093', 120, 149.99, NULL),
(94, 'Anki Vector 2.0', 'ANKI-TOY-094', 90, 199.99, NULL),
(95, 'Osmo Coding Starter Kit', 'OSMO-TOY-095', 110, 99.99, NULL),
(96, 'Tamagotchi Uni', 'TAMAGOTCHI-TOY-096', 150, 59.99, NULL),
(97, 'Nintendo Switch 2', 'NINTENDO-TOY-097', 70, 399.99, NULL),
(98, 'Razor Turbo A', 'RAZOR-TOY-098', 130, 129.99, NULL),
(99, 'WowWee MiP Arcade', 'WOWWEE-TOY-099', 100, 89.99, NULL),
(100, 'Snap Circuits Pro', 'SNAPCIRCUITS-TOY-100', 140, 79.99, NULL);

INSERT INTO product_categories (productId, categoryId) VALUES
(91, 10), (92, 10), (93, 10), (94, 10), (95, 10), (96, 10), (97, 10), (98, 10), (99, 10), (100, 10);

-- ===================================================================
-- SAMPLE ORDERS AND ORDER ITEMS FOR TESTING REPORTS
-- ===================================================================

-- Insert sample users (customers) if they don't exist
INSERT IGNORE INTO users (id, name, email, role, password, phone) VALUES
(2, 'John Doe', 'john@customer.com', 'Customer', 'password123', '1234567890'),
(3, 'Jane Smith', 'jane@customer.com', 'Customer', 'password123', '0987654321'),
(4, 'Mike Johnson', 'mike@customer.com', 'Customer', 'password123', '5551234567'),
(6, 'Sarah Wilson', 'sarah@customer.com', 'Customer', 'password123', '5559876543'),
(7, 'David Brown', 'david@customer.com', 'Customer', 'password123', '5551122334'),
(8, 'Emily Davis', 'emily@customer.com', 'Customer', 'password123', '5552233445');

-- Insert sample orders
INSERT IGNORE INTO orders (id, userId, deliveryMode, deliveryAddress, totalPrice, deliveryCharge, paymentMethod, status) VALUES
(1, 2, 'Standard Delivery', '{"street": "123 Main St", "city": "City", "state": "State", "zipCode": "12345"}', 2499.98, 15.00, 'Card', 'Delivered'),
(2, 3, 'Store Pickup', NULL, 249.99, 0.00, 'Card', 'Confirmed'),
(3, 4, 'Standard Delivery', '{"street": "456 Oak Ave", "city": "City", "state": "State", "zipCode": "67890"}', 599.99, 10.00, 'CashOnDelivery', 'Shipped'),
(4, 2, 'Standard Delivery', '{"street": "123 Main St", "city": "City", "state": "State", "zipCode": "12345"}', 109.97, 20.00, 'Card', 'Processing'),
(5, 3, 'Store Pickup', NULL, 249.99, 0.00, 'Card', 'Pending'),
-- Additional orders for more category diversity
(6, 6, 'Standard Delivery', '{"street": "789 Pine St", "city": "City", "state": "State", "zipCode": "11111"}', 6499.98, 25.00, 'Card', 'Delivered'),
(7, 7, 'Store Pickup', NULL, 2499.99, 0.00, 'Card', 'Delivered'),
(8, 8, 'Standard Delivery', '{"street": "321 Elm St", "city": "City", "state": "State", "zipCode": "22222"}', 799.98, 15.00, 'CashOnDelivery', 'Shipped'),
(9, 6, 'Store Pickup', NULL, 779.98, 0.00, 'Card', 'Confirmed'),
(10, 7, 'Standard Delivery', '{"street": "654 Maple Ave", "city": "City", "state": "State", "zipCode": "33333"}', 699.98, 20.00, 'Card', 'Processing'),
(11, 8, 'Store Pickup', NULL, 999.99, 0.00, 'Card', 'Delivered'),
(12, 2, 'Standard Delivery', '{"street": "123 Main St", "city": "City", "state": "State", "zipCode": "12345"}', 349.99, 15.00, 'CashOnDelivery', 'Pending');

-- Insert sample order items (using valid variant IDs from the seeded data)
INSERT IGNORE INTO order_items (id, orderId, variantId, quantity, unitPrice, totalPrice) VALUES
-- Order 1 items (Mobiles & Tablets category - variants 1-2)
(1, 1, 1, 1, 1299.99, 1299.99),    -- Galaxy S25 Ultra 512GB
(2, 1, 2, 1, 1199.99, 1199.99),    -- iPhone 17 Pro 256GB
-- Order 2 items (Audio Devices category - variant 21)
(3, 2, 21, 1, 249.99, 249.99),     -- JBL Charge 5
-- Order 3 items (Home Appliances category - variant 41)  
(4, 3, 41, 1, 599.99, 599.99),     -- Samsung Smart TV 55"
-- Order 4 items (Power & Charging category - variants 61-62)
(5, 4, 61, 2, 29.99, 59.98),       -- Anker PowerCore 10000
(6, 4, 62, 1, 49.99, 49.99),       -- Belkin Wireless Charger
-- Order 5 items (Security & Safety category - variant 81)
(7, 5, 81, 1, 249.99, 249.99),     -- Ring Video Doorbell

-- Additional order items for new orders
-- Order 6 items (Cameras & Photography category - variants 31-32)
(8, 6, 31, 1, 2499.99, 2499.99),   -- Canon EOS R5
(9, 6, 32, 1, 3999.99, 3999.99),   -- Sony A7R V
-- Order 7 items (Laptops & Computers category - variant 11)
(10, 7, 11, 1, 2499.99, 2499.99),  -- MacBook Pro 16 M4
-- Order 8 items (Audio Devices category - variant 22)
(11, 8, 22, 2, 399.99, 799.98),    -- Sony WH-1000XM5
-- Order 9 items (Wearable & Smart Devices category - variants 51-52)
(12, 9, 51, 1, 429.99, 429.99),    -- Apple Watch Series 10
(13, 9, 52, 1, 349.99, 349.99),    -- Samsung Galaxy Watch6
-- Order 10 items (Personal Care & Health category - variants 71-72)
(14, 10, 71, 1, 299.99, 299.99),   -- Philips Sonicare DiamondClean
(15, 10, 72, 1, 399.99, 399.99),   -- Dyson V15 Detect
-- Order 11 items (Toys & Gadgets category - variant 91)
(16, 11, 91, 1, 999.99, 999.99),   -- PlayStation 5 Pro
-- Order 12 items (More Audio Devices - variant 23)
(17, 12, 23, 1, 349.99, 349.99);   -- Bose QuietComfort 45

-- ===================================================================
-- ADDITIONAL PRODUCTS TO REACH 400 TOTAL (Products 101-400)
-- ===================================================================

-- Additional Mobiles & Tablets (Products 101-130) - 30 more products
INSERT INTO products (name, description, brand) VALUES
('Samsung Galaxy S24 FE', 'Fan Edition smartphone with flagship features', 'Samsung'),
('iPhone 16 Plus SE', 'Special Edition iPhone with enhanced camera', 'Apple'),
('Google Pixel 9 Pro Fold', 'Premium foldable with Pixel AI', 'Google'),
('OnePlus 12T Pro', 'Turbo variant with gaming focus', 'OnePlus'),
('Xiaomi 14T Ultra Pro', 'Photography flagship with Leica cameras', 'Xiaomi'),
('Oppo Find N5', 'Next-gen foldable smartphone', 'Oppo'),
('Vivo X100 Pro Plus', 'Ultra premium camera phone', 'Vivo'),
('Realme GT Neo 6', 'Gaming-focused mid-range phone', 'Realme'),
('Motorola Razr 50 Ultra', 'Premium foldable flip phone', 'Motorola'),
('Nokia XR21 5G', 'Rugged smartphone with 5G', 'Nokia'),
('Samsung Galaxy A55 5G', 'Mid-range 5G smartphone', 'Samsung'),
('iPhone SE 4th Gen', 'Compact iPhone with modern features', 'Apple'),
('Google Pixel 8a Pro', 'Enhanced budget Pixel phone', 'Google'),
('OnePlus Nord CE 4', 'Core Edition budget phone', 'OnePlus'),
('Xiaomi Poco X6 Pro', 'Performance budget smartphone', 'Xiaomi'),
('Oppo A98 5G', 'Affordable 5G smartphone', 'Oppo'),
('Vivo V30 Pro', 'Selfie-focused smartphone', 'Vivo'),
('Realme C67 5G', 'Entry-level 5G phone', 'Realme'),
('Motorola G54 5G', 'Budget 5G smartphone', 'Motorola'),
('Nokia C32 Plus', 'Basic smartphone for everyday use', 'Nokia'),
('Samsung Galaxy Tab A9 Plus', 'Mid-range Android tablet', 'Samsung'),
('iPad Air 6th Gen', 'Lightweight professional tablet', 'Apple'),
('Microsoft Surface Go 4', 'Compact Windows tablet', 'Microsoft'),
('Lenovo Tab M11', 'Entertainment-focused tablet', 'Lenovo'),
('Huawei MatePad 11.5 S', 'Premium Android tablet', 'Huawei'),
('Amazon Fire Max 11', 'Large screen entertainment tablet', 'Amazon'),
('Honor Pad X9', 'Budget Android tablet', 'Honor'),
('TCL Tab 10s 5G', '5G-enabled Android tablet', 'TCL'),
('Blackview Tab 16 Pro', 'Rugged Android tablet', 'Blackview'),
('CHUWI HiPad X Pro', 'Budget Windows tablet', 'CHUWI');

INSERT INTO product_variants (productId, variantName, SKU, stockQnt, price, imageURL) VALUES
(101, 'Galaxy S24 FE 256GB', 'SAM-MOB-101', 150, 699.99, NULL),
(102, 'iPhone 16 Plus SE 128GB', 'APP-MOB-102', 120, 899.99, NULL),
(103, 'Pixel 9 Pro Fold 512GB', 'GOO-MOB-103', 80, 1899.99, NULL),
(104, 'OnePlus 12T Pro 256GB', 'ONE-MOB-104', 110, 799.99, NULL),
(105, 'Xiaomi 14T Ultra Pro 512GB', 'XIA-MOB-105', 90, 1199.99, NULL),
(106, 'Oppo Find N5 256GB', 'OPP-MOB-106', 70, 1599.99, NULL),
(107, 'Vivo X100 Pro Plus 512GB', 'VIV-MOB-107', 85, 1399.99, NULL),
(108, 'Realme GT Neo 6 256GB', 'REA-MOB-108', 140, 549.99, NULL),
(109, 'Motorola Razr 50 Ultra 256GB', 'MOT-MOB-109', 60, 1299.99, NULL),
(110, 'Nokia XR21 5G 128GB', 'NOK-MOB-110', 130, 599.99, NULL),
(111, 'Galaxy A55 5G 128GB', 'SAM-MOB-111', 180, 449.99, NULL),
(112, 'iPhone SE 4th Gen 128GB', 'APP-MOB-112', 200, 499.99, NULL),
(113, 'Pixel 8a Pro 256GB', 'GOO-MOB-113', 160, 599.99, NULL),
(114, 'OnePlus Nord CE 4 128GB', 'ONE-MOB-114', 170, 399.99, NULL),
(115, 'Xiaomi Poco X6 Pro 256GB', 'XIA-MOB-115', 190, 349.99, NULL),
(116, 'Oppo A98 5G 128GB', 'OPP-MOB-116', 200, 299.99, NULL),
(117, 'Vivo V30 Pro 256GB', 'VIV-MOB-117', 150, 499.99, NULL),
(118, 'Realme C67 5G 128GB', 'REA-MOB-118', 220, 249.99, NULL),
(119, 'Motorola G54 5G 128GB', 'MOT-MOB-119', 210, 279.99, NULL),
(120, 'Nokia C32 Plus 64GB', 'NOK-MOB-120', 250, 199.99, NULL),
(121, 'Galaxy Tab A9 Plus 128GB', 'SAM-TAB-121', 100, 399.99, NULL),
(122, 'iPad Air 6th Gen 256GB', 'APP-TAB-122', 80, 899.99, NULL),
(123, 'Surface Go 4 128GB', 'MIC-TAB-123', 90, 599.99, NULL),
(124, 'Lenovo Tab M11 128GB', 'LEN-TAB-124', 120, 299.99, NULL),
(125, 'MatePad 11.5 S 256GB', 'HUA-TAB-125', 70, 499.99, NULL),
(126, 'Fire Max 11 64GB', 'AMZ-TAB-126', 150, 249.99, NULL),
(127, 'Honor Pad X9 128GB', 'HON-TAB-127', 140, 199.99, NULL),
(128, 'TCL Tab 10s 5G 128GB', 'TCL-TAB-128', 110, 349.99, NULL),
(129, 'Blackview Tab 16 Pro 256GB', 'BLA-TAB-129', 80, 299.99, NULL),
(130, 'CHUWI HiPad X Pro 128GB', 'CHU-TAB-130', 90, 399.99, NULL);

-- Additional Laptops & Computers (Products 131-160) - 30 more products  
INSERT INTO products (name, description, brand) VALUES
('MacBook Pro 14 M4 Pro', 'Professional laptop with M4 Pro chip', 'Apple'),
('Dell XPS 13 Plus 2025', 'Ultra-premium ultrabook', 'Dell'),
('HP Elite Dragonfly G4', 'Business ultrabook with 5G', 'HP'),
('Asus ROG Strix Scar 18', 'High-end gaming laptop', 'Asus'),
('Lenovo Yoga 9i 2025', 'Premium 2-in-1 laptop', 'Lenovo'),
('Acer Aspire Vero 16', 'Eco-friendly laptop', 'Acer'),
('MSI Titan 18 HX', 'Desktop replacement gaming laptop', 'MSI'),
('Surface Pro 10 for Business', 'Business tablet laptop', 'Microsoft'),
('Framework Laptop 16 DIY', 'Modular gaming laptop', 'Framework'),
('Razer Blade 16 2025', 'Premium gaming ultrabook', 'Razer'),
('Alienware x17 R3', 'High-performance gaming laptop', 'Dell'),
('HP ZBook Fury 16 G10', 'Mobile workstation', 'HP'),
('Asus Zenbook Pro 16X OLED', 'Creator laptop with OLED', 'Asus'),
('Lenovo ThinkPad P1 Gen 6', 'Mobile workstation', 'Lenovo'),
('Acer ConceptD 7 Ezel Pro', 'Convertible creator laptop', 'Acer'),
('MSI Creator Z16P B13V', 'Content creator laptop', 'MSI'),
('Surface Laptop Studio 2+', 'Creative professionals laptop', 'Microsoft'),
('LG Gram Style 16', 'Ultra-light premium laptop', 'LG'),
('Samsung Galaxy Book3 Ultra', 'Premium Windows laptop', 'Samsung'),
('Huawei MateBook X Pro 2025', 'Ultra-slim premium laptop', 'Huawei'),
('Honor MagicBook Pro 16.1', 'Performance laptop', 'Honor'),
('Xiaomi Book Pro 16', 'Premium laptop with OLED', 'Xiaomi'),
('GPD Win Max 2 2024', 'Handheld gaming PC', 'GPD'),
('ASUS ExpertBook B9 OLED', 'Business ultrabook', 'ASUS'),
('Vaio FE 16.1', 'Japanese premium laptop', 'Vaio'),
('System76 Oryx Pro', 'Linux gaming laptop', 'System76'),
('Purism Librem 14', 'Privacy-focused laptop', 'Purism'),
('Pine64 Pinebook Pro', 'ARM-based Linux laptop', 'Pine64'),
('Star Labs StarBook Mk VI', 'Linux ultrabook', 'Star Labs'),
('Slimbook Executive 16', 'Spanish premium laptop', 'Slimbook');

INSERT INTO product_variants (productId, variantName, SKU, stockQnt, price, imageURL) VALUES
(131, 'MacBook Pro 14 M4 Pro 1TB', 'APP-LAP-131', 70, 2999.99, NULL),
(132, 'XPS 13 Plus 2025 512GB', 'DEL-LAP-132', 80, 2199.99, NULL),
(133, 'Elite Dragonfly G4 512GB', 'HP-LAP-133', 60, 2499.99, NULL),
(134, 'ROG Strix Scar 18 1TB', 'ASU-LAP-134', 50, 3499.99, NULL),
(135, 'Yoga 9i 2025 512GB', 'LEN-LAP-135', 75, 1899.99, NULL),
(136, 'Aspire Vero 16 512GB', 'ACE-LAP-136', 90, 999.99, NULL),
(137, 'MSI Titan 18 HX 2TB', 'MSI-LAP-137', 40, 4999.99, NULL),
(138, 'Surface Pro 10 Business 512GB', 'MIC-LAP-138', 85, 1699.99, NULL),
(139, 'Framework Laptop 16 DIY 1TB', 'FRA-LAP-139', 60, 1999.99, NULL),
(140, 'Razer Blade 16 2025 1TB', 'RAZ-LAP-140', 55, 3299.99, NULL),
(141, 'Alienware x17 R3 1TB', 'DEL-LAP-141', 45, 3799.99, NULL),
(142, 'ZBook Fury 16 G10 1TB', 'HP-LAP-142', 50, 3299.99, NULL),
(143, 'Zenbook Pro 16X OLED 1TB', 'ASU-LAP-143', 65, 2799.99, NULL),
(144, 'ThinkPad P1 Gen 6 1TB', 'LEN-LAP-144', 55, 2999.99, NULL),
(145, 'ConceptD 7 Ezel Pro 1TB', 'ACE-LAP-145', 40, 3499.99, NULL),
(146, 'Creator Z16P B13V 1TB', 'MSI-LAP-146', 60, 2499.99, NULL),
(147, 'Surface Laptop Studio 2+ 1TB', 'MIC-LAP-147', 70, 2799.99, NULL),
(148, 'LG Gram Style 16 512GB', 'LG-LAP-148', 80, 1799.99, NULL),
(149, 'Galaxy Book3 Ultra 1TB', 'SAM-LAP-149', 60, 2299.99, NULL),
(150, 'MateBook X Pro 2025 1TB', 'HUA-LAP-150', 70, 1999.99, NULL),
(151, 'MagicBook Pro 16.1 512GB', 'HON-LAP-151', 85, 1499.99, NULL),
(152, 'Xiaomi Book Pro 16 512GB', 'XIA-LAP-152', 75, 1399.99, NULL),
(153, 'GPD Win Max 2 2024 1TB', 'GPD-LAP-153', 30, 1299.99, NULL),
(154, 'ExpertBook B9 OLED 512GB', 'ASU-LAP-154', 70, 1899.99, NULL),
(155, 'Vaio FE 16.1 512GB', 'VAI-LAP-155', 40, 2199.99, NULL),
(156, 'Oryx Pro 1TB', 'SYS-LAP-156', 25, 1799.99, NULL),
(157, 'Librem 14 512GB', 'PUR-LAP-157', 20, 1599.99, NULL),
(158, 'Pinebook Pro 128GB', 'PIN-LAP-158', 15, 299.99, NULL),
(159, 'StarBook Mk VI 512GB', 'STA-LAP-159', 30, 999.99, NULL),
(160, 'Executive 16 512GB', 'SLI-LAP-160', 25, 1299.99, NULL);

-- Associate new products with categories
INSERT INTO product_categories (productId, categoryId) VALUES
-- Additional Mobiles & Tablets (101-130)
(101, 1), (102, 1), (103, 1), (104, 1), (105, 1), (106, 1), (107, 1), (108, 1), (109, 1), (110, 1),
(111, 1), (112, 1), (113, 1), (114, 1), (115, 1), (116, 1), (117, 1), (118, 1), (119, 1), (120, 1),
(121, 1), (122, 1), (123, 1), (124, 1), (125, 1), (126, 1), (127, 1), (128, 1), (129, 1), (130, 1),
-- Additional Laptops & Computers (131-160)
(131, 2), (132, 2), (133, 2), (134, 2), (135, 2), (136, 2), (137, 2), (138, 2), (139, 2), (140, 2),
(141, 2), (142, 2), (143, 2), (144, 2), (145, 2), (146, 2), (147, 2), (148, 2), (149, 2), (150, 2),
(151, 2), (152, 2), (153, 2), (154, 2), (155, 2), (156, 2), (157, 2), (158, 2), (159, 2), (160, 2);

-- Additional Audio Devices (Products 161-190) - 30 more products
INSERT INTO products (name, description, brand) VALUES
('Sony WF-C700N', 'Noise canceling wireless earbuds', 'Sony'),
('Apple AirPods 4', 'Latest generation AirPods', 'Apple'),
('Bose QuietComfort 35 III', 'Third generation wireless headphones', 'Bose'),
('Sennheiser HD 660S2', 'Open-back audiophile headphones', 'Sennheiser'),
('JBL Reflect Aero TWS', 'Sports wireless earbuds', 'JBL'),
('Samsung Galaxy Buds2 Pro Plus', 'Enhanced premium earbuds', 'Samsung'),
('Beats Fit Pro 2', 'Next-gen fitness earbuds', 'Beats'),
('Audio-Technica ATH-R70x', 'Professional reference headphones', 'Audio-Technica'),
('Jabra Evolve2 85 UC', 'Business UC headset', 'Jabra'),
('Anker Soundcore Life Q35', 'Affordable ANC headphones', 'Anker'),
('Shure SE535', 'Triple-driver professional earphones', 'Shure'),
('Focal Clear MG Professional', 'Professional studio headphones', 'Focal'),
('Audeze MM-500', 'Professional reference headphones', 'Audeze'),
('Beyerdynamic DT 770 Pro 250 Ohm', 'Studio monitoring headphones', 'Beyerdynamic'),
('AKG K371', 'Professional studio headphones', 'AKG'),
('Audio-Technica ATH-MSR7b', 'Hi-Res portable headphones', 'Audio-Technica'),
('Sony MDR-7506', 'Professional studio headphones', 'Sony'),
('Grado GS3000e', 'Premium open-back headphones', 'Grado'),
('HiFiMan Sundara Closed', 'Closed-back planar headphones', 'HiFiMan'),
('Meze 99 Classics', 'Wooden audiophile headphones', 'Meze'),
('JBL Charge 6', 'Portable Bluetooth speaker', 'JBL'),
('Sonos Move 2', 'Portable smart speaker', 'Sonos'),
('Bose SoundLink Revolve+ II', 'Portable 360-degree speaker', 'Bose'),
('Ultimate Ears Megaboom 4', 'Waterproof party speaker', 'Ultimate Ears'),
('JBL Xtreme 4', 'Powerful portable speaker', 'JBL'),
('Marshall Acton III', 'Vintage-style Bluetooth speaker', 'Marshall'),
('Bang & Olufsen Beolit 20', 'Premium portable speaker', 'Bang & Olufsen'),
('Harman Kardon Onyx Studio 8', 'Elegant wireless speaker', 'Harman Kardon'),
('KEF LSX II LT', 'Wireless Hi-Fi speakers', 'KEF'),
('Klipsch The Three Plus', 'Heritage wireless speaker', 'Klipsch');

INSERT INTO product_variants (productId, variantName, SKU, stockQnt, price, imageURL) VALUES
(161, 'Sony WF-C700N Black', 'SON-AUD-161', 150, 129.99, NULL),
(162, 'Apple AirPods 4', 'APP-AUD-162', 200, 179.99, NULL),
(163, 'Bose QC35 III Black', 'BOS-AUD-163', 120, 379.99, NULL),
(164, 'Sennheiser HD 660S2', 'SEN-AUD-164', 80, 599.99, NULL),
(165, 'JBL Reflect Aero TWS', 'JBL-AUD-165', 140, 179.99, NULL),
(166, 'Galaxy Buds2 Pro Plus', 'SAM-AUD-166', 130, 279.99, NULL),
(167, 'Beats Fit Pro 2', 'BEA-AUD-167', 120, 249.99, NULL),
(168, 'ATH-R70x', 'AUD-AUD-168', 90, 349.99, NULL),
(169, 'Jabra Evolve2 85 UC', 'JAB-AUD-169', 70, 549.99, NULL),
(170, 'Soundcore Life Q35', 'ANK-AUD-170', 180, 129.99, NULL),
(171, 'Shure SE535', 'SHU-AUD-171', 60, 549.99, NULL),
(172, 'Focal Clear MG Pro', 'FOC-AUD-172', 40, 1499.99, NULL),
(173, 'Audeze MM-500', 'AUD-AUD-173', 30, 1699.99, NULL),
(174, 'DT 770 Pro 250 Ohm', 'BEY-AUD-174', 100, 179.99, NULL),
(175, 'AKG K371', 'AKG-AUD-175', 110, 149.99, NULL),
(176, 'ATH-MSR7b', 'AUD-AUD-176', 90, 249.99, NULL),
(177, 'Sony MDR-7506', 'SON-AUD-177', 120, 99.99, NULL),
(178, 'Grado GS3000e', 'GRA-AUD-178', 20, 2995.99, NULL),
(179, 'Sundara Closed', 'HIF-AUD-179', 50, 399.99, NULL),
(180, 'Meze 99 Classics', 'MEZ-AUD-180', 70, 309.99, NULL),
(181, 'JBL Charge 6', 'JBL-SPE-181', 200, 179.99, NULL),
(182, 'Sonos Move 2', 'SON-SPE-182', 80, 449.99, NULL),
(183, 'SoundLink Revolve+ II', 'BOS-SPE-183', 120, 329.99, NULL),
(184, 'Megaboom 4', 'UE-SPE-184', 150, 199.99, NULL),
(185, 'JBL Xtreme 4', 'JBL-SPE-185', 100, 379.99, NULL),
(186, 'Marshall Acton III', 'MAR-SPE-186', 90, 279.99, NULL),
(187, 'Beolit 20', 'BAN-SPE-187', 60, 499.99, NULL),
(188, 'Onyx Studio 8', 'HAR-SPE-188', 80, 199.99, NULL),
(189, 'KEF LSX II LT', 'KEF-SPE-189', 40, 999.99, NULL),
(190, 'Klipsch The Three Plus', 'KLI-SPE-190', 50, 599.99, NULL);

-- Additional Cameras & Photography (Products 191-220) - 30 more products
INSERT INTO products (name, description, brand) VALUES
('Canon EOS R8', 'Entry-level full-frame mirrorless', 'Canon'),
('Sony Alpha A6700', 'APS-C content creator camera', 'Sony'),
('Nikon Z6 III', 'Hybrid photo/video camera', 'Nikon'),
('Fujifilm X-S20', 'Compact creator camera', 'Fujifilm'),
('Panasonic GH6', 'Professional video camera', 'Panasonic'),
('Olympus PEN E-P7', 'Stylish street photography camera', 'Olympus'),
('Leica D-Lux 8', 'Premium compact camera', 'Leica'),
('Ricoh GR IIIx Urban Edition', 'Street photography camera', 'Ricoh'),
('Sigma fp L', 'Smallest full-frame mirrorless', 'Sigma'),
('Hasselblad X1D II 50C', 'Medium format mirrorless', 'Hasselblad'),
('Phase One XT', 'Technical camera system', 'Phase One'),
('Canon PowerShot G5 X Mark III', 'Advanced compact camera', 'Canon'),
('Sony RX100 VII', 'Premium compact camera', 'Sony'),
('Nikon Coolpix P1000', 'Superzoom bridge camera', 'Nikon'),
('Fujifilm X100VI', 'Fixed lens premium compact', 'Fujifilm'),
('GoPro Hero 12 Black Creator Edition', 'Content creator action camera', 'GoPro'),
('DJI Action 4', 'Compact action camera', 'DJI'),
('Insta360 GO 3S', 'Tiny action camera', 'Insta360'),
('Garmin VIRB XE', 'GPS action camera', 'Garmin'),
('Yi 4K Action Camera', 'Budget action camera', 'Yi'),
('Polaroid Now i-Type', 'Instant analog camera', 'Polaroid'),
('Fujifilm Instax Mini 12', 'Compact instant camera', 'Fujifilm'),
('Kodak Mini Shot 3 Retro', 'Instant digital camera', 'Kodak'),
('Canon Ivy CLIQ+2', 'Instant camera printer', 'Canon'),
('HP Sprocket 2-in-1', 'Photo printer camera', 'HP'),
('DJI Mini 4K', 'Ultra-light drone camera', 'DJI'),
('Autel Nano+', 'Compact drone with 4K', 'Autel'),
('Holy Stone HS720E', 'Budget 4K drone', 'Holy Stone'),
('Potensic ATOM SE', 'Entry-level camera drone', 'Potensic'),
('Ruko F11GIM2', 'Gimbal camera drone', 'Ruko');

INSERT INTO product_variants (productId, variantName, SKU, stockQnt, price, imageURL) VALUES
(191, 'Canon EOS R8 Body', 'CAN-CAM-191', 80, 1499.99, NULL),
(192, 'Sony Alpha A6700', 'SON-CAM-192', 90, 1399.99, NULL),
(193, 'Nikon Z6 III Body', 'NIK-CAM-193', 70, 2499.99, NULL),
(194, 'Fujifilm X-S20', 'FUJ-CAM-194', 100, 1299.99, NULL),
(195, 'Panasonic GH6', 'PAN-CAM-195', 60, 1999.99, NULL),
(196, 'Olympus PEN E-P7', 'OLY-CAM-196', 110, 899.99, NULL),
(197, 'Leica D-Lux 8', 'LEI-CAM-197', 40, 1395.99, NULL),
(198, 'Ricoh GR IIIx Urban', 'RIC-CAM-198', 80, 999.99, NULL),
(199, 'Sigma fp L', 'SIG-CAM-199', 50, 2499.99, NULL),
(200, 'Hasselblad X1D II 50C', 'HAS-CAM-200', 30, 5750.99, NULL),
(201, 'Phase One XT', 'PHA-CAM-201', 15, 12999.99, NULL),
(202, 'PowerShot G5 X Mark III', 'CAN-CAM-202', 90, 899.99, NULL),
(203, 'Sony RX100 VII', 'SON-CAM-203', 100, 1299.99, NULL),
(204, 'Coolpix P1000', 'NIK-CAM-204', 70, 999.99, NULL),
(205, 'Fujifilm X100VI', 'FUJ-CAM-205', 60, 1599.99, NULL),
(206, 'Hero 12 Creator Edition', 'GOP-CAM-206', 120, 599.99, NULL),
(207, 'DJI Action 4', 'DJI-CAM-207', 150, 399.99, NULL),
(208, 'Insta360 GO 3S', 'INS-CAM-208', 140, 399.99, NULL),
(209, 'Garmin VIRB XE', 'GAR-CAM-209', 80, 399.99, NULL),
(210, 'Yi 4K Action Camera', 'YI-CAM-210', 160, 199.99, NULL),
(211, 'Polaroid Now i-Type', 'POL-CAM-211', 120, 119.99, NULL),
(212, 'Instax Mini 12', 'FUJ-CAM-212', 200, 79.99, NULL),
(213, 'Kodak Mini Shot 3 Retro', 'KOD-CAM-213', 150, 149.99, NULL),
(214, 'Canon Ivy CLIQ+2', 'CAN-CAM-214', 130, 159.99, NULL),
(215, 'HP Sprocket 2-in-1', 'HP-CAM-215', 140, 199.99, NULL),
(216, 'DJI Mini 4K', 'DJI-DRO-216', 100, 599.99, NULL),
(217, 'Autel Nano+', 'AUT-DRO-217', 90, 799.99, NULL),
(218, 'Holy Stone HS720E', 'HOL-DRO-218', 110, 299.99, NULL),
(219, 'Potensic ATOM SE', 'POT-DRO-219', 120, 179.99, NULL),
(220, 'Ruko F11GIM2', 'RUK-DRO-220', 100, 249.99, NULL);

-- Additional Home Appliances (Products 221-250) - 30 more products
INSERT INTO products (name, description, brand) VALUES
('Samsung Neo QLED 8K 85"', 'Premium 8K Neo QLED TV', 'Samsung'),
('LG OLED C4 77"', 'Premium OLED TV', 'LG'),
('Sony Bravia XR A95L 65"', 'QD-OLED premium TV', 'Sony'),
('TCL C845K 75"', 'Mini LED 4K TV', 'TCL'),
('Hisense U8K 65"', 'ULED premium TV', 'Hisense'),
('Philips OLED+ 55"', 'Ambilight OLED TV', 'Philips'),
('Panasonic LZ2000 65"', 'Professional OLED TV', 'Panasonic'),
('Roku Ultra 2024', '4K streaming device', 'Roku'),
('Apple TV 4K 3rd Gen', 'Premium streaming device', 'Apple'),
('NVIDIA Shield TV Pro', 'AI-powered streaming device', 'NVIDIA'),
('Dyson V15s Detect Submarine', 'Wet and dry vacuum cleaner', 'Dyson'),
('Shark Stratos AZ3002', 'Upright vacuum with DuoClean', 'Shark'),
('iRobot Roomba Combo j9+', 'Vacuum and mop robot', 'iRobot'),
('Tineco Floor One S7 Pro', 'Smart wet dry vacuum', 'Tineco'),
('Bissell Pet Hair Eraser Turbo Plus', 'Pet hair vacuum', 'Bissell'),
('Miele Complete C3 Marin', 'Premium canister vacuum', 'Miele'),
('Samsung Bespoke Jet AI', 'Cordless stick vacuum', 'Samsung'),
('LG CordZero A9 Kompressor+', 'Cordless vacuum with compactor', 'LG'),
('Instant Pot Duo Plus 9-in-1', 'Multi-function pressure cooker', 'Instant'),
('Ninja Woodfire Outdoor Grill', 'Electric outdoor grill', 'Ninja'),
('Breville Smart Oven Air Fryer Pro', 'Countertop convection oven', 'Breville'),
('Cuisinart TOA-70 AirFryer', 'Toaster oven air fryer', 'Cuisinart'),
('KitchenAid Artisan Stand Mixer', 'Classic stand mixer', 'KitchenAid'),
('Vitamix Ascent A2300', 'Professional blender', 'Vitamix'),
('Breville Barista Touch Impress', 'Semi-automatic espresso machine', 'Breville'),
('De Longhi La Specialista Maestro', 'Bean-to-cup coffee machine', 'De Longhi'),
('Nespresso Creatista Plus', 'Automatic coffee machine', 'Nespresso'),
('Keurig K-Supreme Plus Smart', 'Smart single-serve coffee maker', 'Keurig'),
('Philips 3200 Series LatteGo', 'Automatic espresso machine', 'Philips'),
('Jura E8 Piano', 'Premium automatic coffee center', 'Jura');

INSERT INTO product_variants (productId, variantName, SKU, stockQnt, price, imageURL) VALUES
(221, 'Neo QLED 8K 85"', 'SAM-TV-221', 20, 6999.99, NULL),
(222, 'LG OLED C4 77"', 'LG-TV-222', 30, 3499.99, NULL),
(223, 'Bravia XR A95L 65"', 'SON-TV-223', 40, 2999.99, NULL),
(224, 'TCL C845K 75"', 'TCL-TV-224', 50, 1999.99, NULL),
(225, 'Hisense U8K 65"', 'HIS-TV-225', 60, 1499.99, NULL),
(226, 'Philips OLED+ 55"', 'PHI-TV-226', 40, 1899.99, NULL),
(227, 'Panasonic LZ2000 65"', 'PAN-TV-227', 30, 2799.99, NULL),
(228, 'Roku Ultra 2024', 'ROK-STR-228', 150, 99.99, NULL),
(229, 'Apple TV 4K 3rd Gen', 'APP-STR-229', 120, 179.99, NULL),
(230, 'NVIDIA Shield TV Pro', 'NVI-STR-230', 100, 199.99, NULL),
(231, 'V15s Detect Submarine', 'DYS-VAC-231', 80, 949.99, NULL),
(232, 'Shark Stratos AZ3002', 'SHA-VAC-232', 100, 399.99, NULL),
(233, 'Roomba Combo j9+', 'IRO-VAC-233', 70, 1399.99, NULL),
(234, 'Floor One S7 Pro', 'TIN-VAC-234', 90, 449.99, NULL),
(235, 'Pet Hair Eraser Turbo Plus', 'BIS-VAC-235', 120, 179.99, NULL),
(236, 'Complete C3 Marin', 'MIE-VAC-236', 60, 699.99, NULL),
(237, 'Bespoke Jet AI', 'SAM-VAC-237', 80, 599.99, NULL),
(238, 'CordZero A9 Kompressor+', 'LG-VAC-238', 90, 549.99, NULL),
(239, 'Duo Plus 9-in-1', 'INS-KIT-239', 200, 149.99, NULL),
(240, 'Woodfire Outdoor Grill', 'NIN-KIT-240', 60, 399.99, NULL),
(241, 'Smart Oven Air Fryer Pro', 'BRE-KIT-241', 80, 449.99, NULL),
(242, 'TOA-70 AirFryer', 'CUI-KIT-242', 100, 299.99, NULL),
(243, 'Artisan Stand Mixer', 'KIT-KIT-243', 120, 429.99, NULL),
(244, 'Ascent A2300', 'VIT-KIT-244', 80, 449.99, NULL),
(245, 'Barista Touch Impress', 'BRE-COF-245', 60, 999.99, NULL),
(246, 'La Specialista Maestro', 'DEL-COF-246', 50, 899.99, NULL),
(247, 'Creatista Plus', 'NES-COF-247', 70, 699.99, NULL),
(248, 'K-Supreme Plus Smart', 'KEU-COF-248', 150, 199.99, NULL),
(249, 'Philips 3200 LatteGo', 'PHI-COF-249', 90, 799.99, NULL),
(250, 'Jura E8 Piano', 'JUR-COF-250', 40, 2399.99, NULL);

-- Associate new products with categories
INSERT INTO product_categories (productId, categoryId) VALUES
-- Additional Audio Devices (161-190)
(161, 3), (162, 3), (163, 3), (164, 3), (165, 3), (166, 3), (167, 3), (168, 3), (169, 3), (170, 3),
(171, 3), (172, 3), (173, 3), (174, 3), (175, 3), (176, 3), (177, 3), (178, 3), (179, 3), (180, 3),
(181, 3), (182, 3), (183, 3), (184, 3), (185, 3), (186, 3), (187, 3), (188, 3), (189, 3), (190, 3),
-- Additional Cameras & Photography (191-220)
(191, 4), (192, 4), (193, 4), (194, 4), (195, 4), (196, 4), (197, 4), (198, 4), (199, 4), (200, 4),
(201, 4), (202, 4), (203, 4), (204, 4), (205, 4), (206, 4), (207, 4), (208, 4), (209, 4), (210, 4),
(211, 4), (212, 4), (213, 4), (214, 4), (215, 4), (216, 4), (217, 4), (218, 4), (219, 4), (220, 4),
-- Additional Home Appliances (221-250)
(221, 5), (222, 5), (223, 5), (224, 5), (225, 5), (226, 5), (227, 5), (228, 5), (229, 5), (230, 5),
(231, 5), (232, 5), (233, 5), (234, 5), (235, 5), (236, 5), (237, 5), (238, 5), (239, 5), (240, 5),
(241, 5), (242, 5), (243, 5), (244, 5), (245, 5), (246, 5), (247, 5), (248, 5), (249, 5), (250, 5);

-- Additional Wearable & Smart Devices (Products 251-280) - 30 more products
INSERT INTO products (name, description, brand) VALUES
('Apple Watch Ultra 2', 'Rugged smartwatch for adventures', 'Apple'),
('Samsung Galaxy Watch6 Classic', 'Premium rotating bezel smartwatch', 'Samsung'),
('Google Pixel Watch 2', 'Wear OS smartwatch with Fitbit integration', 'Google'),
('Garmin Forerunner 965', 'Premium GPS running watch', 'Garmin'),
('Fitbit Sense 2', 'Health and wellness smartwatch', 'Fitbit'),
('Amazfit GTR 4', 'Long-lasting fitness smartwatch', 'Amazfit'),
('Huawei Watch GT 4', 'Elegant smartwatch with HarmonyOS', 'Huawei'),
('Polar Vantage V3', 'Advanced training watch', 'Polar'),
('Suunto 9 Peak Pro', 'Adventure GPS watch', 'Suunto'),
('TicWatch Pro 5', 'Wear OS watch with dual display', 'TicWatch'),
('Withings ScanWatch Nova', 'Hybrid smartwatch with ECG', 'Withings'),
('Fossil Gen 6 Wellness', 'Wear OS wellness watch', 'Fossil'),
('Skagen Falster Gen 6', 'Minimalist Wear OS watch', 'Skagen'),
('TAG Heuer Connected Calibre E4', 'Luxury Swiss smartwatch', 'TAG Heuer'),
('Montblanc Summit 3', 'Premium Wear OS watch', 'Montblanc'),
('Xiaomi Mi Band 8 Pro', 'Affordable fitness tracker', 'Xiaomi'),
('Honor Band 7', 'Budget fitness tracker', 'Honor'),
('Realme Band 2', 'Entry-level fitness band', 'Realme'),
('OnePlus Watch 2', 'Premium Android smartwatch', 'OnePlus'),
('Nothing Watch (1)', 'Transparent design smartwatch', 'Nothing'),
('Oura Ring Gen 3', 'Smart ring for health tracking', 'Oura'),
('Motiv Ring', 'Fitness tracking smart ring', 'Motiv'),
('McLear RingPay', 'Contactless payment ring', 'McLear'),
('Circular Ring', 'Health monitoring smart ring', 'Circular'),
('RingConn Smart Ring', 'Affordable health tracking ring', 'RingConn'),
('Meta Quest 3', 'Mixed reality VR headset', 'Meta'),
('Apple Vision Pro', 'Spatial computing headset', 'Apple'),
('PICO 4 Ultra', 'Standalone VR headset', 'PICO'),
('HTC Vive XR Elite', 'All-in-one VR headset', 'HTC'),
('Varjo Aero', 'High-resolution VR headset', 'Varjo');

INSERT INTO product_variants (productId, variantName, SKU, stockQnt, price, imageURL) VALUES
(251, 'Apple Watch Ultra 2 49mm', 'APP-WEA-251', 80, 799.99, NULL),
(252, 'Galaxy Watch6 Classic 47mm', 'SAM-WEA-252', 90, 429.99, NULL),
(253, 'Pixel Watch 2 41mm', 'GOO-WEA-253', 100, 349.99, NULL),
(254, 'Forerunner 965', 'GAR-WEA-254', 70, 599.99, NULL),
(255, 'Fitbit Sense 2', 'FIT-WEA-255', 120, 299.99, NULL),
(256, 'Amazfit GTR 4 46mm', 'AMZ-WEA-256', 130, 199.99, NULL),
(257, 'Huawei Watch GT 4 46mm', 'HUA-WEA-257', 110, 279.99, NULL),
(258, 'Polar Vantage V3', 'POL-WEA-258', 60, 599.99, NULL),
(259, 'Suunto 9 Peak Pro', 'SUU-WEA-259', 50, 649.99, NULL),
(260, 'TicWatch Pro 5', 'TIC-WEA-260', 80, 359.99, NULL),
(261, 'ScanWatch Nova 42mm', 'WIT-WEA-261', 70, 499.99, NULL),
(262, 'Fossil Gen 6 Wellness', 'FOS-WEA-262', 90, 255.99, NULL),
(263, 'Skagen Falster Gen 6', 'SKA-WEA-263', 80, 295.99, NULL),
(264, 'TAG Connected Calibre E4', 'TAG-WEA-264', 30, 1799.99, NULL),
(265, 'Montblanc Summit 3', 'MON-WEA-265', 25, 1290.99, NULL),
(266, 'Mi Band 8 Pro', 'XIA-WEA-266', 200, 69.99, NULL),
(267, 'Honor Band 7', 'HON-WEA-267', 180, 39.99, NULL),
(268, 'Realme Band 2', 'REA-WEA-268', 220, 29.99, NULL),
(269, 'OnePlus Watch 2', 'ONE-WEA-269', 100, 299.99, NULL),
(270, 'Nothing Watch (1)', 'NOT-WEA-270', 60, 149.99, NULL),
(271, 'Oura Ring Gen 3', 'OUR-RIN-271', 90, 299.99, NULL),
(272, 'Motiv Ring', 'MOT-RIN-272', 70, 199.99, NULL),
(273, 'McLear RingPay', 'MCL-RIN-273', 80, 149.99, NULL),
(274, 'Circular Ring', 'CIR-RIN-274', 100, 259.99, NULL),
(275, 'RingConn Smart Ring', 'RIN-RIN-275', 120, 179.99, NULL),
(276, 'Meta Quest 3 512GB', 'MET-VR-276', 150, 649.99, NULL),
(277, 'Apple Vision Pro 1TB', 'APP-VR-277', 50, 3999.99, NULL),
(278, 'PICO 4 Ultra 256GB', 'PIC-VR-278', 80, 799.99, NULL),
(279, 'HTC Vive XR Elite', 'HTC-VR-279', 60, 1399.99, NULL),
(280, 'Varjo Aero', 'VAR-VR-280', 30, 1990.99, NULL);

-- Additional Power & Charging (Products 281-310) - 30 more products
INSERT INTO products (name, description, brand) VALUES
('Anker Prime 27650mAh', 'Ultra-high capacity power bank', 'Anker'),
('RAVPower 30000mAh PD', 'Massive capacity portable charger', 'RAVPower'),
('AUKEY Omnia 200W', 'Super high-power GaN charger', 'AUKEY'),
('Baseus 100W GaN5 Pro', 'Compact 4-port fast charger', 'Baseus'),
('UGreen Nexode Pro 160W', 'Desktop charging station', 'UGreen'),
('Satechi 165W USB-C 4-Port', 'Premium desktop charger', 'Satechi'),
('HyperJuice 245W GaN Charger', 'Ultra-powerful laptop charger', 'HyperJuice'),
('Belkin 3-in-1 MagSafe Stand', 'Wireless charging station', 'Belkin'),
('Mophie 3-in-1 Travel Charger', 'Foldable wireless charging pad', 'Mophie'),
('Native Union Drop XL Wireless', 'Premium wireless charging pad', 'Native Union'),
('Goal Zero Yeti 1500X', 'Portable power station', 'Goal Zero'),
('Jackery Explorer 1000 Pro', 'Solar-ready power station', 'Jackery'),
('EcoFlow Delta 2', 'Fast-charging portable power', 'EcoFlow'),
('Bluetti EB240', 'High-capacity power station', 'Bluetti'),
('MAXOAK K2 50000mAh', 'Laptop power bank', 'MAXOAK'),
('Omni 20+ Wireless', 'All-in-one charging hub', 'Omni'),
('ChargeTech Portable Outlet', 'AC power bank', 'ChargeTech'),
('Renogy Phoenix 200', 'Solar power generator', 'Renogy'),
('Rockpals 300W Power Station', 'Compact portable power', 'Rockpals'),
('ALLPOWERS S2000 Pro', 'Solar power station', 'ALLPOWERS'),
('Tesla Mobile Connector', 'Electric vehicle charger', 'Tesla'),
('ChargePoint Home Flex', 'EV home charging station', 'ChargePoint'),
('JuiceBox 40', 'Smart EV charger', 'JuiceBox'),
('Grizzl-E Classic', 'Durable EV charger', 'Grizzl-E'),
('Emporia Vue', 'Smart EV charging station', 'Emporia'),
('Duracell Ion Speed 1000', 'Fast charging power bank', 'Duracell'),
('Energizer Ultimate Lithium', 'High-performance batteries', 'Energizer'),
('Panasonic Eneloop Pro', 'Rechargeable AA batteries', 'Panasonic'),
('Nitecore D4 Universal Charger', 'Multi-chemistry battery charger', 'Nitecore'),
('XTAR VC4S Li-ion Charger', 'Smart battery charger', 'XTAR');

INSERT INTO product_variants (productId, variantName, SKU, stockQnt, price, imageURL) VALUES
(281, 'Prime 27650mAh', 'ANK-POW-281', 100, 199.99, NULL),
(282, 'RAVPower 30000mAh PD', 'RAV-POW-282', 80, 89.99, NULL),
(283, 'AUKEY Omnia 200W', 'AUK-POW-283', 120, 149.99, NULL),
(284, 'Baseus 100W GaN5 Pro', 'BAS-POW-284', 150, 79.99, NULL),
(285, 'UGreen Nexode Pro 160W', 'UGR-POW-285', 100, 129.99, NULL),
(286, 'Satechi 165W 4-Port', 'SAT-POW-286', 80, 199.99, NULL),
(287, 'HyperJuice 245W GaN', 'HYP-POW-287', 60, 249.99, NULL),
(288, 'Belkin 3-in-1 MagSafe', 'BEL-POW-288', 120, 149.99, NULL),
(289, 'Mophie 3-in-1 Travel', 'MOP-POW-289', 100, 119.99, NULL),
(290, 'Native Union Drop XL', 'NAT-POW-290', 90, 99.99, NULL),
(291, 'Goal Zero Yeti 1500X', 'GOA-POW-291', 30, 1999.99, NULL),
(292, 'Explorer 1000 Pro', 'JAC-POW-292', 40, 999.99, NULL),
(293, 'EcoFlow Delta 2', 'ECO-POW-293', 50, 999.99, NULL),
(294, 'Bluetti EB240', 'BLU-POW-294', 40, 1799.99, NULL),
(295, 'MAXOAK K2 50000mAh', 'MAX-POW-295', 60, 399.99, NULL),
(296, 'Omni 20+ Wireless', 'OMN-POW-296', 70, 199.99, NULL),
(297, 'ChargeTech Portable Outlet', 'CHA-POW-297', 50, 299.99, NULL),
(298, 'Renogy Phoenix 200', 'REN-POW-298', 40, 799.99, NULL),
(299, 'Rockpals 300W', 'ROC-POW-299', 60, 299.99, NULL),
(300, 'ALLPOWERS S2000 Pro', 'ALL-POW-300', 30, 1699.99, NULL),
(301, 'Tesla Mobile Connector', 'TES-EV-301', 100, 275.99, NULL),
(302, 'ChargePoint Home Flex', 'CHP-EV-302', 50, 699.99, NULL),
(303, 'JuiceBox 40', 'JUI-EV-303', 40, 599.99, NULL),
(304, 'Grizzl-E Classic', 'GRI-EV-304', 60, 399.99, NULL),
(305, 'Emporia Vue', 'EMP-EV-305', 50, 449.99, NULL),
(306, 'Duracell Ion Speed 1000', 'DUR-BAT-306', 200, 49.99, NULL),
(307, 'Energizer Ultimate Lithium', 'ENE-BAT-307', 300, 19.99, NULL),
(308, 'Panasonic Eneloop Pro', 'PAN-BAT-308', 250, 29.99, NULL),
(309, 'Nitecore D4 Universal', 'NIT-CHA-309', 80, 59.99, NULL),
(310, 'XTAR VC4S Li-ion', 'XTA-CHA-310', 70, 49.99, NULL);

-- Additional Personal Care & Health (Products 311-340) - 30 more products
INSERT INTO products (name, description, brand) VALUES
('Philips Sonicare 9900 Prestige', 'Premium electric toothbrush', 'Philips'),
('Oral-B iO10 Series', 'AI-powered electric toothbrush', 'Oral-B'),
('Waterpik Sonic-Fusion 2.0', 'Electric toothbrush with water flosser', 'Waterpik'),
('Quip Metal Electric Toothbrush', 'Minimalist electric toothbrush', 'Quip'),
('Burst Sonic Toothbrush', 'Subscription-based sonic toothbrush', 'Burst'),
('Braun Series X Electric Shaver', 'Professional electric shaver', 'Braun'),
('Panasonic Arc5 ES-LV67-K', '5-blade electric shaver', 'Panasonic'),
('Philips Norelco 9800', 'Wet/dry electric shaver', 'Philips'),
('Wahl Lifeproof Shaver', 'Waterproof electric shaver', 'Wahl'),
('Remington F5-5800', 'Affordable electric shaver', 'Remington'),
('Dyson Corrale Hair Straightener', 'Cordless hair straightener', 'Dyson'),
('ghd Platinum+ Styler', 'Professional hair straightener', 'ghd'),
('BaBylissPRO Nano Titanium', 'Titanium hair straightener', 'BaBylissPRO'),
('HSI Professional Glider', 'Ceramic tourmaline hair straightener', 'HSI'),
('REVLON One-Step Volumizer', 'Hair dryer brush', 'REVLON'),
('Withings Body Cardio', 'Smart scale with heart rate', 'Withings'),
('Garmin Index S2', 'Smart scale with metrics', 'Garmin'),
('Fitbit Aria Air', 'Bluetooth smart scale', 'Fitbit'),
('Eufy Smart Scale P2 Pro', 'Body composition scale', 'Eufy'),
('RENPHO Body Fat Scale', 'WiFi smart scale', 'RENPHO'),
('Omron Complete Wireless', 'Upper arm blood pressure monitor', 'Omron'),
('Beurer BM67 Bluetooth', 'Bluetooth blood pressure monitor', 'Beurer'),
('iHealth Clear Wireless', 'Wireless blood pressure monitor', 'iHealth'),
('LAZLE Blood Pressure Monitor', 'Automatic BP monitor', 'LAZLE'),
('LifeSource Digital Monitor', 'Digital blood pressure monitor', 'LifeSource'),
('Theragun Elite', 'Percussive therapy massager', 'Theragun'),
('Hyperice Hypervolt 2 Pro', 'Quiet percussion massager', 'Hyperice'),
('OPOVE M3 Pro Massage Gun', 'Deep tissue massage gun', 'OPOVE'),
('Achedaway Pro Massage Gun', 'Professional massage device', 'Achedaway'),
('RENPHO R3 Mini Massage Gun', 'Compact massage gun', 'RENPHO');

INSERT INTO product_variants (productId, variantName, SKU, stockQnt, price, imageURL) VALUES
(311, 'Sonicare 9900 Prestige', 'PHI-HEA-311', 80, 379.99, NULL),
(312, 'Oral-B iO10 Series', 'ORA-HEA-312', 90, 349.99, NULL),
(313, 'Sonic-Fusion 2.0', 'WAT-HEA-313', 70, 199.99, NULL),
(314, 'Quip Metal Electric', 'QUI-HEA-314', 120, 75.99, NULL),
(315, 'Burst Sonic Toothbrush', 'BUR-HEA-315', 150, 69.99, NULL),
(316, 'Braun Series X', 'BRA-HEA-316', 100, 299.99, NULL),
(317, 'Panasonic Arc5 ES-LV67-K', 'PAN-HEA-317', 80, 249.99, NULL),
(318, 'Norelco 9800', 'PHI-HEA-318', 90, 199.99, NULL),
(319, 'Wahl Lifeproof', 'WAH-HEA-319', 110, 129.99, NULL),
(320, 'Remington F5-5800', 'REM-HEA-320', 140, 79.99, NULL),
(321, 'Dyson Corrale', 'DYS-HEA-321', 60, 499.99, NULL),
(322, 'ghd Platinum+ Styler', 'GHD-HEA-322', 80, 249.99, NULL),
(323, 'BaBylissPRO Nano', 'BAB-HEA-323', 100, 89.99, NULL),
(324, 'HSI Professional Glider', 'HSI-HEA-324', 120, 49.99, NULL),
(325, 'REVLON One-Step', 'REV-HEA-325', 150, 59.99, NULL),
(326, 'Withings Body Cardio', 'WIT-HEA-326', 90, 199.99, NULL),
(327, 'Garmin Index S2', 'GAR-HEA-327', 80, 149.99, NULL),
(328, 'Fitbit Aria Air', 'FIT-HEA-328', 120, 49.99, NULL),
(329, 'Eufy Smart Scale P2 Pro', 'EUF-HEA-329', 100, 79.99, NULL),
(330, 'RENPHO Body Fat Scale', 'REN-HEA-330', 180, 29.99, NULL),
(331, 'Omron Complete Wireless', 'OMR-HEA-331', 110, 149.99, NULL),
(332, 'Beurer BM67 Bluetooth', 'BEU-HEA-332', 90, 99.99, NULL),
(333, 'iHealth Clear Wireless', 'IHE-HEA-333', 100, 79.99, NULL),
(334, 'LAZLE BP Monitor', 'LAZ-HEA-334', 120, 59.99, NULL),
(335, 'LifeSource Digital', 'LIF-HEA-335', 130, 39.99, NULL),
(336, 'Theragun Elite', 'THE-HEA-336', 70, 399.99, NULL),
(337, 'Hypervolt 2 Pro', 'HYP-HEA-337', 60, 349.99, NULL),
(338, 'OPOVE M3 Pro', 'OPO-HEA-338', 80, 199.99, NULL),
(339, 'Achedaway Pro', 'ACH-HEA-339', 70, 299.99, NULL),
(340, 'RENPHO R3 Mini', 'REN-HEA-340', 120, 99.99, NULL);

-- Additional Security & Safety (Products 341-370) - 30 more products
INSERT INTO products (name, description, brand) VALUES
('Ring Alarm Pro Base Station', 'Professional security system hub', 'Ring'),
('SimpliSafe Wireless Home Security', 'DIY wireless security system', 'SimpliSafe'),
('ADT Command Smart Security Panel', 'Professional security control panel', 'ADT'),
('Abode Iota All-in-One Gateway', 'Smart security gateway', 'Abode'),
('Scout Alarm DIY Security', 'Touchscreen security system', 'Scout'),
('Kangaroo Home Security Kit', 'Affordable DIY security', 'Kangaroo'),
('Cove Security System', 'Professional monitoring system', 'Cove'),
('Frontpoint Security System', 'Wireless security solution', 'Frontpoint'),
('Vivint Smart Home Security', 'Professional smart security', 'Vivint'),
('Blue by ADT DIY Security', 'Self-monitored security', 'Blue by ADT'),
('Nest Doorbell Battery', 'Wireless video doorbell', 'Google'),
('Ring Video Doorbell 4', 'Advanced video doorbell', 'Ring'),
('Arlo Essential Video Doorbell', 'Wire-free video doorbell', 'Arlo'),
('Eufy Video Doorbell 2K', 'Local storage video doorbell', 'Eufy'),
('Reolink Video Doorbell WiFi', 'PoE video doorbell', 'Reolink'),
('Amcrest Smart Video Doorbell', '4MP video doorbell', 'Amcrest'),
('SkyBell Trim Plus', 'Slim profile video doorbell', 'SkyBell'),
('RemoBell S', 'WiFi video doorbell', 'RemoBell'),
('Clare Video Doorbell', 'Professional grade doorbell', 'Clare'),
('Doorbird D2101V', 'Premium IP video doorbell', 'Doorbird'),
('Aqara Door and Window Sensor', 'Zigbee door sensor', 'Aqara'),
('Ring Contact Sensor', 'Wireless contact sensor', 'Ring'),
('SimpliSafe Entry Sensor', 'Wireless entry sensor', 'SimpliSafe'),
('Honeywell 5816WMWH', 'Wireless door/window sensor', 'Honeywell'),
('Ecolink DWZWAVE2.5-ECO', 'Z-Wave door sensor', 'Ecolink'),
('First Alert Smoke Detector', 'Wireless smoke alarm', 'First Alert'),
('Nest Protect 2nd Gen', 'Smart smoke and CO detector', 'Google'),
('Kidde RemoteLync Monitor', 'Wireless smoke monitor', 'Kidde'),
('X-Sense Wireless Smoke Detector', 'Interconnected smoke alarm', 'X-Sense'),
('FireAngel Wi-Safe 2', 'Wireless interlinked smoke alarm', 'FireAngel');

INSERT INTO product_variants (productId, variantName, SKU, stockQnt, price, imageURL) VALUES
(341, 'Ring Alarm Pro Base', 'RIN-SEC-341', 60, 299.99, NULL),
(342, 'SimpliSafe Wireless Kit', 'SIM-SEC-342', 80, 229.99, NULL),
(343, 'ADT Command Panel', 'ADT-SEC-343', 40, 499.99, NULL),
(344, 'Abode Iota Gateway', 'ABO-SEC-344', 70, 329.99, NULL),
(345, 'Scout Alarm DIY', 'SCO-SEC-345', 50, 199.99, NULL),
(346, 'Kangaroo Security Kit', 'KAN-SEC-346', 100, 99.99, NULL),
(347, 'Cove Security System', 'COV-SEC-347', 60, 299.99, NULL),
(348, 'Frontpoint Security', 'FRO-SEC-348', 50, 399.99, NULL),
(349, 'Vivint Smart Security', 'VIV-SEC-349', 30, 599.99, NULL),
(350, 'Blue by ADT DIY', 'BLU-SEC-350', 80, 199.99, NULL),
(351, 'Nest Doorbell Battery', 'GOO-DOO-351', 120, 179.99, NULL),
(352, 'Ring Video Doorbell 4', 'RIN-DOO-352', 150, 199.99, NULL),
(353, 'Arlo Essential Doorbell', 'ARL-DOO-353', 100, 199.99, NULL),
(354, 'Eufy Video Doorbell 2K', 'EUF-DOO-354', 130, 159.99, NULL),
(355, 'Reolink Video Doorbell', 'REO-DOO-355', 90, 129.99, NULL),
(356, 'Amcrest Smart Doorbell', 'AMC-DOO-356', 80, 149.99, NULL),
(357, 'SkyBell Trim Plus', 'SKY-DOO-357', 70, 199.99, NULL),
(358, 'RemoBell S', 'REM-DOO-358', 90, 99.99, NULL),
(359, 'Clare Video Doorbell', 'CLA-DOO-359', 60, 249.99, NULL),
(360, 'Doorbird D2101V', 'DOO-DOO-360', 40, 399.99, NULL),
(361, 'Aqara Door Sensor', 'AQA-SEN-361', 200, 19.99, NULL),
(362, 'Ring Contact Sensor', 'RIN-SEN-362', 180, 29.99, NULL),
(363, 'SimpliSafe Entry Sensor', 'SIM-SEN-363', 150, 19.99, NULL),
(364, 'Honeywell 5816WMWH', 'HON-SEN-364', 120, 39.99, NULL),
(365, 'Ecolink DWZWAVE2.5', 'ECO-SEN-365', 100, 34.99, NULL),
(366, 'First Alert Smoke', 'FIR-SMO-366', 150, 49.99, NULL),
(367, 'Nest Protect 2nd Gen', 'GOO-SMO-367', 100, 119.99, NULL),
(368, 'Kidde RemoteLync', 'KID-SMO-368', 80, 199.99, NULL),
(369, 'X-Sense Wireless Smoke', 'XSE-SMO-369', 120, 79.99, NULL),
(370, 'FireAngel Wi-Safe 2', 'FIR-SMO-370', 100, 89.99, NULL);

-- Additional Toys & Gadgets (Products 371-400) - 30 more products
INSERT INTO products (name, description, brand) VALUES
('Steam Deck OLED 1TB', 'Premium handheld gaming PC', 'Valve'),
('ASUS ROG Ally X', 'Windows handheld gaming device', 'ASUS'),
('Lenovo Legion Go', 'Detachable handheld PC', 'Lenovo'),
('AYN Odin Pro', 'Android gaming handheld', 'AYN'),
('Retroid Pocket 4 Pro', 'Retro gaming handheld', 'Retroid'),
('Anbernic RG556', 'Portable retro console', 'Anbernic'),
('PowKiddy RGB30', 'Budget retro handheld', 'PowKiddy'),
('Miyoo Mini Plus', 'Ultra-portable retro device', 'Miyoo'),
('Analogue Pocket', 'FPGA retro handheld', 'Analogue'),
('Evercade EXP', 'Cartridge-based handheld', 'Evercade'),
('PlayStation Portal', 'PS5 remote play handheld', 'Sony'),
('Logitech G Cloud', 'Cloud gaming handheld', 'Logitech'),
('Razer Edge 5G', '5G Android gaming tablet', 'Razer'),
('Nintendo Switch OLED Pokemon', 'Special edition Switch', 'Nintendo'),
('Meta Quest 3S', 'Entry-level VR headset', 'Meta'),
('DJI Mini 4 Pro', 'Ultra-light camera drone', 'DJI'),
('Autel EVO Lite+', '6K camera drone', 'Autel'),
('Holy Stone HS720G', 'GPS 4K drone', 'Holy Stone'),
('Potensic Dreamer Pro', '4K camera drone', 'Potensic'),
('Ruko F11 Pro', 'Budget 4K drone', 'Ruko'),
('Lego Technic Liebherr', 'Advanced construction set', 'Lego'),
('Lego Creator Expert Modular', 'Architectural building set', 'Lego'),
('K NEX Thrill Rides', 'Roller coaster building set', 'K NEX'),
('Meccano 25 Model Set', 'Metal construction kit', 'Meccano'),
('Erector by Meccano', 'Motorized building set', 'Erector'),
('Sphero RVR+', 'Programmable robot rover', 'Sphero'),
('Wonder Workshop Dash Robot', 'Educational coding robot', 'Wonder Workshop'),
('Makeblock mBot Ranger', 'Transformable STEM robot', 'Makeblock'),
('Lego Mindstorms Robot Inventor', 'Programmable robot kit', 'Lego'),
('Thames & Kosmos Robotics Kit', 'Smart machines building kit', 'Thames & Kosmos');

INSERT INTO product_variants (productId, variantName, SKU, stockQnt, price, imageURL) VALUES
(371, 'Steam Deck OLED 1TB', 'VAL-TOY-371', 60, 649.99, NULL),
(372, 'ASUS ROG Ally X', 'ASU-TOY-372', 70, 799.99, NULL),
(373, 'Lenovo Legion Go', 'LEN-TOY-373', 80, 699.99, NULL),
(374, 'AYN Odin Pro', 'AYN-TOY-374', 50, 469.99, NULL),
(375, 'Retroid Pocket 4 Pro', 'RET-TOY-375', 90, 219.99, NULL),
(376, 'Anbernic RG556', 'ANB-TOY-376', 100, 189.99, NULL),
(377, 'PowKiddy RGB30', 'POW-TOY-377', 120, 99.99, NULL),
(378, 'Miyoo Mini Plus', 'MIY-TOY-378', 110, 79.99, NULL),
(379, 'Analogue Pocket', 'ANA-TOY-379', 40, 219.99, NULL),
(380, 'Evercade EXP', 'EVE-TOY-380', 80, 99.99, NULL),
(381, 'PlayStation Portal', 'SON-TOY-381', 100, 199.99, NULL),
(382, 'Logitech G Cloud', 'LOG-TOY-382', 90, 349.99, NULL),
(383, 'Razer Edge 5G', 'RAZ-TOY-383', 60, 399.99, NULL),
(384, 'Switch OLED Pokemon', 'NIN-TOY-384', 80, 359.99, NULL),
(385, 'Meta Quest 3S', 'MET-TOY-385', 120, 299.99, NULL),
(386, 'DJI Mini 4 Pro', 'DJI-TOY-386', 100, 759.99, NULL),
(387, 'Autel EVO Lite+', 'AUT-TOY-387', 70, 1049.99, NULL),
(388, 'Holy Stone HS720G', 'HOL-TOY-388', 90, 299.99, NULL),
(389, 'Potensic Dreamer Pro', 'POT-TOY-389', 80, 399.99, NULL),
(390, 'Ruko F11 Pro', 'RUK-TOY-390', 100, 199.99, NULL),
(391, 'Lego Technic Liebherr', 'LEG-TOY-391', 50, 479.99, NULL),
(392, 'Lego Creator Modular', 'LEG-TOY-392', 60, 279.99, NULL),
(393, 'K NEX Thrill Rides', 'KNE-TOY-393', 70, 199.99, NULL),
(394, 'Meccano 25 Model Set', 'MEC-TOY-394', 80, 149.99, NULL),
(395, 'Erector by Meccano', 'ERE-TOY-395', 90, 129.99, NULL),
(396, 'Sphero RVR+', 'SPH-TOY-396', 100, 499.99, NULL),
(397, 'Wonder Workshop Dash', 'WON-TOY-397', 120, 149.99, NULL),
(398, 'Makeblock mBot Ranger', 'MAK-TOY-398', 80, 189.99, NULL),
(399, 'Mindstorms Robot Inventor', 'LEG-TOY-399', 60, 359.99, NULL),
(400, 'Thames Kosmos Robotics', 'THA-TOY-400', 70, 249.99, NULL);

-- Associate final products with categories
INSERT INTO product_categories (productId, categoryId) VALUES
-- Additional Wearable & Smart Devices (251-280)
(251, 6), (252, 6), (253, 6), (254, 6), (255, 6), (256, 6), (257, 6), (258, 6), (259, 6), (260, 6),
(261, 6), (262, 6), (263, 6), (264, 6), (265, 6), (266, 6), (267, 6), (268, 6), (269, 6), (270, 6),
(271, 6), (272, 6), (273, 6), (274, 6), (275, 6), (276, 6), (277, 6), (278, 6), (279, 6), (280, 6),
-- Additional Power & Charging (281-310)
(281, 7), (282, 7), (283, 7), (284, 7), (285, 7), (286, 7), (287, 7), (288, 7), (289, 7), (290, 7),
(291, 7), (292, 7), (293, 7), (294, 7), (295, 7), (296, 7), (297, 7), (298, 7), (299, 7), (300, 7),
(301, 7), (302, 7), (303, 7), (304, 7), (305, 7), (306, 7), (307, 7), (308, 7), (309, 7), (310, 7),
-- Additional Personal Care & Health (311-340)
(311, 8), (312, 8), (313, 8), (314, 8), (315, 8), (316, 8), (317, 8), (318, 8), (319, 8), (320, 8),
(321, 8), (322, 8), (323, 8), (324, 8), (325, 8), (326, 8), (327, 8), (328, 8), (329, 8), (330, 8),
(331, 8), (332, 8), (333, 8), (334, 8), (335, 8), (336, 8), (337, 8), (338, 8), (339, 8), (340, 8),
-- Additional Security & Safety (341-370)
(341, 9), (342, 9), (343, 9), (344, 9), (345, 9), (346, 9), (347, 9), (348, 9), (349, 9), (350, 9),
(351, 9), (352, 9), (353, 9), (354, 9), (355, 9), (356, 9), (357, 9), (358, 9), (359, 9), (360, 9),
(361, 9), (362, 9), (363, 9), (364, 9), (365, 9), (366, 9), (367, 9), (368, 9), (369, 9), (370, 9),
-- Additional Toys & Gadgets (371-400)
(371, 10), (372, 10), (373, 10), (374, 10), (375, 10), (376, 10), (377, 10), (378, 10), (379, 10), (380, 10),
(381, 10), (382, 10), (383, 10), (384, 10), (385, 10), (386, 10), (387, 10), (388, 10), (389, 10), (390, 10),
(391, 10), (392, 10), (393, 10), (394, 10), (395, 10), (396, 10), (397, 10), (398, 10), (399, 10), (400, 10);