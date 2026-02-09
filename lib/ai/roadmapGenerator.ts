import { generateContent } from './gemini';
import { ROADMAP_GENERATION_PROMPT } from './prompts';
import { RoadmapNode, RoadmapEdge } from '@/types';
import { MarkerType } from '@xyflow/react';

import dagre from 'dagre';

const nodeWidth = 300;
const nodeHeight = 150; // Increased height to prevent overlap

// Improved collision resolution helper with multiple iterations
const resolveNodeCollisions = (nodes: RoadmapNode[]): RoadmapNode[] => {
    const padding = 30; // Minimum spacing between nodes
    let resolvedNodes = [...nodes];
    const maxIterations = 5; // Run multiple passes to resolve all collisions

    for (let iteration = 0; iteration < maxIterations; iteration++) {
        let hasCollision = false;

        for (let i = 0; i < resolvedNodes.length; i++) {
            for (let j = i + 1; j < resolvedNodes.length; j++) {
                const nodeA = resolvedNodes[i];
                const nodeB = resolvedNodes[j];

                // Calculate actual overlap using node dimensions
                const dx = Math.abs(nodeA.position.x - nodeB.position.x);
                const dy = Math.abs(nodeA.position.y - nodeB.position.y);
                const minDistX = nodeWidth + padding;
                const minDistY = nodeHeight + padding;

                if (dx < minDistX && dy < minDistY) {
                    hasCollision = true;

                    // Calculate how much they overlap
                    const overlapX = minDistX - dx;
                    const overlapY = minDistY - dy;

                    // Push them apart in the direction with less overlap (easier to resolve)
                    const pushX = nodeB.position.x - nodeA.position.x;
                    const pushY = nodeB.position.y - nodeA.position.y;

                    if (overlapX < overlapY) {
                        // Push apart horizontally
                        const shift = (overlapX / 2) + padding;
                        nodeB.position.x += pushX > 0 ? shift : -shift;
                    } else {
                        // Push apart vertically
                        const shift = (overlapY / 2) + padding;
                        nodeB.position.y += pushY > 0 ? shift : -shift;
                    }
                }
            }
        }

        // If no collisions detected, we're done
        if (!hasCollision) break;
    }

    return resolvedNodes;
};

const getLayoutedElements = (nodes: RoadmapNode[], edges: RoadmapEdge[]) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    // Separation: Identify Main Chain vs Sub/Child Nodes
    // We rely on the 'isSubNode' flag from AI, or fallback to heuristics if missing
    const mainNodes = nodes.filter(n => !n.data?.isSubNode);
    const subNodes = nodes.filter(n => n.data?.isSubNode);

    // 1. Layout Main Chain (Vertical Spine)
    dagreGraph.setGraph({
        rankdir: 'TB',
        ranker: 'network-simplex', // Keeps vertical spine straighter
        nodesep: 80,
        ranksep: 150 // Increased to prevent main chain overlap
    });

    mainNodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    // Only add edges that connect main nodes
    edges.forEach((edge) => {
        const isMainSource = mainNodes.find(n => n.id === edge.source);
        const isMainTarget = mainNodes.find(n => n.id === edge.target);
        if (isMainSource && isMainTarget) {
            dagreGraph.setEdge(edge.source, edge.target);
        }
    });

    dagre.layout(dagreGraph);

    // Apply Dagre positions to Main Nodes
    mainNodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        node.position = {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - nodeHeight / 2,
        };
    });


    // 2. Calculate children per parent and their required vertical space
    const subNodeSpacingX = 150; // Horizontal gap from parent
    const subNodeSpacingY = 80;  // Vertical gap between sibling sub-nodes

    // Group sub-nodes by their parent
    const childrenByParent: Record<string, RoadmapNode[]> = {};

    subNodes.forEach((node) => {
        const incomingEdge = edges.find(e => e.target === node.id);
        const parentId = incomingEdge?.source;
        if (parentId) {
            if (!childrenByParent[parentId]) childrenByParent[parentId] = [];
            childrenByParent[parentId].push(node);
        }
    });

    // Calculate the vertical extent each parent needs based on its children
    const parentExtents: Record<string, { minY: number; maxY: number; childCount: number }> = {};

    mainNodes.forEach((parent) => {
        const children = childrenByParent[parent.id] || [];
        const childCount = children.length;

        if (childCount === 0) {
            parentExtents[parent.id] = { minY: 0, maxY: 0, childCount: 0 };
        } else {
            // Calculate how many children on each side (alternating)
            const rightChildren = Math.ceil(childCount / 2);
            const leftChildren = Math.floor(childCount / 2);
            const maxSideChildren = Math.max(rightChildren, leftChildren);

            // Total vertical extent needed for this parent's children
            const childrenHeight = (maxSideChildren - 1) * (nodeHeight + subNodeSpacingY);
            const halfExtent = childrenHeight / 2;

            parentExtents[parent.id] = {
                minY: -halfExtent - nodeHeight / 2,
                maxY: halfExtent + nodeHeight / 2,
                childCount
            };
        }
    });

    // 3. Adjust parent positions to prevent child overlap
    const sortedMainNodes = [...mainNodes].sort((a, b) => a.position.y - b.position.y);

    for (let i = 1; i < sortedMainNodes.length; i++) {
        const prevParent = sortedMainNodes[i - 1];
        const currentParent = sortedMainNodes[i];

        const prevExtent = parentExtents[prevParent.id];
        const currentExtent = parentExtents[currentParent.id];

        // Calculate minimum safe Y position for current parent
        const prevBottomY = prevParent.position.y + prevExtent.maxY;
        const currentTopY = currentParent.position.y + currentExtent.minY;

        const minGap = 60; // Minimum gap between child groups

        if (currentTopY < prevBottomY + minGap) {
            const pushDown = (prevBottomY + minGap) - currentTopY;
            currentParent.position.y += pushDown;
        }
    }

    // 4. Position Sub Nodes (Horizontal Ribs) centered on their parents

    // Map to track sub-nodes per parent for stacking
    const parentSubNodeCount: Record<string, number> = {};

    subNodes.forEach((node) => {
        const incomingEdge = edges.find(e => e.target === node.id);
        const parentId = incomingEdge?.source;
        const parent = mainNodes.find(n => n.id === parentId);

        if (parent) {
            if (parentSubNodeCount[parentId!] === undefined) parentSubNodeCount[parentId!] = 0;
            const index = parentSubNodeCount[parentId!];
            parentSubNodeCount[parentId!]++;

            const totalChildren = childrenByParent[parentId!].length;
            const rightChildren = Math.ceil(totalChildren / 2);
            const leftChildren = Math.floor(totalChildren / 2);

            // Alternate sides: Even index -> Right, Odd index -> Left
            const isRightSide = index % 2 === 0;
            const sideIndex = Math.floor(index / 2); // Index within that side

            const offsetX = isRightSide
                ? (nodeWidth + subNodeSpacingX)
                : -(nodeWidth + subNodeSpacingX);

            // Center children vertically around parent
            const maxSideChildren = Math.max(rightChildren, leftChildren);
            const totalHeight = (maxSideChildren - 1) * (nodeHeight + subNodeSpacingY);
            const startY = parent.position.y - (totalHeight / 2);

            const offsetY = startY - parent.position.y + (sideIndex * (nodeHeight + subNodeSpacingY));

            node.position = {
                x: parent.position.x + offsetX,
                y: parent.position.y + offsetY
            };
        } else {
            // Orphan sub-node? Place at 0,0 or near last main node
            node.position = { x: 0, y: 0 };
        }
    });

    // Combined nodes list with new positions
    let layoutedNodes = [...mainNodes, ...subNodes];

    // Apply collision resolution to prevent overlapping
    layoutedNodes = resolveNodeCollisions(layoutedNodes);

    // 3. Configure Edges (Styles & Handles)
    edges.forEach((edge) => {
        const sourceNode = layoutedNodes.find(n => n.id === edge.source);
        const targetNode = layoutedNodes.find(n => n.id === edge.target);

        if (!sourceNode || !targetNode) return;

        const isSourceMain = !sourceNode.data?.isSubNode;
        const isTargetMain = !targetNode.data?.isSubNode;

        // Main -> Main (Vertical Spine)
        if (isSourceMain && isTargetMain) {
            edge.sourceHandle = 'bottom';
            edge.targetHandle = 'top';
            edge.data = { ...edge.data, lineStyle: 'dashed', hasArrow: true }; // Enforce dashed
        }
        // Main -> Sub (Horizontal branching)
        else if (isSourceMain && !isTargetMain) {
            // Determine side based on exact geometric position
            const isRight = targetNode.position.x > sourceNode.position.x;

            if (isRight) {
                edge.sourceHandle = 'right';
                edge.targetHandle = 'left';
            } else {
                edge.sourceHandle = 'left';
                edge.targetHandle = 'right';
            }

            edge.data = { ...edge.data, lineStyle: 'dotted', hasArrow: true }; // Enforce dotted
        }
        // Sub -> Sub (Linear flow within a branch?) or other cases
        else {
            // Fallback to "Smart" relative logic
            const dx = targetNode.position.x - sourceNode.position.x;
            const dy = targetNode.position.y - sourceNode.position.y;
            if (Math.abs(dx) > Math.abs(dy)) {
                edge.sourceHandle = dx > 0 ? 'right' : 'left';
                edge.targetHandle = dx > 0 ? 'left' : 'right';
            } else {
                edge.sourceHandle = dy > 0 ? 'bottom' : 'top';
                edge.targetHandle = dy > 0 ? 'top' : 'bottom';
            }
        }
    });

    return { nodes: layoutedNodes, edges };
};

export async function generateRoadmapFromText(userInput: string): Promise<{
    nodes: RoadmapNode[];
    edges: RoadmapEdge[];
}> {
    if (!userInput.trim()) {
        throw new Error('Please provide a description');
    }

    try {
        const prompt = ROADMAP_GENERATION_PROMPT.replace('{USER_INPUT}', userInput);
        const response = await generateContent(prompt);

        // Clean response - remove markdown code blocks if present
        const cleanedResponse = response
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        // Parse JSON
        const parsed = JSON.parse(cleanedResponse);

        // Validate structure
        if (!parsed.nodes || !Array.isArray(parsed.nodes)) {
            throw new Error('Invalid response structure');
        }

        // Sanitize and validate nodes
        let nodes: RoadmapNode[] = parsed.nodes.map((node: any, index: number) => ({
            id: node.id || `ai-node-${Date.now()}-${index}`,
            type: 'custom', // Force custom type as defined in project
            data: {
                label: node.data?.label || 'Untitled',
                // Enforce Rule: First node is Neutral ('none'), others are 'todo'
                status: index === 0 ? 'none' : 'todo',
                description: node.data?.description || '',
                note: node.data?.notes || '', // Map notes to note field in project types
                aiGenerated: true,
                isSubNode: !!node.data?.isSubNode // Capture sub-node flag
            },
            position: { x: 0, y: 0 } // Placeholder, will be set by layout
        }));

        // Sanitize and validate edges
        const edges: RoadmapEdge[] = (parsed.edges || []).map((edge: any, index: number) => ({
            id: edge.id || `ai-edge-${Date.now()}-${index}`,
            source: edge.source,
            target: edge.target,
            type: edge.type || 'default',
            markerEnd: { type: MarkerType.ArrowClosed },
            data: {
                // Use AI provided style (dotted/dashed/solid) or default to dashed
                lineStyle: edge.data?.lineStyle || 'dashed',
                hasArrow: true
            }
        }));

        // Apply automatic layout
        return getLayoutedElements(nodes, edges);

    } catch (error) {
        console.error('Roadmap generation error:', error);
        if (error instanceof SyntaxError) {
            throw new Error('AI returned invalid format. Please try again.');
        }
        throw new Error('Failed to generate roadmap. Please try again.');
    }
}
