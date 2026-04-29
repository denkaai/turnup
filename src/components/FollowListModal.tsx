import { useState, useEffect } from 'react'
import { supabase, Profile } from '@/lib/supabase'
import { X, Users, Loader2, ChevronRight } from 'lucide-react'
import FollowButton from './FollowButton'

interface FollowListModalProps {
  userId: string
  type: 'followers' | 'following'
  onClose: () => void
}

export default function FollowListModal({ userId, type, onClose }: FollowListModalProps) {
  const [list, setList] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchList()
  }, [userId, type])

  const fetchList = async () => {
    setLoading(true)
    try {
      const col = type === 'followers' ? 'follower_id' : 'following_id'
      const filterCol = type === 'followers' ? 'following_id' : 'follower_id'
      
      const { data: connections } = await supabase
        .from('follows')
        .select(col)
        .eq(filterCol, userId)
      
      const ids = connections?.map(c => (c as any)[col]) || []
      
      if (ids.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', ids)
        if (profiles) setList(profiles)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="card w-full max-w-md p-6 sm:p-8 animate-fade-in relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 grad-bg" />
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="font-syne font-bold text-2xl text-white tracking-tight capitalize">{type}</h2>
            <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">Comrades on TurnUp</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-400 mb-2" />
              <p className="text-gray-600 text-xs font-bold uppercase tracking-widest">Loading comrades...</p>
            </div>
          ) : list.length === 0 ? (
            <div className="text-center py-12 opacity-40">
              <Users className="w-12 h-12 mx-auto mb-4" />
              <p className="text-sm font-medium text-white mb-1">No {type} yet</p>
              <p className="text-xs">Time to explore and connect! 🔥</p>
            </div>
          ) : (
            list.map(u => (
              <div
                key={u.id}
                className="w-full flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-left group"
              >
                <img src={u.photos?.[0]} className="w-12 h-12 rounded-xl object-cover" alt={u.name} />
                <div className="flex-1">
                  <p className="text-white font-bold text-sm group-hover:text-purple-400 transition-colors">{u.name}</p>
                  <p className="text-gray-500 text-[10px] uppercase tracking-wider">{u.campus}</p>
                </div>
                <FollowButton targetId={u.id} className="scale-90" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
