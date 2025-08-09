import React, { useState } from 'react'
import { Calendar, DollarSign } from 'lucide-react'
import { HeaderWithMenu } from '../components/common/HeaderWithMenu'

interface CashAuditPageProps {
  onClose: () => void
}

export const CashAuditPage: React.FC<CashAuditPageProps> = ({ onClose }) => {
  const [auditData, setAuditData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    efectivoSistema: 150000,
    efectivoContado: 148500,
    diferencia: -1500,
    observaciones: ''
  })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price)
  }

  const handleSaveAudit = () => {
    console.log('Guardando arqueo:', auditData)
    onClose()
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <HeaderWithMenu title="Arqueo de caja" icon={<DollarSign className="w-6 h-6 text-gray-600" />} />

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Audit Form */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del arqueo</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha del arqueo</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={auditData.fecha}
                      onChange={(e) => setAuditData(prev => ({ ...prev, fecha: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <Calendar className="w-5 h-5 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Caja</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option>Caja Principal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Efectivo según sistema</label>
                  <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                    {formatPrice(auditData.efectivoSistema)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Efectivo contado físicamente</label>
                  <input
                    type="number"
                    value={auditData.efectivoContado}
                    onChange={(e) => setAuditData(prev => ({ 
                      ...prev, 
                      efectivoContado: parseFloat(e.target.value),
                      diferencia: parseFloat(e.target.value) - prev.efectivoSistema
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Diferencia</label>
                  <div className={`px-3 py-2 border border-gray-300 rounded-lg ${
                    auditData.diferencia === 0 ? 'bg-green-50 text-green-800' :
                    auditData.diferencia > 0 ? 'bg-blue-50 text-blue-800' :
                    'bg-red-50 text-red-800'
                  }`}>
                    {formatPrice(auditData.diferencia)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                  <textarea
                    value={auditData.observaciones}
                    onChange={(e) => setAuditData(prev => ({ ...prev, observaciones: e.target.value }))}
                    placeholder="Ingrese observaciones sobre el arqueo..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg h-24 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveAudit}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Guardar arqueo
                </button>
              </div>
            </div>

            {/* Right Column - Summary */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen del día</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium">Ventas en efectivo</span>
                  <span className="font-semibold">{formatPrice(85000)}</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium">Ingresos adicionales</span>
                  <span className="font-semibold">{formatPrice(15000)}</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <span className="text-sm font-medium">Retiros de efectivo</span>
                  <span className="font-semibold">-{formatPrice(5000)}</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                  <span className="text-sm font-medium">Efectivo inicial</span>
                  <span className="font-semibold">{formatPrice(55000)}</span>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                    <span className="font-semibold">Total esperado</span>
                    <span className="font-bold text-lg">{formatPrice(auditData.efectivoSistema)}</span>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Estado del arqueo</h4>
                  <div className={`p-4 rounded-lg text-center ${
                    auditData.diferencia === 0 ? 'bg-green-100 text-green-800' :
                    Math.abs(auditData.diferencia) <= 1000 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {auditData.diferencia === 0 ? '✅ Caja cuadrada' :
                     Math.abs(auditData.diferencia) <= 1000 ? '⚠️ Diferencia menor' :
                     '❌ Diferencia significativa'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}