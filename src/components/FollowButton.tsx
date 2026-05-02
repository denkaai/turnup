import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { toast } from 'sonner'
import { Check, Plus, X } from 'lucide-react'

interface FollowButtonProps {
  targetId: string
  className?: string
  hideIfSelf?: boolean
}

export default function FollowButton({ targetId, className = '', hideIfSelf = true }: FollowButtonProps) {
  const { user } = useAuthStore()
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (user && targetId) {
      checkFollow()
    } else {
      setLoading(false)
    }
  }, [user, targetId])

  const checkFollow = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser || !targetId) {
      setLoading(false)
      return
    }
    const { data, error } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', currentUser.id)
      .eq('following_id', targetId)
      .maybeSingle() // Using maybeSingle to handle 0 rows gracefully without error
    
    if (error) console.error('Follow Check Error:', error.message)
    setFollowing(!!data)
    setLoading(false)
  }

  const handleAction = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) return toast.error('Sign in to follow comrades!')
    
    if (following) {
      setConfirming(true)
    } else {
      await follow()
    }
  }

  const follow = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser || !targetId) return
    
    try {
      setFollowing(true) // Instant update
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: currentUser.id, following_id: targetId })
      
      if (error) {
        console.error('FOLLOW_INSERT_ERROR:', error) // Exact log as requested
        setFollowing(false)
        toast.error('Failed to follow: ' + error.message)
      }
    } catch (err) {
      console.error('FOLLOW_EXCEPTION:', err)
      setFollowing(false)
      toast.error('An error occurred')
    }
  }

  const unfollow = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser || !targetId) return

    try {
      setFollowing(false) // Instant update
      setConfirming(false)
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUser.id)
        .eq('following_id', targetId)
      
      if (error) {
        console.error('FOLLOW_DELETE_ERROR:', error)
        setFollowing(true)
        toast.error('Failed to unfollow: ' + error.message)
      } else {
        toast.info('Unfollowed comrade')
      }
    } catch (err) {
      console.error('FOLLOW_UNFOLLOW_EXCEPTION:', err)
      setFollowing(true)
      toast.error('An error occurred')
    }
  }

  if (hideIfSelf && user?.id === targetId) return null
  if (loading) return <div className={`w-24 h-8 animate-pulse bg-white/5 rounded-full ${className}`} />

  return (
    <div className="relative inline-block">
      <button
        onClick={handleAction}
        className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${
          following
            ? 'grad-bg text-white shadow-lg shadow-purple-500/20'
            : 'border border-purple-500/50 text-purple-400 hover:bg-purple-500/10'
        } ${className}`}
      >
        {following ? (
          <>Following ✓ <Check className="w-3 h-3" /></>
        ) : (
          <>Follow + <Plus className="w-3 h-3" /></>
        )}
      </button>

      {confirming && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl z-[110] flex flex-col items-center min-w-[100px] animate-slide-up">
          <p className="text-[9px] font-black uppercase text-gray-400 mb-2">Unfollow?</p>
          <div className="flex gap-2 w-full">
            <button 
              onClick={unfollow}
              className="flex-1 py-1 rounded-lg bg-red-500/20 text-red-500 text-[8px] font-bold hover:bg-red-500/30 transition-all uppercase"
            >
              Yes
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setConfirming(false); }}
              className="flex-1 py-1 rounded-lg bg-white/5 text-gray-400 text-[8px] font-bold hover:bg-white/10 transition-all uppercase"
            >
              No
            </button>
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[#1a1a2e]" />
        </div>
      )}
    </div>
  )
}
