
-- Create tables if they do not exist
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

CREATE TABLE IF NOT EXISTS categories (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    isMainCategory TINYINT(1) DEFAULT 0,
    parentId INT DEFAULT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS variant_attributes (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS category_attributes (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    categoryId INT NOT NULL,
    attributeId INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS product_variant_options (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    variantId INT NOT NULL,
    attributeId INT NOT NULL,
    value VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cities (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    isMainCategory TINYINT(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS addresses (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    userId INT DEFAULT NULL,
    line1 VARCHAR(255) NOT NULL,
    line2 VARCHAR(255) DEFAULT NULL,
    city VARCHAR(120) DEFAULT NULL,
    cityId INT DEFAULT NULL,
    postalCode VARCHAR(32) DEFAULT NULL,
    isDefault TINYINT(1) NOT NULL DEFAULT 0,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS carts (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    variantId INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    selected TINYINT(1) NOT NULL DEFAULT 1,
    unitPrice DECIMAL(10,2) DEFAULT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (userId),
    INDEX (variantId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS users (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(200) NOT NULL UNIQUE,
    role ENUM('Admin','Customer','WarehouseStaff','DeliveryStaff','SuperAdmin') NOT NULL DEFAULT 'Customer',
    password VARCHAR(255) NOT NULL,
    role_accepted TINYINT(1) DEFAULT 0,
    phone VARCHAR(32) DEFAULT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS orders (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    orderDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    totalPrice DECIMAL(10,2) NOT NULL,
    deliveryMode ENUM('Store Pickup','Standard Delivery') NOT NULL,
    deliveryCharge DECIMAL(10,2) NOT NULL DEFAULT '0.00',
    status ENUM('Pending','Confirmed','Assigned','Shipped','Delivered','Cancelled') NOT NULL DEFAULT 'Pending',
    paymentMethod ENUM('Card','CashOnDelivery') NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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
    phone VARCHAR(32) DEFAULT NULL,
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

-- store order-time address snapshot in a 1:1 child table (row exists only for Standard Delivery)
CREATE TABLE IF NOT EXISTS order_addresses (
  orderId INT NOT NULL,
  line1 VARCHAR(255) NOT NULL,
  line2 VARCHAR(255) NULL,
  city VARCHAR(120) NOT NULL,
  postalCode VARCHAR(32) NULL,
  PRIMARY KEY (orderId),
  CONSTRAINT fk_order_addresses_order
    FOREIGN KEY (orderId) REFERENCES orders(id)
    ON UPDATE CASCADE ON DELETE CASCADE
);

-- Clear existing data
SET FOREIGN_KEY_CHECKS=0;
TRUNCATE TABLE product_variant_options;
TRUNCATE TABLE category_attributes;
TRUNCATE TABLE variant_attributes;
TRUNCATE TABLE product_categories;
TRUNCATE TABLE product_variants;
TRUNCATE TABLE products;
TRUNCATE TABLE brands;
SET FOREIGN_KEY_CHECKS=1;

-- Insert Categories (10 main categories with subcategories)
INSERT IGNORE INTO categories (id, name, isMainCategory, parentId) VALUES
(1, 'Mobiles & Tablets', TRUE, NULL),
(2, 'Laptops & Computers', TRUE, NULL),
(3, 'Audio Devices', TRUE, NULL),
(4, 'Cameras & Photography', TRUE, NULL),
(5, 'Home Appliances', TRUE, NULL),
(6, 'Wearables & Smart Devices', TRUE, NULL),
(7, 'Power & Charging', TRUE, NULL),
(8, 'Personal Care & Health', TRUE, NULL),
(9, 'Security & Safety', TRUE, NULL),
(10, 'Toys & Gadgets', TRUE, NULL);

-- Subcategories
INSERT IGNORE INTO categories (name, isMainCategory, parentId) VALUES
('Smartphones', FALSE, 1),
('Tablets', FALSE, 1),
('Laptops', FALSE, 2),
('Gaming Laptops', FALSE, 2),
('Headphones', FALSE, 3),
('Earbuds', FALSE, 3),
('Speakers', FALSE, 3),
('Digital Cameras', FALSE, 4),
('Action Cameras', FALSE, 4),
('Kitchen Appliances', FALSE, 5),
('Cleaning Appliances', FALSE, 5),
('Smartwatches', FALSE, 6),
('Fitness Trackers', FALSE, 6),
('Power Banks', FALSE, 7),
('Chargers', FALSE, 7),
('Grooming', FALSE, 8),
('Health Monitors', FALSE, 8),
('CCTV Cameras', FALSE, 9),
('Smart Doorbells', FALSE, 9),
('Educational Toys', FALSE, 10),
('Robot Toys', FALSE, 10);

-- Insert Brands
INSERT IGNORE INTO brands (id, name) VALUES
(1,'Samsung'),(2,'Apple'),(3,'Google'),(4,'Sony'),(5,'OnePlus'),
(6,'Xiaomi'),(7,'Anker'),(8,'JBL'),(9,'Canon'),(10,'Dyson'),
(11,'Fitbit'),(12,'Garmin'),(13,'Belkin'),(14,'Philips'),(15,'Ring'),
(16,'Dell'),(17,'Lenovo'),(18,'HP'),(19,'Bose'),(20,'Beats');

-- Insert Variant Attributes
INSERT IGNORE INTO variant_attributes (id, name) VALUES
(1,'Storage'),(2,'RAM'),(3,'Display'),(4,'Color'),(5,'Size'),(6,'Capacity'),(7,'Wattage');

-- Insert 40 Products (4 per category)
INSERT IGNORE INTO products (id, name, description, brand) VALUES
-- Category 1: Mobiles & Tablets (Products 1-4)
(1,'Galaxy S25 Ultra','Flagship Samsung phone with AI camera','Samsung'),
(2,'iPhone 17 Pro','Latest Apple flagship with A19 chip','Apple'),
(3,'Pixel 10 Pro','Google flagship with advanced AI','Google'),
(4,'iPad Pro 13-inch','Professional tablet with M4 chip','Apple'),

-- Category 2: Laptops & Computers (Products 5-8)
(5,'MacBook Air M3 15"','Lightweight Apple laptop','Apple'),
(6,'Dell XPS 15','Premium Windows laptop','Dell'),
(7,'Lenovo Legion 9','High-performance gaming laptop','Lenovo'),
(8,'HP Spectre x360','Convertible 2-in-1 laptop','HP'),

-- Category 3: Audio Devices (Products 9-12)
(9,'Sony WH-1000XM6','Premium noise-canceling headphones','Sony'),
(10,'AirPods Pro 3','Apple wireless earbuds with ANC','Apple'),
(11,'JBL Charge 6','Portable Bluetooth speaker','JBL'),
(12,'Beats Studio Pro','Premium wireless headphones','Beats'),

-- Category 4: Cameras & Photography (Products 13-16)
(13,'Sony A7R V','High-resolution mirrorless camera','Sony'),
(14,'Canon EOS R7','APS-C mirrorless camera','Canon'),
(15,'GoPro Hero 12','Action camera for adventures','GoPro'),
(16,'DJI Mini 4','Compact drone with 4K camera','DJI'),

-- Category 5: Home Appliances (Products 17-20)
(17,'Samsung Family Hub','Smart refrigerator','Samsung'),
(18,'Dyson V15','Cordless vacuum cleaner','Dyson'),
(19,'Instant Vortex 10QT','Air fryer','Instant'),
(20,'Breville Barista','Espresso machine','Breville'),

-- Category 6: Wearables & Smart Devices (Products 21-24)
(21,'Apple Watch Series 10','Advanced smartwatch','Apple'),
(22,'Fitbit Luxe 3','Fitness tracker','Fitbit'),
(23,'Garmin Fenix 8','Outdoor GPS smartwatch','Garmin'),
(24,'Samsung Galaxy Watch 6','Android smartwatch','Samsung'),

-- Category 7: Power & Charging (Products 25-28)
(25,'Anker 737 Power Bank','High-capacity 24000mAh','Anker'),
(26,'Belkin 65W Charger','GaN fast charger','Belkin'),
(27,'Mophie MagSafe 3','Wireless charging pad','Mophie'),
(28,'RavPower 120W','Multi-port desktop charger','RavPower'),

-- Category 8: Personal Care & Health (Products 29-32)
(29,'Philips Series 9000','Premium electric shaver','Philips'),
(30,'Oral-B iO10','Smart electric toothbrush','Oral-B'),
(31,'Omron Platinum BP','Blood pressure monitor','Omron'),
(32,'Withings Body+','Smart body scale','Withings'),

-- Category 9: Security & Safety (Products 33-36)
(33,'Arlo Pro 4','Wireless security camera','Arlo'),
(34,'Ring Spotlight Cam','Security camera with spotlight','Ring'),
(35,'Nest Doorbell','Smart video doorbell','Google'),
(36,'SimpliSafe System','Complete home security kit','SimpliSafe'),

-- Category 10: Toys & Gadgets (Products 37-40)
(37,'Sphero Mini','Educational robot ball','Sphero'),
(38,'Osmo Starter Kit','Interactive learning system','Osmo'),
(39,'LEGO Mindstorms','Programmable robot kit','LEGO'),
(40,'Anki Vector','AI companion robot','Anki');

-- Insert Product Variants (70 total: 20 products × 1 variant, 10 × 2 variants, 10 × 3 variants)
INSERT IGNORE INTO product_variants (id, productId, variantName, SKU, stockQnt, price, imageURL) VALUES
-- Products 1-20: Single variant each (20 variants)
(1,1,'Galaxy S25 Ultra - 256GB','SKU-GAL-S25-256',120,1299.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/1/1760940242661_siad2d.webp'),
(2,2,'iPhone 17 Pro - 256GB','SKU-IPH-17P-256',100,1199.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/2/1760940489537_bjbgli.webp'),
(3,3,'Pixel 10 Pro - 256GB','SKU-PIX-10P-256',90,999.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/3/1760941238244_zf1xol.webp'),
(4,4,'iPad Pro 13" - 512GB','SKU-IPAD-P13-512',80,1399.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/4/1760940476468_g8qnav.jpg'),
(5,5,'MacBook Air M3 - 512GB','SKU-MBA-M3-512',70,1299.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/5/1760940821857_gg3h4m.jpg'),
(6,6,'Dell XPS 15 - 512GB','SKU-XPS-15-512',60,1499.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/6/1760940058162_qfw5ws.avif'),
(7,7,'Lenovo Legion 9 - 1TB','SKU-LEG-9-1TB',50,2499.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/7/1760940806686_i79z6b.webp'),
(8,8,'HP Spectre x360 - 512GB','SKU-SPX-360-512',65,1399.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/8/1760940420008_3rsm9s.jpg'),
(9,9,'Sony WH-1000XM6 - Black','SKU-SON-XM6-BLK',150,399.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/9/1760941493798_g662u6.webp'),
(10,10,'AirPods Pro 3','SKU-AIRP-PRO3',200,299.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/10/1760941633317_qt1eku.jpg'),
(11,11,'JBL Charge 6 - Black','SKU-JBL-CH6-BLK',140,179.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/11/1760940511930_ecrxfw.webp'),
(12,12,'Beats Studio Pro - Black','SKU-BEA-SP-BLK',100,349.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/12/1760939786210_352xbg.jpg'),
(13,13,'Sony A7R V - Body','SKU-SON-A7RV',40,3499.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/13/1760941478026_kriqd7.webp'),
(14,14,'Canon EOS R7 - Body','SKU-CAN-R7',50,1799.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/14/1760940032112_vfxken.webp'),
(15,15,'GoPro Hero 12 - Black','SKU-GPR-H12-BLK',110,499.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/15/1760940319197_dgdgu8.jpg'),
(16,16,'DJI Mini 4','SKU-DJI-MINI4',90,599.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/16/1760940075548_etcyu3.webp'),
(17,17,'Samsung Family Hub','SKU-SAM-FH',25,3499.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/17/1760941349640_r1aadq.jpg'),
(18,18,'Dyson V15','SKU-DYS-V15',55,599.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/18/1760940096977_wf4vh4.jpg'),
(19,19,'Instant Vortex 10QT','SKU-INS-VX10',120,169.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/19/1760940445048_p7kfts.jpg'),
(20,20,'Breville Barista','SKU-BRV-BAR',60,699.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/20/1760940014528_vt65uv.webp'),

-- Products 21-30: Two variants each (20 variants)
(21,21,'Apple Watch S10 - 41mm','SKU-AW-S10-41',150,399.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/21/1760881042787_erevfv.webp'),
(22,21,'Apple Watch S10 - 45mm','SKU-AW-S10-45',130,449.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/22/1760939687943_dqeugb.webp'),
(23,22,'Fitbit Luxe 3 - Black','SKU-FIT-L3-BLK',140,149.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/23/1760940146524_mzeoz1.webp'),
(24,22,'Fitbit Luxe 3 - Gold','SKU-FIT-L3-GLD',120,159.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/24/1760940126656_whje12.jpeg'),
(25,23,'Garmin Fenix 8 - Standard','SKU-GAR-F8-STD',60,599.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/25/1760940284705_q23n7m.jpg'),
(26,23,'Garmin Fenix 8 - Solar','SKU-GAR-F8-SOL',50,699.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/26/1760940300412_y8lptx.jpg'),
(27,24,'Galaxy Watch 6 - 40mm','SKU-GAL-W6-40',120,249.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/27/1760941271218_fjk79t.webp'),
(28,24,'Galaxy Watch 6 - 44mm','SKU-GAL-W6-44',110,299.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/28/1760941364236_shsqqm.jpg'),
(29,25,'Anker 737 - 24000mAh','SKU-ANK-737-24K',200,119.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/29/1760939513076_489ne7.webp'),
(30,25,'Anker 737 - 30000mAh','SKU-ANK-737-30K',150,149.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/30/1760939530422_gbi6iw.webp'),
(31,26,'Belkin 65W - Single Port','SKU-BEL-65-1P',250,59.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/31/1760939809999_jd07q4.jpg'),
(32,26,'Belkin 65W - Dual Port','SKU-BEL-65-2P',200,79.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/32/1760939835310_dc82wp.webp'),
(33,27,'Mophie MagSafe 3 - Black','SKU-MOP-MS3-BLK',140,69.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/33/1760940842257_ksh3ch.jpg'),
(34,27,'Mophie MagSafe 3 - White','SKU-MOP-MS3-WHT',130,69.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/34/1760940860532_eteae4.webp'),
(35,28,'RavPower 120W - 4 Port','SKU-RAV-120-4P',160,129.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/35/1760941271218_fjk79t.webp'),
(36,28,'RavPower 120W - 6 Port','SKU-RAV-120-6P',140,149.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/36/1760941256674_6i55pd.webp'),
(37,29,'Philips 9000 - Standard','SKU-PHI-9K-STD',100,299.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/37/1760941186269_kx3sxo.jpg'),
(38,29,'Philips 9000 - Travel','SKU-PHI-9K-TRV',80,279.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/38/1760941172593_xqbdq6.jpg'),
(39,30,'Oral-B iO10 - Black','SKU-ORB-IO10-BLK',120,249.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/39/1760941052859_cj9t2v.jpg'),
(40,30,'Oral-B iO10 - White','SKU-ORB-IO10-WHT',110,249.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/40/1760941020968_ewkomq.jpg'),

-- Products 31-40: Three variants each (30 variants)
(41,31,'Omron Platinum - Standard','SKU-OMR-PL-STD',90,129.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/41/1760941002057_0q9n8c.jpg'),
(42,31,'Omron Platinum - Large Cuff','SKU-OMR-PL-LRG',80,149.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/42/1760940962036_rk78np.jpg'),
(43,31,'Omron Platinum - Bluetooth','SKU-OMR-PL-BT',70,169.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/43/1760940985262_x6oy4w.jpg'),
(44,32,'Withings Body+ - Black','SKU-WIT-BP-BLK',120,99.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/44/1760941576163_kktgrx.jpg'),
(45,32,'Withings Body+ - White','SKU-WIT-BP-WHT',110,99.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/45/1760941566421_wtxiv9.jpg'),
(46,32,'Withings Body+ - Pro','SKU-WIT-BP-PRO',90,129.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/46/1760941553244_zbhm2z.webp'),
(47,33,'Arlo Pro 4 - Single','SKU-ARL-P4-SGL',80,249.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/47/1760939761948_wuao0f.webp'),
(48,33,'Arlo Pro 4 - 2-Pack','SKU-ARL-P4-2PK',50,449.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/48/1760939744276_vlkcmi.jpeg'),
(49,33,'Arlo Pro 4 - 4-Pack','SKU-ARL-P4-4PK',30,849.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/49/1760939723875_43z0t4.jpg'),
(50,34,'Ring Spotlight - Wired','SKU-RNG-SP-WRD',100,199.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/50/1760941284778_7uenw8.jpg'),
(51,34,'Ring Spotlight - Battery','SKU-RNG-SP-BAT',90,229.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/51/1760941316852_jggtl1.jpg'),
(52,34,'Ring Spotlight - Solar','SKU-RNG-SP-SOL',70,259.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/52/1760941302031_s7vh8v.jpg'),
(53,35,'Nest Doorbell - Wired','SKU-NST-DB-WRD',110,179.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/53/1760940894139_c0mvuc.jpg'),
(54,35,'Nest Doorbell - Battery','SKU-NST-DB-BAT',100,199.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/54/1760940877190_01h1ck.jpg'),
(55,35,'Nest Doorbell - Bundle','SKU-NST-DB-BDL',80,249.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/55/1760940928633_6vh8tr.avif'),
(56,36,'SimpliSafe - 5 Piece','SKU-SIM-SS-5PC',60,299.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/56/1760941395255_xw8zlw.webp'),
(57,36,'SimpliSafe - 8 Piece','SKU-SIM-SS-8PC',50,449.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/57/1760941413960_cgsh5f.jpg'),
(58,36,'SimpliSafe - 12 Piece','SKU-SIM-SS-12PC',40,599.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/58/1760941429179_p5oz3l.webp'),
(59,37,'Sphero Mini - Blue','SKU-SPH-MINI-BLU',150,49.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/59/1760941515433_4ywtgz.webp'),
(60,37,'Sphero Mini - Green','SKU-SPH-MINI-GRN',140,49.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/60/1760941527034_dzn9fl.jpg'),
(61,37,'Sphero Mini - Orange','SKU-SPH-MINI-ORG',130,49.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/61/1760941539319_31acey.jpg'),
(62,38,'Osmo Starter - Numbers','SKU-OSM-ST-NUM',100,79.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/62/1760941152681_0k9nya.webp'),
(63,38,'Osmo Starter - Words','SKU-OSM-ST-WRD',95,79.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/63/1760941115719_afgn0s.webp'),
(64,38,'Osmo Starter - Complete','SKU-OSM-ST-CMP',85,119.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/64/1760941084840_xkrfnl.jpg'),
(65,39,'LEGO Mindstorms - Base','SKU-LEG-MS-BSE',50,349.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/65/1760940752420_0emat9.webp'),
(66,39,'LEGO Mindstorms - Plus','SKU-LEG-MS-PLS',40,449.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/66/1760940766850_zmrns1.jpg'),
(67,39,'LEGO Mindstorms - Pro','SKU-LEG-MS-PRO',30,599.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/67/1760940791154_svenkj.png'),
(68,40,'Anki Vector - Standard','SKU-ANK-VEC-STD',70,299.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/68/1760939605737_s4xcjw.webp'),
(69,40,'Anki Vector - Collector','SKU-ANK-VEC-COL',50,349.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/69/1760939586507_drgu9c.webp'),
(70,40,'Anki Vector - Space','SKU-ANK-VEC-SPC',40,329.99,'https://brightbuy.s3.ap-south-1.amazonaws.com/variant/70/1760939545298_27964m.webp');

-- Map Products to Categories (products can belong to multiple relevant categories)
INSERT IGNORE INTO product_categories (productId, categoryId) VALUES
-- Product 1: Galaxy S25 Ultra (Mobiles & Tablets)
(1,1),
-- Product 2: iPhone 17 Pro (Mobiles & Tablets)
(2,1),
-- Product 3: Pixel 10 Pro (Mobiles & Tablets)
(3,1),
-- Product 4: iPad Pro (Mobiles & Tablets, Laptops & Computers for productivity)
(4,1),(4,2),
-- Product 5: MacBook Air (Laptops & Computers)
(5,2),
-- Product 6: Dell XPS 15 (Laptops & Computers)
(6,2),
-- Product 7: Lenovo Legion 9 (Laptops & Computers, Toys & Gadgets for gaming)
(7,2),(7,10),
-- Product 8: HP Spectre x360 (Laptops & Computers, Mobiles & Tablets as convertible)
(8,2),(8,1),
-- Product 9: Sony WH-1000XM6 (Audio Devices)
(9,3),
-- Product 10: AirPods Pro 3 (Audio Devices, Wearables & Smart Devices)
(10,3),(10,6),
-- Product 11: JBL Charge 6 (Audio Devices)
(11,3),
-- Product 12: Beats Studio Pro (Audio Devices)
(12,3),
-- Product 13: Sony A7R V (Cameras & Photography)
(13,4),
-- Product 14: Canon EOS R7 (Cameras & Photography)
(14,4),
-- Product 15: GoPro Hero 12 (Cameras & Photography, Wearables & Smart Devices, Toys & Gadgets)
(15,4),(15,6),(15,10),
-- Product 16: DJI Mini 4 (Cameras & Photography, Toys & Gadgets)
(16,4),(16,10),
-- Product 17: Samsung Family Hub (Home Appliances)
(17,5),
-- Product 18: Dyson V15 (Home Appliances)
(18,5),
-- Product 19: Instant Vortex (Home Appliances)
(19,5),
-- Product 20: Breville Barista (Home Appliances)
(20,5),
-- Product 21: Apple Watch Series 10 (Wearables & Smart Devices, Personal Care & Health for fitness)
(21,6),(21,8),
-- Product 22: Fitbit Luxe 3 (Wearables & Smart Devices, Personal Care & Health)
(22,6),(22,8),
-- Product 23: Garmin Fenix 8 (Wearables & Smart Devices, Personal Care & Health)
(23,6),(23,8),
-- Product 24: Samsung Galaxy Watch 6 (Wearables & Smart Devices, Personal Care & Health)
(24,6),(24,8),
-- Product 25: Anker 737 Power Bank (Power & Charging, Mobiles & Tablets accessory)
(25,7),(25,1),
-- Product 26: Belkin 65W Charger (Power & Charging, Laptops & Computers accessory)
(26,7),(26,2),
-- Product 27: Mophie MagSafe 3 (Power & Charging, Mobiles & Tablets accessory)
(27,7),(27,1),
-- Product 28: RavPower 120W (Power & Charging, Laptops & Computers accessory)
(28,7),(28,2),
-- Product 29: Philips Series 9000 (Personal Care & Health)
(29,8),
-- Product 30: Oral-B iO10 (Personal Care & Health)
(30,8),
-- Product 31: Omron Platinum BP (Personal Care & Health)
(31,8),
-- Product 32: Withings Body+ (Personal Care & Health, Wearables & Smart Devices)
(32,8),(32,6),
-- Product 33: Arlo Pro 4 (Security & Safety)
(33,9),
-- Product 34: Ring Spotlight Cam (Security & Safety)
(34,9),
-- Product 35: Nest Doorbell (Security & Safety, Wearables & Smart Devices)
(35,9),(35,6),
-- Product 36: SimpliSafe System (Security & Safety)
(36,9),
-- Product 37: Sphero Mini (Toys & Gadgets)
(37,10),
-- Product 38: Osmo Starter Kit (Toys & Gadgets)
(38,10),
-- Product 39: LEGO Mindstorms (Toys & Gadgets, Laptops & Computers for programming)
(39,10),(39,2),
-- Product 40: Anki Vector (Toys & Gadgets, Wearables & Smart Devices as AI companion)
(40,10),(40,6);

-- Map Attributes to Categories (category_attributes table)
INSERT IGNORE INTO category_attributes (categoryId, attributeId) VALUES
-- Category 1: Mobiles & Tablets
(1,1),(1,2),(1,3),(1,4),
-- Category 2: Laptops & Computers
(2,1),(2,2),(2,3),(2,4),
-- Category 3: Audio Devices
(3,4),(3,5),
-- Category 4: Cameras & Photography
(4,1),(4,4),(4,5),
-- Category 5: Home Appliances
(5,4),(5,6),
-- Category 6: Wearables & Smart Devices
(6,3),(6,4),(6,5),
-- Category 7: Power & Charging
(7,6),(7,7),(7,4),
-- Category 8: Personal Care & Health
(8,4),(8,5),
-- Category 9: Security & Safety
(9,4),(9,5),
-- Category 10: Toys & Gadgets
(10,4),(10,5);

-- Insert Product Variant Options (sample attributes for key products)
INSERT IGNORE INTO product_variant_options (variantId, attributeId, value) VALUES
-- Phone variants (products 1-3)
(1,1,'256GB'),(1,2,'12GB'),(1,3,'6.8"'),(1,4,'Phantom Black'),
(2,1,'256GB'),(2,2,'8GB'),(2,3,'6.1"'),(2,4,'Titanium'),
(3,1,'256GB'),(3,2,'12GB'),(3,3,'6.7"'),(3,4,'Obsidian'),
-- Tablet (product 4)
(4,1,'512GB'),(4,2,'16GB'),(4,3,'13"'),(4,4,'Space Gray'),
-- Laptops (products 5-8)
(5,1,'512GB'),(5,2,'16GB'),(5,3,'15"'),(5,4,'Midnight'),
(6,1,'512GB'),(6,2,'16GB'),(6,3,'15.6"'),(6,4,'Platinum Silver'),
(7,1,'1TB'),(7,2,'32GB'),(7,3,'16"'),(7,4,'Storm Grey'),
(8,1,'512GB'),(8,2,'16GB'),(8,3,'14"'),(8,4,'Nocturne Blue'),
-- Audio devices
(9,4,'Midnight Black'),(10,4,'White'),
(11,4,'Black'),(11,5,'Large'),
(12,4,'Black'),(12,5,'Medium'),
-- Smartwatches
(21,3,'1.9"'),(21,4,'Midnight'),(21,5,'41mm'),
(22,3,'2.1"'),(22,4,'Midnight'),(22,5,'45mm'),
(23,4,'Black'),(23,5,'Small'),
(24,4,'Gold'),(24,5,'Small'),
-- Power banks
(29,6,'24000mAh'),(29,4,'Black'),
(30,6,'30000mAh'),(30,4,'Black'),
-- Chargers
(31,7,'65W'),(31,4,'White'),
(32,7,'65W'),(32,4,'White'),
-- Security cameras
(47,4,'White'),(47,5,'Single'),
(48,4,'White'),(48,5,'2-Pack'),
(49,4,'White'),(49,5,'4-Pack');

-- Insert Cities
INSERT IGNORE INTO cities (id, name, isMainCategory) VALUES
(1,'New York',TRUE),(2,'Los Angeles',TRUE),(3,'Chicago',TRUE),
(4,'Houston',TRUE),(5,'Philadelphia',TRUE),(6,'Phoenix',TRUE),
(7,'San Antonio',TRUE),(8,'San Diego',TRUE),(9,'Dallas',TRUE),(10,'San Jose',TRUE),
(11,'Amarillo',FALSE),
(12,'Lubbock',FALSE),
(13,'Waco',FALSE),
(14,'College Station',FALSE),
(15,'Tyler',FALSE),
(16,'Beaumont',FALSE),
(17,'Abilene',FALSE),
(18,'Midland',FALSE),
(19,'Odessa',FALSE),
(20,'Wichita Falls',FALSE),
(21,'McAllen',FALSE),
(22,'Brownsville',FALSE),
(23,'Killeen',FALSE),
(24,'Temple',FALSE),
(25,'Longview',FALSE),
(26,'Sherman',FALSE),
(27,'Victoria',FALSE),
(28,'Nacogdoches',FALSE),
(29,'San Angelo',FALSE),
(30,'Texarkana',FALSE);

-- Insert Sample Users
INSERT IGNORE INTO users (id, email, password, name, role, phone, role_accepted) VALUES
(1,'admin@brightbuy.com','$2b$10$ujNTE98wE4xP9JaxzxuRD.ZfYtQgF8REeAIn3R2OqkifBfsMER1by','Admin User','Admin','555-0000',TRUE),
(2,'delivery@brightbuy.com','$2b$10$DxttBS0TJRRnQ3blI4JMx.YjP5YzbZ/wIeogFtPvn1O4h0Ctgce7m','Delivery Staff','DeliveryStaff','555-0101',TRUE),
(3,'john@customer.com','password123','John Doe','Customer','555-1001',TRUE),
(4,'jane@customer.com','password123','Jane Smith','Customer','555-1002',TRUE),
(5,'mike@customer.com','password123','Mike Johnson','Customer','555-1003',TRUE),
(6,'sarah@customer.com','password123','Sarah Wilson','Customer','555-1004',TRUE),
(7,'david@customer.com','password123','David Brown','Customer','555-1005',TRUE);

-- Insert Sample Addresses
INSERT IGNORE INTO addresses (id, userId, line1, line2, city, cityId, postalCode, isDefault) VALUES
(1,3,'123 Main St',NULL,'New York',1,'10001',1),
(2,4,'456 Oak Ave','Apt 5','Los Angeles',2,'90001',1),
(3,5,'789 Pine St',NULL,'Chicago',3,'60601',1),
(4,6,'321 Elm Dr',NULL,'Houston',4,'77001',1),
(5,7,'654 Maple Rd','Suite 10','Philadelphia',5,'19019',1);

-- Insert Sample Orders (covering different time periods)
INSERT IGNORE INTO orders (id, userId, orderDate, totalPrice, deliveryMode, deliveryCharge, status, paymentMethod) VALUES
(1,3,'2024-11-15 10:30:00',1314.99,'Standard Delivery',15.00,'Delivered','Card'),
(2,4,'2024-12-05 14:45:00',399.99,'Store Pickup',0.00,'Delivered','Card'),
(3,5,'2025-01-10 09:15:00',311.99,'Standard Delivery',12.00,'Shipped','CashOnDelivery'),
(4,3,'2025-02-14 16:20:00',189.99,'Standard Delivery',10.00,'Confirmed','Card'),
(5,6,'2025-03-20 11:30:00',449.99,'Store Pickup',0.00,'Delivered','Card'),
(6,4,'2025-04-18 13:45:00',1514.99,'Standard Delivery',15.00,'Delivered','Card'),
-- (7,7,'2025-05-22 10:00:00',699.99,'Standard Delivery',12.00,'Shipped','Card'),
(8,5,'2025-06-10 15:30:00',249.99,'Store Pickup',0.00,'Confirmed','CashOnDelivery'),
(9,3,'2025-07-08 12:15:00',3514.99,'Standard Delivery',15.00,'Delivered','Card'),
(10,6,'2025-08-25 14:20:00',829.99,'Standard Delivery',20.00,'Delivered','Card'),
(11,4,'2025-09-12 11:45:00',179.99,'Store Pickup',0.00,'Confirmed','Card'),
(12,7,'2025-10-01 16:30:00',2514.99,'Standard Delivery',15.00,'Pending','Card');

-- Insert Order Items
INSERT IGNORE INTO order_items (orderId, variantId, quantity, unitPrice, totalPrice) VALUES
-- Order 1: Galaxy S25 Ultra
(1,1,1,1299.99,1299.99),
-- Order 2: Sony WH-1000XM6
(2,9,1,399.99,399.99),
-- Order 3: AirPods Pro 3
(3,10,1,299.99,299.99),
-- Order 4: JBL Charge 6
(4,11,1,179.99,179.99),
-- Order 5: Beats Studio Pro
(5,12,1,349.99,349.99),
(5,29,1,119.99,119.99),
-- Order 6: MacBook Air M3
(6,5,1,1299.99,1299.99),
(6,10,1,199.99,199.99),
-- Order 7: Breville Barista
(7,20,1,699.99,699.99),
-- Order 8: Fitbit Luxe 3
(8,23,1,149.99,149.99),
(8,29,1,119.99,119.99),
-- Order 9: Sony A7R V
(9,13,1,3499.99,3499.99),
-- Order 10: Arlo Pro 4 2-Pack
(10,48,1,449.99,449.99),
(10,31,2,59.99,119.99),
(10,53,1,179.99,179.99),
-- Order 11: JBL Charge 6
(11,11,1,179.99,179.99),
-- Order 12: Lenovo Legion 9
(12,7,1,2499.99,2499.99);

-- Insert Deliveries
INSERT IGNORE INTO deliveries (orderId, staffId, status, deliveryDate, phone) VALUES
(1,2,'Delivered','2024-11-16 15:00:00','9876543210'),
(3,2,'Shipped',NULL,'9876543211'),
(6,2,'Delivered','2025-04-19 14:30:00','9876543212'),
(7,2,'Shipped',NULL,'9876543213'),
(9,2,'Delivered','2025-07-09 16:00:00','9876543214'),
(10,2,'Delivered','2025-08-26 11:00:00','9876543215');

-- Insert Payments
INSERT IGNORE INTO payments (userId, orderId, amount, paymentMethod, status) VALUES
(3,1,1314.99,'Card','Paid'),
(4,2,399.99,'Card','Paid'),
(5,3,311.99,'CashOnDelivery','Pending'),
(3,4,189.99,'Card','Paid'),
(6,5,449.99,'Card','Paid'),
(4,6,1514.99,'Card','Paid'),
(7,7,699.99,'Card','Paid'),
(5,8,249.99,'CashOnDelivery','Pending'),
(3,9,3514.99,'Card','Paid'),
(6,10,829.99,'Card','Paid'),
(4,11,179.99,'Card','Paid'),
(7,12,2514.99,'Card','Pending');

-- Verification queries (uncomment to run):
-- SELECT COUNT(*) as total_products FROM products; -- Expected: 40
-- SELECT COUNT(*) as total_variants FROM product_variants; -- Expected: 70
-- SELECT categoryId, COUNT(*) as products_per_category FROM product_categories GROUP BY categoryId;
-- SELECT ca.categoryId, c.name as category_name, COUNT(ca.attributeId) as attribute_count 
-- FROM category_attributes ca 
-- JOIN categories c ON ca.categoryId = c.id 
-- GROUP BY ca.categoryId, c.name;