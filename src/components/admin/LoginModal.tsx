import { useState, type FormEvent } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface LoginModalProps {
  open: boolean
  onClose: () => void
}

export function LoginModal({ open, onClose }: LoginModalProps) {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!open) return null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: err } = await signIn(email, password)
    setLoading(false)

    if (err) {
      setError(err)
    } else {
      setEmail('')
      setPassword('')
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-md mx-4 bg-surface-dark border border-glass-border rounded-2xl p-8 shadow-2xl"
      >
        <h2 className="text-xl font-bold text-white mb-1 font-[--font-display]">
          Admin Sign In
        </h2>
        <p className="text-sm text-slate-400 mb-6">
          Sign in with your admin credentials to manage content.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <label className="block mb-4">
          <span className="text-sm text-slate-300 mb-1 block">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
            placeholder="admin@example.com"
          />
        </label>

        <label className="block mb-6">
          <span className="text-sm text-slate-300 mb-1 block">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
            placeholder="••••••••"
          />
        </label>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-lg bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>
      </form>
    </div>
  )
}
