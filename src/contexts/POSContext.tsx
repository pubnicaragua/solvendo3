import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase'; // Asegúrate que la ruta sea correcta
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

// ===================================================================================
// INTERFACES Y TIPOS COMPLETOS
// ===================================================================================
/**
 * Representa un producto en la base de datos.
 * AJUSTA ESTOS CAMPOS PARA QUE COINCIDAN CON TU TABLA `productos`.
 */
export interface Producto {
  id: string;
  empresa_id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  costo?: number;
  stock: number;
  sku?: string;
  codigo_barras?: string;
  activo: boolean;
  created_at: string;
}

/**
 * Representa un cliente en la base de datos.
 * AJUSTA ESTOS CAMPOS PARA QUE COINCIDAN CON TU TABLA `clientes`.
 */
export interface Cliente {
  id: string;
  empresa_id: string;
  razon_social: string;
  rut: string; // O el identificador fiscal que uses
  email?: string;
  telefono?: string;
  direccion?: string;
  comuna?: string;
  ciudad?: string;
  created_at: string;
}

/**
 * Representa una venta en la base de datos.
 * Basado en el esquema que proporcionaste.
 */
export interface Venta {
  id: string;
  empresa_id: string;
  sucursal_id: string;
  caja_id: string;
  apertura_caja_id: string;
  cliente_id: string | null;
  usuario_id: string;
  folio: string;
  tipo_dte: 'boleta' | 'factura' | 'nota_credito';
  metodo_pago: string;
  subtotal: number;
  descuento: number;
  impuestos: number;
  total: number;
  estado: 'pendiente' | 'completada' | 'anulada';
  fecha: string;
  created_at: string;
}

/**
 * Representa una apertura de caja.
 * Basado en el esquema que proporcionaste.
 */
export interface AperturaCaja {
  id: string;
  caja_id: string;
  usuario_id: string;
  fecha_apertura: string;
  fecha_cierre: string | null;
  monto_inicial: number;
  monto_final: number | null;
  diferencia: number | null;
  estado: 'abierta' | 'cerrada';
  observaciones: string | null;
  created_at: string;
}

/** Representa un movimiento de caja (ingreso/retiro/venta). */
export interface MovimientoCaja {
    id: string;
    apertura_caja_id: string | null; // Puede ser null si el movimiento no está ligado a una apertura específica
    usuario_id: string | null;
    tipo: 'ingreso' | 'retiro' | 'venta'; // 'venta' si una venta se registra también como movimiento
    monto: number;
    observacion?: string | null; // Coincide con el esquema de la DB
    fecha?: string; // Coincide con el esquema de la DB
    created_at: string;
}

/** Item en el carrito de compras */
export interface CartItem extends Producto {
  quantity: number;
}

/** Borrador de venta guardado */
export interface DraftSale {
  id: string;
  nombre: string;
  fecha: string;
  items: CartItem[];
  total: number;
}

/** Para insertar items de venta en la base de datos */
interface VentaItemInsert {
  venta_id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

/** Respuesta genérica para operaciones asíncronas */
interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ===================================================================================
// INTERFAZ DEL CONTEXTO
// ===================================================================================
export interface POSContextType {
  // Productos
  productos: Producto[];
  loading: boolean;
  loadProductos: () => Promise<void>;

  // Carrito
  carrito: CartItem[];
  total: number;
  addToCart: (producto: Producto) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;

  // Borradores
  borradores: DraftSale[];
  loadBorradores: () => Promise<void>;
  saveDraft: (nombre: string) => Promise<boolean>;
  loadDraft: (draftId: string) => Promise<boolean>;
  deleteDraft: (draftId: string) => Promise<boolean>;

  // Clientes
  clientes: Cliente[];
  currentCliente: Cliente | null;
  loadClientes: () => Promise<void>;
  selectClient: (cliente: Cliente | null) => void;
  crearCliente: (clienteData: Partial<Cliente>) => Promise<ApiResult<Cliente>>;

  // Venta
  procesarVenta: (
    metodoPago: string,
    tipoDte: 'boleta' | 'factura' | 'nota_credito',
    clienteId?: string
  ) => Promise<ApiResult<Venta>>;

  // Caja
  cajaAbierta: boolean;
  currentAperturaCaja: AperturaCaja | null;
  checkCajaStatus: () => Promise<void>;
  openCaja: (montoInicial: number, cajaId: string) => Promise<boolean>;
  closeCaja: (montoFinal: number, observaciones?: string) => Promise<boolean>;

  // Promociones
  promociones: any[];
  loadPromociones: () => Promise<void>;
  aplicarPromocion: (
    productoId: string,
    promocionId: string
  ) => Promise<boolean>;

  // Documentos disponibles
  docsDisponibles: { id: string; label: string; total: number }[];
  loadDocsDisponibles: (folio: string) => Promise<void>;
  selectDoc: (doc: { id: string; label: string; total: number }) => void;
}

// ===================================================================================
// CONTEXT PROVIDER
// ===================================================================================
const POSContext = createContext<POSContextType | undefined>(undefined);

export const usePOS = (): POSContextType => {
  const ctx = useContext(POSContext);
  if (!ctx) throw new Error('usePOS debe ser usado dentro de un POSProvider');
  return ctx;
};

export const POSProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, empresaId, sucursalId } = useAuth();

  // --- Estados ---
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [carrito, setCarrito] = useState<CartItem[]>([]);
  const total = carrito.reduce((sum, i) => sum + (i.precio * i.quantity), 0);
  const [borradores, setBorradores] = useState<DraftSale[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [currentCliente, setCurrentCliente] = useState<Cliente | null>(null);
  const [promociones, setPromociones] = useState<any[]>([]);
  const [docsDisponibles, setDocsDisponibles] = useState<{ id: string; label: string; total: number }[]>([]);
  
  // --- Estados de Caja ---
  const [cajaAbierta, setCajaAbierta] = useState(false);
  const [currentAperturaCaja, setCurrentAperturaCaja] = useState<AperturaCaja | null>(null);


  // --- Productos ---
  const loadProductos = useCallback(async () => {
    if (!empresaId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('activo', true)
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error loading productos', error);
      toast.error('No se pudieron cargar productos');
      setProductos([]);
    } else {
      setProductos(data || []);
    }
    setLoading(false);
  }, [empresaId]);

  // --- Carrito ---
  const addToCart = (producto: Producto) => {
    setCarrito(prev => {
      const found = prev.find(i => i.id === producto.id);
      if (found) {
        return prev.map(i =>
          i.id === producto.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...producto, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCarrito(prev =>
        prev.map(i =>
          i.id === productId ? { ...i, quantity } : i
        )
      );
    }
  };

  const removeFromCart = (productId: string) => {
    setCarrito(prev => prev.filter(i => i.id !== productId));
  };

  const clearCart = () => {
    setCarrito([]);
    setCurrentCliente(null);
  };

  // --- Borradores ---
  const loadBorradores = useCallback(async () => {
    if (!empresaId || !user) return;
    const { data, error } = await supabase
      .from('borradores_venta')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading drafts', error);
      setBorradores([]);
    } else {
      setBorradores(data as DraftSale[]);
    }
  }, [empresaId, user]);

  const saveDraft = async (nombre: string): Promise<boolean> => {
    if (!empresaId || !user || carrito.length === 0) return false;
    const { error } = await supabase
      .from('borradores_venta')
      .insert([{ empresa_id: empresaId, usuario_id: user.id, nombre, fecha: new Date().toISOString(), items: carrito, total }]);

    if (error) { toast.error('Error al guardar borrador'); return false; }
    toast.success('Borrador guardado');
    await loadBorradores();
    return true;
  };

  const loadDraft = async (draftId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('borradores_venta')
      .select('*')
      .eq('id', draftId)
      .single();

    if (error || !data) { toast.error('Error al cargar borrador'); return false; }
    setCarrito(data.items as CartItem[]);
    toast.success('Borrador cargado');
    return true;
  };

  const deleteDraft = async (draftId: string): Promise<boolean> => {
    const { error } = await supabase.from('borradores_venta').delete().eq('id', draftId);
    if (error) { toast.error('Error al eliminar borrador'); return false; }
    toast.success('Borrador eliminado');
    await loadBorradores();
    return true;
  };

  // --- Clientes ---
  const loadClientes = useCallback(async () => {
    if (!empresaId) return;
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('razon_social', { ascending: true });

    if (error) {
      console.error('Error loading clients', error);
      setClientes([]);
    } else {
      setClientes(data || []);
    }
  }, [empresaId]);

  const selectClient = (cliente: Cliente | null) => {
    setCurrentCliente(cliente);
    if(cliente) {
        toast.success(`Cliente ${cliente.razon_social} seleccionado`);
    } else {
        toast.info('Cliente deseleccionado');
    }
  };

  const crearCliente = async (clienteData: Partial<Cliente>): Promise<ApiResult<Cliente>> => {
    if (!empresaId) return { success: false, error: 'Empresa no definida' };
    const { data, error } = await supabase
      .from('clientes')
      .insert([{ empresa_id: empresaId, ...clienteData }])
      .select()
      .single();

    if (error || !data) {
      console.error('Error creando cliente:', error);
      toast.error('Error al crear cliente');
      return { success: false, error: error?.message };
    }
    toast.success('Cliente creado exitosamente');
    await loadClientes();
    return { success: true, data: data as Cliente };
  };
  
  // --- Documentos Disponibles ---
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
                ? 'Boleta'
                : d.tipo_dte) +
              ' Nº' +
              d.folio,
            total: d.total
          }))
        )
      }
    },
    [empresaId]
  );

  const selectDoc = (doc: { id: string; label: string; total: number }) => {
    setCarrito(prev => {
      if (prev.find(i => i.id === doc.id)) return prev;
      // Esto es un ejemplo, necesitarías una mejor forma de añadir un doc como item
      const pseudoProducto: Producto = { 
        id: doc.id,
        nombre: doc.label,
        precio: doc.total,
        quantity: 1, 
        empresa_id: empresaId || '',
        stock: 1, 
        activo: true,
        created_at: new Date().toISOString()
      };
      return [...prev, pseudoProducto as CartItem];
    });
  };

  // --- Venta ---
  const procesarVenta = async (
    metodoPago: string,
    tipoDte: 'boleta' | 'factura' | 'nota_credito',
    clienteId?: string
  ): Promise<ApiResult<Venta>> => {
    if (!cajaAbierta || !currentAperturaCaja) {
      toast.error('🔴 Error: La caja está cerrada. No se puede procesar la venta.');
      return { success: false, error: 'Caja cerrada' };
    }
    if (!user || !empresaId || !sucursalId || carrito.length === 0) {
      return { success: false, error: 'Datos incompletos para procesar la venta.' };
    }
    
    // Generación de folio: Considera un sistema más robusto para producción
    const folio = `${Date.now()}`; 
    const ventaData = {
      empresa_id: empresaId,
      sucursal_id: sucursalId,
      caja_id: currentAperturaCaja.caja_id,
      apertura_caja_id: currentAperturaCaja.id,
      cliente_id: clienteId || null,
      usuario_id: user.id,
      folio,
      tipo_dte: tipoDte,
      metodo_pago: metodoPago,
      subtotal: total,
      descuento: 0, 
      impuestos: 0, 
      total,
      estado: 'completada' as const,
      fecha: new Date().toISOString()
    };

    const { data: venta, error: err1 } = await supabase.from('ventas').insert([ventaData]).select().single();

    if (err1 || !venta) {
      console.error("Error al crear la venta:", err1);
      toast.error('Error al registrar la venta.');
      return { success: false, error: err1?.message };
    }

    const items: VentaItemInsert[] = carrito.map(i => ({
      venta_id: venta.id,
      producto_id: i.id,
      cantidad: i.quantity,
      precio_unitario: i.precio,
      subtotal: i.quantity * i.precio
    }));
    const { error: err2 } = await supabase.from('venta_items').insert(items);
    
    if (err2) {
      console.error("Error al insertar items de venta:", err2);
      await supabase.from('ventas').delete().eq('id', venta.id);
      toast.error('Error al registrar los productos de la venta. Venta anulada.');
      return { success: false, error: err2.message };
    }

    toast.success(`Venta #${folio} procesada.`);
    clearCart();
    return { success: true, data: venta as Venta };
  };

  // --- Gestión de Caja ---
  const checkCajaStatus = useCallback(async () => {
    if (!user) {
      setCajaAbierta(false);
      setCurrentAperturaCaja(null);
      return;
    }
    setLoading(true);
    // Modificación para asegurar que, si por error hay varias cajas abiertas,
    // se tome la más reciente para evitar el error PGRST116.
    const { data, error } = await supabase
        .from('aperturas_caja')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('estado', 'abierta')
        .order('fecha_apertura', { ascending: false }) 
        .limit(1); 

    if (error) {
        console.error("Error al verificar estado de la caja:", error);
        toast.error("No se pudo verificar el estado de la caja.");
        setCajaAbierta(false);
        setCurrentAperturaCaja(null);
    } else if (data && data.length > 0) { 
        setCajaAbierta(true);
        setCurrentAperturaCaja(data[0] as AperturaCaja); 
    } else {
        setCajaAbierta(false);
        setCurrentAperturaCaja(null);
    }
    setLoading(false);
  }, [user]);

  const openCaja = async (montoInicial: number, cajaId: string): Promise<boolean> => {
    if (!user) {
        toast.error('Usuario no autenticado.');
        return false;
    }
    if (cajaAbierta) {
      toast.error('Ya tienes una caja abierta.');
      return false;
    }
    setLoading(true);
    const { data, error } = await supabase
        .from('aperturas_caja')
        .insert({
            monto_inicial: montoInicial,
            usuario_id: user.id,
            caja_id: cajaId, 
            estado: 'abierta'
        })
        .select()
        .single();

    if (error || !data) {
        console.error("Error al abrir caja:", error);
        toast.error('No se pudo abrir la caja. Error: ' + error?.message);
        setLoading(false);
        return false;
    }
    
    toast.success(`Caja abierta con ${new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(montoInicial)}`);
    setCurrentAperturaCaja(data as AperturaCaja);
    setCajaAbierta(true);
    setLoading(false);
    return true;
  };

  const closeCaja = async (montoFinal: number, observaciones?: string): Promise<boolean> => {
    if (!currentAperturaCaja) {
        toast.error('No hay una caja abierta para cerrar.');
        return false;
    }
    setLoading(true);
    try {
        const aperturaId = currentAperturaCaja.id;

        // Obtener todas las ventas y movimientos de caja para esta apertura
        const [ventasRes, movRes] = await Promise.all([
            supabase.from('ventas').select('total, metodo_pago').eq('apertura_caja_id', aperturaId),
            supabase.from('movimientos_caja').select('monto, tipo').eq('apertura_caja_id', aperturaId)
        ]);
        if (ventasRes.error) throw ventasRes.error;
        if (movRes.error) throw movRes.error;

        // Calcular ventas en efectivo
        const totalVentasEfectivo = (ventasRes.data || [])
            .filter(v => v.metodo_pago.toLowerCase() === 'efectivo')
            .reduce((sum, v) => sum + v.total, 0);

        // Calcular ingresos y retiros de caja (excluyendo 'venta' si no se usa para efectivo directo)
        const totalIngresos = (movRes.data || [])
            .filter(m => m.tipo === 'ingreso')
            .reduce((sum, m) => sum + m.monto, 0);
        const totalRetiros = (movRes.data || [])
            .filter(m => m.tipo === 'retiro')
            .reduce((sum, m) => sum + m.monto, 0);

        // Monto teórico esperado en caja (solo efectivo)
        const montoTeorico = currentAperturaCaja.monto_inicial + totalVentasEfectivo + totalIngresos - totalRetiros;
        const diferencia = montoFinal - montoTeorico;

        const { error: updateError } = await supabase
            .from('aperturas_caja')
            .update({
                estado: 'cerrada',
                fecha_cierre: new Date().toISOString(),
                monto_final: montoFinal,
                diferencia,
                observaciones: observaciones || null
            })
            .eq('id', aperturaId);
        if (updateError) throw updateError;
        
        toast.success('✅ ¡Caja cerrada exitosamente!');
        setCajaAbierta(false);
        setCurrentAperturaCaja(null);
        setLoading(false);
        return true;
    } catch (error: any) {
        console.error('Error al cerrar la caja:', error);
        toast.error(error.message || 'Hubo un problema al cerrar la caja.');
        setLoading(false);
        return false;
    }
  };

  // --- Promociones ---
  const loadPromociones = useCallback(async () => {
    setPromociones([
      { id: 'p1', nombre: '10% OFF', tipo: 'descuento_porcentaje', valor: 10 },
      { id: 'p2', nombre: '2x1', tipo: '2x1', valor: null }
    ]);
  }, []);

  const aplicarPromocion = async (productoId: string, promocionId: string): Promise<boolean> => {
    toast.success('Promoción aplicada (simulado)');
    return true;
  };

  // --- Inicialización ---
  useEffect(() => {
    if (!user || !empresaId) return;
    setLoading(true);
    Promise.all([
      loadProductos(),
      loadBorradores(),
      loadClientes(),
      loadPromociones(),
      checkCajaStatus() 
    ]).finally(() => setLoading(false));
  }, [user, empresaId, loadProductos, loadBorradores, loadClientes, loadPromociones, checkCajaStatus]);
  
  // --- Proveedor ---
  const value: POSContextType = {
    productos, loading, loadProductos,
    carrito, total, addToCart, updateQuantity, removeFromCart, clearCart,
    borradores, loadBorradores, saveDraft, loadDraft, deleteDraft,
    clientes, currentCliente, loadClientes, selectClient, crearCliente,
    procesarVenta,
    cajaAbierta, currentAperturaCaja, checkCajaStatus, openCaja, closeCaja,
    promociones, loadPromociones, aplicarPromocion,
    docsDisponibles, loadDocsDisponibles, selectDoc,
  };

  return <POSContext.Provider value={value}>{children}</POSContext.Provider>;
};
