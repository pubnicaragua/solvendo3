/*
  # Fix despachos table structure
  
  1. Changes
    - Add missing columns to despachos table
    - Ensure all required columns exist
  
  2. Security
    - No changes to security policies
*/

-- Add missing columns to despachos table if they don't exist
DO $$
BEGIN
  -- Add total column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'despachos' 
    AND column_name = 'total'
  ) THEN
    ALTER TABLE despachos ADD COLUMN total decimal(10,2) DEFAULT 0;
  END IF;
  
  -- Add usuario_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'despachos' 
    AND column_name = 'usuario_id'
  ) THEN
    ALTER TABLE despachos ADD COLUMN usuario_id uuid REFERENCES usuarios(id);
  END IF;
END $$;

-- Create despachos_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS despachos_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  despacho_id uuid REFERENCES despachos(id) ON DELETE CASCADE,
  producto_id uuid REFERENCES productos(id),
  cantidad integer NOT NULL DEFAULT 1,
  precio decimal(10,2) NOT NULL DEFAULT 0,
  descuento decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on despachos_items
ALTER TABLE despachos_items ENABLE ROW LEVEL SECURITY;

-- Create policy for despachos_items
CREATE POLICY "Allow all for despachos_items" ON despachos_items FOR ALL USING (true) WITH CHECK (true);

-- Create index for despachos_items
CREATE INDEX IF NOT EXISTS idx_despachos_items_despacho ON despachos_items(despacho_id);