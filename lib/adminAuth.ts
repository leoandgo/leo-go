import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

type AdminAuthResult =
  | { client: SupabaseClient; error?: undefined }
  | { client?: undefined; error: NextResponse }

// Verifies that the request comes from a signed-in admin (listed in admin_users).
// The returned client acts as that user, so database RLS policies still apply.
export async function requireAdmin(request: NextRequest): Promise<AdminAuthResult> {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    }
  )

  const { data: { user }, error: userError } = await client.auth.getUser(token)
  if (userError || !user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const { data: admin } = await client
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!admin) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { client }
}
