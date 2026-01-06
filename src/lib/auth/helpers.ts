import { createClient } from '@/lib/supabase/server'

export async function getUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function getUserProfile() {
  const supabase = await createClient()
  const user = await getUser()
  
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}

export async function getUserRole(): Promise<'gerente' | 'vendedor' | 'cliente' | null> {
  const profile = await getUserProfile()
  return profile?.role || null
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
}
