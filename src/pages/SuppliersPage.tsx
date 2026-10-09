import { motion } from "framer-motion";
import { useEffect, useState, useCallback  } from "react";
import {
    getSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    type Supplier
} from "../services/supplierService";
import {
    Users,
    Plus,
    Edit,
    Trash2,
    X,
    Save,
    Search,
    Star,
    Building,
    Phone,
    Mail,
    MapPin,
} from "lucide-react";
import toast from "react-hot-toast";

type ColorKey = 'blue' | 'green' | 'red' | 'yellow' | 'purple';

const colorClasses: Record<ColorKey, { text: string; bg: string }> = {
    blue: { text: "text-blue-400", bg: "bg-blue-500/20" },
    green: { text: "text-green-400", bg: "bg-green-500/20" },
    red: { text: "text-red-400", bg: "bg-red-500/20" },
    yellow: { text: "text-yellow-400", bg: "bg-yellow-500/20" },
    purple: { text: "text-purple-400", bg: "bg-purple-500/20" },
};

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [saving, setSaving] = useState(false);

    const initialForm = {
        name: "",
        ruc: "",
        phone: "",
        email: "",
        address: "",
        contact_name: "",
        rating: 5,
        payment_terms: "",
        notes: "",
        status: true,
    };

    const [formData, setFormData] = useState(initialForm);


    const loadSuppliers = useCallback(async () => {
        try {
            const data = await getSuppliers();
            setSuppliers(data);
        } catch (error) {
            console.log(error);
            toast.error("Error al cargar proveedores");
        }
    }, []);

    
    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => {
        loadSuppliers();
    }, [loadSuppliers]);

    // ============ GUARDAR ============
    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error("Ingrese el nombre del proveedor");
            return;
        }

        setSaving(true);
        try {
            if (editingSupplier) {
                await updateSupplier(editingSupplier.id, formData);
                toast.success("Proveedor actualizado correctamente");
            } else {
                await createSupplier(formData);
                toast.success("Proveedor creado correctamente");
            }
            await loadSuppliers();
            closeModal();
        } catch (error) {
            console.log(error);
            toast.error("Error al guardar proveedor");
        } finally {
            setSaving(false);
        }
    };

    // ============ ELIMINAR ============
    const handleDelete = async (supplier: Supplier) => {
        if (!window.confirm(`¿Eliminar el proveedor "${supplier.name}"?`)) return;
        try {
            await deleteSupplier(supplier.id);
            toast.success("Proveedor eliminado");
            await loadSuppliers();
        } catch (error) {
            console.log(error);
            toast.error("Error al eliminar proveedor");
        }
    };

    // ============ ABRIR EDITAR ============
    const openEdit = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setFormData({
            name: supplier.name,
            ruc: supplier.ruc || "",
            phone: supplier.phone || "",
            email: supplier.email || "",
            address: supplier.address || "",
            contact_name: supplier.contact_name || "",
            rating: supplier.rating || 5,
            payment_terms: supplier.payment_terms || "",
            notes: supplier.notes || "",
            status: supplier.status,
        });
        setShowModal(true);
    };

    // ============ CERRAR MODAL ============
    const closeModal = () => {
        setShowModal(false);
        setEditingSupplier(null);
        setFormData(initialForm);
    };

    // ============ FILTRAR ============
    const filteredSuppliers = suppliers.filter(
        (s) =>
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.email?.toLowerCase().includes(search.toLowerCase()) ||
            s.phone?.includes(search) ||
            s.ruc?.includes(search)
    );

    // ============ KPIS ============
    const totalSuppliers = suppliers.length;
    const activeSuppliers = suppliers.filter((s) => s.status).length;
    const avgRating = totalSuppliers > 0
        ? (suppliers.reduce((sum, s) => sum + (s.rating || 5), 0) / totalSuppliers).toFixed(1)
        : "0.0";

    const kpis = [
        {
            title: "Total Proveedores",
            value: totalSuppliers,
            subtitle: `${activeSuppliers} activos`,
            icon: Users,
            color: "blue" as ColorKey,
            gradient: "from-blue-500/20 to-blue-600/5",
            border: "border-blue-500/20",
        },
        {
            title: "Rating Promedio",
            value: avgRating,
            subtitle: "Calificación general",
            icon: Star,
            color: "yellow" as ColorKey,
            gradient: "from-yellow-500/20 to-yellow-600/5",
            border: "border-yellow-500/20",
        },
    ];

    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Users className="text-blue-400" size={28} />
                        Proveedores
                    </h1>
                    <p className="text-white/40 mt-1">
                        Gestión de proveedores del negocio
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
                >
                    <Plus size={20} />
                    Nuevo Proveedor
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
                {/* Búsqueda */}
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
                        {filteredSuppliers.length} de {totalSuppliers}
                    </span>
                </div>

                {/* Tabla */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
                                <th className="pb-3 font-medium">Proveedor</th>
                                <th className="pb-3 font-medium">Contacto</th>
                                <th className="pb-3 font-medium">Teléfono</th>
                                <th className="pb-3 font-medium text-center">Rating</th>
                                <th className="pb-3 font-medium text-center">Estado</th>
                                <th className="pb-3 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSuppliers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-10 text-center text-white/40">
                                        {search
                                            ? "No se encontraron proveedores"
                                            : "No hay proveedores registrados"}
                                    </td>
                                </tr>
                            ) : (
                                filteredSuppliers.map((supplier, index) => (
                                    <motion.tr
                                        key={supplier.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        className="border-b border-white/5 hover:bg-white/5 transition-all"
                                    >
                                        <td className="py-3.5">
                                            <div className="font-medium text-sm">{supplier.name}</div>
                                            <div className="text-xs text-white/40">
                                                {supplier.ruc || "Sin RUC"}
                                            </div>
                                        </td>
                                        <td className="py-3.5 text-sm text-white/60">
                                            {supplier.contact_name || "—"}
                                        </td>
                                        <td className="py-3.5 text-sm text-white/60">
                                            {supplier.phone || "—"}
                                        </td>
                                        <td className="py-3.5 text-center">
                                            <div className="inline-flex items-center gap-1">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        size={12}
                                                        className={
                                                            i < (supplier.rating || 5)
                                                                ? "text-yellow-400 fill-yellow-400"
                                                                : "text-white/20"
                                                        }
                                                    />
                                                ))}
                                            </div>
                                        </td>
                                        <td className="py-3.5 text-center">
                                            <span
                                                className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                                    supplier.status
                                                        ? "bg-green-500/20 text-green-400 border border-green-500/20"
                                                        : "bg-red-500/20 text-red-400 border border-red-500/20"
                                                }`}
                                            >
                                                {supplier.status ? "🟢 Activo" : "🔴 Inactivo"}
                                            </span>
                                        </td>
                                        <td className="py-3.5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEdit(supplier)}
                                                    className="p-2 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all"
                                                    title="Editar"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(supplier)}
                                                    className="p-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                                                    title="Eliminar"
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
                <div
                    key={editingSupplier ? `edit-${editingSupplier.id}` : "new-supplier"}
                    className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] border border-white/10 rounded-3xl p-8 w-[600px] max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <Building className="text-blue-400" size={24} />
                                {editingSupplier ? "Editar Proveedor" : "Nuevo Proveedor"}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Nombre */}
                                <div className="md:col-span-2">
                                    <label className="text-sm text-white/40 block mb-1.5">
                                        Nombre del Proveedor *
                                    </label>
                                    <input
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({ ...formData, name: e.target.value })
                                        }
                                        placeholder="Nombre de la empresa"
                                        className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50"
                                    />
                                </div>

                                {/* RUC */}
                                <div>
                                    <label className="text-sm text-white/40 block mb-1.5">RUC</label>
                                    <input
                                        value={formData.ruc}
                                        onChange={(e) =>
                                            setFormData({ ...formData, ruc: e.target.value })
                                        }
                                        placeholder="Número de RUC"
                                        className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50"
                                    />
                                </div>

                                {/* Contacto */}
                                <div>
                                    <label className="text-sm text-white/40 block mb-1.5">
                                        Persona de Contacto
                                    </label>
                                    <input
                                        value={formData.contact_name}
                                        onChange={(e) =>
                                            setFormData({ ...formData, contact_name: e.target.value })
                                        }
                                        placeholder="Nombre del contacto"
                                        className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50"
                                    />
                                </div>

                                {/* Teléfono */}
                                <div>
                                    <label className="text-sm text-white/40 block mb-1.5">
                                        Teléfono
                                    </label>
                                    <div className="relative">
                                        <Phone
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                                            size={16}
                                        />
                                        <input
                                            value={formData.phone}
                                            onChange={(e) =>
                                                setFormData({ ...formData, phone: e.target.value })
                                            }
                                            placeholder="Número de teléfono"
                                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50"
                                        />
                                    </div>
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="text-sm text-white/40 block mb-1.5">Correo</label>
                                    <div className="relative">
                                        <Mail
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                                            size={16}
                                        />
                                        <input
                                            value={formData.email}
                                            onChange={(e) =>
                                                setFormData({ ...formData, email: e.target.value })
                                            }
                                            placeholder="correo@proveedor.com"
                                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50"
                                        />
                                    </div>
                                </div>

                                {/* Dirección */}
                                <div className="md:col-span-2">
                                    <label className="text-sm text-white/40 block mb-1.5">
                                        Dirección
                                    </label>
                                    <div className="relative">
                                        <MapPin
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                                            size={16}
                                        />
                                        <input
                                            value={formData.address}
                                            onChange={(e) =>
                                                setFormData({ ...formData, address: e.target.value })
                                            }
                                            placeholder="Dirección del proveedor"
                                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50"
                                        />
                                    </div>
                                </div>

                                {/* Rating */}
                                <div>
                                    <label className="text-sm text-white/40 block mb-1.5">Rating</label>
                                    <select
                                        value={formData.rating}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                rating: Number(e.target.value),
                                            })
                                        }
                                        className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50"
                                    >
                                        <option value={5} className="bg-[#1a1a2e]">
                                            ⭐⭐⭐⭐⭐ Excelente
                                        </option>
                                        <option value={4} className="bg-[#1a1a2e]">
                                            ⭐⭐⭐⭐ Bueno
                                        </option>
                                        <option value={3} className="bg-[#1a1a2e]">
                                            ⭐⭐⭐ Regular
                                        </option>
                                        <option value={2} className="bg-[#1a1a2e]">
                                            ⭐⭐ Malo
                                        </option>
                                        <option value={1} className="bg-[#1a1a2e]">
                                            ⭐ Muy Malo
                                        </option>
                                    </select>
                                </div>

                                {/* Condiciones de pago */}
                                <div>
                                    <label className="text-sm text-white/40 block mb-1.5">
                                        Condiciones de Pago
                                    </label>
                                    <input
                                        value={formData.payment_terms}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                payment_terms: e.target.value,
                                            })
                                        }
                                        placeholder="Ej: Contado, 30 días"
                                        className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50"
                                    />
                                </div>

                                {/* Estado */}
                                <div className="md:col-span-2">
                                    <label className="text-sm text-white/40 block mb-1.5">Estado</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setFormData({ ...formData, status: true })
                                            }
                                            className={`py-3 rounded-xl font-semibold transition-all ${
                                                formData.status
                                                    ? "bg-green-500/20 text-green-400 border border-green-500/20"
                                                    : "bg-white/5 text-white/40 hover:bg-white/10 border border-white/10"
                                            }`}
                                        >
                                            🟢 Activo
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setFormData({ ...formData, status: false })
                                            }
                                            className={`py-3 rounded-xl font-semibold transition-all ${
                                                !formData.status
                                                    ? "bg-red-500/20 text-red-400 border border-red-500/20"
                                                    : "bg-white/5 text-white/40 hover:bg-white/10 border border-white/10"
                                            }`}
                                        >
                                            🔴 Inactivo
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Botones */}
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
                                    {saving ? (
                                        "Guardando..."
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            {editingSupplier ? "Actualizar" : "Guardar"}
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