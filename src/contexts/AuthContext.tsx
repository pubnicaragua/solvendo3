import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, Usuario, UsuarioEmpresa } from '../lib/supabase'
import toast from 'react-hot-toast'

interface AuthContextType {
  user: Usuario | null
  loading: boolean
  login: (rut: string, password: string) => Promise<{ success: boolean; error?: string }>
  validateUser: (rut: string, password: string) => Promise<{ success: boolean; user?: Usuario; error?: string }>
  logout: () => Promise<void>
  empresaId: string | null
  sucursalId: string | null
  userRole: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [sucursalId, setSucursalId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is already logged in from localStorage
    const savedUser = localStorage.getItem('pos_user')
    const savedEmpresa = localStorage.getItem('pos_empresa')
    const savedSucursal = localStorage.getItem('pos_sucursal')
    const savedRole = localStorage.getItem('pos_role')

    if (savedUser && savedEmpresa && savedSucursal) {
      setUser(JSON.parse(savedUser))
      setEmpresaId(savedEmpresa)
      setSucursalId(savedSucursal)
      setUserRole(savedRole)
    }
    
    setLoading(false)
  }, [])

  const validateUser = async (rut: string, password: string): Promise<{ success: boolean; user?: Usuario; error?: string }> => {
    try {
      console.log('Validating user with RUT:', rut)

      // Usar la función RPC para validar el usuario
      const { data, error } = await supabase
        .rpc('validate_user_by_rut', {
          p_rut: rut,
          p_password: password
        });

      if (error) throw error;
      if (!data || data.length === 0) return { success: false, error: 'Credenciales incorrectas' };

      // Validación simplificada para demo
      if (rut === '78.168.951-3' && password === '123456') {
        const mockUser = {
          id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          email: 'emilio@demo.cl',
          nombre: 'Emilio',
          apellidos: 'Aguilera',
          rut: '78.168.951-3',
          activo: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        return { success: true, user: mockUser }
      } else {
        return { success: false, error: 'Credenciales incorrectas' }
      }
    } catch (error) {
      console.error('Error validating user:', error)
      return { success: false, error: 'Error de validación' }
    }
  }

  const login = async (rut: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true)

      // Validar credenciales
      const validationResult = await validateUser(rut, password);
      if (!validationResult.success) {
        return { success: false, error: validationResult.error || 'Credenciales incorrectas' };
      }

      // En un entorno real con Supabase Auth, se haría algo como:
      /*
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: validationResult.user?.email || '',
        password: password
      });

      if (authError) throw authError;
      */

      // Datos de usuario de prueba para evitar errores
      const mockUser = validationResult.user || {
        id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        email: 'emilio@demo.cl',
        nombre: 'Emilio',
        apellidos: 'Aguilera',
        rut: '78.168.951-3',
        activo: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // Datos de empresa y sucursal de prueba
      const mockEmpresaId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
      const mockSucursalId = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
      const mockRole = 'cajero'
      
      // Establecer datos en el contexto
      setUser(mockUser)
      setEmpresaId(mockEmpresaId)
      setSucursalId(mockSucursalId)
      setUserRole(mockRole)
      
      // Guardar en localStorage
      localStorage.setItem('pos_user', JSON.stringify(mockUser))
      localStorage.setItem('pos_empresa', mockEmpresaId)
      localStorage.setItem('pos_sucursal', mockSucursalId) 
      localStorage.setItem('pos_role', mockRole)

      toast.success('Inicio de sesión exitoso')
      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Error inesperado' }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setUser(null)
    setEmpresaId(null)
    setSucursalId(null)
    setUserRole(null)
    
    // Clear localStorage
    localStorage.removeItem('pos_user')
    localStorage.removeItem('pos_empresa')
    localStorage.removeItem('pos_sucursal')
    localStorage.removeItem('pos_role')
  }

  const value = {
    user,
    loading,
    login,
    validateUser,
    logout,
    empresaId,
    sucursalId,
    userRole
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}