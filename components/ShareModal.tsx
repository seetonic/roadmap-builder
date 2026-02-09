"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Users, Globe, Lock, Mail, Plus } from 'lucide-react';
import { storage } from '@/lib/storage';
import { toast } from 'sonner';
import { ProjectMetadata } from '@/types';
import { PlanType, PLAN_LIMITS } from '@/lib/usage';
import UpgradeModal from './UpgradeModal';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: ProjectMetadata; // We need metadata to know current visibility/ID
    plan: PlanType;
}

export default function ShareModal({ isOpen, onClose, project, plan }: ShareModalProps) {
    const [visibility, setVisibility] = useState<'private' | 'public'>(project.visibility || 'private');
    const [email, setEmail] = useState('');
    const [sharedEmails, setSharedEmails] = useState<string[]>([]);
    const [copied, setCopied] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadShares();
            setVisibility(project.visibility || 'private');
        }
    }, [isOpen, project.id]);

    const loadShares = async () => {
        const emails = await storage.getProjectShares(project.id);
        setSharedEmails(emails);
    };

    const handleCopyLink = () => {
        const url = `${window.location.origin}/roadmap/${project.id}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success('Link copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        if (!PLAN_LIMITS[plan].canSharePrivate) {
            setShowUpgradeModal(true);
            return;
        }

        setIsLoading(true);
        try {
            // We pass the current visibility to not change it, just add emails
            await storage.shareProject(project.id, visibility, [email]);
            setEmail('');
            await loadShares();
        } catch (error) {
            console.error('Failed to invite:', error);
            toast.error('Failed to invite user.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVisibilityChange = async (newVis: 'private' | 'public') => {
        if (newVis === 'private' && !PLAN_LIMITS[plan].canSharePrivate) {
            setShowUpgradeModal(true);
            return;
        }

        setIsLoading(true);
        try {
            await storage.shareProject(project.id, newVis, []); // No new emails
            setVisibility(newVis);
        } catch (error) {
            console.error('Failed to change visibility:', error);
            setVisibility(visibility); // Revert on error
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-border flex items-center justify-between bg-muted/30">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Users size={20} className="text-primary" />
                                    Share &quot;{project.name}&quot;
                                </h2>
                                <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto">
                                {/* General Access */}
                                <div className="mb-8">
                                    <h3 className="text-sm font-medium text-muted-foreground mb-3">General Access</h3>
                                    <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${visibility === 'public' ? 'bg-green-500/20 text-green-500' : 'bg-muted text-muted-foreground'}`}>
                                                {visibility === 'public' ? <Globe size={20} /> : <Lock size={20} />}
                                            </div>
                                            <select
                                                value={visibility}
                                                onChange={(e) => handleVisibilityChange(e.target.value as 'private' | 'public')}
                                                disabled={isLoading}
                                                className="bg-transparent text-sm font-medium outline-none cursor-pointer text-foreground"
                                            >
                                                <option value="private" className="bg-popover text-popover-foreground">Restricted</option>
                                                <option value="public" className="bg-popover text-popover-foreground">Anyone with the link</option>
                                            </select>
                                        </div>

                                        {visibility === 'public' && (
                                            <button
                                                onClick={handleCopyLink}
                                                className="flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                                            >
                                                {copied ? <Check size={14} /> : <Copy size={14} />}
                                                {copied ? 'Copied' : 'Copy Link'}
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2 ml-1">
                                        {visibility === 'private'
                                            ? 'Only people with access can open with the link.'
                                            : 'Anyone on the internet with the link can view.'}
                                    </p>
                                </div>

                                {/* Invite People */}
                                <div className="mb-8">
                                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Invite People</h3>
                                    <form onSubmit={handleInvite} className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                            <input
                                                type="email"
                                                placeholder="Add people via email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full bg-muted/50 border border-border rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-primary/50 transition-all text-sm placeholder:text-muted-foreground/50 text-foreground"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={!email || isLoading}
                                            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
                                        >
                                            {!PLAN_LIMITS[plan].canSharePrivate && <Lock size={12} className="mr-1" />}
                                            <Plus size={16} /> Invite
                                        </button>
                                    </form>
                                </div>

                                {/* People with Access List */}
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-3">People with access</h3>
                                    <div className="space-y-3">
                                        {/* Owner - You */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center text-xs font-bold text-primary">
                                                    You
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">You (Owner)</p>
                                                    <p className="text-xs text-muted-foreground">Original creator</p>
                                                </div>
                                            </div>
                                            <span className="text-xs text-muted-foreground">Owner</span>
                                        </div>

                                        {/* Shared Users */}
                                        {sharedEmails.map((email) => (
                                            <div key={email} className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                                                        {email[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-foreground">{email}</p>
                                                    </div>
                                                </div>
                                                <span className="text-xs text-muted-foreground">Viewer</span>
                                            </div>
                                        ))}

                                        {sharedEmails.length === 0 && (
                                            <p className="text-sm text-muted-foreground italic pl-1">No one else has access yet.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 border-t border-border bg-muted/30 flex justify-end">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2 bg-muted hover:bg-muted/80 rounded-xl text-sm font-medium transition-colors text-foreground"
                                >
                                    Done
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
        </>
    );
}
