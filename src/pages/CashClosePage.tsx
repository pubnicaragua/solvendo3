import React, { useState } from 'react'
import { DollarSign, Calendar as CalendarIcon } from 'lucide-react'
import { HeaderWithMenu } from '../components/common/HeaderWithMenu'
import { usePOS } from '../contexts/POSContext'

export const CashClosePage: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const { closeCaja } = usePOS()

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(price)

  const handleCloseCash = async () => {
    setLoading(true)
    await closeCaja()
    setLoading(false)
  }

  // Datos mock (sustituir con valores de API cuando estén listos)
  const cashSummary = {
    fechaCierre: '2025-05-14',
    horaCierre: '22:50',
    cajaId: 'Pedro Infantas',
    resumenVentasTotal: 102,
    detalleVentas: [
      { tipo: 'Boleta manual', folio: '3421456', metodoPago: 'Tarjeta' },
      { tipo: 'Boleta manual', folio: '3421456', metodoPago: 'Tarjeta' },
      { tipo: 'Boleta manual', folio: '3421456', metodoPago: 'Efectivo' }
    ],
    totales: {
      tarjeta: 34,
      efectivo: 68,
      retiro: -2,
      totalReal: 66,
      diferencia: 36
    }
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <HeaderWithMenu title="Cierre de caja" icon={<DollarSign className="w-6 h-6 text-gray-600" />} />

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {/* Fecha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha del cierre</label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={cashSummary.fechaCierre}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    readOnly
                  />
                  <CalendarIcon className="w-5 h-5 text-gray-400" />
                </div>
              </div>
              {/* Hora */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora de cierre</label>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={cashSummary.horaCierre}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* Caja de */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Caja de</label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                {cashSummary.cajaId}
              </div>
            </div>

            {/* Resumen de ventas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Resumen de ventas</label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                {formatPrice(cashSummary.resumenVentasTotal)}
              </div>
            </div>

            {/* Detalle ventas */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Tarjeta (1)</span>
                <span className="font-medium">+ {formatPrice(cashSummary.totales.tarjeta)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Efectivo (2)</span>
                <span className="font-medium">+ {formatPrice(cashSummary.totales.efectivo)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Retiro de efectivo</span>
                <span className="font-medium text-red-600">
                  {formatPrice(cashSummary.totales.retiro)}
                </span>
              </div>
            </div>

            {/* Totales finales */}
            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total real</span>
                <span className="font-bold">{formatPrice(cashSummary.totales.totalReal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Diferencia</span>
                <span className="font-bold">{formatPrice(cashSummary.totales.diferencia)}</span>
              </div>
            </div>

            {/* Botón cerrar */}
            <button
              onClick={handleCloseCash}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Cerrando caja…' : 'Cerrar caja'}
            </button>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-800">📄 Resumen de documentos</span>
            </div>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option>Ventas totales</option>
            </select>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Tipo de documento</th>
                    <th className="px-3 py-2 text-left">Hora</th>
                    <th className="px-3 py-2 text-left">Folio</th>
                    <th className="px-3 py-2 text-left">Método de pago</th>
                  </tr>
                </thead>
                <tbody>
                  {cashSummary.detalleVentas.map((v, i) => (
                    <tr key={i} className="border-t border-gray-200">
                      <td className="px-3 py-2">{v.tipo}</td>
                      <td className="px-3 py-2">{cashSummary.horaCierre}</td>
                      <td className="px-3 py-2">{v.folio}</td>
                      <td className="px-3 py-2">{v.metodoPago}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
)
}
