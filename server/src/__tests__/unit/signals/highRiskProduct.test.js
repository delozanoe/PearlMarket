const signal = require('../../../services/signals/highRiskProduct');
const { buildTransaction } = require('../../helpers/fixtures');

describe('highRiskProduct signal', () => {
  test('name is high_risk_product', () => {
    expect(signal.name).toBe('high_risk_product');
  });

  test('Gift Cards score 20', () => {
    const result = signal.calculate(buildTransaction({ product_category: 'Gift Cards' }));
    expect(result.score).toBe(20);
    expect(result.severity).toBe('high');
  });

  test('Electronics score 15', () => {
    const result = signal.calculate(buildTransaction({ product_category: 'Electronics' }));
    expect(result.score).toBe(15);
    expect(result.severity).toBe('high');
  });

  test('Fashion scores 5', () => {
    const result = signal.calculate(buildTransaction({ product_category: 'Fashion' }));
    expect(result.score).toBe(5);
    expect(result.severity).toBe('medium');
  });

  test('Home Goods scores 0', () => {
    const result = signal.calculate(buildTransaction({ product_category: 'Home Goods' }));
    expect(result.score).toBe(0);
    expect(result.severity).toBe('none');
  });

  test('unknown category scores 0', () => {
    const result = signal.calculate(buildTransaction({ product_category: 'Books' }));
    expect(result.score).toBe(0);
  });

  test('returns correct shape', () => {
    const result = signal.calculate(buildTransaction({ product_category: 'Gift Cards' }));
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('signal', 'high_risk_product');
    expect(result).toHaveProperty('description');
    expect(result).toHaveProperty('severity');
  });
});
