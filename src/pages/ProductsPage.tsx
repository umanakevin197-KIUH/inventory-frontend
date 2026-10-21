import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getProducts, updateProduct } from "../services/productService";
import { getCategories } from "../services/categoryService";
import { getSubcategoriesByCategory } from "../services/subcategoryService";
import {
  Search,
  Package,
  AlertTriangle,
  AlertCircle,
  Edit,
  X,
  Save
} from "lucide-react";
import { formatCurrency } from "../utils/formatCurrency";

// ============ TIPOS ============
type ColorKey = 'blue' | 'yellow' | 'red';

const colorClasses: Record<ColorKey, { text: string; bg: string }> = {
  blue: { text: "text-blue-400", bg: "bg-blue-500/20" },
  yellow: { text: "text-yellow-400", bg: "bg-yellow-500/20" },
  red: { text: "text-red-400", bg: "bg-red-500/20" },
};

interface Product {
  id: string;
  category_id: string;
  subcategory_id: string;
  name: string;
  description: string;
  status: boolean;
  stock: number;
  price: number;
}

interface Category {
  id: string;
  name: string;
  status: boolean;
}

interface Subcategory {
  id: string;
  category_id: string;
  status: boolean;
  name: string;
}

// ============ COMPONENTE ============
export default function ProductsPage() {
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");

  const initialFormData = {
    category_id: "",
    subcategory_id: "",
    name: "",
    description: "",
    status: true,
    created_at: new Date().toISOString().split("T")[0],
    price: 0,
    stock: 0,
  };

  const [formData, setFormData] = useState(initialFormData);

  // ============ FETCH CATEGORIES ============
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesData = await getCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.log(error);
      }
    };
    fetchCategories();
  }, []);

  // ============ FETCH PRODUCTS ============
  useEffect(() => {
    const fetchData = async () => {
      try {
        const productsData = await getProducts();
        setProducts(productsData);
      } catch (error) {
        console.log(error);
      }
    };
    fetchData();
  }, []);

  // ============ CARGAR SUBCATEGORÍAS MANUALMENTE ============
  const loadSubcategoriesForModal = async (categoryId: string) => {
    console.log('🔍 loadSubcategoriesForModal llamado con categoryId:', categoryId);
    if (!categoryId) {
      console.log('❌ categoryId vacío, limpiando subcategorías');
      setSubcategories([]);
      return;
    }
    try {
      console.log('📡 Buscando subcategorías para:', categoryId);
      const data = await getSubcategoriesByCategory(categoryId);
      console.log('✅ Subcategorías recibidas:', data);
      setSubcategories(data || []);
    } catch (error) {
      console.error('❌ Error cargando subcategorías:', error);
      setSubcategories([]);
    }
  };

  // ============ HANDLE UPDATE ============
  const handleUpdateProduct = async () => {
    if (!editingProductId || saving) return;

    setSaving(true);
    try {
      await updateProduct(editingProductId, {
        ...formData,
        price: Number(formData.price),
        stock: Number(formData.stock),
      });

      const productsData = await getProducts();
      setProducts(productsData);

      setShowModal(false);
      setEditingProductId(null);
      setFormData(initialFormData);
      setSubcategories([]);
    } catch (error) {
      console.log(error);
      alert("Error al actualizar el producto");
    } finally {
      setSaving(false);
    }
  };

  // ============ FILTER PRODUCTS ============
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.description.toLowerCase().includes(search.toLowerCase())
  );

  // ============ METRICS ============
  const totalProducts = products.length;
  const lowStockProducts = products.filter((p) => Number(p.stock) <= 5 && Number(p.stock) > 0);
  const outOfStockProducts = products.filter((p) => Number(p.stock) === 0);
  const healthyStockProducts = products.filter((p) => Number(p.stock) > 5);

  // ============ STOCK BADGE ============
  const getStockBadge = (stock: number) => {
    if (stock === 0) {
      return {
        label: "Agotado",
        className: "bg-red-500/20 text-red-400 border border-red-500/20",
        icon: <AlertCircle size={14} className="text-red-400" />
      };
    }
    if (stock <= 5) {
      return {
        label: `Bajo Stock (${stock})`,
        className: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/20",
        icon: <AlertTriangle size={14} className="text-yellow-400" />
      };
    }
    return {
      label: `${stock} unidades`,
      className: "bg-green-500/20 text-green-400 border border-green-500/20",
      icon: <Package size={14} className="text-green-400" />
    };
  };

  // ============ KPIS ============
  const kpis: Array<{
    title: string;
    value: number;
    subtitle: string;
    icon: React.ElementType;
    color: ColorKey;
    gradient: string;
    border: string;
  }> = [
      {
        title: "Total Productos",
        value: totalProducts,
        subtitle: `${healthyStockProducts.length} con stock saludable`,
        icon: Package,
        color: "blue",
        gradient: "from-blue-500/20 to-blue-600/5",
        border: "border-blue-500/20",
      },
      {
        title: "Existencias Bajas",
        value: lowStockProducts.length,
        subtitle: "Productos con stock crítico",
        icon: AlertTriangle,
        color: "yellow",
        gradient: "from-yellow-500/20 to-yellow-600/5",
        border: "border-yellow-500/20",
      },
      {
        title: "Productos Agotados",
        value: outOfStockProducts.length,
        subtitle: "Necesitan reposición",
        icon: AlertCircle,
        color: "red",
        gradient: "from-red-500/20 to-red-600/5",
        border: "border-red-500/20",
      },
    ];

  return (
    <div className="space-y-6">
      {/* ============ HEADER ============ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="text-blue-400" size={28} />
            Productos
          </h1>
          <p className="text-white/40 mt-1">
            Administre su catálogo de productos
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-2">
          <span className="text-sm text-white/40">
            {filteredProducts.length} de {totalProducts} productos
          </span>
        </div>
      </div>

      {/* ============ KPIS ============ */}
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

      {/* ============ TABLA ============ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-6 backdrop-blur-xl hover:border-white/20 transition-all"
      >
        {/* Búsqueda */}
        <div className="flex items-center justify-between mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar productos por nombre o descripción..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 transition-all"
            />
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
                <th className="pb-3 font-medium">Producto</th>
                <th className="pb-3 font-medium">Descripción</th>
                <th className="pb-3 font-medium text-center">Stock</th>
                <th className="pb-3 font-medium text-right">Precio</th>
                <th className="pb-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-white/40">
                    {search ? "No se encontraron productos" : "No hay productos registrados"}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product, index) => {
                  const stock = Number(product.stock);
                  const stockBadge = getStockBadge(stock);

                  return (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b border-white/5 hover:bg-white/5 transition-all group"
                    >
                      <td className="py-3.5 font-medium text-sm">
                        {product.name}
                      </td>
                      <td className="py-3.5 text-sm text-white/50 max-w-[200px] truncate">
                        {product.description || "Sin descripción"}
                      </td>
                      <td className="py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${stockBadge.className}`}>
                          {stockBadge.icon}
                          {stockBadge.label}
                        </span>
                      </td>
                      <td className="py-3.5 text-right font-semibold text-sm">
                       C$ {formatCurrency(product.price)}
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => {
                            setEditingProductId(product.id);
                            setFormData({
                              category_id: product.category_id,
                              subcategory_id: product.subcategory_id,
                              name: product.name,
                              description: product.description,
                              status: true,
                              created_at: new Date().toISOString().split("T")[0],
                              price: product.price,
                              stock: product.stock,
                            });
                            setShowModal(true);
                            // ✅ Cargar subcategorías al abrir el modal
                            loadSubcategoriesForModal(product.category_id);
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all text-sm font-medium"
                        >
                          <Edit size={16} />
                          Editar
                        </button>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer de la tabla */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
          <p className="text-xs text-white/30">
            Mostrando {filteredProducts.length} de {totalProducts} productos
          </p>
        </div>
      </motion.div>

      {/* ============ MODAL DE EDICIÓN ============ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] border border-white/10 rounded-3xl p-8 w-[520px] max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Edit className="text-blue-400" size={24} />
                Editar Producto
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingProductId(null);
                  setFormData(initialFormData);
                  setSubcategories([]);
                }}
                className="p-2 rounded-xl hover:bg-white/10 transition-all text-white/50 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="text-sm text-white/40 block mb-1.5">Nombre</label>
                <input
                  value={formData.name}
                  placeholder="Nombre del producto"
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="text-sm text-white/40 block mb-1.5">Descripción</label>
                <input
                  value={formData.description}
                  placeholder="Descripción del producto"
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              {/* Categoría */}
              <div>
                <label className="text-sm text-white/40 block mb-1.5">Categoría</label>
                <select
                  value={formData.category_id}
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                  onChange={(e) => {
                    const categoryId = e.target.value;
                    setFormData({
                      ...formData,
                      category_id: categoryId,
                      subcategory_id: ""
                    });
                    // ✅ Cargar subcategorías al cambiar categoría
                    loadSubcategoriesForModal(categoryId);
                  }}
                >
                  <option value="" className="bg-[#1a1a2e]">Seleccionar categoría</option>
                  {categories
                    .filter((cat) => cat.status)
                    .map((cat) => (
                      <option key={cat.id} value={cat.id} className="bg-[#1a1a2e]">
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Subcategoría */}
              <div>
                <label className="text-sm text-white/40 block mb-1.5">Subcategoría</label>
                <select
                  value={formData.subcategory_id || ""}
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                  onChange={(e) => {
                    console.log('🔄 Subcategoría seleccionada:', e.target.value);
                    setFormData({ ...formData, subcategory_id: e.target.value });
                  }}
                >
                  <option value="" className="bg-[#1a1a2e]">Seleccionar subcategoría</option>

                  {/* ✅ SIN FILTRO - Mostrar todas las subcategorías */}
                  {subcategories.map((sub) => (
                    <option
                      key={sub.id}
                      value={sub.id}
                      className="bg-[#1a1a2e]"
                      // ✅ Resaltar la seleccionada
                      style={sub.id === formData.subcategory_id ? { backgroundColor: '#1a3a5c' } : {}}
                    >
                      {sub.name} {sub.id === formData.subcategory_id ? '✅' : ''}
                    </option>
                  ))}
                </select>

                {/* Mostrar mensaje si no hay subcategorías */}
                {subcategories.length === 0 && formData.category_id && (
                  <p className="text-xs text-yellow-400/60 mt-1">
                    No hay subcategorías para esta categoría
                  </p>
                )}
              </div>

              {/* Precio y Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/40 block mb-1.5">Precio</label>
                  <input
                    value={formData.price === 0 ? "" : formData.price}
                    type="number"
                    placeholder="0.00"
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                    onChange={(e) =>
                      setFormData({ ...formData, price: Number(e.target.value) || 0 })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm text-white/40 block mb-1.5">Stock</label>
                  <input
                    value={formData.stock === 0 ? "" : formData.stock}
                    type="number"
                    placeholder="0"
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                    onChange={(e) =>
                      setFormData({ ...formData, stock: Number(e.target.value) || 0  })
                    }
                  />
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4 border-t border-white/5">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingProductId(null);
                    setFormData(initialFormData);
                    setSubcategories([]);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 py-3 rounded-xl font-semibold transition-all"
                >
                  <X size={18} />
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateProduct}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 py-3 rounded-xl font-semibold disabled:opacity-50 transition-all"
                >
                  {saving ? (
                    "Actualizando..."
                  ) : (
                    <>
                      <Save size={18} />
                      Actualizar
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