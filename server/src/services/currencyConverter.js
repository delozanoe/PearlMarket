const RATES_TO_USD = {
  USD: 1,
  IDR: 0.000063,
  VND: 0.000040,
  PHP: 0.018,
  SGD: 0.74,
};

function toUSD(amount, currency) {
  const rate = RATES_TO_USD[currency];
  if (rate === undefined) {
    throw new Error(`Unsupported currency: ${currency}`);
  }
  return amount * rate;
}

module.exports = { toUSD, RATES_TO_USD };
