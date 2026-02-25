import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderWithProviders } from './helpers/renderWithProviders';
import TransactionTable from '../components/TransactionTable';
import { makeTransaction } from '../services/mockData';

describe('TransactionTable', () => {
  const mockOnSelect = vi.fn();
  const mockOnStatusChange = vi.fn();

  const transactions = [
    makeTransaction({
      id: 'tx-001',
      fraud_score: 85,
      risk_level: 'HIGH',
      status: 'PENDING',
      amount: 1299.99,
      currency: 'USD',
      customer_email: 'suspicious@example.com',
      product_category: 'Electronics',
      created_at: '2026-02-25T10:00:00.000Z',
    }),
    makeTransaction({
      id: 'tx-002',
      fraud_score: 15,
      risk_level: 'LOW',
      status: 'APPROVED',
      amount: 29.99,
      currency: 'USD',
      customer_email: 'legit@example.com',
      product_category: 'Fashion',
      created_at: '2026-02-25T09:00:00.000Z',
    }),
    makeTransaction({
      id: 'tx-003',
      fraud_score: 45,
      risk_level: 'MEDIUM',
      status: 'BLOCKED',
      amount: 500,
      currency: 'IDR',
      customer_email: 'moderate@example.com',
      product_category: 'Gift Cards',
      created_at: '2026-02-25T08:00:00.000Z',
    }),
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders table column headers', () => {
    renderWithProviders(
      <TransactionTable
        transactions={transactions}
        total={3}
        onSelectTransaction={mockOnSelect}
        onStatusChange={mockOnStatusChange}
      />,
    );
    expect(screen.getByText('Timestamp')).toBeInTheDocument();
    expect(screen.getByText('Customer')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Fraud Score')).toBeInTheDocument();
    expect(screen.getByText('Risk Level')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('renders transaction rows', () => {
    renderWithProviders(
      <TransactionTable
        transactions={transactions}
        total={3}
        onSelectTransaction={mockOnSelect}
        onStatusChange={mockOnStatusChange}
      />,
    );
    expect(screen.getByText('suspicious@example.com')).toBeInTheDocument();
    expect(screen.getByText('legit@example.com')).toBeInTheDocument();
    expect(screen.getByText('moderate@example.com')).toBeInTheDocument();
  });

  it('displays amount with currency', () => {
    renderWithProviders(
      <TransactionTable
        transactions={transactions}
        total={3}
        onSelectTransaction={mockOnSelect}
        onStatusChange={mockOnStatusChange}
      />,
    );
    expect(screen.getByText(/\$1,299\.99\s*USD/)).toBeInTheDocument();
  });

  it('displays fraud score with color coding', () => {
    renderWithProviders(
      <TransactionTable
        transactions={transactions}
        total={3}
        onSelectTransaction={mockOnSelect}
        onStatusChange={mockOnStatusChange}
      />,
    );
    const highScore = screen.getByText('85');
    expect(highScore.closest('[data-testid="fraud-score"]').className).toMatch(/risk-high|red/);
  });

  it('displays risk level badges', () => {
    renderWithProviders(
      <TransactionTable
        transactions={transactions}
        total={3}
        onSelectTransaction={mockOnSelect}
        onStatusChange={mockOnStatusChange}
      />,
    );
    expect(screen.getByText('HIGH')).toBeInTheDocument();
    expect(screen.getByText('LOW')).toBeInTheDocument();
    expect(screen.getByText('MEDIUM')).toBeInTheDocument();
  });

  it('displays status badges', () => {
    renderWithProviders(
      <TransactionTable
        transactions={transactions}
        total={3}
        onSelectTransaction={mockOnSelect}
        onStatusChange={mockOnStatusChange}
      />,
    );
    expect(screen.getByText('PENDING')).toBeInTheDocument();
    expect(screen.getByText('APPROVED')).toBeInTheDocument();
    expect(screen.getByText('BLOCKED')).toBeInTheDocument();
  });

  it('shows action buttons only for PENDING transactions', () => {
    renderWithProviders(
      <TransactionTable
        transactions={transactions}
        total={3}
        onSelectTransaction={mockOnSelect}
        onStatusChange={mockOnStatusChange}
      />,
    );
    const rows = screen.getAllByTestId('transaction-row');
    const pendingRow = rows[0]; // tx-001 is PENDING
    const approvedRow = rows[1]; // tx-002 is APPROVED

    expect(within(pendingRow).getByTitle('Approve')).toBeInTheDocument();
    expect(within(pendingRow).getByTitle('Block')).toBeInTheDocument();
    expect(within(approvedRow).queryByTitle('Approve')).not.toBeInTheDocument();
  });

  it('calls onSelectTransaction when a row is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <TransactionTable
        transactions={transactions}
        total={3}
        onSelectTransaction={mockOnSelect}
        onStatusChange={mockOnStatusChange}
      />,
    );
    const rows = screen.getAllByTestId('transaction-row');
    await user.click(rows[0]);
    expect(mockOnSelect).toHaveBeenCalledWith('tx-001');
  });

  it('highlights HIGH risk PENDING rows', () => {
    renderWithProviders(
      <TransactionTable
        transactions={transactions}
        total={3}
        onSelectTransaction={mockOnSelect}
        onStatusChange={mockOnStatusChange}
      />,
    );
    const rows = screen.getAllByTestId('transaction-row');
    // tx-001 is HIGH + PENDING
    expect(rows[0].className).toMatch(/red-50|bg-red/);
  });

  it('shows empty state when no transactions', () => {
    renderWithProviders(
      <TransactionTable
        transactions={[]}
        total={0}
        onSelectTransaction={mockOnSelect}
        onStatusChange={mockOnStatusChange}
      />,
    );
    expect(screen.getByText(/no transactions/i)).toBeInTheDocument();
  });

  it('renders pagination controls', () => {
    const manyTx = Array.from({ length: 25 }, (_, i) =>
      makeTransaction({ id: `tx-${i}`, status: 'PENDING' }),
    );
    renderWithProviders(
      <TransactionTable
        transactions={manyTx.slice(0, 20)}
        total={25}
        page={1}
        pageSize={20}
        onSelectTransaction={mockOnSelect}
        onStatusChange={mockOnStatusChange}
        onPageChange={() => {}}
      />,
    );
    expect(screen.getByText(/1.*of.*2/i)).toBeInTheDocument();
  });

  it('calls onStatusChange when approve button clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <TransactionTable
        transactions={transactions}
        total={3}
        onSelectTransaction={mockOnSelect}
        onStatusChange={mockOnStatusChange}
      />,
    );
    const rows = screen.getAllByTestId('transaction-row');
    await user.click(within(rows[0]).getByTitle('Approve'));
    expect(mockOnStatusChange).toHaveBeenCalledWith('tx-001', 'APPROVED');
  });
});
