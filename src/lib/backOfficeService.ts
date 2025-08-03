// Servicio para conectar con Back Office
export const BACKEND_URL = 'https://api.anroltec.cl';

export interface BackOfficeEndpoints {
  // Productos
  productos: '/api/productos',
  promociones: '/api/promociones',
  clientes: '/api/clientes',
  descuentos: '/api/descuentos',
  cupones: '/api/cupones',
  
  // Configuración
  roles: '/auth/roles',
  terminales: '/config/terminales',
  impresion: '/config/impresion',
  
  // SII
  folios: '/api/folios',
  siiConfig: '/api/sii/config',
  
  // Transacciones
  transactions: '/api/transactions',
  nextFolio: '/api/folio/next'
}

export const endpoints: BackOfficeEndpoints = {
  productos: '/api/productos',
  promociones: '/api/promociones',
  clientes: '/api/clientes',
  descuentos: '/api/descuentos',
  cupones: '/api/cupones',
  roles: '/auth/roles',
  terminales: '/config/terminales',
  impresion: '/config/impresion',
  folios: '/api/folios',
  siiConfig: '/api/sii/config',
  transactions: '/api/transactions',
  nextFolio: '/api/folio/next'
};

// Función para hacer peticiones al Back Office
export async function fetchFromBackOffice(endpoint: string, options: RequestInit = {}) {
  const url = `${BACKEND_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching from ${url}:`, error);
    throw error;
  }
}

// Funciones específicas para cada endpoint
export const backOfficeAPI = {
  // Obtener productos
  async getProductos(empresaId: string) {
    return fetchFromBackOffice(`${endpoints.productos}?empresa_id=${empresaId}`);
  },
  
  // Obtener promociones
  async getPromociones(empresaId: string) {
    return fetchFromBackOffice(`${endpoints.promociones}?empresa_id=${empresaId}`);
  },
  
  // Obtener clientes
  async getClientes(empresaId: string) {
    return fetchFromBackOffice(`${endpoints.clientes}?empresa_id=${empresaId}`);
  },
  
  // Obtener descuentos
  async getDescuentos(empresaId: string) {
    return fetchFromBackOffice(`${endpoints.descuentos}?empresa_id=${empresaId}`);
  },
  
  // Obtener cupones
  async getCupones(empresaId: string) {
    return fetchFromBackOffice(`${endpoints.cupones}?empresa_id=${empresaId}`);
  },
  
  // Obtener roles de usuario
  async getRoles(usuarioId: string) {
    return fetchFromBackOffice(`${endpoints.roles}?usuario_id=${usuarioId}`);
  },
  
  // Obtener terminales
  async getTerminales(empresaId: string) {
    return fetchFromBackOffice(`${endpoints.terminales}?empresa_id=${empresaId}`);
  },
  
  // Obtener configuración de impresión
  async getConfigImpresion(empresaId: string) {
    return fetchFromBackOffice(`${endpoints.impresion}?empresa_id=${empresaId}`);
  },
  
  // Obtener folios
  async getFolios(empresaId: string, tipoDocumento: number = 39) {
    return fetchFromBackOffice(`${endpoints.folios}?empresa_id=${empresaId}&tipo_documento=${tipoDocumento}`);
  },
  
  // Obtener configuración SII
  async getSIIConfig(empresaId: string) {
    return fetchFromBackOffice(`${endpoints.siiConfig}?empresa_id=${empresaId}`);
  },
  
  // Enviar transacción
  async sendTransaction(transactionData: any) {
    return fetchFromBackOffice(endpoints.transactions, {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
  },
  
  // Obtener siguiente folio
  async getNextFolio(empresaId: string, tipoDocumento: number = 39) {
    return fetchFromBackOffice(endpoints.nextFolio, {
      method: 'POST',
      body: JSON.stringify({
        empresa_id: empresaId,
        tipo_documento: tipoDocumento
      }),
    });
  }
};