const { toUSD, RATES_TO_USD } = require('../../services/currencyConverter');

describe('currencyConverter', () => {
  test('converts USD to USD (1:1)', () => {
    expect(toUSD(100, 'USD')).toBe(100);
  });

  test('converts IDR to USD', () => {
    expect(toUSD(1000000, 'IDR')).toBeCloseTo(63, 0);
  });

  test('converts VND to USD', () => {
    expect(toUSD(1000000, 'VND')).toBeCloseTo(40, 0);
  });

  test('converts PHP to USD', () => {
    expect(toUSD(1000, 'PHP')).toBeCloseTo(18, 0);
  });

  test('converts SGD to USD', () => {
    expect(toUSD(100, 'SGD')).toBeCloseTo(74, 0);
  });

  test('throws on unsupported currency', () => {
    expect(() => toUSD(100, 'BTC')).toThrow('Unsupported currency: BTC');
  });

  test('has all expected currencies', () => {
    expect(Object.keys(RATES_TO_USD).sort()).toEqual(['IDR', 'PHP', 'SGD', 'USD', 'VND']);
  });
});
