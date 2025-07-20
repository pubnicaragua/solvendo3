/*
  # Fix calculations and add validation functions
  
  1. New Functions
    - `validate_positive_number`: Ensures numbers are never negative
    - `calculate_vuelto`: Calculates change safely
    - `update_stock_safely`: Updates stock with validation
  
  2. Security
    - Grant execute permission to authenticated users
*/

-- Function to validate positive numbers
CREATE OR REPLACE FUNCTION validate_positive_number(input_number numeric)
RETURNS numeric AS $$
BEGIN
  RETURN GREATEST(0, COALESCE(input_number, 0));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate change safely
CREATE OR REPLACE FUNCTION calculate_vuelto(monto_recibido numeric, total_venta numeric)
RETURNS numeric AS $$
BEGIN
  IF monto_recibido IS NULL OR monto_recibido <= 0 THEN
    RETURN 0;
  END IF;
  
  RETURN GREATEST(0, monto_recibido - COALESCE(total_venta, 0));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update stock safely
CREATE OR REPLACE FUNCTION update_stock_safely(producto_id_param uuid, cantidad_param integer)
RETURNS boolean AS $$
DECLARE
  current_stock integer;
BEGIN
  -- Get current stock
  SELECT stock INTO current_stock
  FROM productos
  WHERE id = producto_id_param;
  
  -- Validate stock won't go negative
  IF current_stock IS NULL THEN
    current_stock := 0;
  END IF;
  
  IF (current_stock - cantidad_param) < 0 THEN
    RETURN false; -- Not enough stock
  END IF;
  
  -- Update stock
  UPDATE productos
  SET stock = GREATEST(0, stock - cantidad_param),
      updated_at = now()
  WHERE id = producto_id_param;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION validate_positive_number TO authenticated;
GRANT EXECUTE ON FUNCTION validate_positive_number TO anon;
GRANT EXECUTE ON FUNCTION validate_positive_number TO service_role;

GRANT EXECUTE ON FUNCTION calculate_vuelto TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_vuelto TO anon;
GRANT EXECUTE ON FUNCTION calculate_vuelto TO service_role;

GRANT EXECUTE ON FUNCTION update_stock_safely TO authenticated;
GRANT EXECUTE ON FUNCTION update_stock_safely TO anon;
GRANT EXECUTE ON FUNCTION update_stock_safely TO service_role;

-- Update existing data to ensure no negative values
UPDATE productos SET precio = GREATEST(0, precio) WHERE precio < 0;
UPDATE productos SET stock = GREATEST(0, stock) WHERE stock < 0;
UPDATE ventas SET total = GREATEST(0, total) WHERE total < 0;
UPDATE ventas SET subtotal = GREATEST(0, subtotal) WHERE subtotal < 0;
UPDATE movimientos_caja SET monto = GREATEST(0, monto) WHERE monto < 0;
UPDATE aperturas_caja SET monto_inicial = GREATEST(0, monto_inicial) WHERE monto_inicial < 0;
UPDATE aperturas_caja SET monto_final = GREATEST(0, monto_final) WHERE monto_final < 0;