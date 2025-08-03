import React, { useState, useEffect } from 'react'
import { History, Calendar, Filter, TrendingUp, TrendingDown, Trash2 } from 'lucide-react'
import { HeaderWithMenu } from '../components/common/HeaderWithMenu'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

interface CashHistoryPageProps {
  onClose: () => void
}

interface CashMovement {
  id: string
  tipo: 'ingreso' | 'retiro' | 'venta'
  monto: number
  observacion?: string
  fecha: string
  usuario_nombre?: string
}

export const CashHistoryPage: React.FC<CashHistoryPageProps> = ({ onClose }) => {
  const [movements, setMovements] = useState<CashMovement[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFin: new Date().toISOString().split('T')[0],
    tipo: 'todos'
  })
  const { empresaId } = useAuth()

  useEffect(() => {
    loadMovements()
  }, [filters])

  const loadMovements = async () => {
    if (!empresaId) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('movimientos_caja')
        .select(`
          *,
          usuarios!inner(nombre, apellidos)
        `)
        .gte('fecha::date', filters.fechaInicio)
        .lte('fecha::date', filters.fechaFin)
        .order('fecha', { ascending: false })

      if (error) throw error

      const formattedMovements: CashMovement[] = (data || []).map(mov => ({
        id: mov.id,
        tipo: mov.tipo,
        monto: mov.monto,
        observacion: mov.observacion,
        fecha: mov.fecha,
        usuario_nombre: `${mov.usuarios.nombre} ${mov.usuarios.apellidos}`
      }))

      setMovements(formattedMovements)
    } catch (error) {
      console.error('Error loading movements:', error)
      toast.error('Error al cargar movimientos')
    } finally {
      setLoading(false)
    }
  }
  
  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este movimiento?')) return
    
    try {
      const { error } = await supabase
        .from('movimientos_caja')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      toast.success('Movimiento eliminado correctamente')
      loadMovements()
    } catch (error) {
      console.error('Error deleting movement:', error)
      toast.error('Error al eliminar movimiento')
    }
  }

  const handleApplyFilters = () => {
    loadMovements()
    toast.success('Filtros aplicados correctamente')
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price)
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredMovements = (movements || []).filter(mov => 
    filters.tipo === 'todos' || mov.tipo === filters.tipo
  )

  const totals = filteredMovements.reduce((acc, mov) => {
    if (mov.tipo === 'ingreso' || mov.tipo === 'venta') {
      acc.ingresos += mov.monto
    } else {
      acc.egresos += mov.monto
    }
    return acc
  }, { ingresos: 0, egresos: 0 })

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <HeaderWithMenu title="Historial de movimientos" icon={<History className="w-6 h-6 text-gray-600" />} />

      <div className="flex-1 p-6 overflow-y-auto">
        {/* Filters */}
        <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={filters.fechaInicio}
                  onChange={(e) => setFilters(prev => ({ ...prev, fechaInicio: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
                <Calendar className="w-5 h-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={filters.fechaFin}
                  onChange={(e) => setFilters(prev => ({ ...prev, fechaFin: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
                <Calendar className="w-5 h-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de movimiento</label>
              <select
                value={filters.tipo}
                onChange={(e) => setFilters(prev => ({ ...prev, tipo: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="todos">Todos</option>
                <option value="ingreso">Ingresos</option>
                <option value="retiro">Retiros</option>
                <option value="venta">Ventas</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleApplyFilters}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Aplicar filtros
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-800">Total Ingresos</span>
            </div>
            <p className="text-2xl font-bold text-green-900">{formatPrice(totals.ingresos)}</p>
          </div>

          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-red-800">Total Egresos</span>
            </div>
            <p className="text-2xl font-bold text-red-900">{formatPrice(totals.egresos)}</p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-blue-800">Saldo Neto</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              {formatPrice(totals.ingresos - totals.egresos)}
            </p>
          </div>
        </div>

        {/* Movements Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Movimientos ({filteredMovements.length})
            </h3>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Cargando movimientos...</div>
          ) : filteredMovements.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No hay movimientos en el período seleccionado</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha y Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Observación
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMovements.map((movement) => (
                    <tr key={movement.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDateTime(movement.fecha)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          movement.tipo === 'ingreso' ? 'bg-green-100 text-green-800' :
                          movement.tipo === 'retiro' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {movement.tipo.charAt(0).toUpperCase() + movement.tipo.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={
                          movement.tipo === 'retiro' ? 'text-red-600' : 'text-green-600'
                        }>
                          {movement.tipo === 'retiro' ? '-' : '+'}{formatPrice(movement.monto)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {movement.usuario_nombre || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 flex items-center justify-between">
                        <span>{movement.observacion || '-'}</span>
                        <button
                          onClick={() => handleDelete(movement.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}