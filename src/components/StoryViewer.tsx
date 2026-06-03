import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface StoryItem {
  id: string
  image_url: string
  caption: string
  created_at: string
}

interface StoryUser {
  userId: string
  userName: string
  userPhoto: string
  items: StoryItem[]
}

interface StoryViewerProps {
  stories: StoryUser[]
  initialUserIndex: number
  onClose: () => void
}

const STORY_DURATION = 5000 // 5 seconds per story

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function StoryViewer({ stories, initialUserIndex, onClose }: StoryViewerProps) {
  const [userIndex, setUserIndex] = useState(initialUserIndex)
  const [itemIndex, setItemIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [direction, setDirection] = useState(1) // 1 = forward, -1 = backward
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef(Date.now())
  const elapsedRef = useRef(0)

  const currentUser = stories[userIndex]
  const currentItem = currentUser?.items[itemIndex]

  // Mark story as seen in localStorage
  useEffect(() => {
    if (currentItem) {
      try {
        const seenRaw = localStorage.getItem('turnup_seen_stories')
        const seen: string[] = seenRaw ? JSON.parse(seenRaw) : []
        if (!seen.includes(currentItem.id)) {
          seen.push(currentItem.id)
          localStorage.setItem('turnup_seen_stories', JSON.stringify(seen))
        }
      } catch { /* ignore */ }
    }
  }, [currentItem])

  const goNext = useCallback(() => {
    setDirection(1)
    if (itemIndex < currentUser.items.length - 1) {
      setItemIndex(prev => prev + 1)
      setProgress(0)
      elapsedRef.current = 0
    } else if (userIndex < stories.length - 1) {
      setUserIndex(prev => prev + 1)
      setItemIndex(0)
      setProgress(0)
      elapsedRef.current = 0
    } else {
      onClose()
    }
  }, [itemIndex, userIndex, currentUser, stories.length, onClose])

  const goPrev = useCallback(() => {
    setDirection(-1)
    if (itemIndex > 0) {
      setItemIndex(prev => prev - 1)
      setProgress(0)
      elapsedRef.current = 0
    } else if (userIndex > 0) {
      setUserIndex(prev => prev - 1)
      const prevUser = stories[userIndex - 1]
      setItemIndex(prevUser.items.length - 1)
      setProgress(0)
      elapsedRef.current = 0
    }
  }, [itemIndex, userIndex, stories])

  // Auto-advance timer
  useEffect(() => {
    if (isPaused) return

    startTimeRef.current = Date.now()

    timerRef.current = setInterval(() => {
      const elapsed = elapsedRef.current + (Date.now() - startTimeRef.current)
      const pct = Math.min(elapsed / STORY_DURATION, 1)
      setProgress(pct)

      if (pct >= 1) {
        if (timerRef.current) clearInterval(timerRef.current)
        goNext()
      }
    }, 30)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      elapsedRef.current = elapsedRef.current + (Date.now() - startTimeRef.current)
    }
  }, [userIndex, itemIndex, isPaused, goNext])

  // Reset elapsed on story change
  useEffect(() => {
    elapsedRef.current = 0
    setProgress(0)
  }, [userIndex, itemIndex])

  const handleTap = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = x / rect.width

    if (pct < 0.3) {
      goPrev()
    } else {
      goNext()
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, goNext, goPrev])

  if (!currentUser || !currentItem) return null

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 z-30 px-3 pt-3 flex gap-1.5">
        {currentUser.items.map((item, i) => (
          <div
            key={item.id}
            className="flex-1 h-[4px] bg-white/20 rounded-full overflow-hidden"
            style={{ border: '1px solid rgba(0,0,0,0.6)' }}
          >
            <motion.div
              className="h-full bg-white rounded-full"
              style={{
                width:
                  i < itemIndex
                    ? '100%'
                    : i === itemIndex
                    ? `${progress * 100}%`
                    : '0%',
              }}
            />
          </div>
        ))}
      </div>

      {/* User info */}
      <div className="absolute top-5 left-3 z-30 flex items-center gap-2.5 pt-2">
        <div className="w-9 h-9 rounded-full border-[3px] border-[#BEFF00] overflow-hidden">
          <img
            src={currentUser.userPhoto}
            alt={currentUser.userName}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white font-black text-sm uppercase tracking-wide">
            {currentUser.userName}
          </span>
          <span className="text-white/50 text-xs font-bold">
            {timeAgo(currentItem.created_at)}
          </span>
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-3 z-30 w-9 h-9 flex items-center justify-center bg-black/60 rounded-full border-[3px] border-white/30 hover:border-white transition-colors"
      >
        <X className="w-5 h-5 text-white" strokeWidth={3} />
      </button>

      {/* Story image with tap zones */}
      <div
        className="absolute inset-0 z-10"
        onClick={handleTap}
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <AnimatePresence custom={direction} mode="popLayout">
          <motion.img
            key={`${currentUser.userId}-${currentItem.id}`}
            src={currentItem.image_url}
            alt={currentItem.caption}
            className="absolute inset-0 w-full h-full object-cover"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          />
        </AnimatePresence>
      </div>

      {/* Caption with gradient */}
      {currentItem.caption && (
        <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
          <div className="bg-gradient-to-t from-black/90 via-black/50 to-transparent px-5 pb-8 pt-24">
            <motion.p
              key={currentItem.id + '-caption'}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.3 }}
              className="text-white font-bold text-base text-center uppercase tracking-wide"
              style={{ textShadow: '2px 2px 0px #000' }}
            >
              {currentItem.caption}
            </motion.p>
          </div>
        </div>
      )}
    </motion.div>
  )
}
