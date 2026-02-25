module.exports = {
  name: 'geo_mismatch',
  calculate(transaction) {
    const { billing_country, shipping_country, ip_country } = transaction;

    const billingShippingMatch = billing_country === shipping_country;
    const billingIpMatch = billing_country === ip_country;
    const shippingIpMatch = shipping_country === ip_country;

    let score;
    if (!billingShippingMatch && !billingIpMatch && !shippingIpMatch) {
      score = 30;
    } else if (!billingIpMatch) {
      score = 15;
    } else if (!billingShippingMatch) {
      score = 10;
    } else {
      score = 0;
    }

    let severity = 'none';
    if (score >= 20) severity = 'high';
    else if (score >= 10) severity = 'medium';
    else if (score > 0) severity = 'low';

    return {
      score,
      signal: 'geo_mismatch',
      description: score > 0
        ? `Geographic mismatch detected (billing: ${billing_country}, shipping: ${shipping_country}, IP: ${ip_country})`
        : 'All geographic locations match',
      severity,
    };
  },
};
