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
      toast.error("Complete your identity verification to access TurnUp Campus 🔐", {
        id: 'verification-gate'
      })
    }
  }, [])

  // If profile is fully verified and onboarding complete, redirect to discover
  if (profile?.onboarding_completed && profile?.identity_verified && profile?.id_verification_status === 'approved') {
    navigate('/discover')
    return null
  }
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [idUploading, setIdUploading] = useState(false)
  const [idVerified, setIdVerified] = useState<boolean | null>(
    profile?.id_verification_status === 'pending' || profile?.id_verification_status === 'approved' ? true : null
  )
  
  // ID Verification states
  const [idFrontPreview, setIdFrontPreview] = useState<string | null>(null)
  const [idBackPreview, setIdBackPreview] = useState<string | null>(null)
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null)
  const [idBackFile, setIdBackFile] = useState<File | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scanningSide, setScanningSide] = useState<'front' | 'back'>('front')
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [lostIdExpanded, setLostIdExpanded] = useState(false)
  const [idError, setIdError] = useState<string | null>(null)
  const [isAutoCapturing, setIsAutoCapturing] = useState(false)
  const [isCameraBlocked, setIsCameraBlocked] = useState(false)
  const [idUploadedSuccessfully, setIdUploadedSuccessfully] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationProgress, setVerificationProgress] = useState(0)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const autoCaptureTimeout = useRef<any>(null)

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

  // Section C: AI Validation (Simulated client-side)
  const validateID = (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp']
      if (!validTypes.includes(file.type)) {
        resolve("Please upload a clear photo of your student ID (JPG, PNG, or WEBP only)")
        return
      }

      // 50KB to 15MB
      if (file.size > 15 * 1024 * 1024) { 
        resolve("File too large (Max 15MB). Please upload a smaller photo.")
        return 
      }
      if (file.size < 50 * 1024) { 
        resolve("Please upload a clear photo of your student ID (too small or blurry)")
        return 
      }

      resolve(null)
    })
  }

  const handleIDSelect = async (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setIdError(null)
    const error = await validateID(file)
    if (error) {
      setIdError(error)
      toast.error(error)
      return
    }

    setIsVerifying(true)
    setVerificationProgress(0)

    try {
      const fileExt = 'jpg'
      const filePath = `${user.id}/student-id-${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('student-ids')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('student-ids')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase.from('profiles').update({ 
        identity_verified: true,
        id_verified: true,
        student_id_url: publicUrl,
        id_verification_status: 'approved',
        onboarding_completed: true
      } as any).eq('id', user.id)

      if (updateError) throw updateError
      
      setIdUploadedSuccessfully(true)
      setIsVerifying(false)
      
      setTimeout(async () => {
        await fetchProfile(user.id)
        setStep(s => s + 1)
      }, 1500)
    } catch (err) {
      console.error('Upload failed:', err)
      toast.error("Upload failed. Please try again.")
      setIsVerifying(false)
    }
  }

  const startScanning = async (side: 'front' | 'back') => {
    if (failedAttempts >= 3) return
    
    // BUG 2: Check for mediaDevices support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsCameraBlocked(true)
      toast.error("Camera access unavailable. Use Upload from Gallery instead.")
      return
    }

    setScanningSide(side)
    setIsScanning(true)
    setIsAutoCapturing(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        
        // Start auto-capture countdown after 2 seconds of "holding steady"
        autoCaptureTimeout.current = setTimeout(() => {
          setIsAutoCapturing(true)
          setTimeout(() => {
            captureFrame()
          }, 1500)
        }, 2000)
      }
    } catch (err) {
      setIsCameraBlocked(true)
      setIsScanning(false)
      toast.error("Camera access denied. Please upload from gallery.")
    }
  }

  // Detect iOS Safari or Brave
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    const isBrave = (navigator as any).brave !== undefined
    
    if ((isIOS && isSafari) || isBrave) {
      setIsCameraBlocked(true)
    }
  }, [])

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current || !user) return
    const context = canvasRef.current.getContext('2d')
    if (!context) return

    canvasRef.current.width = videoRef.current.videoWidth
    canvasRef.current.height = videoRef.current.videoHeight
    context.drawImage(videoRef.current, 0, 0)
    
    canvasRef.current.toBlob(async (blob) => {
      if (!blob) return
      const file = new File([blob], `scan-${scanningSide}.jpg`, { type: 'image/jpeg' })
      
      const error = await validateID(file)
      if (error) {
        toast.error(error)
        stopScanning()
        return
      }

      setIsVerifying(true)
      stopScanning()

      try {
        const filePath = `${user.id}/student-id-${Date.now()}.jpg`
        
        const { error: uploadError } = await supabase.storage
          .from('student-ids')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('student-ids')
          .getPublicUrl(filePath)

        const { error: updateError } = await supabase.from('profiles').update({ 
          identity_verified: true,
          id_verified: true,
          student_id_url: publicUrl,
          id_verification_status: 'approved',
          onboarding_completed: true
        } as any).eq('id', user.id)

        if (updateError) throw updateError

        setIdUploadedSuccessfully(true)
        setIsVerifying(false)

        setTimeout(async () => {
          await fetchProfile(user.id)
          setStep(s => s + 1)
        }, 1500)
      } catch (err) {
        console.error('Upload failed:', err)
        toast.error("Upload failed. Please try again.")
        setIsVerifying(false)
      }
    }, 'image/jpeg')
  }

  const stopScanning = () => {
    if (autoCaptureTimeout.current) clearTimeout(autoCaptureTimeout.current)
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
    }
    setIsScanning(false)
    setIsAutoCapturing(false)
  }

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
    if (step === 5) return idVerified === true && failedAttempts < 3
    if (step === 6) return form.vibe !== ''
    if (step === 7) return form.weekend_plan !== ''
    if (step === 8) return form.relationship_goal !== ''
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
        identity_verified: true,
        id_verification_status: 'approved',
        id_image_url: profile?.id_image_url || null,
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

  const steps = ['About You', 'Campus Info', 'Your Bio', 'Interests', 'Verify Identity', 'Introvert Mode', 'Weekend Plans', 'Looking for', 'Ready!']

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
            <h2 className={`font-syne font-black text-white mb-1 leading-tight ${step === 6 ? 'text-3xl sm:text-4xl' : 'text-2xl'}`}>
              {step === 6 ? "What's your vibe this weekend? 🔥" : steps[step - 1]}
            </h2>
            <p className="text-gray-500 text-sm font-medium">
              {step === 1 && 'Tell us a bit about yourself'}
              {step === 2 && 'Where do you study?'}
              {step === 3 && 'Write a bio that shows your vibe'}
              {step === 4 && 'Pick up to 6 interests'}
              {step === 5 && "We need to verify you're a student"}
              {step === 6 && "We'll match you with your people"}
              {step === 7 && 'Friday night arrives. What are you doing?'}
              {step === 8 && 'What are you hoping to find on TurnUp?'}
              {step === 9 && "You're all set to turn up!"}
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
            <div className="space-y-6">
              {/* Security Block Check (Section E) */}
              {failedAttempts >= 3 ? (
                <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-center space-y-4 animate-fade-in">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                  <div className="space-y-2">
                    <h3 className="text-white font-black text-lg uppercase tracking-tight">Verification Blocked 🚫</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      Too many failed attempts. Please contact support at <br/>
                      <span className="text-red-400 font-bold">support@turnupcampus.com</span>
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Visual Guide (Section D) */}
                  <div className="space-y-4">
                    <h3 className="text-white font-black text-base flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-purple-400" /> Upload Your Student ID 📸
                    </h3>
                    
                    {/* Card Outline Diagram */}
                    <div className="w-full aspect-[1.586/1] rounded-2xl border-2 border-white/5 bg-white/[0.02] flex items-center justify-center relative overflow-hidden group">
                      <div className="absolute inset-4 border border-dashed border-purple-500/30 rounded-xl flex items-center justify-center">
                         <div className="text-center space-y-2">
                            <div className="w-12 h-1 rounded-full bg-purple-500/20 mx-auto" />
                            <div className="w-20 h-1 rounded-full bg-purple-500/10 mx-auto" />
                            <div className="w-16 h-1 rounded-full bg-purple-500/20 mx-auto" />
                         </div>
                      </div>
                      <div className="absolute top-8 left-8 w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20" />
                    </div>

                    <div className="grid grid-cols-1 gap-2 text-[10px] font-bold uppercase tracking-tight text-gray-500">
                      <p className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500" /> Must show: Name, Institution, Adm Number</p>
                      <p className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500" /> Place ID on a flat dark surface</p>
                      <p className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500" /> Avoid glare, shadows, blurry shots</p>
                    </div>
                  </div>

                  {/* Success UI */}
                  {idUploadedSuccessfully ? (
                    <div className="text-center py-8 animate-fade-in">
                      <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <CheckCircle className="text-green-400" size={40} />
                      </div>
                      <h3 className="text-white font-bold text-xl mb-2">
                        ID Uploaded! ✅
                      </h3>
                      <p className="text-gray-400 text-sm">
                        Redirecting you in...
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Front of ID */}
                      <div className="space-y-2">
                        {isCameraBlocked && (
                          <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 flex gap-2 animate-fade-in mb-2">
                            <Camera className="w-4 h-4 text-orange-400 flex-shrink-0" />
                            <p className="text-[10px] text-orange-200/80 font-bold">📷 Camera blocked? Upload from gallery instead.</p>
                          </div>
                        )}

                        <div className="flex flex-col gap-3">
                          {/* Gallery Upload */}
                          <label className={`flex items-center justify-center gap-3 p-5 rounded-2xl border-2 border-dashed cursor-pointer transition-all border-purple-500/30 bg-purple-500/5 hover:border-purple-500 hover:bg-purple-500/10 shadow-lg shadow-purple-500/10`}>
                            <Upload className="text-purple-400 w-6 h-6" />
                            <div className="text-left">
                              <span className="block text-xs font-black uppercase tracking-widest text-white">Upload from Gallery</span>
                              <span className="block text-[9px] text-gray-500 font-bold uppercase">Fastest way to verify ⚡</span>
                            </div>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleIDSelect(e, 'front')} />
                          </label>

                          {/* Camera Button */}
                          <button 
                            onClick={() => startScanning('front')}
                            className="flex items-center justify-center gap-3 p-4 rounded-2xl border-2 border-dashed border-white/10 bg-white/5 hover:bg-white/8 transition-all"
                          >
                            <Camera className="text-gray-400 w-5 h-5" />
                            <div className="text-left">
                              <span className="block text-[10px] font-black uppercase tracking-tight text-gray-400">Scan with Camera</span>
                              <span className="block text-[8px] text-gray-600 font-bold">Open in Chrome for best experience</span>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Uploading Progress */}
                      {isVerifying && (
                        <div className="p-5 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-3 animate-fade-in">
                          <div className="flex items-center gap-2 text-xs text-purple-200 font-black uppercase tracking-widest">
                            <Loader2 className="w-4 h-4 animate-spin" /> Uploading ID...
                          </div>
                          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full grad-bg animate-pulse w-full" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Lost ID Policy (Section F) */}
                  <div className="pt-2">
                    <button 
                      onClick={() => setLostIdExpanded(!lostIdExpanded)}
                      className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-purple-400 hover:text-purple-300 transition-all"
                    >
                      Lost your ID or don't have it yet? {lostIdExpanded ? '👆' : '👇'}
                    </button>
                    {lostIdExpanded && (
                      <div className="mt-3 p-4 rounded-xl bg-purple-500/5 border border-purple-500/10 space-y-3 animate-fade-in">
                        <p className="text-[10px] font-black uppercase tracking-widest text-purple-300">You can upload any ONE of these instead:</p>
                        <div className="space-y-2 text-xs text-purple-200/70 font-medium">
                          <p className="flex items-center gap-2">✓ Admission letter from your institution</p>
                          <p className="flex items-center gap-2">✓ Fee statement with your name and school</p>
                          <p className="flex items-center gap-2">✓ Student portal screenshot with your details</p>
                          <p className="flex items-center gap-2">✓ Letter from Student Affairs office</p>
                        </div>
                        <p className="text-[10px] text-purple-400/60 italic leading-relaxed">Identity is verified instantly upon upload. ⚡</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {step === 6 && (
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

          {step === 7 && (
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

          {step === 8 && (
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

          {step === 9 && (
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
            {step < 9 ? (
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

      {/* Camera Modal Overlay (Section A) */}
      {isScanning && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4 sm:p-8 animate-fade-in">
          <div className="relative w-full max-w-2xl aspect-[1.586/1] border-4 border-white/20 rounded-[32px] overflow-hidden shadow-2xl">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            
            {/* Overlay Frame */}
            <div className={`absolute inset-6 border-4 border-dashed rounded-2xl flex flex-col items-center justify-center pointer-events-none transition-all duration-500 ${isAutoCapturing ? 'border-green-500 scale-95' : 'border-white/40'}`}>
              <div className={`px-6 py-3 rounded-full bg-black/60 text-white text-xs font-black uppercase tracking-widest mb-4 transition-all ${isAutoCapturing ? 'bg-green-600 scale-110' : ''}`}>
                {isAutoCapturing ? 'Capturing ID... Hold steady! ⚡' : 'Hold ID steady inside the frame...'}
              </div>
              
              {/* Corner markers */}
              <div className="absolute top-0 left-0 w-12 h-12 border-t-8 border-l-8 border-purple-500 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-12 h-12 border-t-8 border-r-8 border-purple-500 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-12 h-12 border-b-8 border-l-8 border-purple-500 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b-8 border-r-8 border-purple-500 rounded-br-xl" />
            </div>

            {/* Camera Progress Bar (Simplified) */}
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-white/10">
              <div className={`h-full grad-bg transition-all duration-[1000ms] ease-linear ${isScanning ? 'w-full' : 'w-0'}`} />
            </div>

            {/* Controls */}
            <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-8">
              <button onClick={stopScanning} className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-all border border-white/10">
                <X className="w-8 h-8" />
              </button>
              <button onClick={captureFrame} className="w-24 h-24 rounded-full border-4 border-white flex items-center justify-center hover:scale-105 transition-all shadow-2xl">
                <div className="w-18 h-18 rounded-full bg-white shadow-inner" />
              </button>
            </div>
          </div>
          <div className="mt-10 flex items-center gap-3">
             <div className="flex gap-1">
                {[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" style={{ animationDelay: `${i*0.2}s` }} />)}
             </div>
             <p className="text-purple-400 text-[10px] font-black uppercase tracking-[0.3em] text-center">AI Smart ID Scan Active</p>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </main>
  )
}


// Helper icons not imported
const MapPin = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
const BookOpen = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
const Flame = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
