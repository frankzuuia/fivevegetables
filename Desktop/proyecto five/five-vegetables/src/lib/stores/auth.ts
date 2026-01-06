import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '@supabase/supabase-js'
import type { Profile, UserRole } from '@/types/database'

interface AuthState {
  user: User | null
  profile: Profile | null
  role: UserRole | null
  storeId: string | null
  isHydrated: boolean
}

interface AuthActions {
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  clearAuth: () => void
  setHydrated: (hydrated: boolean) => void
}

type AuthStore = AuthState & AuthActions

const initialState: AuthState = {
  user: null,
  profile: null,
  role: null,
  storeId: null,
  isHydrated: false,
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,
      
      setUser: (user) => set({ user }),
      
      setProfile: (profile) =>
        set({
          profile,
          role: profile?.role ?? null,
          storeId: profile?.store_id ?? null,
        }),
      
      clearAuth: () => set(initialState),
      
      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
    }),
    {
      name: 'five-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        role: state.role,
        storeId: state.storeId,
        // NO persistir isHydrated
      }),
    }
  )
)
