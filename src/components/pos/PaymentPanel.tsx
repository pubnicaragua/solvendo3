import React, { useState } from 'react'
import {
  X as XIcon,
  Truck,
  Package,
  Tag,
  CreditCard
} from 'lucide-react'
import { usePOS } from '../../contexts/POSContext'
import { Fragment } from 'react'

interface Props {
  total: number
  onComplete: () => void
}

export default function PaymentPanel({ total, onComplete }: Props) {
  const { procesarVenta, currentCliente } = usePOS()
  const [tipoDte, setTipoDte] = useState('Boleta electrónica')
  const [envio, setEnvio]     = useState<'inmediato'|'despacho'>('inmediato')
  const [metodo, setMetodo]   = useState('Efectivo')
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    const res = await procesarVenta(metodo, tipoDte, currentCliente?.id)
    setLoading(false)
    if (res.success) onComplete()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-blue-600 font-semibold text-lg">$ Pagar</h3>
      </div>

      {/* Facturación */}
      <div className="space-y-2">
        <label className="font-medium">Facturación</label>
        <select
          value={tipoDte}
          onChange={e => setTipoDte(e.target.value)}
          className="w-full border rounded px-3 py-2"
        >
          <option>Boleta electrónica</option>
          <option>Factura electrónica</option>
        </select>
      </div>

      {/* Envío */}
      <div className="flex items-center space-x-6">
        <button
          onClick={() => setEnvio('inmediato')}
          className={`flex items-center space-x-1 ${
            envio==='inmediato' ? 'text-blue-600' : 'text-gray-500'
          }`}
        >
          <Package /> <span>Entrega inmediata</span>
        </button>
        <button
          onClick={() => setEnvio('despacho')}
          className={`flex items-center space-x-1 ${
            envio==='despacho' ? 'text-blue-600' : 'text-gray-500'
          }`}
        >
          <Truck /> <span>Despacho</span>
        </button>
      </div>

      {/* Descuentos / Cupón */}
      <div className="flex items-center space-x-6">
        <button className="flex items-center text-gray-600 space-x-1">
          <Tag /> <span>Descuentos</span>
        </button>
        <button className="flex items-center text-gray-600 space-x-1">
          <Plus /> <span>Agregar cupón</span>
        </button>
      </div>

      {/* Métodos de pago */}
      <div className="space-y-2">
        <label className="font-medium">Métodos de pago</label>
        <select
          value={metodo}
          onChange={e => setMetodo(e.target.value)}
          className="w-full border rounded px-3 py-2"
        >
          <option>Efectivo</option>
          <option>Cheque</option>
          <option>Tarjeta</option>
        </select>
      </div>

      {/* Totales */}
      <div className="bg-white border rounded p-4 space-y-2">
        <div className="flex justify-between">
          <span>Total a pagar</span>
          <span className="font-semibold">{total.toLocaleString('es-CL', { style:'currency',currency:'CLP' })}</span>
        </div>
        <div className="flex justify-between">
          <span>Total pagado</span>
          <span>$ 0</span>
        </div>
        <div className="flex justify-between">
          <span>Vuelto</span>
          <span>$ 0</span>
        </div>
      </div>

      <button
        onClick={handleConfirm}
        disabled={loading}
        className="w-full py-3 bg-blue-600 text-white rounded font-semibold disabled:opacity-50"
      >
        {loading ? 'Procesando...' : 'Confirmar pago'}
      </button>
    </div>
  )
}
