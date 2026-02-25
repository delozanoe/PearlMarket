const CURRENCIES = ['USD', 'IDR', 'VND', 'PHP', 'SGD'];
const COUNTRIES = ['US', 'ID', 'VN', 'PH', 'SG', 'MY', 'TH', 'JP', 'AU', 'GB'];
const PRODUCT_CATEGORIES = ['Electronics', 'Gift Cards', 'Fashion', 'Home Goods'];
const STATUSES = ['PENDING', 'APPROVED', 'BLOCKED'];

const SIGNAL_POOL = [
  { signal: 'geo_mismatch', score: 30, description: 'All 3 countries differ', severity: 'HIGH' },
  { signal: 'geo_mismatch', score: 15, description: '2 of 3 countries differ', severity: 'MEDIUM' },
  { signal: 'high_risk_product', score: 15, description: 'Electronics purchase', severity: 'MEDIUM' },
  { signal: 'high_risk_product', score: 20, description: 'Gift Cards purchase', severity: 'HIGH' },
  { signal: 'velocity', score: 25, description: '5+ transactions in 1 hour', severity: 'HIGH' },
  { signal: 'velocity', score: 10, description: '3 transactions in 1 hour', severity: 'MEDIUM' },
  { signal: 'new_account', score: 20, description: 'Account less than 7 days old', severity: 'HIGH' },
  { signal: 'new_account', score: 10, description: 'Account less than 30 days old', severity: 'MEDIUM' },
  { signal: 'amount_spike', score: 18, description: 'Amount 3x above customer average', severity: 'HIGH' },
  { signal: 'amount_spike', score: 8, description: 'Amount 1.5x above customer average', severity: 'LOW' },
  { signal: 'bin_risk', score: 12, description: 'Card BIN from high-risk issuer', severity: 'MEDIUM' },
  { signal: 'bin_risk', score: 5, description: 'Card BIN from moderate-risk issuer', severity: 'LOW' },
];

function riskLevelFromScore(score) {
  if (score <= 30) return 'LOW';
  if (score <= 70) return 'MEDIUM';
  return 'HIGH';
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

let counter = 0;
function generateUUID() {
  counter++;
  return `tx-${String(counter).padStart(4, '0')}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildBreakdown(fraudScore) {
  const signals = [];
  let remaining = fraudScore;
  const shuffled = [...SIGNAL_POOL].sort(() => Math.random() - 0.5);
  for (const sig of shuffled) {
    if (remaining <= 0) break;
    if (sig.score <= remaining) {
      signals.push({ ...sig });
      remaining -= sig.score;
    }
  }
  if (remaining > 0) {
    signals.push({
      signal: 'composite_risk',
      score: remaining,
      description: 'Combined minor risk factors',
      severity: remaining >= 15 ? 'MEDIUM' : 'LOW',
    });
  }
  return signals;
}

export function makeTransaction(overrides = {}) {
  const fraudScore = overrides.fraud_score ?? Math.floor(Math.random() * 101);
  const riskLevel = overrides.risk_level ?? riskLevelFromScore(fraudScore);
  const now = new Date().toISOString();
  const base = {
    id: generateUUID(),
    amount: parseFloat((Math.random() * 4900 + 100).toFixed(2)),
    currency: pickRandom(CURRENCIES),
    customer_email: `user${Math.floor(Math.random() * 9000) + 1000}@example.com`,
    billing_country: pickRandom(COUNTRIES),
    shipping_country: pickRandom(COUNTRIES),
    ip_country: pickRandom(COUNTRIES),
    ip_address: `${Math.floor(Math.random() * 224) + 1}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
    card_bin: String(Math.floor(Math.random() * 900000) + 100000),
    card_last4: String(Math.floor(Math.random() * 9000) + 1000),
    product_category: pickRandom(PRODUCT_CATEGORIES),
    account_age_days: Math.floor(Math.random() * 365),
    fraud_score: fraudScore,
    risk_level: riskLevel,
    score_breakdown: buildBreakdown(fraudScore),
    status: pickRandom(STATUSES),
    created_at: now,
    updated_at: now,
  };
  return { ...base, ...overrides };
}

export function makeStats(overrides = {}) {
  const total = overrides.total_transactions ?? 250;
  const pending = overrides.pending ?? Math.floor(total * 0.4);
  const approved = overrides.approved ?? Math.floor(total * 0.35);
  const blocked = overrides.blocked ?? total - pending - approved;
  return {
    total_transactions: total,
    pending,
    approved,
    blocked,
    avg_fraud_score: overrides.avg_fraud_score ?? 42,
    high_risk_count: overrides.high_risk_count ?? Math.floor(total * 0.15),
    medium_risk_count: overrides.medium_risk_count ?? Math.floor(total * 0.35),
    low_risk_count: overrides.low_risk_count ?? Math.floor(total * 0.5),
    ...overrides,
  };
}

const SEED_DATA = [
  { fraud_score: 5, status: 'APPROVED', amount: 29.99, currency: 'USD', product_category: 'Fashion', billing_country: 'US', shipping_country: 'US', ip_country: 'US', account_age_days: 300 },
  { fraud_score: 12, status: 'APPROVED', amount: 149.00, currency: 'SGD', product_category: 'Home Goods', billing_country: 'SG', shipping_country: 'SG', ip_country: 'SG', account_age_days: 180 },
  { fraud_score: 8, status: 'APPROVED', amount: 75.50, currency: 'USD', product_category: 'Fashion', billing_country: 'US', shipping_country: 'US', ip_country: 'US', account_age_days: 450 },
  { fraud_score: 22, status: 'PENDING', amount: 320.00, currency: 'PHP', product_category: 'Home Goods', billing_country: 'PH', shipping_country: 'PH', ip_country: 'PH', account_age_days: 90 },
  { fraud_score: 18, status: 'APPROVED', amount: 55.00, currency: 'IDR', product_category: 'Fashion', billing_country: 'ID', shipping_country: 'ID', ip_country: 'ID', account_age_days: 200 },
  { fraud_score: 28, status: 'PENDING', amount: 199.99, currency: 'VND', product_category: 'Home Goods', billing_country: 'VN', shipping_country: 'VN', ip_country: 'VN', account_age_days: 60 },
  { fraud_score: 10, status: 'APPROVED', amount: 42.00, currency: 'USD', product_category: 'Fashion', billing_country: 'GB', shipping_country: 'GB', ip_country: 'GB', account_age_days: 365 },
  { fraud_score: 15, status: 'APPROVED', amount: 88.50, currency: 'SGD', product_category: 'Home Goods', billing_country: 'SG', shipping_country: 'SG', ip_country: 'SG', account_age_days: 120 },
  { fraud_score: 35, status: 'PENDING', amount: 499.99, currency: 'USD', product_category: 'Electronics', billing_country: 'US', shipping_country: 'US', ip_country: 'JP', account_age_days: 45 },
  { fraud_score: 48, status: 'PENDING', amount: 850.00, currency: 'IDR', product_category: 'Electronics', billing_country: 'ID', shipping_country: 'MY', ip_country: 'ID', account_age_days: 30 },
  { fraud_score: 55, status: 'BLOCKED', amount: 200.00, currency: 'PHP', product_category: 'Gift Cards', billing_country: 'PH', shipping_country: 'PH', ip_country: 'VN', account_age_days: 15 },
  { fraud_score: 42, status: 'APPROVED', amount: 375.00, currency: 'SGD', product_category: 'Fashion', billing_country: 'SG', shipping_country: 'SG', ip_country: 'MY', account_age_days: 60 },
  { fraud_score: 61, status: 'PENDING', amount: 1100.00, currency: 'VND', product_category: 'Electronics', billing_country: 'VN', shipping_country: 'TH', ip_country: 'VN', account_age_days: 20 },
  { fraud_score: 38, status: 'APPROVED', amount: 150.00, currency: 'USD', product_category: 'Home Goods', billing_country: 'US', shipping_country: 'US', ip_country: 'AU', account_age_days: 75 },
  { fraud_score: 50, status: 'PENDING', amount: 600.00, currency: 'IDR', product_category: 'Gift Cards', billing_country: 'ID', shipping_country: 'ID', ip_country: 'SG', account_age_days: 10 },
  { fraud_score: 67, status: 'PENDING', amount: 920.00, currency: 'PHP', product_category: 'Electronics', billing_country: 'PH', shipping_country: 'JP', ip_country: 'PH', account_age_days: 25 },
  { fraud_score: 44, status: 'APPROVED', amount: 280.00, currency: 'SGD', product_category: 'Fashion', billing_country: 'SG', shipping_country: 'SG', ip_country: 'SG', account_age_days: 100 },
  { fraud_score: 72, status: 'PENDING', amount: 1299.99, currency: 'USD', product_category: 'Electronics', billing_country: 'ID', shipping_country: 'SG', ip_country: 'VN', account_age_days: 2 },
  { fraud_score: 85, status: 'BLOCKED', amount: 2500.00, currency: 'IDR', product_category: 'Gift Cards', billing_country: 'ID', shipping_country: 'MY', ip_country: 'TH', account_age_days: 1 },
  { fraud_score: 91, status: 'BLOCKED', amount: 4999.99, currency: 'USD', product_category: 'Electronics', billing_country: 'US', shipping_country: 'VN', ip_country: 'PH', account_age_days: 0 },
  { fraud_score: 78, status: 'PENDING', amount: 750.00, currency: 'VND', product_category: 'Gift Cards', billing_country: 'VN', shipping_country: 'JP', ip_country: 'ID', account_age_days: 3 },
  { fraud_score: 88, status: 'BLOCKED', amount: 3200.00, currency: 'PHP', product_category: 'Electronics', billing_country: 'PH', shipping_country: 'AU', ip_country: 'SG', account_age_days: 1 },
  { fraud_score: 95, status: 'BLOCKED', amount: 5000.00, currency: 'SGD', product_category: 'Gift Cards', billing_country: 'SG', shipping_country: 'US', ip_country: 'ID', account_age_days: 0 },
  { fraud_score: 74, status: 'PENDING', amount: 980.00, currency: 'IDR', product_category: 'Electronics', billing_country: 'ID', shipping_country: 'TH', ip_country: 'MY', account_age_days: 5 },
  { fraud_score: 82, status: 'BLOCKED', amount: 1800.00, currency: 'USD', product_category: 'Gift Cards', billing_country: 'US', shipping_country: 'ID', ip_country: 'VN', account_age_days: 2 },
];

export const MOCK_TRANSACTIONS = SEED_DATA.map((seed) => makeTransaction(seed));
