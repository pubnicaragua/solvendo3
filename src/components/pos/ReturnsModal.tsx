import React, { useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

interface ReturnsModalProps {
  isOpen: boolean
  onClose: () => void
  ventaId?: string
  itemsToReturn?: Array<{
    id: number
    nombre: string
    cantidad: number
    precio: number
    subtotal: number
  }>
  total?: number
}

export const ReturnsModal: React.FC<ReturnsModalProps> = ({
  isOpen,
  onClose,
  ventaId,
  itemsToReturn = [],
  total = 0
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchFolio, setSearchFolio] = useState('')
  const [showReturnForm, setShowReturnForm] = useState(false)
  const [showCreditNote, setShowCreditNote] = useState(false)
  const [loading, setLoading] = useState(false)
  const [returnData, setReturnData] = useState({
    tipoDevolucion: 'Tipo de devolución',
    fecha: '18/05/2025',
    motivo: 'Escribir motivo...',
    numeroFolio: '342043593'
  })

  const { user } = useAuth()

  if (!isOpen) return null

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price)
  }

  const handleSearchReturn = () => {
    setShowReturnForm(true)
  }

  const handleConfirmReturn = async () => {
    if (!ventaId || itemsToReturn.length === 0) {
      toast.error('No hay ítems para devolver');
      return;
    }
    
    setLoading(true);
    try {
      // 1. Crear la devolución
      const { data: devolucion, error: devolucionError } = await supabase
        .from('devoluciones')
        .insert({
          venta_id: ventaId,
          usuario_id: user?.id,
          tipo: 'parcial',
          motivo: returnData.motivo,
          monto_devuelto: total,
          fecha: new Date().toISOString()
        })
        .select()
        .single();
        
      if (devolucionError || !devolucion) {
        throw new Error(devolucionError?.message || 'Error al crear la devolución');
      }
      
      // Mostrar el modal de nota de crédito
      setShowCreditNote(true);
    } catch (error: any) {
      toast.error('Error al procesar la devolución: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  if (showCreditNote) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Nota de crédito generada</h3>
            <button onClick={() => setShowCreditNote(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="text-center">
            <p className="text-gray-600 mb-6">Enviar por correo electrónico (Opcional)</p>
            
            <div className="flex gap-3">
              <button className="flex-1 bg-blue-100 text-blue-700 py-3 rounded-lg font-medium hover:bg-blue-200 transition-colors">
                Enviar
              </button>
              <button 
                onClick={() => { setShowCreditNote(false); onClose(); }}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Imprimir
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (showReturnForm) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">Devolución</h3>
            <button onClick={() => setShowReturnForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex h-[calc(90vh-120px)]">
            {/* Left Panel - Products */}
            <div className="flex-1 p-6 border-r border-gray-200">
              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ingresa aquí el producto o servicio"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Product Table Headers */}
              <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-700 border-b pb-2 mb-4">
                <span>Producto</span>
                <span>Cantidad</span>
                <span>Descuento</span>
                <span>Importe</span>
              </div>

              {/* Product Item */}
              <div className="grid grid-cols-4 gap-4 items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm">Ejemplo producto 1</span>
                <div className="flex items-center gap-2">
                  <button className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300">
                    <span className="text-xs">-</span>
                  </button>
                  <span className="w-8 text-center">1</span>
                  <button className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300">
                    <span className="text-xs">+</span>
                  </button>
                </div>
                <span className="text-sm">0%</span>
                <div className="flex items-center justify-between">
                  <span className="text-sm">34 $</span>
                  <button className="text-red-500 hover:text-red-700">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-600 mb-4">
                  N° Líneas 1 / Tot. items 1 | Nota de crédito manual (No...)
                </div>
                <div className="flex justify-between items-center text-lg font-semibold mb-2">
                  <span>Total</span>
                  <span>204 $</span>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                  Cancelar
                </button>
                <button className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                  Anular venta
                </button>
              </div>
            </div>

            {/* Right Panel - Return Details */}
            <div className="w-96 p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de devolución</label>
                  <select 
                    value={returnData.tipoDevolucion}
                    onChange={(e) => setReturnData(prev => ({ ...prev, tipoDevolucion: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option>Tipo de devolución</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                  <div className="flex items-center">
                    <input
                      type="date"
                      value="2025-05-18"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <svg className="ml-2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                  <textarea
                    value={returnData.motivo}
                    onChange={(e) => setReturnData(prev => ({ ...prev, motivo: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg h-20 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número de folio</label>
                  <input
                    type="text"
                    value={returnData.numeroFolio}
                    onChange={(e) => setReturnData(prev => ({ ...prev, numeroFolio: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center mb-4 text-lg font-semibold">
                  <span>Devolución total</span>
                  <span>204 $</span>
                </div>
                
                <button 
                  onClick={handleConfirmReturn}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Confirmar devolución
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Devolución</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Panel - Products */}
          <div className="flex-1 p-6 border-r border-gray-200">
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ingresa aquí el producto o servicio"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Product Table Headers */}
            <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-700 border-b pb-2 mb-4">
              <span>Producto</span>
              <span>Cantidad</span>
              <span>Descuento</span>
              <span>Importe</span>
            </div>

            {/* Product Item */}
            <div className="grid grid-cols-4 gap-4 items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm">Ejemplo producto 1</span>
              <div className="flex items-center gap-2">
                <button className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300">
                  <span className="text-xs">-</span>
                </button>
                <span className="w-8 text-center">1</span>
                <button className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300">
                  <span className="text-xs">+</span>
                </button>
              </div>
              <span className="text-sm">0%</span>
              <div className="flex items-center justify-between">
                <span className="text-sm">34 $</span>
                <button className="text-red-500 hover:text-red-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-600 mb-4">
                N° Líneas 1 / Tot. items 1 | Nota de crédito manual (No...)
              </div>
              <div className="flex justify-between items-center text-lg font-semibold mb-2">
                <span>Total</span>
                <span>204 $</span>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                Cancelar
              </button>
              <button className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                Anular venta
              </button>
            </div>
          </div>

          {/* Right Panel - Folio Search */}
          <div className="w-96 p-6 bg-gray-50">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-medium text-blue-800">Folio de documento</span>
            </div>
            
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ingresa aquí el número de folio"
                  value={searchFolio}
                  onChange={(e) => setSearchFolio(e.target.value)}
                  className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Folio: 342043593</span>
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>

            <button 
              onClick={handleSearchReturn}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Devolver
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}