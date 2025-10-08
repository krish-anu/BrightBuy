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

-- Personal Care & Health (Products 71-80)
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

INSERT INTO product_categories (productId, categoryId) VALUES
(81, 4), (82, 4), (83, 4), (84, 4), (85, 4), (86, 4), (87, 4), (88, 4), (89, 4), (90, 4);

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

INSERT INTO product_categories (productId, categoryId) VALUES
(91, 5), (92, 5), (93, 5), (94, 5), (95, 5), (96, 5), (97, 5), (98, 5), (99, 5), (100, 5);

-- Additional categorizations for products 51-70
INSERT INTO product_categories (productId, categoryId) VALUES
-- Additional Mobiles & Tablets (Products 51-60)
(51, 1), (52, 1), (53, 1), (54, 1), (55, 1), (56, 1), (57, 1), (58, 1), (59, 1), (60, 1),
-- Additional Laptops & Computers (Products 61-70) 
(61, 2), (62, 2), (63, 2), (64, 2), (65, 2), (66, 2), (67, 2), (68, 2), (69, 2), (70, 2);

-- Recategorize some products to populate missing categories
-- Move gaming headsets back to Audio Devices where they belong
UPDATE product_categories SET categoryId = 3 WHERE productId IN (46, 47, 48, 49, 50); -- Gaming headsets to Audio Devices
-- Move professional headphones back to Audio Devices where they belong  
UPDATE product_categories SET categoryId = 3 WHERE productId IN (41, 42, 43, 44, 45); -- Professional headphones to Audio Devices
-- Keep cameras in Cameras & Photography where they belong
UPDATE product_categories SET categoryId = 4 WHERE productId IN (81, 82, 83, 84, 85, 86, 87, 88, 89, 90); -- All cameras to Cameras & Photography

-- Now properly categorize products for missing categories
-- Add some actual wearable devices, power/charging devices, security devices, and toys
-- We'll need to change some product names/descriptions or add new categorizations based on what makes sense

-- Insert Cities data
INSERT INTO cities (name, isMainCategory) VALUES
('New York', TRUE),
('Los Angeles', TRUE),
('Chicago', TRUE),
('Houston', TRUE),
('Philadelphia', TRUE),
('Phoenix', TRUE),
('San Antonio', TRUE),
('San Diego', TRUE),
('Dallas', TRUE),
('San Jose', TRUE);

-- Insert Users data (including customers and one admin)
INSERT INTO users (email, password, name, role, phone, cityId, role_accepted) VALUES
('admin@brightbuy.com', 'admin123', 'Admin User', 'Admin', '555-0000', 1, TRUE),
('john.smith@email.com', 'password123', 'John Smith', 'Customer', '555-0001', 1, TRUE),
('jane.doe@email.com', 'password123', 'Jane Doe', 'Customer', '555-0002', 2, TRUE),
('mike.johnson@email.com', 'password123', 'Mike Johnson', 'Customer', '555-0003', 3, TRUE),
('sarah.wilson@email.com', 'password123', 'Sarah Wilson', 'Customer', '555-0004', 4, TRUE),
('david.brown@email.com', 'password123', 'David Brown', 'Customer', '555-0005', 5, TRUE),
('lisa.davis@email.com', 'password123', 'Lisa Davis', 'Customer', '555-0006', 6, TRUE),
('robert.miller@email.com', 'password123', 'Robert Miller', 'Customer', '555-0007', 7, TRUE),
('jennifer.garcia@email.com', 'password123', 'Jennifer Garcia', 'Customer', '555-0008', 8, TRUE),
('michael.martinez@email.com', 'password123', 'Michael Martinez', 'Customer', '555-0009', 9, TRUE),
('emily.anderson@email.com', 'password123', 'Emily Anderson', 'Customer', '555-0010', 10, TRUE),
('chris.taylor@email.com', 'password123', 'Chris Taylor', 'Customer', '555-0011', 1, TRUE),
('amanda.thomas@email.com', 'password123', 'Amanda Thomas', 'Customer', '555-0012', 2, TRUE),
('kevin.rodriguez@email.com', 'password123', 'Kevin Rodriguez', 'Customer', '555-0013', 3, TRUE),
('jessica.lee@email.com', 'password123', 'Jessica Lee', 'Customer', '555-0014', 4, TRUE),
('ryan.clark@email.com', 'password123', 'Ryan Clark', 'Customer', '555-0015', 5, TRUE);

-- Insert 35 Orders with different amounts across different months (Jan 2024 - Oct 2025)
INSERT INTO orders (userId, orderDate, totalPrice, deliveryMode, deliveryCharge, status, paymentMethod, estimatedDeliveryDate) VALUES
-- January 2024 orders
(2, '2024-01-15 10:30:00', 1249.99, 'Standard Delivery', 19.99, 'Delivered', 'Card', '2024-01-20 00:00:00'),
(3, '2024-01-18 14:45:00', 849.99, 'Store Pickup', 0.00, 'Delivered', 'Card', NULL),
(4, '2024-01-22 09:15:00', 2999.99, 'Standard Delivery', 29.99, 'Delivered', 'Card', '2024-01-27 00:00:00'),

-- February 2024 orders
(5, '2024-02-05 16:20:00', 599.99, 'Standard Delivery', 15.99, 'Delivered', 'CashOnDelivery', '2024-02-10 00:00:00'),
(6, '2024-02-12 11:30:00', 1899.99, 'Store Pickup', 0.00, 'Delivered', 'Card', NULL),
(7, '2024-02-20 13:45:00', 449.99, 'Standard Delivery', 12.99, 'Delivered', 'Card', '2024-02-25 00:00:00'),

-- March 2024 orders
(8, '2024-03-08 10:15:00', 3499.99, 'Standard Delivery', 39.99, 'Delivered', 'Card', '2024-03-15 00:00:00'),
(9, '2024-03-14 15:30:00', 799.99, 'Store Pickup', 0.00, 'Delivered', 'Card', NULL),
(10, '2024-03-25 12:20:00', 1699.99, 'Standard Delivery', 24.99, 'Delivered', 'CashOnDelivery', '2024-03-30 00:00:00'),

-- April 2024 orders
(11, '2024-04-03 09:45:00', 299.99, 'Standard Delivery', 9.99, 'Delivered', 'Card', '2024-04-08 00:00:00'),
(12, '2024-04-16 14:10:00', 2499.99, 'Store Pickup', 0.00, 'Delivered', 'Card', NULL),
(13, '2024-04-28 11:55:00', 649.99, 'Standard Delivery', 16.99, 'Delivered', 'Card', '2024-05-03 00:00:00'),

-- May 2024 orders
(14, '2024-05-07 16:40:00', 1299.99, 'Standard Delivery', 21.99, 'Delivered', 'CashOnDelivery', '2024-05-12 00:00:00'),
(15, '2024-05-19 13:25:00', 549.99, 'Store Pickup', 0.00, 'Delivered', 'Card', NULL),
(16, '2024-05-30 10:50:00', 1999.99, 'Standard Delivery', 29.99, 'Delivered', 'Card', '2024-06-04 00:00:00'),

-- June 2024 orders
(2, '2024-06-11 15:15:00', 899.99, 'Standard Delivery', 18.99, 'Delivered', 'Card', '2024-06-16 00:00:00'),
(3, '2024-06-22 12:30:00', 399.99, 'Store Pickup', 0.00, 'Delivered', 'CashOnDelivery', NULL),
(4, '2024-06-29 09:20:00', 4299.99, 'Standard Delivery', 49.99, 'Delivered', 'Card', '2024-07-06 00:00:00'),

-- July 2024 orders
(5, '2024-07-08 14:50:00', 749.99, 'Standard Delivery', 17.99, 'Delivered', 'Card', '2024-07-13 00:00:00'),
(6, '2024-07-18 11:25:00', 1399.99, 'Store Pickup', 0.00, 'Delivered', 'Card', NULL),
(7, '2024-07-27 16:35:00', 199.99, 'Standard Delivery', 7.99, 'Delivered', 'CashOnDelivery', '2024-08-01 00:00:00'),

-- August 2024 orders
(8, '2024-08-05 13:40:00', 2699.99, 'Standard Delivery', 34.99, 'Delivered', 'Card', '2024-08-12 00:00:00'),
(9, '2024-08-15 10:55:00', 499.99, 'Store Pickup', 0.00, 'Delivered', 'Card', NULL),
(10, '2024-08-26 15:10:00', 1799.99, 'Standard Delivery', 26.99, 'Delivered', 'Card', '2024-09-02 00:00:00'),

-- September 2024 orders
(11, '2024-09-09 12:15:00', 99.99, 'Standard Delivery', 5.99, 'Delivered', 'CashOnDelivery', '2024-09-14 00:00:00'),
(12, '2024-09-20 14:30:00', 5999.99, 'Store Pickup', 0.00, 'Delivered', 'Card', NULL),
(13, '2024-09-28 11:45:00', 129.99, 'Standard Delivery', 6.99, 'Delivered', 'Card', '2024-10-03 00:00:00'),

-- October 2024 orders
(14, '2024-10-12 16:20:00', 999.99, 'Standard Delivery', 19.99, 'Delivered', 'Card', '2024-10-17 00:00:00'),
(15, '2024-10-23 13:35:00', 1499.99, 'Store Pickup', 0.00, 'Delivered', 'CashOnDelivery', NULL),
(16, '2024-10-30 10:40:00', 699.99, 'Standard Delivery', 16.99, 'Delivered', 'Card', '2024-11-04 00:00:00'),

-- November 2024 orders
(2, '2024-11-14 15:25:00', 3899.99, 'Standard Delivery', 44.99, 'Delivered', 'Card', '2024-11-21 00:00:00'),
(3, '2024-11-25 12:50:00', 249.99, 'Store Pickup', 0.00, 'Delivered', 'Card', NULL),

-- December 2024 orders
(4, '2024-12-05 14:15:00', 1199.99, 'Standard Delivery', 22.99, 'Delivered', 'CashOnDelivery', '2024-12-12 00:00:00'),
(5, '2024-12-18 11:30:00', 149.99, 'Store Pickup', 0.00, 'Delivered', 'Card', NULL),
(6, '2024-12-28 16:45:00', 2299.99, 'Standard Delivery', 32.99, 'Delivered', 'Card', '2025-01-04 00:00:00'),

-- Recent 2025 orders (some pending/shipped)
(7, '2025-09-15 10:20:00', 1599.99, 'Standard Delivery', 24.99, 'Shipped', 'Card', '2025-09-22 00:00:00'),
(8, '2025-10-01 14:35:00', 799.99, 'Store Pickup', 0.00, 'Confirmed', 'CashOnDelivery', NULL),
(9, '2025-10-05 12:40:00', 2199.99, 'Standard Delivery', 31.99, 'Pending', 'Card', '2025-10-12 00:00:00');

-- Insert Order Items for the orders
INSERT INTO order_items (orderId, variantId, quantity, unitPrice, totalPrice) VALUES
-- Order 1 items (iPhone 17 Pro Max)
(1, 2, 1, 1249.99, 1249.99),

-- Order 2 items (Samsung Galaxy S25 Ultra)
(2, 1, 1, 849.99, 849.99),

-- Order 3 items (Canon EOS R6 Mark III)
(3, 87, 1, 2999.99, 2999.99),

-- Order 4 items (GoPro MAX 2)
(4, 83, 1, 599.99, 599.99),

-- Order 5 items (Samsung QN95D 55")
(5, 96, 1, 1899.99, 1899.99),

-- Order 6 items (Google Pixel 10a Lite)
(6, 13, 1, 449.99, 449.99),

-- Order 7 items (Samsung Family Hub Fridge)
(7, 91, 1, 3499.99, 3499.99),

-- Order 8 items (MacBook Air M3 15-inch)
(8, 61, 1, 799.99, 799.99),

-- Order 9 items (Pixel Fold 2 256GB)
(9, 53, 1, 1699.99, 1699.99),

-- Order 10 items (Xiaomi Redmi Note 15)
(10, 15, 1, 299.99, 299.99),

-- Order 11 items (LG OLED G4 65")
(11, 94, 1, 2499.99, 2499.99),

-- Order 12 items (Poco F7 Pro 256GB)
(12, 54, 1, 649.99, 649.99),

-- Order 13 items (Sony A7R VI Body)
(13, 86, 1, 1299.99, 1299.99),

-- Order 14 items (OnePlus Nord 6 Pro 256GB)
(14, 58, 1, 549.99, 549.99),

-- Order 15 items (Lenovo Legion Pro 7i Gen 9 1TB)
(15, 62, 1, 1999.99, 1999.99),

-- Order 16 items (Dell Inspiron 14 Plus 256GB)
(16, 65, 1, 899.99, 899.99),

-- Order 17 items (Galaxy A75 5G 128GB)
(17, 56, 1, 399.99, 399.99),

-- Order 18 items (Nikon Z9 II Body)
(18, 88, 1, 4299.99, 4299.99),

-- Order 19 items (Dyson V15 Detect)
(19, 97, 1, 749.99, 749.99),

-- Order 20 items (LG Gram 17 2025 512GB)
(20, 70, 1, 1399.99, 1399.99),

-- Order 21 items (Instax Mini 99)
(21, 84, 1, 199.99, 199.99),

-- Order 22 items (Lenovo Legion Pro 7i Gen 9)
(22, 62, 1, 2699.99, 2699.99),

-- Order 23 items (DJI Pocket 3)
(23, 85, 1, 499.99, 499.99),

-- Order 24 items (HP Omen 16 2025 512GB)
(24, 63, 1, 1799.99, 1799.99),

-- Order 25 items (Beurer Pulse Oximeter)
(25, 78, 1, 99.99, 99.99),

-- Order 26 items (Leica Q3)
(26, 89, 1, 5999.99, 5999.99),

-- Order 27 items (Instant Vortex Air Fryer)
(27, 95, 1, 129.99, 129.99),

-- Order 28 items (ASUS ZenBook 14X OLED)
(28, 68, 1, 999.99, 999.99),

-- Order 29 items (Apple iPad Pro 13-inch M4 Max)
(29, 23, 1, 1499.99, 1499.99),

-- Order 30 items (Breville Barista Express)
(30, 100, 1, 699.99, 699.99),

-- Order 31 items (Sony A7R VI Body)
(31, 86, 1, 3899.99, 3899.99),

-- Order 32 items (Philips Series 9000)
(32, 71, 1, 249.99, 249.99),

-- Order 33 items (LG ThinQ Dryer)
(33, 92, 1, 1199.99, 1199.99),

-- Order 34 items (Acer Swift 3 OLED 256GB)
(34, 69, 1, 149.99, 149.99),

-- Order 35 items (Samsung Galaxy Tab S10, iPhone 17 Mini Pro)
(35, 21, 1, 1299.99, 1299.99),
(35, 12, 1, 999.99, 999.99);

-- Add recent order items for 2025 orders
INSERT INTO order_items (orderId, variantId, quantity, unitPrice, totalPrice) VALUES
-- Order 33 items (Surface Laptop Studio 6)
(33, 66, 1, 1599.99, 1599.99),

-- Order 34 items (MacBook Air M3 15-inch)
(34, 61, 1, 799.99, 799.99),

-- Order 35 items (ROG Zephyrus G16 2025 1TB + ThinkPad X1 Carbon Gen 13)
(35, 64, 1, 1999.99, 1999.99),
(35, 67, 1, 199.99, 199.99);
