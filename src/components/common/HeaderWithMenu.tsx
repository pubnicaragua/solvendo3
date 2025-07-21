// src/components/common/HeaderWithMenu.tsx
import React from 'react';
import { Menu as MenuIcon, Clock, LogOut, X, Bell, AlertTriangle } from 'lucide-react';
import { useSidebar } from '../../contexts/SidebarContext';
import { Logo } from './Logo';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { usePOS } from '../../contexts/POSContext';

interface HeaderWithMenuProps {
  title: string;
  userName?: string;
  userAvatarUrl?: string;
  showClock?: boolean;
  icon?: React.ReactNode;
}

export const HeaderWithMenu: React.FC<HeaderWithMenuProps> = ({ title, userName, userAvatarUrl, showClock = true }) => {
  const { toggleSidebar } = useSidebar();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { productos } = usePOS();
  const [time, setTime] = React.useState('');
  const [showNotifications, setShowNotifications] = React.useState(false);

  React.useEffect(() => {
    if (showClock) {
      const tick = () =>
        setTime(new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()));
      tick();
      const id = setInterval(tick, 1000);
      return () => clearInterval(id);
    }
    return () => {};
  }, [showClock]);

  // Obtener productos bajo de stock
  const productosStockBajo = productos.filter(p => p.stock <= (p.stock_minimo || 5));
  
  // Generar notificaciones del día
  const notificaciones = React.useMemo(() => {
    const today = new Date();
    const notifications = [];
    
    // Notificaciones de stock bajo
    productosStockBajo.forEach(producto => {
      notifications.push({
        id: `stock-${producto.id}`,
        tipo: 'stock_bajo',
        mensaje: `Stock bajo: ${producto.nombre} (${producto.stock} unidades)`,
        hora: today.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
        icono: <AlertTriangle className="w-4 h-4 text-orange-500" />
      });
    });
    
    // Notificaciones de sistema (ejemplo)
    notifications.push(
      {
        id: 'sistema-1',
        tipo: 'sistema',
        mensaje: 'Sistema iniciado correctamente',
        hora: '09:00',
        icono: <Bell className="w-4 h-4 text-blue-500" />
      },
      {
        id: 'caja-1',
        tipo: 'caja',
        mensaje: 'Caja aperturada con $100.000',
        hora: '09:15',
        icono: <Bell className="w-4 h-4 text-green-500" />
      }
    );
    
    return notifications.slice(0, 20); // Máximo 20 notificaciones
  }, [productosStockBajo]);

  const handleStockClick = () => {
    setShowNotifications(true);
  };

  return (
    <>
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b h-1/6">
        <div className="flex items-center gap-3">
          <button onClick={toggleSidebar} className="p-2 hover:bg-gray-100 rounded-lg">
            <MenuIcon className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">{title}</span>
          </div>
        </div>
        <Logo size="md" />
        <div className="flex items-center gap-4">
          {/* Notification for low stock */}
          <div className="relative cursor-pointer" onClick={handleStockClick}>
            <div className="bg-red-100 border border-red-200 rounded-lg px-3 py-1 text-xs text-red-800">
              <span className="font-medium">⚠️ Productos bajo de stock ({productosStockBajo.length})</span>
            </div>
          </div>
          
          {showClock && (
            <div className="flex items-center px-3 py-1 bg-gray-100 rounded-lg">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="ml-1 text-sm">{time}</span>
            </div>
          )}

          {user && (
            <div 
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded-lg"
              onClick={() => setShowNotifications(true)}
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
          )}
        </div>
      </header>

      {/* Modal de notificaciones */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-96 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Notificaciones del día</h3>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {notificaciones.map((notif) => (
                <div key={notif.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  {notif.icono}
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{notif.mensaje}</p>
                    <p className="text-xs text-gray-500">{notif.hora}</p>
                  </div>
                </div>
              ))}
              
              {notificaciones.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>No hay notificaciones</p>
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
    </>
  );
};
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Cerrar sesión</h3>
              <p className="text-sm text-gray-500 text-center">
                ¿Estás seguro que deseas cerrar la sesión actual?
              </p>
              <div className="flex gap-3 w-full mt-4">
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