import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Flame, Search, MessageCircle, Calendar, User, LogOut, Shield } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/lib/store'
import { toast } from 'sonner'

export default function Navigation() {
  const { user, profile, signOut } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const isLanding = location.pathname === '/'
  const isOnboarding = location.pathname === '/onboarding'

  const navItems = [
    { path: '/discover', label: 'Discover', icon: Search },
    { path: '/squads', label: 'Squads', icon: Flame },
    { path: '/messages', label: 'Messages', icon: MessageCircle },
    { path: '/events', label: 'Events', icon: Calendar },
    { path: '/profile', label: 'Profile', icon: User },
  ]

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out. See you next weekend!')
    navigate('/')
  }

  return (
    <>
      {/* Top Navbar */}
      {!isOnboarding && (
        <nav className={`fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 sm:px-6 transition-all ${isLanding ? 'bg-transparent' : 'glass border-b border-white/5 shadow-lg'}`}>
          <Link to="/" className="flex items-center gap-2 min-h-[44px]">
            <div className="w-8 h-8 rounded-lg grad-bg flex items-center justify-center">
              <Flame className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-syne font-black text-lg grad-text tracking-tighter">TURNUP</span>
              <span className="bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">V3</span>
            </div>
          </Link>

          {/* Desktop Nav Items - ONLY show if logged in and on desktop */}
          {user ? (
            <div className="hidden sm:flex items-center gap-1 relative">
              {navItems.map(({ path, label, icon: Icon }) => {
                const isActive = location.pathname === path
                return (
                  <Link
                    key={path}
                    to={path}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all min-h-[44px] ${
                      isActive ? 'text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="desktop-nav-indicator"
                        className="absolute inset-0 bg-white/10 rounded-xl"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <Icon className="w-4 h-4 relative z-10" />
                    <span className="relative z-10">{label}</span>
                  </Link>
                )
              })}
            </div>
          ) : null}

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                {profile?.verified && (
                  <span className="verified-badge hidden md:flex shadow-[0_0_15px_rgba(74,222,128,0.2)]">
                    <Shield className="w-3 h-3" /> Verified
                  </span>
                )}
                <button onClick={handleSignOut} className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all min-h-[44px]">
                  <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Sign out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/auth" className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-gray-400 hover:text-white transition-all min-h-[44px] flex items-center">Sign In</Link>
                <Link to="/auth?mode=signup" className="btn-grad text-xs sm:text-sm px-4 sm:px-5 py-2 min-h-[44px] flex items-center font-bold shadow-lg shadow-purple-500/20">Join Free</Link>
              </div>
            )}
          </div>
        </nav>
      )}

      {/* Bottom Tab Bar (Mobile Only) */}
      {user && 
       profile?.onboarding_completed && 
       !['/', '/auth', '/onboarding'].includes(location.pathname) && (
        <div className="sm:hidden fixed bottom-6 left-4 right-4 z-50 glass rounded-2xl border border-white/10 px-2 py-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.4)] pb-safe-area">
          <div className="flex items-center justify-around h-14">
            {navItems.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex flex-col items-center justify-center flex-1 h-full gap-1 relative ${
                    isActive ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="mobile-nav-indicator"
                      className="absolute inset-0 bg-white/10 rounded-xl"
                      transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                    />
                  )}
                  <Icon className={`w-5 h-5 relative z-10 transition-transform ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : ''}`} />
                  <span className="text-[9px] font-black uppercase tracking-widest leading-none relative z-10">{label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
