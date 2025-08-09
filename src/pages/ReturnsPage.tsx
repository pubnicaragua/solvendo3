import React, { useState, useEffect } from "react";
import {
  RotateCcw,
  Search,
  Plus,
  Minus,
  X as XIcon,
  Check,
  Info,
  User,
  Mail,
  CreditCard,
} from "lucide-react";
import { HeaderWithMenu } from "../components/common/HeaderWithMenu";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { ReturnsModal } from "../components/pos/ReturnsModal";

interface VentaItem {
  id: string;
  nombre: string;
  cantidad: number;
  precio: number;
  returnable: number;
}

interface ClienteDevolucion {
  nombre: string;
  rut: string;
  correo: string;
  tipoReembolso: "efectivo" | "bancario";
  cuentaTarjeta: string;
}

export const ReturnsPage: React.FC = () => {
  const [folio, setFolio] = useState("");
  const [folioInput, setFolioInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const { empresaId, user } = useAuth();
  const [ventaItems, setVentaItems] = useState<VentaItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>(
    {}
  );
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [tipoNota, setTipoNota] = useState("Nota de crédito manual");
  const [clienteSearch, setClienteSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showClienteForm, setShowClienteForm] = useState(false);
  const [clienteDevolucion, setClienteDevolucion] = useState<ClienteDevolucion>(
    {
      nombre: "",
      rut: "",
      correo: "",
      tipoReembolso: "efectivo",
      cuentaTarjeta: "",
    }
  );
  const [productSearchResults, setProductSearchResults] = useState<any[]>([]);
  const [clientSearchResults, setClientSearchResults] = useState<any[]>([]);
  const [tipoReembolsoData, setTipoReembolsoData] = useState({
    tipoCuenta: "",
    numeroCuenta: "",
    nombreBanco: "",
  });
  const [showMotivoInput, setShowMotivoInput] = useState(false);
  const [motivoDevolucion, setMotivoDevolucion] = useState("");
  const [showBoletaModal, setShowBoletaModal] = useState(false);
  const [venta, setVenta] = useState<any>(null);
  const [productos, setProductos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);

  // Cargar productos y clientes de la empresa logueada
  const loadProductos = async () => {
    if (!empresaId) return;

    try {
      const { data, error } = await supabase
        .from("productos")
        .select("*")
        .eq("empresa_id", empresaId)
        .eq("activo", true);

      if (error) throw error;
      setProductos(data || []);
    } catch (error) {
      console.error("Error loading productos:", error);
    }
  };

  const loadClientes = async () => {
    if (!empresaId) return;

    try {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .eq("empresa_id", empresaId)
        .eq("activo", true);

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error("Error loading clientes:", error);
    }
  };

  useEffect(() => {
    if (empresaId) {
      loadClientes();
      loadProductos();
    }
  }, [empresaId]);

  // Función para buscar folio real en la base de datos
  const handleSearchFolio = async () => {
    if (!folioInput.trim()) {
      toast.error("Por favor ingrese un folio");
      return;
    }

    if (!empresaId) {
      toast.error("No se ha identificado la empresa");
      return;
    }

    setLoading(true);
    try {
      // Buscar la venta por folio y empresa
      const { data: venta, error: errV } = await supabase
        .from("ventas")
        .select("*")
        .eq("folio", folioInput)
        .eq("empresa_id", empresaId)
        .eq("estado", "completada")
        .single();

      if (errV || !venta) {
        toast.error("Folio no encontrado o venta no completada");
        setLoading(false);
        return;
      }

      setVenta(venta);
      setFolio(folioInput);

      // Cargar ítems de la venta
      const { data: items, error: itemsError } = await supabase
        .from("venta_items")
        .select(
          `  
          id,  
          cantidad,  
          precio_unitario,  
          productos (  
            id,  
            nombre  
          )  
        `
        )
        .eq("venta_id", venta.id);

      if (itemsError) {
        toast.error("Error al cargar los ítems de la venta");
        setLoading(false);
        return;
      }

      if (!items || items.length === 0) {
        toast.error("No se encontraron ítems para esta venta");
        setLoading(false);
        return;
      }

      // Verificar qué cantidad ya ha sido devuelta
      const { data: devolucionesExistentes } = await supabase
        .from("devolucion_items")
        .select(
          `  
          venta_item_id,  
          cantidad_devuelta,  
          devoluciones!inner(venta_id)  
        `
        )
        .eq("devoluciones.venta_id", venta.id);

      // Calcular cantidades devueltas por item
      const cantidadesDevueltas: Record<string, number> = {};
      devolucionesExistentes?.forEach((dev) => {
        cantidadesDevueltas[dev.venta_item_id] =
          (cantidadesDevueltas[dev.venta_item_id] || 0) + dev.cantidad_devuelta;
      });

      // Mapear los ítems con cantidades disponibles para devolución
      const mappedItems: VentaItem[] = items
        .map((item) => {
          const cantidadDevuelta = cantidadesDevueltas[item.id] || 0;
          const cantidadDisponible = item.cantidad - cantidadDevuelta;

          return {
            id: item.id,
            nombre: item.productos?.nombre || "Producto sin nombre",
            cantidad: item.cantidad,
            precio: item.precio_unitario,
            returnable: Math.max(0, cantidadDisponible),
          };
        })
        .filter((item) => item.returnable > 0); // Solo mostrar ítems que se pueden devolver

      if (mappedItems.length === 0) {
        toast.error("Todos los ítems de esta venta ya han sido devueltos");
        setVentaItems([]);
        setShowForm(false);
      } else {
        setVentaItems(mappedItems);
        setShowForm(true);
        toast.success(
          `Venta encontrada. ${mappedItems.length} ítems disponibles para devolución`
        );
      }

      setSelectedItems({});
    } catch (error: any) {
      console.error("Error loading venta:", error);
      toast.error("Error al cargar la venta: " + error.message);
      setFolio("");
      setShowForm(false);
    } finally {
      setLoading(false);
    }
  };

  // Total calculado de los ítems seleccionados para devolución
  const total = Object.entries(selectedItems).reduce((sum, [id, qty]) => {
    const item = ventaItems.find((i) => i.id === id);
    return sum + (item ? item.precio * qty : 0);
  }, 0);

  // Formateador de moneda
  const formatPrice = (n: number) =>
    new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
    }).format(n);

  // Función para buscar productos
  const handleProductSearch = (termino: string) => {
    setSearchTerm(termino);
    if (!termino.trim()) {
      setProductSearchResults([]);
      return;
    }

    const productosEncontrados = productos.filter(
      (producto) =>
        producto.nombre.toLowerCase().includes(termino.toLowerCase()) ||
        producto.codigo?.toLowerCase().includes(termino.toLowerCase())
    );
    setProductSearchResults(productosEncontrados);
  };

  // Función para buscar clientes
  const handleClientSearchReturns = (termino: string) => {
    setClientSearchTerm(termino);
    if (!termino.trim()) {
      setClientSearchResults([]);
      return;
    }

    const clientesEncontrados = clientes.filter(
      (cliente) =>
        cliente.razon_social.toLowerCase().includes(termino.toLowerCase()) ||
        cliente.rut?.toLowerCase().includes(termino.toLowerCase())
    );
    setClientSearchResults(clientesEncontrados);
  };

  // Esta función ahora solo abre el modal de devoluciones
  const handleOpenReturnsModal = () => {
    if (!showForm || total === 0) {
      toast.error(
        "No hay ítems seleccionados para devolver o la venta no ha sido cargada."
      );
      return;
    }

    // Mostrar formulario de cliente primero
    setShowClienteForm(true);
  };

  const handleConfirmDevolucion = () => {
    if (
      !clienteDevolucion.nombre ||
      !clienteDevolucion.rut ||
      !clienteDevolucion.correo
    ) {
      toast.error("Por favor complete todos los campos del cliente");
      return;
    }

    if (
      clienteDevolucion.tipoReembolso === "bancario" &&
      !clienteDevolucion.cuentaTarjeta
    ) {
      toast.error(
        "Por favor ingrese la cuenta/tarjeta para reembolso bancario"
      );
      return;
    }

    setShowClienteForm(false);
    setShowBoletaModal(true);
  };

  const handlePrintBoleta = () => {
    try {
      const printContent = `  
        <div style="font-family: 'Courier New', monospace; width: 80mm; margin: 0 auto; padding: 20px;">  
          <div style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 15px; margin-bottom: 15px;">  
            <div style="font-size: 16px; font-weight: bold;">ANROLTEC SPA</div>  
            <div style="font-size: 10px;">RUT: 78.168.951-3</div>  
            <div style="font-size: 10px;">Av. Providencia 1234, Santiago</div>  
          </div>  
            
          <div style="text-align: center; font-weight: bold; margin: 10px 0;">  
            NOTA DE CRÉDITO  
          </div>  
          <div style="font-size: 10px;">Folio: NC-${folio}</div>  
          <div style="font-size: 10px;">Cliente: ${
            clienteDevolucion.nombre
          }</div>  
          <div style="font-size: 10px;">RUT: ${clienteDevolucion.rut}</div>  
          <div style="font-size: 10px;">Email: ${
            clienteDevolucion.correo
          }</div>  
          <div style="font-size: 10px;">Reembolso: ${
            clienteDevolucion.tipoReembolso
          }</div>  
          ${
            clienteDevolucion.tipoReembolso === "bancario"
              ? `<div style="font-size: 10px;">Cuenta: ${clienteDevolucion.cuentaTarjeta}</div>`
              : ""
          }  
          <div style="font-size: 10px;">Total: ${formatPrice(total)}</div>  
          <div style="font-size: 10px;">Fecha: ${new Date().toLocaleDateString(
            "es-CL"
          )}</div>  
            
          <div style="text-align: center; margin-top: 20px; border-top: 1px dashed #000; padding-top: 10px;">  
            <div style="font-size: 9px;">Nota de crédito generada</div>  
            <div style="font-size: 9px;">Powered by Solvendo</div>  
          </div>  
        </div>  
      `;

      const printWindow = window.open("", "_blank", "width=400,height=600");
      if (printWindow) {
        printWindow.document.write(`  
          <!DOCTYPE html>  
          <html>  
          <head><title>Nota de Crédito</title></head>  
          <body>${printContent}</body>  
          <script>window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 1000); }</script>  
          </html>  
        `);
        printWindow.document.close();
      }
    } catch (error) {
      console.error("Error al imprimir:", error);
    }

    setShowBoletaModal(false);
    toast.success("Devolución procesada correctamente");
    // Preparar los datos para el modal de devoluciones
    const itemsToReturn = Object.entries(selectedItems).map(([id, qty]) => {
      const item = ventaItems.find((i) => i.id === id);
      return {
        id: id,
        nombre: item?.nombre || "Producto desconocido",
        cantidad: qty,
        precio: item?.precio || 0,
        subtotal: (item?.precio || 0) * qty,
      };
    });

    // Abrir el modal con los datos preparados
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setFolio("");
    setFolioInput("");
    setVentaItems([]);
    setSelectedItems({});
    setShowForm(false);
    setTipoNota("Nota de crédito manual");
    setClienteSearch("");
    setShowClienteForm(false);
    setShowBoletaModal(false);
    toast("Devolución cancelada.", { icon: "👋" });
  };

  const handleAnularVenta = () => {
    toast.error(
      "La anulación de venta completa requiere autorización especial"
    );
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header con nombre de usuario y avatar */}
      <HeaderWithMenu
        title="Devolución"
        icon={<RotateCcw className="w-6 h-6 text-gray-600" />}
        showClock
        userName={user?.nombre || "Usuario"}
        userAvatarUrl={user?.avatar_url}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL */}
        <div className="flex-1 bg-white p-6 shadow-md flex flex-col">
          {/* Buscador productos */}
          <div className="relative mb-6">
            <input
              type="text"
              placeholder="Ingresa aquí el producto o servicio"
              value={searchTerm}
              onChange={(e) => handleProductSearch(e.target.value)}
              className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>

          {/* Resultados de búsqueda de productos */}
          {productSearchResults.length > 0 && (
            <div className="mb-4 bg-white border border-gray-200 rounded-lg shadow-sm max-h-40 overflow-y-auto">
              {productSearchResults.map((producto) => (
                <div
                  key={producto.id}
                  className="p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-gray-900">
                    {producto.nombre}
                  </div>
                  <div className="text-sm text-gray-500">
                    Código: {producto.codigo || "N/A"}
                  </div>
                  <div className="text-sm text-gray-500">
                    Stock: {producto.stock || 0}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Encabezados de la tabla de ítems */}
          <div className="grid grid-cols-4 gap-4 text-sm font-medium border-b border-gray-200 pb-2 mb-4 text-gray-600">
            <span className="pl-1">Producto</span>
            <span className="text-center">Cantidad</span>
            <span className="text-center">Descuento</span>
            <span className="text-right pr-1">Importe</span>
          </div>

          <div className="space-y-3 pb-4 flex-grow overflow-y-auto">
            {ventaItems.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Busque un folio para cargar los ítems retornables.
              </p>
            ) : (
              ventaItems.map((item) => {
                const qty = selectedItems[item.id] || 0;
                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-4 gap-4 items-center p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <span className="text-gray-800">{item.nombre}</span>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        disabled={qty <= 0}
                        onClick={() =>
                          setSelectedItems((s) => ({
                            ...s,
                            [item.id]: qty - 1,
                          }))
                        }
                        className="p-1 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-semibold text-gray-800">
                        {qty}
                      </span>
                      <button
                        disabled={qty >= item.returnable}
                        onClick={() =>
                          setSelectedItems((s) => ({
                            ...s,
                            [item.id]: qty + 1,
                          }))
                        }
                        className="p-1 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-center text-gray-800">0%</span>
                    <div className="flex items-center justify-between pl-4">
                      <span className="font-semibold text-gray-800">
                        {formatPrice(item.precio * qty)}
                      </span>
                      <button
                        onClick={() => {
                          const s = { ...selectedItems };
                          delete s[item.id];
                          setSelectedItems(s);
                        }}
                        className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Sección inferior compacta del panel izquierdo */}
          <div className="mt-auto pt-4 border-t border-gray-200">
            {/* Fila superior: Líneas/Ítems, Selector Nota, Buscar Cliente */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="text-sm text-gray-600 flex-none">
                N° Líneas: {ventaItems.length} / Tot. ítems:{" "}
                {Object.values(selectedItems).reduce((s, n) => s + n, 0)}
              </div>
              <select
                value={tipoNota}
                onChange={(e) => setTipoNota(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:ring-blue-500 focus:border-blue-500 flex-grow max-w-[200px]"
              >
                <option>Nota de crédito manual</option>
                <option>Nota electrónica</option>
              </select>
              <div className="relative flex-grow min-w-[180px] max-w-[250px]">
                <input
                  type="text"
                  placeholder="Buscar cliente"
                  value={clienteSearch}
                  onChange={(e) => handleClientSearchReturns(e.target.value)}
                  className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
            </div>

            {/* Resultados de búsqueda de clientes */}
            {clientSearchResults.length > 0 && (
              <div className="mb-4 bg-white border border-gray-200 rounded-lg shadow-sm max-h-32 overflow-y-auto">
                {clientSearchResults.map((cliente) => (
                  <div
                    key={cliente.id}
                    className="p-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 cursor-pointer"
                    onClick={() => {
                      setClienteDevolucion((prev) => ({
                        ...prev,
                        nombre: cliente.razon_social,
                        rut: cliente.rut || "",
                        correo: cliente.email || "",
                      }));
                      setClienteSearch(cliente.razon_social);
                      setClientSearchResults([]);
                    }}
                  >
                    <div className="font-medium text-gray-900 text-sm">
                      {cliente.razon_social}
                    </div>
                    <div className="text-xs text-gray-500">
                      RUT: {cliente.rut || "N/A"}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Fila inferior: Botones de acción y Total/Devolver */}
            <div className="flex items-center justify-between mt-4">
              {/* Botones de acción */}
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-100 rounded-lg flex items-center gap-1 text-sm text-gray-700 hover:bg-gray-200 transition-colors border border-gray-200 shadow-sm"
                >
                  <XIcon className="w-4 h-4 text-gray-500" /> Cancelar
                </button>
                <button
                  onClick={handleAnularVenta}
                  className="px-4 py-2 bg-gray-100 rounded-lg flex items-center gap-1 text-sm text-gray-700 hover:bg-gray-200 transition-colors border border-gray-200 shadow-sm"
                >
                  <XIcon className="w-4 h-4 text-gray-500" /> Anular venta
                </button>
              </div>

              {/* Total y botón "Devolver" */}
              <div className="flex items-center gap-4">
                <span className="text-lg font-semibold text-gray-800">
                  Total
                </span>
                <span className="text-xl font-bold text-gray-900">
                  {formatPrice(total)}
                </span>
                <button
                  onClick={handleOpenReturnsModal}
                  disabled={!showForm || total === 0 || loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md text-base"
                >
                  {loading ? "Procesando..." : "Devolver"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL (SOLO BUSCADOR DE FOLIO) */}
        <aside className="w-96 bg-white p-6 flex flex-col shadow-md border-l border-gray-200">
          <div className="mb-4">
            <div className="flex items-center text-blue-800 font-medium mb-3">
              <Search className="w-4 h-4 mr-2" /> Folio de documento
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Ingresa aquí el número de folio"
                value={folioInput}
                onChange={(e) => setFolioInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleSearchFolio();
                }}
                className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleSearchFolio}
                disabled={loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-blue-600 focus:outline-none"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>

          {folio && (
            <div className="flex flex-col gap-1 mb-4 text-gray-700">
              <span className="text-sm">Folio:</span>
              <div className="flex items-center justify-between bg-gray-100 p-3 rounded-lg border border-gray-200">
                <span className="font-semibold text-base">{folio}</span>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">
                    <Check className="w-5 h-5" />
                  </span>
                  <span className="text-gray-400">
                    <Info className="w-5 h-5" />
                  </span>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Modal de datos del cliente */}
      {showClienteForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Datos del Cliente
              </h3>
              <button
                onClick={() => setShowClienteForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo *
                </label>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={clienteDevolucion.nombre}
                    onChange={(e) =>
                      setClienteDevolucion((prev) => ({
                        ...prev,
                        nombre: e.target.value,
                      }))
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Nombre del cliente"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RUT *
                </label>
                <input
                  type="text"
                  value={clienteDevolucion.rut}
                  onChange={(e) =>
                    setClienteDevolucion((prev) => ({
                      ...prev,
                      rut: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="12.345.678-9"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo de devolución *
                </label>
                <textarea
                  value={motivoDevolucion}
                  onChange={(e) => setMotivoDevolucion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg h-20 resize-none"
                  placeholder="Ingrese el motivo de la devolución..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo electrónico *
                </label>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={clienteDevolucion.correo}
                    onChange={(e) =>
                      setClienteDevolucion((prev) => ({
                        ...prev,
                        correo: e.target.value,
                      }))
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="cliente@ejemplo.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de reembolso *
                </label>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gray-400" />
                  <select
                    value={clienteDevolucion.tipoReembolso}
                    onChange={(e) =>
                      setClienteDevolucion((prev) => ({
                        ...prev,
                        tipoReembolso: e.target.value as
                          | "efectivo"
                          | "bancario",
                      }))
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="bancario">Bancario</option>
                  </select>
                </div>
              </div>

              {clienteDevolucion.tipoReembolso === "bancario" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de cuenta *
                    </label>
                    <select
                      value={tipoReembolsoData.tipoCuenta}
                      onChange={(e) =>
                        setTipoReembolsoData((prev) => ({
                          ...prev,
                          tipoCuenta: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Seleccionar tipo</option>
                      <option value="corriente">Cuenta Corriente</option>
                      <option value="ahorro">Cuenta de Ahorro</option>
                      <option value="vista">Cuenta Vista</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de cuenta *
                    </label>
                    <input
                      type="text"
                      value={tipoReembolsoData.numeroCuenta}
                      onChange={(e) =>
                        setTipoReembolsoData((prev) => ({
                          ...prev,
                          numeroCuenta: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Número de cuenta"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del banco *
                    </label>
                    <select
                      value={tipoReembolsoData.nombreBanco}
                      onChange={(e) =>
                        setTipoReembolsoData((prev) => ({
                          ...prev,
                          nombreBanco: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Seleccionar banco</option>
                      <option value="banco_chile">Banco de Chile</option>
                      <option value="banco_estado">Banco Estado</option>
                      <option value="santander">Santander</option>
                      <option value="bci">BCI</option>
                      <option value="scotiabank">Scotiabank</option>
                      <option value="itau">Itaú</option>
                      <option value="security">Security</option>
                      <option value="falabella">Falabella</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowClienteForm(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDevolucion}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de boleta generada */}
      {showBoletaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nota de crédito generada
              </h3>
              <p className="text-gray-600 mb-6">
                Enviar por correo electrónico (Opcional)
              </p>

              <div className="flex mb-4">
                <input
                  type="email"
                  placeholder="Email"
                  defaultValue={clienteDevolucion.correo}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() =>
                    toast.success("Nota de crédito enviada por email")
                  }
                  className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700"
                >
                  Enviar
                </button>
              </div>

              <button
                onClick={handlePrintBoleta}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700"
              >
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Renderiza el ReturnsModal */}
      <ReturnsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        ventaId={venta?.id}
        itemsToReturn={Object.entries(selectedItems).map(([id, qty]) => {
          const item = ventaItems.find((i) => i.id === id);
          return {
            id: id,
            nombre: item?.nombre || "Producto desconocido",
            cantidad: qty,
            precio: item?.precio || 0,
            subtotal: (item?.precio || 0) * qty,
          };
        })}
        total={total}
      />
    </div>
  );
};
