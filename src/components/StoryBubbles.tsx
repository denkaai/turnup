import { Plus } from 'lucide-react'

interface Story {
  id: string
  user_id: string
  user_name: string
  user_photo: string
  has_unseen: boolean
  is_me?: boolean
}

const DEMO_STORIES: Story[] = [
  { id: 'me', user_id: 'me', user_name: 'You', user_photo: 'https://images.unsplash.com/photo-153571702451c-707ad0d8118d?w=100&h=100&fit=crop', has_unseen: false, is_me: true },
  { id: 's1', user_id: 'u1', user_name: 'Amina', user_photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop', has_unseen: true },
  { id: 's2', user_id: 'u2', user_name: 'Brian', user_photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop', has_unseen: true },
  { id: 's3', user_id: 'u3', user_name: 'Cynthia', user_photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop', has_unseen: false },
  { id: 's4', user_id: 'u4', user_name: 'David', user_photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop', has_unseen: true },
  { id: 's5', user_id: 'u5', user_name: 'Esther', user_photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop', has_unseen: false },
]

export default function StoryBubbles() {
  return (
    <div className="flex gap-4 overflow-x-auto py-2 no-scrollbar px-1">
      {DEMO_STORIES.map((story) => (
        <button 
          key={story.id} 
          className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
        >
          <div className="relative">
            <div className={`p-[3px] rounded-[1.8rem] transition-transform active:scale-90 ${
              story.is_me 
                ? 'bg-gray-800' 
                : story.has_unseen 
                  ? 'bg-gradient-to-tr from-[#F59E0B] via-[#EC4899] to-[#8B5CF6]' 
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
            
            {story.is_me && (
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#8B5CF6] rounded-full border-4 border-[#08080F] flex items-center justify-center text-white">
                <Plus className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
          <span className={`text-[10px] font-black uppercase tracking-tight ${story.has_unseen ? 'text-white' : 'text-gray-500'}`}>
            {story.user_name}
          </span>
        </button>
      ))}
    </div>
  )
}
