import { RISK_COLORS, STATUS_COLORS } from '../constants/colors';

const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH'];
const STATUSES = ['PENDING', 'APPROVED', 'BLOCKED'];

export default function FilterPanel({
  onFilterChange,
  onClearFilters,
  activeFilters = {},
}) {
  const hasActiveFilters = Object.values(activeFilters).some(Boolean);

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm space-y-5">
      {/* Risk Level */}
      <section>
        <h3 className="mb-2 text-sm font-semibold text-gray-600 uppercase tracking-wide">
          Risk Level
        </h3>
        <div className="flex flex-wrap gap-2">
          {RISK_LEVELS.map((level) => {
            const isActive = activeFilters.risk_level === level;
            const colors = RISK_COLORS[level];
            return (
              <button
                key={level}
                type="button"
                onClick={() => onFilterChange('risk_level', level)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  isActive
                    ? `${colors.bg} ${colors.text} ${colors.border} ring-2 font-bold border`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {level}
              </button>
            );
          })}
        </div>
      </section>

      {/* Status */}
      <section>
        <h3 className="mb-2 text-sm font-semibold text-gray-600 uppercase tracking-wide">
          Status
        </h3>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((status) => {
            const isActive = activeFilters.status === status;
            const colors = STATUS_COLORS[status];
            return (
              <button
                key={status}
                type="button"
                onClick={() => onFilterChange('status', status)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  isActive
                    ? `${colors.bg} ${colors.text} ${colors.border} ring-2 font-bold border`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            );
          })}
        </div>
      </section>

      {/* Time Range */}
      <section>
        <h3 className="mb-2 text-sm font-semibold text-gray-600 uppercase tracking-wide">
          Time Range
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="filter-from"
              className="mb-1 block text-xs text-gray-500"
            >
              From
            </label>
            <input
              id="filter-from"
              type="date"
              value={activeFilters.from || ''}
              onChange={(e) => onFilterChange('from', e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label
              htmlFor="filter-to"
              className="mb-1 block text-xs text-gray-500"
            >
              To
            </label>
            <input
              id="filter-to"
              type="date"
              value={activeFilters.to || ''}
              onChange={(e) => onFilterChange('to', e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>
      </section>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}
