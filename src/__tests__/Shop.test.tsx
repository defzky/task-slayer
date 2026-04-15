import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Shop from '../components/Shop';

const mockProfile = {
  level: 1,
  xp: 0,
  maxXp: 100,
  gold: 100,
  userClass: 'Novice',
  skillPoints: 0,
  unlockedSkills: [],
  stats: {
    questsCompleted: 0,
    bossesDefeated: 0,
    totalGoldEarned: 100,
    notesCreated: 0,
    itemsBought: 0
  },
  unlockedAchievements: []
};

const mockProps = {
  profile: mockProfile,
  updateProfile: vi.fn(),
  setTheme: vi.fn(),
  setAvatar: vi.fn(),
  setConfetti: vi.fn(),
  soundEnabled: true,
  inventory: [],
  updateInventory: vi.fn(),
  setActiveRaid: vi.fn(),
  setActiveTab: vi.fn(),
  currentTheme: 'default',
  currentAvatar: '🧙‍♂️',
  currentConfetti: 'default'
};

describe('Shop Component', () => {
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

  it('renders shop component without crashing', async () => {
    const { container } = render(<Shop {...mockProps} />);

    await waitFor(() => {
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  it('displays gold amount', async () => {
    render(<Shop {...mockProps} />);

    await waitFor(() => {
      const goldElements = screen.getAllByText(/\d+\s*G/);
      expect(goldElements.length).toBeGreaterThan(0);
    });
  });

  it('has buttons for purchasing items', async () => {
    render(<Shop {...mockProps} />);

    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(5);
    });
  });

  it('has heading elements', async () => {
    render(<Shop {...mockProps} />);

    await waitFor(() => {
      const headings = screen.queryAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });
  });
});
