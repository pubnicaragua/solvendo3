import React, { useState, useEffect } from "react";
import { Scan, Search, Plus, Edit, Trash2, X } from "lucide-react";
import { HeaderWithMenu } from "../components/common/HeaderWithMenu";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

interface BarcodePageProps {
  onClose: () => void;
}

interface BarcodeProduct {
  id: string;
  codigo: string;
  nombre: string;
  precio: number;
  barcode: string;
}

export const BarcodePage: React.FC<BarcodePageProps> = ({ onClose }) => {
  const { empresaId, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [scanMode, setScanMode] = useState(false);
  const [scannedCode, setScannedCode] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<BarcodeProduct | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    codigo: "",
    nombre: "",
    precio: 0,
    barcode: "",
  });

  // Estado real para los productos
  const [products, setProducts] = useState<BarcodeProduct[]>([]);

  // Cargar productos al montar el componente
  useEffect(() => {
    if (empresaId) {
      loadProducts();
    }
  }, [empresaId]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("productos")
        .select("id, codigo, nombre, precio, codigo_barras")
        .eq("empresa_id", empresaId)
        .order("nombre", { ascending: true });

      if (error) throw error;

      // Mapear los datos a nuestro formato BarcodeProduct
      const formattedProducts = (data || []).map((p) => ({
        id: p.id,
        codigo: p.codigo,
        nombre: p.nombre,
        precio: p.precio,
        barcode: p.codigo_barras || "",
      }));

      setProducts(formattedProducts);
    } catch (error) {
      console.error("Error loading products:", error);
      toast.error("Error al cargar productos");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
    }).format(price);
  };

  const handleScan = () => {
    setScanMode(true);
    // Simulate barcode scanning
    try {
      // En un entorno real, aquí se conectaría con un escáner de códigos de barras
      // Para simular, usamos un timeout
      setTimeout(() => {
        const mockBarcode = "7891234567892";
        setScannedCode(mockBarcode);
        setScanMode(false);

        // Check if product exists
        const existingProduct = products.find((p) => p.barcode === mockBarcode);
        if (existingProduct) {
          toast.success(`Producto encontrado: ${existingProduct.nombre}`);
        } else {
          setFormData((prev) => ({ ...prev, barcode: mockBarcode }));
          setShowModal(true);
        }
      }, 2000);
    } catch (error) {
      setScanMode(false);
      toast.error("Error al escanear código de barras");
    }
  };

  const handleSave = async () => {
    if (!formData.codigo || !formData.nombre || !formData.barcode) return;

    setLoading(true);
    try {
      if (editingProduct) {
        // Actualizar producto existente
        const { error } = await supabase
          .from("productos")
          .update({
            codigo: formData.codigo,
            nombre: formData.nombre,
            precio: formData.precio,
            codigo_barras: formData.barcode,
          })
          .eq("id", editingProduct.id);

        if (error) throw error;
        toast.success("Producto actualizado correctamente");
      } else {
        // Crear nuevo producto
        const { error } = await supabase.from("productos").insert({
          empresa_id: empresaId,
          codigo: formData.codigo,
          nombre: formData.nombre,
          precio: formData.precio,
          codigo_barras: formData.barcode,
          stock: 0,
          activo: true,
        });

        if (error) throw error;
        toast.success("Producto creado correctamente");
      }

      // Recargar productos
      await loadProducts();

      // Limpiar formulario y cerrar modal
      setShowModal(false);
      setEditingProduct(null);
      setFormData({ codigo: "", nombre: "", precio: 0, barcode: "" });
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Error al guardar producto");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: BarcodeProduct) => {
    setEditingProduct(product);
    setFormData({
      codigo: product.codigo,
      nombre: product.nombre,
      precio: product.precio,
      barcode: product.barcode,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este producto?")) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("productos")
        .update({ activo: false })
        .eq("id", id);

      if (error) throw error;

      toast.success("Producto eliminado correctamente");
      await loadProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Error al eliminar producto");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode.includes(searchTerm)
  );

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <HeaderWithMenu
        title="Gestión de códigos de barras"
        icon={<Scan className="w-6 h-6 text-gray-600" />}
      />

      <div className="flex-1 p-6 overflow-y-auto">
        {/* Actions Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="relative flex-1 mr-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre, código o código de barras..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleScan}
              disabled={scanMode}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <Scan className="w-4 h-4" />
              {scanMode ? "Escaneando..." : "Escanear código"}
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Agregar código
            </button>
          </div>
        </div>

        {/* Scanning UI */}
        {scanMode && (
          <div className="bg-white rounded-lg p-8 mb-6 shadow-sm text-center">
            <div className="animate-pulse flex flex-col items-center">
              <Scan className="w-16 h-16 text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Escaneando código de barras
              </h3>
              <p className="text-gray-600">
                Acerque el código de barras al escáner...
              </p>
            </div>
          </div>
        )}

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Productos con código de barras ({filteredProducts.length})
            </h3>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchTerm
                ? "No se encontraron productos"
                : "No hay productos con códigos de barras"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código de barras
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {product.codigo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.nombre}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPrice(product.precio)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                        {product.barcode}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingProduct
                  ? "Editar producto"
                  : "Nuevo producto con código de barras"}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingProduct(null);
                  setFormData({
                    codigo: "",
                    nombre: "",
                    precio: 0,
                    barcode: "",
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código de barras *
                </label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      barcode: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Código de barras"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código interno *
                </label>
                <input
                  type="text"
                  value={formData.codigo}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, codigo: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Código interno del producto"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del producto *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, nombre: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nombre del producto"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio
                </label>
                <input
                  type="number"
                  value={formData.precio}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      precio: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Precio del producto"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingProduct(null);
                  setFormData({
                    codigo: "",
                    nombre: "",
                    precio: 0,
                    barcode: "",
                  });
                }}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={
                  !formData.codigo || !formData.nombre || !formData.barcode
                }
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {editingProduct ? "Actualizar" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
