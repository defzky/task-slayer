import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Quests from '../components/Quests';

// Mock parent component props
const mockProfile = {
  level: 1,
  xp: 0,
  maxXp: 100,
  gold: 0,
  userClass: 'Novice',
  skillPoints: 0,
  unlockedSkills: [],
  stats: {
    questsCompleted: 0,
    bossesDefeated: 0,
    totalGoldEarned: 0,
    notesCreated: 0,
    itemsBought: 0
  },
  unlockedAchievements: []
};

const mockUpdateProfile = vi.fn();
const mockUpdateInventory = vi.fn();

describe('Quests Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders quest board with stats', () => {
    render(
      <Quests
        profile={mockProfile}
        updateProfile={mockUpdateProfile}
        avatar="🧙‍♂️"
        confettiStyle="default"
        soundEnabled={true}
        inventory={[]}
        updateInventory={mockUpdateInventory}
      />
    );

    expect(screen.getByText(/Lvl 1 Novice/)).toBeInTheDocument();
    expect(screen.getByText(/0 \/ 100 XP/)).toBeInTheDocument();
  });

  it('displays empty quest board message', () => {
    render(
      <Quests
        profile={mockProfile}
        updateProfile={mockUpdateProfile}
        avatar="🧙‍♂️"
        confettiStyle="default"
        soundEnabled={true}
        inventory={[]}
        updateInventory={mockUpdateInventory}
      />
    );

    expect(
      screen.getByText(/The Quest Board is empty/)
    ).toBeInTheDocument();
  });

  it('can switch between quest tabs', () => {
    render(
      <Quests
        profile={mockProfile}
        updateProfile={mockUpdateProfile}
        avatar="🧙‍♂️"
        confettiStyle="default"
        soundEnabled={true}
        inventory={[]}
        updateInventory={mockUpdateInventory}
      />
    );

    const activeTab = screen.getByRole('button', { name: /⚔️ Active/ });
    const completedTab = screen.getByRole('button', {
      name: /🏆 Completed/
    });
    const failedTab = screen.getByRole('button', { name: /💀 Failed/ });

    expect(activeTab).toBeInTheDocument();
    expect(completedTab).toBeInTheDocument();
    expect(failedTab).toBeInTheDocument();
  });

  it('shows boss battle mode toggle', () => {
    render(
      <Quests
        profile={mockProfile}
        updateProfile={mockUpdateProfile}
        avatar="🧙‍♂️"
        confettiStyle="default"
        soundEnabled={true}
        inventory={[]}
        updateInventory={mockUpdateInventory}
      />
    );

    const bossToggle = screen.getByLabelText(/Normal Quest|BOSS BATTLE Mode/);
    expect(bossToggle).toBeInTheDocument();
  });
});
