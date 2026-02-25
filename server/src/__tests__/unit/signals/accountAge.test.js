const signal = require('../../../services/signals/accountAge');
const { buildTransaction } = require('../../helpers/fixtures');

describe('accountAge signal', () => {
  test('0 days scores 20', () => {
    expect(signal.calculate(buildTransaction({ account_age_days: 0 })).score).toBe(20);
  });

  test('1-7 days scores 15', () => {
    expect(signal.calculate(buildTransaction({ account_age_days: 1 })).score).toBe(15);
    expect(signal.calculate(buildTransaction({ account_age_days: 7 })).score).toBe(15);
  });

  test('8-30 days scores 10', () => {
    expect(signal.calculate(buildTransaction({ account_age_days: 8 })).score).toBe(10);
    expect(signal.calculate(buildTransaction({ account_age_days: 30 })).score).toBe(10);
  });

  test('31-90 days scores 5', () => {
    expect(signal.calculate(buildTransaction({ account_age_days: 31 })).score).toBe(5);
    expect(signal.calculate(buildTransaction({ account_age_days: 90 })).score).toBe(5);
  });

  test('91+ days scores 0', () => {
    expect(signal.calculate(buildTransaction({ account_age_days: 91 })).score).toBe(0);
    expect(signal.calculate(buildTransaction({ account_age_days: 365 })).score).toBe(0);
  });
});
