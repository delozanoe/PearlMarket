import { RISK_COLORS, STATUS_COLORS } from '../constants/colors';

function formatAmount(amount, currency) {
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `$${formatted} ${currency}`;
}

function formatTimestamp(isoString) {
  const date = new Date(isoString);
  return date.toISOString().replace('T', ' ').slice(0, 19);
}

function getFraudScoreColor(score) {
  if (score >= 71) return 'text-risk-high';
  if (score >= 31) return 'text-risk-medium';
  return 'text-risk-low';
}

export default function TransactionTable({
  transactions,
  total,
  page = 1,
  pageSize = 20,
  onSelectTransaction,
  onStatusChange,
  onPageChange,
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No transactions</p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fraud Score</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((tx) => {
              const isHighRiskPending = tx.risk_level === 'HIGH' && tx.status === 'PENDING';
              const riskColors = RISK_COLORS[tx.risk_level] || RISK_COLORS.LOW;
              const statusColors = STATUS_COLORS[tx.status] || STATUS_COLORS.PENDING;

              return (
                <tr
                  key={tx.id}
                  data-testid="transaction-row"
                  className={`cursor-pointer hover:bg-gray-50 ${isHighRiskPending ? 'bg-red-50' : ''}`}
                  onClick={() => onSelectTransaction(tx.id)}
                >
                  <td className="px-4 py-3 whitespace-nowrap font-mono text-sm text-gray-700">
                    {formatTimestamp(tx.created_at)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {tx.customer_email}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatAmount(tx.amount, tx.currency)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {tx.product_category}
                  </td>
                  <td
                    className={`px-4 py-3 whitespace-nowrap text-sm font-semibold ${getFraudScoreColor(tx.fraud_score)}`}
                    data-testid="fraud-score"
                  >
                    {tx.fraud_score}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${riskColors.bg} ${riskColors.text} ${riskColors.border}`}
                    >
                      {tx.risk_level}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors.bg} ${statusColors.text} ${statusColors.border}`}
                    >
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {tx.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button
                          title="Approve"
                          className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800 hover:bg-green-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(tx.id, 'APPROVED');
                          }}
                        >
                          Approve
                        </button>
                        <button
                          title="Block"
                          className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800 hover:bg-red-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(tx.id, 'BLOCKED');
                          }}
                        >
                          Block
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
          <button
            className="px-3 py-1 text-sm font-medium rounded bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={page <= 1}
            onClick={() => onPageChange?.(page - 1)}
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {page} of {totalPages}
          </span>
          <button
            className="px-3 py-1 text-sm font-medium rounded bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={page >= totalPages}
            onClick={() => onPageChange?.(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
