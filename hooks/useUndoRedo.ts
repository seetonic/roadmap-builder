import { useState, useCallback } from 'react';
import { Node, Edge } from '@xyflow/react';

interface HistoryItem<NodeType, EdgeType> {
    nodes: NodeType[];
    edges: EdgeType[];
}

export function useUndoRedo<NodeType extends Node = Node, EdgeType extends Edge = Edge>(initialNodes: NodeType[] = [], initialEdges: EdgeType[] = []) {
    const [past, setPast] = useState<HistoryItem<NodeType, EdgeType>[]>([]);
    const [future, setFuture] = useState<HistoryItem<NodeType, EdgeType>[]>([]);

    const takeSnapshot = useCallback((nodes: NodeType[], edges: EdgeType[]) => {
        setPast((oldPast) => {
            // Simple check to avoid duplicate snapshots if nothing changed deep-wise, 
            // but shallow equality might not be enough. 
            // For now, we trust the caller (debounce) to not spam snapshots.
            // Also limit history size if needed (e.g. 50 items).
            const newPast = [...oldPast, { nodes, edges }];
            if (newPast.length > 50) newPast.shift();
            return newPast;
        });
        setFuture([]); // Clear future on new action
    }, []);

    const undo = useCallback((currentNodes: NodeType[], currentEdges: EdgeType[]) => {
        if (past.length === 0) return null;

        const newPast = [...past];
        const previousState = newPast.pop();

        if (!previousState) return null;

        setPast(newPast);
        setFuture((oldFuture) => [{ nodes: currentNodes, edges: currentEdges }, ...oldFuture]);

        return previousState;
    }, [past]);

    const redo = useCallback((currentNodes: NodeType[], currentEdges: EdgeType[]) => {
        if (future.length === 0) return null;

        const newFuture = [...future];
        const nextState = newFuture.shift();

        if (!nextState) return null;

        setFuture(newFuture);
        setPast((oldPast) => [...oldPast, { nodes: currentNodes, edges: currentEdges }]);

        return nextState;
    }, [future]);

    const canUndo = past.length > 0;
    const canRedo = future.length > 0;

    return {
        takeSnapshot,
        undo,
        redo,
        canUndo,
        canRedo,
        past,
        future
    };
}
