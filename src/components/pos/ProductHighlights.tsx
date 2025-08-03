import React, { useState } from 'react';
import { Star, DollarSign, Plus, Info } from 'lucide-react';
import { usePOS } from '../../contexts/POSContext';

export default function ProductHighlights() {
  const { productos = [], addToCart, loadProductos } = usePOS();
  const [showInfo, setShowInfo] = useState<Record<string, boolean>>({});
  const [showPrice, setShowPrice] = useState<Record<string, boolean>>({});

  // Load products when component mounts
  React.useEffect(() => {
    loadProductos()
  }, [loadProductos])

  const destacados = productos.filter(p => p.destacado);

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('es-CL', { 
      style: 'currency', 
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.max(0, n || 0));

  const toggleInfo = (productId: string) => {
    setShowInfo(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const togglePrice = (productId: string) => {
    setShowPrice(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  if (!destacados.length) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Star className="w-5 h-5 text-blue-600" />
          <h3 className="text-blue-600 font-semibold text-lg">Productos destacados</h3>
        </div>
        <p className="text-gray-500 text-center py-8">No hay productos destacados</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Star className="w-5 h-5 text-blue-600" />
        <h3 className="text-blue-600 font-semibold text-lg">Productos destacados</h3>
      </div>
      
      <div className="space-y-3">
        {destacados.map(product => (
          <div key={product.id} className="space-y-2">
            {/* Product row */}
            <div className="flex items-center justify-between py-2 border-b border-gray-200">
              <div className="flex-1">
                <span className="font-medium text-gray-900">{product.nombre}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Add button */}
                <button
                  onClick={() => addToCart(product)}
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
    </div>
  );
}