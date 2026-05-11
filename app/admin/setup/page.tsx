'use client'

import { useState } from 'react'
import { Database, Play, Check, AlertCircle, RefreshCw } from 'lucide-react'

export default function SetupAdmin() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const runSetup = async () => {
    setIsRunning(true)
    setResult(null)

    try {
      const response = await fetch('/api/setup', {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        setResult({ success: true, message: data.message || 'Base de données initialisée avec succès' })
      } else {
        setResult({ success: false, message: data.error || 'Erreur lors de l\'initialisation' })
      }
    } catch (error) {
      setResult({ success: false, message: 'Erreur de connexion au serveur' })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Configuration de la base de données</h1>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-[#653A8E]/20 rounded-lg text-[#653A8E]">
            <Database size={24} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold mb-2">Initialisation de la base de données</h2>
            <p className="text-gray-600 mb-4">
              Cette action va créer les tables nécessaires et insérer les données initiales
              (véhicules, grilles tarifaires, paramètres globaux) dans Supabase.
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={18} />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Attention</p>
                  <p>Les données existantes seront mises à jour si elles existent déjà (upsert).</p>
                </div>
              </div>
            </div>

            <button
              onClick={runSetup}
              disabled={isRunning}
              className="btn-primary flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="animate-spin" size={18} />
                  Initialisation en cours...
                </>
              ) : (
                <>
                  <Play size={18} />
                  Lancer l&apos;initialisation
                </>
              )}
            </button>

            {result && (
              <div
                className={`mt-4 p-4 rounded-lg flex items-start gap-2 ${
                  result.success
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                {result.success ? (
                  <Check className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
                ) : (
                  <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
                )}
                <p className={result.success ? 'text-green-800' : 'text-red-800'}>
                  {result.message}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tables Info */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-700 mb-4">Tables créées</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: 'vehicles', description: '8 véhicules avec catégories et images' },
            { name: 'pricing_grids', description: '5 grilles tarifaires différentes' },
            { name: 'minute_prices', description: 'Prix par minute pour chaque grille' },
            { name: 'global_settings', description: 'Paramètres (frais, km inclus, options)' },
            { name: 'contact_requests', description: 'Demandes de contact des clients' },
          ].map((table) => (
            <div
              key={table.name}
              className="border border-gray-200 rounded-lg p-4"
            >
              <p className="font-mono text-sm font-medium text-[#653A8E] mb-1">
                {table.name}
              </p>
              <p className="text-xs text-gray-500">{table.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SQL Info */}
      <div className="mt-6 bg-gray-50 rounded-xl p-6">
        <h3 className="font-semibold text-gray-700 mb-4">Données initiales</h3>
        <div className="space-y-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-700">Véhicules (8)</h4>
            <p className="text-gray-500">
              Toyota Aygo X (S), Toyota Yaris (M), Toyota Yaris Cross (L),
              Toyota Yaris Cross hiver (L), Renault Kangoo E-Tech (L),
              Toyota Proace (L), Ford Transit (XL), Maxus Deliver (XL)
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-700">Paramètres globaux</h4>
            <ul className="text-gray-500 list-disc list-inside">
              <li>Frais de déverrouillage: 1,49€</li>
              <li>Prix km supplémentaire: 0,30€</li>
              <li>Km inclus par jour: 100</li>
              <li>Option aéroport: 12,99€</li>
              <li>Option pré-livraison: 10,00€</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700">Grilles tarifaires (5)</h4>
            <p className="text-gray-500">
              Grid S, Grid M, Grid L, Grid L-Util, Grid XL avec tarifs dégressifs
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
