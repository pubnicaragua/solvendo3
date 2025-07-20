/*
  # Fix usuarios table structure
  
  1. Changes
    - Add missing columns to usuarios table if they don't exist
    - Update existing data to match new structure
  
  2. Security
    - No changes to security policies
*/

-- Add missing columns to usuarios table if they don't exist
DO $$
BEGIN
  -- Add nombre column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'usuarios' 
    AND column_name = 'nombre'
  ) THEN
    ALTER TABLE usuarios ADD COLUMN nombre text;
  END IF;
  
  -- Add apellidos column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'usuarios' 
    AND column_name = 'apellidos'
  ) THEN
    ALTER TABLE usuarios ADD COLUMN apellidos text;
  END IF;
END $$;

-- Update existing user data
UPDATE usuarios 
SET 
  nombre = 'Emilio',
  apellidos = 'Aguilera'
WHERE rut = '78.168.951-3' AND (nombre IS NULL OR apellidos IS NULL);

-- Insert user if doesn't exist
INSERT INTO usuarios (id, email, password_hash, nombre, apellidos, rut, activo)
VALUES (
  'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'emilio@anroltec.cl',
  '123456',
  'Emilio',
  'Aguilera',
  '78.168.951-3',
  true
) ON CONFLICT (rut) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  apellidos = EXCLUDED.apellidos,
  email = EXCLUDED.email;