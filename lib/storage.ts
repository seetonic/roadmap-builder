
import { ProjectData, ProjectMetadata } from '@/types';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export const storage = {
    // List all projects
    getProjects: async (): Promise<ProjectMetadata[]> => {
        const { data, error } = await supabase
            .from('roadmaps')
            .select('id, name, description, updated_at, created_at, user_id, visibility')
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Failed to fetch projects (full error):', JSON.stringify(error, null, 2));
            console.error('Error details:', {
                message: error.message,
                hint: error.hint,
                details: error.details,
                code: error.code
            });
            return [];
        }

        return data.map((d: any) => ({
            id: d.id,
            name: d.name,
            description: d.description,
            lastModified: new Date(d.updated_at).getTime(),
            createdAt: new Date(d.created_at).getTime(),
            userId: d.user_id,
            visibility: d.visibility,
        }));
    },

    // Create a new project
    createProject: async (name: string, description?: string, initialNodes?: any[], initialEdges?: any[]): Promise<string | null> => {
        const initialData = {
            nodes: initialNodes || [],
            edges: initialEdges || [],
        };

        const { data: { user } } = await supabase.auth.getUser();

        const { data, error } = await supabase
            .from('roadmaps')
            .insert({
                name,
                description,
                content: initialData,
                user_id: user?.id
            })
            .select('id')
            .single();

        if (error) {
            console.error('Failed to create project:', error);
            return null;
        }

        return data.id;
    },

    // Get specific project data
    getProjectData: async (projectId: string): Promise<ProjectData | null> => {
        const { data, error } = await supabase
            .from('roadmaps')
            .select('*')
            .eq('id', projectId)
            .single();

        if (error || !data) {
            console.error('Failed to load project data:', error);
            return null;
        }

        // Merge content with metadata for the return type
        const content = data.content as any;
        return {
            nodes: content.nodes || [],
            edges: content.edges || [],
            metadata: {
                id: data.id,
                name: data.name,
                description: data.description,
                lastModified: new Date(data.updated_at).getTime(),
                createdAt: new Date(data.created_at).getTime(),
                userId: data.user_id,
                visibility: data.visibility
            }
        };
    },

    // Share Project
    shareProject: async (projectId: string, visibility: 'private' | 'public', emails: string[]) => {
        // Update visibility
        const { error: visError } = await supabase
            .from('roadmaps')
            .update({ visibility })
            .eq('id', projectId);

        if (visError) throw visError;

        // Update shared emails if provided (simple add for now)
        // For a real app, we might want to sync/remove old ones too, but let's just add new ones.
        if (emails.length > 0) {
            const shares = emails.map(email => ({
                roadmap_id: projectId,
                email
            }));
            const { error: shareError } = await supabase
                .from('roadmap_shares')
                .upsert(shares, { onConflict: 'roadmap_id,email' });

            if (shareError) throw shareError;
        }
    },

    // Get Shared Emails
    getProjectShares: async (projectId: string): Promise<string[]> => {
        const { data, error } = await supabase
            .from('roadmap_shares')
            .select('email')
            .eq('roadmap_id', projectId);

        if (error) return [];
        return data.map((d: any) => d.email);
    },

    // Save project data (autosave)
    saveProjectData: async (projectId: string, data: Partial<ProjectData>) => {
        // We need to separate content updates from metadata updates if necessary, 
        // but typically we just dump the structure into 'content' column aside from high level fields.

        const updatePayload: any = {
            updated_at: new Date().toISOString()
        };

        // If nodes/edges are passed, update content
        if (data.nodes || data.edges) {
            // We need to fetch existing content to merge effectively if we are partial?
            // For now, let's assume we are passing the full node/edge state usually from FlowCanvas
            updatePayload.content = {
                nodes: data.nodes,
                edges: data.edges
            };
        }

        const { error } = await supabase
            .from('roadmaps')
            .update(updatePayload)
            .eq('id', projectId);

        if (error) {
            console.error('Failed to save project:', error);
        }
    },

    // Rename/Update Metadata
    updateProjectMetadata: async (id: string, updates: Partial<ProjectMetadata>) => {
        const payload: any = { updated_at: new Date().toISOString() };
        if (updates.name) payload.name = updates.name;
        if (updates.description) payload.description = updates.description;

        const { error } = await supabase
            .from('roadmaps')
            .update(payload)
            .eq('id', id);

        if (error) console.error('Failed to update metadata:', error);
    },

    // Delete Project
    deleteProject: async (id: string) => {
        const { error } = await supabase
            .from('roadmaps')
            .delete()
            .eq('id', id);

        if (error) console.error('Failed to delete project:', error);
    }
};
