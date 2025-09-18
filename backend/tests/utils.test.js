// backend/__tests__/utils.test.js
const { calculateTotalPrice } = require('../utils/calculateTotalPrice');

test('calculate total price with discount', () => {
  const items = [
    { price: 100, quantity: 2 },
    { price: 50, quantity: 1 }
  ];
  const discount = 0.1; // 10%
  expect(calculateTotalPrice(items, discount)).toBe(225);
});
