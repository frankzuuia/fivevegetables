import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/auth'
import type { User } from '@supabase/supabase-js'
import type { Profile, UserRole } from '@/types/database'
import { getUserProfile, signOut as supabaseSignOut } from '@/lib/auth/helpers'

interface UseAuthReturn {
  user: User | null
  profile: Profile | null
  role: UserRole | null
  storeId: string | null
  isAuthenticated: boolean
  isLoading: boolean
  signOut: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const authStore = useAuthStore()
  
  // Query para obtener profile actualizado
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', authStore.user?.id] as const,
    queryFn: async (): Promise<Profile | null> => {
      const profileData = await getUserProfile()
      if (profileData) {
        authStore.setProfile(profileData)
      }
      return profileData
    },
    enabled: !!authStore.user && authStore.isHydrated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
  
  const handleSignOut = async () => {
    await supabaseSignOut()
    authStore.clearAuth()
  }
  
  return {
    user: authStore.user,
    profile: profile || authStore.profile,
    role: profile?.role || authStore.role,
    storeId: profile?.store_id || authStore.storeId,
    isAuthenticated: !!authStore.user,
    isLoading,
    signOut: handleSignOut,
  }
}
