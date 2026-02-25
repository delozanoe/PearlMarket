module.exports = {
  name: 'account_age',
  calculate(transaction) {
    const days = transaction.account_age_days;
    let score;

    if (days === 0) score = 20;
    else if (days <= 7) score = 15;
    else if (days <= 30) score = 10;
    else if (days <= 90) score = 5;
    else score = 0;

    let severity = 'none';
    if (score >= 15) severity = 'high';
    else if (score >= 5) severity = 'medium';
    else if (score > 0) severity = 'low';

    return {
      score,
      signal: 'account_age',
      description: score > 0
        ? `Account is only ${days} days old`
        : `Account is ${days} days old (established)`,
      severity,
    };
  },
};
