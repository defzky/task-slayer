import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QuestList from '../components/Quests/QuestList';

const mockQuests = [
  {
    id: 1,
    title: 'Active Quest 1',
    type: 'normal' as const,
    xpReward: 50,
    hp: 0,
    maxHp: 0,
    deadline: null,
    subtasks: [],
    completed: false
  },
  {
    id: 2,
    title: 'Completed Quest',
    type: 'normal' as const,
    xpReward: 30,
    hp: 0,
    maxHp: 0,
    deadline: null,
    subtasks: [],
    completed: true
  },
  {
    id: 3,
    title: 'Failed Quest',
    type: 'normal' as const,
    xpReward: 40,
    hp: 0,
    maxHp: 0,
    deadline: new Date('2020-01-01').toISOString(),
    subtasks: [],
    completed: false
  }
];

const mockProps = {
  quests: mockQuests,
  activeTab: 'active' as const,
  onComplete: vi.fn(),
  onDelete: vi.fn(),
  onEdit: vi.fn(),
  onAddSubtask: vi.fn(),
  onCompleteSubtask: vi.fn()
};

describe('QuestList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders active quests on active tab', () => {
    render(<QuestList {...mockProps} />);

    expect(screen.getByText('Active Quest 1')).toBeInTheDocument();
  });

  it('shows empty state when no active quests', () => {
    render(<QuestList {...mockProps} quests={[]} />);

    expect(screen.getByText(/The Quest Board is empty/)).toBeInTheDocument();
    expect(screen.getByText(/The realm is safe/)).toBeInTheDocument();
  });

  it('renders completed quests on completed tab', () => {
    render(<QuestList {...mockProps} activeTab="completed" />);

    expect(screen.getByText('Completed Quest')).toBeInTheDocument();
    expect(screen.getByText(/Completed • \+30 XP/)).toBeInTheDocument();
  });

  it('shows empty state when no completed quests', () => {
    render(<QuestList {...mockProps} activeTab="completed" quests={[]} />);

    expect(screen.getByText(/No victories yet/)).toBeInTheDocument();
  });

  it('renders failed quests on failed tab', () => {
    render(<QuestList {...mockProps} activeTab="failed" />);

    expect(screen.getByText('Failed Quest')).toBeInTheDocument();
    expect(screen.getByText(/FAILED/)).toBeInTheDocument();
    expect(screen.getByText(/Expired:/)).toBeInTheDocument();
  });

  it('shows empty state when no failed quests', () => {
    render(<QuestList {...mockProps} activeTab="failed" quests={[]} />);

    expect(screen.getByText(/Great job! No overdue quests/)).toBeInTheDocument();
  });

  it('calls onComplete for completed tab quest delete', () => {
    render(<QuestList {...mockProps} activeTab="completed" />);

    const deleteButton = screen.getByRole('button', { name: /✕/ });
    fireEvent.click(deleteButton);

    expect(mockProps.onDelete).toHaveBeenCalledWith(2);
  });

  it('calls onComplete for late finish on failed quest', () => {
    render(<QuestList {...mockProps} activeTab="failed" />);

    const lateFinishButton = screen.getByRole('button', { name: /Late Finish/ });
    fireEvent.click(lateFinishButton);

    expect(mockProps.onComplete).toHaveBeenCalledWith(3);
  });

  it('calls onDelete for dismiss on failed quest', () => {
    render(<QuestList {...mockProps} activeTab="failed" />);

    const dismissButton = screen.getByRole('button', { name: /Dismiss/ });
    fireEvent.click(dismissButton);

    expect(mockProps.onDelete).toHaveBeenCalledWith(3);
  });
});
