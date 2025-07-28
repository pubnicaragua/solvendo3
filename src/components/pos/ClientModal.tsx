import React, { useState } from 'react';
import { X } from 'lucide-react';
import { usePOS } from '../../contexts/POSContext';
import { Cliente } from '../../lib/supabase'; // Asegúrate de que Cliente esté bien definido aquí

// Si ApiResult<T> no está definido globalmente, podrías necesitar definirlo aquí
// O ajustar la forma en que `crearCliente` devuelve los datos en usePOS
interface ApiResult<T> {
  success: boolean;
  data?: T | null; // Usar 'data' en lugar de 'cliente'
  error?: { message: string } | null; // Asegurar que 'error' sea un objeto con 'message'
}

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientSelect: (cliente: Cliente | null) => void;
}

export const ClientModal: React.FC<ClientModalProps> = ({
  isOpen,
  onClose,
  onClientSelect
}) => {
  const [clientType, setClientType] = useState<'empresa' | 'persona'>('empresa');
  const [newClient, setNewClient] = useState({
    razon_social: '',
    rut: '',
    direccion: '',
    comuna: '',
    ciudad: '',
    giro: '',
    telefono: '',
    email: '',
    contacto: '',
    nombres: '',
    apellidos: '',
    clienteExtranjero: 'No'
  });
  const [loading, setLoading] = useState(false);
  const { crearCliente } = usePOS();

  if (!isOpen) return null;

  const handleCreateClient = async () => {
    // Basic validation based on client type
    if (clientType === 'empresa') {
      if (!newClient.razon_social || !newClient.rut) {
        alert('Para clientes de tipo "Empresa", Razón Social y RUT son obligatorios.');
        return;
      }
    } else { // persona
      if (!newClient.nombres || !newClient.apellidos || !newClient.rut) {
        alert('Para clientes de tipo "Persona", Nombres, Apellidos y RUT son obligatorios.');
        return;
      }
    }

    setLoading(true);
    // Asumimos que crearCliente devuelve un objeto con 'data' y 'error'
    const result: ApiResult<Cliente> = await crearCliente(newClient); 
    
    if (result.success && result.data) { // Cambiado de result.cliente a result.data
      onClientSelect(result.data); // Cambiado de result.cliente a result.data
      onClose();
    } else if (result.error) {
      alert('Error al crear cliente: ' + result.error.message); // Acceso a result.error.message
    } else {
      alert('Error desconocido al crear cliente.'); // Para cubrir casos sin error.message
    }
    
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-xl font-semibold text-gray-900">Registrar nuevo cliente</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-grow">
          {/* Tipo de Cliente */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Tipo de Cliente</h4>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="clientType"
                  value="empresa"
                  checked={clientType === 'empresa'}
                  onChange={(e) => {
                    setClientType(e.target.value as 'empresa');
                    setNewClient(prev => ({
                        ...prev,
                        nombres: '', // Limpiar campos de persona
                        apellidos: '',
                        // Opcional: limpiar campos de empresa si se asume que no persisten
                        // razon_social: '', 
                        // giro: '', 
                    }));
                  }}
                  className="text-blue-600"
                />
                <span>Empresa</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="clientType"
                  value="persona"
                  checked={clientType === 'persona'}
                  onChange={(e) => {
                    setClientType(e.target.value as 'persona');
                    setNewClient(prev => ({
                        ...prev,
                        razon_social: '', // Limpiar campos de empresa
                        giro: '',
                        // Opcional: limpiar campos de persona si se asume que no persisten
                        // nombres: '', 
                        // apellidos: '',
                    }));
                  }}
                  className="text-blue-600"
                />
                <span>Persona</span>
              </label>
            </div>
          </div>

          {/* Campos del formulario */}
          <div className="space-y-4 mb-6">
            {/* Cliente Extranjero */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente Extranjero</label>
              <select 
                value={newClient.clienteExtranjero}
                onChange={(e) => setNewClient(prev => ({ ...prev, clienteExtranjero: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="No">No</option>
                <option value="Sí">Sí</option>
              </select>
            </div>
            
            {/* RUT */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RUT {newClient.clienteExtranjero === 'No' ? '*' : ''}</label>
              <input
                type="text"
                value={newClient.rut}
                onChange={(e) => setNewClient(prev => ({ ...prev, rut: e.target.value }))}
                placeholder="Ej: 12.345.678-9"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Campos condicionales */}
            {clientType === 'empresa' ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social *</label>
                    <input
                      type="text"
                      value={newClient.razon_social}
                      onChange={(e) => setNewClient(prev => ({ ...prev, razon_social: e.target.value }))}
                      placeholder="Razón Social o Nombre de Empresa"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Giro</label>
                    <input
                      type="text"
                      value={newClient.giro}
                      onChange={(e) => setNewClient(prev => ({ ...prev, giro: e.target.value }))}
                      placeholder="Giro comercial"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombres *</label>
                    <input
                      type="text"
                      value={newClient.nombres}
                      onChange={(e) => setNewClient(prev => ({ ...prev, nombres: e.target.value }))}
                      placeholder="Nombres de la persona"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos *</label>
                    <input
                      type="text"
                      value={newClient.apellidos}
                      onChange={(e) => setNewClient(prev => ({ ...prev, apellidos: e.target.value }))}
                      placeholder="Apellidos de la persona"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
              </>
            )}

            {/* Teléfono y Email */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="text"
                  value={newClient.telefono}
                  onChange={(e) => setNewClient(prev => ({ ...prev, telefono: e.target.value }))}
                  placeholder="Ej: +56912345678"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Ej: correo@ejemplo.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Dirección simplificada */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
              <input
                type="text"
                value={newClient.direccion}
                onChange={(e) => setNewClient(prev => ({ ...prev, direccion: e.target.value }))}
                placeholder="Dirección completa"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-4 justify-end flex-shrink-0 mb-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-8 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreateClient}
            disabled={loading || (clientType === 'empresa' && (!newClient.razon_social || !newClient.rut)) || (clientType === 'persona' && (!newClient.nombres || !newClient.apellidos || !newClient.rut))}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Guardando...' : 'Guardar cliente'}
          </button>
        </div>
      </div>
    </div>
  );
};