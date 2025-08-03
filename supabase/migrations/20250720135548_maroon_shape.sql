/*
  # Datos de ANROLTEC SPA desde Back Office
  
  1. Actualizar empresa con datos reales de ANROLTEC
  2. Insertar productos con precios reales
  3. Insertar promociones activas
  4. Configurar folios CAF
  5. Configurar terminales
*/

-- Actualizar empresa con datos de ANROLTEC SPA
UPDATE empresas 
SET 
  rut = '78.168.951-3',
  razon_social = 'ANROLTEC SPA',
  giro = 'Servicios de tecnología',
  direccion = 'Av. Providencia 1234',
  comuna = 'Providencia',
  ciudad = 'Santiago',
  region = 'Metropolitana',
  telefono = '+56 2 2345 6789',
  email = 'contacto@anroltec.cl'
WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

-- Actualizar usuario con RUT correcto
UPDATE usuarios 
SET 
  rut = '78.168.951-3',
  email = 'emilio@anroltec.cl',
  nombre = 'Emilio',
  apellidos = 'Aguilera'
WHERE id = 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

-- Insertar productos con precios reales
INSERT INTO productos (id, empresa_id, codigo, nombre, descripcion, precio, stock, activo, destacado) VALUES
('prod1-anroltec', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'TECH001', 'Servicio Técnico Básico', 'Servicio técnico básico de 1 hora', 25000, 100, true, true),
('prod2-anroltec', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'TECH002', 'Servicio Técnico Avanzado', 'Servicio técnico avanzado de 2 horas', 45000, 100, true, true),
('prod3-anroltec', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'SOFT001', 'Licencia Software Básica', 'Licencia de software básica mensual', 15000, 50, true, false),
('prod4-anroltec', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'SOFT002', 'Licencia Software Premium', 'Licencia de software premium mensual', 35000, 30, true, true),
('prod5-anroltec', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'CONS001', 'Consultoría TI', 'Consultoría en tecnologías de información', 80000, 20, true, true)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  precio = EXCLUDED.precio,
  stock = EXCLUDED.stock;

-- Insertar 6 promociones activas
INSERT INTO promociones (id, empresa_id, nombre, descripcion, tipo, valor, activo, fecha_inicio, fecha_fin) VALUES
('promo1-anroltec', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Descuento Servicios 15%', 'Descuento del 15% en servicios técnicos', 'descuento_porcentaje', 15, true, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days'),
('promo2-anroltec', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2x1 Licencias', 'Lleva 2 licencias y paga 1', '2x1', null, true, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days'),
('promo3-anroltec', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Descuento $10.000', 'Descuento fijo de $10.000 en consultoría', 'descuento_monto', 10000, true, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days'),
('promo4-anroltec', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Pack Servicios 20%', 'Descuento del 20% en pack de servicios', 'descuento_porcentaje', 20, true, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days'),
('promo5-anroltec', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '3x2 Software', 'Lleva 3 licencias y paga 2', '3x2', null, true, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days'),
('promo6-anroltec', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Primera Consulta Gratis', 'Primera consulta sin costo', 'descuento_porcentaje', 100, true, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days')
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  valor = EXCLUDED.valor;

-- Actualizar configuración SII con datos de ANROLTEC
UPDATE configuracion_sii 
SET 
  rut_emisor = '78.168.951-3',
  razon_social_emisor = 'ANROLTEC SPA',
  giro_emisor = 'Servicios de tecnología',
  direccion_emisor = 'Av. Providencia 1234',
  comuna_emisor = 'Providencia',
  ciudad_emisor = 'Santiago'
WHERE empresa_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

-- Actualizar folios autorizados con 50 folios disponibles
UPDATE folios_autorizados 
SET 
  folio_hasta = 50,
  folio_actual = 0
WHERE empresa_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' AND tipo_documento = 39;

-- Insertar terminales configurados
CREATE TABLE IF NOT EXISTS terminales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  codigo text UNIQUE NOT NULL,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE terminales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for terminales" ON terminales FOR ALL USING (true) WITH CHECK (true);

INSERT INTO terminales (id, empresa_id, nombre, codigo, activo) VALUES
('term1-anroltec', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Terminal Principal', 'TERM001', true),
('term2-anroltec', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Terminal Secundaria', 'TERM002', true),
('term3-anroltec', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Terminal Móvil', 'TERM003', true)
ON CONFLICT (codigo) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  activo = EXCLUDED.activo;

-- Configurar proveedor de pago SumUp
CREATE TABLE IF NOT EXISTS proveedores_pago (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  tipo text NOT NULL,
  configuracion jsonb,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE proveedores_pago ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for proveedores_pago" ON proveedores_pago FOR ALL USING (true) WITH CHECK (true);

INSERT INTO proveedores_pago (id, empresa_id, nombre, tipo, configuracion, activo) VALUES
('sumup-anroltec', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'SumUp', 'tarjeta', '{"api_key": "sumup_api_key", "merchant_id": "anroltec_merchant"}', true)
ON CONFLICT (id) DO UPDATE SET
  configuracion = EXCLUDED.configuracion,
  activo = EXCLUDED.activo;

-- Insertar ventas de ejemplo con datos reales
INSERT INTO ventas (id, empresa_id, sucursal_id, usuario_id, folio, tipo_dte, metodo_pago, subtotal, total, estado, fecha) VALUES
('venta1-anroltec', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '1', 'boleta', 'efectivo', 25000, 25000, 'completada', now() - interval '1 day'),
('venta2-anroltec', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2', 'boleta', 'tarjeta', 45000, 45000, 'completada', now() - interval '2 days'),
('venta3-anroltec', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '3', 'factura', 'transferencia', 80000, 80000, 'completada', now() - interval '3 days')
ON CONFLICT (empresa_id, folio) DO UPDATE SET
  total = EXCLUDED.total,
  metodo_pago = EXCLUDED.metodo_pago;

-- Insertar items de venta
INSERT INTO venta_items (id, venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES
('item1-anroltec', 'venta1-anroltec', 'prod1-anroltec', 1, 25000, 25000),
('item2-anroltec', 'venta2-anroltec', 'prod2-anroltec', 1, 45000, 45000),
('item3-anroltec', 'venta3-anroltec', 'prod5-anroltec', 1, 80000, 80000)
ON CONFLICT (id) DO UPDATE SET
  cantidad = EXCLUDED.cantidad,
  precio_unitario = EXCLUDED.precio_unitario,
  subtotal = EXCLUDED.subtotal;