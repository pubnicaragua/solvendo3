import React, { useState } from 'react'
import { FileText, Truck, Plus, Calendar, CreditCard, DollarSign, Percent } from 'lucide-react'
import { HeaderWithMenu } from '../components/common/HeaderWithMenu'
import { usePOS } from '../contexts/POSContext'
import { useAuth } from '../contexts/AuthContext'
import { ClientModal } from '../components/pos/ClientModal'
import { Cliente } from '../lib/supabase'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'

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
  
  const { carrito, total, procesarVenta, clearCart } = usePOS()
  const { user } = useAuth() 
  const navigate = useNavigate()

  const handleClose = () => {
    if (onClose) {
      onClose()
    } else {
      navigate('/')
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price)
  }

  const handleClientSelect = (cliente: Cliente | null) => {
    setSelectedClient(cliente)
  }

  const handleConfirmPayment = async () => {
    if (carrito.length === 0) {
      toast.error('No hay productos en el carrito')
      return
    }

    if (billingData.tipoDte === 'factura' && !selectedClient) {
      toast.error('Debe seleccionar un cliente para generar una factura')
      return
    }

    setLoading(true)
    
    try {
      // 1. Crear la venta
      const result = await procesarVenta(
        billingData.metodoPago, 
        billingData.tipoDte, 
        selectedClient?.id
      )
      
      if (result.success) {
        // 2. Registrar movimiento de caja si es efectivo
        if (billingData.metodoPago === 'efectivo' && result.venta) {
          await registrarMovimientoCaja(result.data?.id || '', result.data?.total || 0)
        }
        
        // 3. Mostrar diálogo de impresión
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
  
  const registrarMovimientoCaja = async (ventaId: string, monto: number) => {
    if (!user) return;
    
    try {
      // Obtener apertura de caja activa
      const { data: apertura, error: aperturaError } = await supabase
        .from('aperturas_caja')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('estado', 'abierta')
        .single();
        
      if (aperturaError || !apertura) {
        console.error('No hay caja abierta');
        return;
      }
      
      // Registrar movimiento
      const { error } = await supabase
        .from('movimientos_caja')
        .insert({
          apertura_caja_id: apertura.id,
          usuario_id: user.id,
          tipo: 'venta',
          monto: monto,
          observacion: `Venta ID: ${ventaId}`,
          fecha: new Date().toISOString()
        });
        
      if (error) throw error;
    } catch (error) {
      console.error('Error registering cash movement:', error);
    }
  }

  const handlePrint = () => {
    // Imprimir
    window.print();
    
    // Guardar PDF (simulado)
    savePdfUrl();
    
    // Limpiar y cerrar
    clearCart();
    onClose();
  }
  
  const savePdfUrl = async (): Promise<void> => {
    // Simulación de generación de PDF
    const pdfUrl = `https://example.com/pdf/${Date.now()}.pdf`;
    
    try {
      // Actualizar documento tributario
      const { error } = await supabase
        .from('documentos_tributarios')
        .update({ pdf_url: pdfUrl })
        .eq('tipo_dte', billingData.tipoDte)
        .order('created_at', { ascending: false })
        .limit(1)
        
      if (error) throw error;
    } catch (error) {
      console.error('Error saving PDF URL:', error);
    }
  }

  const handleSendEmail = () => {
    // Simulate sending email
    toast.success('Documento enviado por correo')
    clearCart() 
    onClose()
  }

  const totalConDescuento = total * (1 - (billingData.descuentoGlobal / 100))
  const vuelto = billingData.montoRecibido > 0 ? Math.max(0, billingData.montoRecibido - totalConDescuento) : 0

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
              {billingData.tipoDte === 'factura' && (
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
                    onChange={(e) => setBillingData(prev => ({ ...prev, descuentoGlobal: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)) }))}
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
                    onChange={(e) => setBillingData(prev => ({ ...prev, montoRecibido: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    min="0"
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
                disabled={loading || carrito.length === 0 || (billingData.tipoDte === 'factura' && !selectedClient)} 
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