import React, { useState } from "react";
import { Eye, EyeOff, Shield, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

interface AutorizacionCancelarVentaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export const AutorizacionCancelarVentaModal: React.FC<AutorizacionCancelarVentaModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
}) => {
    const [rut, setRut] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { authorizeCancelarVenta } = useAuth();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Intentando autorizar cancelación con RUT:", rut);

        if (!rut || !password) {
            toast.error("Por favor ingresa RUT y contraseña");
            return;
        }

        setLoading(true);
        setError("");

        const result = await authorizeCancelarVenta(rut, password);

        if (!result.success) {
            console.warn("Autorización fallida:", result.message);
            setError(result.message);
            setLoading(false);
            return;
        }

        console.log("Autorización completada. Usuario autorizado:", result.usuario);

        if (onSuccess) {
            console.log("Ejecutando acción onSuccess...");
            onSuccess();
        }

        onClose();
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 relative">

                {/* Botón cerrar */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                >
                    <X size={22} />
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                        Autorizar Cancelación
                    </h2>
                    <p className="text-gray-600 text-sm">
                        Ingresa credenciales del supervisor para cancelar la venta
                    </p>
                </div>

                {/* Formulario */}
                <form className="space-y-5" onSubmit={handleAuth}>
                    {/* RUT */}
                    <div>
                        <label
                            htmlFor="rut"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            RUT del Supervisor
                        </label>
                        <input
                            id="rut"
                            name="rut"
                            type="text"
                            required
                            value={rut}
                            onChange={(e) => setRut(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="XX.XXX.XXX-X"
                        />
                    </div>

                    {/* Contraseña */}
                    <div className="relative">
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Contraseña
                        </label>
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Contraseña del supervisor"
                        />
                        <button
                            type="button"
                            className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>

                    {/* Mensaje de error */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    {/* Botones */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-1/2 border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                        >
                            <Shield className="w-5 h-5 mr-2" />
                            {loading ? "Autorizando..." : "Autorizar"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
