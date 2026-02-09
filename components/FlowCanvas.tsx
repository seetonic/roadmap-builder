"use client";

import { useCallback, useEffect, useState } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    Node,
    ReactFlowProvider,
    BackgroundVariant,
    NodeTypes,
    ConnectionMode
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { storage } from '@/lib/storage';
import { createClient } from '@/lib/supabase/client'; // Import Supabase Client
import { RoadmapNode, RoadmapEdge } from '@/types';
import CustomNode from './CustomNode';
import SectionNode from './SectionNode';
import CustomEdge from './CustomEdge';
import NotePanel from './NotePanel';
import SelectionToolbar from './SelectionToolbar';
import SectionFloatingToolbar from './SectionFloatingToolbar';

import EditorSidebar from './EditorSidebar';
import CommandPalette from './CommandPalette';
import ZoomControls from './ZoomControls';
import { useEditorStore } from '@/lib/store';
import ProfileButton from './auth/ProfileButton';
import ShareModal from './ShareModal';
import { ProjectMetadata } from '@/types';
import { Share2, Lock } from 'lucide-react'; // Import icons
import { getUserPlan, PlanType, PLAN_LIMITS, checkRoadmapLimit } from '@/lib/usage';
import UpgradeModal from './UpgradeModal';
import ConfirmModal from './ConfirmModal';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import RoadmapGeneratorModal from './ai/RoadmapGeneratorModal';

import RateLimitIndicator from './RateLimitIndicator';
import { ThemeToggle } from '@/components/ThemeToggle';

const nodeTypes: NodeTypes = {
    custom: CustomNode,
    section: SectionNode,
};

const edgeTypes = {
    default: CustomEdge,
    smoothstep: CustomEdge, // Alias for compatibility
};

const defaultNodes: RoadmapNode[] = [
    {
        id: 'origin',
        type: 'custom',
        data: { label: 'Start Roadmap', status: 'done' },
        position: { x: 250, y: 250 },
    },
];

function FlowCanvasAll({ projectId }: { projectId: string }) {
    const [nodes, setNodes, onNodesChange] = useNodesState<RoadmapNode>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<RoadmapEdge>([]);
    const [initialized, setInitialized] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { setSelectedNode, openNotePanel } = useEditorStore();
    const [isGuest, setIsGuest] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);
    const [projectMetadata, setProjectMetadata] = useState<ProjectMetadata | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [currentPlan, setCurrentPlan] = useState<PlanType>('free');
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const { deleteConfirmation, closeDeleteConfirm } = useEditorStore();
    const [showAIGenerator, setShowAIGenerator] = useState(false);
    const [usage, setUsage] = useState({ current: 0, limit: Infinity });

    // Undo/Redo Hook
    const { takeSnapshot, undo, redo, canUndo, canRedo, past, future } = useUndoRedo<RoadmapNode, RoadmapEdge>();

    // Initial Load
    useEffect(() => {
        const load = async () => {
            // Check if Guest (by ID 'demo' or actual auth check if we want to be robust)
            // For now, let's treat 'demo' or 'guest' as explicit guest mode loops, 
            // BUT also check real auth for normal IDs to be safe? 
            // Actually, if middleware allows /roadmap/[id] without auth, we MUST check auth here.
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setIsGuest(true);
                setNodes(defaultNodes);
                setInitialized(true);
                return;
            }

            // If user exists but we are on 'demo' route, maybe still treat as new/temp?
            // Let's assume 'demo' is always a fresh start.
            if (projectId === 'demo') {
                setNodes(defaultNodes);
                setInitialized(true);
                return;
            }

            const [data, plan, limitInfo] = await Promise.all([
                storage.getProjectData(projectId),
                getUserPlan(user.id),
                checkRoadmapLimit(user.id)
            ]);

            setCurrentPlan(plan);
            setUsage({ current: limitInfo.current, limit: limitInfo.limit });

            if (data) {
                // Restore nodes with their original types preserved
                const restoredNodes = data.nodes.map(n => ({
                    ...n,
                    type: n.type || 'custom', // Preserve existing type, default to 'custom' only if missing
                    zIndex: n.type === 'section' ? -1 : 1
                })) as RoadmapNode[];
                setNodes(restoredNodes);
                setEdges(data.edges);
                setProjectMetadata(data.metadata);
            } else {
                setNodes(defaultNodes);
            }
            if (user) setCurrentUserId(user.id);
            setInitialized(true);
        };
        load();
    }, [projectId, setNodes, setEdges]);

    // Auto-save (Disabled for Guest)
    useEffect(() => {
        if (!initialized || isGuest) return; // Skip if guest

        const timer = setTimeout(async () => {
            if (nodes.length > 0) {
                setIsSaving(true);
                await storage.saveProjectData(projectId, { nodes, edges });
                setIsSaving(false);
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [nodes, edges, projectId, initialized, isGuest]);

    const onConnect = useCallback(
        (params: Connection) => {
            if (PLAN_LIMITS && edges.length >= PLAN_LIMITS[currentPlan].edgesPerRoadmap) {
                setShowUpgradeModal(true);
                return;
            }
            takeSnapshot(nodes, edges);
            setEdges((eds) => addEdge(params, eds));
        },
        [setEdges, edges, currentPlan, nodes, takeSnapshot],
    );

    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        setSelectedNode(node.id);
    }, [setSelectedNode]);

    const onPaneClick = useCallback(() => {
        setSelectedNode(null);
    }, [setSelectedNode]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Delete' || event.key === 'Backspace') {
                // Get selected edges and delete them
                const selectedEdges = edges.filter(e => e.selected);
                if (selectedEdges.length > 0) {
                    takeSnapshot(nodes, edges);
                    setEdges((edges) => edges.filter((edge) => !edge.selected));
                }
            }

            // Select All (Ctrl+A / Cmd+A)
            if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
                event.preventDefault();
                setNodes((nds) => nds.map((node) => ({ ...node, selected: true })));
                setEdges((eds) => eds.map((edge) => ({ ...edge, selected: true })));
            }

            // Undo/Redo Shortcuts
            if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
                event.preventDefault();
                const previousState = undo(nodes, edges);
                if (previousState) {
                    setNodes(previousState.nodes);
                    setEdges(previousState.edges);
                }
            }

            if ((event.ctrlKey || event.metaKey) && event.key === 'y') {
                event.preventDefault();
                const nextState = redo(nodes, edges);
                if (nextState) {
                    setNodes(nextState.nodes);
                    setEdges(nextState.edges);
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [setEdges, setNodes, nodes, edges, undo, redo, takeSnapshot]);

    // Determine permissions
    const isDemo = projectId === 'demo';
    const canEdit = isDemo || (currentUserId && projectMetadata && currentUserId === projectMetadata.userId);
    // If we are loading (not initialized), don't show anything specific yet, but default assumes readOnly until proven otherwise?
    // Actually simpler: if !canEdit and initialized, it's read only.
    const isReadOnly = initialized && !canEdit;

    if (!initialized) return <div className="flex h-full items-center justify-center text-muted-foreground animate-pulse">Loading Roadmap...</div>;

    return (
        <div className="h-full w-full relative overflow-hidden bg-background">
            {/* Sidebar */}
            <EditorSidebar
                projectId={projectId}
                isSaving={isSaving}
                isGuest={isGuest}
                readOnly={isReadOnly}
                plan={currentPlan}
                nodeCount={nodes.length}
                canUndo={canUndo}
                canRedo={canRedo}
                onUndo={() => {
                    const previousState = undo(nodes, edges);
                    if (previousState) {
                        setNodes(previousState.nodes);
                        setEdges(previousState.edges);
                    }
                }}
                onRedo={() => {
                    const nextState = redo(nodes, edges);
                    if (nextState) {
                        setNodes(nextState.nodes);
                        setEdges(nextState.edges);
                    }
                }}
                onSnapshot={() => takeSnapshot(nodes, edges)}
                onGenerateAI={() => setShowAIGenerator(true)}
            />

            <ReactFlow
                proOptions={{ hideAttribution: true }}
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                fitView
                snapToGrid={true}
                snapGrid={[24, 24]}
                nodesDraggable={!isLocked && !isReadOnly}
                nodesConnectable={!isLocked && !isReadOnly}
                elementsSelectable={!isLocked} /* Allow selecting in read only? Maybe to copy? Yes. */
                connectionMode={ConnectionMode.Loose}
                className="bg-background"
                elevateNodesOnSelect={false}
                defaultEdgeOptions={{ type: 'default', zIndex: 1000, data: { lineStyle: 'dashed' }, style: { strokeWidth: 2, stroke: 'var(--muted-foreground)' } }}
                onNodeDragStart={() => {
                    // Optional: could snapshot start state? 
                    // Better to snapshot BEFORE changes happen. React Flow handles this a bit async.
                    // For drag, best to snapshot on STOP if position changed, but we need previous state.
                    // A simple approach is snapshotting on DragStart.
                    takeSnapshot(nodes, edges);
                }}
                // We might need to handle onNodesDelete too for nodes deletion via backspace (handled by ReactFlow default?)
                // Actually we handled Backspace manually for edges, but ReactFlow handles Node deletion by default if we use `onNodesChange`.
                // We should intercept deletions.
                onNodesDelete={(deletedNodes) => {
                    // Snapshot already taken? We can't easily hook into "before delete" in onNodesChange easily without effect.
                    // But onNodesDelete calls AFTER selection but BEFORE removal? Or AFTER removal?
                    // Documentation says "called when nodes are deleted".
                    // For state management, `onNodesChange` does the actual deletion.
                    // To capture state BEFORE delete, we need to do it when user presses delete, which we handle in KeyDown?
                    // But ReactFlow also has built-in delete.
                    // Let's rely on manual snapshotting for now where we control it (Buttons).
                    // For Dragging:
                }}
                minZoom={0.1}
            >
                <Background variant={BackgroundVariant.Dots} gap={32} size={1} className="opacity-50" color="#808080" />



                <NotePanel />
                <SelectionToolbar />
                <SectionFloatingToolbar />

                <CommandPalette />
                <ZoomControls />

                <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
                    {/* Rate Limit Indicator */}
                    <RateLimitIndicator usage={usage} plan={currentPlan} compact />
                    {/* View Only Badge */}
                    {isReadOnly && (
                        <div className="px-3 py-1.5 bg-popover/80 backdrop-blur-md border border-border/50 rounded-full flex items-center gap-2 text-xs font-medium text-muted-foreground shadow-lg">
                            <Lock size={12} /> View Only
                        </div>
                    )}

                    {/* Share Button (Owner Only) */}
                    {!isReadOnly && projectMetadata && (
                        <button
                            onClick={() => setShareOpen(true)}
                            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 flex items-center gap-2"
                        >
                            <Share2 size={16} /> Share
                        </button>
                    )}

                    <ThemeToggle />
                    <ProfileButton isGuest={isGuest} />
                </div>

                {projectMetadata && (
                    <ShareModal isOpen={shareOpen} onClose={() => setShareOpen(false)} project={projectMetadata} plan={currentPlan} />
                )}
            </ReactFlow>

            <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />

            <ConfirmModal
                isOpen={deleteConfirmation.isOpen}
                onClose={closeDeleteConfirm}
                onConfirm={() => {
                    deleteConfirmation.onConfirm?.();
                    closeDeleteConfirm();
                }}
                title="Delete Warning"
                message="This section contains tasks. Deleting it will also delete all tasks inside. Are you sure?"
                confirmText="Delete All"
                type="danger"
            />

            <RoadmapGeneratorModal
                isOpen={showAIGenerator}
                onClose={() => setShowAIGenerator(false)}
                onGenerate={(newNodes, newEdges) => {
                    takeSnapshot(nodes, edges);
                    setNodes((prev) => [...prev, ...newNodes]);
                    setEdges((prev) => [...prev, ...newEdges]);
                }}
            />
        </div >
    );
}

export default function FlowCanvas(props: { projectId: string }) {
    return (
        <ReactFlowProvider>
            <FlowCanvasAll {...props} />
        </ReactFlowProvider>
    );
}
