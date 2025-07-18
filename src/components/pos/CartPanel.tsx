import React from 'react'
import { X, Plus, Minus, Percent, FileText } from 'lucide-react'
import { usePOS } from '../../contexts/POSContext'
import { useNavigate } from 'react-router-dom'

interface CartPanelProps {
  onPromotionClick?: (productId: string) => void;
}

export const CartPanel: React.FC<CartPanelProps> = ({ onPromotionClick }) => {
  const { carrito, updateQuantity, removeFromCart, clearCart, total } = usePOS()
  const navigate = useNavigate()

  const fmt = (p: number) =>
    new Intl.NumberFormat('es-CL',{ style: 'currency', currency: 'CLP' }).format(p)

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {carrito.map(item => (
          <div key={item.id} className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="font-medium">{item.nombre}</h4>
              {item.promocion_aplicada && (
                <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  {item.promocion_aplicada}
                </span>
              )}
              <div className="mt-1 inline-flex items-center bg-gray-100 rounded">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="px-2 py-1 hover:bg-gray-200"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="px-2 py-1 hover:bg-gray-200"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="text-right">
              <span className="font-medium">{fmt(item.precio * item.quantity)}</span>
              <button
                onClick={() => removeFromCart(item.id)} 
                className="block mt-1 text-red-500 hover:text-red-700 mr-2"
              >
                <X className="w-4 h-4" />
              </button>
              {onPromotionClick && (
                <button
                  onClick={() => onPromotionClick(item.id)}
                  className="block mt-1 text-blue-500 hover:text-blue-700"
                >
                  <Percent className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 border-t border-gray-200 space-y-4">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Nº Líneas {carrito.length} / Tot. ítems{' '}
            {carrito.reduce((sum, i) => sum + i.quantity, 0)}
          </div>
          <select className="px-3 py-2 bg-gray-100 rounded-lg">
            <option>Boleta manual (No válido al SII)</option>
          </select>
        </div>

        <button
          onClick={clearCart}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          <X className="w-4 h-4" /> Cancelar
        </button>

        <button
          onClick={() => navigate('/facturacion')}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          <FileText className="w-4 h-4" />
          Facturar
        </button>

        <div className="flex justify-between items-center text-lg font-semibold">
          <span>Total</span>
          <span>{fmt(total)}</span>
        </div>

        <button
          onClick={() => navigate('/pagar')}
          disabled={carrito.length === 0}
          className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Pagar
        </button>
      </div>
    </div>
  )
}