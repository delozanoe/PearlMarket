const signal = require('../../../services/signals/amountAnomaly');
const { buildTransaction } = require('../../helpers/fixtures');

describe('amountAnomaly signal', () => {
  test('$100 USD scores 0', () => {
    expect(signal.calculate(buildTransaction({ amount: 100, currency: 'USD' })).score).toBe(0);
  });

  test('$500 USD scores 0 (boundary)', () => {
    expect(signal.calculate(buildTransaction({ amount: 500, currency: 'USD' })).score).toBe(0);
  });

  test('$501 USD scores 5', () => {
    expect(signal.calculate(buildTransaction({ amount: 501, currency: 'USD' })).score).toBe(5);
  });

  test('$1001 USD scores 10', () => {
    expect(signal.calculate(buildTransaction({ amount: 1001, currency: 'USD' })).score).toBe(10);
  });

  test('$1501 USD scores 15', () => {
    expect(signal.calculate(buildTransaction({ amount: 1501, currency: 'USD' })).score).toBe(15);
  });

  test('converts IDR to USD before scoring', () => {
    // 10,000,000 IDR * 0.000063 = 630 USD -> score 5
    expect(signal.calculate(buildTransaction({ amount: 10000000, currency: 'IDR' })).score).toBe(5);
  });
});
