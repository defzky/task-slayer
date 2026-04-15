import '@testing-library/jest-dom';

// Mock Chrome API for tests
global.chrome = {
  storage: {
    sync: {
      get: () => {},
      set: () => {}
    },
    local: {
      get: () => {},
      set: () => {}
    }
  }
} as any;

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn()
}));

// Mock sound effects
vi.mock('../utils/soundfx', () => ({
  playSound: {
    levelUp: vi.fn(),
    coin: vi.fn(),
    bossHit: vi.fn(),
    bossDefeat: vi.fn()
  }
}));
