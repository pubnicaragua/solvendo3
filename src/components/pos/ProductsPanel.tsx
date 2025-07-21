// src/components/pos/ProductsPanel.tsx  
import React, { useState } from 'react'  
import { Gift, Search, Plus, DollarSign, Info } from 'lucide-react'  
import { Producto, usePOS } from '../../contexts/POSContext'  
  
interface ProductsPanelProps {  
  onAddToCart: (producto: Producto) => void  
  searchTerm?: string  
}  
  
const ProductsPanel: React.FC<ProductsPanelProps> = ({ onAddToCart, searchTerm = '' }) => {  
  const { productos, loading } = usePOS()  
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [localSearch, setLocalSearch] = useState('')
  const [showPrice, setShowPrice] = useState<Record<string, boolean>>({})
  const [showInfo, setShowInfo] = useState<Record<string, boolean>>({})
  
  const formatPrice = (price: number) => {  
    return new Intl.NumberFormat('es-CL', {  
      style: 'currency',  
      currency: 'CLP',  
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.max(0, price || 0))  
  }  
  
  // Usar búsqueda local o externa
  const currentSearch = localSearch || searchTerm
  
  const filteredProducts = productos.filter(p => {  
    const matchesSearch = currentSearch ?   
      p.nombre.toLowerCase().includes(currentSearch.toLowerCase()) ||  
      (p.codigo && p.codigo.toLowerCase().includes(currentSearch.toLowerCase())) : true  
    
    const matchesFilter = selectedFilter === 'all' ? true :
      selectedFilter === 'con_sku' ? p.codigo && p.codigo.trim() !== '' :
      selectedFilter === 'sin_sku' ? !p.codigo || p.codigo.trim() === '' : true
    
    return matchesSearch && matchesFilter  
  })

  const togglePrice = (productId: string) => {
    setShowPrice(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }))
  }

  const toggleInfo = (productId: string) => {
    setShowInfo(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }))
  }
  
  return (  
    <div>  
      <div className="flex items-center space-x-2 mb-4">  
        <Gift className="w-5 h-5 text-blue-600"/>  
        <h3 className="text-blue-600 font-semibold">Productos / Servicios</h3>  
      </div>  
        
      <div className="mb-4">  
        <select   
          value={selectedFilter}  
          onChange={(e) => setSelectedFilter(e.target.value)}  
          className="w-full px-3 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"  
        >  
          <option value="all">Productos totales</option>  
          <option value="con_sku">Con SKU</option>  
          <option value="sin_sku">Sin SKU</option>  
        </select>  
      </div>  
        
      <div className="space-y-3">  
        {loading ? (  
          <div className="text-center py-8 text-gray-500">Cargando productos...</div>  
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {currentSearch ? 'No se encontraron productos con ese término' : 'No hay productos disponibles'}
          </div>
        ) : filteredProducts.map(product => (  
          <div key={product.id} className="space-y-2">
            {/* Product row */}
            <div className="flex items-center justify-between py-2 border-b border-gray-200">
              <div className="flex-1">
                <span className="font-medium text-gray-900">{product.nombre}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Add button */}
                <button
                  onClick={() => onAddToCart(product)}
                  className="p-1.5 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors"
                  title="Agregar producto"
                >
                  <Plus className="w-4 h-4 text-gray-600" />
                </button>
                
                {/* Price button */}
                <button
                  onClick={() => togglePrice(product.id)}
                  className={`p-1.5 rounded-full transition-colors ${
                    showPrice[product.id] 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                  }`}
                  title="Mostrar precio"
                >
                  <DollarSign className="w-4 h-4" />
                </button>
                
                {/* Info button */}
                <button
                  onClick={() => toggleInfo(product.id)}
                  className={`p-1.5 rounded-full transition-colors ${
                    showInfo[product.id] 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                  }`}
                  title="Mostrar información"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Price display */}
            {showPrice[product.id] && (
              <div className="pl-4 text-sm text-blue-600 font-medium">
                Precio: {formatPrice(product.precio || 0)}
              </div>
            )}
            
            {/* Info display */}
            {showInfo[product.id] && (
              <div className="pl-4 space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Stock:</span>
                  <span>{Math.max(0, product.stock || 0)} unidades</span>
                </div>
                <div className="flex justify-between">
                  <span>SKU:</span>
                  <span>{product.codigo || 'Sin SKU'}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Search bar at bottom */}
      <div className="relative mt-6">  
        <input
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          type="text"
          placeholder="Buscar productos..."
          className="w-full pl-4 pr-10 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"/>
      </div>
    </div>  
  )  
}  
  
export default ProductsPanel