import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { RISK_COLORS } from '../constants/colors';

const SEVERITY_COLORS = {
  HIGH: 'text-risk-high bg-risk-high/10',
  MEDIUM: 'text-risk-medium bg-risk-medium/10',
  LOW: 'text-risk-low bg-risk-low/10',
};

export default function TransactionDetailPanel({ transactionId, onStatusChange, onClose }) {
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchTransaction() {
      setLoading(true);
      try {
        const data = await api.getTransaction(transactionId);
        if (!cancelled) {
          setTransaction(data);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchTransaction();

    return () => {
      cancelled = true;
    };
  }, [transactionId]);

  if (loading) {
    return (
      <div data-testid="detail-loading" className="p-6 text-muted text-sm animate-pulse">
        Loading transaction details...
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="p-6 text-red-500 text-sm">
        Failed to load transaction.
      </div>
    );
  }

  const riskColor = RISK_COLORS[transaction.risk_level] || RISK_COLORS.MEDIUM;
  const sortedBreakdown = [...(transaction.score_breakdown || [])].sort(
    (a, b) => b.score - a.score,
  );

  function handleApprove() {
    onStatusChange(transaction.id, 'APPROVED');
  }

  function handleBlockClick() {
    setShowBlockConfirm(true);
  }

  function handleBlockConfirm() {
    setShowBlockConfirm(false);
    onStatusChange(transaction.id, 'BLOCKED');
  }

  return (
    <div className="bg-surface border border-border rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <h2 className="text-lg font-semibold text-primary">Transaction Details</h2>
          <span className="text-xs text-muted">{transaction.id}</span>
        </div>
        <button
          title="Close"
          onClick={onClose}
          className="text-muted hover:text-primary transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Fraud Score */}
        <div className="flex items-center gap-4">
          <div className={`flex items-baseline gap-1 rounded-lg px-4 py-3 ${riskColor.bg} ${riskColor.border} border`}>
            <span className={`text-4xl font-bold ${riskColor.text}`}>
              {transaction.fraud_score}
            </span>
            <span className={`text-sm ${riskColor.text}`}>/ 100</span>
          </div>
          <div>
            <span className={`text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded ${riskColor.bg} ${riskColor.text}`}>
              {transaction.risk_level} risk
            </span>
          </div>
        </div>

        {/* Transaction Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <InfoRow label="Amount" value={`${transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${transaction.currency}`} />
          <InfoRow label="Customer" value={transaction.customer_email} />
          <InfoRow label="Category" value={transaction.product_category} />
          <InfoRow label="Status" value={transaction.status} />
          <InfoRow label="Billing Country" value={transaction.billing_country} />
          <InfoRow label="Shipping Country" value={transaction.shipping_country} />
          <InfoRow label="IP Country" value={transaction.ip_country} />
          <InfoRow label="Card" value={`${transaction.card_bin}...${transaction.card_last4}`} />
          <InfoRow label="IP Address" value={transaction.ip_address} />
          <InfoRow label="Account Age" value={`${transaction.account_age_days} days`} />
          <InfoRow label="Created" value={new Date(transaction.created_at).toISOString().replace('T', ' ').slice(0, 19)} />
        </div>

        {/* Score Breakdown */}
        <div>
          <h3 className="text-sm font-semibold text-primary mb-2">Score Breakdown</h3>
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-alt">
                <tr>
                  <th className="text-left px-3 py-2 text-muted font-medium">Signal</th>
                  <th className="text-left px-3 py-2 text-muted font-medium">Description</th>
                  <th className="text-right px-3 py-2 text-muted font-medium">Points</th>
                </tr>
              </thead>
              <tbody>
                {sortedBreakdown.map((item) => {
                  const severityClass = SEVERITY_COLORS[item.severity] || '';
                  return (
                    <tr
                      key={item.signal}
                      data-testid="breakdown-row"
                      className={`border-t border-border ${severityClass}`}
                    >
                      <td className="px-3 py-2 font-mono text-xs">{item.signal}</td>
                      <td className="px-3 py-2">{item.description}</td>
                      <td className="px-3 py-2 text-right font-semibold">
                        <span data-testid="breakdown-score">+{item.score}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        {transaction.status === 'PENDING' && (
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleApprove}
              className="px-4 py-2 rounded-md bg-status-approved text-white font-medium hover:opacity-90 transition-opacity"
            >
              Approve
            </button>
            <button
              onClick={handleBlockClick}
              className="px-4 py-2 rounded-md bg-status-blocked text-white font-medium hover:opacity-90 transition-opacity"
            >
              Block
            </button>
          </div>
        )}

        {/* Block Confirmation Dialog */}
        {showBlockConfirm && (
          <div className="border border-status-blocked/30 bg-status-blocked/5 rounded-lg p-4">
            <p className="text-sm font-medium text-primary mb-3">
              Are you sure you want to block this transaction?
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBlockConfirm}
                className="px-3 py-1.5 rounded-md bg-status-blocked text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowBlockConfirm(false)}
                className="px-3 py-1.5 rounded-md border border-border text-sm text-muted hover:text-primary transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <span className="text-muted text-xs">{label}</span>
      <p className="text-primary font-medium">{value}</p>
    </div>
  );
}
