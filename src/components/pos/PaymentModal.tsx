import React, { useState } from 'react'
import { X, Truck, FileText, Plus, CreditCard, DollarSign } from 'lucide-react'
import { usePOS } from '../../contexts/POSContext'
import { useAuth } from '../../contexts/AuthContext'
import { Cliente } from '../../lib/supabase'
import toast from 'react-hot-toast'

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
  const [selectedTerminal, setSelectedTerminal] = useState<string>('terminal_principal')
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null)
  const [montoRecibido, setMontoRecibido] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [showPrintDialog, setShowPrintDialog] = useState(false)
  
  const { clientes, procesarVenta } = usePOS()
  const { empresaId } = useAuth()
  
  // Validar que el cliente sea requerido para factura
  const requiresClient = selectedDte === 'factura'
  const canProceed = !requiresClient || selectedClient
  
  // Calcular vuelto
  const vuelto = selectedMethod === 'efectivo' 
    ? Math.max(0, montoRecibido - total)
    : 0

  if (!isOpen) return null

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price)
  }

  const handleConfirmPayment = async () => {
    if (requiresClient && !selectedClient) {
      toast.error('Debe seleccionar un cliente para factura electrónica')
      return
    }
    
    if (selectedMethod === 'efectivo' && montoRecibido < total) {
      toast.error('El monto recibido debe ser mayor o igual al total')
      return
    }
    
    setLoading(true)
    
    try {
      const result = await procesarVenta(
        selectedMethod, 
        selectedDte as 'boleta' | 'factura' | 'nota_credito',
        selectedClient?.id
      )
      
      if (result.success) {
        toast.success('Pago procesado correctamente')
        onPaymentComplete(selectedMethod, selectedDte)
      } else {
        toast.error(result.error || 'Error al procesar el pago')
      }
    } catch (error) {
      console.error('Error processing payment:', error)
      toast.error('Error al procesar el pago')
    } finally {
      setLoading(false)
    }
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
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="dte"
                    value="factura"
                    checked={selectedDte === 'factura'}
                    onChange={(e) => setSelectedDte(e.target.value)}
                    className="text-blue-600"
                  />
                  <span>Factura electrónica</span>
                </label>
              </div>
              
              {/* Client Selection for Factura */}
              {requiresClient && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cliente (requerido para factura)
                  </label>
                  <select
                    value={selectedClient?.id || ''}
                    onChange={(e) => {
                      const cliente = clientes.find(c => c.id === e.target.value)
                      setSelectedClient(cliente || null)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Seleccionar cliente</option>
                    {clientes.map(cliente => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.razon_social} - {cliente.rut}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
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
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => setSelectedMethod('efectivo')}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg ${
                  selectedMethod === 'efectivo' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } transition-colors`}
              >
                <DollarSign className="w-5 h-5" />
                <span>Efectivo</span>
              </button>
              
              <button
                onClick={() => setSelectedMethod('tarjeta')}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg ${
                  selectedMethod === 'tarjeta' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } transition-colors`}
              >
                <CreditCard className="w-5 h-5" />
                <span>Tarjeta</span>
              </button>
            </div>
            
            {/* Terminal Selection for Card */}
            {selectedMethod === 'tarjeta' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Terminal POS</label>
                <select
                  value={selectedTerminal}
                  onChange={(e) => setSelectedTerminal(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="terminal_principal">Terminal Principal - SumUp</option>
                  <option value="terminal_secundaria">Terminal Secundaria - SumUp</option>
                  <option value="terminal_movil">Terminal Móvil - SumUp</option>
                </select>
              </div>
            )}
            
            {/* Cash Amount for Efectivo */}
            {selectedMethod === 'efectivo' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Monto recibido</label>
                <input
                  type="number"
                  value={montoRecibido}
                  onChange={(e) => setMontoRecibido(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min="0"
                  step="1"
                />
              </div>
            )}
          </div>

          {/* Payment Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Total a pagar</span>
                <span className="font-semibold">{formatPrice(total)}</span>
              </div>
              {selectedMethod === 'efectivo' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm">Monto recibido</span>
                    <span>{formatPrice(montoRecibido)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Vuelto</span>
                    <span>{formatPrice(vuelto)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleConfirmPayment}
            disabled={loading || !canProceed || (selectedMethod === 'efectivo' && montoRecibido < total)}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Procesando...' : 'Confirmar pago'}
          </button>
        </div>
      </div>
    </div>
  )
}