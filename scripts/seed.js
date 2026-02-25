#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

// --- CLI args ---
const args = process.argv.slice(2);
let apiUrl = 'http://localhost:3001';
let inputPath = path.join(__dirname, '..', 'test_transactions.json');

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--api' && args[i + 1]) apiUrl = args[i + 1];
  if (args[i] === '--input' && args[i + 1]) inputPath = args[i + 1];
}

async function main() {
  if (!fs.existsSync(inputPath)) {
    console.error(`File not found: ${inputPath}`);
    console.error('Run "node scripts/generate_test_data.js" first.');
    process.exit(1);
  }

  const transactions = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  console.log(`\n  Seeding ${transactions.length} transactions to ${apiUrl}`);
  console.log('  ' + '='.repeat(50));

  let success = 0;
  let failed = 0;
  const errors = [];

  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    // Strip fields the API doesn't accept (created_at is server-generated)
    const { created_at, id, fraud_score, risk_level, score_breakdown, status, updated_at, ...payload } = tx;

    try {
      const res = await fetch(`${apiUrl}/api/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        const riskIcon = data.risk_level === 'HIGH' ? '!' : data.risk_level === 'MEDIUM' ? '~' : '.';
        process.stdout.write(riskIcon);
        success++;
      } else {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        process.stdout.write('X');
        failed++;
        errors.push({ index: i, status: res.status, error: err });
      }
    } catch (err) {
      process.stdout.write('X');
      failed++;
      errors.push({ index: i, error: err.message });
    }
  }

  console.log('\n');
  console.log(`  Results: ${success} succeeded, ${failed} failed`);

  if (errors.length > 0) {
    console.log('\n  Errors:');
    errors.slice(0, 10).forEach(e => {
      console.log(`    [${e.index}] ${e.status || 'NETWORK'}: ${JSON.stringify(e.error)}`);
    });
    if (errors.length > 10) {
      console.log(`    ... and ${errors.length - 10} more`);
    }
  }

  console.log('');
  process.exit(failed > 0 ? 1 : 0);
}

main();
