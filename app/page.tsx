'use client'

import { useState, useEffect } from 'react'
import { Vehicle, GlobalSettings } from '@/types/database'
import PriceSimulator from '@/components/PriceSimulator'
import Header from '@/components/Header'

import { useLanguage } from '@/lib/LanguageContext'

export default function Home() {
  const { t } = useLanguage()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [settings, setSettings] = useState<GlobalSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vehiclesRes, settingsRes] = await Promise.all([
          fetch('/api/vehicles'),
          fetch('/api/settings'),
        ])

        if (!vehiclesRes.ok || !settingsRes.ok) {
          throw new Error('Failed to fetch data')
        }

        const vehiclesData = await vehiclesRes.json()
        const settingsData = await settingsRes.json()

        setVehicles(vehiclesData.vehicles || [])
        setSettings(settingsData.settings)
      } catch (err) {
        console.error('Error loading data:', err)
        setError(t('loadingError'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [t])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="spinner mx-auto mb-4 w-12 h-12"></div>
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            {t('retry')}
          </button>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
          <p className="text-gray-600 mb-4">
            {t('configRequired')}
          </p>
          <a href="/admin" className="btn-secondary">
            {t('goToAdmin')}
          </a>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      {/* Simulator */}
      <div className="flex-1">
        <PriceSimulator vehicles={vehicles} settings={settings} />
      </div>

    </main>
  )
}
