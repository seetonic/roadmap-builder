import { useReactFlow, EdgeProps, MarkerType } from '@xyflow/react';
import { Minus, MoreHorizontal, ArrowRight } from 'lucide-react';
import React from 'react';

type LineStyle = 'solid' | 'dashed' | 'dotted';

interface EdgeToolbarProps {
    edgeId: string;
    position: { x: number; y: number };
    currentStyle?: LineStyle;
    hasArrow?: boolean;
}

export default function EdgeToolbar({ edgeId, position, currentStyle = 'dashed', hasArrow = false }: EdgeToolbarProps) {
    const { setEdges } = useReactFlow();

    const handleStyleChange = (style: LineStyle) => {
        setEdges((edges) => edges.map((edge) => {
            if (edge.id === edgeId) {
                return { ...edge, data: { ...edge.data, lineStyle: style } };
            }
            return edge;
        }));
    };

    const toggleArrow = () => {
        setEdges((edges) => edges.map((edge) => {
            if (edge.id === edgeId) {
                return {
                    ...edge,
                    markerEnd: !hasArrow ? { type: MarkerType.ArrowClosed } : undefined,
                    data: { ...edge.data, hasArrow: !hasArrow }
                };
            }
            return edge;
        }));
    };

    const styles: { type: LineStyle; icon: React.ReactElement; label: string }[] = [
        { type: 'solid', icon: <Minus size={16} />, label: 'Solid' },
        { type: 'dashed', icon: <Minus size={16} strokeDasharray="4 2" />, label: 'Dashed' },
        { type: 'dotted', icon: <MoreHorizontal size={16} />, label: 'Dotted' },
    ];

    return (
        <div
            className="absolute flex gap-1 p-1 bg-black/80 backdrop-blur-md border border-white/10 rounded-lg shadow-xl z-50 items-center nodrag nopan"
            style={{
                left: position.x,
                top: position.y - 40,
                transform: 'translate(-50%, -100%)',
                pointerEvents: 'all',
            }}
        >
            {styles.map(({ type, icon, label }) => (
                <button
                    key={type}
                    onClick={() => handleStyleChange(type)}
                    className={`flex items-center gap-1.5 px-2 py-1.5 hover:bg-white/10 rounded transition-colors text-xs font-medium ${currentStyle === type
                        ? 'bg-white/20 text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                    title={label}
                >
                    {icon}
                    {label}
                </button>
            ))}

            <div className="w-px h-4 bg-white/10 mx-1" />

            <button
                onClick={toggleArrow}
                className={`flex items-center gap-1.5 px-2 py-1.5 hover:bg-white/10 rounded transition-colors text-xs font-medium ${hasArrow
                    ? 'bg-white/20 text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                title="Toggle Arrow"
            >
                <ArrowRight size={16} />
                Arrow
            </button>
        </div>
    );
}
