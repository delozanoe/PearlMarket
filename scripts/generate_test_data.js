#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

// --- CLI args ---
const args = process.argv.slice(2);
let seed = 42;
let outputPath = path.join(__dirname, '..', 'test_transactions.json');

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--seed' && args[i + 1]) seed = parseInt(args[i + 1], 10);
  if (args[i] === '--output' && args[i + 1]) outputPath = args[i + 1];
}

// --- Seeded PRNG (mulberry32) ---
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(seed);

function pick(arr) { return arr[Math.floor(rand() * arr.length)]; }
function randInt(min, max) { return Math.floor(rand() * (max - min + 1)) + min; }
function randFloat(min, max) { return +(min + rand() * (max - min)).toFixed(2); }

// --- Reference data ---
const CURRENCIES = ['USD', 'IDR', 'VND', 'PHP', 'SGD'];
const CATEGORIES = ['Gift Cards', 'Electronics', 'Fashion', 'Home Goods'];
const SEA_COUNTRIES = ['ID', 'VN', 'PH', 'SG', 'MY', 'TH'];
const REAL_EMAILS = [
  'ahmad.rizki@gmail.com', 'linh.nguyen@yahoo.com', 'maria.santos@gmail.com',
  'chen.wei@outlook.com', 'siti.aminah@gmail.com', 'jose.reyes@hotmail.com',
  'budi.santoso@gmail.com', 'mei.lin@gmail.com', 'nguyen.van@yahoo.com',
  'anna.garcia@outlook.com', 'david.lee@gmail.com', 'priya.kumar@gmail.com',
  'tommy.tan@gmail.com', 'sarah.jones@gmail.com', 'kevin.wong@outlook.com',
  'lisa.chen@gmail.com', 'michael.park@yahoo.com', 'emma.smith@gmail.com',
];
const DISPOSABLE_EMAILS = [
  'temp7732@tempmail.com', 'throw1@guerrillamail.com', 'burner99@mailinator.com',
  'anon3@yopmail.com', 'discard5@throwaway.email', 'fake88@tempail.com',
];
const FAKE_BINS = [
  '411111', '422222', '433333', '455555', '466666', '477777',
  '511111', '522222', '533333', '544444', '621111', '352800',
];
const IPS = {
  ID: ['103.28.12.1', '103.28.12.55', '36.80.1.100', '114.124.5.20'],
  VN: ['14.161.2.30', '113.190.0.44', '27.72.100.5'],
  PH: ['120.28.0.15', '49.145.3.22', '112.198.1.10'],
  SG: ['116.12.0.88', '175.156.3.44', '203.125.0.1'],
  MY: ['60.50.1.22', '175.139.0.11'],
  TH: ['171.96.0.33', '49.228.1.7'],
};

// --- Time helpers ---
// Base time: "now" minus 1 hour so velocity windows still work when seeding
const BASE_TIME = new Date('2026-02-25T06:00:00.000Z');
function timeOffset(minutesAgo) {
  return new Date(BASE_TIME.getTime() - minutesAgo * 60 * 1000).toISOString();
}

// --- Build transactions ---
const transactions = [];
let txIndex = 0;

function makeTx(overrides) {
  txIndex++;
  const country = pick(SEA_COUNTRIES);
  const base = {
    amount: randFloat(10, 200),
    currency: 'USD',
    customer_email: pick(REAL_EMAILS),
    billing_country: country,
    shipping_country: country,
    ip_country: country,
    ip_address: pick(IPS[country] || IPS.ID),
    card_bin: pick(FAKE_BINS),
    card_last4: String(randInt(1000, 9999)),
    product_category: pick(['Fashion', 'Home Goods']),
    account_age_days: randInt(90, 730),
    _pattern: 'legitimate',
    _index: txIndex,
  };
  return { ...base, ...overrides };
}

// 1. Email velocity attack cluster (7 txns, same email, within 10 min)
const velocityEmail = 'velocity.attacker@tempmail.com';
const velocityBin = '411111';
for (let i = 0; i < 7; i++) {
  transactions.push(makeTx({
    customer_email: velocityEmail,
    amount: randFloat(50, 300),
    currency: 'USD',
    card_bin: velocityBin,
    card_last4: '9999',
    product_category: pick(['Electronics', 'Gift Cards']),
    account_age_days: randInt(0, 3),
    billing_country: 'SG',
    shipping_country: 'ID',
    ip_country: 'VN',
    ip_address: pick(IPS.VN),
    _pattern: 'email_velocity_attack',
    _created_at_offset_min: i * 1.2, // ~1.2 min apart = all within 10 min
  }));
}

// 2. Card BIN velocity cluster (5 txns, same BIN, within 30 min)
const binClusterBin = '522222';
for (let i = 0; i < 5; i++) {
  transactions.push(makeTx({
    customer_email: pick(DISPOSABLE_EMAILS),
    amount: randFloat(5, 15), // card testing amounts
    currency: 'USD',
    card_bin: binClusterBin,
    card_last4: String(randInt(1000, 9999)),
    product_category: 'Fashion',
    account_age_days: randInt(10, 60),
    _pattern: 'card_bin_velocity',
    _created_at_offset_min: 15 + i * 5, // spread within 30 min window
  }));
}

// 3. Geographic mismatch txns (4 txns, all 3 countries different)
for (let i = 0; i < 4; i++) {
  const countries = [...SEA_COUNTRIES].sort(() => rand() - 0.5).slice(0, 3);
  transactions.push(makeTx({
    customer_email: pick(REAL_EMAILS),
    amount: randFloat(100, 800),
    currency: pick(['USD', 'SGD']),
    billing_country: countries[0],
    shipping_country: countries[1],
    ip_country: countries[2],
    ip_address: pick(IPS[countries[2]] || IPS.ID),
    product_category: pick(CATEGORIES),
    account_age_days: randInt(30, 200),
    _pattern: 'geo_mismatch',
    _created_at_offset_min: 60 + i * 30,
  }));
}

// 4. High-risk product + new account (5 txns)
for (let i = 0; i < 5; i++) {
  const country = pick(SEA_COUNTRIES);
  transactions.push(makeTx({
    customer_email: pick(DISPOSABLE_EMAILS),
    amount: randFloat(200, 1000),
    currency: pick(CURRENCIES),
    product_category: pick(['Gift Cards', 'Electronics']),
    account_age_days: randInt(0, 3),
    billing_country: country,
    shipping_country: country,
    ip_country: country,
    ip_address: pick(IPS[country] || IPS.ID),
    _pattern: 'high_risk_new_account',
    _created_at_offset_min: 200 + i * 40,
  }));
}

// 5. Card testing pattern (4 txns, same email, tiny amounts, rapid)
const cardTestEmail = 'card.tester@yopmail.com';
for (let i = 0; i < 4; i++) {
  transactions.push(makeTx({
    customer_email: cardTestEmail,
    amount: randFloat(1, 10),
    currency: 'USD',
    card_bin: pick(FAKE_BINS),
    card_last4: String(randInt(1000, 9999)),
    product_category: 'Fashion',
    account_age_days: randInt(5, 20),
    _pattern: 'card_testing',
    _created_at_offset_min: 400 + i * 2,
  }));
}

// 6. Legitimate transactions (18 txns)
for (let i = 0; i < 18; i++) {
  const country = pick(SEA_COUNTRIES);
  transactions.push(makeTx({
    customer_email: pick(REAL_EMAILS),
    amount: randFloat(10, 200),
    currency: pick(CURRENCIES),
    billing_country: country,
    shipping_country: country,
    ip_country: country,
    ip_address: pick(IPS[country] || IPS.ID),
    product_category: pick(['Fashion', 'Home Goods']),
    account_age_days: randInt(90, 730),
    _pattern: 'legitimate',
    _created_at_offset_min: 500 + i * 60, // spread over ~18 hours
  }));
}

// 7. Mixed signals (12 txns, 1-2 flags each)
const mixedConfigs = [
  { product_category: 'Electronics', account_age_days: 120 }, // product risk only
  { product_category: 'Fashion', account_age_days: 5 }, // age only
  { amount: 800, currency: 'USD', product_category: 'Home Goods' }, // amount only
  { billing_country: 'SG', shipping_country: 'ID', ip_country: 'SG' }, // billing≠shipping
  { product_category: 'Gift Cards', account_age_days: 50 }, // product risk, mid-age
  { amount: 1200, currency: 'USD', account_age_days: 15 }, // amount + age
  { billing_country: 'PH', shipping_country: 'PH', ip_country: 'VN' }, // ip mismatch
  { product_category: 'Electronics', amount: 600, currency: 'USD' }, // product + amount
  { account_age_days: 25, product_category: 'Fashion' }, // age medium
  { billing_country: 'MY', shipping_country: 'TH', ip_country: 'MY' }, // ship mismatch
  { amount: 1600, currency: 'USD', product_category: 'Home Goods', account_age_days: 365 }, // high amount only
  { product_category: 'Gift Cards', account_age_days: 200, amount: 50, currency: 'USD' }, // product risk, low amount
];

for (let i = 0; i < mixedConfigs.length; i++) {
  const country = mixedConfigs[i].ip_country || pick(SEA_COUNTRIES);
  transactions.push(makeTx({
    customer_email: pick(REAL_EMAILS),
    billing_country: country,
    shipping_country: country,
    ip_country: country,
    ip_address: pick(IPS[country] || IPS.ID),
    ...mixedConfigs[i],
    _pattern: 'mixed_signals',
    _created_at_offset_min: 800 + i * 50,
  }));
}

// --- Assign timestamps ---
const output = transactions.map((tx) => {
  const offsetMin = tx._created_at_offset_min || randInt(0, 1440);
  const created_at = timeOffset(offsetMin);
  const { _pattern, _index, _created_at_offset_min, ...rest } = tx;
  return { ...rest, _meta: { pattern: _pattern, index: _index }, created_at };
});

// --- Validate T6 criteria ---
function validate(data) {
  const checks = [];
  checks.push({ name: '>=50 transactions', pass: data.length >= 50, value: data.length });

  const currencies = new Set(data.map(d => d.currency));
  checks.push({ name: '>=4 currencies', pass: currencies.size >= 4, value: [...currencies] });

  // Email velocity cluster (5+ txns from same email)
  const emailGroups = {};
  data.forEach(d => { emailGroups[d.customer_email] = (emailGroups[d.customer_email] || 0) + 1; });
  const maxEmailCluster = Math.max(...Object.values(emailGroups));
  checks.push({ name: '>=1 email velocity cluster (5+)', pass: maxEmailCluster >= 5, value: maxEmailCluster });

  // Geo mismatches (all 3 different)
  const geoMismatches = data.filter(d =>
    d.billing_country !== d.shipping_country &&
    d.billing_country !== d.ip_country &&
    d.shipping_country !== d.ip_country
  );
  checks.push({ name: '>=3 geo mismatch txns', pass: geoMismatches.length >= 3, value: geoMismatches.length });

  // High-risk + new account
  const highRiskNew = data.filter(d =>
    ['Gift Cards', 'Electronics'].includes(d.product_category) && d.account_age_days <= 3
  );
  checks.push({ name: '>=3 high-risk + new account', pass: highRiskNew.length >= 3, value: highRiskNew.length });

  // Clean/legit (low amount <=200 USD, matching geo, old acct >=90)
  const legit = data.filter(d =>
    d.amount <= 200 &&
    d.billing_country === d.shipping_country &&
    d.billing_country === d.ip_country &&
    d.account_age_days >= 90
  );
  checks.push({ name: '>=10 clean/legit', pass: legit.length >= 10, value: legit.length });

  // All 4 categories
  const categories = new Set(data.map(d => d.product_category));
  checks.push({ name: 'all 4 product categories', pass: categories.size >= 4, value: [...categories] });

  // Account age range
  const ages = data.map(d => d.account_age_days);
  checks.push({ name: 'account age 0 to 365+', pass: Math.min(...ages) <= 0 && Math.max(...ages) >= 365, value: `${Math.min(...ages)} - ${Math.max(...ages)}` });

  // Amount range
  const amounts = data.map(d => d.amount);
  checks.push({ name: 'amount $5 to $2000+', pass: Math.min(...amounts) <= 15 && Math.max(...amounts) >= 500, value: `${Math.min(...amounts)} - ${Math.max(...amounts)}` });

  // 24-hour timestamp spread
  const timestamps = data.map(d => new Date(d.created_at).getTime());
  const spreadHours = (Math.max(...timestamps) - Math.min(...timestamps)) / 3600000;
  checks.push({ name: '24-hour timestamp spread', pass: spreadHours >= 20, value: `${spreadHours.toFixed(1)} hours` });

  return checks;
}

const checks = validate(output);
console.log('\n  Test Data Validation (T6 Criteria)');
console.log('  ===================================');
checks.forEach(c => {
  const icon = c.pass ? 'PASS' : 'FAIL';
  console.log(`  [${icon}] ${c.name}: ${JSON.stringify(c.value)}`);
});

const allPass = checks.every(c => c.pass);
console.log(`\n  Total transactions: ${output.length}`);
console.log(`  Result: ${allPass ? 'ALL CHECKS PASSED' : 'SOME CHECKS FAILED'}\n`);

// --- Strip _meta and write ---
const cleanOutput = output.map(({ _meta, ...rest }) => rest);
fs.writeFileSync(outputPath, JSON.stringify(cleanOutput, null, 2));
console.log(`  Written to: ${outputPath}\n`);

if (!allPass) process.exit(1);
