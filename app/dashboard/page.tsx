
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, MoreVertical, Trash2, Edit2, Calendar, Folder, Lock, Crown, Loader2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { storage } from '@/lib/storage';
import { ProjectMetadata } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import ProfileButton from '@/components/auth/ProfileButton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { checkRoadmapLimit, getUserPlan, PlanType, PLAN_LIMITS } from '@/lib/usage';
import { createClient } from '@/lib/supabase/client';
import ConfirmModal from '@/components/ConfirmModal';
import { toast } from 'sonner';
import RateLimitIndicator from '@/components/RateLimitIndicator';
import { generateRoadmapFromText } from '@/lib/ai/roadmapGenerator';
import { aiStorage } from '@/lib/aiStorage';

export default function Dashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectMetadata[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createMode, setCreateMode] = useState<'empty' | 'ai'>('empty');
  const [newProjectName, setNewProjectName] = useState('');
  const [aiTopic, setAiTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const [currentPlan, setCurrentPlan] = useState<PlanType>('studio'); // Default to studio/unlimited
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);
  const [usage, setUsage] = useState({ current: 0, limit: Infinity });

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoadingPlan(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const [list, plan] = await Promise.all([
        storage.getProjects(),
        getUserPlan(user.id)
      ]);

      setProjects(list);
      setCurrentPlan(plan);
      const limitInfo = await checkRoadmapLimit(user.id);
      setUsage({ current: limitInfo.current, limit: limitInfo.limit });

    } else {
      // Fallback or redirect
      const list = await storage.getProjects();
      setProjects(list);
    }
    setIsLoadingPlan(false);
  };

  const loadProjects = async () => {
    // Reload just projects
    const list = await storage.getProjects();
    setProjects(list);
    // Also update usage
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const limitInfo = await checkRoadmapLimit(user.id);
      setUsage({ current: limitInfo.current, limit: limitInfo.limit });
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    if (!newProjectName.trim() && createMode === 'empty') {
      toast.error('Please enter a roadmap name');
      return;
    }

    setIsGenerating(true);
    try {
      if (createMode === 'ai') {
        // AI Generate
        if (!aiTopic.trim()) {
          toast.error('Please enter a topic');
          return;
        }

        try {
          const result = await generateRoadmapFromText(aiTopic);
          const projectId = await storage.createProject(
            newProjectName.trim() || `${aiTopic} Roadmap`,
            `AI-generated roadmap for ${aiTopic}`,
            result.nodes,
            result.edges
          );

          if (projectId) {
            // Save AI generation to database
            await aiStorage.saveRoadmapGeneration(
              projectId,
              aiTopic,
              result.nodes,
              result.edges
            );

            router.push(`/roadmap/${projectId}`);
          } else {
            toast.error('Failed to create roadmap');
          }
        } catch (err) {
          console.error(err);
          toast.error('Failed to generate roadmap. Please try again.');
        }
      } else {
        // Empty project
        const id = await storage.createProject(newProjectName);

        if (id) {
          router.push(`/roadmap/${id}`);
        } else {
          toast.error("Failed to create roadmap");
        }
      }
    } catch (error) {
      console.error("Failed to create:", error);
      toast.error(createMode === 'ai' ? "Failed to generate AI roadmap" : "Failed to create roadmap");
    } finally {
      setNewProjectName('');
      setAiTopic('');
      setIsCreateOpen(false);
      setIsGenerating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation();
    setDeleteConfirmId(id);
    setMenuOpenId(null);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;

    await storage.deleteProject(deleteConfirmId);
    setDeleteConfirmId(null);
    loadProjects();
    toast.success('Roadmap deleted');
  };

  const startRename = (e: React.MouseEvent, project: ProjectMetadata) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(project.id);
    setEditName(project.name);
    setMenuOpenId(null);
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId && editName.trim()) {
      await storage.updateProjectMetadata(editingId, { name: editName });
      setEditingId(null);
      loadProjects();
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 font-sans relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Top Right Actions */}
        <div className="absolute top-0 right-0 z-20 flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3 mr-4">
            <RateLimitIndicator usage={usage} plan={currentPlan} />
            {!isLoadingPlan && (
              <>
                <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-muted-foreground flex items-center gap-2">
                  <Folder size={12} />
                  {usage.current} Roadmaps
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg shadow-primary/20"
          >
            <Plus size={18} /> New Roadmap
          </button>
          <ThemeToggle />
          <ProfileButton />
        </div>

        <header className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold font-brand tracking-tight mb-2">
              Roadmap builder
            </h1>
            <p className="text-muted-foreground">Build the systems of your mind.</p>
          </div>
        </header>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {projects.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full py-20 text-center text-muted-foreground border-2 border-dashed border-white/5 rounded-3xl bg-white/5 backdrop-blur-sm"
              >
                <p>No roadmaps yet. Create one to get started!</p>
              </motion.div>
            ) : (
              projects.map((project) => (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group relative"
                >
                  <Link href={`/roadmap/${project.id}`} className="block h-full">
                    <div className="h-full glass border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:border-primary/50 hover:bg-white/5 hover:shadow-2xl hover:-translate-y-1">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-xl text-primary border border-white/5">
                          <Folder size={24} />
                        </div>
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setMenuOpenId(menuOpenId === project.id ? null : project.id);
                            }}
                            className="p-2 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <MoreVertical size={18} />
                          </button>

                          {menuOpenId === project.id && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
                              <button
                                onClick={(e) => startRename(e, project)}
                                className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 flex items-center gap-2"
                              >
                                <Edit2 size={14} /> Rename
                              </button>
                              <button
                                onClick={(e) => handleDelete(e, project.id)}
                                className="w-full text-left px-4 py-3 text-sm hover:bg-red-500/10 text-red-500 flex items-center gap-2"
                              >
                                <Trash2 size={14} /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xl font-bold font-brand mb-1 truncate pr-4">
                          {project.name}
                        </h3>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-4">
                          <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-md border border-white/5">
                            <Calendar size={12} />
                            {formatDistanceToNow(project.lastModified, { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Create Project Modal */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-card border border-white/10 p-6 rounded-2xl shadow-2xl glass"
            >
              <h2 className="text-2xl font-bold font-brand mb-4">Create New Roadmap</h2>

              <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setCreateMode('empty')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${createMode === 'empty' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-white/5'}`}
                >
                  Empty Sheet
                </button>
                <button
                  type="button"
                  onClick={() => setCreateMode('ai')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${createMode === 'ai' ? 'bg-purple-500 text-white shadow-sm' : 'text-muted-foreground hover:bg-white/5'}`}
                >
                  AI Generate
                </button>
              </div>

              <form onSubmit={handleCreate}>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Roadmap Name</label>
                    <input
                      autoFocus={createMode === 'empty'}
                      type="text"
                      placeholder="e.g. My Awesome Project"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-lg"
                    />
                  </div>

                  <AnimatePresence mode="wait">
                    {createMode === 'ai' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                          What should this roadmap be about?
                        </label>
                        <textarea
                          autoFocus
                          value={aiTopic}
                          onChange={(e) => setAiTopic(e.target.value)}
                          placeholder="e.g. Learning React.js from scratch, passing the bar exam, planning a wedding..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all text-sm min-h-[100px] resize-none"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2 hover:bg-white/10 rounded-lg text-muted-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newProjectName.trim() || (createMode === 'ai' && !aiTopic.trim()) || isGenerating}
                    className={`px-6 py-2 rounded-lg font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${createMode === 'ai' ? 'bg-purple-600 text-white shadow-purple-500/20 shadow-lg' : 'bg-primary text-primary-foreground'}`}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        {createMode === 'ai' ? 'Generating...' : 'Creating...'}
                      </>
                    ) : (
                      createMode === 'ai' ? 'Generate & Create' : 'Create Empty'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Rename Modal */}
      <AnimatePresence>
        {editingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-card border border-white/10 p-6 rounded-2xl shadow-2xl glass"
            >
              <h2 className="text-2xl font-bold font-brand mb-4">Rename Roadmap</h2>
              <form onSubmit={handleRename}>
                <input
                  autoFocus
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all mb-6 text-lg"
                />
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="px-4 py-2 hover:bg-white/10 rounded-lg text-muted-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!editName.trim()}
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={confirmDelete}
        title="Delete Roadmap"
        message="Are you sure you want to delete this roadmap? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
