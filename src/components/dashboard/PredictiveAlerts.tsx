// 📁 frontend/src/components/dashboard/PredictiveAlerts.tsx

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Zap } from 'lucide-react';
import { predictiveService } from '../../services/predictive.service';

interface PredictiveAlert {
    productId: string;
    productName: string;
    currentStock: number;
    reorderPoint: number;
    urgency: string;
    message: string;
}

export function PredictiveAlerts() {
    const [alerts, setAlerts] = useState<PredictiveAlert[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const loadAlerts = async (): Promise<void> => {
            try {
                const data = await predictiveService.getAlerts();

                if (!cancelled) {
                    setAlerts(data);
                    setLoading(false);
                }
            } catch (error) {
                if (!cancelled) {
                    console.error('Error loading predictive alerts:', error);
                    setLoading(false);
                }
            }
        };

        loadAlerts();

        // Recargar cada 30 segundos
        const interval = setInterval(loadAlerts, 30000);

        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, []);

    const getIcon = (urgency: string) => {
        switch (urgency) {
            case 'CRITICAL':
                return <XCircle className="text-red-400" size={20} />;
            case 'WARNING':
                return <AlertTriangle className="text-yellow-400" size={20} />;
            default:
                return <CheckCircle className="text-green-400" size={20} />;
        }
    };

    const getColors = (urgency: string) => {
        switch (urgency) {
            case 'CRITICAL':
                return 'border-red-500/30 bg-red-500/10';
            case 'WARNING':
                return 'border-yellow-500/30 bg-yellow-500/10';
            default:
                return 'border-green-500/30 bg-green-500/10';
        }
    };

    const getStatusText = (urgency: string) => {
        switch (urgency) {
            case 'CRITICAL':
                return 'CRÍTICO';
            case 'WARNING':
                return 'ADVERTENCIA';
            default:
                return 'INFORMACIÓN';
        }
    };

    if (loading) {
        return (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-white/10 rounded w-1/3"></div>
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-white/10 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex flex-col h-full min-h-[400px]">
            {/* HEADER */}
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <Zap className="text-yellow-400" size={20} />
                    Alertas Predictivas
                </h3>
                <span className="text-sm text-white/40">
                    {alerts.length} alertas activas
                </span>
            </div>

            {/* LISTA CON SCROLL ADAPTATIVO */}
            <div className="space-y-3 overflow-y-auto pr-2 flex-1 max-h-[320px]">
                {alerts.length === 0 ? (
                    <div className="text-center py-8">
                        <CheckCircle className="mx-auto text-green-400" size={40} />
                        <p className="text-white/40 mt-2">¡Todo bajo control!</p>
                        <p className="text-xs text-white/30">No hay alertas pendientes</p>
                    </div>
                ) : (
                    alerts.map((alert, index) => (
                        <motion.div
                            key={alert.productId}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`p-3 rounded-xl border ${getColors(alert.urgency)} flex items-start gap-3`}
                        >
                            <div className="flex-shrink-0 mt-0.5">
                                {getIcon(alert.urgency)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                    <p className="font-semibold text-sm truncate">
                                        {alert.productName}
                                    </p>
                                    <span
                                        className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${
                                            alert.urgency === 'CRITICAL'
                                                ? 'bg-red-500/20 text-red-400'
                                                : 'bg-yellow-500/20 text-yellow-400'
                                        }`}
                                    >
                                        {getStatusText(alert.urgency)}
                                    </span>
                                </div>
                                <p className="text-xs text-white/60 line-clamp-2">
                                    {alert.message}
                                </p>
                                <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-white/40">
                                    <span>Stock: {alert.currentStock}</span>
                                    <span>Reorden: {alert.reorderPoint}</span>
                                    <span className="text-blue-400 cursor-pointer hover:underline">
                                        Ver producto →
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}