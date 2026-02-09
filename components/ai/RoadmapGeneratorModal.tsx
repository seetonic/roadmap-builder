"use client";

import { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { RoadmapNode, RoadmapEdge } from '@/types';

interface RoadmapGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (nodes: RoadmapNode[], edges: RoadmapEdge[]) => void;
}

export default function RoadmapGeneratorModal({
    isOpen,
    onClose,
    onGenerate
}: RoadmapGeneratorModalProps) {
    const [input, setInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!input.trim()) {
            setError('Please enter a description');
            return;
        }

        setIsGenerating(true);
        setError('');

        try {
            const response = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: input })
            });

            if (!response.ok) {
                throw new Error('Failed to generate roadmap');
            }

            const { nodes, edges } = await response.json();
            onGenerate(nodes, edges);
            onClose();
            setInput('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Generation failed');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            handleGenerate();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-lg">
                            <Sparkles className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">AI Roadmap Generator</h2>
                            <p className="text-sm text-muted-foreground">Describe your roadmap, AI will create it</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        disabled={isGenerating}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Describe your roadmap
                        </label>
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Example: Create a roadmap for launching a SaaS product with phases for research, development, testing, and launch..."
                            className="w-full h-40 px-4 py-3 bg-muted border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                            disabled={isGenerating}
                            autoFocus
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                            Tip: Press Ctrl+Enter to generate
                        </p>
                    </div>

                    {error && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive flex items-start gap-2">
                            <span className="text-lg">⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || !input.trim()}
                            className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    Generate Roadmap
                                </>
                            )}
                        </button>
                        <button
                            onClick={onClose}
                            disabled={isGenerating}
                            className="px-6 py-3 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
