const signal = require('../../../services/signals/geoMismatch');
const { buildTransaction } = require('../../helpers/fixtures');

describe('geoMismatch signal', () => {
  test('name is geo_mismatch', () => {
    expect(signal.name).toBe('geo_mismatch');
  });

  test('all countries match scores 0', () => {
    const result = signal.calculate(buildTransaction({
      billing_country: 'US', shipping_country: 'US', ip_country: 'US',
    }));
    expect(result.score).toBe(0);
    expect(result.severity).toBe('none');
  });

  test('billing != shipping (IP matches billing) scores 10', () => {
    const result = signal.calculate(buildTransaction({
      billing_country: 'US', shipping_country: 'SG', ip_country: 'US',
    }));
    expect(result.score).toBe(10);
    expect(result.severity).toBe('medium');
  });

  test('billing != IP (shipping matches billing) scores 15', () => {
    const result = signal.calculate(buildTransaction({
      billing_country: 'US', shipping_country: 'US', ip_country: 'RU',
    }));
    expect(result.score).toBe(15);
    expect(result.severity).toBe('medium');
  });

  test('all three different scores 30', () => {
    const result = signal.calculate(buildTransaction({
      billing_country: 'US', shipping_country: 'NG', ip_country: 'RU',
    }));
    expect(result.score).toBe(30);
    expect(result.severity).toBe('high');
  });

  test('shipping matches IP but not billing scores 15', () => {
    const result = signal.calculate(buildTransaction({
      billing_country: 'US', shipping_country: 'RU', ip_country: 'RU',
    }));
    expect(result.score).toBe(15);
    expect(result.severity).toBe('medium');
  });
});
