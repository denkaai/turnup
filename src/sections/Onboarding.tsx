import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ChevronLeft, Loader2, Upload, CheckCircle, Camera, X, AlertCircle, Info, Image as ImageIcon, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { toast } from 'sonner'
import { handleSupabaseError, safeProfileUpsert } from '@/lib/safe-supabase'

import { CAMPUSES } from '@/lib/constants'

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
  const [step, setStep] = useState(1)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const s = params.get('step')
    if (s) {
      setStep(parseInt(s))
    }
  }, [])

  // If profile is fully verified and onboarding complete, redirect to discover
  if (profile?.onboarding_completed) {
    navigate('/discover')
    return null
  }
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)


  const [form, setForm] = useState({
    name: '', age: '', gender: '', campus: '',
    course: '', year: '1', bio: '',
    looking_for: 'everyone', interests: [] as string[],
    vibe: '', weekend_plan: '', relationship_goal: '',
    photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop',
    whatsapp_number: ''
  })

  const [campusSearch, setCampusSearch] = useState('')
  const [showCampusDropdown, setShowCampusDropdown] = useState(false)
  const filteredCampuses = CAMPUSES.filter(c => c.toLowerCase().includes(campusSearch.toLowerCase()))

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        age: profile.age?.toString() || '',
        gender: profile.gender || '',
        campus: profile.campus || '',
        course: profile.course || '',
        year: profile.year?.toString() || '1',
        bio: profile.bio || '',
        looking_for: profile.looking_for || 'everyone',
        interests: profile.interests || [],
        vibe: profile.vibe || '',
        weekend_plan: profile.weekend_plan || '',
        relationship_goal: profile.relationship_goal || '',
        photo_url: profile.photos?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop',
        whatsapp_number: profile.whatsapp_number || ''
      })
    }
  }, [profile])

  // BUG 3: Fetch real values directly from Supabase on mount
  useEffect(() => {
    const loadRealValues = async () => {
      if (!user) return
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('name, campus, course, year, vibe')
          .eq('id', user.id)
          .single()
        
        if (data && !error) {
          setForm(f => ({
            ...f,
            name: data.name || f.name,
            campus: data.campus || f.campus,
            course: data.course || f.course,
            year: data.year?.toString() || f.year,
            vibe: data.vibe || f.vibe
          }))
        }
      } catch (err) {
        console.error('Error loading real profile values:', err)
      }
    }
    loadRealValues()
  }, [user])

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

      if (uploadError) {
        handleSupabaseError(uploadError)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      update('photo_url', publicUrl)
      toast.success('Photo uploaded!')
    } catch (err: any) {
      console.error(err)
    } finally {
      setUploading(false)
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
    if (step === 5) return form.vibe !== ''
    if (step === 6) return form.weekend_plan !== ''
    if (step === 7) return form.relationship_goal !== ''
    return true
  }

  const handleFinish = async () => {
    if (!user) return
    
    // BUG 1: Remove spinner immediately and navigate non-blocking
    setLoading(false)
    navigate('/discover')

    // BUG 4 Safety Fallback (from previous fix) - still useful but now in background
    const safetyTimeout = setTimeout(() => {
      console.warn('Onboarding background save timed out')
    }, 5000)

    try {
      const profileData = {
        id: user.id,
        name: form.name,
        age: parseInt(form.age) || 18,
        gender: form.gender,
        campus: form.campus,
        course: form.course,
        year: parseInt(form.year) || 1,
        bio: form.bio,
        looking_for: form.looking_for,
        interests: form.interests,
        vibe: form.vibe,
        weekend_plan: form.weekend_plan,
        relationship_goal: form.relationship_goal,
        whatsapp_number: form.whatsapp_number,
        photos: [form.photo_url],
        verified: true,
        onboarding_completed: true,
        premium: false,
        premium_until: null,
      }
      
      // Perform save in background
      safeProfileUpsert(profileData).then((success) => {
        clearTimeout(safetyTimeout)
        if (success) {
          fetchProfile(user.id)
        }
      })
    } catch (err: any) {
      clearTimeout(safetyTimeout)
      console.error('Onboarding background save error:', err)
    }
  }

  const steps = ['About You', 'Campus Info', 'Your Bio', 'Interests', 'Introvert Mode', 'Weekend Plans', 'Looking for', 'Ready!']

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#080810]">
      <div className="w-full max-w-md">
        {/* Progress Bar V3 */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400">Step {step} of {steps.length}</span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400">{Math.round((step / steps.length) * 100)}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
            <div 
              className="h-full grad-bg transition-all duration-500 ease-out shadow-[0_0_15px_rgba(168,85,247,0.5)]" 
              style={{ width: `${(step / steps.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-[#0F0F1A]/80 backdrop-blur-[20px] border border-white/10 p-6 rounded-[32px] animate-fade-in relative overflow-hidden shadow-2xl">
          {/* Glossy accent */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          {/* Header */}
          <div className="mb-6">
            <h2 className={`font-syne font-black text-white mb-1 leading-tight ${step === 5 ? 'text-3xl sm:text-4xl' : 'text-2xl'}`}>
              {step === 5 ? "What's your vibe this weekend? 🔥" : steps[step - 1]}
            </h2>
            <p className="text-gray-500 text-sm font-medium">
              {step === 1 && 'Tell us a bit about yourself'}
              {step === 2 && 'Where do you study?'}
              {step === 3 && 'Write a bio that shows your vibe'}
              {step === 4 && 'Pick up to 6 interests'}
              {step === 5 && "We'll match you with your people"}
              {step === 6 && 'Friday night arrives. What are you doing?'}
              {step === 7 && 'What are you hoping to find on TurnUp?'}
              {step === 8 && "You're all set to turn up!"}
            </p>
          </div>

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
                <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-wider font-black">Select Photo</p>
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Full Name</label>
                <input className="input-dark" placeholder="Your name" value={form.name} onChange={e => update('name', e.target.value)} />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Age</label>
                <input className="input-dark" type="number" min="18" max="30" placeholder="18" value={form.age} onChange={e => update('age', e.target.value)} />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Gender</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Male', 'Female', 'Other'].map(g => (
                    <button key={g} onClick={() => update('gender', g.toLowerCase())} className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${form.gender === g.toLowerCase() ? 'grad-bg text-white shadow-lg shadow-purple-500/20' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}>{g}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5">WhatsApp Number</label>
                <input className="input-dark" placeholder="e.g. 0712345678" value={form.whatsapp_number} onChange={e => update('whatsapp_number', e.target.value)} />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Looking for</label>
                <div className="grid grid-cols-3 gap-2">
                  {['men', 'women', 'everyone'].map(g => (
                    <button key={g} onClick={() => update('looking_for', g)} className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${form.looking_for === g ? 'grad-bg text-white shadow-lg shadow-purple-500/20' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}>{g}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Campus</label>
                <div className="relative">
                  <div 
                    className="input-dark flex items-center justify-between cursor-pointer"
                    onClick={() => setShowCampusDropdown(!showCampusDropdown)}
                  >
                    <span className={form.campus ? 'text-white' : 'text-gray-500'}>
                      {form.campus || 'Search your campus...'}
                    </span>
                    <ChevronLeft className={`w-4 h-4 transition-transform ${showCampusDropdown ? 'rotate-90' : '-rotate-90'}`} />
                  </div>

                  {showCampusDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#161625] border border-white/10 rounded-2xl shadow-2xl z-[100] max-h-60 overflow-y-auto p-2 animate-in fade-in slide-in-from-top-2">
                      <div className="sticky top-0 bg-[#161625] pb-2 mb-2 border-b border-white/5">
                        <input 
                          autoFocus
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                          placeholder="Type to filter..."
                          value={campusSearch}
                          onChange={e => setCampusSearch(e.target.value)}
                          onClick={e => e.stopPropagation()}
                        />
                      </div>
                      <div className="space-y-1">
                        {filteredCampuses.map(c => (
                          <button
                            key={c}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all ${form.campus === c ? 'bg-purple-500 text-white' : 'text-gray-400 hover:bg-white/5'}`}
                            onClick={() => {
                              update('campus', c)
                              setShowCampusDropdown(false)
                              setCampusSearch('')
                            }}
                          >
                            {c}
                          </button>
                        ))}
                        {filteredCampuses.length === 0 && (
                          <div className="py-8 text-center text-gray-500 text-xs italic">No campus found matching "{campusSearch}"</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Course</label>
                <input className="input-dark" placeholder="e.g. Computer Science" value={form.course} onChange={e => update('course', e.target.value)} />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Year of Study</label>
                <div className="grid grid-cols-4 gap-2">
                  {['1', '2', '3', '4'].map(y => (
                    <button key={y} onClick={() => update('year', y)} className={`py-2.5 rounded-xl text-xs font-black transition-all ${form.year === y ? 'grad-bg text-white shadow-lg shadow-purple-500/20' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>Yr {y}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Bio <span className="text-gray-700">({form.bio.length}/200)</span></label>
                <textarea
                  className="input-dark resize-none h-32"
                  placeholder="Tell people what you're about. Weekend plans? Study habits? Vibes only..."
                  value={form.bio}
                  maxLength={200}
                  onChange={e => update('bio', e.target.value)}
                />
              </div>
              <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10 flex gap-3">
                <Info className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-purple-200/70 leading-relaxed font-medium">💡 Tip: Be specific! "JKUAT CS nerd who loves Friday nyama choma runs" gets 3x more matches than "I like fun"</p>
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
                    className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                      form.interests.includes(i) ? 'grad-bg text-white shadow-lg shadow-purple-500/20' : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mt-6">{form.interests.length}/6 selected</p>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {[
                  { id: 'Turn Up 🎉', sub: 'CLUBS, PARTIES, LOUD MUSIC — NIKO TAYARI', gradient: 'from-purple-600 to-pink-600', glow: 'rgba(219,39,119,0.6)', emoji: '🎉' },
                  { id: 'Lowkey Hangout 🍗', sub: 'NYAMA CHOMA, GOOD PEOPLE, CHILL VIBES', gradient: 'from-orange-600 to-amber-600', glow: 'rgba(245,158,11,0.6)', emoji: '🍗' },
                  { id: 'Squad Goals 👥', sub: 'ROAD TRIPS, ADVENTURES, MY DAY ONES', gradient: 'from-blue-700 to-cyan-500', glow: 'rgba(6,182,212,0.6)', emoji: '👥' },
                  { id: 'Home Vibes 🛋️', sub: 'SERIES, SNACKS, RECHARGE MODE — INTROVERT SZN', gradient: 'from-green-700 to-emerald-500', glow: 'rgba(16,185,129,0.6)', emoji: '🛋️' }
                ].map(v => (
                  <button
                    key={v.id}
                    onClick={() => update('vibe', v.id)}
                    className={`group relative py-8 px-6 rounded-[2rem] text-left transition-all border-2 overflow-hidden hover:scale-[1.03] active:scale-[0.97] flex flex-col justify-end min-h-[140px] shadow-xl ${
                      form.vibe === v.id 
                        ? `border-white/40 bg-gradient-to-br ${v.gradient}` 
                        : 'border-white/5 bg-white/[0.03] text-gray-400 hover:bg-white/5 hover:border-white/10'
                    }`}
                    style={{
                      boxShadow: form.vibe === v.id ? `0 20px 40px -10px ${v.glow}` : ''
                    }}
                  >
                    <div className={`absolute top-6 right-6 text-4xl transition-all duration-300 ${form.vibe === v.id ? 'scale-125 rotate-12 opacity-100' : 'opacity-20 group-hover:opacity-40 group-hover:scale-110'}`}>
                      {v.emoji}
                    </div>

                    <div className="relative z-10">
                      <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 transition-colors ${form.vibe === v.id ? 'text-white/80' : 'text-gray-500'}`}>{v.sub}</p>
                      <p className={`font-syne font-black text-2xl sm:text-3xl transition-colors leading-none ${form.vibe === v.id ? 'text-white' : 'text-gray-300'}`}>{v.id}</p>
                    </div>
                    
                    {form.vibe === v.id && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                        <CheckCircle className="w-24 h-24 text-white/10 animate-ping" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-3">
              {['Clubbing 🥂', 'House party 🏠', 'Netflix & chill 🛋️', 'Nyama choma 🍖', 'Still deciding 😂'].map(w => (
                <button
                  key={w}
                  onClick={() => update('weekend_plan', w)}
                  className={`w-full py-4 px-5 rounded-2xl text-left text-sm font-bold transition-all border-2 ${
                    form.weekend_plan === w
                      ? 'border-purple-500 grad-bg text-white shadow-xl shadow-purple-500/20'
                      : 'border-white/5 bg-white/5 text-gray-400 hover:bg-white/8 hover:border-white/10'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          )}

          {step === 7 && (
            <div className="space-y-3">
              {['Something serious 💍', 'Just vibing 😎', 'Study partner 📖', 'Weekend plans only 🗓️', 'New friends 👥', 'Smoking weed & feeling the buzz 💨'].map(r => (
                <button
                  key={r}
                  onClick={() => update('relationship_goal', r)}
                  className={`w-full py-4 px-5 rounded-2xl text-left text-sm font-bold transition-all border-2 ${
                    form.relationship_goal === r
                      ? 'border-purple-500 grad-bg text-white shadow-xl shadow-purple-500/20'
                      : 'border-white/5 bg-white/5 text-gray-400 hover:bg-white/8 hover:border-white/10'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}

          {step === 8 && (
            <div className="text-center py-6">
              <div className="w-24 h-24 rounded-full grad-bg flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-purple-500/30">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-white font-syne font-black text-2xl mb-2 leading-tight">
                You're ready, {form.name || profile?.name || user?.user_metadata?.full_name || 'Student'}!
              </h3>
              <p className="text-gray-400 text-sm mb-8 leading-relaxed font-medium px-4">
                Your profile is set up. Start discovering students across Thika Road campuses and plan your next weekend!
              </p>
              <div className="space-y-2.5 text-left">
                {[
                  { label: 'Campus', val: form.campus || profile?.campus || 'Your Campus', icon: MapPin },
                  { label: 'Study', val: `${form.course || profile?.course || 'Your Course'}, Year ${form.year || profile?.year || '1'}`, icon: BookOpen },
                  { label: 'Vibe', val: form.vibe || profile?.vibe || 'Ready to TurnUp', icon: Flame },
                ].map((t, idx) => (
                  <div key={idx} className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/5 border border-white/5">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <t.icon className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 leading-none mb-1">{t.label}</p>
                      <p className="text-sm font-bold text-white leading-none">{t.val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 mt-8">
            {step < 8 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canNext()}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] text-white text-sm font-black uppercase tracking-[0.2em] disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all active:scale-[0.96] flex items-center justify-center gap-2"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] text-white text-sm font-black uppercase tracking-[0.2em] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all active:scale-[0.96] flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Start Discovering 🔥
              </button>
            )}
            
            {step > 1 && (
              <button 
                onClick={() => setStep(s => s - 1)} 
                className="w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-1.5"
              >
                <ChevronLeft className="w-3 h-3" /> Go Back
              </button>
            )}
          </div>
        </div>
      </div>


    </main>
  )
}


// Helper icons not imported
const MapPin = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
const BookOpen = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
const Flame = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
