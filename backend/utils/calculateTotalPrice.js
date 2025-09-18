// backend/utils/cart.js

function calculateTotalPrice(items, discount = 0) {
  // items = [{ price: number, quantity: number }]
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return total - total * discount;
}

module.exports = { calculateTotalPrice };
