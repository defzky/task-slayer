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
    const maxVal = Math.max(...weeklyData.map(d => d.xp), 100); // Scale based on XP

    return (
        <div className="h-full bg-[#1a0f0f] text-[#e0e0e0] p-6 overflow-y-auto animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8 border-b border-[#333] pb-4">
                <div className="text-4xl bg-[#2a282a] p-3 rounded-xl border border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                    📊
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-[#d4af37] tracking-wider uppercase font-serif">Hall of Records</h1>
                    <p className="text-gray-500 font-mono">Productivity Metrics for Lvl {level} {userClass}</p>
                </div>
            </div>

            {/* Top Grid Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-[#2a282a] p-4 rounded-lg border border-[#333] relative overflow-hidden group hover:border-[#d4af37] transition-colors">
                    <div className="absolute top-0 right-0 p-2 opacity-10 text-6xl group-hover:scale-110 transition-transform">⚔️</div>
                    <div className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-1">Quests Completed</div>
                    <div className="text-2xl font-bold text-white group-hover:text-[#d4af37]">{stats?.questsCompleted || 0}</div>
                </div>

                <div className="bg-[#2a282a] p-4 rounded-lg border border-[#333] relative overflow-hidden group hover:border-red-500 transition-colors">
                    <div className="absolute top-0 right-0 p-2 opacity-10 text-6xl group-hover:scale-110 transition-transform">👹</div>
                    <div className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-1">Bosses Slain</div>
                    <div className="text-2xl font-bold text-white group-hover:text-red-500">{stats?.bossesDefeated || 0}</div>
                </div>

                <div className="bg-[#2a282a] p-4 rounded-lg border border-[#333] relative overflow-hidden group hover:border-yellow-500 transition-colors">
                    <div className="absolute top-0 right-0 p-2 opacity-10 text-6xl group-hover:scale-110 transition-transform">🪙</div>
                    <div className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-1">Total Gold Earned</div>
                    <div className="text-2xl font-bold text-white group-hover:text-yellow-500">{stats?.totalGoldEarned || 0}</div>
                </div>

                <div className="bg-[#2a282a] p-4 rounded-lg border border-[#333] relative overflow-hidden group hover:border-purple-500 transition-colors">
                    <div className="absolute top-0 right-0 p-2 opacity-10 text-6xl group-hover:scale-110 transition-transform">🧠</div>
                    <div className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-1">Focus Time</div>
                    <div className="text-2xl font-bold text-white group-hover:text-purple-500">0m</div>
                    <div className="text-[10px] text-gray-500">(Feature Coming Soon)</div>
                </div>
            </div>

            {/* Weekly Activity Chart */}
            <div className="bg-[#2a282a] border border-[#333] rounded-lg p-6 shadow-xl relative">
                <h3 className="text-[#d4af37] font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                    <span>📈 Weekly Activity (XP)</span>
                </h3>

                <div className="flex items-end justify-between h-64 gap-2">
                    {weeklyData.map((d, i) => {
                        const heightPercent = Math.max(5, (d.xp / maxVal) * 100);
                        return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-help">
                                <div className="w-full bg-[#1a0f0f] rounded-t-sm relative h-full flex flex-col justify-end overflow-hidden">
                                    {/* Bar */}
                                    <div
                                        className="w-full bg-gradient-to-t from-[#8a6d1f] to-[#d4af37] opacity-80 group-hover:opacity-100 transition-all duration-500 ease-out relative"
                                        style={{ height: `${heightPercent}%` }}
                                    >
                                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                                    </div>
                                </div>

                                {/* Labels */}
                                <div className="text-xs text-gray-500 font-mono group-hover:text-white">{d.day}</div>

                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-2 bg-black/90 text-white text-xs p-2 rounded border border-[#d4af37] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 whitespace-nowrap">
                                    <div className="font-bold text-[#d4af37]">{d.date}</div>
                                    <div>⚡ {d.xp} XP</div>
                                    <div>⚔️ {d.quests} Quests</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Analytics;
