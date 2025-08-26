import { AlertCircle, Save } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { usePOS } from "../../contexts/POSContext";

function AsignarSaldoInicialModal() {
    const { user } = useAuth();
    const { currentAperturaCaja, setCurrentAperturaCaja } = usePOS();

    const [montoInicial, setMontoInicial] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    if (!currentAperturaCaja) {
        return null; // seguridad: no debería mostrarse si no hay sesión abierta
    }

    const handleAsignarSaldo = async () => {
        if (!user) {
            toast.error("Usuario no autenticado.");
            return;
        }

        if (
            montoInicial === "" ||
            isNaN(parseFloat(montoInicial)) ||
            parseFloat(montoInicial) < 0
        ) {
            toast.error("Debes ingresar un monto inicial válido");
            return;
        }

        try {
            setIsLoading(true);

            const { error } = await supabase
                .from("sesiones_caja")
                .update({ saldo_inicial: parseFloat(montoInicial), inicializada: true })
                .eq("id", currentAperturaCaja.id);

            if (error) {
                console.error("Error al asignar saldo inicial:", error);
                toast.error("No se pudo asignar el saldo inicial.");
                return;
            }

            toast.success("Saldo inicial asignado correctamente ✅");

            // actualizar en contexto
            setCurrentAperturaCaja({
                ...currentAperturaCaja,
                saldo_inicial: parseFloat(montoInicial),
                inicializada: true
            });

            setMontoInicial("");
        } catch (err) {
            console.error("Error en handleAsignarSaldo:", err);
            toast.error("Ocurrió un error al intentar asignar el saldo.");
        } finally {
            setIsLoading(false);
        }
    };

    const isFormValid =
        montoInicial &&
        !isNaN(parseFloat(montoInicial)) &&
        parseFloat(montoInicial) >= 0;

    return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <div className="text-center bg-white p-8 rounded-lg shadow-md w-full max-w-sm mx-4">
                <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />

                <h2 className="mt-4 text-xl font-semibold text-gray-800">
                    Caja sin saldo inicial
                </h2>

                <p className="mt-2 text-gray-600 mb-6">
                    Ingresa un monto inicial para comenzar a operar.
                </p>

                <div className="mb-6 text-left">
                    <label
                        htmlFor="montoInicial"
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
                        Monto Inicial
                    </label>
                    <input
                        type="number"
                        id="montoInicial"
                        className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        value={montoInicial}
                        onChange={(e) => setMontoInicial(e.target.value)}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        disabled={isLoading}
                    />
                </div>

                <button
                    onClick={handleAsignarSaldo}
                    disabled={!isFormValid || isLoading}
                    className="w-full flex justify-center items-center p-8 mt-6 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-base shadow-sm"
                >
                    <Save className="w-5 h-5 mr-2" />
                    {isLoading ? "Guardando..." : "Asignar Saldo Inicial"}
                </button>
            </div>
        </div>
    );
}

export default AsignarSaldoInicialModal;
