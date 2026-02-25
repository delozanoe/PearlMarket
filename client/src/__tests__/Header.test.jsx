import { screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderWithProviders } from './helpers/renderWithProviders';
import Header from '../components/Header';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    getStats: vi.fn(),
  },
}));

const mockStats = {
  total_transactions: 250,
  pending: 100,
  approved: 87,
  blocked: 63,
  avg_fraud_score: 42,
  high_risk_count: 38,
  medium_risk_count: 87,
  low_risk_count: 125,
};

describe('Header', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    api.getStats.mockResolvedValue(mockStats);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders the title', async () => {
    renderWithProviders(<Header />);
    expect(screen.getByText('PearlMarket Fraud Monitor')).toBeInTheDocument();
  });

  it('fetches and displays stats on mount', async () => {
    renderWithProviders(<Header />);
    await waitFor(() => {
      expect(screen.getByText('250')).toBeInTheDocument();
    });
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('87')).toBeInTheDocument();
    expect(screen.getByText('63')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('displays stat labels', async () => {
    renderWithProviders(<Header />);
    await waitFor(() => {
      expect(screen.getByText('Total')).toBeInTheDocument();
    });
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('Blocked')).toBeInTheDocument();
    expect(screen.getByText('Avg Score')).toBeInTheDocument();
  });

  it('polls stats every 10 seconds', async () => {
    renderWithProviders(<Header />);
    await waitFor(() => expect(api.getStats).toHaveBeenCalledTimes(1));

    vi.advanceTimersByTime(10000);
    await waitFor(() => expect(api.getStats).toHaveBeenCalledTimes(2));

    vi.advanceTimersByTime(10000);
    await waitFor(() => expect(api.getStats).toHaveBeenCalledTimes(3));
  });

  it('shows loading state initially', () => {
    api.getStats.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<Header />);
    expect(screen.getByText('PearlMarket Fraud Monitor')).toBeInTheDocument();
    expect(screen.getByTestId('stats-loading')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    api.getStats.mockRejectedValue(new Error('Network error'));
    renderWithProviders(<Header />);
    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
  });
});
