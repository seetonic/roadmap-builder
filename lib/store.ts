
import { create } from 'zustand';


interface DeleteConfirmState {
    isOpen: boolean;
    nodeIds: string[];
    onConfirm: (() => void) | null;
}

interface EditorState {
    selectedNodeId: string | null;

    isNotePanelOpen: boolean;
    isCommandPaletteOpen: boolean;
    activeNotePanelTab: 'edit' | 'enhance' | 'chat';
    hideHandles: boolean;
    deleteConfirmation: DeleteConfirmState;

    toggleCommandPalette: () => void;
    setSelectedNode: (id: string | null) => void;
    openNotePanel: (nodeId: string, tab?: 'edit' | 'enhance' | 'chat') => void;
    closeNotePanel: () => void;
    setHideHandles: (hide: boolean) => void;
    openDeleteConfirm: (nodeIds: string[], onConfirm: () => void) => void;
    closeDeleteConfirm: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
    selectedNodeId: null,

    isNotePanelOpen: false,
    activeNotePanelTab: 'edit',
    isCommandPaletteOpen: false,
    hideHandles: false,
    deleteConfirmation: {
        isOpen: false,
        nodeIds: [],
        onConfirm: null,
    },

    toggleCommandPalette: () => set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),
    setSelectedNode: (id) => set({ selectedNodeId: id }),
    openNotePanel: (nodeId, tab = 'edit') => set({ isNotePanelOpen: true, selectedNodeId: nodeId, activeNotePanelTab: tab }),
    closeNotePanel: () => set({ isNotePanelOpen: false, selectedNodeId: null }),
    setHideHandles: (hide) => set({ hideHandles: hide }),
    openDeleteConfirm: (nodeIds, onConfirm) => set({
        deleteConfirmation: {
            isOpen: true,
            nodeIds,
            onConfirm,
        },
    }),
    closeDeleteConfirm: () => set({
        deleteConfirmation: {
            isOpen: false,
            nodeIds: [],
            onConfirm: null,
        },
    }),
}));

