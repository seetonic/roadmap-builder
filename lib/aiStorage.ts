import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export interface AIGenerationRecord {
    id?: string;
    user_id?: string;
    roadmap_id?: string;
    generation_type: 'roadmap' | 'enhancement' | 'expansion';
    input_data: any;
    output_data: any;
    model_used?: string;
    tokens_used?: number;
    created_at?: string;
}

export const aiStorage = {
    /**
     * Save AI roadmap generation to database
     */
    saveRoadmapGeneration: async (
        roadmapId: string,
        inputPrompt: string,
        outputNodes: any[],
        outputEdges: any[]
    ) => {
        const { data: { user } } = await supabase.auth.getUser();

        const record: AIGenerationRecord = {
            user_id: user?.id,
            roadmap_id: roadmapId,
            generation_type: 'roadmap',
            input_data: {
                prompt: inputPrompt
            },
            output_data: {
                nodes: outputNodes,
                edges: outputEdges
            },
            model_used: 'gemini-1.5-flash'
        };

        const { error } = await supabase
            .from('ai_generations')
            .insert(record);

        if (error) {
            console.error('Failed to save AI roadmap generation:', error);
        }
    },

    /**
     * Save AI node enhancement to database
     */
    saveNodeEnhancement: async (
        roadmapId: string,
        nodeId: string,
        originalContent: { title: string; description: string; notes: string },
        enhancedContent: { title: string; description: string; notes: string }
    ) => {
        const { data: { user } } = await supabase.auth.getUser();

        const record: AIGenerationRecord = {
            user_id: user?.id,
            roadmap_id: roadmapId,
            generation_type: 'enhancement',
            input_data: {
                node_id: nodeId,
                original_title: originalContent.title,
                original_description: originalContent.description,
                original_notes: originalContent.notes
            },
            output_data: {
                enhanced_title: enhancedContent.title,
                enhanced_description: enhancedContent.description,
                enhanced_notes: enhancedContent.notes
            },
            model_used: 'gemini-1.5-flash'
        };

        const { error } = await supabase
            .from('ai_generations')
            .insert(record);

        if (error) {
            console.error('Failed to save AI node enhancement:', error);
        }
    },

    /**
     * Save AI node expansion to database
     */
    saveNodeExpansion: async (
        roadmapId: string,
        parentNodeId: string,
        parentContent: { title: string; description: string; notes: string },
        childNodes: { title: string; description: string; notes: string }[]
    ) => {
        const { data: { user } } = await supabase.auth.getUser();

        const record: AIGenerationRecord = {
            user_id: user?.id,
            roadmap_id: roadmapId,
            generation_type: 'expansion',
            input_data: {
                parent_node_id: parentNodeId,
                parent_title: parentContent.title,
                parent_description: parentContent.description,
                parent_notes: parentContent.notes
            },
            output_data: {
                child_nodes: childNodes
            },
            model_used: 'gemini-1.5-flash'
        };

        const { error } = await supabase
            .from('ai_generations')
            .insert(record);

        if (error) {
            console.error('Failed to save AI node expansion:', error);
        }
    },

    /**
     * Get AI generation history for a roadmap
     */
    getGenerationHistory: async (roadmapId: string) => {
        const { data, error } = await supabase
            .from('ai_generations')
            .select('*')
            .eq('roadmap_id', roadmapId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Failed to fetch AI generation history:', error);
            return [];
        }

        return data;
    },

    /**
     * Get user's AI usage statistics
     */
    getUserStats: async () => {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return null;

        const { data, error } = await supabase
            .from('ai_generations')
            .select('generation_type, created_at')
            .eq('user_id', user.id);

        if (error) {
            console.error('Failed to fetch user AI stats:', error);
            return null;
        }

        return {
            total: data.length,
            roadmaps: data.filter(g => g.generation_type === 'roadmap').length,
            enhancements: data.filter(g => g.generation_type === 'enhancement').length,
            expansions: data.filter(g => g.generation_type === 'expansion').length
        };
    }
};
