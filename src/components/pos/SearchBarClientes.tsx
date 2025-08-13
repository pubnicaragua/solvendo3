import React, { Dispatch, SetStateAction, useState } from "react";
import { Search, Check, Plus } from "lucide-react";
import { usePOS } from "../../contexts/POSContext";
import { Cliente } from "../../lib/supabase";
import { TabId } from "../../pages/Dashboard";


interface SearchBarClientesProps {
    pick: (cliente: Cliente) => void;
    clientModule: boolean
    setIsCreating: React.Dispatch<SetStateAction<boolean>>
    handleCreateClient?: () => void
}

const SearchBarClientes: React.FC<SearchBarClientesProps> = ({
    pick,
    clientModule,
    setIsCreating,
    handleCreateClient,
}) => {
    const [clientsPanelSearch, setClientsPanelSearch] = useState("");

    const { clientes, currentCliente } = usePOS()

    const filtered = (clientes || []).filter((c) =>
        c.razon_social.toLowerCase().includes(clientsPanelSearch.toLowerCase())
    );

    const handleIsCreating = (bool: boolean) => {
        setIsCreating(bool)
        if (handleCreateClient) handleCreateClient()
    }

    return (
        <div>
            <div className="pb-5">
                <div className="flex items-center space-x-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            value={clientsPanelSearch}
                            onChange={(e) => setClientsPanelSearch(e.target.value)}
                            placeholder="Buscar cliente..."
                            className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    {!clientModule && (
                        <button
                            onClick={() => handleIsCreating(true)}
                            className="w-14 h-14 bg-blue-600 text-white rounded-lg flex items-center justify-center"
                        >
                            <Plus className="w-6 h-6" />
                        </button>
                    )}
                </div>

            </div>

            <ul className={`space-y-2 mt-3 ${clientModule ? "" : "max-h-[400px]"} overflow-y-auto border rounded-lg p-2 bg-white`}>
                {filtered.map((c) => (
                    <li
                        key={c.id}
                        onClick={() => pick(c)}
                        className={`p-3 border rounded hover:bg-gray-50 cursor-pointer flex justify-between items-center ${currentCliente?.id === c.id
                            ? "bg-blue-50 border-blue-200"
                            : "bg-white"
                            }`}
                    >
                        <div>
                            <span className="font-medium">{c.razon_social}</span>
                            <p className="text-xs text-gray-600">{c.rut}</p>
                        </div>
                        {currentCliente?.id === c.id ? (
                            <Check className="w-4 h-4 text-blue-600" />
                        ) : (
                            <Plus className="w-4 h-4 text-blue-600" />
                        )}
                    </li>
                ))}

                {!filtered.length && (
                    <li className="text-gray-500 text-center py-4">
                        {clientsPanelSearch
                            ? "Sin resultados"
                            : "Aquí aparecerán tus clientes"}
                    </li>
                )}
            </ul>
        </div >
    );
};

export default SearchBarClientes;
