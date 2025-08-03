/*
  # Fix register_sale function to handle string folios
  
  1. Changes
    - Modify register_sale function to handle string folios
    - Add proper error handling
  
  2. Security
    - No changes to security policies
*/

-- Drop and recreate the register_sale function with proper folio handling
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
  v_next_folio integer;
BEGIN
  -- Obtener el último folio para este tipo de documento y empresa
  BEGIN
    SELECT COALESCE(MAX(CAST(REGEXP_REPLACE(folio, '[^0-9]', '', 'g') AS integer)), 0) + 1
    INTO v_next_folio
    FROM ventas
    WHERE empresa_id = p_empresa_id
      AND tipo_dte = p_tipo_dte;
  EXCEPTION WHEN OTHERS THEN
    -- Si hay un error al convertir, usar un valor por defecto
    v_next_folio := (SELECT COUNT(*) + 1 FROM ventas WHERE empresa_id = p_empresa_id);
  END;
  
  -- Convertir a texto
  v_folio := v_next_folio::text;
  
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION register_sale TO authenticated;
GRANT EXECUTE ON FUNCTION register_sale TO anon;
GRANT EXECUTE ON FUNCTION register_sale TO service_role;