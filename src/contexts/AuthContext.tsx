import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase, Usuario, UsuarioEmpresa } from "../lib/supabase";
import toast from "react-hot-toast";

interface AuthContextType {
  user: Usuario | null;
  loading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  empresaId: string | null;
  sucursalId: string | null;
  userRole: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [sucursalId, setSucursalId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Verificar sesión existente de Supabase
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        await loadUserData(session.user.id); // Usar user.id en lugar de email
      }
      setLoading(false);
    };

    getSession();

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        await loadUserData(session.user.id); // Usar user.id en lugar de email
      } else if (event === "SIGNED_OUT") {
        clearUserData();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (authId: string) => {
    try {
      // Primero obtener el usuario por auth_user_id
      const { data: userData, error: userError } = await supabase
        .from("usuarios")
        .select("*")
        .eq("auth_user_id", authId)
        .eq("activo", true)
        .single();

      if (userError || !userData) {
        throw new Error("Usuario no encontrado o inactivo");
      }

      // Luego obtener los datos de empresa usando el ID del usuario (no auth_user_id)
      const { data: empresaData, error: empresaError } = await supabase
        .from("usuario_empresa")
        .select(
          `  
        empresa_id,  
        sucursal_id,  
        empresas (  
          nombre,  
          rut  
        ),  
        sucursales (  
          nombre,  
          direccion  
        )  
      `
        )
        .eq("usuario_id", userData.id) // Usar userData.id, no authId
        .eq("activo", true)
        .single();

      if (empresaError || !empresaData) {
        throw new Error("Usuario sin empresa asignada");
      }

      // Combinar los datos
      const userWithEmpresa = {
        ...userData,
        usuario_empresa: [empresaData],
      };

      setUser(userWithEmpresa);
      setEmpresaId(empresaData.empresa_id);
      setSucursalId(empresaData.sucursal_id);
      // setUserRole(empresaData.rol);

      // Guardar en localStorage
      localStorage.setItem("pos_user", JSON.stringify(userWithEmpresa));
      localStorage.setItem("pos_empresa", empresaData.empresa_id);
      localStorage.setItem("pos_sucursal", empresaData.sucursal_id);
      // localStorage.setItem("pos_role", empresaData.rol);
    } catch (error: any) {
      console.error("Error loading user data:", error);
      toast.error(error.message || "Error cargando datos del usuario");
      await supabase.auth.signOut();
    }
  };

  const clearUserData = () => {
    setUser(null);
    setEmpresaId(null);
    setSucursalId(null);
    setUserRole(null);

    localStorage.removeItem("pos_user");
    localStorage.removeItem("pos_empresa");
    localStorage.removeItem("pos_sucursal");
    localStorage.removeItem("pos_role");
  };

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        await loadUserData(data.user.id); // Usar user.id en lugar de email
        toast.success("Inicio de sesión exitoso");
        return { success: true };
      }

      return { success: false, error: "Error inesperado" };
    } catch (error: any) {
      console.error("Login error:", error);
      return { success: false, error: error.message || "Error inesperado" };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    clearUserData();
    toast.success("Sesión cerrada");
  };

  const value = {
    user,
    loading,
    login,
    logout,
    empresaId,
    sucursalId,
    userRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
