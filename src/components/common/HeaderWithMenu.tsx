// src/components/common/HeaderWithMenu.tsx
import React from 'react'
import { Menu as MenuIcon, Clock } from 'lucide-react'
import { useSidebar } from '../../contexts/SidebarContext'
import { Logo } from './Logo'

interface HeaderWithMenuProps {
  title: string
  icon: React.ReactNode
}

export const HeaderWithMenu: React.FC<HeaderWithMenuProps> = ({ title, icon }) => {
  const { toggleSidebar } = useSidebar()
  const [time, setTime] = React.useState('')

  React.useEffect(() => {
    const tick = () =>
      setTime(new Intl.DateTimeFormat('es-CL',{hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date()))
    tick()
    const id = setInterval(tick,1000)
    return () => clearInterval(id)
  },[])

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-white border-b">
      <div className="flex items-center gap-3">
        <button onClick={toggleSidebar} className="p-2 hover:bg-gray-100 rounded-lg">
          <MenuIcon className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-lg font-semibold">{title}</span>
        </div>
      </div>
      <Logo size="md" />
      <div className="flex items-center gap-4">
        <div className="flex items-center px-3 py-1 bg-gray-100 rounded-lg">
          <Clock className="w-4 h-4 text-gray-500" />
          <span className="ml-1 text-sm">{time}</span>
        </div>
        {/* avatar + nombre… */}
      </div>
    </header>
  )
}
