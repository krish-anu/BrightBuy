jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: { create: jest.fn().mockResolvedValue({ id: 'pi_test' }) },
  }));
});

const Stripe = require('stripe');

describe('auth / stripe mock sanity', () => {
  test('stripe mock create paymentIntent resolves', async () => {
    const stripe = new Stripe();
    const pi = await stripe.paymentIntents.create({ amount: 1000, currency: 'usd' });
    expect(pi).toBeDefined();
    expect(pi.id).toBe('pi_test');
  });

  test('basic sanity check', () => {
    expect(1 + 1).toBe(2);
  });
});
