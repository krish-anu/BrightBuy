jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: { create: jest.fn().mockResolvedValue({ id: 'pi_test' }) },
  }));
});
