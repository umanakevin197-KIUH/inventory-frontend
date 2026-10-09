import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Home, AlertTriangle, Zap } from "lucide-react";

export default function NotFoundPage() {
    return (
        <div className="min-h-screen bg-[#09090B] flex items-center justify-center px-6 relative overflow-hidden">
            {/* Fondo decorativo */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 text-center max-w-md"
            >
                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600">
                        <Zap className="text-white" size={28} />
                    </div>
                </div>

                {/* Ícono */}
                <div className="flex items-center justify-center mb-6">
                    <div className="p-5 rounded-full bg-red-500/10 border border-red-500/20">
                        <AlertTriangle className="text-red-400" size={48} />
                    </div>
                </div>

                {/* Título */}
                <h1 className="text-7xl font-black text-white mb-4">404</h1>
                <h2 className="text-2xl font-bold text-white/80 mb-3">
                    Página no encontrada
                </h2>
                <p className="text-white/40 text-sm mb-8">
                    La página que buscas no existe o fue movida. Verifica la URL o vuelve al inicio.
                </p>

                {/* Botón */}
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
                >
                    <Home size={18} />
                    Volver al Dashboard
                </Link>

                {/* Footer */}
                <p className="text-[10px] text-white/20 tracking-wider mt-8">
                    InventoryX v1.0.0
                </p>
            </motion.div>
        </div>
    );
}