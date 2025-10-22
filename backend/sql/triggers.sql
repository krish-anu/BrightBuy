-- BrightBuy DB triggers
-- Extracted from procedures_and_triggers.sql

DELIMITER $$

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

-- End of triggers.sql
