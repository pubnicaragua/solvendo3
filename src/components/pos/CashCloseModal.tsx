import React, { useState } from 'react'
import { X } from 'lucide-react'
import { usePOS } from '../../contexts/POSContext'

interface CashCloseModalProps {
  isOpen: boolean
  onClose: () => void
}

export const CashCloseModal: React.FC<CashCloseModalProps> = ({
  isOpen,
  onClose
}) => {
  const [loading, setLoading] = useState(false)
  const { closeCaja } = usePOS()

  if (!isOpen) return null


  const handleCloseCash = async () => {
    setLoading(true)
    const success = await closeCaja()
    if (success) {
      onClose()
    }
    setLoading(false)
  }

  // Mock data for cash close summary
  const cashSummary = {
    fechaCierre: '14/05/2025',
    horaCierre: '22:50',
    cajaId: 'Pedro Infantas',
    pedidosInformes: 'Pedidos informes',
    ventasTotales: 102,
    resumenVentas: [
      { tipo: 'Boleta manual', cantidad: 22000, folio: '3421456', metodoPago: 'Tarjeta' },
      { tipo: 'Boleta manual', cantidad: 22000, folio: '3421456', metodoPago: 'Tarjeta' },
      { tipo: 'Boleta manual', cantidad: 22000, folio: '3421456', metodoPago: 'Efectivo' }
    ],
    totales: {
      tarjeta: 34,
      efectivo: 68,
      resumenCaja: 102,
      efectivoFinal: 68,
      tarjetaFinal: 34,
      retiroEfectivo: 2,
      totalReal: 66,
      diferencia: 36
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold text-gray-900">Cierre de caja</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Cash Summary */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha del cierre</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value="2025-05-14"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      readOnly
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hora de cierre</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value="22:50"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Caja de</label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  Pedro Infantas
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resumen de ventas</label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  102 $
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>Tarjeta (1)</span>
                  <span className="font-medium">+ 34 $</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Efectivo (2)</span>
                  <span className="font-medium">+ 68 $</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>Resumen de Caja</span>
                  <span className="font-medium">102 $</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Efectivo (2)</span>
                  <span className="font-medium">+ 68 $</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Tarjeta (1)</span>
                  <span className="font-medium">+ 34 $</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Retiro de efectivo</span>
                  <span className="font-medium text-red-600">- 2 $</span>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total teórico</span>
                  <span className="font-bold">102 $</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total real</span>
                  <span className="font-bold">66 $</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Diferencia</span>
                  <span className="font-bold">36 $</span>
                </div>
              </div>

              <button
                onClick={handleCloseCash}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Cerrando caja...' : 'Cerrar caja'}
              </button>
            </div>

            {/* Right Column - Documents Summary */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-medium text-blue-800">Resumen de documentos</span>
              </div>

              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option>Ventas totales</option>
              </select>

              {/* Documents Table */}
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
                    {cashSummary.resumenVentas.map((venta, index) => (
                      <tr key={index} className="border-t border-gray-200">
                        <td className="px-3 py-2">{venta.tipo}</td>
                        <td className="px-3 py-2">22:00</td>
                        <td className="px-3 py-2">{venta.folio}</td>
                        <td className="px-3 py-2">{venta.metodoPago}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}