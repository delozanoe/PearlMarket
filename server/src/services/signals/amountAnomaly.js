const { toUSD } = require('../currencyConverter');

module.exports = {
  name: 'amount_anomaly',
  calculate(transaction) {
    const usdAmount = toUSD(transaction.amount, transaction.currency);
    let score;

    if (usdAmount > 1500) score = 15;
    else if (usdAmount > 1000) score = 10;
    else if (usdAmount > 500) score = 5;
    else score = 0;

    let severity = 'none';
    if (score >= 10) severity = 'high';
    else if (score >= 5) severity = 'medium';
    else if (score > 0) severity = 'low';

    return {
      score,
      signal: 'amount_anomaly',
      description: score > 0
        ? `Transaction amount $${usdAmount.toFixed(2)} USD exceeds threshold`
        : `Transaction amount $${usdAmount.toFixed(2)} USD is within normal range`,
      severity,
    };
  },
};
