import { NextRequest, NextResponse } from 'next/server'
import { computeTripPrice } from '@/lib/pricing'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      vehicleId,
      durationMinutes,
      distanceKm,
      airportDeparture,
      airportArrival,
      predeliveryOption,
    } = body

    if (!vehicleId || !durationMinutes || durationMinutes <= 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const calculation = await computeTripPrice({
      vehicleId,
      durationMinutes,
      distanceKm,
      airportDeparture,
      airportArrival,
      predeliveryOption,
    })

    if (!calculation) {
      return NextResponse.json({ error: 'Unknown vehicle' }, { status: 400 })
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
