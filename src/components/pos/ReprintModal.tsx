import React, { useState, useRef } from 'react'
import { Printer, Search, X } from 'lucide-react'
import { Button } from '../common/Button'
import { useReactToPrint } from 'react-to-print'

interface ReprintModalProps {
  isOpen: boolean
  onClose: () => void
}

interface Document {
  id: string
  folio: string
  tipo: string
  total: number
}

const PrintableDocument = React.forwardRef<HTMLDivElement, { document: Document }>(
  ({ document }, ref) => (
    <div ref={ref} className="p-4">
      <h1 className="font-bold text-lg">{document.tipo} {document.folio}</h1>
      <p>Total: {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' })
        .format(document.total)}</p>
    </div>
  )
)


export const ReprintModal: React.FC<ReprintModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [copies, setCopies] = useState(1)
  const componentRef = useRef<HTMLDivElement>(null)

  if (!isOpen) return null

  const mockDocuments: Document[] = [
    { id: '1', folio: 'N°9', tipo: 'Boleta manual (no válida al SII)', total: 204 }
  ]

  const handleSelectDocument = (doc: Document) => setSelectedDocument(doc)

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    onAfterPrint: () => console.log("Impresión completada"),
  });


  const handleConfirmPrint = () => {
    if (!selectedDocument) return
    handlePrint()
  }


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">Reimprimir</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Panel */}
          <div className="w-1/2 p-6 flex flex-col gap-4 overflow-y-auto">
            {mockDocuments
              .filter((doc) => doc.folio.includes(searchTerm))
              .map((doc) => (
                <div
                  key={doc.id}
                  className={`p-3 border rounded cursor-pointer ${selectedDocument?.id === doc.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  onClick={() => handleSelectDocument(doc)}
                >
                  <p className="font-medium">{doc.tipo} {doc.folio}</p>
                  <p>{new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(doc.total)}</p>
                </div>
              ))}
          </div>

          {/* Right Panel */}
          <div className="w-1/2 p-6 bg-gray-50 border-l border-gray-200">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Ingresa número de documento"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-blue-300 rounded-lg text-sm"
              />
            </div>

            {selectedDocument && (
              <div className="no-printme w-1/2 p-6 bg-gray-50 border-l border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h5 className="font-semibold">{selectedDocument.tipo} {selectedDocument.folio}</h5>
                    <p>{new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(selectedDocument.total)}</p>
                  </div>
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

                <Button fullWidth onClick={handleConfirmPrint}>Reimprimir</Button>

                {/* Documento oculto para impresión */}

                <div className="printme">
                  {selectedDocument && Array.from({ length: copies }).map((_, i) => (
                    <PrintableDocument key={i} ref={i === 0 ? componentRef : null} document={selectedDocument} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
