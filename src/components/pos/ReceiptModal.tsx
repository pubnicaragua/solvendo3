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
  
  // Datos de ejemplo para la factura
  const receiptData = {
    folio: '123456',
    fecha: new Date().toLocaleDateString(),
    items: [
      { nombre: 'Producto de ejemplo', precio: 10000, cantidad: 1, subtotal: 10000 },
      { nombre: 'Otro producto', precio: 5000, cantidad: 1, subtotal: 5000 }
    ],
    total: 15000
  };

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
      body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
      .receipt { max-width: 800px; margin: 0 auto; padding: 20px; }
      .header { text-align: center; margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 20px; }
      .company { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
      .info { margin-bottom: 5px; }
      .document-type { font-size: 18px; font-weight: bold; margin: 10px 0; }
      .customer { margin: 20px 0; padding: 10px; border: 1px solid #eee; background-color: #f9f9f9; }
      .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
      .items-table th { background-color: #f2f2f2; padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
      .items-table td { padding: 10px; border-bottom: 1px solid #eee; }
      .totals { margin-top: 20px; text-align: right; }
      .total-line { display: flex; justify-content: flex-end; margin-bottom: 5px; }
      .total-line span:first-child { margin-right: 20px; font-weight: normal; }
      .total-line span:last-child { min-width: 100px; text-align: right; }
      .grand-total { font-size: 18px; font-weight: bold; border-top: 2px solid #000; padding-top: 10px; margin-top: 10px; }
      .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
    </style>
  </head>
  <body>
    <div class="receipt">
      <div class="header">
        <div class="company">Solvendo POS</div>
        <div class="info">Sistema de Punto de Venta</div>
        <div class="info">RUT: 76.123.456-7</div>
        <div class="info">Dirección: Av. Principal 123, Santiago</div>
        <div class="info">Teléfono: +56 2 2345 6789</div>
      </div>
      
      <div class="document-type">BOLETA ELECTRÓNICA</div>
      <div class="info">Folio: ${receiptData.folio}</div>
      <div class="info">Fecha: ${receiptData.fecha}</div>
      
      <div class="customer">
        <div><strong>Cliente:</strong> Consumidor Final</div>
        <div><strong>RUT:</strong> 11.111.111-1</div>
      </div>
      
      <table class="items-table">
        <thead>
          <tr>
            <th>Descripción</th>
            <th>Cantidad</th>
            <th>Precio Unit.</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${receiptData.items.map(item => `
            <tr>
              <td>${item.nombre}</td>
              <td>${item.cantidad}</td>
              <td>$${item.precio.toLocaleString('es-CL')}</td>
              <td>$${item.subtotal.toLocaleString('es-CL')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="totals">
        <div class="total-line">
          <span>Subtotal:</span>
          <span>$${receiptData.total.toLocaleString('es-CL')}</span>
        </div>
        <div class="total-line">
          <span>IVA (19%):</span>
          <span>$0</span>
        </div>
        <div class="total-line grand-total">
          <span>TOTAL:</span>
          <span>$${receiptData.total.toLocaleString('es-CL')}</span>
        </div>
      </div>
      
      <div class="footer">
        <p>Gracias por su compra</p>
        <p>Este documento no tiene valor tributario</p>
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
        setTimeout(() => {
          onPrint();
        }, 500);
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
              placeholder="cliente@ejemplo.com"
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