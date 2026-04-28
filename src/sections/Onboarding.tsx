import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ChevronLeft, Loader2, Upload, CheckCircle } from 'lucide-react'
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

export default function Onboarding() {
  const { user, fetchProfile } = useAuthStore()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    name: '', age: '', gender: '', campus: '',
    course: '', year: '1', bio: '',
    looking_for: 'everyone', interests: [] as string[],
    photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop'
  })

  const update = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

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
        photos: [form.photo_url],
        verified: false,
        premium: false,
        premium_until: null,
      }
      const { error } = await supabase.from('profiles').upsert(profileData)
      if (error) throw error
      await fetchProfile(user.id)
      toast.success('Profile created! Welcome to TurnUp 🎉')
      navigate('/discover')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save profile')
    } finally {
      setLoading(false)
    }
  }

  const steps = ['About You', 'Campus Info', 'Your Bio', 'Interests', 'Ready!']

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
            {step === 5 && "You're all set to turn up!"}
          </p>

          {step === 1 && (
            <div className="space-y-4">
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
            {step < 5 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canNext()}
                className="btn-grad flex-1 flex items-center justify-center gap-1.5 text-sm"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={loading}
                className="btn-grad flex-1 flex items-center justify-center gap-2 text-sm"
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
