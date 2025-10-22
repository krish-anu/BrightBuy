-- BrightBuy DB functions
-- Extracted from procedures_and_triggers.sql

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

DELIMITER ;

-- End of functions.sql
