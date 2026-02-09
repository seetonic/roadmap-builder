"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
    const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null);

    const handleCheckout = async (plan: string) => {
        setIsCheckingOut(plan);
        try {
            const response = await fetch('/api/lemon/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan })
            });
            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                toast.error(data.error || 'Checkout failed');
            }
        } catch (error) {
            console.error(error);
            toast.error('Checkout failed');
        } finally {
            setIsCheckingOut(null);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full max-w-3xl bg-card border border-border p-8 rounded-3xl shadow-2xl relative overflow-hidden"
                    >
                        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                            <Plus size={24} className="rotate-45" />
                        </button>

                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-bold font-brand mb-2 text-foreground">Upgrade your Workspace</h2>
                            <p className="text-muted-foreground">Unlock more roadmaps, unlimited nodes, and premium features.</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Pro */}
                            <div className="p-6 rounded-2xl border border-border bg-card hover:border-primary/50 transition-colors shadow-sm">
                                <h3 className="text-xl font-bold mb-2 text-foreground">Pro</h3>
                                <div className="flex items-baseline gap-1 mb-4 text-foreground">
                                    <span className="text-3xl font-bold">$7</span>
                                    <span className="text-muted-foreground">/mo</span>
                                </div>
                                <ul className="space-y-3 mb-6 text-sm text-muted-foreground">
                                    <li className="flex gap-2"><Check size={16} className="text-primary" /> 10 Roadmaps</li>
                                    <li className="flex gap-2"><Check size={16} className="text-primary" /> 300 Tasks / Roadmap</li>
                                    <li className="flex gap-2"><Check size={16} className="text-primary" /> Export Support</li>
                                </ul>
                                <button
                                    onClick={() => handleCheckout('pro')}
                                    disabled={isCheckingOut === 'pro'}
                                    className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-bold hover:opacity-90 flex justify-center items-center gap-2 transition-opacity"
                                >
                                    {isCheckingOut === 'pro' && <Loader2 size={14} className="animate-spin" />}
                                    Upgrade to Pro
                                </button>
                            </div>

                            {/* Studio */}
                            <div className="p-6 rounded-2xl border border-border bg-card hover:border-purple-500/50 transition-colors shadow-sm">
                                <h3 className="text-xl font-bold mb-2 text-foreground">Studio</h3>
                                <div className="flex items-baseline gap-1 mb-4 text-foreground">
                                    <span className="text-3xl font-bold">$15</span>
                                    <span className="text-muted-foreground">/mo</span>
                                </div>
                                <ul className="space-y-3 mb-6 text-sm text-muted-foreground">
                                    <li className="flex gap-2"><Check size={16} className="text-primary" /> Unlimited Roadmaps</li>
                                    <li className="flex gap-2"><Check size={16} className="text-primary" /> Unlimited Tasks</li>
                                    <li className="flex gap-2"><Check size={16} className="text-primary" /> Priority Support</li>
                                </ul>
                                <button
                                    onClick={() => handleCheckout('studio')}
                                    disabled={isCheckingOut === 'studio'}
                                    className="w-full py-2 bg-secondary text-secondary-foreground rounded-lg font-bold hover:bg-secondary/80 flex justify-center items-center gap-2 transition-colors"
                                >
                                    {isCheckingOut === 'studio' && <Loader2 size={14} className="animate-spin" />}
                                    Upgrade to Studio
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
