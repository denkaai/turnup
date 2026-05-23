import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'

export default function StoryBubbles() {
  const { user } = useAuthStore()
  const myProfile = useAuthStore(state => state.profile)
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    const fetchStories = async () => {
      if (!user) return
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .limit(10)
      if (error) {
        console.error('Failed to load stories', error)
        return
      }
      // Filter out invalid photos
      const valid = (data as any[]).filter(p => {
        const photo = p.photos?.[0]
        if (!photo) return false
        if (photo.includes('toptank') || photo.includes('product') || photo.includes('logo')) return false
        return true
      })
      setUsers(valid)
    }
    fetchStories()
  }, [user])

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-2">
      <div className="flex gap-4 px-1 w-max">
        {/* Your own avatar with plus button */}
        <div className="flex flex-col items-center gap-1.5 cursor-pointer">
          <div className="relative">
            <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-purple-500 to-pink-500">
              <img
                src={myProfile?.photos?.[0] ?? ''}
                className="w-full h-full rounded-full object-cover border-2 border-[#090912]"
                alt="You"
              />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-purple-600 rounded-full border-2 border-[#090912] flex items-center justify-center">
              <span className="text-white text-[10px] font-black">+</span>
            </div>
          </div>
          <span className="text-[9px] font-black uppercase tracking-wider text-gray-400">YOU</span>
        </div>
        {/* Other users */}
        {users.map(u => (
          <div key={u.id} className="flex flex-col items-center gap-1.5 cursor-pointer group">
            {/* Determine if user is active within last 24h */}
            {(() => {
              const isActive = u.last_seen && (new Date(u.last_seen).getTime() > Date.now() - 24 * 60 * 60 * 1000);
              const borderClass = isActive ? "bg-gradient-to-tr from-purple-500 to-pink-500 group-hover:from-pink-500 group-hover:to-purple-500" : "bg-gray-300";
              return (
                <div className={`w-16 h-16 rounded-full p-[2px] ${borderClass} transition-all duration-500`}> 
                  <img
                    src={u.photos?.[0]}
                    className="w-full h-full rounded-full object-cover border-2 border-[#090912]"
                    alt={u.name}
                  />
                </div>
              );
            })()}
            <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 group-hover:text-white transition-colors">
              {u.name?.split(' ')[0].toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
