import { useRef, useState, useEffect, memo } from 'react';
import { Handle, Position, NodeProps, useReactFlow, NodeToolbar, useStore } from '@xyflow/react';
import { RoadmapNode, NodeStatus } from '@/types';
import { useEditorStore } from '@/lib/store';
import { FileText, Trash2, Check, Clock, Circle, XCircle, Lock, Unlock, Palette, AlignLeft, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const COLORS = ['#e94242ff', '#ea6a40ff', '#da8525ff', '#088d3bff', '#0093c8ff', '#2c5bf5ff', '#7629f1ff', '#f02476ff', '#393939ff'];

function CustomNode({ id, data, isConnectable, selected }: NodeProps<RoadmapNode>) {
    const { openNotePanel, hideHandles } = useEditorStore();
    const { setNodes, deleteElements } = useReactFlow();
    const selectedNodesCount = useStore((s) => s.nodes.filter((n) => n.selected).length);

    const [isEditingLabel, setIsEditingLabel] = useState(false);
    const [editLabelValue, setEditLabelValue] = useState(data.label);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showStatusPicker, setShowStatusPicker] = useState(false);
    const [showDescInput, setShowDescInput] = useState(false);
    const [editDescValue, setEditDescValue] = useState(data.description || '');
    const labelInputRef = useRef<HTMLInputElement>(null);
    const descInputRef = useRef<HTMLTextAreaElement>(null);

    // Sync local edit values with props
    useEffect(() => {
        setEditLabelValue(data.label);
        setEditDescValue(data.description || '');
    }, [data.label, data.description]);

    // Focus inputs when editing starts
    useEffect(() => {
        if (isEditingLabel && labelInputRef.current) {
            labelInputRef.current.focus();
        }
    }, [isEditingLabel]);

    useEffect(() => {
        if (showDescInput && descInputRef.current) {
            descInputRef.current.focus();
        }
    }, [showDescInput]);

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        deleteElements({ nodes: [{ id }] });
    };

    const handleStatusChange = (status: NodeStatus, e: React.MouseEvent) => {
        e.stopPropagation();
        setNodes((nds) => nds.map((n) => {
            if (n.id === id) {
                return { ...n, data: { ...n.data, status } };
            }
            return n;
        }));
        setShowStatusPicker(false);
    };

    const handleColorChange = (color: string) => {
        setNodes((nds) => nds.map((n) => {
            if (n.id === id) {
                return { ...n, data: { ...n.data, color } };
            }
            return n;
        }));
        setShowColorPicker(false);
    };

    const handleLabelSubmit = () => {
        setIsEditingLabel(false);
        if (editLabelValue.trim() === '') {
            setEditLabelValue(data.label);
            return;
        }
        setNodes((nds) => nds.map((n) => {
            if (n.id === id) {
                return { ...n, data: { ...n.data, label: editLabelValue } };
            }
            return n;
        }));
    };

    const handleDescSubmit = () => {
        setShowDescInput(false);
        setNodes((nds) => nds.map((n) => {
            if (n.id === id) {
                return { ...n, data: { ...n.data, description: editDescValue } };
            }
            return n;
        }));
    };

    const toggleLock = (nodeId: string, currentLocked: boolean) => {
        setNodes((nds) => nds.map(n => {
            if (n.id === nodeId) {
                return {
                    ...n,
                    draggable: !!currentLocked,
                    data: { ...n.data, locked: !currentLocked }
                };
            }
            return n;
        }));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleLabelSubmit();
        }
    };

    const isLocked = !!data.locked;
    const bgColor = data.color || 'bg-card/90';
    const nodeStyle = data.color ? { backgroundColor: data.color } : { backgroundColor: '#000' };

    const getStatusInfo = (status: string | undefined) => {
        switch (status) {
            case 'done': return { label: 'DONE', color: 'text-green-500', icon: <Check size={12} />, ringColor: 'ring-green-500/40', shadowColor: '0 0 20px rgba(34, 197, 94, 0.71)', borderColor: 'border-green-500/60' };
            case 'in-progress': return { label: 'IN PROGRESS', color: 'text-blue-500', icon: <Clock size={12} />, ringColor: 'ring-blue-500/40', shadowColor: '0 0 20px rgba(59, 131, 246, 0.71)', borderColor: 'border-blue-500/60' };
            case 'remove': return { label: 'REMOVE', color: 'text-red-500', icon: <XCircle size={12} />, ringColor: 'ring-red-500/40', shadowColor: '0 0 20px rgba(239, 68, 68, 0.71)', borderColor: 'border-red-500/60' };
            case 'none': return { label: 'NEUTRAL', color: 'text-yellow-400', icon: <Circle size={12} />, ringColor: 'ring-yellow-500/40', shadowColor: '0 0 15px rgba(234, 179, 8, 0.71)', borderColor: 'border-yellow-500/60' };
            default: return { label: 'TODO', color: 'text-zinc-500', icon: <Circle size={12} />, ringColor: 'ring-zinc-500/30', shadowColor: '0 0 15px rgba(113, 113, 122, 0.71)', borderColor: 'border-zinc-400/80' };
        }
    };

    const statusInfo = getStatusInfo(data.status);
    const showToolbar = selected && selectedNodesCount === 1;

    return (
        <>
            <NodeToolbar isVisible={showToolbar} position={Position.Top} className="flex gap-1 p-1 bg-popover/80 backdrop-blur-md border border-border/50 rounded-lg shadow-xl mb-2 items-center">
                {isLocked ? (
                    // Show only unlock button when locked
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleLock(id, !!data.locked);
                        }}
                        className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-muted rounded transition-colors text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                        <Unlock size={14} />
                        <span className="hidden md:inline">Unlock</span>
                    </button>
                ) : (
                    // Show full toolbar when unlocked
                    <>
                        {/* Color Picker */}
                        <div className="relative">
                            <button
                                onClick={() => { setShowColorPicker(!showColorPicker); setShowStatusPicker(false); setShowDescInput(false); }}
                                className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-muted rounded transition-colors text-xs font-medium text-muted-foreground hover:text-foreground"
                            >
                                <div className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: data.color || 'transparent' }}></div>
                                <span className="hidden md:inline">Color</span>
                            </button>
                            {showColorPicker && (
                                <div className="absolute left-0 top-full mt-2 p-2 bg-popover border border-border rounded-lg shadow-xl grid grid-cols-3 gap-1 w-24 z-50 animate-in fade-in zoom-in-95">
                                    {COLORS.map((c) => (
                                        <button
                                            key={c}
                                            onClick={() => handleColorChange(c)}
                                            className="w-6 h-6 rounded-full border border-border/50 hover:scale-110 transition-transform"
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                    <button
                                        onClick={() => handleColorChange('')}
                                        className="w-6 h-6 rounded-full border border-border/50 hover:scale-110 transition-transform bg-card flex items-center justify-center text-[10px]"
                                        title="Default"
                                    >
                                        <XCircle size={10} className="opacity-50" />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="h-4 w-px bg-border/50 mx-1" />

                        {/* Status Picker - FULL TEXT */}
                        <div className="relative">
                            <button
                                onClick={() => { setShowStatusPicker(!showStatusPicker); setShowColorPicker(false); setShowDescInput(false); }}
                                className={clsx(
                                    "flex items-center gap-1.5 px-2 py-1.5 hover:bg-muted rounded transition-colors text-xs font-bold uppercase",
                                    statusInfo.color
                                )}
                            >
                                {statusInfo.icon}
                                <span className="hidden md:inline">{statusInfo.label}</span>
                            </button>
                            {showStatusPicker && (
                                <div className="absolute left-0 top-full mt-2 w-32 bg-popover border border-border rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 flex flex-col py-1">
                                    <button onClick={(e) => handleStatusChange('none', e)} className="w-full px-3 py-1.5 text-xs text-left hover:bg-muted pl-8 relative text-yellow-500 dark:text-yellow-400">
                                        <Circle size={10} className="absolute left-3 top-2" /> Neutral
                                    </button>
                                    <button onClick={(e) => handleStatusChange('todo', e)} className="w-full px-3 py-1.5 text-xs text-left hover:bg-muted pl-8 relative text-muted-foreground">
                                        <Circle size={10} className="absolute left-3 top-2" /> Todo
                                    </button>
                                    <button onClick={(e) => handleStatusChange('in-progress', e)} className="w-full px-3 py-1.5 text-xs text-left hover:bg-muted pl-8 relative text-blue-500 dark:text-blue-400">
                                        <Clock size={10} className="absolute left-3 top-2" /> In Progress
                                    </button>
                                    <button onClick={(e) => handleStatusChange('done', e)} className="w-full px-3 py-1.5 text-xs text-left hover:bg-muted pl-8 relative text-green-500 dark:text-green-400">
                                        <Check size={10} className="absolute left-3 top-2" /> Done
                                    </button>
                                    <button onClick={(e) => handleStatusChange('remove', e)} className="w-full px-3 py-1.5 text-xs text-left hover:bg-muted pl-8 relative text-red-500 dark:text-red-400">
                                        <XCircle size={10} className="absolute left-3 top-2" /> Remove
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="h-4 w-px bg-border/50 mx-1" />

                        {/* Description Toggle */}
                        <div className="relative">
                            <button
                                onClick={() => { setShowDescInput(!showDescInput); setShowColorPicker(false); setShowStatusPicker(false); }}
                                className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-muted rounded transition-colors text-xs font-medium text-muted-foreground hover:text-foreground"
                            >
                                <AlignLeft size={14} />
                                <span className="hidden md:inline">Desc</span>
                            </button>
                            {showDescInput && (
                                <div className="absolute left-0 top-full mt-2 w-64 bg-popover border border-border rounded-lg shadow-xl p-2 z-50 animate-in fade-in zoom-in-95">
                                    <textarea
                                        ref={descInputRef}
                                        value={editDescValue}
                                        onChange={(e) => setEditDescValue(e.target.value)}
                                        className="w-full bg-muted/50 text-xs text-foreground outline-none border border-border rounded p-2 resize-none h-24 mb-2 focus:ring-1 focus:ring-primary/20"
                                        placeholder="Enter short description..."
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setShowDescInput(false)} className="px-2 py-1 text-xs hover:text-foreground text-muted-foreground transition-colors">Cancel</button>
                                        <button onClick={handleDescSubmit} className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90">Save</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="h-4 w-px bg-border/50 mx-1" />

                        {/* AI Enhance Button */}
                        <button
                            onClick={() => openNotePanel(id, 'enhance')}
                            className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-muted rounded transition-colors text-xs font-medium text-amber-500 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300"
                        >
                            <Sparkles size={14} />
                            <span className="hidden md:inline">AI</span>
                        </button>

                        {/* Note Button */}
                        <button
                            onClick={() => openNotePanel(id)}
                            className={clsx(
                                "flex items-center gap-1.5 px-2 py-1.5 hover:bg-muted rounded transition-colors text-xs font-medium",
                                data.note && data.note.trim() !== '' && data.note !== '<p></p>' ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <FileText size={14} />
                            <span className="hidden md:inline">Note</span>
                        </button>

                        <div className="h-4 w-px bg-border/50 mx-1" />

                        {/* Lock Toggle */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleLock(id, !!data.locked);
                            }}
                            className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-muted rounded transition-colors text-xs font-medium text-muted-foreground hover:text-foreground"
                        >
                            <Lock size={14} />
                            <span className="hidden md:inline">Lock</span>
                        </button>

                        <div className="h-4 w-px bg-border/50 mx-1" />

                        {/* Delete Button */}
                        <button
                            onClick={handleDelete}
                            className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-red-500/10 rounded transition-colors text-xs font-medium text-muted-foreground hover:text-red-500"
                        >
                            <Trash2 size={14} />
                            <span className="hidden md:inline">Delete</span>
                        </button>
                    </>
                )}
            </NodeToolbar>

            <div
                className={twMerge(
                    "relative min-w-[200px] max-w-[250px] rounded-xl transition-all duration-300 group",
                    "backdrop-blur-md bg-card/80 border-2 border-border shadow-sm", // Default light/dark compatible stats
                    selected ? "ring-2 ring-primary/50" : "hover:shadow-md",
                    "dark:bg-black/40", // Override for dark mode specific need if any, or rely on card
                    statusInfo.borderColor
                )}
                style={{
                    boxShadow: selected ? `0 0 30px -5px ${data.color || statusInfo.shadowColor.match(/rgba\([^)]+\)/)?.[0] || 'rgba(var(--primary), 0.2)'}` : undefined,
                    ...(data.color ? { backgroundColor: data.color, borderColor: 'transparent' } : {}),
                } as React.CSSProperties}
            >
                {/* Lock Indicator */}
                {isLocked && (
                    <div className="absolute top-2 right-2 p-1 text-muted-foreground/50 z-10">
                        <Lock size={12} />
                    </div>
                )}

                <div className={`p-4 ${isLocked ? 'pointer-events-none' : ''}`}>
                    {/* Status Badge Above Title - Hide for Neutral */}
                    {data.status !== 'none' && (
                        <div className="flex justify-start mb-3">
                            <div className={clsx(
                                "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wide",
                                statusInfo.color,
                                "bg-muted/50 border border-border/50"
                            )}>
                                {statusInfo.icon}
                                {statusInfo.label}
                            </div>
                        </div>
                    )}

                    {/* Inline Editing Label */}
                    {isEditingLabel && !isLocked ? (
                        <input
                            ref={labelInputRef}
                            type="text"
                            value={editLabelValue}
                            onChange={(e) => setEditLabelValue(e.target.value)}
                            onBlur={handleLabelSubmit}
                            onKeyDown={handleKeyDown}
                            className={clsx(
                                "w-full bg-transparent text-left font-bold text-lg outline-none border-b border-border p-1 pointer-events-auto font-sans",
                                data.color ? "text-white placeholder:text-white/50 border-white/20" : "text-foreground placeholder:text-muted-foreground"
                            )}
                        />
                    ) : (
                        <div
                            onDoubleClick={(e) => {
                                if (!isLocked) {
                                    e.stopPropagation();
                                    setIsEditingLabel(true);
                                }
                            }}
                            className={clsx(
                                "font-bold text-left text-lg leading-tight transition-colors pointer-events-auto mb-2 font-sans",
                                !isLocked ? "cursor-text" : "cursor-default",
                                data.color ? "text-white" : "text-foreground hover:text-primary"
                            )}
                            title={!isLocked ? "Double click to rename" : "Locked"}
                        >
                            {data.label}
                        </div>
                    )}


                    {/* Description Display */}
                    {data.description && (
                        <div className={clsx(
                            "text-xs text-left line-clamp-3 mt-2 font-sans",
                            data.color
                                ? 'text-white/90'
                                : 'text-muted-foreground'
                        )}>
                            {data.description}
                        </div>
                    )}

                    {/* Note Indicator */}
                    {data.note && data.note.trim() !== '' && data.note !== '<p></p>' && (
                        <div className="flex justify-center mt-4">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    openNotePanel(id);
                                }}
                                className={clsx(
                                    "px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 cursor-pointer transition-colors",
                                    data.color ? "bg-white/20 text-white hover:bg-white/30" : "bg-muted text-muted-foreground hover:bg-muted/80"
                                )}
                            >
                                <FileText size={8} /> Notes
                            </button>
                        </div>
                    )}
                </div>

                {/* Bidirectional Handles */}
                <Handle id="top" type="source" position={Position.Top} className={clsx("!w-2.5 !h-2.5 !-top-1.5 transition-colors hover:!scale-125 !border-none", data.color ? "!bg-white" : "!bg-foreground", (!isConnectable || isLocked || hideHandles) && "opacity-0 pointer-events-none")} />
                <Handle id="bottom" type="source" position={Position.Bottom} className={clsx("!w-2.5 !h-2.5 !-bottom-1.5 transition-colors hover:!scale-125 !border-none", data.color ? "!bg-white" : "!bg-foreground", (!isConnectable || isLocked || hideHandles) && "opacity-0 pointer-events-none")} />
                <Handle id="left" type="source" position={Position.Left} className={clsx("!w-2.5 !h-2.5 !-left-1.5 transition-colors hover:!scale-125 !border-none", data.color ? "!bg-white" : "!bg-foreground", (!isConnectable || isLocked || hideHandles) && "opacity-0 pointer-events-none")} />
                <Handle id="right" type="source" position={Position.Right} className={clsx("!w-2.5 !h-2.5 !-right-1.5 transition-colors hover:!scale-125 !border-none", data.color ? "!bg-white" : "!bg-foreground", (!isConnectable || isLocked || hideHandles) && "opacity-0 pointer-events-none")} />
            </div>
        </>
    );
};

export default memo(CustomNode);
