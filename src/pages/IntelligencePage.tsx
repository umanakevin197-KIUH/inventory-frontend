import { motion } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import {
    getABCAnalysis,
    getEOQAnalysis,
    getProfitability,
    type ABCAnalysis,
    type EOQAnalysis,
    type Profitability,
} from "../services/intelligenceService";
import {
    Brain,
    TrendingUp,
    Package,
    DollarSign,
    AlertTriangle,
    BarChart3,
    Calculator,
    Target,
} from "lucide-react";
import toast from "react-hot-toast";

type TabKey = 'abc' | 'eoq' | 'profitability';

export default function IntelligencePage() {
    const [activeTab, setActiveTab] = useState<TabKey>('abc');
    const [abcData, setAbcData] = useState<ABCAnalysis[]>([]);
    const [eoqData, setEoqData] = useState<EOQAnalysis[]>([]);
    const [profitData, setProfitData] = useState<Profitability[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
    try {
        setLoading(true);
        
        // ✅ Cargar SECUENCIALMENTE (una a la vez)
        console.log("⏳ Cargando ABC...");
        const abc = await getABCAnalysis();
        setAbcData(abc);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log("⏳ Cargando EOQ...");
        const eoq = await getEOQAnalysis();
        setEoqData(eoq);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log("⏳ Cargando Rentabilidad...");
        const profit = await getProfitability();
        setProfitData(profit);
        
        console.log("✅ Datos cargados");
    } catch (error) {
        console.log(error);
        toast.error("Error al cargar datos de inteligencia");
    } finally {
        setLoading(false);
    }
}, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // ============ KPIS GENERALES ============
    const totalProducts = abcData.length;
    const categoryACount = abcData.filter((a) => a.category === 'A').length;
    const categoryBCount = abcData.filter((a) => a.category === 'B').length;
    const categoryCCount = abcData.filter((a) => a.category === 'C').length;
    const totalProfit = profitData.reduce((sum, p) => sum + p.totalProfit, 0);
    const criticalStock = eoqData.filter((e) => e.status === 'CRITICAL').length;

    const tabs = [
        { key: 'abc' as TabKey, label: 'Análisis ABC', icon: BarChart3, count: totalProducts },
        { key: 'eoq' as TabKey, label: 'EOQ', icon: Calculator, count: eoqData.length },
        { key: 'profitability' as TabKey, label: 'Rentabilidad', icon: DollarSign, count: profitData.length },
    ];

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-white/10 rounded w-1/4 mb-4"></div>
                    <div className="grid grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-32 bg-white/5 rounded-3xl"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Brain className="text-purple-400" size={28} />
                        Inteligencia de Negocios
                    </h1>
                    <p className="text-white/40 mt-1">
                        Análisis predictivo para la toma de decisiones
                    </p>
                </div>
            </div>

            {/* KPIS PRINCIPALES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-blue-500/20 to-blue-600/5 border border-blue-500/20 rounded-3xl p-5 backdrop-blur-xl"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white/50 text-sm">Categoría A</p>
                            <h2 className="text-2xl font-bold mt-1">{categoryACount}</h2>
                            <p className="text-xs text-white/40 mt-1">Productos de alto valor</p>
                        </div>
                        <div className="p-3 rounded-2xl bg-blue-500/20">
                            <Target className="text-blue-400" size={22} />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-green-500/20 to-green-600/5 border border-green-500/20 rounded-3xl p-5 backdrop-blur-xl"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white/50 text-sm">Ganancia Total</p>
                            <h2 className="text-2xl font-bold mt-1">C$ {totalProfit.toFixed(2)}</h2>
                            <p className="text-xs text-white/40 mt-1">Margen acumulado</p>
                        </div>
                        <div className="p-3 rounded-2xl bg-green-500/20">
                            <TrendingUp className="text-green-400" size={22} />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-red-500/20 to-red-600/5 border border-red-500/20 rounded-3xl p-5 backdrop-blur-xl"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white/50 text-sm">Stock Crítico</p>
                            <h2 className="text-2xl font-bold mt-1">{criticalStock}</h2>
                            <p className="text-xs text-white/40 mt-1">Requieren pedido</p>
                        </div>
                        <div className="p-3 rounded-2xl bg-red-500/20">
                            <AlertTriangle className="text-red-400" size={22} />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-purple-500/20 to-purple-600/5 border border-purple-500/20 rounded-3xl p-5 backdrop-blur-xl"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white/50 text-sm">Distribución ABC</p>
                            <h2 className="text-2xl font-bold mt-1">
                                {categoryACount}/{categoryBCount}/{categoryCCount}
                            </h2>
                            <p className="text-xs text-white/40 mt-1">A / B / C</p>
                        </div>
                        <div className="p-3 rounded-2xl bg-purple-500/20">
                            <Package className="text-purple-400" size={22} />
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* TABS */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all ${
                            activeTab === tab.key
                                ? "bg-purple-500/20 text-purple-400 border border-purple-500/20"
                                : "text-white/40 hover:text-white hover:bg-white/5"
                        }`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/10">
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* TAB CONTENT - ABC */}
            {activeTab === 'abc' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-6 backdrop-blur-xl"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-bold">📊 Clasificación ABC de Productos</h2>
                            <p className="text-xs text-white/40 mt-1">
                                Análisis Pareto: 80% del valor está en el 20% de los productos
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 text-xs">
                                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                                A - Alto valor
                            </span>
                            <span className="flex items-center gap-1 text-xs">
                                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                                B - Medio
                            </span>
                            <span className="flex items-center gap-1 text-xs">
                                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                                C - Bajo
                            </span>
                        </div>
                    </div>

                    {abcData.length === 0 ? (
                        <div className="text-center py-10 text-white/40">
                            No hay datos para analizar
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
                                        <th className="pb-3 font-medium">Categoría</th>
                                        <th className="pb-3 font-medium">Producto</th>
                                        <th className="pb-3 font-medium text-center">Stock</th>
                                        <th className="pb-3 font-medium text-right">Precio</th>
                                        <th className="pb-3 font-medium text-right">Valor</th>
                                        <th className="pb-3 font-medium text-right">%</th>
                                        <th className="pb-3 font-medium text-right">Acum.</th>
                                        <th className="pb-3 font-medium text-center">Vendidos</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {abcData.slice(0, 30).map((item, index) => (
                                        <motion.tr
                                            key={item.productId}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.02 }}
                                            className="border-b border-white/5 hover:bg-white/5 transition-all"
                                        >
                                            <td className="py-3">
                                                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                                                    item.category === 'A' ? 'bg-green-500/20 text-green-400' :
                                                    item.category === 'B' ? 'bg-yellow-500/20 text-yellow-400' :
                                                    'bg-red-500/20 text-red-400'
                                                }`}>
                                                    {item.category}
                                                </span>
                                            </td>
                                            <td className="py-3 text-sm font-medium">{item.productName}</td>
                                            <td className="py-3 text-sm text-center">{item.stock}</td>
                                            <td className="py-3 text-sm text-right">C$ {item.price.toFixed(2)}</td>
                                            <td className="py-3 text-sm text-right font-semibold">
                                                C$ {item.value.toFixed(2)}
                                            </td>
                                            <td className="py-3 text-sm text-right text-white/60">
                                                {item.percentage.toFixed(2)}%
                                            </td>
                                            <td className="py-3 text-sm text-right text-white/40">
                                                {item.cumulativePercentage.toFixed(1)}%
                                            </td>
                                            <td className="py-3 text-sm text-center text-cyan-400">
                                                {item.totalSold}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>
            )}

            {/* TAB CONTENT - EOQ */}
            {activeTab === 'eoq' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-6 backdrop-blur-xl"
                >
                    <div className="mb-6">
                        <h2 className="text-lg font-bold">📦 Cantidad Económica de Pedido (EOQ)</h2>
                        <p className="text-xs text-white/40 mt-1">
                            Fórmula de Wilson: EOQ = √(2DS/H) | D=Demanda, S=Costo pedido, H=Costo almacenamiento
                        </p>
                    </div>

                    {eoqData.length === 0 ? (
                        <div className="text-center py-10 text-white/40">
                            No hay suficientes datos de ventas para calcular EOQ
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
                                        <th className="pb-3 font-medium">Estado</th>
                                        <th className="pb-3 font-medium">Producto</th>
                                        <th className="pb-3 font-medium text-right">Demanda Anual</th>
                                        <th className="pb-3 font-medium text-right">EOQ</th>
                                        <th className="pb-3 font-medium text-right">Pedidos/Año</th>
                                        <th className="pb-3 font-medium text-right">Punto Reorden</th>
                                        <th className="pb-3 font-medium text-right">Stock Actual</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {eoqData.slice(0, 30).map((item, index) => (
                                        <motion.tr
                                            key={item.productId}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.02 }}
                                            className="border-b border-white/5 hover:bg-white/5 transition-all"
                                        >
                                            <td className="py-3">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                                                    item.status === 'CRITICAL'
                                                        ? 'bg-red-500/20 text-red-400'
                                                        : item.status === 'LOW'
                                                        ? 'bg-yellow-500/20 text-yellow-400'
                                                        : 'bg-green-500/20 text-green-400'
                                                }`}>
                                                    {item.status === 'CRITICAL' ? '🔴 Crítico' :
                                                     item.status === 'LOW' ? '🟡 Bajo' : '🟢 Normal'}
                                                </span>
                                            </td>
                                            <td className="py-3 text-sm font-medium">{item.productName}</td>
                                            <td className="py-3 text-sm text-right">{item.annualDemand}</td>
                                            <td className="py-3 text-sm text-right font-bold text-blue-400">
                                                {item.eoq} unid.
                                            </td>
                                            <td className="py-3 text-sm text-right text-white/60">
                                                {item.ordersPerYear}
                                            </td>
                                            <td className="py-3 text-sm text-right text-yellow-400">
                                                {item.reorderPoint}
                                            </td>
                                            <td className="py-3 text-sm text-right font-semibold">
                                                {item.currentStock}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>
            )}

            {/* TAB CONTENT - RENTABILIDAD */}
            {activeTab === 'profitability' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-6 backdrop-blur-xl"
                >
                    <div className="mb-6">
                        <h2 className="text-lg font-bold">💰 Análisis de Rentabilidad por Producto</h2>
                        <p className="text-xs text-white/40 mt-1">
                            Margen = Precio Venta - Costo Estimado
                        </p>
                    </div>

                    {profitData.length === 0 ? (
                        <div className="text-center py-10 text-white/40">
                            No hay datos de rentabilidad
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
                                        <th className="pb-3 font-medium">#</th>
                                        <th className="pb-3 font-medium">Producto</th>
                                        <th className="pb-3 font-medium">Categoría</th>
                                        <th className="pb-3 font-medium text-right">Precio</th>
                                        <th className="pb-3 font-medium text-right">Costo</th>
                                        <th className="pb-3 font-medium text-right">Margen</th>
                                        <th className="pb-3 font-medium text-right">%</th>
                                        <th className="pb-3 font-medium text-right">Ganancia Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {profitData.slice(0, 30).map((item, index) => (
                                        <motion.tr
                                            key={item.productId}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.02 }}
                                            className="border-b border-white/5 hover:bg-white/5 transition-all"
                                        >
                                            <td className="py-3 text-sm text-white/40">
                                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                                    index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                                                    index === 1 ? 'bg-gray-400/20 text-gray-400' :
                                                    index === 2 ? 'bg-orange-500/20 text-orange-400' :
                                                    'bg-white/5 text-white/40'
                                                }`}>
                                                    {index + 1}
                                                </span>
                                            </td>
                                            <td className="py-3 text-sm font-medium">{item.productName}</td>
                                            <td className="py-3 text-sm text-white/60">{item.category}</td>
                                            <td className="py-3 text-sm text-right">C$ {item.price.toFixed(2)}</td>
                                            <td className="py-3 text-sm text-right text-white/60">
                                                C$ {item.estimatedCost.toFixed(2)}
                                            </td>
                                            <td className="py-3 text-sm text-right font-semibold text-green-400">
                                                C$ {item.margin.toFixed(2)}
                                            </td>
                                            <td className="py-3 text-sm text-right">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                    item.marginPercentage >= 40 ? 'bg-green-500/20 text-green-400' :
                                                    item.marginPercentage >= 20 ? 'bg-yellow-500/20 text-yellow-400' :
                                                    'bg-red-500/20 text-red-400'
                                                }`}>
                                                    {item.marginPercentage.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="py-3 text-sm text-right font-bold text-green-400">
                                                C$ {item.totalProfit.toFixed(2)}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
}