import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

const Freezer = ({ profile, updateProfile }) => {
    const [sessions, setSessions] = useState([]);

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = () => {
        if (chrome?.storage?.local) {
            chrome.storage.local.get(['frozenSessions'], (result) => {
                if (result.frozenSessions) {
                    setSessions(result.frozenSessions);
                }
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
        // 1. Get current tabs
        let tabs = [];
        if (chrome?.tabs) {
            // Real extension environment
            const currentWindow = await chrome.windows.getCurrent();
            const tabList = await chrome.tabs.query({ windowId: currentWindow.id });
            tabs = tabList.map(t => ({ url: t.url, title: t.title, favIconUrl: t.favIconUrl }));

            // Close window (optional, maybe ask user? for now just save)
            // chrome.windows.remove(currentWindow.id); 
        } else {
            // Mock environment
            tabs = [
                { title: 'Google', url: 'https://google.com' },
                { title: 'Stack Overflow - React Error', url: 'https://stackoverflow.com/questions/123' },
                { title: 'Localhost:5173', url: 'http://localhost:5173' }
            ];
        }

        const newSession = {
            id: Date.now(),
            name: `Quest Log #${sessions.length + 1}`,
            date: new Date().toLocaleString(),
            tabs: tabs
        };

        saveSessions([newSession, ...sessions]);
        toast.success("Time frozen! Context saved.");
    };

    const handleRestore = (session) => {
        if (chrome?.windows) {
            const urls = session.tabs.map(t => t.url);
            chrome.windows.create({ url: urls });
        } else {
            console.log('Restoring session:', session.name);
            toast.info(`Restoring ${session.tabs.length} tabs locally (check console)`);
        }

        // Stats Update (Time Lord Achievement)
        if (profile && updateProfile) {
            const currentStats = profile.stats || {};
            const restoredCount = session.tabs ? session.tabs.length : 0;
            updateProfile({
                ...profile,
                stats: {
                    ...currentStats,
                    tabsRestored: (currentStats.tabsRestored || 0) + restoredCount
                }
            });
        }
    };

    const handleDelete = (id) => {
        const newSessions = sessions.filter(s => s.id !== id);
        saveSessions(newSessions);
    };

    return (
        <div className="h-full flex flex-col">
            <h2 className="text-xl font-bold mb-2 text-[#a0c0ff] font-serif border-b border-[#1e3a8a] pb-2 flex items-center gap-2 shadow-[0_1px_10px_rgba(0,255,255,0.1)]">
                <span className="animate-pulse">❄️</span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-500 drop-shadow-sm">Stasis Chamber</span>
                <span className="text-xs font-mono text-cyan-900/50 ml-auto border border-cyan-900/30 px-2 py-0.5 rounded">CRYO-01</span>
            </h2>

            <div className="mb-4">
                <button
                    onClick={handleFreeze}
                    className="w-full relative group overflow-hidden bg-[#0f172a] hover:bg-[#1e293b] text-cyan-300 py-4 rounded-lg border border-cyan-800/50 transition-all shadow-[0_0_15px_rgba(0,255,255,0.1)] hover:shadow-[0_0_25px_rgba(0,255,255,0.3)]"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none"></div>
                    <span className="relative font-bold tracking-widest uppercase flex items-center justify-center gap-3">
                        <span className="text-2xl">✨</span> Cast Time Stop <span className="text-2xl">✨</span>
                    </span>
                </button>
                <p className="text-[10px] text-center text-cyan-700/60 mt-2 font-mono uppercase tracking-widest">
                    Freezes current reality (tabs) into a stasis crystal
                </p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {sessions.length === 0 && (
                    <div className="text-center text-cyan-900/50 italic mt-12 text-sm flex flex-col items-center">
                        <span className="text-4xl opacity-20 mb-2">🧊</span>
                        The chamber is empty.
                    </div>
                )}
                {sessions.map(session => (
                    <div key={session.id} className="bg-[#0f172a]/80 border border-cyan-900/30 rounded p-3 hover:border-cyan-400/50 transition-all group shadow-sm hover:shadow-[0_0_15px_rgba(0,255,255,0.1)] relative overflow-hidden backdrop-blur-sm">
                        {/* Frost effect corner */}
                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-cyan-500/10 to-transparent pointer-events-none"></div>

                        <div className="flex justify-between items-start mb-2 relative z-10">
                            <h3 className="font-bold text-cyan-100/90 font-serif tracking-wide">{session.name}</h3>
                            <span className="text-[10px] font-mono text-cyan-600 border border-cyan-900/30 px-1 rounded">{session.date.split(',')[0]}</span>
                        </div>
                        <div className="text-xs text-blue-300/60 mb-3 flex items-center gap-1">
                            <span>📦</span> {session.tabs.length} fragments frozen
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => handleRestore(session)}
                                className="flex-1 bg-[#333] hover:bg-[#444] text-xs py-1 rounded border border-[#555] text-green-400"
                            >
                                Restore
                            </button>
                            <button
                                onClick={() => handleDelete(session.id)}
                                className="px-2 bg-[#333] hover:bg-[#441111] text-xs py-1 rounded border border-[#555] text-red-400"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Freezer;
