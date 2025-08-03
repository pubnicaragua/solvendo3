import React, { useState, useEffect } from 'react'
import { X, Percent, Calendar } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { usePOS } from '../../contexts/POSContext'
import toast from 'react-hot-toast'

interface PromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId?: string;
}

export const PromotionModal: React.FC<PromotionModalProps> = ({
  isOpen,
  onClose,
  productId
}) => {
  const [selectedPromotion, setSelectedPromotion] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const { empresaId } = useAuth()
  const { promociones, loadPromociones, aplicarPromocion, productos } = usePOS()
  const [product, setProduct] = useState<any>(null)

  useEffect(() => {
    if (isOpen && productId) {
      loadProductDetails()
      if (promociones.length === 0) {
        loadPromociones()
      }
    }
  }, [isOpen, productId])

  const loadProductDetails = async () => {
    if (!productId) return

    // Buscar el producto en la lista de productos cargados
    const foundProduct = productos.find(p => p.id === productId);
    if (foundProduct) {
      setProduct(foundProduct);
    } else {
      try {
        const { data, error } = await supabase
          .from('productos')
          .select('*')
          .eq('id', productId)
          .single()

        if (error) throw error
        setProduct(data)
      } catch (error) {
        console.error('Error loading product details:', error)
        toast.error('Error al cargar detalles del producto')
      }
    }
  }

  const handleApplyPromotion = async () => {
    if (!selectedPromotion || !productId) {
      toast.error('Seleccione una promoción')
      return
    }

    setLoading(true)
    
    try {
      const success = await aplicarPromocion(productId, selectedPromotion)
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Error applying promotion:', error)
      toast.error('Error al aplicar promoción')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Percent className="w-5 h-5 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">Aplicar promoción</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {product && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-1">{product.nombre}</h4>
              <p className="text-sm text-blue-700">Precio actual: {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(product.precio)}</p>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar promoción</label>
            <select
              value={selectedPromotion}
              onChange={(e) => setSelectedPromotion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Seleccione una promoción</option>
              {promociones.map((promo) => (
                <option key={promo.id} value={promo.id}>
                  {promo.nombre} - {
                    promo.tipo === 'descuento_porcentaje' ? `${promo.valor}%` : 
                    promo.tipo === 'descuento_monto' ? `$${promo.valor}` : 
                    promo.tipo === '2x1' ? '2x1' :
                    promo.tipo === '3x2' ? '3x2' :
                    promo.tipo
                  }
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleApplyPromotion}
              disabled={!selectedPromotion || loading}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Aplicando...' : 'Aplicar promoción'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}