import { AlertCircle, PlayCircle } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Usuario, AperturaCaja, Caja, supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { usePOS } from "../../contexts/POSContext";
import { useUserPermissions } from "../../hooks/usePermissions";

function AbrirCajaModal() {
  const { user, empresaId, sucursalId, authorized } = useAuth();
  const { hasPermission, PERMISOS } = useUserPermissions();
  const { openCaja, currentAperturaCaja, loading: isLoading } = usePOS();

  const [montoInicialApertura, setMontoInicialApertura] = useState("");
  const [cajasDisponibles, setCajasDisponibles] = useState<Caja[]>([]);
  const [cajaSeleccionada, setCajaSeleccionada] = useState<string>("");

  // Cargar cajas disponibles de la empresa
  useEffect(() => {
    if (!empresaId) return;

    const fetchCajas = async () => {
      try {
        const { data, error } = await supabase
          .from("cajas")
          .select("*")
          .eq("empresa_id", empresaId)
          .eq("sucursal_id", sucursalId)
          .eq("activo", true);

        if (error) {
          toast.error("Error cargando cajas disponibles");
          setCajasDisponibles([]);
          return;
        }

        setCajasDisponibles(data ?? []);
        if (data && data.length > 0 && !cajaSeleccionada) {
          setCajaSeleccionada(data[0].id);
        }
      } catch (error) {
        console.error("Error fetching cajas:", error);
        toast.error("Error cargando cajas disponibles");
        setCajasDisponibles([]);
      }
    };

    fetchCajas();
  }, [empresaId, supabase, cajaSeleccionada]);

  // Abrir caja, validando usuario y campos
  const handleOpenCash = async () => {
    if (!user) {
      toast.error("Usuario no autenticado. Por favor inicia sesión.");
      return;
    }

    if (!empresaId) {
      toast.error("Empresa no identificada.");
      return;
    }

    if (!sucursalId) {
      toast.error("Sucursal no identificada.");
      return;
    }

    if (!hasPermission(PERMISOS.AbrirCaja) && !authorized) {
      toast.error("No cuentas con permiso para abrir cajas");
      return;
    }

    if (
      montoInicialApertura === "" ||
      isNaN(parseFloat(montoInicialApertura)) ||
      parseFloat(montoInicialApertura) < 0
    ) {
      toast.error("Debes ingresar un monto inicial válido");
      return;
    }

    if (!cajaSeleccionada) {
      toast.error("Debes seleccionar una caja para abrir");
      return;
    }

    try {
      // 1️⃣ Verificar si ya existe una sesión abierta para la caja seleccionada
      const { data: sesionesAbiertas, error } = await supabase
        .from("sesiones_caja")
        .select("id")
        .eq("caja_id", cajaSeleccionada)
        .eq("estado", "abierta")
        .limit(1);

      if (error) {
        console.error("Error verificando sesión de caja:", error);
        toast.error("No se pudo verificar el estado de la caja.");
        return;
      }

      if (sesionesAbiertas && sesionesAbiertas.length > 0) {
        toast.error("La caja seleccionada ya tiene una sesión abierta.");
        return;
      }

      // 2️⃣ Abrir la caja
      const success = await openCaja(
        parseFloat(montoInicialApertura),
        cajaSeleccionada,
        empresaId,
        sucursalId,
        user.id
      );

      if (success) {
        toast.success("Caja abierta exitosamente. Puedes comenzar a trabajar.");
        setMontoInicialApertura("");
      }
    } catch (err) {
      console.error("Error al abrir caja:", err);
      toast.error("Ocurrió un error al intentar abrir la caja.");
    }
  };

  const isFormValid =
    montoInicialApertura &&
    !isNaN(parseFloat(montoInicialApertura)) &&
    parseFloat(montoInicialApertura) >= 0 &&
    cajaSeleccionada;

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
          <input
            type="number"
            id="montoInicialApertura"
            className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            value={montoInicialApertura}
            onChange={(e) => setMontoInicialApertura(e.target.value)}
            placeholder="0"
            min="0"
            step="0.01"
            disabled={isLoading}
          />
        </div>

        <div className="mb-6 text-left">
          <label
            htmlFor="selectCaja"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Selecciona una caja
          </label>
          <select
            id="selectCaja"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={cajaSeleccionada}
            onChange={(e) => setCajaSeleccionada(e.target.value)}
            disabled={isLoading}
          >
            <option value="">-- Seleccionar caja --</option>
            {cajasDisponibles.map((caja) => (
              <option key={caja.id} value={caja.id}>
                {caja.nombre}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleOpenCash}
          disabled={!isFormValid || isLoading}
          className="w-full flex justify-center items-center p-8 mt-6 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-base shadow-sm"
        >
          <PlayCircle className="w-5 h-5 mr-2" />
          {isLoading ? "Abriendo caja..." : "Abrir Caja"}
        </button>
      </div>
    </div>
  );
}

export default AbrirCajaModal;
