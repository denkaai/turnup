import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/supabase'

interface AuthState {
  user: any | null
  profile: Profile | null
  loading: boolean
  setUser: (user: any) => void
  setProfile: (profile: Profile | null) => void
  signOut: () => Promise<void>
  fetchProfile: (userId: string) => Promise<Profile | null>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: false,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null, loading: false })
  },
  fetchProfile: async (userId: string) => {
    set({ loading: true })
    try {
      const fetchPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Fetch timeout')), 5000)
      )

      const res = await Promise.race([fetchPromise, timeoutPromise]) as any
      const { data, error } = res
      
      if (error) console.error('fetchProfile error:', error.message)
      const prof = data || null
      set({ profile: prof })
      return prof
    } catch (err: any) {
      console.error('fetchProfile exception or timeout:', err.message || err)
      return null
    } finally {
      set({ loading: false })
    }
  },
}))
