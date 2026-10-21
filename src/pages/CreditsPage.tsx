import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import {
    DollarSign,
    AlertTriangle,
    Clock,
    Search,
    Filter,
    Calendar,
    User,
    RefreshCw,
    CreditCard,
    Package,
    CheckCircle,
    XCircle,
    TrendingUp,
} from "lucide-react";
import {
    getPendingSales,
    cancelReservation,
    updatePaymentDate,
    type PendingSale,
} from "../services/creditPayments.service";
import PaymentModal from "../components/movements/PaymentModal";
import toast from "react-hot-toast";
import { formatCurrency } from "../utils/formatCurrency";

type FilterType = "TODOS" | "APARTADO" | "CREDITO" | "VENCIDOS";

export default function CreditsPage() {
    const [sales, setSales] = useState<PendingSale[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<FilterType>("TODOS");
    
    // Modales
    const [selectedSale, setSelectedSale] = useState<PendingSale | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [showDateModal, setShowDateModal] = useState(false);
    const [newPaymentDate, setNewPaymentDate] = useState("");

    // ✅ Cargar ventas pendientes
    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                const data = await getPendingSales();
                if (!cancelled) {
                    setSales(data);
                }
            } catch (error: unknown) {
                console.error("Error al cargar créditos:", error);
                if (!cancelled) {
                    toast.error("Error al cargar créditos pendientes");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, []);

    // ✅ Recargar datos
    const loadPendingSales = async () => {
        try {
            setRefreshing(true);
            const data = await getPendingSales();
            setSales(data);
        } catch (error: unknown) {
            console.error("Error al recargar:", error);
            toast.error("Error al recargar los datos");
        } finally {
            setRefreshing(false);
        }
    };

    // ✅ Abrir modal de abono
    const handleOpenPayment = (sale: PendingSale) => {
        setSelectedSale(sale);
        setIsPaymentModalOpen(true);
    };

    // ✅ Abrir modal de editar fecha
    const handleOpenDate = (sale: PendingSale) => {
        setSelectedSale(sale);
        setNewPaymentDate(sale.next_payment_date || "");
        setShowDateModal(true);
    };

    // ✅ Guardar nueva fecha
    const handleUpdateDate = async () => {
        if (!selectedSale || !newPaymentDate) {
            toast.error("Seleccione una fecha válida");
            return;
        }

        try {
            await updatePaymentDate(selectedSale.id, newPaymentDate);
            toast.success("Fecha de pago actualizada");
            setShowDateModal(false);
            loadPendingSales();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } } };
            toast.error(err.response?.data?.error || "Error al actualizar fecha");
        }
    };

    // ✅ Cancelar apartado
    const handleCancelReservation = async (sale: PendingSale) => {
        const confirmed = window.confirm(
            `¿Cancelar el apartado ${sale.sale_number}? Se liberará el stock reservado.`
        );

        if (!confirmed) return;

        try {
            await cancelReservation(sale.id);
            toast.success("Apartado cancelado correctamente");
            loadPendingSales();
        } catch (error: unknown) {
            console.error(error);
            const err = error as {
                response?: { data?: { error?: string } };
            };
            toast.error(
                err.response?.data?.error || "Error al cancelar apartado"
            );
        }
    };

    // ✅ Calcular días restantes
    const getDaysRemaining = (dateStr?: string): number | null => {
        if (!dateStr) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(dateStr);
        target.setHours(0, 0, 0, 0);
        const diff = Math.ceil(
            (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        return diff;
    };

    // ✅ Formatear fecha
    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    // ✅ Filtrar y buscar
    const filteredSales = useMemo(() => {
        let result = [...sales];

        // Filtro por tipo
        if (filter === "APARTADO") {
            result = result.filter((s) => s.sale_type === "APARTADO");
        } else if (filter === "CREDITO") {
            result = result.filter((s) => s.sale_type === "CREDITO");
        } else if (filter === "VENCIDOS") {
            result = result.filter((s) => {
                if (!s.next_payment_date) return false;
                const days = getDaysRemaining(s.next_payment_date);
                return days !== null && days < 0;
            });
        }

        // Búsqueda
        if (search.trim()) {
            const term = search.toLowerCase();
            result = result.filter(
                (s) =>
                    s.sale_number.toLowerCase().includes(term) ||
                    (s.customer_name || "").toLowerCase().includes(term) ||
                    (s.customer_name_optional || "")
                        .toLowerCase()
                        .includes(term)
            );
        }

        // Ordenar por fecha de próximo pago (los más próximos primero)
        result.sort((a, b) => {
            const dateA = a.next_payment_date
                ? new Date(a.next_payment_date).getTime()
                : Infinity;
            const dateB = b.next_payment_date
                ? new Date(b.next_payment_date).getTime()
                : Infinity;
            return dateA - dateB;
        });

        return result;
    }, [sales, filter, search]);

    // ✅ KPIs
    const totalPending = sales.reduce(
        (acc, s) => acc + Number(s.balance_due || 0),
        0
    );
    const totalApartados = sales.filter((s) => s.sale_type === "APARTADO").length;
    const totalCreditos = sales.filter((s) => s.sale_type === "CREDITO").length;
    const totalVencidos = sales.filter((s) => {
        if (!s.next_payment_date) return false;
        const days = getDaysRemaining(s.next_payment_date);
        return days !== null && days < 0;
    }).length;

    // ✅ Estado de carga inicial
    if (loading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-white/10 rounded w-1/4 mb-4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className="h-32 bg-white/5 rounded-3xl"
                            ></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* ============ HEADER ============ */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <CreditCard className="text-green-400" size={28} />
                        Créditos y Apartados
                    </h1>
                    <p className="text-white/40 mt-1">
                        Gestiona abonos, apartados y créditos pendientes
                    </p>
                </div>
                <button
                    onClick={loadPendingSales}
                    disabled={refreshing}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold bg-white/5 border border-white/10 hover:bg-white/10 transition-all disabled:opacity-50"
                >
                    <RefreshCw
                        size={18}
                        className={refreshing ? "animate-spin" : ""}
                    />
                    {refreshing ? "Cargando..." : "Actualizar"}
                </button>
            </div>

            {/* ============ KPIS ============ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-green-500/20 to-green-600/5 border border-green-500/20 rounded-3xl p-5 backdrop-blur-xl"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white/50 text-sm">
                                Total Pendiente
                            </p>
                            <h2 className="text-2xl font-bold mt-1 text-green-400">
                                C$ {formatCurrency(totalPending)}
                            </h2>
                            <p className="text-xs text-white/40 mt-1">
                                {sales.length} ventas activas
                            </p>
                        </div>
                        <div className="p-3 rounded-2xl bg-green-500/20">
                            <DollarSign className="text-green-400" size={22} />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-blue-500/20 to-blue-600/5 border border-blue-500/20 rounded-3xl p-5 backdrop-blur-xl"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white/50 text-sm">Apartados</p>
                            <h2 className="text-2xl font-bold mt-1 text-blue-400">
                                {totalApartados}
                            </h2>
                            <p className="text-xs text-white/40 mt-1">
                                Stock reservado
                            </p>
                        </div>
                        <div className="p-3 rounded-2xl bg-blue-500/20">
                            <Package className="text-blue-400" size={22} />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-purple-500/20 to-purple-600/5 border border-purple-500/20 rounded-3xl p-5 backdrop-blur-xl"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white/50 text-sm">Créditos</p>
                            <h2 className="text-2xl font-bold mt-1 text-purple-400">
                                {totalCreditos}
                            </h2>
                            <p className="text-xs text-white/40 mt-1">
                                Con abonos
                            </p>
                        </div>
                        <div className="p-3 rounded-2xl bg-purple-500/20">
                            <TrendingUp className="text-purple-400" size={22} />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`bg-gradient-to-br ${
                        totalVencidos > 0
                            ? "from-red-500/20 to-red-600/5 border-red-500/20"
                            : "from-white/5 to-white/[0.02] border-white/10"
                    } border rounded-3xl p-5 backdrop-blur-xl`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white/50 text-sm">
                                Vencidos
                            </p>
                            <h2
                                className={`text-2xl font-bold mt-1 ${
                                    totalVencidos > 0
                                        ? "text-red-400"
                                        : "text-white"
                                }`}
                            >
                                {totalVencidos}
                            </h2>
                            <p className="text-xs text-white/40 mt-1">
                                Requieren atención
                            </p>
                        </div>
                        <div
                            className={`p-3 rounded-2xl ${
                                totalVencidos > 0
                                    ? "bg-red-500/20"
                                    : "bg-white/10"
                            }`}
                        >
                            <AlertTriangle
                                className={
                                    totalVencidos > 0
                                        ? "text-red-400"
                                        : "text-white/40"
                                }
                                size={22}
                            />
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* ============ FILTROS Y BÚSQUEDA ============ */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                    />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por número de venta o cliente..."
                        className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-all"
                    />
                </div>

                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-1.5">
                    <Filter size={16} className="text-white/40 ml-2" />
                    {(
                        [
                            "TODOS",
                            "APARTADO",
                            "CREDITO",
                            "VENCIDOS",
                        ] as FilterType[]
                    ).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                filter === f
                                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                    : "text-white/50 hover:text-white hover:bg-white/5"
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* ============ LISTA DE VENTAS PENDIENTES ============ */}
            {filteredSales.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center"
                >
                    <CheckCircle
                        size={48}
                        className="mx-auto text-green-400 mb-4"
                    />
                    <h3 className="text-xl font-bold text-white mb-2">
                        {search || filter !== "TODOS"
                            ? "Sin resultados"
                            : "¡Todo al día!"}
                    </h3>
                    <p className="text-white/40 text-sm">
                        {search || filter !== "TODOS"
                            ? "No hay ventas que coincidan con tu búsqueda o filtro."
                            : "No hay créditos ni apartados pendientes en este momento."}
                    </p>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <AnimatePresence>
                        {filteredSales.map((sale, index) => {
                            const daysRemaining = getDaysRemaining(
                                sale.next_payment_date
                            );
                            const isOverdue =
                                daysRemaining !== null && daysRemaining < 0;
                            const isUpcoming =
                                daysRemaining !== null &&
                                daysRemaining >= 0 &&
                                daysRemaining <= 3;
                            const isApartment = sale.sale_type === "APARTADO";

                            const total = Number(sale.total) || 0;
                            const paid = Number(sale.total_paid) || 0;
                            const progress =
                                total > 0 ? (paid / total) * 100 : 0;

                            return (
                                <motion.div
                                    key={sale.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`bg-gradient-to-br ${
                                        isOverdue
                                            ? "from-red-500/10 to-white/[0.02] border-red-500/30"
                                            : isApartment
                                            ? "from-blue-500/10 to-white/[0.02] border-blue-500/20"
                                            : "from-purple-500/10 to-white/[0.02] border-purple-500/20"
                                    } border rounded-3xl p-5 backdrop-blur-xl hover:scale-[1.01] transition-all`}
                                >
                                    {/* Header de la tarjeta */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-mono text-blue-400">
                                                    {sale.sale_number}
                                                </span>
                                                <span
                                                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                                        isApartment
                                                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                                            : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                                                    }`}
                                                >
                                                    {sale.sale_type}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-white/80">
                                                <User
                                                    size={14}
                                                    className="text-white/40"
                                                />
                                                <span className="text-sm font-medium">
                                                    {sale.customer_name ||
                                                        sale.customer_name_optional ||
                                                        "Sin cliente"}
                                                </span>
                                            </div>
                                        </div>

                                        {isOverdue && (
                                            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/20 border border-red-500/30">
                                                <AlertTriangle
                                                    size={12}
                                                    className="text-red-400"
                                                />
                                                <span className="text-[10px] font-bold text-red-400">
                                                    VENCIDO
                                                </span>
                                            </div>
                                        )}
                                        {isUpcoming && !isOverdue && (
                                            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-500/20 border border-yellow-500/30">
                                                <Clock
                                                    size={12}
                                                    className="text-yellow-400"
                                                />
                                                <span className="text-[10px] font-bold text-yellow-400">
                                                    PRÓXIMO
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info financiera */}
                                    <div className="grid grid-cols-3 gap-2 mb-3">
                                        <div className="bg-white/5 rounded-xl p-2.5 text-center">
                                            <p className="text-[10px] text-white/40 uppercase">
                                                Total
                                            </p>
                                            <p className="text-sm font-bold text-white">
                                                C$ {formatCurrency(total)}
                                            </p>
                                        </div>
                                        <div className="bg-green-500/10 rounded-xl p-2.5 text-center">
                                            <p className="text-[10px] text-green-400/80 uppercase">
                                                Abonado
                                            </p>
                                            <p className="text-sm font-bold text-green-400">
                                                C$ {formatCurrency(paid)}
                                            </p>
                                        </div>
                                        <div className="bg-yellow-500/10 rounded-xl p-2.5 text-center">
                                            <p className="text-[10px] text-yellow-400/80 uppercase">
                                                Pendiente
                                            </p>
                                            <p className="text-sm font-bold text-yellow-400">
                                                C$ {formatCurrency(sale.balance_due)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Barra de progreso */}
                                    <div className="mb-3">
                                        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{
                                                    width: `${progress}%`,
                                                }}
                                                transition={{ duration: 0.8 }}
                                                className="h-full bg-gradient-to-r from-green-500 to-green-400"
                                            />
                                        </div>
                                        <p className="text-[10px] text-white/40 mt-1 text-right">
                                            {progress.toFixed(0)}% pagado
                                        </p>
                                    </div>

                                    {/* Fecha próximo pago */}
                                    {sale.next_payment_date && (
                                        <div
                                            className={`flex items-center gap-2 mb-4 p-2 rounded-lg ${
                                                isOverdue
                                                    ? "bg-red-500/10"
                                                    : isUpcoming
                                                    ? "bg-yellow-500/10"
                                                    : "bg-white/5"
                                            }`}
                                        >
                                            <Calendar
                                                size={14}
                                                className={
                                                    isOverdue
                                                        ? "text-red-400"
                                                        : isUpcoming
                                                        ? "text-yellow-400"
                                                        : "text-blue-400"
                                                }
                                            />
                                            <span className="text-xs text-white/70">
                                                Próximo pago:{" "}
                                                <strong
                                                    className={
                                                        isOverdue
                                                            ? "text-red-400"
                                                            : isUpcoming
                                                            ? "text-yellow-400"
                                                            : "text-white"
                                                    }
                                                >
                                                    {formatDate(
                                                        sale.next_payment_date
                                                    )}
                                                </strong>
                                                {daysRemaining !== null && (
                                                    <span className="ml-2 text-[10px]">
                                                        {isOverdue
                                                            ? `(${Math.abs(
                                                                  daysRemaining
                                                              )} días vencido)`
                                                            : daysRemaining ===
                                                              0
                                                            ? "(hoy)"
                                                            : `(en ${daysRemaining} días)`}
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    )}

                                    {/* Botones */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() =>
                                                handleOpenPayment(sale)
                                            }
                                            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white shadow-lg shadow-green-500/20 transition-all"
                                        >
                                            <DollarSign size={16} />
                                            Abonar
                                        </button>
                                        
                                        <button
                                            onClick={() => handleOpenDate(sale)}
                                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all"
                                            title="Re-negociar fecha"
                                        >
                                            <Calendar size={16} />
                                        </button>

                                        {isApartment &&
                                            sale.delivery_status !==
                                                "ENTREGADO" && (
                                                <button
                                                    onClick={() =>
                                                        handleCancelReservation(
                                                            sale
                                                        )
                                                    }
                                                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
                                                    title="Cancelar apartado"
                                                >
                                                    <XCircle size={16} />
                                                </button>
                                            )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* ============ MODAL DE ABONO ============ */}
            <PaymentModal
                key={selectedSale?.id || "empty"}
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                sale={selectedSale}
                onSuccess={() => {
                    loadPendingSales();
                    setIsPaymentModalOpen(false);
                }}
            />

            {/* ============ MODAL PARA EDITAR FECHA ============ */}
            {showDateModal && selectedSale && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] border border-white/10 rounded-3xl p-8 w-full max-w-md"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Calendar className="text-blue-400" size={20} />
                                Re-negociar Fecha
                            </h2>
                            <button
                                onClick={() => setShowDateModal(false)}
                                className="p-2 rounded-xl hover:bg-white/10 text-white/50"
                            >
                                <XCircle size={20} />
                            </button>
                        </div>

                        <p className="text-sm text-white/60 mb-4">
                            Venta <b>{selectedSale.sale_number}</b>
                        </p>

                        <div className="mb-4">
                            <label className="text-sm text-white/40 block mb-1.5">
                                Nueva Fecha de Pago
                            </label>
                            <input
                                type="date"
                                value={newPaymentDate}
                                onChange={(e) => setNewPaymentDate(e.target.value)}
                                min={new Date().toISOString().split("T")[0]}
                                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50 [color-scheme:dark]"
                            />
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-white/5">
                            <button
                                onClick={() => setShowDateModal(false)}
                                className="flex-1 bg-white/5 text-white/60 hover:bg-white/10 py-3 rounded-xl font-semibold transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleUpdateDate}
                                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 py-3 rounded-xl font-semibold transition-all"
                            >
                                Guardar Fecha
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}