import { useState, useEffect } from 'react'
import { X, Download, Share } from 'lucide-react'

export default function InstallBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Check if already installed or dismissed
    const isDismissed = localStorage.getItem('turnup_install_dismissed')
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone
    
    if (isDismissed || isStandalone) return

    // iOS Detection
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(ios)

    if (ios) {
      setShowBanner(true)
    }

    // Android / Chrome
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowBanner(true)
    })
  }, [])

  const handleInstall = async () => {
    if (isIOS) {
      alert('To install TurnUp on iOS:\n1. Tap the Share button 📤\n2. Scroll down and tap "Add to Home Screen" ➕')
      return
    }

    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowBanner(false)
      }
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem('turnup_install_dismissed', 'true')
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-6 left-4 right-4 z-[100] animate-in slide-in-from-bottom-10 duration-500">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 p-4 shadow-2xl shadow-purple-500/30 border border-white/20">
        <div className="flex items-center gap-4">
          {/* Logo Placeholder */}
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 flex-shrink-0">
             <span className="text-xl">🔥</span>
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-black text-sm uppercase tracking-tight leading-none mb-1">Install TurnUp App 📲</h4>
            <p className="text-purple-100/70 text-[10px] font-medium leading-tight">Add to home screen for best experience</p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleInstall}
              className="px-4 py-2 rounded-xl bg-white text-purple-600 text-xs font-black uppercase tracking-widest hover:bg-purple-50 transition-all flex items-center gap-2"
            >
              {isIOS ? <Share className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
              {isIOS ? 'How to' : 'Install'}
            </button>
            <button 
              onClick={handleDismiss}
              className="p-2 rounded-full bg-black/20 text-white/60 hover:text-white hover:bg-black/40 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Progress Background */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      </div>
    </div>
  )
}
