import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { RoleDashboardWidget } from '../RoleDashboardWidget';
import { useAuth } from '@/context/AuthContext';

// Mock the AuthContext hook
vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('RoleDashboardWidget Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('renders loading state correctly', async () => {
    // Mock user session
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 1, email: 'buyer@propintel.ai', full_name: 'Test Buyer', role: 'buyer', mobile_number: null, is_active: true },
      token: 'mock_access_token',
      loading: false,
      login: vi.fn(),
      registerUser: vi.fn(),
      loginWithOtp: vi.fn(),
      logout: vi.fn(),
      refreshSession: vi.fn(),
      error: null,
      clearError: vi.fn(),
    });

    // Mock unresolved fetch to stay in loading state
    global.fetch = vi.fn().mockImplementation(() => new Promise(() => {}));

    render(<RoleDashboardWidget />);

    expect(screen.getByText(/Configuring Role-Scoped Sandbox/i)).toBeInTheDocument();
  });

  test('renders error state on 403 access denied', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 1, email: 'buyer@propintel.ai', full_name: 'Test Buyer', role: 'buyer', mobile_number: null, is_active: true },
      token: 'mock_access_token',
      loading: false,
      login: vi.fn(),
      registerUser: vi.fn(),
      loginWithOtp: vi.fn(),
      logout: vi.fn(),
      refreshSession: vi.fn(),
      error: null,
      clearError: vi.fn(),
    });

    // Mock 403 response
    global.fetch = vi.fn().mockResolvedValue({
      status: 403,
      ok: false,
    });

    render(<RoleDashboardWidget />);

    await waitFor(() => {
      expect(screen.getByText(/Security Restriction/i)).toBeInTheDocument();
      expect(screen.getByText(/Access denied/i)).toBeInTheDocument();
    });
  });

  test('renders buyer dashboard metrics successfully', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 1, email: 'buyer@propintel.ai', full_name: 'Test Buyer', role: 'buyer', mobile_number: null, is_active: true },
      token: 'mock_access_token',
      loading: false,
      login: vi.fn(),
      registerUser: vi.fn(),
      loginWithOtp: vi.fn(),
      logout: vi.fn(),
      refreshSession: vi.fn(),
      error: null,
      clearError: vi.fn(),
    });

    const mockBuyerData = {
      role: 'buyer',
      title: 'AI Negotiation War Room',
      description: 'Predicts seller urgency, buyer pressure, and outlines negotiation tactics.',
      metrics: {
        seller_urgency: 'High (Relocating in 2 months)',
        recommended_offer: 'SGD 1,380,000',
        tactics: [
          'Highlight prompt closing capacity to leverage relocation timeline',
          'Start with low-ball offer of SGD 1.35M to anchor negotiation'
        ]
      }
    };

    // Mock successful response
    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => mockBuyerData,
    });

    render(<RoleDashboardWidget />);

    await waitFor(() => {
      expect(screen.getByText('AI Negotiation War Room')).toBeInTheDocument();
      expect(screen.getByText(/Predicts seller urgency/i)).toBeInTheDocument();
      expect(screen.getByText('Buyer Workspace')).toBeInTheDocument();
      expect(screen.getByText('High (Relocating in 2 months)')).toBeInTheDocument();
      expect(screen.getByText('SGD 1,380,000')).toBeInTheDocument();
      expect(screen.getByText(/Highlight prompt closing capacity/i)).toBeInTheDocument();
    });
  });

  test('renders seller dashboard metrics successfully', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 2, email: 'seller@propintel.ai', full_name: 'Test Seller', role: 'seller', mobile_number: null, is_active: true },
      token: 'mock_access_token',
      loading: false,
      login: vi.fn(),
      registerUser: vi.fn(),
      loginWithOtp: vi.fn(),
      logout: vi.fn(),
      refreshSession: vi.fn(),
      error: null,
      clearError: vi.fn(),
    });

    const mockSellerData = {
      role: 'seller',
      title: 'Exit Timing & Demand Analytics',
      description: 'Calculates optimal sell window and predicts demand depth for private condos.',
      metrics: {
        optimal_exit_window: 'Q4 2026',
        buyer_demand_index: '8.4/10',
        tactics: [
          'Wait till supply drop in Q4 to list for maximum premium'
        ]
      }
    };

    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => mockSellerData,
    });

    render(<RoleDashboardWidget />);

    await waitFor(() => {
      expect(screen.getByText('Exit Timing & Demand Analytics')).toBeInTheDocument();
      expect(screen.getByText('Seller Workspace')).toBeInTheDocument();
      expect(screen.getByText('Q4 2026')).toBeInTheDocument();
      expect(screen.getByText('8.4/10')).toBeInTheDocument();
      expect(screen.getByText(/Wait till supply drop/i)).toBeInTheDocument();
    });
  });
});
