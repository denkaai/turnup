import { useState, useEffect, useCallback } from 'react'
import { 
  Calendar, 
  MapPin, 
  Users, 
  Search, 
  CheckCircle, 
  Plus, 
  X, 
  Clock, 
  Tag, 
  Loader2,
  ChevronRight,
  Flame,
  AlertCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { toast } from 'sonner'

// Categories with their assigned colors
const CATEGORIES = [
  { id: 'all', label: 'All', color: '#a78bfa', icon: Tag },
  { id: 'party', label: '🎉 Parties', color: '#f472b6', icon: Flame },
  { id: 'food', label: '🍔 Food', color: '#fb923c', icon: Tag },
  { id: 'study', label: '📚 Study', color: '#34d399', icon: Clock },
  { id: 'sports', label: '🏆 Sports', color: '#38bdf8', icon: Tag },
  { id: 'career', label: '💼 Career', color: '#fbbf24', icon: Tag },
  { id: 'gaming', label: '🎮 Gaming', color: '#c084fc', icon: Tag },
  { id: 'social', label: '❤️ Social', color: '#f87171', icon: Users },
]

interface Event {
  id: string
  creator_id: string
  title: string
  description: string
  category: string
  location: string
  event_date: string
  price: number
  max_attendees: number | null
  image_url: string | null
  is_cancelled: boolean
  created_at: string
  // Joined fields
  attendee_count?: number
  is_attending?: boolean
}

export default function Events() {
  const { user } = useAuthStore()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  
  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  
  // Create Event Form
  const [form, setForm] = useState({
    title: '',
    category: 'social',
    location: '',
    event_date: '',
    price: 0,
    max_attendees: '',
    description: ''
  })

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      // Fetch events with attendee counts
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select(`
          *,
          event_attendees(count)
        `)
        .eq('is_cancelled', false)
        .order('event_date', { ascending: true })

      if (eventsError) throw eventsError

      // Fetch user's attending status
      let userAttending: string[] = []
      if (user) {
        const { data: attendingData } = await supabase
          .from('event_attendees')
          .select('event_id')
          .eq('user_id', user.id)
        
        if (attendingData) {
          userAttending = attendingData.map(a => a.event_id)
        }
      }

      const formattedEvents = (eventsData || []).map(e => ({
        ...e,
        attendee_count: e.event_attendees?.[0]?.count || 0,
        is_attending: userAttending.includes(e.id)
      }))

      setEvents(formattedEvents)
    } catch (err: any) {
      console.error('Fetch events error:', err.message)
      toast.error('Failed to load events')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchEvents()

    // Realtime subscription for attendee counts
    const channel = supabase
      .channel('public:event_attendees')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'event_attendees' 
      }, () => {
        fetchEvents()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchEvents])

  const handleJoinLeave = async (e: React.MouseEvent, event: Event) => {
    e.stopPropagation()
    if (!user) {
      toast.error('Please sign in to join events')
      return
    }

    const isJoining = !event.is_attending
    
    // Optimistic UI Update
    setEvents(prev => prev.map(ev => 
      ev.id === event.id 
        ? { 
            ...ev, 
            is_attending: isJoining, 
            attendee_count: (ev.attendee_count || 0) + (isJoining ? 1 : -1) 
          } 
        : ev
    ))

    try {
      if (isJoining) {
        const { error } = await supabase
          .from('event_attendees')
          .insert({ event_id: event.id, user_id: user.id })
        if (error) throw error
        toast.success(`Joined ${event.title}! 🎉`)
      } else {
        const { error } = await supabase
          .from('event_attendees')
          .delete()
          .eq('event_id', event.id)
          .eq('user_id', user.id)
        if (error) throw error
        toast.success(`Left ${event.title}`)
      }
    } catch (err: any) {
      // Revert on error
      fetchEvents()
      toast.error('Action failed. Please try again.')
    }
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!form.title || !form.location || !form.event_date) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const { error } = await supabase
        .from('events')
        .insert({
          creator_id: user.id,
          title: form.title,
          category: form.category,
          location: form.location,
          event_date: form.event_date,
          price: form.price,
          max_attendees: form.max_attendees ? parseInt(form.max_attendees) : null,
          description: form.description,
          image_url: `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}?w=800` // Placeholder
        })

      if (error) throw error

      toast.success('Event created! 🎉')
      setIsCreateModalOpen(false)
      setForm({
        title: '',
        category: 'social',
        location: '',
        event_date: '',
        price: 0,
        max_attendees: '',
        description: ''
      })
      fetchEvents()
    } catch (err: any) {
      console.error('Create event error:', err.message)
      toast.error('Failed to create event')
    }
  }

  const filteredEvents = events.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase()) || 
                          e.location.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = activeCategory === 'all' || e.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date)
  }

  const isSoon = (dateStr: string) => {
    const eventDate = new Date(dateStr)
    const now = new Date()
    const diff = eventDate.getTime() - now.getTime()
    return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000 // 3 days
  }

  return (
    <main className="page-main relative min-h-screen bg-[#080810] text-white overflow-x-hidden">
      <div className="container-responsive pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="font-syne font-black text-3xl grad-text tracking-tight">Events 🎉</h1>
            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Discover your campus vibe</p>
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="w-12 h-12 rounded-2xl grad-bg flex items-center justify-center shadow-lg shadow-purple-500/20 active:scale-95 transition-transform"
          >
            <Plus className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Search */}
        <div className="relative group mb-6 animate-fade-in">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-purple-400 transition-colors" />
          <input 
            className="w-full bg-[#0F0F1A] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 transition-all shadow-xl" 
            placeholder="Search events or locations..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>

        {/* Categories */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2 no-scrollbar animate-fade-in">
          {CATEGORIES.map(cat => (
            <button 
              key={cat.id} 
              onClick={() => setActiveCategory(cat.id)} 
              className={`px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all flex-shrink-0 border ${
                activeCategory === cat.id 
                  ? 'grad-bg border-transparent text-white shadow-lg shadow-purple-500/20' 
                  : 'bg-[#13131f] border-white/5 text-white/40 hover:text-white hover:border-white/20'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Feed */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
            <p className="text-white/40 font-black uppercase tracking-widest text-[10px]">Loading Vibes...</p>
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="space-y-4 animate-fade-in">
            {filteredEvents.map(event => {
              const cat = CATEGORIES.find(c => c.id === event.category) || CATEGORIES[0]
              return (
                <div 
                  key={event.id} 
                  onClick={() => setSelectedEvent(event)}
                  className="card group cursor-pointer overflow-hidden border-l-4"
                  style={{ borderLeftColor: cat.color }}
                >
                  <div className="flex flex-col sm:flex-row gap-5 p-5">
                    {/* Image Thumbnail */}
                    <div className="w-full sm:w-32 h-32 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
                      <img 
                        src={event.image_url || 'https://images.unsplash.com/photo-1514525253361-bee8a19740c1?w=400'} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                        alt={event.title}
                      />
                    </div>
                    
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-syne font-black text-xl text-white group-hover:grad-text transition-all">{event.title}</h3>
                          <div className="flex flex-wrap gap-2">
                            {event.is_attending && (
                              <span className="px-2 py-0.5 rounded-lg bg-green-500/10 text-green-400 text-[9px] font-black uppercase tracking-widest border border-green-500/20 flex items-center gap-1">
                                <CheckCircle className="w-2.5 h-2.5" /> Going
                              </span>
                            )}
                            {isSoon(event.event_date) && (
                              <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 text-[9px] font-black uppercase tracking-widest border border-amber-500/20">
                                Soon 🔥
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-[10px] font-black uppercase tracking-widest ${event.price === 0 ? 'text-green-400' : 'text-amber-400'}`}>
                            {event.price === 0 ? 'Free' : `KES ${event.price}`}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-bold text-white/60">
                        <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-purple-400" /> {formatDate(event.event_date)}</div>
                        <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-purple-400" /> {event.location}</div>
                        <div className="flex items-center gap-2 col-span-full"><Users className="w-3.5 h-3.5 text-purple-400" /> {event.attendee_count} students going</div>
                      </div>

                      <div className="flex items-center justify-end pt-3">
                        <button 
                          onClick={(e) => handleJoinLeave(e, event)}
                          disabled={!event.is_attending && event.max_attendees !== null && (event.attendee_count || 0) >= event.max_attendees}
                          className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            event.is_attending 
                              ? 'bg-white/5 text-white/40 border border-white/5 hover:bg-white/10' 
                              : 'grad-bg text-white shadow-lg shadow-purple-500/20 active:scale-95'
                          } disabled:opacity-30 disabled:grayscale`}
                        >
                          {event.is_attending ? 'Leave' : 'Join Event'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-[#13131f] flex items-center justify-center mb-6 border border-white/5 shadow-2xl">
              <Calendar className="w-10 h-10 text-white/20" />
            </div>
            <h2 className="text-xl font-syne font-black text-white mb-2">No events yet</h2>
            <p className="text-white/40 text-sm max-w-[200px] text-center mb-8 font-medium leading-relaxed">Be the first to create an event and get the campus turning up! 🎉</p>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-grad px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-purple-500/30"
            >
              Create First Event
            </button>
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in" onClick={() => setIsCreateModalOpen(false)}>
          <div 
            className="bg-[#0F0F1A] border-t sm:border border-white/10 rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-syne font-black text-2xl grad-text uppercase tracking-tight">Create Event 🚀</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Event Title*</label>
                <input 
                  autoFocus
                  required
                  placeholder="e.g. Friday Thika Road Party" 
                  className="w-full bg-[#13131f] border border-white/5 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-purple-500 transition-all shadow-inner"
                  value={form.title}
                  onChange={e => setForm({...form, title: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Category*</label>
                <div className="grid grid-cols-4 gap-2">
                  {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setForm({...form, category: cat.id})}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                        form.category === cat.id 
                          ? 'bg-purple-500/20 border-purple-500 text-white' 
                          : 'bg-[#13131f] border-white/5 text-white/40 hover:border-white/10'
                      }`}
                    >
                      <cat.icon className="w-5 h-5 mb-1" />
                      <span className="text-[8px] font-black uppercase tracking-tighter text-center">{cat.label.replace(/^[^\s]*\s/, '')}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Location*</label>
                  <input 
                    required
                    placeholder="e.g. Club Volume" 
                    className="w-full bg-[#13131f] border border-white/5 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-purple-500 transition-all shadow-inner"
                    value={form.location}
                    onChange={e => setForm({...form, location: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Date & Time*</label>
                  <input 
                    required
                    type="datetime-local" 
                    className="w-full bg-[#13131f] border border-white/5 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-purple-500 transition-all shadow-inner [color-scheme:dark]"
                    value={form.event_date}
                    onChange={e => setForm({...form, event_date: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Price (KES)</label>
                  <input 
                    type="number"
                    min="0"
                    placeholder="0 for Free" 
                    className="w-full bg-[#13131f] border border-white/5 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-purple-500 transition-all shadow-inner"
                    value={form.price}
                    onChange={e => setForm({...form, price: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Max Spots</label>
                  <input 
                    type="number"
                    min="1"
                    placeholder="Unlimited" 
                    className="w-full bg-[#13131f] border border-white/5 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-purple-500 transition-all shadow-inner"
                    value={form.max_attendees}
                    onChange={e => setForm({...form, max_attendees: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Description</label>
                <textarea 
                  rows={3}
                  placeholder="Tell students what to expect..." 
                  className="w-full bg-[#13131f] border border-white/5 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-purple-500 transition-all shadow-inner resize-none"
                  value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                />
              </div>

              <button 
                type="submit"
                className="w-full btn-grad py-5 rounded-2xl text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-purple-500/20 active:scale-[0.98] transition-all"
              >
                Create Event
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Event Details Overlay */}
      {selectedEvent && (
        <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-md flex items-end sm:items-center justify-center p-4 animate-fade-in" onClick={() => setSelectedEvent(null)}>
          <div 
            className="bg-[#0F0F1A] border border-white/10 rounded-[3rem] w-full max-w-xl overflow-hidden shadow-2xl relative" 
            onClick={e => e.stopPropagation()}
          >
            {/* Cover Image */}
            <div className="relative h-64 sm:h-80 w-full overflow-hidden">
              <img 
                src={selectedEvent.image_url || 'https://images.unsplash.com/photo-1514525253361-bee8a19740c1?w=800'} 
                className="w-full h-full object-cover" 
                alt={selectedEvent.title}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F1A] via-[#0F0F1A]/20 to-transparent" />
              <button onClick={() => setSelectedEvent(null)} className="absolute top-6 right-6 w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10">
                <X className="w-6 h-6" />
              </button>
              
              <div className="absolute bottom-6 left-8">
                <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-widest border border-purple-500/30">
                  {CATEGORIES.find(c => c.id === selectedEvent.category)?.label || 'Social'}
                </span>
              </div>
            </div>

            <div className="px-8 pb-10 -mt-2 relative">
              <h2 className="font-syne font-black text-3xl text-white mb-4 leading-tight">{selectedEvent.title}</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-purple-400 border border-white/5 group-hover:border-purple-500/30 transition-all">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/30 font-black uppercase tracking-widest leading-none mb-1">When</p>
                    <p className="text-sm font-bold text-white">{formatDate(selectedEvent.event_date)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-purple-400 border border-white/5 group-hover:border-purple-500/30 transition-all">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/30 font-black uppercase tracking-widest leading-none mb-1">Where</p>
                    <p className="text-sm font-bold text-white">{selectedEvent.location}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-purple-400 border border-white/5 group-hover:border-purple-500/30 transition-all">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/30 font-black uppercase tracking-widest leading-none mb-1">Attendees</p>
                    <p className="text-sm font-bold text-white">{selectedEvent.attendee_count} going</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-purple-400 border border-white/5 group-hover:border-purple-500/30 transition-all">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/30 font-black uppercase tracking-widest leading-none mb-1">Entry</p>
                    <p className="text-sm font-bold text-white">{selectedEvent.price === 0 ? 'Free Entry' : `KES ${selectedEvent.price}`}</p>
                  </div>
                </div>
              </div>

              {selectedEvent.description && (
                <div className="mb-8 p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                  <h3 className="text-[10px] text-white/30 font-black uppercase tracking-widest mb-3">About the Event</h3>
                  <p className="text-white/70 text-sm leading-relaxed font-medium">{selectedEvent.description}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button 
                  onClick={(e) => { handleJoinLeave(e, selectedEvent!); setSelectedEvent(prev => prev ? {...prev, is_attending: !prev.is_attending, attendee_count: (prev.attendee_count || 0) + (!prev.is_attending ? 1 : -1)} : null) }}
                  disabled={!selectedEvent.is_attending && selectedEvent.max_attendees !== null && (selectedEvent.attendee_count || 0) >= selectedEvent.max_attendees}
                  className={`flex-1 py-5 rounded-[1.5rem] text-sm font-black uppercase tracking-[0.2em] transition-all shadow-xl ${
                    selectedEvent.is_attending 
                      ? 'bg-white/5 text-white/40 border border-white/5 hover:bg-white/10' 
                      : 'btn-grad text-white shadow-purple-500/20 active:scale-[0.98]'
                  } disabled:opacity-30 disabled:grayscale`}
                >
                  {selectedEvent.is_attending ? 'Leave Event' : 'Join Event Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
