import React, { useState, useEffect } from 'react'
import { Percent, Search, Plus, Edit, Trash2, X } from 'lucide-react'
import { HeaderWithMenu } from '../components/common/HeaderWithMenu'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

interface PromotionsPageProps {
  onClose: () => void
}

interface Promotion {
  id: string
  nombre: string
  descripcion: string
  tipo: string
  valor: number
  fecha_inicio: string
  fecha_fin: string
  activo: boolean
}

export const PromotionsPage: React.FC<PromotionsPageProps> = ({ onClose }) => {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    tipo: 'descuento_porcentaje',
    valor: 0,
    fecha_inicio: '',
    fecha_fin: '',
    activo: true
  })
  const { empresaId } = useAuth()

  useEffect(() => {
    loadPromotions()
  }, [])

  const loadPromotions = async () => {
    if (!empresaId) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('promociones')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('activo', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPromotions(data || [])
    } catch (error) {
      console.error('Error loading promotions:', error)
      toast.error('Error al cargar promociones')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!empresaId || !formData.nombre) return

    setLoading(true)
    try {
      if (editingPromotion) {
        const { error } = await supabase
          .from('promociones')
          .update(formData)
          .eq('id', editingPromotion.id)

        if (error) throw error
        toast.success('Promoción actualizada correctamente')
      } else {
        const { error } = await supabase
          .from('promociones')
          .insert([{
            empresa_id: empresaId,
            ...formData
          }])

        if (error) throw error
        toast.success('Promoción creada correctamente')
      }

      setShowModal(false)
      setEditingPromotion(null)
      setFormData({
        nombre: '',
        descripcion: '',
        tipo: 'descuento_porcentaje',
        valor: 0,
        fecha_inicio: '',
        fecha_fin: '',
        activo: true
      })
      loadPromotions()
    } catch (error) {
      console.error('Error saving promotion:', error)
      toast.error('Error al guardar promoción')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion)
    setFormData({
      nombre: promotion.nombre,
      descripcion: promotion.descripcion,
      tipo: promotion.tipo,
      valor: promotion.valor,
      fecha_inicio: promotion.fecha_inicio,
      fecha_fin: promotion.fecha_fin,
      activo: promotion.activo
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta promoción?')) return
    
    setLoading(true)
    try {
      const { error } = await supabase
        .from('promociones')
        .update({ activo: false })
        .eq('id', id)

      if (error) throw error
      loadPromotions()
      toast.success('Promoción eliminada correctamente')
    } catch (error) {
      console.error('Error deleting promotion:', error)
      toast.error('Error al eliminar promoción')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <HeaderWithMenu title="Promociones" icon={<Percent className="w-6 h-6 text-gray-600" />} />

      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Search Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="relative flex-1 mr-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar promociones..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva promoción
          </button>
        </div>

        {/* Promotions List */}
        <div className="bg-white rounded-lg shadow">
          <div className="grid grid-cols-6 gap-4 p-4 border-b border-gray-200 text-sm font-medium text-gray-700">
            <span>Nombre</span>
            <span>Tipo</span>
            <span>Valor</span>
            <span>Fecha inicio</span>
            <span>Fecha fin</span>
            <span>Acciones</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Cargando promociones...</div>
          ) : promotions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No hay promociones registradas</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {promotions.map((promotion) => (
                <div key={promotion.id} className="grid grid-cols-6 gap-4 p-4 items-center">
                  <span className="font-medium">{promotion.nombre}</span>
                  <span className="capitalize">{promotion.tipo.replace('_', ' ')}</span>
                  <span>{promotion.valor}%</span>
                  <span>{promotion.fecha_inicio}</span>
                  <span>{promotion.fecha_fin}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(promotion)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(promotion.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingPromotion ? 'Editar promoción' : 'Nueva promoción'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingPromotion(null)
                  setFormData({
                    nombre: '',
                    descripcion: '',
                    tipo: 'descuento_porcentaje',
                    valor: 0,
                    fecha_inicio: '',
                    fecha_fin: '',
                    activo: true
                  })
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg h-20 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="descuento_porcentaje">Descuento porcentaje</option>
                  <option value="descuento_monto">Descuento monto</option>
                  <option value="2x1">2x1</option>
                  <option value="3x2">3x2</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                <input
                  type="number"
                  value={formData.valor}
                  onChange={(e) => setFormData(prev => ({ ...prev, valor: parseFloat(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
                  <input
                    type="date"
                    value={formData.fecha_inicio}
                    onChange={(e) => setFormData(prev => ({ ...prev, fecha_inicio: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
                  <input
                    type="date"
                    value={formData.fecha_fin}
                    onChange={(e) => setFormData(prev => ({ ...prev, fecha_fin: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingPromotion(null)
                  setFormData({
                    nombre: '',
                    descripcion: '',
                    tipo: 'descuento_porcentaje',
                    valor: 0,
                    fecha_inicio: '',
                    fecha_fin: '',
                    activo: true
                  })
                }}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                {editingPromotion ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}