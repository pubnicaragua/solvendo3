// src/components/pos/ProductsPanel.tsx  
import React, { useState } from 'react'  
import { Gift, Search, Plus } from 'lucide-react'  
import { Producto, usePOS } from '../../contexts/POSContext'  
  
interface ProductsPanelProps {  
  onAddToCart: (producto: Producto) => void  
  searchTerm: string  
}  
  
const ProductsPanel: React.FC<ProductsPanelProps> = ({ onAddToCart, searchTerm }) => {  
  const { productos, loading } = usePOS()  
  const [selectedFilter, setSelectedFilter] = useState('all')  
  
  const formatPrice = (price: number) => {  
    return new Intl.NumberFormat('es-CL', {  
      style: 'currency',  
      currency: 'CLP',  
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.max(0, price || 0))  
  }  
  
  const filteredProducts = productos.filter(p => {  
    const matchesSearch = searchTerm ?   
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||  
      p.codigo.toLowerCase().includes(searchTerm.toLowerCase()) : true  
    
    const matchesFilter = selectedFilter === 'all' ? true :
      selectedFilter === 'con_sku' ? p.codigo && p.codigo.trim() !== '' :
      selectedFilter === 'sin_sku' ? !p.codigo || p.codigo.trim() === '' : true
    
    return matchesSearch && matchesFilter  
  })  
  
  return (  
    <div>  
      <div className="flex items-center space-x-2 mb-4">  
        <Gift className="w-5 h-5 text-blue-600"/>  
        <h3 className="text-blue-600 font-semibold">Productos</h3>  
      </div>  
        
      <div className="mb-4">  
        <select   
          value={selectedFilter}  
          onChange={(e) => setSelectedFilter(e.target.value)}  
          className="w-full px-3 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"  
        >  
          <option value="all">Todos los productos</option>  
          <option value="con_sku">Con SKU</option>  
          <option value="sin_sku">Sin SKU</option>  
        </select>  
      </div>  
  
      <div className="relative mb-4">  
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"/>  
        <input  
          type="text"  
          placeholder="Buscar productos..."  
          className="w-full pl-10 pr-4 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"  
        />  
      </div>  
        
      <div className="space-y-3">  
        {loading ? (  
          <div className="text-center py-8 text-gray-500">Cargando productos...</div>  
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'No se encontraron productos con ese término' : 'No hay productos disponibles'}
          </div>
        ) : filteredProducts.map(product => (  
          <div   
            key={product.id}   
            className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center hover:shadow-md transition-shadow"  
          >  
            <div className="flex-1">  
              <h4 className="font-medium text-gray-900">{product.nombre}</h4>  
              <p className="text-sm text-gray-600">{formatPrice(product.precio)}</p>  
            </div>  
            <button  
              onClick={() => onAddToCart(product)}  
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"  
            >  
              <Plus className="w-4 h-4" />  
            </button>  
          </div>  
        ))}  
      </div>  
    </div>  
  )  
}  
  
export default ProductsPanel