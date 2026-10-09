
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  Users,
  LogOut,
  Settings,
  BarChart3,
  Truck,
  ShoppingCart,
  UserCircle,
  Receipt,
  Users2,
  Brain,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";

const token = localStorage.getItem("token");
let role = "";

if (token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    role = payload.role || "";
    console.log("ROLE:", role);
  } catch {
    console.error("Error parsing token");
  }
}

const menuItems = [
  // ============ 📊 VISIÓN GENERAL ============
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/",
    adminOnly: false,
  },

  // ============ 📦 GESTIÓN OPERATIVA ============
  // (Flujo del negocio: Compra → Inventario → Venta → Factura)
  {
    title: "Productos",
    icon: Package,
    path: "/products",
    adminOnly: false,
  },
  {
    title: "Movimientos",
    icon: ArrowLeftRight,
    path: "/movements",
    adminOnly: false,
  },
  {
    title: "Proveedores",
    icon: Truck,
    path: "/suppliers",
    adminOnly: true,
  },
  {
    title: "Compras",
    icon: ShoppingCart,
    path: "/purchases",
    adminOnly: true,
  },
  {
    title: "Clientes",
    icon: UserCircle,
    path: "/customers",
    adminOnly: false,
  },
  {
    title: "Ventas",
    icon: ShoppingCart,
    path: "/sales",
    adminOnly: false,
  },
  {
    title: "Facturación",
    icon: Receipt,
    path: "/invoices",
    adminOnly: false,
  },

  // ============ 👥 GESTIÓN ADMINISTRATIVA ============
  {
    title: "Usuarios",
    icon: Users,
    path: "/users",
    adminOnly: true,
  },
  {
    title: "Empleados",
    icon: Users2,
    path: "/employees",
    adminOnly: true,
  },
  {
    title: "Planilla",
    icon: Receipt,
    path: "/payroll",
    adminOnly: true,
  },
  {
    title: "Reportes",
    icon: BarChart3,
    path: "/reports",
    adminOnly: true,
  },

  // ============ 🧠 INTELIGENCIA ============
  {
    title: "Inteligencia",
    icon: Brain,
    path: "/intelligence",
    adminOnly: true,
  },

  // ============ ⚙️ SISTEMA ============
  {
    title: "Configuración",
    icon: Settings,
    path: "/settings",
    adminOnly: true,
  },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    if (window.confirm("¿Estás seguro de que deseas cerrar sesión?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      navigate("/login");
    }
  };

 // ✅ Acepta ADMIN y ADMINISTRADOR
const isAdmin = role.toUpperCase() === "ADMIN" || 
                role.toUpperCase() === "ADMINISTRADOR";

const filteredItems = menuItems.filter((item) => {
    if (item.adminOnly && !isAdmin) {
        return false;
    }
    return true;
});

  const getUserName = () => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.name || payload.email || "Usuario";
      } catch {
        return "Usuario";
      }
    }
    return "Usuario";
  };

  return (
    <motion.aside
      initial={{ x: -40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={`
        min-h-screen
        bg-gradient-to-b from-[#0B0B0F] via-[#0F0F1A] to-[#0B0B0F]
        border-r border-white/5
        flex flex-col justify-between
        px-4 py-6
        transition-all duration-300
        ${isCollapsed ? "w-20" : "w-64"}
      `}
    >
      <div>
        {/* LOGO */}
        <div className={`px-3 mb-10 flex items-center ${isCollapsed ? "justify-center" : ""}`}>
          {!isCollapsed ? (
            <div>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
                  <Zap className="text-white" size={18} />
                </div>
                <h1 className="text-white text-2xl font-black tracking-tight">
                  InventoryX
                </h1>
              </div>
              <p className="text-white/30 text-sm mt-1">
                Plataforma de Gestión
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
              <Zap className="text-white" size={22} />
            </div>
          )}
        </div>

        {/* MENÚ */}
        <nav className="space-y-1">
          {filteredItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.title}
                to={item.path}
                className={({ isActive }) => `
                  relative
                  flex items-center
                  ${isCollapsed ? "justify-center px-0" : "gap-3 px-4"}
                  py-3
                  rounded-xl
                  transition-all duration-300
                  text-sm font-medium
                  group
                  ${isActive
                    ? "bg-gradient-to-r from-blue-500/20 to-blue-500/5 text-blue-400 border border-blue-500/20"
                    : "text-white/50 hover:text-white hover:bg-white/[0.03]"
                  }
                `}
              >
                {({ isActive }) => (
                  <>
                    <Icon size={isCollapsed ? 22 : 19} />
                    {!isCollapsed && <span>{item.title}</span>}

                    {isActive && !isCollapsed && (
                      <div className="absolute right-2 w-1 h-6 bg-blue-500 rounded-full" />
                    )}

                    {isCollapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-[#1a1a2e] border border-white/10 rounded-lg text-xs text-white whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        {item.title}
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* FOOTER */}
      <div className="space-y-3">
        <div className={`
          px-4 py-3 rounded-xl
          bg-white/[0.03] border border-white/5
          ${isCollapsed ? "hidden" : "block"}
        `}>
          <p className="text-xs text-white/30">Iniciado sesión como</p>
          <h2 className="text-sm text-white font-semibold mt-1 truncate">
            {getUserName()}
          </h2>
          <p className="text-xs text-blue-400/60 mt-0.5 uppercase">
            {role || "Sin rol"}
          </p>
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`
            w-full flex items-center justify-center gap-2
            px-4 py-2 rounded-xl
            text-white/30 hover:text-white hover:bg-white/5
            transition-all duration-300
            text-xs
          `}
        >
          <svg
            className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
          {!isCollapsed && <span>Colapsar</span>}
        </button>

        <button
          onClick={handleLogout}
          className={`
            w-full flex items-center
            ${isCollapsed ? "justify-center px-0" : "gap-3 px-4"}
            py-3 rounded-xl
            text-red-400 hover:bg-red-500 hover:text-white
            transition-all duration-300
            text-sm font-medium
          `}
        >
          <LogOut size={isCollapsed ? 20 : 18} />
          {!isCollapsed && <span>Cerrar sesión</span>}
        </button>

        {!isCollapsed && (
          <p className="text-center text-[10px] text-white/20 tracking-wider">
            InventoryX v1.0.0
          </p>
        )}
      </div>
    </motion.aside>
  );
}