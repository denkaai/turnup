import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Flame, Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function AuthPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'signup'>(params.get('mode') === 'signup' ? 'signup' : 'login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setMode(params.get('mode') === 'signup' ? 'signup' : 'login')
  }, [params])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return toast.error('Fill in all fields')
    if (password.length < 6) return toast.error('Password must be at least 6 characters')

    setLoading(true)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        toast.success('Account created! Complete your profile.')
        navigate('/onboarding')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        toast.success('Welcome back!')
        navigate('/discover')
      }
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/discover' }
    })
    if (error) toast.error(error.message)
  }

  return (
    <main className="min-h-screen pt-14 flex items-center justify-center px-4 relative">
      <div className="orb w-80 h-80 bg-purple-600/20 top-0 left-0 -translate-x-1/2" />
      <div className="orb w-80 h-80 bg-pink-600/15 bottom-0 right-0 translate-x-1/3" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl grad-bg flex items-center justify-center">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <span className="font-syne font-bold text-xl grad-text">TURNUP</span>
          </Link>
          <h1 className="font-syne font-bold text-2xl text-white mb-1">
            {mode === 'login' ? 'Welcome back' : 'Join the vibe'}
          </h1>
          <p className="text-gray-500 text-sm">
            {mode === 'login' ? 'Sign in to your account' : 'Create your free account'}
          </p>
        </div>

        <div className="card p-6">
          <button
            onClick={handleGoogleLogin}
            className="w-full py-2.5 px-4 rounded-xl bg-white text-gray-900 font-bold flex items-center justify-center gap-3 hover:bg-gray-100 transition-all mb-6 shadow-xl"
          >
            <span className="flex items-center text-lg font-black">
              <span className="text-[#4285F4]">G</span>
            </span>
            Continue with Google
          </button>

          <div className="relative flex items-center justify-center mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <span className="relative px-3 bg-[#12121f] text-[10px] text-gray-700 uppercase tracking-widest font-bold">or</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-dark pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-dark pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-grad w-full flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-gray-600 text-sm">
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="text-purple-400 hover:text-purple-300 font-medium"
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-700 mt-4">
          By continuing you agree to our{' '}
          <a href="#" className="text-gray-500 hover:text-gray-400">Terms</a> &{' '}
          <a href="#" className="text-gray-500 hover:text-gray-400">Privacy Policy</a>
        </p>
      </div>
    </main>
  )
}
