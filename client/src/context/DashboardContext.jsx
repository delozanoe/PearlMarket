import { createContext, useContext, useReducer } from 'react';

const initialState = {
  selectedTransactionId: null,
  toasts: [],
  optimisticUpdates: {},
};

function dashboardReducer(state, action) {
  switch (action.type) {
    case 'SELECT_TRANSACTION':
      return { ...state, selectedTransactionId: action.payload };
    case 'ADD_TOAST': {
      const toast = {
        id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ...action.payload,
      };
      return { ...state, toasts: [...state.toasts, toast] };
    }
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.payload) };
    case 'OPTIMISTIC_UPDATE': {
      const { txId, status } = action.payload;
      return { ...state, optimisticUpdates: { ...state.optimisticUpdates, [txId]: { status } } };
    }
    case 'ROLLBACK_UPDATE': {
      const { [action.payload]: _, ...remaining } = state.optimisticUpdates;
      return { ...state, optimisticUpdates: remaining };
    }
    case 'CONFIRM_UPDATE': {
      const { [action.payload]: _, ...remaining } = state.optimisticUpdates;
      return { ...state, optimisticUpdates: remaining };
    }
    default:
      return state;
  }
}

export const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);
  const actions = {
    selectTransaction: (id) => dispatch({ type: 'SELECT_TRANSACTION', payload: id }),
    addToast: (toast) => dispatch({ type: 'ADD_TOAST', payload: toast }),
    removeToast: (id) => dispatch({ type: 'REMOVE_TOAST', payload: id }),
    optimisticUpdate: (txId, status) => dispatch({ type: 'OPTIMISTIC_UPDATE', payload: { txId, status } }),
    rollbackUpdate: (txId) => dispatch({ type: 'ROLLBACK_UPDATE', payload: txId }),
    confirmUpdate: (txId) => dispatch({ type: 'CONFIRM_UPDATE', payload: txId }),
  };
  return (
    <DashboardContext.Provider value={{ state, ...actions }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) throw new Error('useDashboard must be used within a DashboardProvider');
  return context;
}
