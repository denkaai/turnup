import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { toast } from 'sonner'
import { Check } from 'lucide-react'

interface FollowButtonProps {
  targetId: string
  className?: string
}

export default function FollowButton({ targetId, className = '' }: FollowButtonProps) {
  const { user } = useAuthStore()
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && targetId) {
      checkFollow()
    } else {
      setLoading(false)
    }
  }, [user, targetId])

  const checkFollow = async () => {
    if (!user || targetId.startsWith('d')) { // Skip for demo users
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', targetId)
      .maybeSingle()
    
    setFollowing(!!data)
    setLoading(false)
  }

  const toggleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) return toast.error('Sign in to follow comrades!')
    if (targetId.startsWith('d')) return toast.info('Demo user - follows not saved')

    try {
      if (following) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetId)
        setFollowing(false)
        toast.info('Unfollowed comrade')
      } else {
        await supabase
          .from('follows')
          .insert({ follower_id: user.id, following_id: targetId })
        setFollowing(true)
        toast.success('Following comrade! 🔥')
      }
    } catch (err) {
      toast.error('Failed to update follow')
    }
  }

  if (loading) return <div className={`w-24 h-8 animate-pulse bg-white/5 rounded-full ${className}`} />

  return (
    <button
      onClick={toggleFollow}
      className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
        following
          ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
          : 'border border-purple-500/50 text-purple-400 hover:bg-purple-500/10'
      } ${className}`}
    >
      {following ? (
        <span className="flex items-center gap-1">Following <Check className="w-3 h-3" /></span>
      ) : (
        'Follow'
      )}
    </button>
  )
}
