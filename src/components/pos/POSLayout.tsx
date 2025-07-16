import React, { useState, useEffect } from 'react'  
import { CashRegisterModal } from './CashRegisterModal'  
import { Sidebar } from './Sidebar'  
import { usePOS } from '../../contexts/POSContext'  
import { useSidebar } from '../../contexts/SidebarContext'  
  
interface POSLayoutProps {  
  children: React.ReactNode  
}  
  
export const POSLayout: React.FC<POSLayoutProps> = ({ children }) => {  
  const [showCashModal, setShowCashModal] = useState(false)  
  const [cashModalType, setCashModalType] = useState<'open' | 'close'>('open')  
  const { cajaAbierta, checkCajaStatus, loading } = usePOS()  
  const { isOpen } = useSidebar()  
  
  // Check cash register status on mount  
  useEffect(() => {  
    checkCajaStatus()  
  }, [checkCajaStatus])  
  
  // Show cash modal if cash register is not open  
  useEffect(() => {  
    // Solo mostrar el modal si no está cargando y la caja no está abierta  
    if (!loading && !cajaAbierta) {  
      setShowCashModal(true)  
      setCashModalType('open')  
    } else if (cajaAbierta) {  
      setShowCashModal(false)  
    }  
  }, [cajaAbierta, loading])  
  
  const handleCashModalClose = () => {  
    // Only allow closing if cash register is open  
    if (cajaAbierta) {  
      setShowCashModal(false)  
    }  
  }  
  
  const handleCashModalSuccess = () => {  
    // Cerrar el modal cuando la caja se abra exitosamente  
    setShowCashModal(false)  
  }  
  
  return (  
    <>  
      <Sidebar isOpen={isOpen} />  
      {children}  
  
      {/* Cash Register Modal */}  
      <CashRegisterModal  
        isOpen={showCashModal}  
        onClose={handleCashModalClose}  
        type={cashModalType}  
      />  
    </>  
  )  
}