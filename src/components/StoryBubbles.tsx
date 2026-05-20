import { useState, useEffect, useRef } from 'react'
import { Plus, X, Send, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { offlineDB } from '@/lib/offline-db'
import { toast } from 'sonner'

interface Story {
  id: string
  user_id: string
  user_name: string
  user_photo: string
  has_unseen: boolean
  is_me?: boolean
  media: string
  caption: string
  time: string
}

const INITIAL_DEMO_STORIES: Story[] = [
  { 
    id: 's1', 
    user_id: 'd1', 
    user_name: 'Amina', 
    user_photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop', 
    has_unseen: true,
    media: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&fit=crop',
    caption: 'Saturday pre-game starts now! Who is joining? 🎧💃',
    time: '2h ago'
  },
  { 
    id: 's2', 
    user_id: 'd2', 
    user_name: 'Brian', 
    user_photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop', 
    has_unseen: true,
    media: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=600&fit=crop',
    caption: 'Tech stack setup cooked. Time to turn up! 💻🎮',
    time: '4h ago'
  },
  { 
    id: 's3', 
    user_id: 'd3', 
    user_name: 'Cynthia', 
    user_photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop', 
    has_unseen: false,
    media: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=600&fit=crop',
    caption: 'Med school study run. Coffee is the only savior ☕🏥',
    time: '5h ago'
  },
  { 
    id: 's4', 
    user_id: 'd4', 
    user_name: 'David', 
    user_photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop', 
    has_unseen: true,
    media: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&fit=crop',
    caption: 'Thika Road highway cruise. Adventure is calling! 🏎️💨',
    time: '7h ago'
  },
  { 
    id: 's5', 
    user_id: 'd5', 
    user_name: 'Esther', 
    user_photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop', 
    has_unseen: false,
    media: 'https://images.unsplash.com/photo-1498804103079-a6351b050096?w=600&fit=crop',
    caption: 'Sunday brunch vibe check. Waffles and cocktails! 🥞🥂',
    time: '9h ago'
  },
]

const STORY_PRESET_IMAGES = [
  { name: 'Rave / Party', url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&fit=crop' },
  { name: 'Library / Study', url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=600&fit=crop' },
  { name: 'Roadtrip / Cars', url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&fit=crop' },
  { name: 'Brunch / Cafe', url: 'https://images.unsplash.com/photo-1498804103079-a6351b050096?w=600&fit=crop' },
  { name: 'Hiking / Nature', url: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=600&fit=crop' }
]

export default function StoryBubbles() {
  const { user } = useAuthStore()
  
  // Custom states
  const [stories, setStories] = useState<Story[]>(INITIAL_DEMO_STORIES)
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null)
  const [storyProgress, setStoryProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [showCreateStoryModal, setShowCreateStoryModal] = useState(false)
  
  // Custom Story upload fields
  const [customCaption, setCustomCaption] = useState('')
  const [customImageUrl, setCustomImageUrl] = useState(STORY_PRESET_IMAGES[0].url)
  const [myStory, setMyStory] = useState<Story | null>(null)

  const progressInterval = useRef<any>(null)

  // Combined stories array incorporating the user's own story if published
  const allStories = myStory ? [myStory, ...stories] : stories

  // Play / Pause timer effects
  useEffect(() => {
    if (activeStoryIndex === null) return
    
    if (isPaused) {
      if (progressInterval.current) clearInterval(progressInterval.current)
      return
    }

    progressInterval.current = setInterval(() => {
      setStoryProgress(prev => {
        if (prev >= 100) {
          handleNextStory()
          return 0
        }
        return prev + 1
      })
    }, 50) // Total 5 seconds per story

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current)
    }
  }, [activeStoryIndex, isPaused, allStories.length])

  const handleNextStory = () => {
    setStoryProgress(0)
    setActiveStoryIndex(prev => {
      if (prev === null) return null
      if (prev + 1 >= allStories.length) {
        // End of stories
        return null
      }
      return prev + 1
    })
  }

  const handlePrevStory = () => {
    setStoryProgress(0)
    setActiveStoryIndex(prev => {
      if (prev === null) return null
      if (prev - 1 < 0) return 0
      return prev - 1
    })
  }

  // Handle posting a custom story
  const handlePostStory = () => {
    if (!customCaption.trim()) {
      return toast.error("Please add a caption to your story!")
    }

    const newStory: Story = {
      id: 'my_story',
      user_id: 'me',
      user_name: 'You',
      user_photo: user?.photos?.[0] || 'https://images.unsplash.com/photo-153571702451c-707ad0d8118d?w=100&h=100&fit=crop',
      has_unseen: false,
      is_me: true,
      media: customImageUrl,
      caption: customCaption,
      time: 'Just now'
    }

    setMyStory(newStory)
    setShowCreateStoryModal(false)
    setCustomCaption('')
    toast.success("Vibe published to Campus Stories! 🚀")
  }

  // Handle sending story reply directly into standard DM message database stream
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyText.trim() || activeStoryIndex === null) return
    
    const targetStory = allStories[activeStoryIndex]
    if (targetStory.is_me) return

    const tempId = `off_${Date.now()}`
    const replyContent = `Replied to your story "${targetStory.caption.substring(0, 30)}...": ${replyText}`

    try {
      if (user) {
        // Send to Supabase if online
        const { error } = await supabase.from('messages').insert({
          sender_id: user.id,
          receiver_id: targetStory.user_id,
          content: replyContent,
          type: 'text'
        })

        if (error) throw error
      } else {
        // If unauthenticated or offline, write to local db queue
        await offlineDB.saveMessage({
          id: tempId,
          sender_id: 'anonymous',
          receiver_id: targetStory.user_id,
          content: replyContent,
          type: 'text',
          status: 'pending',
          created_at: new Date().toISOString()
        })
      }
      toast.success(`Vibe reply sent to ${targetStory.user_name}! 💬`)
      setReplyText('')
      setActiveStoryIndex(null)
    } catch (err) {
      console.warn("Realtime sync failed, saving message locally:", err)
      if (user) {
        await offlineDB.saveMessage({
          id: tempId,
          sender_id: user.id,
          receiver_id: targetStory.user_id,
          content: replyContent,
          type: 'text',
          status: 'pending',
          created_at: new Date().toISOString()
        })
      }
      toast.success(`Vibe reply queued offline! ⏳`)
      setReplyText('')
      setActiveStoryIndex(null)
    }
  }

  return (
    <div className="flex gap-4 overflow-x-auto py-2 no-scrollbar px-1">
      {/* "You" Story Bubble */}
      <button 
        onClick={() => myStory ? setActiveStoryIndex(0) : setShowCreateStoryModal(true)}
        className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
      >
        <div className="relative">
          <div className={`p-[3px] rounded-[1.8rem] transition-transform active:scale-90 ${
            myStory ? 'bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500' : 'bg-gray-800'
          }`}>
            <div className="p-[2px] bg-[#08080F] rounded-[1.6rem]">
              <img 
                src={myStory?.user_photo || user?.photos?.[0] || 'https://images.unsplash.com/photo-153571702451c-707ad0d8118d?w=100&h=100&fit=crop'} 
                className="w-16 h-16 rounded-[1.5rem] object-cover ring-1 ring-white/10"
                alt="You"
              />
            </div>
          </div>
          {!myStory && (
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#8B5CF6] rounded-full border-4 border-[#08080F] flex items-center justify-center text-white shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform">
              <Plus className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
        <span className="text-[10px] font-black uppercase tracking-tight text-gray-500">
          You
        </span>
      </button>

      {/* Demo Campus Stories */}
      {stories.map((story, index) => {
        const actualIndex = myStory ? index + 1 : index
        return (
          <button 
            key={story.id} 
            onClick={() => {
              // Mark story as read/seen locally
              setStories(prev => prev.map(s => s.id === story.id ? { ...s, has_unseen: false } : s))
              setActiveStoryIndex(actualIndex)
              setStoryProgress(0)
            }}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
          >
            <div className="relative">
              <div className={`p-[3px] rounded-[1.8rem] transition-transform active:scale-90 ${
                story.has_unseen 
                  ? 'bg-gradient-to-tr from-[#F59E0B] via-[#EC4899] to-[#8B5CF6] animate-pulse' 
                  : 'bg-white/10'
              }`}>
                <div className="p-[2px] bg-[#08080F] rounded-[1.6rem]">
                  <img 
                    src={story.user_photo} 
                    className="w-16 h-16 rounded-[1.5rem] object-cover"
                    alt={story.user_name}
                  />
                </div>
              </div>
            </div>
            <span className={`text-[10px] font-black uppercase tracking-tight ${story.has_unseen ? 'text-white' : 'text-gray-500'}`}>
              {story.user_name}
            </span>
          </button>
        )
      })}

      {/* ==================== CREATE STORY MODAL ==================== */}
      {showCreateStoryModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#0F0F1A] border border-white/10 rounded-[2.5rem] w-full max-w-md p-6 relative shadow-2xl">
            <button 
              onClick={() => setShowCreateStoryModal(false)}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h2 className="font-syne font-black text-xl text-white uppercase tracking-tight">Post a Vibe Story</h2>
            </div>

            <div className="space-y-5">
              {/* Media Selection Helper */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-2">Select Story Photo</label>
                <div className="grid grid-cols-2 gap-2">
                  {STORY_PRESET_IMAGES.map((img) => (
                    <button
                      key={img.name}
                      onClick={() => setCustomImageUrl(img.url)}
                      className={`p-3 rounded-2xl border text-[10px] font-bold transition-all text-left flex flex-col justify-end h-20 relative overflow-hidden ${
                        customImageUrl === img.url 
                          ? 'border-purple-500 text-white ring-2 ring-purple-500/20' 
                          : 'border-white/5 text-gray-400 hover:border-white/10 hover:text-white'
                      }`}
                    >
                      <img src={img.url} alt={img.name} className="absolute inset-0 w-full h-full object-cover opacity-40 hover:opacity-50 transition-opacity" />
                      <span className="relative z-10 bg-black/60 px-2 py-0.5 rounded-lg border border-white/5">{img.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Caption */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-2">Caption</label>
                <textarea
                  value={customCaption}
                  onChange={e => setCustomCaption(e.target.value)}
                  placeholder="What's happening right now? (e.g. library grind, party time, highway cruise...)"
                  className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 transition-all resize-none h-24"
                  maxLength={100}
                />
              </div>

              <button
                onClick={handlePostStory}
                className="w-full py-4 rounded-2xl grad-bg text-white text-[11px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-purple-500/20"
              >
                Publish Vibe 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== INSTAGRAM-STYLE STORY VIEWER MODAL ==================== */}
      {activeStoryIndex !== null && (
        <div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 animate-fade-in">
          
          {/* Side control buttons for large screens */}
          <button 
            onClick={handlePrevStory}
            className="hidden sm:flex absolute left-8 w-12 h-12 bg-white/5 hover:bg-white/10 rounded-full items-center justify-center text-white/70 hover:text-white transition-all border border-white/5"
            title="Previous Story"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button 
            onClick={handleNextStory}
            className="hidden sm:flex absolute right-8 w-12 h-12 bg-white/5 hover:bg-white/10 rounded-full items-center justify-center text-white/70 hover:text-white transition-all border border-white/5"
            title="Next Story"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Central Card container */}
          <div className="w-full max-w-lg h-full sm:h-[85vh] aspect-[9/16] bg-[#0c0c16] sm:rounded-[2.5rem] relative overflow-hidden flex flex-col justify-between shadow-2xl border border-white/5">
            
            {/* Background cover image blurring */}
            <div className="absolute inset-0 pointer-events-none opacity-30 blur-2xl">
              <img src={allStories[activeStoryIndex].media} className="w-full h-full object-cover" alt="" />
            </div>

            {/* Top Bar Header & Progress Trackers */}
            <div className="absolute top-0 left-0 right-0 p-4 z-20 bg-gradient-to-b from-black/85 via-black/40 to-transparent">
              {/* Progress lines */}
              <div className="flex gap-1.5 mb-4">
                {allStories.map((s, idx) => {
                  let width = '0%'
                  if (idx < activeStoryIndex) width = '100%'
                  if (idx === activeStoryIndex) width = `${storyProgress}%`
                  return (
                    <div key={s.id} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-75"
                        style={{ width }}
                      />
                    </div>
                  )
                })}
              </div>

              {/* Host Profile Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img 
                    src={allStories[activeStoryIndex].user_photo} 
                    className="w-10 h-10 rounded-xl object-cover ring-2 ring-purple-500/40" 
                    alt="" 
                  />
                  <div className="text-left">
                    <p className="text-white text-xs font-black uppercase tracking-wider">{allStories[activeStoryIndex].user_name}</p>
                    <p className="text-white/40 text-[9px] font-bold mt-0.5">{allStories[activeStoryIndex].time}</p>
                  </div>
                </div>

                <button 
                  onClick={() => setActiveStoryIndex(null)}
                  className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white/60 hover:text-white transition-colors border border-white/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Story Media Viewer & Hold-to-Pause Touch Controller */}
            <div 
              className="flex-1 flex items-center justify-center relative cursor-pointer mt-16"
              onMouseDown={() => setIsPaused(true)}
              onMouseUp={() => setIsPaused(false)}
              onTouchStart={() => setIsPaused(true)}
              onTouchEnd={() => setIsPaused(false)}
            >
              {/* Tap Left / Right Hotspots (Mobile) */}
              <div className="absolute inset-y-0 left-0 w-1/3 z-30" onClick={(e) => { e.stopPropagation(); handlePrevStory(); }} />
              <div className="absolute inset-y-0 right-0 w-1/3 z-30" onClick={(e) => { e.stopPropagation(); handleNextStory(); }} />

              <img 
                src={allStories[activeStoryIndex].media} 
                className="w-full h-full object-cover select-none pointer-events-none" 
                alt="Story content" 
              />

              {/* Pause status indicator overlay */}
              {isPaused && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-2 bg-black/70 backdrop-blur-sm rounded-xl text-[9px] font-black uppercase tracking-wider text-purple-400 border border-purple-500/20 select-none animate-pulse">
                  Paused ⏸
                </div>
              )}

              {/* Caption Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent text-left">
                <p className="text-white text-sm font-bold leading-relaxed">{allStories[activeStoryIndex].caption}</p>
              </div>
            </div>

            {/* Reply Input Bar (DMs sender) */}
            <div className="p-4 bg-black/90 border-t border-white/5 relative z-40">
              {allStories[activeStoryIndex].is_me ? (
                <p className="text-[10px] text-center text-gray-500 font-bold uppercase tracking-wider py-2">
                  This is your story. Swipe up to see viewers (Demo)
                </p>
              ) : (
                <form onSubmit={handleSendReply} className="flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder={`Reply to ${allStories[activeStoryIndex].user_name}...`}
                    className="flex-1 bg-white/5 border border-white/5 rounded-2xl py-3 px-4 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/30 transition-all"
                  />
                  <button 
                    type="submit"
                    className="w-10 h-10 rounded-full grad-bg flex items-center justify-center text-white active:scale-95 transition-transform"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
