import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { supabase, Usuario, UsuarioEmpresa } from "../lib/supabase";

interface AuthContextType {
  user: Usuario | null;
  empresaId: string | null;
  sucursalId: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refetchUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [sucursalId, setSucursalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
        .eq("auth_user_id", userId)
        .single();


      let finalUser = userData;

      if (userError || !userData) {
        // Crear usuario básico como fallback
        finalUser = {
          id: userId,
          auth_user_id: userId,
          email: userEmail || "usuario@ejemplo.com",
          nombres: "Usuario",
          apellidos: "",
          rut: "",
          telefono: "",
          direccion: "",
          activo: true,
          created_at: new Date().toISOString(),
        };
      }

      setUser(finalUser);

      // Solo buscar empresa si hay usuario válido
      if (finalUser?.id) {
        const { data: usuarioEmpresa, error: empresaError } = await supabase
          .from("usuario_empresa")
          .select("empresa_id, sucursal_id, proposito")
          .eq("usuario_id", finalUser.id)
          .eq("activo", true)
          .single();

        if (empresaError) {
          console.error("Error al obtener usuario_empresa:", empresaError);
        }

        setEmpresaId(usuarioEmpresa?.empresa_id || null);
        setSucursalId(usuarioEmpresa?.sucursal_id || null);

        if (usuarioEmpresa?.proposito) {
          setUser((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              proposito: usuarioEmpresa.proposito,
            };
          });
        }

      } else {
        setEmpresaId(null);
        setSucursalId(null);
      }


    } catch (error) {
      console.error("❌ Error crítico en fetchUserProfile:", error);

      // Crear usuario fallback en caso de error crítico
      const fallbackUser = {
        id: userId,
        auth_user_id: userId,
        email: userEmail || "usuario@ejemplo.com",
        nombres: "Usuario",
        apellidos: "",
        rut: "",
        telefono: "",
        direccion: "",
        activo: true,
        created_at: new Date().toISOString(),
      };

      setUser(fallbackUser);
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

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setLoading(false);
        throw error;
      }
      // La carga se manejará en onAuthStateChange
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      setEmpresaId(null);
      setUser(null);
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    ("AuthProvider: inicializando auth, seteando loading true");
    setLoading(true);

    supabase.auth.getSession().then(({ data: { session }, error }) => {

      if (error) {
        console.error("Error obteniendo sesión", error);
        setLoading(false);
        return;
      }
      if (session?.user) {
        fetchUserProfile(session.user.id, session.user.email).finally(() => {
          (
            "AuthProvider: loading false tras fetchUserProfile en inicialización"
          );
          setLoading(false);
        });
      } else {
        setUser(null);
        setEmpresaId(null);
        ("AuthProvider: sin sesión, loading false");
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserProfile(session.user.id, session.user.email).finally(() => {
          (
            "AuthProvider: loading false tras fetchUserProfile en onAuthStateChange"
          );
          setLoading(false);
        });
      } else {
        setUser(null);
        setEmpresaId(null);
        ("AuthProvider: no hay sesión, loading false");
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
      signOut,
      refetchUserProfile,
    }),
    [user, empresaId, sucursalId, loading]
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
