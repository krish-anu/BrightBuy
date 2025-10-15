Database ACID hardening for BrightBuy

What’s here
- constraints_and_indexes.sql: Adds FKs, CHECKs, and indexes. Also adds missing columns (isBackOrdered, paymentIntentId, cancelReason) referenced by the app.
- procedures_and_triggers.sql: Adds function fn_calculate_order_total, procedures sp_create_order, sp_add_order_item, sp_create_payment, and triggers to guard stock and keep totals in sync.

Run order
1) constraints_and_indexes.sql
2) procedures_and_triggers.sql

How to use from Node
- Continue using the existing transaction flow in order.controller.js (beginTransaction/commit/rollback on one connection).
- Optionally, you may replace parts with stored procedures:
  a) Call sp_create_order(userId, deliveryMode, paymentMethod, line1, line2, city, postalCode, deliveryCharge) -> returns orderId.
  b) For each item: sp_add_order_item(orderId, variantId, quantity, isBackOrdered)
  c) sp_create_payment(userId, orderId, paymentMethod, totalPrice+deliveryCharge, paymentIntentId)

ACID mapping
- Atomicity: Each SP runs in its own transaction; Node-side flows already wrap the overall operation.
- Consistency: Enforced by FKs, CHECKs, and triggers.
- Isolation: For stock, sp_add_order_item uses SELECT ... FOR UPDATE. Keep using a single connection per request.
- Durability: InnoDB transactions; ensure production MySQL durability settings.

Notes
- Some MySQL versions don’t support IF NOT EXISTS for constraints. If you see errors, apply with explicit CREATE INDEX/ALTER TABLE once.
- Validate legacy data before enabling FKs in production.
