
'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User, LogOut, Settings, Trash2 } from 'lucide-react'
import { signout } from '@/app/login/actions'
import { UserAvatar } from './UserAvatar'
import { ProfileModal } from './ProfileModal'

import Link from 'next/link'

interface Profile {
    id: string
    display_name: string | null
    email: string | null
    avatar_url: string | null
}

interface ProfileButtonProps {
    isGuest?: boolean;
}

export default function ProfileButton({ isGuest = false }: ProfileButtonProps) {
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [isOpen, setIsOpen] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        if (isGuest) return; // Skip fetching user if guest
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
            if (user) {
                const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
                setProfile(data)
            }
        }
        getUser()
        // ...
    }, [isGuest])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    if (isGuest) {
        return (
            <Link
                href="/login"
                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
            >
                Login
            </Link>
        )
    }

    if (!user) return null // Or return Login link if unsure?

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-8 h-8 rounded-full ring-2 ring-border hover:ring-primary/50 transition-all overflow-hidden"
            >
                <UserAvatar url={profile?.avatar_url} name={profile?.display_name || user.email} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-56 bg-popover border border-border rounded-xl shadow-2xl overflow-hidden z-[100]"
                    >
                        <div className="p-4 border-b border-border bg-muted/50">
                            <p className="text-sm font-medium text-foreground truncate">{profile?.display_name || 'User'}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>

                        <div className="p-1">
                            <button
                                onClick={() => { setIsOpen(false); setIsModalOpen(true); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                            >
                                <Settings size={16} /> Manage Profile
                            </button>

                            <button
                                onClick={() => { signout() }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                                <LogOut size={16} /> Sign Out
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <ProfileModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                user={user}
                profile={profile}
                onUpdate={() => {
                    // Refresh profile data
                    supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => setProfile(data))
                }}
            />
        </div>
    )
}
