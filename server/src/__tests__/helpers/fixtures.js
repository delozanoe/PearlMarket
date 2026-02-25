function buildTransaction(overrides = {}) {
  return {
    amount: 100.00,
    currency: 'USD',
    customer_email: 'customer@example.com',
    billing_country: 'US',
    shipping_country: 'US',
    ip_country: 'US',
    ip_address: '192.168.1.1',
    card_bin: '411111',
    card_last4: '1234',
    product_category: 'Home Goods',
    account_age_days: 365,
    ...overrides,
  };
}

function buildHighRiskTransaction(overrides = {}) {
  return buildTransaction({
    amount: 2000.00,
    currency: 'USD',
    customer_email: 'suspicious@tempmail.com',
    billing_country: 'US',
    shipping_country: 'NG',
    ip_country: 'RU',
    product_category: 'Gift Cards',
    account_age_days: 0,
    ...overrides,
  });
}

function buildMediumRiskTransaction(overrides = {}) {
  return buildTransaction({
    amount: 500.00,
    currency: 'USD',
    customer_email: 'customer@example.com',
    billing_country: 'US',
    shipping_country: 'SG',
    ip_country: 'US',
    product_category: 'Electronics',
    account_age_days: 60,
    ...overrides,
  });
}

function buildLowRiskTransaction(overrides = {}) {
  return buildTransaction({
    amount: 25.00,
    currency: 'USD',
    customer_email: 'loyal@gmail.com',
    billing_country: 'SG',
    shipping_country: 'SG',
    ip_country: 'SG',
    product_category: 'Home Goods',
    account_age_days: 730,
    ...overrides,
  });
}

module.exports = { buildTransaction, buildHighRiskTransaction, buildMediumRiskTransaction, buildLowRiskTransaction };
