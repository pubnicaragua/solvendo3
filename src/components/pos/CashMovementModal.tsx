import React, { useState } from "react";
import { TrendingUp, X, Calendar } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import toast from "react-hot-toast";

interface CashMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CashMovementModal: React.FC<CashMovementModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [movementType, setMovementType] = useState<"ingreso" | "retiro">(
    "retiro"
  );
  const [amount, setAmount] = useState("");
  const [observation, setObservation] = useState("Escribe tu observación...");
  const [loading, setLoading] = useState(false);
  const [movements, setMovements] = useState<any[]>([]);
  const { user, empresaId, sucursalId } = useAuth();

  const today = new Date().toISOString().split("T")[0];

  React.useEffect(() => {
    if (isOpen) {
      loadMovements();
    }
  }, [isOpen]);

  const loadMovements = async () => {
    if (!empresaId) return;

    try {
      const { data, error } = await supabase
        .from("movimientos_caja")
        .select("*")
        .eq("fecha::date", today)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMovements(data || []);
    } catch (error) {
      console.error("Error loading movements:", error);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (
      !amount ||
      parseFloat(amount) <= 0 ||
      !empresaId ||
      !sucursalId ||
      !user
    ) {
      toast.error("Ingrese un monto válido");
      return;
    }

    setLoading(true);

    try {
      // Get current apertura_caja
      const { data: apertura, error: aperturaError } = await supabase
        .from("aperturas_caja")
        .select("*")
        .eq("usuario_id", user.id)
        .eq("estado", "abierta")
        .single();

      if (aperturaError || !apertura) {
        throw new Error("No hay caja abierta");
      }

      // Registrar el movimiento
      const { error } = await supabase.from("movimientos_caja").insert({
        apertura_caja_id: apertura.id,
        usuario_id: user.id,
        tipo: movementType,
        monto: parseFloat(amount),
        observacion:
          observation === "Escribe tu observación..." ? "" : observation,
      });

      if (error) throw error;

      toast.success(
        `${
          movementType === "ingreso" ? "Ingreso" : "Retiro"
        } registrado correctamente`
      );
      loadMovements();
      onClose();
      setAmount("");
      setObservation("Escribe tu observación...");
    } catch (error) {
      console.error("Error registering cash movement:", error);
      toast.error("Error al registrar movimiento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">
              Movimiento de efectivo
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Panel - Form */}
          <div className="w-1/2 p-6 bg-white">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de caja
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option>Caja N°1</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha movimiento
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    defaultValue="2025-05-19"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <Calendar className="w-5 h-5 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de movimiento
                </label>
                <select
                  value={movementType}
                  onChange={(e) =>
                    setMovementType(e.target.value as "ingreso" | "retiro")
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="retiro">Retiro de efectivo</option>
                  <option value="ingreso">Ingreso de efectivo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto movimiento
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observación
                </label>
                <textarea
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg h-20 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                onClick={handleSubmit}
                disabled={!amount || parseFloat(amount) <= 0}
              >
                {loading ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>

          {/* Right Panel - Available Movements */}
          <div className="w-1/2 p-6 bg-gray-50 border-l border-gray-200">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Movimientos disponibles
                </span>
              </div>
              <span className="text-sm font-medium text-blue-800">
                Movimientos disponibles ({movements.length})
              </span>
              <div className="text-xs text-blue-600">
                Fecha movimiento: 19/05/2025
              </div>
              <div className="text-xs text-blue-600">
                Fecha movimiento: {today}
              </div>
              <div className="text-xs text-blue-600 mt-1">
                {movements.length === 0
                  ? "Sin registros"
                  : `${movements.length} movimientos`}
              </div>
            </div>

            {movements.length > 0 && (
              <div className="mt-4 space-y-2">
                {movements.map((movement) => (
                  <div
                    key={movement.id}
                    className="bg-white p-3 rounded-lg border"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium capitalize">
                        {movement.tipo}
                      </span>
                      <span className="text-sm font-semibold">
                        {movement.tipo === "ingreso" ? "+" : "-"}$
                        {movement.monto}
                      </span>
                    </div>
                    {movement.observacion && (
                      <p className="text-xs text-gray-600 mt-1">
                        {movement.observacion}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
