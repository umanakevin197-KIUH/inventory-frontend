import { motion } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import {
    getSales,
    createSale,
    deleteSale,
    registerPayment,
    getPendingCredits,
    getOverdueCredits,
    type Sale,
    type CreateSaleDto,
} from "../services/saleService";
import { getCustomers, type Customer } from "../services/customerService";
import { getProducts } from "../services/productService";
import {
    ShoppingCart,
    Plus,
    Trash2,
    X,
    Search,
    Package,
    CheckCircle,
    DollarSign,
    Eye,
    Banknote,
    Clock,
    UserCircle,
    AlertCircle,
    AlertTriangle,
    Calendar,
} from "lucide-react";
import toast from "react-hot-toast";

interface Product {
    id: string;
    name: string;
    price: number;
    stock: number;
}

interface CartItem {
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total: number;
    max_stock: number;
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

export default function SalesPage() {
    const [sales, setSales] = useState<Sale[]>([]);
    const [pendingCredits, setPendingCredits] = useState<Sale[]>([]);
    const [overdueCredits, setOverdueCredits] = useState<Sale[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [search, setSearch] = useState("");
    const [filterPayment, setFilterPayment] = useState("todos");

    // Modal crear venta
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [saving, setSaving] = useState(false);

    // Formulario
    const [selectedCustomer, setSelectedCustomer] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("EFECTIVO");
    const [dueDate, setDueDate] = useState("");
    const [cart, setCart] = useState<CartItem[]>([]);
    const [productSearch, setProductSearch] = useState("");
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [quantity, setQuantity] = useState("");

    // ============ CARGAR DATOS ============
    const loadData = useCallback(async () => {
        try {
            const [salesData, customersData, productsData, pendingData, overdueData] = await Promise.all([
                getSales(),
                getCustomers(),
                getProducts(),
                getPendingCredits(),
                getOverdueCredits(),
            ]);
            setSales(salesData);
            setCustomers(customersData);
            setProducts(productsData);
            setPendingCredits(pendingData);
            setOverdueCredits(overdueData);
        } catch (error) {
            console.log(error);
            toast.error("Error al cargar datos");
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

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
        if (Number(quantity) > Number(selectedProduct.stock)) {
            toast.error(`Stock insuficiente. Disponible: ${selectedProduct.stock}`);
            return;
        }

        const price = Number(selectedProduct.price) || 0;
        const qty = Number(quantity) || 0;

        const newItem: CartItem = {
            product_id: selectedProduct.id,
            product_name: selectedProduct.name,
            quantity: qty,
            unit_price: price,
            total: qty * price,
            max_stock: Number(selectedProduct.stock) || 0,
        };

        setCart([...cart, newItem]);
        setSelectedProduct(null);
        setProductSearch("");
        setQuantity("");
        toast.success("Producto agregado");
    };

    const removeFromCart = (index: number) => {
        setCart(cart.filter((_, i) => i !== index));
    };

    // ============ TOTALES ============
    const subtotal = cart.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    const tax = subtotal * 0.15;
    const total = subtotal + tax;

    // ============ GUARDAR VENTA ============
    const handleSave = async () => {
        if (cart.length === 0) {
            toast.error("Agregue al menos un producto");
            return;
        }

        if (paymentMethod === "CREDITO") {
            if (!selectedCustomer) {
                toast.error("Seleccione un cliente para ventas a crédito");
                return;
            }
            if (!dueDate) {
                toast.error("Seleccione la fecha de pago para el crédito");
                return;
            }
        }

        setSaving(true);
        try {
            const data: CreateSaleDto = {
                customer_id: selectedCustomer || undefined,
                payment_method: paymentMethod,
                payment_status: paymentMethod === "CREDITO" ? "PENDIENTE" : "PAGADO",
                due_date: paymentMethod === "CREDITO" ? dueDate : undefined,
                status: "COMPLETADA",
                created_by: "admin",
                items: cart.map((item) => ({
                    product_id: item.product_id,
                    product_name: item.product_name,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                })),
            };

            await createSale(data);
            toast.success(
                paymentMethod === "EFECTIVO"
                    ? "✅ Venta registrada. Pago recibido."
                    : "📝 Venta a crédito registrada"
            );
            await loadData();
            closeModal();
        } catch (error: unknown) {
            console.log(error);
            const errorMessage =
                error && typeof error === "object" && "response" in error
                    ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
                    : undefined;
            toast.error(errorMessage || "Error al registrar venta");
        } finally {
            setSaving(false);
        }
    };

    // ============ REGISTRAR PAGO DE CRÉDITO ============
    const handleRegisterPayment = async (sale: Sale) => {
        if (!window.confirm(`¿Confirmar el pago de la venta ${sale.sale_number} por C$ ${Number(sale.total).toFixed(2)}?`)) return;
        try {
            await registerPayment(sale.id);
            toast.success("✅ Pago registrado exitosamente");
            await loadData();
            setShowDetailModal(false);
        } catch (error: unknown) {
            console.log(error);
            const errorMessage =
                error && typeof error === "object" && "response" in error
                    ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
                    : undefined;
            toast.error(errorMessage || "Error al registrar pago");
        }
    };

    // ============ ELIMINAR ============
    const handleDelete = async (sale: Sale) => {
        if (!window.confirm(`¿Eliminar la venta ${sale.sale_number}?`)) return;
        try {
            await deleteSale(sale.id);
            toast.success("Venta eliminada");
            await loadData();
        } catch (error) {
            console.log(error);
            toast.error("Error al eliminar");
        }
    };

    // ============ VER DETALLE ============
    const openDetail = (sale: Sale) => {
        setSelectedSale(sale);
        setShowDetailModal(true);
    };

    // ============ CERRAR MODAL ============
    const closeModal = () => {
        setShowModal(false);
        setSelectedCustomer("");
        setPaymentMethod("EFECTIVO");
        setDueDate("");
        setCart([]);
        setSelectedProduct(null);
        setProductSearch("");
        setQuantity("");
    };

    // ============ FILTRAR ============
    const filteredSales = sales.filter((s) => {
        const matchesSearch = s.sale_number.toLowerCase().includes(search.toLowerCase());
        const matchesFilter =
            filterPayment === "todos" ||
            (filterPayment === "efectivo" && s.payment_method === "EFECTIVO") ||
            (filterPayment === "credito" && s.payment_method === "CREDITO") ||
            (filterPayment === "pendiente" && s.payment_status === "PENDIENTE") ||
            (filterPayment === "pagado" && s.payment_status === "PAGADO");
        return matchesSearch && matchesFilter;
    });

    // ============ FUNCIÓN PARA DÍAS HASTA VENCER ============
    const daysUntilDue = (dueDate?: string) => {
        if (!dueDate) return 0;
        const today = new Date();
        const due = new Date(dueDate);
        const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    const getCustomerName = (id?: string) => {
        if (!id) return "Cliente Genérico";
        return customers.find((c) => c.id === id)?.name || "Cliente";
    };

    // ============ KPIS ============
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, s) => {
        const value = Number(s.total);
        return sum + (isFinite(value) ? value : 0);
    }, 0);
    const todaySales = sales.filter(
        (s) => new Date(s.created_at).toDateString() === new Date().toDateString()
    ).length;
    const cashSales = sales.filter((s) => s.payment_method === "EFECTIVO").length;
    const totalPending = pendingCredits.reduce((sum, s) => sum + Number(s.total), 0);

    const kpis = [
        {
            title: "Total Ventas",
            value: totalSales,
            subtitle: `${todaySales} hoy`,
            icon: ShoppingCart,
            color: "blue" as ColorKey,
            gradient: "from-blue-500/20 to-blue-600/5",
            border: "border-blue-500/20",
        },
        {
            title: "Ingresos Totales",
            value: `C$ ${totalRevenue.toFixed(2)}`,
            subtitle: "Ingresos por ventas",
            icon: DollarSign,
            color: "green" as ColorKey,
            gradient: "from-green-500/20 to-green-600/5",
            border: "border-green-500/20",
        },
        {
            title: "Ventas Efectivo",
            value: cashSales,
            subtitle: "Pagadas al contado",
            icon: Banknote,
            color: "cyan" as ColorKey,
            gradient: "from-cyan-500/20 to-cyan-600/5",
            border: "border-cyan-500/20",
        },
        {
            title: "Créditos Pendientes",
            value: `C$ ${totalPending.toFixed(2)}`,
            subtitle: `${pendingCredits.length} créditos`,
            icon: Clock,
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
                        <ShoppingCart className="text-blue-400" size={28} />
                        Ventas
                    </h1>
                    <p className="text-white/40 mt-1">
                        Punto de venta y gestión de transacciones
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white shadow-lg shadow-green-500/30 transition-all hover:scale-105"
                >
                    <Plus size={20} />
                    Nueva Venta
                </button>
            </div>

            {/* ALERTA DE CRÉDITOS VENCIDOS */}
            {overdueCredits.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-3"
                >
                    <AlertTriangle className="text-red-400 mt-0.5" size={24} />
                    <div className="flex-1">
                        <p className="font-semibold text-red-300">
                            ⚠️ Tienes {overdueCredits.length} créditos VENCIDOS
                        </p>
                        <p className="text-sm text-white/60 mt-1">
                            Total vencido: C$ {overdueCredits.reduce((sum, s) => sum + Number(s.total), 0).toFixed(2)}
                        </p>
                        <p className="text-xs text-white/40 mt-1">
                            Revisa la tabla y contacta a los clientes para regularizar el pago.
                        </p>
                    </div>
                </motion.div>
            )}

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

            {/* TABLA DE VENTAS */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-6 backdrop-blur-xl"
            >
                {/* Filtros */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-1 flex-wrap">
                        {[
                            { value: "todos", label: "Todas" },
                            { value: "efectivo", label: "Efectivo" },
                            { value: "credito", label: "Crédito" },
                            { value: "pendiente", label: "Pendientes" },
                            { value: "pagado", label: "Pagados" },
                        ].map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setFilterPayment(option.value)}
                                className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${filterPayment === option.value
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
                            placeholder="Buscar por número..."
                            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-blue-500/50"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
                                <th className="pb-3 font-medium">N° Venta</th>
                                <th className="pb-3 font-medium">Cliente</th>
                                <th className="pb-3 font-medium text-center">Items</th>
                                <th className="pb-3 font-medium text-center">Método</th>
                                <th className="pb-3 font-medium text-center">Estado</th>
                                <th className="pb-3 font-medium text-right">Total</th>
                                <th className="pb-3 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSales.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-10 text-center text-white/40">
                                        No hay ventas registradas
                                    </td>
                                </tr>
                            ) : (
                                filteredSales.map((sale, index) => {
                                    const isCash = sale.payment_method === "EFECTIVO";
                                    const isPending = sale.payment_status === "PENDIENTE";
                                    const days = daysUntilDue(sale.due_date);
                                    const isOverdue = isPending && days < 0;
                                    const isNearDue = isPending && days >= 0 && days <= 3;

                                    return (
                                        <motion.tr
                                            key={sale.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                            className={`border-b border-white/5 hover:bg-white/5 transition-all ${isOverdue ? "bg-red-500/5" : ""
                                                }`}
                                        >
                                            <td className="py-3.5">
                                                <div className="font-medium text-sm">{sale.sale_number}</div>
                                                <div className="text-xs text-white/40">
                                                    {new Date(sale.created_at).toLocaleDateString('es-ES')}
                                                </div>
                                            </td>
                                            <td className="py-3.5 text-sm text-white/70">
                                                {getCustomerName(sale.customer_id)}
                                            </td>
                                            <td className="py-3.5 text-sm text-center">
                                                {sale.items?.length || 0}
                                            </td>
                                            <td className="py-3.5 text-center">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${isCash
                                                    ? "bg-green-500/20 text-green-400 border border-green-500/20"
                                                    : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/20"
                                                    }`}>
                                                    {isCash ? "💵 Efectivo" : "📝 Crédito"}
                                                </span>
                                            </td>
                                            <td className="py-3.5 text-center">
                                                {isCash ? (
                                                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                                                        ✅ Pagado
                                                    </span>
                                                ) : isPending ? (
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${isOverdue
                                                        ? "bg-red-500/20 text-red-400"
                                                        : isNearDue
                                                            ? "bg-yellow-500/20 text-yellow-400"
                                                            : "bg-blue-500/20 text-blue-400"
                                                        }`}>
                                                        {isOverdue
                                                            ? `⚠️ Vencido (${Math.abs(days)}d)`
                                                            : days === 0
                                                                ? "⏰ Vence HOY"
                                                                : `⏳ ${days}d`}
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                                                        ✅ Pagado
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3.5 text-sm font-bold text-right text-green-400">
                                                C$ {(Number(sale.total) || 0).toFixed(2)}
                                            </td>
                                            <td className="py-3.5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openDetail(sale)}
                                                        className="p-2 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all"
                                                        title="Ver detalle"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(sale)}
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
            </motion.div>

            {/* MODAL POS */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] border border-white/10 rounded-3xl p-8 w-full max-w-5xl max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <ShoppingCart className="text-green-400" size={24} />
                                Punto de Venta
                            </h2>
                            <button
                                onClick={closeModal}
                                className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* COLUMNA IZQUIERDA */}
                            <div className="space-y-4">
                                {/* Cliente */}
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                    <label className="text-sm text-white/40 block mb-1.5 flex items-center gap-2">
                                        <UserCircle size={16} />
                                        Cliente {paymentMethod === "CREDITO" && <span className="text-yellow-400">*</span>}
                                    </label>
                                    <select
                                        value={selectedCustomer}
                                        onChange={(e) => setSelectedCustomer(e.target.value)}
                                        className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50"
                                    >
                                        <option value="" className="bg-[#1a1a2e]">
                                            Cliente Genérico
                                        </option>
                                        {customers
                                            .filter((c) => c.status)
                                            .map((c) => (
                                                <option key={c.id} value={c.id} className="bg-[#1a1a2e]">
                                                    {c.name}
                                                </option>
                                            ))}
                                    </select>
                                    {paymentMethod === "CREDITO" && !selectedCustomer && (
                                        <p className="text-xs text-yellow-400 mt-1">
                                            ⚠️ Requerido para ventas a crédito
                                        </p>
                                    )}
                                </div>

                                {/* Buscar producto */}
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                                        <Package className="text-blue-400" size={18} />
                                        Agregar Producto
                                    </h3>

                                    <div className="space-y-3">
                                        <div className="relative">
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
                                                <div className="absolute top-full left-0 right-0 mt-2 max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-[#1a1a2e] shadow-xl z-10">
                                                    {products
                                                        .filter((p) =>
                                                            p.name.toLowerCase().includes(productSearch.toLowerCase()) &&
                                                            Number(p.stock) > 0
                                                        )
                                                        .slice(0, 5)
                                                        .map((p) => (
                                                            <button
                                                                key={p.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedProduct(p);
                                                                    setProductSearch(p.name);
                                                                }}
                                                                className="w-full text-left px-3 py-2.5 hover:bg-white/10 transition-all border-b border-white/5 last:border-0"
                                                            >
                                                                <div className="text-sm font-medium">{p.name}</div>
                                                                <div className="text-xs text-white/40">
                                                                    C$ {(Number(p.price) || 0).toFixed(2)} • Stock: {p.stock}
                                                                </div>
                                                            </button>
                                                        ))}
                                                </div>
                                            )}
                                        </div>

                                        {selectedProduct && (
                                            <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                                                <p className="text-sm font-medium">{selectedProduct.name}</p>
                                                <p className="text-xs text-white/50">
                                                    Precio: C$ {(Number(selectedProduct.price) || 0).toFixed(2)} •
                                                    Stock: {selectedProduct.stock}
                                                </p>
                                            </div>
                                        )}

                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                value={quantity}
                                                onChange={(e) => setQuantity(e.target.value)}
                                                placeholder="Cantidad"
                                                className="flex-1 p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50"
                                            />
                                            <button
                                                onClick={addToCart}
                                                disabled={!selectedProduct || !quantity}
                                                className="px-4 py-3 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 font-medium transition-all disabled:opacity-50"
                                            >
                                                + Agregar
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Método de pago */}
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                                        <DollarSign className="text-purple-400" size={18} />
                                        Método de Pago
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPaymentMethod("EFECTIVO");
                                                setDueDate("");
                                            }}
                                            className={`p-4 rounded-xl font-medium transition-all flex flex-col items-center gap-2 ${paymentMethod === "EFECTIVO"
                                                ? "bg-green-500/20 text-green-400 border-2 border-green-500/40"
                                                : "bg-white/5 text-white/40 hover:bg-white/10 border-2 border-white/10"
                                                }`}
                                        >
                                            <Banknote size={24} />
                                            <span className="font-semibold">Efectivo</span>
                                            <span className="text-[10px] opacity-60">Pago al contado</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod("CREDITO")}
                                            className={`p-4 rounded-xl font-medium transition-all flex flex-col items-center gap-2 ${paymentMethod === "CREDITO"
                                                ? "bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/40"
                                                : "bg-white/5 text-white/40 hover:bg-white/10 border-2 border-white/10"
                                                }`}
                                        >
                                            <Clock size={24} />
                                            <span className="font-semibold">Crédito</span>
                                            <span className="text-[10px] opacity-60">Pago a plazos</span>
                                        </button>
                                    </div>

                                    {paymentMethod === "CREDITO" && (
                                        <div className="mt-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 space-y-3">
                                            <div>
                                                <label className="text-sm text-yellow-300 block mb-1.5 flex items-center gap-2">
                                                    <Calendar size={16} />
                                                    Fecha de Pago
                                                </label>
                                                <input
                                                    type="date"
                                                    value={dueDate}
                                                    onChange={(e) => setDueDate(e.target.value)}
                                                    min={new Date().toISOString().split("T")[0]}
                                                    className="w-full p-3 rounded-xl bg-white/5 border border-yellow-500/30 text-sm focus:outline-none focus:border-yellow-500/50"
                                                />
                                            </div>

                                            <div className="flex items-start gap-2 p-3 bg-white/5 rounded-lg">
                                                <AlertCircle className="text-yellow-400 mt-0.5" size={16} />
                                                <div>
                                                    <p className="text-xs text-yellow-300 font-semibold">
                                                        Venta a crédito
                                                    </p>
                                                    <p className="text-xs text-white/50 mt-1">
                                                        Se registrará como PENDIENTE. Recibirás alertas cuando se acerque la fecha.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* COLUMNA DERECHA - CARRITO */}
                            <div className="space-y-4">
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 min-h-[500px] flex flex-col">
                                    <h3 className="font-semibold mb-3">
                                        🛒 Carrito ({cart.length} items)
                                    </h3>

                                    <div className="flex-1 space-y-2 overflow-y-auto max-h-80">
                                        {cart.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-40 text-white/30 text-sm gap-2">
                                                <Package size={32} />
                                                No hay productos agregados
                                            </div>
                                        ) : (
                                            cart.map((item, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all"
                                                >
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium">{item.product_name}</p>
                                                        <p className="text-xs text-white/40">
                                                            {item.quantity} × C$ {(Number(item.unit_price) || 0).toFixed(2)}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold text-green-400">
                                                            C$ {(Number(item.total) || 0).toFixed(2)}
                                                        </span>
                                                        <button
                                                            onClick={() => removeFromCart(index)}
                                                            className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-white/40">Subtotal:</span>
                                            <span>C$ {subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-white/40">IVA (15%):</span>
                                            <span>C$ {tax.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-xl font-bold pt-2 border-t border-white/10">
                                            <span>Total:</span>
                                            <span className="text-green-400">C$ {total.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleSave}
                                        disabled={saving || cart.length === 0}
                                        className={`mt-4 w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 ${paymentMethod === "EFECTIVO"
                                            ? "bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400"
                                            : "bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400"
                                            }`}
                                    >
                                        {saving ? "Procesando..." : (
                                            <>
                                                {paymentMethod === "EFECTIVO" ? (
                                                    <>
                                                        <Banknote size={22} />
                                                        Cobrar C$ {total.toFixed(2)}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Clock size={22} />
                                                        Registrar Crédito C$ {total.toFixed(2)}
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* MODAL DETALLE */}
            {showDetailModal && selectedSale && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] border border-white/10 rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold">Detalle de Venta</h2>
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
                                    <p className="text-xs text-white/40">Venta</p>
                                    <p className="font-semibold mt-1">{selectedSale.sale_number}</p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3">
                                    <p className="text-xs text-white/40">Fecha</p>
                                    <p className="font-semibold mt-1">
                                        {new Date(selectedSale.created_at).toLocaleDateString('es-ES')}
                                    </p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3">
                                    <p className="text-xs text-white/40">Cliente</p>
                                    <p className="font-semibold mt-1">
                                        {getCustomerName(selectedSale.customer_id)}
                                    </p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3">
                                    <p className="text-xs text-white/40">Método de Pago</p>
                                    <p className="font-semibold mt-1">
                                        {selectedSale.payment_method === "EFECTIVO" ? "💵 Efectivo" : "📝 Crédito"}
                                    </p>
                                </div>
                            </div>

                            {/* Alerta de crédito pendiente */}
                            {selectedSale.payment_method === "CREDITO" && selectedSale.payment_status === "PENDIENTE" && (
                                <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 space-y-3">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="text-yellow-400 mt-0.5" size={20} />
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-yellow-300">
                                                Venta a Crédito - Pendiente de Pago
                                            </p>
                                            <p className="text-xs text-white/60 mt-1">
                                                Total a pagar: C$ {(Number(selectedSale.total) || 0).toFixed(2)}
                                            </p>
                                            {selectedSale.due_date && (
                                                <p className="text-xs text-white/60 mt-1">
                                                    Fecha límite: {new Date(selectedSale.due_date).toLocaleDateString('es-ES')}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleRegisterPayment(selectedSale)}
                                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 py-3 rounded-xl font-semibold transition-all"
                                    >
                                        <CheckCircle size={18} />
                                        Registrar Pago
                                    </button>
                                </div>
                            )}

                            {/* Crédito ya pagado */}
                            {selectedSale.payment_method === "CREDITO" && selectedSale.payment_status === "PAGADO" && (
                                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-start gap-3">
                                    <CheckCircle className="text-green-400 mt-0.5" size={20} />
                                    <div>
                                        <p className="text-sm font-semibold text-green-300">
                                            ✅ Crédito Pagado
                                        </p>
                                        {selectedSale.paid_at && (
                                            <p className="text-xs text-white/60 mt-1">
                                                Pagado el: {new Date(selectedSale.paid_at).toLocaleDateString('es-ES')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div>
                                <h3 className="font-semibold mb-3">Productos Vendidos</h3>
                                <div className="space-y-2">
                                    {selectedSale.items?.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between p-3 bg-white/5 rounded-xl"
                                        >
                                            <div>
                                                <p className="text-sm font-medium">{item.product_name}</p>
                                                <p className="text-xs text-white/40">
                                                    {item.quantity} × C$ {(Number(item.unit_price) || 0).toFixed(2)}
                                                </p>
                                            </div>
                                            <span className="font-bold text-green-400">
                                                C$ {(Number(item.total) || 0).toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/10 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/40">Subtotal:</span>
                                    <span>C$ {(Number(selectedSale.subtotal) || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/40">IVA (15%):</span>
                                    <span>C$ {(Number(selectedSale.tax) || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold pt-2 border-t border-white/10">
                                    <span>Total:</span>
                                    <span className="text-green-400">
                                        C$ {(Number(selectedSale.total) || 0).toFixed(2)}
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