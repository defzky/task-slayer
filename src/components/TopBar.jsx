import React from 'react';
import {
    Settings,
    Volume2,
    VolumeX,
    Trophy,
    Flame,
    Coins
} from 'lucide-react';

const TopBar = ({
    profile,
    avatar,
    activeTab,
    setActiveTab,
    soundEnabled,
    toggleSound,
    setShowClassSelector
}) => {
    // Determine Class Color
    const getClassColor = () => {
        switch (profile.userClass) {
            case 'Code Warrior': return 'text-blue-400';
            case 'Pixel Rogue': return 'text-green-400';
            case 'Logic Wizard': return 'text-purple-400';
            default: return 'text-gray-400';
        }
    };

    return (
        <header className="h-16 bg-[#151515] border-b border-[#333] flex items-center justify-between px-6 shrink-0 z-30 shadow-md">
            {/* Left: User Profile */}
            <div className="flex items-center gap-4">
                <div
                    onClick={() => setShowClassSelector(true)}
                    className="w-10 h-10 bg-[#2a282a] rounded-full border border-[#d4af37] flex items-center justify-center text-xl cursor-pointer hover:scale-105 transition-transform"
                    title="Change Class"
                >
                    {avatar}
                </div>

                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-[#e0e0e0] text-sm tracking-wide">
                            Lvl {profile.level}
                        </span>
                        <span className={`text-xs font-mono uppercase ${getClassColor()}`}>
                            {profile.userClass || 'Novice'}
                        </span>
                    </div>
                    {/* XP Bar */}
                    <div className="w-32 h-1.5 bg-[#333] rounded-full mt-1 relative overflow-hidden" title={`${profile.xp} / ${profile.maxXp} XP`}>
                        <div
                            className="h-full bg-[#d4af37] transition-all duration-500"
                            style={{ width: `${(profile.xp / profile.maxXp) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Right: Stats & System */}
            <div className="flex items-center gap-6">
                {/* Streak */}
                <div className="flex items-center gap-2" title="Daily Streak">
                    <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
                    <span className="text-orange-100 font-bold font-mono">{profile.streak || 0}</span>
                </div>

                {/* Gold */}
                <div className="flex items-center gap-2" title="Gold">
                    <Coins className="w-5 h-5 text-yellow-500" />
                    <span className="text-yellow-100 font-bold font-mono">{profile.gold || 0}</span>
                </div>

                {/* Divider */}
                <div className="h-6 w-px bg-[#333]"></div>

                {/* Trophies */}
                <button
                    onClick={() => setActiveTab('achievements')}
                    className={`p-2 rounded-lg transition-colors ${activeTab === 'achievements' ? 'bg-[#d4af37]/20 text-[#d4af37]' : 'text-gray-400 hover:text-[#d4af37] hover:bg-[#333]'}`}
                    title="Achievements"
                >
                    <Trophy className="w-5 h-5" />
                </button>

                {/* Sound Toggle */}
                <button
                    onClick={toggleSound}
                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#333] transition-colors"
                    title={soundEnabled ? "Mute" : "Unmute"}
                >
                    {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>

                {/* Settings */}
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`p-2 rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-[#333]'}`}
                    title="Settings"
                >
                    <Settings className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
};

export default TopBar;
