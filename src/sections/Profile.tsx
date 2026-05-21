import { useState, useEffect, useRef } from 'react'
import { Camera, Edit2, Shield, Crown, LogOut, ChevronRight, CheckCircle, Star, Zap, MapPin, BookOpen, Save, Loader2, Upload, User, Lock, Settings, Music, ChevronLeft, Play, Pause } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useNavigate, Link } from 'react-router-dom'
import { handleSupabaseError, safeProfileUpsert } from '@/lib/safe-supabase'
import FollowListModal from '@/components/FollowListModal'
import FollowButton from '@/components/FollowButton'

import { CAMPUSES } from '@/lib/constants'

const PRESET_SONGS = [
  { name: "Bien - Utanipenda 🎙️", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { name: "Sauti Sol - Lil Mama 🎸", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { name: "Wakadinali - Geri Inengi 🦍", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
  { name: "Burna Boy - Last Last 💔", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" }
]

const AudioVisualizer = () => (
  <div className="flex items-end gap-[3px] h-3 px-1">
    <style>{`
      @keyframes bounce-bar-1 { 0%, 100% { height: 30%; } 50% { height: 100%; } }
      @keyframes bounce-bar-2 { 0%, 100% { height: 40%; } 50% { height: 80%; } }
      @keyframes bounce-bar-3 { 0%, 100% { height: 20%; } 50% { height: 90%; } }
      @keyframes bounce-bar-4 { 0%, 100% { height: 50%; } 50% { height: 70%; } }
      .bar-1 { animation: bounce-bar-1 0.6s ease-in-out infinite; }
      .bar-2 { animation: bounce-bar-2 0.8s ease-in-out infinite; }
      .bar-3 { animation: bounce-bar-3 0.5s ease-in-out infinite; }
      .bar-4 { animation: bounce-bar-4 0.7s ease-in-out infinite; }
    `}</style>
    <div className="w-[2.5px] bg-purple-400 rounded-full bar-1" style={{ height: '30%' }} />
    <div className="w-[2.5px] bg-purple-400 rounded-full bar-2" style={{ height: '40%' }} />
    <div className="w-[2.5px] bg-purple-400 rounded-full bar-3" style={{ height: '20%' }} />
    <div className="w-[2.5px] bg-purple-400 rounded-full bar-4" style={{ height: '50%' }} />
  </div>
)

export default function Profile() {
  const { user, profile, fetchProfile, signOut } = useAuthStore()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [expandedSection, setExpandedSection] = useState<'account' | 'privacy' | null>(null)
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [showListModal, setShowListModal] = useState<{ type: 'followers' | 'following' } | null>(null)
  
  const [form, setForm] = useState({
    name: profile?.name || '',
    bio: profile?.bio || '',
    course: profile?.course || '',
    year: profile?.year || 1,
    campus: profile?.campus || '',
    interests: profile?.interests || [],
    whatsapp_number: profile?.whatsapp_number || '',
    now_playing: profile?.now_playing || '',
  })

  const [editingStatus, setEditingStatus] = useState(false)
  const [savingStatus, setSavingStatus] = useState(false)
  const [formStatus, setFormStatus] = useState({
    now_playing: profile?.now_playing || '',
    vibe_status: profile?.vibe || '',
    whatsapp_number: profile?.whatsapp_number || ''
  })

  const [privacy, setPrivacy] = useState({
    showUni: true,
    showWhatsAppMatches: true,
    allowDiscovery: true,
    showOnline: true,
    whatsappVisibility: 'everyone' as 'everyone' | 'matches' | 'nobody'
  })

  const [isPlaying, setIsPlaying] = useState(false)
  const [activeSong, setActiveSong] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const togglePlay = (songName: string) => {
    if (activeSong !== songName) {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      
      const preset = PRESET_SONGS.find(s => 
        songName.toLowerCase().includes(s.name.toLowerCase()) || 
        s.name.toLowerCase().includes(songName.toLowerCase()) ||
        songName.toLowerCase().includes(s.name.split(' - ')[0].toLowerCase())
      ) || PRESET_SONGS[0]
      
      const newAudio = new Audio(preset.url)
      newAudio.addEventListener('ended', () => {
        setIsPlaying(false)
        setActiveSong(null)
      })
      audioRef.current = newAudio
      audioRef.current.play().catch(err => console.error("Audio play failed:", err))
      setActiveSong(songName)
      setIsPlaying(true)
    } else {
      if (isPlaying) {
        audioRef.current?.pause()
        setIsPlaying(false)
      } else {
        audioRef.current?.play().catch(err => console.error("Audio play failed:", err))
        setIsPlaying(true)
      }
    }
  }

  // Sync privacy from localStorage
  useEffect(() => {
    if (user) {
      const savedPrivacy = localStorage.getItem(`turnup_privacy_${user.id}`)
      if (savedPrivacy) {
        try {
          const parsed = JSON.parse(savedPrivacy)
          setPrivacy(p => ({
            ...p,
            ...parsed,
            whatsappVisibility: parsed.whatsappVisibility || (parsed.showWhatsAppMatches ? 'matches' : 'everyone')
          }))
        } catch (e) {
          console.error("Failed to parse privacy settings:", e)
        }
      }
    }
  }, [user])

  // Cleanup audio
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [])

  const INTERESTS = ['Music', 'Dancing', 'Coding', 'Gaming', 'Movies', 'Sports', 'Travel', 'Photography', 'Food', 'Fashion', 'Art', 'Reading', 'Hiking', 'Coffee', 'Parties', 'Studying', 'Cars', 'Netflix', 'Gym', 'Finance']

  const toggleInterest = (i: string) => {
    setForm(f => ({
      ...f,
      interests: f.interests.includes(i) ? f.interests.filter(x => x !== i) : f.interests.length < 6 ? [...f.interests, i] : f.interests
    }))
  }

  useEffect(() => {
    if (user) {
      fetchFollowCounts()
      
      const channel = supabase
        .channel(`profile-stats:${user.id}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'follows',
          filter: `or(follower_id.eq.${user.id},following_id.eq.${user.id})`
        }, () => {
          fetchFollowCounts()
        })
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    }
  }, [user])

  const fetchFollowCounts = async () => {
    if (!user) return
    const [followers, following] = await Promise.all([
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', user.id),
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', user.id)
    ])
    
    if (followers.error) handleSupabaseError(followers.error)
    if (following.error) handleSupabaseError(following.error)
    
    setFollowerCount(followers.count || 0)
    setFollowingCount(following.count || 0)
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user || !profile) return

    setPhotoUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ photos: [publicUrl, ...(profile.photos?.slice(1) || [])] })
        .eq('id', user.id)

      if (updateError) handleSupabaseError(updateError)
      else {
        await fetchProfile(user.id)
        toast.success('Photo updated!')
      }
    } catch (err: any) {
      toast.error('Error uploading photo')
      console.error(err)
    } finally {
      setPhotoUploading(false)
    }
  }

  const save = async () => {
    if (!user) return
    setSaving(true)
    
    // Validate WhatsApp
    let wa = form.whatsapp_number
    if (wa && !wa.startsWith('+')) {
      if (wa.startsWith('0')) wa = '+254' + wa.substring(1)
      else if (!wa.startsWith('254')) wa = '+254' + wa
      else wa = '+' + wa
    }

    const success = await safeProfileUpsert({ 
      id: user.id,
      name: form.name,
      bio: form.bio, 
      course: form.course, 
      year: form.year,
      campus: form.campus,
      interests: form.interests,
      whatsapp_number: wa,
      now_playing: form.now_playing,
      onboarding_completed: true
    })

    if (success) {
      await fetchProfile(user.id)
      toast.success('Profile updated!')
      setEditing(false)
      setExpandedSection(null)
    }
    setSaving(false)
  }

  const saveStatusUpdate = async () => {
    if (!user) return
    setSavingStatus(true)
    
    let wa = formStatus.whatsapp_number
    if (wa && !wa.startsWith('+')) {
      if (wa.startsWith('0')) wa = '+254' + wa.substring(1)
      else if (!wa.startsWith('254')) wa = '+254' + wa
      else wa = '+' + wa
    }

    const success = await safeProfileUpsert({ 
      id: user.id,
      name: profile?.name || '',
      bio: profile?.bio || '', 
      course: profile?.course || '', 
      year: profile?.year || 1,
      campus: profile?.campus || '',
      interests: profile?.interests || [],
      whatsapp_number: wa,
      now_playing: formStatus.now_playing,
      vibe: formStatus.vibe_status,
      onboarding_completed: true
    })

    if (success) {
      await fetchProfile(user.id)
      toast.success('Live vibe and status updated! ⚡')
      
      // Update general form state to stay in sync
      setForm(f => ({
        ...f,
        whatsapp_number: wa,
        now_playing: formStatus.now_playing
      }))
      
      setEditingStatus(false)
    }
    setSavingStatus(false)
  }

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out!')
    navigate('/')
  }

  if (!profile) {
    return (
      <main className="min-h-screen pt-20 flex flex-col items-center justify-center px-4 text-center">
        <div className="w-20 h-20 rounded-3xl grad-bg flex items-center justify-center mb-6 animate-bounce">
          <Zap className="w-10 h-10 text-white" />
        </div>
        <h2 className="font-syne font-bold text-2xl text-white mb-2">Profile Not Found</h2>
        <p className="text-gray-500 max-w-xs mb-8">
          It looks like you haven't finished setting up your profile yet. Let's get that sorted!
        </p>
        <Link to="/onboarding" className="btn-grad px-8 py-3 rounded-xl font-bold flex items-center gap-2">
          Complete Setup <ChevronRight className="w-4 h-4" />
        </Link>
      </main>
    )
  }

  const Toggle = ({ active, onToggle }: { active: boolean, onToggle: () => void }) => (
    <button 
      onClick={onToggle}
      className={`w-10 h-5 rounded-full transition-all relative ${active ? 'bg-purple-500' : 'bg-gray-700'}`}
    >
      <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${active ? 'right-1' : 'left-1'}`} />
    </button>
  )

  return (
    <main className="page-main !pt-0">
      <div className="w-full max-w-2xl mx-auto min-h-screen bg-[#08080F]">
        {/* Cover Banner */}
        <div className="relative h-48 sm:h-64 w-full bg-gradient-to-br from-[#8B5CF6] via-[#EC4899] to-[#08080F] overflow-hidden">
          <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#08080F] to-transparent" />
          
          {/* Top Actions */}
          <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10">
            <Link to="/discover" className="p-2 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white hover:bg-black/40 transition-all">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <button 
              onClick={() => setEditing(!editing)} 
              className="px-4 py-2 rounded-xl bg-black/20 backdrop-blur-md border border-white/10 text-white hover:bg-black/40 transition-all text-[10px] font-black uppercase tracking-widest"
            >
              {editing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </div>

        {/* Profile Content */}
        <div className="px-6 -mt-20 relative z-10">
          <div className="flex flex-col items-center">
            {/* Overlapping Avatar */}
            <div className="relative inline-block group">
              <div className="p-1 rounded-[2.5rem] bg-gradient-to-tr from-[#8B5CF6] to-[#EC4899] shadow-2xl shadow-purple-500/20">
                <img
                  src={profile.photos?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop'}
                  alt={profile.name}
                  className={`w-32 h-32 rounded-[2.2rem] object-cover border-4 border-[#08080F] ${photoUploading ? 'opacity-50' : ''}`}
                />
              </div>
              {photoUploading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                </div>
              )}
              <label className="absolute bottom-1 right-1 w-10 h-10 bg-[#8B5CF6] rounded-2xl flex items-center justify-center border-4 border-[#08080F] cursor-pointer hover:scale-110 transition-all shadow-xl active:scale-95">
                <Camera className="w-4 h-4 text-white" />
                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={photoUploading} />
              </label>
            </div>

            {/* User Info */}
            <div className="mt-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <h2 className="font-syne font-black text-2xl sm:text-3xl text-white tracking-tight">
                  {profile.name}, {profile.age}
                </h2>
                {profile.verified && <CheckCircle className="w-5 h-5 text-purple-400" />}
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-gray-500 text-[10px] font-black uppercase tracking-[0.1em]">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-purple-400" /> {profile.campus}
                </div>
                <div className="w-1 h-1 rounded-full bg-gray-800" />
                <div className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-purple-400" /> {profile.course}
                </div>
              </div>

              {/* Follow Stats Prominent */}
              <div className="flex items-center justify-center gap-8 mt-8">
                <button 
                  onClick={() => setShowListModal({ type: 'followers' })}
                  className="flex flex-col items-center group"
                >
                  <span className="text-2xl text-white font-black group-hover:text-purple-400 transition-colors leading-none">{followerCount}</span>
                  <span className="text-[9px] text-gray-600 uppercase tracking-[0.2em] font-black group-hover:text-gray-400 transition-colors mt-1">followers</span>
                </button>
                <div className="w-px h-8 bg-white/5" />
                <button 
                  onClick={() => setShowListModal({ type: 'following' })}
                  className="flex flex-col items-center group"
                >
                  <span className="text-2xl text-white font-black group-hover:text-purple-400 transition-colors leading-none">{followingCount}</span>
                  <span className="text-[9px] text-gray-600 uppercase tracking-[0.2em] font-black group-hover:text-gray-400 transition-colors mt-1">following</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-8 space-y-6">
          {/* Vibe Count Card */}
          <div className="grid grid-cols-2 gap-3">
             <div className="bg-[#0F0F1A]/80 backdrop-blur-xl border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                <span className="text-2xl mb-1">🔥</span>
                <span className="text-white font-black text-xl leading-none">{profile.vibe_count || 0}</span>
                <span className="text-[8px] text-gray-600 uppercase tracking-widest font-black mt-1">Vibes Received</span>
             </div>
             <div className="bg-[#0F0F1A]/80 backdrop-blur-xl border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                <span className="text-2xl mb-1">✨</span>
                <span className="text-white font-black text-xl leading-none">3</span>
                <span className="text-[8px] text-gray-600 uppercase tracking-widest font-black mt-1">Events RSVP'd</span>
             </div>
          </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {profile.premium && (
            <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center gap-1.5">
              <Crown className="w-3 h-3" /> Premium
            </span>
          )}
          {profile.is_registered_voter && (
            <span 
              className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,102,0,0.15)]"
              style={{
                background: 'linear-gradient(#0F0F1A, #0F0F1A) padding-box, linear-gradient(to right, #000000 0%, #000000 30%, #ffffff 30%, #ffffff 33%, #BB1A25 33%, #BB1A25 66%, #ffffff 66%, #ffffff 69%, #006600 69%, #006600 100%) border-box',
                border: '1.5px solid transparent'
              }}
            >
              🇰🇪 Nimejisajili — 2027 Ready
            </span>
          )}
        </div>

        {/* Stats Section Removed - Integrated into cards below */}

        {/* Now Playing & Vibe Status Station */}
        <div className="card p-5 mb-4 border-white/5 bg-[#0f0f1a]/60 backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
          
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em] flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-purple-400 animate-pulse" /> Live Status & Vibe
            </h3>
            {!editingStatus && (
              <button 
                onClick={() => {
                  setEditingStatus(true)
                  setFormStatus({
                    now_playing: profile.now_playing || '',
                    vibe_status: profile.vibe || '',
                    whatsapp_number: profile.whatsapp_number || ''
                  })
                }} 
                className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-purple-400 hover:text-purple-300 hover:bg-white/10 transition-all text-[9px] font-black uppercase tracking-wider flex items-center gap-1 min-h-[24px]"
              >
                <Edit2 className="w-2.5 h-2.5" /> Update
              </button>
            )}
          </div>

          {editingStatus ? (
            <div className="space-y-4 pt-2 animate-fade-in">
              <div>
                <label className="text-[8px] text-gray-500 uppercase font-black tracking-widest block mb-1">Status Vibe Song</label>
                <input
                  type="text"
                  className="input-dark w-full text-xs min-h-[38px] px-3 rounded-xl"
                  placeholder="Bien - Utanipenda 🎵"
                  value={formStatus.now_playing}
                  onChange={e => setFormStatus({ ...formStatus, now_playing: e.target.value })}
                  maxLength={100}
                />
                
                {/* Hot Presets */}
                <div className="mt-2">
                  <p className="text-[7px] text-purple-400/80 font-black uppercase tracking-wider mb-1">🔥 Preset Realhuman Jamz:</p>
                  <div className="flex flex-wrap gap-1">
                    {PRESET_SONGS.map(s => (
                      <button
                        key={s.name}
                        type="button"
                        onClick={() => setFormStatus({ ...formStatus, now_playing: s.name })}
                        className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wide border transition-all ${
                          formStatus.now_playing === s.name
                            ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.15)]'
                            : 'bg-white/5 border-white/5 text-gray-400 hover:text-white'
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[8px] text-gray-500 uppercase font-black tracking-widest block mb-1">Vibe Description Status</label>
                <input
                  type="text"
                  className="input-dark w-full text-xs min-h-[38px] px-3 rounded-xl"
                  placeholder="Feeling lucky 🍀"
                  value={formStatus.vibe_status}
                  onChange={e => setFormStatus({ ...formStatus, vibe_status: e.target.value })}
                  maxLength={60}
                />
              </div>

              <div>
                <label className="text-[8px] text-gray-500 uppercase font-black tracking-widest block mb-1">WhatsApp Status Contact</label>
                <input
                  type="text"
                  className="input-dark w-full text-xs min-h-[38px] px-3 rounded-xl"
                  placeholder="e.g. 0712345678"
                  value={formStatus.whatsapp_number}
                  onChange={e => setFormStatus({ ...formStatus, whatsapp_number: e.target.value })}
                />
              </div>

              <div className="flex gap-2 pt-1.5">
                <button 
                  onClick={saveStatusUpdate}
                  disabled={savingStatus}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] font-black uppercase tracking-widest hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 min-h-[36px] flex items-center justify-center"
                >
                  {savingStatus ? 'Saving...' : 'Save Vibe'}
                </button>
                <button 
                  onClick={() => setEditingStatus(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-[10px] font-black uppercase tracking-widest hover:text-white transition-all min-h-[36px] flex items-center justify-center"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Vibe Song */}
              <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-2xl p-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                    <Music className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-[8px] text-gray-500 font-black uppercase tracking-wider leading-none flex items-center gap-1.5">
                      Song Vibe
                      {isPlaying && activeSong === profile.now_playing && (
                        <span className="text-[6px] text-purple-400 font-bold uppercase tracking-widest bg-purple-500/10 px-1 py-0.2 rounded animate-pulse">
                          Playing Live
                        </span>
                      )}
                    </p>
                    <p className="text-white text-xs font-bold mt-1">
                      {profile.now_playing || <span className="text-gray-600 italic">No song playing...</span>}
                    </p>
                  </div>
                </div>

                {profile.now_playing && (
                  <div className="flex items-center gap-2">
                    {/* Visualizer Waves */}
                    {isPlaying && activeSong === profile.now_playing && <AudioVisualizer />}
                    
                    {/* Play/Pause Button */}
                    <button
                      onClick={() => togglePlay(profile.now_playing!)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all active:scale-90 ${
                        isPlaying && activeSong === profile.now_playing
                          ? 'bg-purple-500/20 border-purple-500/30 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.1)]'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {isPlaying && activeSong === profile.now_playing ? (
                        <Pause className="w-3.5 h-3.5" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Text Vibe Status */}
              <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-2xl p-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
                    <Zap className="w-4 h-4 text-pink-400 animate-pulse" />
                  </div>
                  <div className="text-left">
                    <p className="text-[8px] text-gray-500 font-black uppercase tracking-wider leading-none">Vibe Status</p>
                    <p className="text-white text-xs font-bold mt-1">
                      {profile.vibe || <span className="text-gray-600 italic">No custom status set...</span>}
                    </p>
                  </div>
                </div>
              </div>

              {/* WhatsApp Connection */}
              <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-2xl p-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
                    <span className="text-base">💬</span>
                  </div>
                  <div className="text-left">
                    <p className="text-[8px] text-gray-500 font-black uppercase tracking-wider leading-none flex items-center gap-1.5">
                      WhatsApp Link
                      <span className="text-[7px] text-purple-400 font-bold uppercase tracking-widest bg-purple-500/10 px-1 py-0.5 rounded">
                        {privacy.whatsappVisibility === 'nobody' ? '🔒 Private' : privacy.whatsappVisibility === 'matches' ? '👥 Matches' : '🔓 Public'}
                      </span>
                    </p>
                    <p className="text-white text-xs font-bold mt-1">
                      {profile.whatsapp_number ? (
                        privacy.whatsappVisibility === 'nobody' ? (
                          <span className="text-gray-500 font-semibold flex items-center gap-1">
                            {profile.whatsapp_number.substring(0, 4)}•••••••• (Hidden - Private 🔒)
                          </span>
                        ) : privacy.whatsappVisibility === 'matches' ? (
                          <span className="text-purple-400 font-semibold flex items-center gap-1">
                            {profile.whatsapp_number.substring(0, 4)}•••••••• (Matches Only 👥)
                          </span>
                        ) : (
                          <a 
                            href={`https://wa.me/${profile.whatsapp_number.replace('+', '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-green-400 hover:text-green-300 font-bold transition-colors flex items-center gap-1"
                          >
                            {profile.whatsapp_number} ⚡
                          </a>
                        )
                      ) : (
                        <span className="text-gray-600 italic">Not set. Tap Update to add!</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bio */}
        <div className="card p-5 mb-4 border-white/5 bg-white/[0.02]">
          <h3 className="text-[9px] text-gray-500 mb-2.5 font-black uppercase tracking-[0.2em]">About Me</h3>
          {editing ? (
            <textarea
              className="input-dark resize-none text-sm w-full min-h-[100px]"
              rows={3}
              value={form.bio}
              maxLength={200}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              placeholder="Tell the campus your vibe..."
            />
          ) : (
            <p className="text-gray-300 text-sm leading-relaxed font-medium">{profile.bio || 'No bio yet. Add one!'}</p>
          )}
        </div>

        {/* Interests */}
        <div className="card p-5 mb-4 border-white/5 bg-white/[0.02]">
          <h3 className="text-[9px] text-gray-500 mb-4 font-black uppercase tracking-[0.2em]">Interests</h3>
          <div className="flex flex-wrap gap-2">
            {editing ? (
              INTERESTS.map(i => (
                <button key={i} onClick={() => toggleInterest(i)} className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all min-h-[32px] ${form.interests.includes(i) ? 'grad-bg text-white' : 'bg-white/5 text-gray-500 hover:text-gray-300'}`}>{i}</button>
              ))
            ) : (
              (profile.interests || []).map(i => (
                <span key={i} className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-bold uppercase tracking-wider">{i}</span>
              ))
            )}
          </div>
        </div>

        {editing && (
          <button onClick={save} disabled={saving} className="btn-grad w-full flex items-center justify-center gap-2 mb-8 py-4 font-black uppercase tracking-widest shadow-2xl shadow-purple-500/20 active:scale-[0.98]">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Update Profile
          </button>
        )}

        {/* Settings sections */}
        <div className="space-y-4">
          {/* Account Settings */}
          <div className="card overflow-hidden border-white/5 bg-white/[0.02]">
            <button 
              onClick={() => setExpandedSection(expandedSection === 'account' ? null : 'account')}
              className="w-full flex items-center gap-4 px-5 py-5 hover:bg-white/3 transition-all text-left min-h-[64px]"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <User className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-gray-200 text-sm font-black uppercase tracking-wider flex-1">Account Settings</span>
              <ChevronRight className={`w-4 h-4 text-gray-700 transition-transform ${expandedSection === 'account' ? 'rotate-90' : ''}`} />
            </button>
            
            {expandedSection === 'account' && (
              <div className="px-5 pb-8 pt-2 space-y-5 border-t border-white/5 animate-fade-in">
                <div>
                  <label className="text-[9px] text-gray-500 uppercase font-black mb-2 block tracking-widest">Display Name</label>
                  <input className="input-dark min-h-[48px]" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div>
                  <label className="text-[9px] text-gray-500 uppercase font-black mb-2 block tracking-widest">University</label>
                  <select 
                    className="input-dark appearance-none min-h-[48px]" 
                    value={form.campus} 
                    onChange={e => setForm({...form, campus: e.target.value})}
                  >
                    <option value="">Select campus...</option>
                    {CAMPUSES.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] text-gray-500 uppercase font-black mb-2 block tracking-widest">Course</label>
                    <input className="input-dark min-h-[48px]" value={form.course} onChange={e => setForm({...form, course: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-500 uppercase font-black mb-2 block tracking-widest">Year</label>
                    <input type="number" className="input-dark min-h-[48px]" value={form.year} onChange={e => setForm({...form, year: parseInt(e.target.value)})} />
                  </div>
                </div>
                <div>
                  <label className="text-[9px] text-gray-500 uppercase font-black mb-2 block tracking-widest">WhatsApp Number</label>
                  <input className="input-dark min-h-[48px]" placeholder="e.g. 0712345678" value={form.whatsapp_number} onChange={e => setForm({...form, whatsapp_number: e.target.value})} />
                </div>
                <button onClick={save} disabled={saving} className="btn-grad w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-purple-500/10 active:scale-[0.98]">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          {/* Privacy Settings */}
          <div className="card overflow-hidden border-white/5 bg-white/[0.02]">
            <button 
              onClick={() => setExpandedSection(expandedSection === 'privacy' ? null : 'privacy')}
              className="w-full flex items-center gap-4 px-5 py-5 hover:bg-white/3 transition-all text-left min-h-[64px]"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Lock className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-gray-200 text-sm font-black uppercase tracking-wider flex-1">Privacy & Safety</span>
              <ChevronRight className={`w-4 h-4 text-gray-700 transition-transform ${expandedSection === 'privacy' ? 'rotate-90' : ''}`} />
            </button>

            {expandedSection === 'privacy' && (
              <div className="px-5 pb-6 pt-2 divide-y divide-white/5 animate-fade-in">
                {[
                  { key: 'showUni', label: 'Show university on profile' },
                  { key: 'allowDiscovery', label: 'Show me in Discovery' },
                  { key: 'showOnline', label: 'Show my online status' }
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between py-4">
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-tight">{label}</span>
                    <Toggle 
                      active={privacy[key as keyof typeof privacy] as boolean} 
                      onToggle={() => {
                        const newPrivacy = { ...privacy, [key]: !privacy[key as keyof typeof privacy] }
                        setPrivacy(newPrivacy)
                        if (user) localStorage.setItem(`turnup_privacy_${user.id}`, JSON.stringify(newPrivacy))
                      }} 
                    />
                  </div>
                ))}

                {/* WhatsApp Visibility Dropdown */}
                <div className="py-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-tight">WhatsApp Number Visibility</span>
                  </div>
                  <div className="flex gap-1.5">
                    {([
                      { value: 'everyone' as const, label: '🔓 Everyone', desc: 'Visible to all' },
                      { value: 'matches' as const, label: '👥 Matches', desc: 'Matches only' },
                      { value: 'nobody' as const, label: '🔒 Private', desc: 'Hidden' }
                    ]).map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          const newPrivacy = { ...privacy, whatsappVisibility: opt.value }
                          setPrivacy(newPrivacy)
                          if (user) localStorage.setItem(`turnup_privacy_${user.id}`, JSON.stringify(newPrivacy))
                        }}
                        className={`flex-1 py-2.5 rounded-xl text-center transition-all border ${
                          privacy.whatsappVisibility === opt.value
                            ? 'bg-purple-500/15 border-purple-500/40 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.1)]'
                            : 'bg-white/[0.03] border-white/5 text-gray-500 hover:text-gray-300 hover:border-white/10'
                        }`}
                      >
                        <span className="text-sm block">{opt.label.split(' ')[0]}</span>
                        <span className="text-[8px] font-black uppercase tracking-wider block mt-0.5">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[8px] text-gray-600 mt-2 font-medium">
                    Controls who can see your WhatsApp number on your profile. Works like WhatsApp's own privacy settings.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Replay Cinematic Intro */}
          <button 
            onClick={() => window.dispatchEvent(new Event('replay_turnup_cinematic'))}
            className="card w-full flex items-center gap-4 px-5 py-5 hover:bg-purple-500/5 transition-all text-left group border-white/5 bg-white/[0.02] min-h-[64px]"
          >
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-all">
              <Zap className="w-4 h-4 text-purple-400 group-hover:text-purple-300 animate-pulse" />
            </div>
            <span className="text-purple-300/80 group-hover:text-purple-300 text-sm font-black uppercase tracking-wider flex-1">Replay Update Cinematic</span>
            <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-gray-500 transition-colors" />
          </button>

          {/* Logout */}
          <button onClick={handleSignOut} className="card w-full flex items-center gap-4 px-5 py-5 hover:bg-red-500/5 transition-all text-left group border-white/5 bg-white/[0.02] min-h-[64px]">
            <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-all">
              <LogOut className="w-4 h-4 text-red-500/70 group-hover:text-red-500" />
            </div>
            <span className="text-red-400/80 group-hover:text-red-500 text-sm font-black uppercase tracking-wider flex-1">Sign Out</span>
          </button>
        </div>

        <div className="text-center mt-12 pb-8">
          <p className="text-gray-700 text-[10px] font-black uppercase tracking-[0.3em]">TurnUp v3.0.0</p>
          <p className="text-gray-800 text-[9px] mt-1.5 font-bold uppercase tracking-widest opacity-50">{profile?.campus || 'TurnUp Campus Network'} · active vibe link</p>
        </div>
      </div>

      {showListModal && (
        <FollowListModal 
          userId={user.id} 
          type={showListModal.type} 
          onClose={() => setShowListModal(null)} 
        />
      )}
      </div>
    </main>
  )
}
