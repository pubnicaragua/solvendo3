import { useState } from 'react';
import { X, Info } from 'lucide-react';
import { usePOS } from '../../contexts/POSContext';

export default function ProductHighlights() {
  const { productos = [], carrito, updateQuantity, removeFromCart } = usePOS();
  const [showInfo, setShowInfo] = useState({});

  const destacados = productos.filter(p => p.destacado);

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n);

  const toggleInfo = (productId) => {
    setShowInfo(prevState => ({
      ...prevState,
      ...(prevState.hasOwnProperty(productId) ? { [productId]: !prevState?.[productId] } : { [productId]: true }),
    }));
  };

  if (!destacados.length) {
    return <p className="text-gray-500">No hay productos destacados</p>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-blue-600 font-semibold text-lg">★ Productos destacados</h3>
      {destacados.map(p => {
        const item = carrito.find(i => i.id === p.id);
        const qty = item?.quantity || 0;
        const isInfoVisible = showInfo?.[p.id] || false;

        return (
          <div key={p.id} className="flex items-center justify-between py-2">
            <div className="flex-1 space-y-1">
              <span className="font-medium">{p.nombre}</span>
              {isInfoVisible && (
                <>
                  <span className="text-xs text-gray-500">Stock: {p.stock} unidades</span>
                  <span className="text-xs text-gray-500">SKU: {p.codigo}</span>
                </>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => updateQuantity(p.id, qty + 1)}
                className="px-2 py-1 bg-gray-200 rounded"
              >
                +
              </button>
              <span className="font-semibold">{formatPrice(qty * p.precio)}</span>
            </div>

            {qty > 0 && (
              <button
                onClick={() => removeFromCart(p.id)}
                className="ml-4 text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button onClick={() => toggleInfo(p.id)} className="ml-4 text-gray-400 hover:text-gray-600">
              <Info className="w-5 h-5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}