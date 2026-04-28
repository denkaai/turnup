import { useState } from 'react'
import { Camera, Edit2, Shield, Crown, LogOut, ChevronRight, CheckCircle, Star, Zap, MapPin, BookOpen, Save, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useNavigate, Link } from 'react-router-dom'

export default function Profile() {
  const { user, profile, fetchProfile, signOut } = useAuthStore()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    bio: profile?.bio || '',
    course: profile?.course || '',
    interests: profile?.interests || [],
  })

  const INTERESTS = ['Music', 'Dancing', 'Coding', 'Gaming', 'Movies', 'Sports', 'Travel', 'Photography', 'Food', 'Fashion', 'Art', 'Reading', 'Hiking', 'Coffee', 'Parties', 'Studying', 'Cars', 'Netflix', 'Gym', 'Finance']

  const toggleInterest = (i: string) => {
    setForm(f => ({
      ...f,
      interests: f.interests.includes(i) ? f.interests.filter(x => x !== i) : f.interests.length < 6 ? [...f.interests, i] : f.interests
    }))
  }

  const save = async () => {
    if (!user) return
    setSaving(true)
    const { error } = await supabase.from('profiles').update({ bio: form.bio, course: form.course, interests: form.interests }).eq('id', user.id)
    if (error) toast.error('Failed to save')
    else {
      await fetchProfile(user.id)
      toast.success('Profile updated!')
      setEditing(false)
    }
    setSaving(false)
  }

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out!')
    navigate('/')
  }

  if (!profile) return null

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
              className="w-24 h-24 rounded-full object-cover border-2 border-purple-500/30"
            />
            {editing && (
              <button className="absolute bottom-0 right-0 w-7 h-7 grad-bg rounded-full flex items-center justify-center">
                <Camera className="w-3.5 h-3.5 text-white" />
              </button>
            )}
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
          {profile.verified ? (
            <span className="verified-badge"><Shield className="w-3 h-3" /> Student Verified</span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs bg-yellow-500/10 border border-yellow-500/20 text-yellow-500">⚠ Verification Pending</span>
          )}
                    {profile.premium && (
            <span className="px-3 py-1 rounded-full text-xs bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center gap-1">
              <Crown className="w-3 h-3" /> Premium
            </span>
          )}
        </div>

        {/* Bio */}
        <div className="card p-4 mb-4">
          <h3 className="text-xs text-gray-500 mb-2">Bio</h3>
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
          <h3 className="text-xs text-gray-500 mb-3">Interests</h3>
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
          <button onClick={save} disabled={saving} className="btn-grad w-full flex items-center justify-center gap-2 text-sm mb-4">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[{ label: 'Matches', value: '12' }, { label: 'Events', value: '3' }, { label: 'Superliked', value: '5' }].map(s => (
            <div key={s.label} className="card p-3 text-center">
              <p className="font-syne font-bold text-lg grad-text">{s.value}</p>
              <p className="text-gray-600 text-xs">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Settings links */}
        <div className="card divide-y divide-white/5">
          {[
            { label: 'Account Settings', icon: Shield },
            { label: 'Privacy Settings', icon: Star },
          ].map(({ label, icon: Icon, href }: { label: string; icon: any; href?: string }) => (
            href ? (
              <Link key={label} to={href} className="flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-all">
                <Icon className="w-4 h-4 text-gray-500" />
                <span className="text-gray-300 text-sm flex-1">{label}</span>
                <ChevronRight className="w-4 h-4 text-gray-700" />
              </Link>
            ) : (
              <button key={label} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-all text-left">
                <Icon className="w-4 h-4 text-gray-500" />
                <span className="text-gray-300 text-sm flex-1">{label}</span>
                <ChevronRight className="w-4 h-4 text-gray-700" />
              </button>
            )
          ))}
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/5 transition-all text-left">
            <LogOut className="w-4 h-4 text-red-500/70" />
            <span className="text-red-400/80 text-sm">Sign Out</span>
          </button>
        </div>

        <p className="text-center text-gray-700 text-xs mt-6">TurnUp v1.0 · Made for campus students</p>
      </div>
    </main>
  )
}
