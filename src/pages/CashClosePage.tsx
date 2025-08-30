import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MovimientoCaja, supabase, Venta } from "../lib/supabase";
import { usePOS } from "../contexts/POSContext";
import { useAuth } from "../contexts/AuthContext";
import { DollarSign, Calendar, Clock, ClipboardList } from "lucide-react";
import { HeaderWithMenu } from "../components/common/HeaderWithMenu";
import toast from "react-hot-toast";
import AbrirCajaModal from "../components/pos/AbrirCajaModal";
import { useUserPermissions } from "../hooks/usePermissions";
import { CierreCajaModal } from "../components/pos/AuthorizeCashCloseModal";

const SummaryLine = ({
  label,
  value,
  colorClass = "text-gray-900",
  icon: Icon,
}: {
  label: string;
  value: string;
  colorClass?: string;
  icon?: React.ElementType;
}) => (
  <div className="flex justify-between items-center py-2">
    <span className="text-sm text-[#505050] flex items-center">
      {Icon && <Icon size={14} className="mr-2 text-[#828282]" />}
      {label}
    </span>
    <span className={`text-sm font-medium ${colorClass}`}>{value}</span>
  </div>
);

export const CashClosePage: React.FC = () => {
  const {
    currentAperturaCaja,
    openCaja,
    closeCaja,
    loading: contextLoading,
  } = usePOS();
  const navigate = useNavigate();
  const { user, empresaId, sucursalId, signOut } = useAuth();
  const { hasPermission, PERMISOS } = useUserPermissions();

  // Local state
  const [showAuthorizeCloseModal, setShowAuthorizeCloseModal] =
    useState<boolean>(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoCaja[]>([]);
  const [montoFinalInput, setMontoFinalInput] = useState("");
  const [montoInicialApertura, setMontoInicialApertura] = useState("");
  const [filterType, setFilterType] = useState("all");

  // Cargar ventas y movimientos asociados a la apertura de caja actual
  useEffect(() => {
    if (!currentAperturaCaja && isInitialized) {
      setVentas([]);
      setMovimientos([]);
      setMontoFinalInput("");
      setIsInitialized(false);
      return;
    }

    const fetchData = async () => {
      try {
        const { data: ventasData, error: ventasError } = await supabase
          .from("ventas")
          .select("*")
          .eq("sesiones_caja_id", currentAperturaCaja.id)
          .order("fecha", { ascending: true });

        if (ventasError) {
          console.log("ventas ", ventasError);
          toast.error("Error cargando ventas.");
          setVentas([]);
        } else {
          setVentas((ventasData as Venta[]) ?? []);
        }

        const { data: movimientosData, error: movimientosError } =
          await supabase
            .from("movimientos_caja")
            .select("*")
            .eq("sesiones_caja_id", currentAperturaCaja!.id)
            .order("created_at", { ascending: true });

        if (movimientosError) {
          toast.error("Error cargando movimientos de caja.");
          setMovimientos([]);
        } else {
          setMovimientos((movimientosData as MovimientoCaja[]) ?? []);
        }

        // Inicializar monto final con el monto esperado si está vacío
        if (!montoFinalInput && !isInitialized) {
          const montoEsperadoCalc =
            (currentAperturaCaja?.monto_inicial || 0) +
            (ventasData ?? [])
              .filter((v: Venta) => v.metodo_pago.toLowerCase() === "efectivo")
              .reduce((acc: number, v: Venta) => acc + v.total, 0) +
            (movimientosData ?? [])
              .filter((m: MovimientoCaja) => m.tipo === "ingreso")
              .reduce((acc: number, m: MovimientoCaja) => acc + m.monto, 0) -
            (movimientosData ?? [])
              .filter((m: MovimientoCaja) => m.tipo === "retiro")
              .reduce((acc: number, m: MovimientoCaja) => acc + m.monto, 0);
          if (montoEsperadoCalc > 0) {
            setMontoFinalInput(montoEsperadoCalc.toFixed(2));
          }
          setIsInitialized(true);
        }
      } catch (error) {
        console.log(error);
        setVentas([]);
        setMovimientos([]);
      }
    };
    fetchData();
  }, [currentAperturaCaja]);

  // Cálculos resumen totales
  const {
    ventasEfectivo,
    ventasTarjeta,
    totalIngresos,
    totalRetiros,
    totalVentasNeto,
    montoEsperado,
    cantidadEfectivo,
    cantidadTarjeta,
  } = useMemo(() => {
    const ventasEfectivoList = ventas.filter(
      (v) => v.metodo_pago.toLowerCase() === "efectivo"
    );
    const ventasTarjetaList = ventas.filter(
      (v) => v.metodo_pago.toLowerCase() !== "efectivo"
    );

    const ventasEfectivoVal = ventasEfectivoList.reduce((acc, v) => acc + v.total, 0);
    const ventasTarjetaVal = ventasTarjetaList.reduce((acc, v) => acc + v.total, 0);

    const totalVentasNetoVal = ventasEfectivoVal + ventasTarjetaVal;

    const totalIngresosVal = movimientos
      .filter((m) => m.tipo === "ingreso")
      .reduce((acc, m) => acc + m.monto, 0);

    const totalRetirosVal = movimientos
      .filter((m) => m.tipo === "retiro")
      .reduce((acc, m) => acc + m.monto, 0);

    const montoEsperadoCalc =
      (currentAperturaCaja?.saldo_inicial || 0) +
      ventasEfectivoVal +
      totalIngresosVal;

    return {
      ventasEfectivo: ventasEfectivoVal,
      ventasTarjeta: ventasTarjetaVal,
      totalIngresos: totalIngresosVal,
      totalRetiros: totalRetirosVal,
      totalVentasNeto: totalVentasNetoVal,
      montoEsperado: montoEsperadoCalc,
      cantidadEfectivo: ventasEfectivoList.length,
      cantidadTarjeta: ventasTarjetaList.length,
    };
  }, [ventas, movimientos, currentAperturaCaja]);


  // Formatear moneda
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(Math.max(0, price || 0))
      .replace("$", "") + "$";

  // Diferencia monto final vs esperado
  const diferencia = useMemo(() => {
    const montoFinalNum = Math.max(0, parseFloat(montoFinalInput) || 0);
    const montoEsperadoSafe = Math.max(0, montoEsperado || 0);
    return montoFinalNum - montoEsperadoSafe;
  }, [montoFinalInput, montoEsperado]);

  // Cerrar caja validando usuario y monto
  const handleCloseCash = async () => {
    if (!user) {
      toast.error("Usuario no autenticado. Por favor inicia sesión.");
      return;
    }
    setIsClosing(true);
    try {
      if (!currentAperturaCaja)
        throw new Error("No hay una caja abierta para cerrar");

      const montoFinal = parseFloat(montoFinalInput);
      if (isNaN(montoFinal))
        throw new Error("El monto final debe ser un número válido");

      if (!hasPermission(PERMISOS.CerrarCaja)) {
        toast.error("No tienes permisos para cerrar la caja.");
        setShowAuthorizeCloseModal(true);
        return;
      }

      const success = await closeCaja(montoFinal);
      if (!success) throw new Error("Error al cerrar la caja");

      await signOut();

      toast.success("✅ Caja cerrada exitosamente.");

      navigate("/login");
    } catch (error: any) {
      toast.error("Error al cerrar la caja: " + error.message);
    } finally {
      setIsClosing(false);
    }
  };

  // Mostrar indicador de carga si contexto o estado está en loading
  if (contextLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <DollarSign className="mx-auto h-12 w-12 text-blue-500 animate-pulse" />
          <h2 className="mt-4 text-xl font-semibold text-gray-700">
            Cargando información de la caja...
          </h2>
        </div>
      </div>
    );
  }

  // Si no hay caja abierta, mostrar UI para abrir caja (selección de caja está habilitada)
  if (!currentAperturaCaja) return <AbrirCajaModal />;

  // Pantalla principal con caja abierta
  const isLoading = contextLoading || isClosing;

  const fechaApertura = currentAperturaCaja
    ? new Date(
      currentAperturaCaja.abierta_en ||
      currentAperturaCaja.created_at ||
      Date.now()
    ).toLocaleDateString("es-CL")
    : "";
  const horaCierrePropuesta = new Date().toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const cajaNombreReal = user?.nombres ? `${user.nombres}` : "Usuario";

  const handleMontoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // regex: solo números, opcional un punto y decimales
    if (/^\d*\.?\d*$/.test(val)) {
      setMontoFinalInput(val);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-[#F8F9FB] flex flex-col font-sans">
        <HeaderWithMenu
          title="Cierre de caja"
          icon={<DollarSign className="w-6 h-6" />}
          userName={user?.nombres || "Desconocido"}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6">
            <div className="flex bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-[#E0E0E0] max-w-7xl mx-auto overflow-hidden">
              {/* Izquierda: resumen ventas y caja */}
              <div className="w-3/5 p-6 border-r border-[#E0E0E0]">
                <h2 className="text-xl font-semibold text-[#333333] mb-4"></h2>

                <div className="space-y-3 border-b border-[#E0E0E0] pb-4 mb-4 text-sm text-[#505050]">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center text-[#505050]">
                      <Calendar size={14} className="mr-2 text-[#828282]" />
                      Fecha del cierre
                    </span>
                    <span className="font-medium text-[#505050] text-right">
                      {fechaApertura}
                      <span className="ml-2 inline-flex items-center justify-center w-6 h-6 bg-[#F1F3F5] rounded-full">
                        <Calendar size={12} className="text-[#828282]" />
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center text-[#505050]">
                      <Clock size={14} className="mr-2 text-[#828282]" />
                      Hora de cierre
                    </span>
                    <span className="font-medium text-[#505050] text-right">
                      {horaCierrePropuesta}
                      <span className="ml-2 inline-flex items-center justify-center w-6 h-6 bg-[#F1F3F5] rounded-full">
                        <Clock size={12} className="text-[#828282]" />
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <span className="flex items-center text-[#505050]">
                      Caja de
                    </span>
                    <span className="font-medium text-[#505050]">
                      {cajaNombreReal}
                    </span>
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-[#505050] mb-2">
                  Resumen de ventas
                </h3>
                <div className="space-y-2 border-b border-[#E0E0E0] pb-4 mb-4">
                  <SummaryLine
                    label={`Tarjeta (${cantidadTarjeta})`}
                    value={`+ ${formatPrice(ventasTarjeta)}`}
                  />
                  <SummaryLine
                    label={`Efectivo (${cantidadEfectivo})`}
                    value={`+ ${formatPrice(ventasEfectivo)}`}
                  />
                  <SummaryLine
                    label="Resumen de ventas"
                    value={formatPrice(totalVentasNeto)}
                    colorClass="text-[#505050] font-medium"
                  />
                </div>

                <h3 className="text-sm font-semibold text-[#505050] mb-2">
                  Resumen de Caja
                </h3>
                <div className="space-y-2 border-b border-[#E0E0E0] pb-4 mb-4">
                  <SummaryLine
                    label={`Efectivo (${cantidadEfectivo})`}
                    value={`+ ${formatPrice(
                      (currentAperturaCaja?.saldo_inicial || 0) +
                      ventasEfectivo +
                      totalIngresos
                    )}`}
                  />

                  <SummaryLine
                    label={`Tarjeta (${cantidadTarjeta})`}
                    value={`+ ${formatPrice(ventasTarjeta)}`}
                  />
                  <SummaryLine
                    label="Retiro de efectivo"
                    value={`- ${formatPrice(totalRetiros)}`}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4 text-center mt-4">
                  <div className="bg-[#F8F9FB] p-4 rounded-lg border border-[#E0E0E0] flex flex-col justify-between">
                    <label className="block text-xs font-normal text-[#828282] mb-1">
                      Total Teórico
                    </label>
                    <p className="text-xl font-bold text-[#505050]">
                      {formatPrice(montoEsperado)}
                    </p>
                  </div>
                  <div className="bg-[#F8F9FB] p-4 rounded-lg border border-[#E0E0E0] flex flex-col justify-between">
                    <label className="block text-xs font-normal text-[#828282] mb-1">
                      Total Real
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={montoFinalInput}
                      onChange={handleMontoChange}
                      className="w-full text-center text-xl font-bold text-[#505050] bg-transparent focus:outline-none"
                      placeholder="0"
                    />
                  </div>
                  <div className="bg-[#F8F9FB] p-4 rounded-lg border border-[#E0E0E0] flex flex-col justify-between">
                    <label className="block text-xs font-normal text-[#828282] mb-1">
                      Diferencia
                    </label>
                    <p
                      className={`text-xl font-bold ${diferencia === 0
                        ? "text-[#2196F3]"
                        : diferencia > 0
                          ? "text-green-500"
                          : "text-red-500"
                        }`}
                    >
                      {formatPrice(Math.abs(diferencia))}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleCloseCash}
                  disabled={isLoading}
                  className="w-full mt-6 bg-[#2196F3] text-white py-3 rounded-lg font-semibold hover:bg-[#1976D2] disabled:opacity-50 disabled:cursor-not-allowed transition-all text-base shadow-[0_2px_4px_rgba(33,150,243,0.2)]"
                >
                  {isLoading ? "Cerrando Caja..." : "Cerrar caja"}
                </button>
              </div>

              {/* Derecha: resumen documentos */}
              <div className="w-2/5 p-6 bg-gray-50">
                <h2 className="text-lg font-semibold text-[#333333] mb-4 flex items-center">
                  <ClipboardList className="mr-2 h-5 w-5 text-[#2196F3]" />
                  Resumen de documentos
                </h2>
                <div className="mb-4">
                  <label htmlFor="filterType" className="sr-only">
                    Filtrar documentos
                  </label>
                  <select
                    id="filterType"
                    className="bg-gray-100 block w-full p-2 border border-[#E0E0E0] rounded-md shadow-sm focus:outline-none focus:ring-[#2196F3] focus:border-[#2196F3] text-sm text-[#505050]"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <option value="all">Ventas totales</option>
                    <option value="boleta">Boleta</option>
                    <option value="factura">Factura</option>
                    <option value="nota_credito">Nota de Crédito</option>
                  </select>
                </div>
                <div className="border border-[#E0E0E0] rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left divide-y divide-[#E0E0E0]">
                      <thead className="bg-[#F8F9FB]">
                        <tr>
                          <th className="px-4 py-3 font-medium text-[#828282] uppercase text-xs tracking-wider">
                            Tipo documento
                          </th>
                          <th className="px-4 py-3 font-medium text-[#828282] uppercase text-xs tracking-wider">
                            Hora
                          </th>
                          <th className="px-4 py-3 font-medium text-[#828282] uppercase text-xs tracking-wider">
                            Folio
                          </th>
                          <th className="px-4 py-3 font-medium text-[#828282] uppercase text-xs tracking-wider">
                            Método de pago
                          </th>
                          <th className="px-4 py-3 font-medium text-[#828282] uppercase text-xs tracking-wider text-right">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-[#E0E0E0]">
                        {ventas.length > 0 ? (
                          ventas
                            .filter(
                              (v) =>
                                filterType === "all" ||
                                v.tipo_dte === filterType
                            )
                            .map((venta) => (
                              <tr key={venta.id} className="hover:bg-[#F8F9FB]">
                                <td className="px-4 py-2 whitespace-nowrap capitalize text-[#505050]">
                                  {venta.tipo_dte}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-[#505050]">
                                  {new Date(venta.fecha).toLocaleTimeString(
                                    "es-CL",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-[#505050]">
                                  {venta.folio}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap capitalize text-[#505050]">
                                  {venta.metodo_pago}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-right font-mono text-[#505050] font-semibold">
                                  {formatPrice(venta.total)}
                                </td>
                              </tr>
                            ))
                        ) : (
                          <tr>
                            <td
                              colSpan={5}
                              className="text-center py-8 text-gray-500"
                            >
                              No se realizaron ventas en este período.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <CierreCajaModal
        onClose={() => {
          setShowAuthorizeCloseModal(false);
        }}
        isOpen={showAuthorizeCloseModal}
        onSuccess={async () => {
          const montoFinal = parseFloat(montoFinalInput);
          const success = await closeCaja(montoFinal);
          if (!success) throw new Error("Error al cerrar la caja");
          await signOut();
          toast.success("✅ Caja cerrada exitosamente.");
          navigate("/login");
        }}
      />
    </>
  );
};
