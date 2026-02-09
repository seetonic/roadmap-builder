"use client";

import { useReactFlow } from '@xyflow/react';
import { Download, Expand, Minimize, Plus, Layout, List, ArrowLeft, ZoomIn, ZoomOut, Home, Maximize2, EyeOff, Eye, Search, Save, Lock, Undo, Redo, Sparkles } from 'lucide-react';
import { toPng } from 'html-to-image';
import { useEditorStore } from '@/lib/store';
import { useState } from 'react';
import Link from 'next/link';
import { PlanType, PLAN_LIMITS } from '@/lib/usage';
import UpgradeModal from './UpgradeModal';
import { toast } from 'sonner';

interface EditorSidebarProps {
    projectId: string;
    isSaving?: boolean;
    isGuest?: boolean;
    readOnly?: boolean;
    plan?: PlanType;
    nodeCount?: number;
    onUndo?: () => void;
    onRedo?: () => void;
    onSnapshot?: () => void;
    canUndo?: boolean;
    canRedo?: boolean;
    onGenerateAI?: () => void;
}

export default function EditorSidebar({ projectId, isSaving = false, isGuest = false, readOnly = false, plan = 'free', nodeCount = 0, onUndo, onRedo, onSnapshot, canUndo = false, canRedo = false, onGenerateAI }: EditorSidebarProps) {
    const { addNodes, zoomIn, zoomOut, fitView, getNodesBounds, getNodes } = useReactFlow();
    const { hideHandles, setHideHandles, toggleCommandPalette } = useEditorStore();
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    const handleDownload = () => {
        if (isGuest) {
            toast.error("Please login to download your roadmap.");
            window.location.href = "/login";
            return;
        }

        if (!PLAN_LIMITS[plan].canExport) {
            setShowUpgradeModal(true);
            return;
        }

        const selector = '.react-flow__viewport';
        const element = document.querySelector(selector) as HTMLElement;
        if (!element) return;

        // Calculate bounds of all nodes to export the full map, not just viewport
        const nodesBounds = getNodesBounds(getNodes());

        // Add some padding
        const padding = 50;
        const width = nodesBounds.width + padding * 2;
        const height = nodesBounds.height + padding * 2;

        // Transform to bring the graph to 0,0 with padding
        const transform = `translate(${-(nodesBounds.x - padding)}px, ${-(nodesBounds.y - padding)}px) scale(1)`;

        // Hide handles during export for cleaner image
        const styleElement = document.createElement('style');
        styleElement.id = 'export-hide-handles';
        styleElement.textContent = `.react-flow__handle { opacity: 0 !important; }`;
        document.head.appendChild(styleElement);

        toPng(element, {
            backgroundColor: '#09090b',
            width: width,
            height: height,
            style: {
                width: width + 'px',
                height: height + 'px',
                transform: transform,
            }
        })
            .then((dataUrl) => {
                const a = document.createElement('a');
                a.href = dataUrl;
                a.download = 'roadmap.png';
                a.click();
                toast.success('Roadmap downloaded successfully!');
            })
            .catch((err) => {
                console.error('Download failed', err);
                toast.error('Download failed');
            })
            .finally(() => {
                // Restore handle visibility after export
                const style = document.getElementById('export-hide-handles');
                if (style) document.head.removeChild(style);
            });
    };

    const handleSave = () => {
        if (isGuest) {
            toast.error("Please login to save your roadmap.");
            window.location.href = "/login";
        }
        // Normal save is auto-save, but maybe we want a manual trigger?
        // For guests, this is the main interaction point to realize they need to login.
    };

    const handleAddNode = () => {
        if (readOnly) return;

        if (nodeCount >= PLAN_LIMITS[plan].nodesPerRoadmap) {
            setShowUpgradeModal(true);
            return;
        }

        if (onSnapshot) onSnapshot();

        const id = crypto.randomUUID();
        const x = Math.random() * 400 + 100;
        const y = Math.random() * 400 + 100;

        addNodes({
            id,
            position: { x, y },
            data: { label: 'New Task', status: 'todo' },
            type: 'custom',
            zIndex: 1,
        });
    };

    const handleAddSection = () => {
        if (readOnly) return;

        if (nodeCount >= PLAN_LIMITS[plan].nodesPerRoadmap) {
            setShowUpgradeModal(true);
            return;
        }

        if (onSnapshot) onSnapshot();

        const id = crypto.randomUUID();
        const x = Math.random() * 400 + 100;
        const y = Math.random() * 400 + 100;

        addNodes({
            id,
            position: { x, y },
            data: { label: 'Section Name', color: '#71717a' },
            type: 'section',
            style: { width: 300, height: 200 },
            zIndex: -1,
        });
    };

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullScreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullScreen(false);
            }
        }
    };

    return (
        <>
            <div className="fixed z-40 shadow-xl items-center backdrop-blur-md transition-all duration-300 
                left-0 bottom-0 w-full h-16 flex flex-row px-4 py-2 border-t border-border bg-background/80
                md:top-0 md:h-screen md:w-16 md:flex-col md:border-r md:border-t-0 md:py-4 md:px-2 justify-between">

                {/* TOP GROUP: Navigation */}
                <div className="flex flex-row md:flex-col items-center gap-1 md:gap-3">
                    {/* Back to Dashboard */}
                    <Link
                        href={isGuest ? "/" : "/dashboard"}
                        className="p-2 md:p-3 hover:bg-muted rounded-xl transition-colors text-muted-foreground hover:text-foreground relative group"
                        title={isGuest ? "Back to Home" : "Back to Dashboard"}
                    >
                        <Home size={20} />
                        <span className="hidden md:block absolute left-full top-2 ml-2 px-2 py-1 bg-popover text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-border pointer-events-none z-50 text-foreground shadow-md">
                            {isGuest ? "Home" : "Dashboard"}
                        </span>
                    </Link>

                    {/* Auto-saving Indicator / Save Button for Guest */}
                    {isGuest ? (
                        <button
                            onClick={handleSave}
                            className="p-2 md:p-3 hover:bg-muted rounded-xl transition-colors text-yellow-500 hover:text-yellow-600 dark:hover:text-yellow-400 relative group hidden md:block" // Hidden on mobile to save space, or maybe keep?
                            title="Sign in to Save"
                        >
                            <Save size={20} />
                            <span className="hidden md:block absolute left-full top-2 ml-2 px-2 py-1 bg-popover text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-border pointer-events-none z-50 text-foreground shadow-md">
                                Sign in to Save
                            </span>
                        </button>
                    ) : (
                        <div className="relative group hidden md:block">
                            <div className={`p-3 rounded-xl ${isSaving ? 'text-green-500 dark:text-green-400 bg-green-500/10' : 'text-muted-foreground'}`}>
                                <div className="w-2.5 h-2.5 rounded-full bg-current animate-pulse" />
                            </div>
                            <span className="hidden md:block absolute left-full top-2 ml-2 px-2 py-1 bg-popover text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-border pointer-events-none z-50 text-foreground shadow-md">
                                {isSaving ? 'Saving...' : 'Auto-saved'}
                            </span>
                        </div>
                    )}
                </div>

                {/* MIDDLE GROUP: Creation & Utilities */}
                <div className="flex flex-row md:flex-col items-center gap-1 md:gap-3">
                    {/* Creation Tools */}
                    <div className="flex flex-row md:flex-col gap-1 md:gap-2 p-1 bg-muted/20 rounded-2xl border border-border/50">
                        {/* Add Task */}
                        <button
                            onClick={handleAddNode}
                            disabled={readOnly}
                            className={`p-2 md:p-3 rounded-xl transition-colors relative group ${readOnly ? 'opacity-30 cursor-not-allowed text-muted-foreground' : 'hover:bg-muted text-primary hover:text-primary/80'}`}
                            title="Add Task"
                        >
                            <Plus size={20} />
                            {!readOnly && <span className="hidden md:block absolute left-full top-2 ml-2 px-2 py-1 bg-popover text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-border pointer-events-none z-50 text-foreground shadow-md">Add Task</span>}
                        </button>

                        {/* Add Section */}
                        <button
                            onClick={handleAddSection}
                            disabled={readOnly}
                            className={`p-2 md:p-3 rounded-xl transition-colors relative group ${readOnly ? 'opacity-30 cursor-not-allowed text-muted-foreground' : 'hover:bg-muted text-purple-500 hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300'}`}
                            title="Add Section"
                        >
                            <Layout size={20} />
                            {!readOnly && <span className="hidden md:block absolute left-full top-2 ml-2 px-2 py-1 bg-popover text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-border pointer-events-none z-50 text-foreground shadow-md">Add Section</span>}
                        </button>

                        {/* Generate with AI */}
                        <button
                            onClick={onGenerateAI}
                            disabled={readOnly}
                            className={`p-2 md:p-3 rounded-xl transition-colors relative group ${readOnly ? 'opacity-30 cursor-not-allowed text-muted-foreground' : 'hover:bg-muted text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300'}`}
                            title="Generate with AI"
                        >
                            <Sparkles size={20} />
                            {!readOnly && <span className="hidden md:block absolute left-full top-2 ml-2 px-2 py-1 bg-popover text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-border pointer-events-none z-50 text-foreground shadow-md">Generate with AI</span>}
                        </button>
                    </div>

                    {/* Utilities */}
                    {/* Search / Command Palette */}
                    <button
                        onClick={toggleCommandPalette}
                        className="p-2 md:p-3 hover:bg-muted rounded-xl transition-colors text-muted-foreground hover:text-foreground relative group"
                        title="Search"
                    >
                        <Search size={20} />
                        <span className="hidden md:block absolute left-full top-2 ml-2 px-2 py-1 bg-popover text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-border pointer-events-none z-50 text-foreground shadow-md">Search (Ctrl+K)</span>
                    </button>

                    {/* Undo */}
                    <button
                        onClick={onUndo}
                        disabled={!canUndo}
                        className={`p-2 md:p-3 rounded-xl transition-colors relative group ${!canUndo ? 'opacity-30 cursor-not-allowed text-muted-foreground' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo size={20} />
                        <span className="hidden md:block absolute left-full top-2 ml-2 px-2 py-1 bg-popover text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-border pointer-events-none z-50 text-foreground shadow-md">Undo (Ctrl+Z)</span>
                    </button>

                    {/* Redo */}
                    <button
                        onClick={onRedo}
                        disabled={!canRedo}
                        className={`p-2 md:p-3 rounded-xl transition-colors relative group ${!canRedo ? 'opacity-30 cursor-not-allowed text-muted-foreground' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}
                        title="Redo (Ctrl+Y)"
                    >
                        <Redo size={20} />
                        <span className="hidden md:block absolute left-full top-2 ml-2 px-2 py-1 bg-popover text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-border pointer-events-none z-50 text-foreground shadow-md">Redo (Ctrl+Y)</span>
                    </button>

                    {/* Fit to Screen */}
                    <button
                        onClick={() => fitView({ padding: 0.2, duration: 300 })}
                        className="p-2 md:p-3 hover:bg-muted rounded-xl transition-colors text-muted-foreground hover:text-foreground relative group hidden md:block"
                        title="Fit to Screen"
                    >
                        <Maximize2 size={20} />
                        <span className="hidden md:block absolute left-full top-2 ml-2 px-2 py-1 bg-popover text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-border pointer-events-none z-50 text-foreground shadow-md">Fit to Screen</span>
                    </button>

                    {/* Full Screen Toggle */}
                    <button
                        onClick={toggleFullScreen}
                        className="p-2 md:p-3 hover:bg-muted rounded-xl transition-colors text-muted-foreground hover:text-foreground relative group hidden md:block" // Hidden on mobile, usually native works or spaces tight
                        title="Full Screen"
                    >
                        {isFullScreen ? <Minimize size={20} /> : <Expand size={20} />}
                        <span className="hidden md:block absolute left-full top-2 ml-2 px-2 py-1 bg-popover text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-border pointer-events-none z-50 text-foreground shadow-md">
                            {isFullScreen ? "Exit Full Screen" : "Full Screen"}
                        </span>
                    </button>
                </div>


                {/* BOTTOM GROUP: Export & Settings */}
                <div className="flex flex-row md:flex-col items-center gap-1 md:gap-3">
                    {/* Fit to Screen - Mobile Priority */}
                    <button
                        onClick={() => fitView({ padding: 0.2, duration: 300 })}
                        className="p-2 md:p-3 hover:bg-muted rounded-xl transition-colors text-muted-foreground hover:text-foreground relative group md:hidden"
                        title="Fit to Screen"
                    >
                        <Maximize2 size={20} />
                    </button>

                    {/* Object Tree Toggle */}


                    {/* Export PNG */}
                    <button
                        onClick={handleDownload}
                        className="p-2 md:p-3 hover:bg-muted rounded-xl transition-colors text-muted-foreground hover:text-foreground relative group"
                        title="Export PNG"
                    >
                        {!PLAN_LIMITS[plan].canExport && !isGuest && <Lock size={12} className="absolute top-2 right-2 text-primary" />}
                        <Download size={20} className={!PLAN_LIMITS[plan].canExport && !isGuest ? "opacity-50" : ""} />
                        <span className="hidden md:block absolute left-full top-2 ml-2 px-2 py-1 bg-popover text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-border pointer-events-none z-50 text-foreground shadow-md">Export PNG</span>
                    </button>
                </div>
            </div>

            <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
        </>
    );
}
