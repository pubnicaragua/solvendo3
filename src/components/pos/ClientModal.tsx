import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { usePOS } from "../../contexts/POSContext";
import { Cliente } from "../../lib/supabase";

interface ClientFormData {
  razon_social: string;
  rut: string;
  direccion: string;
  comuna: string;
  ciudad: string;
  giro: string;
  telefono: string;
  email: string;
  contacto: string;
  nombres: string;
  apellidos: string;
  clienteExtranjero: string;
}

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientSelect: (cliente: Cliente | null) => void;
}

export const ClientModal: React.FC<ClientModalProps> = ({
  isOpen,
  onClose,
  onClientSelect,
}) => {
  const [clientType, setClientType] = useState<"empresa" | "persona">(
    "empresa"
  );
  const [loading, setLoading] = useState(false);
  const { crearCliente } = usePOS();

  const [newClient, setNewClient] = useState<ClientFormData>({
    razon_social: "",
    rut: "",
    direccion: "",
    comuna: "",
    ciudad: "",
    giro: "",
    telefono: "",
    email: "",
    contacto: "",
    nombres: "",
    apellidos: "",
    clienteExtranjero: "No",
  });

  // Clear dependent fields when client type changes
  useEffect(() => {
    if (clientType === "empresa") {
      setNewClient((prev) => ({
        ...prev,
        nombres: "",
        apellidos: "",
      }));
    } else {
      setNewClient((prev) => ({
        ...prev,
        razon_social: "",
        giro: "",
      }));
    }
  }, [clientType]);

  const handleCreateClient = async () => {
    const clienteParaEnviar: Partial<ClientFormData> = { ...newClient };

    if (clientType === "persona") {
      clienteParaEnviar.razon_social = `${newClient.nombres || ""} ${
        newClient.apellidos || ""
      }`.trim();
      delete clienteParaEnviar.giro;
    } else {
      delete clienteParaEnviar.nombres;
      delete clienteParaEnviar.apellidos;
    }

    // Validación básica
    if (
      clientType === "empresa" &&
      (!clienteParaEnviar.razon_social || !clienteParaEnviar.rut)
    ) {
      alert(
        'Para clientes de tipo "Empresa", Razón Social y RUT son obligatorios.'
      );
      return;
    } else if (
      clientType === "persona" &&
      (!newClient.nombres || !newClient.apellidos || !newClient.rut)
    ) {
      alert(
        'Para clientes de tipo "Persona", Nombres, Apellidos y RUT son obligatorios.'
      );
      return;
    }

    setLoading(true);
    try {
      const result = await crearCliente(clienteParaEnviar as any);

      if (result.success && result.data) {
        onClientSelect(result.data as unknown as Cliente);
        onClose();
      } else {
        const errorMessage =
          result.error &&
          typeof result.error === "object" &&
          "message" in result.error
            ? (result.error as { message: string }).message
            : "Error desconocido al crear el cliente";

        alert(`Error: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Error al crear cliente:", error);
      const errorMsg =
        error instanceof Error ? error.message : "Error desconocido";
      alert(`Error inesperado: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleClientTypeChange = (type: "empresa" | "persona") => {
    setClientType(type);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">
            Registrar nuevo cliente
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-grow">
          {/* Tipo de Cliente */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Tipo de Cliente
            </h4>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="clientType"
                  value="empresa"
                  checked={clientType === "empresa"}
                  onChange={() => handleClientTypeChange("empresa")}
                  className="text-blue-600"
                />
                <span>Empresa</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="clientType"
                  value="persona"
                  checked={clientType === "persona"}
                  onChange={() => handleClientTypeChange("persona")}
                  className="text-blue-600"
                />
                <span>Persona</span>
              </label>
            </div>
          </div>

          {/* Campos del formulario */}
          <div className="grid grid-cols-1 gap-4">
            {/* Cliente Extranjero */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cliente Extranjero
              </label>
              <select
                value={newClient.clienteExtranjero}
                onChange={(e) =>
                  setNewClient((prev) => ({
                    ...prev,
                    clienteExtranjero: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="No">No</option>
                <option value="Sí">Sí</option>
              </select>
            </div>

            {/* RUT */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                RUT {newClient.clienteExtranjero === "No" ? "*" : ""}
              </label>
              <input
                type="text"
                value={newClient.rut}
                onChange={(e) =>
                  setNewClient((prev) => ({ ...prev, rut: e.target.value }))
                }
                placeholder="Ej: 12.345.678-9"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Campos condicionales */}
            {clientType === "empresa" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Razón Social *
                  </label>
                  <input
                    type="text"
                    value={newClient.razon_social}
                    onChange={(e) =>
                      setNewClient((prev) => ({
                        ...prev,
                        razon_social: e.target.value,
                      }))
                    }
                    placeholder="Razón Social o Nombre de Empresa"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giro
                  </label>
                  <input
                    type="text"
                    value={newClient.giro}
                    onChange={(e) =>
                      setNewClient((prev) => ({
                        ...prev,
                        giro: e.target.value,
                      }))
                    }
                    placeholder="Giro comercial"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </>
            )}
            {clientType === "persona" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombres *
                  </label>
                  <input
                    type="text"
                    value={newClient.nombres}
                    onChange={(e) =>
                      setNewClient((prev) => ({
                        ...prev,
                        nombres: e.target.value,
                      }))
                    }
                    placeholder="Nombres de la persona"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    value={newClient.apellidos}
                    onChange={(e) =>
                      setNewClient((prev) => ({
                        ...prev,
                        apellidos: e.target.value,
                      }))
                    }
                    placeholder="Apellidos de la persona"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </>
            )}

            {/* Teléfono y Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={newClient.telefono}
                  onChange={(e) =>
                    setNewClient((prev) => ({
                      ...prev,
                      telefono: e.target.value,
                    }))
                  }
                  placeholder="Ej: +56912345678"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newClient.email}
                  onChange={(e) =>
                    setNewClient((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="Ej: correo@ejemplo.com"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Dirección */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección
              </label>
              <input
                type="text"
                value={newClient.direccion}
                onChange={(e) =>
                  setNewClient((prev) => ({
                    ...prev,
                    direccion: e.target.value,
                  }))
                }
                placeholder="Dirección completa"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comuna
                </label>
                <input
                  type="text"
                  value={newClient.comuna}
                  onChange={(e) =>
                    setNewClient((prev) => ({
                      ...prev,
                      comuna: e.target.value,
                    }))
                  }
                  placeholder="Comuna"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ciudad
                </label>
                <input
                  type="text"
                  value={newClient.ciudad}
                  onChange={(e) =>
                    setNewClient((prev) => ({
                      ...prev,
                      ciudad: e.target.value,
                    }))
                  }
                  placeholder="Ciudad"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 pb-6 px-6 border-t border-gray-200 flex flex-col sm:flex-row gap-4 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors w-full sm:w-auto sm:min-w-[120px] shadow-sm hover:shadow text-base"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreateClient}
            disabled={
              loading ||
              (clientType === "empresa" &&
                (!newClient.razon_social.trim() || !newClient.rut.trim())) ||
              (clientType === "persona" &&
                (!newClient.nombres.trim() ||
                  !newClient.apellidos.trim() ||
                  !newClient.rut.trim()))
            }
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 w-full sm:w-auto sm:min-w-[160px] shadow-sm hover:shadow text-base"
          >
            {loading ? "Guardando..." : "Guardar cliente"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientModal;
