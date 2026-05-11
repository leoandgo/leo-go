'use client'

import { useState, useEffect } from 'react'
import { format, addDays, addMinutes, differenceInMinutes, isAfter, isBefore, startOfDay } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import { Calendar, Clock, ArrowRight, AlertCircle, Info, Plus, Minus, Mail, X, Check } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'

interface DateTimeSelectorProps {
  onDurationChange: (minutes: number) => void
  onDatesChange: (departure: Date, returnDate: Date) => void
  monthlyRentalUrl?: string
}

export default function DateTimeSelector({ onDurationChange, onDatesChange, monthlyRentalUrl }: DateTimeSelectorProps) {
  const { t, language } = useLanguage()
  const today = startOfDay(new Date())
  const maxDate = addDays(today, 365)

  // Calculate default departure time: current time + 30 minutes, rounded to nearest 10 min
  const getInitialDepartureTime = () => {
    const now = new Date()
    const futureTime = addMinutes(now, 30)
    const minutes = futureTime.getMinutes()
    const roundedMinutes = Math.ceil(minutes / 10) * 10

    let finalTime = futureTime
    if (roundedMinutes === 60) {
      finalTime = new Date(futureTime)
      finalTime.setMinutes(0)
      finalTime.setHours(finalTime.getHours() + 1)
    } else {
      finalTime = new Date(futureTime)
      finalTime.setMinutes(roundedMinutes)
    }

    return {
      date: format(finalTime, 'yyyy-MM-dd'),
      hour: finalTime.getHours().toString().padStart(2, '0'),
      minute: finalTime.getMinutes().toString().padStart(2, '0'),
    }
  }

  const initialDeparture = getInitialDepartureTime()

  const [departureDate, setDepartureDate] = useState<string>(initialDeparture.date)
  const [departureHour, setDepartureHour] = useState<string>(initialDeparture.hour)
  const [departureMinute, setDepartureMinute] = useState<string>(initialDeparture.minute)

  // Return date defaults to next day at 18:00
  const [returnDate, setReturnDate] = useState<string>(format(addDays(new Date(initialDeparture.date), 1), 'yyyy-MM-dd'))
  const [returnHour, setReturnHour] = useState<string>('18')
  const [returnMinute, setReturnMinute] = useState<string>('00')

  const [durationText, setDurationText] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [timeError, setTimeError] = useState<string>('')
  const [showLongDurationMessage, setShowLongDurationMessage] = useState(false)
  const [showLongDurationModal, setShowLongDurationModal] = useState(false)
  const [longDurationEmail, setLongDurationEmail] = useState('')
  const [longDurationPhone, setLongDurationPhone] = useState('')
  const [isSubmittingLongDuration, setIsSubmittingLongDuration] = useState(false)
  const [longDurationSuccess, setLongDurationSuccess] = useState(false)
  const [longDurationError, setLongDurationError] = useState('')

  // Helper functions for time controls
  const incrementHour = (current: string, setter: (val: string) => void) => {
    const newVal = (parseInt(current) + 1) % 24
    setter(newVal.toString().padStart(2, '0'))
  }

  const decrementHour = (current: string, setter: (val: string) => void) => {
    const newVal = (parseInt(current) - 1 + 24) % 24
    setter(newVal.toString().padStart(2, '0'))
  }

  const incrementMinute = (current: string, setter: (val: string) => void) => {
    const currentVal = parseInt(current)
    const newVal = currentVal >= 50 ? 0 : currentVal + 10
    setter(newVal.toString().padStart(2, '0'))
  }

  const decrementMinute = (current: string, setter: (val: string) => void) => {
    const currentVal = parseInt(current)
    const newVal = currentVal <= 0 ? 50 : currentVal - 10
    setter(newVal.toString().padStart(2, '0'))
  }

  const handleTimeInput = (value: string, setter: (val: string) => void) => {
    // Allow free typing - just update the value as-is
    setter(value)
  }

  const validateAndFormatTime = (value: string, setter: (val: string) => void, max: number) => {
    const num = parseInt(value)
    if (isNaN(num) || num < 0 || num > max) {
      setTimeError('Invalid time value')
      setter('00')
    } else {
      setTimeError('')
      setter(num.toString().padStart(2, '0'))
    }
  }

  // Validate date for iOS which doesn't always respect min/max attributes
  const handleDepartureDateChange = (value: string) => {
    const selectedDate = new Date(value)
    const minDateValue = startOfDay(new Date())
    const maxDateValue = maxDate

    let newDepartureDate = value

    // If date is before today, reset to today
    if (isBefore(selectedDate, minDateValue)) {
      newDepartureDate = format(minDateValue, 'yyyy-MM-dd')
    }
    // If date is after max date, reset to max date
    else if (isAfter(selectedDate, maxDateValue)) {
      newDepartureDate = format(maxDateValue, 'yyyy-MM-dd')
    }

    setDepartureDate(newDepartureDate)

    // Auto-adjust return date: if return is before or equal to new departure, set it to the departure date
    const currentReturn = new Date(returnDate)
    const newDep = new Date(newDepartureDate)
    if (!isAfter(currentReturn, newDep)) {
      setReturnDate(newDepartureDate)
    }
  }

  const handleReturnDateChange = (value: string) => {
    const selectedDate = new Date(value)
    const minDateValue = new Date(departureDate)
    const maxDateValue = maxDate

    // If date is before departure date, reset to departure date
    if (isBefore(selectedDate, minDateValue)) {
      setReturnDate(departureDate)
      return
    }
    // If date is after max date, reset to max date
    if (isAfter(selectedDate, maxDateValue)) {
      setReturnDate(format(maxDateValue, 'yyyy-MM-dd'))
      return
    }
    setReturnDate(value)
  }

  useEffect(() => {
    calculateDuration()
  }, [departureDate, departureHour, departureMinute, returnDate, returnHour, returnMinute, language])

  const calculateDuration = () => {
    const departure = new Date(`${departureDate}T${departureHour}:${departureMinute}:00`)
    const returnDateTime = new Date(`${returnDate}T${returnHour}:${returnMinute}:00`)

    if (isBefore(departure, new Date())) {
      setError(t('departureDatePastError'))
      return
    }

    if (!isAfter(returnDateTime, departure)) {
      setError(t('returnAfterDepartureError'))
      return
    }

    setError('')

    const totalMinutes = differenceInMinutes(returnDateTime, departure)
    const days = Math.floor(totalMinutes / 1440)
    const remainingMinutes = totalMinutes % 1440
    const hoursRemaining = Math.floor(remainingMinutes / 60)
    const mins = remainingMinutes % 60

    if (totalMinutes > 43200) {
      setShowLongDurationMessage(true)
      setDurationText('')
      onDurationChange(totalMinutes) // Pass actual duration so parent can hide other sections
      return
    }

    setShowLongDurationMessage(false)

    let text = ''
    if (days > 0) text += `${days} ${days > 1 ? t('days') : t('day')} `
    if (hoursRemaining > 0) {
      text += `${hoursRemaining} ${hoursRemaining > 1 ? t('hours') : t('hour')} `
    }
    if (mins > 0) {
      // Only add "et" if there's something before
      if (days > 0 || hoursRemaining > 0) {
        text += `${t('and')} `
      }
      text += `${mins} ${t('min')}`
    }
    if (!text) text = `0 ${t('min')}`

    setDurationText(text.trim())
    onDurationChange(totalMinutes)
    onDatesChange(departure, returnDateTime)
  }

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr || dateStr.length < 10) return ''
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return ''
    return format(date, 'EEE d MMM', { locale: language === 'fr' ? fr : enUS })
  }

  const handleLongDurationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!longDurationEmail || !longDurationEmail.includes('@')) {
      setLongDurationError(t('invalidEmail'))
      return
    }
    if (!longDurationPhone || longDurationPhone.trim().length < 6) {
      setLongDurationError(t('invalidPhone'))
      return
    }

    setIsSubmittingLongDuration(true)
    setLongDurationError('')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: longDurationEmail,
          phone: longDurationPhone,
          durationMinutes: differenceInMinutes(
            new Date(`${returnDate}T${returnHour}:${returnMinute}:00`),
            new Date(`${departureDate}T${departureHour}:${departureMinute}:00`)
          ),
          departureDateTime: new Date(`${departureDate}T${departureHour}:${departureMinute}:00`).toISOString(),
          returnDateTime: new Date(`${returnDate}T${returnHour}:${returnMinute}:00`).toISOString(),
        }),
      })

      if (response.ok) {
        setLongDurationSuccess(true)
      } else {
        setLongDurationError(t('errorMessage'))
      }
    } catch {
      setLongDurationError(t('errorMessage'))
    } finally {
      setIsSubmittingLongDuration(false)
    }
  }

  const closeLongDurationModal = () => {
    setShowLongDurationModal(false)
    setLongDurationEmail('')
    setLongDurationPhone('')
    setLongDurationSuccess(false)
    setLongDurationError('')
  }

  return (
    <div>
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
        <Calendar className="text-[#653A8E] flex-shrink-0" size={22} />
        {t('desiredDuration')}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Departure Card */}
        <div className="bg-gradient-to-br from-[#653A8E]/10 to-white border-2 border-[#653A8E]/20 rounded-xl sm:rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#653A8E] flex items-center justify-center flex-shrink-0">
              <ArrowRight className="text-white" size={16} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-sm sm:text-base">{t('departure')}</h3>
              <p className="text-xs sm:text-sm text-gray-500">{t('startingFrom')}</p>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-600 mb-1.5 sm:mb-2">{t('date')}</label>
              <div className="relative">
                <input
                  type="date"
                  value={departureDate}
                  min={format(today, 'yyyy-MM-dd')}
                  max={format(maxDate, 'yyyy-MM-dd')}
                  onChange={(e) => handleDepartureDateChange(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:border-[#653A8E] focus:ring-2 focus:ring-[#653A8E]/20 transition-all bg-white text-sm sm:text-base"
                />
              </div>
              <p className="text-xs sm:text-sm text-[#653A8E] font-semibold mt-1">{formatDisplayDate(departureDate)}</p>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-600 mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                <Clock size={14} className="sm:w-4 sm:h-4" />
                {t('time')}
              </label>
              <div className="flex items-center justify-center gap-2">
                {/* Hours */}
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => decrementHour(departureHour, setDepartureHour)}
                    className="w-8 h-10 sm:w-10 sm:h-12 rounded-l-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors border-2 border-r-0 border-gray-200"
                  >
                    <Minus size={14} className="text-gray-600" />
                  </button>
                  <input
                    type="text"
                    value={departureHour}
                    onChange={(e) => handleTimeInput(e.target.value, setDepartureHour)}
                    onBlur={(e) => validateAndFormatTime(e.target.value, setDepartureHour, 23)}
                    className="w-12 sm:w-14 h-10 sm:h-12 text-center font-bold text-base sm:text-lg border-y-2 border-gray-200 bg-white focus:outline-none"
                    maxLength={2}
                  />
                  <button
                    type="button"
                    onClick={() => incrementHour(departureHour, setDepartureHour)}
                    className="w-8 h-10 sm:w-10 sm:h-12 rounded-r-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors border-2 border-l-0 border-gray-200"
                  >
                    <Plus size={14} className="text-gray-600" />
                  </button>
                </div>

                <span className="text-gray-400 font-bold text-xl">:</span>

                {/* Minutes */}
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => decrementMinute(departureMinute, setDepartureMinute)}
                    className="w-8 h-10 sm:w-10 sm:h-12 rounded-l-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors border-2 border-r-0 border-gray-200"
                  >
                    <Minus size={14} className="text-gray-600" />
                  </button>
                  <input
                    type="text"
                    value={departureMinute}
                    onChange={(e) => handleTimeInput(e.target.value, setDepartureMinute)}
                    onBlur={(e) => validateAndFormatTime(e.target.value, setDepartureMinute, 59)}
                    className="w-12 sm:w-14 h-10 sm:h-12 text-center font-bold text-base sm:text-lg border-y-2 border-gray-200 bg-white focus:outline-none"
                    maxLength={2}
                  />
                  <button
                    type="button"
                    onClick={() => incrementMinute(departureMinute, setDepartureMinute)}
                    className="w-8 h-10 sm:w-10 sm:h-12 rounded-r-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors border-2 border-l-0 border-gray-200"
                  >
                    <Plus size={14} className="text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Return Card */}
        <div className="bg-gradient-to-br from-green-50 to-white border-2 border-green-100 rounded-xl sm:rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#22AF8C] flex items-center justify-center flex-shrink-0">
              <ArrowRight className="text-white rotate-180" size={16} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-sm sm:text-base">{t('return')}</h3>
              <p className="text-xs sm:text-sm text-gray-500">{t('until')}</p>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-600 mb-1.5 sm:mb-2">{t('date')}</label>
              <div className="relative">
                <input
                  type="date"
                  value={returnDate}
                  min={departureDate}
                  max={format(maxDate, 'yyyy-MM-dd')}
                  onChange={(e) => handleReturnDateChange(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all bg-white text-sm sm:text-base"
                />
              </div>
              <p className="text-xs sm:text-sm text-green-600 font-semibold mt-1">{formatDisplayDate(returnDate)}</p>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-600 mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                <Clock size={14} className="sm:w-4 sm:h-4" />
                {t('time')}
              </label>
              <div className="flex items-center justify-center gap-2">
                {/* Hours */}
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => decrementHour(returnHour, setReturnHour)}
                    className="w-8 h-10 sm:w-10 sm:h-12 rounded-l-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors border-2 border-r-0 border-gray-200"
                  >
                    <Minus size={14} className="text-gray-600" />
                  </button>
                  <input
                    type="text"
                    value={returnHour}
                    onChange={(e) => handleTimeInput(e.target.value, setReturnHour)}
                    onBlur={(e) => validateAndFormatTime(e.target.value, setReturnHour, 23)}
                    className="w-12 sm:w-14 h-10 sm:h-12 text-center font-bold text-base sm:text-lg border-y-2 border-gray-200 bg-white focus:outline-none"
                    maxLength={2}
                  />
                  <button
                    type="button"
                    onClick={() => incrementHour(returnHour, setReturnHour)}
                    className="w-8 h-10 sm:w-10 sm:h-12 rounded-r-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors border-2 border-l-0 border-gray-200"
                  >
                    <Plus size={14} className="text-gray-600" />
                  </button>
                </div>

                <span className="text-gray-400 font-bold text-xl">:</span>

                {/* Minutes */}
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => decrementMinute(returnMinute, setReturnMinute)}
                    className="w-8 h-10 sm:w-10 sm:h-12 rounded-l-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors border-2 border-r-0 border-gray-200"
                  >
                    <Minus size={14} className="text-gray-600" />
                  </button>
                  <input
                    type="text"
                    value={returnMinute}
                    onChange={(e) => handleTimeInput(e.target.value, setReturnMinute)}
                    onBlur={(e) => validateAndFormatTime(e.target.value, setReturnMinute, 59)}
                    className="w-12 sm:w-14 h-10 sm:h-12 text-center font-bold text-base sm:text-lg border-y-2 border-gray-200 bg-white focus:outline-none"
                    maxLength={2}
                  />
                  <button
                    type="button"
                    onClick={() => incrementMinute(returnMinute, setReturnMinute)}
                    className="w-8 h-10 sm:w-10 sm:h-12 rounded-r-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors border-2 border-l-0 border-gray-200"
                  >
                    <Plus size={14} className="text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Duration Summary */}
      {durationText && !error && !showLongDurationMessage && (
        <div className="mt-4 sm:mt-6 bg-gradient-to-r from-[#653A8E] to-[#22AF8C] rounded-xl sm:rounded-2xl p-0.5 sm:p-1">
          <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#653A8E]/20 flex items-center justify-center flex-shrink-0">
                  <Clock className="text-[#653A8E]" size={20} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">{t('duration')}</p>
                  <p className="text-base sm:text-xl font-bold text-gray-800">{durationText}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 border-t border-gray-100 gap-2 sm:gap-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#653A8E] flex items-center justify-center flex-shrink-0">
                  <ArrowRight className="text-white" size={12} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('departure')}</p>
                  <p className="text-sm font-medium text-gray-700">{formatDisplayDate(departureDate)} {t('at')} {departureHour}:{departureMinute}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:text-right">
                <div className="w-6 h-6 rounded-full bg-[#22AF8C] flex items-center justify-center flex-shrink-0 sm:order-2">
                  <ArrowRight className="text-white rotate-180" size={12} />
                </div>
                <div className="sm:order-1">
                  <p className="text-xs text-gray-500">{t('return')}</p>
                  <p className="text-sm font-medium text-gray-700">{formatDisplayDate(returnDate)} {t('at')} {returnHour}:{returnMinute}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg sm:rounded-xl flex items-start gap-2 sm:gap-3">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
          <p className="text-red-700 text-sm sm:text-base">{error}</p>
        </div>
      )}

      {/* 30+ days message */}
      {showLongDurationMessage && (
        <div className="mt-4 sm:mt-6 p-4 sm:p-6 bg-[#653A8E]/10 border border-[#653A8E]/20 rounded-lg sm:rounded-xl">
          <div className="flex items-start gap-2 sm:gap-3 mb-4">
            <Info className="text-[#653A8E] flex-shrink-0 mt-0.5" size={20} />
            <p className="text-gray-700 text-sm sm:text-base">
              {t('longDurationMessage')}
            </p>
          </div>
          <div className="text-center">
            <button
              onClick={() => setShowLongDurationModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#653A8E] hover:bg-[#522e73] text-white font-semibold rounded-lg transition-colors text-sm sm:text-base"
            >
              {t('wantToBeContacted')}
              <Mail size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Long Duration Contact Modal */}
      {showLongDurationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 relative">
            <button
              onClick={closeLongDurationModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>

            {longDurationSuccess ? (
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
                  <h3 className="text-lg font-bold text-gray-800">{t('longDurationContactTitle')}</h3>
                </div>
                <p className="text-gray-600 text-sm mb-4">{t('longDurationContactDesc')}</p>

                <form onSubmit={handleLongDurationSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('emailLabel')} *
                    </label>
                    <input
                      type="email"
                      value={longDurationEmail}
                      onChange={(e) => setLongDurationEmail(e.target.value)}
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
                      value={longDurationPhone}
                      onChange={(e) => setLongDurationPhone(e.target.value)}
                      placeholder={t('phonePlaceholder')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#653A8E] focus:border-transparent outline-none"
                    />
                    {longDurationError && <p className="text-red-500 text-sm mt-1">{longDurationError}</p>}
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmittingLongDuration}
                    className="w-full py-3 px-6 bg-[#653A8E] hover:bg-[#7d4fa8] text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                  >
                    {isSubmittingLongDuration ? t('sending') : t('send')}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Quick Tips - Hidden on very small screens */}
      <div className="mt-4 sm:mt-6 hidden xs:grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#653A8E]/20 flex items-center justify-center text-[#653A8E] text-xs sm:text-sm font-bold flex-shrink-0">1</div>
          <p className="text-xs sm:text-sm text-gray-600 font-medium">{t('tip1')}</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs sm:text-sm font-bold flex-shrink-0">2</div>
          <p className="text-xs sm:text-sm text-gray-600 font-medium">{t('tip2')}</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs sm:text-sm font-bold flex-shrink-0">3</div>
          <p className="text-xs sm:text-sm text-gray-600 font-medium">{t('tip3')}</p>
        </div>
      </div>
    </div>
  )
}
