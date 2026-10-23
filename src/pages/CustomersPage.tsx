import { motion } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import {
    getCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    type Customer,
} from "../services/customerService";
import {
    Users,
    Plus,
    Edit,
    Trash2,
    X,
    Save,
    Search,
    UserCircle,
} from "lucide-react";
import toast from "react-hot-toast";

type ColorKey = 'blue' | 'green' | 'purple';

const colorClasses: Record<ColorKey, { text: string; bg: string }> = {
    blue: { text: "text-blue-400", bg: "bg-blue-500/20" },
    green: { text: "text-green-400", bg: "bg-green-500/20" },
    purple: { text: "text-purple-400", bg: "bg-purple-500/20" },
};

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [saving, setSaving] = useState(false);

    const initialForm = {
        name: "",
        ruc: "",
        phone: "",
        email: "",
        address: "",
        status: true,
    };

    const [formData, setFormData] = useState(initialForm);

    // ============ CARGAR CLIENTES ============
    const loadCustomers = useCallback(async () => {
        try {
            const data = await getCustomers();
            setCustomers(data);
        } catch (error) {
            console.log(error);
            toast.error("Error al cargar clientes");
        }
    }, []);

    useEffect(() => {
        loadCustomers();
    }, [loadCustomers]);

    // ============ GUARDAR ============
    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error("Ingrese el nombre del cliente");
            return;
        }

        setSaving(true);
        try {
            if (editingCustomer) {
                await updateCustomer(editingCustomer.id, formData);
                toast.success("Cliente actualizado correctamente");
            } else {
                await createCustomer(formData);
                toast.success("Cliente creado correctamente");
            }
            await loadCustomers();
            closeModal();
        } catch (error) {
            console.log(error);
            toast.error("Error al guardar cliente");
        } finally {
            setSaving(false);
        }
    };

    // ============ ELIMINAR ============
    const handleDelete = async (customer: Customer) => {
        if (!window.confirm(`¿Eliminar el cliente "${customer.name}"?`)) return;
        try {
            await deleteCustomer(customer.id);
            toast.success("Cliente eliminado");
            await loadCustomers();
        } catch (error) {
            console.log(error);
            toast.error("Error al eliminar cliente");
        }
    };

    // ============ ABRIR EDITAR ============
    const openEdit = (customer: Customer) => {
        setEditingCustomer(customer);
        setFormData({
            name: customer.name,
            ruc: customer.ruc || "",
            phone: customer.phone || "",
            email: customer.email || "",
            address: customer.address || "",
            status: customer.status,
        });
        setShowModal(true);
    };

    // ============ CERRAR MODAL ============
    const closeModal = () => {
        setShowModal(false);
        setEditingCustomer(null);
        setFormData(initialForm);
    };

    // ============ FILTRAR ============
    const filteredCustomers = customers.filter(
        (c) =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.email?.toLowerCase().includes(search.toLowerCase()) ||
            c.phone?.includes(search) ||
            c.ruc?.includes(search)
    );

    // ============ KPIS ============
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter((c) => c.status).length;

    const kpis = [
        {
            title: "Total Clientes",
            value: totalCustomers,
            subtitle: `${activeCustomers} activos`,
            icon: Users,
            color: "blue" as ColorKey,
            gradient: "from-blue-500/20 to-blue-600/5",
            border: "border-blue-500/20",
        },
        {
            title: "Clientes Activos",
            value: activeCustomers,
            subtitle: "Disponibles para venta",
            icon: UserCircle,
            color: "green" as ColorKey,
            gradient: "from-green-500/20 to-green-600/5",
            border: "border-green-500/20",
        },
    ];

    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Users className="text-blue-400" size={28} />
                        Clientes
                    </h1>
                    <p className="text-white/40 mt-1">
                        Gestión de clientes del negocio
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
                >
                    <Plus size={20} />
                    Nuevo Cliente
                </button>
            </div>

            {/* KPIS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {kpis.map((kpi, index) => {
                    const colors = colorClasses[kpi.color];
                    return (
                        <motion.div
                            key={kpi.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`bg-gradient-to-br ${kpi.gradient} border ${kpi.border} rounded-3xl p-5 backdrop-blur-xl`}
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
                className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-6 backdrop-blur-xl"
            >
                <div className="flex items-center justify-between mb-6">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por nombre, email, teléfono o RUC..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-blue-500/50"
                        />
                    </div>
                    <span className="text-xs text-white/30">
                        {filteredCustomers.length} de {totalCustomers}
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
                                <th className="pb-3 font-medium">Cliente</th>
                                <th className="pb-3 font-medium">Contacto</th>
                                <th className="pb-3 font-medium">Teléfono</th>
                                <th className="pb-3 font-medium text-center">Estado</th>
                                <th className="pb-3 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-10 text-center text-white/40">
                                        {search
                                            ? "No se encontraron clientes"
                                            : "No hay clientes registrados"}
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers.map((customer, index) => (
                                    <motion.tr
                                        key={customer.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        className="border-b border-white/5 hover:bg-white/5 transition-all"
                                    >
                                        <td className="py-3.5">
                                            <div className="font-medium text-sm">{customer.name}</div>
                                            <div className="text-xs text-white/40">
                                                {customer.ruc || "Sin RUC"}
                                            </div>
                                        </td>
                                        <td className="py-3.5 text-sm text-white/60">
                                            {customer.email || "—"}
                                        </td>
                                        <td className="py-3.5 text-sm text-white/60">
                                            {customer.phone || "—"}
                                        </td>
                                        <td className="py-3.5 text-center">
                                            <span
                                                className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                                    customer.status
                                                        ? "bg-green-500/20 text-green-400 border border-green-500/20"
                                                        : "bg-red-500/20 text-red-400 border border-red-500/20"
                                                }`}
                                            >
                                                {customer.status ? "🟢 Activo" : "🔴 Inactivo"}
                                            </span>
                                        </td>
                                        <td className="py-3.5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEdit(customer)}
                                                    className="p-2 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(customer)}
                                                    className="p-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] border border-white/10 rounded-3xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <UserCircle className="text-blue-400" size={24} />
                                {editingCustomer ? "Editar Cliente" : "Nuevo Cliente"}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-white/40 block mb-1.5">
                                    Nombre del Cliente *
                                </label>
                                <input
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    placeholder="Nombre completo"
                                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm text-white/40 block mb-1.5">Cédula / Identificación</label>
                                    <input
                                        value={formData.ruc}
                                        onChange={(e) =>
                                            setFormData({ ...formData, ruc: e.target.value })
                                        }
                                        placeholder="Ej: 001-150390-1001A"
                                        className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-white/40 block mb-1.5">
                                        Teléfono
                                    </label>
                                    <input
                                        value={formData.phone}
                                        onChange={(e) =>
                                            setFormData({ ...formData, phone: e.target.value })
                                        }
                                        placeholder="8888-8888"
                                        className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm text-white/40 block mb-1.5">Correo</label>
                                <input
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData({ ...formData, email: e.target.value })
                                    }
                                    placeholder="correo@ejemplo.com"
                                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50"
                                />
                            </div>

                            <div>
                                <label className="text-sm text-white/40 block mb-1.5">
                                    Dirección
                                </label>
                                <input
                                    value={formData.address}
                                    onChange={(e) =>
                                        setFormData({ ...formData, address: e.target.value })
                                    }
                                    placeholder="Dirección del cliente"
                                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50"
                                />
                            </div>

                            <div>
                                <label className="text-sm text-white/40 block mb-1.5">Estado</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, status: true })}
                                        className={`py-3 rounded-xl font-semibold transition-all ${
                                            formData.status
                                                ? "bg-green-500/20 text-green-400 border border-green-500/20"
                                                : "bg-white/5 text-white/40 hover:bg-white/10"
                                        }`}
                                    >
                                        🟢 Activo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, status: false })}
                                        className={`py-3 rounded-xl font-semibold transition-all ${
                                            !formData.status
                                                ? "bg-red-500/20 text-red-400 border border-red-500/20"
                                                : "bg-white/5 text-white/40 hover:bg-white/10"
                                        }`}
                                    >
                                        🔴 Inactivo
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-white/5">
                                <button
                                    onClick={closeModal}
                                    className="flex-1 flex items-center justify-center gap-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 py-3 rounded-xl font-semibold transition-all"
                                >
                                    <X size={18} />
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 py-3 rounded-xl font-semibold transition-all disabled:opacity-50"
                                >
                                    {saving ? "Guardando..." : (
                                        <>
                                            <Save size={18} />
                                            {editingCustomer ? "Actualizar" : "Guardar"}
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