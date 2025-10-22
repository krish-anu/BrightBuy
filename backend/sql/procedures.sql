-- BrightBuy DB procedures
-- Extracted from procedures_and_triggers.sql

DELIMITER $$

-- Procedure: create a full order atomically (address -> order -> items -> delivery -> payment)
-- Inputs mirror your controller flow; pass NULLs for optional values
DROP PROCEDURE IF EXISTS sp_create_order $$
CREATE PROCEDURE sp_create_order(
  IN p_userId INT,
  IN p_deliveryMode VARCHAR(32),
  IN p_paymentMethod VARCHAR(32),
  -- IN p_addressLine1 VARCHAR(255),
  -- IN p_addressLine2 VARCHAR(255),
  -- IN p_city VARCHAR(120),
  -- IN p_postalCode VARCHAR(32),
  IN p_deliveryAddressId INT,
  IN p_deliveryCharge DECIMAL(10,2)
)
BEGIN
  DECLARE v_orderId INT;
  DECLARE v_line1 VARCHAR(255);
  DECLARE v_line2 VARCHAR(255);
  DECLARE v_city VARCHAR(120);
  DECLARE v_postal VARCHAR(32);

  DECLARE exit handler for sqlexception
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  -- -- Optional address insert for Standard Delivery
  -- SET v_deliveryAddressId = NULL;
  -- IF p_deliveryMode = 'Standard Delivery' AND p_addressLine1 IS NOT NULL AND p_city IS NOT NULL THEN
  --   INSERT INTO addresses (line1, line2, city, postalCode) VALUES (p_addressLine1, p_addressLine2, p_city, p_postalCode);
  --   SET v_deliveryAddressId = LAST_INSERT_ID();
  -- END IF;

  -- Insert order with initial warehouse status = 'Pending' (payment handled separately)
  INSERT INTO orders (userId, deliveryMode, totalPrice, deliveryCharge, paymentMethod, status)
  VALUES (p_userId, p_deliveryMode, 0.00, p_deliveryCharge, p_paymentMethod, 'Pending');
  SET v_orderId = LAST_INSERT_ID();

  -- For Standard Delivery, snapshot the address into 1:1 child table (3NF, historical accuracy)
  IF p_deliveryMode = 'Standard Delivery' AND p_deliveryAddressId IS NOT NULL THEN
    SELECT a.line1, a.line2, a.city, a.postalCode
      INTO v_line1, v_line2, v_city, v_postal
      FROM addresses a WHERE a.id = p_deliveryAddressId LIMIT 1;
    INSERT INTO order_addresses (orderId, line1, line2, city, postalCode)
    VALUES (v_orderId, v_line1, v_line2, v_city, v_postal);
  END IF;

  -- Items must be inserted by caller afterwards with sp_add_order_item; totals will be recomputed

  -- Auto-create delivery record for Standard Delivery
  IF p_deliveryMode = 'Standard Delivery' THEN
    INSERT INTO deliveries (orderId, status) VALUES (v_orderId, 'Pending');
  END IF;

  COMMIT;

  SELECT v_orderId AS orderId;
END $$

-- Procedure: add a single order item with stock check and optional stock decrement
DROP PROCEDURE IF EXISTS sp_add_order_item $$
CREATE PROCEDURE sp_add_order_item(
  IN p_orderId INT,
  IN p_variantId INT,
  IN p_quantity INT,
  IN p_backordered TINYINT(1)
)
BEGIN
  DECLARE v_price DECIMAL(10,2);
  DECLARE v_stock INT;

  DECLARE exit handler for sqlexception
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  -- Lock variant row for stock check
  SELECT price, stockQnt INTO v_price, v_stock
  FROM product_variants WHERE id = p_variantId FOR UPDATE;

  IF v_price IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Variant not found';
  END IF;

  IF v_stock IS NULL OR v_stock < p_quantity THEN
    -- Mark as backordered if stock is insufficient
    SET p_backordered = 1;
  ELSE
    -- Deduct stock if available
    UPDATE product_variants
    SET stockQnt = stockQnt - p_quantity
    WHERE id = p_variantId;
    SET p_backordered = 0;
  END IF;

  -- Insert the order item
  INSERT INTO order_items (orderId, variantId, quantity, unitPrice, totalPrice, isBackOrdered)
  VALUES (p_orderId, p_variantId, p_quantity, v_price, v_price * p_quantity, p_backordered);

  -- Recompute order total (excluding deliveryCharge; controller still sets final price if needed)
  UPDATE orders SET totalPrice = fn_calculate_order_total(p_orderId)
  WHERE id = p_orderId;

  COMMIT;
END $$

-- Procedure: finalize payment record for an order (atomic upsert-like)
DROP PROCEDURE IF EXISTS sp_create_payment $$
CREATE PROCEDURE sp_create_payment(
  IN p_userId INT,
  IN p_orderId INT,
  IN p_paymentMethod VARCHAR(32),
  IN p_amount DECIMAL(12,2),
  IN p_paymentIntentId VARCHAR(255)
)
BEGIN
  DECLARE exit handler for sqlexception
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  -- Insert payment; mark Paid if intent id is present, else Pending
  INSERT INTO payments (userId, orderId, amount, paymentMethod, status, paymentIntentId)
  VALUES (p_userId, p_orderId, p_amount,
    CASE WHEN p_paymentMethod = 'CashOnDelivery' THEN 'CashOnDelivery' ELSE 'Card' END,
    CASE WHEN p_paymentIntentId IS NOT NULL THEN 'Paid' ELSE 'Pending' END,
    p_paymentIntentId);

  COMMIT;
END $$

DELIMITER ;

-- End of procedures.sql
