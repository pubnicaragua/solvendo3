import React, { useState } from 'react'
import { Printer, Search, X, Download, Mail, Calendar } from 'lucide-react'
import { Button } from '../common/Button'
import { Input } from '../common/Input'

interface ReprintModalProps {
  isOpen: boolean
  onClose: () => void
}

export const ReprintModal: React.FC<ReprintModalProps> = ({
  isOpen,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [showPrintDialog, setShowPrintDialog] = useState(false)
  const [copies, setCopies] = useState(1)

  if (!isOpen) return null

  const mockDocuments = [
    {
      id: '1',
      folio: 'N°9',
      tipo: 'Boleta manual (no válida al SII)',
      total: 204
    }
  ]

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price)
  }

  const handlePrint = () => {
    setShowPrintDialog(true)
  }

  const handleEmail = () => {
    console.log('Sending email...')
  }

  const handleDownload = () => {
    console.log('Downloading PDF...')
  }

  const handleConfirmPrint = () => {
    for (let i = 0; i < copies; i++) {
      setTimeout(() => window.print(), i * 100)
    }
    setShowPrintDialog(false)
  }

  if (showPrintDialog) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
          <div className="p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Boleta generada</h3>
            <p className="text-gray-600 mb-6">Enviar por correo electrónico (Opcional)</p>
            
            <div className="flex gap-3 mb-6">
              <Button variant="outline" fullWidth onClick={handleEmail}>
                Enviar
              </Button>
              <Button fullWidth onClick={handleConfirmPrint}>
                Imprimir
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">Reimprimir</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Panel */}
          <div className="w-1/2 p-6 flex items-center justify-center">
            <p className="text-gray-500 italic">Debe seleccionar el documento a reimprimir</p>
          </div>

          {/* Right Panel */}
          <div className="w-1/2 p-6 bg-gray-50 border-l border-gray-200">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-blue-800">Documentos disponibles</span>
              </div>
              <div className="text-xs text-blue-600 mb-2">Fecha movimiento: 19/05/2025</div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Ingresa aquí el número de documento"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-blue-300 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Mock Document Found */}
            {searchTerm && (
              <div className="border border-gray-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h5 className="font-semibold text-gray-900">Boleta manual (no válida al SII) N°9</h5>
                    <p className="text-sm text-gray-600">{formatPrice(204)}</p>
                  </div>
                  <button
                    onClick={handlePrint}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Printer className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 mb-4">
                  <button
                    onClick={() => setCopies(Math.max(1, copies - 1))}
                    className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-medium">{copies}</span>
                  <button
                    onClick={() => setCopies(Math.min(10, copies + 1))}
                    className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                  >
                    +
                  </button>
                  <span className="text-sm text-gray-600 ml-2">Copias</span>
                </div>

                <Button
                  fullWidth
                  onClick={handlePrint}
                >
                  Reimprimir
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}