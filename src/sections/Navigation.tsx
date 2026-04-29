import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Flame, Search, MessageCircle, Calendar, User, Menu, X, LogOut, Crown, Shield } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { toast } from 'sonner'

export default function Navigation() {
  const { user, profile, signOut } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const isLanding = location.pathname === '/'

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
      <nav className={`fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 sm:px-6 transition-all ${isLanding ? 'bg-transparent' : 'glass border-b border-white/5 shadow-lg'}`}>
        <Link to="/" className="flex items-center gap-2 min-h-[44px]">
          <div className="w-8 h-8 rounded-lg grad-bg flex items-center justify-center">
            <Flame className="w-4 h-4 text-white" />
          </div>
          <span className="font-syne font-bold text-lg grad-text tracking-tighter">TURNUP</span>
        </Link>

        {/* Desktop Nav Items - ONLY show if logged in */}
        {user ? (
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all min-h-[44px] ${
                  location.pathname === path
                    ? 'bg-purple-500/15 text-purple-300'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>
        ) : null}

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {profile?.verified && (
                <span className="verified-badge hidden sm:flex">
                  <Shield className="w-3 h-3" /> Verified
                </span>
              )}
              <button onClick={handleSignOut} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all min-h-[44px]">
                <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/auth" className="px-4 py-2 rounded-xl text-sm font-bold text-gray-400 hover:text-white transition-all min-h-[44px] flex items-center">Sign In</Link>
              <Link to="/auth?mode=signup" className="btn-grad text-sm px-5 py-2 min-h-[44px] flex items-center font-bold shadow-lg shadow-purple-500/20">Join Free</Link>
            </div>
          )}
        </div>
      </nav>

      {/* Bottom Tab Bar (Mobile Only - ONLY show if logged in) */}
      {user && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/5 px-2 pb-safe-area shadow-[0_-10px_20px_rgba(0,0,0,0.3)]">
          <div className="flex items-center justify-around h-16">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all relative ${
                  location.pathname === path ? 'text-purple-400' : 'text-gray-500'
                }`}
              >
                {location.pathname === path && (
                  <div className="absolute top-0 w-8 h-1 grad-bg rounded-b-full shadow-[0_5px_15px_rgba(168,85,247,0.4)]" />
                )}
                <Icon className={`w-6 h-6 transition-transform ${location.pathname === path ? 'scale-110' : ''}`} />
                <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
