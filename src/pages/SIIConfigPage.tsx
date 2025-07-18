import React, { useState, useEffect } from 'react'
import { FileText, Upload, Download, Settings, CheckCircle, XCircle } from 'lucide-react'
import { HeaderWithMenu } from '../components/common/HeaderWithMenu'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

interface SIIConfigPageProps {
  onClose: () => void
}

interface SIIConfig {
  id?: string
  rutEmisor: string
  razonSocialEmisor: string
  giroEmisor: string
  direccionEmisor: string
  comunaEmisor: string
  ciudadEmisor: string
  codigoActividadEconomica: string
  ambiente: 'certificacion' | 'produccion'
  usuarioSii: string
  claveSii: string
  resolucionSii: string
  fechaResolucion: string
}

interface FolioRange {
  id?: string
  tipoDocumento: number
  folioDesde: number
  folioHasta: number
  folioActual: number
  fechaAutorizacion: string
  activo: boolean
}

export const SIIConfigPage: React.FC<SIIConfigPageProps> = ({ onClose }) => {
  const { empresaId } = useAuth()
  const [config, setConfig] = useState<SIIConfig>({
    rutEmisor: '',
    razonSocialEmisor: '',
    giroEmisor: '',
    direccionEmisor: '',
    comunaEmisor: '',
    ciudadEmisor: '',
    codigoActividadEconomica: '',
    ambiente: 'certificacion',
    usuarioSii: '',
    claveSii: '',
    resolucionSii: '',
    fechaResolucion: ''
  })
  const [folios, setFolios] = useState<FolioRange[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'config' | 'folios' | 'certificados'>('config')

  useEffect(() => {
    if (empresaId) {
      loadConfig()
      loadFolios()
    }
  }, [empresaId])

  const loadConfig = async () => {
    if (!empresaId) return

    try {
      const { data, error } = await supabase
        .from('configuracion_sii')
        .select('*')
        .eq('empresa_id', empresaId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setConfig({
          id: data.id,
          rutEmisor: data.rut_emisor,
          razonSocialEmisor: data.razon_social_emisor,
          giroEmisor: data.giro_emisor,
          direccionEmisor: data.direccion_emisor,
          comunaEmisor: data.comuna_emisor,
          ciudadEmisor: data.ciudad_emisor,
          codigoActividadEconomica: data.codigo_actividad_economica,
          ambiente: data.ambiente,
          usuarioSii: data.usuario_sii,
          claveSii: data.clave_sii,
          resolucionSii: data.resolucion_sii,
          fechaResolucion: data.fecha_resolucion
        })
      }
    } catch (error) {
      console.error('Error loading SII config:', error)
    }
  }

  const loadFolios = async () => {
    if (!empresaId) return

    try {
      const { data, error } = await supabase
        .from('folios_autorizados')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('tipo_documento', { ascending: true })

      if (error) throw error

      setFolios(data?.map(f => ({
        id: f.id,
        tipoDocumento: f.tipo_documento,
        folioDesde: f.folio_desde,
        folioHasta: f.folio_hasta,
        folioActual: f.folio_actual,
        fechaAutorizacion: f.fecha_autorizacion,
        activo: f.activo
      })) || [])
    } catch (error) {
      console.error('Error loading folios:', error)
    }
  }

  const saveConfig = async () => {
    if (!empresaId) return

    setLoading(true)
    try {
      const configData = {
        empresa_id: empresaId,
        rut_emisor: config.rutEmisor,
        razon_social_emisor: config.razonSocialEmisor,
        giro_emisor: config.giroEmisor,
        direccion_emisor: config.direccionEmisor,
        comuna_emisor: config.comunaEmisor,
        ciudad_emisor: config.ciudadEmisor,
        codigo_actividad_economica: config.codigoActividadEconomica,
        ambiente: config.ambiente,
        usuario_sii: config.usuarioSii,
        clave_sii: config.claveSii,
        resolucion_sii: config.resolucionSii,
        fecha_resolucion: config.fechaResolucion
      }

      if (config.id) {
        const { error } = await supabase
          .from('configuracion_sii')
          .update(configData)
          .eq('id', config.id)
      } else {
        const { error } = await supabase
          .from('configuracion_sii')
          .insert(configData)
      }

      toast.success('Configuración guardada correctamente')
    } catch (error) {
      console.error('Error saving config:', error)
      toast.error('Error al guardar configuración')
    } finally {
      setLoading(false)
    }
  }

  const getDocumentTypeName = (tipo: number) => {
    switch (tipo) {
      case 33: return 'Factura Electrónica'
      case 39: return 'Boleta Electrónica'
      case 61: return 'Nota de Crédito Electrónica'
      default: return `Tipo ${tipo}`
    }
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <HeaderWithMenu title="Configuración SII" icon={<Settings className="w-6 h-6 text-gray-600" />} />

      <div className="flex-1 p-6 overflow-y-auto">
        {/* Tabs */}
        <div className="flex space-x-1 mb-6">
          {[
            { id: 'config', label: 'Configuración', icon: Settings },
            { id: 'folios', label: 'Folios', icon: FileText },
            { id: 'certificados', label: 'Certificados', icon: Upload }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Configuración Tab */}
        {activeTab === 'config' && (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración del Emisor</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">RUT Emisor *</label>
                <input
                  type="text"
                  value={config.rutEmisor}
                  onChange={(e) => setConfig(prev => ({ ...prev, rutEmisor: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="12.345.678-9"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social *</label>
                <input
                  type="text"
                  value={config.razonSocialEmisor}
                  onChange={(e) => setConfig(prev => ({ ...prev, razonSocialEmisor: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giro *</label>
                <input
                  type="text"
                  value={config.giroEmisor}
                  onChange={(e) => setConfig(prev => ({ ...prev, giroEmisor: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código Actividad Económica</label>
                <input
                  type="text"
                  value={config.codigoActividadEconomica}
                  onChange={(e) => setConfig(prev => ({ ...prev, codigoActividadEconomica: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="471000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección *</label>
                <input
                  type="text"
                  value={config.direccionEmisor}
                  onChange={(e) => setConfig(prev => ({ ...prev, direccionEmisor: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comuna *</label>
                <input
                  type="text"
                  value={config.comunaEmisor}
                  onChange={(e) => setConfig(prev => ({ ...prev, comunaEmisor: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad *</label>
                <input
                  type="text"
                  value={config.ciudadEmisor}
                  onChange={(e) => setConfig(prev => ({ ...prev, ciudadEmisor: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ambiente</label>
                <select
                  value={config.ambiente}
                  onChange={(e) => setConfig(prev => ({ ...prev, ambiente: e.target.value as 'certificacion' | 'produccion' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="certificacion">Certificación</option>
                  <option value="produccion">Producción</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usuario SII</label>
                <input
                  type="text"
                  value={config.usuarioSii}
                  onChange={(e) => setConfig(prev => ({ ...prev, usuarioSii: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Clave SII</label>
                <input
                  type="password"
                  value={config.claveSii}
                  onChange={(e) => setConfig(prev => ({ ...prev, claveSii: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resolución SII</label>
                <input
                  type="text"
                  value={config.resolucionSii}
                  onChange={(e) => setConfig(prev => ({ ...prev, resolucionSii: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Resolución</label>
                <input
                  type="date"
                  value={config.fechaResolucion}
                  onChange={(e) => setConfig(prev => ({ ...prev, fechaResolucion: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            
            <button
              onClick={saveConfig}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>
        )}

        {/* Folios Tab */}
        {activeTab === 'folios' && (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Folios Autorizados</h3>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700">
                Cargar CAF
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo Documento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rango</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Folio Actual</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Disponibles</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {folios.map((folio) => (
                    <tr key={folio.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {getDocumentTypeName(folio.tipoDocumento)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {folio.folioDesde} - {folio.folioHasta}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {folio.folioActual}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {folio.folioHasta - folio.folioActual}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {folio.activo ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <XCircle className="w-3 h-3 mr-1" />
                            Inactivo
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Certificados Tab */}
        {activeTab === 'certificados' && (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Certificados Digitales</h3>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Subir Certificado Digital</h4>
              <p className="text-gray-600 mb-4">Arrastra y suelta tu archivo .p12 o haz clic para seleccionar</p>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700">
                Seleccionar Archivo
              </button>
            </div>
            
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Certificados Cargados</h4>
              <div className="text-center text-gray-500 py-4">
                No hay certificados cargados
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}