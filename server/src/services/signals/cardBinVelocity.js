module.exports = {
  name: 'card_bin_velocity',
  calculate(transaction, db) {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const result = db.prepare(`
      SELECT COUNT(*) as count FROM transactions
      WHERE card_bin = ? AND created_at > ?
    `).get(transaction.card_bin, thirtyMinutesAgo);

    const count = result.count;
    let score;

    if (count >= 4) score = 15;
    else if (count >= 2) score = 10;
    else score = 0;

    let severity = 'none';
    if (score >= 15) severity = 'high';
    else if (score >= 10) severity = 'medium';
    else if (score > 0) severity = 'low';

    return {
      score,
      signal: 'card_bin_velocity',
      description: score > 0
        ? `${count} transactions with this card BIN in last 30 minutes`
        : 'Normal card BIN transaction velocity',
      severity,
    };
  },
};
