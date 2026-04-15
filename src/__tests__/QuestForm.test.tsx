import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QuestForm from '../components/Quests/QuestForm';

const mockProps = {
  onAddQuest: vi.fn(),
  onEditQuest: vi.fn(),
  editingQuest: null,
  cancelEdit: vi.fn()
};

describe('QuestForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders add quest form by default', () => {
    render(<QuestForm {...mockProps} />);

    expect(screen.getByPlaceholderText(/New Quest/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add quest/ })).toBeInTheDocument();
  });

  it('shows boss toggle checkbox', () => {
    render(<QuestForm {...mockProps} />);

    const bossToggle = screen.getByRole('checkbox', { name: /Normal Quest|BOSS BATTLE Mode/ });
    expect(bossToggle).toBeInTheDocument();
  });

  it('calls onAddQuest when form is submitted', () => {
    render(<QuestForm {...mockProps} />);

    const input = screen.getByRole('textbox', { name: /Quest title/ });
    fireEvent.change(input, { target: { value: 'New Test Quest' } });

    const submitButton = screen.getByRole('button', { name: /Add quest/ });
    fireEvent.click(submitButton);

    expect(mockProps.onAddQuest).toHaveBeenCalledWith('New Test Quest', '', false);
  });

  it('shows edit mode when editingQuest is provided', () => {
    const editingQuest = {
      id: 1,
      title: 'Edit Me',
      type: 'normal' as const,
      xpReward: 50,
      hp: 0,
      maxHp: 0,
      deadline: null,
      subtasks: [],
      completed: false
    };

    render(<QuestForm {...mockProps} editingQuest={editingQuest} />);

    expect(screen.getByText(/Editing Scroll/)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Edit Me')).toBeInTheDocument();
  });

  it('calls onEditQuest when editing form is submitted', () => {
    const editingQuest = {
      id: 1,
      title: 'Edit Me',
      type: 'normal' as const,
      xpReward: 50,
      hp: 0,
      maxHp: 0,
      deadline: null,
      subtasks: [],
      completed: false
    };

    render(<QuestForm {...mockProps} editingQuest={editingQuest} />);

    const input = screen.getByDisplayValue('Edit Me');
    fireEvent.change(input, { target: { value: 'Updated Title' } });

    const submitButton = screen.getByRole('button', { name: /Save Changes/ });
    fireEvent.click(submitButton);

    expect(mockProps.onEditQuest).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Updated Title'
    }));
  });

  it('calls cancelEdit when cancel button is clicked', () => {
    const editingQuest = {
      id: 1,
      title: 'Edit Me',
      type: 'normal' as const,
      xpReward: 50,
      hp: 0,
      maxHp: 0,
      deadline: null,
      subtasks: [],
      completed: false
    };

    render(<QuestForm {...mockProps} editingQuest={editingQuest} />);

    const cancelButton = screen.getByRole('button', { name: /Cancel editing/ });
    fireEvent.click(cancelButton);

    expect(mockProps.cancelEdit).toHaveBeenCalled();
  });

  it('does not submit empty quest title', () => {
    render(<QuestForm {...mockProps} />);

    const submitButton = screen.getByRole('button', { name: /Add quest/ });
    fireEvent.click(submitButton);

    expect(mockProps.onAddQuest).not.toHaveBeenCalled();
  });

  it('toggles boss mode when checkbox is clicked', () => {
    render(<QuestForm {...mockProps} />);

    const bossToggle = screen.getByRole('checkbox');
    fireEvent.click(bossToggle);

    expect(screen.getByText(/BOSS BATTLE Mode/)).toBeInTheDocument();
  });
});
