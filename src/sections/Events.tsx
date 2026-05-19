import { useState, useEffect, useCallback, useRef } from 'react'
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
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { toast } from 'sonner'

// Categories with their assigned colors
const CATEGORIES = [
  { id: 'all', label: 'All', color: '#a78bfa', icon: Tag },
  { id: 'flash', label: '⚡ Flash', color: '#fbbf24', icon: Clock },
  { id: 'party', label: '🎉 Parties', color: '#f472b6', icon: Flame },
  { id: 'food', label: '🍔 Food', color: '#fb923c', icon: Tag },
  { id: 'study', label: '📚 Study', color: '#34d399', icon: Clock },
  { id: 'sports', label: '🏆 Sports', color: '#38bdf8', icon: Tag },
  { id: 'career', label: '💼 Career', color: '#fbbf24', icon: Tag },
  { id: 'gaming', label: '🎮 Gaming', color: '#c084fc', icon: Tag },
  { id: 'social', label: '❤️ Social', color: '#f87171', icon: Users },
]

const SPOTS = [
  { id: '1', name: 'Westlands', image: 'https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=600&q=80', area: 'Nairobi', attendees: 12 },
  { id: '2', name: 'Karen', image: 'https://images.unsplash.com/photo-1596005554384-d293674c91d7?w=600&q=80', area: 'Nairobi', attendees: 8 },
  { id: '3', name: 'Ngong Hills', image: 'https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?w=600&q=80', area: 'Kajiado', attendees: 15 },
  { id: '4', name: 'Nairobi CBD', image: 'https://images.unsplash.com/photo-1611348524140-53c9a25263d6?w=600&q=80', area: 'Nairobi', attendees: 20 },
]

// Smart category-based fallback images (always reliable)
const CATEGORY_IMAGES: Record<string, string> = {
  party: 'https://images.unsplash.com/photo-1514525253361-bee8a19740c1?w=800&q=80',
  food: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
  study: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80',
  sports: 'https://images.unsplash.com/photo-1461896836934-bd45ba8fcf9d?w=800&q=80',
  career: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&q=80',
  gaming: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80',
  social: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80',
  flash: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80',
}

export const CAMPUS_MAP_NODES = [
  { id: 'cbd', name: 'Nairobi CBD', x: 120, y: 300, campus: 'CBD', color: '#f472b6' },
  { id: 'pac', name: 'PAC University', x: 220, y: 240, campus: 'PAC University', color: '#38bdf8' },
  { id: 'ku', name: 'Kenyatta Uni (KU)', x: 340, y: 180, campus: 'KU', color: '#a78bfa' },
  { id: 'zetech', name: 'Zetech University', x: 420, y: 150, campus: 'Zetech', color: '#fb923c' },
  { id: 'jkuat', name: 'JKUAT Main Campus', x: 500, y: 110, campus: 'JKUAT', color: '#34d399' },
  { id: 'mku', name: 'MKU Main Campus', x: 620, y: 70, campus: 'MKU', color: '#c084fc' },
  { id: 'gretsa', name: 'Gretsa University', x: 700, y: 50, campus: 'Gretsa', color: '#f87171' },
  { id: 'karen', name: 'Karen Area', x: 80, y: 180, campus: 'Karen', color: '#fbbf24' }
]

function FlashCountdown({ expiry, createdAt }: { expiry: string, createdAt: string }) {
  const [timeLeft, setTimeLeft] = useState('')
  const [percent, setPercent] = useState(100)

  useEffect(() => {
    const expiryTime = new Date(expiry).getTime()
    const createdTime = new Date(createdAt).getTime()
    const totalDuration = Math.max(1000, expiryTime - createdTime)

    const update = () => {
      const now = Date.now()
      const total = expiryTime - now
      if (total <= 0) {
        setTimeLeft('Expired')
        setPercent(0)
        return
      }
      
      const hours = Math.floor(total / (3600 * 1000))
      const minutes = Math.floor((total % (3600 * 1000)) / (60 * 1000))
      const seconds = Math.floor((total % (60 * 1000)) / 1000)

      let str = ''
      if (hours > 0) str += `${hours}h `
      str += `${minutes}m ${seconds}s`
      setTimeLeft(str)

      // Calculate percentage
      const elapsed = expiryTime - now
      const p = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100))
      setPercent(p)
    }

    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [expiry, createdAt])

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-8 h-8 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="16" cy="16" r="12" stroke="rgba(251,191,36,0.1)" strokeWidth="2.5" fill="transparent" />
          <circle 
            cx="16" 
            cy="16" 
            r="12" 
            stroke="#fbbf24" 
            strokeWidth="2.5" 
            fill="transparent"
            strokeDasharray={75.3}
            strokeDashoffset={75.3 - (75.3 * percent) / 100}
            className="transition-all duration-1000"
          />
        </svg>
        <span className="absolute text-[8px] font-black text-[#fbbf24] animate-pulse">⚡</span>
      </div>
      <div>
        <p className="text-[7px] text-white/30 font-black uppercase tracking-widest leading-none mb-0.5">Flash Time Remaining</p>
        <p className="text-[11px] font-black text-[#fbbf24] tracking-tight">{timeLeft}</p>
      </div>
    </div>
  )
}

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
  
  // Custom V3 view toggles
  const [viewMode, setViewMode] = useState<'feed' | 'map'>('feed')
  const [selectedCampusFilter, setSelectedCampusFilter] = useState<string | null>(null)

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
    description: '',
    isFlash: false,
    flashDuration: '2' // default 2 hours
  })
  const [eventImage, setEventImage] = useState<File | null>(null)
  const [eventImagePreview, setEventImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const eventFileRef = useRef<HTMLInputElement>(null)

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

      if (eventsError) {
        // Table may not exist yet — silently fallback to empty state
        console.warn('Events table not available:', eventsError.message)
        setEvents([])
        return
      }

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
      console.warn('Events fetch silently handled:', err.message)
      setEvents([])
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

    const isFlash = form.isFlash
    const eventDate = isFlash 
      ? new Date(Date.now() + parseFloat(form.flashDuration) * 60 * 60 * 1000).toISOString() 
      : form.event_date

    if (!form.title || !form.location || (!isFlash && !form.event_date)) {
      toast.error('Please fill in all required fields')
      return
    }

    setUploading(true)
    try {
      let imageUrl: string | null = null

      // Upload user's custom photo to Supabase Storage if provided
      if (eventImage) {
        const fileExt = eventImage.name.split('.').pop()
        const fileName = `${user.id}_${Date.now()}.${fileExt}`
        const filePath = `events/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('chat-images')
          .upload(filePath, eventImage)

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('chat-images')
            .getPublicUrl(filePath)
          imageUrl = publicUrl
        } else {
          console.warn('Event image upload failed, using category fallback:', uploadError.message)
        }
      }

      // Fall back to category default image if no upload
      const eventCategory = isFlash ? 'flash' : form.category
      if (!imageUrl) {
        imageUrl = CATEGORY_IMAGES[eventCategory] || CATEGORY_IMAGES.social
      }

      const { error } = await supabase
        .from('events')
        .insert({
          creator_id: user.id,
          title: form.title,
          category: eventCategory,
          location: form.location,
          event_date: eventDate,
          price: form.price,
          max_attendees: form.max_attendees ? parseInt(form.max_attendees) : null,
          description: form.description,
          image_url: imageUrl
        })

      if (error) throw error

      toast.success(isFlash ? 'Flash Meetup launched! ⚡' : 'Event created! 🎉')
      setIsCreateModalOpen(false)
      setForm({
        title: '',
        category: 'social',
        location: '',
        event_date: '',
        price: 0,
        max_attendees: '',
        description: '',
        isFlash: false,
        flashDuration: '2'
      })
      setEventImage(null)
      setEventImagePreview(null)
      fetchEvents()
    } catch (err: any) {
      console.error('Create event error:', err.message)
      toast.error('Failed to create event')
    } finally {
      setUploading(false)
    }
  }

  const filteredEvents = events.filter(e => {
    // Filter out expired flash events
    if (e.category === 'flash' && new Date(e.event_date).getTime() < Date.now()) {
      return false
    }

    const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase()) || 
                          e.location.toLowerCase().includes(search.toLowerCase()) ||
                          e.description?.toLowerCase().includes(search.toLowerCase())

    const matchesCategory = activeCategory === 'all' || e.category === activeCategory

    const matchesCampus = !selectedCampusFilter || 
                          e.location.toLowerCase().includes(selectedCampusFilter.toLowerCase()) ||
                          e.title.toLowerCase().includes(selectedCampusFilter.toLowerCase()) ||
                          e.description?.toLowerCase().includes(selectedCampusFilter.toLowerCase())

    return matchesSearch && matchesCategory && matchesCampus
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in">
          <div>
            <h1 className="font-syne font-black text-3xl grad-text tracking-tight">Events 🎉</h1>
            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Discover your campus vibe</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* View Switcher */}
            <div className="bg-[#0F0F1A] border border-white/5 p-1 rounded-2xl flex items-center shadow-lg">
              <button 
                onClick={() => setViewMode('feed')} 
                className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                  viewMode === 'feed' 
                    ? 'grad-bg text-white' 
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                Feed View
              </button>
              <button 
                onClick={() => setViewMode('map')} 
                className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                  viewMode === 'map' 
                    ? 'grad-bg text-white' 
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                Radar Map
              </button>
            </div>

            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="w-12 h-12 rounded-2xl grad-bg flex items-center justify-center shadow-lg shadow-purple-500/20 active:scale-95 transition-transform"
            >
              <Plus className="w-6 h-6 text-white" />
            </button>
          </div>
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

        {/* Styles for Radar Map View */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes radar-pulse {
            0% { r: 6px; opacity: 1; stroke-width: 1px; }
            50% { opacity: 0.6; }
            100% { r: 28px; opacity: 0; stroke-width: 1.5px; }
          }
          @keyframes radar-sweep {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .radar-pulsing-halo {
            animation: radar-pulse 2.2s infinite ease-out;
            transform-origin: center;
          }
          .radar-sweeper {
            animation: radar-sweep 10s linear infinite;
            transform-origin: 400px 220px;
          }
          .map-glow-filter {
            filter: drop-shadow(0 0 8px currentColor);
          }
        `}} />

        {viewMode === 'feed' ? (
          /* Meetup Spots Scroller */
          <div className="mb-8 animate-fade-in">
            <h2 className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1 mb-4">Trending Meetup Spots</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
              {SPOTS.map(spot => (
                <div key={spot.id} className="relative w-64 h-80 rounded-[2rem] overflow-hidden flex-shrink-0 border border-white/5 group card-hover bg-[#0A0A0F]">
                  <div className="cinematic-glow opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <img src={spot.image} alt={spot.name} className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-[1.05]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#030305] via-[#030305]/60 to-transparent p-6 flex flex-col justify-end">
                    <span className="px-3 py-1 rounded-full bg-white/5 text-purple-300 text-[9px] font-black uppercase tracking-widest border border-white/10 w-fit mb-2 backdrop-blur-md flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {spot.area}
                    </span>
                    <h3 className="font-syne font-black text-2xl text-white mb-3">{spot.name}</h3>
                    
                    {/* Who's going */}
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-1.5">
                        <div className="w-6 h-6 rounded-full bg-purple-500 border-2 border-[#030305] flex items-center justify-center text-[9px] font-black text-white">JD</div>
                        <div className="w-6 h-6 rounded-full bg-pink-500 border-2 border-[#030305] flex items-center justify-center text-[9px] font-black text-white">SK</div>
                        <div className="w-6 h-6 rounded-full bg-amber-500 border-2 border-[#030305] flex items-center justify-center text-[9px] font-black text-white">MK</div>
                      </div>
                      <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">{spot.attendees}+ going</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* SVG Cyberpunk Radar Map */
          <div className="mb-8 animate-fade-in bg-[#0D0D19] border border-white/10 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden">
            {/* Grid Glow Overlay */}
            <div className="absolute inset-0 bg-radial-gradient from-purple-500/5 to-transparent pointer-events-none" />

            {/* Radar Panel Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-4 mb-4 text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                <span className="text-green-400">Tactical Sonar Radar Active</span>
              </div>
              <div>THIKA ROAD CAMPUS NODES</div>
              <div>FILTER: {selectedCampusFilter ? <span className="text-[#fbbf24]">{selectedCampusFilter}</span> : 'NONE (SHOW ALL)'}</div>
            </div>

            {/* SVG Interactive Map */}
            <div className="relative w-full aspect-[800/440] bg-[#07070F] rounded-2xl border border-white/5 overflow-hidden">
              <svg viewBox="0 0 800 440" className="w-full h-full select-none">
                {/* Definitions */}
                <defs>
                  <pattern id="radar-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                  </pattern>
                  <linearGradient id="thika-road-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#c084fc" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#a78bfa" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.8" />
                  </linearGradient>
                </defs>

                {/* Grid Background */}
                <rect width="100%" height="100%" fill="url(#radar-grid)" />

                {/* Radar Scanning Concentric Circles */}
                <circle cx="400" cy="220" r="100" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                <circle cx="400" cy="220" r="200" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                <circle cx="400" cy="220" r="300" fill="none" stroke="rgba(255,255,255,0.01)" strokeWidth="1" />

                {/* Radar Sweep Rotating Line */}
                <g className="radar-sweeper">
                  <line x1="400" y1="220" x2="400" y2="20" stroke="rgba(167,139,250,0.15)" strokeWidth="2" strokeLinecap="round" />
                  <path d="M 400 220 L 400 20 A 200 200 0 0 1 540 80 Z" fill="rgba(167,139,250,0.02)" />
                </g>

                {/* Thika Road Highway Path */}
                <path 
                  d="M 120 300 L 220 240 L 340 180 L 420 150 L 500 110 L 620 70 L 700 50" 
                  fill="none" 
                  stroke="url(#thika-road-grad)" 
                  strokeWidth="4" 
                  strokeLinecap="round"
                  className="map-glow-filter text-purple-500/20"
                />
                
                {/* Dotted Inner Lane */}
                <path 
                  d="M 120 300 L 220 240 L 340 180 L 420 150 L 500 110 L 620 70 L 700 50" 
                  fill="none" 
                  stroke="#ffffff" 
                  strokeWidth="1.2" 
                  strokeDasharray="6, 6" 
                  strokeLinecap="round"
                  opacity="0.4"
                />

                {/* Karen Bypass Link */}
                <path 
                  d="M 120 300 L 80 180" 
                  fill="none" 
                  stroke="#fbbf24" 
                  strokeWidth="2" 
                  strokeDasharray="4, 4" 
                  opacity="0.3"
                />

                {/* Campus Nodes */}
                {CAMPUS_MAP_NODES.map(node => {
                  const activeCount = events.filter(e => {
                    if (e.category === 'flash' && new Date(e.event_date).getTime() < Date.now()) return false
                    return e.location.toLowerCase().includes(node.campus.toLowerCase()) || 
                           e.title.toLowerCase().includes(node.campus.toLowerCase()) ||
                           e.description?.toLowerCase().includes(node.campus.toLowerCase())
                  }).length

                  const isSelected = selectedCampusFilter === node.campus

                  return (
                    <g 
                      key={node.id} 
                      transform={`translate(${node.x}, ${node.y})`}
                      className="cursor-pointer group"
                      onClick={() => {
                        setSelectedCampusFilter(isSelected ? null : node.campus)
                        toast.info(isSelected ? 'Cleared radar filter' : `Radar filtered to: ${node.name}`)
                      }}
                    >
                      {/* Pulse Halo */}
                      {activeCount > 0 && (
                        <circle 
                          cx="0" 
                          cy="0" 
                          r="12" 
                          fill="none" 
                          stroke={node.color} 
                          className="radar-pulsing-halo" 
                          style={{ transformOrigin: '0px 0px' }}
                        />
                      )}

                      {/* Selected Node Glow */}
                      {isSelected && (
                        <circle cx="0" cy="0" r="14" fill="none" stroke="#fbbf24" strokeWidth="2" className="map-glow-filter text-[#fbbf24] animate-pulse" />
                      )}

                      {/* Center Pin */}
                      <circle 
                        cx="0" 
                        cy="0" 
                        r="6" 
                        fill={isSelected ? '#fbbf24' : node.color} 
                        className="transition-colors duration-300"
                      />

                      {/* Campus Label Card */}
                      <g transform="translate(0, -18)">
                        {/* Backdrop Rect */}
                        <rect 
                          x="-50" 
                          y="-10" 
                          width="100" 
                          height="18" 
                          rx="6" 
                          fill="#0F0F1A" 
                          stroke={isSelected ? '#fbbf24' : 'rgba(255,255,255,0.08)'} 
                          strokeWidth="1"
                          className="transition-all duration-300 group-hover:stroke-white/30"
                        />
                        {/* Text */}
                        <text 
                          x="0" 
                          y="2" 
                          textAnchor="middle" 
                          fill={isSelected ? '#fbbf24' : '#ffffff'} 
                          fontSize="7" 
                          fontWeight="bold" 
                          className="transition-all duration-300 select-none pointer-events-none"
                        >
                          {node.name}
                        </text>
                      </g>

                      {/* Event Count Indicator Badge */}
                      {activeCount > 0 && (
                        <g transform="translate(14, 8)">
                          <circle cx="0" cy="0" r="7" fill={node.color} />
                          <text x="0" y="2.5" textAnchor="middle" fill="#000000" fontSize="7.5" fontWeight="900">
                            {activeCount}
                          </text>
                        </g>
                      )}
                    </g>
                  )
                })}
              </svg>
            </div>

            {/* Clear Filter Bar */}
            {selectedCampusFilter && (
              <div className="mt-4 flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-2xl p-4 animate-fade-in">
                <span className="text-[10px] text-white/50 font-black uppercase tracking-wider">
                  Filtering {selectedCampusFilter} events ({filteredEvents.length} found)
                </span>
                <button 
                  onClick={() => setSelectedCampusFilter(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-[9px] font-black uppercase tracking-widest text-white/80 active:scale-95 transition-all"
                >
                  Clear Map Filter
                </button>
              </div>
            )}
          </div>
        )}

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
                        src={event.image_url || CATEGORY_IMAGES[event.category] || CATEGORY_IMAGES.social} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                        alt={event.title}
                        onError={(e) => { (e.target as HTMLImageElement).src = CATEGORY_IMAGES[event.category] || CATEGORY_IMAGES.social }}
                      />
                    </div>
                    
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-syne font-black text-xl text-white group-hover:grad-text transition-all">{event.title}</h3>
                          <div className="flex flex-wrap gap-2">
                            {event.category === 'flash' && (
                              <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 text-[9px] font-black uppercase tracking-widest border border-amber-500/20 flex items-center gap-1">
                                ⚡ Flash Meetup
                              </span>
                            )}
                            {event.is_attending && (
                              <span className="px-2 py-0.5 rounded-lg bg-green-500/10 text-green-400 text-[9px] font-black uppercase tracking-widest border border-green-500/20 flex items-center gap-1">
                                <CheckCircle className="w-2.5 h-2.5" /> Going
                              </span>
                            )}
                            {event.category !== 'flash' && isSoon(event.event_date) && (
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

                      {event.category === 'flash' ? (
                        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 my-2">
                          <FlashCountdown expiry={event.event_date} createdAt={event.created_at} />
                        </div>
                      ) : null}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-bold text-white/60">
                        {event.category !== 'flash' && (
                          <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-purple-400" /> {formatDate(event.event_date)}</div>
                        )}
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

              {/* Flash Meetup Controls */}
              <div className="bg-[#0D0D19]/40 border border-white/5 p-5 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-[#fbbf24] flex items-center gap-1.5">⚡ Spontaneous Flash Meetup</h4>
                    <p className="text-[9px] text-white/45 font-bold mt-0.5">Disappears automatically once the timer expires. Perfect for quick link-ups.</p>
                  </div>
                  <input 
                    type="checkbox"
                    checked={form.isFlash}
                    onChange={e => setForm({...form, isFlash: e.target.checked})}
                    className="w-5 h-5 rounded border-white/10 text-purple-500 bg-[#0F0F1A] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                </div>
                {form.isFlash && (
                  <div className="space-y-2 animate-fade-in">
                    <label className="text-[9px] font-black uppercase tracking-widest text-white/45 ml-1">Disappears In*</label>
                    <div className="grid grid-cols-4 gap-2">
                      {['1', '2', '4', '6'].map(hours => (
                        <button
                          type="button"
                          key={hours}
                          onClick={() => setForm({...form, flashDuration: hours})}
                          className={`py-3 rounded-xl border text-xs font-black transition-all ${
                            form.flashDuration === hours 
                              ? 'bg-amber-500/20 border-amber-500 text-amber-400' 
                              : 'bg-[#13131f] border-white/5 text-white/40 hover:border-white/10'
                          }`}
                        >
                          {hours} HR
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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
                    required={!form.isFlash}
                    disabled={form.isFlash}
                    type="datetime-local" 
                    className="w-full bg-[#13131f] border border-white/5 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-purple-500 transition-all shadow-inner [color-scheme:dark] disabled:opacity-30 disabled:cursor-not-allowed"
                    value={form.isFlash ? '' : form.event_date}
                    onChange={e => setForm({...form, event_date: e.target.value})}
                  />
                  {form.isFlash && (
                    <p className="text-[8px] text-[#fbbf24] font-black uppercase tracking-widest ml-1 animate-pulse">⚡ Auto-scheduled expiration</p>
                  )}
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

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Event Photo</label>
                <input type="file" ref={eventFileRef} className="hidden" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setEventImage(file)
                    setEventImagePreview(URL.createObjectURL(file))
                  }
                }} />
                {eventImagePreview ? (
                  <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-white/10">
                    <img src={eventImagePreview} className="w-full h-full object-cover" alt="Preview" />
                    <button 
                      type="button" 
                      onClick={() => { setEventImage(null); setEventImagePreview(null); }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white hover:bg-red-500/60 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button 
                    type="button" 
                    onClick={() => eventFileRef.current?.click()}
                    className="w-full h-32 rounded-2xl border-2 border-dashed border-white/10 bg-[#13131f] flex flex-col items-center justify-center gap-2 text-white/30 hover:text-purple-400 hover:border-purple-500/30 transition-all"
                  >
                    <ImageIcon className="w-8 h-8" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Tap to upload photo</span>
                    <span className="text-[9px] text-white/20 font-bold">Optional — category default used if skipped</span>
                  </button>
                )}
              </div>

              <button 
                type="submit"
                disabled={uploading}
                className="w-full btn-grad py-5 rounded-2xl text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-purple-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Create Event'}
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
                src={selectedEvent.image_url || CATEGORY_IMAGES[selectedEvent.category] || CATEGORY_IMAGES.social} 
                className="w-full h-full object-cover" 
                alt={selectedEvent.title}
                onError={(e) => { (e.target as HTMLImageElement).src = CATEGORY_IMAGES[selectedEvent.category] || CATEGORY_IMAGES.social }}
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
