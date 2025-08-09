import React, { useState, useEffect } from 'react'
import { User, Search, Calendar, FileText, Download } from 'lucide-react'
import { HeaderWithMenu } from '../components/common/HeaderWithMenu'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Cliente } from '../lib/supabase'

interface CustomerHistoryPageProps {
  onClose: () => void
}

interface Sale {
  id: string
  folio: string
  tipo_dte: string
  fecha: string
  total: number
  estado: string
}

export const CustomerHistoryPage: React.FC<CustomerHistoryPageProps> = ({ onClose }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null)
  const [clientSales, setClientSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const { empresaId } = useAuth()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price)
  }

  const searchClient = async () => {
    if (!searchTerm || !empresaId) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('empresa_id', empresaId)
        .or(`razon_social.ilike.%${searchTerm}%,rut.ilike.%${searchTerm}%`)
        .limit(1)

      if (error) throw error
      
      if (data && data.length > 0) {
        setSelectedClient(data[0])
        loadClientSales(data[0].id)
      } else {
        setSelectedClient(null)
        setClientSales([])
      }
    } catch (error) {
      console.error('Error searching client:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadClientSales = async (clientId: string) => {
    if (!empresaId) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('ventas')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('cliente_id', clientId)
        .gte('fecha', `${dateRange.start}T00:00:00`)
        .lte('fecha', `${dateRange.end}T23:59:59`)
        .order('fecha', { ascending: false })

      if (error) throw error
      setClientSales(data || [])
    } catch (error) {
      console.error('Error loading client sales:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedClient) {
      loadClientSales(selectedClient.id)
    }
  }, [dateRange])

  const totalSales = clientSales.reduce((sum, sale) => sum + sale.total, 0)
  const averageSale = clientSales.length > 0 ? totalSales / clientSales.length : 0

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <HeaderWithMenu title="Historial de cliente" icon={<User className="w-6 h-6 text-gray-600" />} />

      <div className="flex-1 p-6 overflow-y-auto">
        {/* Client Search */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Buscar cliente</h3>
          </div>
          
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nombre o RUT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={searchClient}
              disabled={!searchTerm || loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </div>

        {selectedClient ? (
          <>
            {/* Client Info */}
            <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{selectedClient.razon_social}</h3>
                  <p className="text-sm text-gray-600 mt-1">RUT: {selectedClient.rut}</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm text-gray-600">Cliente desde</span>
                  <span className="font-medium">
                    {new Date(selectedClient.created_at).toLocaleDateString('es-CL')}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-blue-800">Dirección</span>
                  <p className="font-medium text-blue-900">
                    {selectedClient.direccion || 'No registrada'}
                    {selectedClient.comuna && `, ${selectedClient.comuna}`}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <span className="text-sm text-green-800">Contacto</span>
                  <p className="font-medium text-green-900">
                    {selectedClient.telefono || 'No registrado'}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm text-purple-800">Email</span>
                  <p className="font-medium text-purple-900">
                    {selectedClient.email || 'No registrado'}
                  </p>
                </div>
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Período</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Sales Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Total ventas</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">{clientSales.length}</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-green-800">Monto total</span>
                </div>
                <p className="text-2xl font-bold text-green-900">{formatPrice(totalSales)}</p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-purple-800">Ticket promedio</span>
                </div>
                <p className="text-2xl font-bold text-purple-900">{formatPrice(averageSale)}</p>
              </div>
            </div>

            {/* Sales Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Historial de compras ({clientSales.length})
                </h3>
                <button className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
                  <Download className="w-4 h-4" />
                  <span className="text-sm">Exportar</span>
                </button>
              </div>

              {loading ? (
                <div className="p-8 text-center text-gray-500">Cargando historial...</div>
              ) : clientSales.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No hay compras en el período seleccionado</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Folio
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {clientSales.map((sale) => (
                        <tr key={sale.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(sale.fecha).toLocaleDateString('es-CL')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                            {sale.folio}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {sale.tipo_dte === 'boleta' ? 'Boleta' : 
                             sale.tipo_dte === 'factura' ? 'Factura' : 'Nota de crédito'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {formatPrice(sale.total)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              sale.estado === 'completada' ? 'bg-green-100 text-green-800' :
                              sale.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {sale.estado.charAt(0).toUpperCase() + sale.estado.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg p-8 shadow-sm text-center">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay cliente seleccionado</h3>
            <p className="text-gray-600 mb-4">Busque un cliente para ver su historial de compras</p>
          </div>
        )}
      </div>
    </div>
  )
}