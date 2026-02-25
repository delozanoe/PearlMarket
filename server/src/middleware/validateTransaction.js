const { ValidationError } = require('../utils/errors');

const VALID_CURRENCIES = ['USD', 'IDR', 'VND', 'PHP', 'SGD'];
const VALID_CATEGORIES = ['Gift Cards', 'Electronics', 'Fashion', 'Home Goods'];

function validateTransaction(req, res, next) {
  const errors = [];
  const body = req.body;

  if (body.amount === undefined || body.amount === null) {
    errors.push('amount is required');
  } else if (typeof body.amount !== 'number' || body.amount <= 0) {
    errors.push('amount must be a positive number');
  }

  if (!body.currency) {
    errors.push('currency is required');
  } else if (!VALID_CURRENCIES.includes(body.currency)) {
    errors.push(`currency must be one of: ${VALID_CURRENCIES.join(', ')}`);
  }

  if (!body.customer_email) {
    errors.push('customer_email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.customer_email)) {
    errors.push('customer_email must be a valid email address');
  }

  if (!body.billing_country) {
    errors.push('billing_country is required');
  }

  if (!body.shipping_country) {
    errors.push('shipping_country is required');
  }

  if (!body.ip_country) {
    errors.push('ip_country is required');
  }

  if (!body.card_bin) {
    errors.push('card_bin is required');
  } else if (!/^\d{6}$/.test(body.card_bin)) {
    errors.push('card_bin must be exactly 6 digits');
  }

  if (!body.card_last4) {
    errors.push('card_last4 is required');
  } else if (!/^\d{4}$/.test(body.card_last4)) {
    errors.push('card_last4 must be exactly 4 digits');
  }

  if (!body.product_category) {
    errors.push('product_category is required');
  } else if (!VALID_CATEGORIES.includes(body.product_category)) {
    errors.push(`product_category must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }

  if (body.account_age_days === undefined || body.account_age_days === null) {
    errors.push('account_age_days is required');
  } else if (typeof body.account_age_days !== 'number' || body.account_age_days < 0) {
    errors.push('account_age_days must be a non-negative number');
  }

  if (errors.length > 0) {
    return next(new ValidationError('Validation failed', errors));
  }

  next();
}

module.exports = validateTransaction;
