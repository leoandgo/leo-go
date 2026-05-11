'use client'

import { useState } from 'react'
import { Navigation } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'

interface DistanceInputProps {
  value: number
  onChange: (km: number) => void
}

export default function DistanceInput({ value, onChange }: DistanceInputProps) {
  const { t } = useLanguage()
  const [customValue, setCustomValue] = useState<string>(value > 0 ? value.toString() : '')

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value

    // Allow empty input
    if (inputValue === '') {
      setCustomValue('')
      onChange(0)
      return
    }

    // Only allow positive integers (no decimals, no negative, no special chars)
    const sanitized = inputValue.replace(/[^0-9]/g, '')

    if (sanitized !== inputValue) {
      // Input contained invalid characters, use sanitized version
      setCustomValue(sanitized)
      onChange(parseInt(sanitized) || 0)
    } else {
      // Valid input
      const numValue = parseInt(sanitized) || 0
      setCustomValue(sanitized)
      onChange(numValue)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Block minus, plus, decimal point, and 'e' for scientific notation
    if (['-', '+', '.', ',', 'e', 'E'].includes(e.key)) {
      e.preventDefault()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text')
    // Only allow if pasted content is a valid positive integer
    if (!/^\d+$/.test(pastedText)) {
      e.preventDefault()
    }
  }

  return (
    <div>
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 sm:mb-2 flex items-center gap-2">
        <Navigation className="text-[#653A8E] flex-shrink-0" size={22} />
        Distance
      </h2>
      <p className="text-gray-500 mb-4 sm:mb-6 text-sm sm:text-base">{t('distanceDescription')}</p>

      {/* Simple Input */}
      <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={customValue}
              onChange={handleCustomChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={t('distancePlaceholder')}
              className="w-full px-3 sm:px-4 py-3 sm:py-4 pr-14 sm:pr-16 border-2 border-gray-200 rounded-xl focus:border-[#653A8E] focus:ring-2 focus:ring-[#653A8E]/20 transition-all text-lg sm:text-xl font-semibold"
            />
            <span className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-base sm:text-lg">
              {t('km')}
            </span>
          </div>
          {value > 0 && (
            <button
              onClick={() => {
                onChange(0)
                setCustomValue('')
              }}
              className="px-4 py-3 sm:py-4 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors font-medium text-sm sm:text-base whitespace-nowrap"
            >
              {t('clear')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
