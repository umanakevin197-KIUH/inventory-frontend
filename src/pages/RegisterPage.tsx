import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import api from "../services/api";
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  UserPlus, 
  Zap,
  AlertCircle,
  Shield,
  UserCircle
} from "lucide-react";
import toast from "react-hot-toast";
import { AuthBackground } from "../components/AuthBackground";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "EMPLEADO",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError("Por favor complete todos los campos");
      return;
    }

    if (form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.post("/auth/register", form);
      toast.success("Usuario registrado exitosamente");
      navigate("/login");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.log(error.response?.data);
        setError(error.response?.data?.message || "Error al registrar usuario");
      } else {
        setError("Error inesperado");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center px-6 text-white relative overflow-hidden">
      {/* ✅ Fondo mejorado */}
      <AuthBackground />

      {/* ✅ SOLO UN motion.div - EL DEL FORMULARIO */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl relative z-10"
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
          <h2 className="text-3xl font-bold mb-2">Crear una cuenta</h2>
          <p className="text-white/50 text-sm">Registra un nuevo usuario en el sistema</p>
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
        <form onSubmit={handleRegister} className="space-y-4" autoComplete="off">
          {/* Nombre */}
          <div>
            <label className="text-sm text-white/40 block mb-1.5">Nombre completo</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <input
                name="name"
                placeholder="Nombre del usuario"
                value={form.name}
                onChange={handleChange}
                autoComplete="off"
                className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 outline-none focus:border-blue-500/50 transition-all text-sm"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-sm text-white/40 block mb-1.5">Correo electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <input
                name="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="off"
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
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
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

          {/* Rol */}
          <div>
            <label className="text-sm text-white/40 block mb-1.5">Rol del usuario</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, role: "ADMINISTRADOR" })}
                className={`py-3.5 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  form.role === "ADMINISTRADOR"
                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/20"
                    : "bg-white/5 text-white/40 hover:bg-white/10 border border-white/10"
                }`}
              >
                <Shield size={18} />
                Administrador
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, role: "EMPLEADO" })}
                className={`py-3.5 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  form.role === "EMPLEADO"
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/20"
                    : "bg-white/5 text-white/40 hover:bg-white/10 border border-white/10"
                }`}
              >
                <UserCircle size={18} />
                Empleado
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
                Registrando...
              </>
            ) : (
              <>
                <UserPlus size={18} />
                Crear Cuenta
              </>
            )}
          </button>
        </form>

        {/* Link a Login */}
        <div className="mt-8 text-center">
          <p className="text-white/50 text-sm">
            ¿Ya tienes una cuenta?{" "}
            <Link
              to="/login"
              className="text-blue-400 font-semibold hover:underline transition-all"
            >
              Inicia sesión
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