import React, { useState } from 'react'
import { BarChart3, Filter, X, Download, RefreshCw, Calendar } from 'lucide-react'
import { Button } from '../common/Button'

interface ReportsModalProps {
  isOpen: boolean
  onClose: () => void
}

export const ReportsModal: React.FC<ReportsModalProps> = ({
  isOpen,
  onClose
}) => {
  const [showFilters, setShowFilters] = useState(false)
  const [showDownloadDialog, setShowDownloadDialog] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState({
    caja1: true,
    caja2: true,
    caja3: true,
    caja4: true
  })

  if (!isOpen) return null

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price)
  }

  const reportData = {
    ventasTotales: 67750,
    margen: 67750,
    unidadesVendidas: 67750,
    numeroVentas: 67750,
    ticketPromedio: 67750
  }

  const handleDownload = () => {
    setShowDownloadDialog(true)
  }

  const handleConfirmDownload = () => {
    console.log('Downloading report...')
    setShowDownloadDialog(false)
  }

  if (showDownloadDialog) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
          <div className="p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Última actualización</h3>
            <p className="text-gray-600 mb-4">Fecha: 20/05/2025</p>
            <p className="text-gray-600 mb-6">Hora: 21:19:50</p>
            
            <div className="flex gap-3">
              <Button variant="outline" fullWidth onClick={() => setShowDownloadDialog(false)}>
                Cancelar
              </Button>
              <Button fullWidth onClick={handleConfirmDownload}>
                Realizar nueva actualización
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden relative">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">Reportes</h3>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              icon={Filter}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filtros
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
            >
              Actualizar
            </Button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-green-800">Ventas totales</h4>
                <span className="text-xs text-green-600">+10%</span>
              </div>
              <p className="text-2xl font-bold text-green-900">{formatPrice(reportData.ventasTotales)}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-blue-800">Margen</h4>
                <span className="text-xs text-blue-600">+10%</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{formatPrice(reportData.margen)}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-purple-800">Unidades vendidas</h4>
                <span className="text-xs text-purple-600">+10%</span>
              </div>
              <p className="text-2xl font-bold text-purple-900">{reportData.unidadesVendidas.toLocaleString()}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-orange-800">N° de ventas</h4>
                <span className="text-xs text-orange-600">+10%</span>
              </div>
              <p className="text-2xl font-bold text-orange-900">{reportData.numeroVentas.toLocaleString()}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-red-800">Ticket promedio</h4>
                <span className="text-xs text-red-600">+10%</span>
              </div>
              <p className="text-2xl font-bold text-red-900">{formatPrice(reportData.ticketPromedio)}</p>
            </div>
          </div>

          {/* Chart Area */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6" style={{ height: '300px' }}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">Ventas totales</h4>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>Período anterior: 01/05/2025 - 14/05/2025</span>
                <span>Período seleccionado: 15/05/2025 - 28/05/2025</span>
              </div>
            </div>
            
            {/* Mock Chart */}
            <div className="h-full flex items-end justify-between px-4">
              {Array.from({ length: 12 }, (_, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div 
                    className="bg-blue-500 w-8 rounded-t"
                    style={{ height: `${Math.random() * 200 + 50}px` }}
                  />
                  <span className="text-xs text-gray-500 mt-2">
                    {new Date(2025, 4, i + 15).toLocaleDateString('es-CL', { day: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Period Selector */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span>Ver período anterior</span>
            </div>
            <Button
              variant="primary"
              icon={Download}
              onClick={handleDownload}
            >
              Realizar nueva actualización
            </Button>
          </div>
        </div>

        {/* Filters Sidebar */}
        {showFilters && (
          <div className="absolute top-0 right-0 w-80 h-full bg-white border-l border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-blue-600" />
                <h4 className="text-lg font-semibold text-gray-900">Filtros</h4>
              </div>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-3">Reestablecer filtros</h5>
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="date"
                    defaultValue="2025-01-01"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="date"
                    defaultValue="2025-12-31"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-3">Cajeros</h5>
                <div className="space-y-2">
                  {Object.entries(selectedFilters).map(([key, value]) => (
                    <label key={key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setSelectedFilters(prev => ({
                          ...prev,
                          [key]: e.target.checked
                        }))}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700 capitalize">{key}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button fullWidth>
                Realizar filtro
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}