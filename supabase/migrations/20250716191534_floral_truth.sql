/*
  # Add audit functions for POS system
  
  1. New Functions
    - `audit_cash_movements`: Function to audit cash movements
    - `get_cash_audit`: Function to get cash audit data
  
  2. Security
    - Grant execute permission to authenticated users
*/

-- Function to audit cash movements
CREATE OR REPLACE FUNCTION audit_cash_movements(
  apertura_id uuid
)
RETURNS TABLE (
  tipo text,
  monto numeric,
  observacion text,
  fecha timestamptz,
  usuario_nombre text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.tipo,
    m.monto,
    m.observacion,
    m.fecha,
    u.nombre || ' ' || u.apellidos as usuario_nombre
  FROM movimientos_caja m
  JOIN usuarios u ON m.usuario_id = u.id
  WHERE m.apertura_caja_id = apertura_id
  ORDER BY m.fecha DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION audit_cash_movements TO authenticated;
GRANT EXECUTE ON FUNCTION audit_cash_movements TO anon;
GRANT EXECUTE ON FUNCTION audit_cash_movements TO service_role;

-- Function to get cash audit data
CREATE OR REPLACE FUNCTION get_cash_audit(
  apertura_id uuid
)
RETURNS TABLE (
  monto_inicial numeric,
  ventas_efectivo numeric,
  ventas_tarjeta numeric,
  ingresos numeric,
  retiros numeric,
  monto_teorico numeric,
  monto_final numeric,
  diferencia numeric
) AS $$
DECLARE
  v_monto_inicial numeric;
  v_monto_final numeric;
  v_ventas_efectivo numeric;
  v_ventas_tarjeta numeric;
  v_ingresos numeric;
  v_retiros numeric;
  v_monto_teorico numeric;
  v_diferencia numeric;
BEGIN
  -- Get apertura data
  SELECT monto_inicial, monto_final
  INTO v_monto_inicial, v_monto_final
  FROM aperturas_caja
  WHERE id = apertura_id;
  
  -- Get ventas efectivo
  SELECT COALESCE(SUM(total), 0)
  INTO v_ventas_efectivo
  FROM ventas
  WHERE apertura_caja_id = apertura_id
    AND metodo_pago = 'efectivo';
    
  -- Get ventas tarjeta
  SELECT COALESCE(SUM(total), 0)
  INTO v_ventas_tarjeta
  FROM ventas
  WHERE apertura_caja_id = apertura_id
    AND metodo_pago != 'efectivo';
    
  -- Get ingresos
  SELECT COALESCE(SUM(monto), 0)
  INTO v_ingresos
  FROM movimientos_caja
  WHERE apertura_caja_id = apertura_id
    AND tipo = 'ingreso';
    
  -- Get retiros
  SELECT COALESCE(SUM(monto), 0)
  INTO v_retiros
  FROM movimientos_caja
  WHERE apertura_caja_id = apertura_id
    AND tipo = 'retiro';
    
  -- Calculate monto teorico
  v_monto_teorico := v_monto_inicial + v_ventas_efectivo + v_ingresos - v_retiros;
  
  -- Calculate diferencia
  v_diferencia := COALESCE(v_monto_final, 0) - v_monto_teorico;
  
  -- Return data
  RETURN QUERY
  SELECT 
    v_monto_inicial,
    v_ventas_efectivo,
    v_ventas_tarjeta,
    v_ingresos,
    v_retiros,
    v_monto_teorico,
    COALESCE(v_monto_final, 0),
    v_diferencia;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_cash_audit TO authenticated;
GRANT EXECUTE ON FUNCTION get_cash_audit TO anon;
GRANT EXECUTE ON FUNCTION get_cash_audit TO service_role;