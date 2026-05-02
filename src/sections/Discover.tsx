import { useState, useEffect } from 'react'
import { Heart, X, Star, MapPin, BookOpen, Filter, CheckCircle, Crown, ChevronLeft, ChevronRight, Loader2, Share2, Copy } from 'lucide-react'
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

export default function Discover() {
  const { user, profile, fetchProfile } = useAuthStore()
  const [users, setUsers] = useState<Profile[]>([])
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [photoIdx, setPhotoIdx] = useState(0)
  const [swipeDir, setSwipeDir] = useState<null | 'left' | 'right' | 'up'>(null)
  const [campusFilter, setCampusFilter] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  
  const [showKadiBanner, setShowKadiBanner] = useState(() => !localStorage.getItem('kadi_banner_dismissed') && !profile?.is_registered_voter)
  const [showSharePrompt, setShowSharePrompt] = useState(false)
  const [registeringKadi, setRegisteringKadi] = useState(false)

  useEffect(() => {
    if (profile?.is_registered_voter) setShowKadiBanner(false)
  }, [profile?.is_registered_voter])

  useEffect(() => {
    loadUsers()
  }, [])

  const handleRegisterKadi = async () => {
    if (!user) return
    setRegisteringKadi(true)
    try {
      const { error } = await supabase.from('profiles').update({ is_registered_voter: true }).eq('id', user.id)
      if (error) throw error
      await fetchProfile(user.id)
      setShowSharePrompt(true)
    } catch (err: any) {
      toast.error('Failed to update status')
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

      const { data: swipes } = await supabase
        .from('swipes')
        .select('target_id')
        .eq('swiper_id', user.id)

      const swipedIds = (swipes || []).map((s: any) => s.target_id)

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .not('id', 'in', swipedIds.length ? `(${swipedIds.join(',')})` : '(null)')
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

  const current = users[index]

  const swipe = async (action: 'like' | 'pass' | 'superlike') => {
    if (!current) return
    const dir = action === 'pass' ? 'left' : action === 'superlike' ? 'up' : 'right'
    setSwipeDir(dir)

    setTimeout(async () => {
      if (user && !current.id.startsWith('d')) {
        await supabase.from('swipes').insert({ swiper_id: user.id, target_id: current.id, action })

        if (action !== 'pass') {
          const { data: mutual } = await supabase
            .from('swipes')
            .select('id')
            .eq('swiper_id', current.id)
            .eq('target_id', user.id)
            .in('action', ['like', 'superlike'])
            .maybeSingle()

          if (mutual) {
            await supabase.from('matches').insert({ user1_id: user.id, user2_id: current.id })
            toast.success(`🎉 It's a match with ${current.name}!`, { duration: 4000 })
          }
        }
      }

      if (action === 'like') toast(`Liked ${current.name}! ❤️`, { duration: 1500 })
      if (action === 'superlike') toast(`Super liked ${current.name}! ⭐`, { duration: 1500 })

      setSwipeDir(null)
      setPhotoIdx(0)
      if (index < users.length - 1) setIndex(i => i + 1)
      else { toast.info("You've seen everyone! Check back later."); setIndex(0) }
    }, 300)
  }

  const filteredUsers = campusFilter ? users.filter(u => u.campus?.includes(campusFilter)) : users
  const displayUser = filteredUsers[index] || current

  if (loading) return (
    <main className="min-h-screen pt-20 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
    </main>
  )

  return (
    <main className="min-h-screen pt-14 px-4 py-8 pb-24 md:pb-8">
      <div className="max-w-sm mx-auto w-full">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="font-syne font-bold text-xl sm:text-2xl text-white tracking-tight">Discover</h1>
            <p className="text-gray-600 text-[10px] sm:text-xs uppercase font-black tracking-widest">Find your people</p>
          </div>
          <button onClick={() => setShowFilter(!showFilter)} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center">
            <Filter className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {showKadiBanner && (
          <div className="card mb-6 overflow-hidden animate-fade-in relative border-white/10 bg-gradient-to-br from-white/5 to-[#080810]">
            <div className="absolute top-0 left-0 right-0 h-1.5 flex">
              <div className="flex-1 bg-[#000000]" />
              <div className="flex-1 bg-[#BB0000]" />
              <div className="flex-1 bg-[#006600]" />
            </div>
            <button onClick={dismissKadiBanner} className="absolute top-3 right-3 p-1.5 rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all z-10">
              <X className="w-4 h-4" />
            </button>
            <div className="p-5 pt-6">
              <div className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-black uppercase tracking-widest text-white mb-4">
                🇰🇪 2027 GENERAL ELECTION
              </div>
              <h2 className="font-syne font-bold text-xl sm:text-2xl text-white tracking-tight mb-5">Uko na KADI? Kura yako = nguvu yako.</h2>
              
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
                  <button onClick={handleRegisterKadi} disabled={registeringKadi} className="w-full py-3.5 rounded-xl bg-[#BB0000] hover:bg-[#990000] text-white font-black uppercase tracking-widest text-xs transition-all shadow-[0_0_20px_rgba(187,0,0,0.3)] flex items-center justify-center gap-2">
                    {registeringKadi ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Ndio, nimejisajili
                  </button>
                  <a href="https://www.huduma.go.ke" target="_blank" rel="noreferrer" className="w-full py-3.5 rounded-xl border-2 border-white/10 hover:bg-white/5 text-white font-bold text-xs text-center transition-all flex items-center justify-center gap-2">
                    Pata Huduma Centre karibu nawe <ChevronRight className="w-4 h-4" />
                  </a>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#006600]/10 border border-[#006600]/30 text-center animate-fade-in">
                  <h3 className="text-white font-bold text-lg mb-2">Asante! 🇰🇪</h3>
                  <p className="text-sm text-gray-300 mb-4">Waambie marafiki wako! Share your KADI badge.</p>
                  <button onClick={copyShareLink} className="w-full py-3 rounded-xl bg-[#006600] hover:bg-[#005500] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all">
                    <Copy className="w-4 h-4" /> Copy Link
                  </button>
                </div>
              )}

              <p className="text-[10px] text-gray-500 mt-6 text-center italic">
                TurnUp haishughulikii siasa. Tunaamini kila Mkenya ana haki ya kupiga kura. 🇰🇪
              </p>
            </div>
          </div>
        )}

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

        {displayUser ? (
          <div className={`relative transition-all duration-300 ${swipeDir === 'left' ? '-translate-x-full opacity-0 rotate-[-6deg]' : swipeDir === 'right' ? 'translate-x-full opacity-0 rotate-[6deg]' : swipeDir === 'up' ? '-translate-y-full opacity-0' : ''}`}>
            {/* Card */}
            <div className="relative rounded-[32px] overflow-hidden aspect-[4/5] sm:aspect-[3/4] mb-6 shadow-2xl border border-white/5">
              <img
                src={displayUser.photos?.[photoIdx] || displayUser.photos?.[0]}
                alt={displayUser.name}
                className="w-full h-full object-cover"
              />

              {/* Photo nav */}
              {(displayUser.photos?.length || 0) > 1 && (
                <div className="absolute top-3 left-0 right-0 flex gap-1 px-4">
                  {displayUser.photos?.map((_, i) => (
                    <div key={i} className={`flex-1 h-0.5 rounded-full transition-all ${i === photoIdx ? 'bg-white' : 'bg-white/30'}`} />
                  ))}
                </div>
              )}
              {photoIdx > 0 && (
                <button onClick={() => setPhotoIdx(i => i - 1)} className="absolute left-0 top-0 bottom-20 w-1/3 z-10" />
              )}
              {photoIdx < (displayUser.photos?.length || 1) - 1 && (
                <button onClick={() => setPhotoIdx(i => i + 1)} className="absolute right-0 top-0 bottom-20 w-1/3 z-10" />
              )}

              {/* Gradient overlay */}
              <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black via-black/40 to-transparent p-5 sm:p-6 flex flex-col justify-end">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-white font-syne font-bold text-xl sm:text-2xl truncate">{displayUser.name}, {displayUser.age}</h2>
                      {displayUser.verified && <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />}
                      <FollowButton targetId={displayUser.id} className="ml-2" />
                    </div>
                    <div className="flex flex-col gap-0.5 mb-1">
                      <div className="flex items-center gap-1.5 text-gray-300 text-[10px] sm:text-xs font-medium">
                        <MapPin className="w-3 h-3 text-purple-400" /> {displayUser.campus}
                      </div>
                      <UserFollowStats userId={displayUser.id} className="ml-4.5" />
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-400 text-[10px] sm:text-xs font-medium">
                      <BookOpen className="w-3 h-3 text-purple-400" /> {displayUser.course} · Year {displayUser.year}
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full mt-2 border-2 border-black flex-shrink-0 ${(displayUser as any).online ? 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]' : 'bg-gray-600'}`} />
                </div>
                <p className="text-gray-300 text-[11px] sm:text-xs mt-3 leading-relaxed line-clamp-2">{displayUser.bio}</p>
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {displayUser.vibe && (
                    <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-200 text-[10px] font-bold uppercase tracking-wider">{displayUser.vibe}</span>
                  )}
                  {displayUser.relationship_goal && (
                    <span className="px-2.5 py-1 rounded-lg bg-pink-500/20 border border-pink-500/30 text-pink-200 text-[10px] font-bold uppercase tracking-wider">{displayUser.relationship_goal}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-5">
              <button onClick={() => swipe('pass')} className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/30 transition-all group shadow-xl active:scale-90 min-h-[56px] min-w-[56px]">
                <X className="w-6 h-6 sm:w-7 sm:h-7 text-gray-400 group-hover:text-red-400" />
              </button>
              <button onClick={() => swipe('superlike')} className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center hover:bg-amber-500/25 transition-all group shadow-xl active:scale-90 min-h-[48px] min-w-[48px]">
                <Star className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 group-hover:text-amber-300 fill-current" />
              </button>
              <button onClick={() => swipe('like')} className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center hover:bg-pink-500/25 transition-all group shadow-xl active:scale-90 min-h-[56px] min-w-[56px]">
                <Heart className="w-6 h-6 sm:w-7 sm:h-7 text-pink-400 group-hover:text-pink-300 fill-current" />
              </button>
            </div>

            <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-700 mt-6">{index + 1} / {filteredUsers.length} students</p>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-white font-medium mb-1">No more profiles</p>
            <p className="text-gray-600 text-sm">Check back later for new students!</p>
            <button onClick={loadUsers} className="btn-grad mt-5 text-sm">Refresh</button>
          </div>
        )}
      </div>
    </main>
  )
}
