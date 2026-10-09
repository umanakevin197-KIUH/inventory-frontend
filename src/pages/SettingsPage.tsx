import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getSubcategories } from "../services/subcategoryService";
import { getCategories, createCategory, updateCategory } from "../services/categoryService";
import { createSubcategory, updateSubcategory } from "../services/subcategoryService";
import {
  Settings,
  FolderTree,
  Store,
  Wrench,
  Plus,
  Edit,
  RefreshCw,
  X,
  Save,
  Package,
  Layers,
  Bell,
  DollarSign,
  Shield,
  Database,
  Building,
  Info,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import toast from "react-hot-toast";

interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  status: boolean;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
  status: boolean;
  created_at: string;
}

interface InventoryConfig {
  reorderPoint: number;
  minStock: number;
  maxStock: number;
  leadTime: number;
  currency: string;
  taxRate: number;
  enableAlerts: boolean;
}

interface SystemConfig {
  businessName: string;
  ruc: string;
  address: string;
  phone: string;
  email: string;
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

export default function SettingsPage() {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [activeSection, setActiveSection] = useState("catalogo");
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryStatus, setCategoryStatus] = useState(true);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [subcategoryName, setSubcategoryName] = useState("");
  const [subcategoryCategoryId, setSubcategoryCategoryId] = useState("");
  const [subcategoryStatus, setSubcategoryStatus] = useState(true);

  // ✅ CONFIGURACIÓN DE INVENTARIO
  const [inventoryConfig, setInventoryConfig] = useState<InventoryConfig>({
    reorderPoint: 5,
    minStock: 3,
    maxStock: 100,
    leadTime: 7,
    currency: "C$",
    taxRate: 15,
    enableAlerts: true,
  });

  // ✅ CONFIGURACIÓN DEL SISTEMA
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    businessName: "Jesús es mi Pastor",
    ruc: "",
    address: "Nicaragua",
    phone: "",
    email: "",
  });

  const [savingConfig, setSavingConfig] = useState(false);

  // ============ FETCH DATA ============
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesData, subcategoriesData] = await Promise.all([
          getCategories(),
          getSubcategories()
        ]);
        setCategories(categoriesData);
        setSubcategories(subcategoriesData);
      } catch (error) {
        console.log(error);
      }
    };
    fetchData();
  }, []);

  // ============ GUARDAR CATEGORÍA ============
  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
      toast.error("Ingrese el nombre de la categoría");
      return;
    }

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: categoryName,
          description: categoryDescription,
          status: categoryStatus,
          created_at: editingCategory.created_at,
        });
        toast.success("Categoría actualizada correctamente");
      } else {
        await createCategory({
          name: categoryName,
          description: categoryDescription,
          status: true,
          created_at: new Date().toISOString().split("T")[0],
        });
        toast.success("Categoría creada correctamente");
      }

      const categoriesData = await getCategories();
      setCategories(categoriesData);

      setCategoryName("");
      setCategoryDescription("");
      setShowCategoryModal(false);
      setEditingCategory(null);
      setCategoryStatus(true);
    } catch (error) {
      console.log(error);
      toast.error("Error al guardar la categoría");
    }
  };

  // ============ TOGGLE CATEGORÍA ============
  const handleToggleCategory = async (category: Category) => {
    try {
      await updateCategory(category.id, {
        name: category.name,
        description: category.description,
        status: !category.status,
        created_at: category.created_at,
      });
      const categoriesData = await getCategories();
      setCategories(categoriesData);
      toast.success(`Categoría ${!category.status ? "activada" : "desactivada"}`);
    } catch (error) {
      console.log(error);
      toast.error("Error al actualizar la categoría");
    }
  };

  // ============ GUARDAR SUBCATEGORÍA ============
  const handleSaveSubcategory = async () => {
    if (!subcategoryName.trim()) {
      toast.error("Ingrese el nombre de la subcategoría");
      return;
    }
    if (!subcategoryCategoryId) {
      toast.error("Seleccione una categoría");
      return;
    }

    try {
      if (editingSubcategory) {
        await updateSubcategory(editingSubcategory.id, {
          category_id: subcategoryCategoryId,
          name: subcategoryName,
          status: subcategoryStatus,
          created_at: editingSubcategory.created_at,
        });
        toast.success("Subcategoría actualizada correctamente");
      } else {
        await createSubcategory({
          category_id: subcategoryCategoryId,
          name: subcategoryName,
          status: true,
          created_at: new Date().toISOString().split("T")[0],
        });
        toast.success("Subcategoría creada correctamente");
      }

      const subcategoriesData = await getSubcategories();
      setSubcategories(subcategoriesData);

      setSubcategoryName("");
      setSubcategoryCategoryId("");
      setSubcategoryStatus(true);
      setEditingSubcategory(null);
      setShowSubcategoryModal(false);
    } catch (error) {
      console.log(error);
      toast.error("Error al guardar la subcategoría");
    }
  };

  // ============ TOGGLE SUBCATEGORÍA ============
  const handleToggleSubcategory = async (subcategory: Subcategory) => {
    try {
      await updateSubcategory(subcategory.id, {
        category_id: subcategory.category_id,
        name: subcategory.name,
        status: !subcategory.status,
        created_at: subcategory.created_at,
      });
      const data = await getSubcategories();
      setSubcategories(data);
      toast.success(`Subcategoría ${!subcategory.status ? "activada" : "desactivada"}`);
    } catch (error) {
      console.log(error);
      toast.error("Error al actualizar la subcategoría");
    }
  };

  // ============ GUARDAR CONFIGURACIÓN ============
  const handleSaveInventoryConfig = async () => {
    setSavingConfig(true);
    try {
      // Simular guardado (aquí conectarías con tu API)
      await new Promise((resolve) => setTimeout(resolve, 800));
      localStorage.setItem("inventoryConfig", JSON.stringify(inventoryConfig));
      toast.success("Configuración de inventario guardada");
    } catch (error) {
      console.log(error);
      toast.error("Error al guardar configuración");
    } finally {
      setSavingConfig(false);
    }
  };

  const handleSaveSystemConfig = async () => {
    setSavingConfig(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      localStorage.setItem("systemConfig", JSON.stringify(systemConfig));
      toast.success("Configuración del sistema guardada");
    } catch (error) {
      console.log(error);
      toast.error("Error al guardar configuración");
    } finally {
      setSavingConfig(false);
    }
  };

  // ============ CERRAR MODALES ============
  const closeCategoryModal = () => {
    setShowCategoryModal(false);
    setEditingCategory(null);
    setCategoryName("");
    setCategoryDescription("");
    setCategoryStatus(true);
  };

  const closeSubcategoryModal = () => {
    setShowSubcategoryModal(false);
    setEditingSubcategory(null);
    setSubcategoryName("");
    setSubcategoryCategoryId("");
    setSubcategoryStatus(true);
  };

  // ============ KPIS ============
  const activeCategories = categories.filter((c) => c.status).length;
  const activeSubcategories = subcategories.filter((s) => s.status).length;

  const kpis = [
    {
      title: "Total Categorías",
      value: categories.length,
      subtitle: `${activeCategories} activas`,
      icon: FolderTree,
      color: "blue" as ColorKey,
      gradient: "from-blue-500/20 to-blue-600/5",
      border: "border-blue-500/20",
    },
    {
      title: "Total Subcategorías",
      value: subcategories.length,
      subtitle: `${activeSubcategories} activas`,
      icon: Layers,
      color: "purple" as ColorKey,
      gradient: "from-purple-500/20 to-purple-600/5",
      border: "border-purple-500/20",
    },
  ];

  // ============ MENÚ LATERAL ============
  const menuItems = [
    { id: "catalogo", label: "Catálogo", icon: FolderTree },
    { id: "inventario", label: "Inventario", icon: Store },
    { id: "sistema", label: "Sistema", icon: Wrench },
  ];

  return (
    <div className="space-y-6">
      {/* ============ HEADER ============ */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="text-blue-400" size={28} />
          Configuración del Sistema
        </h1>
        <p className="text-white/40 mt-1">
          Administra el funcionamiento general del sistema
        </p>
      </div>

      {/* ============ KPIS ============ */}
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

      {/* ============ CONTENIDO PRINCIPAL ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Menú lateral */}
        <div className="lg:col-span-3 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-4 backdrop-blur-xl">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                    ${isActive
                      ? "bg-gradient-to-r from-blue-500/20 to-blue-500/5 text-blue-400 border border-blue-500/20"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                    }
                  `}
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium">{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-1 h-6 bg-blue-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Contenido */}
        <div className="lg:col-span-9 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
          {/* ============ CATÁLOGO ============ */}
          {activeSection === "catalogo" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* CATEGORÍAS */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <FolderTree className="text-blue-400" size={20} />
                      Categorías
                    </h3>
                    <p className="text-white/40 text-sm mt-1">
                      Administre las categorías del sistema
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCategoryModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-sm font-semibold transition-all hover:scale-105"
                  >
                    <Plus size={16} />
                    Nueva Categoría
                  </button>
                </div>

                <div className="space-y-3">
                  {categories.length === 0 ? (
                    <div className="flex items-center justify-center py-8 text-white/40 gap-2">
                      <Package size={20} />
                      No hay categorías registradas
                    </div>
                  ) : (
                    categories.map((category, index) => (
                      <motion.div
                        key={category.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <p className="font-semibold">{category.name}</p>
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                category.status
                                  ? "bg-green-500/20 text-green-400 border border-green-500/20"
                                  : "bg-red-500/20 text-red-400 border border-red-500/20"
                              }`}>
                                {category.status ? "🟢 Activa" : "🔴 Inactiva"}
                              </span>
                            </div>
                            <p className="text-white/40 text-sm mt-1">
                              {category.description || "Sin descripción"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingCategory(category);
                                setCategoryName(category.name);
                                setCategoryDescription(category.description);
                                setCategoryStatus(category.status);
                                setShowCategoryModal(true);
                              }}
                              className="p-2 rounded-xl bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-all"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleToggleCategory(category)}
                              className="p-2 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all"
                            >
                              <RefreshCw size={16} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>

              {/* SUBCATEGORÍAS */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Layers className="text-purple-400" size={20} />
                      Subcategorías
                    </h3>
                    <p className="text-white/40 text-sm mt-1">
                      Administre las subcategorías del sistema
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowSubcategoryModal(true);
                      setEditingSubcategory(null);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white text-sm font-semibold transition-all hover:scale-105"
                  >
                    <Plus size={16} />
                    Nueva Subcategoría
                  </button>
                </div>

                <div className="space-y-3">
                  {subcategories.map((subcategory, index) => {
                    const category = categories.find((c) => c.id === subcategory.category_id);
                    return (
                      <motion.div
                        key={subcategory.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <p className="font-semibold">{subcategory.name}</p>
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                subcategory.status
                                  ? "bg-green-500/20 text-green-400 border border-green-500/20"
                                  : "bg-red-500/20 text-red-400 border border-red-500/20"
                              }`}>
                                {subcategory.status ? "🟢 Activa" : "🔴 Inactiva"}
                              </span>
                            </div>
                            <p className="text-white/40 text-sm mt-1">
                              Categoría: {category?.name || "No asignada"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingSubcategory(subcategory);
                                setSubcategoryName(subcategory.name);
                                setSubcategoryCategoryId(subcategory.category_id);
                                setSubcategoryStatus(subcategory.status);
                                setShowSubcategoryModal(true);
                              }}
                              className="p-2 rounded-xl bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-all"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleToggleSubcategory(subcategory)}
                              className="p-2 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all"
                            >
                              <RefreshCw size={16} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ============ INVENTARIO ============ */}
          {activeSection === "inventario" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Store className="text-blue-400" size={24} />
                  Configuración de Inventario
                </h2>
                <p className="text-white/40 text-sm mt-1">
                  Configure los parámetros del control de inventario
                </p>
              </div>

              {/* Alertas de Stock */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Bell className="text-yellow-400" size={18} />
                  Alertas de Stock
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-white/40 block mb-1.5">Punto de Reorden</label>
                    <input
                      type="number"
                      value={inventoryConfig.reorderPoint}
                      onChange={(e) => setInventoryConfig({ ...inventoryConfig, reorderPoint: Number(e.target.value) })}
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                    />
                    <p className="text-xs text-white/30 mt-1">Unidades mínimas antes de reordenar</p>
                  </div>
                  <div>
                    <label className="text-sm text-white/40 block mb-1.5">Stock Mínimo</label>
                    <input
                      type="number"
                      value={inventoryConfig.minStock}
                      onChange={(e) => setInventoryConfig({ ...inventoryConfig, minStock: Number(e.target.value) })}
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-white/40 block mb-1.5">Stock Máximo</label>
                    <input
                      type="number"
                      value={inventoryConfig.maxStock}
                      onChange={(e) => setInventoryConfig({ ...inventoryConfig, maxStock: Number(e.target.value) })}
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-white/40 block mb-1.5">Días de Lead Time</label>
                    <input
                      type="number"
                      value={inventoryConfig.leadTime}
                      onChange={(e) => setInventoryConfig({ ...inventoryConfig, leadTime: Number(e.target.value) })}
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                    />
                    <p className="text-xs text-white/30 mt-1">Días que tarda un proveedor en entregar</p>
                  </div>
                </div>
              </div>

              {/* Moneda e Impuestos */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <DollarSign className="text-green-400" size={18} />
                  Moneda e Impuestos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-white/40 block mb-1.5">Moneda</label>
                    <select
                      value={inventoryConfig.currency}
                      onChange={(e) => setInventoryConfig({ ...inventoryConfig, currency: e.target.value })}
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                    >
                      <option value="C$" className="bg-[#1a1a2e]">Córdobas (C$)</option>
                      <option value="$" className="bg-[#1a1a2e]">Dólares ($)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-white/40 block mb-1.5">IVA (%)</label>
                    <input
                      type="number"
                      value={inventoryConfig.taxRate}
                      onChange={(e) => setInventoryConfig({ ...inventoryConfig, taxRate: Number(e.target.value) })}
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Toggle de Alertas */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <p className="font-semibold">Alertas Automáticas</p>
                  <p className="text-white/40 text-sm">Notificar cuando el stock esté bajo</p>
                </div>
                <button
                  onClick={() => setInventoryConfig({ ...inventoryConfig, enableAlerts: !inventoryConfig.enableAlerts })}
                  className={`relative w-14 h-8 rounded-full transition-all ${
                    inventoryConfig.enableAlerts ? "bg-green-500/40" : "bg-white/10"
                  }`}
                >
                  <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${
                    inventoryConfig.enableAlerts ? "left-7" : "left-1"
                  }`} />
                </button>
              </div>

              {/* Botón Guardar */}
              <div className="flex justify-end">
                <button
                  onClick={handleSaveInventoryConfig}
                  disabled={savingConfig}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold transition-all disabled:opacity-50"
                >
                  <Save size={18} />
                  {savingConfig ? "Guardando..." : "Guardar Configuración"}
                </button>
              </div>
            </motion.div>
          )}

          {/* ============ SISTEMA ============ */}
          {activeSection === "sistema" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Wrench className="text-blue-400" size={24} />
                  Configuración del Sistema
                </h2>
                <p className="text-white/40 text-sm mt-1">
                  Información general y preferencias del sistema
                </p>
              </div>

              {/* Información del Negocio */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Building className="text-blue-400" size={18} />
                  Información del Negocio
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-sm text-white/40 block mb-1.5">Nombre del Negocio</label>
                    <input
                      type="text"
                      value={systemConfig.businessName}
                      onChange={(e) => setSystemConfig({ ...systemConfig, businessName: e.target.value })}
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-white/40 block mb-1.5">RUC</label>
                    <input
                      type="text"
                      placeholder="Número de RUC"
                      value={systemConfig.ruc}
                      onChange={(e) => setSystemConfig({ ...systemConfig, ruc: e.target.value })}
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-white/40 block mb-1.5">Teléfono</label>
                    <input
                      type="text"
                      placeholder="Número de teléfono"
                      value={systemConfig.phone}
                      onChange={(e) => setSystemConfig({ ...systemConfig, phone: e.target.value })}
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-white/40 block mb-1.5">Correo</label>
                    <input
                      type="email"
                      placeholder="correo@negocio.com"
                      value={systemConfig.email}
                      onChange={(e) => setSystemConfig({ ...systemConfig, email: e.target.value })}
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-white/40 block mb-1.5">Dirección</label>
                    <input
                      type="text"
                      placeholder="Dirección del negocio"
                      value={systemConfig.address}
                      onChange={(e) => setSystemConfig({ ...systemConfig, address: e.target.value })}
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Información del Sistema */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Info className="text-cyan-400" size={18} />
                  Información del Sistema
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-xs text-white/40">Versión</p>
                    <p className="font-semibold mt-1">v1.0.0</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-xs text-white/40">Categorías</p>
                    <p className="font-semibold mt-1">{categories.length}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-xs text-white/40">Subcategorías</p>
                    <p className="font-semibold mt-1">{subcategories.length}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-xs text-white/40">Estado</p>
                    <p className="font-semibold mt-1 text-green-400">Activo</p>
                  </div>
                </div>
              </div>

              {/* Seguridad */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Shield className="text-purple-400" size={18} />
                  Seguridad
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                    <div>
                      <p className="text-sm font-medium">Autenticación JWT</p>
                      <p className="text-xs text-white/40">Tokens seguros con expiración</p>
                    </div>
                    <CheckCircle className="text-green-400" size={20} />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                    <div>
                      <p className="text-sm font-medium">Contraseñas cifradas</p>
                      <p className="text-xs text-white/40">bcrypt con salt</p>
                    </div>
                    <CheckCircle className="text-green-400" size={20} />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                    <div>
                      <p className="text-sm font-medium">Control de roles</p>
                      <p className="text-xs text-white/40">Admin y Empleado</p>
                    </div>
                    <CheckCircle className="text-green-400" size={20} />
                  </div>
                </div>
              </div>

              {/* Respaldos */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Database className="text-yellow-400" size={18} />
                  Respaldos
                </h3>
                <div className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="text-yellow-400" size={20} />
                    <div>
                      <p className="text-sm font-medium">Último respaldo</p>
                      <p className="text-xs text-white/40">No hay respaldos registrados</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 rounded-xl bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 text-sm font-medium transition-all">
                    Crear Respaldo
                  </button>
                </div>
              </div>

              {/* Botón Guardar */}
              <div className="flex justify-end">
                <button
                  onClick={handleSaveSystemConfig}
                  disabled={savingConfig}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold transition-all disabled:opacity-50"
                >
                  <Save size={18} />
                  {savingConfig ? "Guardando..." : "Guardar Configuración"}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ============ MODAL CATEGORÍA ============ */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] border border-white/10 rounded-3xl p-8 w-[480px] max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <FolderTree className="text-blue-400" size={24} />
                {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
              </h2>
              <button
                onClick={closeCategoryModal}
                className="p-2 rounded-xl hover:bg-white/10 transition-all text-white/50 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/40 block mb-1.5">Nombre</label>
                <input
                  type="text"
                  placeholder="Nombre de la categoría"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                />
              </div>

              <div>
                <label className="text-sm text-white/40 block mb-1.5">Descripción</label>
                <input
                  type="text"
                  placeholder="Descripción de la categoría"
                  value={categoryDescription}
                  onChange={(e) => setCategoryDescription(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/5">
                <button
                  onClick={closeCategoryModal}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 py-3 rounded-xl font-semibold transition-all"
                >
                  <X size={18} />
                  Cancelar
                </button>
                <button
                  onClick={handleSaveCategory}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 py-3 rounded-xl font-semibold transition-all"
                >
                  <Save size={18} />
                  {editingCategory ? "Actualizar" : "Guardar"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ============ MODAL SUBCATEGORÍA ============ */}
      {showSubcategoryModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] border border-white/10 rounded-3xl p-8 w-[480px] max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Layers className="text-purple-400" size={24} />
                {editingSubcategory ? "Editar Subcategoría" : "Nueva Subcategoría"}
              </h2>
              <button
                onClick={closeSubcategoryModal}
                className="p-2 rounded-xl hover:bg-white/10 transition-all text-white/50 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/40 block mb-1.5">Categoría</label>
                <select
                  value={subcategoryCategoryId}
                  onChange={(e) => setSubcategoryCategoryId(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                >
                  <option value="" className="bg-[#1a1a2e]">Seleccionar categoría</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id} className="bg-[#1a1a2e]">
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-white/40 block mb-1.5">Nombre</label>
                <input
                  type="text"
                  placeholder="Nombre de la subcategoría"
                  value={subcategoryName}
                  onChange={(e) => setSubcategoryName(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/5">
                <button
                  onClick={closeSubcategoryModal}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 py-3 rounded-xl font-semibold transition-all"
                >
                  <X size={18} />
                  Cancelar
                </button>
                <button
                  onClick={handleSaveSubcategory}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 py-3 rounded-xl font-semibold transition-all"
                >
                  <Save size={18} />
                  {editingSubcategory ? "Actualizar" : "Guardar"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}