jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: { create: jest.fn().mockResolvedValue({ id: 'pi_test' }) },
  }));
});

const request = require('supertest');
// Use the express app (not the server that starts the listener) to avoid port/DB startup in tests
const app = require('../app');

describe('Lightweight server smoke tests', () => {
  test('GET / returns welcome message', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/hello from api/i);
  });
});
