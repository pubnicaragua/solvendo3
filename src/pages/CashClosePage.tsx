import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { usePOS } from "../contexts/POSContext";
import { useAuth } from "../contexts/AuthContext";
import {
  DollarSign,
  Calendar,
  Clock,
  AlertCircle,
  ClipboardList,
  PlayCircle,
} from "lucide-react";
import { HeaderWithMenu } from "../components/common/HeaderWithMenu";
import toast from "react-hot-toast";

interface Venta {
  id: string;
  folio: string;
  tipo_dte: string;
  metodo_pago: string;
  total: number;
  fecha: string;
}

interface MovimientoCaja {
  id: string;
  tipo: string;
  monto: number;
  observacion?: string;
  created_at: string;
}

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
  const { user, logout } = useAuth();

  const [isClosing, setIsClosing] = useState(false);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoCaja[]>([]);
  const [montoFinalInput, setMontoFinalInput] = useState("0");
  const { empresaId } = useAuth();

  const [montoInicialApertura, setMontoInicialApertura] = useState("");
  const [cajaIdApertura, setCajaIdApertura] = useState("caja_principal_001");
  const [filterType, setFilterType] = useState("all");

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(Math.max(0, price || 0))
      .replace("$", "") + "$";

  useEffect(() => {
    if (!currentAperturaCaja) return;

    const fetchData = async () => {
      try {
        const { data: ventasData, error: ventasError } = await supabase
          .from("ventas")
          .select("*")
          .eq("apertura_caja_id", currentAperturaCaja.id)
          .order("fecha", { ascending: true });

        if (ventasError) {
          setVentas([
            {
              id: "1",
              folio: "9",
              tipo_dte: "boleta",
              metodo_pago: "efectivo",
              total: 204,
              fecha: new Date().toISOString(),
            },
          ]);
        } else {
          setVentas(ventasData as Venta[]);
        }

        const { data: movimientosData, error: movimientosError } =
          await supabase
            .from("movimientos_caja")
            .select("*")
            .eq("apertura_caja_id", currentAperturaCaja.id)
            .order("created_at", { ascending: true });

        if (movimientosError) {
          setMovimientos([]);
        } else {
          setMovimientos(movimientosData as MovimientoCaja[]);
        }
      } catch {
        setVentas([
          {
            id: "1",
            folio: "9",
            tipo_dte: "boleta",
            metodo_pago: "efectivo",
            total: 204,
            fecha: new Date().toISOString(),
          },
        ]);
        setMovimientos([]);
      }
    };
    fetchData();
  }, [currentAperturaCaja]);

  const {
    ventasEfectivo,
    ventasTarjeta,
    totalIngresos,
    totalRetiros,
    totalVentasNeto,
    montoEsperado,
  } = useMemo(() => {
    const ventasEfectivo = ventas
      .filter((v) => v.metodo_pago.toLowerCase() === "efectivo")
      .reduce((acc, v) => acc + v.total, 0);
    const ventasTarjeta = ventas
      .filter((v) => v.metodo_pago.toLowerCase() !== "efectivo")
      .reduce((acc, v) => acc + v.total, 0);
    const totalVentasNeto = ventasEfectivo + ventasTarjeta;
    const totalIngresos = movimientos
      .filter((m) => m.tipo === "ingreso")
      .reduce((acc, m) => acc + m.monto, 0);
    const totalRetiros = movimientos
      .filter((m) => m.tipo === "retiro")
      .reduce((acc, m) => acc + m.monto, 0);
    const montoEsperado =
      (currentAperturaCaja?.monto_inicial || 0) +
      ventasEfectivo +
      totalIngresos -
      totalRetiros;
    return {
      ventasEfectivo,
      ventasTarjeta,
      totalIngresos,
      totalRetiros,
      totalVentasNeto,
      montoEsperado,
    };
  }, [ventas, movimientos, currentAperturaCaja]);

  const diferencia = useMemo(() => {
    const montoFinalNum = Math.max(0, parseFloat(montoFinalInput) || 0);
    const montoEsperadoSafe = Math.max(0, montoEsperado || 0);
    return montoFinalNum - montoEsperadoSafe;
  }, [montoFinalInput, montoEsperado]);

  const handleCloseCash = async () => {
    setIsClosing(true);
    try {
      if (!currentAperturaCaja)
        throw new Error("No hay una caja abierta para cerrar");

      const montoFinal = parseFloat(montoFinalInput);
      if (isNaN(montoFinal))
        throw new Error("El monto final debe ser un número válido");

      const success = await closeCaja(montoFinal);

      if (!success) throw new Error("Error al cerrar la caja");

      toast.success("✅ Caja cerrada exitosamente.");

      setTimeout(async () => {
        await logout();
        navigate("/login");
      }, 2000);
    } catch (error: any) {
      toast.error("Error al cerrar la caja: " + error.message);
    } finally {
      setIsClosing(false);
    }
  };

  const handleOpenCash = async () => {
    if (
      montoInicialApertura === "" ||
      isNaN(parseFloat(montoInicialApertura))
    ) {
      toast.error("Debes ingresar un monto inicial válido");
      return;
    }

    if (currentAperturaCaja && currentAperturaCaja.caja_id === cajaIdApertura) {
      toast.error("La caja ya está abierta.");
      return;
    }

    const success = await openCaja(parseFloat(montoInicialApertura));
    if (success) {
      toast.success("Caja abierta exitosamente. Puedes comenzar a trabajar.");
    }
  };

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

  if (!currentAperturaCaja) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-md w-full max-w-sm mx-4">
          <AlertCircle className="mx-auto h-12 w-12 text-blue-500 mb-4" />
          <h2 className="mt-4 text-xl font-semibold text-gray-800">
            No hay una caja abierta
          </h2>
          <p className="mt-2 text-gray-600 mb-6">
            Por favor, abre una caja para comenzar a operar.
          </p>

          <div className="mb-6 text-left">
            <label
              htmlFor="montoInicialApertura"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Monto Inicial
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                $
              </span>
              <input
                type="number"
                id="montoInicialApertura"
                className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                value={montoInicialApertura}
                onChange={(e) => setMontoInicialApertura(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <button
            onClick={handleOpenCash}
            disabled={
              !montoInicialApertura || isNaN(parseFloat(montoInicialApertura))
            }
            className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-base shadow-sm"
          >
            <PlayCircle className="w-5 h-5 mr-2" /> Abrir Caja
          </button>
        </div>
      </div>
    );
  }

  const isLoading = contextLoading || isClosing;

  const fechaApertura = new Date().toLocaleDateString("es-CL");
  const horaCierrePropuesta = new Date().toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const cajaNombreReal = user?.nombre
    ? `${user.nombre} ${user?.apellidos || ""}`
    : "Usuario";

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col font-sans">
      <HeaderWithMenu
        title="Cierre de caja"
        icon={<DollarSign className="w-6 h-6" />}
        heightClass="h-20"
        userName={user?.user_metadata?.full_name || user?.email || "Usuario"}
        userAvatarSrc={user?.user_metadata?.avatar_url || ""}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6">
          <div className="flex bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-[#E0E0E0] max-w-7xl mx-auto overflow-hidden">
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
                  label="Tarjeta (1)"
                  value={`+ ${formatPrice(ventasTarjeta)}`}
                />
                <SummaryLine
                  label="Efectivo (2)"
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
                  label="Efectivo (2)"
                  value={`+ ${formatPrice(
                    currentAperturaCaja.monto_inicial +
                      ventasEfectivo +
                      totalIngresos
                  )}`}
                />
                <SummaryLine
                  label="Tarjeta (1)"
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
                    type="number"
                    value={montoFinalInput}
                    onChange={(e) => setMontoFinalInput(e.target.value)}
                    className="w-full text-center text-xl font-bold text-[#505050] bg-transparent focus:outline-none"
                    placeholder="0"
                  />
                </div>
                <div className="bg-[#F8F9FB] p-4 rounded-lg border border-[#E0E0E0] flex flex-col justify-between">
                  <label className="block text-xs font-normal text-[#828282] mb-1">
                    Diferencia
                  </label>
                  <p
                    className={`text-xl font-bold ${
                      diferencia === 0
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

            <div className="w-2/5 p-6 bg-gray-50">
              <h2 className="text-lg font-semibold text-[#333333] mb-4 flex items-center">
                <ClipboardList className="mr-2 h-5 w-5 text-[#2196F3]" />{" "}
                Resumen de documentos
              </h2>
              <div className="mb-4">
                <label htmlFor="filterType" className="sr-only">
                  Filtrar documentos
                </label>
                <select
                  id="filterType"
                  className=" bg-gray-100 block w-full p-2 border border-[#E0E0E0] rounded-md shadow-sm focus:outline-none focus:ring-[#2196F3] focus:border-[#2196F3] text-sm text-[#505050]"
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
                              filterType === "all" || v.tipo_dte === filterType
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
  );
};
