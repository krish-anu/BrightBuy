-- BrightBuy DB procedures
-- Extracted from procedures_and_triggers.sql

DELIMITER $$

-- Procedure: create a full order atomically (address -> order -> items -> delivery -> payment)
DROP PROCEDURE IF EXISTS sp_create_order $$
CREATE PROCEDURE sp_create_order(
  IN p_userId INT,
  IN p_deliveryMode VARCHAR(32),
  IN p_paymentMethod VARCHAR(32),
  IN p_deliveryAddressId INT,
  IN p_deliveryCharge DECIMAL(10,2)
)
BEGIN
  DECLARE v_orderId INT;
  DECLARE v_deliveryAddressId INT;

  DECLARE exit handler for sqlexception
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  INSERT INTO orders (userId, deliveryMode, deliveryAddressId, totalPrice, deliveryCharge, paymentMethod, status)
  VALUES (p_userId, p_deliveryMode, p_deliveryAddressId, 0.00, p_deliveryCharge, p_paymentMethod,
    CASE WHEN p_paymentMethod = 'CashOnDelivery' THEN 'Confirmed' ELSE 'Pending' END);
  SET v_orderId = LAST_INSERT_ID();

  IF p_deliveryMode = 'Standard Delivery' THEN
    INSERT INTO deliveries (orderId, status) VALUES (v_orderId, 'Pending');
  END IF;

  COMMIT;

  SELECT v_orderId AS orderId, v_deliveryAddressId AS deliveryAddressId;
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
    SET p_backordered = 1;
  ELSE
    UPDATE product_variants
    SET stockQnt = stockQnt - p_quantity
    WHERE id = p_variantId;
    SET p_backordered = 0;
  END IF;

  INSERT INTO order_items (orderId, variantId, quantity, unitPrice, totalPrice, isBackOrdered)
  VALUES (p_orderId, p_variantId, p_quantity, v_price, v_price * p_quantity, p_backordered);

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

  INSERT INTO payments (userId, orderId, amount, paymentMethod, status, paymentIntentId)
  VALUES (p_userId, p_orderId, p_amount,
    CASE WHEN p_paymentMethod = 'CashOnDelivery' THEN 'CashOnDelivery' ELSE 'Card' END,
    CASE WHEN p_paymentIntentId IS NOT NULL THEN 'Paid' ELSE 'Pending' END,
    p_paymentIntentId);

  COMMIT;
END $$

DELIMITER ;

-- End of procedures.sql
