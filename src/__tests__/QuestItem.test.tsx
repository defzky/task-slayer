import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import QuestItem from '../components/Quests/QuestItem';

const mockQuest = {
  id: 1,
  title: 'Test Quest',
  type: 'normal' as const,
  xpReward: 50,
  hp: 0,
  maxHp: 0,
  deadline: null,
  subtasks: [],
  completed: false
};

const mockProps = {
  quest: mockQuest,
  onComplete: vi.fn(),
  onDelete: vi.fn(),
  onEdit: vi.fn()
};

describe('QuestItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders quest with title and XP reward', () => {
    render(
      <DndContext>
        <QuestItem {...mockProps} />
      </DndContext>
    );

    expect(screen.getByText('Test Quest')).toBeInTheDocument();
    expect(screen.getByText(/Reward: 50 XP/)).toBeInTheDocument();
  });

  it('calls onComplete when check button is clicked', () => {
    render(
      <DndContext>
        <QuestItem {...mockProps} />
      </DndContext>
    );

    const completeButtons = screen.getAllByRole('button', { name: /✔/ });
    const questCompleteButton = completeButtons.find(btn =>
      btn.className?.includes('rounded-full')
    );
    if (questCompleteButton) fireEvent.click(questCompleteButton);

    expect(mockProps.onComplete).toHaveBeenCalledWith(1);
  });

  it('calls onEdit when edit button is clicked', () => {
    render(
      <DndContext>
        <QuestItem {...mockProps} />
      </DndContext>
    );

    const editButtons = screen.getAllByRole('button', { name: /✏️/ });
    const questEditButton = editButtons.find(btn =>
      btn.className?.includes('text-xs')
    );
    if (questEditButton) fireEvent.click(questEditButton);

    expect(mockProps.onEdit).toHaveBeenCalledWith(mockQuest);
  });

  it('calls onDelete when delete button is clicked', () => {
    render(
      <DndContext>
        <QuestItem {...mockProps} />
      </DndContext>
    );

    const deleteButtons = screen.getAllByRole('button', { name: /✕/ });
    const questDeleteButton = deleteButtons.find(btn =>
      btn.className?.includes('text-xs')
    );
    if (questDeleteButton) fireEvent.click(questDeleteButton);

    expect(mockProps.onDelete).toHaveBeenCalledWith(1);
  });

  it('displays deadline when provided', () => {
    const questWithDeadline = {
      ...mockQuest,
      deadline: new Date('2026-04-20T10:00:00').toISOString()
    };

    render(
      <DndContext>
        <QuestItem {...mockProps} quest={questWithDeadline} />
      </DndContext>
    );

    expect(screen.getByText(/Apr 20/)).toBeInTheDocument();
  });
});
