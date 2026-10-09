import { motion } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import {
    getPurchases,
    createPurchase,
    deletePurchase,
    receivePurchase,
    type PurchaseOrder,
    type CreatePurchaseDto,
} from "../services/purchaseService";
import { getSuppliers, type Supplier } from "../services/supplierService";
import { getProducts, createProduct } from "../services/productService";
import { getCategories } from "../services/categoryService";
import { getSubcategoriesByCategory } from "../services/subcategoryService";
import {
    ShoppingCart,
    Plus,
    Trash2,
    X,
    Save,
    Search,
    Package,
    CheckCircle,
    Clock,
    DollarSign,
    Eye,
    Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";

interface Product {
    id: string;
    name: string;
    price: number;
    stock: number;
    category_id?: string;
    subcategory_id?: string;
    description?: string;
}

interface Category {
    id: string;
    name: string;
    status: boolean;
}

interface Subcategory {
    id: string;
    category_id: string;
    name: string;
    status?: boolean;
}

interface CartItem {
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total: number;
}

type ColorKey = 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'cyan';

const colorClasses: Record<ColorKey, { text: string; bg: string }> = {
    blue: { text: "text-blue-400", bg: "bg-blue-500/20" },
    green: { text: "text-green-400", bg: "bg-green-500/20" },
    red: { text: "text-red-400", bg: "bg-red-500/20" },
    yellow: { text: "text-yellow-400", bg: "bg-yellow-500/20" },
    purple: { text: "text-purple-400", bg: "bg-purple-500/20" },
    cyan: { text: "text-cyan-400", bg: "bg-cyan-500/20" },
};

export default function PurchasesPage() {
    const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("todos");

    // Modal crear orden
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedPurchase, setSelectedPurchase] = useState<PurchaseOrder | null>(null);
    const [saving, setSaving] = useState(false);

    // Modal crear producto nuevo
    const [showNewProductModal, setShowNewProductModal] = useState(false);
    const [newProductData, setNewProductData] = useState({
        name: "",
        description: "",
        category_id: "",
        subcategory_id: "",
        price: 0,
    });
    const [creatingProduct, setCreatingProduct] = useState(false);

    // Formulario
    const [selectedSupplier, setSelectedSupplier] = useState("");
    const [notes, setNotes] = useState("");
    const [cart, setCart] = useState<CartItem[]>([]);
    const [productSearch, setProductSearch] = useState("");
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [quantity, setQuantity] = useState("");
    const [unitPrice, setUnitPrice] = useState("");

    // ============ CARGAR DATOS ============
    const loadData = useCallback(async () => {
        try {
            const [purchasesData, suppliersData, productsData, categoriesData] = await Promise.all([
                getPurchases(),
                getSuppliers(),
                getProducts(),
                getCategories(),
            ]);
            setPurchases(purchasesData);
            setSuppliers(suppliersData);
            setProducts(productsData);
            setCategories(categoriesData);
        } catch (error) {
            console.log(error);
            toast.error("Error al cargar datos");
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // ============ CARGAR SUBCATEGORÍAS ============
    const loadSubcategoriesForNewProduct = useCallback(async (categoryId: string) => {
        console.log("🔍 Cargando subcategorías para:", categoryId);
        
        if (!categoryId) {
            setSubcategories([]);
            return;
        }
        try {
            const data = await getSubcategoriesByCategory(categoryId);
            console.log("✅ Subcategorías recibidas:", data);
            setSubcategories(data || []);
        } catch (error) {
            console.error("❌ Error al cargar subcategorías:", error);
            setSubcategories([]);
        }
    }, []);

    // ============ CREAR PRODUCTO NUEVO ============
    const handleCreateProduct = async () => {
        if (!newProductData.name.trim()) {
            toast.error("Ingrese el nombre del producto");
            return;
        }
        if (!newProductData.category_id) {
            toast.error("Seleccione una categoría");
            return;
        }

        setCreatingProduct(true);
        try {
            await createProduct({
                category_id: newProductData.category_id,
                subcategory_id: newProductData.subcategory_id || newProductData.category_id,
                name: newProductData.name,
                description: newProductData.description,
                status: true,
                created_at: new Date().toISOString().split("T")[0],
                price: Number(newProductData.price) || 0,
                stock: 0,
            });

            // Recargar productos
            const productsData = await getProducts();
            setProducts(productsData);

            // Buscar el producto recién creado
            const created = productsData.find((p: Product) => p.name === newProductData.name);

            if (created) {
                setSelectedProduct(created);
                setProductSearch(created.name);
                setUnitPrice(String(created.price || 0));
            }

            // Cerrar modal
            setShowNewProductModal(false);
            setNewProductData({
                name: "",
                description: "",
                category_id: "",
                subcategory_id: "",
                price: 0,
            });
            setSubcategories([]);

            toast.success("Producto creado. Ahora ingresa la cantidad.");
        } catch (error) {
            console.log(error);
            toast.error("Error al crear producto");
        } finally {
            setCreatingProduct(false);
        }
    };

    // ============ AGREGAR AL CARRITO ============
    const addToCart = () => {
        if (!selectedProduct) {
            toast.error("Seleccione un producto");
            return;
        }
        if (!quantity || Number(quantity) <= 0) {
            toast.error("Ingrese una cantidad válida");
            return;
        }
        if (!unitPrice || Number(unitPrice) <= 0) {
            toast.error("Ingrese un precio válido");
            return;
        }

        const newItem: CartItem = {
            product_id: selectedProduct.id,
            product_name: selectedProduct.name,
            quantity: Number(quantity),
            unit_price: Number(unitPrice),
            total: Number(quantity) * Number(unitPrice),
        };

        setCart([...cart, newItem]);
        setSelectedProduct(null);
        setProductSearch("");
        setQuantity("");
        setUnitPrice("");
        toast.success("Producto agregado");
    };

    // ============ ELIMINAR DEL CARRITO ============
    const removeFromCart = (index: number) => {
        setCart(cart.filter((_, i) => i !== index));
    };

    // ============ CALCULAR TOTALES ============
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.15;
    const total = subtotal + tax;

    // ============ GUARDAR COMPRA ============
    const handleSave = async () => {
        if (!selectedSupplier) {
            toast.error("Seleccione un proveedor");
            return;
        }
        if (cart.length === 0) {
            toast.error("Agregue al menos un producto");
            return;
        }

        setSaving(true);
        try {
            const data: CreatePurchaseDto = {
                supplier_id: selectedSupplier,
                status: "PENDIENTE",
                notes,
                created_by: "admin",
                items: cart.map((item) => ({
                    product_id: item.product_id,
                    product_name: item.product_name,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                })),
            };

            await createPurchase(data);
            toast.success("Orden de compra creada");
            await loadData();
            closeModal();
        } catch (error) {
            console.log(error);
            toast.error("Error al crear la orden");
        } finally {
            setSaving(false);
        }
    };

    // ============ RECIBIR COMPRA ============
    const handleReceive = async (purchase: PurchaseOrder) => {
        if (!window.confirm(`¿Recibir la orden ${purchase.order_number}? Esto actualizará el stock.`)) return;
        try {
            await receivePurchase(purchase.id);
            toast.success("Orden recibida. Stock actualizado.");
            await loadData();
        } catch (error) {
            console.log(error);
            toast.error("Error al recibir la orden");
        }
    };

    // ============ ELIMINAR ============
    const handleDelete = async (purchase: PurchaseOrder) => {
        if (!window.confirm(`¿Eliminar la orden ${purchase.order_number}?`)) return;
        try {
            await deletePurchase(purchase.id);
            toast.success("Orden eliminada");
            await loadData();
        } catch (error) {
            console.log(error);
            toast.error("Error al eliminar");
        }
    };

    // ============ VER DETALLE ============
    const openDetail = (purchase: PurchaseOrder) => {
        setSelectedPurchase(purchase);
        setShowDetailModal(true);
    };

    // ============ CERRAR MODAL ============
    const closeModal = () => {
        setShowModal(false);
        setSelectedSupplier("");
        setNotes("");
        setCart([]);
        setSelectedProduct(null);
        setProductSearch("");
        setQuantity("");
        setUnitPrice("");
    };

    // ============ FILTRAR ============
    const filteredPurchases = purchases.filter((p) => {
        const matchesSearch =
            p.order_number.toLowerCase().includes(search.toLowerCase()) ||
            p.supplier_id.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = filterStatus === "todos" || p.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    // ============ KPIS ============
    const totalPurchases = purchases.length;
    const pendingPurchases = purchases.filter((p) => p.status === "PENDIENTE").length;
    const receivedPurchases = purchases.filter((p) => p.status === "RECIBIDA").length;
    const totalValue = purchases.reduce((sum, p) => sum + (Number(p.total) || 0), 0);

    const kpis = [
        {
            title: "Total Órdenes",
            value: totalPurchases,
            subtitle: `${pendingPurchases} pendientes`,
            icon: ShoppingCart,
            color: "blue" as ColorKey,
            gradient: "from-blue-500/20 to-blue-600/5",
            border: "border-blue-500/20",
        },
        {
            title: "Recibidas",
            value: receivedPurchases,
            subtitle: "Stock actualizado",
            icon: CheckCircle,
            color: "green" as ColorKey,
            gradient: "from-green-500/20 to-green-600/5",
            border: "border-green-500/20",
        },
        {
            title: "Pendientes",
            value: pendingPurchases,
            subtitle: "Por recibir",
            icon: Clock,
            color: "yellow" as ColorKey,
            gradient: "from-yellow-500/20 to-yellow-600/5",
            border: "border-yellow-500/20",
        },
        {
            title: "Valor Total",
            value: `C$ ${totalValue.toFixed(2)}`,
            subtitle: "En compras",
            icon: DollarSign,
            color: "purple" as ColorKey,
            gradient: "from-purple-500/20 to-purple-600/5",
            border: "border-purple-500/20",
        },
    ];

    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <ShoppingCart className="text-blue-400" size={28} />
                        Compras
                    </h1>
                    <p className="text-white/40 mt-1">
                        Gestión de órdenes de compra a proveedores
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
                >
                    <Plus size={20} />
                    Nueva Orden
                </button>
            </div>

            {/* KPIS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                                    <h2 className="text-2xl font-bold mt-1">{kpi.value}</h2>
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
                {/* Filtros */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-1">
                        {[
                            { value: "todos", label: "Todas" },
                            { value: "PENDIENTE", label: "Pendientes" },
                            { value: "RECIBIDA", label: "Recibidas" },
                        ].map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setFilterStatus(option.value)}
                                className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${
                                    filterStatus === option.value
                                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/20"
                                        : "text-white/40 hover:text-white hover:bg-white/5"
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por orden..."
                            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-blue-500/50"
                        />
                    </div>
                </div>

                {/* Tabla */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
                                <th className="pb-3 font-medium">Orden</th>
                                <th className="pb-3 font-medium">Proveedor</th>
                                <th className="pb-3 font-medium text-center">Items</th>
                                <th className="pb-3 font-medium text-right">Total</th>
                                <th className="pb-3 font-medium text-center">Estado</th>
                                <th className="pb-3 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPurchases.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-10 text-center text-white/40">
                                        {search || filterStatus !== "todos"
                                            ? "No se encontraron órdenes"
                                            : "No hay órdenes de compra registradas"}
                                    </td>
                                </tr>
                            ) : (
                                filteredPurchases.map((purchase, index) => {
                                    const supplier = suppliers.find((s) => s.id === purchase.supplier_id);
                                    const isReceived = purchase.status === "RECIBIDA";

                                    return (
                                        <motion.tr
                                            key={purchase.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                            className="border-b border-white/5 hover:bg-white/5 transition-all"
                                        >
                                            <td className="py-3.5">
                                                <div className="font-medium text-sm">{purchase.order_number}</div>
                                                <div className="text-xs text-white/40">
                                                    {new Date(purchase.created_at).toLocaleDateString('es-ES')}
                                                </div>
                                            </td>
                                            <td className="py-3.5 text-sm text-white/70">
                                                {supplier?.name || "Proveedor eliminado"}
                                            </td>
                                            <td className="py-3.5 text-sm text-center">
                                                {purchase.items?.length || 0}
                                            </td>
                                            <td className="py-3.5 text-sm font-bold text-right text-green-400">
                                                C$ {Number(purchase.total).toFixed(2)}
                                            </td>
                                            <td className="py-3.5 text-center">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                                    isReceived
                                                        ? "bg-green-500/20 text-green-400 border border-green-500/20"
                                                        : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/20"
                                                }`}>
                                                    {isReceived ? "✅ Recibida" : "⏳ Pendiente"}
                                                </span>
                                            </td>
                                            <td className="py-3.5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openDetail(purchase)}
                                                        className="p-2 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all"
                                                        title="Ver detalle"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    {!isReceived && (
                                                        <button
                                                            onClick={() => handleReceive(purchase)}
                                                            className="p-2 rounded-xl bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all"
                                                            title="Recibir orden"
                                                        >
                                                            <CheckCircle size={16} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(purchase)}
                                                        className="p-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                    <p className="text-xs text-white/30">
                        Mostrando {filteredPurchases.length} de {totalPurchases} órdenes
                    </p>
                </div>
            </motion.div>

            {/* ============ MODAL CREAR ORDEN ============ */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] border border-white/10 rounded-3xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <ShoppingCart className="text-blue-400" size={24} />
                                Nueva Orden de Compra
                            </h2>
                            <button
                                onClick={closeModal}
                                className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Proveedor y Notas */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-white/40 block mb-1.5">
                                        Proveedor *
                                    </label>
                                    <select
                                        value={selectedSupplier}
                                        onChange={(e) => setSelectedSupplier(e.target.value)}
                                        className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50"
                                    >
                                        <option value="" className="bg-[#1a1a2e]">
                                            Seleccionar proveedor
                                        </option>
                                        {suppliers
                                            .filter((s) => s.status)
                                            .map((s) => (
                                                <option key={s.id} value={s.id} className="bg-[#1a1a2e]">
                                                    {s.name}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm text-white/40 block mb-1.5">
                                        Notas (opcional)
                                    </label>
                                    <input
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Ej: Entrega urgente"
                                        className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50"
                                    />
                                </div>
                            </div>

                            {/* Agregar producto */}
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                <h3 className="font-semibold mb-3 flex items-center gap-2">
                                    <Package className="text-blue-400" size={18} />
                                    Agregar Producto
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                    <div className="md:col-span-2 relative">
                                        <input
                                            value={productSearch}
                                            onChange={(e) => {
                                                setProductSearch(e.target.value);
                                                setSelectedProduct(null);
                                            }}
                                            placeholder="Buscar producto..."
                                            className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50"
                                        />
                                        {productSearch && !selectedProduct && (
                                            <div className="absolute top-full left-0 right-0 mt-2 max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-[#1a1a2e] shadow-xl z-10">
                                                {products
                                                    .filter((p) =>
                                                        p.name.toLowerCase().includes(productSearch.toLowerCase())
                                                    )
                                                    .slice(0, 5)
                                                    .map((p) => (
                                                        <button
                                                            key={p.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedProduct(p);
                                                                setProductSearch(p.name);
                                                                setUnitPrice(String(p.price || 0));
                                                            }}
                                                            className="w-full text-left px-3 py-2.5 hover:bg-white/10 transition-all border-b border-white/5 last:border-0"
                                                        >
                                                            <div className="text-sm font-medium">{p.name}</div>
                                                            <div className="text-xs text-white/40">
                                                                Precio: C$ {Number(p.price).toFixed(2)} • Stock: {p.stock}
                                                            </div>
                                                        </button>
                                                    ))}

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setNewProductData({
                                                            name: productSearch,
                                                            description: "",
                                                            category_id: "",
                                                            subcategory_id: "",
                                                            price: 0,
                                                        });
                                                        setSubcategories([]);
                                                        setShowNewProductModal(true);
                                                    }}
                                                    className="w-full text-left px-3 py-3 hover:bg-blue-500/10 transition-all border-t-2 border-blue-500/20 bg-blue-500/5 flex items-center gap-3"
                                                >
                                                    <div className="p-2 rounded-xl bg-blue-500/20">
                                                        <Sparkles size={16} className="text-blue-400" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-blue-400">
                                                            Crear "{productSearch}"
                                                        </div>
                                                        <div className="text-xs text-white/40">
                                                            Producto no encontrado. Click para crearlo.
                                                        </div>
                                                    </div>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        placeholder="Cantidad"
                                        className="p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50"
                                    />
                                    <input
                                        type="number"
                                        value={unitPrice}
                                        onChange={(e) => setUnitPrice(e.target.value)}
                                        placeholder="Precio"
                                        className="p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50"
                                    />
                                </div>

                                {selectedProduct && (
                                    <div className="mt-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-2">
                                        <CheckCircle size={16} className="text-green-400" />
                                        <span className="text-sm">
                                            Producto seleccionado: <b>{selectedProduct.name}</b>
                                        </span>
                                    </div>
                                )}

                                <button
                                    onClick={addToCart}
                                    disabled={!selectedProduct || !quantity || !unitPrice}
                                    className="mt-3 w-full py-2.5 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    + Agregar al carrito
                                </button>
                            </div>

                            {/* Carrito */}
                            {cart.length > 0 && (
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                    <h3 className="font-semibold mb-3">
                                        Productos en la Orden ({cart.length})
                                    </h3>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {cart.map((item, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-3 bg-white/5 rounded-xl"
                                            >
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium">{item.product_name}</p>
                                                    <p className="text-xs text-white/40">
                                                        {item.quantity} × C$ {item.unit_price.toFixed(2)}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-bold text-green-400">
                                                        C$ {item.total.toFixed(2)}
                                                    </span>
                                                    <button
                                                        onClick={() => removeFromCart(index)}
                                                        className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Totales */}
                                    <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-white/40">Subtotal:</span>
                                            <span>C$ {subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-white/40">IVA (15%):</span>
                                            <span>C$ {tax.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-base font-bold pt-2 border-t border-white/10">
                                            <span>Total:</span>
                                            <span className="text-green-400">C$ {total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

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
                                    disabled={saving || cart.length === 0}
                                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 py-3 rounded-xl font-semibold transition-all disabled:opacity-50"
                                >
                                    {saving ? "Guardando..." : (
                                        <>
                                            <Save size={18} />
                                            Crear Orden
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* ============ MODAL CREAR PRODUCTO NUEVO ============ */}
            {showNewProductModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] border border-blue-500/30 rounded-3xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <Sparkles className="text-blue-400" size={24} />
                                Crear Producto Nuevo
                            </h2>
                            <button
                                onClick={() => {
                                    setShowNewProductModal(false);
                                    setNewProductData({
                                        name: "",
                                        description: "",
                                        category_id: "",
                                        subcategory_id: "",
                                        price: 0,
                                    });
                                    setSubcategories([]);
                                }}
                                className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-4">
                            <p className="text-xs text-blue-300">
                                💡 Este producto se creará con <b>stock 0</b>. Al recibir la orden,
                                el stock se actualizará automáticamente.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {/* Nombre */}
                            <div>
                                <label className="text-sm text-white/40 block mb-1.5">
                                    Nombre del Producto *
                                </label>
                                <input
                                    value={newProductData.name}
                                    onChange={(e) =>
                                        setNewProductData({ ...newProductData, name: e.target.value })
                                    }
                                    placeholder="Nombre del producto"
                                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50"
                                />
                            </div>

                            {/* Descripción */}
                            <div>
                                <label className="text-sm text-white/40 block mb-1.5">
                                    Descripción
                                </label>
                                <input
                                    value={newProductData.description}
                                    onChange={(e) =>
                                        setNewProductData({ ...newProductData, description: e.target.value })
                                    }
                                    placeholder="Descripción del producto"
                                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50"
                                />
                            </div>

                            {/* Categoría y Subcategoría */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm text-white/40 block mb-1.5">
                                        Categoría *
                                    </label>
                                    <select
                                        value={newProductData.category_id}
                                        onChange={(e) => {
                                            const catId = e.target.value;
                                            setNewProductData({
                                                ...newProductData,
                                                category_id: catId,
                                                subcategory_id: "",
                                            });
                                            // ✅ CARGAR SUBCATEGORÍAS AL CAMBIAR CATEGORÍA
                                            loadSubcategoriesForNewProduct(catId);
                                        }}
                                        className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50"
                                    >
                                        <option value="" className="bg-[#1a1a2e]">
                                            Seleccionar
                                        </option>
                                        {categories
                                            .filter((c) => c.status)
                                            .map((c) => (
                                                <option key={c.id} value={c.id} className="bg-[#1a1a2e]">
                                                    {c.name}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm text-white/40 block mb-1.5">
                                        Subcategoría
                                    </label>
                                    <select
                                        value={newProductData.subcategory_id}
                                        onChange={(e) =>
                                            setNewProductData({
                                                ...newProductData,
                                                subcategory_id: e.target.value,
                                            })
                                        }
                                        disabled={!newProductData.category_id}
                                        className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50 disabled:opacity-50"
                                    >
                                        <option value="" className="bg-[#1a1a2e]">
                                            {newProductData.category_id 
                                                ? subcategories.length > 0 
                                                    ? "Seleccionar" 
                                                    : "Sin subcategorías"
                                                : "Seleccione categoría"}
                                        </option>
                                        {/* ✅ SIN FILTRO - Mostrar todas las subcategorías */}
                                        {subcategories.map((s) => (
                                            <option key={s.id} value={s.id} className="bg-[#1a1a2e]">
                                                {s.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Precio - SIN EL 0 MOLESTO */}
                            <div>
                                <label className="text-sm text-white/40 block mb-1.5">
                                    Precio de Venta
                                </label>
                                <input
                                    type="number"
                                    value={newProductData.price === 0 ? "" : newProductData.price}
                                    onChange={(e) =>
                                        setNewProductData({
                                            ...newProductData,
                                            price: Number(e.target.value) || 0,
                                        })
                                    }
                                    placeholder="0.00"
                                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50"
                                />
                            </div>

                            {/* Botones */}
                            <div className="flex gap-3 pt-4 border-t border-white/5">
                                <button
                                    onClick={() => {
                                        setShowNewProductModal(false);
                                        setNewProductData({
                                            name: "",
                                            description: "",
                                            category_id: "",
                                            subcategory_id: "",
                                            price: 0,
                                        });
                                        setSubcategories([]);
                                    }}
                                    className="flex-1 flex items-center justify-center gap-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 py-3 rounded-xl font-semibold transition-all"
                                >
                                    <X size={18} />
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCreateProduct}
                                    disabled={creatingProduct}
                                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 py-3 rounded-xl font-semibold transition-all disabled:opacity-50"
                                >
                                    {creatingProduct ? "Creando..." : (
                                        <>
                                            <Sparkles size={18} />
                                            Crear y Agregar
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* ============ MODAL DETALLE ============ */}
            {showDetailModal && selectedPurchase && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] border border-white/10 rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold">Detalle de Orden</h2>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 rounded-xl p-3">
                                    <p className="text-xs text-white/40">Orden</p>
                                    <p className="font-semibold mt-1">{selectedPurchase.order_number}</p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3">
                                    <p className="text-xs text-white/40">Estado</p>
                                    <p className="font-semibold mt-1">
                                        {selectedPurchase.status === "RECIBIDA" ? "✅ Recibida" : "⏳ Pendiente"}
                                    </p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3">
                                    <p className="text-xs text-white/40">Fecha</p>
                                    <p className="font-semibold mt-1">
                                        {new Date(selectedPurchase.created_at).toLocaleDateString('es-ES')}
                                    </p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3">
                                    <p className="text-xs text-white/40">Proveedor</p>
                                    <p className="font-semibold mt-1">
                                        {suppliers.find((s) => s.id === selectedPurchase.supplier_id)?.name || "—"}
                                    </p>
                                </div>
                            </div>

                            {/* Items */}
                            <div>
                                <h3 className="font-semibold mb-3">Productos</h3>
                                <div className="space-y-2">
                                    {selectedPurchase.items?.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between p-3 bg-white/5 rounded-xl"
                                        >
                                            <div>
                                                <p className="text-sm font-medium">{item.product_name}</p>
                                                <p className="text-xs text-white/40">
                                                    {item.quantity} × C$ {Number(item.unit_price).toFixed(2)}
                                                </p>
                                            </div>
                                            <span className="font-bold text-green-400">
                                                C$ {Number(item.total).toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Totales */}
                            <div className="pt-4 border-t border-white/10 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/40">Subtotal:</span>
                                    <span>C$ {Number(selectedPurchase.subtotal).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/40">IVA (15%):</span>
                                    <span>C$ {Number(selectedPurchase.tax).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold pt-2 border-t border-white/10">
                                    <span>Total:</span>
                                    <span className="text-green-400">
                                        C$ {Number(selectedPurchase.total).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}