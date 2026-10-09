import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getInventoryMovements, createInventoryMovement } from "../services/inventoryMovementService";
import { getProducts, createProduct } from "../services/productService";
import { getCategories } from "../services/categoryService";
import { getSubcategoriesByCategory } from "../services/subcategoryService";
import { 
  Package,  
  Search, 
  Plus,
  X,
  Save,
  TrendingUp,
  TrendingDown,
  RefreshCw
} from "lucide-react";
import toast from "react-hot-toast";

interface Movement {
  id: string;
  product_id: string;
  movement_type: string;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason: string;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  stock: number;
  price?: number;
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

type ColorKey = 'blue' | 'green' | 'red' | 'yellow' | 'purple';

const colorClasses: Record<ColorKey, { text: string; bg: string; border: string }> = {
  blue: { text: "text-blue-400", bg: "bg-blue-500/20", border: "border-blue-500/20" },
  green: { text: "text-green-400", bg: "bg-green-500/20", border: "border-green-500/20" },
  red: { text: "text-red-400", bg: "bg-red-500/20", border: "border-red-500/20" },
  yellow: { text: "text-yellow-400", bg: "bg-yellow-500/20", border: "border-yellow-500/20" },
  purple: { text: "text-purple-400", bg: "bg-purple-500/20", border: "border-purple-500/20" },
};

export default function MovementsPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [movementType, setMovementType] = useState("entrada");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [saving, setSaving] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [filterType, setFilterType] = useState("todos");
  const [searchMovements, setSearchMovements] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [movementsData, productsData] = await Promise.all([
          getInventoryMovements(),
          getProducts()
        ]);
        setMovements(movementsData);
        setProducts(productsData);
      } catch (error) {
        console.log(error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (error) {
        console.log(error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchSubcategories = async () => {
      if (!categoryId) {
        setSubcategories([]);
        return;
      }
      try {
        const data = await getSubcategoriesByCategory(categoryId);
        setSubcategories(data);
      } catch (error) {
        console.log(error);
      }
    };
    fetchSubcategories();
  }, [categoryId]);

  const handleSaveMovement = async () => {
    if (saving) return;

    if (!quantity || Number(quantity) <= 0) {
      toast.error("Ingrese una cantidad válida");
      return;
    }

    if (!reason.trim()) {
      toast.error("Ingrese un motivo");
      return;
    }

    setSaving(true);

    try {
      let selectedProductId = productId;

      if (movementType === "entrada") {
        if (!productName || !productDescription || !categoryId || !subcategoryId || !price) {
          toast.error("Complete todos los campos para el nuevo producto");
          setSaving(false);
          return;
        }

        await createProduct({
          category_id: categoryId,
          subcategory_id: subcategoryId,
          name: productName,
          description: productDescription,
          status: true,
          created_at: new Date().toISOString().split("T")[0],
          price: Number(price),
          stock: 0,
        });

        const productsData = await getProducts();
        setProducts(productsData);

        const createdProduct = productsData.find(
          (product: Product) => product.name === productName
        );

        if (!createdProduct) {
          throw new Error("No se pudo obtener el producto creado");
        }

        selectedProductId = createdProduct.id;
      }

      await createInventoryMovement({
        product_id: selectedProductId,
        movement_type: movementType,
        quantity: Number(quantity),
        reason,
        created_by: 1,
        created_at: new Date().toISOString().split("T")[0],
      });

      const movementsData = await getInventoryMovements();
      setMovements(movementsData);

      // Limpiar formulario
      setShowModal(false);
      setMovementType("entrada");
      setQuantity("");
      setReason("");
      setProductId("");
      setProductName("");
      setProductDescription("");
      setCategoryId("");
      setSubcategoryId("");
      setPrice("");
      setProductSearch("");
      setSelectedProduct(null);

      toast.success("Movimiento registrado exitosamente");
    } catch (error) {
      console.log(error);
      toast.error("Error al registrar movimiento");
    } finally {
      setSaving(false);
    }
  };

  // ============ METRICS ============
  const totalEntries = movements.filter(m => m.movement_type === "entrada").length;
  const totalOutputs = movements.filter(m => m.movement_type === "salida").length;
  const totalMovements = movements.length;

  // ============ FILTERS ============
  const filteredMovements = movements.filter(m => {
    const typeMatch = filterType === "todos" || m.movement_type === filterType;
    const product = products.find(p => p.id === m.product_id);
    const searchMatch = !searchMovements || 
      (product?.name?.toLowerCase().includes(searchMovements.toLowerCase()) ||
       m.reason?.toLowerCase().includes(searchMovements.toLowerCase()));
    return typeMatch && searchMatch;
  });

  // ============ KPIS ============
  const kpis = [
    {
      title: "Total Movimientos",
      value: totalMovements,
      subtitle: `${totalEntries} entradas • ${totalOutputs} salidas`,
      icon: RefreshCw,
      color: "blue" as ColorKey,
      gradient: "from-blue-500/20 to-blue-600/5",
      border: "border-blue-500/20",
    },
    {
      title: "Entradas",
      value: totalEntries,
      subtitle: "Productos ingresados",
      icon: TrendingUp,
      color: "green" as ColorKey,
      gradient: "from-green-500/20 to-green-600/5",
      border: "border-green-500/20",
    },
    {
      title: "Salidas",
      value: totalOutputs,
      subtitle: "Productos vendidos",
      icon: TrendingDown,
      color: "red" as ColorKey,
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
            <RefreshCw className="text-blue-400" size={28} />
            Movimientos de Inventario
          </h1>
          <p className="text-white/40 mt-1">
            Registro de entradas y salidas de productos
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105"
        >
          <Plus size={20} />
          Nuevo Movimiento
        </button>
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
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          {/* Filtro por tipo */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-1">
            {[
              { value: "todos", label: "Todos" },
              { value: "entrada", label: "Entradas" },
              { value: "salida", label: "Salidas" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setFilterType(option.value)}
                className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${
                  filterType === option.value
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/20"
                    : "text-white/40 hover:text-white hover:bg-white/5"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Búsqueda */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
            <input
              value={searchMovements}
              onChange={(e) => setSearchMovements(e.target.value)}
              placeholder="Buscar movimientos..."
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 transition-all"
            />
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
                <th className="pb-3 font-medium">Producto</th>
                <th className="pb-3 font-medium">Tipo</th>
                <th className="pb-3 font-medium text-center">Cantidad</th>
                <th className="pb-3 font-medium text-center">Stock Antes</th>
                <th className="pb-3 font-medium text-center">Stock Después</th>
                <th className="pb-3 font-medium">Motivo</th>
                <th className="pb-3 font-medium text-right">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-white/40">
                    {searchMovements || filterType !== "todos" 
                      ? "No se encontraron movimientos" 
                      : "No hay movimientos registrados"}
                  </td>
                </tr>
              ) : (
                filteredMovements.map((movement, index) => {
                  const product = products.find((p) => p.id === movement.product_id);
                  const isEntry = movement.movement_type === "entrada";

                  return (
                    <motion.tr
                      key={movement.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b border-white/5 hover:bg-white/5 transition-all group"
                    >
                      <td className="py-3.5 font-medium text-sm">
                        {product?.name || "Producto eliminado"}
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                            isEntry
                              ? "bg-green-500/20 text-green-400 border border-green-500/20"
                              : "bg-red-500/20 text-red-400 border border-red-500/20"
                          }`}
                        >
                          {isEntry ? "📥 Entrada" : "📤 Salida"}
                        </span>
                      </td>
                      <td className="py-3.5 text-center font-bold text-sm">
                        {movement.quantity}
                      </td>
                      <td className="py-3.5 text-center text-sm text-yellow-400 font-medium">
                        {movement.previous_stock}
                      </td>
                      <td className="py-3.5 text-center text-sm text-green-400 font-medium">
                        {movement.new_stock}
                      </td>
                      <td className="py-3.5 text-sm text-white/60">
                        {movement.reason || "—"}
                      </td>
                      <td className="py-3.5 text-right text-sm text-white/40">
                        {new Date(movement.created_at).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
          <p className="text-xs text-white/30">
            Mostrando {filteredMovements.length} de {movements.length} movimientos
          </p>
        </div>
      </motion.div>

      {/* ============ MODAL ============ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] border border-white/10 rounded-3xl p-8 w-[560px] max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Plus className="text-blue-400" size={24} />
                Nuevo Movimiento
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setProductSearch("");
                  setSelectedProduct(null);
                }}
                className="p-2 rounded-xl hover:bg-white/10 transition-all text-white/50 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Tipo de movimiento */}
              <div>
                <label className="text-sm text-white/40 block mb-1.5">Tipo de Movimiento</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setMovementType("entrada")}
                    className={`py-3 rounded-xl font-semibold transition-all ${
                      movementType === "entrada"
                        ? "bg-green-500/20 text-green-400 border border-green-500/20"
                        : "bg-white/5 text-white/40 hover:bg-white/10"
                    }`}
                  >
                    📥 Entrada
                  </button>
                  <button
                    onClick={() => setMovementType("salida")}
                    className={`py-3 rounded-xl font-semibold transition-all ${
                      movementType === "salida"
                        ? "bg-red-500/20 text-red-400 border border-red-500/20"
                        : "bg-white/5 text-white/40 hover:bg-white/10"
                    }`}
                  >
                    📤 Salida
                  </button>
                </div>
              </div>

              {/* ENTRADA */}
              {movementType === "entrada" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-white/40 block mb-1.5">Nombre del Producto</label>
                    <input
                      placeholder="Nombre del producto"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-white/40 block mb-1.5">Descripción</label>
                    <input
                      placeholder="Descripción del producto"
                      value={productDescription}
                      onChange={(e) => setProductDescription(e.target.value)}
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-white/40 block mb-1.5">Categoría</label>
                      <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                      >
                        <option value="" className="bg-[#1a1a2e]">Seleccionar</option>
                        {categories
                          .filter((cat) => cat.status)
                          .map((cat) => (
                            <option key={cat.id} value={cat.id} className="bg-[#1a1a2e]">
                              {cat.name}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-white/40 block mb-1.5">Subcategoría</label>
                      <select
                        value={subcategoryId}
                        onChange={(e) => setSubcategoryId(e.target.value)}
                        className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                      >
                        <option value="" className="bg-[#1a1a2e]">Seleccionar</option>
                        {subcategories.map((sub) => (
                          <option key={sub.id} value={sub.id} className="bg-[#1a1a2e]">
                            {sub.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-white/40 block mb-1.5">Precio</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                    />
                  </div>
                </div>
              )}

              {/* SALIDA */}
              {movementType === "salida" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-white/40 block mb-1.5">Buscar Producto</label>
                    <input
                      placeholder="Buscar producto por nombre..."
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        if (!e.target.value) {
                          setSelectedProduct(null);
                          setProductId("");
                        }
                      }}
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                    />
                  </div>

                  {productSearch && !selectedProduct && (
                    <div className="max-h-56 overflow-y-auto rounded-xl border border-white/10">
                      {products
                        .filter((product) =>
                          product.name.toLowerCase().includes(productSearch.toLowerCase())
                        )
                        .map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => {
                              setSelectedProduct(product);
                              setProductId(product.id);
                              setProductSearch(product.name);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-white/10 transition-all border-b border-white/5 last:border-0"
                          >
                            <div className="font-medium text-sm">{product.name}</div>
                            <div className="text-xs text-white/50">Stock: {product.stock} unidades</div>
                          </button>
                        ))}
                      {products.filter((p) =>
                        p.name.toLowerCase().includes(productSearch.toLowerCase())
                      ).length === 0 && (
                        <div className="px-4 py-3 text-sm text-white/40">
                          No se encontraron productos
                        </div>
                      )}
                    </div>
                  )}

                  {selectedProduct && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                      <Package className="text-green-400" size={18} />
                      <div>
                        <p className="text-sm font-medium">{selectedProduct.name}</p>
                        <p className="text-xs text-white/50">Stock disponible: {selectedProduct.stock}</p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedProduct(null);
                          setProductId("");
                          setProductSearch("");
                        }}
                        className="ml-auto p-1 rounded-lg hover:bg-white/10 transition-all text-white/40 hover:text-white"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Cantidad y Motivo */}
              <div>
                <label className="text-sm text-white/40 block mb-1.5">Cantidad</label>
                <input
                  type="number"
                  placeholder="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                />
              </div>

              <div>
                <label className="text-sm text-white/40 block mb-1.5">Motivo</label>
                <input
                  placeholder="Ej: Compra, Venta, Ajuste..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                />
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4 border-t border-white/5">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setProductSearch("");
                    setSelectedProduct(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 py-3 rounded-xl font-semibold transition-all"
                >
                  <X size={18} />
                  Cancelar
                </button>
                <button
                  onClick={handleSaveMovement}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 py-3 rounded-xl font-semibold disabled:opacity-50 transition-all"
                >
                  {saving ? (
                    "Guardando..."
                  ) : (
                    <>
                      <Save size={18} />
                      Guardar Movimiento
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