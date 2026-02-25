import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DashboardProvider } from '../../context/DashboardContext';

export function renderWithProviders(ui, { route = '/', ...options } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <DashboardProvider>{ui}</DashboardProvider>
    </MemoryRouter>,
    options,
  );
}
