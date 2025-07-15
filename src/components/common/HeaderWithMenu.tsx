// src/components/common/HeaderWithMenu.tsx
import React from 'react';
import { Menu as MenuIcon, Clock } from 'lucide-react'; // Importamos MenuIcon de nuevo
import { useSidebar } from '../../contexts/SidebarContext'; // Importamos useSidebar de nuevo
import { Logo } from './Logo';

interface HeaderWithMenuProps {
  title: string;
  // icon: React.ReactNode; // La prop 'icon' sigue eliminada si ese fue el objetivo
  userName?: string;
  userAvatarUrl?: string;
  showClock?: boolean;
}

export const HeaderWithMenu: React.FC<HeaderWithMenuProps> = ({ title, userName, userAvatarUrl, showClock = true }) => {
  const { toggleSidebar } = useSidebar(); // Usamos useSidebar de nuevo
  const [time, setTime] = React.useState('');

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

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-white border-b h-1/6">
      <div className="flex items-center gap-3">
        {/* Botón del menú lateral - RESTAURADO */}
        <button onClick={toggleSidebar} className="p-2 hover:bg-gray-100 rounded-lg">
          <MenuIcon className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex items-center gap-2">
          {/* El icono pasado por props (si existió en un principio) sigue eliminado de aquí */}
          <span className="text-lg font-semibold">{title}</span>
        </div>
      </div>
      <Logo size="md" />
      <div className="flex items-center gap-4">
        {showClock && (
          <div className="flex items-center px-3 py-1 bg-gray-100 rounded-lg">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="ml-1 text-sm">{time}</span>
          </div>
        )}

        {userName && (
          <div className="flex items-center gap-2">
            {userAvatarUrl && (
              <img
                src={userAvatarUrl}
                alt={userName}
                className="w-8 h-8 rounded-full border border-gray-200"
              />
            )}
            <span className="text-sm font-medium text-gray-700 hidden sm:block">
              {userName}
            </span>
          </div>
        )}
      </div>
    </header>
  );
};