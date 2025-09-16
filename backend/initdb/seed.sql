-- 1. Cities table
CREATE TABLE IF NOT EXISTS cities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  isMainCity BOOLEAN DEFAULT FALSE
) ENGINE=InnoDB; 

-- 2. Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  email VARCHAR(200) NOT NULL UNIQUE,
  role ENUM('Admin','Customer','WarehouseStaff','DeliveryStaff') NOT NULL DEFAULT 'Customer',
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

insert into users (email,password,name,role) VALUES(
'anu@gmail.com','anu','Anu','Admin'
);

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

-- 11. Payments table
CREATE TABLE IF NOT EXISTS payments (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  orderId INT NOT NULL,
  userId INT NOT NULL,
  paymentDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  paymentMethod ENUM('COD','Card') NOT NULL,
  status ENUM('Pending','Paid','Failed') NOT NULL DEFAULT 'Pending',
  paymentIntentId VARCHAR(100) UNIQUE,
  CONSTRAINT fk_payments_order FOREIGN KEY (orderId) REFERENCES orders(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_payments_user FOREIGN KEY (userId) REFERENCES users(id)
    ON DELETE CASCADE
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

-- Insert Subcategories
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


-- Insert Products and Variants for each Main Category
-- 1. Mobiles & Tablets (categoryId = 1)
INSERT INTO products (name, description, brand) VALUES
('Galaxy S25 Ultra', 'Flagship smartphone with AI-driven camera and 6.8-inch AMOLED display.', 'Samsung'),
('iPhone 17 Pro', 'Premium smartphone with A19 chip and advanced AR features.', 'Apple'),
('Pixel 10 Pro', 'AI-powered smartphone with Tensor G4 and 50MP camera.', 'Google'),
('OnePlus 13', 'High-performance phone with 120Hz display and fast charging.', 'OnePlus'),
('Xiaomi 15 Pro', 'Sleek smartphone with HyperOS and 200MP camera.', 'Xiaomi'),
('Oppo Find X8', 'Innovative phone with foldable design and 5G support.', 'Oppo'),
('Vivo X200', 'Photography-focused phone with ZEISS optics.', 'Vivo'),
('Realme GT 5', 'Budget-friendly 5G phone with Snapdragon 8 Gen 4.', 'Realme'),
('Moto Edge 50', 'Stylish phone with curved OLED display.', 'Motorola'),
('Nokia X50', 'Durable 5G phone with long battery life.', 'Nokia');

INSERT INTO product_variants (productId, variantName, SKU, stockQnt, price, imageURL) VALUES
(1, 'Galaxy S25 Ultra 512GB', 'SAMSUNG-MOB-001', 100, 1299.99, NULL),
(2, 'iPhone 17 Pro 256GB', 'APPLE-MOB-002', 80, 1199.99, NULL),
(3, 'Pixel 10 Pro 128GB', 'GOOGLE-MOB-003', 90, 999.99, NULL),
(4, 'OnePlus 13 256GB', 'ONEPLUS-MOB-004', 120, 899.99, NULL),
(5, 'Xiaomi 15 Pro 512GB', 'XIAOMI-MOB-005', 110, 799.99, NULL),
(6, 'Oppo Find X8 256GB', 'OPPO-MOB-006', 100, 849.99, NULL),
(7, 'Vivo X200 256GB', 'VIVO-MOB-007', 95, 749.99, NULL),
(8, 'Realme GT 5 128GB', 'REALME-MOB-008', 150, 499.99, NULL),
(9, 'Moto Edge 50 128GB', 'MOTOROLA-MOB-009', 130, 599.99, NULL),
(10, 'Nokia X50 128GB', 'NOKIA-MOB-010', 140, 449.99, NULL);

INSERT INTO product_categories (productId, categoryId) VALUES
(1, 1), (2, 1), (3, 1), (4, 1), (5, 1), (6, 1), (7, 1), (8, 1), (9, 1), (10, 1);

-- 2. Laptops & Computers (categoryId = 2)
INSERT INTO products (name, description, brand) VALUES
('MacBook Pro 16 M4', 'Powerful laptop with M4 chip for creators.', 'Apple'),
('Dell XPS 15', 'High-performance laptop with 4K OLED display.', 'Dell'),
('HP Spectre x360', 'Convertible laptop with 13.5-inch touchscreen.', 'HP'),
('Asus Zenbook A14', 'Slim laptop with 32-hour battery life.', 'Asus'),
('Lenovo ThinkBook Plus Gen 6', 'Rollable OLED laptop for multitasking.', 'Lenovo'),
('Acer Predator Helios 18', 'Gaming laptop with RTX 5090 GPU.', 'Acer'),
('MSI Stealth 16', 'Lightweight gaming laptop with AI features.', 'MSI'),
('Surface Laptop 7', 'Sleek laptop with Snapdragon X Elite.', 'Microsoft'),
('Framework Laptop 13', 'Modular, repairable laptop for sustainability.', 'Framework'),
('Razer Blade 14', 'Compact gaming laptop with AMD Ryzen.', 'Razer');

INSERT INTO product_variants (productId, variantName, SKU, stockQnt, price, imageURL) VALUES
(11, 'MacBook Pro 16 M4 1TB', 'APPLE-LAP-011', 70, 2499.99, NULL),
(12, 'Dell XPS 15 512GB', 'DELL-LAP-012', 80, 1899.99, NULL),
(13, 'HP Spectre x360 512GB', 'HP-LAP-013', 90, 1599.99, NULL),
(14, 'Asus Zenbook A14 256GB', 'ASUS-LAP-014', 100, 1299.99, NULL),
(15, 'ThinkBook Plus Gen 6 512GB', 'LENOVO-LAP-015', 85, 3499.99, NULL),
(16, 'Predator Helios 18 1TB', 'ACER-LAP-016', 60, 2299.99, NULL),
(17, 'MSI Stealth 16 512GB', 'MSI-LAP-017', 75, 1999.99, NULL),
(18, 'Surface Laptop 7 256GB', 'MICROSOFT-LAP-018', 95, 1399.99, NULL),
(19, 'Framework Laptop 13 512GB', 'FRAMEWORK-LAP-019', 100, 1499.99, NULL),
(20, 'Razer Blade 14 1TB', 'RAZER-LAP-020', 70, 2199.99, NULL);

INSERT INTO product_categories (productId, categoryId) VALUES
(11, 2), (12, 2), (13, 2), (14, 2), (15, 2), (16, 2), (17, 2), (18, 2), (19, 2), (20, 2);

-- 3. Audio Devices (categoryId = 3)
INSERT INTO products (name, description, brand) VALUES
('AirPods Pro 2', 'Wireless earbuds with active noise cancellation.', 'Apple'),
('Sony WH-1000XM6', 'Premium noise-cancelling headphones.', 'Sony'),
('JBL Tour One M3', 'Flagship headphones with touchscreen transmitter.', 'JBL'),
('Bose QuietComfort Ultra', 'Wireless earbuds with immersive audio.', 'Bose'),
('Anker Soundcore Liberty 4', 'Budget-friendly true wireless earbuds.', 'Anker'),
('Sennheiser Momentum 4', 'High-fidelity wireless headphones.', 'Sennheiser'),
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
(26, 'Sennheiser Momentum 4', 'SENNHEISER-AUD-026', 80, 379.99, NULL),
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


-- Insert Additional Products and Variants for each Main Category
-- 1. Mobiles & Tablets (categoryId = 1)
INSERT INTO products (name, description, brand) VALUES
('Samsung Galaxy Z Fold 7', 'Foldable smartphone with 7.6-inch AMOLED display.', 'Samsung'),
('iPhone 17 Mini', 'Compact smartphone with A19 chip and 5.4-inch display.', 'Apple'),
('Google Pixel Fold 2', 'Foldable phone with Tensor G5 and AI features.', 'Google'),
('Poco F7 Pro', 'High-performance phone with Snapdragon 8 Gen 5.', 'Poco'),
('Sony Xperia 1 VII', 'Cinematic smartphone with 4K HDR display.', 'Sony');

INSERT INTO product_variants (productId, variantName, SKU, stockQnt, price, imageURL) VALUES
(101, 'Galaxy Z Fold 7 512GB', 'SAMSUNG-MOB-101', 90, 1799.99, NULL),
(102, 'iPhone 17 Mini 128GB', 'APPLE-MOB-102', 100, 799.99, NULL),
(103, 'Pixel Fold 2 256GB', 'GOOGLE-MOB-103', 80, 1699.99, NULL),
(104, 'Poco F7 Pro 256GB', 'POCO-MOB-104', 120, 649.99, NULL),
(105, 'Sony Xperia 1 VII 256GB', 'SONY-MOB-105', 85, 1299.99, NULL);

INSERT INTO product_categories (productId, categoryId) VALUES
(101, 1), (102, 1), (103, 1), (104, 1), (105, 1);

-- 2. Laptops & Computers (categoryId = 2)
INSERT INTO products (name, description, brand) VALUES
('Apple MacBook Air M3', 'Ultra-thin laptop with M3 chip and 15-inch display.', 'Apple'),
('Lenovo Legion Pro 7i', 'Gaming laptop with Intel Core Ultra 9 and RTX 5080.', 'Lenovo'),
('HP Omen 16', 'High-performance gaming laptop with 240Hz display.', 'HP'),
('Asus ROG Zephyrus G16', 'Sleek gaming laptop with OLED screen.', 'Asus'),
('Dell Inspiron 14', 'Versatile laptop for productivity and entertainment.', 'Dell');

INSERT INTO product_variants (productId, variantName, SKU, stockQnt, price, imageURL) VALUES
(106, 'MacBook Air M3 512GB', 'APPLE-LAP-106', 90, 1499.99, NULL),
(107, 'Legion Pro 7i 1TB', 'LENOVO-LAP-107', 70, 2699.99, NULL),
(108, 'HP Omen 16 512GB', 'HP-LAP-108', 80, 1799.99, NULL),
(109, 'ROG Zephyrus G16 1TB', 'ASUS-LAP-109', 75, 1999.99, NULL),
(110, 'Inspiron 14 256GB', 'DELL-LAP-110', 100, 899.99, NULL);

INSERT INTO product_categories (productId, categoryId) VALUES
(106, 2), (107, 2), (108, 2), (109, 2), (110, 2);

-- 3. Audio Devices (categoryId = 3)
INSERT INTO products (name, description, brand) VALUES
('Sony WF-1000XM6', 'True wireless earbuds with noise cancellation.', 'Sony'),
('Bose SoundLink Max', 'Portable Bluetooth speaker with stereo sound.', 'Bose'),
('JBL Clip 5', 'Compact Bluetooth speaker with carabiner.', 'JBL'),
('Apple AirPods Max 2', 'Premium over-ear headphones with spatial audio.', 'Apple'),
('Anker Soundcore Motion X600', 'High-fidelity portable speaker.', 'Anker');

INSERT INTO product_variants (productId, variantName, SKU, stockQnt, price, imageURL) VALUES
(111, 'Sony WF-1000XM6', 'SONY-AUD-111', 120, 299.99, NULL),
(112, 'Bose SoundLink Max', 'BOSE-AUD-112', 100, 399.99, NULL),
(113, 'JBL Clip 5', 'JBL-AUD-113', 150, 79.99, NULL),
(114, 'AirPods Max 2', 'APPLE-AUD-114', 80, 549.99, NULL),
(115, 'Soundcore Motion X600', 'ANKER-AUD-115', 130, 199.99, NULL);

INSERT INTO product_categories (productId, categoryId) VALUES
(111, 3), (112, 3), (113, 3), (114, 3), (115, 3);

-- 4. Cameras & Photography (categoryId = 4)
INSERT INTO products (name, description, brand) VALUES
('Canon PowerShot G7 X Mark IV', 'Compact camera for vloggers.', 'Canon'),
('Sony Alpha 6700', 'APS-C mirrorless camera with AI autofocus.', 'Sony'),
('GoPro MAX 2', '360-degree action camera with 6K video.', 'GoPro'),
('Fujifilm Instax Mini 99', 'Instant camera with creative modes.', 'Fujifilm'),
('DJI Pocket 3', 'Gimbal camera for stabilized 4K video.', 'DJI');

INSERT INTO product_variants (productId, variantName, SKU, stockQnt, price, imageURL) VALUES
(116, 'PowerShot G7 X Mark IV', 'CANON-CAM-116', 100, 799.99, NULL),
(117, 'Sony Alpha 6700 Body', 'SONY-CAM-117', 70, 1499.99, NULL),
(118, 'GoPro MAX 2', 'GOPRO-CAM-118', 120, 599.99, NULL),
(119, 'Instax Mini 99', 'FUJIFILM-CAM-119', 150, 199.99, NULL),
(120, 'DJI Pocket 3', 'DJI-CAM-120', 90, 499.99, NULL);

INSERT INTO product_categories (productId, categoryId) VALUES
(116, 4), (117, 4), (118, 4), (119, 4), (120, 4);

-- 5. Home Appliances (categoryId = 5)
INSERT INTO products (name, description, brand) VALUES
('Samsung Family Hub Fridge', 'Smart refrigerator with 21.5-inch touchscreen.', 'Samsung'),
('LG ThinQ Dryer', 'Smart dryer with AI fabric sensing.', 'LG'),
('Philips PerfectCare Steam Iron', 'Steam iron with auto temperature control.', 'Philips'),
('Toshiba 4K Fire TV 50-inch', 'Smart LED TV with Alexa integration.', 'Toshiba'),
('Instant Vortex Air Fryer', '6-quart air fryer with smart controls.', 'Instant');

INSERT INTO product_variants (productId, variantName, SKU, stockQnt, price, imageURL) VALUES
(121, 'Family Hub Fridge', 'SAMSUNG-HAP-121', 50, 3499.99, NULL),
(122, 'LG ThinQ Dryer', 'LG-HAP-122', 60, 1199.99, NULL),
(123, 'PerfectCare Steam Iron', 'PHILIPS-HAP-123', 130, 149.99, NULL),
(124, 'Toshiba 4K Fire TV 50-inch', 'TOSHIBA-HAP-124', 100, 499.99, NULL),
(125, 'Instant Vortex Air Fryer', 'INSTANT-HAP-125', 120, 129.99, NULL);

INSERT INTO product_categories (productId, categoryId) VALUES
(121, 5), (122, 5), (123, 5), (124, 5), (125, 5);

-- 6. Wearable & Smart Devices (categoryId = 6)
INSERT INTO products (name, description, brand) VALUES
('Fitbit Versa 5', 'Smartwatch with stress management tools.', 'Fitbit'),
('Samsung Galaxy Ring', 'Smart ring for health tracking.', 'Samsung'),
('Garmin Forerunner 965', 'Advanced running watch with GPS.', 'Garmin'),
('Huawei Band 9', 'Affordable fitness tracker with AMOLED.', 'Huawei'),
('Apple Watch Ultra 3', 'Rugged smartwatch for extreme sports.', 'Apple');

INSERT INTO product_variants (productId, variantName, SKU, stockQnt, price, imageURL) VALUES
(126, 'Fitbit Versa 5', 'FITBIT-WEA-126', 110, 299.99, NULL),
(127, 'Galaxy Ring', 'SAMSUNG-WEA-127', 130, 249.99, NULL),
(128, 'Forerunner 965', 'GARMIN-WEA-128', 90, 599.99, NULL),
(129, 'Huawei Band 9', 'HUAWEI-WEA-129', 150, 79.99, NULL),
(130, 'Apple Watch Ultra 3', 'APPLE-WEA-130', 80, 799.99, NULL);

INSERT INTO product_categories (productId, categoryId) VALUES
(126, 6), (127, 6), (128, 6), (129, 6), (130, 6);

-- 7. Power & Charging (categoryId = 7)
INSERT INTO products (name, description, brand) VALUES
('Anker PowerPort III', '20W USB-C charger for smartphones.', 'Anker'),
('Belkin MagSafe Charger', 'Wireless charger for iPhone.', 'Belkin'),
('EcoFlow River 2 Pro', 'Portable power station with 800W output.', 'EcoFlow'),
('Zendure Passport III', '65W travel charger with multiple ports.', 'Zendure'),
('Jackery Explorer 500', 'Compact power station for outdoor use.', 'Jackery');

INSERT INTO product_variants (productId, variantName, SKU, stockQnt, price, imageURL) VALUES
(131, 'Anker PowerPort III', 'ANKER-POW-131', 200, 19.99, NULL),
(132, 'Belkin MagSafe Charger', 'BELKIN-POW-132', 140, 39.99, NULL),
(133, 'EcoFlow River 2 Pro', 'ECOFLOW-POW-133', 80, 599.99, NULL),
(134, 'Zendure Passport III', 'ZENDURE-POW-134', 120, 49.99, NULL),
(135, 'Jackery Explorer 500', 'JACKERY-POW-135', 90, 499.99, NULL);

INSERT INTO product_categories (productId, categoryId) VALUES
(131, 7), (132, 7), (133, 7), (134, 7), (135, 7);

-- 8. Personal Care & Health (categoryId = 8)
INSERT INTO products (name, description, brand) VALUES
('Philips OneBlade Pro', 'Hybrid trimmer for face and body.', 'Philips'),
('LOreal AirLight Pro', 'Eco-friendly hair dryer with infrared tech.', 'LOreal'),
('Omron EVOLV BP', 'Portable blood pressure monitor.', 'Omron'),
('Withings ScanWatch 2', 'Hybrid smartwatch with ECG.', 'Withings'),
('Theragun Mini 2', 'Compact massage gun for portability.', 'Theragun');

INSERT INTO product_variants (productId, variantName, SKU, stockQnt, price, imageURL) VALUES
(136, 'Philips OneBlade Pro', 'PHILIPS-HEA-136', 110, 79.99, NULL),
(137, 'LOreal AirLight Pro', 'LOREAL-HEA-137', 90, 299.99, NULL),
(138, 'Omron EVOLV BP', 'OMRON-HEA-138', 120, 99.99, NULL),
(139, 'Withings ScanWatch 2', 'WITHINGS-HEA-139', 100, 349.99, NULL),
(140, 'Theragun Mini 2', 'THERAGUN-HEA-140', 130, 199.99, NULL);

INSERT INTO product_categories (productId, categoryId) VALUES
(136, 8), (137, 8), (138, 8), (139, 8), (140, 8);

-- 9. Security & Safety (categoryId = 9)
INSERT INTO products (name, description, brand) VALUES
('Arlo Ultra 3', '4K wireless security camera with HDR.', 'Arlo'),
('Ring Floodlight Cam Pro', 'Security camera with motion-activated lights.', 'Ring'),
('Eufy HomeBase 3', 'Smart hub for Eufy security devices.', 'Eufy'),
('Blink Mini 2', 'Compact indoor security camera.', 'Blink'),
('Reolink Lumus', 'Outdoor camera with spotlight and siren.', 'Reolink');

INSERT INTO product_variants (productId, variantName, SKU, stockQnt, price, imageURL) VALUES
(141, 'Arlo Ultra 3', 'ARLO-SEC-141', 100, 299.99, NULL),
(142, 'Ring Floodlight Cam Pro', 'RING-SEC-142', 90, 249.99, NULL),
(143, 'Eufy HomeBase 3', 'EUFY-SEC-143', 80, 149.99, NULL),
(144, 'Blink Mini 2', 'BLINK-SEC-144', 150, 49.99, NULL),
(145, 'Reolink Lumus', 'REOLINK-SEC-145', 120, 99.99, NULL);

INSERT INTO product_categories (productId, categoryId) VALUES
(141, 9), (142, 9), (143, 9), (144, 9), (145, 9);

-- 10. Toys & Gadgets (categoryId = 10)
INSERT INTO products (name, description, brand) VALUES
('Lego Technic Cybertruck', 'Detailed model of Tesla Cybertruck.', 'Lego'),
('Sphero Mini Golf', 'App-controlled golf ball robot.', 'Sphero'),
('DJI Mini 4 Pro', 'Compact drone with 4K video.', 'DJI'),
('Osmo Little Genius Kit', 'Educational game for preschoolers.', 'Osmo'),
('Anki Cozmo 2.0', 'Interactive AI robot for kids.', 'Anki');

INSERT INTO product_variants (productId, variantName, SKU, stockQnt, price, imageURL) VALUES
(146, 'Lego Technic Cybertruck', 'LEGO-TOY-146', 100, 249.99, NULL),
(147, 'Sphero Mini Golf', 'SPHERO-TOY-147', 130, 59.99, NULL),
(148, 'DJI Mini 4 Pro', 'DJI-TOY-148', 80, 759.99, NULL),
(149, 'Osmo Little Genius Kit', 'OSMO-TOY-149', 120, 79.99, NULL),
(150, 'Anki Cozmo 2.0', 'ANKI-TOY-150', 90, 149.99, NULL);

INSERT INTO product_categories (productId, categoryId) VALUES
(146, 10), (147, 10), (148, 10), (149, 10), (150, 10);

