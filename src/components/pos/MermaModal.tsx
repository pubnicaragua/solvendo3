import React from "react";
import { X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import toast from "react-hot-toast";

interface MermaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCancel: () => void;
    selectedProducts: {
        venta_item_id: string;
        nombre: string;
        cantidad: number;
        precio_unitario: number;
    }[];
    motivo?: string;
}


const MermaModal: React.FC<MermaModalProps> = ({ isOpen, onClose, selectedProducts, onCancel }) => {
    if (!isOpen) return null;

    const handleConfirm = async () => {
        toast.success("Stock actualizado para los productos")
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">

                {/* Encabezado */}
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Reportar Mermas
                    </h3>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Contenido */}
                <div className="p-6">
                    <p className="text-gray-600 mb-4">
                        Estás a punto de reportar los siguientes productos como mermas:
                    </p>

                    <div className="max-h-60 overflow-y-auto space-y-2">
                        {selectedProducts.length === 0 ? (
                            <p className="text-gray-500 text-center">
                                No hay productos seleccionados.
                            </p>
                        ) : (
                            selectedProducts.map((product) => (
                                <div
                                    key={product.nombre}
                                    className="flex justify-between items-center p-2 bg-gray-50 rounded-lg border border-gray-200"
                                >
                                    <span className="text-gray-800 font-medium">
                                        {product.nombre}
                                    </span>
                                    <span className="text-gray-600">x{product.cantidad}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Botones de acción */}
                <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                        disabled={selectedProducts.length === 0}
                    >
                        Reportar Mermas
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MermaModal;
