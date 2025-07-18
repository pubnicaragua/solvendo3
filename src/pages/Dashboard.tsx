import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Star, FileText, Gift, User,
  Plus, Minus, X as XIcon, Percent
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
  const navigate = useNavigate() // Ahora está correctamente importado
  const {
    productos, carrito, total,
    addToCart, updateQuantity, removeFromCart, clearCart,
    borradores, loadBorradores, saveDraft, loadDraft, deleteDraft, 
    promociones, loadPromociones, aplicarPromocion,
    currentCliente, selectClient
  } = usePOS()

  const [activeTab, setActiveTab]         = useState<TabId>('destacado')
  const [searchTerm, setSearchTerm]       = useState('')
  const [clientSearchTerm, setClientSearchTerm] = useState('')
  // currentTime ya no se necesita aquí si HeaderWithMenu lo gestiona
  // const [currentTime, setCurrentTime]     = useState('')
  const [showDraftModal, setShowDraftModal] = useState(false)
  const [draftName, setDraftName]         = useState('')
  const [showReceipt, setShowReceipt]     = useState(false) 

  useEffect(() => {
    loadBorradores()
    loadPromociones()
  },[loadBorradores])

  const fmt = (n:number) =>
    new Intl.NumberFormat('es-CL',{ style:'currency',currency:'CLP' }).format(n)

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
    
    navigate('/facturacion')
  }

  const handlePaymentComplete = () => setShowReceipt(true)
  const handleReceiptClose = () => {
    setShowReceipt(false)
    clearCart()
    setActiveTab('destacado')
  }

  const filteredProducts = productos.filter(p =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
              onChange={e=>setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1 overflow-y-auto mb-6 space-y-4">
            {filteredProducts.map(p => {
              const item = carrito.find(i=>i.id===p.id)
              const qty  = item?.quantity || 0
              return (
                <div key={p.id} className="flex justify-between items-center py-4 border-b last:border-b-0">
                  <div className="flex-1"><h4 className="font-medium">{p.nombre}</h4></div>
                  <div className="flex items-center space-x-2">
                    <button onClick={()=>qty>0&&updateQuantity(p.id,qty-1)}
                      className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center flex-shrink-0">{qty}</span>
                    <button onClick={()=>addToCart(p)}
                      className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center space-x-4 ml-6">
                    <span className="font-semibold">{fmt(qty*p.precio)}</span>
                    {qty>0&&(
                      <button onClick={()=>removeFromCart(p.id)} className="text-gray-600 p-1 rounded-full hover:bg-gray-100">
                        <XIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="border-t pt-4 flex flex-col">
            <div className="grid grid-cols-2 gap-4 items-center mb-4">
                <span className="text-gray-600 text-sm">
                    N° Líneas {carrito.length} / Tot. ítems {carrito.reduce((s,i)=>s+i.quantity,0)}
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
                onClick={startPayment}
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
    </div>
  )
}

export default Dashboard