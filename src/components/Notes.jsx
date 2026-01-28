import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { playSound } from '../utils/soundfx';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Note Item Component
const SortableNoteItem = ({ note, isActive, onClick, onDelete, children }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: note.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {children}
        </div>
    );
};

// Custom Pre Block with Copy Button
const PreBlock = ({ children, ...props }) => {
    const handleCopy = () => {
        // Extract text content from children
        let textToCopy = '';
        if (children && children.props && children.props.children) {
            textToCopy = children.props.children;
        } else if (typeof children === 'string') {
            textToCopy = children;
        } else if (Array.isArray(children)) {
            textToCopy = children.map(child => {
                if (typeof child === 'string') return child;
                if (child.props && child.props.children) return child.props.children;
                return '';
            }).join('');
        }

        navigator.clipboard.writeText(textToCopy);
        toast.success('Copied to clipboard!');
        playSound.coin();
    };

    return (
        <div className="relative group/code mb-4">
            <button
                onClick={handleCopy}
                className="absolute right-2 top-2 bg-[#444] hover:bg-[#d4af37] hover:text-black text-xs text-white px-2 py-1 rounded opacity-0 group-hover/code:opacity-100 transition-opacity z-10"
                title="Copy to clipboard"
            >
                📋 Copy
            </button>
            <pre {...props} className="relative">
                {children}
            </pre>
        </div>
    );
};

const Notes = ({ profile, updateProfile }) => {
    // Data Structure: [{ id: 123, content: "...", updatedAt: "..." }]
    const [notes, setNotes] = useState([]);
    const [activeNoteId, setActiveNoteId] = useState(null);
    const [isPreview, setIsPreview] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Load notes on mount
    useEffect(() => {
        const loadData = (result) => {
            let loadedNotes = [];
            if (result.notesList && Array.isArray(result.notesList)) {
                loadedNotes = result.notesList;
            } else if (result.quickNote) {
                // Migrate old single note
                loadedNotes = [{ id: Date.now(), content: result.quickNote, updatedAt: new Date().toISOString() }];
            }

            setNotes(loadedNotes);
            if (loadedNotes.length > 0) {
                setActiveNoteId(loadedNotes[0].id);
            }
        };

        if (chrome?.storage?.sync) {
            chrome.storage.sync.get(['notesList', 'quickNote'], (syncRes) => {
                if (syncRes.notesList || syncRes.quickNote) {
                    loadData(syncRes);
                } else {
                    // Check Local
                    chrome.storage.local.get(['notesList', 'quickNote'], (localRes) => {
                        if (localRes.notesList || localRes.quickNote) {
                            loadData(localRes);
                            chrome.storage.sync.set(localRes); // Migrate
                        }
                    });
                }
            });
        } else if (chrome?.storage?.local) {
            chrome.storage.local.get(['notesList', 'quickNote'], loadData);
        } else {
            const savedList = localStorage.getItem('notesList');
            const savedOld = localStorage.getItem('quickNote');
            let loadedNotes = [];
            if (savedList) loadedNotes = JSON.parse(savedList);
            else if (savedOld) loadedNotes = [{ id: Date.now(), content: savedOld, updatedAt: new Date().toISOString() }];

            setNotes(loadedNotes);
            if (loadedNotes.length > 0) setActiveNoteId(loadedNotes[0].id);
        }
    }, []);

    const saveNotes = (updatedNotes) => {
        setNotes(updatedNotes);
        if (chrome?.storage?.sync) {
            chrome.storage.sync.set({ notesList: updatedNotes });
        } else if (chrome?.storage?.local) {
            chrome.storage.local.set({ notesList: updatedNotes });
        } else {
            localStorage.setItem('notesList', JSON.stringify(updatedNotes));
        }
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = notes.findIndex((n) => n.id === active.id);
            const newIndex = notes.findIndex((n) => n.id === over.id);
            const newNotes = arrayMove(notes, oldIndex, newIndex);
            saveNotes(newNotes);
        }
    };

    const createNote = () => {
        playSound.click();
        const newNote = {
            id: Date.now(),
            content: '# New Scroll\n',
            updatedAt: new Date().toISOString()
        };
        const updated = [newNote, ...notes];
        // Update Stats if creating new note
        if (profile && updateProfile) {
            const currentStats = profile.stats || {};
            updateProfile({
                ...profile,
                stats: {
                    ...currentStats,
                    notesCreated: (currentStats.notesCreated || 0) + 1
                }
            });
        }

        saveNotes(updated);
        setActiveNoteId(newNote.id);
    };

    const deleteNote = (e, id) => {
        e.stopPropagation();
        if (confirm('Burn this scroll forever?')) {
            playSound.error(); // Using error sound as "destruction"
            const updated = notes.filter(n => n.id !== id);
            saveNotes(updated);
            if (activeNoteId === id) {
                setActiveNoteId(updated.length > 0 ? updated[0].id : null);
            }
        }
    };

    const updateActiveNote = (content) => {
        const updated = notes.map(n =>
            n.id === activeNoteId ? { ...n, content, updatedAt: new Date().toISOString() } : n
        );
        saveNotes(updated);
    };

    const handleDownload = () => {
        const currentNote = notes.find(n => n.id === activeNoteId);
        if (!currentNote) return;

        const blob = new Blob([currentNote.content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scroll-${currentNote.id}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleManualSave = () => {
        playSound.coin();
        toast.success("Scroll saved to archives!");
    };

    const activeNote = notes.find(n => n.id === activeNoteId);

    // Helper to get title from first line
    const getTitle = (content) => {
        const lines = content.split('\n');
        const firstLine = lines.find(l => l.trim().length > 0);
        return firstLine ? firstLine.replace(/^#+\s*/, '').substring(0, 30) : 'Untitled Scroll';
    };

    return (
        <div className="h-full flex flex-col gap-2">
            {/* TOP: Notes List (Saved Scrolls) */}
            <div className="h-1/3 bg-[#1a181a] border-2 border-[#444] rounded-lg flex flex-col shadow-[0_0_20px_rgba(0,0,0,0.5)] relative overflow-hidden">
                {/* Decorative sheen */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#d4af37]/10 to-transparent pointer-events-none"></div>

                <div className="flex justify-between items-center p-3 border-b border-[#333] bg-[#222022]">
                    <span className="text-sm font-bold text-[#d4af37] font-serif tracking-wider flex items-center gap-2">
                        📜 <span className="drop-shadow-md">Nalan's Grimoire</span>
                    </span>
                    <button
                        onClick={createNote}
                        className="text-xs bg-gradient-to-r from-[#d4af37] to-[#b4941f] text-black font-bold border border-[#d4af37] px-3 py-1.5 rounded shadow-[0_0_10px_rgba(212,175,55,0.4)] hover:scale-105 transition-transform"
                    >
                        + Inscribe New
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-1 space-y-1">
                    {notes.length === 0 && (
                        <div className="text-center text-gray-500 text-xs mt-4">No scrolls found.</div>
                    )}

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={notes.map(n => n.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {notes.map(note => (
                                <SortableNoteItem key={note.id} note={note}>
                                    <div
                                        onClick={() => { playSound.click(); setActiveNoteId(note.id); }}
                                        className={`p-2 rounded cursor-pointer flex justify-between items-center group touch-none relative ${activeNoteId === note.id ? 'bg-[#333] border-l-2 border-[#d4af37]' : 'hover:bg-[#2a282a]'}`}
                                    >
                                        <div className="truncate text-sm text-[#e0e0e0] w-3/4">
                                            {getTitle(note.content)}
                                        </div>
                                        <button
                                            onClick={(e) => deleteNote(e, note.id)}
                                            onPointerDown={(e) => e.stopPropagation()}
                                            className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 text-xs px-1"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </SortableNoteItem>
                            ))}
                        </SortableContext>
                    </DndContext>
                </div>
            </div>

            {/* BOTTOM: Editor */}
            <div className="flex-1 bg-[#1a181a] border-2 border-[#444] rounded-lg flex flex-col overflow-hidden relative shadow-2xl">
                {activeNote ? (
                    <>
                        {/* Editor Toolbar */}
                        <div className="flex justify-between items-center p-2 border-b border-[#333] bg-[#222022]">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-[#888] font-mono">Runescript...</span>
                                {statusMsg && <span className="text-xs text-[#d4af37] animate-pulse">✨ {statusMsg}</span>}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleManualSave}
                                    className="text-xs bg-[#1a181a] hover:bg-[#d4af37] text-[#d4af37] hover:text-black border border-[#d4af37] px-3 py-1 rounded transition-colors font-serif"
                                >
                                    🔮 Enchant (Save)
                                </button>
                                <button
                                    onClick={handleDownload}
                                    className="text-xs bg-[#1e293b] hover:bg-[#334155] text-blue-200 border border-blue-900/50 px-3 py-1 rounded transition-colors font-serif"
                                >
                                    📜 Export
                                </button>
                                <button
                                    onClick={() => setIsPreview(!isPreview)}
                                    className="text-xs bg-[#333] hover:bg-[#555] px-3 py-1 rounded text-[#ccc] transition-colors border border-[#444]"
                                >
                                    {isPreview ? '✏️ Inscribe' : '👁️ Decipher'}
                                </button>
                            </div>
                        </div>

                        {/* Textarea or Preview */}
                        <div className="flex-1 relative overflow-hidden bg-[#151315]">
                            {/* Texture Overlay */}
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')] opacity-50 pointer-events-none"></div>

                            {!isPreview ? (
                                <textarea
                                    className="w-full h-full bg-transparent p-4 text-[#e0d0b0] resize-none focus:outline-none focus:bg-[#1a181a]/50 transition-colors font-mono leading-relaxed relative z-10"
                                    value={activeNote.content}
                                    onChange={(e) => updateActiveNote(e.target.value)}
                                    placeholder="Write your arcane knowledge here..."
                                    spellCheck={false}
                                />
                            ) : (
                                <div className="w-full h-full bg-transparent p-6 text-[#e0d0b0] overflow-y-auto prose prose-invert prose-p:font-serif prose-headings:text-[#d4af37] prose-headings:font-serif max-w-none relative z-10">
                                    <ReactMarkdown
                                        rehypePlugins={[rehypeRaw]}
                                        components={{
                                            pre: PreBlock
                                        }}
                                    >
                                        {activeNote.content}
                                    </ReactMarkdown>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                        <div className="text-4xl mb-2">📜</div>
                        <div>Select a scroll from the list</div>
                        <div className="text-xs">or create a new one</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notes;
