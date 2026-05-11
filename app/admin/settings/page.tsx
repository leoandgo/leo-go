'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Save, RefreshCw, Palette, Link } from 'lucide-react'
import { useToast } from '@/components/Toast'

interface SettingRow {
  id: string
  key: string
  value: number
  text_value: string | null
  description: string | null
}

export default function SettingsAdmin() {
  const { showToast } = useToast()
  const [settings, setSettings] = useState<SettingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editedNumericValues, setEditedNumericValues] = useState<Record<string, number>>({})
  const [editedColorValues, setEditedColorValues] = useState<Record<string, string>>({})
  const [editedUrlValues, setEditedUrlValues] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('global_settings') as any)
        .select('*')
        .order('key')

      const settingsData = (data || []) as SettingRow[]
      setSettings(settingsData)

      const numericValues: Record<string, number> = {}
      const colorValues: Record<string, string> = {}
      const urlValues: Record<string, string> = {}

      settingsData.forEach((s) => {
        if (s.key.startsWith('badge_color_')) {
          colorValues[s.key] = s.text_value || '#653A8E'
        } else if (s.key === 'monthly_rental_url') {
          urlValues[s.key] = s.text_value || ''
        } else {
          numericValues[s.key] = s.value
        }
      })

      setEditedNumericValues(numericValues)
      setEditedColorValues(colorValues)
      setEditedUrlValues(urlValues)
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const errors: string[] = []

      for (const setting of settings) {
        let shouldUpdate = false
        let updateBody: { id: string; key: string; value?: number; text_value?: string } = {
          id: setting.id,
          key: setting.key,
        }

        if (setting.key.startsWith('badge_color_')) {
          const newValue = editedColorValues[setting.key]
          if (newValue !== setting.text_value) {
            shouldUpdate = true
            updateBody.text_value = newValue
          }
        } else if (setting.key === 'monthly_rental_url') {
          const newValue = editedUrlValues[setting.key]
          if (newValue !== setting.text_value) {
            shouldUpdate = true
            updateBody.text_value = newValue
          }
        } else {
          const newValue = editedNumericValues[setting.key]
          if (newValue !== setting.value) {
            shouldUpdate = true
            updateBody.value = newValue
          }
        }

        if (shouldUpdate) {
          const response = await fetch('/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateBody),
          })

          if (!response.ok) {
            console.error(`Error updating ${setting.key}`)
            errors.push(setting.key)
          }
        }
      }

      await fetchSettings()

      if (errors.length > 0) {
        showToast(`Erreur lors de la sauvegarde de: ${errors.join(', ')}`, 'error')
      } else {
        showToast('Paramètres sauvegardés avec succès', 'success')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      showToast('Erreur lors de la sauvegarde', 'error')
    } finally {
      setSaving(false)
    }
  }

  const numericSettingLabels: Record<string, { label: string; unit: string; description: string }> = {
    unlock_fee: {
      label: 'Frais de déverrouillage',
      unit: '€',
      description: 'Frais appliqués à chaque location',
    },
    extra_km_rate: {
      label: 'Prix km supplémentaire',
      unit: '€/km',
      description: 'Prix par kilomètre au-delà du forfait inclus',
    },
    km_per_day: {
      label: 'Km inclus par jour',
      unit: 'km',
      description: 'Nombre de kilomètres inclus par jour de location',
    },
    airport_option: {
      label: 'Option aéroport',
      unit: '€',
      description: 'Supplément pour trajet aéroport',
    },
    predelivery_option: {
      label: 'Option pré-livraison',
      unit: '€',
      description: 'Supplément pour livraison du véhicule',
    },
  }

  const colorSettingLabels: Record<string, { label: string; description: string }> = {
    badge_color_xs: {
      label: 'Badge catégorie XS',
      description: 'Couleur pour les véhicules très compacts',
    },
    badge_color_s: {
      label: 'Badge catégorie S',
      description: 'Couleur pour les véhicules de petite taille',
    },
    badge_color_m: {
      label: 'Badge catégorie M',
      description: 'Couleur pour les véhicules de taille moyenne',
    },
    badge_color_l: {
      label: 'Badge catégorie L',
      description: 'Couleur pour les véhicules de grande taille',
    },
    badge_color_xl: {
      label: 'Badge catégorie XL',
      description: 'Couleur pour les utilitaires',
    },
  }

  const numericSettings = settings.filter(s => !s.key.startsWith('badge_color_') && s.key !== 'monthly_rental_url')
  const colorSettings = settings.filter(s => s.key.startsWith('badge_color_'))
  const urlSettings = settings.filter(s => s.key === 'monthly_rental_url')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-12 h-12"></div>
      </div>
    )
  }

  return (
    <div className="pb-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 lg:mb-6 gap-3">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-800">Paramètres globaux</h1>
        <div className="flex gap-2">
          <button
            onClick={fetchSettings}
            className="h-9 lg:h-10 px-3 lg:px-4 border-2 border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2 text-sm"
          >
            <RefreshCw size={16} className="lg:w-[18px] lg:h-[18px]" />
            <span className="hidden sm:inline">Actualiser</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-9 lg:h-10 px-3 lg:px-4 bg-[#22AF8C] hover:bg-[#1d9a7a] text-white font-semibold rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 text-sm"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="hidden sm:inline">Sauvegarde...</span>
              </>
            ) : (
              <>
                <Save size={16} className="lg:w-[18px] lg:h-[18px]" />
                <span className="hidden sm:inline">Sauvegarder</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Numeric Settings */}
      <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6 mb-4 lg:mb-6">
        <h2 className="text-base lg:text-lg font-semibold text-gray-800 mb-4">Tarification</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-6">
          {numericSettings.map((setting) => {
            const info = numericSettingLabels[setting.key] || {
              label: setting.key,
              unit: '',
              description: setting.description || '',
            }
            return (
              <div key={setting.id} className="border-2 border-gray-200 rounded-xl p-3 lg:p-4 hover:border-[#22AF8C]/30 transition-colors">
                <label className="block text-sm font-semibold text-gray-700 mb-0.5 lg:mb-1">
                  {info.label}
                </label>
                <p className="text-xs text-gray-500 mb-2 lg:mb-3">{info.description}</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={editedNumericValues[setting.key] || 0}
                    onChange={(e) =>
                      setEditedNumericValues({
                        ...editedNumericValues,
                        [setting.key]: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="flex-1 h-10 lg:h-11 px-3 lg:px-4 border-2 border-gray-200 rounded-lg focus:border-[#22AF8C] focus:ring-2 focus:ring-[#22AF8C]/20 transition-all outline-none text-sm lg:text-base"
                  />
                  <span className="text-gray-500 text-xs lg:text-sm font-medium w-10 lg:w-12">{info.unit}</span>
                </div>
              </div>
            )
          })}
        </div>

        {numericSettings.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            Aucun paramètre configuré. Initialisez la base de données d&apos;abord.
          </p>
        )}
      </div>

      {/* Badge Color Settings */}
      {colorSettings.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6 mb-4 lg:mb-6">
          <h2 className="text-base lg:text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Palette size={20} className="text-[#653A8E]" />
            Couleurs des badges véhicules
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-4">
            {colorSettings.map((setting) => {
              const info = colorSettingLabels[setting.key] || {
                label: setting.key,
                description: '',
              }
              const currentColor = editedColorValues[setting.key] || '#653A8E'
              const categoryLetter = setting.key.replace('badge_color_', '').toUpperCase()

              return (
                <div key={setting.id} className="border-2 border-gray-200 rounded-xl p-3 lg:p-4 hover:border-[#653A8E]/30 transition-colors min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="inline-block text-sm px-2 py-1 rounded font-semibold flex-shrink-0"
                      style={{
                        color: currentColor,
                        backgroundColor: `${currentColor}1A`,
                      }}
                    >
                      {categoryLetter}
                    </span>
                    <div className="min-w-0">
                      <label className="block text-sm font-semibold text-gray-700 truncate">
                        {info.label}
                      </label>
                      <p className="text-xs text-gray-500 truncate">{info.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={currentColor}
                      onChange={(e) =>
                        setEditedColorValues({
                          ...editedColorValues,
                          [setting.key]: e.target.value,
                        })
                      }
                      className="w-10 h-10 flex-shrink-0 rounded-lg cursor-pointer border-2 border-gray-200"
                    />
                    <input
                      type="text"
                      value={currentColor}
                      onChange={(e) =>
                        setEditedColorValues({
                          ...editedColorValues,
                          [setting.key]: e.target.value,
                        })
                      }
                      className="min-w-0 flex-1 h-10 px-2 border-2 border-gray-200 rounded-lg focus:border-[#653A8E] focus:ring-2 focus:ring-[#653A8E]/20 transition-all outline-none text-sm font-mono"
                      placeholder="#653A8E"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* URL Settings */}
      {urlSettings.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6 mb-4 lg:mb-6">
          <h2 className="text-base lg:text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Link size={20} className="text-[#653A8E]" />
            Liens de redirection
          </h2>
          <div className="space-y-4">
            {urlSettings.map((setting) => {
              const currentUrl = editedUrlValues[setting.key] || ''
              return (
                <div key={setting.id} className="border-2 border-gray-200 rounded-xl p-3 lg:p-4 hover:border-[#653A8E]/30 transition-colors">
                  <label className="block text-sm font-semibold text-gray-700 mb-0.5 lg:mb-1">
                    URL location mensuelle (+30 jours)
                  </label>
                  <p className="text-xs text-gray-500 mb-2 lg:mb-3">
                    URL de redirection lorsque la durée dépasse 30 jours
                  </p>
                  <input
                    type="url"
                    value={currentUrl}
                    onChange={(e) =>
                      setEditedUrlValues({
                        ...editedUrlValues,
                        [setting.key]: e.target.value,
                      })
                    }
                    placeholder="https://example.com/location-mensuelle"
                    className="w-full h-10 lg:h-11 px-3 lg:px-4 border-2 border-gray-200 rounded-lg focus:border-[#653A8E] focus:ring-2 focus:ring-[#653A8E]/20 transition-all outline-none text-sm lg:text-base"
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Info box */}
      <div className="mt-4 lg:mt-6 bg-[#22AF8C]/10 border border-[#22AF8C]/30 rounded-xl p-3 lg:p-4">
        <h3 className="font-semibold text-[#1d9a7a] mb-2 text-sm lg:text-base">Information</h3>
        <ul className="text-xs lg:text-sm text-gray-700 space-y-1">
          <li>• Les frais de déverrouillage sont ajoutés à chaque location</li>
          <li>• Les km supplémentaires sont facturés au-delà du forfait inclus (100km × nombre de jours)</li>
          <li>• Les options sont optionnelles et s&apos;ajoutent au prix de base</li>
          <li>• Les couleurs des badges affectent l&apos;affichage des catégories de véhicules dans le simulateur</li>
          <li>• L&apos;URL de location mensuelle redirige les utilisateurs pour les demandes de +30 jours</li>
        </ul>
      </div>
    </div>
  )
}
