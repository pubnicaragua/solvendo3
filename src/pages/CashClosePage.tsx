import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase'; // Ajusta la ruta si es necesario
import { usePOS, Venta, MovimientoCaja } from '../contexts/POSContext';
import { useAuth } from '../contexts/AuthContext';
import { HeaderWithMenu } from '../components/common/HeaderWithMenu';
import { DollarSign, Calendar, Clock, AlertCircle, ClipboardList, PlayCircle } from 'lucide-react';
import toast from 'react-hot-toast';

// Componente para mostrar una línea de resumen
const SummaryLine = ({ label, value, colorClass = 'text-gray-900', icon: Icon }: { label: string; value: string; colorClass?: string; icon?: React.ElementType; }) => (
  <div className="flex justify-between items-center py-2">
    <span className="text-sm text-[#505050] flex items-center">
      {Icon && <Icon size={14} className="mr-2 text-[#828282]"/>}
    {label}
    </span>
    <span className={`text-sm font-medium ${colorClass}`}>{value}</span>
  </div>
);

export const CashClosePage: React.FC = () => {
  const { currentAperturaCaja, openCaja, loading: contextLoading } = usePOS();
  const navigate = useNavigate(); // Ahora está correctamente importado
  const { user } = useAuth(); // Asegúrate de que `user` contenga el nombre y la URL del avatar.

  const [isClosing, setIsClosing] = useState(false);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoCaja[]>([]);
  const [montoFinalInput, setMontoFinalInput] = useState('0'); 
  const { empresaId } = useAuth()

  // Estados para la apertura de caja
  const [montoInicialApertura, setMontoInicialApertura] = useState('');
  const [cajaIdApertura, setCajaIdApertura] = useState('caja_principal_001'); // Valor por defecto simulado
  const [filterType, setFilterType] = useState('all');

  // Formateador de moneda: símbolo de dólar *detrás*
  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(price).replace('$', '') + '$';

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
    setIsClosing(true);
    try {
      if (!currentAperturaCaja || !currentAperturaCaja.id) {
        throw new Error('No hay una caja abierta para cerrar');
      }
      
      const montoFinal = parseFloat(montoFinalInput);
      if (isNaN(montoFinal)) {
        throw new Error('El monto final debe ser un número válido');
      }
      
      // Usar la función closeCaja del contexto POS que ya está disponible
      const success = await closeCaja(montoFinal, 'Cierre de caja manual');
      
      if (!success) {
        throw new Error('Error al cerrar la caja');
      }
      
      toast.success('✅ Caja cerrada exitosamente.');
      
      // Navegar al dashboard después de un cierre exitoso
      setTimeout(() => navigate('/'), 1500);
    } catch (error: any) {
      toast.error('Error al cerrar la caja: ' + error.message);
    } finally {
      setIsClosing(false);
    }
  };

  const handleOpenCash = async () => {
    if (montoInicialApertura === '' || isNaN(parseFloat(montoInicialApertura))) {
      toast.error('Debes ingresar un monto inicial válido');
      return;
    }
    if (!cajaIdApertura) {
      toast.error('Debes especificar un ID de caja');
      return;
    }

    const success = await openCaja(parseFloat(montoInicialApertura));
    if (success) {
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
                  className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-base shadow-sm"
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
  const cajaNombre = 'Pedro Infantas';
  // Reemplazar con datos dinámicos del usuario
  const cajaNombreReal = user?.nombre ? `${user.nombre} ${user?.apellidos || ''}` : 'Usuario';

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col font-sans">
      {/* La cabecera de Solvendo */}
      <HeaderWithMenu
        title="Cierre de caja"
        icon={<DollarSign className="w-6 h-6" />}
        heightClass="h-20" 
        userName={user?.user_metadata?.full_name || user?.email || 'Usuario'} // Usa el nombre completo o email del usuario
        userAvatarSrc={user?.user_metadata?.avatar_url || ''} // Usa la URL del avatar del usuario
      />

      {/* Eliminado el padding del main para que no haya separación con el header */}
      <main className="flex-1 overflow-y-auto"> 
        <div className="p-4 md:p-6"> {/* Añadido el padding a un div interno para mantener el espaciado del contenido */}
          <div className="flex bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-[#E0E0E0] max-w-7xl mx-auto overflow-hidden"> 

            {/* Columna Izquierda (Resumen de Cierre) - 60% */}
            <div className="w-3/5 p-6 border-r border-[#E0E0E0]"> 
              <h2 className="text-xl font-semibold text-[#333333] mb-4"></h2>

              <div className="space-y-3 border-b border-[#E0E0E0] pb-4 mb-4 text-sm text-[#505050]">
                <div className="flex items-center justify-between">
                    <span className="flex items-center text-[#505050]"><Calendar size={14} className="mr-2 text-[#828282]"/>Fecha del cierre</span>
                    <span className="font-medium text-[#505050] text-right">
                      {fechaApertura}
                      <span className="ml-2 inline-flex items-center justify-center w-6 h-6 bg-[#F1F3F5] rounded-full">
                        <Calendar size={12} className="text-[#828282]" />
                      </span>
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="flex items-center text-[#505050]"><Clock size={14} className="mr-2 text-[#828282]"/>Hora de cierre</span>
                    <span className="font-medium text-[#505050] text-right">
                      {horaCierrePropuesta}
                      <span className="ml-2 inline-flex items-center justify-center w-6 h-6 bg-[#F1F3F5] rounded-full">
                        <Clock size={12} className="text-[#828282]" />
                      </span>
                    </span>
                </div>
                <div className="flex items-center justify-between mt-4">
                    <span className="flex items-center text-[#505050]">Caja de</span>
                    <span className="font-medium text-[#505050]">{cajaNombreReal}</span>
                </div>
              </div>

              <h3 className="text-sm font-semibold text-[#505050] mb-2">Resumen de ventas</h3>
              <div className="space-y-2 border-b border-[#E0E0E0] pb-4 mb-4">
                <SummaryLine label="Tarjeta (1)" value={`+ ${formatPrice(ventasTarjeta)}`} icon={undefined} />
                <SummaryLine label="Efectivo (2)" value={`+ ${formatPrice(ventasEfectivo)}`} icon={undefined} />
                <SummaryLine label="Resumen de ventas" value={formatPrice(totalVentasNeto)} colorClass="text-[#505050] font-medium" icon={undefined} />
              </div>

              <h3 className="text-sm font-semibold text-[#505050] mb-2">Resumen de Caja</h3>
              <div className="space-y-2 border-b border-[#E0E0E0] pb-4 mb-4">
                <SummaryLine label="Efectivo (2)" value={`+ ${formatPrice(currentAperturaCaja.monto_inicial + ventasEfectivo + totalIngresos)}`} icon={undefined} />
                <SummaryLine label="Tarjeta (1)" value={`+ ${formatPrice(ventasTarjeta)}`} icon={undefined} />
                <SummaryLine label="Retiro de efectivo" value={`- ${formatPrice(totalRetiros)}`} icon={undefined} />
              </div>

              {/* Sección de Total Teórico, Total Real, Diferencia - AHORA EN CUADROS SEPARADOS */}
              <div className="grid grid-cols-3 gap-4 text-center mt-4">
                  <div className="bg-[#F8F9FB] p-4 rounded-lg border border-[#E0E0E0] flex flex-col justify-between">
                      <label className="block text-xs font-normal text-[#828282] mb-1">Total Teórico</label>
                      <p className="text-xl font-bold text-[#505050]">{formatPrice(montoEsperado)}</p>
                  </div>
                  <div className="bg-[#F8F9FB] p-4 rounded-lg border border-[#E0E0E0] flex flex-col justify-between">
                      <label className="block text-xs font-normal text-[#828282] mb-1">Total Real</label>
                      <input
                        type="number"
                        value={montoFinalInput}
                        onChange={(e) => setMontoFinalInput(e.target.value)}
                        className="w-full text-center text-xl font-bold text-[#505050] bg-transparent focus:outline-none"
                        placeholder="0"
                      />
                  </div>
                  <div className="bg-[#F8F9FB] p-4 rounded-lg border border-[#E0E0E0] flex flex-col justify-between">
                      <label className="block text-xs font-normal text-[#828282] mb-1">Diferencia</label>
                      <p className={`text-xl font-bold ${diferencia === 0 ? 'text-[#2196F3]' : (diferencia > 0 ? 'text-red-500' : 'text-green-500')}`}>
                          {formatPrice(Math.abs(diferencia))}
                      </p>
                  </div>
              </div>

              <button
                onClick={handleCloseCash}
                disabled={isLoading}
                className="w-full mt-6 bg-[#2196F3] text-white py-3 rounded-lg font-semibold hover:bg-[#1976D2] disabled:opacity-50 disabled:cursor-not-allowed transition-all text-base shadow-[0_2px_4px_rgba(33,150,243,0.2)]"
              >
                {isLoading ? 'Cerrando Caja...' : 'Cerrar caja'}
              </button>
            </div>

            {/* Columna Derecha (Resumen de Documentos) - 40% */}
            <div className="w-2/5 p-6 bg-gray-50"> 
              <h2 className="text-lg font-semibold text-[#333333] mb-4 flex items-center">
                <ClipboardList className="mr-2 h-5 w-5 text-[#2196F3]" /> Resumen de documentos
              </h2>
              <div className="mb-4">
                  <label htmlFor="filterType" className="sr-only">Filtrar documentos</label>
                  <select
                      id="filterType"
                      className=" bg-gray-100 block w-full p-2 border border-[#E0E0E0] rounded-md shadow-sm focus:outline-none focus:ring-[#2196F3] focus:border-[#2196F3] text-sm text-[#505050]"
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                  >
                      <option value="all">Ventas totales</option>
                      <option value="boleta">Boleta</option>
                      <option value="factura">Factura</option>
                      <option value="nota_credito">Nota de Crédito</option>
                  </select>
              </div>
              <div className="border border-[#E0E0E0] rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm text-left divide-y divide-[#E0E0E0]">
                    <thead className="bg-[#F8F9FB]">
                      <tr>
                        <th className="px-4 py-3 font-medium text-[#828282] uppercase text-xs tracking-wider">Tipo documento</th>
                        <th className="px-4 py-3 font-medium text-[#828282] uppercase text-xs tracking-wider">Hora</th>
                        <th className="px-4 py-3 font-medium text-[#828282] uppercase text-xs tracking-wider">Folio</th>
                        <th className="px-4 py-3 font-medium text-[#828282] uppercase text-xs tracking-wider">Método de pago</th>
                        <th className="px-4 py-3 font-medium text-[#828282] uppercase text-xs tracking-wider text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-[#E0E0E0]">
                      {ventas.length > 0 ? (
                        ventas.filter(v => filterType === 'all' || v.tipo_dte === filterType).map((venta) => (
                          <tr key={venta.id} className="hover:bg-[#F8F9FB]">
                            <td className="px-4 py-2 whitespace-nowrap capitalize text-[#505050]">{venta.tipo_dte}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-[#505050]">{new Date(venta.fecha).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-[#505050]">{venta.folio}</td>
                            <td className="px-4 py-2 whitespace-nowrap capitalize text-[#505050]">{venta.metodo_pago}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-right font-mono text-[#505050] font-semibold">{formatPrice(venta.total)}</td>
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
        </div>
      </main>
    </div>
  );
};