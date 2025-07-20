// src/components/common/HeaderWithMenu.tsx
import React from 'react';
import { Menu as MenuIcon, Clock, LogOut, X } from 'lucide-react';
import { useSidebar } from '../../contexts/SidebarContext';
import { Logo } from './Logo';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface HeaderWithMenuProps {
  title: string;
  userName?: string;
  userAvatarUrl?: string;
  showClock?: boolean;
  icon?: React.ReactNode;
}

export const HeaderWithMenu: React.FC<HeaderWithMenuProps> = ({ title, userName, userAvatarUrl, showClock = true }) => {
  const { toggleSidebar } = useSidebar();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [time, setTime] = React.useState('');
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);

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

  const handleLogout = async () => {
    try {
      await logout();
      setShowLogoutModal(false);
      navigate('/login'); // Redirige a la página de login
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
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
          <div className="relative">
            <div className="bg-red-100 border border-red-200 rounded-lg px-3 py-1 text-xs text-red-800">
              <span className="font-medium">⚠️ Productos bajo de stock</span>
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
              onClick={() => setShowLogoutModal(true)}
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

      {/* Modal de confirmación para cerrar sesión */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <div className="flex flex-col items-center gap-4">
              <div className="p-3 bg-red-100 rounded-full">
                <LogOut className="w-6 h-6 text-red-600" />
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