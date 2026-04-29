import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ChevronLeft, Loader2, Upload, CheckCircle, Camera } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { toast } from 'sonner'

const CAMPUSES = [
  'Mount Kenya University (MKU)', 'JKUAT', 'Kenyatta University', 'Zetech University',
  'KCA University', 'KMTC Thika', 'Thika Technical Training Institute',
  'Imperial Medical Training College', 'Gresta University',
  'Thika School of Medical & Health Sciences', 'Jordan College'
]

const INTERESTS = [
  'Music', 'Dancing', 'Coding', 'Gaming', 'Movies', 'Sports', 'Travel',
  'Photography', 'Food', 'Fashion', 'Art', 'Reading', 'Hiking', 'Coffee',
  'Parties', 'Studying', 'Cars', 'Netflix', 'Gym', 'Finance'
]

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
  })
}

export default function Onboarding() {
  const { user, profile, fetchProfile } = useAuthStore()
  const navigate = useNavigate()

  // If profile already exists, redirect to discover
  if (profile?.name) {
    navigate('/discover')
    return null
  }
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [idUploading, setIdUploading] = useState(false)
  const [idVerified, setIdVerified] = useState<boolean | null>(null)

  const [form, setForm] = useState({
    name: '', age: '', gender: '', campus: '',
    course: '', year: '1', bio: '',
    looking_for: 'everyone', interests: [] as string[],
    vibe: '', weekend_plan: '', relationship_goal: '',
    photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop'
  })

  const update = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setUploading(true)
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

      update('photo_url', publicUrl)
      toast.success('Photo uploaded!')
    } catch (err: any) {
      toast.error('Error uploading photo')
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const handleIDUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setIdUploading(true)
    try {
      // 1. Upload to storage
      const filePath = `${user.id}-studentid.jpg`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // 2. Call verification API
      const base64 = await fileToBase64(file)
      const response = await fetch('/api/verify-student-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64,
          name: form.name,
          campus: form.campus
        })
      })

      if (!response.ok) throw new Error('Verification failed')
      
      const result = await response.json()
      setIdVerified(result.verified)
      
      if (result.verified) {
        toast.success('Identity verified! 🎉')
      } else {
        toast.info('ID uploaded. Under review.')
      }
    } catch (err: any) {
      toast.error('ID verification error')
      console.error(err)
    } finally {
      setIdUploading(false)
    }
  }

  const toggleInterest = (i: string) => {
    setForm(f => ({
      ...f,
      interests: f.interests.includes(i)
        ? f.interests.filter(x => x !== i)
        : f.interests.length < 6 ? [...f.interests, i] : f.interests
    }))
  }

  const canNext = () => {
    if (step === 1) return form.name && form.age && form.gender
    if (step === 2) return form.campus && form.course && form.year
    if (step === 3) return form.bio.length >= 20
    if (step === 4) return form.interests.length >= 3
    if (step === 5) return idVerified !== null
    if (step === 6) return form.vibe !== ''
    if (step === 7) return form.weekend_plan !== ''
    if (step === 8) return form.relationship_goal !== ''
    return true
  }

  const handleFinish = async () => {
    if (!user) return
    setLoading(true)
    try {
      const profileData = {
        id: user.id,
        name: form.name,
        age: parseInt(form.age),
        gender: form.gender,
        campus: form.campus,
        course: form.course,
        year: parseInt(form.year),
        bio: form.bio,
        looking_for: form.looking_for,
        interests: form.interests,
        vibe: form.vibe,
        weekend_plan: form.weekend_plan,
        relationship_goal: form.relationship_goal,
        photos: [form.photo_url],
        verified: !!idVerified,
        premium: false,
        premium_until: null,
      }
      const { error } = await supabase.from('profiles').upsert(profileData)
      if (error) throw error
      await fetchProfile(user.id)
      toast.success('Profile created! Welcome to TurnUp 🎉')
      window.location.href = '/discover'
    } catch (err: any) {
      toast.error(err.message || 'Failed to save profile')
    } finally {
      setLoading(false)
    }
  }

  const steps = ['About You', 'Campus Info', 'Your Bio', 'Interests', 'Verify Identity', 'Your Vibe', 'Weekend Plans', 'Looking for', 'Ready!']

  return (
    <main className="min-h-screen pt-14 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i + 1 < step ? 'grad-bg text-white' : i + 1 === step ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50' : 'bg-white/5 text-gray-600'
              }`}>
                {i + 1 < step ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 ${i + 1 < step ? 'bg-purple-500' : 'bg-white/8'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="card p-6 animate-fade-in">
          <h2 className="font-syne font-bold text-xl text-white mb-1">{steps[step - 1]}</h2>
          <p className="text-gray-500 text-sm mb-6">
            {step === 1 && 'Tell us a bit about yourself'}
            {step === 2 && 'Where do you study?'}
            {step === 3 && 'Write a bio that shows your vibe'}
            {step === 4 && 'Pick up to 6 interests'}
            {step === 5 && "We need to verify you're a student"}
            {step === 6 && 'What defines your campus energy?'}
            {step === 7 && 'Friday night arrives. What are you doing?'}
            {step === 8 && 'What are you hoping to find on TurnUp?'}
            {step === 9 && "You're all set to turn up!"}
          </p>

          {step === 1 && (
            <div className="space-y-4">
              <div className="flex flex-col items-center mb-4">
                <label className="relative cursor-pointer group">
                  <div className="w-24 h-24 rounded-full border-2 border-purple-500/30 overflow-hidden bg-white/5 flex items-center justify-center transition-all group-hover:border-purple-500/60">
                    {uploading ? (
                      <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                    ) : form.photo_url ? (
                      <img src={form.photo_url} className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-8 h-8 text-gray-600" />
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0 p-1.5 rounded-full grad-bg text-white shadow-lg">
                    <Upload className="w-3.5 h-3.5" />
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} />
                </label>
                <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-wider font-bold">Select Photo</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Full Name</label>
                <input className="input-dark" placeholder="Your name" value={form.name} onChange={e => update('name', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Age</label>
                <input className="input-dark" type="number" min="18" max="30" placeholder="18" value={form.age} onChange={e => update('age', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Gender</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Male', 'Female', 'Other'].map(g => (
                    <button key={g} onClick={() => update('gender', g.toLowerCase())} className={`py-2.5 rounded-xl text-sm transition-all ${form.gender === g.toLowerCase() ? 'grad-bg text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>{g}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Looking for</label>
                <div className="grid grid-cols-3 gap-2">
                  {['men', 'women', 'everyone'].map(g => (
                    <button key={g} onClick={() => update('looking_for', g)} className={`py-2.5 rounded-xl text-sm capitalize transition-all ${form.looking_for === g ? 'grad-bg text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>{g}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Campus</label>
                <select className="input-dark" value={form.campus} onChange={e => update('campus', e.target.value)}>
                  <option value="">Select campus...</option>
                  {CAMPUSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Course</label>
                <input className="input-dark" placeholder="e.g. Computer Science" value={form.course} onChange={e => update('course', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Year of Study</label>
                <div className="grid grid-cols-4 gap-2">
                  {['1', '2', '3', '4'].map(y => (
                    <button key={y} onClick={() => update('year', y)} className={`py-2.5 rounded-xl text-sm transition-all ${form.year === y ? 'grad-bg text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>Year {y}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Bio <span className="text-gray-700">({form.bio.length}/200)</span></label>
                <textarea
                  className="input-dark resize-none"
                  rows={4}
                  placeholder="Tell people what you're about. Weekend plans? Study habits? Vibes only..."
                  value={form.bio}
                  maxLength={200}
                  onChange={e => update('bio', e.target.value)}
                />
              </div>
              <div className="p-3 rounded-xl bg-purple-500/8 border border-purple-500/15">
                <p className="text-xs text-purple-300">💡 Tip: Be specific! "JKUAT CS nerd who loves Friday nyama choma runs" gets 3x more matches than "I like fun"</p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map(i => (
                  <button
                    key={i}
                    onClick={() => toggleInterest(i)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      form.interests.includes(i) ? 'grad-bg text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-3">{form.interests.length}/6 selected</p>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <label className="block w-full cursor-pointer">
                <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 transition-all">
                  {idUploading ? (
                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                  ) : idVerified === true ? (
                    <div className="flex flex-col items-center text-green-400">
                      <CheckCircle className="w-8 h-8 mb-2" />
                      <span className="text-sm font-bold">Verified Successfully</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-500 mb-2" />
                      <span className="text-sm text-gray-400">Upload Student ID Photo</span>
                      <span className="text-[10px] text-gray-600 mt-1">Clear photo showing name & campus</span>
                    </>
                  )}
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleIDUpload} disabled={idUploading || idVerified === true} />
              </label>
              {idVerified === false && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <p className="text-xs text-amber-500">
                    Identity verification is under review. You can still continue, but your "Verified" badge will appear once approved.
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {['🎉 Party Animal', '📚 Study Buddy', '🏋️ Gym Rat', '🎵 Music Head', '🍔 Foodie', '🎮 Gamer'].map(v => (
                  <button
                    key={v}
                    onClick={() => update('vibe', v)}
                    className={`py-4 px-3 rounded-xl text-sm transition-all border ${
                      form.vibe === v 
                        ? 'border-purple-500 grad-bg text-white' 
                        : 'border-white/5 bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-3">
              {['Clubbing 🥂', 'House party 🏠', 'Netflix & chill 🛋️', 'Nyama choma 🍖', 'Still deciding 😂'].map(w => (
                <button
                  key={w}
                  onClick={() => update('weekend_plan', w)}
                  className={`w-full py-3.5 px-4 rounded-xl text-left text-sm transition-all border ${
                    form.weekend_plan === w
                      ? 'border-purple-500 grad-bg text-white'
                      : 'border-white/5 bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          )}

          {step === 8 && (
            <div className="space-y-3">
              {['Something serious 💍', 'Just vibing 😎', 'Study partner 📖', 'Weekend plans only 🗓️', 'New friends 👥', 'Smoking weed & feeling the buzz 💨'].map(r => (
                <button
                  key={r}
                  onClick={() => update('relationship_goal', r)}
                  className={`w-full py-3.5 px-4 rounded-xl text-left text-sm transition-all border ${
                    form.relationship_goal === r
                      ? 'border-purple-500 grad-bg text-white'
                      : 'border-white/5 bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}

          {step === 9 && (
            <div className="text-center py-4">
              <div className="w-20 h-20 rounded-full grad-bg flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-white font-syne font-bold text-xl mb-2">You're ready, {form.name}!</h3>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                Your profile is set up. Start discovering students across Thika Road campuses and plan your next weekend!
              </p>
              <div className="space-y-2 text-left">
                {[
                  `📍 ${form.campus}`,
                  `📚 ${form.course}, Year ${form.year}`,
                  `🎯 ${form.interests.slice(0, 3).join(' · ')}`,
                  `✨ ${form.vibe}`,
                ].map(t => (
                  <div key={t} className="px-4 py-2 rounded-xl bg-white/5 text-sm text-gray-300">{t}</div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-white/5 transition-all">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            {step < 9 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canNext()}
                className="btn-grad flex-1 flex items-center justify-center gap-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={loading}
                className="btn-grad flex-1 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Start Discovering 🔥
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
