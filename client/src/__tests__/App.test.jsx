import { screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderWithProviders } from './helpers/renderWithProviders';
import App from '../App';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    getStats: vi.fn(),
    getTransactions: vi.fn(),
    getTransaction: vi.fn(),
    updateTransactionStatus: vi.fn(),
  },
}));

const mockStats = {
  total_transactions: 10,
  pending: 4,
  approved: 3,
  blocked: 3,
  avg_fraud_score: 45,
  high_risk_count: 3,
  medium_risk_count: 4,
  low_risk_count: 3,
};

const mockTransactionsResponse = {
  transactions: [
    {
      id: 'tx-001',
      amount: 1299.99,
      currency: 'USD',
      customer_email: 'test@example.com',
      billing_country: 'ID',
      shipping_country: 'SG',
      ip_country: 'VN',
      product_category: 'Electronics',
      fraud_score: 72,
      risk_level: 'HIGH',
      status: 'PENDING',
      score_breakdown: [],
      created_at: '2026-02-25T10:00:00.000Z',
    },
  ],
  total: 1,
  limit: 20,
  offset: 0,
};

describe('App', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    api.getStats.mockResolvedValue(mockStats);
    api.getTransactions.mockResolvedValue(mockTransactionsResponse);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders the dashboard layout', async () => {
    renderWithProviders(<App />);
    expect(screen.getByText('PearlMarket Fraud Monitor')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  it('renders the sidebar with filters', async () => {
    renderWithProviders(<App />);
    expect(screen.getByText('Risk Level')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('loads transactions on mount', async () => {
    renderWithProviders(<App />);
    await waitFor(() => {
      expect(api.getTransactions).toHaveBeenCalled();
    });
  });

  it('loads stats on mount', async () => {
    renderWithProviders(<App />);
    await waitFor(() => {
      expect(api.getStats).toHaveBeenCalled();
    });
  });

  it('displays toast notifications', async () => {
    api.getTransactions.mockRejectedValueOnce(new Error('Network error'));
    renderWithProviders(<App />);
    await waitFor(() => {
      expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
    });
  });
});
