import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

interface UserPermissionWithName {
  id: string;
  usuario_id: string;
  permiso_id: string;
  otorgado: boolean;
  created_at: string;
  permisos: {
    nombre: string;
    descripcion?: string;
  };
}

export const useUserPermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<UserPermissionWithName[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const PERMISOS = {
    AbrirCaja: "Abrir caja",
    CerrarCaja: "Cerrar caja",
    ArqueoCaja: "Arqueo de caja",
    ConsultarMovimientos: "Consultar movimientos de caja",
    GestionInventario: "Gestión de inventario",
    AccesoReportes: "Acceso a reportes",
    RealizarVentas: "Realizar ventas",
    GestionClientes: "Gestión de clientes",
    GestionProductos: "Gestión de productos",
    ConfiguracionSistema: "Configuración del sistema",
  } as const;

  useEffect(() => {
    if (!user?.id) {
      setPermissions([]);
      return;
    }

    const fetchPermissions = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from("usuario_permisos")
          .select(
            `  
            *,  
            permisos (  
              nombre,  
              descripcion  
            )  
          `
          )
          .eq("usuario_id", user.id)
          .eq("otorgado", true);

        if (error) throw error;

        setPermissions(data || []);
      } catch (err) {
        console.error("Error loading user permissions:", err);
        setError("Error al cargar permisos del usuario");
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [user?.id]);

  const hasPermission = (nombrePermiso: string): boolean => {
    if (user?.rol === "admin" || user?.rol === "administrador") {
      return true;
    }
    return permissions.some(
      (p) => p.permisos?.nombre === nombrePermiso && p.otorgado
    );
  };

  const sucursalConfig = async (cajaId: string): Promise<boolean> => {
    if (user?.rol === "admin" || user?.rol === "administrador" || user?.rol === "supervisor") {
      return true;
    }


    const { data, error } = await
      supabase.from("configuracion_pos").select("*").eq("caja_id", cajaId).single()

    if (error) {
      toast.error("Error al obtener la configuración de la caja, se permitirá la venta")
      return true
    }

    console.log("paput", data)
    if (data.solicitar_autorizacion) {
      return false
    } else {
      return true
    }
  }

  const hasAnyPermission = (nombresPermisos: string[]): boolean => {
    return nombresPermisos.some((nombre) => hasPermission(nombre));
  };

  return {
    permissions,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    sucursalConfig,
    PERMISOS,
  };
};
