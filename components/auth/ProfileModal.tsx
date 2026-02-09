
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Lock, Mail, AlertTriangle, Loader2, Trash2 } from 'lucide-react'
import { updateProfile, updateEmail, updatePassword, deleteAccount } from '@/app/profile/actions'
import ConfirmModal from '@/components/ConfirmModal'
import { toast } from 'sonner'

interface ProfileModalProps {
    isOpen: boolean
    onClose: () => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    profile: any
    onUpdate: () => void
}

export function ProfileModal({ isOpen, onClose, user, profile, onUpdate }: ProfileModalProps) {
    const [activeTab, setActiveTab] = useState<'general' | 'security' | 'danger'>('general')
    const [isLoading, setIsLoading] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    if (!isOpen) return null

    const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        const formData = new FormData(e.currentTarget)
        const res = await updateProfile(formData)
        setIsLoading(false)

        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Profile updated successfully')
            onUpdate()
        }
    }

    const handleUpdateEmail = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        const formData = new FormData(e.currentTarget)
        const res = await updateEmail(formData)
        setIsLoading(false)

        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success(res.message || 'Email update initiated. Please check your inbox.')
        }
    }

    const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        const formData = new FormData(e.currentTarget)
        const res = await updatePassword(formData)
        setIsLoading(false)

        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Password updated successfully')
            e.currentTarget.reset()
        }
    }

    const handleDeleteAccount = () => {
        setShowDeleteConfirm(true)
    }

    const confirmDeleteAccount = async () => {
        setIsLoading(true)
        const res = await deleteAccount()
        if (res?.error) {
            setIsLoading(false)
            toast.error(res.error)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/40">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <User size={18} className="text-sky-400" /> Manage Profile
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Tabs */}
                    <div className="w-48 bg-black/20 border-r border-white/10 p-2 flex flex-col gap-1">
                        <button
                            onClick={() => setActiveTab('general')}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${activeTab === 'general' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
                        >
                            <User size={16} /> General
                        </button>
                        <button
                            onClick={() => setActiveTab('security')}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${activeTab === 'security' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
                        >
                            <Lock size={16} /> Security
                        </button>
                        <button
                            onClick={() => setActiveTab('danger')}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${activeTab === 'danger' ? 'bg-red-500/10 text-red-400' : 'text-zinc-500 hover:text-red-400 hover:bg-red-500/5'}`}
                        >
                            <AlertTriangle size={16} /> Danger Zone
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 p-6 overflow-y-auto">

                        {activeTab === 'general' && (
                            <form onSubmit={handleUpdateProfile} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase">Display Name</label>
                                    <input
                                        name="displayName"
                                        defaultValue={profile?.display_name || ''}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase">Email</label>
                                    <input
                                        disabled
                                        value={user.email}
                                        className="w-full bg-black/20 border border-white/5 rounded-lg px-4 py-2.5 text-sm text-zinc-500 cursor-not-allowed"
                                    />
                                    <p className="text-[10px] text-zinc-600 mt-1">To change email, go to Security.</p>
                                </div>
                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50"
                                    >
                                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-8">
                                <form onSubmit={handleUpdateEmail} className="space-y-4">
                                    <h3 className="text-sm font-medium text-white border-b border-white/10 pb-2">Change Email</h3>
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase">New Email Address</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="email"
                                                name="email"
                                                required
                                                placeholder="new@example.com"
                                                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                                            />
                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="px-4 py-2 bg-white/5 text-white text-sm font-medium rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
                                            >
                                                Update
                                            </button>
                                        </div>
                                    </div>
                                </form>

                                <form onSubmit={handleUpdatePassword} className="space-y-4">
                                    <h3 className="text-sm font-medium text-white border-b border-white/10 pb-2">Change Password</h3>
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase">New Password</label>
                                        <input
                                            type="password"
                                            name="password"
                                            required
                                            minLength={6}
                                            placeholder="••••••"
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                                        />
                                    </div>
                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="px-4 py-2 bg-white/5 text-white text-sm font-medium rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
                                        >
                                            Update Password
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {activeTab === 'danger' && (
                            <div className="space-y-4">
                                <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-lg">
                                    <h3 className="text-red-400 font-medium text-sm mb-2">Delete Account</h3>
                                    <p className="text-zinc-500 text-xs mb-4">
                                        Once you delete your account, there is no going back. Please be certain.
                                    </p>
                                    <button
                                        onClick={handleDeleteAccount}
                                        disabled={isLoading}
                                        className="px-4 py-2 bg-red-500/10 text-red-400 text-sm font-medium rounded-lg hover:bg-red-500/20 transition-colors flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <><Trash2 size={16} /> Delete Account</>}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={confirmDeleteAccount}
                title="Delete Account"
                message="Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed."
                confirmText="Delete Account"
                cancelText="Cancel"
                type="danger"
            />
        </div>
    )
}
