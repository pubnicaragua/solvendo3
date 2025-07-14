import React, { useState, useEffect } from 'react'
import {
  Search, Star, FileText, Gift, User,
  Plus, Minus, X as XIcon, Clock, Menu as MenuIcon
} from 'lucide-react'
import toast from 'react-hot-toast'

import { usePOS } from '../contexts/POSContext'
import { useAuth } from '../contexts/AuthContext'
import { useSidebar } from '../contexts/SidebarContext'

import ProductHighlights from '../components/pos/ProductHighlights'
import DraftsPanel       from '../components/pos/DraftsPanel'
import ProductsPanel     from '../components/pos/ProductsPanel'
import ClientsPanel      from '../components/pos/ClientsPanel'
import PaymentPanel      from '../components/pos/PaymentPanel'
import { ReceiptModal}       from '../components/pos/ReceiptModal'
import { DraftSaveModal}     from '../components/pos/DraftSaveModal'

import { Logo }          from '../components/common/Logo'

type TabId = 'destacado' | 'borradores' | 'productos' | 'clientes'
const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'destacado',  label: 'Destacado',  icon: <Star className="w-5 h-5" /> },
  { id: 'borradores', label: 'Borradores', icon: <FileText className="w-5 h-5" /> },
  { id: 'productos',  label: 'Productos',  icon: <Gift className="w-5 h-5" /> },
  { id: 'clientes',   label: 'Clientes',   icon: <User className="w-5 h-5" /> },
]

const Dashboard: React.FC = () => {
  const { toggleSidebar } = useSidebar()
  const { user }         = useAuth()
  const {
    productos, carrito, total,
    addToCart, updateQuantity, removeFromCart, clearCart,
    borradores, loadBorradores, saveDraft, loadDraft, deleteDraft,
    currentCliente, selectClient
  } = usePOS()

  // UI states
  const [activeTab, setActiveTab]         = useState<TabId>('destacado')
  const [searchTerm, setSearchTerm]       = useState('')
  const [currentTime, setCurrentTime]     = useState('')
  const [showDraftModal, setShowDraftModal] = useState(false)
  const [draftName, setDraftName]         = useState('')
  const [creatingClient, setCreatingClient] = useState(false)
  const [inPaymentFlow, setInPaymentFlow]   = useState(false)
  const [showReceipt, setShowReceipt]     = useState(false)

  // Reloj
  useEffect(() => {
    const tick = () =>
      setCurrentTime(
        new Intl.DateTimeFormat('es-CL',{ hour:'2-digit',minute:'2-digit',hour12:false })
          .format(new Date())
      )
    tick()
    const id = setInterval(tick,1000)
    return () => clearInterval(id)
  },[])

  // Carga inicial
  useEffect(() => {
    loadBorradores()
  },[loadBorradores])

  const fmt = (n:number) =>
    new Intl.NumberFormat('es-CL',{ style:'currency',currency:'CLP' }).format(n)

  // Borradores handlers
  const handleSaveDraft = async () => {
    if (!draftName.trim() || carrito.length===0) return
    setShowDraftModal(false)
    if (await saveDraft(draftName)) {
      toast.success('Borrador guardado')
      setDraftName('')
      loadBorradores()
    }
  }
  const handleLoadDraft = async (id:string) => {
    await loadDraft(id)
    setActiveTab('destacado')
  }
  const handleDeleteDraft = async (id:string) => {
    if (confirm('¿Eliminar borrador?') && await deleteDraft(id)) {
      toast.success('Borrador eliminado')
      loadBorradores()
    }
  }

  // Flujo pago
  const startPayment = () => setInPaymentFlow(true)
  const handlePaymentComplete = () => setShowReceipt(true)
  const handleReceiptClose = () => {
    setShowReceipt(false)
    clearCart()
    setInPaymentFlow(false)
    setActiveTab('destacado')
  }

  // Filtrado productos
  const filteredProducts = productos.filter(p =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* HEADER */}
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b">
        <div className="flex items-center gap-3">
          <button onClick={toggleSidebar} className="p-2 hover:bg-gray-100 rounded-lg">
            <MenuIcon className="w-5 h-5 text-gray-600" />
          </button>
          <span className="text-lg font-semibold">POS</span>
        </div>
        <Logo size="md" />
        <div className="flex items-center gap-4">
          <div className="flex items-center px-3 py-1 bg-gray-100 rounded-lg">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="ml-1 text-sm">{currentTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">
                {user?.nombre?.[0]||'U'}{user?.apellidos?.[0]||''}
              </span>
            </div>
            <span className="font-medium">{user?.nombre} {user?.apellidos}</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANEL */}
        <div className="flex-[2] p-6 bg-white flex flex-col">
          {/* Buscador */}
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
          {/* Lista carrito */}
          <div className="flex-1 overflow-y-auto mb-6 space-y-4">
            {filteredProducts.map(p => {
              const item = carrito.find(i=>i.id===p.id)
              const qty  = item?.quantity||0
              return (
                <div key={p.id} className="flex justify-between items-center py-4 border-b last:border-b-0">
                  <div className="flex-1"><h4 className="font-medium">{p.nombre}</h4></div>
                  <div className="flex items-center space-x-2">
                    <button onClick={()=>qty>0&&updateQuantity(p.id,qty-1)}
                      className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center">{qty}</span>
                    <button onClick={()=>addToCart(p)}
                      className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center space-x-4 ml-6">
                    <span className="font-semibold">{fmt(qty*p.precio)}</span>
                    {qty>0&&(
                      <button onClick={()=>removeFromCart(p.id)} className="text-red-500">
                        <XIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          {/* Pie */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1 pr-4">
                <div className="text-gray-600 text-sm mb-2">
                  N° Líneas {carrito.length} / Tot. ítems {carrito.reduce((s,i)=>s+i.quantity,0)}
                </div>
                <select className="w-full px-3 py-2 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500">
                  <option>Boleta manual</option>
                  <option>Boleta electrónica</option>
                  <option>Factura electrónica</option>
                </select>
              </div>
              <div className="flex space-x-3">
                <button onClick={()=>clearCart()} className="px-4 py-2 bg-gray-100 rounded flex items-center">
                  <XIcon className="w-4 h-4 mr-1" />Cancelar
                </button>
                <button onClick={()=>setShowDraftModal(true)} className="px-4 py-2 bg-gray-100 rounded flex items-center">
                  <FileText className="w-4 h-4 mr-1" />Guardar borrador
                </button>
              </div>
            </div>
            <div className="text-right">
              <button
                onClick={startPayment}
                disabled={carrito.length===0 || !currentCliente}
                className="px-6 py-2 bg-blue-600 text-white rounded font-semibold disabled:opacity-50"
              >
                Pagar {fmt(total)}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <aside className="flex-1 p-6 bg-gray-50 border-l flex flex-col overflow-y-auto">
          {!inPaymentFlow ? (
            <>
              {activeTab==='destacado'  && <ProductHighlights />}
              {activeTab==='borradores' && (
                <DraftsPanel
                  borradores={borradores}
                  onLoad={handleLoadDraft}
                  onDelete={handleDeleteDraft}
                />
              )}
              {activeTab==='productos'  && <ProductsPanel />}
              {activeTab==='clientes'   && (
                <ClientsPanel onClientSelected={startPayment} />
              )}
            </>
          ) : (
            <PaymentPanel
              total={total}
              onPaymentComplete={handlePaymentComplete}
            />
          )}

          {!inPaymentFlow && (
            <nav className="flex justify-around items-center h-16 bg-white border-t mt-auto">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={()=>setActiveTab(tab.id)}
                  className={`flex flex-col items-center justify-center space-y-1 px-4 py-2 ${
                    activeTab===tab.id ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.icon}
                  <span className="text-xs font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          )}
        </aside>
      </div>

      {/* Modales */}
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
