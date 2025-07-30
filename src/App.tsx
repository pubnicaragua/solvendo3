import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { POSProvider } from './contexts/POSContext' 
import { SidebarProvider } from './contexts/SidebarContext'
import { LoginForm } from './components/auth/LoginForm'
import Dashboard from './pages/Dashboard'
import { CashMovementPage } from './pages/CashMovementPage'
import { ReprintPage } from './pages/ReprintPage'
import { ReportsPage } from './pages/ReportsPage'
import { DeliveryPage } from './pages/DeliveryPage'
import { CashClosePage } from './pages/CashClosePage'
import { ReturnsPage } from './pages/ReturnsPage'
import { CashAuditPage } from './pages/CashAuditPage'
import { CashHistoryPage } from './pages/CashHistoryPage'
import { CategoriesPage } from './pages/CategoriesPage'
import { BarcodePage } from './pages/BarcodePage'
import { CustomerHistoryPage } from './pages/CustomerHistoryPage'
import { PromotionsPage } from './pages/PromotionsPage'
import { BillingPage } from './pages/BillingPage'
import { StatusPOSPage } from './pages/StatusPOSPage'
import { POSLayout } from './components/pos/POSLayout'
import { LoginPage } from './components/auth/LoginPage'

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  if (!user) {

    return (
      <Routes> {/* Nuevas Routes aquí para rutas públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/loginform" element={<LoginForm />} /> {/* Rutas públicas */}
        {/* Cualquier otra ruta no autenticada que necesites */}
        <Route path="*" element={<Navigate to="/login" replace />} /> {/* Redirige todo lo demás a login si no está autenticado */}
      </Routes>
    )
  }

  // Si hay usuario autenticado, se renderizan las rutas protegidas
  return (
    <POSProvider>
      <SidebarProvider>
        <POSLayout>
          <Routes>
            {/* Estas son las rutas PROTEGIDAS (solo accesibles si user existe) */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/movimiento" element={<CashMovementPage onClose={() => {}} />} />
            <Route path="/reimprimir" element={<ReprintPage onClose={() => {}} />} />
            <Route path="/reportes" element={<ReportsPage onClose={() => {}} />} />
            <Route path="/despacho" element={<DeliveryPage onClose={() => {}} />} />
            <Route path="/cierre" element={<CashClosePage onClose={() => {}} />} />
            <Route path="/devolucion" element={<ReturnsPage onClose={() => {}} />} />
            <Route path="/arqueo" element={<CashAuditPage onClose={() => {}} />} />
            <Route path="/historial-movimientos" element={<CashHistoryPage onClose={() => {}} />} />
            <Route path="/categorias" element={<CategoriesPage onClose={() => {}} />} />
            <Route path="/codigos-barras" element={<BarcodePage onClose={() => {}} />} />
            <Route path="/historial-cliente" element={<CustomerHistoryPage onClose={() => {}} />} />
            <Route path="/promociones" element={<PromotionsPage onClose={() => {}} />} />
            <Route path="/facturacion" element={<BillingPage onClose={() => {}} />} />
            <Route path="/protect/status-pos" element={<StatusPOSPage />} />
            {/* Redirige a dashboard si intenta acceder a una ruta inexistente estando autenticado */}
            <Route path="*" element={<Navigate to="/" replace />} /> 
          </Routes>
        </POSLayout>
      </SidebarProvider>
    </POSProvider>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  )
}

export default App