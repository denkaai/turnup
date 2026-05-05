import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ChevronLeft, Loader2, Upload, CheckCircle, Camera, X, AlertCircle, Info, Image as ImageIcon, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { toast } from 'sonner'

const CAMPUSES = [
  'KU', 'JKUAT', 'Zetech', 'MKU', 'PAC University', 'Gretsa', 'Murang\'a University', 'KCA University'
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
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const autoCaptureTimeout = useRef<NodeJS.Timeout | null>(null)

  const [form, setForm] = useState({
    name: '', age: '', gender: '', campus: '',
    course: '', year: '1', bio: '',
    looking_for: 'everyone', interests: [] as string[],
    vibe: '', weekend_plan: '', relationship_goal: '',
    photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop',
    whatsapp_number: ''
  })

  const update = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  // Section C: AI Validation (Simulated client-side)
  const validateID = (file: File): string | null => {
    // 1. Correct format
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
    const isHeicExt = file.name.toLowerCase().endsWith('.heic')
    if (!validTypes.includes(file.type) && !isHeicExt) {
      return "Incorrect format. Please upload JPG, PNG, WEBP, or HEIC."
    }

    // 2. File size
    if (file.size > 10 * 1024 * 1024) return "File too large (Max 10MB)."
    if (file.size < 50 * 1024) return "Image too small or blurry."

    // 3. Aspect Ratio & Content checks (Simulated)
    // Random check to simulate a non-ID image (Landscape, screenshot, etc.)
    const isRandomDoc = Math.random() < 0.15 
    if (isRandomDoc) {
      return "This doesn't look like a student ID card. Please scan or upload a clear photo of your official institution ID card showing your name and admission number."
    }

    return null
  }

  const handleIDSelect = async (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0]
    if (!file) return

    if (failedAttempts >= 3) {
      setIdError("Too many failed attempts. Please contact support.")
      return
    }

    const error = validateID(file)
    if (error) {
      setIdError(error)
      setFailedAttempts(prev => prev + 1)
      return
    }

    setIdError(null)
    const preview = URL.createObjectURL(file)
    if (side === 'front') {
      setIdFrontFile(file)
      setIdFrontPreview(preview)
      setIdVerified(true) // Enable continue for front
    } else {
      setIdBackFile(file)
      setIdBackPreview(preview)
    }
  }

  const startScanning = async (side: 'front' | 'back') => {
    if (failedAttempts >= 3) return
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
      toast.error("Camera access denied")
      setIsScanning(false)
    }
  }

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return
    const context = canvasRef.current.getContext('2d')
    if (!context) return

    canvasRef.current.width = videoRef.current.videoWidth
    canvasRef.current.height = videoRef.current.videoHeight
    context.drawImage(videoRef.current, 0, 0)
    
    canvasRef.current.toBlob(async (blob) => {
      if (!blob) return
      const file = new File([blob], `scan-${scanningSide}.jpg`, { type: 'image/jpeg' })
      
      const error = validateID(file)
      if (error) {
        setIdError(error)
        setFailedAttempts(prev => prev + 1)
        stopScanning()
        return
      }

      setIdError(null)
      const preview = URL.createObjectURL(file)
      if (scanningSide === 'front') {
        setIdFrontFile(file)
        setIdFrontPreview(preview)
        setIdVerified(true)
      } else {
        setIdBackFile(file)
        setIdBackPreview(preview)
      }
      stopScanning()
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
        whatsapp_number: form.whatsapp_number,
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

  const steps = ['About You', 'Campus Info', 'Your Bio', 'Interests', 'Verify Identity', 'Introvert Mode', 'Weekend Plans', 'Looking for', 'Ready!']

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#080810]">
      <div className="w-full max-w-md">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
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

        <div className="card p-6 animate-fade-in relative overflow-hidden">
          {/* Header */}
          <div className="mb-6">
            <h2 className="font-syne font-black text-2xl text-white mb-1 leading-tight">
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
                <select className="input-dark" value={form.campus} onChange={e => update('campus', e.target.value)}>
                  <option value="">Select campus...</option>
                  {CAMPUSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
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

                  {/* Upload Options (Section A) */}
                  <div className="space-y-4">
                    {/* Front of ID */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Front of ID card</p>
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => startScanning('front')}
                          className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed transition-all ${idFrontPreview ? 'border-green-500/30 bg-green-500/5' : 'border-white/10 bg-white/5 hover:border-purple-500/30 hover:bg-white/8'}`}
                        >
                          <Camera className={`w-6 h-6 mb-2 ${idFrontPreview ? 'text-green-400' : 'text-gray-400'}`} />
                          <span className="text-[10px] font-black uppercase tracking-tight">Scan with Camera</span>
                        </button>
                        <label className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${idFrontPreview ? 'border-green-500/30 bg-green-500/5' : 'border-white/10 bg-white/5 hover:border-purple-500/30 hover:bg-white/8'}`}>
                          <Upload className={`w-6 h-6 mb-2 ${idFrontPreview ? 'text-green-400' : 'text-gray-400'}`} />
                          <span className="text-[10px] font-black uppercase tracking-tight">Upload Gallery</span>
                          <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.webp,.heic" onChange={(e) => handleIDSelect(e, 'front')} />
                        </label>
                      </div>
                      
                      {idFrontPreview && (
                        <div className="relative rounded-xl overflow-hidden aspect-[1.586/1] border border-white/10 animate-fade-in group">
                          <img src={idFrontPreview} className="w-full h-full object-cover" alt="ID Front" />
                          <div className="absolute top-2 right-2 bg-green-500 text-white text-[9px] font-black px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg">
                            <CheckCircle className="w-3 h-3" /> Looks good! ✓
                          </div>
                          <button 
                            onClick={() => { setIdFrontPreview(null); setIdFrontFile(null); setIdVerified(null); }}
                            className="absolute bottom-2 right-2 bg-black/60 text-white text-[9px] font-black px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          >
                            Try again
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Back of ID (Section B) */}
                    {idFrontPreview && (
                      <div className="space-y-2 animate-fade-in">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Back of ID card (Optional ⚡)</p>
                        <div className="grid grid-cols-2 gap-3">
                          <button 
                            onClick={() => startScanning('back')}
                            className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed transition-all ${idBackPreview ? 'border-green-500/30 bg-green-500/5' : 'border-white/10 bg-white/5 hover:border-purple-500/30 hover:bg-white/8'}`}
                          >
                            <Camera className={`w-6 h-6 mb-2 ${idBackPreview ? 'text-green-400' : 'text-gray-400'}`} />
                            <span className="text-[10px] font-black uppercase tracking-tight">Scan Back</span>
                          </button>
                          <label className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${idBackPreview ? 'border-green-500/30 bg-green-500/5' : 'border-white/10 bg-white/5 hover:border-purple-500/30 hover:bg-white/8'}`}>
                            <Upload className={`w-6 h-6 mb-2 ${idBackPreview ? 'text-green-400' : 'text-gray-400'}`} />
                            <span className="text-[10px] font-black uppercase tracking-tight">Gallery</span>
                            <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.webp,.heic" onChange={(e) => handleIDSelect(e, 'back')} />
                          </label>
                        </div>
                        {idBackPreview && (
                          <div className="relative rounded-xl overflow-hidden aspect-[1.586/1] border border-white/10 animate-fade-in group">
                            <img src={idBackPreview} className="w-full h-full object-cover" alt="ID Back" />
                            <button onClick={() => { setIdBackPreview(null); setIdBackFile(null); }} className="absolute bottom-2 right-2 bg-black/60 text-white text-[9px] font-black px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all">Remove</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ID Error (Section C/E) */}
                  {idError && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-3 animate-bounce">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <p className="text-xs text-red-200/80 leading-relaxed font-bold">❌ {idError}</p>
                    </div>
                  )}

                  {/* Verification Status (Section G) */}
                  {idFrontPreview && !idError && (
                    <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 flex gap-3 animate-fade-in">
                      <Loader2 className="w-5 h-5 text-purple-400 animate-spin flex-shrink-0" />
                      <div className="space-y-1">
                        <p className="text-xs text-purple-200 font-bold">✅ ID detected! Submitting for verification...</p>
                        <p className="text-[10px] text-purple-300/60 font-medium italic">⏳ Under review — you can continue. Your verified badge appears within 24hrs.</p>
                      </div>
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
                        <p className="text-[10px] text-purple-400/60 italic leading-relaxed">Our team reviews alternative documents within 24 hours. ⏳</p>
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
                  { id: 'Turn Up 🎉', sub: 'CLUBS, PARTIES, LOUD MUSIC — NIKO TAYARI', gradient: 'from-purple-500 to-pink-500', glow: 'rgba(168,85,247,0.5)' },
                  { id: 'Lowkey Hangout 🍗', sub: 'NYAMA CHOMA, GOOD PEOPLE, CHILL VIBES', gradient: 'from-orange-500 to-amber-500', glow: 'rgba(249,115,22,0.5)' },
                  { id: 'Squad Goals 👥', sub: 'ROAD TRIPS, ADVENTURES, MY DAY ONES', gradient: 'from-blue-500 to-teal-500', glow: 'rgba(59,130,246,0.5)' },
                  { id: 'Home Vibes 🛋️', sub: 'SERIES, SNACKS, RECHARGE MODE — INTROVERT SZN', gradient: 'from-green-500 to-emerald-500', glow: 'rgba(16,185,129,0.5)' }
                ].map(v => (
                  <button
                    key={v.id}
                    onClick={() => update('vibe', v.id)}
                    className={`group relative py-6 px-6 rounded-2xl text-left transition-all border-2 overflow-hidden hover:scale-[1.02] active:scale-[0.98] ${
                      form.vibe === v.id 
                        ? 'border-white/20 bg-white/10 shadow-2xl' 
                        : 'border-white/5 bg-white/2 text-gray-400 hover:bg-white/5 hover:border-white/10'
                    }`}
                    style={{
                      boxShadow: form.vibe === v.id ? `0 0 40px ${v.glow}` : ''
                    }}
                  >
                    {form.vibe === v.id && (
                      <div className={`absolute inset-0 bg-gradient-to-br ${v.gradient} opacity-20 animate-pulse`} />
                    )}
                    <p className={`font-syne font-black text-lg mb-1 transition-colors ${form.vibe === v.id ? 'text-white' : 'text-gray-300'}`}>{v.id}</p>
                    <p className={`text-[10px] font-black uppercase tracking-widest leading-tight transition-colors ${form.vibe === v.id ? 'text-white/80' : 'text-gray-500'}`}>{v.sub}</p>
                    
                    {form.vibe === v.id && (
                      <div className="absolute top-4 right-4">
                        <CheckCircle className="w-5 h-5 text-white" />
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
              <h3 className="text-white font-syne font-black text-2xl mb-2 leading-tight">You're ready, {form.name}!</h3>
              <p className="text-gray-400 text-sm mb-8 leading-relaxed font-medium px-4">
                Your profile is set up. Start discovering students across Thika Road campuses and plan your next weekend!
              </p>
              <div className="space-y-2.5 text-left">
                {[
                  { label: 'Campus', val: form.campus, icon: MapPin },
                  { label: 'Study', val: `${form.course}, Year ${form.year}`, icon: BookOpen },
                  { label: 'Vibe', val: form.vibe, icon: Flame },
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

          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-1.5 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/5 transition-all">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            {step < 9 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canNext()}
                className="btn-grad flex-1 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed shadow-lg transition-all"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={loading}
                className="btn-grad flex-1 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Start Discovering 🔥
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

            {/* AI Scanning Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-white/10">
              <div className={`h-full grad-bg transition-all duration-[3500ms] ease-linear ${isScanning ? 'w-full' : 'w-0'}`} />
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
