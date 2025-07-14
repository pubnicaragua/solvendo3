import React, { useState } from 'react'
import { X, Truck, FileText, Plus } from 'lucide-react'
import { usePOS } from '../../contexts/POSContext'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onPaymentComplete: (metodoPago: string, tipoDte: string) => void
  total: number
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentComplete,
  total
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string>('cheque')
  const [selectedDte, setSelectedDte] = useState<string>('boleta')
  const [loading, setLoading] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [showPrintDialog, setShowPrintDialog] = useState(false)

  if (!isOpen) return null

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price)
  }

  const handleConfirmPayment = async () => {
    setLoading(true)
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setShowReceiptModal(true)
    setLoading(false)
  }

  const handlePrintReceipt = () => {
    setShowPrintDialog(true)
  }

  const handleConfirmPrint = () => {
    onPaymentComplete(selectedMethod, selectedDte)
    setShowPrintDialog(false)
    setShowReceiptModal(false)
    onClose()
  }

  if (showPrintDialog) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Boleta generada</h3>
            <p className="text-gray-600 mb-6">Enviar por correo electrónico (Opcional)</p>
            
            <div className="flex gap-3">
              <button className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                Enviar
              </button>
              <button 
                onClick={handleConfirmPrint}
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

  if (showReceiptModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="flex">
            {/* Left side - Receipt preview */}
            <div className="flex-1 p-6 bg-gray-50">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold">BOLETA ELECTRÓNICA</h3>
                  <p className="text-sm text-gray-600">Folio: 123456</p>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Print options */}
            <div className="w-80 p-6 border-l border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Imprimir</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Impresora</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option>Seleccionar impresora</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Copias</label>
                  <input 
                    type="number" 
                    defaultValue="1" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300" />
                    <span className="ml-2 text-sm">Abrir cajón</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300" />
                    <span className="ml-2 text-sm">Cortar papel</span>
                  </label>
                </div>

                <button 
                  onClick={handlePrintReceipt}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Imprimir
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
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold text-gray-900">Pagar</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Facturación</h4>
            
            {/* Document Type Selection */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="dte"
                    value="boleta"
                    checked={selectedDte === 'boleta'}
                    onChange={(e) => setSelectedDte(e.target.value)}
                    className="text-blue-600"
                  />
                  <span>Boleta electrónica</span>
                </label>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="text-sm">Envío inmediato</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Despacho</span>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border border-gray-300 rounded"></div>
                  <span className="text-sm">Documentos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Agregar cupón</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Métodos de pago</h4>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="cheque">Cheque</option>
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
            </select>
          </div>

          {/* Payment Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Total a pagar</span>
                <span className="font-semibold">{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Total pagado</span>
                <span>$ 0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Vuelto</span>
                <span>$ 0</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleConfirmPayment}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Procesando...' : 'Confirmar pago'}
          </button>
        </div>
      </div>
    </div>
  )
}