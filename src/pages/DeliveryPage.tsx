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
import { supabase, Cliente } from '../lib/supabase';
import { ClientModal } from '../components/pos/ClientModal';

export const DeliveryPage: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { user, empresaId } = useAuth();
  const {
    carrito,
    total,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart
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

  useEffect(() => {
    if (!empresaId) return;

    const fetchProductsAndDocs = async () => {
      const { data: prods } = await supabase
        .from('productos')
        .select('*')
        .ilike('nombre', `%${productSearch}%`)
        .limit(10);
      setProductos(prods || []);

      const { data: docs } = await supabase
        .from('ventas')
        .select('id, folio, tipo_dte, total')
        .ilike('folio', `%${docSearch}%`)
        .eq('empresa_id', empresaId)
        .limit(10);
      setDocsDisponibles(
        (docs || []).map((d: any) => ({
          ...d,
          label:
            (d.tipo_dte === 'boleta'
              ? 'Boleta manual (no válida al SII)'
              : d.tipo_dte) +
            ' Nº' +
            d.folio,
          total: d.total
        }))
      );
    };

    fetchProductsAndDocs();
  }, [productSearch, docSearch, empresaId]);

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
      toast.error('Debes agregar al menos un producto o documento al carrito para despachar.');
      return;
    }

    try {
      const { data: despacho, error: despachoError } = await supabase
        .from('despachos')
        .insert([
          {
            empresa_id: empresaId,
            usuario_id: user?.id,
            fecha: despachoData.fecha,
            tipo: despachoData.tipo,
            cliente_id: selectedClient.id,
            destinatario: selectedClient.razon_social,
            direccion: selectedClient.direccion || '',
            comuna: selectedClient.comuna || '',
            ciudad: selectedClient.ciudad || '',
            region: selectedClient.region || '',
            numero_documento: selectedClient.rut,
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
              onClick={() => setShowClientModal(true)}
              className={`w-3/4 py-2.5 mb-3 text-sm rounded-md font-medium transition-colors flex items-center justify-center gap-2 ${
                clientError 
                  ? 'bg-red-500 text-white' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <Search className="w-4 h-4 text-white" />
              {selectedClient ? selectedClient.razon_social : 'Seleccionar cliente'}
            </button>

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
  );
};