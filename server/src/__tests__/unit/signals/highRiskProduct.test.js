const signal = require('../../../services/signals/highRiskProduct');
const { buildTransaction } = require('../../helpers/fixtures');

describe('highRiskProduct signal', () => {
  test('Gift Cards score 20', () => {
    const result = signal.calculate(buildTransaction({ product_category: 'Gift Cards' }));
    expect(result.score).toBe(20);
    expect(result.severity).toBe('high');
  });

  test('Electronics score 15', () => {
    expect(signal.calculate(buildTransaction({ product_category: 'Electronics' })).score).toBe(15);
  });

  test('Fashion scores 5', () => {
    expect(signal.calculate(buildTransaction({ product_category: 'Fashion' })).score).toBe(5);
  });

  test('Home Goods scores 0', () => {
    expect(signal.calculate(buildTransaction({ product_category: 'Home Goods' })).score).toBe(0);
  });

  test('unknown category scores 0', () => {
    expect(signal.calculate(buildTransaction({ product_category: 'Books' })).score).toBe(0);
  });
});
