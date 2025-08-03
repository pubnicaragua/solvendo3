/*
  # Create despachos table
  
  1. New Tables
    - `despachos`: Stores delivery information
      - `id` (uuid, primary key)
      - `empresa_id` (uuid, foreign key to empresas)
      - `cliente_id` (uuid, foreign key to clientes)
      - `venta_id` (uuid, foreign key to ventas, optional)
      - `destinatario` (text)
      - `direccion` (text)
      - `comuna` (text)
      - `ciudad` (text)
      - `region` (text)
      - `tipo` (text)
      - `numero_documento` (text)
      - `fecha` (timestamptz)
      - `estado` (text)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on `despachos` table
    - Add policy for authenticated users
*/

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

-- Enable RLS
ALTER TABLE despachos ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Allow all for despachos" ON despachos FOR ALL USING (true) WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_despachos_empresa_cliente ON despachos(empresa_id, cliente_id);

-- Create function to create the table if it doesn't exist
CREATE OR REPLACE FUNCTION create_despachos_table()
RETURNS void AS $$
BEGIN
  -- This function is just a placeholder since we've already created the table above
  -- In a real environment, this would be handled by migrations
END;
$$ LANGUAGE plpgsql;