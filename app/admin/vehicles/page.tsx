'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { adminFetch } from '@/lib/adminClient'
import { Vehicle, PricingGrid } from '@/types/database'
import { Plus, Edit2, Trash2, Save, X, Upload, Image as ImageIcon } from 'lucide-react'
import { useToast } from '@/components/Toast'
import ConfirmModal from '@/components/ConfirmModal'

export default function VehiclesAdmin() {
  const { showToast } = useToast()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [pricingGrids, setPricingGrids] = useState<PricingGrid[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    key: '',
    model_name: '',
    size_category: 'M',
    pricing_grid_id: '',
    image_url: '',
    badge_color: '',
    display_order: 1,
    is_active: true,
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean
    vehicleId: string | null
    vehicleName: string
  }>({ isOpen: false, vehicleId: null, vehicleName: '' })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [vehiclesRes, gridsRes] = await Promise.all([
        (supabase.from('vehicles') as any)
          .select('*')
          .order('display_order'),
        (supabase.from('pricing_grids') as any)
          .select('*')
          .order('name'),
      ])

      setVehicles((vehiclesRes.data || []) as Vehicle[])
      setPricingGrids((gridsRes.data || []) as PricingGrid[])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      showToast('Type de fichier non supporté. Utilisez PNG, JPEG, WebP ou SVG.', 'error')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Le fichier est trop volumineux. Taille maximum: 5MB', 'error')
      return
    }

    setUploading(true)

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${formData.key || 'vehicle'}_${Date.now()}.${fileExt}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('vehicles')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (error) {
        throw error
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('vehicles')
        .getPublicUrl(data.path)

      setFormData({ ...formData, image_url: urlData.publicUrl })
    } catch (error) {
      console.error('Error uploading image:', error)
      showToast('Erreur lors du téléchargement de l\'image', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    // Prevent activating a vehicle without a pricing grid
    if (formData.is_active && !formData.pricing_grid_id) {
      showToast('Impossible d\'activer un véhicule sans grille tarifaire assignée', 'error')
      return
    }

    try {
      // Convert empty badge_color to null for database storage
      const dataToSave = {
        ...formData,
        badge_color: formData.badge_color || null,
      }

      if (editingId) {
        // Use API route for updates to avoid CORS issues
        const response = await adminFetch(`/api/vehicles/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSave),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update vehicle')
        }
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from('vehicles') as any)
          .insert(dataToSave)

        if (error) throw error
      }

      await fetchData()
      resetForm()
      showToast('Véhicule sauvegardé avec succès', 'success')
    } catch (error) {
      console.error('Error saving vehicle:', error)
      showToast('Erreur lors de la sauvegarde', 'error')
    }
  }

  const handleEdit = (vehicle: Vehicle) => {
    setFormData({
      key: vehicle.key,
      model_name: vehicle.model_name,
      size_category: vehicle.size_category,
      pricing_grid_id: vehicle.pricing_grid_id || '',
      image_url: vehicle.image_url || '',
      badge_color: vehicle.badge_color || '',
      display_order: vehicle.display_order || 1,
      is_active: vehicle.is_active ?? true,
    })
    setEditingId(vehicle.id)
    setShowAddForm(true)
  }

  const handleDeleteClick = (vehicle: Vehicle) => {
    setDeleteConfirm({
      isOpen: true,
      vehicleId: vehicle.id,
      vehicleName: vehicle.model_name,
    })
  }

  const confirmDelete = async () => {
    const id = deleteConfirm.vehicleId
    if (!id) return

    try {
      // Use API route for deletes to avoid CORS issues
      const response = await adminFetch(`/api/vehicles/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete vehicle')
      }

      await fetchData()
      showToast('Véhicule supprimé avec succès', 'success')
    } catch (error) {
      console.error('Error deleting vehicle:', error)
      showToast('Erreur lors de la suppression', 'error')
    } finally {
      setDeleteConfirm({ isOpen: false, vehicleId: null, vehicleName: '' })
    }
  }

  const resetForm = () => {
    setFormData({
      key: '',
      model_name: '',
      size_category: 'M',
      pricing_grid_id: pricingGrids[0]?.id || '',
      image_url: '',
      badge_color: '',
      display_order: vehicles.length + 1,
      is_active: true,
    })
    setEditingId(null)
    setShowAddForm(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-12 h-12"></div>
      </div>
    )
  }

  return (
    <div className="pb-4">
      <div className="flex items-center justify-between mb-4 lg:mb-6 gap-3">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-800">Gestion des véhicules</h1>
        <button
          onClick={() => {
            resetForm()
            setShowAddForm(true)
          }}
          className="btn-primary flex items-center gap-2 text-sm lg:text-base px-3 lg:px-4 h-9 lg:h-10"
        >
          <Plus size={18} className="lg:w-5 lg:h-5" />
          <span className="hidden sm:inline">Ajouter</span>
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6 mb-4 lg:mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base lg:text-lg font-semibold">
              {editingId ? 'Modifier le véhicule' : 'Nouveau véhicule'}
            </h2>
            <button onClick={resetForm} className="text-gray-500 hover:text-gray-700 p-1">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Clé unique
              </label>
              <input
                type="text"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                className="input-field"
                placeholder="toyota_aygo_x"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du modèle
              </label>
              <input
                type="text"
                value={formData.model_name}
                onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                className="input-field"
                placeholder="Toyota Aygo X"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catégorie
              </label>
              <select
                value={formData.size_category}
                onChange={(e) => setFormData({ ...formData, size_category: e.target.value })}
                className="input-field"
              >
                <option value="XS">XS - Très compacte</option>
                <option value="S">S - Petite</option>
                <option value="M">M - Moyenne</option>
                <option value="L">L - Grande</option>
                <option value="XL">XL - Très grande</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Couleur du badge
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.badge_color || '#653A8E'}
                  onChange={(e) => setFormData({ ...formData, badge_color: e.target.value })}
                  className="w-10 h-10 flex-shrink-0 rounded-lg cursor-pointer border-2 border-gray-200"
                />
                <input
                  type="text"
                  value={formData.badge_color}
                  onChange={(e) => setFormData({ ...formData, badge_color: e.target.value })}
                  className="input-field flex-1"
                  placeholder="Par défaut (couleur catégorie)"
                />
                {formData.badge_color && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, badge_color: '' })}
                    className="text-xs text-gray-500 hover:text-gray-700 whitespace-nowrap"
                  >
                    Réinitialiser
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">Laissez vide pour utiliser la couleur par défaut de la catégorie</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grille tarifaire
              </label>
              <select
                value={formData.pricing_grid_id}
                onChange={(e) => setFormData({ ...formData, pricing_grid_id: e.target.value })}
                className="input-field"
              >
                <option value="">Sélectionner...</option>
                {pricingGrids.map((grid) => (
                  <option key={grid.id} value={grid.id}>
                    {grid.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ordre d&apos;affichage
              </label>
              <input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                className="input-field"
                min="1"
              />
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-[#653A8E] rounded"
              />
              <label htmlFor="is_active" className="text-sm text-gray-700">
                Véhicule actif
              </label>
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="mt-4 lg:mt-6 pt-4 lg:pt-6 border-t border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Image du véhicule
            </label>
            <div className="flex flex-col sm:flex-row items-start gap-4 lg:gap-6">
              {/* Preview */}
              <div className="w-full sm:w-40 h-28 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden flex-shrink-0">
                {formData.image_url ? (
                  <img
                    src={formData.image_url}
                    alt="Aperçu"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/vehicles/placeholder.svg'
                    }}
                  />
                ) : (
                  <div className="text-center text-gray-400">
                    <ImageIcon className="mx-auto mb-1" size={24} />
                    <span className="text-xs">Aucune image</span>
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className={`btn-secondary inline-flex items-center gap-2 cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                  {uploading ? (
                    <>
                      <div className="spinner w-4 h-4"></div>
                      Téléchargement...
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      Choisir une image
                    </>
                  )}
                </label>
                <p className="mt-2 text-xs text-gray-500">
                  PNG, JPEG, WebP ou SVG. Max 5MB.
                </p>
                {formData.image_url && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, image_url: '' })}
                    className="mt-2 text-sm text-red-600 hover:text-red-700"
                  >
                    Supprimer l&apos;image
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 lg:mt-6 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
            <button onClick={resetForm} className="btn-secondary h-9 lg:h-10 text-sm order-2 sm:order-1">
              Annuler
            </button>
            <button onClick={handleSave} className="btn-primary flex items-center justify-center gap-2 h-9 lg:h-10 text-sm order-1 sm:order-2">
              <Save size={16} />
              {editingId ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </div>
      )}

      {/* Vehicles Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table text-sm">
            <thead>
              <tr>
                <th className="hidden sm:table-cell">Ordre</th>
                <th>Image</th>
                <th>Modèle</th>
                <th className="hidden md:table-cell">Cat.</th>
                <th className="hidden lg:table-cell">Grille</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => {
                const grid = pricingGrids.find((g) => g.id === vehicle.pricing_grid_id)
                const isOrphaned = !vehicle.pricing_grid_id || !grid
                return (
                  <tr key={vehicle.id} className={isOrphaned ? 'bg-amber-50' : ''}>
                    <td className="hidden sm:table-cell">{vehicle.display_order}</td>
                    <td>
                      {vehicle.image_url ? (
                        <img
                          src={vehicle.image_url}
                          alt={vehicle.model_name}
                          className="w-12 h-8 lg:w-16 lg:h-10 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/vehicles/placeholder.svg'
                          }}
                        />
                      ) : (
                        <div className="w-12 h-8 lg:w-16 lg:h-10 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                          <ImageIcon size={14} />
                        </div>
                      )}
                    </td>
                    <td className="font-medium text-xs lg:text-sm">{vehicle.model_name}</td>
                    <td className="hidden md:table-cell">
                      <span
                        className="inline-block text-xs px-2 py-0.5 rounded font-semibold"
                        style={{
                          color: vehicle.badge_color || '#653A8E',
                          backgroundColor: `${vehicle.badge_color || '#653A8E'}1A`,
                        }}
                      >
                        {vehicle.size_category}
                      </span>
                    </td>
                    <td className="hidden lg:table-cell text-xs lg:text-sm">
                      {grid ? (
                        <span className="text-gray-600">{grid.name}</span>
                      ) : (
                        <span className="text-amber-600 font-medium">⚠ Non assignée</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`px-1.5 lg:px-2 py-0.5 lg:py-1 rounded-full text-xs font-medium ${vehicle.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                          }`}
                      >
                        {vehicle.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(vehicle)}
                          className="p-1.5 lg:p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="Modifier"
                        >
                          <Edit2 size={14} className="lg:w-4 lg:h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(vehicle)}
                          className="p-1.5 lg:p-2 text-red-600 hover:bg-red-50 rounded"
                          title="Supprimer"
                        >
                          <Trash2 size={14} className="lg:w-4 lg:h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {vehicles.length === 0 && (
          <p className="text-gray-500 text-center py-8">
            Aucun véhicule configuré
          </p>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Supprimer le véhicule"
        message={`Êtes-vous sûr de vouloir supprimer le véhicule "${deleteConfirm.vehicleName}" ?`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, vehicleId: null, vehicleName: '' })}
      />
    </div>
  )
}
