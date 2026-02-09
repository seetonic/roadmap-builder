"use client";

import { useState } from 'react';
import { Sparkles, Loader2, Check, X, Network, RotateCw } from 'lucide-react';

interface NodeAIEnhancerProps {
    nodeId: string;
    currentTitle: string;
    currentDescription?: string;
    currentNotes?: string;
    onApply: (data: { title: string; description: string; notes: string }) => void;
    onExpand: (children: { title: string; description: string; notes: string }[]) => void;
    onCancel: () => void;
}

export default function NodeAIEnhancer({
    nodeId,
    currentTitle,
    currentDescription = '',
    currentNotes = '',
    onApply,
    onExpand,
    onCancel
}: NodeAIEnhancerProps) {
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [enhanced, setEnhanced] = useState<{
        title: string;
        description: string;
        notes: string;
    } | null>(null);
    const [error, setError] = useState('');

    const [isExpanding, setIsExpanding] = useState(false);
    const [expandedNodes, setExpandedNodes] = useState<{
        title: string;
        description: string;
        notes: string;
    }[] | null>(null);

    const handleEnhance = async () => {
        setIsEnhancing(true);
        setError('');
        setExpandedNodes(null); // Clear expansion preview when enhancing

        try {
            const response = await fetch('/api/ai/enhance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: currentTitle,
                    description: currentDescription,
                    notes: currentNotes
                })
            });

            if (!response.ok) throw new Error('Failed to enhance');

            const result = await response.json();
            setEnhanced(result);
        } catch (err) {
            console.error(err);
            setError('Failed to enhance content. Please try again.');
        } finally {
            setIsEnhancing(false);
        }
    };

    const handleExpand = async () => {
        setIsExpanding(true);
        setError('');
        setEnhanced(null); // Clear enhancement preview when expanding

        try {
            const response = await fetch('/api/ai/expand', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: currentTitle,
                    description: currentDescription,
                    notes: currentNotes
                })
            });

            if (!response.ok) throw new Error('Failed to expand');

            const { childNodes } = await response.json();

            if (childNodes && childNodes.length > 0) {
                setExpandedNodes(childNodes);
            } else {
                setError('No suggested topics found to expand.');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to expand node. Please try again.');
        } finally {
            setIsExpanding(false);
        }
    };

    const handleApplyExpansion = () => {
        if (expandedNodes) {
            onExpand(expandedNodes);
        }
    };

    const handleCancelPreview = () => {
        setEnhanced(null);
        setExpandedNodes(null);
        setError('');
    };

    return (
        <div className="p-4 bg-muted/50 border border-border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">AI Assistant</span>
                </div>
                <button onClick={onCancel} className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {!enhanced && !expandedNodes && !isEnhancing && !isExpanding && (
                <div className="flex gap-2">
                    <button
                        onClick={handleEnhance}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-sm"
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        Enhance Content
                    </button>
                    <button
                        onClick={handleExpand}
                        className="flex-1 px-4 py-2 bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 border border-purple-500/20 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <Network className="w-3.5 h-3.5" />
                        Expand (Branch)
                    </button>
                </div>
            )}

            {(isEnhancing || isExpanding) && (
                <div className="flex flex-col items-center justify-center py-6 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <p className="text-xs text-muted-foreground">
                        {isEnhancing ? 'Optimizing content...' : 'Generating sub-topics...'}
                    </p>
                </div>
            )}

            {/* Enhancement Preview */}
            {enhanced && (
                <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-3 bg-background border border-border rounded-lg space-y-2 text-sm shadow-sm">
                        <div>
                            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Title</p>
                            <p className="font-medium">{enhanced.title}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Description</p>
                            <p className="text-muted-foreground">{enhanced.description}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Notes</p>
                            <div className="max-h-32 overflow-y-auto pr-1">
                                <pre className="text-xs whitespace-pre-wrap text-muted-foreground font-sans">{enhanced.notes}</pre>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => onApply(enhanced)}
                            className="flex-1 px-4 py-2 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 border border-green-500/20"
                        >
                            <Check className="w-4 h-4" />
                            Apply
                        </button>
                        <button
                            onClick={handleEnhance}
                            className="px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors border border-border flex items-center gap-2"
                        >
                            <RotateCw className="w-3.5 h-3.5" />
                            Regenerate
                        </button>
                        <button
                            onClick={handleCancelPreview}
                            className="px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors border border-border"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Expansion Preview */}
            {expandedNodes && (
                <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                    <div className="space-y-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Generated Sub-Topics ({expandedNodes.length})</p>
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                            {expandedNodes.map((child, index) => (
                                <div key={index} className="p-3 bg-background border border-border rounded-lg space-y-1.5 text-sm shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                                        <p className="font-medium text-sm">{child.title}</p>
                                    </div>
                                    {child.description && (
                                        <p className="text-xs text-muted-foreground pl-3.5">{child.description}</p>
                                    )}
                                    {child.notes && (
                                        <div className="pl-3.5">
                                            <p className="text-[10px] text-muted-foreground/70 line-clamp-2">{child.notes}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleApplyExpansion}
                            className="flex-1 px-4 py-2 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 border border-green-500/20"
                        >
                            <Check className="w-4 h-4" />
                            Apply
                        </button>
                        <button
                            onClick={handleExpand}
                            className="px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors border border-border flex items-center gap-2"
                        >
                            <RotateCw className="w-3.5 h-3.5" />
                            Regenerate
                        </button>
                        <button
                            onClick={handleCancelPreview}
                            className="px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors border border-border"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive flex items-center gap-2">
                    <span className="text-lg">⚠️</span>
                    {error}
                </div>
            )}
        </div>
    );
}
