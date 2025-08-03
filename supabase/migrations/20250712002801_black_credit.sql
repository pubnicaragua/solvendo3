```sql
/*
  # Sistema POS - Schema completo y funcional
  
  1. Crear todas las tablas necesarias
  2. Configurar RLS con políticas permisivas
  3. Insertar datos de prueba
  4. Asegurar compatibilidad total
*/

-- Limpiar tablas existentes (solo si es necesario y en entorno de desarrollo)
-- DROP TABLE IF EXISTS devolucion_items CASCADE;
-- DROP TABLE IF EXISTS devoluciones CASCADE;
-- DROP TABLE IF EXISTS documentos_tributarios CASCADE;
-- DROP TABLE IF EXISTS venta_items CASCADE;
-- DROP TABLE IF EXISTS ventas CASCADE;
-- DROP TABLE IF EXISTS movimientos_caja CASCADE;
-- DROP TABLE IF EXISTS aperturas_caja CASCADE;
-- DROP TABLE IF EXISTS promociones CASCADE;
-- DROP TABLE IF EXISTS medios_pago CASCADE;
-- DROP TABLE IF EXISTS clientes CASCADE;
-- DROP TABLE IF EXISTS productos CASCADE;
-- DROP TABLE IF EXISTS categorias CASCADE;
-- DROP TABLE IF EXISTS cajas CASCADE;
-- DROP TABLE IF EXISTS usuario_empresa CASCADE;
-- DROP TABLE IF EXISTS usuarios CASCADE;
-- DROP TABLE IF EXISTS sucursales CASCADE;
-- DROP TABLE IF EXISTS empresas CASCADE;

-- Empresas
CREATE TABLE IF NOT EXISTS empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rut text UNIQUE NOT NULL,
  razon_social text NOT NULL,
  giro text,
  direccion text,
  comuna text,
  ciudad text,
  region text,
  telefono text,
  email text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Sucursales
CREATE TABLE IF NOT EXISTS sucursales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  direccion text,
  comuna text,
  ciudad text,
  telefono text,
  email text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text,
  nombre text NOT NULL,
  apellidos text NOT NULL,
  rut text UNIQUE NOT NULL,
  telefono text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Relación Usuario-Empresa-Sucursal
CREATE TABLE IF NOT EXISTS usuario_empresa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid REFERENCES usuarios(id) ON DELETE CASCADE,
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  sucursal_id uuid REFERENCES sucursales(id) ON DELETE CASCADE,
  rol text DEFAULT 'cajero' CHECK (rol IN ('admin', 'supervisor', 'cajero')),
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(usuario_id, empresa_id, sucursal_id)
);

-- Categorías de productos
CREATE TABLE IF NOT EXISTS categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  descripcion text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Productos
CREATE TABLE IF NOT EXISTS productos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  categoria_id uuid REFERENCES categorias(id),
  codigo text NOT NULL,
  nombre text NOT NULL,
  descripcion text,
  precio decimal(10,2) NOT NULL DEFAULT 0,
  costo decimal(10,2) DEFAULT 0,
  stock integer DEFAULT 0,
  stock_minimo integer DEFAULT 0,
  destacado boolean DEFAULT false,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(empresa_id, codigo)
);

-- Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  razon_social text NOT NULL,
  rut text,
  direccion text,
  comuna text,
  ciudad text,
  region text,
  giro text,
  telefono text,
  email text,
  contacto text,
  nombres text,
  apellidos text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Medios de pago
CREATE TABLE IF NOT EXISTS medios_pago (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  descripcion text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Cajas
CREATE TABLE IF NOT EXISTS cajas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  sucursal_id uuid REFERENCES sucursales(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  descripcion text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Aperturas de caja
CREATE TABLE IF NOT EXISTS aperturas_caja (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caja_id uuid REFERENCES cajas(id) ON DELETE CASCADE,
  usuario_id uuid REFERENCES usuarios(id),
  fecha_apertura timestamptz DEFAULT now(),
  fecha_cierre timestamptz,
  monto_inicial decimal(10,2) NOT NULL DEFAULT 0,
  monto_final decimal(10,2),
  diferencia decimal(10,2),
  estado text DEFAULT 'abierta' CHECK (estado IN ('abierta', 'cerrada')),
  observaciones text,
  created_at timestamptz DEFAULT now()
);

-- Movimientos de caja
CREATE TABLE IF NOT EXISTS movimientos_caja (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apertura_caja_id uuid REFERENCES aperturas_caja(id) ON DELETE CASCADE,
  usuario_id uuid REFERENCES usuarios(id),
  tipo text NOT NULL CHECK (tipo IN ('ingreso', 'retiro', 'venta')),
  monto decimal(10,2) NOT NULL,
  observacion text,
  fecha timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Promociones
CREATE TABLE IF NOT EXISTS promociones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  descripcion text,
  tipo text CHECK (tipo IN ('descuento_porcentaje', 'descuento_monto', '2x1', '3x2')),
  valor decimal(10,2),
  fecha_inicio date,
  fecha_fin date,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Ventas
CREATE TABLE IF NOT EXISTS ventas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  sucursal_id uuid REFERENCES sucursales(id) ON DELETE CASCADE,
  caja_id uuid REFERENCES cajas(id),
  apertura_caja_id uuid REFERENCES aperturas_caja(id),
  cliente_id uuid REFERENCES clientes(id),
  usuario_id uuid REFERENCES usuarios(id),
  folio text NOT NULL,
  tipo_dte text NOT NULL CHECK (tipo_dte IN ('boleta', 'factura', 'nota_credito')),
  metodo_pago text NOT NULL,
  subtotal decimal(10,2) NOT NULL DEFAULT 0,
  descuento decimal(10,2) DEFAULT 0,
  impuestos decimal(10,2) DEFAULT 0,
  total decimal(10,2) NOT NULL DEFAULT 0,
  estado text DEFAULT 'completada' CHECK (estado IN ('pendiente', 'completada', 'anulada')),
  fecha timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(empresa_id, folio)
);

-- Items de venta
CREATE TABLE IF NOT EXISTS venta_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_id uuid REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id uuid REFERENCES productos(id),
  cantidad integer NOT NULL DEFAULT 1,
  precio_unitario decimal(10,2) NOT NULL,
  descuento decimal(10,2) DEFAULT 0,
  subtotal decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Devoluciones
CREATE TABLE IF NOT EXISTS devoluciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_id uuid REFERENCES ventas(id) ON DELETE CASCADE,
  usuario_id uuid REFERENCES usuarios(id),
  tipo text CHECK (tipo IN ('total', 'parcial')),
  motivo text,
  monto_devuelto decimal(10,2) NOT NULL,
  fecha timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Items de devolución
CREATE TABLE IF NOT EXISTS devolucion_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  devolucion_id uuid REFERENCES devoluciones(id) ON DELETE CASCADE,
  venta_item_id uuid REFERENCES venta_items(id),
  cantidad_devuelta integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Documentos tributarios
CREATE TABLE IF NOT EXISTS documentos_tributarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_id uuid REFERENCES ventas(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  folio text NOT NULL,
  fecha_emision timestamptz DEFAULT now(),
  estado_sii text DEFAULT 'pendiente',
  xml_content text,
  pdf_url text,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE sucursales ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE medios_pago ENABLE ROW LEVEL SECURITY;
ALTER TABLE cajas ENABLE ROW LEVEL SECURITY;
ALTER TABLE aperturas_caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE promociones ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE venta_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE devoluciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE devolucion_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos_tributarios ENABLE ROW LEVEL SECURITY;

-- Políticas RLS permisivas para desarrollo
-- Estas políticas permiten acceso total para cualquier usuario autenticado.
-- En un entorno de producción, estas deberían ser mucho más restrictivas.
CREATE POLICY "Allow all for empresas" ON empresas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for sucursales" ON sucursales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for usuarios" ON usuarios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for usuario_empresa" ON usuario_empresa FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for categorias" ON categorias FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for productos" ON productos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for clientes" ON clientes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for medios_pago" ON medios_pago FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for cajas" ON cajas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for aperturas_caja" ON aperturas_caja FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for movimientos_caja" ON movimientos_caja FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for promociones" ON promociones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for ventas" ON ventas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for venta_items" ON venta_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for devoluciones" ON devoluciones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for devolucion_items" ON devolucion_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for documentos_tributarios" ON documentos_tributarios FOR ALL USING (true) WITH CHECK (true);

-- Insertar datos de prueba
INSERT INTO empresas (id, rut, razon_social, giro, direccion, comuna, ciudad, region, telefono, email, activo)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  '76.123.456-7',
  'Empresa Demo POS',
  'Comercio al por menor',
  'Av. Principal 123',
  'Santiago',
  'Santiago',
  'Metropolitana',
  '+56 2 2345 6789',
  'demo@empresa.cl',
  true
) ON CONFLICT (id) DO UPDATE SET razon_social = EXCLUDED.razon_social;

INSERT INTO sucursales (id, empresa_id, nombre, direccion, comuna, ciudad, telefono, email, activo)
VALUES (
  'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Sucursal Principal',
  'Av. Principal 123',
  'Santiago',
  'Santiago',
  '+56 2 2345 6789',
  'sucursal@empresa.cl',
  true
) ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre;

INSERT INTO usuarios (id, email, password_hash, nombre, apellidos, rut, activo)
VALUES (
  'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'emilio@demo.cl',
  '123456', -- Contraseña simple para demo
  'Emilio',
  'Aguilera',
  '78.168.951-3',
  true
) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

INSERT INTO usuario_empresa (usuario_id, empresa_id, sucursal_id, rol, activo)
VALUES (
  'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'cajero',
  true
) ON CONFLICT (usuario_id, empresa_id, sucursal_id) DO UPDATE SET rol = EXCLUDED.rol;

INSERT INTO cajas (id, empresa_id, sucursal_id, nombre, descripcion, activo)
VALUES (
  'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Caja Principal',
  'Caja principal de la sucursal',
  true
) ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre;

INSERT INTO medios_pago (id, empresa_id, nombre, descripcion)
VALUES 
  ('e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Efectivo', 'Pago en efectivo'),
  ('e5eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Tarjeta', 'Pago con tarjeta'),
  ('e6eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Cheque', 'Pago con cheque'),
  ('e7eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Transferencia', 'Transferencia bancaria')
ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre;

INSERT INTO productos (id, empresa_id, codigo, nombre, descripcion, precio, destacado, activo, stock)
VALUES 
  ('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PROD001', 'Ejemplo producto 1', 'Producto de ejemplo para pruebas', 34.5, true, true, 100),
  ('f2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PROD002', 'Ejemplo producto 2', 'Segundo producto de ejemplo', 68.5, false, true, 50),
  ('f3eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PROD003', 'Ejemplo producto 3', 'Tercer producto de ejemplo', 34.5, true, true, 75),
  ('f4eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PROD004', 'Ejemplo producto 4', 'Cuarto producto de ejemplo', 34.5, false, true, 25),
  ('f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PROD005', 'Ejemplo producto 5', 'Quinto producto de ejemplo', 34.5, true, true, 80),
  ('f6eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PROD006', 'Ejemplo producto 6', 'Sexto producto de ejemplo', 0, false, true, 0)
ON CONFLICT (empresa_id, codigo) DO UPDATE SET nombre = EXCLUDED.nombre;

INSERT INTO promociones (id, empresa_id, nombre, descripcion, tipo, valor, activo)
VALUES 
  ('p1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Descuento 10%', 'Descuento del 10% en productos seleccionados', 'descuento_porcentaje', 10, true),
  ('p2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2x1 Especial', 'Lleva 2 y paga 1 en productos seleccionados', '2x1', null, true),
  ('p3eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Descuento $5', 'Descuento fijo de $5 en compras mayores a $50', 'descuento_monto', 5, true)
ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre;

INSERT INTO clientes (id, empresa_id, razon_social, rut, direccion, comuna, ciudad, giro, telefono, email, contacto, activo)
VALUES (
  'g1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Cliente Demo',
  '11.111.111-1',
  'Calle Demo 456',
  'Santiago',
  'Santiago',
  'Persona Natural',
  '+56 9 8765 4321',
  'cliente@demo.cl',
  'Cliente Demo',
  true
) ON CONFLICT (id) DO UPDATE SET razon_social = EXCLUDED.razon_social;

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_productos_empresa_activo ON productos(empresa_id, activo);
CREATE INDEX IF NOT EXISTS idx_productos_codigo ON productos(codigo);
CREATE INDEX IF NOT EXISTS idx_clientes_empresa_rut ON clientes(empresa_id, rut);
CREATE INDEX IF NOT EXISTS idx_ventas_empresa_fecha ON ventas(empresa_id, fecha);
CREATE INDEX IF NOT EXISTS idx_ventas_folio ON ventas(folio);
CREATE INDEX IF NOT EXISTS idx_aperturas_caja_estado ON aperturas_caja(caja_id, estado);
CREATE INDEX IF NOT EXISTS idx_usuarios_rut ON usuarios(rut);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
```