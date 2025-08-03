// Servicio para integración con SII
import { supabase } from './supabase'

export interface DTEConfig {
  rutEmisor: string
  razonSocialEmisor: string
  giroEmisor: string
  direccionEmisor: string
  comunaEmisor: string
  ciudadEmisor: string
  ambiente: 'certificacion' | 'produccion'
  usuarioSii: string
  claveSii: string
  resolucionSii: string
}

export interface DTEData {
  ventaId: string
  tipoDocumento: number // 39: Boleta, 33: Factura, 61: Nota de Crédito
  rutReceptor?: string
  razonSocialReceptor?: string
  direccionReceptor?: string
  comunaReceptor?: string
  ciudadReceptor?: string
  giroReceptor?: string
  items: Array<{
    codigo: string
    nombre: string
    cantidad: number
    precio: number
    total: number
  }>
  montoNeto: number
  montoIva: number
  montoTotal: number
}

export class SIIService {
  private static instance: SIIService
  private config: DTEConfig | null = null

  static getInstance(): SIIService {
    if (!SIIService.instance) {
      SIIService.instance = new SIIService()
    }
    return SIIService.instance
  }

  async loadConfig(empresaId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('configuracion_sii')
        .select('*')
        .eq('empresa_id', empresaId)
        .single()

      if (error) throw error

      this.config = {
        rutEmisor: data.rut_emisor,
        razonSocialEmisor: data.razon_social_emisor,
        giroEmisor: data.giro_emisor,
        direccionEmisor: data.direccion_emisor,
        comunaEmisor: data.comuna_emisor,
        ciudadEmisor: data.ciudad_emisor,
        ambiente: data.ambiente,
        usuarioSii: data.usuario_sii,
        claveSii: data.clave_sii,
        resolucionSii: data.resolucion_sii
      }
    } catch (error) {
      console.error('Error loading SII config:', error)
      throw error
    }
  }

  async generarDTE(dteData: DTEData): Promise<string> {
    try {
      // Llamar a la función RPC para generar XML
      const { data, error } = await supabase.rpc('generar_xml_dte', {
        p_venta_id: dteData.ventaId
      })

      if (error) throw error

      return data
    } catch (error) {
      console.error('Error generando DTE:', error)
      throw error
    }
  }

  async enviarDTE(documentoId: string): Promise<boolean> {
    try {
      // En un entorno real, aquí se haría la llamada al webservice del SII
      // Por ahora, simulamos el envío
      const { data, error } = await supabase.rpc('enviar_dte_sii', {
        p_documento_id: documentoId
      })

      if (error) throw error

      return data
    } catch (error) {
      console.error('Error enviando DTE al SII:', error)
      throw error
    }
  }

  async consultarEstadoDTE(trackId: string): Promise<any> {
    try {
      // En un entorno real, aquí se consultaría el estado en el SII
      // Por ahora, retornamos un estado simulado
      return {
        trackId,
        estado: 'ACEPTADO',
        glosa: 'Documento aceptado por el SII',
        fechaRespuesta: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error consultando estado DTE:', error)
      throw error
    }
  }

  // Función para generar XML según formato SII
  private generarXMLDTE(dteData: DTEData, folio: number): string {
    const fecha = new Date().toISOString().split('T')[0]
    
    return `<?xml version="1.0" encoding="ISO-8859-1"?>
<DTE version="1.0">
  <Documento ID="DTE-${folio}">
    <Encabezado>
      <IdDoc>
        <TipoDTE>${dteData.tipoDocumento}</TipoDTE>
        <Folio>${folio}</Folio>
        <FchEmis>${fecha}</FchEmis>
        <IndServicio>3</IndServicio>
      </IdDoc>
      <Emisor>
        <RUTEmisor>${this.config?.rutEmisor}</RUTEmisor>
        <RznSoc>${this.config?.razonSocialEmisor}</RznSoc>
        <GiroEmis>${this.config?.giroEmisor}</GiroEmis>
        <Acteco>471000</Acteco>
        <DirOrigen>${this.config?.direccionEmisor}</DirOrigen>
        <CmnaOrigen>${this.config?.comunaEmisor}</CmnaOrigen>
        <CiudadOrigen>${this.config?.ciudadEmisor}</CiudadOrigen>
      </Emisor>
      ${dteData.rutReceptor ? `
      <Receptor>
        <RUTRecep>${dteData.rutReceptor}</RUTRecep>
        <RznSocRecep>${dteData.razonSocialReceptor}</RznSocRecep>
        <DirRecep>${dteData.direccionReceptor || ''}</DirRecep>
        <CmnaRecep>${dteData.comunaReceptor || ''}</CmnaRecep>
        <CiudadRecep>${dteData.ciudadReceptor || ''}</CiudadRecep>
      </Receptor>
      ` : ''}
      <Totales>
        <MntNeto>${Math.round(dteData.montoNeto)}</MntNeto>
        <IVA>${Math.round(dteData.montoIva)}</IVA>
        <MntTotal>${Math.round(dteData.montoTotal)}</MntTotal>
      </Totales>
    </Encabezado>
    <Detalle>
      ${dteData.items.map((item, index) => `
      <Item>
        <NroLinDet>${index + 1}</NroLinDet>
        <CdgItem>
          <TpoCodigo>INT1</TpoCodigo>
          <VlrCodigo>${item.codigo}</VlrCodigo>
        </CdgItem>
        <NmbItem>${item.nombre}</NmbItem>
        <QtyItem>${item.cantidad}</QtyItem>
        <PrcItem>${Math.round(item.precio)}</PrcItem>
        <MontoItem>${Math.round(item.total)}</MontoItem>
      </Item>
      `).join('')}
    </Detalle>
  </Documento>
</DTE>`
  }

  // Función para firmar digitalmente el XML (requiere certificado)
  private async firmarXML(xml: string): Promise<string> {
    // En un entorno real, aquí se firmaría el XML con el certificado digital
    // Por ahora, retornamos el XML sin firmar
    return xml
  }

  // Función para enviar al webservice del SII
  private async enviarWebServiceSII(xmlFirmado: string): Promise<any> {
    const url = this.config?.ambiente === 'produccion' 
      ? 'https://palena.sii.cl/DTEWS/services/DteReceiveService'
      : 'https://maullin.sii.cl/DTEWS/services/DteReceiveService'

    // En un entorno real, aquí se haría la llamada SOAP al SII
    // Por ahora, simulamos la respuesta
    return {
      trackId: 'TRK' + Date.now(),
      estado: 'ENVIADO',
      glosa: 'Documento enviado correctamente al SII'
    }
  }
}