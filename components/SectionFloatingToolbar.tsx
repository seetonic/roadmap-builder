import { memo, useState } from 'react';
import { useNodes, useReactFlow, useViewport } from '@xyflow/react';
import { Trash2, Lock, Unlock, XCircle } from 'lucide-react';
import { useEditorStore } from '@/lib/store';

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

const SectionFloatingToolbar = () => {
    const nodes = useNodes();
    const { setNodes, deleteElements, getNodes } = useReactFlow();
    const { openDeleteConfirm } = useEditorStore();
    const { x: viewportX, y: viewportY, zoom } = useViewport();
    const [showColorPicker, setShowColorPicker] = useState(false);

    const selectedNodes = nodes.filter(n => n.selected);
    const section = selectedNodes.length === 1 && selectedNodes[0].type === 'section' ? selectedNodes[0] : null;

    if (!section) return null;

    const { id, data, position, measured, width } = section;
    const isLocked = !!data.locked;
    const nodeWidth = measured?.width ?? width ?? 200;

    // Convert world coordinates to screen coordinates
    const screenX = position.x * zoom + viewportX;
    const screenY = position.y * zoom + viewportY;

    const handleColorChange = (color: string) => {
        setNodes((nds) => nds.map((n) => {
            if (n.id === id) {
                return { ...n, data: { ...n.data, color } };
            }
            return n;
        }));
        setShowColorPicker(false);
    };

    const toggleLock = () => {
        setNodes((nds) => nds.map((n) => {
            if (n.id === id) {
                return { ...n, data: { ...n.data, locked: !n.data.locked }, draggable: !!n.data.locked };
            }
            return n;
        }));
    };

    const handleDelete = () => {
        const currentNodes = getNodes();
        const children = currentNodes.filter(n => n.data.parentId === id);

        if (children.length > 0) {
            openDeleteConfirm([id], () => {
                const nodesToDelete = [{ id }, ...children.map(c => ({ id: c.id }))];
                deleteElements({ nodes: nodesToDelete });
            });
        } else {
            deleteElements({ nodes: [{ id }] });
        }
    };

    return (
        <div
            style={{
                position: 'absolute',
                left: screenX + (nodeWidth * zoom) / 2,
                top: screenY - 10,
                transform: 'translate(-50%, -100%)',
                zIndex: 2000,
                pointerEvents: 'all'
            }}
            className="flex gap-1 p-1 bg-popover/80 backdrop-blur-md border border-border/50 rounded-lg shadow-xl mb-2 items-center"
        >
            {isLocked ? (
                <button
                    onClick={toggleLock}
                    className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-muted rounded transition-colors text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                    <Unlock size={14} />
                    <span className="hidden md:inline">Unlock</span>
                </button>
            ) : (
                <>
                    {/* Color Picker */}
                    <div className="relative">
                        <button
                            onClick={() => setShowColorPicker(!showColorPicker)}
                            className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-muted rounded transition-colors text-xs font-medium text-muted-foreground hover:text-foreground"
                        >
                            <div className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: (data.color as string) || '#313131ff' }}></div>
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
                            </div>
                        )}
                    </div>

                    <div className="h-4 w-px bg-border/50 mx-1" />

                    {/* Lock Toggle */}
                    <button
                        onClick={toggleLock}
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
        </div>
    );
};

export default memo(SectionFloatingToolbar);
