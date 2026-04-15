import React, { useState, useCallback, useMemo } from 'react';
import { useGame } from '../../contexts';
import { playSound } from '../../utils/soundfx';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: string;
  action?: 'create-quest' | 'complete-quest' | 'explore-tab';
  targetTab?: string;
  tip?: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 1,
    title: 'Welcome, Adventurer!',
    description: 'Task Slayer gamifies your productivity. Turn real tasks into quests, earn XP and gold, and level up!',
    icon: '🎮',
    tip: 'Complete the tutorial to get started!'
  },
  {
    id: 2,
    title: 'Your Adventure Board',
    description: 'This is your Quest Board. Here you can add, track, and complete your daily tasks as RPG quests.',
    icon: '⚔️',
    action: 'create-quest',
    targetTab: 'quests',
    tip: 'Try creating your first quest!'
  },
  {
    id: 3,
    title: 'Boss Battles',
    description: 'Big projects? Turn them into Boss Quests! Break them into subtasks (minions) and defeat them one by one.',
    icon: '👹',
    action: 'create-quest',
    targetTab: 'quests',
    tip: 'Toggle "BOSS BATTLE Mode" for big tasks!'
  },
  {
    id: 4,
    title: 'Level Up System',
    description: 'Complete quests to earn XP. Level up to unlock skill points and customize your character!',
    icon: '🆙',
    tip: 'Your progress bar shows XP to next level.'
  },
  {
    id: 5,
    title: 'Grimoire (Notes)',
    description: 'Keep notes, code snippets, or ideas in your Grimoire. Organized and always accessible.',
    icon: '📜',
    action: 'explore-tab',
    targetTab: 'notes',
    tip: 'Click the scroll icon to access notes.'
  },
  {
    id: 6,
    title: 'Stasis Chamber',
    description: 'Overwhelmed? Freeze tasks for later. Perfect for managing context switching.',
    icon: '❄️',
    action: 'explore-tab',
    targetTab: 'freezer',
    tip: 'Use this when you need to focus on something else.'
  },
  {
    id: 7,
    title: 'Goblin Market',
    description: 'Spend your hard-earned gold on themes, avatars, and power-ups!',
    icon: '🛒',
    action: 'explore-tab',
    targetTab: 'shop',
    tip: 'Check back often for new items!'
  },
  {
    id: 8,
    title: 'Skill Tree',
    description: 'Unlock passive bonuses like increased gold, XP boosts, and critical rewards!',
    icon: '🌌',
    action: 'explore-tab',
    targetTab: 'skills',
    tip: 'Spend skill points wisely!'
  },
  {
    id: 9,
    title: 'Daily Streaks',
    description: 'Log in daily to build your streak! Longer streaks = bigger rewards.',
    icon: '🔥',
    tip: 'Don\'t break your streak!'
  },
  {
    id: 10,
    title: "You're Ready!",
    description: 'Congratulations! You now know the basics. Go slay some tasks and become a productivity legend!',
    icon: '🎉',
    tip: 'Your first quest awaits!'
  }
];

interface OnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const { setAvatar, setTheme, profile } = useGame();

  const step = onboardingSteps[currentStep];
  const progress = ((currentStep + 1) / onboardingSteps.length) * 100;

  const handleNext = useCallback(() => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
      playSound.coin();
    } else {
      playSound.levelUp();
      onComplete();
    }
  }, [currentStep, onComplete]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    if (window.confirm('Skip tutorial? You can always view it later in Settings.')) {
      onSkip();
    }
  }, [onSkip]);

  const handleQuickStart = useCallback(() => {
    // Quick setup: set default avatar and theme
    setAvatar('🧙‍♂️');
    setTheme('default');
    playSound.levelUp();
    onComplete();
  }, [onComplete, setAvatar, setTheme]);

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="max-w-2xl w-full bg-[#1a181a] border-2 border-[#d4af37] rounded-2xl shadow-[0_0_50px_rgba(212,175,55,0.3)] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#d4af37] to-[#8a6d1f] p-4 relative">
          <div className="flex items-center justify-between">
            <h2
              id="onboarding-title"
              className="text-2xl font-bold text-black flex items-center gap-3"
            >
              <span className="text-3xl" aria-hidden="true">{step.icon}</span>
              {step.title}
            </h2>
            <button
              onClick={handleSkip}
              className="text-black/60 hover:text-black font-bold text-lg px-3 py-1 rounded hover:bg-black/10 transition-colors"
              aria-label="Skip tutorial"
            >
              Skip
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-3 h-2 bg-black/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-black/40 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={currentStep + 1}
              aria-valuemin={1}
              aria-valuemax={onboardingSteps.length}
              aria-label="Tutorial progress"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[300px] flex flex-col">
          {/* Step Indicator */}
          <div className="text-sm text-[#d4af37] font-mono mb-4">
            Step {currentStep + 1} of {onboardingSteps.length}
          </div>

          {/* Main Description */}
          <p className="text-[#e0e0e0] text-lg leading-relaxed mb-6 flex-1">
            {step.description}
          </p>

          {/* Tip Box */}
          {step.tip && (
            <div className="bg-[#2a282a] border border-[#444] rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-xl" aria-hidden="true">💡</span>
                <div>
                  <div className="text-[#d4af37] font-bold text-sm mb-1">Pro Tip:</div>
                  <div className="text-gray-400 text-sm">{step.tip}</div>
                </div>
              </div>
            </div>
          )}

          {/* Class Selection (Step 1 only) */}
          {currentStep === 0 && (
            <div className="mb-6">
              <div className="text-[#d4af37] font-bold mb-3">Choose Your Class:</div>
              <div className="grid grid-cols-3 gap-3">
                <ClassCard
                  icon="⚔️"
                  name="Code Warrior"
                  bonus="+10% XP"
                  selected={profile.userClass === 'Code Warrior'}
                  onClick={() => {}}
                />
                <ClassCard
                  icon="🧙"
                  name="Logic Wizard"
                  bonus="+5% XP & Gold"
                  selected={profile.userClass === 'Logic Wizard'}
                  onClick={() => {}}
                />
                <ClassCard
                  icon="🗡️"
                  name="Pixel Rogue"
                  bonus="+20% Gold"
                  selected={profile.userClass === 'Pixel Rogue'}
                  onClick={() => {}}
                />
              </div>
              <div className="text-gray-500 text-xs mt-2 text-center">
                (You can change this later in Settings)
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className={`px-6 py-3 rounded-lg font-bold transition-all ${
                currentStep === 0
                  ? 'bg-[#2a282a] text-gray-600 cursor-not-allowed'
                  : 'bg-[#2a282a] text-[#e0e0e0] hover:bg-[#3a383a]'
              }`}
              aria-label="Previous step"
            >
              ← Previous
            </button>

            {currentStep === 0 ? (
              <button
                onClick={handleQuickStart}
                className="px-6 py-3 bg-[#444] text-gray-400 rounded-lg font-bold hover:bg-[#555] transition-colors"
              >
                Quick Start
              </button>
            ) : null}

            <button
              onClick={handleNext}
              className="flex-1 max-w-[200px] px-6 py-3 bg-gradient-to-r from-[#d4af37] to-[#8a6d1f] text-black font-bold rounded-lg hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(212,175,55,0.3)]"
              aria-label={currentStep === onboardingSteps.length - 1 ? 'Finish tutorial' : 'Next step'}
            >
              {currentStep === onboardingSteps.length - 1 ? "Let's Go! 🚀" : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Class Card Component
interface ClassCardProps {
  icon: string;
  name: string;
  bonus: string;
  selected: boolean;
  onClick: () => void;
}

const ClassCard: React.FC<ClassCardProps> = React.memo(({ icon, name, bonus, selected, onClick }) => (
  <button
    onClick={onClick}
    className={`p-4 rounded-lg border-2 transition-all ${
      selected
        ? 'border-[#d4af37] bg-[#d4af37]/10 shadow-[0_0_15px_rgba(212,175,55,0.3)]'
        : 'border-[#444] bg-[#2a282a] hover:border-[#d4af37]/50'
    }`}
    aria-pressed={selected}
  >
    <div className="text-3xl mb-2" aria-hidden="true">{icon}</div>
    <div className="text-[#e0e0e0] font-bold text-sm mb-1">{name}</div>
    <div className="text-[#d4af37] text-xs font-mono">{bonus}</div>
  </button>
));

export default Onboarding;
