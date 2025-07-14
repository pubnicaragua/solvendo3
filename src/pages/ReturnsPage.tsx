// src/pages/ReturnsPage.tsx

import React, { useState, useEffect } from 'react'
import {
  RotateCcw,
  Search,
  Calendar,
  Plus,
  Minus,
  X as XIcon,
  Check,
  Info
} from 'lucide-react'
import { HeaderWithMenu } from '../components/common/HeaderWithMenu'
import { supabase } from '../lib/supabase'

interface VentaItem {
  id: number
  nombre: string
  cantidad: number
  precio: number
  returnable: number
}

export const ReturnsPage: React.FC = () => {
  const [folio, setFolio] = useState('')
  const [ventaItems, setVentaItems] = useState<VentaItem[]>([])
  const [selectedItems, setSelectedItems] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [tipoNota, setTipoNota] = useState('Nota de crédito manual')

  // Total
  const total = Object.entries(selectedItems).reduce((sum, [id, qty]) => {
    const item = ventaItems.find(i => i.id === +id)
    return sum + (item ? item.precio * qty : 0)
  }, 0)
  const formatPrice = (n: number) =>
    new Intl.NumberFormat('es-CL',{ style:'currency', currency:'CLP' }).format(n)

  // Buscar venta y cargar ítems
  const handleSearchFolio = async () => {
    if (!folio.trim()) return
    setLoading(true)
    try {
      const { data: venta, error: errV } = await supabase
        .from('ventas')
        .select('id,folio')
        .eq('folio', folio)
        .single()
      if (errV || !venta) throw errV || new Error('No encontrada')

      const { data: lines } = await supabase
        .from('ventas_items')
        .select('id,cantidad,precio,producto:productos(nombre)')
        .eq('venta_id', venta.id)

      const enriched = await Promise.all(
        (lines||[]).map(async line => {
          const { data: sumObj } = await supabase
            .from('credit_notes_items')
            .select('quantity',{ head:false })
            .eq('venta_item_id', line.id)
          const used = sumObj?.reduce((s,x)=>s+x.quantity,0) || 0
          return {
            id: line.id,
            nombre: line.producto.nombre,
            cantidad: line.cantidad,
            precio: line.precio,
            returnable: line.cantidad - used
          }
        })
      )
      setVentaItems(enriched.filter(i=>i.returnable>0))
      setSelectedItems({})
      setShowForm(true)
    } catch {
      alert('No se pudo cargar la venta.')
      setShowForm(false)
    } finally {
      setLoading(false)
    }
  }

  // Confirmar devolución
  const handleConfirm = async () => {
    if (!showForm || total===0) return
    setLoading(true)
    try {
      const { data: note } = await supabase
        .from('credit_notes')
        .insert([{ venta_folio: folio, tipo: tipoNota, fecha: new Date() }])
        .single()
      const inserts = Object.entries(selectedItems).map(([id,qty]) => ({
        nota_id: note!.id,
        venta_item_id: +id,
        quantity: qty
      }))
      await supabase.from('credit_notes_items').insert(inserts)
      alert('Nota generada')
      // reset
      setFolio('')
      setVentaItems([])
      setSelectedItems({})
      setShowForm(false)
    } catch {
      alert('Error generando nota')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header idéntico al mock */}
      <HeaderWithMenu
        title="Devolución"
        icon={<RotateCcw className="w-6 h-6 text-gray-600" />}
        showClock
      />

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL */}
        <div className="flex-1 bg-white p-6">
          {/* Buscador productos */}
          <div className="relative mb-6">
            <input
              type="text"
              placeholder="Ingresa aquí el producto o servicio"
              className="w-full pl-4 pr-10 py-3 border rounded-lg bg-gray-50"
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5"/>
          </div>

          {/* Tabla */}
          <div className="grid grid-cols-4 gap-4 text-sm font-medium border-b pb-2 mb-4">
            <span>Producto</span>
            <span>Cantidad</span>
            <span>Descuento</span>
            <span>Importe</span>
          </div>
          <div className="space-y-3 overflow-y-auto max-h-[60vh]">
            {ventaItems.map(item => {
              const qty = selectedItems[item.id]||0
              return (
                <div key={item.id}
                  className="grid grid-cols-4 gap-4 items-center p-3 bg-gray-50 rounded-lg"
                >
                  <span>{item.nombre}</span>
                  <div className="flex items-center gap-2">
                    <button disabled={qty<=0}
                      onClick={()=>setSelectedItems(s=>({...s,[item.id]:qty-1}))}
                      className="p-1 bg-gray-200 rounded"
                    ><Minus className="w-4 h-4"/></button>
                    <span className="w-6 text-center">{qty}</span>
                    <button disabled={qty>=item.returnable}
                      onClick={()=>setSelectedItems(s=>({...s,[item.id]:qty+1}))}
                      className="p-1 bg-gray-200 rounded"
                    ><Plus className="w-4 h-4"/></button>
                  </div>
                  <span>0%</span>
                  <div className="flex items-center justify-between">
                    <span>{formatPrice(item.precio*qty)}</span>
                    <button onClick={()=>{
                      const s={...selectedItems}; delete s[item.id]; setSelectedItems(s)
                    }} className="text-red-500"><XIcon className="w-4 h-4"/></button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pie */}
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <div className="text-xs text-gray-600">
              N° Líneas {ventaItems.length} / Tot. ítems {Object.values(selectedItems).reduce((s,n)=>s+n,0)}
            </div>
            <select
              value={tipoNota}
              onChange={e=>setTipoNota(e.target.value)}
              className="px-3 py-2 border rounded-lg bg-white text-sm"
            >
              <option>Nota de crédito manual</option>
              <option>Nota electrónica</option>
            </select>
            <div className="relative flex-1 max-w-xs">
              <input
                type="text"
                placeholder="Buscar cliente..."
                className="w-full pl-4 pr-4 py-2 border rounded-lg bg-white text-sm"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4"/>
            </div>
          </div>

          {/* Botones inferiores */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="px-4 py-2 bg-gray-100 rounded-lg flex items-center gap-1 text-sm">
              <XIcon className="w-4 h-4"/> Cancelar
            </button>
            <button className="px-4 py-2 bg-gray-100 rounded-lg flex items-center gap-1 text-sm">
              <XIcon className="w-4 h-4"/> Anular venta
            </button>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <aside className="w-96 bg-gray-50 p-6 flex flex-col justify-start">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-4 h-4 text-blue-600"/>
            <span className="text-blue-800 font-medium">Folio de documento</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold">{folio || '—'}</span>
            {folio && <Check className="w-5 h-5 text-green-600"/>}
            {folio && <Info className="w-5 h-5 text-gray-400"/>}
          </div>

          {/* Spacer */}
          <div className="mt-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-xl font-bold">{formatPrice(total)}</span>
            </div>
            <button
              onClick={handleConfirm}
              disabled={!showForm || total===0 || loading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Procesando...' : 'Devolver'}
            </button>
          </div>
        </aside>
      </div>
    </div>
)
}
