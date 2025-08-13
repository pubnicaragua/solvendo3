import React, { useState } from "react";
import { Eye, EyeOff, Shield } from "lucide-react";
import { Logo } from "../common/Logo";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

export const LoginForm: React.FC = () => {
  const [rut, setRut] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { authorize } = useAuth();

  const handleSupervisorAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rut || !password) {
      toast.error("Por favor ingresa rut y contraseña");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await authorize(rut, password);
    } catch (error: any) {
      setError("Error de conexión");
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Logo size="lg" className="mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Autorización de Supervisor
          </h2>
          <p className="text-gray-600">
            Ingresa tus credenciales para continuar
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSupervisorAuth}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="rut"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Rut
              </label>
              <input
                id="rut"
                name="rut"
                type="rut"
                required
                value={rut}
                onChange={(e) => setRut(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="XX.XXX.XXX-X"
              />
            </div>

            <div className="relative">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Contraseña del supervisor"
              />
              <button
                type="button"
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <Shield className="w-5 h-5 mr-2" />
            {loading ? "Autorizando..." : "Autorizar Acceso"}
          </button>
        </form>
      </div>
    </div>
  );
};
