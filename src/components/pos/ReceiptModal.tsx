import React from 'react'
import { X } from 'lucide-react'

interface ReceiptModalProps {
  isOpen: boolean
  onClose: () => void
  onPrint: () => void
  onSendEmail: () => void
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  onPrint,
  onSendEmail
}) => {
  if (!isOpen) return null

  // Función para imprimir toda la factura
  const handlePrint = () => {
    try {
      // Crear un iframe oculto para imprimir solo el contenido de la factura
      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'absolute';
      printFrame.style.top = '-9999px';
      document.body.appendChild(printFrame);
      
      // Contenido de la factura
      const content = `
        <html>
          <head>
            <title>Factura</title>
            <style>
              body { font-family: Arial, sans-serif; }
              .receipt { max-width: 300px; margin: 0 auto; padding: 20px; }
              .header { text-align: center; margin-bottom: 20px; }
              .item { display: flex; justify-content: space-between; margin-bottom: 5px; }
              .total { font-weight: bold; border-top: 1px solid #000; padding-top: 10px; margin-top: 10px; }
            </style>
          </head>
          <body>
            <div class="receipt">
              <div class="header">
                <h2>BOLETA ELECTRÓNICA</h2>
                <p>Folio: 123456</p>
                <p>Fecha: ${new Date().toLocaleDateString()}</p>
              </div>
              <div class="items">
                <div class="item">
                  <span>Producto de ejemplo</span>
                  <span>$10.000</span>
                </div>
                <div class="item">
                  <span>Otro producto</span>
                  <span>$5.000</span>
                </div>
              </div>
              <div class="total">
                <div class="item">
                  <span>Total:</span>
                  <span>$15.000</span>
                </div>
              </div>
            </div>
          </body>
        </html>
      `;
      
      // Escribir el contenido en el iframe
      printFrame.contentDocument.open();
      printFrame.contentDocument.write(content);
      printFrame.contentDocument.close();
      
      // Imprimir y eliminar el iframe
      printFrame.contentWindow.print();
      document.body.removeChild(printFrame);
      
      // Llamar a la función onPrint que viene como prop
      if (onPrint) {
        onPrint();
      }
    } catch (error) {
      console.error('Error al imprimir:', error);
      toast.error('Error al imprimir');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Boleta generada</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-gray-600 mb-4">Enviar por correo electrónico (Opcional)</p>
          
          <div className="flex mb-4">
            <input
              type="email"
              placeholder="Email"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={onSendEmail}
              className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700"
            >
              Enviar
            </button>
          </div>
          
          <button
            onClick={handlePrint}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700"
          >
            Imprimir
          </button>
        </div>
      </div>
    </div>
  )
}