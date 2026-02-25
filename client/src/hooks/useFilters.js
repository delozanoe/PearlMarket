import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

const FILTER_KEYS = ['risk_level', 'status', 'from', 'to'];

export function useFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => {
    const result = {};
    for (const key of FILTER_KEYS) {
      result[key] = searchParams.get(key) || null;
    }
    return result;
  }, [searchParams]);

  const setFilter = useCallback(
    (key, value) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value === null || value === undefined || value === '') {
          next.delete(key);
        } else {
          next.set(key, value);
        }
        return next;
      });
    },
    [setSearchParams],
  );

  const clearFilters = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const key of FILTER_KEYS) {
        next.delete(key);
      }
      return next;
    });
  }, [setSearchParams]);

  return { filters, setFilter, clearFilters };
}
