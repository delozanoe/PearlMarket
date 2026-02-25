import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useDashboard } from './context/DashboardContext';
import { useFilters } from './hooks/useFilters';
import { api } from './services/api';
import Header from './components/Header';
import FilterPanel from './components/FilterPanel';
import TransactionTable from './components/TransactionTable';
import TransactionDetailPanel from './components/TransactionDetailPanel';

const PAGE_SIZE = 20;
const POLL_INTERVAL = 5000;
const TOAST_AUTO_DISMISS_MS = 5000;

function App() {
  const { state, selectTransaction, addToast, removeToast, optimisticUpdate, rollbackUpdate, confirmUpdate } = useDashboard();
  const { filters, setFilter, clearFilters } = useFilters();

  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchRef = useRef(null);

  // Store latest fetch function in ref so polling doesn't reset on filter/page changes
  const fetchTransactions = useCallback(async () => {
    try {
      const params = {
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      };
      if (filters.risk_level) params.risk_level = filters.risk_level;
      if (filters.status) params.status = filters.status;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;

      const data = await api.getTransactions(params);
      setTransactions(data.transactions);
      setTotal(data.total);
      setError(null);
    } catch (err) {
      setError('Failed to load transactions');
      addToast({ message: 'Failed to load transactions', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, filters, addToast]);

  fetchRef.current = fetchTransactions;

  // Initial load + re-fetch on filter/page change
  useEffect(() => {
    setLoading(true);
    fetchTransactions();
  }, [fetchTransactions]);

  // Poll for new transactions - uses ref to avoid resetting interval on filter changes
  useEffect(() => {
    const id = setInterval(() => fetchRef.current?.(), POLL_INTERVAL);
    return () => clearInterval(id);
  }, []);

  // Auto-dismiss toasts after 5 seconds
  useEffect(() => {
    if (state.toasts.length === 0) return;
    const timers = state.toasts.map((toast) =>
      setTimeout(() => removeToast(toast.id), TOAST_AUTO_DISMISS_MS),
    );
    return () => timers.forEach(clearTimeout);
  }, [state.toasts, removeToast]);

  const handleStatusChange = useCallback(async (txId, newStatus) => {
    // Capture previous status for proper rollback
    const prevTx = transactions.find((tx) => tx.id === txId);
    const prevStatus = prevTx?.status || 'PENDING';

    optimisticUpdate(txId, newStatus);
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === txId ? { ...tx, status: newStatus } : tx)),
    );

    try {
      await api.updateTransactionStatus(txId, newStatus);
      confirmUpdate(txId);
      addToast({
        message: `Transaction ${newStatus.toLowerCase()} successfully`,
        type: 'success',
      });
      fetchRef.current?.();
    } catch (err) {
      rollbackUpdate(txId);
      setTransactions((prev) =>
        prev.map((tx) => (tx.id === txId ? { ...tx, status: prevStatus } : tx)),
      );
      const message = err.status === 409
        ? 'Transaction already actioned'
        : 'Failed to update transaction';
      addToast({ message, type: 'error' });
    }
  }, [transactions, optimisticUpdate, confirmUpdate, rollbackUpdate, addToast]);

  const handleFilterChange = useCallback((key, value) => {
    // Toggle off if clicking the active filter
    setFilter(key, filters[key] === value ? null : value);
    setPage(1);
  }, [setFilter, filters]);

  const handleClearFilters = useCallback(() => {
    clearFilters();
    setPage(1);
  }, [clearFilters]);

  // Memoize display transactions to avoid unnecessary re-renders
  const displayTransactions = useMemo(
    () => transactions.map((tx) => {
      const update = state.optimisticUpdates[tx.id];
      return update ? { ...tx, status: update.status } : tx;
    }),
    [transactions, state.optimisticUpdates],
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900">
      {/* Header with stats */}
      <Header />

      {/* Main content area */}
      <main className="flex flex-1 overflow-hidden">
        {/* Filters sidebar */}
        <aside className="w-60 shrink-0 border-r border-gray-200 bg-white p-4 overflow-y-auto">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Filters
          </h2>
          <FilterPanel
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            activeFilters={filters}
          />
        </aside>

        {/* Transaction table */}
        <section className="flex-1 overflow-y-auto p-4">
          {loading && transactions.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              Loading transactions...
            </div>
          ) : error && transactions.length === 0 ? (
            <div className="flex items-center justify-center h-full text-red-500">
              {error}
            </div>
          ) : (
            <TransactionTable
              transactions={displayTransactions}
              total={total}
              page={page}
              pageSize={PAGE_SIZE}
              onSelectTransaction={selectTransaction}
              onStatusChange={handleStatusChange}
              onPageChange={setPage}
            />
          )}
        </section>

        {/* Detail panel */}
        {state.selectedTransactionId && (
          <aside className="w-[420px] shrink-0 border-l border-gray-200 bg-white p-4 overflow-y-auto">
            <TransactionDetailPanel
              transactionId={state.selectedTransactionId}
              onStatusChange={handleStatusChange}
              onClose={() => selectTransaction(null)}
            />
          </aside>
        )}
      </main>

      {/* Toast container */}
      {state.toasts.length > 0 && (
        <div
          className="fixed bottom-4 right-4 flex flex-col gap-2 z-50"
          role="status"
          aria-live="polite"
        >
          {state.toasts.map((toast) => (
            <div
              key={toast.id}
              className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center gap-3 ${
                toast.type === 'error'
                  ? 'bg-red-600 text-white'
                  : 'bg-green-600 text-white'
              }`}
            >
              <span>{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-white/70 hover:text-white"
                aria-label="Dismiss notification"
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
