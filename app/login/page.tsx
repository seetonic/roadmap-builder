

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { login, signup } from './actions'
import Link from 'next/link'
import { Loader2, ArrowRight, UserPlus, LogIn, Github } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Script from 'next/script'

declare global {
    interface Window {
        google: any;
    }
}

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)

    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setMessage(null)

        const formData = new FormData()
        formData.append('email', email)
        formData.append('password', password)

        try {
            if (isLogin) {
                const result = await login(formData)
                if (result?.error) {
                    setError(result.error)
                }
                // Redirect handled by server action or middleware usually, 
                // but here we might just rely on the form action behavior or router.refresh
            } else {
                const result = await signup(formData)
                if (result?.error) {
                    setError(result.error)
                } else {
                    setMessage('Check your email to confirm your account.')
                }
            }
        } catch (err) {
            setError('An unexpected error occurred.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-background to-background opacity-40" />
                <div className="absolute w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[100px] -top-20 -left-20 animate-pulse" />
                <div className="absolute w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] bottom-0 right-0 animate-pulse delay-700" />
            </div>

            <div className="w-full max-w-md z-10">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block mb-4">
                        <div className="flex items-center justify-center gap-2">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50 border border-border p-2">
                                <img src="/web-app-manifest-192x192.png" alt="Roadmap builder" className="w-full h-full object-contain" />
                            </div>
                        </div>
                    </Link>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground/60">
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        {isLogin ? 'Build the systems of your mind.' : 'Build the systems of your mind.'}
                    </p>
                </div>

                <motion.div
                    layout
                    className="bg-card/50 backdrop-blur-xl border border-border p-8 rounded-2xl shadow-xl"
                >
                    <div className="relative mb-4">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full bg-muted/50 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-transparent transition-all placeholder:text-muted-foreground/50"
                                placeholder="name@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full bg-muted/50 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-transparent transition-all placeholder:text-muted-foreground/50"
                                placeholder="••••••"
                            />
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                    {error}
                                </motion.div>
                            )}
                            {message && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 text-sm flex items-center gap-2"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                    {message}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-primary-foreground font-semibold rounded-lg px-4 py-3 flex items-center justify-center gap-2 hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                        >
                            {loading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <>
                                    {isLogin ? 'Sign In' : 'Sign Up'}
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-border flex flex-col gap-4 text-center">
                        <p className="text-muted-foreground text-sm">
                            {isLogin ? "Don't have an account?" : "Already have an account?"}
                            <button
                                onClick={() => {
                                    setIsLogin(!isLogin);
                                    setError(null);
                                    setMessage(null);
                                }}
                                className="ml-2 text-sky-400 hover:text-sky-300 transition-colors font-medium hover:underline"
                            >
                                {isLogin ? 'Create one' : 'Sign in'}
                            </button>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
