import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Users, Plus, MapPin, Calendar, Flame, ChevronRight, Search, Filter, Loader2, MessageSquare, CheckCircle, Send, Shield, Info, MoreVertical, Star, ArrowLeft, BarChart3, X, Zap } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import FollowButton from '@/components/FollowButton'
import UserFollowStats from '@/components/UserFollowStats'

interface Squad {
  id: string
  title: string
  description: string
  leader: { id: string; name: string; photo: string }
  members: number
  max_members: number
  campus: string
  vibe: string
  date: string
  tags: string[]
  joined?: boolean
}

const DEMO_SQUADS: Squad[] = [
  {
    id: 's1',
    title: 'JKUAT Nyama Choma Run 🍖',
    description: 'Heading to Thika for some serious nyama choma and drinks. All JKUAT folks welcome!',
    leader: { id: 'l1', name: 'Brian', photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop' },
    members: 4,
    max_members: 8,
    campus: 'JKUAT',
    vibe: '🔥 High Energy',
    date: 'Saturday, 2:00 PM',
    tags: ['Food', 'Drinks', 'RoadTrip'],
    joined: true
  },
  {
    id: 's2',
    title: 'MKU Party Squad 💃',
    description: 'Hitting Club Volume this Friday. Looking for a squad of 5 to share a table!',
    leader: { id: 'l2', name: 'Amina', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop' },
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
    leader: { id: 'l3', name: 'Cynthia', photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop' },
    members: 2,
    max_members: 4,
    campus: 'Kenyatta University',
    vibe: '🧠 Productive',
    date: 'Sunday, 10:00 AM',
    tags: ['Study', 'Coffee']
  }
]

const isValidUUID = (uuid: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export default function Squads() {
  const { user, profile } = useAuthStore()
  const [params] = useSearchParams()
  const [activeTab, setActiveTab] = useState<'discover' | 'mine'>('discover')
  const [squads, setSquads] = useState<Squad[]>(DEMO_SQUADS)
  const [showCreate, setShowCreate] = useState(false)
  const [campusFilter, setCampusFilter] = useState('')
  const [selectedSquad, setSelectedSquad] = useState<Squad | null>(null)
  const [msg, setMsg] = useState('')
  const [showPollCreator, setShowPollCreator] = useState(false)
  const [pollForm, setPollForm] = useState({ question: '', options: ['', ''] })
  const [vibeMeter, setVibeMeter] = useState(1240) 

  const [messages, setMessages] = useState<any[]>([
    { id: '1', sender: 'Brian', text: 'Yo squad! Who\'s coming for nyama choma tomorrow?', time: '2:15 PM', isLeader: true },
    { id: '2', sender: 'Amina', text: 'Count me in! I\'ll bring the drinks 🥂', time: '2:30 PM' },
  ])
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const eventParam = params.get('event')
    if (eventParam) {
      setShowCreate(true)
      toast.info(`Creating squad for: ${eventParam}`)
    }

    const interval = setInterval(() => {
      setVibeMeter(v => v + Math.floor(Math.random() * 5) - 2)
    }, 3000)
    return () => clearInterval(interval)
  }, [params])

  const handleJoinToggle = async (squad: Squad) => {
    if (!user) return toast.error('Sign in to join squads!')
    
    const isJoining = !squad.joined
    const newCount = isJoining ? squad.members + 1 : Math.max(1, squad.members - 1)
    
    setSquads(prev => prev.map(s => s.id === squad.id ? { ...s, joined: isJoining, members: newCount } : s))
    if (isJoining) toast.success('Joined Squad! 🚀')
    else toast.success('Left Squad.')

    if (!isValidUUID(user.id) || !isValidUUID(squad.id)) {
      console.log('Invalid UUID or demo squad, skipping Supabase call')
      return
    }

    try {
      const { error } = await supabase.from('squads').update({ members: newCount }).eq('id', squad.id)
      if (error) console.warn('Supabase squad update failed, fallback active', error)
    } catch (err) {
      console.warn('Error joining squad:', err)
    }
  }

  const sendMsg = () => {
    if (!msg.trim()) return
    const newMsg = {
      id: Date.now().toString(),
      sender: profile?.name || 'Me',
      text: msg,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true
    }
    setMessages([...messages, newMsg])
    setMsg('')
  }

  const broadcast = () => {
    const bMsg = {
      id: Date.now().toString(),
      sender: profile?.name || 'Leader',
      text: '📍 NEW MEETING POINT: Total Energies Thika Road Mall @ 1:30 PM',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isBroadcast: true
    }
    setMessages([...messages, bMsg])
    toast.success('Broadcast sent to all squad members! 📢')
  }

  const filteredSquads = activeTab === 'mine' 
    ? squads.filter(s => s.joined || s.leader.id === 'me') // Simulating mine
    : squads.filter(s => !campusFilter || s.campus.includes(campusFilter))

  if (selectedSquad) {
    return (
      <main className="h-screen pt-14 flex flex-col bg-[#090912] overflow-hidden">
        {/* Chat Header */}
        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 glass border-b border-white/5 z-10 min-h-[60px]">
          <button onClick={() => setSelectedSquad(null)} className="p-2 -ml-1 text-gray-400 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-bold text-sm truncate">{selectedSquad.title}</h2>
            <p className="text-gray-500 text-[9px] uppercase tracking-wider">{selectedSquad.members} members · {selectedSquad.campus}</p>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button onClick={() => setShowPollCreator(true)} className="p-2 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all min-h-[40px] min-w-[40px] flex items-center justify-center" title="Create Poll">
              <BarChart3 className="w-4 h-4" />
            </button>
            <button onClick={broadcast} className="p-2 rounded-xl bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-all shadow-lg min-h-[40px] min-w-[40px] flex items-center justify-center" title="Broadcast to Squad">
              <Flame className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-500 hover:text-white min-h-[40px] min-w-[40px] flex items-center justify-center">
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-[#090912]">
          <div className="text-center py-4">
            <span className="px-3 py-1 rounded-full bg-white/5 text-gray-600 text-[9px] uppercase tracking-widest font-black">Squad Created</span>
          </div>
          {messages.map(m => (
            <div key={m.id} className={`flex flex-col ${m.isMe ? 'items-end' : 'items-start'} ${m.isBroadcast || m.isPoll ? 'items-center !my-6' : ''}`}>
              {m.isPoll ? (
                <div className="w-full max-w-[280px] p-5 rounded-[24px] bg-[#1a1a2e] border border-white/10 shadow-2xl animate-fade-in">
                  <div className="flex items-center gap-2 text-blue-400 font-black text-[9px] uppercase tracking-widest mb-3">
                    <BarChart3 className="w-3 h-3" /> Squad Poll
                  </div>
                  <h3 className="text-white font-bold text-sm mb-4 leading-tight">{m.question}</h3>
                  <div className="space-y-2">
                    {m.options.map((opt: any, idx: number) => {
                      const totalVotes = m.options.reduce((acc: number, o: any) => acc + o.votes, 0)
                      const percent = totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100)
                      return (
                        <button key={idx} onClick={() => {
                          setMessages(prev => prev.map(msg => {
                            if (msg.id === m.id) {
                              const newOpts = [...msg.options]
                              newOpts[idx] = { ...newOpts[idx], votes: newOpts[idx].votes + 1 }
                              return { ...msg, options: newOpts }
                            }
                            return msg
                          }))
                          toast.success('Vote counted!')
                        }} className="relative w-full p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-left overflow-hidden group min-h-[44px]">
                          <div className="absolute inset-y-0 left-0 bg-blue-500/10 transition-all duration-500" style={{ width: `${percent}%` }} />
                          <div className="relative flex justify-between items-center text-xs font-medium">
                            <span className="text-gray-300">{opt.text}</span>
                            <span className="text-blue-400 font-bold">{percent}%</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : m.isBroadcast ? (
                <div className="max-w-[90%] p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center shadow-xl shadow-amber-500/5 animate-pulse">
                  <div className="flex items-center justify-center gap-2 text-amber-500 font-bold text-[10px] mb-1 uppercase tracking-tighter">
                    <Flame className="w-3 h-3" /> Broadcast
                  </div>
                  <p className="text-amber-200 text-sm font-medium">{m.text}</p>
                </div>
              ) : (
                <div className={`max-w-[85%] sm:max-w-[80%] ${m.isMe ? 'items-end' : 'items-start'}`}>
                  {!m.isMe && <p className="text-[9px] text-gray-500 mb-1 ml-2 font-bold uppercase tracking-tight">{m.sender} {m.isLeader && <span className="text-purple-400">· Leader</span>}</p>}
                  <div className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm ${m.isMe ? 'grad-bg text-white rounded-tr-sm' : 'bg-white/5 text-gray-300 rounded-tl-sm border border-white/5'}`}>
                    {m.text}
                  </div>
                  <p className="text-[9px] text-gray-600 mt-1 mx-2">{m.time}</p>
                </div>
              )}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Poll Creator */}
        {showPollCreator && (
          <div className="absolute inset-0 z-50 bg-[#090912]/95 backdrop-blur-xl p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-white font-syne font-bold text-xl">Create Squad Poll</h2>
              <button onClick={() => setShowPollCreator(false)} className="p-2 text-gray-500"><X className="w-6 h-6" /></button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] text-gray-600 uppercase tracking-widest font-black mb-2">The Question</label>
                <input className="input-dark" placeholder="Where should we meet?" value={pollForm.question} onChange={e => setPollForm({...pollForm, question: e.target.value})} />
              </div>
              <div className="space-y-3">
                {pollForm.options.map((opt, idx) => (
                  <input key={idx} className="input-dark" placeholder={`Option ${idx + 1}`} value={opt} onChange={e => {
                    const newOpts = [...pollForm.options]
                    newOpts[idx] = e.target.value
                    setPollForm({...pollForm, options: newOpts})
                  }} />
                ))}
                <button onClick={() => setPollForm({...pollForm, options: [...pollForm.options, '']})} className="text-blue-400 text-xs font-bold">+ Add Option</button>
              </div>
              <button onClick={() => {
                if (!pollForm.question) return toast.error('Enter a question')
                const pollMsg = {
                  id: Date.now().toString(),
                  sender: profile?.name || 'Leader',
                  isPoll: true,
                  question: pollForm.question,
                  options: pollForm.options.map(o => ({ text: o, votes: 0 })),
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                }
                setMessages([...messages, pollMsg])
                setShowPollCreator(false)
                setPollForm({ question: '', options: ['', ''] })
              }} className="btn-grad w-full py-4 mt-8 font-bold">Launch Poll 📊</button>
            </div>
          </div>
        )}

        {/* Vibe Check / Quick Actions */}
        <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar border-t border-white/5 bg-[#090912]">
          {['On my way 🏃', 'I have arrived! ✅', 'Running late 😅', 'Where you at? 📍'].map(action => (
            <button key={action} onClick={() => { setMsg(action); }} className="px-3 py-2 rounded-full bg-white/5 text-gray-500 text-[9px] font-black uppercase tracking-widest whitespace-nowrap hover:text-white hover:bg-white/10 transition-all min-h-[32px]">
              {action}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/5 bg-[#0c0c18] pb-8 md:pb-4">
          <div className="flex gap-2 items-center">
            <button className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 hover:text-gray-300 min-h-[44px] min-w-[44px]">
              <Plus className="w-5 h-5" />
            </button>
            <input 
              className="input-dark flex-1 text-sm py-2.5 min-h-[44px]" 
              placeholder="Message squad..." 
              value={msg}
              onChange={e => setMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMsg()}
            />
            <button onClick={sendMsg} className="w-10 h-10 grad-bg rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 active:scale-95 transition-all min-h-[44px] min-w-[44px]">
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen pt-14 px-4 py-8 pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto">
        {/* Vibe Meter */}
        <div className="card p-3 mb-6 bg-purple-500/5 border-purple-500/10 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 rounded-xl grad-bg flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-syne font-bold text-xs sm:text-sm tracking-tight">{vibeMeter} Students Active</p>
              <p className="text-purple-400 text-[8px] sm:text-[10px] font-black uppercase tracking-widest">Weekend Vibe</p>
            </div>
          </div>
          <div className="flex -space-x-1.5 sm:-space-x-2">
            {[1,2,3,4].map(i => (
              <div key={i} className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-[#111128] bg-gray-800 overflow-hidden flex-shrink-0">
                <img src={`https://i.pravatar.cc/100?u=${i}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-syne font-bold text-xl sm:text-2xl text-white">Squads</h1>
            <p className="text-gray-500 text-[10px] sm:text-xs uppercase font-black tracking-widest">Find your people</p>
          </div>
          <button 
            onClick={() => setShowCreate(true)}
            className="w-11 h-11 sm:w-12 sm:h-12 grad-bg rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20 hover:scale-105 transition-all min-h-[44px] min-w-[44px]"
          >
            <Plus className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white/5 p-1 rounded-2xl flex mb-6">
          <button onClick={() => setActiveTab('discover')} className={`flex-1 py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'discover' ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500 hover:text-gray-400'}`}>
            Discover
          </button>
          <button onClick={() => setActiveTab('mine')} className={`flex-1 py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'mine' ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500 hover:text-gray-400'}`}>
            My Squads
          </button>
        </div>

        {/* Filters (only for discover) */}
        {activeTab === 'discover' && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
            <button onClick={() => setCampusFilter('')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${!campusFilter ? 'grad-bg text-white' : 'bg-white/5 text-gray-500'}`}>All Campus</button>
            {['MKU', 'JKUAT', 'KU', 'Zetech', 'KCA'].map(c => (
              <button key={c} onClick={() => setCampusFilter(c)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${campusFilter === c ? 'grad-bg text-white' : 'bg-white/5 text-gray-500'}`}>{c}</button>
            ))}
          </div>
        )}

        {/* Squad List */}
        <div className="space-y-4">
          {filteredSquads.map(s => (
            <div key={s.id} onClick={() => s.joined && setSelectedSquad(s)} className="card p-5 group hover:border-purple-500/30 transition-all cursor-pointer relative overflow-hidden">
              {s.joined && <div className="absolute top-0 right-0 p-2 bg-purple-500/20 text-purple-400 rounded-bl-xl"><MessageSquare className="w-3.5 h-3.5" /></div>}
              
              <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img src={s.leader.photo} className="w-10 h-10 rounded-full object-cover border-2 border-white/5" alt={s.leader.name} />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#111128] flex items-center justify-center">
                        <CheckCircle className="w-2.5 h-2.5 text-white" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-bold text-sm group-hover:text-purple-400 transition-colors">{s.title}</h3>
                        <FollowButton targetId={s.leader.id} className="scale-75 origin-left" />
                      </div>
                      <div className="flex flex-col">
                        <p className="text-gray-500 text-[10px] uppercase tracking-wider">Led by {s.leader.name}</p>
                        <UserFollowStats userId={s.leader.id} />
                      </div>
                    </div>
                  </div>
                <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-bold">{s.vibe}</span>
              </div>

              <p className="text-gray-400 text-xs mb-4 leading-relaxed">{s.description}</p>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-gray-600 text-[10px] font-bold uppercase"><MapPin className="w-3 h-3" /> {s.campus}</div>
                  <div className="flex items-center gap-1.5 text-purple-400 text-[10px] font-bold"><Users className="w-3 h-3" /> {s.members}/{s.max_members}</div>
                </div>
                {s.joined ? (
                  <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); handleJoinToggle(s); }} className="px-3 py-2 rounded-xl bg-purple-500/10 text-purple-400 text-xs font-bold transition-all flex items-center gap-1 border border-purple-500/20">
                      Joined ✓
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setSelectedSquad(s); }} className="px-4 py-2 rounded-xl grad-bg text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-500/20">
                      Open Chat <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button onClick={(e) => { e.stopPropagation(); handleJoinToggle(s); }} className="px-4 py-2 rounded-xl bg-white/5 text-white text-xs font-bold hover:bg-white/10 transition-all flex items-center gap-2">
                    Join Squad <Plus className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredSquads.length === 0 && (
          <div className="text-center py-20 bg-white/5 rounded-[32px] border border-dashed border-white/10">
            <Flame className="w-12 h-12 text-gray-800 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">No squads found here.</p>
            <p className="text-gray-700 text-xs mt-1">Check another campus or launch your own!</p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="card w-full max-w-md p-8 animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 grad-bg" />
            <h2 className="font-syne font-bold text-2xl text-white mb-2">Launch a Squad</h2>
            <p className="text-gray-500 text-xs mb-8 uppercase tracking-widest font-bold">Be the weekend leader</p>
            
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] text-gray-600 uppercase tracking-widest font-black mb-2">Squad Title</label>
                <input className="input-dark" placeholder="e.g. MKU Friday Turn Up 🍻" />
              </div>
              <div>
                <label className="block text-[10px] text-gray-600 uppercase tracking-widest font-black mb-2">What's the plan?</label>
                <textarea className="input-dark resize-none" rows={3} placeholder="Meetup spot? Activity?"></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-gray-600 uppercase tracking-widest font-black mb-2">Member Limit</label>
                  <input type="number" className="input-dark" placeholder="8" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-600 uppercase tracking-widest font-black mb-2">Meetup Time</label>
                  <input className="input-dark" placeholder="Friday 9PM" />
                </div>
              </div>
              <button 
                onClick={() => {
                  toast.success('Squad launched! 🚀 Let the vibes begin.');
                  setShowCreate(false);
                }}
                className="btn-grad w-full py-4 mt-4 font-bold text-lg shadow-xl shadow-purple-500/20"
              >
                Launch Squad 🔥
              </button>
              <button onClick={() => setShowCreate(false)} className="w-full text-gray-600 text-xs font-black uppercase tracking-widest py-2">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
