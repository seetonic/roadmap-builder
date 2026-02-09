
import { createClient } from '@/lib/supabase/client';

export type PlanType = 'free' | 'pro' | 'studio';

export const PLAN_LIMITS = {
    free: {
        roadmaps: Infinity,
        nodesPerRoadmap: Infinity,
        edgesPerRoadmap: Infinity,
        canExport: true,
        canSharePrivate: true,
    },
    pro: {
        roadmaps: Infinity,
        nodesPerRoadmap: Infinity,
        edgesPerRoadmap: Infinity,
        canExport: true,
        canSharePrivate: true,
    },
    studio: {
        roadmaps: Infinity,
        nodesPerRoadmap: Infinity,
        edgesPerRoadmap: Infinity,
        canExport: true,
        canSharePrivate: true,
    },
};

export async function getUserPlan(userId: string): Promise<PlanType> {
    return 'studio';
}

export async function checkRoadmapLimit(userId: string): Promise<{ allowed: boolean; limit: number; current: number; plan: PlanType }> {
    return { allowed: true, limit: Infinity, current: 0, plan: 'studio' };
}
