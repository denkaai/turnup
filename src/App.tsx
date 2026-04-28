import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import Navigation from '@/sections/Navigation'
import Landing from '@/sections/Landing'
import AuthPage from '@/sections/AuthPage'
import Onboarding from '@/sections/Onboarding'
import Discover from '@/sections/Discover'
import Messages from '@/sections/Messages'
import Events from '@/sections/Events'
import Profile from '@/sections/Profile'


function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuthStore()
  if (!user) return <Navigate to="/auth" replace />
  if (user && profile !== null && !profile?.name) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

export default function App() {
  const { setUser, fetchProfile, setProfile } = useAuthStore()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        fetchProfile(session.user.id).finally(() => setReady(true))
      } else {
        setReady(true)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        fetchProfile(session.user.id)
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
          <div className="w-12 h-12 rounded-xl grad-bg flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-syne font-bold text-xl">T</span>
          </div>
          <p className="text-gray-500 text-sm">Loading vibes...</p>
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
        <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: '#13131f', color: '#fff', border: '1px solid rgba(255,255,255,0.07)' }
        }}
      />
    </div>
  )
}
