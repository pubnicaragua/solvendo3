import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePOS } from "../../contexts/POSContext";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

interface CashRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  type: "open" | "close";
}

export const CashRegisterModal: React.FC<CashRegisterModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  type,
}) => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const { openCaja } = usePOS();
  const { user, sucursalId } = useAuth();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Ingrese un monto válido");
      return;
    }

    if (!user) {
      toast.error("Usuario no válido");
      return;
    }

    setLoading(true);

    try {
      // Llamar directamente a openCaja sin necesidad de cajaId
      const success = await openCaja(parseFloat(amount));
      if (success) {
        toast.success("Caja aperturada correctamente");
        if (onSuccess) {
          onSuccess();
        }
        onClose();
        // Navegar al dashboard principal después de abrir la caja
        navigate("/");
      }
    } catch (error) {
      console.error("Error opening cash register:", error);
      toast.error("Error al abrir caja");
    } finally {
      setLoading(false);
    }
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-full w-full h-full flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 flex flex-col justify-center">
                <div className="h-0.5 bg-gray-600 mb-1"></div>
                <div className="h-0.5 bg-gray-600 mb-1"></div>
                <div className="h-0.5 bg-gray-600"></div>
              </div>
              <span className="text-lg font-semibold text-gray-900">POS</span>
            </div>
          </div>

          <div className="flex items-center justify-center flex-1">
            {/* SVG logo aquí - mantengo el mismo */}
            <svg
              className="w-32 h-8"
              viewBox="0 0 195 42"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* ... mismo contenido SVG ... */}
            </svg>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{getCurrentTime()}</span>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.email?.substring(0, 2).toUpperCase() || "U"}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {user?.email || "Usuario"}
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Efectivo inicial
            </h3>
            <p className="text-gray-600 mb-6">Ingresar efectivo</p>

            <div className="mb-6">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 text-center text-lg border-2 border-blue-200 rounded-full focus:outline-none focus:border-blue-500 transition-colors"
                autoFocus
                min="0"
                step="1"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={!amount || loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors h-12"
            >
              {loading ? "Procesando..." : "Aperturar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
