import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'

const STATUSES = ['pending', 'contacted', 'closed']

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request)
    if (auth.error) return auth.error

    const { id } = await params
    const body = await request.json()

    // Only the follow-up status can be changed from the back-office
    if (!STATUSES.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const { data, error } = await auth.client
      .from('contact_requests')
      .update({ status: body.status })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating contact:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ contact: data })
  } catch (error) {
    console.error('Error in PATCH /api/contacts/[id]:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
