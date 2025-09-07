import React, { useState } from "react";
import { toast } from "react-hot-toast";

interface BoletaModalProps {
    isOpen: boolean;
    onClose: () => void;
    clienteEmail?: string;
    onPrint: () => void;
}

const BoletaModal: React.FC<BoletaModalProps> = ({
    isOpen,
    onClose,
    clienteEmail = "",
    onPrint
}) => {
    const [email, setEmail] = useState(clienteEmail);

    if (!isOpen) return null;

    const handleSendEmail = () => {
        if (!email) {
            toast.error("Por favor ingresa un correo válido");
            return;
        }

        toast.success("Nota de crédito enviada por email");
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                <div className="p-6 text-center">
                    {/* Título */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Nota de crédito generada
                    </h3>
                    <p className="text-gray-600 mb-6">
                        Enviar por correo electrónico (Opcional)
                    </p>

                    {/* Campo de correo */}
                    <div className="flex mb-4">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={handleSendEmail}
                            className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700"
                        >
                            Enviar
                        </button>
                    </div>

                    {/* Botón imprimir */}
                    <button
                        onClick={onPrint}
                        className="w-full bg-blue-600 text-white py-3 mb-3 rounded-lg font-medium hover:bg-blue-700"
                    >
                        Imprimir
                    </button>

                    {/* Botón cerrar */}
                    <button
                        onClick={onClose}
                        className="w-full bg-gray-300 text-gray-800 py-3 rounded-lg font-medium hover:bg-gray-400"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BoletaModal;
