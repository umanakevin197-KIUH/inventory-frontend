import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginRequest } from "../services/auth.service";
import { saveToken } from "../store/authStore";
import { motion } from "framer-motion";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  Zap,
  AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";
import { AuthBackground } from "../components/AuthBackground";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      setError("Por favor complete todos los campos");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await loginRequest({ email, password });
      saveToken(response.token);
      toast.success("¡Bienvenido de nuevo!");
      navigate("/");
    } catch (error) {
      console.log(error);
      setError("Credenciales inválidas. Verifique su correo y contraseña.");
      toast.error("Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center text-white px-6 relative overflow-hidden">
      {/* ✅ Fondo mejorado */}
      <AuthBackground />

      {/* ✅ SOLO UN motion.div - EL DEL FORMULARIO */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl relative z-10"
      >
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600">
              <Zap className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">
                <span className="text-white">INVENTORY</span>
                <span className="text-blue-400">X</span>
              </h1>
              <p className="text-xs text-white/40">Plataforma de Gestión</p>
            </div>
          </div>
        </div>

        {/* Título */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Bienvenido de nuevo</h2>
          <p className="text-white/50 text-sm">Inicia sesión para continuar</p>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2"
          >
            <AlertCircle className="text-red-400" size={18} />
            <p className="text-sm text-red-400">{error}</p>
          </motion.div>
        )}

        {/* Formulario */}
        <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
          {/* Email */}
          <div>
            <label className="text-sm text-white/40 block mb-1.5">Correo electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <input
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off" 
                name="email-login"
                className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 outline-none focus:border-blue-500/50 transition-all text-sm"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-sm text-white/40 block mb-1.5">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                name="password-login"
                className="w-full pl-10 pr-12 py-3.5 rounded-2xl bg-white/5 border border-white/10 outline-none focus:border-blue-500/50 transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-all"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Botón */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-3.5 rounded-2xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Iniciando sesión...
              </>
            ) : (
              <>
                <LogIn size={18} />
                Iniciar Sesión
              </>
            )}
          </button>
        </form>

        {/* Link a Register */}
        <div className="mt-8 text-center">
          <p className="text-white/50 text-sm">
            ¿No tienes una cuenta?{" "}
            <Link
              to="/register"
              className="text-blue-400 font-semibold hover:underline transition-all"
            >
              Regístrate
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-[10px] text-white/20 tracking-wider">
            InventoryX v1.0.0
          </p>
        </div>
      </motion.div>
    </div>
  );
}