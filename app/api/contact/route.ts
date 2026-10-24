import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendContactNotificationToAdmin, sendContactConfirmationToUser } from '@/lib/mailer'
import { computeTripPrice } from '@/lib/pricing'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      email,
      phone,
      vehicleId,
      durationMinutes,
      distanceKm,
      departureDateTime,
      returnDateTime,
      airportDeparture,
      airportArrival,
      predeliveryOption,
    } = body

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }

    if (!phone || phone.trim().length < 6) {
      return NextResponse.json(
        { error: 'Valid phone number is required' },
        { status: 400 }
      )
    }

    // Price is recomputed server-side; a client-supplied estimate is never stored
    let estimatedPrice: number | undefined
    if (vehicleId && durationMinutes > 0) {
      const calculation = await computeTripPrice({
        vehicleId,
        durationMinutes,
        distanceKm,
        airportDeparture,
        airportArrival,
        predeliveryOption,
      }).catch(() => null)
      estimatedPrice = calculation?.totalPrice
    }

    // Fetch vehicle name if vehicleId is provided
    let vehicleName: string | undefined
    if (vehicleId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: vehicleData } = await (supabase.from('vehicles') as any)
        .select('model_name')
        .eq('id', vehicleId)
        .single()
      vehicleName = vehicleData?.model_name
    }

    // Save contact request to database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (supabase.from('contact_requests') as any)
      .insert({
        email,
        phone: phone || null,
        vehicle_id: vehicleId || null,
        estimated_price: estimatedPrice || null,
        duration_minutes: durationMinutes || null,
        distance_km: distanceKm || null,
        departure_datetime: departureDateTime || null,
        return_datetime: returnDateTime || null,
        airport_option: airportDeparture || airportArrival || false,
        predelivery_option: predeliveryOption || false,
        status: 'pending',
      })

    if (insertError) {
      console.error('Error saving contact request:', insertError)
      return NextResponse.json(
        { error: 'Failed to save contact request' },
        { status: 500 }
      )
    }

    // Send email notifications
    const emailData = {
      email,
      phone,
      vehicleName,
      estimatedPrice,
      durationMinutes,
      distanceKm,
      departureDateTime,
      returnDateTime,
      airportOption: airportDeparture || airportArrival || false,
      predeliveryOption: predeliveryOption || false,
    }

    // Send emails in parallel (don't block the response)
    Promise.all([
      sendContactNotificationToAdmin(emailData),
      sendContactConfirmationToUser(emailData),
    ]).catch((error) => {
      console.error('Error sending emails:', error)
    })

    return NextResponse.json({
      success: true,
      message: 'Contact request saved successfully',
    })
  } catch (error) {
    console.error('Contact submission error:', error)
    return NextResponse.json(
      { error: 'Failed to submit contact request' },
      { status: 500 }
    )
  }
}
