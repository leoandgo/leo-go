'use client'

import { useRef } from 'react'
import { Vehicle } from '@/types/database'
import Image from 'next/image'
import { Car } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'

interface BadgeColors {
  XS: string
  S: string
  M: string
  L: string
  XL: string
}

interface VehicleSelectorProps {
  vehicles: Vehicle[]
  selectedVehicle: Vehicle | null
  onSelect: (vehicle: Vehicle) => void
  badgeColors?: BadgeColors
}

export default function VehicleSelector({ vehicles, selectedVehicle, onSelect, badgeColors }: VehicleSelectorProps) {
  const { t } = useLanguage()
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const scrollThreshold = 10 // pixels of movement to consider it a scroll

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    }
  }

  const handleTouchEnd = (e: React.TouchEvent, vehicle: Vehicle) => {
    if (!touchStartRef.current) {
      onSelect(vehicle)
      return
    }

    const touchEnd = e.changedTouches[0]
    const deltaX = Math.abs(touchEnd.clientX - touchStartRef.current.x)
    const deltaY = Math.abs(touchEnd.clientY - touchStartRef.current.y)

    // Only select if the touch didn't move significantly (not a scroll)
    if (deltaX < scrollThreshold && deltaY < scrollThreshold) {
      onSelect(vehicle)
    }

    touchStartRef.current = null
  }

  const handleClick = (e: React.MouseEvent, vehicle: Vehicle) => {
    // Prevent double-firing on touch devices
    if (e.detail === 0) return // Touch events have detail = 0
    onSelect(vehicle)
  }

  // Default colors if not provided
  const colors = badgeColors || {
    XS: '#653A8E',
    S: '#653A8E',
    M: '#653A8E',
    L: '#653A8E',
    XL: '#653A8E',
  }

  const getBadgeColor = (vehicle: Vehicle): string => {
    // Per-vehicle badge_color takes priority over global category color
    if (vehicle.badge_color) return vehicle.badge_color
    return colors[vehicle.size_category as keyof BadgeColors] || '#653A8E'
  }

  return (
    <div className="mb-4 sm:mb-8">
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
        <Car className="text-[#653A8E] flex-shrink-0" size={22} />
        {t('desiredVehicle')}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
        {vehicles.map((vehicle) => {
          const badgeColor = getBadgeColor(vehicle)
          return (
            <div
              key={vehicle.id}
              onClick={(e) => handleClick(e, vehicle)}
              onTouchStart={handleTouchStart}
              onTouchEnd={(e) => handleTouchEnd(e, vehicle)}
              className={`vehicle-card p-2.5 sm:p-4 bg-white ${selectedVehicle?.id === vehicle.id ? 'selected' : ''
                }`}
            >
              <div className="text-center mb-1 sm:mb-2">
                <span
                  className="inline-block text-xs sm:text-sm px-2 sm:px-4 py-0.5 sm:py-1 rounded font-semibold"
                  style={{
                    color: badgeColor,
                    backgroundColor: `${badgeColor}1A`, // 10% opacity
                  }}
                >
                  {vehicle.size_category}
                </span>
              </div>
              <div className="relative h-14 sm:h-24 mb-2 sm:mb-3 flex items-center justify-center">
                {vehicle.image_url ? (
                  <Image
                    src={vehicle.image_url}
                    alt={vehicle.model_name}
                    width={120}
                    height={80}
                    className="object-contain w-auto h-full max-h-14 sm:max-h-20"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/vehicles/placeholder.png'
                    }}
                  />
                ) : (
                  <div className="w-14 sm:w-24 h-10 sm:h-16 bg-gray-100 rounded flex items-center justify-center">
                    <svg className="w-6 sm:w-12 h-6 sm:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h8m-8 4h8m-8 4h4M6 3h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z" />
                    </svg>
                  </div>
                )}
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-700 text-center leading-tight line-clamp-2">
                {vehicle.model_name}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
