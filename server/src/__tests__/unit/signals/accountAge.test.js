const signal = require('../../../services/signals/accountAge');
const { buildTransaction } = require('../../helpers/fixtures');

describe('accountAge signal', () => {
  test('name is account_age', () => {
    expect(signal.name).toBe('account_age');
  });

  test('0 days scores 20', () => {
    const result = signal.calculate(buildTransaction({ account_age_days: 0 }));
    expect(result.score).toBe(20);
    expect(result.severity).toBe('high');
  });

  test('1 day scores 15', () => {
    const result = signal.calculate(buildTransaction({ account_age_days: 1 }));
    expect(result.score).toBe(15);
    expect(result.severity).toBe('high');
  });

  test('7 days scores 15', () => {
    const result = signal.calculate(buildTransaction({ account_age_days: 7 }));
    expect(result.score).toBe(15);
  });

  test('8 days scores 10', () => {
    const result = signal.calculate(buildTransaction({ account_age_days: 8 }));
    expect(result.score).toBe(10);
  });

  test('30 days scores 10', () => {
    const result = signal.calculate(buildTransaction({ account_age_days: 30 }));
    expect(result.score).toBe(10);
  });

  test('31 days scores 5', () => {
    const result = signal.calculate(buildTransaction({ account_age_days: 31 }));
    expect(result.score).toBe(5);
    expect(result.severity).toBe('medium');
  });

  test('90 days scores 5', () => {
    const result = signal.calculate(buildTransaction({ account_age_days: 90 }));
    expect(result.score).toBe(5);
  });

  test('91 days scores 0', () => {
    const result = signal.calculate(buildTransaction({ account_age_days: 91 }));
    expect(result.score).toBe(0);
    expect(result.severity).toBe('none');
  });

  test('365 days scores 0', () => {
    const result = signal.calculate(buildTransaction({ account_age_days: 365 }));
    expect(result.score).toBe(0);
  });
});
