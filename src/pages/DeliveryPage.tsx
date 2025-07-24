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
  const [showClientSelection, setShowClientSelection] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientError, setClientError] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState('');

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
    // Clear existing cart and add the selected document
    clearCart();
    
    // Add document as a product to cart
    const documentProduct = {
      id: doc.id,
      empresa_id: empresaId || '',
      nombre: doc.label,
      precio: doc.total,
      stock: 1,
      activo: true,
      created_at: new Date().toISOString(),
      costo: 0,
      descripcion: 'Documento seleccionado para despacho',
      codigo: doc.id,
      destacado: false,
      updated_at: new Date().toISOString()
    };
    
    addToCart(documentProduct);
  };

  const handleClientSelect = (c: Cliente) => {
    setSelectedClient(c);
    selectClient(c);
    setClientSearchTerm(c.razon_social);
    setDespachoData((p) => ({
      ...p,
      destinatario: c.razon_social,
      direccion: c.direccion || '',
      comuna: c.comuna || '',
      ciudad: c.ciudad || '',
      region: c.region || '',
      numDocumento: c.rut
    }));
    setClientError(false);
  };

  const handleCancelDespacho = () => {
    clearCart();
    setSelectedClient(null);
    setClientSearchTerm('');
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
      toast.error('No hay productos para despachar');
      return;
    }

    try {
      const { data: despacho, error } = await supabase
        .from('despachos')
        .insert([
          {
            empresa_id: empresaId,
            usuario_id: user?.id,
            usuario_id: user?.id,
            cliente_id: selectedClient.id,
            destinatario: despachoData.destinatario,
            direccion: despachoData.direccion,
            comuna: despachoData.comuna,
            ciudad: despachoData.ciudad,
            region: despachoData.region,
            tipo: despachoData.tipo,
            numero_documento: despachoData.numDocumento,
            total
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error al crear despacho:', error);
        toast.error('Error al crear despacho: ' + error.message);
        return;
      }

      const detalles = carrito.map((item) => ({
        despacho_id: despacho.id,
        producto_id: item.id,
        cantidad: item.quantity,
        precio: item.precio
      }));

      const { error: itemsError } = await supabase
        .from('despachos_items')
        .insert(detalles);

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

          <div className="space-y-3 pb-4 flex-grow overflow-y-auto max-h-96">
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
            <div className="grid grid-cols-2 gap-4 items-center mb-4">
              <span className="text-gray-600 text-sm">
                N° Líneas {carrito.length} / Tot. ítems {carrito.reduce((acc, item) => acc + item.quantity, 0)}
              </span>
              <select className="px-2 py-1.5 border rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500 w-fit ml-auto">
                <option>Guía de despacho manual</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4 items-center mb-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cliente"
                  value={selectedClient ? selectedClient.razon_social : clientSearchTerm}
                  onChange={(e) => {
                    setClientSearchTerm(e.target.value);
                    if (!e.target.value) {
                      setSelectedClient(null);
                    } else {
                      // Buscar cliente mientras escribe
                      const cliente = clientes.find(c => 
                        c.razon_social.toLowerCase().includes(e.target.value.toLowerCase())
                      );
                      if (cliente) {
                        setSelectedClient(cliente);
                      }
                    }
                  }}
                  className="w-full pl-4 pr-10 py-2 border rounded-lg bg-gray-100 focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
              <div className="flex items-center justify-end">
                <span className="text-lg font-semibold mr-2">Total</span>
                <div className="bg-gray-100 p-2 rounded-lg text-right min-w-[100px]">
                  <span className="text-xl font-bold">{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            <div className="mt-auto flex gap-2">
              <button onClick={handleCancelDespacho} className="flex-1 px-4 py-2 bg-gray-100 rounded flex items-center justify-center text-sm">
                <XIcon className="w-4 h-4 mr-1" />Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedClient || carrito.length === 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded font-semibold text-base disabled:opacity-50"
              >
                Despachar {formatPrice(total)}
              </button>
            </div>
          </div>
        </div>

        <aside className="flex-1 p-6 bg-gray-50 border-l flex flex-col overflow-y-auto">
          {/* Clientes Panel */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <User className="w-5 h-5 text-blue-600" />
              <h3 className="text-blue-600 font-semibold text-lg">Clientes</h3>
            </div>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Cliente"
                value={clientSearchTerm}
                onChange={(e) => {
                  setClientSearchTerm(e.target.value);
                  // Buscar cliente mientras escribe
                  const cliente = clientes.find(c => 
                    c.razon_social.toLowerCase().includes(e.target.value.toLowerCase())
                  );
                  if (cliente) {
                    setSelectedClient(cliente);
                  } else if (!e.target.value) {
                    setSelectedClient(null);
                  }
                }}
                className="w-full pl-4 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
            
            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {clientes.filter(c => 
                c.razon_social.toLowerCase().includes(clientSearchTerm.toLowerCase())
              ).map(c => (
                <li key={c.id}
                  onClick={() => {
                    setSelectedClient(c);
                    setClientSearchTerm(c.razon_social);
                  }}
                  className={`p-3 border rounded hover:bg-gray-50 cursor-pointer flex justify-between items-center ${
                    selectedClient?.id === c.id ? 'bg-blue-50 border-blue-200' : 'bg-white'
                  }`}
                >
                  <div>
                    <span className="font-medium">{c.razon_social}</span>
                    <p className="text-xs text-gray-600">{c.rut}</p>
                  </div>
                  {selectedClient?.id === c.id ? (
                    <Check className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Plus className="w-4 h-4 text-blue-600" />
                  )}
                </li>
              ))}
              {clientes.filter(c => 
                c.razon_social.toLowerCase().includes(clientSearchTerm.toLowerCase())
              ).length === 0 && (
                <li className="text-gray-500 text-center py-4">
                  {clientSearchTerm ? 'Sin resultados' : 'Aquí aparecerán tus clientes'}
                </li>
              )}
            </ul>
          </div>

          {/* Documentos disponibles */}
          <div className="mt-6 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Documentos disponibles</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ingresa aquí el número de documento"
                  value={docSearch}
                  onChange={(e) => setDocSearch(e.target.value)}
                  className="w-full pl-4 pr-10 py-2 border border-blue-300 rounded-lg text-sm"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
            </div>

            {/* Lista de documentos */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {docsDisponibles.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => handleSelectDoc(doc)}
                  className="p-3 bg-white border rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-sm font-medium">{doc.label}</span>
                      <p className="text-xs text-gray-500 mt-1">{formatPrice(doc.total)}</p>
                    </div>
                  </div>
                </div>
              ))}
              {docsDisponibles.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  <p className="text-sm">No hay documentos disponibles</p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

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