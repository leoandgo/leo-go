'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { adminFetch } from '@/lib/adminClient'
import { ContactRequest } from '@/types/database'
import {
  Mail,
  Clock,
  Car,
  Timer,
  MapPin,
  Euro,
  Plane,
  Truck,
  Calendar,
  ArrowRight,
  Inbox,
  MessageSquare,
  CheckCircle2,
  RefreshCw
} from 'lucide-react'
import { useToast } from '@/components/Toast'

interface ContactWithVehicle extends ContactRequest {
  vehicles?: { model_name: string } | null
}

export default function ContactsAdmin() {
  const { showToast } = useToast()
  const [contacts, setContacts] = useState<ContactWithVehicle[]>([])
  const [allContacts, setAllContacts] = useState<ContactWithVehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchContacts()
  }, [])

  useEffect(() => {
    if (filter === 'all') {
      setContacts(allContacts)
    } else {
      setContacts(allContacts.filter(c => c.status === filter))
    }
  }, [filter, allContacts])

  const fetchContacts = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('contact_requests') as any)
        .select(`
          *,
          vehicles(model_name)
        `)
        .order('created_at', { ascending: false })

      const contactsData = (data || []) as ContactWithVehicle[]
      setAllContacts(contactsData)
      setContacts(contactsData)
    } catch (error) {
      console.error('Error fetching contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      // Use API route to avoid CORS/network issues with direct Supabase calls
      const response = await adminFetch(`/api/contacts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API error:', errorData)
        showToast(`Erreur: ${errorData.error || 'Mise à jour échouée'}`, 'error')
        return
      }

      await fetchContacts()
      showToast('Statut mis à jour avec succès', 'success')
    } catch (error) {
      console.error('Error updating status:', error)
      showToast(`Erreur réseau: ${error instanceof Error ? error.message : 'Connexion échouée'}`, 'error')
    }
  }

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '-'
    const days = Math.floor(minutes / 1440)
    const hours = Math.floor((minutes % 1440) / 60)
    const mins = minutes % 60

    let text = ''
    if (days > 0) text += `${days}j `
    if (hours > 0) text += `${hours}h `
    if (mins > 0) text += `${mins}min`
    return text.trim() || '0 min'
  }

  const formatShortDate = (date: string) => {
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const statusConfig = {
    pending: {
      label: 'En attente',
      color: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: Clock,
      bgCard: 'border-l-amber-400'
    },
    contacted: {
      label: 'Contacté',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: MessageSquare,
      bgCard: 'border-l-blue-400'
    },
    closed: {
      label: 'Fermé',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: CheckCircle2,
      bgCard: 'border-l-green-400'
    },
  }

  // Calculate stats
  const stats = {
    total: allContacts.length,
    pending: allContacts.filter(c => c.status === 'pending').length,
    contacted: allContacts.filter(c => c.status === 'contacted').length,
    closed: allContacts.filter(c => c.status === 'closed').length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-12 h-12"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto pb-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 lg:mb-8 gap-3">
        <div>
          <h1 className="text-xl lg:text-3xl font-bold text-gray-900">Demandes de contact</h1>
          <p className="text-gray-500 mt-0.5 lg:mt-1 text-sm lg:text-base">Gérez les demandes de devis</p>
        </div>
        <button
          onClick={fetchContacts}
          className="flex items-center gap-2 px-3 lg:px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors self-start sm:self-auto"
        >
          <RefreshCw size={16} className="lg:w-[18px] lg:h-[18px]" />
          <span className="font-medium text-sm lg:text-base">Actualiser</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4 mb-4 lg:mb-8">
        <div
          onClick={() => setFilter('all')}
          className={`bg-white rounded-xl p-3 lg:p-5 shadow-sm cursor-pointer transition-all hover:shadow-md ${filter === 'all' ? 'ring-2 ring-[#653A8E]' : ''
            }`}
        >
          <div className="flex items-center justify-between mb-2 lg:mb-3">
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-[#653A8E]/20 flex items-center justify-center">
              <Inbox className="text-[#653A8E]" size={16} />
            </div>
            <span className="text-2xl lg:text-3xl font-bold text-gray-900">{stats.total}</span>
          </div>
          <p className="text-xs lg:text-sm font-semibold text-gray-600">Total</p>
        </div>

        <div
          onClick={() => setFilter('pending')}
          className={`bg-white rounded-xl p-3 lg:p-5 shadow-sm cursor-pointer transition-all hover:shadow-md ${filter === 'pending' ? 'ring-2 ring-amber-500' : ''
            }`}
        >
          <div className="flex items-center justify-between mb-2 lg:mb-3">
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="text-amber-600" size={16} />
            </div>
            <span className="text-2xl lg:text-3xl font-bold text-amber-600">{stats.pending}</span>
          </div>
          <p className="text-xs lg:text-sm font-semibold text-gray-600">En attente</p>
        </div>

        <div
          onClick={() => setFilter('contacted')}
          className={`bg-white rounded-xl p-3 lg:p-5 shadow-sm cursor-pointer transition-all hover:shadow-md ${filter === 'contacted' ? 'ring-2 ring-blue-500' : ''
            }`}
        >
          <div className="flex items-center justify-between mb-2 lg:mb-3">
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <MessageSquare className="text-blue-600" size={16} />
            </div>
            <span className="text-2xl lg:text-3xl font-bold text-blue-600">{stats.contacted}</span>
          </div>
          <p className="text-xs lg:text-sm font-semibold text-gray-600">Contactés</p>
        </div>

        <div
          onClick={() => setFilter('closed')}
          className={`bg-white rounded-xl p-3 lg:p-5 shadow-sm cursor-pointer transition-all hover:shadow-md ${filter === 'closed' ? 'ring-2 ring-green-500' : ''
            }`}
        >
          <div className="flex items-center justify-between mb-2 lg:mb-3">
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="text-green-600" size={16} />
            </div>
            <span className="text-2xl lg:text-3xl font-bold text-green-600">{stats.closed}</span>
          </div>
          <p className="text-xs lg:text-sm font-semibold text-gray-600">Fermés</p>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 mb-4 lg:mb-6 flex-wrap">
        {['all', 'pending', 'contacted', 'closed'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2.5 lg:px-4 py-1.5 lg:py-2 rounded-full text-xs lg:text-sm font-semibold transition-all ${filter === f
              ? 'bg-gray-900 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
          >
            {f === 'all' ? 'Toutes' : statusConfig[f as keyof typeof statusConfig]?.label}
            <span className={`ml-1.5 lg:ml-2 px-1.5 lg:px-2 py-0.5 rounded-full text-xs ${filter === f ? 'bg-white/20' : 'bg-gray-100'
              }`}>
              {f === 'all' ? stats.total : stats[f as keyof typeof stats]}
            </span>
          </button>
        ))}
      </div>

      {/* Contact List */}
      {contacts.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-8 lg:p-16 text-center">
          <div className="w-16 h-16 lg:w-20 lg:h-20 mx-auto mb-4 lg:mb-6 rounded-full bg-gray-100 flex items-center justify-center">
            <Mail className="text-gray-400" size={28} />
          </div>
          <h3 className="text-lg lg:text-xl font-bold text-gray-800 mb-2">Aucune demande</h3>
          <p className="text-gray-500 text-sm lg:text-base">
            {filter === 'all'
              ? "Aucune demande de contact"
              : `Aucune demande "${statusConfig[filter as keyof typeof statusConfig]?.label}"`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3 lg:space-y-4">
          {contacts.map((contact) => {
            const status = statusConfig[contact.status as keyof typeof statusConfig]
            const StatusIcon = status?.icon || Clock
            return (
              <div
                key={contact.id}
                className={`bg-white rounded-xl shadow-sm border-l-4 ${status?.bgCard} overflow-hidden hover:shadow-md transition-shadow`}
              >
                {/* Header Section */}
                <div className="p-3 lg:p-6 pb-2 lg:pb-4">
                  <div className="flex flex-col gap-3 lg:gap-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 lg:gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-[#653A8E] to-[#7d4fa8] flex items-center justify-center text-white font-bold text-sm lg:text-base flex-shrink-0">
                          {contact.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm lg:text-lg text-gray-900 truncate">{contact.email}</h3>
                          <p className="text-xs lg:text-sm text-gray-500">
                            {formatShortDate(contact.created_at)}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 lg:px-3 py-1 lg:py-1.5 rounded-full text-xs font-bold flex items-center gap-1 lg:gap-1.5 border flex-shrink-0 ${status?.color}`}>
                        <StatusIcon size={12} className="lg:w-3.5 lg:h-3.5" />
                        <span className="hidden sm:inline">{status?.label}</span>
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {contact.status === 'pending' && (
                        <button
                          onClick={() => updateStatus(contact.id, 'contacted')}
                          className="flex-1 sm:flex-none px-3 lg:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs lg:text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 lg:gap-2"
                        >
                          <MessageSquare size={14} className="lg:w-4 lg:h-4" />
                          <span>Contacté</span>
                        </button>
                      )}
                      {contact.status === 'contacted' && (
                        <button
                          onClick={() => updateStatus(contact.id, 'closed')}
                          className="flex-1 sm:flex-none px-3 lg:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs lg:text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 lg:gap-2"
                        >
                          <CheckCircle2 size={14} className="lg:w-4 lg:h-4" />
                          <span>Fermer</span>
                        </button>
                      )}
                      {contact.status === 'closed' && (
                        <button
                          onClick={() => updateStatus(contact.id, 'pending')}
                          className="flex-1 sm:flex-none px-3 lg:px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs lg:text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 lg:gap-2"
                        >
                          <RefreshCw size={14} className="lg:w-4 lg:h-4" />
                          <span>Rouvrir</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Details Section */}
                <div className="px-3 lg:px-6 pb-3 lg:pb-6">
                  <div className="bg-gray-50 rounded-xl p-3 lg:p-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
                      <div className="flex items-center gap-2 lg:gap-3">
                        <div className="w-7 h-7 lg:w-9 lg:h-9 rounded-lg bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                          <Car className="text-[#653A8E]" size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500 font-medium">Véhicule</p>
                          <p className="font-bold text-gray-900 text-xs lg:text-sm truncate">{contact.vehicles?.model_name || '-'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 lg:gap-3">
                        <div className="w-7 h-7 lg:w-9 lg:h-9 rounded-lg bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                          <Timer className="text-blue-600" size={14} />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Durée</p>
                          <p className="font-bold text-gray-900 text-xs lg:text-sm">{formatDuration(contact.duration_minutes)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 lg:gap-3">
                        <div className="w-7 h-7 lg:w-9 lg:h-9 rounded-lg bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                          <MapPin className="text-orange-600" size={14} />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Distance</p>
                          <p className="font-bold text-gray-900 text-xs lg:text-sm">{contact.distance_km ? `${contact.distance_km} km` : '-'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 lg:gap-3">
                        <div className="w-7 h-7 lg:w-9 lg:h-9 rounded-lg bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                          <Euro className="text-green-600" size={14} />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Prix</p>
                          <p className="font-bold text-green-600 text-sm lg:text-lg">
                            {contact.estimated_price ? `${contact.estimated_price.toFixed(0)}€` : '-'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Options & Dates Row */}
                    {(contact.airport_option || contact.predelivery_option || contact.departure_datetime || contact.return_datetime) && (
                      <div className="mt-3 lg:mt-4 pt-3 lg:pt-4 border-t border-gray-200 flex flex-wrap items-center gap-2 lg:gap-3">
                        {contact.airport_option && (
                          <span className="px-2 lg:px-3 py-1 lg:py-1.5 bg-[#653A8E]/20 text-[#653A8E] rounded-lg text-xs lg:text-sm font-semibold flex items-center gap-1 lg:gap-1.5">
                            <Plane size={12} className="lg:w-3.5 lg:h-3.5" />
                            <span>Aéroport</span>
                          </span>
                        )}
                        {contact.predelivery_option && (
                          <span className="px-2 lg:px-3 py-1 lg:py-1.5 bg-[#653A8E]/20 text-[#653A8E] rounded-lg text-xs lg:text-sm font-semibold flex items-center gap-1 lg:gap-1.5">
                            <Truck size={12} className="lg:w-3.5 lg:h-3.5" />
                            <span>Pré-livraison</span>
                          </span>
                        )}

                        {(contact.departure_datetime || contact.return_datetime) && (
                          <div className="flex items-center gap-1.5 lg:gap-2 ml-auto text-xs lg:text-sm text-gray-600">
                            <Calendar size={12} className="text-gray-400 lg:w-3.5 lg:h-3.5" />
                            {contact.departure_datetime && (
                              <span className="font-medium">{formatShortDate(contact.departure_datetime)}</span>
                            )}
                            {contact.departure_datetime && contact.return_datetime && (
                              <ArrowRight size={12} className="text-gray-400" />
                            )}
                            {contact.return_datetime && (
                              <span className="font-medium">{formatShortDate(contact.return_datetime)}</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
