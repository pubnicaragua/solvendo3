import React, { useState } from 'react';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../common/Logo'; // Asegúrate de que esta ruta sea correcta para tu componente Logo
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Por favor ingrese email y contraseña');
      return;
    }
    
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        navigate('/');
      } else {
        toast.error(result.error || 'Error en el login');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    // Contenedor principal de la página, centra todo el contenido verticalmente
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">

      {/* Nuevo encabezado con el logo centrado */}
      <div className="text-center mb-8"> {/* Centra el contenido y añade un margen inferior */}
        <Logo size="lg" className="mx-auto mb-6" /> {/* Logo con tamaño grande y margen inferior automático para centrarlo */}
      </div>

      {/* Contenedor del formulario de login */}
      <div className="bg-gray-50 p-8 rounded-xl w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">Inicia sesión</h2>

        <div className="mb-6 relative">
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base peer"
            placeholder=" "
          />
          <label
            htmlFor="email"
            className={`
              absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none transition-all duration-300 ease-in-out
              ${(emailFocused || email) ? 'top-0.5 text-xs text-blue-600 bg-gray-50 px-1 -translate-y-1/2 peer-focus:text-blue-600' : 'text-base'}
            `}
          >
            Correo
          </label>
        </div>

        <div className="mb-6 relative">
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
            className="w-full px-4 py-3 pr-10 border border-gray-200 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base peer"
            placeholder=" "
          />
          <label
            htmlFor="password"
            className={`
              absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none transition-all duration-300 ease-in-out
              ${(passwordFocused || password) ? 'top-0.5 text-xs text-blue-600 bg-gray-50 px-1 -translate-y-1/2 peer-focus:text-blue-600' : 'text-base'}
            `}
          >
            Contraseña
          </label>
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer p-3 rounded-full hover:bg-gray-100"
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? (
              <EyeOffIcon className="w-5 h-5" />
            ) : (
              <EyeIcon className="w-5 h-5" />
            )}
          </button>
        </div>

        <div className="text-right mb-6">
          <a href="#" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            ¿Olvidaste tu contraseña?
          </a>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-lg flex items-center justify-center disabled:opacity-50"
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </div>
    </div>
  );
};