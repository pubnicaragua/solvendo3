/*
  # Fix missing functions and data issues
  
  1. Create missing functions
  2. Fix data consistency
  3. Add sample data if needed
*/

-- Create insert_sample_ventas_if_empty function
CREATE OR REPLACE FUNCTION insert_sample_ventas_if_empty(empresa_id_arg uuid)
RETURNS void AS $$
BEGIN
  -- Insert sample sales if none exist for this company
  IF NOT EXISTS (SELECT 1 FROM ventas WHERE empresa_id = empresa_id_arg) THEN
    -- Insert sample sales
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

-- Ensure sample clients exist
INSERT INTO clientes (id, empresa_id, razon_social, rut, direccion, comuna, ciudad, giro, telefono, email, contacto, activo)
VALUES 
  ('g1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Cliente Demo', '11.111.111-1', 'Calle Demo 456', 'Santiago', 'Santiago', 'Persona Natural', '+56 9 8765 4321', 'cliente@demo.cl', 'Cliente Demo', true),
  ('g2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Empresa ABC', '12.345.678-9', 'Av. Principal 789', 'Santiago', 'Santiago', 'Comercio', '+56 2 1234 5678', 'empresa@abc.cl', 'Juan Pérez', true),
  ('g3eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Servicios XYZ', '98.765.432-1', 'Calle Comercio 123', 'Providencia', 'Santiago', 'Servicios', '+56 9 9876 5432', 'contacto@xyz.cl', 'María González', true)
ON CONFLICT (id) DO NOTHING;

-- Update existing products to ensure correct prices
UPDATE productos SET precio = 35000 WHERE codigo = 'PROD003' AND empresa_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
UPDATE productos SET precio = 25000 WHERE codigo = 'TECH001' AND empresa_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
UPDATE productos SET precio = 45000 WHERE codigo = 'TECH002' AND empresa_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';