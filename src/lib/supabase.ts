import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Profile = {
  id: string
  name: string
  age: number
  campus: string
  course: string
  year: number
  bio: string
  photos: string[]
  interests: string[]
  verified: boolean
  premium: boolean
  premium_until: string | null
  gender: string
  looking_for: string
  vibe?: string
  weekend_plan?: string
  relationship_goal?: string
  whatsapp_number?: string
  created_at: string
}

export type Match = {
  id: string
  user1_id: string
  user2_id: string
  created_at: string
  profile?: Profile
}

export type Message = {
  id: string
  match_id: string
  sender_id: string
  content: string
  read: boolean
  created_at: string
}

export type Event = {
  id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  campus: string
  attendees: number
  max_attendees: number
  image_url: string
  price: number
  organizer: string
  created_at: string
}

export type SwipeAction = 'like' | 'pass' | 'superlike'
