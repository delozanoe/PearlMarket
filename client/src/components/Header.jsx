import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { STATUS_COLORS } from '../constants/colors';

const POLL_INTERVAL = 10_000;

export default function Header() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(() => {
    api.getStats().then((data) => {
      setStats(data);
      setError(null);
      setLoading(false);
    }).catch(() => {
      setError('Failed to load stats');
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    fetchStats();
    const id = setInterval(fetchStats, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchStats]);

  return (
    <header className="bg-surface border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary">PearlMarket Fraud Monitor</h1>
      </div>

      <div className="mt-3">
        {loading && (
          <div data-testid="stats-loading" className="text-muted text-sm">
            Loading stats...
          </div>
        )}

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        {stats && !loading && (
          <div className="flex items-center gap-6 text-sm">
            <StatBadge label="Total" value={stats.total_transactions} />
            <StatBadge
              label="Pending"
              value={stats.pending}
              colorClass={`${STATUS_COLORS.PENDING.bg} ${STATUS_COLORS.PENDING.text}`}
            />
            <StatBadge
              label="Approved"
              value={stats.approved}
              colorClass={`${STATUS_COLORS.APPROVED.bg} ${STATUS_COLORS.APPROVED.text}`}
            />
            <StatBadge
              label="Blocked"
              value={stats.blocked}
              colorClass={`${STATUS_COLORS.BLOCKED.bg} ${STATUS_COLORS.BLOCKED.text}`}
            />
            <StatBadge label="Avg Score" value={stats.avg_fraud_score} />
          </div>
        )}
      </div>
    </header>
  );
}

function StatBadge({ label, value, colorClass = '' }) {
  return (
    <div className={`flex flex-col items-center rounded-md px-3 py-1 ${colorClass}`}>
      <span className="font-semibold">{value}</span>
      <span className="text-xs text-muted">{label}</span>
    </div>
  );
}
