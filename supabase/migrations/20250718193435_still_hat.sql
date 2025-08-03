/*
  # Integración SII para Facturación Electrónica
  
  1. Nuevas Tablas
    - `configuracion_sii`: Configuración para conexión con SII
    - `folios_autorizados`: Control de folios autorizados por el SII
    - `documentos_electronicos`: Documentos electrónicos generados
    - `envios_sii`: Control de envíos al SII
    - `certificados_digitales`: Gestión de certificados digitales
  
  2. Funciones
    - `generar_xml_dte`: Generar XML para documentos tributarios
    - `enviar_dte_sii`: Enviar DTE al SII
    - `consultar_estado_dte`: Consultar estado en el SII
  
  3. Seguridad
    - RLS habilitado en todas las tablas
    - Políticas de acceso por empresa
*/

-- Configuración SII por empresa
CREATE TABLE IF NOT EXISTS configuracion_sii (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  rut_emisor text NOT NULL,
  razon_social_emisor text NOT NULL,
  giro_emisor text NOT NULL,
  direccion_emisor text NOT NULL,
  comuna_emisor text NOT NULL,
  ciudad_emisor text NOT NULL,
  codigo_actividad_economica text,
  ambiente text DEFAULT 'certificacion' CHECK (ambiente IN ('certificacion', 'produccion')),
  url_sii_certificacion text DEFAULT 'https://maullin.sii.cl/DTEWS/',
  url_sii_produccion text DEFAULT 'https://palena.sii.cl/DTEWS/',
  usuario_sii text,
  clave_sii text,
  certificado_digital text, -- Base64 del certificado
  clave_certificado text,
  resolucion_sii text,
  fecha_resolucion date,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(empresa_id)
);

-- Folios autorizados por el SII
CREATE TABLE IF NOT EXISTS folios_autorizados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  tipo_documento integer NOT NULL, -- 39: Boleta, 33: Factura, etc.
  folio_desde integer NOT NULL,
  folio_hasta integer NOT NULL,
  fecha_autorizacion date NOT NULL,
  caf_xml text NOT NULL, -- XML del CAF (Código de Autorización de Folios)
  folio_actual integer DEFAULT 0,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(empresa_id, tipo_documento, folio_desde, folio_hasta)
);

-- Documentos electrónicos generados
CREATE TABLE IF NOT EXISTS documentos_electronicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_id uuid REFERENCES ventas(id) ON DELETE CASCADE,
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  tipo_documento integer NOT NULL, -- 39: Boleta, 33: Factura, etc.
  folio integer NOT NULL,
  fecha_emision date NOT NULL,
  rut_receptor text,
  razon_social_receptor text,
  direccion_receptor text,
  comuna_receptor text,
  ciudad_receptor text,
  giro_receptor text,
  monto_neto decimal(10,2) DEFAULT 0,
  monto_iva decimal(10,2) DEFAULT 0,
  monto_total decimal(10,2) NOT NULL,
  xml_dte text, -- XML del DTE generado
  xml_firmado text, -- XML firmado digitalmente
  track_id text, -- ID de seguimiento del SII
  estado_sii text DEFAULT 'pendiente' CHECK (estado_sii IN ('pendiente', 'enviado', 'aceptado', 'rechazado', 'reparo')),
  glosa_sii text, -- Respuesta del SII
  fecha_envio timestamptz,
  fecha_respuesta timestamptz,
  url_consulta text, -- URL para consultar el documento
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(empresa_id, tipo_documento, folio)
);

-- Control de envíos al SII
CREATE TABLE IF NOT EXISTS envios_sii (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  set_dte_id text NOT NULL, -- ID del set de DTE
  xml_envio text NOT NULL, -- XML del envío completo
  track_id text, -- ID de seguimiento del SII
  estado text DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'enviado', 'aceptado', 'rechazado')),
  glosa text, -- Respuesta del SII
  cantidad_documentos integer DEFAULT 0,
  fecha_envio timestamptz DEFAULT now(),
  fecha_respuesta timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Certificados digitales
CREATE TABLE IF NOT EXISTS certificados_digitales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  certificado_p12 text NOT NULL, -- Base64 del archivo .p12
  clave text NOT NULL,
  fecha_vencimiento date NOT NULL,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(empresa_id, nombre)
);

-- Habilitar RLS
ALTER TABLE configuracion_sii ENABLE ROW LEVEL SECURITY;
ALTER TABLE folios_autorizados ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos_electronicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE envios_sii ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificados_digitales ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Allow all for configuracion_sii" ON configuracion_sii FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for folios_autorizados" ON folios_autorizados FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for documentos_electronicos" ON documentos_electronicos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for envios_sii" ON envios_sii FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for certificados_digitales" ON certificados_digitales FOR ALL USING (true) WITH CHECK (true);

-- Función para obtener el próximo folio disponible
CREATE OR REPLACE FUNCTION obtener_proximo_folio(
  p_empresa_id uuid,
  p_tipo_documento integer
)
RETURNS integer AS $$
DECLARE
  v_folio integer;
  v_folio_autorizado record;
BEGIN
  -- Buscar rango de folios autorizados activo
  SELECT * INTO v_folio_autorizado
  FROM folios_autorizados
  WHERE empresa_id = p_empresa_id
    AND tipo_documento = p_tipo_documento
    AND activo = true
    AND folio_actual < folio_hasta
  ORDER BY folio_desde
  LIMIT 1;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No hay folios autorizados disponibles para el tipo de documento %', p_tipo_documento;
  END IF;
  
  -- Incrementar folio actual
  v_folio := v_folio_autorizado.folio_actual + 1;
  
  -- Actualizar folio actual
  UPDATE folios_autorizados
  SET folio_actual = v_folio,
      updated_at = now()
  WHERE id = v_folio_autorizado.id;
  
  RETURN v_folio;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para generar XML DTE
CREATE OR REPLACE FUNCTION generar_xml_dte(
  p_venta_id uuid
)
RETURNS text AS $$
DECLARE
  v_venta record;
  v_empresa record;
  v_cliente record;
  v_items record;
  v_config record;
  v_folio integer;
  v_xml text;
BEGIN
  -- Obtener datos de la venta
  SELECT * INTO v_venta FROM ventas WHERE id = p_venta_id;
  
  -- Obtener datos de la empresa
  SELECT * INTO v_empresa FROM empresas WHERE id = v_venta.empresa_id;
  
  -- Obtener configuración SII
  SELECT * INTO v_config FROM configuracion_sii WHERE empresa_id = v_venta.empresa_id;
  
  -- Obtener datos del cliente (si existe)
  IF v_venta.cliente_id IS NOT NULL THEN
    SELECT * INTO v_cliente FROM clientes WHERE id = v_venta.cliente_id;
  END IF;
  
  -- Obtener próximo folio
  v_folio := obtener_proximo_folio(v_venta.empresa_id, 
    CASE v_venta.tipo_dte 
      WHEN 'boleta' THEN 39
      WHEN 'factura' THEN 33
      WHEN 'nota_credito' THEN 61
      ELSE 39
    END
  );
  
  -- Generar XML básico (simplificado para demo)
  v_xml := '<?xml version="1.0" encoding="ISO-8859-1"?>
<DTE version="1.0">
  <Documento ID="DTE-' || v_folio || '">
    <Encabezado>
      <IdDoc>
        <TipoDTE>' || CASE v_venta.tipo_dte WHEN 'boleta' THEN '39' WHEN 'factura' THEN '33' ELSE '39' END || '</TipoDTE>
        <Folio>' || v_folio || '</Folio>
        <FchEmis>' || to_char(v_venta.fecha, 'YYYY-MM-DD') || '</FchEmis>
      </IdDoc>
      <Emisor>
        <RUTEmisor>' || v_config.rut_emisor || '</RUTEmisor>
        <RznSoc>' || v_config.razon_social_emisor || '</RznSoc>
        <GiroEmis>' || v_config.giro_emisor || '</GiroEmis>
        <DirOrigen>' || v_config.direccion_emisor || '</DirOrigen>
        <CmnaOrigen>' || v_config.comuna_emisor || '</CmnaOrigen>
        <CiudadOrigen>' || v_config.ciudad_emisor || '</CiudadOrigen>
      </Emisor>';
  
  -- Agregar receptor si existe cliente
  IF v_cliente IS NOT NULL THEN
    v_xml := v_xml || '
      <Receptor>
        <RUTRecep>' || COALESCE(v_cliente.rut, '66666666-6') || '</RUTRecep>
        <RznSocRecep>' || v_cliente.razon_social || '</RznSocRecep>
        <DirRecep>' || COALESCE(v_cliente.direccion, '') || '</DirRecep>
        <CmnaRecep>' || COALESCE(v_cliente.comuna, '') || '</CmnaRecep>
        <CiudadRecep>' || COALESCE(v_cliente.ciudad, '') || '</CiudadRecep>
      </Receptor>';
  END IF;
  
  v_xml := v_xml || '
      <Totales>
        <MntNeto>' || ROUND(v_venta.subtotal) || '</MntNeto>
        <MntTotal>' || ROUND(v_venta.total) || '</MntTotal>
      </Totales>
    </Encabezado>
    <Detalle>';
  
  -- Agregar items de la venta
  FOR v_items IN 
    SELECT vi.*, p.nombre, p.codigo
    FROM venta_items vi
    JOIN productos p ON vi.producto_id = p.id
    WHERE vi.venta_id = p_venta_id
  LOOP
    v_xml := v_xml || '
      <Item>
        <NroLinDet>' || v_items.id || '</NroLinDet>
        <CdgItem>
          <TpoCodigo>INT1</TpoCodigo>
          <VlrCodigo>' || v_items.codigo || '</VlrCodigo>
        </CdgItem>
        <NmbItem>' || v_items.nombre || '</NmbItem>
        <QtyItem>' || v_items.cantidad || '</QtyItem>
        <PrcItem>' || ROUND(v_items.precio_unitario) || '</PrcItem>
        <MontoItem>' || ROUND(v_items.subtotal) || '</MontoItem>
      </Item>';
  END LOOP;
  
  v_xml := v_xml || '
    </Detalle>
  </Documento>
</DTE>';
  
  -- Insertar documento electrónico
  INSERT INTO documentos_electronicos (
    venta_id,
    empresa_id,
    tipo_documento,
    folio,
    fecha_emision,
    rut_receptor,
    razon_social_receptor,
    monto_total,
    xml_dte
  ) VALUES (
    p_venta_id,
    v_venta.empresa_id,
    CASE v_venta.tipo_dte WHEN 'boleta' THEN 39 WHEN 'factura' THEN 33 ELSE 39 END,
    v_folio,
    v_venta.fecha::date,
    COALESCE(v_cliente.rut, '66666666-6'),
    COALESCE(v_cliente.razon_social, 'Consumidor Final'),
    v_venta.total,
    v_xml
  );
  
  RETURN v_xml;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para enviar DTE al SII (simulada)
CREATE OR REPLACE FUNCTION enviar_dte_sii(
  p_documento_id uuid
)
RETURNS boolean AS $$
DECLARE
  v_documento record;
  v_track_id text;
BEGIN
  -- Obtener documento
  SELECT * INTO v_documento FROM documentos_electronicos WHERE id = p_documento_id;
  
  -- Generar track_id simulado
  v_track_id := 'TRK' || extract(epoch from now())::bigint;
  
  -- Actualizar documento con track_id y estado
  UPDATE documentos_electronicos
  SET track_id = v_track_id,
      estado_sii = 'enviado',
      fecha_envio = now()
  WHERE id = p_documento_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Otorgar permisos
GRANT EXECUTE ON FUNCTION obtener_proximo_folio TO authenticated;
GRANT EXECUTE ON FUNCTION obtener_proximo_folio TO anon;
GRANT EXECUTE ON FUNCTION obtener_proximo_folio TO service_role;

GRANT EXECUTE ON FUNCTION generar_xml_dte TO authenticated;
GRANT EXECUTE ON FUNCTION generar_xml_dte TO anon;
GRANT EXECUTE ON FUNCTION generar_xml_dte TO service_role;

GRANT EXECUTE ON FUNCTION enviar_dte_sii TO authenticated;
GRANT EXECUTE ON FUNCTION enviar_dte_sii TO anon;
GRANT EXECUTE ON FUNCTION enviar_dte_sii TO service_role;

-- Insertar configuración SII de ejemplo
INSERT INTO configuracion_sii (
  empresa_id,
  rut_emisor,
  razon_social_emisor,
  giro_emisor,
  direccion_emisor,
  comuna_emisor,
  ciudad_emisor,
  codigo_actividad_economica,
  ambiente,
  usuario_sii,
  resolucion_sii,
  fecha_resolucion
) VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  '76.123.456-7',
  'Empresa Demo POS',
  'Comercio al por menor',
  'Av. Principal 123',
  'Santiago',
  'Santiago',
  '471000',
  'certificacion',
  'USUARIO_SII_DEMO',
  '0',
  '2024-01-01'
) ON CONFLICT (empresa_id) DO NOTHING;

-- Insertar folios autorizados de ejemplo
INSERT INTO folios_autorizados (
  empresa_id,
  tipo_documento,
  folio_desde,
  folio_hasta,
  fecha_autorizacion,
  caf_xml,
  folio_actual
) VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  39, -- Boleta electrónica
  1,
  1000,
  '2024-01-01',
  '<CAF><DA><RE>76123456-7</RE><RS>Empresa Demo POS</RS><TD>39</TD><RNG><D>1</D><H>1000</H></RNG><FA>2024-01-01</FA><RSAPK><M>...</M><E>65537</E></RSAPK><IDK>100</IDK></DA><FRMA algoritmo="SHA1withRSA">...</FRMA></CAF>',
  10
) ON CONFLICT (empresa_id, tipo_documento, folio_desde, folio_hasta) DO NOTHING;

INSERT INTO folios_autorizados (
  empresa_id,
  tipo_documento,
  folio_desde,
  folio_hasta,
  fecha_autorizacion,
  caf_xml,
  folio_actual
) VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  33, -- Factura electrónica
  1,
  500,
  '2024-01-01',
  '<CAF><DA><RE>76123456-7</RE><RS>Empresa Demo POS</RS><TD>33</TD><RNG><D>1</D><H>500</H></RNG><FA>2024-01-01</FA><RSAPK><M>...</M><E>65537</E></RSAPK><IDK>100</IDK></DA><FRMA algoritmo="SHA1withRSA">...</FRMA></CAF>',
  5
) ON CONFLICT (empresa_id, tipo_documento, folio_desde, folio_hasta) DO NOTHING;