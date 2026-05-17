import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { handleSupabaseError } from '@/lib/safe-supabase'
import Navigation from '@/sections/Navigation'
import Landing from '@/sections/Landing'
import AuthPage from '@/sections/AuthPage'
import Onboarding from '@/sections/Onboarding'
import Discover from '@/sections/Discover'
import Messages from '@/sections/Messages'
import Events from '@/sections/Events'
import Profile from '@/sections/Profile'
import Squads from '@/sections/Squads'
import InstallBanner from '@/components/InstallBanner'
import AIAssistant from '@/components/AIAssistant'
import Privacy from '@/sections/legal/Privacy'
import Terms from '@/sections/legal/Terms'
import Safety from '@/sections/legal/Safety'
import Support from '@/sections/legal/Support'


function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuthStore()
  if (!user) return <Navigate to="/auth" replace />
  
  // Verification Gate
  const isComplete = profile?.onboarding_completed

  if (!isComplete) {
    // If they haven't finished onboarding, send to onboarding
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}

export default function App() {
  const { setUser, fetchProfile, setProfile } = useAuthStore()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Safety timeout to prevent getting stuck on "Loading vibes..."
    const safetyTimer = setTimeout(() => {
      setReady(true)
      console.warn('App: Loading safety timeout triggered')
    }, 6000)

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        fetchProfile(session.user.id)
          .catch(err => console.error('App: Profile fetch error', err))
          .finally(() => {
            clearTimeout(safetyTimer)
            setReady(true)
          })
      } else {
        clearTimeout(safetyTimer)
        setReady(true)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user)
        const prof = await fetchProfile(session.user.id)
        
        // BUG 2: Google Auth Redirect Logic
        const path = window.location.pathname
        const isAuthPage = path === '/auth' || path === '/'
        const isOnboarding = path.includes('/onboarding')

        if (!prof) {
          if (!isOnboarding) window.location.href = '/onboarding'
        } else {
          if (!prof.onboarding_completed) {
            if (!isOnboarding) window.location.href = '/onboarding'
          } else if (isAuthPage || isOnboarding) {
            window.location.href = '/discover'
          }
        }
      } else {
        setUser(null)
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#080810] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-[24px] grad-bg flex items-center justify-center mx-auto mb-6 animate-pulse shadow-[0_0_30px_rgba(139,92,246,0.3)] relative">
            <span className="text-white font-syne font-black text-3xl">T</span>
            <div className="absolute -top-2 -right-2 bg-white text-black text-[8px] font-black px-1.5 py-0.5 rounded-full border-2 border-[#080810]">V3</div>
          </div>
          <h2 className="text-white font-syne font-black text-xl mb-1 tracking-tight">TURNUP</h2>
          <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.3em]">Loading Vibes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#080810]">
      <Navigation />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/onboarding" element={<Onboarding />} />

        <Route path="/discover" element={<ProtectedRoute><Discover /></ProtectedRoute>} />
        <Route path="/squads" element={<ProtectedRoute><Squads /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/safety" element={<Safety />} />
        <Route path="/support" element={<Support />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: '#13131f', color: '#fff', border: '1px solid rgba(255,255,255,0.07)' }
        }}
      />
      <InstallBanner />
      <AIAssistant />
    </div>
  )
}
