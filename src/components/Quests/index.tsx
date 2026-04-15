import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { Profile, Quest, Subtask, InventoryItem } from '../../types';
import { playSound } from '../../utils/soundfx';
import QuickDateSelector from './QuickDateSelector';
import QuestStats from './QuestStats';
import QuestForm from './QuestForm';
import QuestTabs from './QuestTabs';
import QuestList from './QuestList';

type QuestTab = 'active' | 'completed' | 'failed';

interface QuestsProps {
  profile: Profile;
  updateProfile: (profile: Profile) => void;
  avatar: string;
  confettiStyle: string;
  soundEnabled: boolean;
  inventory: InventoryItem[];
  updateInventory: (inventory: InventoryItem[]) => void;
}

const Quests: React.FC<QuestsProps> = ({
  profile,
  updateProfile,
  avatar,
  confettiStyle,
  soundEnabled,
  inventory,
  updateInventory
}) => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [activeTab, setActiveTab] = useState<QuestTab>('active');
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [streak, setStreak] = useState(0);

  // Load quests and streak on mount
  useEffect(() => {
    const loadData = (result: Record<string, unknown>) => {
      if (result.quests) setQuests(result.quests as Quest[]);

      const today = new Date().toDateString();
      const lastLogin = result.lastLoginDate as string | undefined;
      let currentStreak = (result.dailyStreak as number) || 0;

      if (lastLogin !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (lastLogin === yesterday.toDateString()) {
          currentStreak += 1;
        } else {
          currentStreak = 1;
        }

        const updates = { lastLoginDate: today, dailyStreak: currentStreak };
        if (chrome?.storage?.sync) {
          chrome.storage.sync.set(updates);
        } else if (chrome?.storage?.local) {
          chrome.storage.local.set(updates);
        } else {
          localStorage.setItem('lastLoginDate', today);
          localStorage.setItem('dailyStreak', String(currentStreak));
        }
      }
      setStreak(currentStreak);
    };

    if (chrome?.storage?.sync) {
      chrome.storage.sync.get(
        ['quests', 'dailyStreak', 'lastLoginDate'],
        (syncRes) => {
          if (Object.keys(syncRes).length > 0) {
            loadData(syncRes as Record<string, unknown>);
          } else {
            chrome.storage.local.get(
              ['quests', 'dailyStreak', 'lastLoginDate'],
              (localRes) => {
                if (Object.keys(localRes).length > 0) {
                  loadData(localRes as Record<string, unknown>);
                  chrome.storage.sync.set(localRes);
                } else {
                  loadData({});
                }
              }
            );
          }
        }
      );
    } else if (chrome?.storage?.local) {
      chrome.storage.local.get(
        ['rpgProfile', 'quests', 'dailyStreak', 'lastLoginDate'],
        (localRes) => {
          loadData(localRes as Record<string, unknown>);
        }
      );
    } else {
      const savedQuests = localStorage.getItem('quests');
      const dailyStreak = localStorage.getItem('dailyStreak')
        ? parseInt(localStorage.getItem('dailyStreak')!)
        : 0;
      const lastLoginDate = localStorage.getItem('lastLoginDate');

      loadData({
        quests: savedQuests ? JSON.parse(savedQuests) : null,
        dailyStreak,
        lastLoginDate
      });
    }
  }, []);

  const saveState = (
    newProfile: Profile | null,
    newQuests: Quest[] | null
  ) => {
    if (newProfile) updateProfile(newProfile);
    if (newQuests) setQuests(newQuests);

    const data: Record<string, unknown> = {};
    if (newQuests) data.quests = newQuests;

    if (chrome?.storage?.sync) {
      chrome.storage.sync.set(data);
    } else if (chrome?.storage?.local) {
      chrome.storage.local.set(data);
    } else {
      if (newQuests) localStorage.setItem('quests', JSON.stringify(newQuests));
    }
  };

  const addQuest = (title: string, deadline: string | null, isBoss: boolean) => {
    const newQuest: Quest = {
      id: Date.now(),
      title,
      type: isBoss ? 'boss' : 'normal',
      xpReward: isBoss ? 500 : Math.floor(Math.random() * 30) + 20,
      hp: isBoss ? 100 : 0,
      maxHp: isBoss ? 100 : 0,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      subtasks: [],
      completed: false
    };

    const updatedQuests = [newQuest, ...quests];
    setQuests(updatedQuests);
    saveState(null, updatedQuests);
  };

  const addSubtask = (questId: number, taskTitle: string) => {
    if (!taskTitle.trim()) return;
    const updatedQuests = quests.map((q) => {
      if (q.id === questId) {
        const newSubtasks: Subtask[] = [
          ...(q.subtasks || []),
          { id: Date.now(), title: taskTitle, completed: false }
        ];
        let newHp = q.hp;
        if (q.type === 'boss') {
          const total = newSubtasks.length;
          const completedCount = newSubtasks.filter((t) => t.completed).length;
          newHp = Math.floor(((total - completedCount) / total) * 100);
        }
        return {
          ...q,
          hp: newHp,
          subtasks: newSubtasks
        };
      }
      return q;
    });
    setQuests(updatedQuests);
    saveState(null, updatedQuests);
  };

  const completeSubtask = (questId: number, subtaskId: number) => {
    const quest = quests.find((q) => q.id === questId);
    if (!quest) return;

    const updatedSubtasks = quest.subtasks.map((t) =>
      t.id === subtaskId ? { ...t, completed: true } : t
    );

    let newHp = quest.hp;
    let isBossDeath = false;

    if (quest.type === 'boss') {
      const total = updatedSubtasks.length;
      const completedCount = updatedSubtasks.filter((t) => t.completed).length;
      newHp =
        total > 0 ? Math.floor(((total - completedCount) / total) * 100) : 0;

      if (soundEnabled) playSound.bossHit();

      if (newHp === 0 && !quest.completed) {
        isBossDeath = true;
      }
    }

    if (isBossDeath) {
      completeQuest(questId, true, updatedSubtasks);
    } else {
      const updatedQuests = quests.map((q) =>
        q.id === questId ? { ...q, hp: newHp, subtasks: updatedSubtasks } : q
      );
      setQuests(updatedQuests);
      saveState(null, updatedQuests);
    }
  };

  const completeQuest = (
    id: number,
    isBossKill = false,
    forcedSubtasks: Subtask[] | null = null
  ) => {
    const quest = quests.find((q) => q.id === id);
    if (!quest || quest.completed) return;

    // Visual effects
    if (isBossKill) {
      if (soundEnabled) playSound.bossDefeat();
      confetti({
        particleCount: 500,
        spread: 200,
        colors: ['#FFD700', '#FF0000']
      });
    } else {
      playSound.coin();
      let confettiColors = ['#d4af37', '#e0e0e0', '#ff0000'];
      let confettiShapes: confetti.Shape[] = ['circle', 'square'];

      if (confettiStyle === 'fire') {
        confettiColors = ['#ff0000', '#ff4500', '#ffa500'];
      } else if (confettiStyle === 'ice') {
        confettiColors = ['#00ffff', '#e0ffff', '#0000ff'];
        confettiShapes = ['circle'];
      }

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: confettiColors,
        shapes: confettiShapes
      });
    }

    // Item drop logic
    const dropChance = isBossKill ? 0.6 : 0.15;
    if (Math.random() < dropChance) {
      const items = [
        {
          id: 'potion_focus',
          name: 'Potion of Focus',
          type: 'consumable',
          description: '25m Focus Music + Blocker'
        },
        {
          id: 'scroll_reschedule',
          name: 'Scroll of Reschedule',
          type: 'consumable',
          description: 'change deadline w/o penalty'
        },
        {
          id: 'mystery_key',
          name: 'Mystery Key',
          type: 'artifact',
          description: 'Opens future dungeons',
          weight: 0.1
        }
      ];

      const roll = Math.random();
      let droppedItem = items[0];
      if (roll > 0.9) droppedItem = items[2];
      else if (roll > 0.5) droppedItem = items[1];
      else droppedItem = items[0];

      const currentInv = inventory || [];
      const existingItemIndex = currentInv.findIndex((i) => i.id === droppedItem.id);
      let newInventory: InventoryItem[];

      if (existingItemIndex >= 0) {
        newInventory = [...currentInv];
        newInventory[existingItemIndex].count += 1;
      } else {
        newInventory = [...currentInv, { ...droppedItem, count: 1 } as InventoryItem];
      }

      updateInventory(newInventory);
    }

    // Calculate rewards with class bonuses
    let xpBonusMult = 1;
    let goldBonusMult = 1;
    const userClass = profile.userClass || 'Novice';

    if (userClass === 'Code Warrior') xpBonusMult = 1.1;
    if (userClass === 'Pixel Rogue') goldBonusMult = 1.2;
    if (userClass === 'Logic Wizard') {
      xpBonusMult = 1.05;
      goldBonusMult = 1.05;
    }

    const unlockedSkills = new Set(profile.unlockedSkills || []);
    if (unlockedSkills.has('novice_looter')) goldBonusMult += 0.05;
    if (unlockedSkills.has('midas_touch')) goldBonusMult += 0.15;
    if (unlockedSkills.has('fast_learner')) xpBonusMult += 0.05;

    let isCritical = false;
    if (unlockedSkills.has('critical_mind') && Math.random() < 0.1) {
      isCritical = true;
      xpBonusMult *= 2;
      goldBonusMult *= 2;
    }

    const baseGold = isBossKill ? 100 : Math.floor(Math.random() * 15) + 5;
    const earnedGold = Math.ceil(baseGold * goldBonusMult);
    const earnedXp = Math.ceil(quest.xpReward * xpBonusMult);

    // Level up calculation
    let newXp = profile.xp + earnedXp;
    let newGold = (profile.gold || 0) + earnedGold;
    let newLevel = profile.level;
    let newMaxXp = profile.maxXp;
    let newSkillPoints = profile.skillPoints || 0;

    if (newXp >= profile.maxXp) {
      newLevel += 1;
      newSkillPoints += 1;
      newXp = newXp - profile.maxXp;
      newMaxXp = Math.floor(newMaxXp * 1.5);

      if (soundEnabled) playSound.levelUp();

      if (!isBossKill) {
        setTimeout(() => {
          confetti({
            particleCount: 200,
            spread: 120,
            origin: { y: 0.6 }
          });
        }, 500);
      }
    }

    // Update stats
    const currentStats = profile.stats || {};
    const newStats = {
      ...currentStats,
      questsCompleted: (currentStats.questsCompleted || 0) + 1,
      bossesDefeated: isBossKill
        ? (currentStats.bossesDefeated || 0) + 1
        : currentStats.bossesDefeated || 0,
      totalGoldEarned: (currentStats.totalGoldEarned || 0) + earnedGold
    };

    const updatedProfile: Profile = {
      level: newLevel,
      xp: newXp,
      maxXp: newMaxXp,
      gold: newGold,
      userClass: profile.userClass,
      skillPoints: newSkillPoints,
      unlockedSkills: profile.unlockedSkills || [],
      stats: newStats,
      unlockedAchievements: profile.unlockedAchievements || [],
      streak: profile.streak,
      lastLoginDate: profile.lastLoginDate
    };

    const updatedQuests = quests.map((q) =>
      q.id === id
        ? {
            ...q,
            completed: true,
            hp: 0,
            subtasks:
              forcedSubtasks ||
              (q.subtasks ? q.subtasks.map((t) => ({ ...t, completed: true })) : [])
          }
        : q
    );

    saveState(updatedProfile, updatedQuests);
  };

  const deleteQuest = (id: number) => {
    if (window.confirm('Are you sure you want to abandon this quest?')) {
      const updatedQuests = quests.filter((q) => q.id !== id);
      setQuests(updatedQuests);
      saveState(null, updatedQuests);
    }
  };

  const startEditing = (quest: Quest) => {
    setEditingQuest({ ...quest });
  };

  const saveEditedQuest = (quest: Quest) => {
    const originalQuest = quests.find((q) => q.id === quest.id);
    const deadlineChanged = originalQuest?.deadline !== quest.deadline;

    if (deadlineChanged && originalQuest?.deadline) {
      const hasScroll = inventory?.find(
        (i) => i.id === 'scroll_reschedule' && i.count > 0
      );
      if (hasScroll) {
        if (
          !window.confirm(
            "Use 'Scroll of Reschedule' to change the deadline without penalty?"
          )
        ) {
          return;
        }
        const newInventory = inventory
          .map((i) =>
            i.id === 'scroll_reschedule' ? { ...i, count: i.count - 1 } : i
          )
          .filter((i) => i.count > 0);
        updateInventory(newInventory);
      } else {
        if (!window.confirm("You don't have a Scroll of Reschedule! Proceed?")) {
          return;
        }
      }
    }

    const updatedQuests = quests.map((q) =>
      q.id === quest.id ? { ...q, title: quest.title, deadline: quest.deadline } : q
    );
    setQuests(updatedQuests);
    saveState(null, updatedQuests);
    setEditingQuest(null);
  };

  const completedCount = quests.filter((q) => q.completed).length;
  const failedCount = quests.filter(
    (q) => q.deadline && new Date(q.deadline) < new Date() && !q.completed
  ).length;

  return (
    <div className="h-full flex flex-col">
      <QuestStats
        profile={profile}
        streak={streak}
        avatar={avatar}
        completedCount={completedCount}
      />

      <QuestForm
        onAddQuest={addQuest}
        onEditQuest={saveEditedQuest}
        editingQuest={editingQuest}
        cancelEdit={() => setEditingQuest(null)}
      />

      <QuestTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        completedCount={completedCount}
        failedCount={failedCount}
      />

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 bg-[#151515] p-2 rounded-b rounded-tr border border-[#333] min-h-0">
        <QuestList
          quests={quests}
          activeTab={activeTab}
          onComplete={completeQuest}
          onDelete={deleteQuest}
          onEdit={startEditing}
          onAddSubtask={addSubtask}
          onCompleteSubtask={completeSubtask}
        />
      </div>
    </div>
  );
};

export default Quests;
