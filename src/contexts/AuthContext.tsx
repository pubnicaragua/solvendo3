import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { supabase, supabaseAnonKey, supabaseUrl, Usuario, UsuarioEmpresa } from "../lib/supabase";
import toast from "react-hot-toast";
import { createClient } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  user: Usuario | null;
  empresaId: string | null;
  authorized: boolean;
  sucursalId: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  authorize: (rut: string, password: string) => Promise<void>
  refetchUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const navigator = useNavigate()
  const [authorized, setAuthorized] = useState<boolean>(false);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [sucursalId, setSucursalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Ref para evitar llamadas simultáneas a fetchUserProfile
  const isFetchingProfile = useRef(false);

  const fetchUserProfile = async (userId: string, userEmail?: string) => {
    if (isFetchingProfile.current) {
      // Ya hay una llamada en curso
      return;
    }
    isFetchingProfile.current = true;
    setLoading(true);

    try {

      const { data: userData, error: userError } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", userId)
        .eq("sesion_activa", true)
        .single();

      setUser(userData);

      if (userError) {
        throw new Error(userError.message)
      }

      const { data: usuarioEmpresa, error: empresaError } = await supabase
        .from("usuario_empresa")
        .select("empresa_id, sucursal_id, proposito, rol")
        .eq("usuario_id", userData.id)
        .eq("activo", true)
        .single();

      if (empresaError) {
        console.error("Error al obtener usuario_empresa:", empresaError);
      }

      setEmpresaId(usuarioEmpresa?.empresa_id || null);
      setSucursalId(usuarioEmpresa?.sucursal_id || null);

      if (usuarioEmpresa) {
        setUser((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            rol: usuarioEmpresa.rol,
            proposito: usuarioEmpresa.proposito,
          };
        });
      }

      if (user?.rol === "empleado") setAuthorized(false)

    } catch (error) {
      console.error("❌ Error crítico en fetchUserProfile:", error);
      setUser(null)
      setEmpresaId(null);
    } finally {
      setLoading(false);
      isFetchingProfile.current = false;
    }
  };

  const refetchUserProfile = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) {
      await fetchUserProfile(session.user.id, session.user.email);
    }
  };

  const validarRut = (rut: string): boolean => {
    // Limpiar formato
    rut = rut.replace(/\./g, "").replace(/-/g, "").toUpperCase();

    // Debe tener al menos 2 caracteres (cuerpo + DV)
    if (rut.length < 2) return false;

    const cuerpo = rut.slice(0, -1);
    const dv = rut.slice(-1);

    // Cuerpo solo números
    if (!/^\d+$/.test(cuerpo)) return false;

    // Calcular DV
    let suma = 0;
    let multiplicador = 2;

    for (let i = cuerpo.length - 1; i >= 0; i--) {
      suma += parseInt(cuerpo[i], 10) * multiplicador;
      multiplicador = multiplicador < 7 ? multiplicador + 1 : 2;
    }

    const resto = 11 - (suma % 11);
    let dvEsperado = resto === 11 ? "0" : resto === 10 ? "K" : resto.toString();

    return dv === dvEsperado;
  }

  const authorize = async (rut: string, password: string) => {
    try {
      if (!validarRut(rut)) {
        throw new Error("RUT inválido");
      }

      setLoading(true);

      const { data: usuario, error: errorUsuario } = await supabase
        .from("usuarios")
        .select("id, nombres, email")
        .eq("rut", rut)
        .single();

      if (errorUsuario || !usuario) {
        toast.error("RUT no encontrado")
        return
      }

      const { data: usuarioEmpresa, error: errorUsuarioEmpresa } = await
        supabase.
          from("usuario_empresa")
          .select("rol")
          .eq("usuario_id", usuario.id)
          .single()

      if (usuarioEmpresa?.rol === "empleado") {
        toast.error(`El usuario ${usuario.nombres} no cuenta esta autorizado para realizar esta acción`)
        return
      }

      const res = await fetch(`${supabaseUrl}/functions/v1/authorize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          email: usuario.email,
          password,
        }),
      });

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Error en autorización");
      }

      setAuthorized(true)
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };


  const signIn = async (rut: string, password: string) => {
    try {
      // if (!validarRut(rut)) {
      //   throw new Error("RUT inválido");
      // }

      setLoading(true);

      const { data: usuario, error: errorUsuario } = await supabase
        .from("usuarios")
        .select("id, email")
        .eq("rut", rut)
        .single()

      if (errorUsuario || !usuario) {
        throw new Error("RUT no encontrado");
      }

      const { data: usuarioEmpresa, error: errorUsuarioEmpresa } = await
        supabase.from("usuario_empresa").select("rol").eq("usuario_id", usuario.id).single()

      if (usuarioEmpresa?.rol === "empleado") {
        setAuthorized(false)
      } else {
        setAuthorized(true)
      }

      const { error: errorActivarSesion } = await supabase.from("usuarios").update({
        sesion_activa: true,
      }).eq("id", usuario.id)

      if (errorActivarSesion) {
        toast.error("Error al activar la sesión")
        return
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: usuario.email,
        password,
      });

      if (authError) {
        throw authError;
      }
      // La carga se manejará en onAuthStateChange
    } catch (error) {
      throw error;
    } finally {
      setLoading(false)
    }
  };

  const signOut = async () => {
    try {
      setIsSigningOut(true)
      // 1. Cerrar sesión en Supabase
      const { error: errorSupabase } = await supabase.auth.signOut();
      if (errorSupabase) {
        toast.error("Error cerrando sesión en Supabase");
        return;
      }

      // 2. Actualizar tabla usuarios
      if (user?.id) {
        const { error: errorDesactivarSesion } = await supabase
          .from("usuarios")
          .update({ sesion_activa: false })
          .eq("id", user.id);

        if (errorDesactivarSesion) {
          console.error("Error al desactivar la sesión en usuarios:", errorDesactivarSesion);
          // aquí no retornamos, porque ya cerraste la sesión de Supabase
        }
      }

      // 3. Limpiar estados locales
      setEmpresaId(null);
      setAuthorized(false);
      setUser(null);
    } catch (error) {
      console.error("Error en signOut:", error);
    } finally {
      setIsSigningOut(false)
    }
  };


  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('sesion_activa_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'usuarios',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          console.log("Cambio detectado:", payload);

          if (payload.new.sesion_activa === false) {
            signOut();
          }
        }
      )
      .subscribe((status) => {
        console.log("Estado canal:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    setLoading(true);
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Error obteniendo sesión", error);
        setLoading(false);
        return;
      }
      if (session?.user) {
        fetchUserProfile(session.user.id, session.user.email).finally(() => {
          setLoading(false);
        });
      } else {
        setUser(null);
        setEmpresaId(null);
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserProfile(session.user.id, session.user.email).finally(() => {
          setLoading(false);
        });
      } else {
        setUser(null);
        setEmpresaId(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = React.useMemo(
    () => ({
      user,
      empresaId,
      sucursalId,
      loading,
      signIn,
      authorized,
      authorize,
      signOut,
      refetchUserProfile,
    }),
    [user, empresaId, sucursalId, loading, authorized, authorize]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
