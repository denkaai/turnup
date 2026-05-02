import { useState, useEffect } from 'react'
import { Camera, Edit2, Shield, Crown, LogOut, ChevronRight, CheckCircle, Star, Zap, MapPin, BookOpen, Save, Loader2, Upload, User, Lock, Settings, Music } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useNavigate, Link } from 'react-router-dom'
import FollowListModal from '@/components/FollowListModal'
import FollowButton from '@/components/FollowButton'

const UNIVERSITIES = ['KU', 'JKUAT', 'Zetech', 'MKU', 'PAC University', 'Gretsa', 'Murang\'a University']

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

  const [privacy, setPrivacy] = useState({
    showUni: true,
    showWhatsAppMatches: true,
    allowDiscovery: true,
    showOnline: true
  })

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
    
    if (followers.error) console.error('Error fetching followers count:', followers.error.message)
    if (following.error) console.error('Error fetching following count:', following.error.message)
    
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

      if (updateError) throw updateError

      await fetchProfile(user.id)
      toast.success('Photo updated!')
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

    const { error } = await supabase.from('profiles').update({ 
      name: form.name,
      bio: form.bio, 
      course: form.course, 
      year: form.year,
      campus: form.campus,
      interests: form.interests,
      whatsapp_number: wa,
      now_playing: form.now_playing
    }).eq('id', user.id)

    if (error) toast.error('Failed to save')
    else {
      await fetchProfile(user.id)
      toast.success('Profile updated!')
      setEditing(false)
      setExpandedSection(null)
    }
    setSaving(false)
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
    <main className="min-h-screen pt-14 px-4 py-8 pb-24 md:pb-12">
      <div className="max-w-sm mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-syne font-bold text-xl sm:text-2xl text-white tracking-tight">Profile</h1>
            <p className="text-gray-600 text-[10px] uppercase font-black tracking-widest">Your Campus Identity</p>
          </div>
          <button onClick={() => setEditing(!editing)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 text-gray-400 hover:bg-white/10 transition-all text-xs font-bold min-h-[44px]">
            <Edit2 className="w-3.5 h-3.5" /> {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {/* Avatar */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="p-1 rounded-full grad-bg shadow-2xl shadow-purple-500/20">
              <img
                src={profile.photos?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop'}
                alt={profile.name}
                className={`w-28 h-28 rounded-full object-cover border-4 border-[#090912] ${photoUploading ? 'opacity-50' : ''}`}
              />
            </div>
            {photoUploading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
              </div>
            )}
            <label className="absolute bottom-1 right-1 w-10 h-10 grad-bg rounded-full flex items-center justify-center border-4 border-[#090912] cursor-pointer hover:scale-110 transition-all shadow-xl">
              <Camera className="w-4 h-4 text-white" />
              <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={photoUploading} />
            </label>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-center gap-2 mb-1.5">
              <h2 className="font-syne font-bold text-xl sm:text-2xl text-white tracking-tight">{profile.name}, {profile.age}</h2>
              {profile.verified && <CheckCircle className="w-4 h-4 text-green-400" />}
              {profile.premium && <Crown className="w-4 h-4 text-amber-400" />}
            </div>
            <div className="flex items-center justify-center gap-1.5 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
              <MapPin className="w-3 h-3 text-purple-400" /> {profile.campus}
            </div>
            <div className="flex items-center justify-center gap-1.5 text-gray-600 text-[10px] font-bold uppercase tracking-wider mt-1">
              <BookOpen className="w-3 h-3 text-purple-400" /> {profile.course} · Year {profile.year}
            </div>
            <div className="flex items-center justify-center gap-3 mt-4">
              <button 
                onClick={() => setShowListModal({ type: 'followers' })}
                className="flex items-center gap-1 group"
              >
                <span className="text-white font-black text-sm group-hover:text-purple-400 transition-colors">{followerCount}</span>
                <span className="text-gray-600 text-[9px] uppercase tracking-widest font-bold group-hover:text-gray-400 transition-colors">followers</span>
              </button>
              <div className="w-1 h-1 rounded-full bg-gray-800" />
              <button 
                onClick={() => setShowListModal({ type: 'following' })}
                className="flex items-center gap-1 group"
              >
                <span className="text-white font-black text-sm group-hover:text-purple-400 transition-colors">{followingCount}</span>
                <span className="text-gray-600 text-[9px] uppercase tracking-widest font-bold group-hover:text-gray-400 transition-colors">following</span>
              </button>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {profile.verified && (
            <span className="verified-badge px-4 py-1.5"><Shield className="w-3 h-3" /> Student Verified</span>
          )}
          {profile.premium && (
            <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center gap-1.5">
              <Crown className="w-3 h-3" /> Premium
            </span>
          )}
          {profile.is_registered_voter && (
            <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#006600]/20 border border-[#006600]/40 text-[#4ade80] flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,102,0,0.2)]">
              ✓ Nimejisajili — 2027 Ready
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[{ label: 'Matches', value: '12' }, { label: 'Events', value: '3' }, { label: 'Vibes', value: '5' }].map(s => (
            <div key={s.label} className="card p-4 text-center hover:scale-105 transition-all cursor-default border-white/5 bg-white/[0.02]">
              <p className="font-syne font-black text-xl grad-text leading-none mb-1.5">{s.value}</p>
              <p className="text-gray-600 text-[8px] sm:text-[9px] uppercase font-black tracking-[0.15em]">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Now Playing */}
        <div className="card p-5 mb-4 border-white/5 bg-white/[0.02]">
          <h3 className="text-[9px] text-gray-500 mb-2.5 font-black uppercase tracking-[0.2em] flex items-center gap-1.5">
            <Music className="w-3 h-3 text-purple-400" /> Now Playing
          </h3>
          {editing ? (
            <input
              type="text"
              className="input-dark w-full text-sm"
              placeholder="E.g. Listening to: Bien - Utanipenda 🎵"
              value={form.now_playing}
              onChange={e => setForm({...form, now_playing: e.target.value})}
              maxLength={100}
            />
          ) : (
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{profile.now_playing || <span className="text-gray-600 italic">No song playing...</span>}</p>
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
                    {UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
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
                  { key: 'showWhatsAppMatches', label: 'WhatsApp to matches only' },
                  { key: 'allowDiscovery', label: 'Show me in Discovery' },
                  { key: 'showOnline', label: 'Show my online status' }
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between py-4">
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-tight">{label}</span>
                    <Toggle 
                      active={privacy[key as keyof typeof privacy]} 
                      onToggle={() => setPrivacy(p => ({ ...p, [key]: !p[key as keyof typeof privacy] }))} 
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Logout */}
          <button onClick={handleSignOut} className="card w-full flex items-center gap-4 px-5 py-5 hover:bg-red-500/5 transition-all text-left group border-white/5 bg-white/[0.02] min-h-[64px]">
            <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-all">
              <LogOut className="w-4 h-4 text-red-500/70 group-hover:text-red-500" />
            </div>
            <span className="text-red-400/80 group-hover:text-red-500 text-sm font-black uppercase tracking-wider flex-1">Sign Out</span>
          </button>
        </div>

        <div className="text-center mt-12 pb-8">
          <p className="text-gray-700 text-[10px] font-black uppercase tracking-[0.3em]">TurnUp v2.0</p>
          <p className="text-gray-800 text-[9px] mt-1.5 font-bold uppercase tracking-widest opacity-50">Kenyatta University · Thika Road</p>
        </div>
      </div>

      {showListModal && (
        <FollowListModal 
          userId={user.id} 
          type={showListModal.type} 
          onClose={() => setShowListModal(null)} 
        />
      )}
    </main>
  )
}
