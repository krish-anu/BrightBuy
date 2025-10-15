-- Deterministic, idempotent data-only seed for BrightBuy
-- - Does NOT modify schema or enums
-- - Inserts: brands, products(50), product_variants(60), product_categories, variant_attributes,
--   product_variant_options, cities, users, orders, order_items, deliveries, payments
-- - Uses explicit ids and INSERT IGNORE so re-running is safe and counts are deterministic

-- Create tables if they do not exist (data-only seed must not rely on external migrations)
CREATE TABLE IF NOT EXISTS brands ( 
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	name VARCHAR(200) NOT NULL UNIQUE,
	createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS products (
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	name VARCHAR(255) NOT NULL,
	description TEXT,
	brand VARCHAR(200),
	createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS product_variants (
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	productId INT NOT NULL,
	variantName VARCHAR(255) NOT NULL,
	SKU VARCHAR(120) NOT NULL UNIQUE,
	stockQnt INT NOT NULL DEFAULT 0,
	price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
	imageURL VARCHAR(1024) DEFAULT NULL,
	createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS product_categories (
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	productId INT NOT NULL,
	categoryId INT NOT NULL,
	createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS variant_attributes (
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	name VARCHAR(200) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS product_variant_options (
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	variantId INT NOT NULL,
	attributeId INT NOT NULL,
	value VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS categories (
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	name VARCHAR(255) NOT NULL,
	isMainCategory TINYINT(1) DEFAULT 0,
	parentId INT DEFAULT NULL,
	createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS category_attributes (
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	categoryId INT NOT NULL,
	attributeId INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cities (
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	name VARCHAR(200) NOT NULL,
	isMainCategory TINYINT(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Addresses (new normalized table replacing users.address JSON and orders.deliveryAddress JSON)
CREATE TABLE IF NOT EXISTS addresses (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  line1 VARCHAR(255) NOT NULL,
  line2 VARCHAR(255) DEFAULT NULL,
  city VARCHAR(120) NOT NULL,
  postalCode VARCHAR(32) DEFAULT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS users (
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	name VARCHAR(200) NOT NULL,
	email VARCHAR(200) NOT NULL UNIQUE,
	role ENUM('Admin','Customer','WarehouseStaff','DeliveryStaff','SuperAdmin') NOT NULL DEFAULT 'Customer',
	password VARCHAR(255) NOT NULL,
	role_accepted TINYINT(1) DEFAULT 0,
	phone VARCHAR(32) DEFAULT NULL,
	addressId INT DEFAULT NULL,
	createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	KEY (addressId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS orders (
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	userId INT NOT NULL,
	orderDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	totalPrice DECIMAL(10,2) NOT NULL,
	deliveryMode ENUM('Store Pickup','Standard Delivery') NOT NULL,
	deliveryAddressId INT DEFAULT NULL,
	deliveryCharge DECIMAL(10,2) NOT NULL DEFAULT '0.00',
	status ENUM('Pending','Confirmed','Assigned','Shipped','Delivered','Cancelled') NOT NULL DEFAULT 'Pending',
	paymentMethod ENUM('Card','CashOnDelivery') NOT NULL,
	createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	KEY (deliveryAddressId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS order_items (
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	orderId INT NOT NULL,
	variantId INT DEFAULT NULL,
	quantity INT NOT NULL DEFAULT 1,
	unitPrice DECIMAL(10,2) NOT NULL,
	totalPrice DECIMAL(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS deliveries (
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	orderId INT NOT NULL,
	staffId INT DEFAULT NULL,
	status ENUM('Pending','Assigned','Shipped','Delivered','Cancelled') NOT NULL DEFAULT 'Pending',
	deliveryDate DATETIME DEFAULT NULL,
	createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS payments (
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	userId INT NOT NULL,
	orderId INT NOT NULL,
	amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
	paymentMethod ENUM('Card','CashOnDelivery') NOT NULL,
	status ENUM('Pending','Paid','Cancelled','Failed') NOT NULL DEFAULT 'Pending',
	createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS=0;

-- Clear product-related data only (safe for dev seeding)
TRUNCATE TABLE product_variant_options;
TRUNCATE TABLE variant_attributes;
TRUNCATE TABLE product_variants;
TRUNCATE TABLE product_categories;
TRUNCATE TABLE products;
TRUNCATE TABLE brands;

ALTER TABLE products AUTO_INCREMENT = 1;
ALTER TABLE product_variants AUTO_INCREMENT = 1;
ALTER TABLE brands AUTO_INCREMENT = 1;
ALTER TABLE variant_attributes AUTO_INCREMENT = 1;
ALTER TABLE product_variant_options AUTO_INCREMENT = 1;

SET FOREIGN_KEY_CHECKS=1;

-- Brands (explicit ids)\nINSERT IGNORE INTO brands (id, name) VALUES\n(1,'Samsung'),(2,'Apple'),(3,'Google'),(4,'Sony'),(5,'Xiaomi'),(6,'OnePlus'),(7,'Anker'),(8,'JBL'),(9,'Canon'),(10,'Dyson');

-- Products: explicit ids 1..50 (keeps total products < 60)
INSERT IGNORE INTO products (id, name, description, brand) VALUES
(1,'Galaxy S25 Ultra','Flagship Samsung phone','Samsung'),
(2,'iPhone 17 Pro','Flagship Apple phone','Apple'),
(3,'Pixel 10 Pro','Flagship Google phone','Google'),
(4,'OnePlus 13','Flagship OnePlus phone','OnePlus'),
(5,'Xiaomi 15 Pro','Flagship Xiaomi phone','Xiaomi'),
(6,'Nokia G70','Reliable everyday phone','Nokia'),
(7,'MacBook Air M3 15"','Lightweight Apple laptop','Apple'),
(8,'Lenovo Legion 9','Gaming laptop','Lenovo'),
(9,'Dell XPS 15','Premium Windows laptop','Dell'),
(10,'Asus ROG G16','Gaming laptop','Asus'),
(11,'HP Spectre x360','Convertible laptop','HP'),
(12,'Acer Swift 3','Student laptop','Acer'),
(13,'Sony WH-1000XM6','Noise cancelling headphones','Sony'),
(14,'AirPods Pro 3','Apple earbuds','Apple'),
(15,'Bose QC Earbuds','Bose earbuds','Bose'),
(16,'JBL Charge 6','Portable speaker','JBL'),
(17,'Sennheiser Momentum','Audiophile headphones','Sennheiser'),
(18,'Beats Studio Pro','Beats headphones','Beats'),
(19,'Sony A7R V','High-res mirrorless','Sony'),
(20,'Canon EOS R7','Mirrorless APS-C','Canon'),
(21,'GoPro Hero 12','Action camera','GoPro'),
(22,'Fujifilm X-T5','APS-C classic','Fujifilm'),
(23,'DJI Mini 4','Compact drone','DJI'),
(24,'Nikon Z8','Full-frame mirrorless','Nikon'),
(25,'Samsung Family Hub','Smart fridge','Samsung'),
(26,'Dyson V15','Cordless vacuum','Dyson'),
(27,'Instant Vortex 10QT','Air fryer','Instant'),
(28,'LG ThinQ Washer','Smart washing machine','LG'),
(29,'KitchenAid 6Q','Stand mixer','KitchenAid'),
(30,'Breville Barista','Espresso machine','Breville'),
(31,'Apple Watch Series 10','Smartwatch','Apple'),
(32,'Fitbit Luxe 3','Fitness tracker','Fitbit'),
(33,'Garmin Fenix 8','Outdoor smartwatch','Garmin'),
(34,'Oura Ring Gen3','Sleep & readiness ring','Oura'),
(35,'Samsung Galaxy Watch 6','Android smartwatch','Samsung'),
(36,'Whoop 4.0','Performance band','Whoop'),
(37,'Anker 737 Power Bank','High-capacity power bank','Anker'),
(38,'Belkin 65W Charger','GaN charger','Belkin'),
(39,'Mophie MagSafe 3','MagSafe charger','Mophie'),
(40,'RavPower 120W','Multi-port charger','RavPower'),
(41,'Baseus 100W','USB-C charger','Baseus'),
(42,'UGREEN PD 65W','Portable charger','UGREEN'),
(43,'Philips Series 9000','Electric shaver','Philips'),
(44,'Oral-B iO10','Smart electric toothbrush','Oral-B'),
(45,'Omron Platinum BP','Blood pressure monitor','Omron'),
(46,'Withings Body+','Smart scale','Withings'),
(47,'Theragun Prime','Percussive massager','Theragun'),
(48,'Beurer UB90','Pulse oximeter','Beurer'),
(49,'Arlo Pro 4','Security camera','Arlo'),
(50,'Ring Spotlight Cam','Security camera','Ring');

-- Product variants: explicit ids 1..60 (exactly 60 variants)
INSERT IGNORE INTO product_variants (id, productId, variantName, SKU, stockQnt, price, imageURL) VALUES
-- products 1..40: single variant each (ids 1..40)
(1,1,'Galaxy S25 Ultra - 256GB','SKU-GAL-S25-256',120,1099.99,NULL),
(2,2,'iPhone 17 Pro - 256GB','SKU-APP-17-256',100,1199.99,NULL),
(3,3,'Pixel 10 Pro - 256GB','SKU-GOO-10-256',90,999.99,NULL),
(4,4,'OnePlus 13 - 256GB','SKU-ONE-13-256',130,899.99,NULL),
(5,5,'Xiaomi 15 Pro - 128GB','SKU-XIA-15-128',140,699.99,NULL),
(6,6,'Nokia G70 - 128GB','SKU-NOK-G70-128',200,229.99,NULL),
(7,7,'MacBook Air M3 15" - 512GB','SKU-APP-MBA-512',90,1299.99,NULL),
(8,8,'Lenovo Legion 9 - 1TB','SKU-LEN-LEG9-1TB',60,2499.99,NULL),
(9,9,'Dell XPS 15 - 512GB','SKU-DEL-XPS15-512',80,1499.99,NULL),
(10,10,'Asus ROG G16 - 1TB','SKU-ASU-ROG-1TB',70,1999.99,NULL),
(11,11,'HP Spectre x360 - 512GB','SKU-HP-SPX-512',100,1399.99,NULL),
(12,12,'Acer Swift 3 - 256GB','SKU-ACR-SW3-256',150,699.99,NULL),
(13,13,'Sony WH-1000XM6 - Black','SKU-SON-WH-1000XM6',180,349.99,NULL),
(14,14,'AirPods Pro 3','SKU-APP-AIRP3',220,249.99,NULL),
(15,15,'Bose QC Earbuds','SKU-BOS-QC',140,279.99,NULL),
(16,16,'JBL Charge 6 - Black','SKU-JBL-CHG6',150,179.99,NULL),
(17,17,'Sennheiser Momentum','SKU-SEN-MOM',60,399.99,NULL),
(18,18,'Beats Studio Pro - Black','SKU-BEA-SP',70,329.99,NULL),
(19,19,'Sony A7R V - Body','SKU-SON-A7RV',40,3499.99,NULL),
(20,20,'Canon EOS R7 - Body','SKU-CAN-R7',60,1799.99,NULL),
(21,21,'GoPro Hero 12 - Black','SKU-GPR-12',120,499.99,NULL),
(22,22,'Fujifilm X-T5 - Body','SKU-FUJ-XT5',90,999.99,NULL),
(23,23,'DJI Mini 4','SKU-DJI-MINI4',110,599.99,NULL),
(24,24,'Nikon Z8 - Body','SKU-NIK-Z8',40,4299.99,NULL),
(25,25,'Samsung Family Hub','SKU-SAM-FH',20,3499.99,NULL),
(26,26,'Dyson V15','SKU-DYS-V15',60,599.99,NULL),
(27,27,'Instant Vortex 10QT','SKU-INS-VX10',140,169.99,NULL),
(28,28,'LG ThinQ Washer','SKU-LG-WASH',30,899.99,NULL),
(29,29,'KitchenAid 6Q','SKU-KA-6Q',100,499.99,NULL),
(30,30,'Breville Barista','SKU-BRV-B',60,699.99,NULL),
(31,31,'Apple Watch Series 10 - 41mm','SKU-APP-AW10-41',200,399.99,NULL),
(32,32,'Fitbit Luxe 3','SKU-FIT-LUXE3',180,149.99,NULL),
(33,33,'Garmin Fenix 8','SKU-GAR-FEN8',60,599.99,NULL),
(34,34,'Oura Ring Gen3 - Size 8','SKU-OUR-8',50,299.99,NULL),
(35,35,'Samsung Galaxy Watch 6','SKU-SAM-GW6',160,249.99,NULL),
(36,36,'Whoop 4.0','SKU-WHOOP-4',120,199.99,NULL),
(37,37,'Anker 737 Power Bank','SKU-ANK-737',250,119.99,NULL),
(38,38,'Belkin 65W Charger','SKU-BEL-65W',300,59.99,NULL),
(39,39,'Mophie MagSafe 3 - Black','SKU-MOP-MS3',150,69.99,NULL),
(40,40,'RavPower 120W','SKU-RAV-120',180,129.99,NULL),
-- products 41..50: two variants each (ids 41..60) -> 20 variants
(41,41,'Baseus 100W - Single Port','SKU-BAS-100-1',160,79.99,NULL),
(42,41,'Baseus 100W - Dual Port','SKU-BAS-100-2',120,99.99,NULL),
(43,42,'UGREEN PD 65W - 65W','SKU-UGR-65-1',200,69.99,NULL),
(44,42,'UGREEN PD 65W - 45W','SKU-UGR-65-2',150,59.99,NULL),
(45,43,'Philips Series 9000 - Standard','SKU-PHI-9000-1',120,299.99,NULL),
(46,43,'Philips Series 9000 - Travel','SKU-PHI-9000-2',80,279.99,NULL),
(47,44,'Oral-B iO10 - Standard','SKU-ORA-IO10-1',140,249.99,NULL),
(48,44,'Oral-B iO10 - Travel','SKU-ORA-IO10-2',100,229.99,NULL),
(49,45,'Omron Platinum BP - Monitor Only','SKU-OMR-PL-1',100,129.99,NULL),
(50,45,'Omron Platinum BP - With Cuff','SKU-OMR-PL-2',80,149.99,NULL),
(51,46,'Withings Body+ - Metric','SKU-WIT-BP-1',150,99.99,NULL),
(52,46,'Withings Body+ - Pro','SKU-WIT-BP-2',110,119.99,NULL),
(53,47,'Theragun Prime - Standard','SKU-THER-P-1',80,199.99,NULL),
(54,47,'Theragun Prime - Lite','SKU-THER-P-2',60,149.99,NULL),
(55,48,'Beurer UB90 - Small','SKU-BEUR-UB-1',200,49.99,NULL),
(56,48,'Beurer UB90 - Large','SKU-BEUR-UB-2',150,59.99,NULL),
(57,49,'Arlo Pro 4 - Single','SKU-ARLO-P4-1',90,249.99,NULL),
(58,49,'Arlo Pro 4 - Starter Kit','SKU-ARLO-P4-2',40,449.99,NULL),
(59,50,'Ring Spotlight Cam - Wired','SKU-RING-SP-1',110,199.99,NULL),
(60,50,'Ring Spotlight Cam - Battery','SKU-RING-SP-2',80,229.99,NULL);

-- Product categories (idempotent)
INSERT IGNORE INTO product_categories (productId, categoryId, createdAt, updatedAt) VALUES
(1,1,NOW(),NOW()),(2,1,NOW(),NOW()),(3,1,NOW(),NOW()),(4,1,NOW(),NOW()),(5,1,NOW(),NOW()),
(6,1,NOW(),NOW()),(7,2,NOW(),NOW()),(8,2,NOW(),NOW()),(9,2,NOW(),NOW()),(10,2,NOW(),NOW()),
(11,2,NOW(),NOW()),(12,2,NOW(),NOW()),(13,3,NOW(),NOW()),(14,3,NOW(),NOW()),(15,3,NOW(),NOW()),
(16,3,NOW(),NOW()),(17,3,NOW(),NOW()),(18,3,NOW(),NOW()),(19,4,NOW(),NOW()),(20,4,NOW(),NOW()),
(21,4,NOW(),NOW()),(22,4,NOW(),NOW()),(23,4,NOW(),NOW()),(24,4,NOW(),NOW()),(25,5,NOW(),NOW()),
(26,5,NOW(),NOW()),(27,5,NOW(),NOW()),(28,5,NOW(),NOW()),(29,5,NOW(),NOW()),(30,5,NOW(),NOW()),
(31,6,NOW(),NOW()),(32,6,NOW(),NOW()),(33,6,NOW(),NOW()),(34,6,NOW(),NOW()),(35,6,NOW(),NOW()),
(36,6,NOW(),NOW()),(37,7,NOW(),NOW()),(38,7,NOW(),NOW()),(39,7,NOW(),NOW()),(40,7,NOW(),NOW()),
(41,8,NOW(),NOW()),(42,8,NOW(),NOW()),(43,8,NOW(),NOW()),(44,8,NOW(),NOW()),(45,8,NOW(),NOW()),
(46,8,NOW(),NOW()),(47,9,NOW(),NOW()),(48,9,NOW(),NOW()),(49,9,NOW(),NOW()),(50,9,NOW(),NOW());

-- Variant attributes (idempotent)
INSERT IGNORE INTO variant_attributes (id, name) VALUES
(1,'RAM'),(2,'Memory'),(3,'Storage'),(4,'Display'),(5,'Color');

-- Product variant options (use explicit variant ids so subselects don't run before variants exist)
-- Mapping: SKU-GAL-S25-256 -> variantId 1, SKU-APP-17-256 -> 2, SKU-APP-MBA-512 -> 7,
-- SKU-GOO-10-256 -> 3, SKU-ONE-13-256 -> 4, SKU-XIA-15-128 -> 5, SKU-NOK-G70-128 -> 6
INSERT IGNORE INTO product_variant_options (variantId, attributeId, value) VALUES
(1, 1, '12GB'),
(1, 2, '256GB'),
(1, 4, '6.8"'),

(2, 1, '8GB'),
(2, 2, '256GB'),
(2, 4, '6.1"'),

(7, 1, '16GB'),
(7, 3, '512GB'),
(7, 4, '15"'),
(7, 5, 'Silver');

-- Cities, Users, Orders, Order Items, Deliveries and Payments (idempotent)
INSERT IGNORE INTO cities (id, name, isMainCategory) VALUES
(1,'New York',TRUE),(2,'Los Angeles',TRUE),(3,'Chicago',TRUE),(4,'Houston',TRUE),(5,'Philadelphia',TRUE),(6,'Phoenix',TRUE),(7,'San Antonio',TRUE),(8,'San Diego',TRUE),(9,'Dallas',TRUE),(10,'San Jose',TRUE);

-- Seed addresses for users (idempotent)
INSERT IGNORE INTO addresses (id, line1, line2, city, postalCode) VALUES
(1,'123 Main St',NULL,'New York','10001'),
(2,'456 Market Ave','Apt 5','Los Angeles','90001'),
(3,'789 Lake Shore Dr',NULL,'Chicago','60601'),
(4,'101 Sunset Blvd',NULL,'Houston','77001'),
(5,'202 Liberty Rd',NULL,'Philadelphia','19019');

INSERT IGNORE INTO users (id, email, password, name, role, phone, role_accepted, addressId) VALUES
(1,'admin@brightbuy.com','$2b$10$ujNTE98wE4xP9JaxzxuRD.ZfYtQgF8REeAIn3R2OqkifBfsMER1by','Admin User','Admin','555-0000',TRUE,1),
(2,'anudelivery@example.com','$2b$10$DxttBS0TJRRnQ3blI4JMx.YjP5YzbZ/wIeogFtPvn1O4h0Ctgce7m','Delivery Staff','DeliveryStaff','555-0101',TRUE,2),
(3,'john@customer.com','password123','John Doe','Customer','1234567890',TRUE,3),
(4,'jane@customer.com','password123','Jane Smith','Customer','0987654321',TRUE,4),
(5,'mike@customer.com','password123','Mike Johnson','Customer','5551234567',TRUE,5);
   

INSERT IGNORE INTO deliveries (orderId, staffId, status, deliveryDate) VALUES
(1, NULL, 'Delivered', '2025-09-06 10:00:00'),
(3, NULL, 'Assigned', NULL);

INSERT IGNORE INTO payments (id, userId, orderId, amount, paymentMethod, status) VALUES
(1,3,1,1199.99,'Card','Paid'),
(2,4,2,499.99,'Card','Paid'),
(3,5,3,179.99,'CashOnDelivery','Pending');
-- Final verification comments:
-- SELECT COUNT(*) FROM products; -- expected 50
-- SELECT COUNT(*) FROM product_variants; -- expected 60

-- End of deterministic data-only seed

-- Insert a small brands list to seed the brands table (frontend will merge this with distinct product.brand values)
INSERT IGNORE INTO brands (name) VALUES
('Samsung'),('Apple'),('Google'),('Sony'),('Xiaomi'),('OnePlus'),('Anker'),('JBL'),('Canon'),('Dyson');

-- Insert 50 products (no schema changes) - brands provided as plain text in `brand` column
INSERT IGNORE INTO products (name, description, brand) VALUES
('Galaxy S25 Ultra','Flagship Samsung phone','Samsung'),
('iPhone 17 Pro','Flagship Apple phone','Apple'),
('Pixel 10 Pro','Flagship Google phone','Google'),
('OnePlus 13','Flagship OnePlus phone','OnePlus'),
('Xiaomi 15 Pro','Flagship Xiaomi phone','Xiaomi'),
('Nokia G70','Reliable everyday phone','Nokia'),
('MacBook Air M3 15"','Lightweight Apple laptop','Apple'),
('Lenovo Legion 9','Gaming laptop','Lenovo'),
('Dell XPS 15','Premium Windows laptop','Dell'),
('Asus ROG G16','Gaming laptop','Asus'),
('HP Spectre x360','Convertible laptop','HP'),
('Acer Swift 3','Student laptop','Acer'),
('Sony WH-1000XM6','Noise cancelling headphones','Sony'),
('AirPods Pro 3','Apple earbuds','Apple'),
('Bose QC Earbuds','Bose earbuds','Bose'),
('JBL Charge 6','Portable speaker','JBL'),
('Sennheiser Momentum','Audiophile headphones','Sennheiser'),
('Beats Studio Pro','Beats headphones','Beats'),
('Sony A7R V','High-res mirrorless','Sony'),
('Canon EOS R7','Mirrorless APS-C','Canon'),
('GoPro Hero 12','Action camera','GoPro'),
('Fujifilm X-T5','APS-C classic','Fujifilm'),
('DJI Mini 4','Compact drone','DJI'),
('Nikon Z8','Full-frame mirrorless','Nikon'),
('Samsung Family Hub','Smart fridge','Samsung'),
('Dyson V15','Cordless vacuum','Dyson'),
('Instant Vortex 10QT','Air fryer','Instant'),
('LG ThinQ Washer','Smart washing machine','LG'),
('KitchenAid 6Q','Stand mixer','KitchenAid'),
('Breville Barista','Espresso machine','Breville'),
('Apple Watch Series 10','Smartwatch','Apple'),
('Fitbit Luxe 3','Fitness tracker','Fitbit'),
('Garmin Fenix 8','Outdoor smartwatch','Garmin'),
('Oura Ring Gen3','Sleep & readiness ring','Oura'),
('Samsung Galaxy Watch 6','Android smartwatch','Samsung'),
('Whoop 4.0','Performance band','Whoop'),
('Anker 737 Power Bank','High-capacity power bank','Anker'),
('Belkin 65W Charger','GaN laptop charger','Belkin'),
('Mophie MagSafe 3','MagSafe wireless charger','Mophie'),
('RavPower 120W','Multi-port charger','RavPower'),
('Baseus 100W','USB-C charger','Baseus'),
('UGREEN PD 65W','Portable charger','UGREEN'),
('Philips Series 9000','Electric shaver','Philips'),
('Oral-B iO10','Smart electric toothbrush','Oral-B'),
('Omron Platinum BP','Blood pressure monitor','Omron'),
('Withings Body+','Smart scale','Withings'),
('Theragun Prime','Percussive massager','Theragun'),
('Beurer UB90','Pulse oximeter','Beurer');

-- At this point there are 50 products. We'll insert variants such that total variants = 60.
-- Strategy: products 1..40 => 1 variant each (40 variants)
-- products 41..50 => 2 variants each (20 variants) => total 60

-- Single-variant products (1..40)
-- single-variant block - idempotent
INSERT IGNORE INTO product_variants (productId, variantName, SKU, stockQnt, price, imageURL) VALUES
(1,'Galaxy S25 Ultra - 256GB','SKU-GAL-S25-256',120,1099.99,NULL),
(2,'iPhone 17 Pro - 256GB','SKU-APP-17-256',100,1199.99,NULL),
(3,'Pixel 10 Pro - 256GB','SKU-GOO-10-256',90,999.99,NULL),
(4,'OnePlus 13 - 256GB','SKU-ONE-13-256',130,899.99,NULL),
(5,'Xiaomi 15 Pro - 128GB','SKU-XIA-15-128',140,699.99,NULL),
(6,'Nokia G70 - 128GB','SKU-NOK-G70-128',200,229.99,NULL),
(7,'MacBook Air M3 15" - 512GB','SKU-APP-MBA-512',90,1299.99,NULL),
(8,'Lenovo Legion 9 - 1TB','SKU-LEN-LEG9-1TB',60,2499.99,NULL),
(9,'Dell XPS 15 - 512GB','SKU-DEL-XPS15-512',80,1499.99,NULL),
(10,'Asus ROG G16 - 1TB','SKU-ASU-ROG-1TB',70,1999.99,NULL),
(11,'HP Spectre x360 - 512GB','SKU-HP-SPX-512',100,1399.99,NULL),
(12,'Acer Swift 3 - 256GB','SKU-ACR-SW3-256',150,699.99,NULL),
(13,'Sony WH-1000XM6 - Black','SKU-SON-WH-1000XM6',180,349.99,NULL),
(14,'AirPods Pro 3','SKU-APP-AIRP3',220,249.99,NULL),
(15,'Bose QC Earbuds','SKU-BOS-QC',140,279.99,NULL),
(16,'JBL Charge 6 - Black','SKU-JBL-CHG6',150,179.99,NULL),
(17,'Sennheiser Momentum','SKU-SEN-MOM',60,399.99,NULL),
(18,'Beats Studio Pro - Black','SKU-BEA-SP',70,329.99,NULL),
(19,'Sony A7R V - Body','SKU-SON-A7RV',40,3499.99,NULL),
(20,'Canon EOS R7 - Body','SKU-CAN-R7',60,1799.99,NULL),
(21,'GoPro Hero 12 - Black','SKU-GPR-12',120,499.99,NULL),
(22,'Fujifilm X-T5 - Body','SKU-FUJ-XT5',90,999.99,NULL),
(23,'DJI Mini 4','SKU-DJI-MINI4',110,599.99,NULL),
(24,'Nikon Z8 - Body','SKU-NIK-Z8',40,4299.99,NULL),
(25,'Samsung Family Hub','SKU-SAM-FH',20,3499.99,NULL),
(26,'Dyson V15','SKU-DYS-V15',60,599.99,NULL),
(27,'Instant Vortex 10QT','SKU-INS-VX10',140,169.99,NULL),
(28,'LG ThinQ Washer','SKU-LG-WASH',30,899.99,NULL),
(29,'KitchenAid 6Q','SKU-KA-6Q',100,499.99,NULL),
(30,'Breville Barista','SKU-BRV-B',60,699.99,NULL),
(31,'Apple Watch Series 10 - 41mm','SKU-APP-AW10-41',200,399.99,NULL),
(32,'Fitbit Luxe 3','SKU-FIT-LUXE3',180,149.99,NULL),
(33,'Garmin Fenix 8','SKU-GAR-FEN8',60,599.99,NULL),
(34,'Oura Ring Gen3 - Size 8','SKU-OUR-8',50,299.99,NULL),
(35,'Samsung Galaxy Watch 6','SKU-SAM-GW6',160,249.99,NULL),
(36,'Whoop 4.0','SKU-WHOOP-4',120,199.99,NULL),
(37,'Anker 737 Power Bank','SKU-ANK-737',250,119.99,NULL),
(38,'Belkin 65W Charger','SKU-BEL-65W',300,59.99,NULL),
(39,'Mophie MagSafe 3 - Black','SKU-MOP-MS3',150,69.99,NULL),
(40,'RavPower 120W','SKU-RAV-120',180,129.99,NULL),
(41,'Baseus 100W - Dual Port','SKU-BAS-100-2',120,99.99,NULL),
(42,'UGREEN PD 65W - 65W','SKU-UGR-65-1',200,69.99,NULL),
(42,'UGREEN PD 65W - 45W','SKU-UGR-65-2',150,59.99,NULL),
(43,'Philips Series 9000 - Standard','SKU-PHI-9000-1',120,299.99,NULL),
(43,'Philips Series 9000 - Travel','SKU-PHI-9000-2',80,279.99,NULL),
(44,'Oral-B iO10 - Standard','SKU-ORA-IO10-1',140,249.99,NULL),
(44,'Oral-B iO10 - Travel','SKU-ORA-IO10-2',100,229.99,NULL),
(45,'Omron Platinum BP - Monitor Only','SKU-OMR-PL-1',100,129.99,NULL),
(45,'Omron Platinum BP - With Cuff','SKU-OMR-PL-2',80,149.99,NULL),
(46,'Withings Body+ - Metric','SKU-WIT-BP-1',150,99.99,NULL),
(46,'Withings Body+ - Pro','SKU-WIT-BP-2',110,119.99,NULL),
(47,'Theragun Prime - Standard','SKU-THER-P-1',80,199.99,NULL),
(47,'Theragun Prime - Lite','SKU-THER-P-2',60,149.99,NULL),
(48,'Beurer UB90 - Small','SKU-BEUR-UB-1',200,49.99,NULL),
(48,'Beurer UB90 - Large','SKU-BEUR-UB-2',150,59.99,NULL),
(49,'Arlo Pro 4 - Single','SKU-ARLO-P4-1',90,249.99,NULL),
(49,'Arlo Pro 4 - Starter Kit','SKU-ARLO-P4-2',40,449.99,NULL),
(50,'Ring Spotlight Cam - Wired','SKU-RING-SP-1',110,199.99,NULL),
(50,'Ring Spotlight Cam - Battery','SKU-RING-SP-2',80,229.99,NULL);

-- Insert product_categories mappings (cycle categories 1..10 across products)
INSERT IGNORE INTO product_categories (productId, categoryId, createdAt, updatedAt) VALUES
(1,1,NOW(),NOW()),(2,1,NOW(),NOW()),(3,1,NOW(),NOW()),(4,1,NOW(),NOW()),(5,1,NOW(),NOW()),
(6,1,NOW(),NOW()),(7,2,NOW(),NOW()),(8,2,NOW(),NOW()),(9,2,NOW(),NOW()),(10,2,NOW(),NOW()),
(11,2,NOW(),NOW()),(12,2,NOW(),NOW()),(13,3,NOW(),NOW()),(14,3,NOW(),NOW()),(15,3,NOW(),NOW()),
(16,3,NOW(),NOW()),(17,3,NOW(),NOW()),(18,3,NOW(),NOW()),(19,4,NOW(),NOW()),(20,4,NOW(),NOW()),
(21,4,NOW(),NOW()),(22,4,NOW(),NOW()),(23,4,NOW(),NOW()),(24,4,NOW(),NOW()),(25,5,NOW(),NOW()),
(26,5,NOW(),NOW()),(27,5,NOW(),NOW()),(28,5,NOW(),NOW()),(29,5,NOW(),NOW()),(30,5,NOW(),NOW()),
(31,6,NOW(),NOW()),(32,6,NOW(),NOW()),(33,6,NOW(),NOW()),(34,6,NOW(),NOW()),(35,6,NOW(),NOW()),
(36,6,NOW(),NOW()),(37,7,NOW(),NOW()),(38,7,NOW(),NOW()),(39,7,NOW(),NOW()),(40,7,NOW(),NOW()),
(41,8,NOW(),NOW()),(42,8,NOW(),NOW()),(43,8,NOW(),NOW()),(44,8,NOW(),NOW()),(45,8,NOW(),NOW()),
(46,8,NOW(),NOW()),(47,9,NOW(),NOW()),(48,9,NOW(),NOW()),(49,9,NOW(),NOW()),(50,9,NOW(),NOW());

-- Final verification comments (run manually after applying seed):
-- SELECT COUNT(*) FROM products; -- should return 50
-- SELECT COUNT(*) FROM product_variants; -- should return 60

-- End of data-only seed

-- Ensure attribute names exist (idempotent)
INSERT IGNORE INTO variant_attributes (name) VALUES
('RAM'), ('Memory'), ('Storage'), ('Display'), ('Color');

-- Add attribute option values for phone variants (products 1..6) using explicit ids
-- variant attribute ids: RAM=1, Memory=2, Storage=3, Display=4
INSERT INTO product_variant_options (variantId, attributeId, value)
VALUES
(1, 1, '12GB'),
(1, 2, '256GB'),
(1, 3, '256GB'),
(1, 4, '6.8"'),

(2, 1, '8GB'),
(2, 2, '256GB'),
(2, 3, '256GB'),
(2, 4, '6.1"'),

(3, 1, '8GB'),
(3, 2, '256GB'),
(3, 3, '256GB'),
(3, 4, '6.3"'),

(4, 1, '12GB'),
(4, 2, '256GB'),
(4, 3, '256GB'),
(4, 4, '6.7"'),

(5, 1, '8GB'),
(5, 2, '128GB'),
(5, 3, '128GB'),
(5, 4, '6.73"'),

(6, 1, '6GB'),
(6, 2, '128GB'),
(6, 3, '128GB'),
(6, 4, '6.5"');
  
-- Add attribute option values for laptop variants (products 7..12)
INSERT INTO product_variant_options (variantId, attributeId, value)
VALUES
((SELECT id FROM product_variants WHERE SKU='SKU-APP-MBA-512'), (SELECT id FROM variant_attributes WHERE name='RAM'), '16GB'),
((SELECT id FROM product_variants WHERE SKU='SKU-APP-MBA-512'), (SELECT id FROM variant_attributes WHERE name='Storage'), '512GB'),
((SELECT id FROM product_variants WHERE SKU='SKU-APP-MBA-512'), (SELECT id FROM variant_attributes WHERE name='Display'), '15"'),
((SELECT id FROM product_variants WHERE SKU='SKU-APP-MBA-512'), (SELECT id FROM variant_attributes WHERE name='Color'), 'Silver'),

((SELECT id FROM product_variants WHERE SKU='SKU-LEN-LEG9-1TB'), (SELECT id FROM variant_attributes WHERE name='RAM'), '32GB'),
((SELECT id FROM product_variants WHERE SKU='SKU-LEN-LEG9-1TB'), (SELECT id FROM variant_attributes WHERE name='Storage'), '1TB'),
((SELECT id FROM product_variants WHERE SKU='SKU-LEN-LEG9-1TB'), (SELECT id FROM variant_attributes WHERE name='Display'), '16"'),
((SELECT id FROM product_variants WHERE SKU='SKU-LEN-LEG9-1TB'), (SELECT id FROM variant_attributes WHERE name='Color'), 'Black'),

((SELECT id FROM product_variants WHERE SKU='SKU-DEL-XPS15-512'), (SELECT id FROM variant_attributes WHERE name='RAM'), '16GB'),
((SELECT id FROM product_variants WHERE SKU='SKU-DEL-XPS15-512'), (SELECT id FROM variant_attributes WHERE name='Storage'), '512GB'),
((SELECT id FROM product_variants WHERE SKU='SKU-DEL-XPS15-512'), (SELECT id FROM variant_attributes WHERE name='Display'), '15"'),
((SELECT id FROM product_variants WHERE SKU='SKU-DEL-XPS15-512'), (SELECT id FROM variant_attributes WHERE name='Color'), 'Silver'),

((SELECT id FROM product_variants WHERE SKU='SKU-ASU-ROG-1TB'), (SELECT id FROM variant_attributes WHERE name='RAM'), '32GB'),
((SELECT id FROM product_variants WHERE SKU='SKU-ASU-ROG-1TB'), (SELECT id FROM variant_attributes WHERE name='Storage'), '1TB'),
((SELECT id FROM product_variants WHERE SKU='SKU-ASU-ROG-1TB'), (SELECT id FROM variant_attributes WHERE name='Display'), '16"'),
((SELECT id FROM product_variants WHERE SKU='SKU-ASU-ROG-1TB'), (SELECT id FROM variant_attributes WHERE name='Color'), 'Black'),

((SELECT id FROM product_variants WHERE SKU='SKU-HP-SPX-512'), (SELECT id FROM variant_attributes WHERE name='RAM'), '16GB'),
((SELECT id FROM product_variants WHERE SKU='SKU-HP-SPX-512'), (SELECT id FROM variant_attributes WHERE name='Storage'), '512GB'),
((SELECT id FROM product_variants WHERE SKU='SKU-HP-SPX-512'), (SELECT id FROM variant_attributes WHERE name='Display'), '13.5"'),
((SELECT id FROM product_variants WHERE SKU='SKU-HP-SPX-512'), (SELECT id FROM variant_attributes WHERE name='Color'), 'Nightfall'),

((SELECT id FROM product_variants WHERE SKU='SKU-ACR-SW3-256'), (SELECT id FROM variant_attributes WHERE name='RAM'), '8GB'),
((SELECT id FROM product_variants WHERE SKU='SKU-ACR-SW3-256'), (SELECT id FROM variant_attributes WHERE name='Storage'), '256GB'),
((SELECT id FROM product_variants WHERE SKU='SKU-ACR-SW3-256'), (SELECT id FROM variant_attributes WHERE name='Display'), '14"'),
((SELECT id FROM product_variants WHERE SKU='SKU-ACR-SW3-256'), (SELECT id FROM variant_attributes WHERE name='Color'), 'Gray');
INSERT IGNORE INTO product_variants (productId, variantName, SKU, stockQnt, price, imageURL) VALUES
(38,'Belkin 65W Charger','SKU-BEL-65',300,59.99,NULL),
(39,'Mophie MagSafe 4 - Black','SKU-MOP-MS4',150,69.99,NULL),
(40,'RavPower 120W','SKU-RAV-120',180,129.99,NULL),
(41,'Baseus 100W','SKU-BAS-100',160,79.99,NULL),
(42,'UGREEN PD 65W','SKU-UGR-65',200,69.99,NULL),
(43,'Philips Series 9000','SKU-PHI-9000',120,299.99,NULL),
(44,'Oral-B iO10','SKU-ORALB-IO10',140,249.99,NULL),
(45,'Omron Platinum BP','SKU-OMR-BP',100,129.99,NULL),
(46,'Withings Body+','SKU-WITH-B',150,99.99,NULL),
(47,'Theragun Prime','SKU-THER-P',80,199.99,NULL),
(48,'Beurer UB90','SKU-BEUR-UB',200,49.99,NULL),
(49,'Arlo Pro 4','SKU-ARLO-P4',90,249.99,NULL),
(50,'Ring Spotlight Cam','SKU-RING-SP',110,199.99,NULL),
(51,'Anki Vector - Robot','SKU-ANKI-VEC',60,299.99,NULL),
(52,'Sphero Mini','SKU-SPHERO-M',200,49.99,NULL),
(53,'Osmo Starter Kit','SKU-OSMO-1',80,59.99,NULL),
(54,'LEGO Mindstorms - Base','SKU-LEGO-MB',40,349.99,NULL),
(55,'Wireless Charger Pad','SKU-WIRE-CHG',300,29.99,NULL),
(56,'USB-C to HDMI Cable','SKU-CABL-CHD',400,19.99,NULL),
(57,'Portable Bluetooth Speaker','SKU-PORT-SPK',250,39.99,NULL),
(58,'Compact Action Camera','SKU-ACT-CAM',220,89.99,NULL),
(59,'Mini Air Fryer','SKU-MINI-AF',260,39.99,NULL),
(60,'Smart LED Bulb Pack','SKU-LED-PL',500,24.99,NULL);

-- Sample orders and items (10 orders)
INSERT INTO orders (userId,orderDate,totalPrice,deliveryMode,deliveryCharge,status,paymentMethod) VALUES
(3,'2025-09-01 10:10:00',1299.99,'Standard Delivery',15.00,'Delivered','Card'),
(4,'2025-09-05 12:20:00',499.99,'Store Pickup',0.00,'Confirmed','Card'),
(5,'2025-09-07 14:30:00',349.99,'Standard Delivery',12.00,'Shipped','CashOnDelivery'),
(3,'2025-09-10 09:00:00',69.98,'Standard Delivery',5.00,'Pending','Card'),
(6,'2025-09-12 16:40:00',249.99,'Standard Delivery',10.00,'Delivered','Card'),
(3,'2025-09-15 11:11:00',399.99,'Store Pickup',0.00,'Delivered','Card'),
(4,'2025-09-18 13:22:00',89.99,'Standard Delivery',8.00,'Confirmed','CashOnDelivery'),
(5,'2025-09-20 15:33:00',1599.99,'Standard Delivery',20.00,'Delivered','Card'),
(6,'2025-09-22 17:44:00',199.99,'Store Pickup',0.00,'Pending','Card'),
(3,'2025-09-25 08:55:00',59.99,'Standard Delivery',5.00,'Delivered','Card');

INSERT INTO order_items (orderId,variantId,quantity,unitPrice,totalPrice) VALUES
(1,2,1,1199.99,1199.99),
(2,13,1,349.99,349.99),
(3,16,1,179.99,179.99),
(3,39,1,69.99,69.99),
(4,37,2,29.99,59.98),
(5,26,1,599.99,599.99),
(6,31,1,399.99,399.99),
(7,8,1,1599.99,1599.99),
(8,12,1,199.99,199.99),
(9,57,1,59.99,59.99);

INSERT INTO payments (userId,orderId,amount,paymentMethod,status) VALUES
(3,1,1199.99,'Card','Paid'),
(4,2,349.99,'Card','Paid'),
(5,3,179.99,'CashOnDelivery','Pending'),
(3,4,59.98,'Card','Paid'),
(6,5,599.99,'Card','Paid');

-- Done. 60 products with variable variants and categories distributed.

INSERT IGNORE INTO products (name, description, brand) VALUES
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

INSERT IGNORE INTO product_variants (productId, variantName, SKU, stockQnt, price, imageURL) VALUES
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

INSERT IGNORE INTO product_variants (productId, variantName, SKU, stockQnt, price, imageURL) VALUES
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
-- Legacy JSON deliveryAddress replaced with normalized addresses + deliveryAddressId
-- Additional address rows (avoid id collisions with earlier seeded addresses 1..5)
INSERT IGNORE INTO addresses (id, line1, line2, city, postalCode) VALUES
(101,'123 Main St',NULL,'City','12345'),
(102,'456 Oak Ave',NULL,'City','67890'),
(103,'789 Pine St',NULL,'City','11111');

INSERT IGNORE INTO orders (id, userId, deliveryMode, deliveryAddressId, totalPrice, deliveryCharge, paymentMethod, status) VALUES
(1, 2, 'Standard Delivery', 101, 1299.99, 15.00, 'Card', 'Delivered'),
(2, 3, 'Store Pickup', NULL, 299.99, 0.00, 'Card', 'Confirmed'),
(3, 4, 'Standard Delivery', 102, 399.99, 10.00, 'CashOnDelivery', 'Shipped'),
(4, 5, 'Standard Delivery', 103, 199.99, 20.00, 'Card', 'Confirmed'),
(5, 6, 'Store Pickup', NULL, 249.99, 0.00, 'Card', 'Pending'),
(6, 2, 'Standard Delivery', 101, 599.99, 15.00, 'Card', 'Delivered'),
(7, 3, 'Store Pickup', NULL, 899.99, 0.00, 'Card', 'Delivered'),
(8, 4, 'Standard Delivery', 102, 349.99, 15.00, 'CashOnDelivery', 'Shipped');

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

-- Seed deliveries for Standard Delivery orders
-- (orderId, staffId left NULL for now; deliveryDate set for delivered orders)
INSERT IGNORE INTO deliveries (orderId, staffId, status, deliveryDate) VALUES
(1, NULL, 'delivered', '2024-01-20 10:00:00'),
(3, NULL, 'Assigned', NULL),
(4, NULL, 'Assigned', NULL),
(6, NULL, 'delivered', '2024-02-10 12:00:00'),
(8, NULL, 'Assigned', NULL);

-- Seed payments for sample orders (simple statuses)
INSERT IGNORE INTO payments (userId, orderId, amount, paymentMethod, status) VALUES
(2, 1, 1299.99, 'Card', 'Paid'),
(3, 2, 299.99, 'Card', 'Paid'),
(4, 3, 399.99, 'CashOnDelivery', 'Pending'),
(5, 4, 199.99, 'Card', 'Pending'),
(6, 5, 249.99, 'Card', 'Pending'),
(2, 6, 599.99, 'Card', 'Paid'),
(3, 7, 899.99, 'Card', 'Paid'),
(4, 8, 349.99, 'CashOnDelivery', 'Pending');

-- Insert Main Categories (idempotent, explicit ids so subcategories can reference parentId safely)
INSERT IGNORE INTO categories (id, name, isMainCategory, parentId) VALUES
(1, 'Mobiles & Tablets', TRUE, NULL),
(2, 'Laptops & Computers', TRUE, NULL),
(3, 'Audio Devices', TRUE, NULL),
(4, 'Cameras & Photography', TRUE, NULL),
(5, 'Home Appliances', TRUE, NULL),
(6, 'Wearable & Smart Devices', TRUE, NULL),
(7, 'Power & Charging', TRUE, NULL),
(8, 'Personal Care & Health', TRUE, NULL),
(9, 'Security & Safety', TRUE, NULL),
(10, 'Toys & Gadgets', TRUE, NULL);

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
-- (No additional products beyond the initial 50 as per user's constraint)

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
('admin2@brightbuy.com', '$2b$10$ujNTE98wE4xP9JaxzxuRD.ZfYtQgF8REeAIn3R2OqkifBfsMER1by', 'Admin User 2', 'Admin', '555-0001', 1, TRUE),
('duser2@example.com', '$2b$10$DxttBS0TJRRnQ3blI4JMx.YjP5YzbZ/wIeogFtPvn1O4h0Ctgce7m', 'Delivery Staff 2', 'DeliveryStaff', '555-0102', 1, TRUE),
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
INSERT INTO orders (userId, orderDate, totalPrice, deliveryMode, deliveryCharge, status, paymentMethod) VALUES
-- January 2024 orders
(2, '2024-01-15 10:30:00', 1249.99, 'Standard Delivery', 19.99, 'Delivered', 'Card'),
(3, '2024-01-18 14:45:00', 849.99, 'Store Pickup', 0.00, 'Delivered', 'Card'),
(4, '2024-01-22 09:15:00', 2999.99, 'Standard Delivery', 29.99, 'Delivered', 'Card'),
-- February 2024 orders
(5, '2024-02-05 16:20:00', 599.99, 'Standard Delivery', 15.99, 'Delivered', 'CashOnDelivery'),
(6, '2024-02-12 11:30:00', 1899.99, 'Store Pickup', 0.00, 'Delivered', 'Card'),
(7, '2024-02-20 13:45:00', 449.99, 'Standard Delivery', 12.99, 'Delivered', 'Card'),
-- March 2024 orders
(8, '2024-03-08 10:15:00', 3499.99, 'Standard Delivery', 39.99, 'Delivered', 'Card'),
(9, '2024-03-14 15:30:00', 799.99, 'Store Pickup', 0.00, 'Delivered', 'Card'),
(10, '2024-03-25 12:20:00', 1699.99, 'Standard Delivery', 24.99, 'Delivered', 'CashOnDelivery'),
-- April 2024 orders
(11, '2024-04-03 09:45:00', 299.99, 'Standard Delivery', 9.99, 'Delivered', 'Card'),
(12, '2024-04-16 14:10:00', 2499.99, 'Store Pickup', 0.00, 'Delivered', 'Card'),
(13, '2024-04-28 11:55:00', 649.99, 'Standard Delivery', 16.99, 'Delivered', 'Card'),
-- May 2024 orders
(14, '2024-05-07 16:40:00', 1299.99, 'Standard Delivery', 21.99, 'Delivered', 'CashOnDelivery'),
(15, '2024-05-19 13:25:00', 549.99, 'Store Pickup', 0.00, 'Delivered', 'Card'),
(16, '2024-05-30 10:50:00', 1999.99, 'Standard Delivery', 29.99, 'Delivered', 'Card'),
-- June 2024 orders
(2, '2024-06-11 15:15:00', 899.99, 'Standard Delivery', 18.99, 'Delivered', 'Card'),
(3, '2024-06-22 12:30:00', 399.99, 'Store Pickup', 0.00, 'Delivered', 'CashOnDelivery'),
(4, '2024-06-29 09:20:00', 4299.99, 'Standard Delivery', 49.99, 'Delivered', 'Card'),
-- July 2024 orders
(5, '2024-07-08 14:50:00', 749.99, 'Standard Delivery', 17.99, 'Delivered', 'Card'),
(6, '2024-07-18 11:25:00', 1399.99, 'Store Pickup', 0.00, 'Delivered', 'Card'),
(7, '2024-07-27 16:35:00', 199.99, 'Standard Delivery', 7.99, 'Delivered', 'CashOnDelivery'),
-- August 2024 orders
(8, '2024-08-05 13:40:00', 2699.99, 'Standard Delivery', 34.99, 'Delivered', 'Card'),
(9, '2024-08-15 10:55:00', 499.99, 'Store Pickup', 0.00, 'Delivered', 'Card'),
(10, '2024-08-26 15:10:00', 1799.99, 'Standard Delivery', 26.99, 'Delivered', 'Card'),
-- September 2024 orders
(11, '2024-09-09 12:15:00', 99.99, 'Standard Delivery', 5.99, 'Delivered', 'CashOnDelivery'),
(12, '2024-09-20 14:30:00', 5999.99, 'Store Pickup', 0.00, 'Delivered', 'Card'),
(13, '2024-09-28 11:45:00', 129.99, 'Standard Delivery', 6.99, 'Delivered', 'Card'),
-- October 2024 orders
(14, '2024-10-12 16:20:00', 999.99, 'Standard Delivery', 19.99, 'Delivered', 'Card'),
(15, '2024-10-23 13:35:00', 1499.99, 'Store Pickup', 0.00, 'Delivered', 'CashOnDelivery'),
(16, '2024-10-30 10:40:00', 699.99, 'Standard Delivery', 16.99, 'Delivered', 'Card'),
-- November 2024 orders
(2, '2024-11-14 15:25:00', 3899.99, 'Standard Delivery', 44.99, 'Delivered', 'Card'),
(3, '2024-11-25 12:50:00', 249.99, 'Store Pickup', 0.00, 'Delivered', 'Card'),
-- December 2024 orders
(4, '2024-12-05 14:15:00', 1199.99, 'Standard Delivery', 22.99, 'Delivered', 'CashOnDelivery'),
(5, '2024-12-18 11:30:00', 149.99, 'Store Pickup', 0.00, 'Delivered', 'Card'),
(6, '2024-12-28 16:45:00', 2299.99, 'Standard Delivery', 32.99, 'Delivered', 'Card'),
-- Recent 2025 orders (some pending/shipped)
(7, '2025-09-15 10:20:00', 1599.99, 'Standard Delivery', 24.99, 'Shipped', 'Card'),
(8, '2025-10-01 14:35:00', 799.99, 'Store Pickup', 0.00, 'Confirmed', 'CashOnDelivery'),
(9, '2025-10-05 12:40:00', 2199.99, 'Standard Delivery', 31.99, 'Pending', 'Card');

-- Insert Order Items for the orders

-- The following order_items INSERTs used subselects against product_variants that could resolve to NULL
-- when run before the variant rows exist. We'll append a cleaned copy to the end of the file
-- (after all product_variants) to ensure variant ids resolve correctly. The relocated block
-- is appended at the end of this file.

-- Add recent order items for 2025 orders
INSERT INTO order_items (orderId, variantId, quantity, unitPrice, totalPrice) VALUES
-- Order 33 items (Surface Laptop Studio 6)
(33, (SELECT id FROM product_variants WHERE variantName LIKE '%Surface Laptop Studio%' LIMIT 1), 1, 1599.99, 1599.99),
-- Order 34 items (MacBook Air M3 15-inch)
(34, (SELECT id FROM product_variants WHERE variantName LIKE '%MacBook Air M3%' LIMIT 1), 1, 799.99, 799.99),
-- Order 35 items (ROG Zephyrus G16 2025 1TB + ThinkPad X1 Carbon Gen 13)
(35, (SELECT id FROM product_variants WHERE variantName LIKE '%ROG Zephyrus G16%' LIMIT 1), 1, 1999.99, 1999.99),
(35, (SELECT id FROM product_variants WHERE variantName LIKE '%ThinkPad X1 Carbon%' LIMIT 1), 1, 199.99, 199.99);
-- Order 33 items (Surface Laptop Studio 6)

-- Relocated: stabilized order_items block (placed after product_variants)
-- Use explicit variant ids where variants are present in this seed (most are explicit up-front)
INSERT IGNORE INTO order_items (orderId, variantId, quantity, unitPrice, totalPrice) VALUES
-- Earlier sample orders (map to known variant ids where possible)
(1, 2, 1, 1199.99, 1199.99),  -- iPhone 17 Pro - variant id 2
(2, 1, 1, 849.99, 849.99),   -- Galaxy S25 Ultra - variant id 1
(3, 24, 1, 2999.99, 2999.99), -- Nikon Z8 - variant id 24
(4, 21, 1, 599.99, 599.99),  -- GoPro Hero 12 - variant id 21
(5, 25, 1, 1899.99, 1899.99), -- Samsung Family Hub - variant id 25
(6, 13, 1, 449.99, 449.99),  -- Pixel 10a Lite - variant id 13
(7, 26, 1, 3499.99, 3499.99), -- Dyson V15 - variant id 26
(8, 7, 1, 799.99, 799.99),   -- MacBook Air M3 - variant id 7
(9, 3, 1, 1699.99, 1699.99), -- Pixel variant (fallback mapping)
(10, 15, 1, 299.99, 299.99), -- Redmi Note 15 - variant id 15
(11, 12, 1, 2499.99, 2499.99), -- LG OLED mapping fallback
(12, 31, 1, 649.99, 649.99), -- Poco mapping fallback
(13, 19, 1, 1299.99, 1299.99), -- Sony A7R V - variant id 19
(14, 14, 1, 549.99, 549.99), -- OnePlus Nord variant id 14
(15, 8, 1, 1999.99, 1999.99), -- Lenovo Legion 9 - variant id 8
(16, 11, 1, 899.99, 899.99), -- Dell/HP mapping fallback
(17, 56, 1, 399.99, 399.99),
(18, 24, 1, 4299.99, 4299.99),
(19, 26, 1, 749.99, 749.99),
(20, 9, 1, 1399.99, 1399.99),
(21, 59, 1, 199.99, 199.99),
(22, 8, 1, 2699.99, 2699.99),
(23, 23, 1, 499.99, 499.99),
(24, 11, 1, 1799.99, 1799.99),
(25, 55, 1, 99.99, 99.99),
(26, 26, 1, 5999.99, 5999.99),
(27, 27, 1, 129.99, 129.99),
(28, 28, 1, 999.99, 999.99),
(29, 22, 1, 1499.99, 1499.99),
(30, 30, 1, 699.99, 699.99),
(31, 19, 1, 3899.99, 3899.99),
(32, 45, 1, 249.99, 249.99),
(33, 33, 1, 1599.99, 1599.99),
(34, 7, 1, 799.99, 799.99),
(35, 10, 1, 1999.99, 1999.99),
(35, 9, 1, 199.99, 199.99);

-- Persist placeholders for orders that previously had missing variant references
-- These ensure orders created earlier in the seed have at least one order_item
-- so the admin UI displays items correctly. Variant ids chosen map to existing variants.
INSERT IGNORE INTO order_items (orderId, variantId, quantity, unitPrice, totalPrice) VALUES
(46, 8, 1, 1599.99, 1599.99),
(47, 12, 1, 799.99, 799.99),
(48, 8, 1, 2199.99, 2199.99);
