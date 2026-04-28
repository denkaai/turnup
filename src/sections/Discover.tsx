import { useState, useEffect } from 'react'
import { Heart, X, Star, MapPin, BookOpen, Filter, CheckCircle, Crown, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { toast } from 'sonner'
import type { Profile } from '@/lib/supabase'

const DEMO_USERS: Profile[] = [
  { id: 'd1', name: 'Amina', age: 21, campus: 'Mount Kenya University (MKU)', course: 'Business Administration', year: 3, bio: 'Weekend vibes only 🎉 Love dancing & good food. Looking for my squad!', photos: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop'], interests: ['Dancing', 'Food', 'Movies', 'Parties'], verified: true, premium: false, online: true, gender: 'female', looking_for: 'everyone', premium_until: null, created_at: new Date().toISOString() } as any,
  { id: 'd2', name: 'Brian', age: 22, campus: 'JKUAT', course: 'Computer Science', year: 4, bio: 'Tech bro by day, party animal by night 🚀 Always down for weekend plans', photos: ['https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop'], interests: ['Coding', 'Gaming', 'Parties', 'Music'], verified: true, premium: true, online: true, gender: 'male', looking_for: 'everyone', premium_until: null, created_at: new Date().toISOString() } as any,
  { id: 'd3', name: 'Cynthia', age: 20, campus: 'Kenyatta University', course: 'Medicine', year: 2, bio: 'Med school survivor 😅 Need study buddies & weekend breaks. Coffee addict.', photos: ['https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=500&fit=crop'], interests: ['Studying', 'Netflix', 'Coffee', 'Hiking'], verified: true, premium: false, online: false, gender: 'female', looking_for: 'everyone', premium_until: null, created_at: new Date().toISOString() } as any,
  { id: 'd4', name: 'David', age: 23, campus: 'Zetech University', course: 'Engineering', year: 3, bio: 'Car enthusiast 🚗 Weekend road trips. Looking for adventure partners!', photos: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop'], interests: ['Cars', 'Travel', 'Photography', 'Parties'], verified: true, premium: false, online: true, gender: 'male', looking_for: 'everyone', premium_until: null, created_at: new Date().toISOString() } as any,
  { id: 'd5', name: 'Esther', age: 21, campus: 'KCA University', course: 'Finance', year: 3, bio: 'Finance girly 💰 Brunch dates and weekend turn up queen ✨', photos: ['https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop'], interests: ['Finance', 'Brunch', 'Shopping', 'Parties'], verified: true, premium: true, online: false, gender: 'female', looking_for: 'everyone', premium_until: null, created_at: new Date().toISOString() } as any,
  { id: 'd6', name: 'Frank', age: 22, campus: 'Thika Technical Training Institute', course: 'Automotive', year: 2, bio: 'Mechanic life 🔧 Good vibes only. Always ready to link up', photos: ['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop'], interests: ['Cars', 'Music', 'Dancing', 'Socializing'], verified: true, premium: false, online: true, gender: 'male', looking_for: 'everyone', premium_until: null, created_at: new Date().toISOString() } as any,
]

export default function Discover() {
  const { user, profile } = useAuthStore()
  const [users, setUsers] = useState<Profile[]>([])
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [photoIdx, setPhotoIdx] = useState(0)
  const [swipeDir, setSwipeDir] = useState<null | 'left' | 'right' | 'up'>(null)
  const [campusFilter, setCampusFilter] = useState('')
  const [showFilter, setShowFilter] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

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
    <main className="min-h-screen pt-14 px-4 py-8">
      <div className="max-w-sm mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="font-syne font-bold text-xl text-white">Discover</h1>
            <p className="text-gray-600 text-xs">Find your people</p>
          </div>
          <button onClick={() => setShowFilter(!showFilter)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
            <Filter className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {showFilter && (
          <div className="card p-4 mb-4">
            <p className="text-xs text-gray-500 mb-2">Filter by campus</p>
            <select className="input-dark text-sm" value={campusFilter} onChange={e => setCampusFilter(e.target.value)}>
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
            <div className="relative rounded-3xl overflow-hidden aspect-[3/4] mb-4">
              <img
                src={displayUser.photos?.[photoIdx] || displayUser.photos?.[0]}
                alt={displayUser.name}
                className="w-full h-full object-cover"
              />

              {/* Photo nav */}
              {(displayUser.photos?.length || 0) > 1 && (
                <div className="absolute top-3 left-0 right-0 flex gap-1 px-3">
                  {displayUser.photos?.map((_, i) => (
                    <div key={i} className={`flex-1 h-0.5 rounded-full ${i === photoIdx ? 'bg-white' : 'bg-white/30'}`} />
                  ))}
                </div>
              )}
              {photoIdx > 0 && (
                <button onClick={() => setPhotoIdx(i => i - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 p-1">
                  <ChevronLeft className="w-6 h-6 text-white drop-shadow" />
                </button>
              )}
              {photoIdx < (displayUser.photos?.length || 1) - 1 && (
                <button onClick={() => setPhotoIdx(i => i + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1">
                  <ChevronRight className="w-6 h-6 text-white drop-shadow" />
                </button>
              )}

              {/* Gradient overlay */}
              <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-5 flex flex-col justify-end">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-white font-syne font-bold text-xl">{displayUser.name}, {displayUser.age}</h2>
                      {displayUser.verified && <CheckCircle className="w-4 h-4 text-green-400" />}
                      {displayUser.premium && <Crown className="w-4 h-4 text-amber-400" />}
                    </div>
                    <div className="flex items-center gap-1 text-gray-300 text-xs mb-1">
                      <MapPin className="w-3 h-3" /> {displayUser.campus}
                    </div>
                    <div className="flex items-center gap-1 text-gray-400 text-xs">
                      <BookOpen className="w-3 h-3" /> {displayUser.course} · Year {displayUser.year}
                    </div>
                  </div>
                  <div className={`w-2.5 h-2.5 rounded-full mt-1 ${(displayUser as any).online ? 'bg-green-400' : 'bg-gray-600'}`} />
                </div>
                <p className="text-gray-300 text-xs mt-2 leading-relaxed line-clamp-2">{displayUser.bio}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {displayUser.interests?.slice(0, 4).map(i => (
                    <span key={i} className="px-2 py-0.5 rounded-full bg-white/15 text-white text-xs">{i}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-4">
              <button onClick={() => swipe('pass')} className="w-14 h-14 rounded-full bg-white/8 border border-white/10 flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/30 transition-all group">
                <X className="w-6 h-6 text-gray-400 group-hover:text-red-400" />
              </button>
              <button onClick={() => swipe('superlike')} className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center hover:bg-amber-500/25 transition-all group">
                <Star className="w-5 h-5 text-amber-500 group-hover:text-amber-300" />
              </button>
              <button onClick={() => swipe('like')} className="w-14 h-14 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center hover:bg-pink-500/25 transition-all group">
                <Heart className="w-6 h-6 text-pink-400 group-hover:text-pink-300" />
              </button>
            </div>

            <p className="text-center text-xs text-gray-700 mt-3">{index + 1} of {filteredUsers.length} profiles</p>
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
