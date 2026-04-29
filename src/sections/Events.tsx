import { useState } from 'react'
import { Calendar, MapPin, Users, Clock, Tag, Search, CheckCircle, Flame } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import FollowButton from '@/components/FollowButton'

const EVENTS = [
  { id: 'e1', title: 'Thika Road Campus Bash', desc: 'The biggest party of the semester! All Thika Road campuses invited. Music, drinks, and good vibes.', date: 'Fri, 31 Jan 2026', time: '8:00 PM', location: 'Club Volume, Thika', campus: 'All Campuses', attendees: 156, max: 300, img: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800', price: 0, organizer: 'TurnUp Events', category: 'Party', joined: false, isThisWeekend: true },
  { id: 'e2', title: 'MKU Talent Night', desc: 'Showcase your talent! Singing, dancing, poetry, comedy — all welcome. Prizes for winners!', date: 'Sat, 1 Feb 2026', time: '6:00 PM', location: 'MKU Main Hall', campus: 'MKU', attendees: 89, max: 200, img: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800', price: 0, organizer: 'MKU Student Assoc.', category: 'Culture', joined: false, isThisWeekend: true },
  { id: 'e3', title: 'JKUAT Game Night', desc: 'FIFA tournament, board games, card games, and more! Pizza and drinks provided.', date: 'Sun, 2 Feb 2026', time: '5:00 PM', location: 'JKUAT Student Center', campus: 'JKUAT', attendees: 45, max: 100, img: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800', price: 0, organizer: 'JKUAT Gaming Club', category: 'Gaming', joined: true },
  { id: 'e4', title: 'Sunset Picnic & Games', desc: 'Relaxed afternoon at Uhuru Gardens. Bring your squad! Games, music, and snacks.', date: 'Sat, 8 Feb 2026', time: '3:00 PM', location: 'Uhuru Gardens, Nairobi', campus: 'All Campuses', attendees: 67, max: 150, img: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800', price: 0, organizer: 'TurnUp Community', category: 'Outdoor', joined: false },
  { id: 'e5', title: 'Campus Study Meetup', desc: 'Finals prep session! Bring your books and notes. Study together, eat together, pass together.', date: 'Wed, 5 Feb 2026', time: '2:00 PM', location: 'Zetech Library', campus: 'Zetech', attendees: 23, max: 50, img: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800', price: 0, organizer: 'Zetech Study Group', category: 'Academic', joined: false },
  { id: 'e6', title: 'Rooftop Sundowner', desc: 'Chill rooftop vibes with good music and friends. Watch the sunset over Thika town!', date: 'Fri, 14 Feb 2026', time: '4:00 PM', location: 'Thika Greens Hotel', campus: 'All Campuses', attendees: 82, max: 120, img: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800', price: 0, organizer: 'TurnUp Events', category: 'Social', joined: false },
]

const CATEGORIES = ['All', 'Party', 'Culture', 'Gaming', 'Outdoor', 'Academic', 'Social']

export default function Events() {
  const navigate = useNavigate()
  const [events, setEvents] = useState(EVENTS)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [selected, setSelected] = useState<typeof EVENTS[0] | null>(null)

  const filtered = events.filter(e => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) || e.campus.toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'All' || e.category === category
    return matchSearch && matchCat
  })

  const join = (id: string) => {
    setEvents(ev => ev.map(e => e.id === id ? { ...e, joined: !e.joined, attendees: e.joined ? e.attendees - 1 : e.attendees + 1 } : e))
    const event = events.find(e => e.id === id)
    if (event) {
      if (!event.joined) toast.success(`Joined ${event.title}! See you there 🎉`)
      else toast(`Left ${event.title}`)
    }
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, joined: !prev.joined, attendees: prev.joined ? prev.attendees - 1 : prev.attendees + 1 } : prev)
  }

  return (
    <main className="min-h-screen pt-14 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-syne font-bold text-2xl text-white">Events</h1>
            <p className="text-gray-600 text-xs">Weekend plans near you</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
          <input className="input-dark pl-10 text-sm" placeholder="Search events or campus..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)} className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all flex-shrink-0 ${category === c ? 'grad-bg text-white' : 'bg-white/5 text-gray-500 hover:text-gray-300'}`}>{c}</button>
          ))}
        </div>

        {/* Events grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20 md:pb-0">
          {filtered.map(e => (
            <div key={e.id} className="card overflow-hidden hover:border-purple-500/20 transition-all cursor-pointer group" onClick={() => setSelected(e)}>
              <div className="relative h-40 overflow-hidden">
                <img src={e.img} alt={e.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-2 left-2 flex gap-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-bold uppercase tracking-wider">{e.category}</span>
                  {e.price === 0 && <span className="px-2 py-0.5 rounded-full bg-green-500/80 text-white text-[10px] font-bold uppercase">Free</span>}
                  {e.joined && <span className="px-2 py-0.5 rounded-full bg-purple-600/80 text-white text-[10px] font-bold flex items-center gap-1"><CheckCircle className="w-2.5 h-2.5" /> Joined</span>}
                </div>
                {e.isThisWeekend && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full grad-bg text-white text-[9px] font-black uppercase tracking-widest shadow-lg animate-pulse">
                    🔥 This Weekend
                  </div>
                )}
              </div>
              <div className="p-4 sm:p-5">
                <h3 className="text-white font-syne font-bold text-base mb-1 line-clamp-1">{e.title}</h3>
                <p className="text-gray-500 text-xs line-clamp-2 mb-4 leading-relaxed">{e.desc}</p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-gray-400 text-xs font-medium"><Calendar className="w-3.5 h-3.5 text-purple-400" /> {e.date} · {e.time}</div>
                  <div className="flex items-center gap-2 text-gray-400 text-xs font-medium"><MapPin className="w-3.5 h-3.5 text-purple-400" /> {e.location}</div>
                  <div className="flex items-center gap-2 text-gray-400 text-xs font-medium"><Users className="w-3.5 h-3.5 text-purple-400" /> {e.attendees}/{e.max} going</div>
                </div>
                <div className="flex items-center justify-end pt-2 border-t border-white/5">
                  <button
                    onClick={ev => { ev.stopPropagation(); join(e.id) }}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg min-h-[44px] ${e.joined ? 'bg-white/10 text-gray-400' : 'grad-bg text-white shadow-purple-500/10'}`}
                  >
                    {e.joined ? 'Joined' : 'Join'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Calendar className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500">No events found</p>
          </div>
        )}
      </div>

      {/* Event detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70" onClick={() => setSelected(null)}>
          <div className="bg-[#13131f] border border-white/8 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <img src={selected.img} alt={selected.title} className="w-full h-48 object-cover rounded-t-3xl" />
            <div className="p-6">
              <div className="flex gap-2 mb-3">
                <span className="chip text-xs">{selected.category}</span>
                <span className="chip text-xs">{selected.campus}</span>
              </div>
              <h2 className="font-syne font-bold text-xl text-white mb-2">{selected.title}</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-5">{selected.desc}</p>
              <div className="space-y-2 mb-5">
                {[
                  { icon: Calendar, text: `${selected.date} at ${selected.time}` },
                  { icon: MapPin, text: selected.location },
                  { icon: Users, text: `${selected.attendees} of ${selected.max} attending` },
                  { icon: Tag, text: `By ${selected.organizer}` },
                  { icon: Clock, text: 'Free entry' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3 text-gray-400 text-sm">
                    <Icon className="w-4 h-4 text-purple-400 flex-shrink-0" /> {text}
                  </div>
                ))}
              </div>
              {/* Capacity bar */}
              <div className="mb-5">
                <div className="flex justify-between text-xs text-gray-600 mb-1.5">
                  <span>Spots taken</span><span>{Math.round(selected.attendees/selected.max*100)}% full</span>
                </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full grad-bg rounded-full" style={{ width: `${Math.round(selected.attendees/selected.max*100)}%` }} />
                  </div>
                </div>

                {/* Who's Going Section */}
                <div className="mb-6">
                  <h3 className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-4">Comrades Going</h3>
                  <div className="space-y-3">
                    {[
                      { id: 'd1', name: 'Amina', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop', campus: 'MKU' },
                      { id: 'd2', name: 'Brian', photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop', campus: 'JKUAT' },
                    ].map(u => (
                      <div key={u.id} className="flex items-center justify-between p-2 rounded-2xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-3">
                          <img src={u.photo} className="w-8 h-8 rounded-full object-cover" alt={u.name} />
                          <div>
                            <p className="text-white text-xs font-bold">{u.name}</p>
                            <p className="text-gray-500 text-[9px] uppercase tracking-tighter">{u.campus}</p>
                          </div>
                        </div>
                        <FollowButton targetId={u.id} />
                      </div>
                    ))}
                  </div>
                </div>
              <div className="flex gap-2">
                <button
                  onClick={() => join(selected.id)}
                  className={`flex-1 py-4 rounded-2xl text-sm font-bold transition-all shadow-xl ${selected.joined ? 'bg-white/10 text-gray-500' : 'btn-grad text-white'}`}
                >
                  {selected.joined ? 'Joined Event' : 'Join Free'}
                </button>
                <button
                  onClick={() => navigate(`/squads?event=${encodeURIComponent(selected.title)}`)}
                  className="px-4 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-all flex items-center justify-center"
                  title="Find a squad for this event"
                >
                  <Flame className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
