import { useDashboard } from './context/DashboardContext';

function App() {
  const { state } = useDashboard();

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="shrink-0 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          <h1 className="text-xl font-bold tracking-tight">PearlMarket Fraud Dashboard</h1>
        </div>
      </header>

      {/* Main content area */}
      <main className="flex flex-1 overflow-hidden">
        {/* Filters sidebar */}
        <aside className="w-56 shrink-0 border-r border-gray-200 bg-white p-4 overflow-y-auto">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Filters</h2>
        </aside>

        {/* Transaction table */}
        <section className="flex-1 overflow-y-auto p-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Transactions</h2>
        </section>

        {/* Detail panel */}
        {state.selectedTransactionId && (
          <aside className="w-96 shrink-0 border-l border-gray-200 bg-white p-4 overflow-y-auto">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Details</h2>
          </aside>
        )}
      </main>

      {/* Toast container */}
      {state.toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
          {state.toasts.map((toast) => (
            <div key={toast.id} className="bg-gray-800 text-white px-4 py-2 rounded shadow-lg text-sm">
              {toast.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
