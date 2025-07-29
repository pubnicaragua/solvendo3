// src/components/pos/DraftsPanel.tsx
import React, { useEffect, useState } from 'react'
import { Search, Check, Trash2 } from 'lucide-react'
import { usePOS } from '../../contexts/POSContext'

interface DraftsPanelProps {
  borradores?: any[];
  onLoad?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function DraftsPanel({ borradores = [], onLoad, onDelete }: DraftsPanelProps) {
  const { borradores = [], loadBorradores, loadDraft, deleteDraft } = usePOS()
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadBorradores()
  }, [loadBorradores])

  const filtered = (borradores || []).filter(d =>
    d.nombre.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-blue-600 font-semibold text-lg">Borradores de Venta</h3>
        <span className="text-sm text-gray-600">
          Fecha: {new Date().toLocaleDateString('es-CL')}
        </span>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar borradores..."
          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <ul className="space-y-2">
        {filtered.map((d, idx) => (
          <li
            key={d.id}
            className="flex items-center justify-between p-2 bg-white rounded border"
          >
            <span className="flex-1 text-sm">
              Nº{idx + 1} {d.nombre} –{' '}
              {new Date(d.fecha).toLocaleDateString('es-CL')}
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onLoad ? onLoad(d.id) : loadDraft(d.id)}
                className="text-green-600 p-1 hover:bg-green-50 rounded"
                title="Cargar"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete ? onDelete(d.id) : deleteDraft(d.id)}
                className="text-red-600 p-1 hover:bg-red-50 rounded"
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </li>
        ))}

        {!filtered.length && (
          <li className="text-center text-gray-500 py-4">
            {search
              ? 'No se encontraron borradores'
              : 'Aquí aparecerán tus borradores guardados'}
          </li>
        )}
      </ul>
    </div>
  )
}
