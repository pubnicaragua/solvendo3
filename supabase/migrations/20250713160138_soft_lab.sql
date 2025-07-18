/*
  # Fix API key issues and missing tables
  
  1. Create missing tables if they don't exist
  2. Add helper functions for error handling
*/

-- Create borradores_venta table if it doesn't exist
CREATE TABLE IF NOT EXISTS borradores_venta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  usuario_id uuid REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total decimal(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on borradores_venta
ALTER TABLE borradores_venta ENABLE ROW LEVEL SECURITY;

-- Create policy for borradores_venta
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'borradores_venta' AND policyname = 'Allow all for borradores_venta'
  ) THEN
    CREATE POLICY "Allow all for borradores_venta" ON borradores_venta FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Create index for borradores_venta
CREATE INDEX IF NOT EXISTS idx_borradores_venta_empresa_usuario ON borradores_venta(empresa_id, usuario_id);

-- Create despachos table if it doesn't exist
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

-- Enable RLS on despachos
ALTER TABLE despachos ENABLE ROW LEVEL SECURITY;

-- Create policy for despachos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'despachos' AND policyname = 'Allow all for despachos'
  ) THEN
    CREATE POLICY "Allow all for despachos" ON despachos FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Create index for despachos
CREATE INDEX IF NOT EXISTS idx_despachos_empresa_cliente ON despachos(empresa_id, cliente_id);

-- Create function to check if a table exists
CREATE OR REPLACE FUNCTION check_table_exists(table_name text)
RETURNS boolean AS $$
DECLARE
  exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = $1
  ) INTO exists;
  
  RETURN exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_table_exists TO authenticated;
GRANT EXECUTE ON FUNCTION check_table_exists TO anon;
GRANT EXECUTE ON FUNCTION check_table_exists TO service_role;

-- Create function to create the despachos table
CREATE OR REPLACE FUNCTION create_despachos_table()
RETURNS void AS $$
BEGIN
  -- This function is just a placeholder since we've already created the table above
  -- In a real environment, this would be handled by migrations
END;
$$ LANGUAGE plpgsql;