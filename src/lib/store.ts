import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/supabase'

interface AuthState {
  user: any | null
  profile: Profile | null
  loading: boolean
  activeChatId: string | null
  setUser: (user: any) => void
  setProfile: (profile: Profile | null) => void
  signOut: () => Promise<void>
  fetchProfile: (userId: string) => Promise<Profile | null>
  setActiveChatId: (id: string | null) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: false,
  activeChatId: null,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setActiveChatId: (activeChatId) => set({ activeChatId }),
  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null, loading: false })
  },
  fetchProfile: async (userId: string) => {
    // Serve cache instantly
    const cached = localStorage.getItem(`turnup_profile_${userId}`)
    if (cached) {
      try {
        const cachedProfile = JSON.parse(cached)
        set({ profile: cachedProfile, loading: false })
      } catch (e) {}
    } else {
      set({ loading: true })
    }

    // Background fetch
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      if (data && !error) {
        localStorage.setItem(`turnup_profile_${userId}`, JSON.stringify(data))
        set({ profile: data, loading: false })
        return data
      }
      if (error) throw error
    } catch (err) {
      console.warn('Profile sync failed silently:', err)
    } finally {
      set({ loading: false })
    }
    return get().profile
  },
}))
