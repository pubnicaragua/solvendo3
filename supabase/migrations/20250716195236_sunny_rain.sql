/*
  # Correcciones finales para el sistema POS
  
  1. Asegurar que la columna diferencia_cierre exista en aperturas_caja
  2. Asegurar que la tabla borradores_venta exista con la estructura correcta
  3. Asegurar que la tabla despachos exista con la estructura correcta
  4. Añadir columna codigo_barras a la tabla productos si no existe
*/

-- 1. Asegurar que la columna diferencia_cierre exista en aperturas_caja
DO $$
BEGIN
  -- Verificar si la columna 'diferencia' existe pero 'diferencia_cierre' no
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'aperturas_caja' 
    AND column_name = 'diferencia'
  ) AND NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'aperturas_caja' 
    AND column_name = 'diferencia_cierre'
  ) THEN
    -- Renombrar 'diferencia' a 'diferencia_cierre'
    ALTER TABLE aperturas_caja RENAME COLUMN diferencia TO diferencia_cierre;
  
  -- Verificar si ninguna de las dos columnas existe
  ELSIF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'aperturas_caja' 
    AND column_name = 'diferencia'
  ) AND NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'aperturas_caja' 
    AND column_name = 'diferencia_cierre'
  ) THEN
    -- Añadir 'diferencia_cierre'
    ALTER TABLE aperturas_caja ADD COLUMN diferencia_cierre decimal(10,2);
  END IF;
END $$;

-- 2. Asegurar que la tabla borradores_venta exista con la estructura correcta
CREATE TABLE IF NOT EXISTS borradores_venta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  usuario_id uuid REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total decimal(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS en borradores_venta si existe
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = 'borradores_venta'
  ) THEN
    ALTER TABLE borradores_venta ENABLE ROW LEVEL SECURITY;
    
    -- Eliminar políticas existentes si existen
    DROP POLICY IF EXISTS "Allow all for borradores_venta" ON borradores_venta;
    
    -- Crear política
    CREATE POLICY "Allow all for borradores_venta" ON borradores_venta FOR ALL USING (true) WITH CHECK (true);
    
    -- Crear índice si no existe
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE tablename = 'borradores_venta' 
      AND indexname = 'idx_borradores_venta_empresa_usuario'
    ) THEN
      CREATE INDEX idx_borradores_venta_empresa_usuario ON borradores_venta(empresa_id, usuario_id);
    END IF;
  END IF;
END $$;

-- 3. Asegurar que la tabla despachos exista con la estructura correcta
CREATE TABLE IF NOT EXISTS despachos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  cliente_id uuid REFERENCES clientes(id),
  venta_id uuid REFERENCES ventas(id),
  destinatario text NOT NULL,
  direccion text NOT NULL,
  comuna text,
  ciudad text,
  region text,
  tipo text,
  numero_documento text,
  fecha timestamptz DEFAULT now(),
  estado text DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_proceso', 'entregado', 'cancelado')),
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS en despachos si existe
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = 'despachos'
  ) THEN
    ALTER TABLE despachos ENABLE ROW LEVEL SECURITY;
    
    -- Eliminar políticas existentes si existen
    DROP POLICY IF EXISTS "Allow all for despachos" ON despachos;
    
    -- Crear política
    CREATE POLICY "Allow all for despachos" ON despachos FOR ALL USING (true) WITH CHECK (true);
    
    -- Crear índice si no existe
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE tablename = 'despachos' 
      AND indexname = 'idx_despachos_empresa_cliente'
    ) THEN
      CREATE INDEX idx_despachos_empresa_cliente ON despachos(empresa_id, cliente_id);
    END IF;
  END IF;
END $$;

-- 4. Añadir columna codigo_barras a la tabla productos si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'productos' 
    AND column_name = 'codigo_barras'
  ) THEN
    ALTER TABLE productos ADD COLUMN codigo_barras text;
  END IF;
END $$;

-- 5. Crear función para validar usuario por RUT y contraseña
CREATE OR REPLACE FUNCTION validate_user_by_rut(
  p_rut text,
  p_password text
)
RETURNS TABLE (
  id uuid,
  email text,
  nombre text,
  apellidos text,
  rut text,
  rol text,
  empresa_id uuid,
  sucursal_id uuid
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.nombre,
    u.apellidos,
    u.rut,
    ue.rol,
    ue.empresa_id,
    ue.sucursal_id
  FROM usuarios u
  JOIN usuario_empresa ue ON u.id = ue.usuario_id
  WHERE u.rut = p_rut
    AND u.password_hash = p_password
    AND u.activo = true
    AND ue.activo = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Otorgar permisos de ejecución
GRANT EXECUTE ON FUNCTION validate_user_by_rut TO authenticated;
GRANT EXECUTE ON FUNCTION validate_user_by_rut TO anon;
GRANT EXECUTE ON FUNCTION validate_user_by_rut TO service_role;