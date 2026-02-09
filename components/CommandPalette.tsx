"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin } from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import { useEditorStore } from '@/lib/store';

export default function CommandPalette() {
    const [query, setQuery] = useState('');
    const { getNodes, fitView } = useReactFlow();
    const { setSelectedNode, isCommandPaletteOpen, toggleCommandPalette } = useEditorStore();

    const nodes = getNodes().filter(n =>
        n.data.label && (n.data.label as string).toLowerCase().includes(query.toLowerCase())
    );

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                toggleCommandPalette();
            }
            if (e.key === 'Escape' && isCommandPaletteOpen) {
                toggleCommandPalette();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isCommandPaletteOpen, toggleCommandPalette]);

    const handleSelect = (nodeId: string) => {
        setSelectedNode(nodeId);
        fitView({ nodes: [{ id: nodeId }], duration: 800, padding: 2 });
        toggleCommandPalette();
    };

    return (
        <AnimatePresence>
            {isCommandPaletteOpen && (
                <div className="fixed inset-0 z-[100] bg-background/50 backdrop-blur-sm flex items-start justify-center pt-[20vh]" onClick={toggleCommandPalette}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 px-4 border-b border-border">
                            <Search className="text-muted-foreground" size={20} />
                            <input
                                autoFocus
                                placeholder="Search nodes..."
                                className="flex-1 bg-transparent py-4 outline-none text-foreground placeholder:text-muted-foreground/50"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                            <div className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">Esc</div>
                        </div>

                        <div className="max-h-[300px] overflow-y-auto p-2">
                            {nodes.length === 0 ? (
                                <div className="p-4 text-center text-muted-foreground text-sm">No nodes found.</div>
                            ) : (
                                nodes.map((node) => (
                                    <button
                                        key={node.id}
                                        onClick={() => handleSelect(node.id)}
                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-left group"
                                    >
                                        <MapPin size={16} className="text-primary opacity-50 group-hover:opacity-100" />
                                        <span className="flex-1 truncate text-sm font-medium text-foreground">
                                            {(node.data.label as string) || 'Untitled Node'}
                                        </span>
                                        <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded ${node.data.status === 'done' ? 'bg-green-500/10 text-green-500' :
                                            node.data.status === 'in-progress' ? 'bg-blue-500/10 text-blue-500' :
                                                'bg-zinc-500/10 text-zinc-500'
                                            }`}>
                                            {node.data.status as string || 'todo'}
                                        </span>
                                    </button>
                                ))
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
