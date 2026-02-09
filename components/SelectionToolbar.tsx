import { memo, useState } from 'react';
import { useReactFlow, Panel, useNodes, useEdges, MarkerType } from '@xyflow/react';
import { Trash2, Lock, Unlock, XCircle, Minus, MoreHorizontal, ArrowRight } from 'lucide-react';
import { useEditorStore } from '@/lib/store';
import { clsx } from 'clsx';
import { RoadmapNode } from '@/types';

const COLORS = [
    '#991b1b', // Red
    '#9a3412', // Orange
    '#854d0e', // Yellow
    '#166534', // Green
    '#164e63', // Cyan
    '#1e40af', // Blue
    '#5b21b6', // Violet
    '#9d174d', // Pink
    '#27272a', // Gray
];

type LineStyle = 'solid' | 'dashed' | 'dotted';

const SelectionToolbar = () => {
    const nodes = useNodes();
    const edges = useEdges();
    const { setNodes, setEdges, deleteElements } = useReactFlow();
    const { openDeleteConfirm } = useEditorStore();
    const [showColorPicker, setShowColorPicker] = useState<false | 'node' | 'edge'>(false);

    const selectedNodes = nodes.filter((n) => n.selected);
    const selectedEdges = edges.filter((e) => e.selected);
    const selectedNodeCount = selectedNodes.length;
    const selectedEdgeCount = selectedEdges.length;

    // Only show if 2 or more items are selected (nodes + edges combined)
    const totalSelected = selectedNodeCount + selectedEdgeCount;
    if (totalSelected < 2) {
        return null;
    }

    // Edge handlers
    const handleEdgeStyleChange = (style: LineStyle) => {
        setEdges((eds) => eds.map((edge) => {
            if (edge.selected) {
                return { ...edge, data: { ...edge.data, lineStyle: style } };
            }
            return edge;
        }));
    };

    const toggleEdgeArrow = () => {
        setEdges((eds) => eds.map((edge) => {
            if (edge.selected) {
                const hasArrow = edge.data?.hasArrow ?? false;
                return {
                    ...edge,
                    markerEnd: !hasArrow ? { type: MarkerType.ArrowClosed } : undefined,
                    data: { ...edge.data, hasArrow: !hasArrow }
                };
            }
            return edge;
        }));
    };

    const handleEdgeColorChange = (color: string) => {
        setEdges((eds) => eds.map((edge) => {
            if (edge.selected) {
                return {
                    ...edge,
                    style: { ...edge.style, stroke: color || 'var(--muted-foreground)' }
                };
            }
            return edge;
        }));
        setShowColorPicker(false);
    };

    // Node handlers
    const handleNodeColorChange = (color: string) => {
        setNodes((nds) => nds.map((n) => {
            if (n.selected) {
                return { ...n, data: { ...n.data, color } };
            }
            return n;
        }));
        setShowColorPicker(false);
    };

    const toggleLock = () => {
        const anyUnlocked = selectedNodes.some(n => !n.data.locked);
        const newState = anyUnlocked;

        setNodes((nds) => nds.map((n) => {
            if (n.selected) {
                return {
                    ...n,
                    draggable: !newState,
                    data: { ...n.data, locked: newState }
                };
            }
            return n;
        }));
    };

    const handleDelete = () => {
        const sections = selectedNodes.filter(n => n.type === 'section');
        const hasSection = sections.length > 0;

        const deleteAction = () => {
            deleteElements({ nodes: selectedNodes, edges: selectedEdges });
        };

        if (hasSection) {
            openDeleteConfirm(sections.map(s => s.id), deleteAction);
        } else {
            deleteAction();
        }
    };

    const allLocked = selectedNodes.every(n => n.data.locked);

    // Determine current edge style (use first selected edge as reference)
    const currentEdgeStyle = (selectedEdges[0]?.data?.lineStyle as LineStyle) || 'dashed';
    const currentEdgeHasArrow = selectedEdges[0]?.data?.hasArrow ?? false;

    const lineStyles: { type: LineStyle; icon: React.ReactElement; label: string }[] = [
        { type: 'solid', icon: <Minus size={14} />, label: 'Solid' },
        { type: 'dashed', icon: <Minus size={14} strokeDasharray="4 2" />, label: 'Dashed' },
        { type: 'dotted', icon: <MoreHorizontal size={14} />, label: 'Dotted' },
    ];

    return (
        <Panel position="top-center" className="mt-16">
            <div className="flex items-center gap-1 p-1 bg-popover/80 backdrop-blur-md border border-border/50 rounded-lg shadow-xl animate-in fade-in slide-in-from-top-5">
                <div className="px-2 text-xs font-semibold text-muted-foreground border-r border-border/50 mr-1">
                    {selectedNodeCount > 0 && `${selectedNodeCount} node${selectedNodeCount > 1 ? 's' : ''}`}
                    {selectedNodeCount > 0 && selectedEdgeCount > 0 && ', '}
                    {selectedEdgeCount > 0 && `${selectedEdgeCount} edge${selectedEdgeCount > 1 ? 's' : ''}`}
                </div>

                {/* Show edge controls if edges are selected */}
                {selectedEdgeCount > 0 && (
                    <>
                        {/* Edge Type Dropdown */}
                        {lineStyles.map(({ type, icon, label }) => (
                            <button
                                key={type}
                                onClick={() => handleEdgeStyleChange(type)}
                                className={`flex items-center gap-1.5 px-2 py-1.5 hover:bg-muted rounded transition-colors text-xs font-medium ${currentEdgeStyle === type
                                    ? 'bg-muted text-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                title={label}
                            >
                                {icon}
                                <span className="hidden md:inline">{label}</span>
                            </button>
                        ))}

                        <div className="h-4 w-px bg-border/50 mx-1" />

                        {/* Arrow Toggle */}
                        <button
                            onClick={toggleEdgeArrow}
                            className={`flex items-center gap-1.5 px-2 py-1.5 hover:bg-muted rounded transition-colors text-xs font-medium ${currentEdgeHasArrow
                                ? 'bg-muted text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                            title="Toggle Arrow"
                        >
                            <ArrowRight size={14} />
                            <span className="hidden md:inline">Arrow</span>
                        </button>

                        <div className="h-4 w-px bg-border/50 mx-1" />
                    </>
                )}

                {/* Separate Color Pickers for Nodes and Edges */}
                {selectedNodeCount > 0 && (
                    <div className="relative">
                        <button
                            onClick={() => setShowColorPicker(showColorPicker === 'node' ? false : 'node')}
                            className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-muted rounded transition-colors text-xs font-medium text-muted-foreground hover:text-foreground"
                        >
                            <div className="w-3 h-3 rounded-full border border-border bg-transparent"></div>
                            <span className="hidden md:inline">Node Color</span>
                        </button>
                        {showColorPicker === 'node' && (
                            <div className="absolute left-0 top-full mt-2 p-2 bg-popover border border-border rounded-lg shadow-xl grid grid-cols-3 gap-1 w-24 z-50 animate-in fade-in zoom-in-95">
                                {COLORS.map((c) => (
                                    <button
                                        key={c}
                                        onClick={() => handleNodeColorChange(c)}
                                        className="w-6 h-6 rounded-full border border-border/50 hover:scale-110 transition-transform"
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                                <button
                                    onClick={() => handleNodeColorChange('')}
                                    className="w-6 h-6 rounded-full border border-border/50 hover:scale-110 transition-transform bg-card flex items-center justify-center text-[10px]"
                                    title="Default"
                                >
                                    <XCircle size={10} className="opacity-50" />
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {selectedEdgeCount > 0 && (
                    <div className="relative">
                        <button
                            onClick={() => setShowColorPicker(showColorPicker === 'edge' ? false : 'edge')}
                            className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-muted rounded transition-colors text-xs font-medium text-muted-foreground hover:text-foreground"
                        >
                            <div className="w-3 h-3 rounded-sm border border-border bg-transparent"></div>
                            <span className="hidden md:inline">Edge Color</span>
                        </button>
                        {showColorPicker === 'edge' && (
                            <div className="absolute left-0 top-full mt-2 p-2 bg-popover border border-border rounded-lg shadow-xl grid grid-cols-3 gap-1 w-24 z-50 animate-in fade-in zoom-in-95">
                                {COLORS.map((c) => (
                                    <button
                                        key={c}
                                        onClick={() => handleEdgeColorChange(c)}
                                        className="w-6 h-6 rounded-full border border-border/50 hover:scale-110 transition-transform"
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                                <button
                                    onClick={() => handleEdgeColorChange('')}
                                    className="w-6 h-6 rounded-full border border-border/50 hover:scale-110 transition-transform bg-card flex items-center justify-center text-[10px]"
                                    title="Default"
                                >
                                    <XCircle size={10} className="opacity-50" />
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Show node-specific controls only if nodes are selected */}
                {selectedNodeCount > 0 && (
                    <>
                        <div className="h-4 w-px bg-border/50 mx-1" />

                        {/* Lock Toggle */}
                        <button
                            onClick={toggleLock}
                            className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-muted rounded transition-colors text-xs font-medium text-muted-foreground hover:text-foreground"
                        >
                            {allLocked ? <Lock size={14} /> : <Unlock size={14} />}
                            <span className="hidden md:inline">{allLocked ? 'Unlock' : 'Lock'}</span>
                        </button>
                    </>
                )}

                <div className="h-4 w-px bg-border/50 mx-1" />

                {/* Delete Button */}
                <button
                    onClick={handleDelete}
                    className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-red-500/10 rounded transition-colors text-xs font-medium text-muted-foreground hover:text-red-500"
                >
                    <Trash2 size={14} />
                    <span className="hidden md:inline">Delete</span>
                </button>
            </div>
        </Panel>
    );
};

export default memo(SelectionToolbar);
