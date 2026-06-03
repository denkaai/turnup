import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ImagePlus, Send, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { toast } from 'sonner'

interface CreateStoryModalProps {
  isOpen: boolean
  onClose: () => void
  onStoryCreated: () => void
}

export default function CreateStoryModal({ isOpen, onClose, onStoryCreated }: CreateStoryModalProps) {
  const { user, profile } = useAuthStore()
  const [imageData, setImageData] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      setImageData(ev.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    if (!imageData || !user) return

    setIsSubmitting(true)

    const storyData = {
      id: crypto.randomUUID(),
      user_id: user.id,
      image_url: imageData,
      caption: caption.trim(),
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }

    try {
      // Try Supabase first
      const { error } = await supabase.from('stories').insert({
        user_id: storyData.user_id,
        image_url: storyData.image_url,
        caption: storyData.caption,
      })

      if (error) throw error

      toast.success('Story posted! 🔥', {
        style: {
          background: '#BEFF00',
          color: '#000',
          border: '3px solid #000',
          fontWeight: 800,
        },
      })
    } catch (err) {
      // Fallback to localStorage
      console.warn('Supabase stories insert failed, using localStorage:', err)

      try {
        const raw = localStorage.getItem('turnup_local_stories')
        const existing = raw ? JSON.parse(raw) : []
        existing.push({
          ...storyData,
          profile: profile
            ? { name: profile.name, photos: profile.photos }
            : undefined,
        })
        localStorage.setItem('turnup_local_stories', JSON.stringify(existing))

        toast.success('Story saved locally! 🔥', {
          style: {
            background: '#BEFF00',
            color: '#000',
            border: '3px solid #000',
            fontWeight: 800,
          },
        })
      } catch (storageErr) {
        toast.error('Failed to save story')
        setIsSubmitting(false)
        return
      }
    }

    onStoryCreated()
    resetAndClose()
    setIsSubmitting(false)
  }

  const resetAndClose = () => {
    setImageData(null)
    setCaption('')
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative w-full max-w-md bg-[#0D0D0D] border-[4px] border-black rounded-2xl overflow-hidden"
            style={{ boxShadow: '6px 6px 0px #BEFF00' }}
            initial={{ scale: 0.8, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 40 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b-[3px] border-black">
              <h2
                className="text-xl font-black uppercase tracking-wider text-white"
                style={{ fontFamily: 'Syne, sans-serif' }}
              >
                New Story
              </h2>
              <button
                onClick={resetAndClose}
                className="w-8 h-8 flex items-center justify-center rounded-full border-[3px] border-white/30 hover:border-[#BEFF00] hover:bg-[#BEFF00]/10 transition-all"
              >
                <X className="w-4 h-4 text-white" strokeWidth={3} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-5">
              {/* Image Upload Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative cursor-pointer group"
              >
                {imageData ? (
                  <div className="relative aspect-[9/16] max-h-[360px] rounded-xl overflow-hidden border-[3px] border-black">
                    <img
                      src={imageData}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white font-black uppercase text-sm tracking-wide">
                        Tap to change
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    className="aspect-[9/16] max-h-[360px] rounded-xl border-[3px] border-dashed border-white/20 flex flex-col items-center justify-center gap-3 hover:border-[#BEFF00] hover:bg-[#BEFF00]/5 transition-all"
                  >
                    <ImagePlus className="w-12 h-12 text-white/30 group-hover:text-[#BEFF00] transition-colors" />
                    <span className="text-white/40 font-bold text-sm uppercase tracking-wider group-hover:text-[#BEFF00] transition-colors">
                      Tap to add photo
                    </span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Caption Input */}
              <div>
                <label
                  className="block text-xs font-black uppercase tracking-widest text-white/50 mb-2"
                  style={{ fontFamily: 'Syne, sans-serif' }}
                >
                  Caption
                </label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value.slice(0, 100))}
                  placeholder="What's the vibe?"
                  maxLength={100}
                  className="w-full px-4 py-3 bg-black/60 text-white font-bold rounded-xl border-[3px] border-white/10 focus:border-[#BEFF00] focus:outline-none placeholder:text-white/20 transition-colors"
                />
                <div className="flex justify-end mt-1.5">
                  <span className={`text-xs font-bold ${caption.length >= 90 ? 'text-[#FF5733]' : 'text-white/30'}`}>
                    {caption.length}/100
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                onClick={handleSubmit}
                disabled={!imageData || isSubmitting}
                whileTap={{ scale: 0.95 }}
                className={`w-full py-4 rounded-xl font-black uppercase text-base tracking-wider flex items-center justify-center gap-2.5 border-[3px] border-black transition-all ${
                  imageData && !isSubmitting
                    ? 'bg-[#BEFF00] text-black hover:brightness-110 cursor-pointer'
                    : 'bg-white/5 text-white/20 cursor-not-allowed border-white/10'
                }`}
                style={{
                  boxShadow: imageData && !isSubmitting ? '4px 4px 0px #000' : 'none',
                  fontFamily: 'Syne, sans-serif',
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" strokeWidth={3} />
                    Post Story
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
