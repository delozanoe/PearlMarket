# PearlMarket — Fraud Detection Prototype

Real-time fraud scoring dashboard for e-commerce transactions in the Southeast Asia (SEA) region. Analysts review incoming transactions, inspect fraud signal breakdowns, and approve or block suspicious orders.

## Architecture

```
┌──────────────────┐       HTTP/JSON       ┌──────────────────┐       ┌──────────┐
│  React + Vite    │  ◄──────────────────►  │  Express API     │  ───► │  SQLite  │
│  (port 5173)     │                        │  (port 3001)     │       │  (file)  │
│  TailwindCSS v4  │                        │  Fraud Scoring   │       └──────────┘
└──────────────────┘                        └──────────────────┘
```

- **Frontend** — React 18, Vite, TailwindCSS v4. Dashboard with filters, transaction table, detail panel, and action buttons.
- **Backend** — Express 4, `better-sqlite3`. 7 scoring signals scored on each POST, auto-approve/block thresholds, full CRUD.
- **Database** — SQLite file (`server/data/pearlmarket.db`), in-memory for tests.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 6, TailwindCSS 4, React Router 7 |
| Testing (client) | Vitest, Testing Library, jsdom |
| Backend | Node.js, Express 4 |
| Testing (server) | Jest 30, Supertest |
| Database | SQLite via better-sqlite3 |
| Monorepo | npm workspaces |

## Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9

### Install

```bash
npm install
```

### Run Development Servers

```bash
# Both servers (client:5173 + server:3001)
npm run dev

# Or individually
npm run dev:server   # http://localhost:3001
npm run dev:client   # http://localhost:5173
```

### Run Tests

```bash
# Backend tests (Jest)
npm test --workspace=server

# Frontend tests (Vitest)
npm test --workspace=client -- --run

# With coverage
npm test --workspace=server -- --coverage
npm run test:coverage --workspace=client
```

### Generate & Seed Test Data

```bash
# Generate 55 test transactions with deterministic seed
node scripts/generate_test_data.js --seed 42

# Seed into running server (start server first)
node scripts/seed.js --api http://localhost:3001
```

## API Endpoints

All endpoints are prefixed with `/api`.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/transactions` | Create transaction (triggers fraud scoring) |
| `GET` | `/api/transactions` | List transactions (supports `?risk_level`, `?status`, `?limit`, `?offset`) |
| `GET` | `/api/transactions/:id` | Get single transaction with score breakdown |
| `PATCH` | `/api/transactions/:id/status` | Update status (`APPROVED` or `BLOCKED`) |
| `GET` | `/api/stats` | Aggregated dashboard statistics |
| `GET` | `/api/settings` | Get auto-action thresholds |
| `PUT` | `/api/settings` | Update auto-action thresholds |

### Transaction Payload

```json
{
  "amount": 250.00,
  "currency": "USD",
  "customer_email": "user@example.com",
  "billing_country": "SG",
  "shipping_country": "ID",
  "ip_country": "VN",
  "ip_address": "103.28.12.1",
  "card_bin": "411111",
  "card_last4": "1234",
  "product_category": "Electronics",
  "account_age_days": 5
}
```

**Valid currencies:** `USD`, `IDR`, `VND`, `PHP`, `SGD`
**Valid categories:** `Gift Cards`, `Electronics`, `Fashion`, `Home Goods`

## Fraud Scoring Signals

Each transaction is scored by 7 independent signals. The total is capped at 100.

| Signal | Max Points | Trigger |
|--------|-----------|---------|
| `geo_mismatch` | 30 | Billing, shipping, and IP countries all differ |
| `email_velocity` | 30 | 6+ transactions from same email within 10 minutes |
| `known_pattern` | 40 | Email or card BIN has 3+ prior blocks |
| `high_risk_product` | 20 | Gift Cards (20), Electronics (15), Fashion (5) |
| `account_age` | 20 | 0 days (20), 1-7 days (15), 8-30 days (10), 31-90 days (5) |
| `amount_anomaly` | 15 | >$1500 USD (15), >$1000 (10), >$500 (5) |
| `card_bin_velocity` | 15 | 4+ transactions with same BIN within 30 minutes |

### Risk Levels

| Score | Level |
|-------|-------|
| 0–30 | LOW |
| 31–70 | MEDIUM |
| 71–100 | HIGH |

### Auto-Actions (configurable via `/api/settings`)

- Score **<= 20** → auto-approved
- Score **>= 80** → auto-blocked

## Test Data Generation

The `scripts/generate_test_data.js` script produces 55 transactions covering these fraud patterns:

| Pattern | Count | Description |
|---------|-------|-------------|
| Email velocity attack | 7 | Same email, rapid-fire within 10-min window |
| Card BIN velocity | 5 | Same BIN, within 30-min window |
| Geographic mismatch | 4 | All 3 countries different |
| High-risk + new account | 5 | Electronics/Gift Cards, account age 0-3 days |
| Card testing | 4 | Same email, micro amounts ($1-10) |
| Legitimate | 18 | Low amount, matching geo, established accounts |
| Mixed signals | 12 | 1-2 risk flags, medium risk range |

Use `--seed <number>` for reproducible output.

## Project Structure

```
PearlMarket/
├── client/                     # React frontend
│   ├── src/
│   │   ├── components/         # UI components (Header, FilterPanel, TransactionTable, etc.)
│   │   ├── context/            # DashboardContext (state management)
│   │   ├── hooks/              # useFilters
│   │   ├── services/           # api.js (HTTP client), mockData.js
│   │   ├── constants/          # colors.js (risk level color mapping)
│   │   ├── __tests__/          # Component tests (Vitest)
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── server/                     # Express backend
│   ├── src/
│   │   ├── config/             # database.js (SQLite setup + schema)
│   │   ├── middleware/         # validateTransaction.js, errorHandler.js
│   │   ├── models/             # transaction.js, blockedEntity.js, settings.js
│   │   ├── routes/             # transactions.js, stats.js, settings.js
│   │   ├── services/
│   │   │   ├── signals/        # 7 signal modules (geoMismatch, emailVelocity, etc.)
│   │   │   ├── scoringEngine.js
│   │   │   └── currencyConverter.js
│   │   ├── utils/              # errors.js
│   │   ├── __tests__/          # Unit + integration tests (Jest)
│   │   ├── app.js              # Express app factory
│   │   └── index.js            # Server entry point
│   └── package.json
├── scripts/
│   ├── generate_test_data.js   # Generate test_transactions.json
│   └── seed.js                 # Bulk-submit transactions to running server
├── test_transactions.json      # Generated test data (55 transactions)
└── package.json                # Root workspace config
```
