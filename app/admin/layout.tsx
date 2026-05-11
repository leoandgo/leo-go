'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import {
  Car,
  Settings,
  DollarSign,
  Mail,
  LogOut,
  Home,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { ToastProvider } from '@/components/Toast'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session && pathname !== '/admin/login') {
        router.push('/admin/login')
      } else {
        setUser(session?.user || null)
      }
      setLoading(false)
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/admin/login')
      } else if (session) {
        setUser(session.user)
      }
    })

    return () => subscription.unsubscribe()
  }, [router, pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="spinner w-12 h-12"></div>
      </div>
    )
  }

  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  if (!user) {
    return null
  }

  const navItems = [
    { href: '/admin', label: 'Tableau de bord', icon: Home },
    { href: '/admin/vehicles', label: 'Véhicules', icon: Car },
    { href: '/admin/pricing', label: 'Tarification', icon: DollarSign },
    { href: '/admin/settings', label: 'Paramètres', icon: Settings },
    { href: '/admin/contacts', label: 'Demandes', icon: Mail },
  ]

  return (
    <ToastProvider>
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      {/* Mobile header */}
      <div className="lg:hidden bg-white shadow-sm px-4 py-3 flex items-center justify-between flex-shrink-0">
        <span className="text-xl font-bold">
          <span className="text-green-500">LEO</span>
          <span className="text-[#653A8E]">&</span>
          <span className="text-green-500">Go</span>
          <span className="ml-2 text-gray-600 text-sm font-normal">Admin</span>
        </span>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:relative inset-y-0 left-0 z-50
            admin-sidebar transform transition-all duration-200 flex-shrink-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            ${sidebarCollapsed ? 'lg:w-20' : 'w-64'}
          `}
        >
          <div className={`p-6 ${sidebarCollapsed ? 'lg:px-4' : ''}`}>
            <div className={`flex items-center mb-8 ${sidebarCollapsed ? 'lg:flex-col lg:gap-3' : 'justify-between'}`}>
              <Link href="/" className={sidebarCollapsed ? 'lg:hidden' : ''}>
                <span className="text-2xl font-bold text-white">
                  LEO<span className="text-green-300">&</span>Go
                  <span className="block text-sm font-normal text-white/70 mt-1">
                    Administration
                  </span>
                </span>
              </Link>
              {/* Collapsed: show L&G + expand button */}
              {sidebarCollapsed && (
                <div className="hidden lg:flex flex-col items-center gap-2">
                  <Link href="/">
                    <span className="text-xl font-bold text-white">L&G</span>
                  </Link>
                  <button
                    onClick={() => setSidebarCollapsed(false)}
                    className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                    title="Agrandir le menu"
                  >
                    <Menu size={20} />
                  </button>
                </div>
              )}
              {/* Expanded: show collapse button */}
              {!sidebarCollapsed && (
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  className="hidden lg:flex p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                  title="Réduire le menu"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`admin-nav-item flex items-center gap-3 ${isActive ? 'active' : ''} ${sidebarCollapsed ? 'lg:justify-center lg:px-2' : ''}`}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <Icon size={20} className="flex-shrink-0" />
                    <span className={sidebarCollapsed ? 'lg:hidden' : ''}>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className={`absolute bottom-0 left-0 right-0 p-6 ${sidebarCollapsed ? 'lg:px-4' : ''}`}>
            <div className={`text-white/60 text-sm mb-3 truncate ${sidebarCollapsed ? 'lg:hidden' : ''}`}>
              {user.email}
            </div>
            <button
              onClick={handleLogout}
              className={`admin-nav-item flex items-center gap-3 w-full text-left ${sidebarCollapsed ? 'lg:justify-center lg:px-2' : ''}`}
              title={sidebarCollapsed ? 'Déconnexion' : undefined}
            >
              <LogOut size={20} className="flex-shrink-0" />
              <span className={sidebarCollapsed ? 'lg:hidden' : ''}>Déconnexion</span>
            </button>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
    </ToastProvider>
  )
}
