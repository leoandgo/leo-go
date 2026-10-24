import { supabase } from '@/lib/supabase'

// Calls an admin API route with the signed-in user's access token
export async function adminFetch(input: string, init: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const headers = new Headers(init.headers)
  if (session) {
    headers.set('Authorization', `Bearer ${session.access_token}`)
  }
  return fetch(input, { ...init, headers })
}

// True when the signed-in user is listed in admin_users
export async function isAdmin(userId: string): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from('admin_users' as any) as any)
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()
  return !!data
}
