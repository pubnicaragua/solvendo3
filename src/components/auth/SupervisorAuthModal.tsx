import React, { useState } from 'react'
import { X, Shield, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

interface SupervisorAuthModalProps {
  isOpen: boolean
  onClose: () => void
  onAuthorize: () => void
}

export const SupervisorAuthModal: React.FC<SupervisorAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthorize
}) => {
  const [supervisorRut, setSupervisorRut] = useState('')
  const [supervisorPassword, setSupervisorPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { validateUser } = useAuth()

  if (!isOpen) return null

  const handleAuthorize = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validación simplificada para demo
    if (!supervisorRut || !supervisorPassword) {
      toast.error('Por favor complete todos los campos');
      return
    }

    setLoading(true)
    
    try {
      // Usar credenciales hardcoded para demo
      if (supervisorRut === '78.168.951-3' && supervisorPassword === '123456') {
        toast.success('Autorización exitosa');
        onAuthorize();
      } else {
        toast.error('Credenciales inválidas');
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-600" />
              <h3 className="text-xl font-semibold text-gray-900">Autorización</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-orange-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Autorización</h2>
            <p className="text-gray-600">ID / RUT Supervisor</p>
          </div>

          <form onSubmit={handleAuthorize} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ID / RUT Supervisor</label>
              <input
                type="text"
                value={supervisorRut}
                onChange={(e) => setSupervisorRut(e.target.value)}
                placeholder="12.345.678-9"
                className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                autoFocus
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña del Supervisor</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={supervisorPassword}
                onChange={(e) => setSupervisorPassword(e.target.value)}
                placeholder="Contraseña del Supervisor"
                className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform translate-y-1 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={!supervisorRut || !supervisorPassword || loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors h-12"
            >
              {loading ? 'Autorizando...' : 'Autorizar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}