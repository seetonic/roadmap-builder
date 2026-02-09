"use client";

import { Crown, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { PlanType } from '@/lib/usage';

interface RateLimitIndicatorProps {
    usage: { current: number; limit: number };
    plan: PlanType;
    compact?: boolean;
}

export default function RateLimitIndicator({ usage, plan, compact = false }: RateLimitIndicatorProps) {
    // If unlimited, showing a simple "Unlimited" badge might be nicer than a progress bar
    if (plan === 'studio' || usage.limit === Infinity) {
        if (compact) return null; // Don't show anything on canvas if unlimited
        return (
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/10 to-purple-500/10 border border-amber-500/20">
                <Crown size={12} className="text-amber-500" />
                <span className="text-xs font-medium text-amber-500">Unlimited Power</span>
            </div>
        );
    }

    const percentage = Math.min((usage.current / usage.limit) * 100, 100);
    const isNearLimit = percentage > 80;
    const isAtLimit = percentage >= 100;

    return (
        <div className={`flex items-center gap-3 ${compact ? 'bg-black/40 backdrop-blur-sm p-2 rounded-lg border border-white/10' : ''}`}>
            {!compact && (
                <div className="flex flex-col items-end">
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1">
                        <Zap size={10} /> AI Credits
                    </div>
                    <div className={`text-xs font-bold ${isNearLimit ? 'text-red-400' : 'text-foreground'}`}>
                        {usage.current} / {usage.limit}
                    </div>
                </div>
            )}

            <div className="relative w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                    className={`absolute top-0 left-0 h-full rounded-full ${isNearLimit ? 'bg-red-500' : 'bg-primary'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                />
            </div>

            {compact && (
                <span className={`text-xs font-bold w-12 text-right ${isNearLimit ? 'text-red-400' : 'text-muted-foreground'}`}>
                    {usage.current}/{usage.limit}
                </span>
            )}
        </div>
    );
}
