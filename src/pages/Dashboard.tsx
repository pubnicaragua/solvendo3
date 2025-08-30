import React, { useState, useEffect, useCallback } from "react";
import { usePOS } from "../contexts/POSContext";
import { useAuth } from "../contexts/AuthContext";
import {
  Search,
  Star,
  FileText,
  Gift,
  User,
  Plus,
  Minus,
  X as XIcon,
  Percent,
  DollarSign,
  CreditCard,
  Truck,
  Package,
} from "lucide-react";
import toast from "react-hot-toast";
import ProductHighlights from "../components/pos/ProductHighlights";
import DraftsPanel from "../components/pos/DraftsPanel";
import ProductsPanel from "../components/pos/ProductsPanel";
import ClientsPanel from "../components/pos/ClientsPanel";
import { ReceiptModal } from "../components/pos/ReceiptModal";
import { DraftSaveModal } from "../components/pos/DraftSaveModal";
import { supabase } from "../lib/supabase";
import { HeaderWithMenu } from "../components/common/HeaderWithMenu";
import { Promocion } from "../lib/supabase";
import AbrirCajaModal from "../components/pos/AbrirCajaModal";
import SearchBarClientes from "../components/pos/SearchBarClientes";
import { LoginForm } from "../components/auth/LoginForm";
import AsignarSaldoInicialModal from "../components/pos/AsignarSaldoModal";
import { useUserPermissions } from "../hooks/usePermissions";

export type TabId = "destacado" | "borradores" | "productos" | "clientes";
const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  {
    id: "destacado" as TabId,
    label: "Destacado",
    icon: <Star className="w-5 h-5" />,
  },
  {
    id: "borradores" as TabId,
    label: "Borradores",
    icon: <FileText className="w-5 h-5" />,
  },
  {
    id: "promociones" as TabId,
    label: "Promociones",
    icon: <Percent className="w-5 h-5" />,
  },
  {
    id: "productos" as TabId,
    label: "Productos",
    icon: <Gift className="w-5 h-5" />,
  },
  {
    id: "clientes" as TabId,
    label: "Clientes",
    icon: <User className="w-5 h-5" />,
  },
];

const Dashboard: React.FC = () => {
  // toggleSidebar y user se obtienen de sus respectivos contextos y se pasan a HeaderWithMenu
  const { user, empresaId, authorized, authorize } = useAuth();

  const [isCreating, setIsCreating] = useState(false);

  const {
    productos,
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
    promociones,
    loadPromociones,
    loadClientes,
    procesarVenta,
    loadProductos,
    clientes,
    currentCliente,
    currentAperturaCaja,
    selectClient,
    cajaLoading,
  } = usePOS();

  const { hasPermission, PERMISOS } = useUserPermissions();

  // Alias for selectClient to avoid naming conflicts
  const handleSelectClient = selectClient;

  const [activeTab, setActiveTab] = useState<TabId>("destacado");
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);

  // Estados del panel de pago
  const [selectedMethod, setSelectedMethod] = useState<string>("efectivo");
  const [selectedDte, setSelectedDte] = useState<string>("boleta");
  const [montoRecibido, setMontoRecibido] = useState<number>(0);
  const [cardType, setCardType] = useState<"Credito" | "Debito" | null>(null)
  // Estados para opciones de entrega
  const [tipoEntrega, setTipoEntrega] = useState<
    "inmediata" | "despacho" | null
  >(null);
  const [cupon, setCupon] = useState(false);
  const [userEmpresa, setUserEmpresa] = useState({})

  // Estados para búsquedas
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [clientSearchTermMain, setClientSearchTermMain] = useState("");

  // Estados para descuentos y cupones
  const [descuentosEnabled, setDescuentosEnabled] = useState<boolean>(false);
  const [descuentoPorcentaje, setDescuentoPorcentaje] = useState<string>("");
  const [cuponCodigo, setCuponCodigo] = useState<string>("");
  const [cuponDescuento, setCuponDescuento] = useState<number>(0);
  const [cuponValido, setCuponValido] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        await Promise.all([
          loadClientes(),
          loadProductos(),
          loadBorradores(),
          loadPromociones(),
          loadEmpresa()
        ]);
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    fetchInitialData();
  }, [loadClientes, loadProductos, loadBorradores, loadPromociones]);

  const loadEmpresa = useCallback(async () => {
    if (!empresaId) return // si no hay empresaId no hace nada

    const { data: empresa, error } = await supabase
      .from("empresas")
      .select("*")
      .eq("id", empresaId)
      .single()

    if (error) {
      toast.error("Error al obtener los datos de la empresa")
      return
    }

    console.log(empresa)

    setUserEmpresa(empresa)
  }, [empresaId])


  const handleCreateClient = () => {
    setShowPaymentModal(false);
    setActiveTab("clientes");
    return;
  };

  // Handle client selection from dropdown
  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clienteId = e.target.value;

    handleCreateClient();

    if (clienteId) {
      const cliente = clientes.find((c) => c.id === clienteId);
      if (cliente) {
        handleSelectClient(cliente);
      }
    } else {
      handleSelectClient(null);
    }
  };

  // Calcular monto de descuento (sin redondear)
  let montoDescuento = 0;

  // Aplicar descuento porcentual si está habilitado
  if (descuentosEnabled && descuentoPorcentaje) {
    montoDescuento = total * (parseFloat(descuentoPorcentaje) / 100);
  }

  // Aplicar descuento por cupón si es válido (se suma al descuento porcentual si existe)
  if (cuponValido && cuponDescuento > 0) {
    montoDescuento += cuponDescuento;
  }

  // Calcular total con descuento (sin redondear)
  const totalConDescuento = Math.max(0, total - montoDescuento);

  // Redondear SOLO para pago en efectivo (a múltiplo de 10 más cercano)
  const totalAPagar =
    selectedMethod === "efectivo"
      ? Math.round(totalConDescuento / 10) * 10
      : totalConDescuento;

  // Calcular vuelto solo para pago en efectivo
  const montoRecibidoNum = Number(montoRecibido) || 0;
  const vuelto =
    selectedMethod === "efectivo"
      ? Math.max(0, montoRecibidoNum - totalAPagar)
      : 0;

  useEffect(() => {
    clearCart();
    loadBorradores();
    loadPromociones();
    loadClientes();
    loadProductos();
  }, [loadBorradores, loadPromociones, loadClientes, loadProductos]);

  const fmt = (n: number, showDecimals: boolean = false) =>
    new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: showDecimals ? 1 : 0,
      maximumFractionDigits: showDecimals ? 1 : 0,
    }).format(Math.max(0, Number(n) || 0));

  const handleSaveDraft = async () => {
    if (!draftName.trim() || carrito.length === 0) return;
    setShowDraftModal(false);
    const success = await saveDraft(draftName);
    if (success) {
      toast.success("Borrador guardado");
      setDraftName("");
      loadBorradores();
    }
  };
  const handleLoadDraft = async (id: string) => {
    const success = await loadDraft(id);
    if (success) {
      toast.success("Borrador cargado");
    }
    setActiveTab("destacado");
  };
  const handleDeleteDraft = async (id: string) => {
    if (confirm("¿Eliminar borrador?")) {
      const success = await deleteDraft(id);
      if (success) {
        toast.success("Borrador eliminado");
        loadBorradores();
      }
    }
  };

  const handlePaymentComplete = async () => {
    if (carrito.length === 0) {
      toast.error("No hay productos en el carrito");
      return;
    }

    // Validar cliente para factura electrónica
    if (selectedDte === "factura" && !currentCliente) {
      toast.error("Debe seleccionar un cliente para factura electrónica");
      return;
    }

    if (tipoEntrega === "despacho" && !currentCliente) {
      toast.error("Debe seleccionar un cliente para factura electrónica");
      return;
    }

    // Validar monto recibido para efectivo
    if (selectedMethod === "efectivo" && montoRecibido < totalAPagar) {
      toast.error("El monto recibido debe ser mayor o igual al total");
      return;
    }

    if (selectedMethod === "tarjeta" && cardType === null) {
      toast.error("Se necesita saber el tipo de tarjeta")
      return
    }

    if (!hasPermission(PERMISOS.RealizarVentas)) {
      toast.error("No cuentas con permisos para realizar ventas");
      return;
    }
    setLoading(true);

    try {
      // Primero verificar stock
      const stockErrors = [];
      for (const item of carrito) {
        const producto = productos.find((p) => p.id === item.id);
        if (producto && producto.stock < item.quantity) {
          stockErrors.push({
            producto: producto.nombre,
            stockDisponible: producto.stock,
          });
        }
      }

      if (stockErrors.length > 0) {
        let errorMessage = "Stock insuficiente para:\n";
        stockErrors.forEach((error) => {
          errorMessage += `- ${error.producto} (Disponible: ${error.stockDisponible})\n`;
        });
        toast.error(errorMessage, {
          duration: 5000,
          style: { whiteSpace: "pre-line" },
        });
        return;
      }

      // Si pasa la validación de stock, procesar la venta
      const result = await procesarVenta(
        selectedMethod,
        selectedDte as "boleta" | "factura" | "nota_credito",
        cardType,
        currentCliente?.id,
      );

      if (result.success) {
        setShowPaymentModal(false);
        setShowPrintDialog(true);
      } else {
        // Manejar otros errores
        let errorMessage = "Error al procesar la venta";
        if (result.error) {
          if (result.error.includes("caja")) {
            errorMessage =
              "La caja está cerrada. Debe abrir la caja para procesar ventas.";
          } else if (result.error.includes("cliente")) {
            errorMessage =
              "Debe seleccionar un cliente válido para este tipo de documento.";
          } else {
            errorMessage = result.error;
          }
        }
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Error inesperado al procesar el pago. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = () => {
    try {
      if (!currentCliente && selectedDte === "factura") {
        throw new Error("Cliente requerido para factura");
      }
      const pdfContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Boleta Solvendo</title>
  <style>
    @page { margin: 0; size: 80mm auto; }
    body { 
      font-family: 'Courier New', monospace; 
      margin: 0; 
      padding: 10mm; 
      font-size: 12px;
      line-height: 1.4;
      width: 80mm;
      box-sizing: border-box;
    }
    .receipt { width: 100%; }
    .header { 
      text-align: center; 
      margin-bottom: 15px; 
      border-bottom: 1px dashed #000; 
      padding-bottom: 15px; 
    }
    .company { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
    .info { margin-bottom: 3px; font-size: 10px; }
    .document-type { 
      font-size: 14px; 
      font-weight: bold; 
      margin: 10px 0; 
      text-align: center;
      background: #f0f0f0;
      padding: 5px;
      border: 1px solid #000;
    }
    .totales { 
      margin-top: 15px; 
      border-top: 2px solid #000;
      padding-top: 10px;
      background: #f5f5f5;
      padding: 10px;
    }
    .total-line { 
      display: flex; 
      justify-content: space-between; 
      margin-bottom: 5px; 
      font-size: 11px;
    }
    .grand-total { 
      font-size: 16px; 
      font-weight: bold; 
      border-top: 2px solid #000; 
      padding-top: 8px; 
      margin-top: 8px; 
      background: #000;
      color: #fff;
      padding: 8px;
    }
    .footer { 
      margin-top: 20px; 
      text-align: center; 
      font-size: 9px; 
      border-top: 1px dashed #000;
      padding-top: 10px;
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <div class="company">${userEmpresa?.razon_social || ""}</div>
      <div class="info">${userEmpresa?.giro || ""}</div>
      <div class="info">RUT: ${userEmpresa?.rut || ""}</div>
      <div class="info">${userEmpresa?.direccion + "," || ""} ${userEmpresa?.comuna | ""}</div>
      <div class="info">${userEmpresa?.telefono || ""}</div>
    </div>
    
    <div class="document-type">${selectedDte.toUpperCase()}</div>
    <div class="info"><strong>Folio:</strong> V${Date.now()}</div>
    <div class="info"><strong>Fecha:</strong> ${new Date().toLocaleDateString(
        "es-CL"
      )}</div>
    <div class="info"><strong>Hora:</strong> ${new Date().toLocaleTimeString(
        "es-CL"
      )}</div>
    <div class="info"><strong>Cajero:</strong> ${user?.nombre || "Usuario"
        }</div>
    <div class="info"><strong>Cliente:</strong> ${currentCliente?.razon_social || "Consumidor Final"
        }</div>
    <div class="info"><strong>RUT:</strong> ${currentCliente?.rut || "66.666.666-6"
        }</div>
    <div class="info"><strong>Método:</strong> ${selectedMethod}</div>
    
    <div style="border-top: 1px dashed #000; margin: 15px 0; padding-top: 10px;">
      <div style="font-weight: bold; margin-bottom: 10px;">PRODUCTOS:</div>
      ${carrito
          .map(
            (item) => `
        <div style="margin: 5px 0; display: flex; justify-content: space-between;">
          <span>${item.nombre} x${item.quantity}</span>
          <span>${fmt(item.precio * item.quantity)}</span>
        </div>
      `
          )
          .join("")}
    </div>
    
    <div class="totales">
      <div class="total-line">
        <span>Total a pagar:</span>
        <span>${fmt(
            selectedMethod === "efectivo"
              ? Math.round(totalConDescuento / 10) * 10
              : totalConDescuento
          )}</span>
      </div>
      <div class="total-line" style="margin-top: 10px; border-top: 1px dashed #ddd; padding-top: 5px;">
        <span>Subtotal:</span>
        <span>${fmt(total)}</span>
      </div>
      ${descuentosEnabled && parseFloat(descuentoPorcentaje) > 0
          ? `
        <div class="total-line" style="color: red;">
          <span>Descuento (${descuentoPorcentaje}%):</span>
          <span>-${fmt(
            total * (parseFloat(descuentoPorcentaje) / 100),
            true
          )}</span>
        </div>
      `
          : ""
        }
      ${cuponValido && cuponDescuento > 0
          ? `
        <div class="total-line" style="color: red;">
          <span>Descuento por cupón:</span>
          <span>-${fmt(cuponDescuento, true)}</span>
        </div>
      `
          : ""
        }
      ${selectedMethod === "efectivo"
          ? `
        <div class="total-line">
          <span>Monto recibido:</span>
          <span>${fmt(montoRecibido)}</span>
        </div>
        <div class="total-line" style="font-weight: bold; border-top: 1px dashed #ddd; padding-top: 5px;">
          <span>Vuelto:</span>
          <span>${fmt(vuelto)}</span>
        </div>
      `
          : ""
        }
    </div>
    
    <div class="footer">
      <p>¡Gracias por su compra!</p>
      <p>Powered by Solvendo</p>
    </div>
  </div>
</body>
</html>`;

      // Create blob and download link for PDF
      const blob = new Blob([pdfContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);

      // Create download link
      const downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = `boleta_${Date.now()}.html`;
      downloadLink.style.display = "none";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);

      // Open print window
      const printWindow = window.open("", "_blank", "width=400,height=600");
      if (printWindow) {
        printWindow.document.write(
          pdfContent +
          `
          <script>
            window.onload = function() { 
              window.print(); 
              setTimeout(function() { window.close(); }, 1000); 
            }
          </script>
        `
        );
        printWindow.document.close();
      }
    } catch (error) {
      console.error("Error al imprimir:", error);
      toast.error("Error al generar el documento");
    }

    // Limpiar carrito y cerrar modal
    clearCart();
    setShowPaymentModal(false);
    setShowPrintDialog(false);
    setActiveTab("destacado");
  };

  const handleReceiptClose = () => {
    setShowReceipt(false);
    clearCart();
    setActiveTab("destacado");
  };

  // Solo mostrar productos si hay término de búsqueda
  const shouldShowProducts = productSearchTerm.length > 0;

  // El cálculo de totalConDescuento y vuelto se maneja en la parte superior del componente
  // Esta sección duplicada se elimina para evitar errores

  // Validar cupón
  const validarCupon = async (codigo: string) => {
    if (!codigo.trim()) {
      setCuponValido(false);
      setCuponDescuento(0);
      return;
    }

    try {
      // Buscar cupón en promociones
      const cuponEncontrado = promociones.find(
        (p) => p.nombre.toLowerCase().includes(codigo.toLowerCase()) && p.activo
      );

      if (cuponEncontrado) {
        let descuento = 0;
        if (cuponEncontrado.tipo === "descuento_monto") {
          descuento = cuponEncontrado.valor || 0;
        } else if (cuponEncontrado.tipo === "descuento_porcentaje") {
          descuento = total * ((cuponEncontrado.valor || 0) / 100);
        }

        setCuponValido(true);
        setCuponDescuento(descuento);
        toast.success(
          `Cupón aplicado: ${cuponEncontrado.nombre} - $${descuento} de descuento`
        );
      } else {
        setCuponValido(false);
        setCuponDescuento(0);
        toast.error("Cupón no válido");
      }
    } catch (error) {
      setCuponValido(false);
      setCuponDescuento(0);
      toast.error("Error al validar cupón");
    }
  };

  // Buscar clientes
  const buscarClientes = (termino: string) => {
    if (!termino.trim()) return [];

    return clientes.filter(
      (cliente) =>
        cliente.razon_social.toLowerCase().includes(termino.toLowerCase()) ||
        cliente.rut?.toLowerCase().includes(termino.toLowerCase())
    );
  };

  // Función para manejar búsqueda de clientes
  const handleClientSearch = (termino: string) => {
    setClientSearchTermMain(termino);

    if (!termino.trim()) {
      selectClient(null);
      return;
    }

    const clientesEncontrados = buscarClientes(termino);
    if (clientesEncontrados.length === 1) {
      selectClient(clientesEncontrados[0]);
    } else if (clientesEncontrados.length === 0) {
      selectClient(null);
    } else {
      selectClient(null);
    }
  };

  const pick = (c: any) => {
    selectClient(c);
    setClientSearchTermMain(c ? c.razon_social : "");
  };

  const cargarProductosEnPromocion = async (
    promocionId: string
  ): Promise<boolean> => {
    try {
      // Limpiar carrito
      clearCart();
      const { data: promocion, error: promoError } = await supabase
        .from("promociones")
        .select("productos_id, precio_prom")
        .eq("id", promocionId.id)
        .eq("empresa_id", empresaId)
        .eq("activo", true)
        .single();

      if (promoError || !promocion) {
        toast.error("Promoción no encontrada");
        return false;
      }

      // Si productos_id es un array de IDs
      const productosIds = Array.isArray(promocion.productos_id)
        ? promocion.productos_id
        : [promocion.productos_id];

      // Cargar productos
      const { data: productosPromo, error: prodError } = await supabase
        .from("productos")
        .select("*")
        .in("id", productosIds)
        .eq("empresa_id", empresaId)
        .eq("activo", true);

      if (prodError || !productosPromo) {
        toast.error("Error al cargar productos en promoción");
        return false;
      }

      // Agregar productos al carrito con precio promocional
      productosPromo.forEach((producto) => {
        const productoConPrecioPromo = {
          ...producto,
          precio: promocion.precio_prom || producto.precio,
        };
        addToCart(productoConPrecioPromo);
      });

      toast.success("Productos en promoción cargados");
      return true;
    } catch (error) {
      console.error("Error en cargarProductosEnPromocion:", error);
      toast.error("Error al cargar productos en promoción");
      return false;
    }
  };

  if (cajaLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  if (currentAperturaCaja?.inicializada === false)
    return <AsignarSaldoInicialModal />;

  const tienePermisoAbrirCaja = hasPermission(PERMISOS.AbrirCaja);

  // Si tiene permiso, omitir validación de autorización
  if (tienePermisoAbrirCaja) {
    // Usuario con permiso específico - acceso directo
    if (!currentAperturaCaja) return <AbrirCajaModal />;
  } else {
    // Usuario sin permiso específico - validar autorización tradicional
    if (!authorized && !currentAperturaCaja) return <LoginForm />;
    if (!currentAperturaCaja) return <AbrirCajaModal />;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Reemplazamos el <header> manual con el componente HeaderWithMenu */}
      <HeaderWithMenu
        title="POS" // Título para el POS
        userName={user?.nombres || "Desconocido"}
        userAvatarUrl={undefined} // URL del avatar si existe en tu objeto user
        showClock={true} // Mostrar el reloj
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-[2] p-6 bg-white flex flex-col">
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={productSearchTerm}
              onChange={(e) => {
                setProductSearchTerm(e.target.value);
              }}
              className="w-full pl-12 pr-4 py-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex-1 overflow-y-auto mb-6 space-y-4">
            {/* Mostrar productos del carrito siempre */}
            {carrito.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center py-4 border-b last:border-b-0"
              >
                <div className="flex-1">
                  <h4 className="font-medium">{item.nombre}</h4>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() =>
                      updateQuantity(item.id, Math.max(0, item.quantity - 1))
                    }
                    className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center flex-shrink-0">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center space-x-4 ml-6">
                  <span className="font-semibold">
                    {fmt(item.precio * item.quantity)}
                  </span>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-gray-600 p-1 rounded-full hover:bg-gray-100"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Mostrar productos filtrados para agregar */}
            {shouldShowProducts &&
              productos
                .filter((p) =>
                  p.nombre
                    .toLowerCase()
                    .includes(productSearchTerm.toLowerCase())
                )
                .map((p) => {
                  const item = carrito.find((i) => i.id === p.id);
                  if (item) return null; // No mostrar si ya está en el carrito
                  return (
                    <div
                      key={p.id}
                      className="flex justify-between items-center py-4 border-b last:border-b-0 bg-blue-50"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-blue-800">
                          {p.nombre}
                        </h4>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-blue-600">
                          {fmt(p.precio)}
                        </span>
                        <button
                          onClick={() => addToCart(p)}
                          className="w-8 h-8 bg-blue-600 text-white rounded flex items-center justify-center"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}

            {carrito.length === 0 && !shouldShowProducts && (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">Busca productos para agregarlos</p>
                  <p className="text-sm">
                    Escribe el nombre o código del producto
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="border-t pt-4 flex flex-col">
            <div className="grid grid-cols-2 gap-4 items-center mb-2">
              <span className="text-gray-600 text-sm">
                N° Líneas {carrito.length} / Tot. ítems{" "}
                {Math.max(
                  0,
                  carrito.reduce((s, i) => s + Math.max(0, i.quantity || 0), 0)
                )}
              </span>
              <div className="col-span-2">
                <div className="relative">
                  <select
                    className="w-full p-2 border rounded-md text-sm"
                    value={currentCliente?.id || ""}
                    onChange={(e) => {
                      const cliente =
                        clientes.find((c) => c.id === e.target.value) || null;
                      selectClient(cliente);
                    }}
                  >
                    <option value="">Seleccionar cliente</option>
                    {clientes.map((cliente) => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.razon_social ||
                          `${cliente.nombres || ""} ${cliente.apellidos || ""
                            }`.trim()}
                      </option>
                    ))}
                  </select>
                  {currentCliente && (
                    <button
                      onClick={() => selectClient(null)}
                      className="absolute top-1/2 right-6 -translate-y-1/2 text-red-500 hover:text-red-700"
                      title="Quitar cliente"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {currentCliente && (
                  <div className="mt-1 text-xs text-gray-600 truncate">
                    {currentCliente.rut ? `RUT: ${currentCliente.rut}` : ""}
                    {currentCliente.direccion
                      ? ` - ${currentCliente.direccion}`
                      : ""}
                  </div>
                )}
              </div>
              <div className="relative w-fit ml-auto">
                {/* <select 
                    value={selectedDte}
                    onChange={(e) => setSelectedDte(e.target.value)}
                    className="px-3 py-2 border rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 appearance-none pr-8 cursor-pointer"
                  >
                      <option value="factura_manual">Factura Manual</option>
                      <option value="boleta">Boleta</option>
                  </select> */}
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 items-center mb-3">
              <div className="flex items-center justify-end">
                <span className="text-lg font-semibold mr-2">Total</span>
                <div className="bg-gray-100 p-2 rounded-lg text-right min-w-[100px]">
                  <span className="text-xl font-bold">{fmt(total)}</span>
                </div>
              </div>
            </div>

            <div className="mt-auto flex gap-2">
              <button
                onClick={() => clearCart()}
                className="flex-1 px-4 py-2 bg-gray-100 rounded flex items-center justify-center text-sm"
              >
                <XIcon className="w-4 h-4 mr-1" />
                Cancelar
              </button>
              <button
                onClick={() => setShowDraftModal(true)}
                className="flex-1 px-4 py-2 bg-gray-100 rounded flex items-center justify-center text-sm"
              >
                <FileText className="w-4 h-4 mr-1" />
                Guardar borrador
              </button>
              <button
                onClick={() => setShowPaymentModal(true)}
                disabled={carrito.length === 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded font-semibold text-base disabled:opacity-50"
              >
                Pagar
              </button>
            </div>
          </div>
        </div>

        <aside
          className={`flex-1 p-6 bg-gray-50 border-l flex flex-col overflow-y-auto ${showPaymentModal ? "hidden" : ""
            }`}
        >
          {activeTab === "destacado" && <ProductHighlights />}
          {activeTab === "borradores" && (
            <DraftsPanel
              borradores={borradores}
              onLoad={handleLoadDraft}
              onDelete={handleDeleteDraft}
            />
          )}
          {activeTab === "promociones" && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <Percent className="w-5 h-5 text-blue-600" />
                <h3 className="text-blue-600 font-semibold text-lg">
                  Promociones
                </h3>
              </div>

              {promociones.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No hay promociones disponibles
                </p>
              ) : (
                <div className="space-y-3">
                  {promociones.map((promo) => (
                    <div
                      key={promo.id}
                      className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
                    >
                      <h4 className="font-medium text-gray-900">
                        {promo.nombre}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {promo.descripcion}
                      </p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {promo.tipo === "descuento_porcentaje"
                            ? `${promo.valor}% descuento`
                            : promo.tipo === "descuento_monto"
                              ? `$${promo.valor} descuento`
                              : promo.tipo}
                        </span>
                        <button
                          onClick={() => cargarProductosEnPromocion(promo)}
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
          {activeTab === "productos" && (
            <ProductsPanel
              onAddToCart={addToCart}
              searchTerm={productSearchTerm}
            />
          )}
          {activeTab === "clientes" && (
            <ClientsPanel
              onClientSelected={(cliente) => {
                pick(cliente);
              }}
              clientSearchTerm=""
              isCreating={isCreating}
              setIsCreating={setIsCreating}
            />
          )}

          <nav
            className={`flex justify-around items-center h-16 bg-white border-t mt-auto mb-4 ${showPaymentModal ? "hidden" : ""
              }`}
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors ${activeTab === tab.id
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
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
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="mb-4">
                <h4 className="text-lg font-semibold text-gray-900">
                  Facturación
                </h4>
              </div>

              {/* Document Type Selection */}
              <div className="space-y-4">
                <div className="mb-4">
                  <select
                    value={selectedDte}
                    onChange={(e) => setSelectedDte(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="boleta">Boleta</option>
                    <option value="factura">Factura Manual</option>
                  </select>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setTipoEntrega(
                          tipoEntrega === "inmediata" ? null : "inmediata"
                        )
                      }
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${tipoEntrega === "inmediata"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                    >
                      <Package className="w-4 h-4" />
                      <span>Entrega inmediata</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setTipoEntrega(
                          tipoEntrega === "despacho" ? null : "despacho"
                        )
                      }
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${tipoEntrega === "despacho"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                    >
                      <Truck className="w-4 h-4" />
                      <span>Despacho</span>
                    </button>
                  </div>
                </div>

                {/* Descuentos y Cupones */}
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => setDescuentosEnabled(!descuentosEnabled)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${descuentosEnabled
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                  >
                    <Percent className="w-4 h-4" />
                    <span className="text-sm">Descuentos</span>
                  </button>
                  <button
                    onClick={() => setCupon(!cupon)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${cupon
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">Agregar cupón</span>
                  </button>
                </div>

                {/* Selección de Cliente para Factura */}
                {(selectedDte === "factura" || tipoEntrega === "despacho") && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cliente (requerido)
                    </label>
                    {currentCliente ? (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {currentCliente.nombres}
                            </p>
                            <p className="text-xs text-blue-700">
                              RUT: {currentCliente.rut}
                            </p>
                          </div>
                          <button
                            onClick={() => selectClient(null)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Cambiar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <SearchBarClientes
                          pick={pick}
                          clientModule={false}
                          setIsCreating={setIsCreating}
                          handleCreateClient={handleCreateClient}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Conditional sections */}
                {descuentosEnabled && (
                  <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                    <h5 className="text-sm font-medium text-purple-800 mb-2">
                      Descuentos
                    </h5>
                    <div className="space-y-2">
                      <input
                        type="number"
                        placeholder="Porcentaje de descuento"
                        value={descuentoPorcentaje || ""}
                        onChange={(e) =>
                          setDescuentoPorcentaje(
                            Math.min(
                              100,
                              Math.max(0, parseFloat(e.target.value) || 0)
                            )
                          )
                        }
                        className="w-full px-3 py-2 border border-purple-300 rounded-lg text-sm"
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>
                )}

                {cupon && (
                  <div className="mt-4 p-3 bg-orange-50 rounded-lg">
                    <h5 className="text-sm font-medium text-orange-800 mb-2">
                      Cupón de Descuento
                    </h5>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Código del cupón"
                        value={cuponCodigo}
                        onChange={(e) =>
                          setCuponCodigo(e.target.value.toUpperCase())
                        }
                        className="flex-1 px-3 py-2 border border-orange-300 rounded-lg text-sm"
                      />
                      <button
                        onClick={() => validarCupon(cuponCodigo)}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700"
                      >
                        Aplicar
                      </button>
                    </div>
                    {cuponValido && (
                      <div className="mt-2 text-sm text-green-600">
                        ✓ Cupón válido: ${cuponDescuento} de descuento
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Payment Methods */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Métodos de pago
                </h4>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button
                    onClick={() => setSelectedMethod("efectivo")}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg ${selectedMethod === "efectivo"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      } transition-colors`}
                  >
                    <DollarSign className="w-5 h-5" />
                    <span>Efectivo</span>
                  </button>

                  <button
                    onClick={() => setSelectedMethod("tarjeta")}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg ${selectedMethod === "tarjeta"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      } transition-colors`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>Tarjeta</span>
                  </button>
                </div>

                {/* No terminal selection for card payments */}
                {selectedMethod === "tarjeta" && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl shadow-sm">
                    <p className="text-sm text-yellow-800 mb-3 font-medium">
                      Tipo de tarjeta
                    </p>

                    <div className="relative">
                      <select
                        className="w-full appearance-none bg-white border border-yellow-300 rounded-lg py-2 px-4 pr-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                        value={cardType ?? ""}
                        onChange={(e) => setCardType(e.target.value as "Credito" | "Debito")}
                      >
                        <option value="">-- Seleccione --</option>
                        <option value="Credito">Crédito</option>
                        <option value="Debito">Débito</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <svg
                          className="fill-current h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                        >
                          <path d="M5.516 7.548l4.484 4.484 4.484-4.484-1.032-1.032L10 10.468 6.548 6.516z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cash Amount for Efectivo */}
                {selectedMethod === "efectivo" && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monto recibido
                    </label>
                    <input
                      type="number"
                      value={montoRecibido || ""}
                      placeholder="Ingrese el monto recibido"
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "") {
                          setMontoRecibido(0);
                        } else {
                          setMontoRecibido(Math.max(0, parseFloat(value) || 0));
                        }
                      }}
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
                  {/* Mostrar el total a pagar (ya con redondeo si es efectivo) */}
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Total a pagar</span>
                    <span className="font-semibold text-lg">
                      {fmt(totalAPagar)}
                    </span>
                  </div>

                  {/* Desglose del total */}
                  {descuentosEnabled && descuentoPorcentaje > 0 && (
                    <div className="border-t border-gray-200 pt-2 mt-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>{fmt(total)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-red-600">
                        <span>Descuento ({descuentoPorcentaje}%)</span>
                        <span>-{fmt(montoDescuento, true)}</span>
                      </div>
                    </div>
                  )}

                  {cuponValido && cuponDescuento > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Cupón ({cuponCodigo})</span>
                      <span>-{fmt(cuponDescuento, true)}</span>
                    </div>
                  )}

                  {/* Aviso de redondeo solo para efectivo */}
                  {selectedMethod === "efectivo" &&
                    totalAPagar !== totalConDescuento && (
                      <div className="text-xs text-gray-500 italic">
                        * Redondeado al múltiplo de 10 más cercano
                      </div>
                    )}

                  {/* Monto recibido y vuelto solo para efectivo */}
                  {selectedMethod === "efectivo" && (
                    <div className="border-t border-gray-200 pt-2 mt-2 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm">Monto recibido</span>
                        <span className="font-medium">
                          {fmt(montoRecibidoNum)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Vuelto</span>
                        <span className="font-bold">{fmt(vuelto)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handlePaymentComplete}
                disabled={
                  loading ||
                  carrito.length === 0 ||
                  (selectedMethod === "efectivo" &&
                    (montoRecibido || 0) <
                    Math.round(totalConDescuento / 10) * 10) ||
                  (selectedDte === "factura" && !currentCliente) // Cambiar selectedClient por currentCliente
                }
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Procesando..." : "Confirmar pago"}
              </button>
            </div>
          </aside>
        )}
      </div>

      <DraftSaveModal
        isOpen={showDraftModal}
        draftName={draftName}
        setDraftName={setDraftName}
        onClose={() => setShowDraftModal(false)}
        onSave={handleSaveDraft}
      />
      <ReceiptModal
        isOpen={showReceipt}
        onClose={handleReceiptClose}
        onPrint={handleReceiptClose}
        onSendEmail={() => toast.success("Enviado por email")}
      />

      {/* Print Dialog */}
      {showPrintDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Boleta generada
              </h3>
              <p className="text-gray-600 mb-6">
                Enviar por correo electrónico (Opcional)
              </p>

              <div className="flex mb-4">
                <input
                  type="email"
                  placeholder="Email"
                  id="emailInput"
                  defaultValue={currentCliente?.email || ""} // Cambiar selectedClient por currentCliente
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => {
                    const emailInput = document.getElementById(
                      "emailInput"
                    ) as HTMLInputElement;
                    const email = emailInput?.value;
                    if (email && email.includes("@")) {
                      // Simular envío de email
                      toast.success(`Documento enviado a ${email}`);
                    } else {
                      toast.error("Ingrese un email válido");
                    }
                  }}
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
    </div>
  );
};

export default Dashboard;
