// backend/__tests__/orders.test.js
const request = require('supertest');
const app = require('../server'); // Express app

describe('Order API', () => {
  it('should create a new order', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({
        userId: 1,
        items: [{ productId: 1, quantity: 2 }]
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('orderId');
  });
});
