import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { GameProvider, useGame } from '../contexts';

// Test component to access context
const TestComponent = () => {
  const { profile, inventory, quests, theme, avatar, streak } = useGame();
  return (
    <div>
      <div data-testid="level">Lvl {profile.level}</div>
      <div data-testid="xp">{profile.xp} / {profile.maxXp} XP</div>
      <div data-testid="gold">{profile.gold} G</div>
      <div data-testid="inventory-count">{inventory.length}</div>
      <div data-testid="quests-count">{quests.length}</div>
      <div data-testid="theme">{theme}</div>
      <div data-testid="avatar">{avatar}</div>
      <div data-testid="streak">{streak}</div>
    </div>
  );
};

describe('GameContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides default values on initial load', () => {
    render(
      <GameProvider>
        <TestComponent />
      </GameProvider>
    );

    expect(screen.getByTestId('level')).toHaveTextContent('Lvl 1');
    expect(screen.getByTestId('xp')).toHaveTextContent('0 / 100 XP');
    expect(screen.getByTestId('gold')).toHaveTextContent('0 G');
    expect(screen.getByTestId('inventory-count')).toHaveTextContent('0');
    expect(screen.getByTestId('quests-count')).toHaveTextContent('0');
    expect(screen.getByTestId('theme')).toHaveTextContent('default');
    expect(screen.getByTestId('avatar')).toHaveTextContent('🧙‍♂️');
  });

  it('throws error when useGame is used outside GameProvider', () => {
    // Suppress console.error for this test
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const BadComponent = () => {
      useGame();
      return null;
    };

    expect(() => render(<BadComponent />)).toThrow(
      'useGame must be used within a GameProvider'
    );

    vi.restoreAllMocks();
  });
});
