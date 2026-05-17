'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { LogIn } from 'lucide-react'

interface LoginFormProps {
  onLoginSuccess: () => void
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        setError('Check your email to confirm signup')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        onLoginSuccess()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 px-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 space-y-6">
          <div className="flex items-center justify-center gap-3">
            <div className="p-2 bg-cyan-500/15 rounded-lg">
              <LogIn className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Nequi Wallet Ops</h1>
              <p className="text-xs text-slate-400">Depositos y retiros automatizados</p>
            </div>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                disabled={loading}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 disabled:opacity-50"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 disabled:opacity-50"
                required
              />
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-700 text-red-200 rounded-lg px-4 py-2 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-400 hover:bg-cyan-300 disabled:bg-slate-700 text-slate-950 rounded-lg px-4 py-2 font-medium transition-colors disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <button
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError('')
            }}
            className="w-full text-sm text-slate-400 hover:text-slate-300 transition-colors"
          >
            {isSignUp ? 'Have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  )
}
