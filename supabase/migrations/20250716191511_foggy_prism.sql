/*
  # Add reports function for POS system
  
  1. New Functions
    - `ventas_por_mes`: Function to get monthly sales data
  
  2. Security
    - Grant execute permission to authenticated users
*/

-- Create function to get monthly sales data
CREATE OR REPLACE FUNCTION ventas_por_mes(
  empresa_id_arg uuid,
  fecha_inicio date,
  fecha_fin date
)
RETURNS TABLE (
  mes text,
  actual numeric,
  anterior numeric
) AS $$
DECLARE
  fecha_inicio_anterior date := fecha_inicio - interval '1 year';
  fecha_fin_anterior date := fecha_fin - interval '1 year';
BEGIN
  RETURN QUERY
  WITH meses AS (
    SELECT to_char(d, 'Mon') as mes, 
           extract(month from d) as mes_num,
           extract(year from d) as anio
    FROM generate_series(
      date_trunc('month', fecha_inicio::timestamp)::date,
      date_trunc('month', fecha_fin::timestamp)::date,
      '1 month'::interval
    ) d
  ),
  ventas_actuales AS (
    SELECT 
      to_char(date_trunc('month', fecha), 'Mon') as mes,
      extract(month from fecha) as mes_num,
      extract(year from fecha) as anio,
      sum(total) as total
    FROM ventas
    WHERE empresa_id = empresa_id_arg
      AND fecha >= fecha_inicio
      AND fecha <= fecha_fin
    GROUP BY 1, 2, 3
  ),
  ventas_anteriores AS (
    SELECT 
      to_char(date_trunc('month', fecha), 'Mon') as mes,
      extract(month from fecha) as mes_num,
      extract(year from fecha) as anio,
      sum(total) as total
    FROM ventas
    WHERE empresa_id = empresa_id_arg
      AND fecha >= fecha_inicio_anterior
      AND fecha <= fecha_fin_anterior
    GROUP BY 1, 2, 3
  )
  SELECT 
    m.mes,
    COALESCE(va.total, 0) as actual,
    COALESCE(vp.total, 0) as anterior
  FROM meses m
  LEFT JOIN ventas_actuales va ON m.mes = va.mes AND m.mes_num = va.mes_num AND m.anio = va.anio
  LEFT JOIN ventas_anteriores vp ON m.mes_num = vp.mes_num
  ORDER BY m.anio, m.mes_num;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION ventas_por_mes TO authenticated;
GRANT EXECUTE ON FUNCTION ventas_por_mes TO anon;
GRANT EXECUTE ON FUNCTION ventas_por_mes TO service_role;

-- Create function to get sales by product
CREATE OR REPLACE FUNCTION ventas_por_producto(
  empresa_id_arg uuid,
  fecha_inicio date,
  fecha_fin date
)
RETURNS TABLE (
  producto_id uuid,
  nombre text,
  cantidad bigint,
  total numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as producto_id,
    p.nombre,
    SUM(vi.cantidad) as cantidad,
    SUM(vi.subtotal) as total
  FROM venta_items vi
  JOIN ventas v ON vi.venta_id = v.id
  JOIN productos p ON vi.producto_id = p.id
  WHERE v.empresa_id = empresa_id_arg
    AND v.fecha >= fecha_inicio
    AND v.fecha <= fecha_fin
  GROUP BY p.id, p.nombre
  ORDER BY total DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION ventas_por_producto TO authenticated;
GRANT EXECUTE ON FUNCTION ventas_por_producto TO anon;
GRANT EXECUTE ON FUNCTION ventas_por_producto TO service_role;

-- Create function to get sales by payment method
CREATE OR REPLACE FUNCTION ventas_por_metodo_pago(
  empresa_id_arg uuid,
  fecha_inicio date,
  fecha_fin date
)
RETURNS TABLE (
  metodo_pago text,
  total numeric,
  porcentaje numeric
) AS $$
DECLARE
  total_ventas numeric;
BEGIN
  -- Get total sales
  SELECT SUM(total) INTO total_ventas
  FROM ventas
  WHERE empresa_id = empresa_id_arg
    AND fecha >= fecha_inicio
    AND fecha <= fecha_fin;
    
  -- Return sales by payment method
  RETURN QUERY
  SELECT 
    v.metodo_pago,
    SUM(v.total) as total,
    CASE 
      WHEN total_ventas > 0 THEN ROUND((SUM(v.total) / total_ventas) * 100, 2)
      ELSE 0
    END as porcentaje
  FROM ventas v
  WHERE v.empresa_id = empresa_id_arg
    AND v.fecha >= fecha_inicio
    AND v.fecha <= fecha_fin
  GROUP BY v.metodo_pago
  ORDER BY total DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION ventas_por_metodo_pago TO authenticated;
GRANT EXECUTE ON FUNCTION ventas_por_metodo_pago TO anon;
GRANT EXECUTE ON FUNCTION ventas_por_metodo_pago TO service_role;