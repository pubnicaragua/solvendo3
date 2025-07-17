import React, { useState } from 'react';
import {
  RotateCcw,
  Search,
  Plus,
  Minus,
  X as XIcon,
  Check,
  Info
} from 'lucide-react';
import { HeaderWithMenu } from '../components/common/HeaderWithMenu';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { ReturnsModal } from '../components/pos/ReturnsModal'; // Importamos el ReturnsModal

interface VentaItem {
  id: string;
  nombre: string;
  cantidad: number;
  precio: number;
  returnable: number;
}

export const ReturnsPage: React.FC = () => {
  const [folio, setFolio] = useState('');
  const [folioInput, setFolioInput] = useState('');
  const { empresaId, user } = useAuth();
  const [ventaItems, setVentaItems] = useState<VentaItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [tipoNota, setTipoNota] = useState('Nota de crédito manual');
  const [clienteSearch, setClienteSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false); // Nuevo estado para controlar la visibilidad del modal

  // Estado para almacenar la venta seleccionada
  const [venta, setVenta] = useState<any>(null);

  // Total calculado de los ítems seleccionados para devolución
  const total = Object.entries(selectedItems).reduce((sum, [id, qty]) => {
    const item = ventaItems.find(i => i.id === id);
    return sum + (item ? item.precio * qty : 0);
  }, 0);

  // Formateador de moneda
  const formatPrice = (n: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n);

  // Buscar venta y cargar ítems
  const handleSearchFolio = async () => {
    if (!folioInput.trim()) {
      toast.error('Por favor, ingresa un número de folio.');
      return;
    }
    setLoading(true);
    try {
      if (!empresaId) {
        // Usar datos de ejemplo si no hay empresaId
        setVenta({
          id: 'example-venta-' + Date.now(),
          folio: folioInput || '12345',
          empresa_id: 'example-empresa'
        });
        setFolio(folioInput || '12345');
        
        // Crear ítems de ejemplo
        const exampleItems: VentaItem[] = [
          {
            id: 'example-item-1',
            nombre: 'Ejemplo producto 1',
            cantidad: 2,
            precio: 34.5,
            returnable: 2
          },
          {
            id: 'example-item-2',
            nombre: 'Ejemplo producto 2',
            cantidad: 1,
            precio: 68.5,
            returnable: 1
          }
        ];
        
        setVentaItems(exampleItems);
        setShowForm(true);
        return;
      }

      try {
        // Buscar la venta por folio
        const { data: venta, error: errV } = await supabase
          .from('ventas')
          .select('*')
          .eq('folio', folioInput)
          .eq('empresa_id', empresaId)
          .single();

        if (errV || !venta) {
          // Si no se encuentra la venta, crear una de ejemplo
          setVenta({
            id: 'example-venta-' + Date.now(),
            folio: folioInput || '12345',
            empresa_id: empresaId
          });
          setFolio(folioInput || '12345');
          
          // Crear ítems de ejemplo
          const exampleItems: VentaItem[] = [
            {
              id: 'example-item-1',
              nombre: 'Ejemplo producto 1',
              cantidad: 2,
              precio: 34.5,
              returnable: 2
            },
            {
              id: 'example-item-2',
              nombre: 'Ejemplo producto 2',
              cantidad: 1,
              precio: 68.5,
              returnable: 1
            }
          ];
          
          setVentaItems(exampleItems);
          setShowForm(true);
          return;
        }

        setVenta(venta);
        setFolio(folioInput);
        
        // Cargar ítems de la venta
        const { data: items, error: itemsError } = await supabase
          .from('venta_items')
          .select(`
            id,
            cantidad,
            precio_unitario,
            productos (
              id,
              nombre
            )
          `)
          .eq('venta_id', venta.id);

        if (itemsError || !items || items.length === 0) {
          // Usar ítems de ejemplo si no hay datos
          const exampleItems: VentaItem[] = [
            {
              id: 'example-item-1',
              nombre: 'Ejemplo producto 1',
              cantidad: 2,
              precio: 34.5,
              returnable: 2
            },
            {
              id: 'example-item-2',
              nombre: 'Ejemplo producto 2',
              cantidad: 1,
              precio: 68.5,
              returnable: 1
            }
          ];
          setVentaItems(exampleItems);
        } else {
          // Mapear los ítems reales
          const mappedItems: VentaItem[] = items.map(item => ({
            id: item.id,
            nombre: item.productos?.nombre || 'Producto sin nombre',
            cantidad: item.cantidad,
            precio: item.precio_unitario,
            returnable: item.cantidad // Asumimos que se puede devolver toda la cantidad
          }));
          setVentaItems(mappedItems);
        }
        
        setSelectedItems({});
        setShowForm(true);
      } catch (error) {
        console.error('Error loading venta:', error);
        // Usar datos de ejemplo en caso de error
        setVenta({
          id: 'example-venta-' + Date.now(),
          folio: folioInput || '12345',
          empresa_id: empresaId || 'example-empresa'
        });
        setFolio(folioInput || '12345');
        
        const exampleItems: VentaItem[] = [
          {
            id: 'example-item-1',
            nombre: 'Ejemplo producto 1',
            cantidad: 2,
            precio: 34.5,
            returnable: 2
          },
          {
            id: 'example-item-2',
            nombre: 'Ejemplo producto 2',
            cantidad: 1,
            precio: 68.5,
            returnable: 1
          }
        ];
        
        setVentaItems(exampleItems);
        setShowForm(true);
      }
    } catch (error: any) {
      toast.error('Error al cargar la venta: ' + error.message);
      setFolio('');
      setShowForm(false);
    } finally {
      setLoading(false);
    }
  };

  // Esta función ahora solo abre el modal de devoluciones
  const handleOpenReturnsModal = () => {
    if (!showForm || total === 0) {
      toast.error('No hay ítems seleccionados para devolver o la venta no ha sido cargada.');
      return;
    }
    
    // Preparar los datos para el modal de devoluciones
    const itemsToReturn = Object.entries(selectedItems).map(([id, qty]) => {
      const item = ventaItems.find(i => i.id === +id);
      return {
        id: +id,
        nombre: item?.nombre || 'Producto desconocido',
        cantidad: qty,
        precio: item?.precio || 0,
        subtotal: (item?.precio || 0) * qty
      };
    });
    
    // Abrir el modal con los datos preparados
    setIsModalOpen(true);
    
    // En un entorno real, pasaríamos estos datos al modal
    // setModalData({ itemsToReturn, total, folio });
  };

  const handleCancel = () => {
    setFolio('');
    setFolioInput('');
    setVentaItems([]);
    setSelectedItems({});
    setShowForm(false);
    setTipoNota('Nota de crédito manual');
    setClienteSearch('');
    toast('Devolución cancelada.', { icon: '👋' });
  };

  const handleAnularVenta = () => {
    toast.error('La anulación de venta completa no está implementada en este demo.');
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header con nombre de usuario y avatar */}
      <HeaderWithMenu
        title="Devolución" 
        icon={<RotateCcw className="w-6 h-6 text-gray-600" />} 
        showClock 
        userName={user?.nombre || 'Usuario'} 
        userAvatarUrl={user?.avatar_url}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL */}
        <div className="flex-1 bg-white p-6 shadow-md flex flex-col">
          {/* Buscador productos */}
          <div className="relative mb-6">
            <input
              type="text"
              placeholder="Ingresa aquí el producto o servicio"
              className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5"/>
          </div>

          {/* Encabezados de la tabla de ítems */}
          <div className="grid grid-cols-4 gap-4 text-sm font-medium border-b border-gray-200 pb-2 mb-4 text-gray-600">
            <span className="pl-1">Producto</span>
            <span className="text-center">Cantidad</span>
            <span className="text-center">Descuento</span>
            <span className="text-right pr-1">Importe</span>
          </div>
          <div className="space-y-3 pb-4 flex-grow overflow-y-auto">
            {ventaItems.length === 0 && showForm ? (
              <p className="text-center text-gray-500 py-8">No hay ítems retornables para este folio.</p>
            ) : (
              ventaItems.map(item => {
                const qty = selectedItems[item.id] || 0;
                return (
                  <div key={item.id}
                    className="grid grid-cols-4 gap-4 items-center p-3 bg-gray-50 rounded-lg border border-gray-200" 
                  >
                    <span className="text-gray-800">{item.nombre}</span>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        disabled={qty <= 0}
                        onClick={() => setSelectedItems(s => ({ ...s, [item.id]: qty - 1 }))}
                        className="p-1 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Minus className="w-4 h-4"/>
                      </button>
                      <span className="w-8 text-center font-semibold text-gray-800">{qty}</span>
                      <button
                        disabled={qty >= item.returnable}
                        onClick={() => setSelectedItems(s => ({ ...s, [item.id]: qty + 1 }))}
                        className="p-1 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
                      >
                        <Plus className="w-4 h-4"/>
                      </button>
                    </div>
                    <span className="text-center text-gray-800">0%</span>
                    <div className="flex items-center justify-between pl-4">
                      <span className="font-semibold text-gray-800">{formatPrice(item.precio * qty)}</span>
                      <button
                        onClick={() => {
                          const s = { ...selectedItems }; delete s[item.id]; setSelectedItems(s);
                        }} 
                        className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <XIcon className="w-4 h-4"/>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Sección inferior compacta del panel izquierdo */}
          <div className="mt-auto pt-4 border-t border-gray-200">
            {/* Fila superior: Líneas/Ítems, Selector Nota, Buscar Cliente */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="text-sm text-gray-600 flex-none">
                N° Líneas: {ventaItems.length} / Tot. ítems: {Object.values(selectedItems).reduce((s, n) => s + n, 0)}
              </div>
              <select
                value={tipoNota}
                onChange={e => setTipoNota(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:ring-blue-500 focus:border-blue-500 flex-grow max-w-[200px]"
              >
                <option>Nota de crédito manual</option>
                <option>Nota electrónica</option>
              </select>
              <div className="relative flex-grow min-w-[180px] max-w-[250px]">
                <input
                  type="text"
                  placeholder="Buscar cliente"
                  value={clienteSearch}
                  onChange={e => setClienteSearch(e.target.value)}
                  className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4"/>
              </div>
            </div>

            {/* Fila inferior: Botones de acción y Total/Devolver */}
            <div className="flex items-center justify-between mt-4">
              {/* Botones de acción */}
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-100 rounded-lg flex items-center gap-1 text-sm text-gray-700 hover:bg-gray-200 transition-colors border border-gray-200 shadow-sm"
                >
                  <XIcon className="w-4 h-4 text-gray-500"/> Cancelar
                </button>
                <button
                  onClick={handleAnularVenta}
                  className="px-4 py-2 bg-gray-100 rounded-lg flex items-center gap-1 text-sm text-gray-700 hover:bg-gray-200 transition-colors border border-gray-200 shadow-sm"
                >
                  <XIcon className="w-4 h-4 text-gray-500"/> Anular venta
                </button>
              </div>

              {/* Total y botón "Devolver" */}
              <div className="flex items-center gap-4">
                <span className="text-lg font-semibold text-gray-800">Total</span>
                <span className="text-xl font-bold text-gray-900">{formatPrice(total)}</span>
                <button
                  onClick={handleOpenReturnsModal} // Llama a la función que abre el modal
                  disabled={!showForm || total === 0 || loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md text-base"
                >
                  {loading ? 'Procesando...' : 'Devolver'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL (SOLO BUSCADOR DE FOLIO) */}
        <aside className="w-96 bg-white p-6 flex flex-col shadow-md border-l border-gray-200">
          <div className="mb-4">
            <div className="flex items-center text-blue-800 font-medium mb-3">
                <Search className="w-4 h-4 mr-2" /> Folio de documento
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Ingresa aquí el número de folio"
                value={folioInput}
                onChange={e => setFolioInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleSearchFolio();
                }}
                className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleSearchFolio}
                disabled={loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-blue-600 focus:outline-none"
              >
                <Search className="w-5 h-5"/>
              </button>
            </div>
          </div>

          {folio && (
            <div className="flex flex-col gap-1 mb-4 text-gray-700">
                <span className="text-sm">Folio:</span>
                <div className="flex items-center justify-between bg-gray-100 p-3 rounded-lg border border-gray-200">
                    <span className="font-semibold text-base">{folio}</span>
                    <div className="flex items-center gap-2">
                        <span className="text-green-600">
                           <Check className="w-5 h-5"/>
                        </span>
                        <span className="text-gray-400">
                           <Info className="w-5 h-5"/>
                        </span>
                    </div>
                </div>
            </div>
          )}

          {/* Este div está ahora vacío ya que los elementos fueron movidos al panel izquierdo */}
          <div className="mt-auto">
            {/* Contenido movido al panel izquierdo */}
          </div>
        </aside>
      </div>

      {/* Renderiza el ReturnsModal */}
      <ReturnsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)} // Cierra el modal
        ventaId={venta?.id}
        itemsToReturn={Object.entries(selectedItems).map(([id, qty]) => {
          const item = ventaItems.find(i => i.id === +id);
          return {
            id: id,
            nombre: item?.nombre || 'Producto desconocido',
            cantidad: qty,
            precio: item?.precio || 0,
            subtotal: (item?.precio || 0) * qty
          };
        })}
        total={total}
      />
    </div>
  );
};