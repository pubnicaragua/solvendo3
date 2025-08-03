/*
  # Add stock management triggers
  
  1. New Triggers
    - `update_stock_after_sale`: Trigger to update product stock after a sale
    - `update_stock_after_return`: Trigger to update product stock after a return
  
  2. Functions
    - `update_stock_after_sale_fn`: Function to update stock after a sale
    - `update_stock_after_return_fn`: Function to update stock after a return
*/

-- Function to update stock after a sale
CREATE OR REPLACE FUNCTION update_stock_after_sale_fn()
RETURNS TRIGGER AS $$
BEGIN
  -- Update product stock
  UPDATE productos
  SET stock = stock - NEW.cantidad
  WHERE id = NEW.producto_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stock after a sale
CREATE TRIGGER update_stock_after_sale
AFTER INSERT ON venta_items
FOR EACH ROW
EXECUTE FUNCTION update_stock_after_sale_fn();

-- Function to update stock after a return
CREATE OR REPLACE FUNCTION update_stock_after_return_fn()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the product_id from venta_items
  UPDATE productos p
  SET stock = stock + NEW.cantidad_devuelta
  FROM venta_items vi
  WHERE vi.id = NEW.venta_item_id
    AND p.id = vi.producto_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stock after a return
CREATE TRIGGER update_stock_after_return
AFTER INSERT ON devolucion_items
FOR EACH ROW
EXECUTE FUNCTION update_stock_after_return_fn();