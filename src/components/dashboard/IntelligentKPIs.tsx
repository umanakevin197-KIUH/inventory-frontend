// 📁 frontend/src/components/dashboard/IntelligentKPIs.tsx

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { 
    Package,  
    AlertCircle, 
    DollarSign, 
    TrendingUp
} from 'lucide-react';
import { predictiveService, type DashboardMetrics } from '../../services/predictive.service';

export function IntelligentKPIs() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
    let cancelled = false;

    const fetchMetrics = async () => {
        try {
            const data = await predictiveService.getDashboardMetrics();

            if (!cancelled) {
                setMetrics(data);
            }
        } catch (error) {
            if (!cancelled) {
                console.error('Error loading metrics:', error);
            }
        } finally {
            if (!cancelled) {
                setLoading(false);
            }
        }
    };

    fetchMetrics();

    const interval = setInterval(fetchMetrics, 60000);

    return () => {
        cancelled = true;
        clearInterval(interval);
    };
}, []);


    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-3xl p-5 animate-pulse">
                        <div className="h-4 bg-white/10 rounded w-1/2 mb-2"></div>
                        <div className="h-8 bg-white/10 rounded w-3/4"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (!metrics) {
        return (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 text-center">
                <p className="text-white/40">Error al cargar métricas</p>
            </div>
        );
    }

    const kpis = [
        {
            title: 'Total Productos',
            value: metrics.totalProducts,
            subtitle: `${metrics.lowStockProducts} con bajo stock`,
            icon: Package,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10'
        },
        {
            title: 'Alertas Críticas',
            value: metrics.criticalAlerts.length,
            subtitle: `${metrics.outOfStockProducts} productos agotados`,
            icon: AlertCircle,
            color: 'text-red-400',
            bg: 'bg-red-500/10'
        },
        {
            title: 'Valor Inventario',
            value: `$${metrics.totalInventoryValue.toFixed(2)}`,
            subtitle: 'Valor total en stock',
            icon: DollarSign,
            color: 'text-green-400',
            bg: 'bg-green-500/10'
        },
        {
            title: 'Predicción Ventas (30d)',
            value: `$${metrics.predictedSalesNextMonth.toFixed(2)}`,
            subtitle: 'Estimación basada en historial',
            icon: TrendingUp,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi, index) => (
                <motion.div
                    key={kpi.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-xl hover:bg-white/10 transition-all"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white/40 text-sm">{kpi.title}</p>
                            <h3 className="text-2xl font-bold mt-1">{kpi.value}</h3>
                            <p className="text-xs text-white/40 mt-1">{kpi.subtitle}</p>
                        </div>
                        <div className={`p-3 rounded-2xl ${kpi.bg}`}>
                            <kpi.icon className={kpi.color} size={24} />
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}