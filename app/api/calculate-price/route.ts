import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { PriceCalculation } from '@/types/database'

// In-memory settings cache (refreshes every 5 minutes)
let cachedSettings: Record<string, number> | null = null
let settingsCachedAt = 0
const SETTINGS_TTL = 5 * 60 * 1000

async function getSettings(): Promise<Record<string, number>> {
  if (cachedSettings && Date.now() - settingsCachedAt < SETTINGS_TTL) {
    return cachedSettings
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from('global_settings') as any)
    .select('key, value')
  const settings: Record<string, number> = {}
  data?.forEach((s: { key: string; value: number }) => {
    settings[s.key] = s.value
  })
  cachedSettings = settings
  settingsCachedAt = Date.now()
  return settings
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      pricingGridId,
      durationMinutes,
      distanceKm,
      airportDeparture,
      airportArrival,
      predeliveryOption,
    } = body

    if (!pricingGridId || !durationMinutes || durationMinutes <= 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const settings = await getSettings()

    const unlockFee = settings['unlock_fee'] || 1.49
    const extraKmRate = settings['extra_km_rate'] || 0.30
    const kmPerDay = settings['km_per_day'] || 100
    const airportPrice = settings['airport_option'] || 12.99
    const predeliveryPrice = settings['predelivery_option'] || 10.00

    // Single query: get exact match + nearest higher in one call
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: priceData } = await (supabase.from('minute_prices') as any)
      .select('duration_minutes, price_ttc, km_included')
      .eq('pricing_grid_id', pricingGridId)
      .gte('duration_minutes', durationMinutes)
      .order('duration_minutes', { ascending: true })
      .limit(2)

    let basePrice = 0
    let kmIncluded = 0

    if (priceData && priceData.length > 0) {
      // First result is the exact match or nearest higher — use it
      const exact = priceData.find((p: { duration_minutes: number }) => p.duration_minutes === durationMinutes)
      const nearest = priceData[0]
      // Pick the cheaper of exact vs nearest-higher
      if (exact && exact.price_ttc <= nearest.price_ttc) {
        basePrice = exact.price_ttc
        kmIncluded = exact.km_included
      } else {
        basePrice = nearest.price_ttc
        kmIncluded = nearest.km_included
      }
    } else {
      // Duration exceeds max in table — use the highest available row
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: maxRow } = await (supabase.from('minute_prices') as any)
        .select('duration_minutes, price_ttc, km_included')
        .eq('pricing_grid_id', pricingGridId)
        .order('duration_minutes', { ascending: false })
        .limit(1)

      if (maxRow && maxRow.length > 0) {
        const ppm = maxRow[0].price_ttc / maxRow[0].duration_minutes
        basePrice = Math.round(durationMinutes * ppm * 100) / 100
        const daysStarted = Math.ceil(durationMinutes / 1440)
        kmIncluded = daysStarted * kmPerDay
      } else {
        basePrice = durationMinutes * 0.34
        kmIncluded = Math.ceil(durationMinutes / 1440) * kmPerDay
      }
    }

    // Calculate extra km
    const extraKm = Math.max(0, distanceKm - kmIncluded)
    const extraKmCost = Math.round(extraKm * extraKmRate * 100) / 100

    // Calculate options cost
    // Each airport option (departure/arrival) adds the airport price separately
    const airportDepartureCost = airportDeparture ? airportPrice : 0
    const airportArrivalCost = airportArrival ? airportPrice : 0
    const airportCost = airportDepartureCost + airportArrivalCost
    const predeliveryCost = predeliveryOption ? predeliveryPrice : 0

    // Total price
    const totalPrice = Math.round(
      (basePrice + unlockFee + extraKmCost + airportCost + predeliveryCost) * 100
    ) / 100

    const calculation: PriceCalculation = {
      basePrice,
      unlockFee,
      kmIncluded,
      extraKm,
      extraKmCost,
      airportCost,
      airportDepartureCost,
      airportArrivalCost,
      predeliveryCost,
      totalPrice,
      durationMinutes,
    }

    return NextResponse.json({ calculation })
  } catch (error) {
    console.error('Price calculation error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate price' },
      { status: 500 }
    )
  }
}
