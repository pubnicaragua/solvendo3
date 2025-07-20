import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Truck, Plus, Calendar, CreditCard, DollarSign, Percent } from 'lucide-react'
import { HeaderWithMenu } from '../components/common/HeaderWithMenu'
import { usePOS } from '../contexts/POSContext'
import { useAuth } from '../contexts/AuthContext'
import { ClientModal } from '../components/pos/ClientModal'
import { Cliente } from '../lib/supabase'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useEffect } from 'react'

interface BillingPageProps {
  onClose?: () => void
}

export const BillingPage: React.FC<BillingPageProps> = ({ onClose }) => {
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null)
  const [showClientModal, setShowClientModal] = useState(false)
  const [billingData, setBillingData] = useState({
    tipoDte: 'boleta',
    metodoPago: 'efectivo',
    envioInmediato: true,
    despacho: false,
    documentos: false,
    cupon: false,
    descuentoGlobal: 0,
    montoRecibido: 0
  })
  const [loading, setLoading] = useState(false)
  const [showPrintDialog, setShowPrintDialog] = useState(false)
  
  const { user } = useAuth()
  const navigate = useNavigate()
  const { carrito, total, clearCart, procesarVenta, currentCliente, selectClient } = usePOS()

  // Función para validar números positivos
  const validatePositiveNumber = (value: number): number => {
    return Math.max(0, value || 0);
  };

  // Si hay un cliente seleccionado en el contexto, usarlo
  useEffect(() => {
    if (currentCliente) {
      setSelectedClient(currentCliente);
    }
  }, [currentCliente]);

  const handleClose = () => {
    if (onClose) {
      onClose()
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency', 
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(validatePositiveNumber(price))
  }

  // Función para manejar la selección de cliente
  const handleClientSelect = (cliente: Cliente | null) => {
    setSelectedClient(cliente)
    if (cliente) {
      selectClient(cliente);
    }
    setShowClientModal(false)
  }

  // Función para confirmar el pago
  const handleConfirmPayment = async () => {
    if (carrito.length === 0) {
      toast.error('No hay productos en el carrito')
      return
    }


    setLoading(true)
    
    try {
      // Procesar la venta
      const result = await procesarVenta(billingData.metodoPago, billingData.tipoDte as 'boleta' | 'factura' | 'nota_credito', selectedClient?.id);
      
      if (result.success) {
        // Mostrar diálogo de impresión
        setShowPrintDialog(true)
      } else {
        toast.error(result.error || 'Error al procesar la venta')
      }
    } catch (error) {
      console.error('Error processing payment:', error)
      toast.error('Error al procesar el pago')
    } finally {
      setLoading(false)
    }
  }
  
  // Función para manejar la impresión
  const handlePrint = () => {
    // Imprimir
    try {
      window.print();
    } catch (error) {
      console.error('Error al imprimir:', error);
    }
    
    // Limpiar carrito
    clearCart();
    
    // Cerrar y navegar al dashboard
    if (onClose) {
      onClose();
    } else {
      navigate('/');
    }
  }
  
  // Función para enviar por email
  const handleSendEmail = () => {
    // Simulate sending email
    toast.success('Documento enviado por correo')
    // Limpiar carrito
    clearCart();
    // Cerrar y navegar al dashboard
    if (onClose) {
      onClose();
    } else {
      navigate('/');
    }
  }

  const totalConDescuento = validatePositiveNumber(total * (1 - (validatePositiveNumber(billingData.descuentoGlobal) / 100)))
  const vuelto = billingData.metodoPago === 'efectivo' && billingData.montoRecibido > 0 
    ? validatePositiveNumber(billingData.montoRecibido - totalConDescuento) 
    : 0

  if (showPrintDialog) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Boleta generada</h3>
            <p className="text-gray-600 mb-6">Enviar por correo electrónico (Opcional)</p>

            <div className="flex mb-4">
              <input
                type="email"
                placeholder="Email"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSendEmail}
                className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700"
              >
                Enviar
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700"
            >
              Imprimir
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <HeaderWithMenu title="Facturación" icon={<FileText className="w-6 h-6 text-gray-600" />} userName={user?.nombre || 'Usuario'} />

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Billing Form */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Facturación</h3>
              
              {/* Document Type Selection */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="dte"
                      value="boleta"
                      checked={billingData.tipoDte === 'boleta'}
                      onChange={() => setBillingData(prev => ({ ...prev, tipoDte: 'boleta' }))}
                      className="text-blue-600"
                    />
                    <span>Boleta electrónica</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="dte"
                      value="factura"
                      checked={billingData.tipoDte === 'factura'}
                      onChange={() => setBillingData(prev => ({ ...prev, tipoDte: 'factura' }))}
                      className="text-blue-600"
                    />
                    <span>Factura electrónica</span>
                  </label>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 ${billingData.envioInmediato ? 'bg-blue-600' : 'border border-gray-300'} rounded-full flex items-center justify-center`}>
                      {billingData.envioInmediato && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <span className="text-sm">Envío inmediato</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck 
                      className={`w-4 h-4 ${billingData.despacho ? 'text-blue-600' : 'text-gray-400'} cursor-pointer`}
                      onClick={() => setBillingData(prev => ({ ...prev, despacho: !prev.despacho }))}
                    />
                    <span className={`text-sm ${billingData.despacho ? 'text-blue-600' : 'text-gray-600'}`}>Despacho</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={billingData.documentos}
                      onChange={() => setBillingData(prev => ({ ...prev, documentos: !prev.documentos }))}
                      className="rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-sm">Documentos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Plus 
                      className={`w-4 h-4 ${billingData.cupon ? 'text-blue-600' : 'text-gray-400'} cursor-pointer`}
                      onClick={() => setBillingData(prev => ({ ...prev, cupon: !prev.cupon }))}
                    />
                    <span className={`text-sm ${billingData.cupon ? 'text-blue-600' : 'text-gray-600'}`}>Agregar cupón</span>
                  </div>
                </div>
              </div>

              {/* Client Selection - Only for Factura */}
              {(billingData.tipoDte === 'factura' || billingData.tipoDte === 'Factura electrónica') && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Cliente</h4>
                  {selectedClient ? (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-900">
                            {selectedClient.razon_social}
                          </p>
                          <p className="text-xs text-blue-700">RUT: {selectedClient.rut}</p>
                        </div>
                        <button
                          onClick={() => setSelectedClient(null)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Cambiar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowClientModal(true)}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Seleccionar cliente
                    </button>
                  )}
                </div>
              )}

              {/* Global Discount */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Descuento global</h4>
                <div className="flex items-center">
                  <input
                    type="number"
                    value={billingData.descuentoGlobal}
                    onChange={(e) => {
                      const value = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
                      setBillingData(prev => ({ ...prev, descuentoGlobal: value }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    min="0"
                    max="100"
                  />
                  <Percent className="ml-2 w-5 h-5 text-gray-400" />
                </div>
              </div>

              {/* Payment Methods */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Métodos de pago</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setBillingData(prev => ({ ...prev, metodoPago: 'efectivo' }))}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg ${
                      billingData.metodoPago === 'efectivo' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } transition-colors`}
                  >
                    <DollarSign className="w-5 h-5" />
                    <span>Efectivo</span>
                  </button>
                  <button
                    onClick={() => setBillingData(prev => ({ ...prev, metodoPago: 'tarjeta' }))}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg ${
                      billingData.metodoPago === 'tarjeta' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } transition-colors`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>Tarjeta</span>
                  </button>
                </div>
              </div>

              {/* Cash Amount - Only for Efectivo */}
              {billingData.metodoPago === 'efectivo' && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Monto recibido</h4>
                  <input
                    type="number"
                    value={billingData.montoRecibido}
                    onChange={(e) => {
                      const value = Math.max(0, parseFloat(e.target.value) || 0);
                      setBillingData(prev => ({ ...prev, montoRecibido: value }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    min="0"
                    step="1"
                  />
                </div>
              )}
            </div>

            {/* Right Column - Summary */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen</h3>
              
              {/* Cart Items */}
              <div className="space-y-3 mb-6">
                {carrito.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.nombre}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <span>Cantidad: {item.quantity}</span>
                        <span>Precio: {formatPrice(item.precio)}</span>
                      </div>
                    </div>
                    <span className="font-medium">{formatPrice(item.precio * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Payment Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Subtotal</span>
                    <span className="font-medium">{formatPrice(total)}</span>
                  </div>
                  
                  {billingData.descuentoGlobal > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span className="text-sm">Descuento ({billingData.descuentoGlobal}%)</span>
                      <span className="font-medium">-{formatPrice(total * (billingData.descuentoGlobal / 100))}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between font-semibold pt-2 border-t border-gray-200">
                    <span className="text-sm">Total a pagar</span>
                    <span>{formatPrice(totalConDescuento)}</span>
                  </div>
                  
                  {billingData.metodoPago === 'efectivo' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm">Monto recibido</span>
                        <span>{formatPrice(billingData.montoRecibido)}</span>
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
                disabled={loading || carrito.length === 0} 
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Procesando...' : 'Confirmar pago'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Client Modal */}
      <ClientModal
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)} 
        onClientSelect={handleClientSelect}
      />
    </div>
  )
}