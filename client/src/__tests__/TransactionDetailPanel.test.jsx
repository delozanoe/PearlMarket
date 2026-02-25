import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderWithProviders } from './helpers/renderWithProviders';
import TransactionDetailPanel from '../components/TransactionDetailPanel';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    getTransaction: vi.fn(),
    updateTransactionStatus: vi.fn(),
  },
}));

const mockTransaction = {
  id: 'tx-001',
  amount: 1299.99,
  currency: 'USD',
  customer_email: 'suspicious@example.com',
  billing_country: 'ID',
  shipping_country: 'SG',
  ip_country: 'VN',
  ip_address: '203.0.113.42',
  card_bin: '411111',
  card_last4: '4242',
  product_category: 'Electronics',
  account_age_days: 2,
  fraud_score: 72,
  risk_level: 'HIGH',
  score_breakdown: [
    { signal: 'geo_mismatch', score: 30, description: 'All 3 countries differ (ID > SG > VN)', severity: 'HIGH' },
    { signal: 'high_risk_product', score: 15, description: 'Electronics purchase', severity: 'MEDIUM' },
    { signal: 'new_account', score: 15, description: 'Account is 2 days old', severity: 'MEDIUM' },
    { signal: 'amount_anomaly', score: 10, description: '$1,299.99 exceeds $1,000 threshold', severity: 'MEDIUM' },
  ],
  status: 'PENDING',
  created_at: '2026-02-25T10:00:00.000Z',
  updated_at: '2026-02-25T10:00:00.000Z',
};

describe('TransactionDetailPanel', () => {
  const mockOnStatusChange = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    api.getTransaction.mockResolvedValue(mockTransaction);
  });

  it('fetches and displays transaction details', async () => {
    renderWithProviders(
      <TransactionDetailPanel
        transactionId="tx-001"
        onStatusChange={mockOnStatusChange}
        onClose={mockOnClose}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText('suspicious@example.com')).toBeInTheDocument();
    });
    expect(screen.getByText(/1,299\.99/)).toBeInTheDocument();
    expect(screen.getByText('Electronics')).toBeInTheDocument();
  });

  it('displays the fraud score prominently', async () => {
    renderWithProviders(
      <TransactionDetailPanel
        transactionId="tx-001"
        onStatusChange={mockOnStatusChange}
        onClose={mockOnClose}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText('72')).toBeInTheDocument();
    });
    expect(screen.getByText(/\/\s*100/)).toBeInTheDocument();
  });

  it('displays score breakdown table', async () => {
    renderWithProviders(
      <TransactionDetailPanel
        transactionId="tx-001"
        onStatusChange={mockOnStatusChange}
        onClose={mockOnClose}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText(/All 3 countries differ/)).toBeInTheDocument();
    });
    expect(screen.getByText('Electronics purchase')).toBeInTheDocument();
    expect(screen.getByText(/Account is 2 days old/)).toBeInTheDocument();
    expect(screen.getByText(/exceeds.*\$1,000/)).toBeInTheDocument();
  });

  it('sorts breakdown by points descending', async () => {
    renderWithProviders(
      <TransactionDetailPanel
        transactionId="tx-001"
        onStatusChange={mockOnStatusChange}
        onClose={mockOnClose}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText(/All 3 countries differ/)).toBeInTheDocument();
    });
    const rows = screen.getAllByTestId('breakdown-row');
    const scores = rows.map((r) => r.querySelector('[data-testid="breakdown-score"]').textContent);
    const numericScores = scores.map((s) => parseInt(s.replace('+', ''), 10));
    for (let i = 1; i < numericScores.length; i++) {
      expect(numericScores[i]).toBeLessThanOrEqual(numericScores[i - 1]);
    }
  });

  it('shows Approve and Block buttons for PENDING transactions', async () => {
    renderWithProviders(
      <TransactionDetailPanel
        transactionId="tx-001"
        onStatusChange={mockOnStatusChange}
        onClose={mockOnClose}
      />,
    );
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /approve/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /block/i })).toBeInTheDocument();
  });

  it('does not show action buttons for non-PENDING transactions', async () => {
    api.getTransaction.mockResolvedValue({ ...mockTransaction, status: 'APPROVED' });
    renderWithProviders(
      <TransactionDetailPanel
        transactionId="tx-001"
        onStatusChange={mockOnStatusChange}
        onClose={mockOnClose}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText('suspicious@example.com')).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /block/i })).not.toBeInTheDocument();
  });

  it('calls onStatusChange when approve is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <TransactionDetailPanel
        transactionId="tx-001"
        onStatusChange={mockOnStatusChange}
        onClose={mockOnClose}
      />,
    );
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /approve/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /approve/i }));
    expect(mockOnStatusChange).toHaveBeenCalledWith('tx-001', 'APPROVED');
  });

  it('shows confirmation dialog before blocking', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <TransactionDetailPanel
        transactionId="tx-001"
        onStatusChange={mockOnStatusChange}
        onClose={mockOnClose}
      />,
    );
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /block/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /block/i }));
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
  });

  it('blocks transaction after confirmation', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <TransactionDetailPanel
        transactionId="tx-001"
        onStatusChange={mockOnStatusChange}
        onClose={mockOnClose}
      />,
    );
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /block/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /block/i }));
    await user.click(screen.getByRole('button', { name: /confirm/i }));
    expect(mockOnStatusChange).toHaveBeenCalledWith('tx-001', 'BLOCKED');
  });

  it('displays country information', async () => {
    renderWithProviders(
      <TransactionDetailPanel
        transactionId="tx-001"
        onStatusChange={mockOnStatusChange}
        onClose={mockOnClose}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText(/ID/)).toBeInTheDocument();
    });
  });

  it('has a close button', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <TransactionDetailPanel
        transactionId="tx-001"
        onStatusChange={mockOnStatusChange}
        onClose={mockOnClose}
      />,
    );
    await waitFor(() => {
      expect(screen.getByTitle('Close')).toBeInTheDocument();
    });
    await user.click(screen.getByTitle('Close'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows loading state while fetching', () => {
    api.getTransaction.mockReturnValue(new Promise(() => {}));
    renderWithProviders(
      <TransactionDetailPanel
        transactionId="tx-001"
        onStatusChange={mockOnStatusChange}
        onClose={mockOnClose}
      />,
    );
    expect(screen.getByTestId('detail-loading')).toBeInTheDocument();
  });
});
