const highRiskProduct = require('./signals/highRiskProduct');
const accountAge = require('./signals/accountAge');
const amountAnomaly = require('./signals/amountAnomaly');
const geoMismatch = require('./signals/geoMismatch');
const emailVelocity = require('./signals/emailVelocity');
const cardBinVelocity = require('./signals/cardBinVelocity');
const knownPattern = require('./signals/knownPattern');

const signals = [
  highRiskProduct,
  accountAge,
  amountAnomaly,
  geoMismatch,
  emailVelocity,
  cardBinVelocity,
  knownPattern,
];

function getRiskLevel(score) {
  if (score >= 71) return 'HIGH';
  if (score >= 31) return 'MEDIUM';
  return 'LOW';
}

function scoreTransaction(transaction, db) {
  const breakdown = signals.map((signal) => signal.calculate(transaction, db));
  const rawScore = breakdown.reduce((sum, result) => sum + result.score, 0);
  const fraud_score = Math.min(rawScore, 100);
  const risk_level = getRiskLevel(fraud_score);

  return {
    fraud_score,
    risk_level,
    score_breakdown: breakdown,
  };
}

module.exports = { scoreTransaction, getRiskLevel };
