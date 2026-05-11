'use client'

import { useState } from 'react'
import { Mail, X, Send, CheckCircle, Car } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'

interface ContactFormProps {
  onSubmit: (email: string) => Promise<boolean>
  isEnabled: boolean
}

export default function ContactForm({ onSubmit, isEnabled }: ContactFormProps) {
  const { t } = useLanguage()
  const [showModal, setShowModal] = useState(false)
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !email.includes('@')) {
      setError(t('invalidEmail'))
      return
    }

    setIsSubmitting(true)
    try {
      const success = await onSubmit(email)
      if (success) {
        setSubmitted(true)
        setEmail('')
      } else {
        setError(t('errorMessage'))
      }
    } catch {
      setError(t('errorMessage'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const openModal = () => {
    setShowModal(true)
    setSubmitted(false)
    setError('')
    setEmail('')
  }

  const closeModal = () => {
    setShowModal(false)
  }

  return (
    <>
      <div className="text-center">
        {/* Primary CTA */}
        <button
          onClick={openModal}
          disabled={!isEnabled}
          className={`btn-primary flex items-center justify-center gap-2 mx-auto text-sm sm:text-base px-4 sm:px-8 py-3 sm:py-3.5 ${!isEnabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
        >
          <Car size={18} className="sm:w-5 sm:h-5" />
          {t('bookMyLeo')}
        </button>
      </div>

      {/* Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 modal-overlay">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Modal Content */}
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md overflow-hidden modal-content max-h-[90vh] sm:max-h-none">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#22AF8C] to-[#1d9a7a] p-4 sm:p-6 text-white">
              <button
                onClick={closeModal}
                className="absolute top-3 sm:top-4 right-3 sm:right-4 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <X size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Car size={20} className="sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold">{t('getQuote')}</h3>
                  <p className="text-white/80 text-xs sm:text-sm">{t('fillFormForQuote')}</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-6">
              {submitted ? (
                <div className="text-center py-6 sm:py-8">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-[#22AF8C]/10 flex items-center justify-center">
                    <CheckCircle className="text-[#22AF8C]" size={28} />
                  </div>
                  <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{t('thankYou')}</h4>
                  <p className="text-gray-600 text-sm sm:text-base">{t('willContactSoon')}</p>
                  <button
                    onClick={closeModal}
                    className="mt-5 sm:mt-6 px-5 sm:px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors text-sm sm:text-base"
                  >
                    {t('close')}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('emailLabel')}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t('emailPlaceholder')}
                        className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl text-sm sm:text-base focus:outline-none focus:border-[#22AF8C] focus:ring-2 focus:ring-[#22AF8C]/20 transition-all"
                        disabled={isSubmitting}
                        autoFocus
                      />
                    </div>
                    {error && (
                      <p className="mt-2 text-red-500 text-xs sm:text-sm font-medium">{error}</p>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
                    {t('quoteDisclaimer')}
                  </p>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-[#22AF8C] to-[#1d9a7a] hover:from-[#1d9a7a] hover:to-[#1d9a7a] text-white rounded-lg sm:rounded-xl font-bold text-base sm:text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="spinner w-4 h-4 sm:w-5 sm:h-5 border-white/30 border-t-white"></div>
                        {t('sending')}
                      </>
                    ) : (
                      <>
                        <Send size={18} className="sm:w-5 sm:h-5" />
                        {t('sendRequest')}
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
