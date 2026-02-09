"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { X, Eye, Edit2, Sparkles, MessageSquare, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEditorStore } from '@/lib/store';
import { useReactFlow } from '@xyflow/react';
import { clsx } from 'clsx';
import NodeAIEnhancer from './ai/NodeAIEnhancer';
import NodeAIChatPanel from './ai/NodeAIChatPanel';
import { aiStorage } from '@/lib/aiStorage';
import { useParams } from 'next/navigation';
import { ChatMessage } from '@/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

export default function NotePanel() {
    const params = useParams();
    const roadmapId = params?.id as string;
    const { isNotePanelOpen, selectedNodeId, closeNotePanel, activeNotePanelTab, openNotePanel } = useEditorStore();
    const { getNode, setNodes, setEdges, getNodes } = useReactFlow();
    const [width, setWidth] = useState(400);
    const [isResizing, setIsResizing] = useState(false);
    const [isPreview, setIsPreview] = useState(false);

    // Local state for textarea content to prevent lag
    const [localContent, setLocalContent] = useState('');

    const node = selectedNodeId ? getNode(selectedNodeId) : null;
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Sync local content with node data when node changes
    useEffect(() => {
        if (selectedNodeId && node) {
            const nodeContent = (node.data?.note as string) || '';
            setLocalContent(nodeContent);
            setIsPreview(false); // Reset to edit mode when switching nodes
        }
    }, [selectedNodeId]);

    // Debounced save to React Flow state
    const debouncedSave = useCallback((content: string) => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
            if (!selectedNodeId) return;

            setNodes((nds) =>
                nds.map((n) => {
                    if (n.id === selectedNodeId) {
                        return {
                            ...n,
                            data: { ...n.data, note: content },
                        };
                    }
                    return n;
                })
            );
        }, 300); // Save after 300ms of no typing
    }, [selectedNodeId, setNodes]);

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newContent = e.target.value;

        // Update local state immediately for responsive typing
        setLocalContent(newContent);

        // Debounced save to avoid performance issues
        debouncedSave(newContent);
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    // Resizing Logic
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            const newWidth = window.innerWidth - e.clientX;
            if (newWidth > 300 && newWidth < 800) {
                setWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    const handleApplyEnhancement = (enhancedData: { title: string; description: string; notes: string }) => {
        if (!selectedNodeId || !node) return;

        // Store original content for AI tracking
        const originalContent = {
            title: (node.data.label as string) || '',
            description: (node.data.description as string) || '',
            notes: getTextFromHtml(localContent)
        };

        setNodes((nds) => nds.map((n) => {
            if (n.id === selectedNodeId) {
                return {
                    ...n,
                    data: {
                        ...n.data,
                        label: enhancedData.title,
                        description: enhancedData.description,
                        note: `<p>${enhancedData.notes.replace(/\n/g, '<br>')}</p>`,
                        aiEnhanced: true
                    }
                };
            }
            return n;
        }));

        // Update local content
        setLocalContent(`<p>${enhancedData.notes.replace(/\n/g, '<br>')}</p>`);

        // Save AI enhancement to database
        if (roadmapId) {
            aiStorage.saveNodeEnhancement(
                roadmapId,
                selectedNodeId,
                originalContent,
                enhancedData
            ).catch(err => console.error('Failed to save AI enhancement:', err));
        }

        // Switch back to edit tab to see changes
        openNotePanel(selectedNodeId, 'edit');
    };



    const handleExpand = (children: { title: string; description: string; notes: string }[]) => {
        if (!selectedNodeId || !node) return;

        const parentPos = node.position;
        const newNodes: any[] = [];
        const newEdges: any[] = [];

        // Get all existing nodes for collision detection
        const existingNodes = getNodes();

        // Calculate initial positioning
        const baseX = parentPos.x + 450; // Horizontal offset to the right
        const spacingY = 250; // Vertical spacing between children (increased for better spacing)
        const nodeHeight = 150; // Approximate height of a node (including margin)

        // Find nodes that might overlap in the target area
        const checkCollision = (x: number, y: number): boolean => {
            return existingNodes.some(n => {
                if (n.id === selectedNodeId) return false; // Skip parent node

                const dx = Math.abs(n.position.x - x);
                const dy = Math.abs(n.position.y - y);

                // If nodes are too close (within 300px horizontally and 220px vertically), it's a collision
                return dx < 300 && dy < 220;
            });
        };

        // Calculate optimal starting Y position
        let startY = parentPos.y - ((children.length - 1) * spacingY) / 2;

        // Adjust positions if there are collisions
        let adjustedX = baseX;
        let attempts = 0;
        const maxAttempts = 5;

        // Try to find a clear horizontal position
        while (attempts < maxAttempts) {
            let hasCollision = false;

            for (let i = 0; i < children.length; i++) {
                const testY = startY + i * spacingY;
                if (checkCollision(adjustedX, testY)) {
                    hasCollision = true;
                    break;
                }
            }

            if (!hasCollision) break;

            // Move further to the right if collision detected
            adjustedX += 150;
            attempts++;
        }

        children.forEach((child, index) => {
            const id = crypto.randomUUID();
            const yPos = startY + index * spacingY;

            newNodes.push({
                id,
                type: 'custom',
                position: { x: adjustedX, y: yPos },
                data: {
                    label: child.title,
                    description: child.description,
                    note: child.notes,
                    status: 'todo',
                    isSubNode: true
                }
            });

            // Connect using right handle of parent and left handle of child
            newEdges.push({
                id: `e-${selectedNodeId}-${id}`,
                source: selectedNodeId,
                sourceHandle: 'right', // Use right handle of parent
                target: id,
                targetHandle: 'left', // Use left handle of child
                type: 'default',
                data: { lineStyle: 'dotted' }
            });
        });

        setNodes((nds) => [...nds, ...newNodes]);
        setEdges((eds) => [...eds, ...newEdges]);

        // Save AI expansion to database
        if (roadmapId) {
            const parentContent = {
                title: (node.data.label as string) || '',
                description: (node.data.description as string) || '',
                notes: getTextFromHtml(localContent)
            };

            aiStorage.saveNodeExpansion(
                roadmapId,
                selectedNodeId,
                parentContent,
                children
            ).catch(err => console.error('Failed to save AI expansion:', err));
        }
    };

    const handleUpdateChatHistory = (newHistory: ChatMessage[]) => {
        if (!selectedNodeId) return;

        setNodes((nds) => nds.map((n) => {
            if (n.id === selectedNodeId) {
                return {
                    ...n,
                    data: { ...n.data, chatHistory: newHistory }
                };
            }
            return n;
        }));
    };

    if (!isNotePanelOpen) return null;

    return (
        <AnimatePresence>
            {isNotePanelOpen && (
                <motion.div
                    initial={{ x: '100%', opacity: 0 }}
                    animate={{ x: 0, opacity: 1, width }}
                    exit={{ x: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200, duration: 0.3 }}
                    style={{ width }}
                    className="absolute right-0 top-0 h-full border-l border-border z-[100] flex flex-col shadow-2xl backdrop-blur-xl bg-background/95"
                >
                    {/* Resize Handle */}
                    <div
                        onMouseDown={() => setIsResizing(true)}
                        className="absolute left-0 top-0 w-1 h-full cursor-ew-resize hover:bg-primary/50 transition-colors z-[60]"
                    />

                    <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
                        <div className="font-semibold text-lg flex items-center gap-2 text-foreground">
                            {(node?.data?.label as string) || 'Node Details'}
                        </div>
                        <button
                            onClick={closeNotePanel}
                            className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex p-2 gap-1 border-b border-border shrink-0">
                        <button
                            onClick={() => selectedNodeId && openNotePanel(selectedNodeId, 'edit')}
                            className={clsx(
                                "flex-1 py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors",
                                activeNotePanelTab === 'edit' ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                            )}
                        >
                            <FileText size={14} />
                            <span>Markdown</span>
                        </button>
                        <button
                            onClick={() => selectedNodeId && openNotePanel(selectedNodeId, 'enhance')}
                            className={clsx(
                                "flex-1 py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors",
                                activeNotePanelTab === 'enhance' ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                            )}
                        >
                            <Sparkles size={14} />
                            <span>AI Enhance</span>
                        </button>
                        <button
                            onClick={() => selectedNodeId && openNotePanel(selectedNodeId, 'chat')}
                            className={clsx(
                                "flex-1 py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors",
                                activeNotePanelTab === 'chat' ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                            )}
                        >
                            <MessageSquare size={14} />
                            <span>Chat</span>
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-hidden relative bg-background">
                        {/* Markdown Editor Mode */}
                        <div className={clsx("absolute inset-0 flex flex-col transition-opacity duration-200", activeNotePanelTab === 'edit' ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none")}>
                            {/* Edit/Preview Toggle */}
                            <div className="flex items-center justify-end p-2 border-b border-border shrink-0 bg-muted/30">
                                <div className="flex bg-muted rounded-lg p-1 gap-1">
                                    <button
                                        onClick={() => setIsPreview(false)}
                                        className={clsx(
                                            "px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5",
                                            !isPreview ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                                        )}
                                    >
                                        <Edit2 size={14} />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => setIsPreview(true)}
                                        className={clsx(
                                            "px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5",
                                            isPreview ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                                        )}
                                    >
                                        <Eye size={14} />
                                        Preview
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
                                {isPreview ? (
                                    <div className="prose dark:prose-invert max-w-none text-sm text-foreground">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            rehypePlugins={[rehypeRaw]}
                                            components={{
                                                a: ({ ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" />,
                                                h1: ({ ...props }) => <h1 {...props} className="text-2xl font-bold mt-4 mb-2 text-foreground" />,
                                                h2: ({ ...props }) => <h2 {...props} className="text-xl font-bold mt-3 mb-2 text-foreground" />,
                                                h3: ({ ...props }) => <h3 {...props} className="text-lg font-semibold mt-3 mb-1 text-foreground" />,
                                                ul: ({ ...props }) => <ul {...props} className="list-disc pl-5 my-2 text-foreground/90" />,
                                                ol: ({ ...props }) => <ol {...props} className="list-decimal pl-5 my-2 text-foreground/90" />,
                                                p: ({ ...props }) => <p {...props} className="my-2 leading-relaxed text-foreground/80" />,
                                                blockquote: ({ ...props }) => <blockquote {...props} className="border-l-4 border-primary/50 pl-4 italic opacity-80" />,
                                                strong: ({ ...props }) => <strong {...props} className="font-bold text-foreground" />,
                                                em: ({ ...props }) => <em {...props} className="italic text-foreground" />,
                                                code: ({ ...props }) => <code {...props} className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-foreground" />,
                                            }}
                                        >
                                            {localContent || '*No content to preview*'}
                                        </ReactMarkdown>
                                    </div>
                                ) : (
                                    <textarea
                                        ref={textareaRef}
                                        value={localContent}
                                        onChange={handleContentChange}
                                        className="w-full h-full bg-transparent border-none resize-none focus:outline-none text-sm font-mono leading-relaxed placeholder:text-muted-foreground/50 text-foreground"
                                        placeholder="Type markdown here...
            
NOTE: Add a space after # for headings.
            
Examples:
# Heading 1
## Heading 2
**Bold Text**
- List item"
                                        spellCheck={false}
                                    />
                                )}
                            </div>
                        </div>

                        {/* AI Enhance Mode */}
                        <div className={clsx("absolute inset-0 flex flex-col p-4 overflow-y-auto transition-opacity duration-200", activeNotePanelTab === 'enhance' ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none")}>
                            {selectedNodeId && node && (
                                <NodeAIEnhancer
                                    nodeId={selectedNodeId}
                                    currentTitle={(node.data.label as string) || ''}
                                    currentDescription={(node.data.description as string) || ''}
                                    currentNotes={getTextFromHtml(localContent)}
                                    onApply={handleApplyEnhancement}
                                    onExpand={handleExpand}
                                    onCancel={() => selectedNodeId && openNotePanel(selectedNodeId, 'edit')}
                                />
                            )}
                        </div>

                        {/* Chat Mode */}
                        <div className={clsx("absolute inset-0 flex flex-col overflow-hidden transition-opacity duration-200", activeNotePanelTab === 'chat' ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none")}>
                            {selectedNodeId && node && (
                                <NodeAIChatPanel
                                    nodeId={selectedNodeId}
                                    nodeTitle={(node.data.label as string) || ''}
                                    nodeDescription={(node.data.description as string) || ''}
                                    nodeNotes={getTextFromHtml(localContent)}
                                    chatHistory={(node.data.chatHistory as ChatMessage[]) || []}
                                    onUpdateHistory={handleUpdateChatHistory}
                                />
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// Helper to get text content from potentially mixed HTML/Markdown
function getTextFromHtml(html: string) {
    if (!html) return "";
    // If it looks like HTML, stripping tags might be useful for legacy notes,
    // but for markdown we generally want the raw text.
    // However, NodeAIEnhancer likely expects plain text to enhance.
    // A simple heuristic: if it contains tags, strip them.
    if (html.includes('<') && html.includes('>')) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || "";
    }
    return html;
}
