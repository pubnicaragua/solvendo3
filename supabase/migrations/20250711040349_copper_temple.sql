/*
  # Schema completo para Sistema POS

  1. Tablas principales
    - empresas: Datos de la empresa
    - sucursales: Sucursales de la empresa
    - usuarios: Usuarios del sistema
    - usuario_empresa: Relación usuario-empresa-sucursal
    - cajas: Cajas registradoras
    - productos: Catálogo de productos
    - categorias: Categorías de productos
    - clientes: Base de clientes
    - medios_pago: Métodos de pago
    - promociones: Sistema de promociones
    - ventas: Registro de ventas
    - venta_items: Detalle de productos vendidos
    - movimientos_caja: Movimientos de efectivo
    - aperturas_caja: Control de apertura/cierre de caja
    - devoluciones: Registro de devoluciones
    - documentos_tributarios: Control de DTE

  2. Seguridad
    - RLS habilitado en todas las tablas
    - Políticas de acceso por empresa/sucursal
*/

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

ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;

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

ALTER TABLE sucursales ENABLE ROW LEVEL SECURITY;

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

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

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

ALTER TABLE usuario_empresa ENABLE ROW LEVEL SECURITY;

-- Categorías de productos
CREATE TABLE IF NOT EXISTS categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  descripcion text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;

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

ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

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
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(empresa_id, rut)
);

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Medios de pago
CREATE TABLE IF NOT EXISTS medios_pago (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  descripcion text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE medios_pago ENABLE ROW LEVEL SECURITY;

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

ALTER TABLE cajas ENABLE ROW LEVEL SECURITY;

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

ALTER TABLE aperturas_caja ENABLE ROW LEVEL SECURITY;

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

ALTER TABLE movimientos_caja ENABLE ROW LEVEL SECURITY;

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

ALTER TABLE promociones ENABLE ROW LEVEL SECURITY;

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
  metodo_pago_id uuid REFERENCES medios_pago(id),
  subtotal decimal(10,2) NOT NULL DEFAULT 0,
  descuento decimal(10,2) DEFAULT 0,
  impuestos decimal(10,2) DEFAULT 0,
  total decimal(10,2) NOT NULL DEFAULT 0,
  estado text DEFAULT 'completada' CHECK (estado IN ('pendiente', 'completada', 'anulada')),
  fecha timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(empresa_id, folio)
);

ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;

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

ALTER TABLE venta_items ENABLE ROW LEVEL SECURITY;

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

ALTER TABLE devoluciones ENABLE ROW LEVEL SECURITY;

-- Items de devolución
CREATE TABLE IF NOT EXISTS devolucion_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  devolucion_id uuid REFERENCES devoluciones(id) ON DELETE CASCADE,
  venta_item_id uuid REFERENCES venta_items(id),
  cantidad_devuelta integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE devolucion_items ENABLE ROW LEVEL SECURITY;

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

ALTER TABLE documentos_tributarios ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Empresas acceso total" ON empresas FOR ALL USING (true);

CREATE POLICY "Sucursales por empresa" ON sucursales FOR ALL 
USING (empresa_id IN (
  SELECT empresa_id FROM usuario_empresa 
  WHERE usuario_id = auth.uid() AND activo = true
));

CREATE POLICY "Usuarios acceso propio" ON usuarios FOR ALL 
USING (id = auth.uid());

CREATE POLICY "Usuario empresa acceso propio" ON usuario_empresa FOR ALL 
USING (usuario_id = auth.uid());

CREATE POLICY "Productos por empresa" ON productos FOR ALL 
USING (empresa_id IN (
  SELECT empresa_id FROM usuario_empresa 
  WHERE usuario_id = auth.uid() AND activo = true
));

CREATE POLICY "Categorias por empresa" ON categorias FOR ALL 
USING (empresa_id IN (
  SELECT empresa_id FROM usuario_empresa 
  WHERE usuario_id = auth.uid() AND activo = true
));

CREATE POLICY "Clientes por empresa" ON clientes FOR ALL 
USING (empresa_id IN (
  SELECT empresa_id FROM usuario_empresa 
  WHERE usuario_id = auth.uid() AND activo = true
));

CREATE POLICY "Medios pago por empresa" ON medios_pago FOR ALL 
USING (empresa_id IN (
  SELECT empresa_id FROM usuario_empresa 
  WHERE usuario_id = auth.uid() AND activo = true
));

CREATE POLICY "Cajas por empresa" ON cajas FOR ALL 
USING (empresa_id IN (
  SELECT empresa_id FROM usuario_empresa 
  WHERE usuario_id = auth.uid() AND activo = true
));

CREATE POLICY "Aperturas caja por empresa" ON aperturas_caja FOR ALL 
USING (caja_id IN (
  SELECT c.id FROM cajas c
  JOIN usuario_empresa ue ON c.empresa_id = ue.empresa_id
  WHERE ue.usuario_id = auth.uid() AND ue.activo = true
));

CREATE POLICY "Movimientos caja por empresa" ON movimientos_caja FOR ALL 
USING (apertura_caja_id IN (
  SELECT ac.id FROM aperturas_caja ac
  JOIN cajas c ON ac.caja_id = c.id
  JOIN usuario_empresa ue ON c.empresa_id = ue.empresa_id
  WHERE ue.usuario_id = auth.uid() AND ue.activo = true
));

CREATE POLICY "Promociones por empresa" ON promociones FOR ALL 
USING (empresa_id IN (
  SELECT empresa_id FROM usuario_empresa 
  WHERE usuario_id = auth.uid() AND activo = true
));

CREATE POLICY "Ventas por empresa" ON ventas FOR ALL 
USING (empresa_id IN (
  SELECT empresa_id FROM usuario_empresa 
  WHERE usuario_id = auth.uid() AND activo = true
));

CREATE POLICY "Venta items por empresa" ON venta_items FOR ALL 
USING (venta_id IN (
  SELECT v.id FROM ventas v
  JOIN usuario_empresa ue ON v.empresa_id = ue.empresa_id
  WHERE ue.usuario_id = auth.uid() AND ue.activo = true
));

CREATE POLICY "Devoluciones por empresa" ON devoluciones FOR ALL 
USING (venta_id IN (
  SELECT v.id FROM ventas v
  JOIN usuario_empresa ue ON v.empresa_id = ue.empresa_id
  WHERE ue.usuario_id = auth.uid() AND ue.activo = true
));

CREATE POLICY "Devolucion items por empresa" ON devolucion_items FOR ALL 
USING (devolucion_id IN (
  SELECT d.id FROM devoluciones d
  JOIN ventas v ON d.venta_id = v.id
  JOIN usuario_empresa ue ON v.empresa_id = ue.empresa_id
  WHERE ue.usuario_id = auth.uid() AND ue.activo = true
));

CREATE POLICY "Documentos tributarios por empresa" ON documentos_tributarios FOR ALL 
USING (venta_id IN (
  SELECT v.id FROM ventas v
  JOIN usuario_empresa ue ON v.empresa_id = ue.empresa_id
  WHERE ue.usuario_id = auth.uid() AND ue.activo = true
));

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_productos_empresa_activo ON productos(empresa_id, activo);
CREATE INDEX IF NOT EXISTS idx_productos_codigo ON productos(codigo);
CREATE INDEX IF NOT EXISTS idx_clientes_empresa_rut ON clientes(empresa_id, rut);
CREATE INDEX IF NOT EXISTS idx_ventas_empresa_fecha ON ventas(empresa_id, fecha);
CREATE INDEX IF NOT EXISTS idx_ventas_folio ON ventas(folio);
CREATE INDEX IF NOT EXISTS idx_aperturas_caja_estado ON aperturas_caja(caja_id, estado);