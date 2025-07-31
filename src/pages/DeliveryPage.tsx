import React, { useState, useEffect } from 'react';
import {
  Search,
  User,
  Plus,
  Minus,
  X as XIcon,
  FileText,
  Check,
  Truck,
  Calendar
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
  const [deliveryClientSearchTerm, setDeliveryClientSearchTerm] = useState('');

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

  // Estados para cajas y sucursales dinámicas
  const [cajas, setCajas] = useState<any[]>([]);
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [selectedCaja, setSelectedCaja] = useState<string>('');
  const [selectedSucursal, setSelectedSucursal] = useState<string>('');

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

  // Cargar cajas y sucursales
  useEffect(() => {
    const loadCajasYSucursales = async () => {
      if (!empresaId) {
        // Datos de ejemplo si no hay empresaId
        setCajas([
          { id: 'caja1', nombre: 'Caja Principal' },
          { id: 'caja2', nombre: 'Caja Secundaria' }
        ]);
        setSucursales([
          { id: 'sucursal1', nombre: 'Sucursal Principal' },
          { id: 'sucursal2', nombre: 'Sucursal Centro' }
        ]);
        setSelectedCaja('caja1');
        setSelectedSucursal('sucursal1');
        return;
      }
      
      try {
        // Cargar cajas
        const { data: cajasData, error: cajasError } = await supabase
          .from('cajas')
          .select('*')
          .eq('empresa_id', empresaId)
          .eq('activo', true);
          
        if (!cajasError && cajasData && cajasData.length > 0) {
          setCajas(cajasData);
          setSelectedCaja(cajasData[0].id);
        } else {
          // Fallback a datos de ejemplo
          setCajas([
            { id: 'caja1', nombre: 'Caja Principal' },
            { id: 'caja2', nombre: 'Caja Secundaria' }
          ]);
          setSelectedCaja('caja1');
        }
        
        // Cargar sucursales
        const { data: sucursalesData, error: sucursalesError } = await supabase
          .from('sucursales')
          .select('*')
          .eq('empresa_id', empresaId)
          .eq('activo', true);
          
        if (!sucursalesError && sucursalesData && sucursalesData.length > 0) {
          setSucursales(sucursalesData);
          setSelectedSucursal(sucursalesData[0].id);
        } else {
          // Fallback a datos de ejemplo
          setSucursales([
            { id: 'sucursal1', nombre: 'Sucursal Principal' },
            { id: 'sucursal2', nombre: 'Sucursal Centro' }
          ]);
          setSelectedSucursal('sucursal1');
        }
      } catch (error) {
        console.error('Error loading cajas y sucursales:', error);
        // Fallback a datos de ejemplo en caso de error
        setCajas([
          { id: 'caja1', nombre: 'Caja Principal' },
          { id: 'caja2', nombre: 'Caja Secundaria' }
        ]);
        setSucursales([
          { id: 'sucursal1', nombre: 'Sucursal Principal' },
          { id: 'sucursal2', nombre: 'Sucursal Centro' }
        ]);
        setSelectedCaja('caja1');
        setSelectedSucursal('sucursal1');
      }
    };
    
    loadCajasYSucursales();
  }, [empresaId]);

  useEffect(() => {
    if (!empresaId) {
      // Usar datos de ejemplo si no hay empresaId
      setProductos([
        { id: '1', nombre: 'Ejemplo producto 1', precio: 34.5, stock: 100 },
        { id: '2', nombre: 'Ejemplo producto 2', precio: 68.5, stock: 50 },
        { id: '3', nombre: 'Ejemplo producto 3', precio: 34.5, stock: 75 }
      ]);
      
      // Solo mostrar documentos si hay cliente seleccionado
      if (selectedClient) {
        setDocsDisponibles([
          { id: 'doc1', label: 'Boleta manual (no válida al SII) N°V17522786664074', total: 35 },
          { id: 'doc2', label: 'Boleta manual (no válida al SII) N°3421457', total: 34000 },
          { id: 'doc3', label: 'Factura N°1001', total: 45000 }
        ]);
      } else {
        setDocsDisponibles([]);
      }
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

        // Cargar documentos disponibles solo si hay cliente seleccionado
        if (selectedClient) {
          const { data: docs, error: docsError } = await supabase
            .from('ventas')
            .select('id, folio, tipo_dte, total')
            .eq('empresa_id', empresaId)
            .eq('cliente_id', selectedClient.id)
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
            setDocsDisponibles([]);
          }
        } else {
          setDocsDisponibles([]);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        // Usar datos de ejemplo en caso de error
        setProductos([
          { id: '1', nombre: 'Ejemplo producto 1', precio: 34.5, stock: 100 },
          { id: '2', nombre: 'Ejemplo producto 2', precio: 68.5, stock: 50 },
          { id: '3', nombre: 'Ejemplo producto 3', precio: 34.5, stock: 75 }
        ]);
        setDocsDisponibles([]);
      }
    };

    fetchProductsAndDocs();
  }, [empresaId, docSearch, carrito, selectedClient]);

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n);

  const handleSelectDoc = (doc: any) => {
    // Limpiar carrito existente
    clearCart();
    
    // Cargar productos reales de la venta
    const loadVentaProducts = async () => {
      try {
        if (!empresaId) {
          // Datos de ejemplo si no hay empresaId
          const exampleProducts = [
            {
              id: 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
              empresa_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
              nombre: 'Ejemplo producto 1',
              precio: 34.5,
              stock: 100,
              activo: true,
              created_at: new Date().toISOString(),
              costo: 0,
              descripcion: 'Producto de ejemplo',
              codigo: 'PROD001',
              destacado: false,
              updated_at: new Date().toISOString()
            }
          ];
          
          exampleProducts.forEach(product => addToCart(product));
          return;
        }

        // Buscar la venta por folio
        const { data: venta, error: ventaError } = await supabase
          .from('ventas')
          .select('id')
          .eq('id', doc.id)
          .eq('empresa_id', empresaId)
          .single();

        if (ventaError || !venta) {
          // Si no se encuentra la venta, usar productos de ejemplo
          const exampleProducts = [
            {
              id: 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
              empresa_id: empresaId,
              nombre: 'Ejemplo producto 1',
              precio: 34.5,
              stock: 100,
              activo: true,
              created_at: new Date().toISOString(),
              costo: 0,
              descripcion: 'Producto de ejemplo',
              codigo: 'PROD001',
              destacado: false,
              updated_at: new Date().toISOString()
            }
          ];
          
          exampleProducts.forEach(product => addToCart(product));
          return;
        }

        // Cargar items de la venta
        const { data: ventaItems, error: itemsError } = await supabase
          .from('venta_items')
          .select(`
            id,
            cantidad,
            precio_unitario,
            productos (
              id,
              empresa_id,
              nombre,
              precio,
              stock,
              activo,
              created_at,
              costo,
              descripcion,
              codigo,
              destacado,
              updated_at
            )
          `)
          .eq('venta_id', venta.id);

        if (itemsError || !ventaItems || ventaItems.length === 0) {
          // Si no hay items, usar productos de ejemplo
          const exampleProducts = [
            {
              id: 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
              empresa_id: empresaId,
              nombre: 'Ejemplo producto 1',
              precio: 34.5,
              stock: 100,
              activo: true,
              created_at: new Date().toISOString(),
              costo: 0,
              descripcion: 'Producto de ejemplo',
              codigo: 'PROD001',
              destacado: false,
              updated_at: new Date().toISOString()
            }
          ];
          
          exampleProducts.forEach(product => addToCart(product));
          return;
        }

        // Agregar productos reales al carrito
        ventaItems.forEach(item => {
          if (item.productos) {
            const product = {
              ...item.productos,
              precio: item.precio_unitario // Usar el precio de la venta
            };
            
            // Agregar con la cantidad específica de la venta
            for (let i = 0; i < item.cantidad; i++) {
              addToCart(product);
            }
          }
        });

        toast.success(`Productos cargados desde ${doc.label}`);
      } catch (error) {
        console.error('Error loading venta products:', error);
        toast.error('Error al cargar productos de la venta');
        
        // Fallback a productos de ejemplo
        const exampleProducts = [
          {
            id: 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
            empresa_id: empresaId || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
            nombre: 'Ejemplo producto 1',
            precio: 34.5,
            stock: 100,
            activo: true,
            created_at: new Date().toISOString(),
            costo: 0,
            descripcion: 'Producto de ejemplo',
            codigo: 'PROD001',
            destacado: false,
            updated_at: new Date().toISOString()
          }
        ];
        
        exampleProducts.forEach(product => addToCart(product));
      }
    };
    
    loadVentaProducts();
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
    setDeliveryClientSearchTerm('');
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
      toast.error('Debe seleccionar un cliente para el despacho');
      return;
    }
    if (carrito.length === 0) {
      toast.error('No hay productos para despachar');
      return;
    }

    try {
      const despachoDataToSend = {
        empresa_id: empresaId,
        usuario_id: user?.id,
        cliente_id: selectedClient.id,
        destinatario: despachoData.destinatario,
        direccion: despachoData.direccion,
        comuna: despachoData.comuna,
        ciudad: despachoData.ciudad,
        region: despachoData.region,
        tipo: despachoData.tipo,
        numero_documento: despachoData.numDocumento,
        total,
        fecha: new Date().toISOString()
      };
      
      const { data: despacho, error } = await supabase
        .from('despachos')
        .insert([despachoDataToSend])
        .select()
        .single();

      if (error) {
        console.error('Error al crear despacho:', error);
        toast.error('Error al crear despacho. Verifique los datos e intente nuevamente.');
        return;
      }

      const detalles = carrito.map((item) => ({
        despacho_id: despacho.id,
        producto_id: item.id,
        cantidad: item.quantity,
        precio: item.precio
      }));

      if (detalles.length > 0) {
        const { error: itemsError } = await supabase
          .from('despachos_items')
          .insert(detalles);

        if (itemsError) {
          console.error('Error al insertar detalles del despacho:', itemsError);
          toast.error('Error al insertar detalles del despacho.');
          return;
        }
      }

      toast.success('Despacho creado exitosamente.');
      clearCart();
      setSelectedClient(null);
      setDeliveryClientSearchTerm('');
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
      toast.error('Error inesperado. Intente nuevamente.');
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
              <div className="text-sm text-gray-600">
                Cliente: {selectedClient ? selectedClient.razon_social : 'No seleccionado'}
              </div>
              <div className="flex items-center justify-end">
                <span className="text-lg font-semibold mr-2">Total</span>
                <div className="bg-gray-100 p-2 rounded-lg text-right min-w-[100px]">
                  <span className="text-xl font-bold">{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Cliente"
                value={deliveryClientSearchTerm}
                onChange={(e) => {
                  setDeliveryClientSearchTerm(e.target.value);
                  if (!e.target.value) {
                    setSelectedClient(null);
                  } else {
                    // Buscar cliente mientras escribe
                    const cliente = clientes.find(c => 
                      c.razon_social.toLowerCase().includes(e.target.value.toLowerCase())
                    );
                    if (cliente) {
                      setSelectedClient(cliente);
                      selectClient(cliente);
                    }
                  }
                }}
                className="w-full pl-4 pr-10 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
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
          {/* Clientes Panel - Solo mostrar lista */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <User className="w-5 h-5 text-blue-600" />
              <h3 className="text-blue-600 font-semibold text-lg">Clientes</h3>
            </div>
            
            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {clientes.filter(c => 
                c.razon_social.toLowerCase().includes(deliveryClientSearchTerm.toLowerCase())
              ).map(c => (
                <li key={c.id}
                  onClick={() => {
                    setSelectedClient(c);
                    setDeliveryClientSearchTerm(c.razon_social);
                    selectClient(c);
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
                c.razon_social.toLowerCase().includes(deliveryClientSearchTerm.toLowerCase())
              ).length === 0 && (
                <li className="text-gray-500 text-center py-4">
                  {deliveryClientSearchTerm ? 'Sin resultados' : 'Aquí aparecerán tus clientes'}
                </li>
              )}
            </ul>
          </div>

          {/* Documentos disponibles */}
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Documentos disponibles</span>
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

          {/* Delivery Form */}
          <div className="space-y-4">
            {/* Selección de Caja y Sucursal */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Caja</label>
                <select
                  value={selectedCaja}
                  onChange={(e) => setSelectedCaja(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Seleccionar caja</option>
                  {cajas.map(caja => (
                    <option key={caja.id} value={caja.id}>
                      {caja.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal</label>
                <select
                  value={selectedSucursal}
                  onChange={(e) => setSelectedSucursal(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Seleccionar sucursal</option>
                  {sucursales.map(sucursal => (
                    <option key={sucursal.id} value={sucursal.id}>
                      {sucursal.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={despachoData.fecha}
                    onChange={(e) => setDespachoData(prev => ({ ...prev, fecha: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <Calendar className="w-4 h-4 text-gray-400" />
                </div>
              </div>
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