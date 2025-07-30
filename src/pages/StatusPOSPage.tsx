import React, { useState, useEffect, useCallback } from 'react'
import { 
  Activity, 
  Database, 
  Wifi, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  Server,
  Users,
  ShoppingCart,
  DollarSign,
  RefreshCw,
  Zap,
  Monitor
} from 'lucide-react'
import { HeaderWithMenu } from '../components/common/HeaderWithMenu'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { usePOS } from '../contexts/POSContext'

interface SystemStatus {
  database: 'connected' | 'disconnected' | 'error'
  supabase: 'connected' | 'disconnected' | 'error'
  authentication: 'active' | 'inactive' | 'error'
  cashRegister: 'open' | 'closed' | 'error'
  products: 'loaded' | 'loading' | 'error'
  clients: 'loaded' | 'loading' | 'error'
  cart: 'active' | 'empty' | 'error'
}

interface LogEntry {
  id: string
  timestamp: string
  level: 'info' | 'warning' | 'error' | 'success'
  component: string
  message: string
  details?: any
}

interface PerformanceMetrics {
  loadTime: number
  dbResponseTime: number
  lastUpdate: string
  memoryUsage: number
  activeConnections: number
}

export const StatusPOSPage: React.FC = () => {
  const { user, empresaId } = useAuth()
  const { cajaAbierta, productos, clientes, carrito, loading } = usePOS()
  
  const [status, setStatus] = useState<SystemStatus>({
    database: 'disconnected',
    supabase: 'disconnected',
    authentication: 'inactive',
    cashRegister: 'closed',
    products: 'loading',
    clients: 'loading',
    cart: 'empty'
  })
  
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    dbResponseTime: 0,
    lastUpdate: new Date().toISOString(),
    memoryUsage: 0,
    activeConnections: 0
  })
  
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(5000) // 5 seconds

  // Add log entry
  const addLog = useCallback((level: LogEntry['level'], component: string, message: string, details?: any) => {
    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
      details
    }
    
    setLogs(prev => [newLog, ...prev.slice(0, 99)]) // Keep only last 100 logs
  }, [])

  // Check database connection
  const checkDatabaseConnection = useCallback(async () => {
    const startTime = Date.now()
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('id')
        .limit(1)
      
      const responseTime = Date.now() - startTime
      
      if (error) {
        setStatus(prev => ({ ...prev, database: 'error', supabase: 'error' }))
        addLog('error', 'Database', `Connection failed: ${error.message}`, error)
        return false
      }
      
      setStatus(prev => ({ ...prev, database: 'connected', supabase: 'connected' }))
      setMetrics(prev => ({ ...prev, dbResponseTime: responseTime }))
      addLog('success', 'Database', `Connection successful (${responseTime}ms)`)
      return true
    } catch (error: any) {
      setStatus(prev => ({ ...prev, database: 'error', supabase: 'error' }))
      addLog('error', 'Database', `Connection error: ${error.message}`, error)
      return false
    }
  }, [addLog])

  // Check authentication status
  const checkAuthStatus = useCallback(() => {
    if (user && empresaId) {
      setStatus(prev => ({ ...prev, authentication: 'active' }))
      addLog('success', 'Auth', `User authenticated: ${user.nombre} (${empresaId})`)
    } else {
      setStatus(prev => ({ ...prev, authentication: 'inactive' }))
      addLog('warning', 'Auth', 'User not authenticated or missing empresa')
    }
  }, [user, empresaId, addLog])

  // Check cash register status
  const checkCashRegisterStatus = useCallback(() => {
    if (cajaAbierta) {
      setStatus(prev => ({ ...prev, cashRegister: 'open' }))
      addLog('success', 'Cash Register', 'Cash register is open')
    } else {
      setStatus(prev => ({ ...prev, cashRegister: 'closed' }))
      addLog('warning', 'Cash Register', 'Cash register is closed')
    }
  }, [cajaAbierta, addLog])

  // Check products status
  const checkProductsStatus = useCallback(() => {
    if (loading) {
      setStatus(prev => ({ ...prev, products: 'loading' }))
    } else if (productos.length > 0) {
      setStatus(prev => ({ ...prev, products: 'loaded' }))
      addLog('success', 'Products', `${productos.length} products loaded`)
    } else {
      setStatus(prev => ({ ...prev, products: 'error' }))
      addLog('error', 'Products', 'No products loaded')
    }
  }, [loading, productos, addLog])

  // Check clients status
  const checkClientsStatus = useCallback(() => {
    if (clientes.length > 0) {
      setStatus(prev => ({ ...prev, clients: 'loaded' }))
      addLog('success', 'Clients', `${clientes.length} clients loaded`)
    } else {
      setStatus(prev => ({ ...prev, clients: 'error' }))
      addLog('warning', 'Clients', 'No clients loaded')
    }
  }, [clientes, addLog])

  // Check cart status
  const checkCartStatus = useCallback(() => {
    if (carrito.length > 0) {
      setStatus(prev => ({ ...prev, cart: 'active' }))
      addLog('info', 'Cart', `${carrito.length} items in cart`)
    } else {
      setStatus(prev => ({ ...prev, cart: 'empty' }))
    }
  }, [carrito, addLog])

  // Get performance metrics
  const updatePerformanceMetrics = useCallback(() => {
    const now = Date.now()
    const memoryInfo = (performance as any).memory
    
    setMetrics(prev => ({
      ...prev,
      lastUpdate: new Date().toISOString(),
      memoryUsage: memoryInfo ? Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024) : 0,
      activeConnections: Object.values(status).filter(s => s === 'connected' || s === 'active' || s === 'open').length
    }))
  }, [status])

  // Run all checks
  const runAllChecks = useCallback(async () => {
    const startTime = Date.now()
    addLog('info', 'System', 'Running system checks...')
    
    await checkDatabaseConnection()
    checkAuthStatus()
    checkCashRegisterStatus()
    checkProductsStatus()
    checkClientsStatus()
    checkCartStatus()
    updatePerformanceMetrics()
    
    const totalTime = Date.now() - startTime
    setMetrics(prev => ({ ...prev, loadTime: totalTime }))
    addLog('info', 'System', `System checks completed in ${totalTime}ms`)
  }, [
    checkDatabaseConnection,
    checkAuthStatus,
    checkCashRegisterStatus,
    checkProductsStatus,
    checkClientsStatus,
    checkCartStatus,
    updatePerformanceMetrics,
    addLog
  ])

  // Auto refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(runAllChecks, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, runAllChecks])

  // Initial load
  useEffect(() => {
    runAllChecks()
  }, [runAllChecks])

  const getStatusIcon = (statusValue: string) => {
    switch (statusValue) {
      case 'connected':
      case 'active':
      case 'open':
      case 'loaded':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'loading':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
      case 'disconnected':
      case 'inactive':
      case 'closed':
      case 'empty':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Monitor className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (statusValue: string) => {
    switch (statusValue) {
      case 'connected':
      case 'active':
      case 'open':
      case 'loaded':
        return 'bg-green-50 border-green-200'
      case 'loading':
        return 'bg-blue-50 border-blue-200'
      case 'disconnected':
      case 'inactive':
      case 'closed':
      case 'empty':
        return 'bg-yellow-50 border-yellow-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'success':
        return 'text-green-600 bg-green-50'
      case 'info':
        return 'text-blue-600 bg-blue-50'
      case 'warning':
        return 'text-yellow-600 bg-yellow-50'
      case 'error':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <HeaderWithMenu 
        title="Status POS - Monitoreo en Tiempo Real" 
        icon={<Activity className="w-6 h-6 text-gray-600" />}
        userName={user?.nombre || 'Usuario'}
        showClock={true}
      />

      <div className="flex-1 p-6 overflow-y-auto">
        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={runAllChecks}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </button>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-700">Auto-actualizar</span>
            </label>
            
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              disabled={!autoRefresh}
            >
              <option value={1000}>1 segundo</option>
              <option value={5000}>5 segundos</option>
              <option value={10000}>10 segundos</option>
              <option value={30000}>30 segundos</option>
            </select>
          </div>
          
          <div className="text-sm text-gray-600">
            Última actualización: {formatTime(metrics.lastUpdate)}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Tiempo de Carga</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{metrics.loadTime}ms</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Respuesta BD</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{metrics.dbResponseTime}ms</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center gap-2 mb-2">
              <Monitor className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">Memoria</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{metrics.memoryUsage}MB</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center gap-2 mb-2">
              <Wifi className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-gray-700">Conexiones</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{metrics.activeConnections}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Status */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Server className="w-5 h-5 text-blue-600" />
                Estado del Sistema
              </h3>
            </div>
            
            <div className="p-4 space-y-3">
              {Object.entries(status).map(([key, value]) => {
                const labels = {
                  database: 'Base de Datos',
                  supabase: 'Supabase',
                  authentication: 'Autenticación',
                  cashRegister: 'Caja Registradora',
                  products: 'Productos',
                  clients: 'Clientes',
                  cart: 'Carrito'
                }
                
                return (
                  <div
                    key={key}
                    className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor(value)}`}
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(value)}
                      <span className="font-medium text-gray-900">
                        {labels[key as keyof typeof labels]}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {value === 'connected' ? 'Conectado' :
                       value === 'active' ? 'Activo' :
                       value === 'open' ? 'Abierta' :
                       value === 'loaded' ? 'Cargado' :
                       value === 'loading' ? 'Cargando...' :
                       value === 'closed' ? 'Cerrada' :
                       value === 'empty' ? 'Vacío' :
                       value === 'error' ? 'Error' :
                       value === 'disconnected' ? 'Desconectado' :
                       value === 'inactive' ? 'Inactivo' : value}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Real-time Logs */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-600" />
                  Logs en Tiempo Real
                </h3>
                <button
                  onClick={() => setLogs([])}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Limpiar
                </button>
              </div>
            </div>
            
            <div className="p-4 max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>No hay logs disponibles</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 p-3 rounded-lg border border-gray-100"
                    >
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(log.level)}`}>
                        {log.level.toUpperCase()}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">{log.component}</span>
                          <span className="text-xs text-gray-500">{formatTime(log.timestamp)}</span>
                        </div>
                        <p className="text-sm text-gray-700">{log.message}</p>
                        {log.details && (
                          <details className="mt-1">
                            <summary className="text-xs text-gray-500 cursor-pointer">Ver detalles</summary>
                            <pre className="text-xs text-gray-600 mt-1 bg-gray-50 p-2 rounded overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Recargar Aplicación
            </button>
            
            <button
              onClick={() => localStorage.clear()}
              className="flex items-center gap-2 bg-yellow-100 text-yellow-700 px-4 py-3 rounded-lg hover:bg-yellow-200 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Limpiar Cache
            </button>
            
            <button
              onClick={() => {
                const data = {
                  status,
                  metrics,
                  logs: logs.slice(0, 10),
                  timestamp: new Date().toISOString()
                }
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `pos-status-${Date.now()}.json`
                a.click()
                URL.revokeObjectURL(url)
              }}
              className="flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-3 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <Database className="w-4 h-4" />
              Exportar Diagnóstico
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}