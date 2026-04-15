import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QuestTabs from '../components/Quests/QuestTabs';

const mockProps = {
  activeTab: 'active' as const,
  onTabChange: vi.fn(),
  completedCount: 5,
  failedCount: 2
};

describe('QuestTabs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all three tabs', () => {
    render(<QuestTabs {...mockProps} />);

    expect(screen.getByRole('button', { name: /⚔️ Active/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /🏆 Completed/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /💀 Failed/ })).toBeInTheDocument();
  });

  it('displays correct counts on tabs', () => {
    render(<QuestTabs {...mockProps} />);

    expect(screen.getByRole('button', { name: /Completed \(5\)/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Failed \(2\)/ })).toBeInTheDocument();
  });

  it('calls onTabChange when tab is clicked', () => {
    render(<QuestTabs {...mockProps} />);

    const completedTab = screen.getByRole('button', { name: /🏆 Completed/ });
    fireEvent.click(completedTab);

    expect(mockProps.onTabChange).toHaveBeenCalledWith('completed');
  });

  it('shows active state for current tab', () => {
    render(<QuestTabs {...mockProps} />);

    const activeTab = screen.getByRole('button', { name: /⚔️ Active/ });
    expect(activeTab).toHaveClass('bg-[#d4af37]');
  });

  it('shows inactive state for other tabs', () => {
    render(<QuestTabs {...mockProps} />);

    const completedTab = screen.getByRole('button', { name: /🏆 Completed/ });
    expect(completedTab).toHaveClass('bg-[#1e1e1e]');
  });
});
