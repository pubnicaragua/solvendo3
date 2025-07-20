// Servicio para sincronización con Back Office
import { supabase } from './supabase'

export interface BackOfficeData {
  empresa: string
  rut: string
  productos: string
  promociones: string
  folios_caf: string
  terminales: string
  proveedores_pago: string
}

export interface BackOfficeProduct {
  id: string
  codigo: string
  nombre: string
  precio: number
  stock: number
  activo: boolean
}

export interface BackOfficePromotion {
  id: string
  nombre: string
  descripcion: string
  tipo: string
  valor: number
  activo: boolean
}

export class BackOfficeSync {
  private static instance: BackOfficeSync
  private baseUrl = 'https://your-backend-url.com/api' // Cambiar por la URL real del Back Office

  static getInstance(): BackOfficeSync {
    if (!BackOfficeSync.instance) {
      BackOfficeSync.instance = new BackOfficeSync()
    }
    return BackOfficeSync.instance
  }

  // Autenticación del terminal
  async authenticateTerminal(terminalId: string, rut: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/terminal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          terminal_id: terminalId,
          rut: rut
        })
      })

      if (!response.ok) {
        throw new Error('Error en autenticación')
      }

      const data = await response.json()
      return data.success
    } catch (error) {
      console.error('Error authenticating terminal:', error)
      return false
    }
  }

  // Sincronizar productos desde Back Office
  async syncProducts(empresaId: string): Promise<BackOfficeProduct[]> {
    try {
      const response = await fetch(`${this.baseUrl}/sync/products?empresa_id=${empresaId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error('Error al sincronizar productos')
      }

      const products = await response.json()
      
      // Actualizar productos en Supabase
      for (const product of products) {
        await supabase
          .from('productos')
          .upsert({
            id: product.id,
            empresa_id: empresaId,
            codigo: product.codigo,
            nombre: product.nombre,
            precio: product.precio,
            stock: product.stock,
            activo: product.activo
          })
      }

      return products
    } catch (error) {
      console.error('Error syncing products:', error)
      return []
    }
  }

  // Sincronizar promociones desde Back Office
  async syncPromotions(empresaId: string): Promise<BackOfficePromotion[]> {
    try {
      const response = await fetch(`${this.baseUrl}/sync/promotions?empresa_id=${empresaId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error('Error al sincronizar promociones')
      }

      const promotions = await response.json()
      
      // Actualizar promociones en Supabase
      for (const promotion of promotions) {
        await supabase
          .from('promociones')
          .upsert({
            id: promotion.id,
            empresa_id: empresaId,
            nombre: promotion.nombre,
            descripcion: promotion.descripcion,
            tipo: promotion.tipo,
            valor: promotion.valor,
            activo: promotion.activo
          })
      }

      return promotions
    } catch (error) {
      console.error('Error syncing promotions:', error)
      return []
    }
  }

  // Obtener folios CAF disponibles
  async getCafFolios(empresaId: string, tipoDocumento: number): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/sync/caf?empresa_id=${empresaId}&tipo=${tipoDocumento}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error('Error al obtener folios CAF')
      }

      return await response.json()
    } catch (error) {
      console.error('Error getting CAF folios:', error)
      return null
    }
  }

  // Enviar transacción al Back Office
  async sendTransaction(transactionData: any): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData)
      })

      if (!response.ok) {
        throw new Error('Error al enviar transacción')
      }

      return true
    } catch (error) {
      console.error('Error sending transaction:', error)
      return false
    }
  }

  // Obtener siguiente folio
  async getNextFolio(empresaId: string, tipoDocumento: number): Promise<number | null> {
    try {
      const response = await fetch(`${this.baseUrl}/folio/next`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          empresa_id: empresaId,
          tipo_documento: tipoDocumento
        })
      })

      if (!response.ok) {
        throw new Error('Error al obtener siguiente folio')
      }

      const data = await response.json()
      return data.folio
    } catch (error) {
      console.error('Error getting next folio:', error)
      return null
    }
  }

  // Datos de ANROLTEC SPA desde Back Office
  getAnroltecData(): BackOfficeData {
    return {
      empresa: "ANROLTEC SPA",
      rut: "78168951-3",
      productos: "5 productos con precios reales",
      promociones: "6 promociones activas",
      folios_caf: "50 folios disponibles (Tipo 39)",
      terminales: "3 terminales configurados",
      proveedores_pago: "SumUp activo"
    }
  }
}