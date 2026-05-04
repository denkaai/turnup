import { useState, useEffect } from 'react'
import { Heart, X, Star, MapPin, BookOpen, Filter, CheckCircle, Crown, ChevronLeft, ChevronRight, Loader2, Share2, Copy, Music, Flame } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { toast } from 'sonner'
import type { Profile } from '@/lib/supabase'
import FollowButton from '@/components/FollowButton'
import UserFollowStats from '@/components/UserFollowStats'

const DEMO_USERS: Profile[] = [
  { id: 'd1', name: 'Amina', age: 21, campus: 'Mount Kenya University (MKU)', course: 'Business Administration', year: 3, bio: 'Weekend vibes only 🎉 Love dancing & good food. Looking for my squad!', photos: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop'], interests: ['Dancing', 'Food', 'Movies', 'Parties'], verified: true, premium: false, online: true, gender: 'female', looking_for: 'everyone', vibe: '🎉 Party Animal', weekend_plan: 'Clubbing 🥂', relationship_goal: 'Just vibing 😎', premium_until: null, created_at: new Date().toISOString() } as any,
  { id: 'd2', name: 'Brian', age: 22, campus: 'JKUAT', course: 'Computer Science', year: 4, bio: 'Tech bro by day, party animal by night 🚀 Always down for weekend plans', photos: ['https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop'], interests: ['Coding', 'Gaming', 'Parties', 'Music'], verified: true, premium: true, online: true, gender: 'male', looking_for: 'everyone', vibe: '🎮 Gamer', weekend_plan: 'House party 🏠', relationship_goal: 'New friends 👥', premium_until: null, created_at: new Date().toISOString() } as any,
  { id: 'd3', name: 'Cynthia', age: 20, campus: 'Kenyatta University', course: 'Medicine', year: 2, bio: 'Med school survivor 😅 Need study buddies & weekend breaks. Coffee addict.', photos: ['https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=500&fit=crop'], interests: ['Studying', 'Netflix', 'Coffee', 'Hiking'], verified: true, premium: false, online: false, gender: 'female', looking_for: 'everyone', vibe: '📚 Study Buddy', weekend_plan: 'Netflix & chill 🛋️', relationship_goal: 'Study partner 📖', premium_until: null, created_at: new Date().toISOString() } as any,
  { id: 'd4', name: 'David', age: 23, campus: 'Zetech University', course: 'Engineering', year: 3, bio: 'Car enthusiast 🚗 Weekend road trips. Looking for adventure partners!', photos: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop'], interests: ['Cars', 'Travel', 'Photography', 'Parties'], verified: true, premium: false, online: true, gender: 'male', looking_for: 'everyone', vibe: '🏋️ Gym Rat', weekend_plan: 'Nyama choma 🍖', relationship_goal: 'Weekend plans only 🗓️', premium_until: null, created_at: new Date().toISOString() } as any,
  { id: 'd5', name: 'Esther', age: 21, campus: 'KCA University', course: 'Finance', year: 3, bio: 'Finance girly 💰 Brunch dates and weekend turn up queen ✨', photos: ['https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop'], interests: ['Finance', 'Brunch', 'Shopping', 'Parties'], verified: true, premium: true, online: false, gender: 'female', looking_for: 'everyone', vibe: '🍔 Foodie', weekend_plan: 'Clubbing 🥂', relationship_goal: 'Something serious 💍', premium_until: null, created_at: new Date().toISOString() } as any,
  { id: 'd6', name: 'Frank', age: 22, campus: 'Thika Technical Training Institute', course: 'Automotive', year: 2, bio: 'Mechanic life 🔧 Good vibes only. Always ready to link up', photos: ['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop'], interests: ['Cars', 'Music', 'Dancing', 'Socializing'], verified: true, premium: false, online: true, gender: 'male', looking_for: 'everyone', vibe: '🎵 Music Head', weekend_plan: 'Still deciding 😂', relationship_goal: 'New friends 👥', premium_until: null, created_at: new Date().toISOString() } as any,
]

const DiscoverCard = ({ userProfile }: { userProfile: Profile }) => {
  const { user } = useAuthStore()
  const [photoIdx, setPhotoIdx] = useState(0)
  const [vibeCount, setVibeCount] = useState(userProfile.vibe_count || 0)
  const [sendingVibe, setSendingVibe] = useState(false)
  const [vibeSent, setVibeSent] = useState(false)

  const handleSendVibe = async () => {
    if (!user) {
      toast.error('Sign in to send vibes!')
      return
    }

    const today = new Date().toISOString().split('T')[0]
    const vibeKey = `vibe_${user.id}_${userProfile.id}_${today}`

    if (localStorage.getItem(vibeKey)) {
      toast.info('You already sent a vibe to this person today!')
      return
    }

    setSendingVibe(true)
    try {
      const newCount = vibeCount + 1
      const { error } = await supabase.from('profiles').update({ vibe_count: newCount }).eq('id', userProfile.id)
      
      if (error) console.warn('Supabase update failed, falling back to local', error)
      
      setVibeCount(newCount)
      setVibeSent(true)
      localStorage.setItem(vibeKey, 'true')
      setTimeout(() => setVibeSent(false), 2000)
    } catch (err) {
      console.warn(err)
      setVibeCount(v => v + 1)
      setVibeSent(true)
      localStorage.setItem(vibeKey, 'true')
      setTimeout(() => setVibeSent(false), 2000)
    } finally {
      setSendingVibe(false)
    }
  }

  return (
    <div className="discover-card card-hover">
      <img
        src={userProfile.photos?.[photoIdx] || userProfile.photos?.[0]}
        alt={userProfile.name}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />

      {/* Photo nav */}
      {(userProfile.photos?.length || 0) > 1 && (
        <div className="absolute top-3 left-0 right-0 flex gap-1 px-4 z-20">
          {userProfile.photos?.map((_, i) => (
            <div key={i} className={`flex-1 h-0.5 rounded-full transition-all ${i === photoIdx ? 'bg-white' : 'bg-white/30'}`} />
          ))}
        </div>
      )}
      {photoIdx > 0 && (
        <button onClick={() => setPhotoIdx(i => i - 1)} className="absolute left-0 top-0 bottom-24 w-1/3 z-10" />
      )}
      {photoIdx < (userProfile.photos?.length || 1) - 1 && (
        <button onClick={() => setPhotoIdx(i => i + 1)} className="absolute right-0 top-0 bottom-24 w-1/3 z-10" />
      )}

      {/* Gradient overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-4/5 bg-gradient-to-t from-[#080810] via-[#080810]/80 to-transparent p-4 sm:p-6 flex flex-col justify-end pointer-events-none">
        <div className="flex items-start justify-between pointer-events-auto">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-white font-syne font-black text-xl sm:text-2xl truncate">{userProfile.name}, {userProfile.age}</h2>
              {userProfile.verified && <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />}
            </div>
            
            <div className="flex flex-col gap-1 mb-3">
              <div className="flex items-center gap-1.5 text-gray-300 text-[10px] sm:text-xs font-bold uppercase tracking-tight">
                <MapPin className="w-3 h-3 text-purple-400" /> {userProfile.campus}
              </div>
              <div className="flex items-center gap-1.5 text-gray-400 text-[10px] sm:text-xs font-medium">
                <BookOpen className="w-3 h-3 text-purple-400" /> {userProfile.course} · Yr {userProfile.year}
              </div>
              {vibeCount > 0 && (
                <div className="flex items-center gap-1.5 text-orange-400 text-[10px] sm:text-xs font-black uppercase tracking-widest mt-0.5">
                  <Flame className="w-3 h-3" /> {vibeCount} vibes
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mb-4 pointer-events-auto">
              <div className="flex-1">
                <FollowButton targetId={userProfile.id} className="w-full text-[10px]" />
              </div>
              <div className="flex-1">
                <button
                  onClick={handleSendVibe}
                  disabled={sendingVibe || (user && localStorage.getItem(`vibe_${user.id}_${userProfile.id}_${new Date().toISOString().split('T')[0]}`) !== null)}
                  className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1 border border-orange-500/50 text-orange-400 hover:bg-orange-500/10 ${vibeSent ? 'animate-bounce bg-orange-500/20' : ''} ${user && localStorage.getItem(`vibe_${user.id}_${userProfile.id}_${new Date().toISOString().split('T')[0]}`) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {sendingVibe ? <Loader2 className="w-3 h-3 animate-spin" /> : vibeSent ? '🔥 Sent!' : '🔥 Send Vibe'}
                </button>
              </div>
            </div>
          </div>
          <div className={`w-3 h-3 rounded-full mt-2 border-2 border-[#080810] flex-shrink-0 ${(userProfile as any).online ? 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]' : 'bg-gray-600'}`} />
        </div>
        
        <p className="text-gray-300 text-[11px] sm:text-xs leading-relaxed line-clamp-2 pointer-events-auto mb-3 italic">"{userProfile.bio}"</p>
        
        <div className="flex flex-wrap gap-1.5 pointer-events-auto">
          {userProfile.vibe && (
            <span className="px-2 py-0.5 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-200 text-[9px] font-black uppercase tracking-widest">{userProfile.vibe}</span>
          )}
          {userProfile.interests?.slice(0, 3).map((interest: string) => (
             <span key={interest} className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-white/70 text-[9px] font-black uppercase tracking-widest">{interest}</span>
          ))}
        </div>
      </div>
    </div>
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
      const { error } = await supabase.from('profiles').update({ is_registered_voter: true }).eq('id', user.id)
      if (error) {
        console.warn('Supabase update failed, falling back to local state:', error)
      } else {
        await fetchProfile(user.id)
      }
      localStorage.setItem('kadi_registered_locally', 'true')
      setShowSharePrompt(true)
    } catch (err: any) {
      console.warn('Error during KADI register, falling back to local state:', err)
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
    toast.success('Link copied to clipboard! Share it with friends.')
    dismissKadiBanner()
  }

  const loadUsers = async () => {
    setLoading(true)
    try {
      if (!user) { setUsers(DEMO_USERS); setLoading(false); return }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .limit(20)

      if (error || !data?.length) {
        setUsers(DEMO_USERS)
      } else {
        setUsers(data as Profile[])
      }
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
    <main className="min-h-screen pt-20 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
    </main>
  )

  return (
    <main className="page-main">
      <div className="container-responsive">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="font-syne font-black text-xl sm:text-2xl text-white tracking-tight">Discover</h1>
            <p className="text-gray-600 text-[10px] sm:text-xs uppercase font-black tracking-widest">Find your people</p>
          </div>
          <button onClick={() => setShowFilter(!showFilter)} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center">
            <Filter className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {showKadiBanner && (
          kadiCollapsed ? (
            <div className="flex justify-center mb-6">
              <button onClick={() => setKadiCollapsed(false)} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2 shadow-lg">
                🇰🇪 Jisajili 2027
              </button>
            </div>
          ) : (
            <div className="card mb-6 overflow-hidden animate-fade-in relative border-white/10 bg-gradient-to-br from-white/5 to-[#080810]">
              <div className="absolute top-0 left-0 right-0 h-1.5 flex">
                <div className="flex-1 bg-[#000000]" />
                <div className="flex-1 bg-[#BB0000]" />
                <div className="flex-1 bg-[#006600]" />
              </div>
              <button onClick={() => setKadiCollapsed(true)} className="absolute top-3 right-10 p-1.5 rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all z-10" title="Collapse">
                <ChevronLeft className="w-4 h-4 -rotate-90" />
              </button>
              <button onClick={dismissKadiBanner} className="absolute top-3 right-3 p-1.5 rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all z-10" title="Dismiss">
                <X className="w-4 h-4" />
              </button>
              <div className="p-5 pt-6">
                <div className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-black uppercase tracking-widest text-white mb-4">
                  🇰🇪 2027 GENERAL ELECTION
                </div>
                <h2 className="font-syne font-black text-xl sm:text-2xl text-white tracking-tight mb-5 leading-tight">Uko na KADI? Kura yako = nguvu yako.</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="pl-4 border-l-4 border-[#006600] py-1">
                    <p className="text-gray-300 text-sm font-medium italic">"Gen Z moja. Kura moja. Kenya moja. Pata KADI yako." 🇰🇪</p>
                  </div>
                  <div className="pl-4 border-l-4 border-[#BB0000] py-1">
                    <p className="text-gray-300 text-sm font-medium italic">"KADI = sauti yako. Bila KADI, unasema nini?" 🎤</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6 text-sm text-gray-400">
                  <div className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">1</div>
                    <p>Nenda Huduma Centre karibu nawe — beba original ID yako ya kitaifa</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">2</div>
                    <p>Jisajili kama mpiga kura — inachukua dakika 10 tu</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">3</div>
                    <p>Pata KADI yako — wewe ni sehemu ya mabadiliko ya 2027</p>
                  </div>
                </div>

                {!showSharePrompt ? (
                  <div className="flex flex-col gap-3">
                    <button onClick={handleRegisterKadi} disabled={registeringKadi} className="w-full py-3.5 rounded-xl bg-[#BB0000] hover:bg-[#990000] text-white font-black uppercase tracking-widest text-[10px] transition-all shadow-[0_0_20px_rgba(187,0,0,0.3)] flex items-center justify-center gap-2 min-h-[44px]">
                      {registeringKadi ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Ndio, nimejisajili
                    </button>
                    <a href="https://www.huduma.go.ke" target="_blank" rel="noreferrer" className="w-full py-3.5 rounded-xl border-2 border-white/10 hover:bg-white/5 text-white font-bold text-[10px] uppercase tracking-widest text-center transition-all flex items-center justify-center gap-2 min-h-[44px]">
                      Pata Huduma Centre karibu nawe <ChevronRight className="w-4 h-4" />
                    </a>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-[#006600]/10 border border-[#006600]/30 text-center animate-fade-in">
                    <h3 className="text-white font-black text-lg mb-2">Asante! 🇰🇪</h3>
                    <p className="text-sm text-gray-300 mb-4 font-medium italic">Waambie marafiki wako! Share your KADI badge.</p>
                    <button onClick={copyShareLink} className="w-full py-3 rounded-xl bg-[#006600] hover:bg-[#005500] text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all min-h-[44px]">
                      <Copy className="w-4 h-4" /> Copy Link
                    </button>
                  </div>
                )}

                <p className="text-[10px] text-gray-500 mt-6 text-center italic font-medium">
                  TurnUp haishughulikii siasa. Tunaamini kila Mkenya ana haki ya kupiga kura. 🇰🇪
                </p>
              </div>
            </div>
          )
        )}

        {/* Filter Bar */}
        <div className="flex overflow-x-auto pb-4 mb-2 gap-2 no-scrollbar">
          {['All', 'Same University', 'Same Course', 'Online Now'].map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f as any)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                activeFilter === f 
                  ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' 
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {showFilter && (
          <div className="card p-4 mb-4 animate-fade-in">
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2">Filter by campus</p>
            <select className="input-dark text-sm min-h-[44px]" value={campusFilter} onChange={e => setCampusFilter(e.target.value)}>
              <option value="">All campuses</option>
              {['MKU', 'JKUAT', 'Kenyatta University', 'Zetech', 'KCA', 'KMTC', 'Thika Tech'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}

        {filteredUsers.length > 0 ? (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredUsers.map(userProfile => (
                <DiscoverCard key={userProfile.id} userProfile={userProfile} />
              ))}
            </div>
            <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-700 mt-12 pt-6 border-t border-white/5 pb-12">End of feed</p>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-white font-black text-lg mb-1">No more profiles</p>
            <p className="text-gray-600 text-sm font-medium">Check back later for new students!</p>
            <button onClick={loadUsers} className="btn-grad mt-6 text-xs px-8">Refresh</button>
          </div>
        )}
      </div>
    </main>
  )
}
