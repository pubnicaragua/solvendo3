import React, { createContext, useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DollarSign,
  RotateCcw,
  TrendingUp,
  Printer,
  BarChart3,
  Truck,
  Home
} from 'lucide-react'

interface SidebarContextValue {
  isOpen: boolean
  toggleSidebar: () => void;
  closeSidebar: () => void; // Añadir esta línea
  handleSidebarAction: (action: SidebarItem['id']) => void
  items: SidebarItem[]
}

type SidebarItem =
  | { id: 'inicio'; label: 'Inicio'; icon: React.ReactNode }
  | { id: 'cierre'; label: 'Cierre de caja'; icon: React.ReactNode }
  | { id: 'devolucion'; label: 'Devolución'; icon: React.ReactNode }
  | { id: 'movimiento'; label: 'Movimiento de efectivo'; icon: React.ReactNode }
  | { id: 'reimprimir'; label: 'Reimprimir'; icon: React.ReactNode }
  | { id: 'reportes'; label: 'Reportes'; icon: React.ReactNode }
  | { id: 'despacho'; label: 'Despacho'; icon: React.ReactNode }

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined)

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  const toggleSidebar = () => setIsOpen(open => !open)
  const closeSidebar = () => setIsOpen(false); // Definir la función closeSidebar

  const items: SidebarItem[] = [
    { id: 'inicio', label: 'Inicio', icon: <Home className="w-5 h-5" /> },
    { id: 'cierre', label: 'Cierre de caja', icon: <DollarSign className="w-5 h-5" /> },
    { id: 'devolucion', label: 'Devolución', icon: <RotateCcw className="w-5 h-5" /> },
    { id: 'movimiento', label: 'Movimiento de efectivo', icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'reimprimir', label: 'Reimprimir', icon: <Printer className="w-5 h-5" /> },
    { id: 'reportes', label: 'Reportes', icon: <BarChart3 className="w-5 h-5" /> },
    // { id: 'despacho',   label: 'Despacho',                icon: <Truck className="w-5 h-5" /> }
  ]

  const handleSidebarAction = (action: SidebarItem['id']) => {
    switch (action) {
      case 'inicio':
        navigate('/')
        break
      case 'cierre':
        navigate('/cierre')
        break
      case 'devolucion':
        navigate('/devolucion')
        break
      case 'movimiento':
        navigate('/movimiento')
        break
      case 'reimprimir':
        navigate('/reimprimir')
        break
      case 'reportes':
        navigate('/reportes')
        break
      case 'despacho':
        navigate('/despacho')
        break
      default:
        navigate('/')
        break
    }
    setIsOpen(false)
  }

  return (
    <SidebarContext.Provider value={{ isOpen, toggleSidebar, closeSidebar, handleSidebarAction, items }}>
      {children}
    </SidebarContext.Provider>
  )
}

export const useSidebar = (): SidebarContextValue => {
  const ctx = useContext(SidebarContext)
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider')
  return ctx
}