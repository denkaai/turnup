import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, BookOpen, CheckCircle, Loader2, X, Flame, UserPlus, Sparkles, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { toast } from 'sonner'
import type { Profile } from '@/lib/supabase'
import FollowButton from '@/components/FollowButton'
import { CAMPUSES } from '@/lib/constants'
import { motion, AnimatePresence } from 'framer-motion'

/* ─── Demo users (unchanged) ─────────────────────────────────────────────── */
const DEMO_USERS: Profile[] = [
  { id: 'd1', name: 'Amina', age: 21, campus: 'Gretsa University', course: 'Business Administration', year: 3, bio: 'Weekend vibes only 🎉 Love dancing & good food. Looking for my squad!', photos: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop'], interests: ['Dancing', 'Food', 'Movies', 'Parties'], verified: true, online: true, gender: 'female', looking_for: 'everyone', vibe: '🎉 Party Animal', created_at: new Date().toISOString() } as any,
  { id: 'd2', name: 'Brian', age: 22, campus: 'Jomo Kenyatta University (JKUAT)', course: 'Computer Science', year: 4, bio: 'Tech bro by day, party animal by night 🚀 Always down for weekend plans', photos: ['https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop'], interests: ['Coding', 'Gaming', 'Parties', 'Music'], verified: true, premium: true, online: true, gender: 'male', looking_for: 'everyone', vibe: '🎮 Gamer', created_at: new Date().toISOString() } as any,
  { id: 'd3', name: 'Cynthia', age: 20, campus: 'Kenyatta University (KU)', course: 'Medicine', year: 2, bio: 'Med school survivor 😅 Need study buddies & weekend breaks. Coffee addict.', photos: ['https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=500&fit=crop'], interests: ['Studying', 'Netflix', 'Coffee', 'Hiking'], verified: true, online: false, gender: 'female', looking_for: 'everyone', vibe: '📚 Study Buddy', created_at: new Date().toISOString() } as any,
  { id: 'd4', name: 'David', age: 23, campus: 'Zetech University', course: 'Engineering', year: 3, bio: 'Car enthusiast 🚗 Weekend road trips. Looking for adventure partners!', photos: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop'], interests: ['Cars', 'Travel', 'Photography', 'Parties'], verified: true, online: true, gender: 'male', looking_for: 'everyone', vibe: '🏋️ Gym Rat', created_at: new Date().toISOString() } as any,
  { id: 'd5', name: 'Esther', age: 21, campus: 'KCA University - Thika Road', course: 'Finance', year: 3, bio: 'Finance girly 💰 Brunch dates and weekend turn up queen ✨', photos: ['https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop'], interests: ['Finance', 'Brunch', 'Shopping', 'Parties'], verified: true, premium: true, online: false, gender: 'female', looking_for: 'everyone', vibe: '🍔 Foodie', created_at: new Date().toISOString() } as any,
  { id: 'd6', name: 'Frank', age: 22, campus: 'Thika Technical Training Institute (TTTI)', course: 'Automotive', year: 2, bio: 'Mechanic life 🔧 Good vibes only. Always ready to link up', photos: ['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop'], interests: ['Cars', 'Music', 'Dancing', 'Socializing'], verified: true, online: true, gender: 'male', looking_for: 'everyone', vibe: '🎵 Music Head', created_at: new Date().toISOString() } as any,
]

/* ─── Shimmer skeleton ────────────────────────────────────────────────────── */
const ShimmerCard = ({ featured = false }: { featured?: boolean }) => (
  <div className={`discover-card-shell ${featured ? 'col-span-full' : ''} rounded-[28px] overflow-hidden`}>
    <div className={`shimmer-bg ${featured ? 'h-[420px]' : 'h-[340px]'} w-full`} />
    <div className="p-4 space-y-3 bg-[#0d0d14]">
      <div className="shimmer-bg h-5 w-2/3 rounded-full" />
      <div className="shimmer-bg h-3 w-1/2 rounded-full" />
      <div className="flex gap-2">
        <div className="shimmer-bg h-8 flex-1 rounded-full" />
        <div className="shimmer-bg h-8 flex-1 rounded-full" />
      </div>
    </div>
  </div>
)

/* ─── Interest chip ───────────────────────────────────────────────────────── */
const vibeEmoji: Record<string, string> = {
  Dancing: '💃', Food: '🍔', Movies: '🎬', Parties: '🎉',
  Coding: '💻', Gaming: '🎮', Music: '🎵', Studying: '📚',
  Netflix: '📺', Coffee: '☕', Hiking: '🥾', Cars: '🚗',
  Travel: '✈️', Photography: '📸', Finance: '💰', Brunch: '🥂',
  Shopping: '🛍️', Socializing: '🤝', default: '✨',
}
const InterestChip = ({ label }: { label: string }) => (
  <span className="interest-chip">
    {vibeEmoji[label] ?? vibeEmoji.default} {label}
  </span>
)

/* ─── Profile card ────────────────────────────────────────────────────────── */
const DiscoverCard = ({
  userProfile,
  featured = false,
  index = 0,
}: {
  userProfile: Profile
  featured?: boolean
  index?: number
}) => {
  const { user } = useAuthStore()
  const [photoIdx, setPhotoIdx] = useState(0)
  const [vibeCount, setVibeCount] = useState(userProfile.vibe_count || 0)
  const [sendingVibe, setSendingVibe] = useState(false)
  const [vibeSent, setVibeSent] = useState(false)
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null)
  const isOnline = (userProfile as any).online

  const handleSendVibe = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!user) return toast.error('Sign in to send vibes!')
    const rect = e.currentTarget.getBoundingClientRect()
    setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    setTimeout(() => setRipple(null), 600)

    const today = new Date().toISOString().split('T')[0]
    const vibeKey = `vibe_${user.id}_${userProfile.id}_${today}`
    if (localStorage.getItem(vibeKey)) return toast.info('Vibe already sent today!')

    setSendingVibe(true)
    const prevCount = vibeCount
    setVibeCount(v => v + 1)
    try {
      const { error } = await supabase.from('profiles').update({ vibe_count: vibeCount + 1 }).eq('id', userProfile.id)
      if (error) throw error
      setVibeSent(true)
      localStorage.setItem(vibeKey, 'true')
      setTimeout(() => setVibeSent(false), 2000)
    } catch {
      setVibeCount(prevCount)
      toast.error('Could not send vibe. Try again!')
    } finally {
      setSendingVibe(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.08, type: 'spring', stiffness: 200, damping: 24 }}
      className={`discover-card-shell group ${featured ? 'col-span-full' : ''}`}
    >
      {/* gradient border glow on hover */}
      <div className="card-glow-border" />

      {/* photo */}
      <div className={`relative w-full overflow-hidden rounded-t-[26px] ${featured ? 'h-[400px] sm:h-[460px]' : 'h-[280px] sm:h-[320px]'}`}>
        <img
          src={userProfile.photos?.[photoIdx] || userProfile.photos?.[0]}
          alt={userProfile.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />

        {/* photo strip nav */}
        {(userProfile.photos?.length || 0) > 1 && (
          <div className="absolute top-3 left-0 right-0 flex gap-1 px-4 z-20">
            {userProfile.photos?.map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-[3px] rounded-full transition-all ${i === photoIdx ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]' : 'bg-white/25'}`}
              />
            ))}
          </div>
        )}

        {/* click zones */}
        <div className="absolute inset-0 flex z-10">
          <div className="flex-1" onClick={() => setPhotoIdx(i => Math.max(0, i - 1))} />
          <div className="flex-1" onClick={() => setPhotoIdx(i => Math.min((userProfile.photos?.length || 1) - 1, i + 1))} />
        </div>

        {/* badges top-right */}
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5 items-end">
          {userProfile.premium && (
            <span className="premium-badge">
              <span className="text-[10px]">👑</span> PRO
            </span>
          )}
          {isOnline && (
            <span className="online-pulse-badge">
              <span className="online-dot" />
              Live
            </span>
          )}
        </div>
      </div>

      {/* info panel — frosted glass */}
      <div className="card-info-panel">
        {/* name row */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-white font-syne font-black text-xl sm:text-2xl tracking-tight leading-none truncate">
              {userProfile.name}, {userProfile.age}
            </h2>
            {userProfile.verified && (
              <CheckCircle className="w-5 h-5 text-purple-400 flex-shrink-0 drop-shadow-[0_0_6px_rgba(168,85,247,0.7)]" />
            )}
          </div>
          {userProfile.vibe && (
            <span className="vibe-tag">{userProfile.vibe}</span>
          )}
        </div>

        {/* campus + course */}
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          <div className="meta-chip">
            <MapPin className="w-3 h-3 text-purple-400" />
            <span className="truncate max-w-[160px]">{userProfile.campus}</span>
          </div>
          <div className="meta-chip">
            <BookOpen className="w-3 h-3 text-pink-400" />
            <span>{userProfile.course}</span>
          </div>
        </div>

        {/* bio */}
        <p className="text-gray-400 text-xs sm:text-sm leading-relaxed line-clamp-2 mb-3 italic">
          "{userProfile.bio}"
        </p>

        {/* interests */}
        {(userProfile.interests?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {userProfile.interests?.slice(0, 4).map(tag => (
              <InterestChip key={tag} label={tag} />
            ))}
          </div>
        )}

        {/* action buttons — below photo / outside photo area */}
        <div className="flex gap-2.5">
          <FollowButton
            targetId={userProfile.id}
            className="flex-1 py-3 rounded-2xl text-xs font-black shadow-lg"
          />
          <button
            onClick={handleSendVibe}
            disabled={sendingVibe}
            className={`relative flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 overflow-hidden
              ${vibeSent
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
              }`}
          >
            {ripple && (
              <span
                className="ripple-effect"
                style={{ left: ripple.x, top: ripple.y }}
              />
            )}
            {sendingVibe
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : vibeSent
                ? <><Sparkles className="w-4 h-4" /> Sent!</>
                : <><Flame className="w-4 h-4 text-orange-400" /> Vibe ({vibeCount})</>
            }
          </button>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Cycling placeholder hook ────────────────────────────────────────────── */
const PLACEHOLDERS = [
  'Search by name…',
  'Search by vibe…',
  'Search by course…',
  'Search by campus…',
]
function useCyclingPlaceholder() {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % PLACEHOLDERS.length), 2800)
    return () => clearInterval(t)
  }, [])
  return PLACEHOLDERS[idx]
}

/* ─── Filter config ───────────────────────────────────────────────────────── */
const FILTERS = [
  { key: 'All', label: '⚡ All' },
  { key: 'Same University', label: '🏫 Same Uni' },
  { key: 'Same Course', label: '📚 Same Course' },
  { key: 'Online Now', label: '🟢 Online Now' },
] as const
type FilterKey = typeof FILTERS[number]['key']

/* ─── Main page ───────────────────────────────────────────────────────────── */
export default function Discover() {
  const { user, profile, fetchProfile } = useAuthStore()
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [campusFilter, setCampusFilter] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterKey>('All')
  const placeholder = useCyclingPlaceholder()
  const searchRef = useRef<HTMLInputElement>(null)

  const [showKadiBanner, setShowKadiBanner] = useState(
    () => !localStorage.getItem('kadi_banner_dismissed') &&
          !localStorage.getItem('kadi_registered_locally') &&
          !profile?.is_registered_voter
  )
  const [kadiCollapsed, setKadiCollapsed] = useState(false)
  const [showSharePrompt, setShowSharePrompt] = useState(false)
  const [registeringKadi, setRegisteringKadi] = useState(false)

  useEffect(() => {
    if (profile?.is_registered_voter || localStorage.getItem('kadi_registered_locally'))
      setShowKadiBanner(false)
  }, [profile?.is_registered_voter])

  useEffect(() => { loadUsers() }, [])

  const handleRegisterKadi = async () => {
    if (!user) return
    setRegisteringKadi(true)
    try {
      await supabase.from('profiles').update({ is_registered_voter: true }).eq('id', user.id)
      await fetchProfile(user.id)
      localStorage.setItem('kadi_registered_locally', 'true')
      setShowSharePrompt(true)
    } catch {
      localStorage.setItem('kadi_registered_locally', 'true')
      setShowSharePrompt(true)
    } finally {
      setRegisteringKadi(false)
    }
  }

  const dismissKadiBanner = () => {
    localStorage.setItem('kadi_banner_dismissed', 'true')
    setShowKadiBanner(false)
  }

  const copyShareLink = () => {
    navigator.clipboard.writeText("I'm registered to vote in 2027! Are you? Get your KADI badge on TurnUp. https://turnupcampus.netlify.app/")
    toast.success('Link copied! Share it with friends.')
    dismissKadiBanner()
  }

  const loadUsers = async () => {
    setLoading(true)
    try {
      if (!user) { setUsers(DEMO_USERS); setLoading(false); return }
      const { data, error } = await supabase.from('profiles').select('*').neq('id', user.id).limit(20)
      if (error || !data?.length) setUsers(DEMO_USERS)
      else setUsers(data as Profile[])
    } catch {
      setUsers(DEMO_USERS)
    } finally {
      setLoading(false)
    }
  }

  /* ─── filter logic (unchanged) ───────────────────────────────────────── */
  let filteredUsers = users
  if (activeFilter === 'Same University' && profile?.campus)
    filteredUsers = users.filter(u => u.campus === profile.campus)
  else if (activeFilter === 'Same Course' && profile?.course)
    filteredUsers = users.filter(u => u.course === profile.course)
  else if (activeFilter === 'Online Now')
    filteredUsers = users.filter(u => (u as any).online)

  if (campusFilter)
    filteredUsers = filteredUsers.filter(u => u.campus?.includes(campusFilter))

  if (search.trim())
    filteredUsers = filteredUsers.filter(u =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.course?.toLowerCase().includes(search.toLowerCase()) ||
      u.vibe?.toLowerCase().includes(search.toLowerCase())
    )

  const onlineCount = users.filter(u => (u as any).online).length

  /* ─── featured card + grid ───────────────────────────────────────────── */
  const [featured, ...rest] = filteredUsers

  return (
    <main className="page-main relative overflow-hidden bg-[#06060F] min-h-screen">

      {/* ── ambient orbs ───────────────────────────────────────────────── */}
      <div className="ambient-orb orb-purple" />
      <div className="ambient-orb orb-pink" />

      {/* ── Kenyan flag bar ─────────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 h-1 z-[60] flex">
        <div className="flex-1 bg-black" />
        <div className="flex-1 bg-red-600" />
        <div className="flex-1 bg-green-600" />
      </div>

      <div className="container-responsive pb-28">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-6 pt-2"
        >
          <div>
            <h1 className="font-syne font-black text-4xl sm:text-5xl tracking-tight leading-none discover-gradient-text mb-1">
              Discover
            </h1>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">
              Connect with Campus Students
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {onlineCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="online-count-badge"
              >
                <span className="online-dot-sm" />
                {onlineCount} online
              </motion.span>
            )}
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center border transition-all ${
                showFilter
                  ? 'bg-gradient-to-br from-purple-600 to-pink-600 border-transparent text-white shadow-lg shadow-purple-500/30'
                  : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <Users className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* ── Search bar ──────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative mb-5 group"
        >
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-purple-400 transition-colors pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" strokeWidth="2" />
            <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            ref={searchRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={placeholder}
            className="search-input"
          />
          <AnimatePresence>
            {search && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => { setSearch(''); searchRef.current?.focus() }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/20 transition-all"
              >
                <X className="w-3 h-3" />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Filter pills ─────────────────────────────────────────────────── */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-1">
          {FILTERS.map(({ key, label }, i) => (
            <motion.button
              key={key}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.06 }}
              onClick={() => setActiveFilter(key)}
              className={`filter-pill whitespace-nowrap ${activeFilter === key ? 'filter-pill-active' : 'filter-pill-inactive'}`}
            >
              {label}
            </motion.button>
          ))}
        </div>

        {/* ── Campus filter panel ──────────────────────────────────────────── */}
        <AnimatePresence>
          {showFilter && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-[#0F0F1A] border border-white/5 p-5 rounded-[24px]">
                <h4 className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-3">Filter by Campus</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => setCampusFilter('')}
                    className={`text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all ${!campusFilter ? 'bg-gradient-to-r from-purple-600/80 to-pink-600/80 text-white shadow-lg' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}
                  >
                    All Campuses
                  </button>
                  {CAMPUSES.map(c => (
                    <button
                      key={c}
                      onClick={() => setCampusFilter(c)}
                      className={`text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all ${campusFilter === c ? 'bg-gradient-to-r from-purple-600/80 to-pink-600/80 text-white shadow-lg' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── KADI banner ──────────────────────────────────────────────────── */}
        <AnimatePresence>
          {showKadiBanner && !kadiCollapsed && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gradient-to-br from-[#0F0F1A] to-[#08080F] border border-white/5 rounded-[28px] p-5 mb-6 relative overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 flex">
                <div className="flex-1 bg-black" />
                <div className="flex-1 bg-red-600" />
                <div className="flex-1 bg-green-600" />
              </div>
              <button onClick={() => setKadiCollapsed(true)} className="absolute top-4 right-4 text-gray-600 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
              <div className="inline-block px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black text-white mb-3 uppercase tracking-widest">🇰🇪 2027 Ready</div>
              <h2 className="font-syne font-black text-xl text-white mb-4 leading-tight">Uko na KADI? <br /> Your vote is your power.</h2>
              {showSharePrompt ? (
                <button onClick={copyShareLink} className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black uppercase text-[10px] tracking-widest shadow-lg">
                  📲 Share & Earn Badge
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={handleRegisterKadi} disabled={registeringKadi} className="flex-1 py-3 rounded-2xl bg-red-600 text-white font-black uppercase text-[10px] tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20">
                    {registeringKadi ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Yes, I'm Registered"}
                  </button>
                  <button onClick={dismissKadiBanner} className="flex-1 py-3 rounded-2xl bg-white/5 text-white font-bold text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5">
                    Maybe Later
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Cards grid ─────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <ShimmerCard featured />
            <ShimmerCard />
            <ShimmerCard />
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {featured && (
              <DiscoverCard key={featured.id} userProfile={featured} featured index={0} />
            )}
            {rest.map((u, i) => (
              <DiscoverCard key={u.id} userProfile={u} index={i + 1} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-white/[0.02] rounded-[32px] border border-dashed border-white/10"
          >
            <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-purple-500/50" />
            </div>
            <h3 className="text-white font-black text-lg mb-2">No vibes here yet</h3>
            <p className="text-gray-500 text-sm mb-6">Try changing your filters or check back later.</p>
            <button onClick={loadUsers} className="px-8 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all">
              Refresh Feed
            </button>
          </motion.div>
        )}
      </div>
    </main>
  )
}
