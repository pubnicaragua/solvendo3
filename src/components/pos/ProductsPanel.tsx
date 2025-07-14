// src/components/pos/ProductsPanel.tsx  
import React, { useState } from 'react'  
import { Gift, Search, Plus } from 'lucide-react'  
import { usePOS } from '../../contexts/POSContext'  
  
interface ProductsPanelProps {  
  onAddToCart: (producto: any) => void  
  searchTerm: string  
}  
  
const ProductsPanel: React.FC<ProductsPanelProps> = ({ onAddToCart, searchTerm }) => {  
  const { productos, loading } = usePOS()  
  const [selectedCategory, setSelectedCategory] = useState('all')  
  
  const formatPrice = (price: number) => {  
    return new Intl.NumberFormat('es-CL', {  
      style: 'currency',  
      currency: 'CLP'  
    }).format(price)  
  }  
  
  const filteredProducts = productos.filter(p => {  
    const matchesSearch = searchTerm ?   
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||  
      p.codigo.toLowerCase().includes(searchTerm.toLowerCase()) : true  
    return matchesSearch  
  })  
  
  return (  
    <div>  
      <div className="flex items-center space-x-2 mb-4">  
        <Gift className="w-5 h-5 text-blue-600"/>  
        <h3 className="text-blue-600 font-semibold">Productos</h3>  
      </div>  
        
      <div className="mb-4">  
        <select   
          value={selectedCategory}  
          onChange={(e) => setSelectedCategory(e.target.value)}  
          className="w-full px-3 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"  
        >  
          <option value="all">Todas las categorías</option>  
          <option value="bebidas">Bebidas</option>  
          <option value="snacks">Snacks</option>  
          <option value="otros">Otros</option>  
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
          
        {!loading && filteredProducts.length === 0 && (  
          <p className="text-center text-gray-500 py-8">No se encontraron productos</p>  
        )}  
      </div>  
    </div>  
  )  
}  
  
export default ProductsPanel