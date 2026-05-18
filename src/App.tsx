import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AnimatePresence, motion } from 'framer-motion'
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

const pageVariants = {
  initial: { opacity: 0, y: 15, filter: 'blur(8px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.5, ease: "easeOut" as const } },
  exit: { opacity: 0, filter: 'blur(4px)', transition: { duration: 0.3 } }
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuthStore()
  if (!user) return <Navigate to="/auth" replace />
  if (!profile && loading) return null
  
  // Verification Gate
  const isComplete = profile?.onboarding_completed

  if (!isComplete) {
    // If they haven't finished onboarding, send to onboarding
    return <Navigate to="/onboarding" replace />
  }

  return <PageWrapper>{children}</PageWrapper>
}

export default function App() {
  const { setUser, fetchProfile, setProfile } = useAuthStore()
  const [ready, setReady] = useState(false)
  const location = useLocation()

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
        useAuthStore.setState({ loading: false })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#030305] flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center"
        >
          <div className="w-16 h-16 rounded-[24px] grad-bg flex items-center justify-center mx-auto mb-6 animate-pulse shadow-[0_0_40px_rgba(159,122,234,0.4)] relative">
            <span className="text-white font-syne font-black text-3xl">T</span>
            <div className="absolute -top-2 -right-2 bg-white text-black text-[8px] font-black px-1.5 py-0.5 rounded-full border-2 border-[#030305]">V3</div>
          </div>
          <h2 className="text-white font-syne font-black text-xl mb-1 tracking-tight">TURNUP</h2>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em]">Loading Cinematic Vibes...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#030305]">
      <Navigation />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageWrapper><Landing /></PageWrapper>} />
          <Route path="/auth" element={<PageWrapper><AuthPage /></PageWrapper>} />
          <Route path="/onboarding" element={<PageWrapper><Onboarding /></PageWrapper>} />

          <Route path="/discover" element={<ProtectedRoute><Discover /></ProtectedRoute>} />
          <Route path="/squads" element={<ProtectedRoute><Squads /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          
          <Route path="/privacy" element={<PageWrapper><Privacy /></PageWrapper>} />
          <Route path="/terms" element={<PageWrapper><Terms /></PageWrapper>} />
          <Route path="/safety" element={<PageWrapper><Safety /></PageWrapper>} />
          <Route path="/support" element={<PageWrapper><Support /></PageWrapper>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: '#0a0a0f', color: '#fff', border: '1px solid rgba(255,255,255,0.08)' }
        }}
      />
      <InstallBanner />
      <AIAssistant />
    </div>
  )
}
