import React, { useState } from 'react'
import { Truck, Search, X, Plus, User, Calendar } from 'lucide-react'
import { ClientModal } from './ClientModal'
import { Cliente } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

interface DeliveryModalProps {
  isOpen: boolean
  onClose: () => void
}

export const DeliveryModal: React.FC<DeliveryModalProps> = ({
  isOpen,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null)
  const [showClientModal, setShowClientModal] = useState(false)
  const [showClientError, setShowClientError] = useState(false)
  const [deliveryData, setDeliveryData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    tipo: 'Tipo de despacho',
    destinatario: 'Inicial demo',
    direccion: 'Dirección',
    comuna: 'Comuna',
    ciudad: 'Ciudad',
    region: 'Región',
    numeroDocumento: 'Número de documento',
    fecha: '19/05/2025',
    tipo: 'Tipo de despacho',
    destinatario: 'Inicial demo',
    direccion: 'Dirección',
    comuna: 'Comuna',
    ciudad: 'Ciudad',
    region: 'Región',
    numeroDocumento: 'Número de documento'
  })

  const { empresaId } = useAuth()

  if (!isOpen) return null

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price)
  }

  const handleClientSelect = (cliente: Cliente | null) => {
    setSelectedClient(cliente)
    if (cliente) {
      setDeliveryData(prev => ({
        ...prev,
        destinatario: cliente.razon_social,
        direccion: cliente.direccion || 'Dirección',
        comuna: cliente.comuna || 'Comuna',
        ciudad: cliente.ciudad || 'Ciudad'
      }))
    }
  }

  const handleConfirmDelivery = () => {
    if (!selectedClient) {
      setShowClientError(true)
      return
    }
    
    // Validar campos requeridos
    if (!deliveryData.destinatario || !deliveryData.direccion || !deliveryData.comuna || !deliveryData.ciudad) {
      toast.error('Por favor complete todos los campos requeridos');
      return;
    }
    
    // Registrar el despacho
    registerDelivery();
  }
  
  const registerDelivery = async () => {
    if (!empresaId || !selectedClient) return;
    
    try {
      // Insertar en la tabla despachos (asumiendo que existe)
      const { error } = await supabase
        .from('despachos')
        .insert([{
          empresa_id: empresaId,
          cliente_id: selectedClient.id,
          destinatario: deliveryData.destinatario,
          direccion: deliveryData.direccion,
          comuna: deliveryData.comuna,
          ciudad: deliveryData.ciudad,
          region: deliveryData.region,
          tipo: deliveryData.tipo,
          numero_documento: deliveryData.numeroDocumento,
          fecha: new Date().toISOString()
        }]);
        
      if (error) {
        if (error.code === '42P01') { // Tabla no existe
          // Crear la tabla si no existe
          await createDespachoTable();
          // Reintentar la inserción
          return registerDelivery();
        }
        throw error;
      }
      
      toast.success('Despacho registrado correctamente');
      onClose();
    } catch (error) {
      console.error('Error registering delivery:', error);
      toast.error('Error al registrar despacho');
    }
  }
  
  const createDespachoTable = async () => {
    // Esta función solo se ejecutaría si la tabla no existe
    // En un entorno real, esto debería hacerse con migraciones
    try {
      const { error } = await supabase.rpc('create_despachos_table');
      if (error) throw error;
    } catch (error) {
      console.error('Error creating despachos table:', error);
      toast.error('Error al crear tabla de despachos');
    }
  }

  if (showClientError) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 max-w-sm w-full">
          <div className="text-center">
            <button
              onClick={() => setShowClientError(false)}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No has seleccionado el cliente</h3>
              OK
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">Despacho</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Panel - Products */}
          <div className="flex-1 p-6 border-r border-gray-200">
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Ingresa aquí el producto o servicio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Available Documents Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-blue-800">Documentos disponibles</span>
              </div>
              <div className="text-xs text-blue-600">Ingresa aquí el número de documento</div>
            </div>

            {/* Mock Product */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Ejemplo producto 1</h4>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    <span>Cantidad: 1</span>
                    <span>Descuento: 0%</span>
                    <span>Importe: {formatPrice(34500)}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" icon={X} />
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total</span>
                <span>{formatPrice(34500)}</span>
              </div>
            </div>
          </div>

          {/* Right Panel - Delivery Details */}
          <div className="w-96 p-6">
            {/* Client Selection */}
            <div className="mb-6">
              {selectedClient ? (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        {selectedClient.razon_social}
                      </p>
                      <p className="text-xs text-blue-700">RUT: {selectedClient.rut}</p>
                    </div>
                    <button
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      onClick={() => setSelectedClient(null)}
                    >
                      Cambiar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Clientes</span>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Cliente"
                        className="w-full pl-10 pr-4 py-2 border border-blue-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                  <button
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    onClick={() => setShowClientModal(true)}
                  >
                    Registrar nuevo cliente
                  </button>
                </div>
              )}
            </div>

            {/* Delivery Form */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value="2025-05-19"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <Calendar className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={deliveryData.tipo}
                    onChange={(e) => setDeliveryData(prev => ({ ...prev, tipo: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option>Tipo de despacho</option>
                    <option>Entrega inmediata</option>
                    <option>Entrega programada</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destinatario</label>
                <input
                  type="text"
                  value={deliveryData.destinatario}
                  onChange={(e) => setDeliveryData(prev => ({ ...prev, destinatario: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <input
                  type="text"
                  value={deliveryData.direccion}
                  onChange={(e) => setDeliveryData(prev => ({ ...prev, direccion: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Comuna</label>
                  <input
                    type="text"
                    value={deliveryData.comuna}
                    onChange={(e) => setDeliveryData(prev => ({ ...prev, comuna: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                  <input
                    type="text"
                    value={deliveryData.ciudad}
                    onChange={(e) => setDeliveryData(prev => ({ ...prev, ciudad: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Región</label>
                <input
                  type="text"
                  value={deliveryData.region}
                  onChange={(e) => setDeliveryData(prev => ({ ...prev, region: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Núm. documento</label>
                <input
                  type="text"
                  value={deliveryData.numeroDocumento}
                  onChange={(e) => setDeliveryData(prev => ({ ...prev, numeroDocumento: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Cliente"
                  className="w-full pl-10 pr-4 py-2 border border-blue-300 rounded-lg text-sm"
                />
              </div>
              <button
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                onClick={handleConfirmDelivery}
              >
                Confirmar despacho
              </button>
            </div>
          </div>
        </div>

        {/* Client Modal */}
        <ClientModal
          isOpen={showClientModal}
          onClose={() => setShowClientModal(false)}
          onClientSelect={handleClientSelect}
        />
      </div>
    </div>
  )
}