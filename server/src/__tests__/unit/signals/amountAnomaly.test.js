const signal = require('../../../services/signals/amountAnomaly');
const { buildTransaction } = require('../../helpers/fixtures');

describe('amountAnomaly signal', () => {
  test('name is amount_anomaly', () => {
    expect(signal.name).toBe('amount_anomaly');
  });

  test('$100 USD scores 0', () => {
    const result = signal.calculate(buildTransaction({ amount: 100, currency: 'USD' }));
    expect(result.score).toBe(0);
    expect(result.severity).toBe('none');
  });

  test('$500 USD scores 0 (boundary, not >500)', () => {
    const result = signal.calculate(buildTransaction({ amount: 500, currency: 'USD' }));
    expect(result.score).toBe(0);
  });

  test('$501 USD scores 5', () => {
    const result = signal.calculate(buildTransaction({ amount: 501, currency: 'USD' }));
    expect(result.score).toBe(5);
    expect(result.severity).toBe('medium');
  });

  test('$1001 USD scores 10', () => {
    const result = signal.calculate(buildTransaction({ amount: 1001, currency: 'USD' }));
    expect(result.score).toBe(10);
    expect(result.severity).toBe('high');
  });

  test('$1501 USD scores 15', () => {
    const result = signal.calculate(buildTransaction({ amount: 1501, currency: 'USD' }));
    expect(result.score).toBe(15);
    expect(result.severity).toBe('high');
  });

  test('converts IDR to USD before scoring', () => {
    // 10,000,000 IDR * 0.000063 = 630 USD -> score 5
    const result = signal.calculate(buildTransaction({ amount: 10000000, currency: 'IDR' }));
    expect(result.score).toBe(5);
  });

  test('converts SGD to USD before scoring', () => {
    // 2000 SGD * 0.74 = 1480 USD -> score 10
    const result = signal.calculate(buildTransaction({ amount: 2000, currency: 'SGD' }));
    expect(result.score).toBe(10);
  });
});
