import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { AperturaCaja, Cliente, Producto, supabase, Venta } from "../lib/supabase";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";
import { SIIService } from "../lib/siiService";

export interface CartItem extends Producto {
  quantity: number;
  promocion_aplicada?: string;
}

export interface DraftSale {
  id: string;
  nombre: string;
  fecha: string;
  items: CartItem[];
  total: number;
}

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
    tipoDte: "boleta" | "factura" | "nota_credito",
    clienteId?: string,
    enviarSII?: boolean
  ) => Promise<ApiResult<Venta>>;

  // SII Integration
  generarDTE: (ventaId: string) => Promise<boolean>;
  enviarDTEAlSII: (documentoId: string) => Promise<boolean>;

  // Caja
  cajaAbierta: boolean;
  currentAperturaCaja: AperturaCaja | null;
  checkCajaStatus: () => Promise<void>;
  openCaja: (montoInicial: number,
    cajaId: string,
    empresaId: string,
    sucursalId: string,
    userId: string) => Promise<boolean>;
  closeCaja: (montoFinal: number, observaciones?: string) => Promise<boolean>;
  getDefaultCajaId: () => Promise<string | null>;

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
  if (!ctx) throw new Error("usePOS debe ser usado dentro de un POSProvider");
  return ctx;
};

export const POSProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user, empresaId, sucursalId } = useAuth();

  // --- Estados ---
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const [carrito, setCarrito] = useState<CartItem[]>([]);
  const total = carrito.reduce((sum, i) => sum + i.precio * i.quantity, 0);
  const [borradores, setBorradores] = useState<DraftSale[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [currentCliente, setCurrentCliente] = useState<Cliente | null>(null);
  const [promociones, setPromociones] = useState<any[]>([]);
  const [docsDisponibles, setDocsDisponibles] = useState<
    { id: string; label: string; total: number }[]
  >([]);

  // --- Estados de Caja ---
  const [cajaAbierta, setCajaAbierta] = useState(false);
  const [currentAperturaCaja, setCurrentAperturaCaja] =
    useState<AperturaCaja | null>(null);

  // Función para validar que los números no sean negativos
  const validatePositiveNumber = (value: number): number => {
    return Math.max(0, isNaN(Number(value)) ? 0 : Number(value));
  };

  // Función para formatear precios de manera consistente
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(validatePositiveNumber(price));
  };

  // --- Función para obtener caja por defecto ---
  const getDefaultCajaId = useCallback(async (): Promise<string | null> => {
    if (!sucursalId || !empresaId) return null;

    try {
      const { data, error } = await supabase
        .from("cajas")
        .select("id")
        .eq("sucursal_id", sucursalId)
        .eq("empresa_id", empresaId)
        .eq("activo", true)
        .limit(1)
        .single();

      if (error) {
        console.error("Error obteniendo caja por defecto:", error);
        return null;
      }

      return data?.id || null;
    } catch (error) {
      console.error("Error en getDefaultCajaId:", error);
      return null;
    }
  }, [sucursalId, empresaId]);

  // --- Productos ---
  const loadProductos = useCallback(async () => {
    if (!empresaId) return;
    setLoading(true);

    try {
      // Cargar productos desde Supabase
      const { data, error } = await supabase
        .from("productos")
        .select("*")
        .eq("empresa_id", empresaId)
        .eq("activo", true)
        .order("nombre", { ascending: true });

      if (error) {
        console.error("Error loading productos", error);
        toast.error("No se pudieron cargar productos");
        setProductos([]);
      } else {
        const productosConPreciosCorrectos = (data || []).map((p) => ({
          ...p,
          precio: validatePositiveNumber(p.precio),
          stock: validatePositiveNumber(p.stock || 0),
        }));
        setProductos(productosConPreciosCorrectos);
      }
    } catch (error) {
      console.error("Error en loadProductos:", error);
      setProductos([]);
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  // --- Carrito ---
  const addToCart = (producto: Producto) => {
    setCarrito((prev) => {
      const existingIndex = prev.findIndex((i) => i.id === producto.id);

      if (existingIndex >= 0) {
        // Si el producto ya existe, incrementar cantidad
        const newCarrito = [...prev];
        newCarrito[existingIndex] = {
          ...newCarrito[existingIndex],
          quantity: newCarrito[existingIndex].quantity + 1,
        };
        return newCarrito;
      }

      // Si es nuevo producto, agregarlo
      return [
        ...prev,
        {
          ...producto,
          quantity: 1,
          precio: Math.ceil(producto.precio),
        },
      ];
    });
  };

  const addToCartWithQuantity = (producto: Producto, quantity: number = 1) => {
    setCarrito((prev) => {
      const existingIndex = prev.findIndex((i) => i.id === producto.id);
      const validQuantity = Math.max(1, Math.floor(quantity));

      if (existingIndex >= 0) {
        // Si el producto ya existe, sumar la cantidad
        const newCarrito = [...prev];
        newCarrito[existingIndex] = {
          ...newCarrito[existingIndex],
          quantity: newCarrito[existingIndex].quantity + validQuantity,
        };
        return newCarrito;
      }

      // Si es nuevo producto, agregarlo con la cantidad especificada
      return [
        ...prev,
        {
          ...producto,
          quantity: validQuantity,
          precio: Math.ceil(producto.precio),
        },
      ];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    const validQuantity = Math.max(1, Math.floor(Number(quantity) || 1));
    if (validQuantity <= 0) {
      removeFromCart(productId);
    } else {
      setCarrito((prev) =>
        prev.map((i) =>
          i.id === productId ? { ...i, quantity: validQuantity } : i
        )
      );
    }
  };

  const removeFromCart = (productId: string) => {
    setCarrito((prev) => prev.filter((i) => i.id !== productId));
  };

  const clearCart = () => {
    setCarrito([]);
    setCurrentCliente(null);
  };

  // --- Borradores ---
  const loadBorradores = useCallback(async () => {
    if (!empresaId || !user) return;
    try {
      const { data, error } = await supabase
        .from("borradores_venta")
        .select("*")
        .eq("empresa_id", empresaId)
        .eq("usuario_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading drafts", error);
        setBorradores([]);
      } else {
        setBorradores(data as DraftSale[]);
      }
    } catch (error) {
      console.error("Error en loadBorradores:", error);
      setBorradores([]);
    }
  }, [empresaId, user]);

  const saveDraft = async (nombre: string): Promise<boolean> => {
    if (!empresaId || !user || carrito.length === 0) return false;
    try {
      const { error } = await supabase.from("borradores_venta").insert({
        empresa_id: empresaId,
        usuario_id: user.id,
        nombre,
        items: carrito,
        total,
        fecha: new Date().toISOString(),
      });

      if (error) {
        console.error("Error al guardar borrador:", error);
        toast.error("Error al guardar borrador: " + error.message);
        return false;
      }
      toast.success("Borrador guardado");
      await loadBorradores();
      return true;
    } catch (error) {
      console.error("Error en saveDraft:", error);
      toast.error("Error al guardar borrador");
      return false;
    }
  };

  const loadDraft = async (draftId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("borradores_venta")
        .select("*")
        .eq("id", draftId)
        .single();

      if (error || !data) {
        console.error("Error al cargar borrador:", error);
        toast.error("Error al cargar borrador: " + error?.message);
        return false;
      }
      setCarrito(data.items as CartItem[]);
      toast.success("Borrador cargado");
      return true;
    } catch (error) {
      console.error("Error en loadDraft:", error);
      toast.error("Error al cargar borrador");
      return false;
    }
  };

  const deleteDraft = async (draftId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("borradores_venta")
        .delete()
        .eq("id", draftId);

      if (error) {
        console.error("Error al eliminar borrador:", error);
        toast.error("Error al eliminar borrador: " + error.message);
        return false;
      }
      toast.success("Borrador eliminado");
      await loadBorradores();
      return true;
    } catch (error) {
      console.error("Error en deleteDraft:", error);
      toast.error("Error al eliminar borrador");
      return false;
    }
  };

  // --- Clientes ---
  const loadClientes = useCallback(async () => {
    if (!empresaId) return;
    try {
      // Cargar clientes desde Supabase
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .eq("empresa_id", empresaId)
        .order("razon_social", { ascending: true });

      if (error) {
        console.error("Error loading clients", error);
        setClientes([]);
      } else {
        setClientes(data || []);
      }
    } catch (error) {
      console.error("Error en loadClientes:", error);
      setClientes([]);
    }
  }, [empresaId]);

  const selectClient = (cliente: Cliente | null) => {
    setCurrentCliente(cliente);
    if (cliente) {
      toast.success(
        `Cliente ${cliente.razon_social || cliente.nombre + " " + cliente.apellidos
        } seleccionado`
      );
    } else {
      toast.info("Cliente deseleccionado");
    }
  };

  const crearCliente = async (
    clienteData: Partial<Cliente>
  ): Promise<ApiResult<Cliente>> => {
    if (!empresaId) return { success: false, error: "Empresa no definida" };
    try {
      const { data, error } = await supabase
        .from("clientes")
        .insert([{ empresa_id: empresaId, ...clienteData }])
        .select()
        .single();

      if (error || !data) {
        console.error("Error creando cliente:", error);
        toast.error("Error al crear cliente");
        return { success: false, error: error?.message };
      }
      toast.success("Cliente creado exitosamente");
      await loadClientes();
      return { success: true, data: data as Cliente };
    } catch (error: any) {
      console.error("Error en crearCliente:", error);
      toast.error("Error al crear cliente");
      return { success: false, error: error.message };
    }
  };

  // --- Documentos Disponibles ---
  const loadDocsDisponibles = useCallback(
    async (folio: string) => {
      if (!empresaId) return;
      try {
        const { data, error } = await supabase
          .from("ventas")
          .select("id, folio, tipo_dte, total")
          .ilike("folio", `%${folio}%`)
          .eq("empresa_id", empresaId)
          .order("fecha", { ascending: false })
          .limit(10);

        if (error) {
          console.error("Error loading docsDisponibles", error);
          setDocsDisponibles([]);
        } else {
          setDocsDisponibles(
            (data || []).map((d: any) => ({
              id: d.id,
              label:
                (d.tipo_dte === "boleta" ? "Boleta" : d.tipo_dte) +
                " Nº" +
                d.folio,
              total: d.total,
            }))
          );
        }
      } catch (error) {
        console.error("Error en loadDocsDisponibles:", error);
        setDocsDisponibles([]);
      }
    },
    [empresaId]
  );

  const selectDoc = (doc: { id: string; label: string; total: number }) => {
    setCarrito((prev) => {
      if (prev.find((i) => i.id === doc.id)) return prev;
      // Esto es un ejemplo, necesitarías una mejor forma de añadir un doc como item
      const pseudoProducto: Producto = {
        id: doc.id,
        nombre: doc.label,
        precio: doc.total,
        empresa_id: empresaId || "",
        stock: 1,
        activo: true,
        created_at: new Date().toISOString(),
        costo: 0,
        descripcion: "",
        sku: "",
        codigo_barras: "",
      };
      return [...prev, { ...pseudoProducto, quantity: 1 } as CartItem];
    });
  };

  // --- Venta ---
  const procesarVenta = async (
    metodoPago: string,
    tipoDte: "boleta" | "factura" | "nota_credito",
    clienteId?: string,
    enviarSII: boolean = false
  ): Promise<ApiResult<Venta>> => {
    if (!cajaAbierta || !currentAperturaCaja) {
      toast.error(
        "🔴 Error: La caja está cerrada. No se puede procesar la venta."
      );
      return { success: false, error: "Caja cerrada" };
    }
    if (!user || !empresaId || !sucursalId || carrito.length === 0) {
      return {
        success: false,
        error: "Datos incompletos para procesar la venta.",
      };
    }

    // Validar cliente para factura
    if (tipoDte === "factura" && !clienteId) {
      return {
        success: false,
        error: "Debe seleccionar un cliente para factura electrónica",
      };
    }

    try {
      // Generar folio local
      const timestamp = Date.now();
      let folio: string;

      // Generar folio según tipo de documento
      if (tipoDte === "boleta") {
        folio = `${timestamp}`;
      } else if (tipoDte === "boleta_manual") {
        folio = `BM${timestamp}`;
      } else if (tipoDte === "factura") {
        folio = `F${timestamp}`;
      } else {
        folio = `V${timestamp}`;
      }

      // Insertar la venta directamente
      const { data: venta, error } = await supabase
        .from("ventas")
        .insert({
          empresa_id: empresaId,
          sucursal_id: sucursalId,
          caja_id: currentAperturaCaja.caja_id,
          apertura_caja_id: currentAperturaCaja.id,
          cliente_id: clienteId || null,
          usuario_id: user.id,
          folio: folio,
          tipo_dte: tipoDte,
          metodo_pago: metodoPago,
          subtotal: total,
          total: total,
          estado: "completada",
        })
        .select()
        .single();

      if (error || !venta) {
        console.error("Error al crear la venta:", error);
        return {
          success: false,
          error: "Error al registrar la venta en la base de datos",
        };
      }

      // Insertar los items de la venta
      const ventaItems = carrito.map((item) => ({
        venta_id: venta.id,
        producto_id: item.id,
        cantidad: item.quantity,
        precio_unitario: item.precio,
        subtotal: item.precio * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("venta_items")
        .insert(ventaItems);

      if (itemsError) {
        console.error("Error al insertar items de venta:", itemsError);
        toast.error("Error al registrar los productos de la venta.");
        return { success: false, error: itemsError?.message };
      }

      // Si el método de pago es efectivo, registrar el movimiento de caja
      if (metodoPago.toLowerCase() === "efectivo") {
        const { error: movError } = await supabase
          .from("movimientos_caja")
          .insert({
            apertura_caja_id: currentAperturaCaja.id,
            usuario_id: user.id,
            tipo: "venta",
            monto: total,
            observacion: `Venta ${venta.folio}`,
          });

        if (movError) {
          console.error("Error al registrar movimiento de caja:", movError);
          // No fallamos la venta por esto, solo registramos el error
        }
      }

      toast.success(`Venta #${venta.folio} procesada.`);
      clearCart();
      return { success: true, data: venta as Venta };
    } catch (error: any) {
      console.error("Error en procesarVenta:", error);
      toast.error("Error al procesar la venta");
      return { success: false, error: error.message };
    }
  };

  // --- Gestión de Caja ---
  const checkCajaStatus = useCallback(async () => {
    if (!user) {
      setCajaAbierta(false);
      setCurrentAperturaCaja(null);
      return;
    }

    try {
      setLoading(true);
      // Modificación para asegurar que, si por error hay varias cajas abiertas,
      // se tome la más reciente para evitar el error PGRST116.

      const { data, error } = await supabase
        .from("sesiones_caja")
        .select("*")
        .eq("usuario_id", user.id)
        .eq("estado", "abierta")
        .order("abierta_en", { ascending: false })
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
    } catch (error) {
      console.error("Error en checkCajaStatus:", error);
      setCajaAbierta(false);
      setCurrentAperturaCaja(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const openCaja = async (
    montoInicial: number,
    cajaId: string,
    empresaId: string,
    sucursalId: string,
    userId: string
  ): Promise<boolean> => {
    if (!empresaId) {
      toast.error("Empresa no definida.");
      return false;
    }
    if (!cajaId) {
      toast.error("Caja no seleccionada.");
      return false;
    }
    // if (!sucursalId) {
    //   toast.error("Sucursal no seleccionada.");
    //   return false;
    // }
    if (cajaAbierta) {
      toast.error("Ya tienes una caja abierta.");
      return false;
    }

    try {
      setLoading(true);

      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from("sesiones_caja")
        .insert({
          caja_id: cajaId,
          usuario_id: userId,
          // empresa_id: empresaId,
          sucursal_id: sucursalId,
          saldo_inicial: montoInicial,
          estado: "abierta",
          abierta_en: now,
          creada_en: now,
          actualizada_en: now,
        })
        .select()
        .single();

      if (error || !data) {
        console.error("Error al abrir caja:", error);
        toast.error("No se pudo abrir la caja. Error: " + error?.message);
        return false;
      }

      toast.success(
        `Caja abierta con ${new Intl.NumberFormat("es-CL", {
          style: "currency",
          currency: "CLP",
        }).format(montoInicial)}`
      );
      setCurrentAperturaCaja(data as AperturaCaja);
      setCajaAbierta(true);
      return true;
    } catch (error: any) {
      console.error("Error en openCaja:", error);
      toast.error("Error al abrir la caja: " + error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const closeCaja = async (
    montoFinal: number,
    observaciones?: string
  ): Promise<boolean> => {
    if (!currentAperturaCaja || !currentAperturaCaja.id) {
      toast.error("No hay una caja abierta para cerrar.");
      return false;
    }

    try {
      setLoading(true);
      const aperturaId = currentAperturaCaja.id;

      // Obtener todas las ventas y movimientos de caja para esta apertura
      const [ventasRes, movRes] = await Promise.all([
        supabase
          .from("ventas")
          .select("total, metodo_pago")
          .eq("sesiones_caja_id", aperturaId),
        supabase
          .from("movimientos_caja")
          .select("monto, tipo")
          .eq("sesiones_caja_id", aperturaId),
      ]);
      if (ventasRes.error) throw ventasRes.error;
      if (movRes.error) throw movRes.error;

      // Calcular ventas en efectivo
      const totalVentasEfectivo = (ventasRes.data || [])
        .filter((v) => v.metodo_pago.toLowerCase() === "efectivo")
        .reduce((sum, v) => sum + v.total, 0);

      // Calcular ingresos y retiros de caja (excluyendo 'venta' si no se usa para efectivo directo)
      const totalIngresos = (movRes.data || [])
        .filter((m) => m.tipo === "ingreso")
        .reduce((sum, m) => sum + m.monto, 0);
      const totalRetiros = (movRes.data || [])
        .filter((m) => m.tipo === "retiro")
        .reduce((sum, m) => sum + m.monto, 0);

      // Monto teórico esperado en caja (solo efectivo)
      const montoTeorico =
        currentAperturaCaja.monto_inicial +
        totalVentasEfectivo +
        totalIngresos -
        totalRetiros;
      const diferencia_cierre = montoFinal - montoTeorico;

      const { error: sesionesError } = await supabase
        .from("sesiones_caja")
        .update({
          estado: "cerrada",
          saldo_final: montoFinal,
          monto_efectivo: totalVentasEfectivo,
          monto_tarjeta: 0, // aquí podrías calcularlo también si lo necesitas
          monto_transferencia: 0,
          monto_otros: 0,
          observaciones: observaciones || null,
          cerrada_en: new Date().toISOString(),
          cerrada_por: user?.id || null,
        })
        .eq("id", aperturaId);

      if (sesionesError) throw sesionesError;

      toast.success("✅ ¡Caja cerrada exitosamente!");
      setCajaAbierta(false);
      setCurrentAperturaCaja(null);
      return true;
    } catch (error: any) {
      console.error("Error al cerrar la caja:", error);
      toast.error(error.message || "Hubo un problema al cerrar la caja.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // --- Promociones ---
  const loadPromociones = useCallback(async () => {
    if (!empresaId) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("promociones")
        .select("*")
        .eq("empresa_id", empresaId)
        .eq("activo", true)
        .order("nombre", { ascending: true });

      if (error) {
        console.error("Error loading promociones", error);
        setPromociones([]);
      } else {
        setPromociones(data || []);
      }
    } catch (error) {
      console.error("Error en loadPromociones:", error);
      setPromociones([]);
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  const aplicarPromocion = async (
    productoId: string,
    promocionId: string
  ): Promise<boolean> => {
    try {
      // Buscar el producto en el carrito
      const productoIndex = carrito.findIndex((item) => item.id === productoId);
      if (productoIndex === -1) {
        // Buscar el producto en la lista de productos
        const producto = productos.find((p) => p.id === productoId);
        if (!producto) {
          toast.error("Producto no encontrado");
          return false;
        }
        // Añadir el producto al carrito
        addToCart(producto);
      }

      // Buscar la promoción
      const promocion = promociones.find((p) => p.id === promocionId);
      if (!promocion) {
        toast.error("Promoción no encontrada");
        return false;
      }

      // Aplicar la promoción según su tipo
      const newCarrito = [...carrito];
      const itemIndex = newCarrito.findIndex((item) => item.id === productoId);

      if (itemIndex !== -1) {
        const item = newCarrito[itemIndex];

        switch (promocion.tipo) {
          case "descuento_porcentaje":
            // Aplicar descuento porcentual al precio
            const descuentoPorcentaje = promocion.valor || 0;
            const nuevoPrecio = item.precio * (1 - descuentoPorcentaje / 100);
            newCarrito[itemIndex] = {
              ...item,
              precio: nuevoPrecio,
              promocion_aplicada: `${promocion.nombre} (${descuentoPorcentaje}%)`,
            };
            break;

          case "descuento_monto":
            // Aplicar descuento de monto fijo
            const descuentoMonto = promocion.valor || 0;
            const precioConDescuento = Math.max(
              0,
              item.precio - descuentoMonto
            );
            newCarrito[itemIndex] = {
              ...item,
              precio: precioConDescuento,
              promocion_aplicada: `${promocion.nombre} ($${descuentoMonto})`,
            };
            break;

          case "2x1":
            // Aplicar promoción 2x1
            if (item.quantity === 1) {
              newCarrito[itemIndex] = {
                ...item,
                quantity: 2,
                promocion_aplicada: promocion.nombre,
              };
            } else {
              // Si ya hay más de 1, añadir uno gratis
              newCarrito[itemIndex] = {
                ...item,
                quantity: item.quantity + 1,
                promocion_aplicada: promocion.nombre,
              };
            }
            break;

          case "3x2":
            // Aplicar promoción 3x2
            if (item.quantity === 2) {
              newCarrito[itemIndex] = {
                ...item,
                quantity: 3,
                promocion_aplicada: promocion.nombre,
              };
            } else if (item.quantity >= 3) {
              // Si ya hay 3 o más, añadir uno gratis por cada 2
              const extraItems = Math.floor(item.quantity / 2);
              newCarrito[itemIndex] = {
                ...item,
                quantity: item.quantity + extraItems,
                promocion_aplicada: promocion.nombre,
              };
            } else {
              // Si hay menos de 2, simplemente incrementar
              newCarrito[itemIndex] = {
                ...item,
                quantity: item.quantity + 1,
                promocion_aplicada: promocion.nombre,
              };
            }
            break;

          default:
            toast.error("Tipo de promoción no soportado");
            return false;
        }

        setCarrito(newCarrito);
        toast.success(`Promoción "${promocion.nombre}" aplicada correctamente`);
        return true;
      }

      toast.error("No se pudo aplicar la promoción");
      return false;
    } catch (error) {
      console.error("Error al aplicar promoción:", error);
      toast.error("Error al aplicar promoción");
      return false;
    }
  };

  // --- SII Integration ---
  const generarDTE = async (ventaId: string): Promise<boolean> => {
    if (!empresaId) return false;

    try {
      // Buscar cupón en promociones cargadas
      await siiService.loadConfig(empresaId);

      const xml = await siiService.generarDTE({
        ventaId,
        tipoDocumento: 39, // Boleta por defecto
        items: [],
        montoNeto: 0,
        montoIva: 0,
        montoTotal: 0,
      });

      toast.success("DTE generado correctamente");
      return true;
    } catch (error) {
      console.error("Error generando DTE:", error);
      toast.error("Error al generar DTE");
      return false;
    }
  };

  const enviarDTEAlSII = async (documentoId: string): Promise<boolean> => {
    try {
      const siiService = SIIService.getInstance();
      const success = await siiService.enviarDTE(documentoId);

      if (success) {
        toast.success(`Cupón aplicado: ${cuponEncontrado.nombre}`);
      } else {
        toast.error("Error al enviar DTE al SII");
      }

      return success;
    } catch (error) {
      console.error("Error enviando DTE al SII:", error);
      toast.error("Error al enviar DTE al SII");
      return false;
    }
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
      checkCajaStatus(),
    ]).finally(() => setLoading(false));
  }, [
    user,
    empresaId,
    loadProductos,
    loadBorradores,
    loadClientes,
    loadPromociones,
    checkCajaStatus,
  ]);

  // --- Proveedor ---
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
    currentAperturaCaja,
    checkCajaStatus,
    openCaja,
    closeCaja,
    getDefaultCajaId,
    promociones,
    loadPromociones,
    aplicarPromocion,
    docsDisponibles,
    loadDocsDisponibles,
    selectDoc,
    generarDTE,
    enviarDTEAlSII,
  };

  return <POSContext.Provider value={value}>{children}</POSContext.Provider>;
};
