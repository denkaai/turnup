import { useState } from 'react'
import { Calendar, MapPin, Users, Clock, Tag, Search, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

const EVENTS = [
  { id: 'e1', title: 'Thika Road Campus Bash', desc: 'The biggest party of the semester! All Thika Road campuses invited. Music, drinks, and good vibes.', date: 'Fri, 31 Jan 2025', time: '8:00 PM', location: 'Club Volume, Thika', campus: 'All Campuses', attendees: 156, max: 300, img: 'https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?w=600&h=300&fit=crop', price: 500, organizer: 'TurnUp Events', category: 'Party', joined: false },
  { id: 'e2', title: 'MKU Talent Night', desc: 'Showcase your talent! Singing, dancing, poetry, comedy — all welcome. Prizes for winners!', date: 'Sat, 1 Feb 2025', time: '6:00 PM', location: 'MKU Main Hall', campus: 'MKU', attendees: 89, max: 200, img: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=300&fit=crop', price: 200, organizer: 'MKU Student Assoc.', category: 'Culture', joined: false },
  { id: 'e3', title: 'JKUAT Game Night', desc: 'FIFA tournament, board games, card games, and more! Pizza and drinks provided.', date: 'Sun, 2 Feb 2025', time: '5:00 PM', location: 'JKUAT Student Center', campus: 'JKUAT', attendees: 45, max: 100, img: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=300&fit=crop', price: 150, organizer: 'JKUAT Gaming Club', category: 'Gaming', joined: true },
  { id: 'e4', title: 'Sunset Picnic & Games', desc: 'Relaxed afternoon at Uhuru Gardens. Bring your squad! Games, music, and snacks.', date: 'Sat, 8 Feb 2025', time: '3:00 PM', location: 'Uhuru Gardens, Nairobi', campus: 'All Campuses', attendees: 67, max: 150, img: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=300&fit=crop', price: 100, organizer: 'TurnUp Community', category: 'Outdoor', joined: false },
  { id: 'e5', title: 'Campus Study Meetup', desc: 'Finals prep session! Bring your books and notes. Study together, eat together, pass together.', date: 'Wed, 5 Feb 2025', time: '2:00 PM', location: 'Zetech Library', campus: 'Zetech', attendees: 23, max: 50, img: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=300&fit=crop', price: 0, organizer: 'Zetech Study Group', category: 'Academic', joined: false },
  { id: 'e6', title: 'Rooftop Sundowner', desc: 'Chill rooftop vibes with good music and friends. Watch the sunset over Thika town!', date: 'Fri, 14 Feb 2025', time: '4:00 PM', location: 'Thika Greens Hotel', campus: 'All Campuses', attendees: 82, max: 120, img: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&h=300&fit=crop', price: 300, organizer: 'TurnUp Events', category: 'Social', joined: false },
]

const CATEGORIES = ['All', 'Party', 'Culture', 'Gaming', 'Outdoor', 'Academic', 'Social']

export default function Events() {
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(e => (
            <div key={e.id} className="card overflow-hidden hover:border-purple-500/20 transition-all cursor-pointer group" onClick={() => setSelected(e)}>
              <div className="relative h-36 overflow-hidden">
                <img src={e.img} alt={e.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-2 left-2 flex gap-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-black/60 text-white text-xs">{e.category}</span>
                  {e.price === 0 && <span className="px-2 py-0.5 rounded-full bg-green-500/80 text-white text-xs">Free</span>}
                  {e.joined && <span className="px-2 py-0.5 rounded-full bg-purple-600/80 text-white text-xs flex items-center gap-1"><CheckCircle className="w-2.5 h-2.5" /> Joined</span>}
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-white font-semibold text-sm mb-1 line-clamp-1">{e.title}</h3>
                <p className="text-gray-500 text-xs line-clamp-2 mb-3">{e.desc}</p>
                <div className="space-y-1 mb-3">
                  <div className="flex items-center gap-1.5 text-gray-500 text-xs"><Calendar className="w-3 h-3" /> {e.date} · {e.time}</div>
                  <div className="flex items-center gap-1.5 text-gray-500 text-xs"><MapPin className="w-3 h-3" /> {e.location}</div>
                  <div className="flex items-center gap-1.5 text-gray-500 text-xs"><Users className="w-3 h-3" /> {e.attendees}/{e.max} going</div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-amber-400 text-xs font-medium">{e.price === 0 ? 'Free entry' : `KSh ${e.price}`}</span>
                  <button
                    onClick={ev => { ev.stopPropagation(); join(e.id) }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${e.joined ? 'bg-white/8 text-gray-400 hover:bg-red-500/15 hover:text-red-400' : 'grad-bg text-white hover:opacity-90'}`}
                  >
                    {e.joined ? 'Leave' : 'Join'}
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
                  { icon: Clock, text: selected.price === 0 ? 'Free entry' : `KSh ${selected.price} entry` },
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
              <button
                onClick={() => join(selected.id)}
                className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${selected.joined ? 'bg-white/8 text-gray-400 hover:bg-red-500/15 hover:text-red-400' : 'btn-grad'}`}
              >
                {selected.joined ? 'Leave Event' : selected.price === 0 ? 'Join Free' : `Join — KSh ${selected.price}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
