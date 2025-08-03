/*
  # Fix check_table_exists function
  
  1. Changes
    - Fix ambiguous column reference in check_table_exists function
  
  2. Security
    - No changes to security policies
*/

-- Drop and recreate the function with fixed column reference
DROP FUNCTION IF EXISTS check_table_exists;

CREATE OR REPLACE FUNCTION check_table_exists(table_name_param text)
RETURNS boolean AS $$
DECLARE
  exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = table_name_param
  ) INTO exists;
  
  RETURN exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_table_exists TO authenticated;
GRANT EXECUTE ON FUNCTION check_table_exists TO anon;
GRANT EXECUTE ON FUNCTION check_table_exists TO service_role;