const signal = require('../../../services/signals/geoMismatch');
const { buildTransaction } = require('../../helpers/fixtures');

describe('geoMismatch signal', () => {
  test('all match scores 0', () => {
    const result = signal.calculate(buildTransaction({ billing_country: 'US', shipping_country: 'US', ip_country: 'US' }));
    expect(result.score).toBe(0);
  });

  test('billing != shipping scores 10', () => {
    const result = signal.calculate(buildTransaction({ billing_country: 'US', shipping_country: 'SG', ip_country: 'US' }));
    expect(result.score).toBe(10);
  });

  test('billing != IP scores 15', () => {
    const result = signal.calculate(buildTransaction({ billing_country: 'US', shipping_country: 'US', ip_country: 'RU' }));
    expect(result.score).toBe(15);
  });

  test('all different scores 30', () => {
    const result = signal.calculate(buildTransaction({ billing_country: 'US', shipping_country: 'NG', ip_country: 'RU' }));
    expect(result.score).toBe(30);
  });
});
