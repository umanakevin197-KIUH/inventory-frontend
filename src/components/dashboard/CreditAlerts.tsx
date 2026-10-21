import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Clock, CheckCircle } from "lucide-react";
import { getPendingSales, type PendingSale } from "../../services/creditPayments.service";
import { formatCurrency } from "../../utils/formatCurrency";

export function CreditAlerts() {
    const [pendingSales, setPendingSales] = useState<PendingSale[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const loadData = async () => {
            try {
                const data = await getPendingSales();
                if (!cancelled) {
                    setPendingSales(data);
                }
            } catch (error) {
                console.error(error);
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadData();

        // Recargar cada 2 minutos
        const interval = setInterval(loadData, 120000);

        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, []);

    const getCustomerName = (sale: PendingSale): string => {
        if (sale.customer_name) return sale.customer_name;
        if (sale.customer_name_optional) return sale.customer_name_optional;
        return "Cliente Genérico";
    };

    const daysUntilDue = (dateStr?: string): number | null => {
        if (!dateStr) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(dateStr);
        target.setHours(0, 0, 0, 0);
        return Math.ceil(
            (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
    };

    if (loading) {
        return (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl animate-pulse">
                <div className="h-6 bg-white/10 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                    <div className="h-16 bg-white/10 rounded"></div>
                    <div className="h-16 bg-white/10 rounded"></div>
                </div>
            </div>
        );
    }

    const totalPending = pendingSales.reduce(
        (sum, s) => sum + Number(s.balance_due || 0),
        0
    );

    const overdueCount = pendingSales.filter((s) => {
        const days = daysUntilDue(s.next_payment_date);
        return days !== null && days < 0;
    }).length;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-6 backdrop-blur-xl"
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <Clock className="text-yellow-400" size={20} />
                    Créditos Pendientes
                </h3>
                <span className="text-xs text-white/40">
                    {pendingSales.length} {pendingSales.length === 1 ? "crédito" : "créditos"}
                </span>
            </div>

            {/* Resumen */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                    <p className="text-xs text-yellow-300">Total Pendiente</p>
                    <p className="text-lg font-bold text-yellow-400 mt-1">
                        C$ {formatCurrency(totalPending)}
                    </p>
                </div>
                <div
                    className={`p-3 rounded-xl ${
                        overdueCount > 0
                            ? "bg-red-500/10 border border-red-500/20"
                            : "bg-green-500/10 border border-green-500/20"
                    }`}
                >
                    <p
                        className={`text-xs ${
                            overdueCount > 0
                                ? "text-red-300"
                                : "text-green-300"
                        }`}
                    >
                        {overdueCount > 0 ? "⚠️ Vencidos" : "✅ Sin vencidos"}
                    </p>
                    <p
                        className={`text-lg font-bold mt-1 ${
                            overdueCount > 0
                                ? "text-red-400"
                                : "text-green-400"
                        }`}
                    >
                        {overdueCount}
                    </p>
                </div>
            </div>

            {/* Lista de créditos */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
                {pendingSales.length === 0 ? (
                    <div className="text-center py-6 text-white/40 text-sm">
                        <CheckCircle
                            className="mx-auto text-green-400 mb-2"
                            size={24}
                        />
                        No hay créditos pendientes
                    </div>
                ) : (
                    pendingSales.slice(0, 5).map((sale, index) => {
                        const days = daysUntilDue(sale.next_payment_date);
                        const isOverdue = days !== null && days < 0;
                        const isNearDue =
                            days !== null && days >= 0 && days <= 3;

                        return (
                            <motion.div
                                key={sale.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`p-3 rounded-xl border ${
                                    isOverdue
                                        ? "bg-red-500/10 border-red-500/20"
                                        : isNearDue
                                        ? "bg-yellow-500/10 border-yellow-500/20"
                                        : "bg-white/5 border-white/10"
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">
                                            {getCustomerName(sale)}
                                        </p>
                                        <p className="text-xs text-white/40">
                                            {sale.sale_number}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-green-400">
                                            C$ {formatCurrency(sale.balance_due || 0)}
                                        </p>
                                        <p
                                            className={`text-xs ${
                                                isOverdue
                                                    ? "text-red-400"
                                                    : isNearDue
                                                    ? "text-yellow-400"
                                                    : "text-white/40"
                                            }`}
                                        >
                                            {days === null
                                                ? "Sin fecha"
                                                : isOverdue
                                                ? `Vencido hace ${Math.abs(days)} días`
                                                : days === 0
                                                ? "Vence HOY"
                                                : `Vence en ${days} días`}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>

            {pendingSales.length > 5 && (
                <p className="text-center text-xs text-white/40 mt-3">
                    +{pendingSales.length - 5} créditos más
                </p>
            )}
        </motion.div>
    );
}