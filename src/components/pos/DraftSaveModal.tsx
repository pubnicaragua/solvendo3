// src/components/pos/DraftSaveModal.tsx
import React, { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'
import { usePOS } from '../../contexts/POSContext'
import toast from 'react-hot-toast'

interface DraftSaveModalProps {
  isOpen: boolean
  onClose: () => void
  draftName: string
  setDraftName: (name: string) => void
  onSave: () => void
}

export const DraftSaveModal: React.FC<DraftSaveModalProps> = ({
  isOpen,
  onClose,
  draftName,
  setDraftName,
  onSave
}) => {
  const { carrito } = usePOS()
  const [loading, setLoading] = useState(false)

  // Limpia el nombre al abrir/cerrar
  useEffect(() => {
    if (!isOpen) setDraftName('')
  }, [isOpen, setDraftName])

  if (!isOpen) return null

  const handleSave = async () => {
    if (!draftName.trim()) {
      toast.error('Debes ingresar un nombre')
      return
    }
    if (carrito.length === 0) {
      toast.error('Carrito vacío')
      return
    }

    setLoading(true)
    try {
      await onSave()
      onClose()
    } catch (err) {
      console.error(err)
      toast.error('Error al guardar borrador')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Save className="w-5 h-5 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">Guardar borrador</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre del borrador
          </label>
          <input
            type="text"
            value={draftName}
            onChange={e => setDraftName(e.target.value)}
            placeholder="Ingresa un nombre para este borrador"
            className="w-full px-4 py-3 mb-6 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DraftSaveModal;
