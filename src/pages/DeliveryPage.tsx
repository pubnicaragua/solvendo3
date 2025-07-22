import React, { useState, useEffect } from 'react';
import {
  Search,
  User,
  Plus,
  Minus,
  X as XIcon,
  FileText,
  Check,
  Truck
} from 'lucide-react';
import { HeaderWithMenu } from '../components/common/HeaderWithMenu';
import { useAuth } from '../contexts/AuthContext';
import { usePOS } from '../contexts/POSContext';
import { supabase } from '../lib/supabase';
import type { Cliente } from '../contexts/POSContext';
import { ClientModal } from '../components/pos/ClientModal';
import toast from 'react-hot-toast';

export const DeliveryPage: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { user, empresaId } = useAuth();
  const {
    carrito,
    total,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    currentCliente,
    selectClient,
    clientes
  } = usePOS();

  const [productSearch, setProductSearch] = useState('');
  const [docSearch, setDocSearch] = useState('');
  const [productos, setProductos] = useState<any[]>([]);
  const [docsDisponibles, setDocsDisponibles] = useState<any[]>([]);

  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientError, setClientError] = useState(false);

  const [despachoData, setDespachoData] = useState({
    fecha: new Date().toISOString().split('T')[0], 
    tipo: 'Guía de despacho manual',
    destinatario: '',
    direccion: '',
    comuna: '',
    ciudad: '',
    region: '',
    numDocumento: ''
  });

  // Sincronizar con el cliente seleccionado en el contexto
  useEffect(() => {
    if (currentCliente) {
      setSelectedClient(currentCliente);
      setDespachoData((p) => ({
        ...p,
        destinatario: currentCliente.razon_social,
        direccion: currentCliente.direccion || '',
        comuna: currentCliente.comuna || '',
        ciudad: currentCliente.ciudad || '',
        region: currentCliente.region || '',
        numDocumento: currentCliente.rut
      }));
    }
  }, [currentCliente]);

  useEffect(() => {
    if (!empresaId) {
      // Usar datos de ejemplo si no hay empresaId
      setProductos([
        { id: '1', nombre: 'Ejemplo producto 1', precio: 34.5, stock: 100 },
        { id: '2', nombre: 'Ejemplo producto 2', precio: 68.5, stock: 50 },
        { id: '3', nombre: 'Ejemplo producto 3', precio: 34.5, stock: 75 }
      ]);
      setDocsDisponibles([
        { id: 'doc1', label: 'Boleta manual (no válida al SII) N°V17522786664074', total: 35 },
        { id: 'doc2', label: 'Boleta manual (no válida al SII) N°3421457', total: 34000 },
        { id: 'doc3', label: 'Factura N°1001', total: 45000 },
        { id: 'doc4', label: 'Boleta manual (no válida al SII) N°9', total: 204 },
        { id: 'doc5', label: 'Boleta manual (no válida al SII) N°3421456', total: 22000 }
      ]);
      return;
    }

    const fetchProductsAndDocs = async () => {
      try {
        // Cargar productos desde el carrito actual
        const cartProducts = carrito.map(item => ({
          id: item.id,
          nombre: item.nombre,
          precio: item.precio,
          stock: item.stock || 0
        }));
        
        if (cartProducts.length > 0) {
          setProductos(cartProducts);
        } else {
          // Datos de ejemplo si no hay productos
          setProductos([
            { id: '1', nombre: 'Ejemplo producto 1', precio: 34.5, stock: 100 },
            { id: '2', nombre: 'Ejemplo producto 2', precio: 68.5, stock: 50 },
            { id: '3', nombre: 'Ejemplo producto 3', precio: 34.5, stock: 75 }
          ]);
        }

        // Cargar documentos disponibles
        const { data: docs, error: docsError } = await supabase
          .from('ventas')
          .select('id, folio, tipo_dte, total')
          .ilike('folio', `%${docSearch}%`)
          .eq('empresa_id', empresaId)
          .limit(10);
        
        if (!docsError && docs && docs.length > 0) {
          setDocsDisponibles(
            docs.map((d: any) => ({
              id: d.id,
              label:
                (d.tipo_dte === 'boleta'
                  ? 'Boleta manual (no válida al SII)'
                  : d.tipo_dte) +
                ' Nº' +
                d.folio,
              total: d.total
            }))
          );
        } else {
          // Datos de ejemplo si no hay documentos
          setDocsDisponibles([
            { id: 'doc1', label: 'Boleta manual (no válida al SII) N°V17522786664074', total: 35 },
            { id: 'doc2', label: 'Boleta manual (no válida al SII) N°3421457', total: 34000 },
            { id: 'doc3', label: 'Factura N°1001', total: 45000 },
            { id: 'doc4', label: 'Boleta manual (no válida al SII) N°9', total: 204 },
            { id: 'doc5', label: 'Boleta manual (no válida al SII) N°3421456', total: 22000 }
          ]);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        // Usar datos de ejemplo en caso de error
        setProductos([
          { id: '1', nombre: 'Ejemplo producto 1', precio: 34.5, stock: 100 },
          { id: '2', nombre: 'Ejemplo producto 2', precio: 68.5, stock: 50 },
          { id: '3', nombre: 'Ejemplo producto 3', precio: 34.5, stock: 75 }
        ]);
        setDocsDisponibles([
          { id: 'doc1', label: 'Boleta manual (no válida al SII) N°V17522786664074', total: 35 },
          { id: 'doc2', label: 'Boleta manual (no válida al SII) N°3421457', total: 34000 },
          { id: 'doc3', label: 'Factura N°1001', total: 45000 },
          { id: 'doc4', label: 'Boleta manual (no válida al SII) N°9', total: 204 },
          { id: 'doc5', label: 'Boleta manual (no válida al SII) N°3421456', total: 22000 }
        ]);
      }
    };

    fetchProductsAndDocs();
  }, [empresaId, docSearch, carrito]);

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n);

  const handleSelectDoc = (doc: any) => {
    const existingItem = carrito.find(item => item.id === doc.id);
    if (existingItem) {
      return; 
    }
    addToCart({
      id: doc.id,
      nombre: doc.label,
      precio: doc.total,
      quantity: 1
    });
  };

  const handleClientSelect = (c: Cliente) => {
    setSelectedClient(c);
    selectClient(c)
    setDespachoData((p) => ({
      ...p,
      destinatario: c.razon_social,
      direccion: c.direccion || '',
      comuna: c.comuna || '',
      ciudad: c.ciudad || '',
      region: c.region || '',
      numDocumento: c.rut
    }));
    setShowClientModal(false);
    setClientError(false);
  };

  const handleCancelDespacho = () => {
    clearCart();
    setSelectedClient(null);
    setProductSearch('');
    setDocSearch('');
    setDespachoData({
      fecha: new Date().toISOString().split('T')[0],
      tipo: 'Guía de despacho manual',
      destinatario: '',
      direccion: '',
      comuna: '',
      ciudad: '',
      region: '',
      numDocumento: ''
    });
    setClientError(false);
    onClose();
  };

  const handleConfirm = async () => {
    if (!selectedClient) {
      setClientError(true);
      return;
    }
    if (carrito.length === 0) {
      toast.success('Despacho confirmado correctamente');
      onClose();
      return;
    }

    try {
      const { data: despacho, error: despachoError } = await supabase
        .from('despachos')
        .insert([
          {
            empresa_id: empresaId,
            usuario_id: user?.id,
            cliente_id: selectedClient.id,
            destinatario: selectedClient.razon_social,
            direccion: selectedClient.direccion || 'Sin dirección',
            total
          }
        ])
        .select()
        .single();

      if (despachoError || !despacho) {
        console.error('Error al crear despacho:', despachoError);
        toast.error('Error al crear despacho: ' + despachoError?.message);
        return;
      }

      const detalles = carrito.map((item) => ({
        despacho_id: despacho.id,
        producto_id: item.id,
        cantidad: item.quantity,
        precio: item.precio,
        descuento: 0
      }));

      const { error: itemsError } = await supabase.from('despachos_items').insert(detalles);

      if (itemsError) {
        console.error('Error al insertar detalles del despacho:', itemsError);
        toast.error('Error al insertar detalles del despacho: ' + itemsError.message);
        return;
      }

      toast.success('Despacho creado exitosamente.');
      clearCart();
      setSelectedClient(null);
      setDespachoData({
        fecha: new Date().toISOString().split('T')[0],
        tipo: 'Guía de despacho manual',
        destinatario: '',
        direccion: '',
        comuna: '',
        ciudad: '',
        region: '',
        numDocumento: ''
      });
      onClose();
    } catch (error) {
      console.error('Error general en el despacho:', error);
      toast.error('Ocurrió un error inesperado al despachar.');
    }
  };

  const handleSelectClient = () => {
    setShowClientModal(true);
  };
  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <HeaderWithMenu
        title="Despacho"
        icon={<Truck className="w-6 h-6 text-gray-600" />}
        userName={user?.user_metadata?.full_name || user?.email || 'Usuario'}
        userAvatarUrl={user?.user_metadata?.avatar_url || ''}
        showClock={true}
      />

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 bg-white p-6 flex flex-col">
          <div className="relative mb-6">
            <input
              type="text"
              placeholder="Ingresa aquí el producto o servicio"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5"/>
          </div>

          <div className="grid grid-cols-4 gap-4 text-sm font-medium border-b border-gray-200 pb-2 mb-4 text-gray-600">
            <span className="pl-1">Producto</span>
            <span className="text-center">Cantidad</span>
            <span className="text-center">Descuento</span>
            <span className="text-right pr-1">Importe</span>
          </div>

          <div className="space-y-3 pb-4 flex-grow overflow-y-auto">
            {carrito.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No hay ítems en el despacho.</div>
            ) : (
              carrito.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-4 gap-4 items-center p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <span className="text-gray-800">{item.nombre}</span>
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                      disabled={item.quantity <= 1}
                      className="p-1 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus className="w-4 h-4"/>
                    </button>
                    <span className="w-8 text-center font-semibold text-gray-800">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-600 transition-colors"
                    >
                      <Plus className="w-4 h-4"/>
                    </button>
                  </div>
                  <span className="text-center text-gray-800">0%</span>
                  <div className="flex items-center justify-between pl-4">
                    <span className="font-semibold text-gray-800">{formatPrice(item.precio * item.quantity)}</span>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <XIcon className="w-4 h-4"/>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-auto pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
              <div>
                N° Líneas: {carrito.length} / Tot. ítems: {carrito.reduce((acc, item) => acc + item.quantity, 0)}
              </div>
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:ring-blue-500 focus:border-blue-500"
                value={despachoData.tipo}
                onChange={(e) => setDespachoData(p => ({ ...p, tipo: e.target.value }))}
              >
                <option>Guía de despacho manual</option>
              </select>
            </div>

            <button
              onClick={handleSelectClient}
              className={`w-3/4 py-2.5 mb-3 text-sm rounded-md font-medium transition-colors flex items-center justify-center gap-2 ${
                clientError 
                  ? 'bg-red-500 text-white' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <Search className="w-4 h-4 text-white" />
              {selectedClient ? selectedClient.razon_social : 'Seleccionar cliente'}
            </button>

            <div className="space-y-4 mb-6">
              <h4 className="text-lg font-semibold text-gray-900">Datos de Despacho</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={despachoData.fecha}
                    onChange={(e) => setDespachoData(p => ({ ...p, fecha: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={despachoData.tipo}
                    onChange={(e) => setDespachoData(prev => ({ ...prev, tipo: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                  value={despachoData.destinatario}
                  onChange={(e) => setDespachoData(prev => ({ ...prev, destinatario: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Nombre del destinatario"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <input
                  type="text"
                  value={despachoData.direccion}
                  onChange={(e) => setDespachoData(prev => ({ ...prev, direccion: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Dirección completa"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Comuna</label>
                  <input
                    type="text"
                    value={despachoData.comuna}
                    onChange={(e) => setDespachoData(prev => ({ ...prev, comuna: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Comuna"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                  <input
                    type="text"
                    value={despachoData.ciudad}
                    onChange={(e) => setDespachoData(prev => ({ ...prev, ciudad: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Ciudad"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Región</label>
                <input
                  type="text"
                  value={despachoData.region}
                  onChange={(e) => setDespachoData(prev => ({ ...prev, region: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Región"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Núm. documento</label>
                <input
                  type="text"
                  value={despachoData.numeroDocumento}
                  onChange={(e) => setDespachoData(prev => ({ ...prev, numeroDocumento: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Número de documento"
                />
              </div>
            </div>

            {/* Total y botón de confirmación */}
            <div className="border-t pt-4 space-y-4">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total de despacho</span>
                <span>{formatPrice(total)}</span>
              </div>
              
              <button
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                onClick={handleConfirm}
                disabled={!selectedClient || carrito.length === 0}
              >
                Confirmar despacho
              </button>
            </div>

            <div className="flex items-center justify-between mt-4"> 
              <button
                onClick={handleCancelDespacho}
                className="px-4 py-2 bg-gray-100 rounded-lg flex items-center gap-1 text-sm text-gray-700 hover:bg-gray-200 transition-colors border border-gray-200 shadow-sm"
              >
                <XIcon className="w-4 h-4 text-gray-500"/> Cancelar
              </button>
              <div className="flex items-center gap-4">
                <span className="text-lg font-semibold text-gray-800">Total</span> 
                <span className="text-xl font-bold text-gray-900">{formatPrice(total)}</span> 
                <button
                  onClick={handleConfirm}
                  disabled={!selectedClient || carrito.length === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors text-base"
                >
                  Despachar
                </button>
              </div>
            </div>
          </div>
        </div>

        <aside className="w-96 bg-gray-100 p-6 flex flex-col border-l-0 shadow-none">
          <div className="mb-4">
            <div className="flex items-center text-blue-800 font-medium mb-3">
              <FileText className="w-4 h-4 mr-2" /> Documentos disponibles
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Ingresa aquí el número de documento"
                value={docSearch}
                onChange={(e) => setDocSearch(e.target.value)}
                className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5"/>
            </div>
          </div>

          <div className="space-y-3">
            {docsDisponibles.length === 0 ? (
              <div className="text-center text-gray-500 py-4">No hay documentos disponibles.</div>
            ) : (
              docsDisponibles.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSelectDoc(doc)}
                >
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{doc.label}</p>
                    <p className="text-xs text-gray-600">{formatPrice(doc.total)}</p>
                  </div>
                  {carrito.some(item => item.id === doc.id) ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <Plus className="w-5 h-5 text-blue-500" />
                  )}
                </div>
              ))
            )}
          </div>
        </aside>
      </div>

      <ClientModal
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)}
        onClientSelect={handleClientSelect}
      />

      {clientError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-sm text-center">
            <p className="mb-6 text-gray-800 text-lg font-semibold">
              Debes seleccionar un cliente antes de despachar.
            </p>
            <button
              onClick={() => setClientError(false)}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  )
}