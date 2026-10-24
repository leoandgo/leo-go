'use client'

import { useState, useEffect, useCallback } from 'react'
import { Vehicle, PriceCalculation, GlobalSettings } from '@/types/database'
import VehicleSelector from './VehicleSelector'
import DateTimeSelector from './DateTimeSelector'
import DistanceInput from './DistanceInput'
import OptionsSelector from './OptionsSelector'
import PriceDisplay from './PriceDisplay'
import { useLanguage } from '@/lib/LanguageContext'

interface PriceSimulatorProps {
  vehicles: Vehicle[]
  settings: GlobalSettings
}

export default function PriceSimulator({ vehicles, settings }: PriceSimulatorProps) {
  const { t } = useLanguage()
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [durationMinutes, setDurationMinutes] = useState(0)
  const [departureDate, setDepartureDate] = useState<Date | null>(null)
  const [returnDate, setReturnDate] = useState<Date | null>(null)
  const [distanceKm, setDistanceKm] = useState(0)
  const [airportDeparture, setAirportDeparture] = useState(false)
  const [airportArrival, setAirportArrival] = useState(false)
  const [predeliveryOption, setPredeliveryOption] = useState(false)
  const [calculation, setCalculation] = useState<PriceCalculation | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  const calculatePrice = useCallback(async () => {
    if (!selectedVehicle || durationMinutes <= 0) {
      setCalculation(null)
      return
    }

    setIsCalculating(true)

    try {
      const response = await fetch('/api/calculate-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: selectedVehicle.id,
          durationMinutes,
          distanceKm,
          airportDeparture,
          airportArrival,
          predeliveryOption,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setCalculation(data.calculation)
      }
    } catch (error) {
      console.error('Error calculating price:', error)
    } finally {
      setIsCalculating(false)
    }
  }, [selectedVehicle, durationMinutes, distanceKm, airportDeparture, airportArrival, predeliveryOption])

  // Real-time price calculation on any data change
  useEffect(() => {
    const debounce = setTimeout(() => {
      calculatePrice()
    }, 800)
    return () => clearTimeout(debounce)
  }, [calculatePrice])

  const handleDurationChange = (minutes: number) => {
    setDurationMinutes(minutes)
  }

  const handleDatesChange = (departure: Date, returnDateTime: Date) => {
    setDepartureDate(departure)
    setReturnDate(returnDateTime)
  }

  const getDurationText = () => {
    if (durationMinutes <= 0) return ''
    const days = Math.floor(durationMinutes / 1440)
    const remainingMinutes = durationMinutes % 1440
    const hours = Math.floor(remainingMinutes / 60)
    const mins = remainingMinutes % 60

    let text = ''
    if (days > 0) text += `${days} ${days > 1 ? t('days') : t('day')} `
    if (hours > 0) text += `${hours} ${hours > 1 ? t('hours') : t('hour')} `
    if (mins > 0) {
      // Only add "et" if there's something before
      if (days > 0 || hours > 0) {
        text += `${t('and')} `
      }
      text += `${mins} ${t('min')}`
    }
    return text.trim() || `0 ${t('min')}`
  }

  // Badge colors from settings (with defaults)
  const badgeColors = {
    XS: settings.badge_color_xs || '#653A8E',
    S: settings.badge_color_s || '#653A8E',
    M: settings.badge_color_m || '#653A8E',
    L: settings.badge_color_l || '#653A8E',
    XL: settings.badge_color_xl || '#653A8E',
  }

  // Check if duration exceeds 30 days (43200 minutes)
  const isLongDuration = durationMinutes > 43200

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="main-title text-xl sm:text-2xl md:text-3xl lg:text-4xl mb-2 px-2">
          {t('mainTitle')}
        </h1>
      </div>

      {/* All sections in vertical stack */}
      <div className="space-y-4 sm:space-y-6">
        {/* Section 1: Vehicle Model */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6">
          <VehicleSelector
            vehicles={vehicles}
            selectedVehicle={selectedVehicle}
            onSelect={setSelectedVehicle}
            badgeColors={badgeColors}
          />
        </div>

        {/* Section 2: Date & Duration */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6">
          <DateTimeSelector
            onDurationChange={handleDurationChange}
            onDatesChange={handleDatesChange}
            monthlyRentalUrl={settings.monthly_rental_url}
          />
        </div>

        {/* Sections 3-5 hidden when duration is +30 days */}
        {!isLongDuration && (
          <>
            {/* Section 3: Distance */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6">
              <DistanceInput
                value={distanceKm}
                onChange={setDistanceKm}
              />
            </div>

            {/* Section 4: Options */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6">
              <OptionsSelector
                airportDepartureSelected={airportDeparture}
                airportArrivalSelected={airportArrival}
                predeliverySelected={predeliveryOption}
                onAirportDepartureChange={setAirportDeparture}
                onAirportArrivalChange={setAirportArrival}
                onPredeliveryChange={setPredeliveryOption}
                airportPrice={settings.airport_option}
                predeliveryPrice={settings.predelivery_option}
              />
            </div>

            {/* Section 5: Estimate & Contact */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6">
              <PriceDisplay
                calculation={calculation}
                durationText={getDurationText()}
                isLoading={isCalculating}
                vehicle={selectedVehicle}
                departureDate={departureDate}
                returnDate={returnDate}
                distanceKm={distanceKm}
                airportDeparture={airportDeparture}
                airportArrival={airportArrival}
                predeliveryOption={predeliveryOption}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
