import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Star, FileText, Gift, User, Filter,
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
  
  // Estados del panel de pago
  const [selectedMethod, setSelectedMethod] = useState<string>('efectivo')
  const [selectedDte, setSelectedDte] = useState<string>('boleta')
  const [selectedTerminal, setSelectedTerminal] = useState<string>('terminal_principal')
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [montoRecibido, setMontoRecibido] = useState<number>(0)
  const [enviarSII, setEnviarSII] = useState(false)
  const [loading, setLoading] = useState(false)

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
    
    // Navegar a la página de facturación preservando el contexto
    navigate('/facturacion')
  }

  const handlePaymentComplete = (metodoPago: string, tipoDte: string) => {
    setShowPaymentModal(false)
    setShowReceipt(true)
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

        <aside className="flex-1 p-6 bg-gray-50 border-l flex flex-col overflow-y-auto">
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

          <nav className="flex justify-around items-center h-16 bg-white border-t mt-auto">
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
      
      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-end z-50">
          <div className="bg-white h-full w-96 shadow-xl overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Facturación</h3>
                <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600">
                  <XIcon className="w-6 h-6" />
                </button>
              </div>
              
              {/* Document Type Selection */}
              <div className="space-y-4 mb-6">
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
              </div>

              {/* Payment Methods */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Métodos de pago</h4>
                <div className="grid grid-cols-1 gap-3">
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
                
                {/* Cash Amount for Efectivo */}
                {selectedMethod === 'efectivo' && (
                  <div className="mt-4">
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
                    <span className="font-semibold">{fmt(total)}</span>
                  </div>
                  {selectedMethod === 'efectivo' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm">Monto recibido</span>
                        <span>{fmt(montoRecibido)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Vuelto</span>
                        <span>{fmt(Math.max(0, montoRecibido - total))}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handlePaymentComplete(selectedMethod, selectedDte)}
                disabled={loading || carrito.length === 0 || (selectedMethod === 'efectivo' && montoRecibido < total)}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Procesando...' : 'Confirmar pago'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard