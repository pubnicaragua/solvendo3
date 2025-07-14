// src/contexts/POSContext.tsx

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, Producto, Cliente, Venta } from '../lib/supabase'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

/** Item en el carrito */
export interface CartItem extends Producto {
  quantity: number
}

/** Borrador de venta */
export interface DraftSale {
  id: string
  nombre: string
  fecha: string
  items: CartItem[]
  total: number
}

/** Para insertar items de venta */
interface VentaItemInsert {
  venta_id: string
  producto_id: string
  cantidad: number
  precio_unitario: number
  subtotal: number
}

/** Respuesta genérica */
interface ApiResult<T> {
  success: boolean
  data?: T
  error?: string
}

/** Contexto completo del POS */
export interface POSContextType {
  // productos
  productos: Producto[]
  loading: boolean
  loadProductos: () => Promise<void>

  // carrito
  carrito: CartItem[]
  total: number
  addToCart: (producto: Producto) => void
  updateQuantity: (productId: string, quantity: number) => void
  removeFromCart: (productId: string) => void
  clearCart: () => void

  // borradores
  borradores: DraftSale[]
  loadBorradores: () => Promise<void>
  saveDraft: (nombre: string) => Promise<boolean>
  loadDraft: (draftId: string) => Promise<boolean>
  deleteDraft: (draftId: string) => Promise<boolean>

  // clientes
  clientes: Cliente[]
  currentCliente: Cliente | null
  loadClientes: () => Promise<void>
  selectClient: (cliente: Cliente) => void
  crearCliente: (clienteData: Partial<Cliente>) => Promise<ApiResult<Cliente>>

  // venta
  procesarVenta: (
    metodoPago: string,
    tipoDte: string,
    clienteId?: string
  ) => Promise<ApiResult<Venta>>

  // caja
  cajaAbierta: boolean
  checkCajaStatus: () => Promise<void>
  openCaja: (montoInicial: number) => Promise<boolean>
  closeCaja: () => Promise<boolean>

  // promociones
  promociones: any[]
  loadPromociones: () => Promise<void>
  aplicarPromocion: (
    productoId: string,
    promocionId: string
  ) => Promise<boolean>

  // documentos disponibles (nueva sección)
  docsDisponibles: { id: string; label: string; total: number }[]
  loadDocsDisponibles: (folio: string) => Promise<void>
  selectDoc: (doc: { id: string; label: string; total: number }) => void
}

const POSContext = createContext<POSContextType | undefined>(undefined)

export const usePOS = (): POSContextType => {
  const ctx = useContext(POSContext)
  if (!ctx) throw new Error('usePOS must be inside POSProvider')
  return ctx
}

export const POSProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const { user, empresaId, sucursalId } = useAuth()

  // ── Estados ─────────────────────────────────────────────────────────────
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(false)

  const [carrito, setCarrito] = useState<CartItem[]>([])
  const total = carrito.reduce((sum, i) => sum + i.precio * i.quantity, 0)

  const [borradores, setBorradores] = useState<DraftSale[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [currentCliente, setCurrentCliente] = useState<Cliente | null>(null)

  const [promociones, setPromociones] = useState<any[]>([])
  const [cajaAbierta, setCajaAbierta] = useState(false)

  // ── Docs disponibles ─────────────────────────────────────────────────────
  const [docsDisponibles, setDocsDisponibles] = useState<{
    id: string
    label: string
    total: number
  }[]>([])

  const loadDocsDisponibles = useCallback(
    async (folio: string) => {
      if (!empresaId) return
      const { data, error } = await supabase
        .from('ventas')
        .select('id, folio, tipo_dte, total')
        .ilike('folio', `%${folio}%`)
        .eq('empresa_id', empresaId)
        .order('fecha', { ascending: false })
        .limit(10)

      if (error) {
        console.error('Error loading docsDisponibles', error)
        setDocsDisponibles([])
      } else {
        setDocsDisponibles(
          (data || []).map((d: any) => ({
            id: d.id,
            label:
              (d.tipo_dte === 'boleta'
                ? 'Boleta manual (no válida al SII)'
                : d.tipo_dte) +
              ' Nº' +
              d.folio,
            total: d.total
          }))
        )
      }
    },
    [empresaId]
  )

  const selectDoc = (doc: { id: string; label: string; total: number }) => {
    setCarrito(prev => {
      if (prev.find(i => i.id === doc.id)) return prev
      return [
        ...prev,
        { id: doc.id, nombre: doc.label, precio: doc.total, quantity: 1 }
      ]
    })
  }
  // ── Fin Docs disponibles ─────────────────────────────────────────────────

  // ── Productos ─────────────────────────────────────────
  const loadProductos = useCallback(async () => {
    if (!empresaId) return
    setLoading(true)
    const { data, error } = await supabase
      .from<Producto>('productos')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('activo', true)
      .order('nombre', { ascending: true })

    if (error) {
      console.error('Error loading productos', error)
      toast.error('No se pudieron cargar productos')
      setProductos([])
    } else {
      setProductos(data || [])
    }
    setLoading(false)
  }, [empresaId])

  // ── Carrito ──────────────────────────────────────────
  const addToCart = (producto: Producto) => {
    setCarrito(prev => {
      const found = prev.find(i => i.id === producto.id)
      if (found) {
        return prev.map(i =>
          i.id === producto.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { ...producto, quantity: 1 }]
    })
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
    } else {
      setCarrito(prev =>
        prev.map(i =>
          i.id === productId ? { ...i, quantity } : i
        )
      )
    }
  }

  const removeFromCart = (productId: string) => {
    setCarrito(prev => prev.filter(i => i.id !== productId))
  }

  const clearCart = () => {
    setCarrito([])
  }

  // ── Borradores ───────────────────────────────────────
  const loadBorradores = useCallback(async () => {
    if (!empresaId || !user) return
    const { data, error } = await supabase
      .from<Omit<DraftSale, 'items'> & { items: CartItem[] }>(
        'borradores_venta'
      )
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading drafts', error)
      setBorradores([])
    } else {
      setBorradores(data as DraftSale[])
    }
  }, [empresaId, user])

  const saveDraft = async (nombre: string) => {
    if (!empresaId || !user || carrito.length === 0) return false
    const { error } = await supabase
      .from('borradores_venta')
      .insert([{ empresa_id: empresaId, usuario_id: user.id, nombre, fecha: new Date().toISOString(), items: carrito, total }])

    if (error) { toast.error('Error al guardar borrador'); return false }
    toast.success('Borrador guardado')
    await loadBorradores()
    return true
  }

  const loadDraft = async (draftId: string) => {
    const { data, error } = await supabase
      .from<Omit<DraftSale, 'items'> & { items: CartItem[] }>('borradores_venta')
      .select('*')
      .eq('id', draftId)
      .single()

    if (error || !data) { toast.error('Error al cargar borrador'); return false }
    setCarrito(data.items)
    toast.success('Borrador cargado')
    return true
  }

  const deleteDraft = async (draftId: string) => {
    const { error } = await supabase.from('borradores_venta').delete().eq('id', draftId)
    if (error) { toast.error('Error al eliminar borrador'); return false }
    toast.success('Borrador eliminado')
    await loadBorradores()
    return true
  }

  // ── Clientes ─────────────────────────────────────────
  const loadClientes = useCallback(async () => {
    if (!empresaId) return
    const { data, error } = await supabase
      .from<Cliente>('clientes')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('razon_social', { ascending: true })

    if (error) {
      console.error('Error loading clients', error)
      setClientes([])
    } else {
      setClientes(data || [])
    }
  }, [empresaId])

  const selectClient = (cliente: Cliente) => {
    setCurrentCliente(cliente)
    toast.success(`Cliente ${cliente.razon_social} seleccionado`)
  }

  const crearCliente = async (
    clienteData: Partial<Cliente>
  ): Promise<ApiResult<Cliente>> => {
    if (!empresaId) return { success: false, error: 'Empresa no definida' }
    const { data, error } = await supabase
      .from<Cliente>('clientes')
      .insert([{ empresa_id: empresaId, ...clienteData }])
      .select()
      .single()

    if (error || !data) {
      toast.error('Error al crear cliente')
      return { success: false, error: error?.message }
    }
    toast.success('Cliente creado')
    await loadClientes()
    return { success: true, data }
  }

  // ── Venta ───────────────────────────────────────────
  const procesarVenta = async (
    metodoPago: string,
    tipoDte: string,
    clienteId?: string
  ): Promise<ApiResult<Venta>> => {
    if (!user || !empresaId || !sucursalId || carrito.length === 0) {
      return { success: false, error: 'Datos incompletos' }
    }
    const folio = `${Date.now()}`
    const { data: venta, error: err1 } = await supabase
      .from<Venta>('ventas')
      .insert([{ empresa_id: empresaId, sucursal_id: sucursalId, cliente_id: clienteId || null, usuario_id: user.id, folio, tipo_dte: tipoDte, metodo_pago: metodoPago, subtotal: total, total, estado: 'completada' }])
      .select()
      .single()

    if (err1 || !venta) return { success: false, error: err1?.message }

    const items: VentaItemInsert[] = carrito.map(i => ({ venta_id: venta.id, producto_id: i.id, cantidad: i.quantity, precio_unitario: i.precio, subtotal: i.quantity * i.precio }))
    const { error: err2 } = await supabase.from('venta_items').insert(items)
    if (err2) return { success: false, error: err2.message }

    clearCart()
    setCurrentCliente(null)
    return { success: true, data: venta }
  }

  // ── Caja y promociones ──────────────────────────────
  const checkCajaStatus = useCallback(async () => {
    setCajaAbierta(false)
  }, [])

  const openCaja = async (montoInicial: number) => {
    setCajaAbierta(true)
    toast.success('Caja abierta')
    return true
  }

  const closeCaja = async () => {
    setCajaAbierta(false)
    toast.success('Caja cerrada')
    return true
  }

  const loadPromociones = useCallback(async () => {
    setPromociones([ { id: 'p1', nombre: '10% OFF', tipo: 'descuento_porcentaje', valor: 10 }, { id: 'p2', nombre: '2x1', tipo: '2x1', valor: null } ])
  }, [])

  const aplicarPromocion = async (
    productoId: string,
    promocionId: string
  ): Promise<boolean> => {
    toast.success('Promoción aplicada')
    return true
  }

  // ── Inicialización ─────────────────────────────────
  useEffect(() => {
    if (!empresaId) return

    setLoading(true)
    Promise.all([
      loadProductos(),
      loadBorradores(),
      loadClientes(),
      loadPromociones(),
      checkCajaStatus()
    ]).finally(() => setLoading(false))
  }, [empresaId, loadProductos, loadBorradores, loadClientes, loadPromociones, checkCajaStatus])

  // ── Proveedor ──────────────────────────────────────
  const value: POSContextType = {
    productos,
    loading,
    loadProductos,

    carrito,
    total,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,

    borradores,
    loadBorradores,
    saveDraft,
    loadDraft,
    deleteDraft,

    clientes,
    currentCliente,
    loadClientes,
    selectClient,
    crearCliente,

    procesarVenta,

    cajaAbierta,
    checkCajaStatus,
    openCaja,
    closeCaja,

    promociones,
    loadPromociones,
    aplicarPromocion,

    docsDisponibles,
    loadDocsDisponibles,
    selectDoc
  }

  return <POSContext.Provider value={value}>{children}</POSContext.Provider>
}
