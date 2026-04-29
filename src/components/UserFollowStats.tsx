import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import FollowListModal from './FollowListModal'

interface UserFollowStatsProps {
  userId: string
  className?: string
}

export default function UserFollowStats({ userId, className = '' }: UserFollowStatsProps) {
  const [count, setCount] = useState(0)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (!userId) return
    fetchCount()

    const channel = supabase
      .channel(`follows:${userId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'follows',
        filter: `following_id=eq.${userId}`
      }, () => {
        fetchCount()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  const fetchCount = async () => {
    const { count, error } = await supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('following_id', userId)
    
    if (error) console.error('Error fetching count:', error)
    setCount(count || 0)
  }

  return (
    <>
      <button 
        onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
        className={`text-[10px] text-gray-500 font-bold hover:text-purple-400 transition-colors ${className}`}
      >
        {count} {count === 1 ? 'follower' : 'followers'}
      </button>

      {showModal && (
        <FollowListModal 
          userId={userId} 
          type="followers" 
          onClose={() => setShowModal(false)} 
        />
      )}
    </>
  )
}
