import React, { useState } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Logo } from "../common/Logo";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

export const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [rut, setRut] = useState("");
  const [password, setPassword] = useState("");
  const [rutFocused, setRutFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rut || !password) {
      toast.error("Por favor ingrese rut y contraseña");
      return;
    }

    setLoading(true);
    try {
      await signIn(rut, password);
      navigate("/");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
      <div className="text-center mb-8">
        <Logo size="lg" className="mx-auto mb-6" />
      </div>

      <div className="bg-gray-50 p-8 rounded-xl w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
          Inicia sesión
        </h2>

        <form onSubmit={handleLogin}>
          <div className="mb-6 relative">
            <input
              type="rut"
              id="rut"
              value={rut}
              onChange={(e) => setRut(e.target.value)}
              onFocus={() => setRutFocused(true)}
              onBlur={() => setRutFocused(false)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base peer"
              required
            />
            <label
              htmlFor="rut"
              className={`  
                absolute left-4 transition-all duration-300 ease-in-out pointer-events-none  
                ${rutFocused || rut
                  ? "top-0 text-xs text-blue-600 bg-white px-1 -translate-y-1/2"
                  : "top-1/2 -translate-y-1/2 text-base text-gray-500"
                }  
              `}
            >
              Rut
            </label>
          </div>

          <div className="mb-6 relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              className="w-full px-4 py-3 pr-10 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base peer"
              required
            />
            <label
              htmlFor="password"
              className={`  
                absolute left-4 transition-all duration-300 ease-in-out pointer-events-none  
                ${passwordFocused || password
                  ? "top-0 text-xs text-blue-600 bg-white px-1 -translate-y-1/2"
                  : "top-1/2 -translate-y-1/2 text-base text-gray-500"
                }  
              `}
            >
              Contraseña
            </label>
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer p-3 rounded-full hover:bg-gray-100"
              aria-label={
                showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
            >
              {showPassword ? (
                <EyeOffIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </button>
          </div>

          <div className="text-right mb-6">
            <a
              href="#"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-lg flex items-center justify-center disabled:opacity-50"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
};
