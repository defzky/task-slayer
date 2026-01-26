import React from 'react';

const CLASSES = [
    { id: 'novice', name: 'Novice', icon: '🌱', desc: 'Just starting out. No bonuses.', bonus: 'None' },
    { id: 'warrior', name: 'Code Warrior', icon: '⚔️', desc: 'Disciplined and strong.', bonus: '+10% XP per Quest' },
    { id: 'wizard', name: 'Logic Wizard', icon: '🔮', desc: 'Master of algorithms.', bonus: '+5% XP & +5% Gold' },
    { id: 'rogue', name: 'Pixel Rogue', icon: '🗡️', desc: 'Sneaky and rich.', bonus: '+20% Gold per Quest' },
];

const ClassSelector = ({ currentClass, onSelect }) => {
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-[#2a282a] border-2 border-[#d4af37] rounded-lg p-6 max-w-md w-full shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                <h2 className="text-2xl font-bold text-[#d4af37] font-serif text-center mb-2">Choose Your Destiny</h2>
                <p className="text-gray-400 text-center text-sm mb-6">Select a class to aid your journey.</p>

                <div className="space-y-3">
                    {CLASSES.map(cls => (
                        <button
                            key={cls.id}
                            onClick={() => onSelect(cls.name)}
                            className={`w-full flex items-center p-3 rounded border transition-all ${currentClass === cls.name
                                    ? 'bg-[#d4af37]/20 border-[#d4af37] ring-1 ring-[#d4af37]'
                                    : 'bg-[#1e1e1e] border-[#444] hover:bg-[#333] hover:border-gray-500'
                                }`}
                        >
                            <div className="text-3xl mr-4">{cls.icon}</div>
                            <div className="text-left flex-1">
                                <div className="font-bold text-[#e0e0e0]">{cls.name}</div>
                                <div className="text-xs text-gray-500">{cls.desc}</div>
                            </div>
                            <div className="text-xs font-bold text-[#ffd700] bg-[#333] px-2 py-1 rounded">
                                {cls.bonus}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ClassSelector;
