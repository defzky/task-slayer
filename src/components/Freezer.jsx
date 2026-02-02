import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { playSound } from '../utils/soundfx';

const Freezer = ({ profile, updateProfile }) => {
    const [sessions, setSessions] = useState([]);
    const [isFreezing, setIsFreezing] = useState(false); // Animation state

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = () => {
        // ... (data loading logic remains same)
        if (chrome?.storage?.local) {
            chrome.storage.local.get(['frozenSessions'], (result) => {
                if (result.frozenSessions) setSessions(result.frozenSessions);
            });
        } else {
            const saved = localStorage.getItem('frozenSessions');
            if (saved) setSessions(JSON.parse(saved));
        }
    };

    const saveSessions = (newSessions) => {
        setSessions(newSessions);
        if (chrome?.storage?.local) {
            chrome.storage.local.set({ frozenSessions: newSessions });
        } else {
            localStorage.setItem('frozenSessions', JSON.stringify(newSessions));
        }
    };

    const handleFreeze = async () => {
        setIsFreezing(true);
        playSound.freeze();

        setTimeout(async () => {
            // Logic
            let tabs = [];
            if (chrome?.tabs) {
                const currentWindow = await chrome.windows.getCurrent();
                const tabList = await chrome.tabs.query({ windowId: currentWindow.id });
                tabs = tabList.map(t => ({ url: t.url, title: t.title, favIconUrl: t.favIconUrl }));
            } else {
                tabs = [
                    { title: 'Google', url: 'https://google.com' },
                    { title: 'The Frozen Lands', url: '#nowhere' }
                ];
            }

            const newSession = {
                id: Date.now(),
                name: `Frozen Memory #${sessions.length + 1}`,
                date: new Date().toLocaleString(),
                tabs: tabs
            };

            saveSessions([newSession, ...sessions]);
            toast.success("❄️ Reality Frozen! Context sealed in ice.");
            setIsFreezing(false);
        }, 1000); // Animation delay
    };

    const handleRestore = (session) => {
        if (chrome?.windows) {
            const urls = session.tabs.map(t => t.url);
            chrome.windows.create({ url: urls });
        } else {
            console.log('Restoring:', session);
            window.open(session.tabs[0].url, '_blank');
        }
        playSound.click();
    };

    const handleDelete = (id) => {
        if (window.confirm("Shatter this memory crystal?")) {
            playSound.error(); // Shatter sound ish
            const newSessions = sessions.filter(s => s.id !== id);
            saveSessions(newSessions);
        }
    };

    return (
        <div className="h-full flex flex-col relative overflow-hidden bg-[#001020] animate-in fade-in duration-700">
            {/* Ice Cavern Background */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cracked-glass.png')] opacity-20 pointer-events-none mix-blend-overlay"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-blue-900/20 rounded-full blur-3xl pointer-events-none"></div>

            {/* Header */}
            <h2 className="text-xl font-bold mb-4 text-cyan-100 font-serif border-b border-cyan-800/50 pb-2 flex items-center justify-between sticky top-0 z-10 mx-1 pt-1 backdrop-blur-md">
                <div className="flex items-center gap-2 drop-shadow-[0_0_5px_rgba(0,255,255,0.5)]">
                    <span className="text-2xl animate-pulse">❄️</span>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-200 to-blue-400">Cryo Prison</span>
                </div>
                <span className="text-[10px] font-mono text-cyan-500/50 uppercase border border-cyan-500/20 px-2 py-0.5 rounded backdrop-blur-sm">
                    Temp: -273°C
                </span>
            </h2>

            {/* Cast Freeze Spell */}
            <div className="mb-6 px-1 relative z-10">
                <button
                    onClick={handleFreeze}
                    disabled={isFreezing}
                    className={`w-full relative group overflow-hidden bg-[#0f172a]/80 text-cyan-300 py-6 rounded-xl border border-cyan-500/30 transition-all shadow-[0_0_20px_rgba(0,255,255,0.05)] hover:shadow-[0_0_30px_rgba(34,211,238,0.2)] active:scale-[0.98] ${isFreezing ? 'cursor-not-allowed contrast-125' : ''}`}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-400/10 to-cyan-500/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 pointer-events-none"></div>

                    <div className="flex flex-col items-center gap-1 relative">
                        <span className={`text-2xl transition-transform duration-700 ${isFreezing ? 'scale-150 rotate-180' : 'group-hover:scale-110'}`}>🧊</span>
                        <span className="font-bold tracking-[0.2em] uppercase text-sm md:text-base text-cyan-100 drop-shadow-md">
                            {isFreezing ? 'FREEZING REALITY...' : 'CAST ETERNAL FREEZE'}
                        </span>
                        <span className="text-[10px] text-cyan-400/60 font-mono tracking-widest group-hover:text-cyan-300 transition-colors">
                            Seal Browser Context
                        </span>
                    </div>
                </button>
            </div>

            {/* Frozen List (Ice Blocks) */}
            <div className="flex-1 overflow-y-auto space-y-4 px-1 pb-4 relative z-10 scrollbar-thin scrollbar-thumb-cyan-900/50 scrollbar-track-transparent">
                {sessions.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-cyan-700/40 italic">
                        <div className="w-20 h-20 border-2 border-cyan-800/30 rounded-full flex items-center justify-center mb-4 animate-pulse">
                            <span className="text-4xl opacity-50 grayscale">🕸️</span>
                        </div>
                        <p>The dungeon is empty...</p>
                        <p className="text-xs mt-1">Free the memory of your tabs here.</p>
                    </div>
                )}

                {sessions.map(session => (
                    <div key={session.id} className="group relative bg-cyan-950/20 hover:bg-cyan-900/30 backdrop-blur-sm border border-cyan-500/20 hover:border-cyan-400/60 rounded-lg p-4 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-cyan-500/10">
                        {/* Ice Shards decoration */}
                        <div className="absolute -top-1 -right-1 w-6 h-6 border-t border-r border-cyan-400/30 rounded-tr-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b border-l border-cyan-400/30 rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>

                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="font-bold text-cyan-100 text-lg font-serif tracking-wide drop-shadow-sm group-hover:text-white transition-colors">
                                    {session.name}
                                </h3>
                                <div className="text-[10px] text-cyan-400/70 font-mono flex items-center gap-1 mt-1">
                                    <span>📅</span> {session.date}
                                </div>
                            </div>
                            <div className="bg-cyan-900/50 text-cyan-300 text-xs px-2 py-1 rounded border border-cyan-500/30 font-bold min-w-[30px] text-center">
                                {session.tabs.length}
                            </div>
                        </div>

                        {/* Actions Overlay (Hidden until hover) */}
                        <div className="grid grid-cols-2 gap-3 mt-4 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => handleRestore(session)}
                                className="bg-cyan-600/20 hover:bg-cyan-500/40 text-cyan-200 border border-cyan-500/50 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors hover:shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                            >
                                🔥 Thaw & Open
                            </button>
                            <button
                                onClick={() => handleDelete(session.id)}
                                className="bg-red-900/20 hover:bg-red-900/40 text-red-300 border border-red-500/30 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors hover:text-red-100"
                            >
                                🔨 Shatter
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Freezer;
