import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import type { Story } from '@/lib/supabase'
import StoryViewer from './StoryViewer'
import CreateStoryModal from './CreateStoryModal'

interface GroupedStory {
  userId: string
  userName: string
  userPhoto: string
  items: Array<{
    id: string
    image_url: string
    caption: string
    created_at: string
  }>
}

export default function StoryBubbles() {
  const { user } = useAuthStore()
  const myProfile = useAuthStore((state) => state.profile)
  const [groupedStories, setGroupedStories] = useState<GroupedStory[]>([])
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set())

  // Load seen story IDs from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('turnup_seen_stories')
      if (raw) setSeenIds(new Set(JSON.parse(raw)))
    } catch { /* ignore */ }
  }, [])

  const fetchStories = useCallback(async () => {
    if (!user) return

    let stories: Story[] = []

    // 1. Try Supabase
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*, profile:profiles(name, photos)')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })

      if (!error && data && data.length > 0) {
        stories = data as Story[]
      } else {
        throw new Error('No stories or query failed')
      }
    } catch {
      // 2. Fallback: generate mock stories from profiles
      try {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', user.id)
          .limit(10)

        if (profiles && profiles.length > 0) {
          const validProfiles = profiles.filter((p: any) => {
            const photo = p.photos?.[0]
            if (!photo) return false
            if (photo.includes('toptank') || photo.includes('product') || photo.includes('logo')) return false
            return true
          })

          stories = validProfiles.map((p: any) => ({
            id: `mock-${p.id}`,
            user_id: p.id,
            image_url: p.photos?.[0] || '',
            caption: p.bio?.slice(0, 60) || '✨',
            created_at: new Date(Date.now() - Math.random() * 12 * 60 * 60 * 1000).toISOString(),
            expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
            profile: { name: p.name, photos: p.photos },
          }))
        }
      } catch (err) {
        console.warn('Failed to load profiles for mock stories:', err)
      }
    }

    // 3. Load localStorage stories
    try {
      const localRaw = localStorage.getItem('turnup_local_stories')
      if (localRaw) {
        const localStories: Story[] = JSON.parse(localRaw)
        const active = localStories.filter(
          (s) => new Date(s.expires_at).getTime() > Date.now()
        )
        stories = [...stories, ...active]
      }
    } catch { /* ignore */ }

    // 4. Group stories by user_id
    const groupMap = new Map<string, GroupedStory>()

    for (const story of stories) {
      // Skip own stories in the bubbles list (they see theirs via the "+" bubble)
      if (story.user_id === user.id) continue

      if (!groupMap.has(story.user_id)) {
        groupMap.set(story.user_id, {
          userId: story.user_id,
          userName: story.profile?.name || 'User',
          userPhoto: story.profile?.photos?.[0] || story.image_url,
          items: [],
        })
      }
      groupMap.get(story.user_id)!.items.push({
        id: story.id,
        image_url: story.image_url,
        caption: story.caption,
        created_at: story.created_at,
      })
    }

    setGroupedStories(Array.from(groupMap.values()))
  }, [user])

  useEffect(() => {
    fetchStories()
  }, [fetchStories])

  const hasUnseenStories = (group: GroupedStory): boolean => {
    return group.items.some((item) => !seenIds.has(item.id))
  }

  const openViewer = (index: number) => {
    setViewerIndex(index)
    setViewerOpen(true)
  }

  const handleViewerClose = () => {
    setViewerOpen(false)
    // Refresh seen IDs
    try {
      const raw = localStorage.getItem('turnup_seen_stories')
      if (raw) setSeenIds(new Set(JSON.parse(raw)))
    } catch { /* ignore */ }
  }

  return (
    <>
      <div className="w-full overflow-x-auto no-scrollbar py-2">
        <div className="flex gap-4 px-1 w-max">
          {/* Your own avatar with plus button */}
          <motion.div
            className="flex flex-col items-center gap-1.5 cursor-pointer"
            whileTap={{ scale: 0.9 }}
            onClick={() => setCreateOpen(true)}
          >
            <div className="relative">
              <div
                className="w-16 h-16 rounded-full border-[3px] border-[#BEFF00] overflow-hidden"
                style={{ boxShadow: '2px 2px 0px #000' }}
              >
                <img
                  src={myProfile?.photos?.[0] ?? ''}
                  className="w-full h-full rounded-full object-cover"
                  alt="You"
                />
              </div>
              <div
                className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-[#BEFF00] rounded-full border-[3px] border-[#0D0D0D] flex items-center justify-center"
              >
                <span className="text-black text-[11px] font-black leading-none">+</span>
              </div>
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider text-gray-400">
              YOU
            </span>
          </motion.div>

          {/* Other users with stories */}
          {groupedStories.map((group, index) => {
            const unseen = hasUnseenStories(group)
            return (
              <motion.div
                key={group.userId}
                className="flex flex-col items-center gap-1.5 cursor-pointer group"
                whileTap={{ scale: 0.9 }}
                onClick={() => openViewer(index)}
              >
                <div
                  className={`w-16 h-16 rounded-full border-[3px] overflow-hidden transition-all duration-300 ${
                    unseen
                      ? 'border-[#BEFF00] group-hover:shadow-[0_0_12px_#BEFF00]'
                      : 'border-gray-600 group-hover:border-gray-400'
                  }`}
                  style={{ boxShadow: unseen ? '2px 2px 0px #000' : 'none' }}
                >
                  <img
                    src={group.userPhoto}
                    className="w-full h-full rounded-full object-cover"
                    alt={group.userName}
                  />
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 group-hover:text-white transition-colors">
                  {group.userName.split(' ')[0].toUpperCase()}
                </span>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Story Viewer */}
      {viewerOpen && groupedStories.length > 0 && (
        <StoryViewer
          stories={groupedStories}
          initialUserIndex={viewerIndex}
          onClose={handleViewerClose}
        />
      )}

      {/* Create Story Modal */}
      <CreateStoryModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onStoryCreated={() => {
          fetchStories()
        }}
      />
    </>
  )
}
