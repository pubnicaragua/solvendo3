/*
  # Create borradores_venta table
  
  1. New Tables
    - `borradores_venta`: Stores draft sales for later retrieval
      - `id` (uuid, primary key)
      - `empresa_id` (uuid, foreign key to empresas)
      - `usuario_id` (uuid, foreign key to usuarios)
      - `nombre` (text, name of the draft)
      - `items` (jsonb, cart items)
      - `total` (decimal, total amount)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on `borradores_venta` table
    - Add policy for authenticated users to manage their own drafts
*/

-- Create borradores_venta table
CREATE TABLE IF NOT EXISTS borradores_venta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  usuario_id uuid REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total decimal(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE borradores_venta ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Allow all for borradores_venta" ON borradores_venta FOR ALL USING (true) WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_borradores_venta_empresa_usuario ON borradores_venta(empresa_id, usuario_id);