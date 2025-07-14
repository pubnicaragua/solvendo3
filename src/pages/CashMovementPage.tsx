// src/pages/CashMovementPage.tsx

import React, { useState, useEffect } from 'react'
import { TrendingUp, Calendar, X as XIcon } from 'lucide-react'
import { HeaderWithMenu } from '../components/common/HeaderWithMenu'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

interface Movement {
  id: number
  tipo: 'ingreso' | 'retiro'
  monto: number
  observacion: string | null
  created_at: string
}

export const CashMovementPage: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { user } = useAuth()
  const today = new Date().toISOString().split('T')[0]

  const [caja, setCaja] = useState('Caja N°1')
  const [fecha, setFecha] = useState(today)
  const [tipo, setTipo] = useState<'retiro' | 'ingreso'>('retiro')
  const [monto, setMonto] = useState('')
  const [obs, setObs] = useState('')
  const [movements, setMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadMovements()
  }, [fecha])

  const loadMovements = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from<Movement>('movimientos_caja')
        .select('*')
        .eq('fecha', fecha)
        .order('created_at', { ascending: false })
      setMovements(data || [])
    } catch {
      // manejar error si hace falta
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!user || Number(monto) <= 0) return
    setLoading(true)
    try {
      const { data: apertura } = await supabase
        .from('aperturas_caja')
        .select('id')
        .eq('usuario_id', user.id)
        .eq('estado', 'abierta')
        .single()
      if (!apertura) throw new Error('Sin caja abierta')

      await supabase.from('movimientos_caja').insert({
        apertura_caja_id: apertura.id,
        usuario_id: user.id,
        tipo,
        monto: Number(monto),
        observacion: obs || null,
        fecha
      })

      // reset form y recarga
      setMonto('')
      setObs('')
      loadMovements()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header idéntico */}
      <HeaderWithMenu
        title="Movimiento de efectivo"
        icon={<TrendingUp className="w-6 h-6 text-gray-600" />}
        showClock
      />

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL */}
        <div className="w-1/2 bg-white p-6 flex flex-col justify-between">
          <form className="grid grid-cols-[auto,1fr] gap-x-6 gap-y-6">
            {/* Número de caja */}
            <label className="text-sm font-medium text-gray-700">Número de caja</label>
            <select
              value={caja}
              onChange={e => setCaja(e.target.value)}
              className="h-12 px-4 bg-gray-50 border border-gray-200 rounded-lg"
            >
              <option>Caja N°1</option>
              <option>Caja N°2</option>
            </select>

            {/* Fecha movimiento */}
            <label className="text-sm font-medium text-gray-700">Fecha movimiento</label>
            <div className="relative">
              <input
                type="date"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                className="w-full h-12 pl-4 pr-12 bg-gray-50 border border-gray-200 rounded-lg"
              />
              <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            {/* Tipo de movimiento */}
            <label className="text-sm font-medium text-gray-700">Tipo de movimiento</label>
            <select
              value={tipo}
              onChange={e => setTipo(e.target.value as any)}
              className="h-12 px-4 bg-gray-50 border border-gray-200 rounded-lg"
            >
              <option value="retiro">Retiro de efectivo</option>
              <option value="ingreso">Ingreso de efectivo</option>
            </select>

            {/* Monto movimiento */}
            <label className="text-sm font-medium text-gray-700">Monto movimiento</label>
            <input
              type="number"
              value={monto}
              onChange={e => setMonto(e.target.value)}
              placeholder="0"
              className="h-12 px-4 bg-gray-50 border border-gray-200 rounded-lg"
            />

            {/* Observación */}
            <label className="text-sm font-medium text-gray-700">Observación</label>
            <textarea
              value={obs}
              onChange={e => setObs(e.target.value)}
              placeholder="Escribe tu observación..."
              className="w-full h-32 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg resize-none"
            />
          </form>

          {/* Botones pie */}
          <div className="flex items-center justify-between pt-6">
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              <XIcon className="w-4 h-4" /> Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || Number(monto) <= 0}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-1/2 bg-gray-50 p-6 flex flex-col overflow-auto">
          {/* Tarjeta Movimientos disponibles */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Movimientos disponibles
              </span>
            </div>
            <div className="text-xs text-blue-600">Fecha movimiento: {fecha}</div>
            <div className="text-xs text-blue-600 mt-1">
              {movements.length === 0 ? 'Sin registros' : `${movements.length} registros`}
            </div>
          </div>

          {/* Lista de movimientos */}
          <div className="space-y-3">
            {movements.map(m => (
              <div
                key={m.id}
                className="bg-white p-4 rounded-lg border border-gray-200"
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium capitalize">{m.tipo}</span>
                  <span className="text-sm font-semibold">
                    {m.tipo === 'ingreso' ? '+' : '-'}${m.monto}
                  </span>
                </div>
                {m.observacion && (
                  <p className="text-xs text-gray-600 mt-2">{m.observacion}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
