'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Car, Users, DollarSign, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  vehicleCount: number
  contactCount: number
  pendingContacts: number
  pricingGrids: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    vehicleCount: 0,
    contactCount: 0,
    pendingContacts: 0,
    pricingGrids: 0,
  })
  const [recentContacts, setRecentContacts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch vehicle count
        const { count: vehicleCount } = await supabase
          .from('vehicles')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)

        // Fetch contact counts
        const { count: contactCount } = await supabase
          .from('contact_requests')
          .select('*', { count: 'exact', head: true })

        const { count: pendingContacts } = await supabase
          .from('contact_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')

        // Fetch pricing grids count
        const { count: pricingGrids } = await supabase
          .from('pricing_grids')
          .select('*', { count: 'exact', head: true })

        // Fetch recent contacts
        const { data: contacts } = await supabase
          .from('contact_requests')
          .select(`
            *,
            vehicles(model_name)
          `)
          .order('created_at', { ascending: false })
          .limit(5)

        setStats({
          vehicleCount: vehicleCount || 0,
          contactCount: contactCount || 0,
          pendingContacts: pendingContacts || 0,
          pricingGrids: pricingGrids || 0,
        })
        setRecentContacts(contacts || [])
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statCards = [
    {
      label: 'Véhicules actifs',
      value: stats.vehicleCount,
      icon: Car,
      color: 'bg-green-500',
      href: '/admin/vehicles',
    },
    {
      label: 'Demandes en attente',
      value: stats.pendingContacts,
      icon: Users,
      color: 'bg-yellow-500',
      href: '/admin/contacts',
    },
    {
      label: 'Total demandes',
      value: stats.contactCount,
      icon: TrendingUp,
      color: 'bg-blue-500',
      href: '/admin/contacts',
    },
    {
      label: 'Grilles tarifaires',
      value: stats.pricingGrids,
      icon: DollarSign,
      color: 'bg-[#653A8E]',
      href: '/admin/pricing',
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-12 h-12"></div>
      </div>
    )
  }

  return (
    <div className="pb-4">
      <h1 className="text-xl lg:text-2xl font-bold text-gray-800 mb-4 lg:mb-6">Tableau de bord</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6 lg:mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="bg-white rounded-xl p-3 lg:p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 lg:gap-4">
                <div className={`${stat.color} p-2 lg:p-3 rounded-lg text-white`}>
                  <Icon size={18} className="lg:w-6 lg:h-6" />
                </div>
                <div>
                  <p className="text-xl lg:text-2xl font-bold text-gray-800">{stat.value}</p>
                  <p className="text-xs lg:text-sm text-gray-500">{stat.label}</p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Recent Contacts */}
      <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base lg:text-lg font-semibold text-gray-800">
            Dernières demandes
          </h2>
          <Link
            href="/admin/contacts"
            className="text-[#653A8E] text-xs lg:text-sm hover:underline"
          >
            Voir tout
          </Link>
        </div>

        {recentContacts.length === 0 ? (
          <p className="text-gray-500 text-center py-8 text-sm">
            Aucune demande de contact pour le moment
          </p>
        ) : (
          <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
            <table className="data-table text-sm">
              <thead>
                <tr>
                  <th>Email</th>
                  <th className="hidden sm:table-cell">Véhicule</th>
                  <th>Prix</th>
                  <th className="hidden md:table-cell">Date</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {recentContacts.map((contact) => (
                  <tr key={contact.id}>
                    <td className="font-medium text-xs lg:text-sm max-w-[120px] lg:max-w-none truncate">{contact.email}</td>
                    <td className="hidden sm:table-cell text-xs lg:text-sm">{contact.vehicles?.model_name || '-'}</td>
                    <td className="text-xs lg:text-sm">
                      {contact.estimated_price
                        ? `${contact.estimated_price.toFixed(0)}€`
                        : '-'}
                    </td>
                    <td className="hidden md:table-cell text-xs lg:text-sm">
                      {new Date(contact.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td>
                      <span
                        className={`px-1.5 lg:px-2 py-0.5 lg:py-1 rounded-full text-xs font-medium ${
                          contact.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : contact.status === 'contacted'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {contact.status === 'pending'
                          ? 'Attente'
                          : contact.status === 'contacted'
                          ? 'Contacté'
                          : 'Fermé'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
