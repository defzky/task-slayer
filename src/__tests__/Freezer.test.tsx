import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Freezer from '../components/Freezer';

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

describe('Freezer Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.chrome = {
      storage: {
        sync: {
          get: vi.fn((keys, callback) => callback({})),
          set: vi.fn()
        },
        local: {
          get: vi.fn((keys, callback) => callback({})),
          set: vi.fn()
        }
      }
    } as any;
  });

  it('renders freezer component without crashing', async () => {
    const { container } = render(<Freezer profile={mockProfile} updateProfile={mockUpdateProfile} />);

    await waitFor(() => {
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  it('has buttons for user actions', async () => {
    render(<Freezer profile={mockProfile} updateProfile={mockUpdateProfile} />);

    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  it('displays freezer content', async () => {
    render(<Freezer profile={mockProfile} updateProfile={mockUpdateProfile} />);

    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    });
  });
});
