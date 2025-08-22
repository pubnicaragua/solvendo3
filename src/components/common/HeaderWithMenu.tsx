// src/components/common/HeaderWithMenu.tsx
import React from "react";
import {
  Menu as MenuIcon,
  Clock,
  LogOut,
  X,
  Bell,
  AlertTriangle,
} from "lucide-react";
import { useSidebar } from "../../contexts/SidebarContext";
import { Logo } from "./Logo";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { usePOS } from "../../contexts/POSContext";
import { supabase } from "../../lib/supabase";

interface HeaderWithMenuProps {
  title: string;
  userName?: string;
  userAvatarUrl?: string;
  showClock?: boolean;
  icon?: React.ReactNode;
}

export const HeaderWithMenu: React.FC<HeaderWithMenuProps> = ({
  title,
  userName,
  userAvatarUrl,
  showClock = true,
}) => {
  const { toggleSidebar } = useSidebar();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { productos } = usePOS();
  const [time, setTime] = React.useState("");
  const [supabaseNotificaciones, setSupabaseNotificaciones] = React.useState<
    any[]
  >([]);
  const [loading, setLoading] = React.useState(true);
  const { sucursalId } = useAuth();

  const [showNotifications, setShowNotifications] = React.useState(false);
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);

  // Reloj
  React.useEffect(() => {
    const tick = () =>
      setTime(
        new Intl.DateTimeFormat("es-CL", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(new Date())
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Obtener notificaciones desde Supabase
  React.useEffect(() => {
    const fetchNotificaciones = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("notificaciones")
        .select("*")
        .eq("sucursal_id", sucursalId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error al obtener notificaciones:", error.message);
      } else {
        setSupabaseNotificaciones(data || []);
      }
      setLoading(false);
    };

    fetchNotificaciones();
  }, [sucursalId]);

  // Productos con stock bajo
  const productosStockBajo = productos.filter((p) => p.stock < 5);

  // Combinar notificaciones
  const notificaciones = React.useMemo(() => {
    const today = new Date();

    const localNotifications = productosStockBajo.map((producto) => ({
      id: `stock-${producto.id}`,
      tipo: "stock_bajo",
      mensaje: `Stock bajo: ${producto.nombre} (${producto.stock} unidades)`,
      hora: today.toLocaleTimeString("es-CL", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      icono: <AlertTriangle className="w-4 h-4 text-orange-500" />,
    }));

    const supabaseNotifications = supabaseNotificaciones.map((notif: any) => ({
      id: `supabase-${notif.id}`,
      tipo: notif.tipo,
      mensaje: notif.mensaje,
      hora: notif.created_at
        ? new Date(notif.created_at).toLocaleTimeString("es-CL", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : today.toLocaleTimeString("es-CL", {
            hour: "2-digit",
            minute: "2-digit",
          }),
      icono: <Bell className="w-4 h-4 text-blue-500" />,
    }));

    return [...supabaseNotifications, ...localNotifications];
  }, [productosStockBajo, supabaseNotificaciones]);

  const handleLogout = () => {
    signOut();
    setShowLogoutModal(false);
    navigate("/login");
  };

  return (
    <>
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b h-16">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-lg"
            aria-label="Toggle sidebar"
          >
            <MenuIcon className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">{title}</span>
          </div>
        </div>

        <Logo size="md" />

        <div className="flex items-center gap-4">
          {/* Mostrar notificación solo si hay productos con stock bajo */}
          {productosStockBajo.length > 0 && (
            <div
              className="relative cursor-pointer"
              onClick={() => setShowNotifications(true)}
            >
              <div className="bg-red-100 border border-red-200 rounded-lg px-3 py-1 text-xs text-red-800">
                <span className="font-medium">
                  ⚠️ Stock bajo ({productosStockBajo.length})
                </span>
              </div>
            </div>
          )}

          {showClock && (
            <div className="flex items-center px-3 py-1 bg-gray-100 rounded-lg">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="ml-1 text-sm">{time}</span>
            </div>
          )}

          {user && (
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowNotifications(true)}
                className="p-2 hover:bg-gray-100 rounded-full"
                aria-label="Notifications"
                disabled={productosStockBajo.length === 0}
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {/* {productosStockBajo.length > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {productosStockBajo.length}
                  </span>
                )} */}
              </button>

              <div
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded-lg"
                // onClick={() => setShowLogoutModal(true)}
              >
                {userAvatarUrl ? (
                  <img
                    src={userAvatarUrl}
                    alt={userName}
                    className="w-8 h-8 rounded-full border border-gray-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-600">
                      {userName?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  {userName}
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Notifications Modal */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Notificaciones
              </h3>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close notifications"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {notificaciones.length > 0 ? (
                <div className="space-y-3">
                  {notificaciones.map((notif) => (
                    <div
                      key={notif.id}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      {notif.icono}
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{notif.mensaje}</p>
                        <p className="text-xs text-gray-500">{notif.hora}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>No hay productos con stock bajo</p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t">
              <button
                onClick={() => setShowNotifications(false)}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <LogOut className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Cerrar sesión
              </h3>
              <p className="text-sm text-gray-500 mt-2">
                ¿Estás seguro que deseas cerrar la sesión actual?
              </p>
              <div className="flex gap-3 w-full mt-6">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-2 px-4 bg-red-600 rounded-md text-sm font-medium text-white hover:bg-red-700"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
