module.exports = {
  name: 'email_velocity',
  calculate(transaction, db) {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    const result = db.prepare(`
      SELECT COUNT(*) as count FROM transactions
      WHERE customer_email = ? AND created_at > ?
    `).get(transaction.customer_email, tenMinutesAgo);

    const count = result.count;
    let score;

    if (count >= 6) score = 30;
    else if (count >= 4) score = 25;
    else if (count >= 2) score = 15;
    else score = 0;

    let severity = 'none';
    if (score >= 25) severity = 'high';
    else if (score >= 10) severity = 'medium';
    else if (score > 0) severity = 'low';

    return {
      score,
      signal: 'email_velocity',
      description: score > 0
        ? `${count} transactions from this email in last 10 minutes`
        : 'Normal email transaction velocity',
      severity,
    };
  },
};
