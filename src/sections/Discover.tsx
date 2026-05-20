import { useState, useEffect } from 'react'
import { Heart, X, Star, MapPin, BookOpen, Filter, CheckCircle, Crown, ChevronLeft, ChevronRight, Loader2, Share2, Copy, Music, Flame, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { toast } from 'sonner'
import type { Profile } from '@/lib/supabase'
import FollowButton from '@/components/FollowButton'
import UserFollowStats from '@/components/UserFollowStats'
import { CAMPUSES } from '@/lib/constants'

const DEMO_USERS: Profile[] = [
  { id: 'd1', name: 'Amina', age: 21, campus: 'Gretsa University', course: 'Business Administration', year: 3, bio: 'Weekend vibes only 🎉 Love dancing & good food. Looking for my squad!', photos: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop'], interests: ['Dancing', 'Food', 'Movies', 'Parties'], verified: true, online: true, gender: 'female', looking_for: 'everyone', vibe: '🎉 Party Animal', created_at: new Date().toISOString() } as any,
  { id: 'd2', name: 'Brian', age: 22, campus: 'Jomo Kenyatta University (JKUAT)', course: 'Computer Science', year: 4, bio: 'Tech bro by day, party animal by night 🚀 Always down for weekend plans', photos: ['https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop'], interests: ['Coding', 'Gaming', 'Parties', 'Music'], verified: true, premium: true, online: true, gender: 'male', looking_for: 'everyone', vibe: '🎮 Gamer', created_at: new Date().toISOString() } as any,
  { id: 'd3', name: 'Cynthia', age: 20, campus: 'Kenyatta University (KU)', course: 'Medicine', year: 2, bio: 'Med school survivor 😅 Need study buddies & weekend breaks. Coffee addict.', photos: ['https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=500&fit=crop'], interests: ['Studying', 'Netflix', 'Coffee', 'Hiking'], verified: true, online: false, gender: 'female', looking_for: 'everyone', vibe: '📚 Study Buddy', created_at: new Date().toISOString() } as any,
  { id: 'd4', name: 'David', age: 23, campus: 'Zetech University', course: 'Engineering', year: 3, bio: 'Car enthusiast 🚗 Weekend road trips. Looking for adventure partners!', photos: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop'], interests: ['Cars', 'Travel', 'Photography', 'Parties'], verified: true, online: true, gender: 'male', looking_for: 'everyone', vibe: '🏋️ Gym Rat', created_at: new Date().toISOString() } as any,
  { id: 'd5', name: 'Esther', age: 21, campus: 'KCA University - Thika Road', course: 'Finance', year: 3, bio: 'Finance girly 💰 Brunch dates and weekend turn up queen ✨', photos: ['https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop'], interests: ['Finance', 'Brunch', 'Shopping', 'Parties'], verified: true, premium: true, online: false, gender: 'female', looking_for: 'everyone', vibe: '🍔 Foodie', created_at: new Date().toISOString() } as any,
  { id: 'd6', name: 'Frank', age: 22, campus: 'Thika Technical Training Institute (TTTI)', course: 'Automotive', year: 2, bio: 'Mechanic life 🔧 Good vibes only. Always ready to link up', photos: ['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop'], interests: ['Cars', 'Music', 'Dancing', 'Socializing'], verified: true, online: true, gender: 'male', looking_for: 'everyone', vibe: '🎵 Music Head', created_at: new Date().toISOString() } as any,
]

import { motion } from 'framer-motion'

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1, 
    transition: { stiffness: 100, damping: 15 } 
  }
}

const DiscoverCard = ({ userProfile }: { userProfile: Profile }) => {
  const { user } = useAuthStore()
  const [photoIdx, setPhotoIdx] = useState(0)
  const [vibeCount, setVibeCount] = useState(userProfile.vibe_count || 0)
  const [sendingVibe, setSendingVibe] = useState(false)
  const [vibeSent, setVibeSent] = useState(false)

  const handleSendVibe = async () => {
    if (!user) return toast.error('Sign in to send vibes!')
    const today = new Date().toISOString().split('T')[0]
    const vibeKey = `vibe_${user.id}_${userProfile.id}_${today}`
    if (localStorage.getItem(vibeKey)) return toast.info('Vibe already sent today!')

    setSendingVibe(true)
    try {
      const newCount = vibeCount + 1
      await supabase.from('profiles').update({ vibe_count: newCount }).eq('id', userProfile.id)
      setVibeCount(newCount)
      setVibeSent(true)
      localStorage.setItem(vibeKey, 'true')
      setTimeout(() => setVibeSent(false), 2000)
    } catch (err) {
      setVibeCount(v => v + 1)
      setVibeSent(true)
    } finally {
      setSendingVibe(false)
    }
  }

  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0.5 }}
      whileInView={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0.5 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      viewport={{ once: false, amount: 0.6 }}
      className="discover-card card-hover group h-full w-full max-w-md mx-auto relative overflow-hidden rounded-[2.5rem] bg-[#0A0A0F] border border-white/5 shadow-2xl"
    >
      <div className="cinematic-glow opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <img
        src={userProfile.photos?.[photoIdx] || userProfile.photos?.[0]}
        alt={userProfile.name}
        className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-[1.05]"
      />

      {/* Photo nav */}
      {(userProfile.photos?.length || 0) > 1 && (
        <div className="absolute top-4 left-0 right-0 flex gap-1.5 px-6 z-20">
          {userProfile.photos?.map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i === photoIdx ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'bg-white/20'}`} />
          ))}
        </div>
      )}
      
      {/* Click areas for photo nav */}
      <div className="absolute inset-0 flex z-10">
        <div className="flex-1 cursor-pointer" onClick={() => setPhotoIdx(i => Math.max(0, i - 1))} />
        <div className="flex-1 cursor-pointer" onClick={() => setPhotoIdx(i => Math.min((userProfile.photos?.length || 1) - 1, i + 1))} />
      </div>

      {/* Gradient overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-3/4 bg-gradient-to-t from-[#030305] via-[#030305]/80 to-transparent p-6 flex flex-col justify-end pointer-events-none">
        <div className="relative z-20 pointer-events-auto transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h2 className="text-white font-syne font-black text-3xl tracking-tight truncate drop-shadow-md">{userProfile.name}, {userProfile.age}</h2>
              {userProfile.verified && <CheckCircle className="w-6 h-6 text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />}
            </div>
            <div className={`w-3.5 h-3.5 rounded-full border-2 border-[#030305] ${(userProfile as any).online ? 'bg-green-400 shadow-[0_0_12px_rgba(74,222,128,0.6)]' : 'bg-gray-600'}`} />
          </div>
          
          <div className="flex flex-col gap-2 mb-4">
            <div className="flex items-center gap-2 text-purple-200/90 text-xs font-black uppercase tracking-widest bg-white/5 w-fit px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-md">
              <MapPin className="w-3.5 h-3.5 text-purple-400" /> {userProfile.campus}
            </div>
            <div className="flex items-center gap-2 text-gray-400 text-xs font-bold px-1">
              <BookOpen className="w-3.5 h-3.5 text-pink-400/80" /> {userProfile.course}
            </div>
          </div>

          <p className="text-gray-300 text-sm leading-relaxed line-clamp-2 mb-6 font-medium">"{userProfile.bio}"</p>
          
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <FollowButton targetId={userProfile.id} className="w-full py-3.5 rounded-xl text-xs font-bold shadow-lg" />
            </div>
            <button
              onClick={handleSendVibe}
              disabled={sendingVibe}
              className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-2 border border-white/10 text-white hover:bg-white/10 active:scale-95 ${vibeSent ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.2)]' : 'glass'}`}
            >
              {sendingVibe ? <Loader2 className="w-4 h-4 animate-spin" /> : vibeSent ? '🔥 Sent' : '🔥 Vibe'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function Discover() {
  const { user, profile, fetchProfile } = useAuthStore()
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [campusFilter, setCampusFilter] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [activeFilter, setActiveFilter] = useState<'All' | 'Same University' | 'Same Course' | 'Online Now'>('All')
  
  const [showKadiBanner, setShowKadiBanner] = useState(() => !localStorage.getItem('kadi_banner_dismissed') && !localStorage.getItem('kadi_registered_locally') && !profile?.is_registered_voter)
  const [kadiCollapsed, setKadiCollapsed] = useState(false)
  const [showSharePrompt, setShowSharePrompt] = useState(false)
  const [registeringKadi, setRegisteringKadi] = useState(false)

  useEffect(() => {
    if (profile?.is_registered_voter || localStorage.getItem('kadi_registered_locally')) setShowKadiBanner(false)
  }, [profile?.is_registered_voter])

  useEffect(() => {
    loadUsers()
  }, [])

  const handleRegisterKadi = async () => {
    if (!user) return
    setRegisteringKadi(true)
    try {
      await supabase.from('profiles').update({ is_registered_voter: true }).eq('id', user.id)
      await fetchProfile(user.id)
      localStorage.setItem('kadi_registered_locally', 'true')
      setShowSharePrompt(true)
    } catch (err) {
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

  let filteredUsers = users
  if (activeFilter === 'Same University' && profile?.campus) {
    filteredUsers = users.filter(u => u.campus === profile.campus)
  } else if (activeFilter === 'Same Course' && profile?.course) {
    filteredUsers = users.filter(u => u.course === profile.course)
  } else if (activeFilter === 'Online Now') {
    filteredUsers = users.filter(u => (u as any).online)
  }

  if (campusFilter) {
    filteredUsers = filteredUsers.filter(u => u.campus?.includes(campusFilter))
  }

  if (loading) return (
    <main className="min-h-screen pt-20 flex items-center justify-center bg-[#08080F]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
        <p className="text-gray-600 font-black text-[10px] uppercase tracking-widest">Loading Vibes...</p>
      </div>
    </main>
  )

  return (
    <main className="page-main relative overflow-hidden bg-[#08080F]">
      {/* Kenyan Flag Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 z-[60] flex">
        <div className="flex-1 bg-black" />
        <div className="flex-1 bg-red-600" />
        <div className="flex-1 bg-green-600" />
      </div>

      <div className="container-responsive pb-24">


        <div className="flex flex-col gap-5 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-syne font-black text-3xl text-white tracking-tight leading-none mb-1.5">Discover</h1>
              <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Connect with Thika Road Students</p>
            </div>
            <button 
              onClick={() => setShowFilter(!showFilter)} 
              className={`w-12 h-12 rounded-2xl transition-all flex items-center justify-center border ${showFilter ? 'bg-purple-500 border-purple-500 text-white shadow-lg shadow-purple-500/20' : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'}`}
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-purple-400 transition-colors" />
            <input 
              className="w-full bg-[#0F0F1A]/80 backdrop-blur-xl border border-white/5 rounded-2xl py-4.5 pl-12 pr-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/30 transition-all shadow-xl"
              placeholder="Search by name, course or vibe..."
            />
          </div>
        </div>

        {showKadiBanner && !kadiCollapsed && (
          <div className="bg-gradient-to-br from-[#0F0F1A] to-[#08080F] border border-white/5 rounded-[32px] p-6 mb-8 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 right-0 h-1.5 flex">
              <div className="flex-1 bg-black" />
              <div className="flex-1 bg-red-600" />
              <div className="flex-1 bg-green-600" />
            </div>
            <button onClick={() => setKadiCollapsed(true)} className="absolute top-4 right-4 text-gray-600 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black text-white mb-4 uppercase tracking-widest">🇰🇪 2027 Ready</div>
            <h2 className="font-syne font-black text-2xl text-white mb-4 leading-tight">Uko na KADI? <br /> Your vote is your power.</h2>
            <div className="flex gap-3">
              <button onClick={handleRegisterKadi} className="flex-1 py-3.5 rounded-2xl bg-red-600 text-white font-black uppercase text-[10px] tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20">Yes, I'm Registered</button>
              <button onClick={dismissKadiBanner} className="flex-1 py-3.5 rounded-2xl bg-white/5 text-white font-bold text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5">Maybe Later</button>
            </div>
          </div>
        )}

        <div className="flex overflow-x-auto pb-6 gap-2 no-scrollbar">
          {['All', 'Same University', 'Same Course', 'Online Now'].map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f as any)}
              className={`whitespace-nowrap px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeFilter === f 
                  ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20 border-purple-400' 
                  : 'bg-white/5 text-gray-500 border border-white/5 hover:bg-white/10'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {showFilter && (
          <div className="bg-[#0F0F1A] border border-white/5 p-6 rounded-[32px] mb-8 animate-in fade-in slide-in-from-top-4">
            <h4 className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-4">Quick Filter Campus</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button 
                onClick={() => setCampusFilter('')}
                className={`text-left px-5 py-3.5 rounded-2xl text-xs font-bold transition-all ${!campusFilter ? 'bg-purple-500 text-white shadow-lg' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}
              >
                All Campuses
              </button>
              {CAMPUSES.map(c => (
                <button 
                  key={c}
                  onClick={() => setCampusFilter(c)}
                  className={`text-left px-5 py-3.5 rounded-2xl text-xs font-bold transition-all ${campusFilter === c ? 'bg-purple-500 text-white shadow-lg' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {filteredUsers.length > 0 ? (
          <div 
            className="flex flex-col gap-6 overflow-y-auto h-[calc(100vh-220px)] no-scrollbar pb-20"
            style={{ scrollSnapType: 'y mandatory' }}
          >
            {filteredUsers.map(userProfile => (
              <div key={userProfile.id} style={{ scrollSnapAlign: 'start' }} className="flex-shrink-0 h-full">
                <DiscoverCard userProfile={userProfile} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/5 rounded-[40px] border border-dashed border-white/10">
            <div className="w-20 h-20 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-purple-500/50" />
            </div>
            <h3 className="text-white font-black text-xl mb-2">No more vibes?</h3>
            <p className="text-gray-500 text-sm font-medium mb-8">Try changing your filters or check back later.</p>
            <button onClick={loadUsers} className="px-8 py-3 rounded-2xl grad-bg text-white font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all">Refresh Feed</button>
          </div>
        )}
      </div>
    </main>
  )
}
