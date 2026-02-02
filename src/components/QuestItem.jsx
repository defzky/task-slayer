import React from 'react';

const QuestItem = ({ quest, onComplete, onDelete, onEdit }) => {

    // Helper: Is Expired?
    const isExpired = quest.deadline && new Date(quest.deadline) < new Date() && !quest.completed;

    return (
        <div className="bg-[#1a181a] border border-[#444] border-l-4 border-l-[#d4af37] rounded-r-lg p-4 transition-all relative mb-3 group shadow-[0_2px_5px_rgba(0,0,0,0.3)] hover:shadow-[0_0_15px_rgba(212,175,55,0.1)] overflow-hidden">
            {/* Card Texture */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')] opacity-30 pointer-events-none"></div>

            <div className="flex justify-between items-start relative z-10">
                <div className="flex-1 min-w-0 cursor-grab active:cursor-grabbing mr-2">
                    <div className="font-bold text-base text-[#e0e0e0] truncate" title={quest.title}>
                        {quest.title}
                    </div>
                    <div className="text-xs text-[#d4af37] mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="shrink-0">{quest.xpReward} XP</span>
                        {quest.deadline && (
                            <span className={`flex items-center gap-1 shrink-0 ${isExpired ? 'text-red-500 font-bold animate-pulse' : 'text-gray-400'}`}>
                                ⏰ {new Date(quest.deadline).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                {isExpired && ' (OVERDUE!)'}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 pl-0 shrink-0">
                    <button
                        onClick={(e) => { e.stopPropagation(); onComplete(quest.id); }}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="bg-[#1e1e1e] hover:bg-[#d4af37] hover:text-black border border-[#d4af37] text-[#d4af37] rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center transition-all shadow-[0_0_5px_rgba(212,175,55,0.2)] text-lg shrink-0"
                        title="Complete Quest"
                    >
                        ✔
                    </button>
                    <div className="flex flex-col gap-1">
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(quest); }}
                            onPointerDown={(e) => e.stopPropagation()}
                            className="text-gray-500 hover:text-[#d4af37] text-xs px-2"
                            title="Edit Quest"
                        >
                            ✏️
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(quest.id); }}
                            onPointerDown={(e) => e.stopPropagation()}
                            className="text-gray-500 hover:text-red-400 text-xs px-2"
                            title="Abandon Quest"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuestItem;
