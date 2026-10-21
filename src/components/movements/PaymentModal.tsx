import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { X, DollarSign, User, Calendar, FileText } from "lucide-react";
import {
    registerPayment,
    getPaymentsBySale,
    type PendingSale,
    type CreditPayment,
} from "../../services/creditPayments.service";
import toast from "react-hot-toast";

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    sale: PendingSale | null;
    onSuccess?: () => void;
}

export default function PaymentModal({
    isOpen,
    onClose,
    sale,
    onSuccess,
}: PaymentModalProps) {
    // ✅ saleId extraído para dependencias simples
    const saleId = sale?.id;

    // ✅ Inicialización perezosa (lazy init) para evitar useEffect
    const [amount, setAmount] = useState<string>(() =>
        sale?.balance_due ? String(Number(sale.balance_due).toFixed(2)) : ""
    );

    const [notes, setNotes] = useState<string>("");
    const [saving, setSaving] = useState(false);
    const [payments, setPayments] = useState<CreditPayment[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // ✅ Cargar historial cuando se abre el modal
    useEffect(() => {
        if (!isOpen || !saleId) return;

        let cancelled = false;

        const loadHistory = async () => {
            try {
                setLoadingHistory(true);
                const data = await getPaymentsBySale(saleId);
                if (!cancelled) {
                    setPayments(data);
                }
            } catch (error) {
                console.error("Error al cargar historial:", error);
            } finally {
                if (!cancelled) {
                    setLoadingHistory(false);
                }
            }
        };

        loadHistory();

        return () => {
            cancelled = true;
        };
    }, [isOpen, saleId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!sale) return;

        const numericAmount = parseFloat(amount);

        // Solo validamos que sea un número mayor a 0
        if (isNaN(numericAmount) || numericAmount <= 0) {
            toast.error("Ingresa un monto válido mayor a 0");
            return;
        }

        try {
            setSaving(true);
            await registerPayment({
                sale_id: sale.id,
                amount: numericAmount,
                payment_method: "EFECTIVO",
                notes: notes || undefined,
            });

            toast.success("Abono registrado correctamente");
            onSuccess?.();
            onClose();
        } catch (error: unknown) {
            console.error(error);
            const err = error as {
                response?: { data?: { error?: string } };
            };
            toast.error(
                err.response?.data?.error || "Error al registrar abono"
            );
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const total = Number(sale?.total) || 0;
    const paid = Number(sale?.total_paid) || 0;
    const balance = Number(sale?.balance_due) || 0;
    const progress = total > 0 ? (paid / total) * 100 : 0;

    if (!sale) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="bg-gradient-to-br from-[#0F0F1A] to-[#0B0B0F] border border-white/10 rounded-3xl p-6 w-full max-w-2xl pointer-events-auto max-h-[90vh] overflow-y-auto">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold flex items-center gap-2">
                                        <DollarSign
                                            className="text-green-400"
                                            size={24}
                                        />
                                        Registrar Abono
                                    </h2>
                                    <p className="text-white/40 text-sm mt-1">
                                        Venta:{" "}
                                        <span className="text-blue-400 font-mono">
                                            {sale.sale_number}
                                        </span>
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-xl hover:bg-white/5 transition-all"
                                >
                                    <X size={20} className="text-white/60" />
                                </button>
                            </div>

                            {/* Info de la venta */}
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <User size={16} className="text-blue-400" />
                                    <span className="text-sm text-white/80">
                                        {sale.customer_name ||
                                            sale.customer_name_optional ||
                                            "Cliente no registrado"}
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 gap-3 text-center">
                                    <div className="bg-white/5 rounded-xl p-3">
                                        <p className="text-xs text-white/40">
                                            Total
                                        </p>
                                        <p className="text-lg font-bold text-white">
                                            C$ {total.toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="bg-green-500/10 rounded-xl p-3 border border-green-500/20">
                                        <p className="text-xs text-green-400/80">
                                            Abonado
                                        </p>
                                        <p className="text-lg font-bold text-green-400">
                                            C$ {paid.toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="bg-yellow-500/10 rounded-xl p-3 border border-yellow-500/20">
                                        <p className="text-xs text-yellow-400/80">
                                            Pendiente
                                        </p>
                                        <p className="text-lg font-bold text-yellow-400">
                                            C$ {balance.toFixed(2)}
                                        </p>
                                    </div>
                                </div>

                                {/* Barra de progreso */}
                                <div className="mt-3">
                                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 0.8 }}
                                            className="h-full bg-gradient-to-r from-green-500 to-green-400"
                                        />
                                    </div>
                                    <p className="text-xs text-white/40 mt-1 text-right">
                                        {progress.toFixed(1)}% pagado
                                    </p>
                                </div>

                                {/* Próximo pago */}
                                {sale.next_payment_date && (
                                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
                                        <Calendar
                                            size={14}
                                            className="text-blue-400"
                                        />
                                        <span className="text-xs text-white/60">
                                            Próximo pago:{" "}
                                            {new Date(
                                                sale.next_payment_date
                                            ).toLocaleDateString("es-ES")}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Formulario */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-white/60 mb-2">
                                        Monto del abono (C$)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={amount === "0" || amount === "0.00" ? "" : amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        required
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-green-500/50 transition-all"
                                        placeholder="0.00"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-white/60 mb-2">
                                        Notas (opcional)
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) =>
                                            setNotes(e.target.value)
                                        }
                                        rows={2}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-green-500/50 transition-all resize-none"
                                        placeholder="Observaciones del abono..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white shadow-lg shadow-green-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving
                                        ? "Registrando..."
                                        : "Registrar Abono"}
                                </button>
                            </form>

                            {/* Historial de abonos */}
                            {payments.length > 0 && (
                                <div className="mt-6 pt-6 border-t border-white/10">
                                    <h3 className="text-sm font-semibold text-white/60 mb-3 flex items-center gap-2">
                                        <FileText size={14} />
                                        Historial de abonos ({payments.length})
                                    </h3>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {payments.map((p) => (
                                            <div
                                                key={p.id}
                                                className="flex items-center justify-between p-3 bg-white/5 rounded-xl"
                                            >
                                                <div>
                                                    <p className="text-sm font-semibold text-white">
                                                        C${" "}
                                                        {Number(
                                                            p.amount
                                                        ).toFixed(2)}
                                                    </p>
                                                    <p className="text-xs text-white/40">
                                                        {formatDate(
                                                            p.created_at
                                                        )}
                                                    </p>
                                                </div>
                                                <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                    {p.payment_method}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {loadingHistory && (
                                <p className="text-center text-xs text-white/30 mt-4">
                                    Cargando historial...
                                </p>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}