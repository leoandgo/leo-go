import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { GlobalSettings } from '@/types/database'

export async function GET() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: settingsData, error } = await (supabase.from('global_settings') as any)
      .select('key, value, text_value')

    if (error) {
      console.error('Error fetching settings:', error)
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    const settings: GlobalSettings = {
      unlock_fee: 1.49,
      extra_km_rate: 0.30,
      km_per_day: 100,
      airport_option: 12.99,
      predelivery_option: 10.00,
      badge_color_xs: '#653A8E',
      badge_color_s: '#653A8E',
      badge_color_m: '#653A8E',
      badge_color_l: '#653A8E',
      badge_color_xl: '#653A8E',
      monthly_rental_url: '',
    }

    settingsData?.forEach((s: { key: string; value: number; text_value: string | null }) => {
      // Handle numeric settings
      if (['unlock_fee', 'extra_km_rate', 'km_per_day', 'airport_option', 'predelivery_option'].includes(s.key)) {
        (settings as unknown as Record<string, number>)[s.key] = s.value
      }
      // Handle text settings (badge colors, URLs)
      if (['badge_color_xs', 'badge_color_s', 'badge_color_m', 'badge_color_l', 'badge_color_xl', 'monthly_rental_url'].includes(s.key) && s.text_value) {
        (settings as unknown as Record<string, string>)[s.key] = s.text_value
      }
    })

    return NextResponse.json({ settings }, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' }
    })
  } catch (error) {
    console.error('Settings API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, key, value, text_value } = body

    if (!id || !key) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Determine what to update based on the key type
    const isTextSetting = key.startsWith('badge_color_') || key === 'monthly_rental_url'

    const updateData = isTextSetting
      ? { text_value: text_value ?? '' }
      : { value: value ?? 0 }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('global_settings') as any)
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Error updating setting:', error)
      return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
