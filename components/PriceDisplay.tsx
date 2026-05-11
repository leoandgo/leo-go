'use client'

import { useState, useEffect } from 'react'
import { PriceCalculation, Vehicle } from '@/types/database'
import { Check, Calculator, X, Mail } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'
import Image from 'next/image'
import { format } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'

interface PriceDisplayProps {
  calculation: PriceCalculation | null
  durationText: string
  isLoading: boolean
  vehicle?: Vehicle | null
  departureDate?: Date | null
  returnDate?: Date | null
  distanceKm?: number
  airportDeparture?: boolean
  airportArrival?: boolean
  predeliveryOption?: boolean
}

export default function PriceDisplay({
  calculation,
  durationText,
  isLoading,
  vehicle,
  departureDate,
  returnDate,
  distanceKm,
  airportDeparture,
  airportArrival,
  predeliveryOption,
}: PriceDisplayProps) {
  const { t, language } = useLanguage()
  const [showContactForm, setShowContactForm] = useState(false)
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor
      const isMobileDevice = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase())
      setIsMobile(isMobileDevice)
    }
    checkMobile()
  }, [])

  const handleBookClick = () => {
    if (isMobile) {
      // On mobile, use the deeplink that redirects to the Leo&Go app
      window.location.href = 'https://tinyurl.com/mte7rr3j'
    } else {
      // On desktop, redirect to the pre-booking page
      window.location.href = 'https://www.leoandgo.com/prereservation'
    }
  }

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      setError(t('invalidEmail'))
      return
    }
    if (!phone || phone.trim().length < 6) {
      setError(t('invalidPhone'))
      return
    }

    setIsSending(true)
    setError('')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          phone,
          vehicleId: vehicle?.id,
          estimatedPrice: calculation?.totalPrice,
          durationMinutes: calculation?.durationMinutes,
          distanceKm,
          departureDateTime: departureDate?.toISOString(),
          returnDateTime: returnDate?.toISOString(),
          airportDeparture,
          airportArrival,
          predeliveryOption,
        }),
      })

      if (response.ok) {
        setIsSuccess(true)
      } else {
        setError(t('errorMessage'))
      }
    } catch {
      setError(t('errorMessage'))
    } finally {
      setIsSending(false)
    }
  }

  const formatPrice = (price: number) => {
    return price.toFixed(2).replace('.', ',')
  }

  const formatDateRange = (departure: Date | null | undefined, returnD: Date | null | undefined) => {
    if (!departure || !returnD) return ''
    const locale = language === 'fr' ? fr : enUS
    const depStr = format(departure, 'dd/MM/yyyy', { locale })
    const retStr = format(returnD, 'dd/MM/yyyy', { locale })
    return `${t('from')} ${depStr} ${t('to')} ${retStr}`
  }

  const inclusions = [
    { key: 'fuelIncluded', text: t('fuelIncluded') },
    { key: 'parkingIncluded', text: t('parkingIncluded') },
    { key: 'insuranceIncluded', text: t('insuranceIncluded') },
    { key: 'maintenanceIncluded', text: t('maintenanceIncluded') },
  ]

  return (
    <div className="mb-6 sm:mb-8">
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 sm:mb-2 flex items-center gap-2">
        <Calculator className="text-[#653A8E] flex-shrink-0" size={22} />
        {t('estimatedCost')}
      </h2>
      <p className="text-gray-500 mb-4 sm:mb-6 text-sm sm:text-base">{t('estimatedCostDesc')}</p>

      {/* Main Card */}
      <div className="bg-white border-2 border-[#653A8E]/20 rounded-xl sm:rounded-2xl overflow-hidden">
        {/* Top Section - Price, Vehicle, Inclusions */}
        <div className="p-4 sm:p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 gap-3">
              <div className="spinner"></div>
              <span className="text-gray-500 font-medium">{t('calculating')}</span>
            </div>
          ) : calculation ? (
            <div className="flex flex-col lg:flex-row lg:items-stretch gap-4 lg:gap-4">
              {/* Left: Your Request */}
              <div className="lg:flex-shrink-0">
                <p className="text-sm font-semibold text-gray-600 mb-2">{t('yourRequest')}</p>
                <div className="price-display text-[#22AF8C] text-3xl sm:text-4xl lg:text-5xl font-bold mb-1">
                  {formatPrice(calculation.totalPrice)}€
                </div>
                <p className="text-gray-600 font-medium text-sm sm:text-base">
                  {t('for')} {durationText}
                </p>
                {departureDate && returnDate && (
                  <p className="text-gray-500 text-xs sm:text-sm mt-1">
                    {formatDateRange(departureDate, returnDate)}
                  </p>
                )}
              </div>

              {/* Center: Vehicle */}
              {vehicle && (
                <div className="flex-shrink-0 flex flex-col items-center justify-center">
                  <div className="relative h-16 sm:h-20 lg:h-24 w-24 sm:w-32 lg:w-40 mb-2">
                    {vehicle.image_url ? (
                      <Image
                        src={vehicle.image_url}
                        alt={vehicle.model_name}
                        fill
                        className="object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/vehicles/placeholder.png'
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h8m-8 4h8m-8 4h4M6 3h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <p className="text-sm sm:text-base font-medium text-gray-700 text-center">{vehicle.model_name}</p>
                </div>
              )}

              {/* Right: Inclusions */}
              <div className="flex-1 lg:pl-4">
                <p className="text-sm font-bold text-gray-800 mb-3">{t('everythingIncluded')}</p>
                <ul className="space-y-2">
                  {inclusions.map((item) => (
                    <li key={item.key} className="flex items-center gap-2">
                      <span className="flex-shrink-0 w-5 h-5 bg-[#22AF8C] rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </span>
                      <span className="text-sm text-gray-700 font-medium">{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p className="text-2xl mb-2 font-bold">--,--€</p>
              <p className="text-sm">{t('selectVehicleAndDuration')}</p>
            </div>
          )}
        </div>

        {/* Bottom Section - Accessories & Franchise */}
        {calculation && (
          <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 text-center">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">
              {t('accessoriesAvailableText')}{' '}
              <strong className="font-bold text-gray-800">{t('accessoriesAvailablePrice')}</strong>{' '}
              <span className="text-gray-500">{t('accessoriesDetails')}</span>
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              {t('franchiseReductionText')}{' '}
              <strong className="font-bold text-gray-800">{t('franchiseReductionPrice')}</strong>{' '}
              <span className="text-gray-500">{t('franchiseDetails')}</span>
            </p>
          </div>
        )}

        {/* Price Breakdown (collapsible) */}
        {calculation && (
          <details className="border-t border-gray-200">
            <summary className="cursor-pointer px-4 sm:px-6 py-3 text-sm text-[#653A8E] hover:text-[#7d4fa8] font-semibold hover:bg-gray-50 transition-colors">
              {t('viewPriceDetails')}
            </summary>
            <div className="px-4 sm:px-6 pb-4 text-sm text-gray-600 space-y-1">
              <div className="flex justify-between items-start gap-2">
                <span className="font-medium">{t('unlockFee')}</span>
                <span className="font-semibold flex-shrink-0">{formatPrice(calculation.unlockFee)}€</span>
              </div>
              <div className="flex justify-between items-start gap-2">
                <span className="font-medium min-w-0">{t('rentalDuration')}<br className="sm:hidden" /><span className="text-gray-500 text-xs sm:text-sm"> ({durationText})</span></span>
                <span className="font-semibold flex-shrink-0">{formatPrice(calculation.basePrice)}€</span>
              </div>
              <div className="flex justify-between items-start gap-2">
                <span className="font-medium">{t('includedKm')}</span>
                <span className="font-semibold flex-shrink-0">{calculation.kmIncluded} km</span>
              </div>
              {calculation.extraKm > 0 && (
                <div className="flex justify-between items-start gap-2">
                  <span className="font-medium min-w-0">{t('extraKm')}<br /><span className="text-gray-500 text-xs sm:text-sm italic">{calculation.extraKm} km × {(calculation.extraKmCost / calculation.extraKm).toFixed(2).replace('.', ',')}€</span></span>
                  <span className="font-semibold flex-shrink-0">{formatPrice(calculation.extraKmCost)}€</span>
                </div>
              )}
              {calculation.airportDepartureCost > 0 && (
                <div className="flex justify-between items-start gap-2">
                  <span className="font-medium">{t('airportDepartureOption')}</span>
                  <span className="font-semibold flex-shrink-0">{formatPrice(calculation.airportDepartureCost)}€</span>
                </div>
              )}
              {calculation.airportArrivalCost > 0 && (
                <div className="flex justify-between items-start gap-2">
                  <span className="font-medium">{t('airportArrivalOption')}</span>
                  <span className="font-semibold flex-shrink-0">{formatPrice(calculation.airportArrivalCost)}€</span>
                </div>
              )}
              {calculation.predeliveryCost > 0 && (
                <div className="flex justify-between items-start gap-2">
                  <span className="font-medium">{t('predeliveryOption')}</span>
                  <span className="font-semibold flex-shrink-0">{formatPrice(calculation.predeliveryCost)}€</span>
                </div>
              )}
              <div className="flex justify-between items-start gap-2 font-bold pt-2 border-t border-gray-200">
                <span>{t('totalIncludingTax')}</span>
                <span className="text-[#22AF8C] flex-shrink-0">{formatPrice(calculation.totalPrice)}€</span>
              </div>
            </div>
          </details>
        )}

        {/* CTA Buttons */}
        {calculation && (
          <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col items-center space-y-3">
            <a
              href="https://www.leoandgo.com/open"
              className="w-full max-w-md py-3 px-4 bg-[#22AF8C] hover:bg-[#1d9a7a] text-white font-bold rounded-xl text-base sm:text-lg text-center transition-colors block"
            >
              {t('bookNowText')}
            </a>
            <button
              onClick={() => setShowContactForm(true)}
              className="w-full max-w-md py-3 px-8 bg-white border-2 border-[#653A8E] text-[#653A8E] hover:bg-[#653A8E]/10 font-bold rounded-xl transition-colors text-sm sm:text-base"
            >
              {t('wantToBeContacted')}
            </button>
          </div>
        )}
      </div>

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 relative">
            <button
              onClick={() => {
                setShowContactForm(false)
                setIsSuccess(false)
                setEmail('')
                setPhone('')
                setError('')
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>

            {isSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-[#22AF8C] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{t('thankYou')}</h3>
                <p className="text-gray-600">{t('willContactSoon')}</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#653A8E]/20 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-[#653A8E]" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">{t('contactFormTitle')}</h3>
                </div>
                <p className="text-gray-600 text-sm mb-4">{t('contactFormDescription')}</p>

                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('emailLabel')} *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('emailPlaceholder')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#653A8E] focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('phoneLabel')} *
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t('phonePlaceholder')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#653A8E] focus:border-transparent outline-none"
                    />
                    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                  </div>
                  <button
                    type="submit"
                    disabled={isSending}
                    className="w-full py-3 px-6 bg-[#653A8E] hover:bg-[#7d4fa8] text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                  >
                    {isSending ? t('sending') : t('send')}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
