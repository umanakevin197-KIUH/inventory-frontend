import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  getUsers,
  createUser,
  updateUser,
  resetPassword,
} from "../services/userService";
import {
  Users,
  UserPlus,
  Edit,
  Key,
  X,
  Save,
  Shield,
  User as UserIcon,
  Search,
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  status: boolean;
  created_at: string;
}

type ColorKey = 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'cyan';

const colorClasses: Record<ColorKey, { text: string; bg: string; border: string }> = {
  blue: { text: "text-blue-400", bg: "bg-blue-500/20", border: "border-blue-500/20" },
  green: { text: "text-green-400", bg: "bg-green-500/20", border: "border-green-500/20" },
  red: { text: "text-red-400", bg: "bg-red-500/20", border: "border-red-500/20" },
  yellow: { text: "text-yellow-400", bg: "bg-yellow-500/20", border: "border-yellow-500/20" },
  purple: { text: "text-purple-400", bg: "bg-purple-500/20", border: "border-purple-500/20" },
  cyan: { text: "text-cyan-400", bg: "bg-cyan-500/20", border: "border-cyan-500/20" },
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [search, setSearch] = useState("");

  // ✅ ESTADOS DEL FORMULARIO - SEPARADOS Y LIMPIOS
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "EMPLOYEE",
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getUsers();
        setUsers(data);
      } catch (error) {
        console.log(error);
      }
    };
    fetchUsers();
  }, []);

  // ✅ RESET FORMULARIO
  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "EMPLOYEE",
    });
    setEditingUser(null);
  };

  // ✅ ABRIR MODAL PARA NUEVO USUARIO
  const handleNewUser = () => {
    resetForm();
    setShowModal(true);
  };

  // ✅ ABRIR MODAL PARA EDITAR
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    });
    setShowModal(true);
  };

  // ✅ CERRAR MODAL
  const handleCloseModal = () => {
    resetForm();
    setShowModal(false);
  };

  // ✅ GUARDAR USUARIO
  const handleSaveUser = async () => {
    if (saving) return;

    if (!formData.name.trim()) {
      toast.error("Ingrese el nombre del usuario");
      return;
    }
    if (!formData.email.trim()) {
      toast.error("Ingrese el correo electrónico");
      return;
    }
    if (!editingUser && !formData.password.trim()) {
      toast.error("Ingrese una contraseña");
      return;
    }

    setSaving(true);
    try {
      if (editingUser) {
        await updateUser(editingUser.id, {
          name: formData.name,
          email: formData.email,
          password: formData.password.trim() ? formData.password : editingUser.password,
          role: formData.role,
          status: editingUser.status,
          created_at: editingUser.created_at,
        });
        toast.success("Usuario actualizado correctamente");
      } else {
        await createUser({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          status: true,
          created_at: new Date().toISOString().split("T")[0],
        });
        toast.success("Usuario creado correctamente");
      }

      const data = await getUsers();
      setUsers(data);
      resetForm();
      setShowModal(false);
    } catch (error) {
      console.log(error);
      toast.error(editingUser ? "Error al actualizar usuario" : "Error al crear usuario");
    } finally {
      setSaving(false);
    }
  };

  // ✅ RESTABLECER CONTRASEÑA
  const handleResetPassword = async (id: string) => {
    const confirmReset = window.confirm("¿Estás seguro de que deseas restablecer la contraseña?");
    if (!confirmReset) return;

    try {
      const result = await resetPassword(id);
      toast.success(`Nueva contraseña: ${result.password}`, {
        duration: 7000,
      });
    } catch (error) {
      console.log(error);
      toast.error("No se pudo restablecer la contraseña");
    }
  };

  // ============ METRICS ============
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status).length;
  const inactiveUsers = users.filter((u) => !u.status).length;
  const adminUsers = users.filter((u) => u.role === "ADMIN").length;
  const employeeUsers = users.filter((u) => u.role === "EMPLOYEE").length;

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  );

  const kpis = [
    {
      title: "Total Usuarios",
      value: totalUsers,
      subtitle: `${activeUsers} activos • ${inactiveUsers} inactivos`,
      icon: Users,
      color: "blue" as ColorKey,
      gradient: "from-blue-500/20 to-blue-600/5",
      border: "border-blue-500/20",
    },
    {
      title: "Administradores",
      value: adminUsers,
      subtitle: "Acceso total al sistema",
      icon: Shield,
      color: "purple" as ColorKey,
      gradient: "from-purple-500/20 to-purple-600/5",
      border: "border-purple-500/20",
    },
    {
      title: "Empleados",
      value: employeeUsers,
      subtitle: "Acceso limitado",
      icon: UserIcon,
      color: "cyan" as ColorKey,
      gradient: "from-cyan-500/20 to-cyan-600/5",
      border: "border-cyan-500/20",
    },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="text-blue-400" size={28} />
            Usuarios
          </h1>
          <p className="text-white/40 mt-1">
            Gestión de usuarios y permisos del sistema
          </p>
        </div>
        <button
          onClick={handleNewUser}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105"
        >
          <UserPlus size={20} />
          Nuevo Usuario
        </button>
      </div>

      {/* KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map((kpi, index) => {
          const colors = colorClasses[kpi.color];
          return (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-gradient-to-br ${kpi.gradient} border ${kpi.border} rounded-3xl p-5 backdrop-blur-xl hover:scale-[1.02] transition-all`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/50 text-sm">{kpi.title}</p>
                  <h2 className="text-3xl font-bold mt-1">{kpi.value}</h2>
                  <p className="text-xs text-white/40 mt-1">{kpi.subtitle}</p>
                </div>
                <div className={`p-3 rounded-2xl ${colors.bg}`}>
                  <kpi.icon className={colors.text} size={22} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* TABLA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-6 backdrop-blur-xl hover:border-white/20 transition-all"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar usuarios por nombre o correo..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 transition-all"
            />
          </div>
          <span className="text-xs text-white/30">
            {filteredUsers.length} de {totalUsers} usuarios
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
                <th className="pb-3 font-medium">Nombre</th>
                <th className="pb-3 font-medium">Correo</th>
                <th className="pb-3 font-medium text-center">Rol</th>
                <th className="pb-3 font-medium text-center">Estado</th>
                <th className="pb-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-white/40">
                    {search ? "No se encontraron usuarios" : "No hay usuarios registrados"}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-all group"
                  >
                    <td className="py-3.5 font-medium text-sm">{user.name}</td>
                    <td className="py-3.5 text-sm text-white/60">{user.email}</td>
                    <td className="py-3.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                          user.role === "ADMIN"
                            ? "bg-purple-500/20 text-purple-400 border border-purple-500/20"
                            : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/20"
                        }`}
                      >
                        {user.role === "ADMIN" ? "👑 Admin" : "👤 Empleado"}
                      </span>
                    </td>
                    <td className="py-3.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                          user.status
                            ? "bg-green-500/20 text-green-400 border border-green-500/20"
                            : "bg-red-500/20 text-red-400 border border-red-500/20"
                        }`}
                      >
                        {user.status ? "🟢 Activo" : "🔴 Inactivo"}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-2 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all"
                          title="Editar usuario"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleResetPassword(user.id)}
                          className="p-2 rounded-xl bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-all"
                          title="Restablecer contraseña"
                        >
                          <Key size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
          <p className="text-xs text-white/30">
            Mostrando {filteredUsers.length} de {totalUsers} usuarios
          </p>
        </div>
      </motion.div>

      {/* ============ MODAL - CON KEY PARA FORZAR REINICIO ============ */}
      {showModal && (
        <div 
          key={editingUser ? `edit-${editingUser.id}` : "new-user"} 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] border border-white/10 rounded-3xl p-8 w-[480px] max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <UserPlus className="text-blue-400" size={24} />
                {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 rounded-xl hover:bg-white/10 transition-all text-white/50 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="text-sm text-white/40 block mb-1.5">Nombre completo</label>
                <input
                  placeholder="Nombre del usuario"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                />
              </div>

              {/* Correo */}
              <div>
                <label className="text-sm text-white/40 block mb-1.5">Correo electrónico</label>
                <input
                  type="email"
                  autoComplete="off"
                  placeholder="correo@ejemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                />
              </div>

              {/* Contraseña */}
              <div>
                <label className="text-sm text-white/40 block mb-1.5">
                  {editingUser ? "Nueva contraseña (opcional)" : "Contraseña"}
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder={editingUser ? "Dejar vacío para mantener" : "********"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                />
                {editingUser && (
                  <p className="text-xs text-white/30 mt-1">
                    Deja vacío para mantener la contraseña actual
                  </p>
                )}
              </div>

              {/* Rol */}
              <div>
                <label className="text-sm text-white/40 block mb-1.5">Rol</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setFormData({ ...formData, role: "ADMIN" })}
                    className={`py-3 rounded-xl font-semibold transition-all ${
                      formData.role === "ADMIN"
                        ? "bg-purple-500/20 text-purple-400 border border-purple-500/20"
                        : "bg-white/5 text-white/40 hover:bg-white/10"
                    }`}
                  >
                    👑 Administrador
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, role: "EMPLOYEE" })}
                    className={`py-3 rounded-xl font-semibold transition-all ${
                      formData.role === "EMPLOYEE"
                        ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/20"
                        : "bg-white/5 text-white/40 hover:bg-white/10"
                    }`}
                  >
                    👤 Empleado
                  </button>
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4 border-t border-white/5">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 py-3 rounded-xl font-semibold transition-all"
                >
                  <X size={18} />
                  Cancelar
                </button>
                <button
                  onClick={handleSaveUser}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 py-3 rounded-xl font-semibold disabled:opacity-50 transition-all"
                >
                  {saving ? (
                    "Guardando..."
                  ) : (
                    <>
                      <Save size={18} />
                      {editingUser ? "Actualizar" : "Crear"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}