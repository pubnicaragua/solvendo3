import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase'; // Ajusta la ruta si es necesario
import { usePOS, Venta, MovimientoCaja } from '../contexts/POSContext'; 
import { useAuth } from '../contexts/AuthContext';
import { HeaderWithMenu } from '../components/common/HeaderWithMenu';
import { DollarSign, Calendar, Clock, AlertCircle, ClipboardList, Package, CreditCard, Wallet, MinusCircle, PlayCircle } from 'lucide-react';
import toast from 'react-hot-toast';

// Componente para mostrar una línea de resumen
const SummaryLine = ({ label, value, colorClass = 'text-gray-900', icon: Icon }: { label: string; value: string; colorClass?: string; icon?: React.ElementType; }) => (
  <div className="flex justify-between items-center py-2">
    <span className="text-sm text-gray-600 flex items-center">
      {Icon && <Icon size={14} className="mr-2 text-gray-500"/>}
      {label}
    </span>
    <span className={`text-sm font-medium ${colorClass}`}>{value}</span>
  </div>
);

export const CashClosePage: React.FC = () => {
  const { currentAperturaCaja, closeCaja, openCaja, loading: contextLoading } = usePOS(); 
  const { user } = useAuth(); 

  const [isClosing, setIsClosing] = useState(false);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoCaja[]>([]);
  const [montoFinalInput, setMontoFinalInput] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [filterType, setFilterType] = useState('all'); // Estado para el filtro de documentos

  // Estados para la apertura de caja
  const [montoInicialApertura, setMontoInicialApertura] = useState('');
  const [cajaIdApertura, setCajaIdApertura] = useState('caja_principal_001'); // Valor por defecto simulado

  // Formateador de moneda
  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(price);

  // Cargar datos de ventas y movimientos al montar la página
  useEffect(() => {
    if (currentAperturaCaja) {
      const fetchData = async () => {
        // Cargar ventas para esta apertura de caja
        const { data: ventasData, error: ventasError } = await supabase
          .from('ventas')
          .select('*')
          .eq('apertura_caja_id', currentAperturaCaja.id)
          .order('fecha', { ascending: true }); 

        if (ventasError) {
          toast.error("Error cargando ventas: " + ventasError.message);
          setVentas([]);
        } else {
          setVentas(ventasData as Venta[]);
        }

        // Cargar movimientos de caja para esta apertura de caja
        const { data: movimientosData, error: movimientosError } = await supabase
          .from('movimientos_caja')
          .select('*')
          .eq('apertura_caja_id', currentAperturaCaja.id)
          .order('created_at', { ascending: true });

        if (movimientosError) {
          toast.error("Error cargando movimientos de caja: " + movimientosError.message);
          setMovimientos([]);
        } else {
          setMovimientos(movimientosData as MovimientoCaja[]);
        }
      };
      fetchData();
    } else {
      // Limpiar estados si no hay caja abierta
      setVentas([]);
      setMovimientos([]);
    }
  }, [currentAperturaCaja]);

  // Cálculos con useMemo para optimización y reflejar el diseño
  const { ventasEfectivo, ventasTarjeta, totalIngresos, totalRetiros, totalVentasNeto, montoEsperado } = useMemo(() => {
    // Suma de ventas por método de pago
    const ventasEfectivo = ventas
      .filter(v => v.metodo_pago.toLowerCase() === 'efectivo')
      .reduce((acc, v) => acc + v.total, 0);

    const ventasTarjeta = ventas
      .filter(v => v.metodo_pago.toLowerCase() !== 'efectivo') 
      .reduce((acc, v) => acc + v.total, 0);
      
    const totalVentasNeto = ventasEfectivo + ventasTarjeta; 

    // Suma de ingresos y retiros de caja 
    const totalIngresos = movimientos
      .filter(m => m.tipo === 'ingreso')
      .reduce((acc, m) => acc + m.monto, 0);

    const totalRetiros = movimientos
      .filter(m => m.tipo === 'retiro')
      .reduce((acc, m) => acc + m.monto, 0);

    // Monto esperado en caja (solo efectivo)
    const montoEsperado = (currentAperturaCaja?.monto_inicial || 0) + ventasEfectivo + totalIngresos - totalRetiros;

    return { ventasEfectivo, ventasTarjeta, totalIngresos, totalRetiros, totalVentasNeto, montoEsperado };
  }, [ventas, movimientos, currentAperturaCaja]);
  
  // Cálculo de la diferencia entre el monto final ingresado y el monto esperado
  const diferencia = useMemo(() => {
    const montoFinalNum = parseFloat(montoFinalInput);
    if (isNaN(montoFinalNum)) return 0;
    return montoFinalNum - montoEsperado;
  }, [montoFinalInput, montoEsperado]);


  const handleCloseCash = async () => {
    if (montoFinalInput === '' || isNaN(parseFloat(montoFinalInput))) {
        toast.error('Debes ingresar un monto final válido.');
        return;
    }
    setIsClosing(true);
    const success = await closeCaja(parseFloat(montoFinalInput), observaciones);
    if (success) {
      setMontoFinalInput('');
      setObservaciones('');
    }
    setIsClosing(false);
  };

  const handleOpenCash = async () => {
    if (montoInicialApertura === '' || isNaN(parseFloat(montoInicialApertura))) {
      toast.error('Debes ingresar un monto inicial válido.');
      return;
    }
    if (!cajaIdApertura) {
      toast.error('Debes especificar un ID de caja.');
      return;
    }

    const success = await openCaja(parseFloat(montoInicialApertura), cajaIdApertura);
    if (success) {
      // La página se re-renderizará automáticamente para mostrar el contenido de cierre
      // porque currentAperturaCaja ya no será null, simulando el flujo de trabajo.
      toast.success('Caja abierta exitosamente. Puedes comenzar a trabajar.');
    }
  };
  
  if (contextLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <DollarSign className="mx-auto h-12 w-12 text-blue-500 animate-pulse" />
          <h2 className="mt-4 text-xl font-semibold text-gray-700">Cargando información de la caja...</h2>
        </div>
      </div>
    );
  }
  
  if (!currentAperturaCaja) {
    // Interfaz para abrir caja si no hay ninguna abierta
    return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <div className="text-center bg-white p-8 rounded-lg shadow-md w-full max-w-sm mx-4">
                <AlertCircle className="mx-auto h-12 w-12 text-blue-500 mb-4" />
                <h2 className="mt-4 text-xl font-semibold text-gray-800">No hay una caja abierta</h2>
                <p className="mt-2 text-gray-600 mb-6">Por favor, abre una caja para comenzar a operar.</p>
                
                <div className="mb-4 text-left">
                  <label htmlFor="montoInicialApertura" className="block text-sm font-medium text-gray-700 mb-1">Monto Inicial</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                    <input
                      type="number"
                      id="montoInicialApertura"
                      className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      value={montoInicialApertura}
                      onChange={(e) => setMontoInicialApertura(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="mb-6 text-left">
                  <label htmlFor="cajaIdApertura" className="block text-sm font-medium text-gray-700 mb-1">ID de Caja</label>
                  <input
                    type="text"
                    id="cajaIdApertura"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    value={cajaIdApertura}
                    onChange={(e) => setCajaIdApertura(e.target.value)}
                    placeholder="Ej: caja_001"
                  />
                </div>

                <button
                  onClick={handleOpenCash}
                  disabled={!montoInicialApertura || !cajaIdApertura || isNaN(parseFloat(montoInicialApertura))}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                >
                  <PlayCircle className="w-5 h-5 mr-2"/> Abrir Caja
                </button>
            </div>
        </div>
    );
  }

  const isLoading = contextLoading || isClosing;

  // Formateo de fechas y horas para el display
  const fechaApertura = new Date(currentAperturaCaja.fecha_apertura).toLocaleDateString('es-CL');
  const horaCierrePropuesta = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

  // Nombre de la caja (ejemplo, podrías tener una tabla de cajas con nombres)
  const cajaNombre = currentAperturaCaja.caja_id || 'Caja Principal'; 

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* La cabecera de Solvendo */}
      <HeaderWithMenu 
        title="Cierre de caja" 
        icon={<DollarSign className="w-6 h-6" />} 
        userName={user?.email || 'Usuario'} 
      />

      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
          
          {/* Columna Izquierda (Resumen de Cierre) */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Detalles de Cierre</h2>
            
            <div className="space-y-3 border-b pb-4 mb-4 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                  <span className="flex items-center text-gray-500"><Calendar size={14} className="mr-2"/>Fecha de cierre</span>
                  <span className="font-medium">{fechaApertura}</span> 
              </div>
              <div className="flex items-center justify-between">
                  <span className="flex items-center text-gray-500"><Clock size={14} className="mr-2"/>Hora de cierre</span>
                  <span className="font-medium">{horaCierrePropuesta}</span>
              </div>
              <div className="flex items-center justify-between mt-4">
                  <span className="flex items-center text-gray-500"><Package size={14} className="mr-2"/>Caja de</span>
                  <span className="font-medium">{cajaNombre}</span> 
              </div>
            </div>

            <h3 className="text-md font-semibold text-gray-800 mb-2">Resumen de ventas</h3>
            <div className="space-y-2 border-b pb-4 mb-4">
               <SummaryLine label="Tarjeta" value={`+ ${formatPrice(ventasTarjeta)}`} icon={CreditCard} />
               <SummaryLine label="Efectivo" value={`+ ${formatPrice(ventasEfectivo)}`} icon={Wallet} />
               <SummaryLine label="Total ventas" value={formatPrice(totalVentasNeto)} colorClass="text-blue-700 font-bold" />
            </div>

            <h3 className="text-md font-semibold text-gray-800 mb-2">Resumen de Caja</h3>
            <div className="space-y-2 border-b pb-4 mb-4">
               <SummaryLine label="Fondo Inicial" value={`+ ${formatPrice(currentAperturaCaja.monto_inicial)}`} colorClass="text-blue-600" icon={DollarSign}/>
               <SummaryLine label="Ingresos Extra" value={`+ ${formatPrice(totalIngresos)}`} colorClass="text-green-600" icon={DollarSign} />
               <SummaryLine label="Retiros de Caja" value={`- ${formatPrice(totalRetiros)}`} colorClass="text-red-600" icon={MinusCircle} />
               <SummaryLine label="Total Teórico en Efectivo" value={formatPrice(montoEsperado)} colorClass="text-blue-900 font-bold" />
            </div>

            {/* Sección de Total Teórico, Total Real, Diferencia */}
            <div className="bg-gray-100 p-4 rounded-lg flex items-end gap-2 text-center mt-4">
                <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Total Teórico</label>
                    <p className="text-xl font-bold text-gray-800">{formatPrice(montoEsperado)}</p>
                </div>
                <div className="flex-1">
                    <label htmlFor="montoFinal" className="block text-xs font-medium text-gray-700 mb-1">Total Real</label>
                    <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 text-gray-500 text-lg">$</span>
                        <input
                        type="number"
                        id="montoFinal"
                        className="w-full pl-6 pr-2 py-1.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-lg font-bold"
                        value={montoFinalInput}
                        onChange={(e) => setMontoFinalInput(e.target.value)}
                        placeholder="0"
                        disabled={isLoading}
                        />
                    </div>
                </div>
                <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Diferencia</label>
                    <p className={`text-xl font-bold ${diferencia === 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPrice(diferencia)}
                    </p>
                </div>
            </div>
            
            <div className="mt-4">
                <label htmlFor="observaciones" className="block text-sm font-medium text-gray-700 mb-1">Observaciones (Opcional)</label>
                <textarea
                  id="observaciones"
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Escribe aquí cualquier observación relevante..."
                  disabled={isLoading}
                />
            </div>
            
            <button
              onClick={handleCloseCash}
              disabled={isLoading || montoFinalInput === '' || isNaN(parseFloat(montoFinalInput))}
              className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? 'Cerrando Caja...' : 'Cerrar caja'}
            </button>
          </div>

          {/* Columna Derecha (Resumen de Documentos) */}
          <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <ClipboardList className="mr-2 h-5 w-5" /> Resumen de documentos
            </h2>
            <div className="mb-4">
                <label htmlFor="filterType" className="sr-only">Filtrar documentos</label>
                <select
                    id="filterType"
                    className="block w-full md:w-auto p-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                >
                    <option value="all">Ventas totales</option>
                    <option value="boleta">Boleta</option>
                    <option value="factura">Factura</option>
                    <option value="nota_credito">Nota de Crédito</option>
                </select>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 font-medium text-gray-600">Tipo documento</th>
                      <th className="px-4 py-2 font-medium text-gray-600">Hora</th>
                      <th className="px-4 py-2 font-medium text-gray-600">Folio</th>
                      <th className="px-4 py-2 font-medium text-gray-600">Método de pago</th>
                      <th className="px-4 py-2 font-medium text-gray-600 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {ventas.length > 0 ? (
                      ventas.filter(v => filterType === 'all' || v.tipo_dte === filterType).map((venta) => (
                        <tr key={venta.id}>
                          <td className="px-4 py-2 whitespace-nowrap capitalize">{venta.tipo_dte}</td>
                          <td className="px-4 py-2 whitespace-nowrap">{new Date(venta.fecha).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="px-4 py-2 whitespace-nowrap">{venta.folio}</td>
                          <td className="px-4 py-2 whitespace-nowrap capitalize">{venta.metodo_pago}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-right font-mono">{formatPrice(venta.total)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                          <td colSpan={5} className="text-center py-8 text-gray-500">No se realizaron ventas en este período.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
