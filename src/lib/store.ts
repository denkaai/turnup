import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/supabase'

interface AuthState {
  user: any | null
  profile: Profile | null
  loading: boolean
  profileError: string | null
  activeChatId: string | null
  setUser: (user: any) => void
  setProfile: (profile: Profile | null) => void
  signOut: () => Promise<void>
  fetchProfile: (userId: string) => Promise<Profile | null>
  clearProfileError: () => void
  setActiveChatId: (id: string | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: false,
  profileError: null,
  activeChatId: null,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  clearProfileError: () => set({ profileError: null }),
  setActiveChatId: (activeChatId) => set({ activeChatId }),
  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null, loading: false, profileError: null })
  },
  fetchProfile: async (userId: string) => {
    set({ loading: true, profileError: null })
    try {
      const fetchPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      
      // Increased timeout to 15 seconds to support slower cellular connections gracefully
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Fetch timeout')), 15000)
      )

      const res = await Promise.race([fetchPromise, timeoutPromise]) as any
      const { data, error } = res
      
      if (error) {
        console.error('fetchProfile error:', error.message)
        throw new Error(error.message)
      }
      
      const prof = data || null
      set({ profile: prof, profileError: null })
      return prof
    } catch (err: any) {
      const errMsg = err.message || 'Failed to connect to TurnUp server'
      console.error('fetchProfile exception or timeout:', errMsg)
      set({ profileError: errMsg })
      throw err // Rethrow to let calling pages handle the latency gracefully
    } finally {
      set({ loading: false })
    }
  },
}))
