/*
  # Crear datos de prueba para el POS

  1. Datos de prueba
    - Empresa y sucursal de prueba
    - Usuario cajero de prueba
    - Productos de ejemplo
    - Caja por defecto
    - Medios de pago
    - Cliente de prueba

  2. Configuración
    - Relaciones usuario-empresa
    - Configuración inicial
*/

-- Insertar empresa de prueba
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
) ON CONFLICT (id) DO NOTHING;

-- Insertar sucursal de prueba
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
) ON CONFLICT (id) DO NOTHING;

-- Insertar usuario cajero de prueba (debe existir en auth.users primero)
INSERT INTO usuarios (id, email, password_hash, nombre, apellidos, rut, activo)
VALUES (
  'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'cajero@demo.cl',
  '$2a$10$dummy.hash.for.testing.purposes.only',
  'Emilio',
  'Aguilera',
  '12.345.678-9',
  true
) ON CONFLICT (email) DO NOTHING;

-- Crear relación usuario-empresa
INSERT INTO usuario_empresa (usuario_id, empresa_id, sucursal_id, activo)
VALUES (
  'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  true
) ON CONFLICT DO NOTHING;

-- Insertar caja por defecto
INSERT INTO cajas (id, empresa_id, sucursal_id, nombre, descripcion, activo)
VALUES (
  'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Caja Principal',
  'Caja principal de la sucursal',
  true
) ON CONFLICT (id) DO NOTHING;

-- Insertar medios de pago
INSERT INTO medios_pago (id, empresa_id, nombre, descripcion)
VALUES 
  ('e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Efectivo', 'Pago en efectivo'),
  ('e5eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Tarjeta', 'Pago con tarjeta'),
  ('e6eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Transferencia', 'Transferencia bancaria')
ON CONFLICT (id) DO NOTHING;

-- Insertar productos de ejemplo
INSERT INTO productos (id, codigo, nombre, descripcion, precio, activo)
VALUES 
  ('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PROD001', 'Ejemplo producto 1', 'Producto de ejemplo para pruebas', 34500, true),
  ('f2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PROD002', 'Ejemplo producto 2', 'Segundo producto de ejemplo', 68500, true),
  ('f3eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PROD003', 'Ejemplo producto 3', 'Tercer producto de ejemplo', 34500, true),
  ('f4eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PROD004', 'Ejemplo producto 4', 'Cuarto producto de ejemplo', 34500, true),
  ('f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PROD005', 'Ejemplo producto 5', 'Quinto producto de ejemplo', 34500, true),
  ('f6eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PROD006', 'Ejemplo producto 6', 'Sexto producto de ejemplo', 0, true)
ON CONFLICT (codigo) DO NOTHING;

-- Insertar cliente de prueba
INSERT INTO clientes (id, razon_social, rut, direccion, comuna, ciudad, giro, telefono, email, contacto, activo)
VALUES (
  'g1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
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
) ON CONFLICT (rut) DO NOTHING;