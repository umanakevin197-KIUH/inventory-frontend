import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Clock, CheckCircle } from "lucide-react";
import { getPendingCredits, getOverdueCredits, type Sale } from "../../services/saleService";
import { getCustomers, type Customer } from "../../services/customerService";

export function CreditAlerts() {
    const [pendingCredits, setPendingCredits] = useState<Sale[]>([]);
    const [overdueCredits, setOverdueCredits] = useState<Sale[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 300000);
        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        try {
            const [pending, overdue, customersData] = await Promise.all([
                getPendingCredits(),
                getOverdueCredits(),
                getCustomers(),
            ]);
            setPendingCredits(pending);
            setOverdueCredits(overdue);
            setCustomers(customersData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getCustomerName = (id?: string) => {
        if (!id) return "Cliente Genérico";
        return customers.find((c) => c.id === id)?.name || "Cliente";
    };

    const daysUntilDue = (dueDate?: string) => {
        if (!dueDate) return 0;
        const today = new Date();
        const due = new Date(dueDate);
        const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
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

    const totalPending = pendingCredits.reduce((sum, s) => sum + Number(s.total), 0);

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
                    {pendingCredits.length} créditos
                </span>
            </div>

            {/* Resumen */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                    <p className="text-xs text-yellow-300">Total Pendiente</p>
                    <p className="text-lg font-bold text-yellow-400 mt-1">
                        C$ {totalPending.toFixed(2)}
                    </p>
                </div>
                <div className={`p-3 rounded-xl ${
                    overdueCredits.length > 0
                        ? "bg-red-500/10 border border-red-500/20"
                        : "bg-green-500/10 border border-green-500/20"
                }`}>
                    <p className={`text-xs ${
                        overdueCredits.length > 0 ? "text-red-300" : "text-green-300"
                    }`}>
                        {overdueCredits.length > 0 ? "⚠️ Vencidos" : "✅ Sin vencidos"}
                    </p>
                    <p className={`text-lg font-bold mt-1 ${
                        overdueCredits.length > 0 ? "text-red-400" : "text-green-400"
                    }`}>
                        {overdueCredits.length}
                    </p>
                </div>
            </div>

            {/* Lista de créditos */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
                {pendingCredits.length === 0 ? (
                    <div className="text-center py-6 text-white/40 text-sm">
                        <CheckCircle className="mx-auto text-green-400 mb-2" size={24} />
                        No hay créditos pendientes
                    </div>
                ) : (
                    pendingCredits.slice(0, 5).map((credit, index) => {
                        const days = daysUntilDue(credit.due_date);
                        const isOverdue = days < 0;
                        const isNearDue = days >= 0 && days <= 3;

                        return (
                            <motion.div
                                key={credit.id}
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
                                            {getCustomerName(credit.customer_id)}
                                        </p>
                                        <p className="text-xs text-white/40">
                                            {credit.sale_number}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-green-400">
                                            C$ {Number(credit.total).toFixed(2)}
                                        </p>
                                        <p className={`text-xs ${
                                            isOverdue
                                                ? "text-red-400"
                                                : isNearDue
                                                ? "text-yellow-400"
                                                : "text-white/40"
                                        }`}>
                                            {isOverdue
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

            {pendingCredits.length > 5 && (
                <p className="text-center text-xs text-white/40 mt-3">
                    +{pendingCredits.length - 5} créditos más
                </p>
            )}
        </motion.div>
    );
}