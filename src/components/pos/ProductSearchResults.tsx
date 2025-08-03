// src/components/pos/ProductSearchResults.tsx
import React from 'react'
import { Plus } from 'lucide-react'
import { usePOS } from '../../contexts/POSContext'

interface ProductSearchResultsProps {
  searchTerm: string
  onAddToCart: (producto: any) => void
}

const ProductSearchResults: React.FC<ProductSearchResultsProps> = ({
  searchTerm,
  onAddToCart
}) => {
  const { productos, loading } = usePOS()

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price)

  const filtered = productos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto" />
        <p className="text-sm text-gray-500 mt-2">Buscando productos…</p>
      </div>
    )
  }

  if (filtered.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        <p className="text-sm">No se encontraron productos</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 max-h-60 overflow-y-auto">
      {filtered.slice(0, 6).map((product) => (
        <div
          key={product.id}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="flex-1 pr-3">
            <h4 className="font-medium text-gray-900 text-sm">
              {product.nombre}
            </h4>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-600">{product.codigo}</span>
              <span className="text-sm font-semibold text-blue-600">
                {formatPrice(product.precio)}
              </span>
            </div>
            <span className="text-xs text-gray-500">
              Stock: {product.stock}
            </span>
          </div>
          <button
            onClick={() => onAddToCart(product)}
            className="ml-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      ))}
      {filtered.length > 6 && (
        <p className="text-xs text-gray-500 text-center py-2">
          Mostrando 6 de {filtered.length} resultados
        </p>
      )}
    </div>
  )
}

export default ProductSearchResults
