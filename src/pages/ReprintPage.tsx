// src/pages/ReprintPage.tsx

import React, { useState, useEffect } from 'react'
import { Printer, Search, Calendar as CalendarIcon } from 'lucide-react'
import { HeaderWithMenu } from '../components/common/HeaderWithMenu'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface Document {
  id: string
  folio: string
  tipo: string
  total: number
  fecha: string
}

export const ReprintPage: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { empresaId } = useAuth()
  const today = new Date().toISOString().split('T')[0]

  const [fecha, setFecha] = useState(today)
  const [searchFolio, setSearchFolio] = useState('')
  const [docs, setDocs] = useState<Document[]>([])
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [copies, setCopies] = useState(1)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadDocs()
  }, [fecha])

  const loadDocs = async () => {
    setLoading(true)
    try {
      let data: any[] = []
      if (empresaId) {
        const { data: rows } = await supabase
          .from('ventas')
          .select('id,folio,tipo_dte,total,fecha')
          .eq('empresa_id', empresaId)
          .eq('fecha::date', fecha)
          .order('fecha', { ascending: false })
        data = rows || []
      }
      if (!data.length) {
        data = [{
          id: '1',
          folio: '9',
          tipo_dte: 'boleta',
          total: 204,
          fecha: new Date().toISOString()
        }]
      }
      setDocs(data.map(d => ({
        id: d.id,
        folio: d.folio,
        tipo: d.tipo_dte === 'boleta'
          ? 'Boleta manual (no válida al SII)'
          : 'Documento electrónico',
        total: d.total,
        fecha: d.fecha
      })))
      setSelectedDoc(null)
      setSearchFolio('')
      setCopies(1)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    const found = docs.find(d =>
      d.folio.toLowerCase().includes(searchFolio.toLowerCase())
    )
    if (found) setSelectedDoc(found)
  }

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n)

  const handlePrint = () => window.print()

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <HeaderWithMenu
        title="Reimprimir"
        icon={<Printer className="w-6 h-6 text-gray-600" />}
        showClock
      />

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT */}
        <div className="w-1/2 bg-white p-10">
          {!selectedDoc && (
            <p className="text-gray-400 italic text-lg text-center mt-20">
              Debe seleccionar el documento a reimprimir
            </p>
          )}
        </div>

        {/* RIGHT */}
        <aside className="w-1/2 bg-gray-50 p-10 overflow-auto space-y-8">
          {/* CARD */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8 shadow-sm">
            <h4 className="text-base font-semibold text-blue-800 mb-6">
              Documentos disponibles
            </h4>

            {/* Fecha */}
            <div className="flex items-center mb-4">
              <label className="w-36 text-sm text-gray-700">Fecha movimiento</label>
              <div className="relative flex-1">
                <input
                  type="date"
                  value={fecha}
                  onChange={e => setFecha(e.target.value)}
                  className="w-full h-12 px-4 bg-white border border-gray-200 rounded-lg"
                />
                <CalendarIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Ingresa aquí el número de documento"
                value={searchFolio}
                onChange={e => setSearchFolio(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="w-full h-12 pl-12 pr-4 bg-white border border-gray-200 rounded-lg"
              />
            </div>
          </div>

          {/* LISTA o DETALLE */}
          {selectedDoc ? (
            <div className="space-y-6">
              {/* Detalle */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 flex justify-between items-center shadow-sm">
                <div>
                  <h5 className="font-semibold text-gray-900">
                    {selectedDoc.tipo} N°{selectedDoc.folio}
                  </h5>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatPrice(selectedDoc.total)}
                  </p>
                </div>
                <Printer
                  className="w-6 h-6 text-gray-600 cursor-pointer"
                  onClick={handlePrint}
                />
              </div>

              {/* Copias + Botón */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm">
                  <button
                    onClick={() => setCopies(c => Math.max(1, c - 1))}
                    className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded-full"
                  >−</button>
                  <span className="w-8 text-center font-medium">{copies}</span>
                  <button
                    onClick={() => setCopies(c => Math.min(10, c + 1))}
                    className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded-full"
                  >+</button>
                  <span className="text-sm text-gray-600 ml-3">Copias</span>
                </div>
                <button
                  onClick={handlePrint}
                  className="flex-1 h-12 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition"
                >
                  Reimprimir
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {docs.map(doc => (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className="bg-white p-4 rounded-2xl border border-gray-200 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition"
                >
                  <span className="text-sm font-medium">
                    {doc.tipo} N°{doc.folio}
                  </span>
                  <span className="text-sm font-semibold">
                    {formatPrice(doc.total)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
