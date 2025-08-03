/*
  # Insertar datos de muestra para el POS
  
  1. Insertar datos de muestra para todas las tablas
  2. Asegurar que hay datos para mostrar en todos los módulos
  3. Crear función para insertar datos de muestra si no existen
*/

-- Función para insertar datos de muestra si no existen
CREATE OR REPLACE FUNCTION insert_sample_ventas_if_empty(empresa_id_arg uuid)
RETURNS void AS $$
BEGIN
  -- Insertar ventas de muestra si no hay ventas para esta empresa
  IF NOT EXISTS (SELECT 1 FROM ventas WHERE empresa_id = empresa_id_arg) THEN
    -- Insertar ventas de muestra
    INSERT INTO ventas (id, empresa_id, sucursal_id, usuario_id, folio, tipo_dte, metodo_pago, subtotal, total, estado, fecha)
    VALUES 
      (gen_random_uuid(), empresa_id_arg, 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '9', 'boleta', 'efectivo', 204, 204, 'completada', now() - interval '1 day'),
      (gen_random_uuid(), empresa_id_arg, 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '10', 'boleta', 'tarjeta', 350, 350, 'completada', now() - interval '2 days'),
      (gen_random_uuid(), empresa_id_arg, 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '3421456', 'boleta', 'efectivo', 22000, 22000, 'completada', now() - interval '3 days'),
      (gen_random_uuid(), empresa_id_arg, 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '3421457', 'boleta', 'tarjeta', 34000, 34000, 'completada', now() - interval '4 days'),
      (gen_random_uuid(), empresa_id_arg, 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '1001', 'factura', 'transferencia', 45000, 45000, 'completada', now() - interval '5 days');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION insert_sample_ventas_if_empty TO authenticated;
GRANT EXECUTE ON FUNCTION insert_sample_ventas_if_empty TO anon;
GRANT EXECUTE ON FUNCTION insert_sample_ventas_if_empty TO service_role;

-- Insertar datos de muestra para la empresa demo
SELECT insert_sample_ventas_if_empty('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

-- Insertar venta_items de muestra si no existen
INSERT INTO venta_items (id, venta_id, producto_id, cantidad, precio_unitario, subtotal)
SELECT 
  gen_random_uuid(),
  v.id,
  'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  1,
  34.5,
  34.5
FROM ventas v 
WHERE v.folio = '9' 
  AND v.empresa_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
  AND NOT EXISTS (
    SELECT 1 FROM venta_items vi WHERE vi.venta_id = v.id
  );

-- Insertar más venta_items de muestra
INSERT INTO venta_items (id, venta_id, producto_id, cantidad, precio_unitario, subtotal)
SELECT 
  gen_random_uuid(),
  v.id,
  'f2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  2,
  68.5,
  137
FROM ventas v 
WHERE v.folio = '10' 
  AND v.empresa_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
  AND NOT EXISTS (
    SELECT 1 FROM venta_items vi WHERE vi.venta_id = v.id
  );

-- Insertar borradores de muestra si no existen
INSERT INTO borradores_venta (id, empresa_id, usuario_id, nombre, items, total, fecha)
SELECT 
  'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Borrador de prueba 1',
  '[{"id":"f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11","nombre":"Ejemplo producto 1","precio":34.5,"quantity":2}]',
  69,
  now() - interval '1 day'
WHERE NOT EXISTS (
  SELECT 1 FROM borradores_venta WHERE id = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
);

-- Insertar más borradores de muestra
INSERT INTO borradores_venta (id, empresa_id, usuario_id, nombre, items, total, fecha)
SELECT 
  'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Borrador de prueba 2',
  '[{"id":"f2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11","nombre":"Ejemplo producto 2","precio":68.5,"quantity":1}]',
  68.5,
  now() - interval '2 days'
WHERE NOT EXISTS (
  SELECT 1 FROM borradores_venta WHERE id = 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
);

-- Insertar movimientos de caja de muestra si no existen
INSERT INTO movimientos_caja (id, apertura_caja_id, usuario_id, tipo, monto, observacion, fecha)
SELECT 
  gen_random_uuid(),
  'ac1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'ingreso',
  50000,
  'Ingreso inicial de efectivo',
  now() - interval '1 day'
WHERE NOT EXISTS (
  SELECT 1 FROM movimientos_caja WHERE apertura_caja_id = 'ac1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
);

-- Insertar apertura de caja de muestra si no existe
INSERT INTO aperturas_caja (id, caja_id, usuario_id, fecha_apertura, monto_inicial, estado)
SELECT 
  'ac1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  now() - interval '1 day',
  100000,
  'abierta'
WHERE NOT EXISTS (
  SELECT 1 FROM aperturas_caja WHERE id = 'ac1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
);

-- Insertar categorías de muestra si no existen
INSERT INTO categorias (id, empresa_id, nombre, descripcion, activo)
SELECT 
  'cat1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Bebidas',
  'Bebidas y refrescos',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM categorias WHERE id = 'cat1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
);

INSERT INTO categorias (id, empresa_id, nombre, descripcion, activo)
SELECT 
  'cat2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Snacks',
  'Snacks y golosinas',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM categorias WHERE id = 'cat2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
);

-- Actualizar productos para asignar categorías
UPDATE productos 
SET categoria_id = 'cat1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
WHERE id IN ('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f3eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

UPDATE productos 
SET categoria_id = 'cat2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
WHERE id IN ('f4eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f6eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

-- Actualizar stock de productos
UPDATE productos SET stock = 100 WHERE empresa_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

-- Insertar códigos de barras de muestra
UPDATE productos SET codigo_barras = '7891234567890' WHERE codigo = 'PROD001';
UPDATE productos SET codigo_barras = '7891234567891' WHERE codigo = 'PROD002';
UPDATE productos SET codigo_barras = '7891234567892' WHERE codigo = 'PROD003';
UPDATE productos SET codigo_barras = '7891234567893' WHERE codigo = 'PROD004';
UPDATE productos SET codigo_barras = '7891234567894' WHERE codigo = 'PROD005';
UPDATE productos SET codigo_barras = '7891234567895' WHERE codigo = 'PROD006';