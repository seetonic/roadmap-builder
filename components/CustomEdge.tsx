import { useState, useRef, useEffect, memo } from 'react';
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getSmoothStepPath, useReactFlow, useNodes, useEdges } from '@xyflow/react';
import EdgeToolbar from './EdgeToolbar';

const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, data, selected, markerEnd }: EdgeProps) => {
    const { setEdges } = useReactFlow();
    const [isEditing, setIsEditing] = useState(false);
    const [label, setLabel] = useState((data?.label as string) || '');
    const inputRef = useRef<HTMLInputElement>(null);

    const [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    // Sync label from data
    useEffect(() => {
        setLabel((data?.label as string) || '');
    }, [data?.label]);

    const handleLabelSubmit = () => {
        setIsEditing(false);
        setEdges((edges) => edges.map((edge) => {
            if (edge.id === id) {
                return { ...edge, data: { ...edge.data, label } };
            }
            return edge;
        }));
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(true);
    };

    // Get line style from edge data
    const lineStyle = (data?.lineStyle as 'solid' | 'dashed' | 'dotted') || 'dashed';
    const isAnimated = lineStyle !== 'solid';

    const getStrokeDasharray = () => {
        switch (lineStyle) {
            case 'dashed': return '5 5';
            case 'dotted': return '2 2';
            default: return undefined;
        }
    };

    const hasArrow = (data?.hasArrow as boolean) ?? false;

    // Count total selected items (nodes + edges)
    const nodes = useNodes();
    const edges = useEdges();
    const selectedNodeCount = nodes.filter(n => n.selected).length;
    const selectedEdgeCount = edges.filter(e => e.selected).length;
    const totalSelected = selectedNodeCount + selectedEdgeCount;

    // Show EdgeToolbar only when this single edge is selected and no other items are selected
    const showEdgeToolbar = selected && totalSelected === 1;

    return (
        <>
            <BaseEdge
                path={edgePath}
                markerEnd={markerEnd}
                style={{
                    ...style,
                    strokeWidth: selected ? 3 : 2,
                    cursor: 'pointer',
                    strokeDasharray: getStrokeDasharray(),
                    animation: isAnimated ? 'dashdraw 0.5s linear infinite' : 'none',
                }}
                onDoubleClick={handleDoubleClick}
            />
            <EdgeLabelRenderer>
                {/* Show EdgeToolbar only for single edge selection */}
                {showEdgeToolbar && (
                    <EdgeToolbar
                        edgeId={id}
                        position={{ x: labelX, y: labelY }}
                        currentStyle={lineStyle}
                        hasArrow={hasArrow}
                    />
                )}
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        fontSize: 11,
                        pointerEvents: 'all',
                        zIndex: 1000,
                    }}
                    className="nodrag nopan"
                    onDoubleClick={handleDoubleClick}
                >
                    {isEditing ? (
                        <input
                            ref={inputRef}
                            type="text"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            onBlur={handleLabelSubmit}
                            onKeyDown={(e) => {
                                e.stopPropagation();
                                if (e.key === 'Enter') {
                                    handleLabelSubmit();
                                } else if (e.key === 'Escape') {
                                    setLabel((data?.label as string) || '');
                                    setIsEditing(false);
                                }
                            }}
                            className="px-2 py-1 bg-background border border-primary rounded text-xs outline-none text-foreground min-w-[120px] shadow-lg"
                            placeholder="Edge label..."
                        />
                    ) : label ? (
                        <div
                            className="px-2 py-1 bg-background border border-white/20 rounded text-xs cursor-pointer hover:border-primary/50 transition-colors shadow-lg"
                            title="Double click to edit"
                        >
                            {label}
                        </div>
                    ) : selected ? (
                        <div
                            className="px-2 py-1 bg-popover/70 backdrop-blur-sm border border-white/10 rounded text-xs cursor-pointer hover:bg-popover transition-colors text-muted-foreground italic shadow-md"
                            title="Double click to add label"
                        >
                            Click to label
                        </div>
                    ) : null}
                </div>
            </EdgeLabelRenderer>
        </>
    );
};

export default memo(CustomEdge);
