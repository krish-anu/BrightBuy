-- BrightBuy DB procedures, functions, and triggers
-- Purpose: Centralize multi-step operations in transactions, enforce invariants at DB layer.
-- Compatible with MySQL 8.0+

DELIMITER $$

-- Function: calculate order total from items table (fallback server-side check)
DROP FUNCTION IF EXISTS fn_calculate_order_total $$
CREATE FUNCTION fn_calculate_order_total(p_orderId INT)
RETURNS DECIMAL(12,2)
DETERMINISTIC
BEGIN
  DECLARE v_total DECIMAL(12,2);
  SELECT IFNULL(SUM(totalPrice), 0.00) INTO v_total
  FROM order_items WHERE orderId = p_orderId;
  RETURN v_total;
END $$

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
  DECLARE v_deliveryAddressId INT;

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
  INSERT INTO orders (userId, deliveryMode, deliveryAddressId, totalPrice, deliveryCharge, paymentMethod, status)
  VALUES (p_userId, p_deliveryMode, p_deliveryAddressId, 0.00, p_deliveryCharge, p_paymentMethod,
    'Pending');
  SET v_orderId = LAST_INSERT_ID();

  -- Items must be inserted by caller afterwards with sp_add_order_item; totals will be recomputed

  -- Auto-create delivery record for Standard Delivery
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

-- Trigger: prevent negative stock
DROP TRIGGER IF EXISTS trg_product_variants_no_negative_stock $$
CREATE TRIGGER trg_product_variants_no_negative_stock
BEFORE UPDATE ON product_variants
FOR EACH ROW
BEGIN
  IF NEW.stockQnt < 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Stock cannot be negative';
  END IF;
END $$

-- Trigger: ensure order_items totalPrice consistency
DROP TRIGGER IF EXISTS trg_order_items_set_totals $$
CREATE TRIGGER trg_order_items_set_totals
BEFORE INSERT ON order_items
FOR EACH ROW
BEGIN
  DECLARE v_price DECIMAL(10,2);
  IF NEW.unitPrice IS NULL OR NEW.unitPrice = 0 THEN
    SELECT price INTO v_price FROM product_variants WHERE id = NEW.variantId;
    SET NEW.unitPrice = IFNULL(v_price, 0.00);
  END IF;
  SET NEW.totalPrice = ROUND(NEW.unitPrice * NEW.quantity, 2);
END $$

-- Trigger: keep orders.totalPrice in sync when items change
DROP TRIGGER IF EXISTS trg_order_items_after_change $$
CREATE TRIGGER trg_order_items_after_change
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
  UPDATE orders SET totalPrice = fn_calculate_order_total(NEW.orderId)
  WHERE id = NEW.orderId;
END $$

-- Additional hook for updates/deletes if you allow editing items
DROP TRIGGER IF EXISTS trg_order_items_after_update $$
CREATE TRIGGER trg_order_items_after_update
AFTER UPDATE ON order_items
FOR EACH ROW
BEGIN
  UPDATE orders SET totalPrice = fn_calculate_order_total(NEW.orderId)
  WHERE id = NEW.orderId;
END $$

DROP TRIGGER IF EXISTS trg_order_items_after_delete $$
CREATE TRIGGER trg_order_items_after_delete
AFTER DELETE ON order_items
FOR EACH ROW
BEGIN
  UPDATE orders SET totalPrice = fn_calculate_order_total(OLD.orderId)
  WHERE id = OLD.orderId;
END $$

DELIMITER ;

-- End of procedures_and_triggers.sql
