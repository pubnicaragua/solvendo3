/*
  # Fix diferencia_cierre column issue
  
  1. Changes
    - Rename 'diferencia' column to 'diferencia_cierre' in aperturas_caja table if it doesn't exist
    - Add 'diferencia_cierre' column if 'diferencia' doesn't exist
  
  2. Security
    - No changes to security policies
*/

DO $$
BEGIN
  -- Check if 'diferencia' column exists but 'diferencia_cierre' doesn't
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
    -- Rename 'diferencia' to 'diferencia_cierre'
    ALTER TABLE aperturas_caja RENAME COLUMN diferencia TO diferencia_cierre;
  
  -- Check if neither 'diferencia' nor 'diferencia_cierre' exists
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
    -- Add 'diferencia_cierre' column
    ALTER TABLE aperturas_caja ADD COLUMN diferencia_cierre decimal(10,2);
  END IF;
END $$;