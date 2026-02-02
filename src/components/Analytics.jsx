import React from 'react';

const Analytics = ({ profile }) => {
    const { stats, history = [], level, userClass } = profile;

    // Helper: Get data for last 7 days
    const getLast7Days = () => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toDateString();
            const entry = history.find(h => h.date === dateStr) || { date: dateStr, xp: 0, quests: 0 };
            days.push({
                day: d.toLocaleDateString('en-US', { weekday: 'short' }),
                date: d.toLocaleDateString(),
                xp: entry.xp,
                quests: entry.quests
            });
        }
        return days;
    };

    const weeklyData = getLast7Days();
    const maxVal = Math.max(...weeklyData.map(d => d.xp), 100);

    return (
        <div className="h-full bg-[#1a0f0f] text-[#e0e0e0] p-6 overflow-y-auto animate-in fade-in zoom-in-95 font-serif relative">
            {/* Background Texture - Parchment/Map */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-50 pointer-events-none"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/80 pointer-events-none"></div>

            {/* Header */}
            <div className="flex items-center gap-4 mb-8 border-b-2 border-[#8a6d1f] pb-4 relative z-10">
                <div className="text-4xl bg-[#2a1a1a] p-3 rounded-sm border-2 border-[#8a6d1f] shadow-[0_0_20px_rgba(212,175,55,0.1)]">
                    📜
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-[#d4af37] tracking-[0.2em] uppercase drop-shadow-md">Battle Chronicle</h1>
                    <p className="text-[#8a6d1f] font-mono text-xs uppercase tracking-widest border border-[#8a6d1f]/30 px-2 py-0.5 inline-block mt-1 bg-[#1a0f0f]">
                        CONFIDENTIAL // LVL {level} {userClass}
                    </p>
                </div>
            </div>

            {/* Top Grid Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 relative z-10">
                {/* Stat Card 1 */}
                <div className="bg-[#1e1e1e] p-4 border border-[#444] border-l-4 border-l-[#d4af37] shadow-lg relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-5 text-7xl group-hover:scale-125 transition-transform duration-500">⚔️</div>
                    <div className="text-[#888] text-[10px] uppercase tracking-widest font-bold mb-1 border-b border-[#333] pb-1 w-fit">Victories</div>
                    <div className="text-3xl font-bold text-[#e0e0e0] group-hover:text-[#d4af37] transition-colors font-mono">{stats?.questsCompleted || 0}</div>
                    <div className="text-[10px] text-gray-500 mt-1">Quests Completed</div>
                </div>

                {/* Stat Card 2 */}
                <div className="bg-[#1e1e1e] p-4 border border-[#444] border-l-4 border-l-red-700 shadow-lg relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-5 text-7xl group-hover:scale-125 transition-transform duration-500">👹</div>
                    <div className="text-[#888] text-[10px] uppercase tracking-widest font-bold mb-1 border-b border-[#333] pb-1 w-fit">Titans Slain</div>
                    <div className="text-3xl font-bold text-[#e0e0e0] group-hover:text-red-500 transition-colors font-mono">{stats?.bossesDefeated || 0}</div>
                    <div className="text-[10px] text-gray-500 mt-1">Bosses Defeated</div>
                </div>

                {/* Stat Card 3 */}
                <div className="bg-[#1e1e1e] p-4 border border-[#444] border-l-4 border-l-yellow-600 shadow-lg relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-5 text-7xl group-hover:scale-125 transition-transform duration-500">🪙</div>
                    <div className="text-[#888] text-[10px] uppercase tracking-widest font-bold mb-1 border-b border-[#333] pb-1 w-fit">War Chest</div>
                    <div className="text-3xl font-bold text-[#e0e0e0] group-hover:text-yellow-500 transition-colors font-mono">{stats?.totalGoldEarned || 0}</div>
                    <div className="text-[10px] text-gray-500 mt-1">Total Gold Earned</div>
                </div>

                {/* Stat Card 4 */}
                <div className="bg-[#1e1e1e] p-4 border border-[#444] border-l-4 border-l-purple-600 shadow-lg relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-5 text-7xl group-hover:scale-125 transition-transform duration-500">🧠</div>
                    <div className="text-[#888] text-[10px] uppercase tracking-widest font-bold mb-1 border-b border-[#333] pb-1 w-fit">Mind Palace</div>
                    <div className="text-3xl font-bold text-[#e0e0e0] group-hover:text-purple-500 transition-colors font-mono">0m</div>
                    <div className="text-[10px] text-gray-500 mt-1">Focus Time Logged</div>
                </div>
            </div>

            {/* Weekly Activity Chart (Tactical Map Style) */}
            <div className="bg-[#151515] border border-[#333] p-6 shadow-2xl relative z-10 overflow-hidden">
                {/* Grid Overlay */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')] opacity-10 pointer-events-none"></div>

                <div className="flex justify-between items-center mb-6 border-b border-[#333] pb-2">
                    <h3 className="text-[#d4af37] font-bold uppercase tracking-widest flex items-center gap-2 text-sm">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Combat Effectiveness (Lost 7 Days)
                    </h3>
                    <span className="text-[10px] font-mono text-gray-600">UNIT: XP_OUTPUT</span>
                </div>

                <div className="flex items-end justify-between h-64 gap-3 md:gap-6 px-2">
                    {weeklyData.map((d, i) => {
                        const heightPercent = Math.max(5, (d.xp / maxVal) * 100);
                        return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-crosshair relative">
                                {/* Vertical Grid Line */}
                                <div className="absolute bottom-0 top-0 w-px bg-[#333] -z-10 group-hover:bg-[#444] transition-colors"></div>

                                {/* Bar Container */}
                                <div className="w-full bg-[#0a0a0a] border border-[#333] relative h-full flex flex-col justify-end group-hover:border-[#d4af37]/50 transition-colors">
                                    {/* Bar Fill */}
                                    <div
                                        className="w-full bg-[#8a6d1f] opacity-60 group-hover:opacity-90 group-hover:bg-[#d4af37] transition-all duration-300 ease-out relative border-t-2 border-[#ffd700]/50"
                                        style={{ height: `${heightPercent}%` }}
                                    >
                                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-30"></div>
                                    </div>
                                </div>

                                {/* Labels */}
                                <div className="text-[10px] text-gray-500 font-mono group-hover:text-[#d4af37] uppercase tracking-wider">{d.day}</div>

                                {/* Tooltip (Tactical HUD) */}
                                <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-black/95 text-[#00ff00] text-xs p-3 border border-[#00ff00]/30 shadow-[0_0_15px_rgba(0,255,0,0.1)] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20 whitespace-nowrap font-mono">
                                    <div className="text-[10px] text-gray-500 border-b border-gray-800 mb-1 pb-1">{d.date}</div>
                                    <div className="flex justify-between gap-4"><span>XP OUTPUT:</span> <span className="font-bold text-white">{d.xp}</span></div>
                                    <div className="flex justify-between gap-4"><span>MISSIONS:</span> <span className="font-bold text-white">{d.quests}</span></div>
                                    {/* Decoration */}
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black border-r border-b border-[#00ff00]/30 rotate-45"></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Quote Footer */}
            <div className="mt-8 text-center opacity-30 font-serif italic text-sm">
                "Victory belongs to the most persevering." - Napoleon Bonaparte
            </div>
        </div>
    );
};

export default Analytics;
