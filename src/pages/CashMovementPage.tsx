import React, { useState, useEffect } from "react";
import { DollarSign, X as XIcon } from "lucide-react";
import { HeaderWithMenu } from "../components/common/HeaderWithMenu";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";

interface Movement {
  id: number;
  tipo: "ingreso" | "retiro";
  monto: number;
  observacion: string | null;
  created_at: string;
}

interface AperturaCaja {
  id: string;
  caja_id: string;
  usuario_id: string;
  fecha_apertura: string;
  monto_inicial: number;
  estado: "abierta" | "cerrada";
  usuarios?: {
    nombre: string;
    apellidos: string;
  };
}

export const CashMovementPage: React.FC<{ onClose: () => void }> = ({
  onClose,
}) => {
  const { user, empresaId } = useAuth();
  const today = new Date().toISOString().split("T")[0];

  const [aperturasDisponibles, setAperturasDisponibles] = useState<
    AperturaCaja[]
  >([]);
  const [aperturaSeleccionada, setAperturaSeleccionada] = useState("");
  const [fecha, setFecha] = useState(today);
  const [tipo, setTipo] = useState<"retiro" | "ingreso">("retiro");
  const [monto, setMonto] = useState("");
  const [obs, setObs] = useState("");
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAperturas, setLoadingAperturas] = useState(true);

  // Cargar aperturas de caja desde la base de datos
  useEffect(() => {
    const loadAperturas = async () => {
      if (!empresaId) {
        setLoadingAperturas(false);
        return;
      }

      try {
        setLoadingAperturas(true);
        // Consultar todas las aperturas de caja para esta empresa
        const { data, error } = await supabase
          .from("aperturas_caja")
          .select(
            `  
            id,  
            caja_id,  
            usuario_id,  
            fecha_apertura,  
            monto_inicial,  
            estado,  
            usuarios (  
              nombre,  
              apellidos  
            )  
          `
          )
          .eq("empresa_id", empresaId)
          .order("fecha_apertura", { ascending: false });

        if (error) {
          console.error("Error loading aperturas:", error);
          toast.error("Error al cargar las aperturas de caja");
          return;
        }

        if (data && data.length > 0) {
          setAperturasDisponibles(data);
          // Seleccionar la apertura más reciente por defecto
          setAperturaSeleccionada(data[0].id);
        } else {
          toast.info("No se encontraron aperturas de caja para esta empresa");
          setAperturasDisponibles([]);
          setAperturaSeleccionada("");
        }
      } catch (error) {
        console.error("Error loading aperturas:", error);
        toast.error("Error al cargar las aperturas de caja");
        setAperturasDisponibles([]);
        setAperturaSeleccionada("");
      } finally {
        setLoadingAperturas(false);
      }
    };

    loadAperturas();
  }, [empresaId]);

  useEffect(() => {
    if (aperturaSeleccionada) {
      loadMovements();
    }
  }, [fecha, aperturaSeleccionada]);

  const loadMovements = async () => {
    if (!aperturaSeleccionada) return;

    setLoading(true);
    try {
      // Filtrar movimientos por apertura_caja_id y fecha
      const { data, error } = await supabase
        .from("movimientos_caja")
        .select("*")
        .eq("fecha", fecha)
        .eq("apertura_caja_id", aperturaSeleccionada)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading movements:", error);
        toast.error("Error al cargar los movimientos");
        setMovements([]);
      } else {
        setMovements(data || []);
      }
    } catch (error) {
      console.error("Error loading movements:", error);
      toast.error("Error al cargar los movimientos");
      setMovements([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const montoNumber = Math.max(0, Number(monto) || 0);
    if (!user || montoNumber <= 0) {
      toast.error("El monto debe ser mayor a 0");
      return;
    }

    if (!aperturaSeleccionada) {
      toast.error("Debe seleccionar una apertura de caja");
      return;
    }

    setLoading(true);
    try {
      // Verificar que la apertura seleccionada esté abierta
      const aperturaActual = aperturasDisponibles.find(
        (a) => a.id === aperturaSeleccionada
      );
      if (!aperturaActual || aperturaActual.estado !== "abierta") {
        toast.error("Solo se pueden realizar movimientos en cajas abiertas");
        return;
      }

      const { error: insertError } = await supabase
        .from("movimientos_caja")
        .insert({
          apertura_caja_id: aperturaSeleccionada,
          usuario_id: user.id,
          empresa_id: empresaId,
          tipo,
          monto: montoNumber,
          observacion: obs || null,
          fecha,
        });

      if (insertError) {
        console.error("Error inserting movement:", insertError);
        toast.error("Error al guardar el movimiento");
        return;
      }

      toast.success("Movimiento registrado exitosamente");
      // Reset form y recarga
      setMonto("");
      setObs("");
      loadMovements();
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      toast.error("Error al procesar el movimiento");
    } finally {
      setLoading(false);
    }
  };

  // Función para formatear la fecha a 'DD/MM/YYYY'
  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };

  // Función para generar nombre descriptivo de la apertura
  const getAperturaDisplayName = (apertura: AperturaCaja) => {
    const fecha = new Date(apertura.fecha_apertura).toLocaleDateString("es-CL");
    const usuario = apertura.usuarios
      ? `${apertura.usuarios.nombre} ${apertura.usuarios.apellidos}`
      : "Usuario";
    const estado = apertura.estado === "abierta" ? "🟢" : "🔴";
    return `${estado} ${fecha} - ${usuario} (${apertura.caja_id})`;
  };

  if (loadingAperturas) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <DollarSign className="mx-auto h-12 w-12 text-blue-500 animate-pulse" />
          <h2 className="mt-4 text-xl font-semibold text-gray-700">
            Cargando aperturas de caja...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <HeaderWithMenu
        title="Movimiento de efectivo"
        icon={<DollarSign className="w-6 h-6 text-gray-600" />}
        showClock
        userName={user?.nombre || "Usuario"}
        userAvatarUrl={user?.avatar_url}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL - 60% */}
        <div className="w-3/5 bg-white p-6 flex flex-col justify-between">
          <form className="grid grid-cols-[auto,1fr] gap-x-6 gap-y-6">
            {/* Selector de apertura de caja dinámico */}
            <label className="text-sm font-medium text-gray-700">
              Apertura de Caja
            </label>
            <select
              value={aperturaSeleccionada}
              onChange={(e) => setAperturaSeleccionada(e.target.value)}
              className="h-12 px-4 bg-gray-50 border border-gray-200 rounded-lg"
              disabled={aperturasDisponibles.length === 0}
            >
              {aperturasDisponibles.length === 0 ? (
                <option value="">No hay aperturas de caja disponibles</option>
              ) : (
                aperturasDisponibles.map((apertura) => (
                  <option key={apertura.id} value={apertura.id}>
                    {getAperturaDisplayName(apertura)}
                  </option>
                ))
              )}
            </select>

            {/* Fecha movimiento */}
            <label className="text-sm font-medium text-gray-700">
              Fecha movimiento
            </label>
            <div className="relative">
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full h-12 pl-4 pr-2 bg-gray-50 border border-gray-200 rounded-lg"
              />
            </div>

            {/* Tipo de movimiento */}
            <label className="text-sm font-medium text-gray-700">
              Tipo de movimiento
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as any)}
              className="h-12 px-4 bg-gray-50 border border-gray-200 rounded-lg"
            >
              <option value="retiro">Retiro de efectivo</option>
              <option value="ingreso">Ingreso de efectivo</option>
            </select>

            {/* Monto movimiento */}
            <label className="text-sm font-medium text-gray-700">
              Monto movimiento
            </label>
            <input
              type="number"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="0"
              className="h-12 px-4 bg-gray-50 border border-gray-200 rounded-lg"
            />

            {/* Observación */}
            <label className="text-sm font-medium text-gray-700">
              Observación
            </label>
            <textarea
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder="Escribe tu observación..."
              className="w-full h-32 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg resize-none"
            />
          </form>

          {/* Botones pie */}
          <div className="flex items-center justify-between pt-6">
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              <XIcon className="w-4 h-4" /> Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || Number(monto) <= 0 || !aperturaSeleccionada}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>

        {/* RIGHT PANEL - 40% */}
        <div className="w-2/5 bg-gray-50 p-6 flex flex-col overflow-auto">
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <span className="text-lg font-semibold text-blue-600">
                Movimientos disponibles
              </span>
            </div>

            {/* Información de la apertura seleccionada */}
            <div className="grid grid-cols-[auto,1fr] items-center gap-x-4">
              <span className="text-sm text-gray-700">
                Apertura seleccionada
              </span>
              <div className="bg-gray-200 p-3 rounded-lg text-sm text-gray-800">
                {aperturasDisponibles.find((a) => a.id === aperturaSeleccionada)
                  ?.caja_id || "No seleccionada"}
              </div>
            </div>

            {/* Fecha movimiento */}
            <div className="grid grid-cols-[auto,1fr] items-center gap-x-4">
              <span className="text-sm text-gray-700">Fecha movimiento</span>
              <div className="bg-gray-200 p-3 rounded-lg text-sm text-gray-800">
                {formatDate(fecha)}
              </div>
            </div>

            {/* Contador de registros */}
            <div className="text-gray-700 text-sm mt-2">
              {movements.length === 0
                ? "Sin registros"
                : `${movements.length} registros`}
            </div>
          </div>

          <hr className="border-t border-gray-200 my-6" />

          {/* Lista de movimientos */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">
                  Cargando movimientos...
                </p>
              </div>
            ) : movements.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No hay movimientos para esta fecha</p>
              </div>
            ) : (
              movements.map((m) => (
                <div
                  key={m.id}
                  className="bg-white p-4 rounded-lg border border-gray-200"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium capitalize">
                      {m.tipo}
                    </span>
                    <span className="text-sm font-semibold">
                      {m.tipo === "ingreso" ? "+" : "-"}${m.monto}
                    </span>
                  </div>
                  {m.observacion && (
                    <p className="text-xs text-gray-600 mt-2">
                      {m.observacion}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
