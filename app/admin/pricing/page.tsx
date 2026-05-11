'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { PricingGrid, MinutePrice } from '@/types/database'
import { Upload, Download, Plus, Edit2, Trash2 } from 'lucide-react'
import { useToast } from '@/components/Toast'
import ConfirmModal from '@/components/ConfirmModal'

export default function PricingAdmin() {
  const { showToast } = useToast()
  const [grids, setGrids] = useState<PricingGrid[]>([])
  const [selectedGrid, setSelectedGrid] = useState<string | null>(null)
  const [prices, setPrices] = useState<MinutePrice[]>([])
  const [loading, setLoading] = useState(true)
  const [pricesLoading, setPricesLoading] = useState(false)
  const [showGridForm, setShowGridForm] = useState(false)
  const [editingGrid, setEditingGrid] = useState<PricingGrid | null>(null)
  const [gridForm, setGridForm] = useState({ name: '', description: '' })
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean
    gridId: string | null
    gridName: string
    vehiclesUsingGrid: string[]
  }>({ isOpen: false, gridId: null, gridName: '', vehiclesUsingGrid: [] })

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(100)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    fetchGrids()
  }, [])

  useEffect(() => {
    if (selectedGrid) {
      setCurrentPage(1) // Reset to page 1 when grid changes
      fetchPrices(selectedGrid, 1, pageSize)
    }
  }, [selectedGrid])

  useEffect(() => {
    if (selectedGrid) {
      fetchPrices(selectedGrid, currentPage, pageSize)
    }
  }, [currentPage, pageSize])

  const fetchGrids = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('pricing_grids') as any)
        .select('*')
        .order('name')

      const gridsData = (data || []) as PricingGrid[]
      setGrids(gridsData)
      if (gridsData.length > 0 && !selectedGrid) {
        setSelectedGrid(gridsData[0].id)
      }
    } catch (error) {
      console.error('Error fetching grids:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPrices = async (gridId: string, page: number = 1, size: number = 100) => {
    setPricesLoading(true)
    try {
      const from = (page - 1) * size
      const to = from + size - 1

      // Get total count first
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count } = await (supabase.from('minute_prices') as any)
        .select('*', { count: 'exact', head: true })
        .eq('pricing_grid_id', gridId)

      setTotalCount(count || 0)

      // Then fetch paginated data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('minute_prices') as any)
        .select('*')
        .eq('pricing_grid_id', gridId)
        .order('duration_minutes')
        .range(from, to)

      setPrices((data || []) as MinutePrice[])
    } catch (error) {
      console.error('Error fetching prices:', error)
    } finally {
      setPricesLoading(false)
    }
  }

  const handleSaveGrid = async () => {
    try {
      if (editingGrid) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('pricing_grids') as any)
          .update(gridForm)
          .eq('id', editingGrid.id)
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('pricing_grids') as any).insert(gridForm)
      }
      await fetchGrids()
      setShowGridForm(false)
      setEditingGrid(null)
      setGridForm({ name: '', description: '' })
    } catch (error) {
      console.error('Error saving grid:', error)
      showToast('Erreur lors de la sauvegarde', 'error')
    }
  }

  const handleDeleteGridClick = async (id: string) => {
    const grid = grids.find((g) => g.id === id)
    if (!grid) return

    // Check if any vehicles are using this grid
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: vehiclesUsingGrid } = await (supabase.from('vehicles') as any)
      .select('model_name')
      .eq('pricing_grid_id', id)

    setDeleteConfirm({
      isOpen: true,
      gridId: id,
      gridName: grid.name,
      vehiclesUsingGrid: (vehiclesUsingGrid || []).map((v: { model_name: string }) => v.model_name),
    })
  }

  const confirmDeleteGrid = async () => {
    const id = deleteConfirm.gridId
    if (!id) return

    try {
      // Deactivate vehicles using this grid (they'll need a new grid before being reactivated)
      if (deleteConfirm.vehiclesUsingGrid.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('vehicles') as any)
          .update({ is_active: false, pricing_grid_id: null })
          .eq('pricing_grid_id', id)
      }

      // Delete all prices
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('minute_prices') as any).delete().eq('pricing_grid_id', id)
      // Then delete the grid
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('pricing_grids') as any).delete().eq('id', id)
      await fetchGrids()
      if (selectedGrid === id) {
        setSelectedGrid(grids.find((g) => g.id !== id)?.id || null)
      }

      if (deleteConfirm.vehiclesUsingGrid.length > 0) {
        showToast(`Grille supprimée. ${deleteConfirm.vehiclesUsingGrid.length} véhicule(s) désactivé(s).`, 'success')
      } else {
        showToast('Grille supprimée avec succès', 'success')
      }
    } catch (error) {
      console.error('Error deleting grid:', error)
      showToast('Erreur lors de la suppression', 'error')
    } finally {
      setDeleteConfirm({ isOpen: false, gridId: null, gridName: '', vehiclesUsingGrid: [] })
    }
  }

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedGrid) return

    try {
      const text = await file.text()
      const lines = text.split('\n')
      const prices: { pricing_grid_id: string; duration_minutes: number; price_ttc: number; km_included: number }[] = []

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        const parts = line.split(/[,;\t]/)
        if (parts.length >= 3) {
          const duration_minutes = parseInt(parts[0])
          const price_ttc = parseFloat(parts[1].replace(',', '.'))
          const km_included = parseInt(parts[2]) || Math.ceil(duration_minutes / 1440) * 100

          if (!isNaN(duration_minutes) && !isNaN(price_ttc)) {
            prices.push({
              pricing_grid_id: selectedGrid,
              duration_minutes,
              price_ttc,
              km_included,
            })
          }
        }
      }

      if (prices.length === 0) {
        showToast('Aucun prix valide trouvé dans le fichier', 'error')
        return
      }

      // Delete existing prices and insert new ones
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('minute_prices') as any).delete().eq('pricing_grid_id', selectedGrid)

      // Insert in batches of 1000
      for (let i = 0; i < prices.length; i += 1000) {
        const batch = prices.slice(i, i + 1000)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('minute_prices') as any).insert(batch)
      }

      showToast(`${prices.length} prix importés avec succès`, 'success')
      setCurrentPage(1)
      await fetchPrices(selectedGrid, 1, pageSize)
    } catch (error) {
      console.error('Error importing CSV:', error)
      showToast('Erreur lors de l\'import', 'error')
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleExportCSV = async () => {
    if (!selectedGrid || totalCount === 0) return

    const grid = grids.find((g) => g.id === selectedGrid)

    // Fetch all data for export in batches (Supabase default limit is 1000)
    const allPrices: MinutePrice[] = []
    const batchSize = 1000
    let offset = 0
    let hasMore = true

    while (hasMore) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('minute_prices') as any)
        .select('*')
        .eq('pricing_grid_id', selectedGrid)
        .order('duration_minutes')
        .range(offset, offset + batchSize - 1)

      if (data && data.length > 0) {
        allPrices.push(...data)
        offset += batchSize
        hasMore = data.length === batchSize
      } else {
        hasMore = false
      }
    }

    if (allPrices.length === 0) return

    const header = 'duration_minutes,price_ttc,km_included'
    const rows = allPrices.map((p: MinutePrice) => `${p.duration_minutes},${p.price_ttc},${p.km_included}`)
    const csv = [header, ...rows].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tarifs_${grid?.name.replace(/\s+/g, '_')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours < 24) return `${hours}h${mins > 0 ? mins : ''}`
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24
    return `${days}j ${remainingHours > 0 ? remainingHours + 'h' : ''}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-12 h-12"></div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-4 lg:mb-6 flex-shrink-0">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-800">Gestion des tarifs</h1>
        <button
          onClick={() => {
            setEditingGrid(null)
            setGridForm({ name: '', description: '' })
            setShowGridForm(true)
          }}
          className="h-10 px-4 bg-[#22AF8C] hover:bg-[#1d9a7a] text-white font-semibold rounded-lg transition-all flex items-center gap-2"
        >
          <Plus size={20} />
          Nouvelle grille
        </button>
      </div>

      {/* Grid Form Modal */}
      {showGridForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              {editingGrid ? 'Modifier la grille' : 'Nouvelle grille tarifaire'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  value={gridForm.name}
                  onChange={(e) => setGridForm({ ...gridForm, name: e.target.value })}
                  className="w-full h-11 px-4 border-2 border-gray-200 rounded-lg focus:border-[#22AF8C] focus:ring-2 focus:ring-[#22AF8C]/20 transition-all outline-none"
                  placeholder="Grid S - Toyota Aygo X"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={gridForm.description}
                  onChange={(e) => setGridForm({ ...gridForm, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#22AF8C] focus:ring-2 focus:ring-[#22AF8C]/20 transition-all outline-none resize-none"
                  rows={3}
                  placeholder="Description de la grille..."
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowGridForm(false)} className="h-10 px-4 border-2 border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all">
                Annuler
              </button>
              <button onClick={handleSaveGrid} className="h-10 px-4 bg-[#22AF8C] hover:bg-[#1d9a7a] text-white font-semibold rounded-lg transition-all">
                {editingGrid ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6 flex-1 min-h-0 overflow-hidden">
        {/* Grid List - Horizontal scroll on mobile */}
        <div className="lg:col-span-1 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm p-3 lg:p-4">
            <h3 className="font-semibold text-gray-700 mb-2 lg:mb-3 text-sm lg:text-base">Grilles tarifaires</h3>
            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 -mx-1 px-1 lg:mx-0 lg:px-0">
              {grids.map((grid) => (
                <div
                  key={grid.id}
                  className={`p-2 lg:p-3 rounded-lg cursor-pointer flex items-center justify-between group flex-shrink-0 min-w-[140px] lg:min-w-0 ${selectedGrid === grid.id
                    ? 'bg-[#22AF8C]/10 border border-[#22AF8C]'
                    : 'hover:bg-gray-50 border border-gray-200 lg:border-transparent'
                    }`}
                  onClick={() => setSelectedGrid(grid.id)}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-xs lg:text-sm truncate">{grid.name}</p>
                    {grid.description && (
                      <p className="text-xs text-gray-500 mt-1 hidden lg:block">{grid.description}</p>
                    )}
                  </div>
                  <div className="opacity-100 lg:opacity-0 group-hover:opacity-100 flex gap-1 ml-2 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingGrid(grid)
                        setGridForm({ name: grid.name, description: grid.description || '' })
                        setShowGridForm(true)
                      }}
                      className="p-1.5 lg:p-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteGridClick(grid.id)
                      }}
                      className="p-1.5 lg:p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Prices Table */}
        <div className="lg:col-span-3 flex flex-col min-h-0 flex-1">
          <div className="bg-white rounded-xl shadow-sm flex-1 flex flex-col min-h-0">
            <div className="p-3 lg:p-4 border-b flex items-center justify-between gap-2 flex-shrink-0">
              <h3 className="font-semibold text-gray-700 text-sm lg:text-base whitespace-nowrap">
                Prix ({totalCount.toLocaleString()})
              </h3>
              <div className="flex items-center gap-2">
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  style={{ padding: '6px 10px', minWidth: '50px' }}
                  className="h-9 lg:h-10 text-xs lg:text-sm border border-gray-200 rounded-lg focus:border-[#22AF8C] focus:ring-1 focus:ring-[#22AF8C]/20 outline-none bg-white"
                >
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={250}>250</option>
                  <option value={500}>500</option>
                  <option value={1000}>1000</option>
                </select>
                {/* Import CSV */}
                {true && (
                  <>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".csv,.txt"
                      onChange={handleImportCSV}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={!selectedGrid}
                      className="h-9 px-3 border-2 border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2 text-sm disabled:opacity-50"
                    >
                      <Upload size={16} />
                      Importer CSV
                    </button>
                  </>
                )}
                <button
                  onClick={handleExportCSV}
                  disabled={!selectedGrid || prices.length === 0}
                  className="h-9 px-2 lg:px-3 border-2 border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all flex items-center gap-1 lg:gap-2 text-xs lg:text-sm disabled:opacity-50"
                >
                  <Download size={14} className="lg:w-4 lg:h-4" />
                  <span className="hidden sm:inline">Exporter</span>
                </button>
              </div>
            </div>

            {pricesLoading ? (
              <div className="flex items-center justify-center flex-1">
                <div className="spinner w-8 h-8"></div>
              </div>
            ) : prices.length === 0 ? (
              <div className="text-center py-12 text-gray-500 flex-1 flex flex-col items-center justify-center">
                <p>Aucun prix configuré pour cette grille</p>
                <p className="text-sm mt-2">
                  Importez un fichier CSV avec les colonnes: duration_minutes, price_ttc, km_included
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto flex-1 overflow-y-auto">
                  <table className="data-table">
                    <thead className="sticky top-0 bg-gray-50">
                      <tr>
                        <th>Durée</th>
                        <th>Minutes</th>
                        <th>Prix TTC</th>
                        <th>Km inclus</th>
                        <th>Prix/min</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prices.map((price) => (
                        <tr key={price.id}>
                          <td className="font-medium">
                            {formatDuration(price.duration_minutes)}
                          </td>
                          <td className="text-gray-500">{price.duration_minutes}</td>
                          <td className="text-[#22AF8C] font-medium">
                            {price.price_ttc.toFixed(2)}€
                          </td>
                          <td>{price.km_included} km</td>
                          <td className="text-gray-500 text-sm">
                            {(price.price_ttc / price.duration_minutes).toFixed(4)}€
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="p-3 lg:p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
                  <div className="text-xs lg:text-sm text-gray-500 order-2 sm:order-1">
                    {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalCount)} / {totalCount.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1 lg:gap-2 order-1 sm:order-2">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="h-8 w-8 lg:w-auto lg:px-3 text-xs lg:text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      ««
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="h-8 px-2 lg:px-3 text-xs lg:text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="hidden sm:inline">Précédent</span>
                      <span className="sm:hidden">‹</span>
                    </button>
                    <div className="flex items-center gap-1 mx-1 lg:mx-2">
                      <input
                        type="number"
                        min={1}
                        max={Math.ceil(totalCount / pageSize)}
                        value={currentPage}
                        onChange={(e) => {
                          const page = parseInt(e.target.value)
                          if (page >= 1 && page <= Math.ceil(totalCount / pageSize)) {
                            setCurrentPage(page)
                          }
                        }}
                        className="w-12 lg:w-16 h-8 px-1 lg:px-2 text-xs lg:text-sm text-center border border-gray-200 rounded-lg focus:border-[#22AF8C] outline-none"
                      />
                      <span className="text-xs lg:text-sm text-gray-600">/{Math.ceil(totalCount / pageSize)}</span>
                    </div>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalCount / pageSize), p + 1))}
                      disabled={currentPage >= Math.ceil(totalCount / pageSize)}
                      className="h-8 px-2 lg:px-3 text-xs lg:text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="hidden sm:inline">Suivant</span>
                      <span className="sm:hidden">›</span>
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.ceil(totalCount / pageSize))}
                      disabled={currentPage >= Math.ceil(totalCount / pageSize)}
                      className="h-8 w-8 lg:w-auto lg:px-3 text-xs lg:text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      »»
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Supprimer la grille tarifaire"
        message={
          deleteConfirm.vehiclesUsingGrid.length > 0
            ? `Attention: Cette grille "${deleteConfirm.gridName}" est utilisée par ${deleteConfirm.vehiclesUsingGrid.length} véhicule(s): ${deleteConfirm.vehiclesUsingGrid.join(', ')}. Ces véhicules seront automatiquement désactivés et ne seront plus visibles pour les clients jusqu'à ce qu'une nouvelle grille leur soit assignée.`
            : `Êtes-vous sûr de vouloir supprimer la grille "${deleteConfirm.gridName}" et tous ses prix ?`
        }
        confirmText="Supprimer"
        cancelText="Annuler"
        variant={deleteConfirm.vehiclesUsingGrid.length > 0 ? 'warning' : 'danger'}
        onConfirm={confirmDeleteGrid}
        onCancel={() => setDeleteConfirm({ isOpen: false, gridId: null, gridName: '', vehiclesUsingGrid: [] })}
      />
    </div>
  )
}
