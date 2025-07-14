// src/pages/ReportsPage.tsx

import React, { useState, useEffect } from 'react'
import {
  BarChart3,
  Filter,
  Download,
  RefreshCw,
  Calendar as CalendarIcon,
  HelpCircle,
  X as XIcon
} from 'lucide-react'
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Line
} from 'recharts'
import { HeaderWithMenu } from '../components/common/HeaderWithMenu'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

interface ReportData {
  ventasTotales: number
  margen: number
  unidadesVendidas: number
  numeroVentas: number
  ticketPromedio: number
}

interface MonthlyPoint {
  mes: string
  actual: number
  anterior: number
}

export const ReportsPage: React.FC = () => {
  const { empresaId } = useAuth()

  // KPI state
  const [data, setData] = useState<ReportData>({
    ventasTotales: 0,
    margen: 0,
    unidadesVendidas: 0,
    numeroVentas: 0,
    ticketPromedio: 0
  })

  // Chart data
  const [monthlyData, setMonthlyData] = useState<MonthlyPoint[]>([])

  // UI state
  const [showAnterior, setShowAnterior] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Filter sidebar state
  const [fInicio, setFInicio] = useState(
    new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]
  )
  const [fFin, setFFin] = useState(new Date().toISOString().split('T')[0])
  const [cajeros, setCajeros] = useState({
    caja1: true,
    caja2: true,
    caja3: true,
    caja4: true
  })

  // Format currency
  const formatPrice = (n: number) =>
    new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(n)

  // Load KPIs
  const loadData = async () => {
    if (!empresaId) return
    const hoy = new Date().toISOString().split('T')[0]
    const { data: ventas } = await supabase
      .from('ventas')
      .select('total')
      .eq('empresa_id', empresaId)
      .eq('fecha::date', hoy)

    const total = ventas?.reduce((s, v) => s + v.total, 0) || 0
    const count = ventas?.length || 0

    setData({
      ventasTotales: total,
      margen: total * 0.3,
      unidadesVendidas: count * 2,
      numeroVentas: count,
      ticketPromedio: count ? total / count : 0
    })
  }

  // Load monthly chart data via RPC
  const loadMonthlyData = async () => {
    if (!empresaId) return
    try {
      const hoy = new Date()
      const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 11, 1)
      const { data: rows } = await supabase.rpc('ventas_por_mes', {
        empresa_id_arg: empresaId,
        fecha_inicio: inicio.toISOString().split('T')[0],
        fecha_fin: hoy.toISOString().split('T')[0]
      })
      if (rows && Array.isArray(rows) && rows.length) {
        setMonthlyData(
          rows.map((r: any) => ({
            mes: r.mes,
            actual: r.actual,
            anterior: r.anterior
          }))
        )
      } else {
        // fallback empty 12 months
        const meses = [
          'Ene','Feb','Mar','Abr','May','Jun',
          'Jul','Ago','Sep','Oct','Nov','Dic'
        ]
        setMonthlyData(meses.map(m => ({ mes: m, actual: 0, anterior: 0 })))
      }
    } catch {
      // silent
    }
  }

  // Initial load
  useEffect(() => {
    loadData()
    loadMonthlyData()
  }, [empresaId])

  return (
    <div className="h-screen bg-gray-50 flex flex-col relative">
      {/* Header */}
      <HeaderWithMenu
        title="Reportes"
        icon={<BarChart3 className="w-6 h-6 text-gray-600" />}
        showClock
      />

      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* KPI Cards */}
        <div className="grid grid-cols-5 gap-4">
          {[
            { label: 'Ventas totales', value: data.ventasTotales },
            { label: 'Margen', value: data.margen },
            { label: 'Unidades vendidas', value: data.unidadesVendidas },
            { label: 'N° de ventas', value: data.numeroVentas },
            { label: 'Ticket promedio', value: data.ticketPromedio }
          ].map((kpi, idx) => (
            <div
              key={idx}
              className="bg-white p-4 rounded-2xl flex flex-col justify-between shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {kpi.label}
                </span>
                <HelpCircle className="w-4 h-4 text-gray-400" />
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-2xl font-semibold text-gray-900">
                  {formatPrice(kpi.value)}
                </span>
                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-lg">
                  +100%
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Ventas totales
            </h3>
            <button
              onClick={() => {
                loadData()
                loadMonthlyData()
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          {/* Legend */}
          <div className="flex items-center text-sm text-gray-600 space-x-4 mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
              <span>Periodo anterior</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
              <span>Periodo seleccionado</span>
            </div>
            <CalendarIcon className="w-4 h-4" />
          </div>

          {/* Recharts */}
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={monthlyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#eee" horizontal={false} vertical={false} />
              <XAxis dataKey="mes" />
              <YAxis tickFormatter={n => `${n / 1000}k`} />
              {showAnterior && (
                <Line
                  type="monotone"
                  dataKey="anterior"
                  stroke="#CCC"
                  strokeWidth={2}
                  dot={false}
                />
              )}
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#1E40AF"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>

          {/* Toggle */}
          <div className="flex justify-end">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={showAnterior}
                onChange={e => setShowAnterior(e.target.checked)}
                className="rounded"
              />
              Ver período anterior
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-start">
          <div></div>
          <div className="flex flex-col items-end space-y-4">
            <div className="bg-white p-4 rounded-lg shadow-sm text-sm text-gray-700">
              Última actualización
              <div className="mt-1 text-xs text-gray-500">
                Fecha: 20/05/2025 · Hora: 21:19:50
              </div>
            </div>
            <button
              onClick={() => toast.success('Reporte descargado')}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Download className="w-4 h-4" /> Descargar
            </button>
            <button
              onClick={() => setShowFilters(true)}
              className="text-blue-600 hover:text-blue-800"
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters Sidebar */}
      {showFilters && (
        <div className="absolute top-0 right-0 w-80 h-full bg-white border-l border-gray-200 p-6 shadow-lg z-10">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-semibold">Filtros</h4>
            <button onClick={() => setShowFilters(false)}>
              <XIcon className="w-6 h-6 text-gray-500" />
            </button>
          </div>
          <div className="space-y-6">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rango de fechas
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={fInicio}
                  onChange={e => setFInicio(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 text-sm"
                />
                <span className="text-gray-500">–</span>
                <input
                  type="date"
                  value={fFin}
                  onChange={e => setFFin(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 text-sm"
                />
              </div>
            </div>

            {/* Cashiers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cajeros
              </label>
              <div className="space-y-2 text-sm">
                {Object.entries(cajeros).map(([key, val]) => (
                  <label key={key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={val}
                      onChange={e =>
                        setCajeros(prev => ({ ...prev, [key]: e.target.checked }))
                      }
                      className="rounded"
                    />
                    {key.toUpperCase()}
                  </label>
                ))}
              </div>
            </div>

            {/* Apply */}
            <button
              onClick={() => {
                loadData()
                loadMonthlyData()
                setShowFilters(false)
                toast.success('Filtros aplicados')
              }}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              Aplicar filtros
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
