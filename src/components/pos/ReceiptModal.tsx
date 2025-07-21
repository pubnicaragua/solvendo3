import React from 'react'
import { X } from 'lucide-react'
import { usePOS } from '../../contexts/POSContext'
import { useAuth } from '../../contexts/AuthContext'

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
  const { carrito, total, currentCliente } = usePOS()
  const { user } = useAuth()
  
  if (!isOpen) return null
  
  // Datos reales de la venta
  const receiptData = {
    folio: 'V' + Date.now(),
    fecha: new Date().toLocaleDateString('es-CL'),
    hora: new Date().toLocaleTimeString('es-CL'),
    items: carrito.map(item => ({
      nombre: item.nombre,
      precio: item.precio,
      cantidad: item.quantity,
      subtotal: item.precio * item.quantity
    })),
    total: total,
    cliente: currentCliente,
    cajero: user?.nombre || 'Usuario'
  };

  // Función para imprimir toda la factura
  const handlePrint = () => {
    // Crear contenido completo de la factura para impresión
    const printContent = `
<html>
  <head>
    <title>Factura</title>
    <style>
      body { 
        font-family: 'Courier New', monospace; 
        margin: 0; 
        padding: 20px; 
        font-size: 12px;
        line-height: 1.4;
        width: 80mm;
        max-width: 300px;
      }
      .receipt { 
        width: 100%;
        margin: 0 auto; 
        padding: 0;
      }
      .header { 
        text-align: center; 
        margin-bottom: 15px; 
        border-bottom: 1px dashed #000; 
        padding-bottom: 15px; 
      }
      .company { 
        font-size: 16px; 
        font-weight: bold; 
        margin-bottom: 5px; 
      }
      .info { 
        margin-bottom: 3px; 
        font-size: 10px;
      }
      .document-type { 
        font-size: 14px; 
        font-weight: bold; 
        margin: 10px 0; 
        text-align: center;
      }
      .customer { 
        margin: 15px 0; 
        padding: 8px; 
        border: 1px dashed #000; 
        font-size: 10px;
      }
      .items-table { 
        width: 100%; 
        border-collapse: collapse; 
        margin: 15px 0; 
        font-size: 10px;
      }
      .items-table th { 
        background-color: transparent; 
        padding: 5px 2px; 
        text-align: left; 
        border-bottom: 1px dashed #000; 
        font-weight: bold;
      }
      .items-table td { 
        padding: 3px 2px; 
        border-bottom: 1px dotted #ccc; 
        vertical-align: top;
      }
      .totals { 
        margin-top: 15px; 
        border-top: 1px dashed #000;
        padding-top: 10px;
      }
      .total-line { 
        display: flex; 
        justify-content: space-between; 
        margin-bottom: 3px; 
        font-size: 11px;
      }
      .grand-total { 
        font-size: 14px; 
        font-weight: bold; 
        border-top: 1px solid #000; 
        padding-top: 8px; 
        margin-top: 8px; 
      }
      .footer { 
        margin-top: 20px; 
        text-align: center; 
        font-size: 9px; 
        border-top: 1px dashed #000;
        padding-top: 10px;
      }
      @media print {
        body { margin: 0; padding: 10px; }
        .receipt { width: 100%; }
      }
    </style>
  </head>
  <body>
    <div class="receipt">
      <div class="header">
        <div class="company">ANROLTEC SPA</div>
        <div class="info">Servicios de Tecnología</div>
        <div class="info">RUT: 78.168.951-3</div>
        <div class="info">Av. Providencia 1234, Santiago</div>
        <div class="info">Teléfono: +56 2 2345 6789</div>
      </div>
      
      <div class="document-type">BOLETA ELECTRÓNICA</div>
      <div class="info">Folio: ${receiptData.folio}</div>
      <div class="info">Fecha: ${receiptData.fecha}</div>
      <div class="info">Hora: ${receiptData.hora}</div>
      <div class="info">Cajero: ${receiptData.cajero}</div>
      
      <div class="customer">
        <div><strong>Cliente:</strong> ${receiptData.cliente?.razon_social || 'Consumidor Final'}</div>
        <div><strong>RUT:</strong> ${receiptData.cliente?.rut || '66.666.666-6'}</div>
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
              <td>$${Math.round(item.precio).toLocaleString('es-CL')}</td>
              <td>$${Math.round(item.subtotal).toLocaleString('es-CL')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="totals">
        <div class="total-line">
          <span>Subtotal:</span>
          <span>$${Math.round(receiptData.total).toLocaleString('es-CL')}</span>
        </div>
        <div class="total-line">
          <span>IVA (19%):</span>
          <span>$0</span>
        </div>
        <div class="total-line grand-total">
          <span>TOTAL:</span>
          <span>$${Math.round(receiptData.total).toLocaleString('es-CL')}</span>
        </div>
      </div>
      
      <div class="footer">
        <p>Gracias por su compra</p>
        <p>Documento Tributario Electrónico</p>
        <p>Consulte en: www.sii.cl</p>
        <p>ANROLTEC SPA - Servicios de Tecnología</p>
      </div>
    </div>
  </body>
</html>
    `
      
    // Crear elemento temporal para impresión
    const printElement = document.createElement('div')
    printElement.innerHTML = printContent
    printElement.style.display = 'none'
    document.body.appendChild(printElement)
    
    // Guardar contenido original
    const originalContent = document.body.innerHTML
    
    // Reemplazar contenido temporalmente
    document.body.innerHTML = printContent
    
    // Imprimir
    window.print()
    
    // Restaurar contenido original
    document.body.innerHTML = originalContent
    
    // Limpiar
    if (document.body.contains(printElement)) {
      document.body.removeChild(printElement)
    }
    
    // Llamar callback
    if (onPrint) {
      onPrint()
    }
  }

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