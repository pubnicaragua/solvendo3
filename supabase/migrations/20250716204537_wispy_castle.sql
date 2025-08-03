/*
  # Insertar datos de muestra para pruebas
  
  1. Insertar ventas de muestra
  2. Insertar movimientos de caja
  3. Insertar documentos para reimpresión
  4. Insertar datos para reportes
*/

-- Insertar ventas de muestra si no existen
INSERT INTO ventas (id, empresa_id, sucursal_id, usuario_id, folio, tipo_dte, metodo_pago, subtotal, total, estado, fecha)
SELECT 
  gen_random_uuid(), 
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
  'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
  'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
  '3421456', 
  'boleta', 
  'Tarjeta', 
  22000, 
  22000, 
  'completada', 
  now() - interval '1 day'
WHERE NOT EXISTS (
  SELECT 1 FROM ventas WHERE folio = '3421456' AND empresa_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
);

-- Insertar más ventas de muestra
INSERT INTO ventas (id, empresa_id, sucursal_id, usuario_id, folio, tipo_dte, metodo_pago, subtotal, total, estado, fecha)
SELECT 
  gen_random_uuid(), 
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
  'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
  'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
  '3421457', 
  'boleta', 
  'Efectivo', 
  34000, 
  34000, 
  'completada', 
  now() - interval '2 days'
WHERE NOT EXISTS (
  SELECT 1 FROM ventas WHERE folio = '3421457' AND empresa_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
);

-- Insertar venta con factura
INSERT INTO ventas (id, empresa_id, sucursal_id, usuario_id, folio, tipo_dte, metodo_pago, subtotal, total, estado, fecha)
SELECT 
  gen_random_uuid(), 
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
  'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
  'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
  '1001', 
  'factura', 
  'Transferencia', 
  45000, 
  45000, 
  'completada', 
  now() - interval '3 days'
WHERE NOT EXISTS (
  SELECT 1 FROM ventas WHERE folio = '1001' AND tipo_dte = 'factura' AND empresa_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
);

-- Insertar datos para devoluciones
INSERT INTO ventas (id, empresa_id, sucursal_id, usuario_id, folio, tipo_dte, metodo_pago, subtotal, total, estado, fecha)
SELECT 
  'v1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
  'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
  'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
  '9', 
  'boleta', 
  'Efectivo', 
  204, 
  204, 
  'completada', 
  now() - interval '1 day'
WHERE NOT EXISTS (
  SELECT 1 FROM ventas WHERE id = 'v1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
);

-- Insertar ítems de venta para la devolución
INSERT INTO venta_items (id, venta_id, producto_id, cantidad, precio_unitario, subtotal)
SELECT 
  'vi1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
  'v1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
  'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
  1, 
  34, 
  34
WHERE NOT EXISTS (
  SELECT 1 FROM venta_items WHERE id = 'vi1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
);

-- Insertar más ítems de venta para la devolución
INSERT INTO venta_items (id, venta_id, producto_id, cantidad, precio_unitario, subtotal)
SELECT 
  'vi2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
  'v1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
  'f2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
  2, 
  85, 
  170
WHERE NOT EXISTS (
  SELECT 1 FROM venta_items WHERE id = 'vi2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
);

-- Crear función register_sale si no existe
CREATE OR REPLACE FUNCTION register_sale(
  p_empresa_id uuid,
  p_sucursal_id uuid,
  p_caja_id uuid,
  p_apertura_caja_id uuid,
  p_cliente_id uuid,
  p_usuario_id uuid,
  p_tipo_dte text,
  p_metodo_pago text,
  p_items jsonb,
  p_total decimal
)
RETURNS uuid AS $$
DECLARE
  v_venta_id uuid;
  v_folio text;
  v_item jsonb;
BEGIN
  -- Obtener el próximo folio
  SELECT COALESCE(MAX(CAST(folio AS integer)), 0) + 1
  INTO v_folio
  FROM ventas
  WHERE empresa_id = p_empresa_id
    AND tipo_dte = p_tipo_dte;
  
  -- Insertar la venta
  INSERT INTO ventas (
    empresa_id,
    sucursal_id,
    caja_id,
    apertura_caja_id,
    cliente_id,
    usuario_id,
    folio,
    tipo_dte,
    metodo_pago,
    subtotal,
    descuento,
    impuestos,
    total,
    estado,
    fecha
  ) VALUES (
    p_empresa_id,
    p_sucursal_id,
    p_caja_id,
    p_apertura_caja_id,
    p_cliente_id,
    p_usuario_id,
    v_folio,
    p_tipo_dte,
    p_metodo_pago,
    p_total,
    0,
    0,
    p_total,
    'completada',
    now()
  ) RETURNING id INTO v_venta_id;
  
  -- Insertar los items de la venta
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO venta_items (
      venta_id,
      producto_id,
      cantidad,
      precio_unitario,
      descuento,
      subtotal
    ) VALUES (
      v_venta_id,
      (v_item->>'id')::uuid,
      (v_item->>'quantity')::integer,
      (v_item->>'precio')::decimal,
      0,
      (v_item->>'quantity')::integer * (v_item->>'precio')::decimal
    );
  END LOOP;
  
  -- Si el método de pago es efectivo, registrar el movimiento de caja
  IF p_metodo_pago = 'efectivo' THEN
    INSERT INTO movimientos_caja (
      apertura_caja_id,
      usuario_id,
      tipo,
      monto,
      observacion,
      fecha
    ) VALUES (
      p_apertura_caja_id,
      p_usuario_id,
      'venta',
      p_total,
      'Venta ID: ' || v_venta_id,
      now()
    );
  END IF;
  
  RETURN v_venta_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Otorgar permisos de ejecución
GRANT EXECUTE ON FUNCTION register_sale TO authenticated;
GRANT EXECUTE ON FUNCTION register_sale TO anon;
GRANT EXECUTE ON FUNCTION register_sale TO service_role;

-- Corregir la función check_table_exists
CREATE OR REPLACE FUNCTION check_table_exists(table_name_param text)
RETURNS boolean AS $$
DECLARE
  exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = table_name_param
  ) INTO exists;
  
  RETURN exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_table_exists TO authenticated;
GRANT EXECUTE ON FUNCTION check_table_exists TO anon;
GRANT EXECUTE ON FUNCTION check_table_exists TO service_role;