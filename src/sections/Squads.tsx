import { useState } from 'react'
import { Users, Plus, MapPin, Calendar, Flame, ChevronRight, Search, Filter, Loader2, MessageSquare, CheckCircle } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { toast } from 'sonner'

interface Squad {
  id: string
  title: string
  description: string
  leader: { name: string; photo: string }
  members: number
  max_members: number
  campus: string
  vibe: string
  date: string
  tags: string[]
}

const DEMO_SQUADS: Squad[] = [
  {
    id: 's1',
    title: 'JKUAT Nyama Choma Run 🍖',
    description: 'Heading to Thika for some serious nyama choma and drinks. All JKUAT folks welcome!',
    leader: { name: 'Brian', photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop' },
    members: 4,
    max_members: 8,
    campus: 'JKUAT',
    vibe: '🔥 High Energy',
    date: 'Saturday, 2:00 PM',
    tags: ['Food', 'Drinks', 'RoadTrip']
  },
  {
    id: 's2',
    title: 'MKU Party Squad 💃',
    description: 'Hitting Club Volume this Friday. Looking for a squad of 5 to share a table!',
    leader: { name: 'Amina', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop' },
    members: 3,
    max_members: 6,
    campus: 'MKU',
    vibe: '✨ Party Vibes',
    date: 'Friday, 9:00 PM',
    tags: ['Party', 'Dancing', 'Verified']
  },
  {
    id: 's3',
    title: 'KU Study & Chill 📚',
    description: 'Med school exams are coming. Let\'s study at the library then grab coffee after.',
    leader: { name: 'Cynthia', photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop' },
    members: 2,
    max_members: 4,
    campus: 'Kenyatta University',
    vibe: '🧠 Productive',
    date: 'Sunday, 10:00 AM',
    tags: ['Study', 'Coffee']
  }
]

export default function Squads() {
  const { user, profile } = useAuthStore()
  const [squads, setSquads] = useState<Squad[]>(DEMO_SQUADS)
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [campusFilter, setCampusFilter] = useState('')

  const handleJoin = (squadId: string) => {
    toast.success('Join request sent to the Squad leader! 🚀')
  }

  return (
    <main className="min-h-screen pt-14 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-syne font-bold text-2xl text-white">Weekend Squads</h1>
            <p className="text-gray-500 text-sm">Find your people, plan the vibe</p>
          </div>
          <button 
            onClick={() => setShowCreate(true)}
            className="w-12 h-12 grad-bg rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20 hover:scale-105 transition-all"
          >
            <Plus className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
          <button 
            onClick={() => setCampusFilter('')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${!campusFilter ? 'grad-bg text-white' : 'bg-white/5 text-gray-500'}`}
          >
            All Campus
          </button>
          {['MKU', 'JKUAT', 'KU', 'Zetech', 'KCA'].map(c => (
            <button 
              key={c}
              onClick={() => setCampusFilter(c)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${campusFilter === c ? 'grad-bg text-white' : 'bg-white/5 text-gray-500'}`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Squad List */}
        <div className="space-y-4">
          {squads.map(s => (
            <div key={s.id} className="card p-5 group hover:border-purple-500/30 transition-all cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img src={s.leader.photo} className="w-10 h-10 rounded-full object-cover border-2 border-white/5" alt={s.leader.name} />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#111128] flex items-center justify-center">
                      <CheckCircle className="w-2.5 h-2.5 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm group-hover:text-purple-400 transition-colors">{s.title}</h3>
                    <p className="text-gray-500 text-[10px] uppercase tracking-wider">Led by {s.leader.name}</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-bold">
                  {s.vibe}
                </span>
              </div>

              <p className="text-gray-400 text-xs mb-4 leading-relaxed">
                {s.description}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {s.tags.map(t => (
                  <span key={t} className="px-2 py-0.5 rounded-md bg-white/5 text-gray-500 text-[9px]">#{t}</span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-gray-500 text-[10px]">
                    <MapPin className="w-3 h-3" /> {s.campus}
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-500 text-[10px]">
                    <Calendar className="w-3 h-3" /> {s.date}
                  </div>
                  <div className="flex items-center gap-1.5 text-purple-400 text-[10px] font-bold">
                    <Users className="w-3 h-3" /> {s.members}/{s.max_members}
                  </div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleJoin(s.id); }}
                  className="px-4 py-2 rounded-xl bg-white/5 text-white text-xs font-bold hover:bg-purple-500 hover:text-white transition-all flex items-center gap-2"
                >
                  Join Squad <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {squads.length === 0 && (
          <div className="text-center py-20">
            <Flame className="w-12 h-12 text-gray-800 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">No squads found for this campus.</p>
            <p className="text-gray-700 text-xs mt-1">Be the first to create one!</p>
          </div>
        )}
      </div>

      {/* Create Modal (Simplified) */}
      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6 animate-fade-in">
            <h2 className="font-syne font-bold text-xl text-white mb-6">Create a Squad</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Squad Title</label>
                <input className="input-dark" placeholder="e.g. MKU Friday Turn Up 🍻" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Vibe / Description</label>
                <textarea className="input-dark resize-none" rows={3} placeholder="What's the plan? Meetup spot?"></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Max Members</label>
                  <input type="number" className="input-dark" placeholder="8" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">When?</label>
                  <input className="input-dark" placeholder="Friday 9PM" />
                </div>
              </div>
              <button 
                onClick={() => {
                  toast.success('Squad created! Your friends can now join.');
                  setShowCreate(false);
                }}
                className="btn-grad w-full py-4 mt-4 font-bold"
              >
                Launch Squad 🔥
              </button>
              <button 
                onClick={() => setShowCreate(false)}
                className="w-full text-gray-600 text-xs font-bold py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
