const validateTransaction = require('../../middleware/validateTransaction');
const { buildTransaction } = require('../helpers/fixtures');

function createMockReqRes(body) {
  return {
    req: { body },
    res: {},
    next: jest.fn(),
  };
}

describe('validateTransaction middleware', () => {
  test('passes valid transaction', () => {
    const { req, res, next } = createMockReqRes(buildTransaction());
    validateTransaction(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  test('rejects missing amount', () => {
    const txn = buildTransaction();
    delete txn.amount;
    const { req, res, next } = createMockReqRes(txn);
    validateTransaction(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 400,
      details: expect.arrayContaining(['amount is required']),
    }));
  });

  test('rejects negative amount', () => {
    const { req, res, next } = createMockReqRes(buildTransaction({ amount: -5 }));
    validateTransaction(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      details: expect.arrayContaining(['amount must be a positive number']),
    }));
  });

  test('rejects zero amount', () => {
    const { req, res, next } = createMockReqRes(buildTransaction({ amount: 0 }));
    validateTransaction(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      details: expect.arrayContaining(['amount must be a positive number']),
    }));
  });

  test('rejects invalid currency', () => {
    const { req, res, next } = createMockReqRes(buildTransaction({ currency: 'BTC' }));
    validateTransaction(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      details: expect.arrayContaining([expect.stringContaining('currency must be one of')]),
    }));
  });

  test('rejects invalid email', () => {
    const { req, res, next } = createMockReqRes(buildTransaction({ customer_email: 'not-an-email' }));
    validateTransaction(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      details: expect.arrayContaining(['customer_email must be a valid email address']),
    }));
  });

  test('rejects missing billing_country', () => {
    const txn = buildTransaction();
    delete txn.billing_country;
    const { req, res, next } = createMockReqRes(txn);
    validateTransaction(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      details: expect.arrayContaining(['billing_country is required']),
    }));
  });

  test('rejects missing shipping_country', () => {
    const txn = buildTransaction();
    delete txn.shipping_country;
    const { req, res, next } = createMockReqRes(txn);
    validateTransaction(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      details: expect.arrayContaining(['shipping_country is required']),
    }));
  });

  test('rejects missing ip_country', () => {
    const txn = buildTransaction();
    delete txn.ip_country;
    const { req, res, next } = createMockReqRes(txn);
    validateTransaction(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      details: expect.arrayContaining(['ip_country is required']),
    }));
  });

  test('rejects invalid card_bin (not 6 digits)', () => {
    const { req, res, next } = createMockReqRes(buildTransaction({ card_bin: '1234' }));
    validateTransaction(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      details: expect.arrayContaining(['card_bin must be exactly 6 digits']),
    }));
  });

  test('rejects invalid card_last4 (not 4 digits)', () => {
    const { req, res, next } = createMockReqRes(buildTransaction({ card_last4: '12' }));
    validateTransaction(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      details: expect.arrayContaining(['card_last4 must be exactly 4 digits']),
    }));
  });

  test('rejects invalid product_category', () => {
    const { req, res, next } = createMockReqRes(buildTransaction({ product_category: 'Weapons' }));
    validateTransaction(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      details: expect.arrayContaining([expect.stringContaining('product_category must be one of')]),
    }));
  });

  test('rejects negative account_age_days', () => {
    const { req, res, next } = createMockReqRes(buildTransaction({ account_age_days: -1 }));
    validateTransaction(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      details: expect.arrayContaining(['account_age_days must be a non-negative number']),
    }));
  });

  test('collects multiple errors at once', () => {
    const { req, res, next } = createMockReqRes({});
    validateTransaction(req, res, next);
    const error = next.mock.calls[0][0];
    expect(error.details.length).toBeGreaterThan(1);
  });
});
