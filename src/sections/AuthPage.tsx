import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Flame, Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function AuthPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(params.get('mode') === 'signup' ? 'signup' : 'login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)

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
      options: { redirectTo: window.location.origin + '/onboarding' }
    })
    if (error) toast.error(error.message)
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return toast.error('Please enter your email')
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/auth'
      })
      if (error) throw error
      setResetSent(true)
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col md:flex-row bg-[#090912]">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-30px) translateX(10px); }
        }
        .animate-float-1 { animation: float 6s ease-in-out infinite; }
        .animate-float-2 { animation: float 8s ease-in-out infinite; }
        .animate-float-3 { animation: float 5s ease-in-out infinite; }
      `}</style>

      {/* Left Panel */}
      <div className="hidden md:flex flex-col flex-1 relative overflow-hidden bg-[#0d0d1a] items-center justify-center p-12">
        {/* Floating Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#c026d3]/20 rounded-full blur-[100px] animate-float-1" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#7c3aed]/15 rounded-full blur-[100px] animate-float-2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#ec4899]/10 rounded-full blur-[80px] animate-float-3" />
        
        {/* Content */}
        <div className="relative z-10 text-center">
          <Link to="/" className="inline-flex items-center gap-3 mb-8 hover:scale-105 transition-transform duration-300">
            <div className="w-14 h-14 rounded-2xl grad-bg flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Flame className="w-8 h-8 text-white" />
            </div>
            <span className="font-syne font-black text-3xl tracking-tighter grad-text">TURNUP</span>
          </Link>
          <h1 className="font-syne font-bold text-5xl text-white mb-6 leading-tight">Where campus <br /> comes alive 🔥</h1>
          <div className="flex flex-wrap justify-center gap-2 max-w-sm mx-auto">
            {['MKU', 'JKUAT', 'Kenyatta University', 'Zetech', 'KCA', 'KMTC Thika'].map(c => (
              <span key={c} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-gray-400 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
        {/* Mobile orbs */}
        <div className="md:hidden absolute top-0 left-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2" />
        
        <div className="w-full max-w-sm relative z-10">
          <div className="bg-[#111128]/80 backdrop-blur-xl border border-white/5 p-8 rounded-[32px] shadow-2xl">
            {/* Mode Toggle */}
            {mode !== 'forgot' && (
              <div className="bg-white/5 p-1 rounded-2xl flex mb-8">
                <button 
                  onClick={() => setMode('login')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${mode === 'login' ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500 hover:text-gray-400'}`}
                >
                  Sign In
                </button>
                <button 
                  onClick={() => setMode('signup')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${mode === 'signup' ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500 hover:text-gray-400'}`}
                >
                  Sign Up
                </button>
              </div>
            )}

            {mode !== 'forgot' ? (
              <>
                <button
                  onClick={handleGoogleLogin}
                  className="w-full py-3 px-4 rounded-xl bg-white text-gray-900 font-bold flex items-center justify-center gap-3 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(192,38,211,0.25)] transition-all duration-300 mb-6"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                    <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </button>

                <div className="relative flex items-center justify-center mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/5"></div>
                  </div>
                  <span className="relative px-3 bg-[#111128] text-[10px] text-gray-700 uppercase tracking-widest font-bold">or</span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5 ml-1">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                      <input
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input-dark pl-12 bg-white/[0.05] border-white/5 focus:border-[#c026d3]/50 focus:bg-white/[0.08]"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5 ml-1">
                      <label className="block text-xs text-gray-500">Password</label>
                      {mode === 'login' && (
                        <button type="button" onClick={() => setMode('forgot')} className="text-[10px] text-purple-400 hover:text-purple-300 font-medium">
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                      <input
                        type={showPw ? 'text' : 'password'}
                        placeholder="Min. 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input-dark pl-12 pr-12 bg-white/[0.05] border-white/5 focus:border-[#c026d3]/50 focus:bg-white/[0.08]"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400"
                      >
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-xl font-bold text-white transition-all duration-300 flex items-center justify-center gap-2 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(192,38,211,0.3)] disabled:opacity-50 disabled:transform-none"
                    style={{ background: 'linear-gradient(135deg, #c026d3, #7c3aed)' }}
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {mode === 'login' ? 'Sign In' : 'Create Account'}
                  </button>
                </form>
              </>
            ) : (
              <div className="space-y-4 animate-fade-in">
                {resetSent ? (
                  <div className="text-center py-4">
                    <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                      <Mail className="w-8 h-8 text-green-400" />
                    </div>
                    <h3 className="text-white font-bold text-xl mb-2">Check your email</h3>
                    <p className="text-gray-500 text-sm mb-8 leading-relaxed">We've sent a reset link to <br /><span className="text-gray-300 font-medium">{email}</span></p>
                    <button onClick={() => { setMode('login'); setResetSent(false); }} className="w-full py-3 rounded-xl bg-white/5 text-purple-400 hover:bg-white/10 transition-all font-bold">
                      Back to sign in
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleReset} className="space-y-4">
                    <div className="mb-6">
                      <h3 className="text-white font-bold text-xl mb-2">Reset Password</h3>
                      <p className="text-gray-500 text-sm">Enter your email and we'll send a link</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5 ml-1">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                        <input
                          type="email"
                          placeholder="your@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="input-dark pl-12 bg-white/[0.05] border-white/5 focus:border-[#c026d3]/50 focus:bg-white/[0.08]"
                          required
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 rounded-xl font-bold text-white transition-all duration-300 flex items-center justify-center gap-2 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(192,38,211,0.3)]"
                      style={{ background: 'linear-gradient(135deg, #c026d3, #7c3aed)' }}
                    >
                      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                      Send Reset Link
                    </button>
                    <button type="button" onClick={() => setMode('login')} className="w-full text-center text-gray-500 hover:text-gray-400 text-sm py-2 font-medium transition-all">
                      Back to sign in
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
          
          <p className="text-center text-[10px] text-gray-700 mt-8 uppercase tracking-widest">
            By continuing you agree to our{' '}
            <a href="#" className="text-gray-500 hover:text-gray-400 font-bold underline underline-offset-4">Terms</a> &{' '}
            <a href="#" className="text-gray-500 hover:text-gray-400 font-bold underline underline-offset-4">Privacy Policy</a>
          </p>
        </div>
      </div>
    </main>
  )
}
