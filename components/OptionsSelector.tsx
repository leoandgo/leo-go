'use client'

import { PlaneTakeoff, PlaneLanding, MapPin, Check, Settings } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'

interface OptionsSelectorProps {
  airportDepartureSelected: boolean
  airportArrivalSelected: boolean
  predeliverySelected: boolean
  onAirportDepartureChange: (selected: boolean) => void
  onAirportArrivalChange: (selected: boolean) => void
  onPredeliveryChange: (selected: boolean) => void
  airportPrice: number
  predeliveryPrice: number
}

export default function OptionsSelector({
  airportDepartureSelected,
  airportArrivalSelected,
  predeliverySelected,
  onAirportDepartureChange,
  onAirportArrivalChange,
  onPredeliveryChange,
  airportPrice,
  predeliveryPrice,
}: OptionsSelectorProps) {
  const { t } = useLanguage()

  return (
    <div>
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 sm:mb-2 flex items-center gap-2">
        <Settings className="text-[#653A8E] flex-shrink-0" size={22} />
        {t('additionalOptions')}
      </h2>
      <p className="text-gray-500 mb-4 sm:mb-6 text-sm sm:text-base">{t('optionsDescription')}</p>

      {/* Options Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {/* Airport Departure Option */}
        <button
          onClick={() => onAirportDepartureChange(!airportDepartureSelected)}
          className={`relative p-4 sm:p-5 rounded-xl sm:rounded-2xl border-2 transition-all text-left ${
            airportDepartureSelected
              ? 'border-[#653A8E] bg-[#653A8E]/10 shadow-lg'
              : 'border-gray-200 bg-white hover:border-[#653A8E]/50 hover:shadow-md'
          }`}
        >
          {airportDepartureSelected && (
            <div className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-[#653A8E] rounded-full flex items-center justify-center">
              <Check size={12} className="text-white sm:w-3.5 sm:h-3.5" />
            </div>
          )}
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#653A8E]/20 flex items-center justify-center mb-3 sm:mb-4">
            <PlaneTakeoff size={20} className="text-[#653A8E] sm:w-6 sm:h-6" />
          </div>
          <p className="font-bold text-gray-800 mb-1 text-sm sm:text-base">{t('airportDepartureOption')}</p>
          <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 line-clamp-3">
            {t('airportDepartureDescription')}
          </p>
          <p className="text-base sm:text-lg font-bold text-[#653A8E]">
            +{airportPrice.toFixed(2).replace('.', ',')}€
          </p>
        </button>

        {/* Airport Arrival Option */}
        <button
          onClick={() => onAirportArrivalChange(!airportArrivalSelected)}
          className={`relative p-4 sm:p-5 rounded-xl sm:rounded-2xl border-2 transition-all text-left ${
            airportArrivalSelected
              ? 'border-[#653A8E] bg-[#653A8E]/10 shadow-lg'
              : 'border-gray-200 bg-white hover:border-[#653A8E]/50 hover:shadow-md'
          }`}
        >
          {airportArrivalSelected && (
            <div className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-[#653A8E] rounded-full flex items-center justify-center">
              <Check size={12} className="text-white sm:w-3.5 sm:h-3.5" />
            </div>
          )}
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#653A8E]/20 flex items-center justify-center mb-3 sm:mb-4">
            <PlaneLanding size={20} className="text-[#653A8E] sm:w-6 sm:h-6" />
          </div>
          <p className="font-bold text-gray-800 mb-1 text-sm sm:text-base">{t('airportArrivalOption')}</p>
          <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 line-clamp-3">
            {t('airportArrivalDescription')}
          </p>
          <p className="text-base sm:text-lg font-bold text-[#653A8E]">
            +{airportPrice.toFixed(2).replace('.', ',')}€
          </p>
        </button>

        {/* Pre-delivery Option */}
        <button
          onClick={() => onPredeliveryChange(!predeliverySelected)}
          className={`relative p-4 sm:p-5 rounded-xl sm:rounded-2xl border-2 transition-all text-left ${
            predeliverySelected
              ? 'border-[#653A8E] bg-[#653A8E]/10 shadow-lg'
              : 'border-gray-200 bg-white hover:border-[#653A8E]/50 hover:shadow-md'
          }`}
        >
          {predeliverySelected && (
            <div className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-[#653A8E] rounded-full flex items-center justify-center">
              <Check size={12} className="text-white sm:w-3.5 sm:h-3.5" />
            </div>
          )}
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#653A8E]/20 flex items-center justify-center mb-3 sm:mb-4">
            <MapPin size={20} className="text-[#653A8E] sm:w-6 sm:h-6" />
          </div>
          <p className="font-bold text-gray-800 mb-1 text-sm sm:text-base">{t('predeliveryOption')}</p>
          <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 line-clamp-3">
            {t('predeliveryDescription')}
          </p>
          <p className="text-base sm:text-lg font-bold text-[#653A8E]">
            +{predeliveryPrice.toFixed(2).replace('.', ',')}€
          </p>
        </button>
      </div>

      {/* Info message */}
      <div className="p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-200">
        <p className="text-xs sm:text-sm text-gray-600 text-center">
          {t('optionsInfoMessage')}
        </p>
      </div>
    </div>
  )
}
