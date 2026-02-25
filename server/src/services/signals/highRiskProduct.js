const CATEGORY_SCORES = {
  'Gift Cards': 20,
  'Electronics': 15,
  'Fashion': 5,
  'Home Goods': 0,
};

module.exports = {
  name: 'high_risk_product',
  calculate(transaction) {
    const score = CATEGORY_SCORES[transaction.product_category] ?? 0;
    let severity = 'none';
    if (score >= 15) severity = 'high';
    else if (score >= 5) severity = 'medium';
    else if (score > 0) severity = 'low';

    return {
      score,
      signal: 'high_risk_product',
      description: score > 0
        ? `Product category "${transaction.product_category}" is high-risk`
        : `Product category "${transaction.product_category}" is low-risk`,
      severity,
    };
  },
};
