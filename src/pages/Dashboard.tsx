import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Star, FileText, Gift, User, Filter, Package,
  Plus, Minus, X as XIcon, Percent, DollarSign, CreditCard, Truck
} from 'lucide-react'
import toast from 'react-hot-toast'
import { usePOS } from '../contexts/POSContext'
import { useAuth } from '../contexts/AuthContext'
import ProductHighlights from '../components/pos/ProductHighlights'
import DraftsPanel       from '../components/pos/DraftsPanel'
import ProductsPanel     from '../components/pos/ProductsPanel'
import ClientsPanel      from '../components/pos/ClientsPanel'
import { ReceiptModal}       from '../components/pos/ReceiptModal'
import { DraftSaveModal}     from '../components/pos/DraftSaveModal'

// Importamos el nuevo componente HeaderWithMenu
import { HeaderWithMenu } from '../components/common/HeaderWithMenu' 
// Logo ya no es necesario importarlo directamente aquí, si HeaderWithMenu lo usa internamente
// import { Logo }          from '../components/common/Logo' 

type TabId = 'destacado' | 'borradores' | 'productos' | 'clientes'
const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'destacado' as TabId,  label: 'Destacado',  icon: <Star className="w-5 h-5" /> },
  { id: 'borradores' as TabId, label: 'Borradores', icon: <FileText className="w-5 h-5" /> },
  { id: 'promociones' as TabId, label: 'Promociones', icon: <Percent className="w-5 h-5" /> },
  { id: 'productos' as TabId,  label: 'Productos',  icon: <Gift className="w-5 h-5" /> },
  { id: 'clientes' as TabId,   label: 'Clientes',   icon: <User className="w-5 h-5" /> },
]

const Dashboard: React.FC = () => {
  // toggleSidebar y user se obtienen de sus respectivos contextos y se pasan a HeaderWithMenu
  const { user }         = useAuth()
  const navigate = useNavigate()
  const {
    productos, carrito, total,
    addToCart, addToCartWithQuantity, updateQuantity, removeFromCart, clearCart,
    borradores, loadBorradores, saveDraft, loadDraft, deleteDraft, 
    promociones, loadPromociones, aplicarPromocion,
    currentCliente, selectClient, clientes, loadClientes, procesarVenta
  } = usePOS()

  const [activeTab, setActiveTab]         = useState<TabId>('destacado')
  const [searchTerm, setSearchTerm]       = useState('')
  const [clientSearchTerm, setClientSearchTerm] = useState('')
  const [showDraftModal, setShowDraftModal] = useState(false)
  const [draftName, setDraftName]         = useState('')
  const [showReceipt, setShowReceipt]     = useState(false) 
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showPrintDialog, setShowPrintDialog] = useState(false)
  
  // Estados del panel de pago
  const [selectedMethod, setSelectedMethod] = useState<string>('efectivo')
  const [selectedDte, setSelectedDte] = useState<string>('boleta')
  const [selectedTerminal, setSelectedTerminal] = useState<string>('terminal_principal')
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [montoRecibido, setMontoRecibido] = useState<number>(0)
  const [enviarSII, setEnviarSII] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Estados para opciones de entrega
  const [envioInmediato, setEnvioInmediato] = useState(true)
  const [despacho, setDespacho] = useState(false)
  const [documentos, setDocumentos] = useState(false)
  const [cupon, setCupon] = useState(false)
  const [descuentos, setDescuentos] = useState(false)

  useEffect(() => {
    loadBorradores()
    loadPromociones()
    loadClientes()
  },[loadBorradores, loadPromociones, loadClientes])

  const fmt = (n:number) =>
    new Intl.NumberFormat('es-CL', { 
      style: 'currency', 
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.max(0, Number(n) || 0))

  // Función para validar números positivos
  const validatePositiveNumber = (value: number): number => {
    const num = Number(value);
    return isNaN(num) || num < 0 ? 0 : num;
  };

  const handleSaveDraft = async () => {
    if (!draftName.trim() || carrito.length===0) return
    setShowDraftModal(false)
    const success = await saveDraft(draftName)
    if (success) {
      toast.success('Borrador guardado')
      setDraftName('')
      loadBorradores()
    }
  }
  const handleLoadDraft = async (id:string) => {
    const success = await loadDraft(id)
    if (success) {
      toast.success('Borrador cargado')
    }
    setActiveTab('destacado')
  }
  const handleDeleteDraft = async (id:string) => {
    if (confirm('¿Eliminar borrador?')) {
      const success = await deleteDraft(id)
      if (success) {
        toast.success('Borrador eliminado')
        loadBorradores()
      }
    }
  }

  const startPayment = () => {
    if (carrito.length === 0) {
      toast.error('El carrito está vacío')
      return
    }
    setShowPaymentModal(true)
  }

  const handlePaymentComplete = async () => {
    if (carrito.length === 0) {
      toast.error('No hay productos en el carrito')
      return
    }

    setLoading(true)
    
    try {
      // Procesar la venta
      const result = await procesarVenta(selectedMethod, selectedDte as 'boleta' | 'factura' | 'nota_credito', selectedClient?.id);
      
      if (result.success) {
        // Mostrar diálogo de impresión
        setShowPaymentModal(false)
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

  const handlePrintReceipt = () => {
    try {
      const printContent = `
        <div style="font-family: 'Courier New', monospace; width: 80mm; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 15px; margin-bottom: 15px;">
            <div style="font-size: 16px; font-weight: bold;">ANROLTEC SPA</div>
            <div style="font-size: 10px;">RUT: 78.168.951-3</div>
            <div style="font-size: 10px;">Av. Providencia 1234, Santiago</div>
          </div>
          
          <div style="text-align: center; font-weight: bold; margin: 10px 0;">
            ${selectedDte.toUpperCase()}
          </div>
          <div style="font-size: 10px;">Folio: V${Date.now()}</div>
          <div style="font-size: 10px;">Cliente: ${selectedClient?.razon_social || 'Consumidor Final'}</div>
          <div style="font-size: 10px;">RUT: ${selectedClient?.rut || '66.666.666-6'}</div>
          <div style="font-size: 10px;">Método: ${selectedMethod}</div>
          <div style="font-size: 10px;">Total: ${fmt(total)}</div>
          <div style="font-size: 10px;">Fecha: ${new Date().toLocaleDateString('es-CL')}</div>
          
          <div style="border-top: 1px dashed #000; margin-top: 15px; padding-top: 10px;">
            <div style="font-size: 10px; font-weight: bold;">PRODUCTOS:</div>
            ${carrito.map(item => `
              <div style="font-size: 9px; margin: 5px 0;">
                ${item.nombre} x${item.quantity} - ${fmt(item.precio * item.quantity)}
              </div>
            `).join('')}
          </div>
          
          <div style="border-top: 1px dashed #000; margin-top: 15px; padding-top: 10px;">
            <div style="font-size: 10px; font-weight: bold;">RESUMEN:</div>
            <div style="font-size: 9px; margin: 3px 0;">Subtotal: ${fmt(total)}</div>
            <div style="font-size: 10px; font-weight: bold; margin: 5px 0; border-top: 1px solid #000; padding-top: 5px;">TOTAL: ${fmt(total)}</div>
            ${selectedMethod === 'efectivo' ? `
              <div style="font-size: 9px; margin: 3px 0;">Recibido: ${fmt(montoRecibido)}</div>
              <div style="font-size: 9px; margin: 3px 0;">Vuelto: ${fmt(Math.max(0, montoRecibido - total))}</div>
            ` : ''}
          </div>
          
          <div style="text-align: center; margin-top: 20px; border-top: 1px dashed #000; padding-top: 10px;">
            <div style="font-size: 9px;">¡Gracias por su compra!</div>
            <div style="font-size: 9px;">Powered by Solvendo</div>
          </div>
        </div>
      `;
      
      const printWindow = window.open('', '_blank', 'width=400,height=600');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head><title>Boleta Solvendo</title></head>
          <body>${printContent}</body>
          <script>window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 1000); }</script>
          </html>
        `);
        printWindow.document.close();
      }
    } catch (error) {
      console.error('Error al imprimir:', error);
    }
    
    // Limpiar carrito y cerrar modal
    clearCart();
    setShowPaymentModal(false)
    setShowPrintDialog(false)
    setActiveTab('destacado')
  }

  const handleReceiptClose = () => {
    setShowReceipt(false)
    clearCart()
    setActiveTab('destacado')
  }

  const filteredProducts = productos.filter(p =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  // Solo mostrar productos si hay término de búsqueda
  const shouldShowProducts = searchTerm.length > 0

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Reemplazamos el <header> manual con el componente HeaderWithMenu */}
      <HeaderWithMenu 
        title="POS" // Título para el POS
        userName={user?.nombre || 'Usuario'} // Nombre del usuario
        userAvatarUrl={user?.avatar_url || undefined} // URL del avatar si existe en tu objeto user
        showClock={true} // Mostrar el reloj
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-[2] p-6 bg-white flex flex-col">
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value)
                setShowSearchResults(e.target.value.length > 0)
              }}
              className="w-full pl-12 pr-4 py-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex-1 overflow-y-auto mb-6 space-y-4">
            {/* Mostrar productos del carrito siempre */}
            {carrito.map(item => (
              <div key={item.id} className="flex justify-between items-center py-4 border-b last:border-b-0">
                <div className="flex-1"><h4 className="font-medium">{item.nombre}</h4></div>
                <div className="flex items-center space-x-2">
                  <button onClick={()=>updateQuantity(item.id, Math.max(0, item.quantity-1))}
                    className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center flex-shrink-0">{item.quantity}</span>
                  <button onClick={()=>updateQuantity(item.id, item.quantity+1)}
                    className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center space-x-4 ml-6">
                  <span className="font-semibold">{fmt(item.precio * item.quantity)}</span>
                  <button onClick={()=>removeFromCart(item.id)} className="text-gray-600 p-1 rounded-full hover:bg-gray-100">
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            
            {/* Mostrar productos filtrados para agregar */}
            {shouldShowProducts && filteredProducts.map(p => {
              const item = carrito.find(i=>i.id===p.id)
              if (item) return null // No mostrar si ya está en el carrito
              return (
                <div key={p.id} className="flex justify-between items-center py-4 border-b last:border-b-0 bg-blue-50">
                  <div className="flex-1"><h4 className="font-medium text-blue-800">{p.nombre}</h4></div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-blue-600">{fmt(p.precio)}</span>
                    <button onClick={()=>addToCart(p)}
                      className="w-8 h-8 bg-blue-600 text-white rounded flex items-center justify-center">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
            
            {carrito.length === 0 && !shouldShowProducts && (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">Busca productos para agregarlos</p>
                  <p className="text-sm">Escribe el nombre o código del producto</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="border-t pt-4 flex flex-col">
            <div className="grid grid-cols-2 gap-4 items-center mb-4">
                <span className="text-gray-600 text-sm">
                    N° Líneas {carrito.length} / Tot. ítems {Math.max(0, carrito.reduce((s,i)=>s+Math.max(0, i.quantity||0),0))}
                </span>
                <select className="px-2 py-1.5 border rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500 w-fit ml-auto">
                    <option>Boleta manual</option>
                    <option>Boleta electrónica</option>
                    <option>Factura electrónica</option>
                </select>
            </div>

            <div className="grid grid-cols-2 gap-4 items-center mb-3">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Cliente"
                        value={currentCliente ? `${currentCliente.nombre} ${currentCliente.apellidos}` : clientSearchTerm}
                        onChange={e=>setClientSearchTerm(e.target.value)}
                        className="w-full pl-4 pr-10 py-2 border rounded-lg bg-gray-100 focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
                <div className="flex items-center justify-end">
                    <span className="text-lg font-semibold mr-2">Total</span>
                    <div className="bg-gray-100 p-2 rounded-lg text-right min-w-[100px]">
                        <span className="text-xl font-bold">{fmt(total)}</span>
                    </div>
                </div>
            </div>

            <div className="mt-auto flex gap-2">
              <button onClick={()=>clearCart()} className="flex-1 px-4 py-2 bg-gray-100 rounded flex items-center justify-center text-sm">
                <XIcon className="w-4 h-4 mr-1" />Cancelar
              </button>
              <button onClick={()=>setShowDraftModal(true)} className="flex-1 px-4 py-2 bg-gray-100 rounded flex items-center justify-center text-sm">
                <FileText className="w-4 h-4 mr-1" />Guardar borrador
              </button>
              <button
                onClick={() => setShowPaymentModal(true)}
                disabled={carrito.length===0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded font-semibold text-base disabled:opacity-50"
              >
                Pagar {fmt(total)}
              </button>
            </div>
          </div>
        </div>

        <aside className={`flex-1 p-6 bg-gray-50 border-l flex flex-col overflow-y-auto ${showPaymentModal ? 'hidden' : ''}`}>
          {activeTab==='destacado' && <ProductHighlights />}
          {activeTab==='borradores' && (
            <DraftsPanel
              borradores={borradores}
              onLoad={handleLoadDraft}
              onDelete={handleDeleteDraft}
            />
          )}
          {activeTab==='promociones' && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <Percent className="w-5 h-5 text-blue-600" />
                <h3 className="text-blue-600 font-semibold text-lg">Promociones</h3>
              </div>
              
              {promociones.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No hay promociones disponibles</p>
              ) : (
                <div className="space-y-3">
                  {promociones.map(promo => (
                    <div key={promo.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                      <h4 className="font-medium text-gray-900">{promo.nombre}</h4>
                      <p className="text-sm text-gray-600 mt-1">{promo.descripcion}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {promo.tipo === 'descuento_porcentaje' ? `${promo.valor}% descuento` : 
                           promo.tipo === 'descuento_monto' ? `$${promo.valor} descuento` : 
                           promo.tipo}
                        </span>
                        <button 
                          onClick={() => toast.info('Seleccione un producto primero')}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Aplicar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {activeTab==='productos' && <ProductsPanel onAddToCart={addToCart} searchTerm={searchTerm} />}
          {activeTab==='clientes' && (
            <ClientsPanel 
              onClientSelected={(cliente) => {
                selectClient(cliente);
                setClientSearchTerm(cliente ? cliente.razon_social : '');
              }} 
              clientSearchTerm={clientSearchTerm} 
            />
          )}

          <nav className={`flex justify-around items-center h-16 bg-white border-t mt-auto ${showPaymentModal ? 'hidden' : ''}`}>
            {TABS.map(tab => (
              <button
                key={tab.id as string}
                onClick={() => setActiveTab(tab.id as TabId)}
                className={`flex-1 flex flex-col items-center py-3 ${
                  activeTab === tab.id ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.icon}
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Payment Modal Panel */}
        {showPaymentModal && (
          <aside className="flex-1 p-6 bg-white border-l flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <h3 className="text-xl font-semibold text-gray-900">Pagar</h3>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600">
                <XIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-gray-900">Facturación</h4>
              
              {/* Document Type Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="dte"
                      value="boleta"
                      checked={selectedDte === 'boleta'}
                      onChange={() => setSelectedDte('boleta')}
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
                      onChange={() => setSelectedDte('factura')}
                      className="text-blue-600"
                    />
                    <span>Factura electrónica</span>
                  </label>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div 
                      className={`w-4 h-4 ${envioInmediato ? 'bg-blue-600' : 'border border-gray-300'} rounded-full flex items-center justify-center cursor-pointer`}
                      onClick={() => setEnvioInmediato(!envioInmediato)}
                    >
                      {envioInmediato && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <Package className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">Entrega inmediata</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck 
                      className={`w-4 h-4 ${despacho ? 'text-blue-600' : 'text-gray-400'} cursor-pointer`}
                      onClick={() => setDespacho(!despacho)}
                    />
                    <span className={`text-sm ${despacho ? 'text-blue-600' : 'text-gray-600'} cursor-pointer`} onClick={() => setDespacho(!despacho)}>Despacho</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={documentos}
                      onChange={() => setDocumentos(!documentos)}
                      className="rounded border-gray-300 text-blue-600"
                    />
                    <Percent className="w-4 h-4 text-gray-600" />
                    <span className="text-sm">Descuentos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Plus 
                      className={`w-4 h-4 ${cupon ? 'text-blue-600' : 'text-gray-400'} cursor-pointer`}
                      onClick={() => setCupon(!cupon)}
                    />
                    <span className={`text-sm ${cupon ? 'text-blue-600' : 'text-gray-600'} cursor-pointer`} onClick={() => setCupon(!cupon)}>Agregar cupón</span>
                  </div>
                </div>
                
                {/* Conditional sections */}
                {envioInmediato && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <h5 className="text-sm font-medium text-blue-800 mb-2">Configuración de Entrega Inmediata</h5>
                    <input
                      type="text"
                      placeholder="Instrucciones especiales"
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm"
                    />
                  </div>
                )}
                
                {despacho && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <h5 className="text-sm font-medium text-green-800 mb-2">Configuración de Despacho</h5>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Dirección de entrega"
                        className="px-3 py-2 border border-green-300 rounded-lg text-sm"
                      />
                      <input
                        type="date"
                        className="px-3 py-2 border border-green-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                )}
                
                {documentos && (
                  <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                    <h5 className="text-sm font-medium text-purple-800 mb-2">Descuentos</h5>
                    <div className="space-y-2">
                      <input
                        type="number"
                        placeholder="Porcentaje de descuento"
                        className="w-full px-3 py-2 border border-purple-300 rounded-lg text-sm"
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>
                )}
                
                {cupon && (
                  <div className="mt-4 p-3 bg-orange-50 rounded-lg">
                    <h5 className="text-sm font-medium text-orange-800 mb-2">Cupón de Descuento</h5>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Código del cupón"
                        className="flex-1 px-3 py-2 border border-orange-300 rounded-lg text-sm"
                      />
                      <button className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700">
                        Aplicar
                      </button>
                    </div>
                  </div>
                )}
              </div>
      </div>

      <DraftSaveModal
        isOpen={showDraftModal}
        draftName={draftName}
        setDraftName={setDraftName}
        onClose={()=>setShowDraftModal(false)}
        onSave={handleSaveDraft}
      />
      <ReceiptModal
        isOpen={showReceipt}
        onClose={handleReceiptClose}
        onPrint={handleReceiptClose}
        onSendEmail={()=>toast.success('Enviado por email')}
      />
      
      {/* Print Dialog */}
      {showPrintDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Boleta generada</h3>
              <p className="text-gray-600 mb-6">Enviar por correo electrónico (Opcional)</p>
              
              <div className="flex mb-4">
                <input
                  type="email"
                  placeholder="Email"
                  defaultValue={selectedClient?.email || ''}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => toast.success('Documento enviado por email')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700"
                >
                  Enviar
                </button>
              </div>
              
              <button
                onClick={handlePrintReceipt}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700"
              >
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}

export default Dashboard