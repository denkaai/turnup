import { useState } from 'react'
import { Camera, Edit2, Shield, Crown, LogOut, ChevronRight, CheckCircle, Star, Zap, MapPin, BookOpen, Save, Loader2, Upload, User, Lock, Settings } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useNavigate, Link } from 'react-router-dom'

const UNIVERSITIES = ['KU', 'JKUAT', 'Zetech', 'MKU', 'PAC University', 'Gretsa', 'Murang\'a University']

export default function Profile() {
  const { user, profile, fetchProfile, signOut } = useAuthStore()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [expandedSection, setExpandedSection] = useState<'account' | 'privacy' | null>(null)
  
  const [form, setForm] = useState({
    name: profile?.name || '',
    bio: profile?.bio || '',
    course: profile?.course || '',
    year: profile?.year || 1,
    campus: profile?.campus || '',
    interests: profile?.interests || [],
    whatsapp_number: profile?.whatsapp_number || '',
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
      whatsapp_number: wa
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
    <main className="min-h-screen pt-14 px-4 py-8">
      <div className="max-w-sm mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-syne font-bold text-xl text-white">Profile</h1>
          <button onClick={() => setEditing(!editing)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition-all text-sm">
            <Edit2 className="w-3.5 h-3.5" /> {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {/* Avatar */}
        <div className="text-center mb-6">
          <div className="relative inline-block">
            <img
              src={profile.photos?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop'}
              alt={profile.name}
              className={`w-24 h-24 rounded-full object-cover border-2 border-purple-500/30 ${photoUploading ? 'opacity-50' : ''}`}
            />
            {photoUploading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
              </div>
            )}
            <label className="absolute bottom-0 right-0 w-8 h-8 grad-bg rounded-full flex items-center justify-center border-2 border-[#090912] cursor-pointer hover:scale-110 transition-all shadow-lg">
              <Camera className="w-4 h-4 text-white" />
              <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={photoUploading} />
            </label>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-center gap-2 mb-1">
              <h2 className="font-syne font-bold text-xl text-white">{profile.name}, {profile.age}</h2>
              {profile.verified && <CheckCircle className="w-4 h-4 text-green-400" />}
              {profile.premium && <Crown className="w-4 h-4 text-amber-400" />}
            </div>
            <div className="flex items-center justify-center gap-1 text-gray-500 text-xs">
              <MapPin className="w-3 h-3" /> {profile.campus}
            </div>
            <div className="flex items-center justify-center gap-1 text-gray-600 text-xs mt-0.5">
              <BookOpen className="w-3 h-3" /> {profile.course} · Year {profile.year}
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="flex gap-2 justify-center mb-6">
          {profile.verified && (
            <span className="verified-badge"><Shield className="w-3 h-3" /> Student Verified</span>
          )}
          {profile.premium && (
            <span className="px-3 py-1 rounded-full text-xs bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center gap-1">
              <Crown className="w-3 h-3" /> Premium
            </span>
          )}
        </div>

        {/* Bio */}
        <div className="card p-4 mb-4">
          <h3 className="text-xs text-gray-500 mb-2 font-black uppercase tracking-widest">Bio</h3>
          {editing ? (
            <textarea
              className="input-dark resize-none text-sm w-full"
              rows={3}
              value={form.bio}
              maxLength={200}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            />
          ) : (
            <p className="text-gray-300 text-sm leading-relaxed">{profile.bio || 'No bio yet. Add one!'}</p>
          )}
        </div>

        {/* Interests */}
        <div className="card p-4 mb-4">
          <h3 className="text-xs text-gray-500 mb-3 font-black uppercase tracking-widest">Interests</h3>
          <div className="flex flex-wrap gap-2">
            {editing ? (
              INTERESTS.map(i => (
                <button key={i} onClick={() => toggleInterest(i)} className={`px-2.5 py-1 rounded-full text-xs transition-all ${form.interests.includes(i) ? 'grad-bg text-white' : 'bg-white/5 text-gray-500 hover:text-gray-300'}`}>{i}</button>
              ))
            ) : (
              (profile.interests || []).map(i => (
                <span key={i} className="px-2.5 py-1 rounded-full bg-purple-500/12 border border-purple-500/20 text-purple-300 text-xs">{i}</span>
              ))
            )}
          </div>
        </div>

        {editing && (
          <button onClick={save} disabled={saving} className="btn-grad w-full flex items-center justify-center gap-2 text-sm mb-6 py-3 font-bold">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Profile
          </button>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[{ label: 'Matches', value: '12' }, { label: 'Events', value: '3' }, { label: 'Superliked', value: '5' }].map(s => (
            <div key={s.label} className="card p-3 text-center hover:scale-105 hover:shadow-lg hover:shadow-purple-500/10 transition-all cursor-default">
              <p className="font-syne font-bold text-lg grad-text">{s.value}</p>
              <p className="text-gray-600 text-[10px] uppercase font-black tracking-widest">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Settings sections */}
        <div className="space-y-3">
          {/* Account Settings */}
          <div className="card overflow-hidden">
            <button 
              onClick={() => setExpandedSection(expandedSection === 'account' ? null : 'account')}
              className="w-full flex items-center gap-3 px-4 py-4 hover:bg-white/3 transition-all text-left"
            >
              <User className="w-4 h-4 text-purple-400" />
              <span className="text-gray-300 text-sm font-bold flex-1">Account Settings</span>
              <ChevronRight className={`w-4 h-4 text-gray-700 transition-transform ${expandedSection === 'account' ? 'rotate-90' : ''}`} />
            </button>
            
            {expandedSection === 'account' && (
              <div className="px-4 pb-6 pt-2 space-y-4 border-t border-white/5 animate-fade-in">
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-black mb-1.5 block tracking-widest">Display Name</label>
                  <input className="input-dark" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-black mb-1.5 block tracking-widest">University</label>
                  <select 
                    className="input-dark appearance-none" 
                    value={form.campus} 
                    onChange={e => setForm({...form, campus: e.target.value})}
                  >
                    {UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase font-black mb-1.5 block tracking-widest">Course</label>
                    <input className="input-dark" value={form.course} onChange={e => setForm({...form, course: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase font-black mb-1.5 block tracking-widest">Year</label>
                    <input type="number" className="input-dark" value={form.year} onChange={e => setForm({...form, year: parseInt(e.target.value)})} />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-black mb-1.5 block tracking-widest">WhatsApp Number</label>
                  <input className="input-dark" placeholder="e.g. 0712..." value={form.whatsapp_number} onChange={e => setForm({...form, whatsapp_number: e.target.value})} />
                </div>
                <button onClick={save} disabled={saving} className="btn-grad w-full py-3 rounded-xl text-xs font-bold shadow-lg shadow-purple-500/10">
                  {saving ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Save Account Changes'}
                </button>
              </div>
            )}
          </div>

          {/* Privacy Settings */}
          <div className="card overflow-hidden">
            <button 
              onClick={() => setExpandedSection(expandedSection === 'privacy' ? null : 'privacy')}
              className="w-full flex items-center gap-3 px-4 py-4 hover:bg-white/3 transition-all text-left"
            >
              <Lock className="w-4 h-4 text-blue-400" />
              <span className="text-gray-300 text-sm font-bold flex-1">Privacy Settings</span>
              <ChevronRight className={`w-4 h-4 text-gray-700 transition-transform ${expandedSection === 'privacy' ? 'rotate-90' : ''}`} />
            </button>

            {expandedSection === 'privacy' && (
              <div className="px-4 pb-6 pt-2 divide-y divide-white/5 animate-fade-in">
                {[
                  { key: 'showUni', label: 'Show university on profile' },
                  { key: 'showWhatsAppMatches', label: 'Show WhatsApp to matches only' },
                  { key: 'allowDiscovery', label: 'Allow discovery in swiping' },
                  { key: 'showOnline', label: 'Show my online status' }
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between py-4">
                    <span className="text-xs text-gray-400 font-medium">{label}</span>
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
          <button onClick={handleSignOut} className="card w-full flex items-center gap-3 px-4 py-4 hover:bg-red-500/5 transition-all text-left group">
            <LogOut className="w-4 h-4 text-red-500/70 group-hover:text-red-500" />
            <span className="text-red-400/80 group-hover:text-red-500 text-sm font-bold flex-1">Sign Out</span>
          </button>
        </div>

        <div className="text-center mt-10">
          <p className="text-gray-700 text-[10px] font-black uppercase tracking-[0.2em]">TurnUp v2.0</p>
          <p className="text-gray-800 text-[9px] mt-1 italic">Made for the next generation of students</p>
        </div>
      </div>
    </main>
  )
}
