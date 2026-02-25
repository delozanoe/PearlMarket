import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderWithProviders } from './helpers/renderWithProviders';
import FilterPanel from '../components/FilterPanel';

describe('FilterPanel', () => {
  const mockOnFilterChange = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders filter section headings', () => {
    renderWithProviders(<FilterPanel onFilterChange={mockOnFilterChange} />);
    expect(screen.getByText('Risk Level')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Time Range')).toBeInTheDocument();
  });

  it('renders risk level filter options', () => {
    renderWithProviders(<FilterPanel onFilterChange={mockOnFilterChange} />);
    expect(screen.getByRole('button', { name: /low/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /medium/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /high/i })).toBeInTheDocument();
  });

  it('renders status filter options', () => {
    renderWithProviders(<FilterPanel onFilterChange={mockOnFilterChange} />);
    expect(screen.getByRole('button', { name: /pending/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /approved/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /blocked/i })).toBeInTheDocument();
  });

  it('calls onFilterChange when a risk level is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FilterPanel onFilterChange={mockOnFilterChange} />);
    await user.click(screen.getByRole('button', { name: /high/i }));
    expect(mockOnFilterChange).toHaveBeenCalledWith('risk_level', 'HIGH');
  });

  it('calls onFilterChange when a status is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FilterPanel onFilterChange={mockOnFilterChange} />);
    await user.click(screen.getByRole('button', { name: /pending/i }));
    expect(mockOnFilterChange).toHaveBeenCalledWith('status', 'PENDING');
  });

  it('highlights active filter values', () => {
    renderWithProviders(
      <FilterPanel
        onFilterChange={mockOnFilterChange}
        activeFilters={{ risk_level: 'HIGH', status: null }}
      />,
    );
    const highBtn = screen.getByRole('button', { name: /high/i });
    expect(highBtn.className).toMatch(/bg-risk-high|border-risk-high|font-bold|ring/);
  });

  it('renders date inputs for time range', () => {
    renderWithProviders(<FilterPanel onFilterChange={mockOnFilterChange} />);
    expect(screen.getByLabelText(/from/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/to/i)).toBeInTheDocument();
  });

  it('calls onFilterChange when date changes', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FilterPanel onFilterChange={mockOnFilterChange} />);
    const fromInput = screen.getByLabelText(/from/i);
    await user.clear(fromInput);
    await user.type(fromInput, '2026-02-20');
    expect(mockOnFilterChange).toHaveBeenCalledWith('from', expect.any(String));
  });

  it('has a clear filters button', async () => {
    const mockClear = vi.fn();
    renderWithProviders(
      <FilterPanel
        onFilterChange={mockOnFilterChange}
        onClearFilters={mockClear}
        activeFilters={{ risk_level: 'HIGH' }}
      />,
    );
    const clearBtn = screen.getByRole('button', { name: /clear/i });
    const user = userEvent.setup();
    await user.click(clearBtn);
    expect(mockClear).toHaveBeenCalled();
  });
});
