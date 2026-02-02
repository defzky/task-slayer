import React, { useState, useRef, useEffect } from 'react';

const QuickDateSelector = ({ value, onChange, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (date) => {
        onChange(date.toISOString());
        setIsOpen(false);
    };

    const handleClear = () => {
        onChange(null);
        setIsOpen(false);
    };

    // Helper: Set time for a date
    const setTime = (date, hours, minutes = 0) => {
        const d = new Date(date);
        d.setHours(hours, minutes, 0, 0);
        return d;
    };

    // Quick Options
    const quickOptions = [
        {
            label: '🌅 Today Eve',
            get: () => setTime(new Date(), 17)
        },
        {
            label: '🌙 Tomorrow Night',
            get: () => setTime(new Date(new Date().setDate(new Date().getDate() + 1)), 20)
        },
        {
            label: '📅 Next Week',
            get: () => setTime(new Date(new Date().setDate(new Date().getDate() + 7)), 9)
        },
        {
            label: '🕒 In 1 Hour',
            get: () => new Date(new Date().getTime() + 60 * 60 * 1000)
        }
    ];

    // Format display
    const getDisplayCheck = () => {
        if (!value) return null;
        const d = new Date(value);
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);

        const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (d.toDateString() === now.toDateString()) return `Today, ${timeStr}`;
        if (d.toDateString() === tomorrow.toDateString()) return `Tmrw, ${timeStr}`;
        return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;
    };

    const display = getDisplayCheck();

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm font-medium min-w-[100px] sm:min-w-[140px] whitespace-nowrap
                    ${isOpen ? 'border-[#d4af37] bg-[#2a282a] text-[#d4af37] shadow-[0_0_10px_rgba(212,175,55,0.2)]'
                        : (value ? 'border-[#d4af37] bg-[#1e1e1e] text-[#e0e0e0]' : 'border-[#444] bg-[#1e1e1e] text-gray-500 hover:border-gray-300')}
                `}
            >
                <span>📅</span>
                <span>{display || 'Set Deadline'}</span>
                {value && (
                    <span
                        onClick={(e) => { e.stopPropagation(); handleClear(); }}
                        className="ml-auto text-gray-500 hover:text-red-400 p-1 rounded-full hover:bg-white/10"
                        title="Clear Deadline"
                    >
                        ✕
                    </span>
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-[#1a0f0f] border border-[#5c4033] rounded-lg shadow-2xl p-3 z-30 animate-in fade-in slide-in-from-top-2">
                    {/* Header */}
                    <div className="text-xs font-bold text-[#8a6d1f] uppercase tracking-widest mb-2 border-b border-[#5c4033] pb-1">
                        Quick Select
                    </div>

                    {/* Quick Grid */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                        {quickOptions.map((opt, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => handleSelect(opt.get())}
                                className="text-xs bg-[#2a282a] hover:bg-[#3a383a] text-[#e0e0e0] border border-[#444] rounded py-2 px-1 transition-colors flex items-center justify-center gap-1"
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* Custom Input */}
                    <div className="text-xs font-bold text-[#8a6d1f] uppercase tracking-widest mb-1 border-b border-[#5c4033] pb-1">
                        Custom Date
                    </div>
                    <input
                        type="datetime-local"
                        value={value ? new Date(value).toISOString().slice(0, 16) : ''}
                        onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
                        className="w-full bg-[#1e1e1e] border border-[#444] text-[#e0e0e0] rounded p-2 text-sm focus:border-[#d4af37] outline-none"
                    />
                </div>
            )}
        </div>
    );
};

export default QuickDateSelector;
