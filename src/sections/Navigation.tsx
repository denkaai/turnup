import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Flame, Search, MessageCircle, Calendar, User, Menu, X, LogOut, Crown, Shield } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { toast } from 'sonner'

export default function Navigation() {
  const { user, profile, signOut } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
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
    setMobileOpen(false)
  }

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 sm:px-6 ${isLanding ? 'bg-transparent' : 'glass border-b border-white/5'}`}>
      <Link to="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg grad-bg flex items-center justify-center">
          <Flame className="w-4 h-4 text-white" />
        </div>
        <span className="font-syne font-bold text-lg grad-text">TURNUP</span>
      </Link>

      {user && (
        <div className="hidden md:flex items-center gap-1">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
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
      )}

      <div className="hidden md:flex items-center gap-2">
        {user ? (
          <>
            {profile?.verified && (
              <span className="verified-badge">
                <Shield className="w-3 h-3" /> Verified
              </span>
            )}

            <button onClick={handleSignOut} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all">
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </>
        ) : (
          <div className="flex gap-2">
            <Link to="/auth" className="px-4 py-1.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all">Sign in</Link>
            <Link to="/auth?mode=signup" className="btn-grad text-sm px-4 py-1.5">Join Free</Link>
          </div>
        )}
      </div>

      <button
        className="md:hidden p-2 text-gray-400 hover:text-white"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {mobileOpen && (
        <div className="md:hidden absolute top-14 left-0 right-0 glass border-b border-white/5 py-3 px-4 space-y-1">
          {user ? (
            <>
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
                    location.pathname === path ? 'bg-purple-500/15 text-purple-300' : 'text-gray-400'
                  }`}
                >
                  <Icon className="w-4 h-4" /> {label}
                </Link>
              ))}
              <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400">
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/auth" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm text-gray-300">Sign in</Link>
              <Link to="/auth?mode=signup" onClick={() => setMobileOpen(false)} className="block btn-grad text-sm px-3 py-2.5 text-center">Join Free</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
