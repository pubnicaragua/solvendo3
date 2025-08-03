/*
  # Fix table names and add missing tables
  
  1. Changes
    - Ensure 'productos' table exists (not 'produtos')
    - Add 'borradores_venta' table if not exists
    - Add 'despachos' table if not exists
  
  2. Security
    - Enable RLS on new tables
    - Add appropriate policies
*/

-- Check if productos table exists, if not create it
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'productos') THEN
    -- Create productos table
    CREATE TABLE productos (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
      categoria_id uuid REFERENCES categorias(id),
      codigo text NOT NULL,
      nombre text NOT NULL,
      descripcion text,
      precio decimal(10,2) NOT NULL DEFAULT 0,
      costo decimal(10,2) DEFAULT 0,
      stock integer DEFAULT 0,
      stock_minimo integer DEFAULT 0,
      destacado boolean DEFAULT false,
      activo boolean DEFAULT true,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      UNIQUE(empresa_id, codigo)
    );

    -- Enable RLS
    ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
    
    -- Create policy
    CREATE POLICY "Allow all for productos" ON productos FOR ALL USING (true) WITH CHECK (true);
    
    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_productos_empresa_activo ON productos(empresa_id, activo);
    CREATE INDEX IF NOT EXISTS idx_productos_codigo ON productos(codigo);
    
    -- Insert sample data
    INSERT INTO productos (id, empresa_id, codigo, nombre, descripcion, precio, destacado, activo, stock)
    VALUES 
      ('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PROD001', 'Ejemplo producto 1', 'Producto de ejemplo para pruebas', 34.5, true, true, 100),
      ('f2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PROD002', 'Ejemplo producto 2', 'Segundo producto de ejemplo', 68.5, false, true, 50),
      ('f3eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PROD003', 'Ejemplo producto 3', 'Tercer producto de ejemplo', 34.5, true, true, 75),
      ('f4eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PROD004', 'Ejemplo producto 4', 'Cuarto producto de ejemplo', 34.5, false, true, 25),
      ('f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PROD005', 'Ejemplo producto 5', 'Quinto producto de ejemplo', 34.5, true, true, 80),
      ('f6eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PROD006', 'Ejemplo producto 6', 'Sexto producto de ejemplo', 0, false, true, 0);
  END IF;
END $$;

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
CREATE POLICY "Allow all for borradores_venta" ON borradores_venta FOR ALL USING (true) WITH CHECK (true);

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
CREATE POLICY "Allow all for despachos" ON despachos FOR ALL USING (true) WITH CHECK (true);

-- Create index for despachos
CREATE INDEX IF NOT EXISTS idx_despachos_empresa_cliente ON despachos(empresa_id, cliente_id);

-- Create function to create the despachos table
CREATE OR REPLACE FUNCTION create_despachos_table()
RETURNS void AS $$
BEGIN
  -- This function is just a placeholder since we've already created the table above
  -- In a real environment, this would be handled by migrations
END;
$$ LANGUAGE plpgsql;