import { memo, useState, useRef, useEffect } from 'react';
import { NodeProps, NodeResizer, useReactFlow, useStore } from '@xyflow/react';
import { RoadmapNode } from '@/types';
import { Lock } from 'lucide-react';
import { useEditorStore } from '@/lib/store';



const SectionNode = ({ id, data, selected, isConnectable }: NodeProps<RoadmapNode>) => {
    const { setNodes, deleteElements, getNodes } = useReactFlow();
    const [isEditing, setIsEditing] = useState(false);
    const [label, setLabel] = useState(data.label);
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync label
    useEffect(() => {
        setLabel(data.label);
    }, [data.label]);

    // Auto-focus input
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleLabelSubmit = () => {
        setIsEditing(false);
        setNodes((nds) => nds.map((n) => {
            if (n.id === id) {
                return { ...n, data: { ...n.data, label } };
            }
            return n;
        }));
    };

    const bgColor = data.color || '#313131ff';
    const isLocked = !!data.locked;


    return (
        <>
            <NodeResizer
                isVisible={selected && !isLocked}
                minWidth={100}
                minHeight={100}
                lineClassName="border-primary"
                handleClassName="h-5 w-5 bg-primary border-2 border-background rounded-sm shadow-lg"
                handleStyle={{
                    width: '8px',
                    height: '8px',
                }}
            />



            <div
                className="w-full h-full rounded-3xl transition-all duration-300 group flex flex-col p-4 relative backdrop-blur-md bg-black/20 border-2"
                style={{
                    backgroundColor: bgColor + '20', // Low opacity background
                    borderColor: bgColor,
                    boxShadow: selected ? `0 0 30px -5px ${bgColor}` : 'none'
                }}
            >
                {/* Lock Indicator */}
                {isLocked && (
                    <div className="absolute top-2 right-2 p-1.5 bg-background/20 rounded-md text-white/50 backdrop-blur-sm z-10">
                        <Lock size={14} />
                    </div>
                )}

                {/* Label Container */}
                <div className="mb-auto pointer-events-none">
                    {/* Input needs pointer events */}
                    {isEditing && !isLocked ? (
                        <input
                            ref={inputRef}
                            type="text"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            onBlur={handleLabelSubmit}
                            onKeyDown={(e) => e.key === 'Enter' && handleLabelSubmit()}
                            className="bg-transparent text-sm font-bold outline-none border-b border-white text-white w-full placeholder:text-white/50 pointer-events-auto font-sans"
                        />
                    ) : (
                        <div
                            onDoubleClick={() => !isLocked && setIsEditing(true)}
                            className={`text-sm font-bold text-white transition-colors pointer-events-auto inline-block font-sans ${!isLocked && 'cursor-text hover:text-white/80'}`}
                        >
                            {label}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default memo(SectionNode);
