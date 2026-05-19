import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Radio, Zap, Volume2, VolumeX, ShieldAlert, Database, ChevronRight, Activity } from 'lucide-react'

// Synthesize a premium spatial chime sound using Web Audio API
const playChime = (muted: boolean) => {
  if (muted) return
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()
    
    // Main Oscillator (warm triangle wave)
    const osc1 = ctx.createOscillator()
    osc1.type = 'triangle'
    osc1.frequency.setValueAtTime(220, ctx.currentTime) // Start at A3
    
    // Sparkle Oscillator (clean sine wave)
    const osc2 = ctx.createOscillator()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(440, ctx.currentTime) // Start at A4

    // Spatial Panners
    const panner1 = ctx.createStereoPanner ? ctx.createStereoPanner() : null
    const panner2 = ctx.createStereoPanner ? ctx.createStereoPanner() : null
    
    if (panner1) panner1.pan.setValueAtTime(-0.6, ctx.currentTime) // Pan left
    if (panner2) panner2.pan.setValueAtTime(0.6, ctx.currentTime)  // Pan right

    // Gain nodes for envelope shaping
    const gain1 = ctx.createGain()
    const gain2 = ctx.createGain()

    gain1.gain.setValueAtTime(0.25, ctx.currentTime)
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2) // Decay over 1.2s
    
    gain2.gain.setValueAtTime(0.15, ctx.currentTime)
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0) // Decay over 1s

    // Pitch sweep/glide envelope
    osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.8) // Glide to A5
    osc2.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.6) // Glide to A6

    // Connections
    if (panner1 && panner2) {
      osc1.connect(panner1).connect(gain1)
      osc2.connect(panner2).connect(gain2)
    } else {
      osc1.connect(gain1)
      osc2.connect(gain2)
    }

    gain1.connect(ctx.destination)
    gain2.connect(ctx.destination)

    osc1.start()
    osc2.start()
    osc1.stop(ctx.currentTime + 1.3)
    osc2.stop(ctx.currentTime + 1.1)
  } catch (err) {
    console.warn('Audio synthesis blocked or unsupported:', err)
  }
}

interface CinematicIntroProps {
  onComplete: () => void
}

export default function CinematicIntro({ onComplete }: CinematicIntroProps) {
  const [slide, setSlide] = useState(0)
  const [muted, setMuted] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  // Floating ambient background stars
  const stars = Array.from({ length: 40 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 1,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 2,
  }))

  const features = [
    {
      title: 'V3 BLACKOUT-PROOF UPDATE',
      subtitle: 'Comrade Offline Resilience Pack',
      description: 'The ultimate tool for the 2027 general elections. Stay synced, share profiles, and discover local mesh clusters when cell signals are fully blocked.',
      icon: ShieldAlert,
      color: 'from-red-500 to-amber-500',
      badge: 'ELECTION READY',
    },
    {
      title: 'COMRADE MESH SCANNER',
      subtitle: 'Decentralized P2P Sonar Mesh',
      description: 'Turn your device into a local mesh relay hub. Discover active student hotspots off-grid and jump messages through a multi-hop crowd.',
      icon: Radio,
      color: 'from-purple-500 to-pink-500',
      badge: 'OFF-GRID SIGNAL',
    },
    {
      title: 'ULTRASONIC SOUND-LINK',
      subtitle: 'Near-Proximity Audio Exchange',
      description: 'Swap profile contacts instantly with nearby comrades using synthetic audio frequency chirps. No cell towers, Bluetooth, or cables required.',
      icon: Activity,
      color: 'from-blue-500 to-purple-600',
      badge: 'SONIC BEAM',
    },
    {
      title: 'INDEXEDDB SYNCHRONIZER',
      subtitle: 'Offline Cache & Auto-Sync',
      description: 'Never lose a message or match. All updates queue locally in a persistent browser database and push to Supabase the split second you connect to Wi-Fi.',
      icon: Database,
      color: 'from-green-500 to-teal-500',
      badge: 'PERSISTENT CACHE',
    }
  ]

  const handleNext = () => {
    // Play sound chime on slide transition
    playChime(muted)
    if (slide < features.length - 1) {
      setSlide(prev => prev + 1)
    } else {
      setIsExiting(true)
      setTimeout(onComplete, 800) // matches exit transition duration
    }
  }

  // Auto-play the first chime on slide change to give instant feedback
  useEffect(() => {
    if (slide > 0) {
      playChime(muted)
    }
  }, [slide])

  const currentFeature = features[slide]
  const Icon = currentFeature.icon

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -60, filter: 'blur(20px)' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[99999] bg-[#030305] flex flex-col justify-between p-6 sm:p-12 overflow-hidden text-white font-syne select-none"
        >
          {/* Ambient vector grid layer */}
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_70%,transparent_100%)] pointer-events-none" />

          {/* Glowing Radial Core Backgrounds */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none rounded-full blur-[150px] opacity-25 bg-gradient-to-tr from-purple-500/30 via-pink-500/20 to-blue-500/30 transition-all duration-1000 ease-out" />

          {/* Floating Stars */}
          <div className="absolute inset-0 pointer-events-none">
            {stars.map(star => (
              <motion.div
                key={star.id}
                initial={{ opacity: 0.1, y: `${star.y}%` }}
                animate={{ opacity: [0.1, 0.8, 0.1] }}
                transition={{
                  duration: star.duration,
                  delay: star.delay,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute bg-white rounded-full"
                style={{
                  left: `${star.x}%`,
                  width: `${star.size}px`,
                  height: `${star.size}px`,
                  boxShadow: star.size > 2 ? '0 0 8px rgba(255,255,255,0.5)' : 'none'
                }}
              />
            ))}
          </div>

          {/* Top Panel: Brand + Sound Mute */}
          <div className="relative z-10 flex items-center justify-between w-full max-w-6xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <span className="text-white font-black text-xl tracking-tight">T</span>
              </div>
              <div>
                <h3 className="font-extrabold text-sm tracking-tight leading-none text-white">TURNUP</h3>
                <span className="text-[8px] text-white/40 font-black uppercase tracking-[0.25em]">Comrades Network</span>
              </div>
            </div>

            <button
              onClick={() => setMuted(!muted)}
              className="w-10 h-10 rounded-2xl bg-white/5 border border-white/5 hover:border-white/15 hover:bg-white/10 active:scale-95 flex items-center justify-center transition-all text-white/60 hover:text-white"
            >
              {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-purple-400" />}
            </button>
          </div>

          {/* Middle Panel: Interactive Feature Showcase */}
          <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center justify-center my-auto py-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide}
                initial={{ opacity: 0, scale: 0.95, y: 30, filter: 'blur(8px)' }}
                animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.95, y: -30, filter: 'blur(8px)' }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="w-full flex flex-col items-center text-center space-y-6 sm:space-y-8"
              >
                {/* Visual Icon Halo */}
                <div className="relative flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.15, 1], rotate: [0, 180, 360] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className={`absolute w-32 h-32 rounded-[2.5rem] bg-gradient-to-r ${currentFeature.color} opacity-20 blur-xl`}
                  />
                  <div className={`w-24 h-24 rounded-[2rem] bg-gradient-to-r ${currentFeature.color} p-[1px] shadow-2xl`}>
                    <div className="w-full h-full bg-[#07070d]/90 rounded-[2rem] flex items-center justify-center text-white">
                      <Icon className="w-10 h-10 animate-pulse" />
                    </div>
                  </div>
                </div>

                {/* Subtitle Badge */}
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 text-[9px] font-black uppercase tracking-widest shadow-inner">
                  {currentFeature.badge}
                </span>

                {/* Title and Descriptions */}
                <div className="space-y-4 max-w-2xl px-4">
                  <h1 className={`font-black text-4xl sm:text-5xl md:text-6xl tracking-tighter leading-none bg-gradient-to-r ${currentFeature.color} bg-clip-text text-transparent`}>
                    {currentFeature.title}
                  </h1>
                  <h2 className="text-white/80 font-extrabold text-lg sm:text-xl tracking-tight">
                    {currentFeature.subtitle}
                  </h2>
                  <p className="text-white/50 text-xs sm:text-sm leading-relaxed max-w-lg mx-auto font-medium">
                    {currentFeature.description}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom Panel: Slide Indicators + Next/Skip Buttons */}
          <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Indicators */}
            <div className="flex gap-2">
              {features.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlide(i)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${i === slide ? 'w-8 bg-purple-500' : 'w-2 bg-white/10'}`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 w-full sm:w-auto">
              {slide < features.length - 1 ? (
                <>
                  <button
                    onClick={() => {
                      setIsExiting(true)
                      setTimeout(onComplete, 800)
                    }}
                    className="flex-1 sm:flex-initial px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all"
                  >
                    Skip
                  </button>
                  <button
                    onClick={handleNext}
                    className="flex-1 sm:flex-initial px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-purple-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 border border-white/5"
                  >
                    Continue <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={handleNext}
                  className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-gradient-to-r from-red-600 via-purple-600 to-pink-600 hover:opacity-95 text-white text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-purple-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-white/10"
                >
                  Activate Election Mesh <Zap className="w-4 h-4 animate-bounce" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
