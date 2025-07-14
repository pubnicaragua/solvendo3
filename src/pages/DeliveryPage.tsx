import React, { useState, useEffect } from 'react'
import {
  Truck,
  Search,
  User,
  Plus,
  Minus,
  X as XIcon,
  Calendar
} from 'lucide-react'
import { HeaderWithMenu } from '../components/common/HeaderWithMenu'
import { useAuth } from '../contexts/AuthContext'
import { usePOS } from '../contexts/POSContext'
import { supabase, Cliente } from '../lib/supabase'
import { ClientModal } from '../components/pos/ClientModal'

export const DeliveryPage: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { user, empresaId } = useAuth()
  const {
    carrito,
    total,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart
  } = usePOS()

  // Estado para búsqueda de productos y documentos
  const [productSearch, setProductSearch] = useState('')
  const [docSearch, setDocSearch] = useState('')
  // Ítems retornados por backend
  const [productos, setProductos] = useState<any[]>([])
  const [docsDisponibles, setDocsDisponibles] = useState<any[]>([])

  // Cliente seleccionado
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null)
  const [showClientModal, setShowClientModal] = useState(false)
  const [clientError, setClientError] = useState(false)

  // Datos del despacho
  const [despachoData, setDespachoData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    tipo: 'Guía de despacho manual',
    destinatario: '',
    direccion: '',
    comuna: '',
    ciudad: '',
    region: '',
    numDocumento: ''
  })

  // Cargar productos y docs
  useEffect(() => {
    if (!empresaId) return

    ;(async () => {
      // Traer productos según búsqueda
      const { data: prods } = await supabase
        .from('productos')
        .select('*')
        .ilike('nombre', `%${productSearch}%`)
        .limit(10)
      setProductos(prods || [])

      // Traer docs disponibles
      const { data: docs } = await supabase
        .from('ventas')
        .select('id, folio, tipo_dte, total')
        .ilike('folio', `%${docSearch}%`)
        .eq('empresa_id', empresaId)
        .limit(10)
      setDocsDisponibles(
        (docs || []).map((d: any) => ({
          ...d,
          label:
            (d.tipo_dte === 'boleta'
              ? 'Boleta manual (no válida al SII)'
              : d.tipo_dte) +
            ' Nº' +
            d.folio,
          total: d.total
        }))
      )
    })()
  }, [productSearch, docSearch, empresaId])

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(n)

  // Seleccionar documento -> agregar al carrito
  const handleSelectDoc = (doc: any) => {
    addToCart({
      id: doc.id,
      nombre: doc.label,
      precio: doc.total,
      quantity: 1
    })
  }

  // Seleccionar cliente
  const handleClientSelect = (c: Cliente) => {
    setSelectedClient(c)
    setDespachoData((p) => ({
      ...p,
      destinatario: c.razon_social,
      direccion: c.direccion || '',
      comuna: c.comuna || '',
      ciudad: c.ciudad || '',
      region: c.region || '',
      numDocumento: c.rut
    }))
    setShowClientModal(false)
  }

  // Confirmar despacho
  const handleConfirm = async () => {
    if (!selectedClient) {
      setClientError(true)
      return
    }

    // Insertar en supabase
    const { data: despacho, error } = await supabase
      .from('despachos')
      .insert([
        {
          empresa_id: empresaId,
          usuario_id: user?.id,
          fecha: despachoData.fecha,
          tipo: despachoData.tipo,
          cliente_id: selectedClient.id,
          destinatario: despachoData.destinatario,
          direccion: despachoData.direccion,
          comuna: despachoData.comuna,
          ciudad: despachoData.ciudad,
          region: despachoData.region,
          numero_documento: despachoData.numDocumento,
          total
        }
      ])
      .single()

    if (error || !despacho) {
      console.error(error)
      alert('Error al crear despacho')
      return
    }

    // Detalles
    const detalles = carrito.map((item) => ({
      despacho_id: despacho.id,
      producto_id: item.id,
      cantidad: item.quantity,
      precio: item.precio,
      descuento: 0
    }))
    await supabase.from('despachos_items').insert(detalles)
    clearCart()
    onClose()
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <HeaderWithMenu
        title="Despacho"
        icon={<Truck className="w-6 h-6 text-gray-600" />}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Izquierda */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Buscador productos */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Ingresa aquí el producto o servicio"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-lg"
            />
          </div>

          {/* Tabla productos agregados */}
          <div className="grid grid-cols-4 gap-4 text-sm font-medium border-b pb-2 mb-4">
            <span>Producto</span>
            <span>Cantidad</span>
            <span>Descuento</span>
            <span>Importe</span>
          </div>

          <div className="space-y-3 mb-6">
            {carrito.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-4 gap-4 items-center p-3 bg-gray-50 rounded-lg"
              >
                <span className="text-sm">{item.nombre}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      updateQuantity(item.id, Math.max(1, item.quantity - 1))
                    }
                    className="p-1 bg-gray-200 rounded"
                  >
                    <Minus />
                  </button>
                  <span className="w-6 text-center">{item.quantity}</span>
                  <button
                    onClick={() =>
                      updateQuantity(item.id, item.quantity + 1)
                    }
                    className="p-1 bg-gray-200 rounded"
                  >
                    <Plus />
                  </button>
                </div>
                <span>0%</span>
                <div className="flex items-center justify-between">
                  <span>{formatPrice(item.precio * item.quantity)}</span>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500"
                  >
                    <XIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pie */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600">
              Nº Líneas {carrito.length} / Tot. ítems {carrito.length}
            </div>
            <select className="px-3 py-2 bg-white border rounded-lg">
              <option>Guía de despacho manual</option>
            </select>
          </div>

          {/* Buscador cliente */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white" />
            <button
              onClick={() => setShowClientModal(true)}
              className="w-full pl-12 pr-4 py-3 bg-blue-600 text-white rounded-lg text-left"
            >
              {selectedClient
                ? selectedClient.razon_social
                : 'Cliente'}
            </button>
          </div>

          {/* Total y enviar */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-lg font-semibold">Total</span>
            <span className="px-4 py-2 bg-gray-100 rounded-lg text-lg font-semibold">
              {formatPrice(total)}
            </span>
          </div>
          <button
            onClick={handleConfirm}
            className="w-full py-3 bg-blue-600 text-white rounded-lg"
          >
            Despachar
          </button>
          <button
            onClick={onClose}
            className="mt-4 w-full py-3 bg-gray-100 text-gray-700 rounded-lg flex items-center justify-center gap-2"
          >
            <XIcon /> Cancelar
          </button>
        </div>

        {/* Derecha */}
        <aside className="w-96 p-6 bg-gray-50 border-l overflow-y-auto">
          <div className="space-y-6">
            <div>
              <span className="text-blue-800 font-medium">
                Documentos disponibles
              </span>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Ingresa aquí el número de documento"
                  value={docSearch}
                  onChange={(e) => setDocSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border rounded-lg"
                />
              </div>
            </div>

            {docsDisponibles.map((doc) => (
              <div
                key={doc.id}
                className="p-3 bg-white rounded-lg border flex justify-between items-center cursor-pointer hover:bg-gray-50"
                onClick={() => handleSelectDoc(doc)}
              >
                <div>
                  <p className="font-medium">{doc.label}</p>
                  <p>{formatPrice(doc.total)}</p>
                </div>
                <span className="text-green-600">✓</span>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* Modal de Cliente */}
      <ClientModal
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)}
        onClientSelect={handleClientSelect}
      />

      {/* Error sin cliente */}
      {clientError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl">
            <p className="mb-4 text-center">
              Debes seleccionar un cliente antes de despachar
            </p>
            <button
              onClick={() => setClientError(false)}
              className="w-full py-2 bg-blue-600 text-white rounded-lg"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
