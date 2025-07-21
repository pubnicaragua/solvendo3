// src/lib/backOfficeEndpoints.ts
export interface BackOfficeEndpoints {
  // Autenticación
  authenticateTerminal: string;
  
  // Sincronización
  syncProducts: string;
  syncPromotions: string;
  syncClients: string;
  syncCAF: string;
  
  // Transacciones
  sendTransaction: string;
  getNextFolio: string;
  
  // Reportes
  getSalesReport: string;
  getInventoryReport: string;
  getCashReport: string;
  
  // Configuración
  getSIIConfig: string;
  getTerminals: string;
  getPaymentProviders: string;
}

export const BACKEND_ENDPOINTS: BackOfficeEndpoints = {
  // Autenticación del terminal
  authenticateTerminal: '/auth/terminal',
  
  // Roles y permisos
  getUserRoles: '/auth/roles',
  
  // Terminales POS
  getTerminales: '/config/terminales',
  
  // Sincronización de datos
  syncProducts: '/sync/products',
  syncPromotions: '/sync/promotions', 
  syncClients: '/sync/clients',
  syncCAF: '/sync/caf',
  
  // Transacciones
  sendTransaction: '/transactions',
  getNextFolio: '/folio/next',
  
  // Reportes
  getSalesReport: '/reports/sales',
  getInventoryReport: '/reports/inventory',
  getCashReport: '/reports/cash',
  
  // Configuración
  getSIIConfig: '/config/sii',
  getTerminals: '/config/terminals',
  getPaymentProviders: '/config/payment-providers'
};

// Estructura de datos que el Back Office debe enviar/recibir
export interface BackOfficeDataStructure {
  // Productos
  products: {
    id: string;
    codigo: string;
    nombre: string;
    precio: number;
    stock: number;
    codigo_barras?: string;
    destacado: boolean;
    activo: boolean;
  }[];
  
  // Promociones
  promotions: {
    id: string;
    nombre: string;
    descripcion: string;
    tipo: 'descuento_porcentaje' | 'descuento_monto' | '2x1' | '3x2';
    valor?: number;
    activo: boolean;
  }[];
  
  // Clientes
  clients: {
    id: string;
    razon_social: string;
    rut: string;
    direccion?: string;
    telefono?: string;
    email?: string;
  }[];
  
  // Ventas (para enviar al Back Office)
  sales: {
    id: string;
    folio: string;
    tipo_dte: 'boleta' | 'factura' | 'nota_credito';
    metodo_pago: string;
    cliente_id?: string;
    items: {
      producto_id: string;
      cantidad: number;
      precio_unitario: number;
      subtotal: number;
    }[];
    subtotal: number;
    total: number;
    fecha: string;
  };
  
  // Movimientos de caja
  cashMovements: {
    tipo: 'ingreso' | 'retiro' | 'venta';
    monto: number;
    observacion?: string;
    fecha: string;
  }[];
  
  // Configuración SII
  siiConfig: {
    rut_emisor: string;
    razon_social_emisor: string;
    certificado_activo: boolean;
    folios_disponibles: {
      tipo_39: number; // Boletas
      tipo_33: number; // Facturas
    };
  };
}

// Headers para las peticiones al Back Office
export const getBackOfficeHeaders = (token?: string) => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  ...(token && { 'Authorization': `Bearer ${token}` })
});

// URL base del Back Office
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.anroltec.cl/api';