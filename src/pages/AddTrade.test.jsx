import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AddTrade from './AddTrade';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the API module
vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn((path) => {
      if (path.includes('/nse/search')) return Promise.resolve({ symbols: [] });
      if (path.includes('/nse/fno-symbols')) return Promise.resolve({ symbols: [] });
      if (path.includes('/profile/templates')) return Promise.resolve([]);
      if (path.includes('/trades/tags/popular')) return Promise.resolve([]);
      if (path.includes('/trades/latest')) return Promise.resolve(null);
      return Promise.resolve({});
    }),
    post: vi.fn(() => Promise.resolve({ trade: { id: 1 } })),
  }
}));

// Mock toast to avoid actual notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  }
}));

// Mock Select and Segmented components of antd
vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal();
  const React = await import('react');
  const MockSelect = React.forwardRef(({ onChange, placeholder, value, id, onSearch }, ref) => {
    return (
      <input
        ref={ref}
        id={id}
        value={value || ''}
        placeholder={placeholder}
        onChange={(e) => {
          if (onSearch) onSearch(e.target.value);
          if (onChange) onChange(e.target.value);
        }}
      />
    );
  });
  MockSelect.Option = ({ children }) => null;

  const MockSegmented = ({ options, value, onChange }) => {
    return (
      <div>
        {options.map((opt) => {
          const optValue = typeof opt === 'object' ? opt.value : opt;
          const optLabel = typeof opt === 'object' ? opt.label : opt;
          const isSelected = value === optValue;
          let className = '';
          if (isSelected) {
            if (optValue === 'yes') className = 'bg-profit';
            if (optValue === 'no') className = 'bg-loss';
          }
          return (
            <button
              key={optValue}
              type="button"
              className={className}
              onClick={() => onChange && onChange(optValue)}
            >
              {optLabel}
            </button>
          );
        })}
      </div>
    );
  };

  return {
    ...actual,
    Select: MockSelect,
    Segmented: MockSegmented,
  };
});

const navigateToStep2 = async () => {
  // Select Equity to simplify validation (no strike/expiry needed)
  fireEvent.click(screen.getByText('Equity'));
  
  const searchInput = screen.getByLabelText(/Stock \/ Scrip/i);
  fireEvent.change(searchInput, { target: { value: 'RELIANCE' } });
  
  const continueBtn = screen.getByText(/Continue →/i);
  fireEvent.click(continueBtn);
  
  expect(await screen.findByText(/Execution Pricing/i)).toBeInTheDocument();
};

const navigateToStep3 = async () => {
  await navigateToStep2();
  
  const entryPriceInput = screen.getByLabelText(/Entry Price/i);
  fireEvent.change(entryPriceInput, { target: { value: '2500' } });
  
  const lotSizeInput = screen.getByLabelText(/Lot Size/i);
  fireEvent.change(lotSizeInput, { target: { value: '1' } });
  
  const quantityInput = screen.getByLabelText(/Lots/i);
  fireEvent.change(quantityInput, { target: { value: '10' } });

  const continueBtn = screen.getByText(/Continue →/i);
  fireEvent.click(continueBtn);
  
  expect(await screen.findByText(/Trade Psychology/i)).toBeInTheDocument();
};

describe('AddTrade Bug Fixes Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('BUG-2: Plan Adherence buttons start in neutral state (not pre-selected)', async () => {
    render(
      <MemoryRouter>
        <AddTrade />
      </MemoryRouter>
    );
    
    await navigateToStep3();
    
    const followedBtn = screen.getByText(/Followed Plan/i);
    const deviatedBtn = screen.getByText(/Deviated/i);
    
    expect(followedBtn).not.toHaveClass('bg-profit');
    expect(deviatedBtn).not.toHaveClass('bg-loss');
  }, 15000);

  it('BUG-3: Validates that entry price must be greater than 0', async () => {
    render(
      <MemoryRouter>
        <AddTrade />
      </MemoryRouter>
    );

    await navigateToStep2();

    const entryPriceInput = screen.getByLabelText(/Entry Price/i);
    fireEvent.change(entryPriceInput, { target: { value: '0' } });

    fireEvent.click(screen.getByText(/Continue →/i));

    const { toast } = await import('sonner');
    expect(toast.error).toHaveBeenCalledWith('Entry price must be greater than 0');
  });

  it('BUG-4: Hides EXPIRED status for EQUITY instruments', async () => {
    render(
      <MemoryRouter>
        <AddTrade />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Equity'));

    const searchInput = screen.getByLabelText(/Stock \/ Scrip/i);
    fireEvent.change(searchInput, { target: { value: 'RELIANCE' } });
    fireEvent.click(screen.getByText(/Continue →/i));

    expect(await screen.findByText(/Execution Pricing/i)).toBeInTheDocument();
    expect(screen.queryByText(/^EXPIRED$/)).not.toBeInTheDocument();
  });

  it('BUG-1: Persists and restores psychology data from sessionStorage', async () => {
    const { unmount } = render(
      <MemoryRouter>
        <AddTrade />
      </MemoryRouter>
    );

    await navigateToStep3();

    fireEvent.click(screen.getByText(/Followed Plan/i));
    
    // Wait for debounce (1s)
    await new Promise(r => setTimeout(r, 1100));

    const savedPsych = JSON.parse(sessionStorage.getItem('add_trade_psychology'));
    expect(savedPsych.followedPlan).toBe(true);

    unmount();
    render(
      <MemoryRouter>
        <AddTrade />
      </MemoryRouter>
    );

    await navigateToStep3();
    
    const followedBtn = await screen.findByText(/Followed Plan/i);
    expect(followedBtn).toHaveClass('bg-profit');
  }, 15000);

  it('enforces lot size of 1 when EQUITY segment is selected, even if a stock has F&O lot size', async () => {
    const { api } = await import('../lib/api');
    api.get.mockImplementation((path) => {
      if (path.includes('/nse/fno-symbols')) {
        return Promise.resolve({
          symbols: [{ symbol: 'RELIANCE', lotSize: 250 }]
        });
      }
      if (path.includes('/nse/search')) {
        return Promise.resolve({
          symbols: [{ symbol: 'RELIANCE', lotSize: 250, exchange: 'NSE', quoteType: 'EQUITY' }]
        });
      }
      if (path.includes('/profile/templates')) return Promise.resolve([]);
      if (path.includes('/trades/tags/popular')) return Promise.resolve([]);
      if (path.includes('/trades/latest')) return Promise.resolve(null);
      return Promise.resolve({});
    });

    render(
      <MemoryRouter>
        <AddTrade />
      </MemoryRouter>
    );

    // Click Equity Segment
    fireEvent.click(screen.getByText('Equity'));

    // Trigger stock selection dropdown and select RELIANCE
    const searchInput = screen.getByLabelText(/Stock \/ Scrip/i);
    fireEvent.change(searchInput, { target: { value: 'RELIANCE' } });
    
    // Continue to step 2
    fireEvent.click(screen.getByText(/Continue →/i));

    expect(await screen.findByText(/Execution Pricing/i)).toBeInTheDocument();

    const lotSizeInput = screen.getByLabelText(/Lot Size/i);
    expect(lotSizeInput.value).toBe('1');
  });
});
