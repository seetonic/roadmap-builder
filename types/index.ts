
import { Node, Edge } from '@xyflow/react';

export type NodeStatus = 'none' | 'todo' | 'in-progress' | 'done' | 'remove';

export interface RoadmapNodeData extends Record<string, unknown> {
    label: string;
    status?: NodeStatus;
    color?: string;
    note?: string;
    description?: string;
    locked?: boolean;
    // AI Fields
    aiGenerated?: boolean;
    aiEnhanced?: boolean;
    chatHistory?: ChatMessage[];
}

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: number;
}

export type RoadmapNode = Node<RoadmapNodeData>;
export type RoadmapEdge = Edge;

export interface ProjectMetadata {
    id: string;
    name: string;
    description?: string;
    lastModified: number;
    createdAt: number;
    userId: string; // Owner ID
    visibility: 'private' | 'public';
}

export interface ProjectData {
    nodes: RoadmapNode[];
    edges: RoadmapEdge[];
    metadata: ProjectMetadata; // Include metadata in the full project data
}

