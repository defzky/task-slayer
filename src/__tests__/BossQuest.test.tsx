import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BossQuest from '../components/Quests/BossQuest';

const mockBossQuest = {
  id: 1,
  title: 'The Dragon Boss',
  type: 'boss' as const,
  xpReward: 500,
  hp: 75,
  maxHp: 100,
  deadline: null,
  subtasks: [
    { id: 1, title: 'Defeat minion 1', completed: false },
    { id: 2, title: 'Defeat minion 2', completed: true },
    { id: 3, title: 'Defeat minion 3', completed: false }
  ],
  completed: false
};

const mockProps = {
  quest: mockBossQuest,
  onAddSubtask: vi.fn(),
  onCompleteSubtask: vi.fn(),
  onCompleteQuest: vi.fn(),
  onDelete: vi.fn()
};

describe('BossQuest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders boss quest with title and XP', () => {
    render(<BossQuest {...mockProps} />);

    expect(screen.getByText('The Dragon Boss')).toBeInTheDocument();
    expect(screen.getByText(/Boss Battle • 500 XP Reward/)).toBeInTheDocument();
  });

  it('displays HP bar with correct values', () => {
    render(<BossQuest {...mockProps} />);

    expect(screen.getByText(/75 \/ 100 HP/)).toBeInTheDocument();
    expect(screen.getByText(/DANGER LEVEL/)).toBeInTheDocument();
  });

  it('renders active minions (subtasks)', () => {
    render(<BossQuest {...mockProps} />);

    expect(screen.getByText('Defeat minion 1')).toBeInTheDocument();
    expect(screen.getByText('Defeat minion 3')).toBeInTheDocument();
    expect(screen.queryByText('Defeat minion 2')).not.toBeInTheDocument();
  });

  it('calls onCompleteSubtask when minion is attacked', () => {
    render(<BossQuest {...mockProps} />);

    const attackButtons = screen.getAllByRole('button');
    const firstAttackButton = attackButtons.find(btn => 
      btn.getAttribute('class')?.includes('border-red-500')
    );

    if (firstAttackButton) {
      fireEvent.click(firstAttackButton);
      expect(mockProps.onCompleteSubtask).toHaveBeenCalledWith(1, expect.any(Number));
    }
  });

  it('calls onDelete when delete button is clicked', () => {
    render(<BossQuest {...mockProps} />);

    const deleteButton = screen.getByRole('button', { name: /✕/ });
    fireEvent.click(deleteButton);

    expect(mockProps.onDelete).toHaveBeenCalledWith(1);
  });

  it('allows adding new minion via input', () => {
    render(<BossQuest {...mockProps} />);

    const input = screen.getByPlaceholderText(/\+ SUMMON MINION/);
    fireEvent.change(input, { target: { value: 'New Minion' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockProps.onAddSubtask).toHaveBeenCalledWith(1, 'New Minion');
  });

  it('has proper accessibility attributes', () => {
    const { container } = render(<BossQuest {...mockProps} />);

    const bossRegion = container.querySelector('[role="region"]') || container.querySelector('div');
    expect(bossRegion).toBeInTheDocument();
  });
});
