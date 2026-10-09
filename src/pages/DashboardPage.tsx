import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
    Package,
    AlertCircle,
    DollarSign,
    TrendingUp,
    ShoppingBag,
    Users,
    RefreshCw,
    Zap,
    AlertTriangle,
    CheckCircle,
    Clock
} from 'lucide-react';
import { getProducts } from "../services/productService";
import { getCategories } from "../services/categoryService";
import { getInventoryMovements } from "../services/inventoryMovementService";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { predictiveService, type DashboardMetrics } from '../services/predictive.service';
import { PredictiveAlerts } from '../components/dashboard/PredictiveAlerts';
import { CreditAlerts } from '../components/dashboard/CreditAlerts';

interface Product {
    id: string;
    name: string;
    stock: string;
    price: string;
    category_id: string;
    description?: string;
}

interface Movement {
    id: string;
    product_id: string;
    movement_type: string;
    quantity: number;
    reason: string;
    created_at: string;
}

interface Category {
    id: string;
    name: string;
}

type ColorKey = 'blue' | 'red' | 'green' | 'purple' | 'cyan' | 'pink';

const colorClasses: Record<ColorKey, { text: string; bg: string; border: string }> = {
    blue: { text: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' },
    red: { text: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' },
    green: { text: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30' },
    purple: { text: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/30' },
    cyan: { text: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500/30' },
    pink: { text: 'text-pink-400', bg: 'bg-pink-500/20', border: 'border-pink-500/30' }
};

export default function DashboardPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [movements, setMovements] = useState<Movement[]>([]);
    const [predictiveMetrics, setPredictiveMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState('30d');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // ✅ VERIFICAR CACHÉ PRIMERO
                const cachedData = localStorage.getItem("dashboard_cache");
                const cacheTime = localStorage.getItem("dashboard_cache_time");
                const now = Date.now();
                const CACHE_DURATION = 60000; // 60 segundos

                // Si el caché existe y es reciente, usarlo
                if (cachedData && cacheTime && (now - Number(cacheTime)) < CACHE_DURATION) {
                    console.log("📦 Usando caché del Dashboard");
                    const parsed = JSON.parse(cachedData);
                    setProducts(parsed.products);
                    setCategories(parsed.categories);
                    setMovements(parsed.movements);
                    setPredictiveMetrics(parsed.metrics);
                    setLoading(false);
                    return;
                }

                // Si no hay caché, cargar desde el backend
                console.log("🌐 Cargando Dashboard desde el backend");
                const [productsData, categoriesData, movementsData, metrics] = await Promise.all([
                    getProducts(),
                    getCategories(),
                    getInventoryMovements(),
                    predictiveService.getDashboardMetrics()
                ]);

                setProducts(productsData || []);
                setCategories(categoriesData || []);
                setMovements(movementsData || []);
                setPredictiveMetrics(metrics);

                // ✅ GUARDAR EN CACHÉ
                localStorage.setItem("dashboard_cache", JSON.stringify({
                    products: productsData || [],
                    categories: categoriesData || [],
                    movements: movementsData || [],
                    metrics: metrics,
                }));
                localStorage.setItem("dashboard_cache_time", String(now));

            } catch (error) {
                console.error('Error loading dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // ✅ FUNCIÓN PARA FILTRAR POR PERÍODO
    const getDaysForPeriod = (period: string) => {
        return period === '7d' ? 7 : period === '30d' ? 30 : 90;
    };

    // ✅ MOVIMIENTOS FILTRADOS (calculados en el render)
    const getFilteredMovements = () => {
        const days = getDaysForPeriod(selectedPeriod);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        return movements.filter(m => new Date(m.created_at) >= cutoffDate);
    };

    const filteredMovements = getFilteredMovements();

    // ============= MÉTRICAS CALCULADAS =============
    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => Number(p.stock) <= 5 && Number(p.stock) > 0);
    const outOfStockProducts = products.filter(p => Number(p.stock) === 0);
    const healthyStockProducts = products.filter(p => Number(p.stock) > 5);

    const totalEntries = filteredMovements.filter(m => m.movement_type.toLowerCase() === 'entrada').length;
    const totalOutputs = filteredMovements.filter(m => m.movement_type.toLowerCase() === 'salida').length;
    const totalMovements = filteredMovements.length;

    // Productos más caros (top 5)
    const topExpensiveProducts = [...products]
        .sort((a, b) => Number(b.price) - Number(a.price))
        .slice(0, 5);

    // Datos para gráfico de categorías
    const categoryChartData = categories.map((category) => ({
        name: category.name.length > 10 ? category.name.substring(0, 10) + '...' : category.name,
        fullName: category.name,
        total: products.filter(p => p.category_id === category.id).length
    })).filter(item => item.total > 0);

    // Datos para gráfico de estado de stock
    const stockStatusData = [
        { name: 'Stock Saludable', value: healthyStockProducts.length, color: '#22C55E' },
        { name: 'Bajo Stock', value: lowStockProducts.length, color: '#EAB308' },
        { name: 'Agotados', value: outOfStockProducts.length, color: '#EF4444' }
    ].filter(item => item.value > 0);

    // Datos para movimientos recientes
    const recentMovements = filteredMovements.slice(-8).reverse();

    // ============= KPIs PRINCIPALES =============
    const mainKpis: Array<{
        title: string;
        value: string | number;
        subtitle: string;
        icon: React.ElementType;
        color: ColorKey;
        gradient: string;
        border: string;
        iconBg: string;
        iconColor: string;
    }> = [
            {
                title: 'Total Productos',
                value: totalProducts,
                subtitle: `${lowStockProducts.length} con bajo stock`,
                icon: Package,
                color: 'blue',
                gradient: 'from-blue-500/30 via-blue-500/10 to-transparent',
                border: 'border-blue-500/30',
                iconBg: 'bg-blue-500/20',
                iconColor: 'text-blue-400'
            },
            {
                title: 'Alertas Críticas',
                value: predictiveMetrics?.criticalAlerts?.length || 0,
                subtitle: `${outOfStockProducts.length} productos agotados`,
                icon: AlertCircle,
                color: 'red',
                gradient: 'from-red-500/30 via-red-500/10 to-transparent',
                border: 'border-red-500/30',
                iconBg: 'bg-red-500/20',
                iconColor: 'text-red-400'
            },
            {
                title: 'Valor Inventario',
                value: `$${predictiveMetrics?.totalInventoryValue?.toFixed(2) || '0.00'}`,
                subtitle: `${categories.length} categorías`,
                icon: DollarSign,
                color: 'green',
                gradient: 'from-green-500/30 via-green-500/10 to-transparent',
                border: 'border-green-500/30',
                iconBg: 'bg-green-500/20',
                iconColor: 'text-green-400'
            },
            {
                title: 'Predicción Ventas (30d)',
                value: `$${predictiveMetrics?.predictedSalesNextMonth?.toFixed(2) || '0.00'}`,
                subtitle: 'Basado en historial',
                icon: TrendingUp,
                color: 'purple',
                gradient: 'from-purple-500/30 via-purple-500/10 to-transparent',
                border: 'border-purple-500/30',
                iconBg: 'bg-purple-500/20',
                iconColor: 'text-purple-400'
            }
        ];

    // ============= KPIs SECUNDARIOS =============
    const secondaryKpis: Array<{
        title: string;
        value: string | number;
        subtitle: string;
        icon: React.ElementType;
        color: ColorKey;
    }> = [
            {
                title: `Movimientos (${selectedPeriod})`,
                value: totalMovements,
                subtitle: `${totalEntries} entradas • ${totalOutputs} salidas`,
                icon: RefreshCw,
                color: 'cyan'
            },
            {
                title: 'Usuarios Activos',
                value: 5,
                subtitle: '2 administradores • 3 empleados',
                icon: Users,
                color: 'pink'
            }
        ];

    const getColorClasses = (color: ColorKey) => colorClasses[color];

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-white/10 rounded w-1/4 mb-4"></div>
                    <div className="h-4 bg-white/10 rounded w-1/3"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
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
            {/* ============ HEADER ============ */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Zap className="text-yellow-400" size={28} />
                        Dashboard
                    </h1>
                    <p className="text-white/40 mt-1">
                        Visión general de tu negocio con inteligencia predictiva
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-1">
                    {['7d', '30d', '90d'].map((period) => (
                        <button
                            key={period}
                            onClick={() => setSelectedPeriod(period)}
                            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${selectedPeriod === period
                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20'
                                    : 'text-white/40 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {period === '7d' ? '7 días' : period === '30d' ? '30 días' : '90 días'}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* ============ KPIs PRINCIPALES ============ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {mainKpis.map((kpi, index) => (
                    <motion.div
                        key={kpi.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`relative overflow-hidden bg-gradient-to-br ${kpi.gradient} border ${kpi.border} rounded-3xl p-5 backdrop-blur-xl hover:scale-[1.02] transition-all cursor-default group`}
                    >
                        <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-current opacity-5 blur-2xl group-hover:opacity-10 transition-opacity"></div>

                        <div className="flex items-start justify-between relative z-10">
                            <div>
                                <p className="text-white/50 text-sm font-medium">{kpi.title}</p>
                                <h2 className="text-2xl font-bold mt-1">{kpi.value}</h2>
                                <p className="text-xs text-white/40 mt-1">{kpi.subtitle}</p>
                            </div>
                            <div className={`p-2.5 rounded-2xl ${kpi.iconBg} backdrop-blur-sm`}>
                                <kpi.icon className={kpi.iconColor} size={22} />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* ============ KPIs SECUNDARIOS ============ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {secondaryKpis.map((kpi, index) => {
                    const colors = getColorClasses(kpi.color);
                    return (
                        <motion.div
                            key={kpi.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + index * 0.1 }}
                            className="bg-white/5 border border-white/10 rounded-3xl p-4 backdrop-blur-xl flex items-center justify-between hover:bg-white/10 transition-all"
                        >
                            <div>
                                <p className="text-white/40 text-sm">{kpi.title}</p>
                                <p className="text-xl font-bold mt-0.5">{kpi.value}</p>
                                <p className="text-xs text-white/30 mt-0.5">{kpi.subtitle}</p>
                            </div>
                            <div className={`p-2 rounded-2xl ${colors.bg}`}>
                                <kpi.icon className={colors.text} size={20} />
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* ============ ALERTAS PREDICTIVAS + CRÉDITOS ============ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PredictiveAlerts />
                <CreditAlerts />
            </div>

            {/* ============ GRÁFICOS ============ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico 1: Productos por Categoría */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-6 backdrop-blur-xl hover:border-white/20 transition-all"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <ShoppingBag size={20} className="text-blue-400" />
                            Productos por Categoría
                        </h3>
                        <span className="text-xs text-white/40">{categories.length} categorías</span>
                    </div>
                    <div className="w-full h-[280px]">
                        {categoryChartData.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-white/40">
                                No hay datos disponibles
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={categoryChartData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                    <XAxis
                                        type="number"
                                        stroke="#666"
                                        fontSize={11}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        stroke="#666"
                                        fontSize={11}
                                        tickLine={false}
                                        width={80}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: '#1a1a1a',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '12px',
                                            fontSize: '12px'
                                        }}
                                        formatter={(value) => [`${value} productos`, '']}
                                        labelFormatter={(label) => {
                                            const item = categoryChartData.find(d => d.name === label);
                                            return item?.fullName || label;
                                        }}
                                    />
                                    <Bar
                                        dataKey="total"
                                        fill="#3B82F6"
                                        radius={[0, 6, 6, 0]}
                                        animationDuration={1000}
                                        barSize={20}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </motion.div>

                {/* Gráfico 2: Estado del Stock */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-6 backdrop-blur-xl hover:border-white/20 transition-all"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <AlertTriangle size={20} className="text-yellow-400" />
                            Estado del Inventario
                        </h3>
                        <span className="text-xs text-white/40">{totalProducts} total</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="w-full h-[220px]">
                            {stockStatusData.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-white/40">
                                    Sin datos
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={stockStatusData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={40}
                                            outerRadius={70}
                                            paddingAngle={4}
                                            dataKey="value"
                                            animationDuration={1000}
                                            label={({ name, percent }) => {
                                                if (percent === undefined) return name;
                                                return `${name} ${(percent * 100).toFixed(0)}%`;
                                            }}
                                            labelLine={false}
                                        >
                                            {stockStatusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                background: '#1a1a1a',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '12px'
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Leyenda */}
                        <div className="flex flex-col justify-center gap-3">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <span className="text-sm text-white/60">Stock Saludable</span>
                                <span className="ml-auto text-sm font-bold text-white">{healthyStockProducts.length}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <span className="text-sm text-white/60">Bajo Stock</span>
                                <span className="ml-auto text-sm font-bold text-yellow-400">{lowStockProducts.length}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <span className="text-sm text-white/60">Agotados</span>
                                <span className="ml-auto text-sm font-bold text-red-400">{outOfStockProducts.length}</span>
                            </div>
                            <div className="pt-2 border-t border-white/10">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-white/40">Total productos</span>
                                    <span className="font-bold text-white">{totalProducts}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* ============ PRODUCTOS CON STOCK BAJO + PRODUCTOS MÁS CAROS ============ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tabla: Productos con Stock Bajo */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-6 backdrop-blur-xl hover:border-white/20 transition-all"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <AlertCircle size={20} className="text-red-400" />
                            Productos con Stock Bajo
                        </h3>
                        <span className="text-xs text-white/40">{lowStockProducts.length} productos</span>
                    </div>
                    <div className="overflow-x-auto">
                        {lowStockProducts.length === 0 ? (
                            <div className="flex items-center justify-center py-8 text-white/40 gap-2">
                                <CheckCircle size={20} className="text-green-400" />
                                No hay productos con stock bajo
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
                                        <th className="pb-3 font-medium">Producto</th>
                                        <th className="pb-3 font-medium text-center">Stock</th>
                                        <th className="pb-3 font-medium text-right">Precio</th>
                                        <th className="pb-3 font-medium text-right">Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lowStockProducts.slice(0, 5).map((product, index) => {
                                        const stock = Number(product.stock);
                                        const isOutOfStock = stock === 0;

                                        return (
                                            <motion.tr
                                                key={product.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="border-b border-white/5 hover:bg-white/5 transition-all"
                                            >
                                                <td className="py-3 text-sm font-medium">{product.name}</td>
                                                <td className={`py-3 text-sm font-bold text-center ${isOutOfStock ? 'text-red-400' : 'text-yellow-400'}`}>
                                                    {stock}
                                                </td>
                                                <td className="py-3 text-sm text-right">${product.price}</td>
                                                <td className="py-3 text-right">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${isOutOfStock
                                                            ? 'bg-red-500/20 text-red-400'
                                                            : 'bg-yellow-500/20 text-yellow-400'
                                                        }`}>
                                                        {isOutOfStock ? 'Agotado' : 'Bajo Stock'}
                                                    </span>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </motion.div>

                {/* Tabla: Productos más caros */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-6 backdrop-blur-xl hover:border-white/20 transition-all"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <DollarSign size={20} className="text-green-400" />
                            Productos más Caros
                        </h3>
                        <span className="text-xs text-white/40">Top 5</span>
                    </div>
                    <div className="overflow-x-auto">
                        {topExpensiveProducts.length === 0 ? (
                            <div className="flex items-center justify-center py-8 text-white/40">
                                No hay productos registrados
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
                                        <th className="pb-3 font-medium">#</th>
                                        <th className="pb-3 font-medium">Producto</th>
                                        <th className="pb-3 font-medium text-center">Stock</th>
                                        <th className="pb-3 font-medium text-right">Precio</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topExpensiveProducts.map((product, index) => (
                                        <motion.tr
                                            key={product.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="border-b border-white/5 hover:bg-white/5 transition-all"
                                        >
                                            <td className="py-3 text-sm text-white/40">
                                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                                                        index === 1 ? 'bg-gray-400/20 text-gray-400' :
                                                            index === 2 ? 'bg-orange-500/20 text-orange-400' :
                                                                'bg-white/5 text-white/40'
                                                    }`}>
                                                    {index + 1}
                                                </span>
                                            </td>
                                            <td className="py-3 text-sm font-medium">{product.name}</td>
                                            <td className="py-3 text-sm text-center">{product.stock}</td>
                                            <td className="py-3 text-sm font-bold text-right text-green-400">
                                                ${product.price}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* ============ ÚLTIMOS MOVIMIENTOS ============ */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-6 backdrop-blur-xl hover:border-white/20 transition-all"
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Clock size={20} className="text-blue-400" />
                        Últimos Movimientos
                    </h3>
                    <span className="text-xs text-white/40">
                        {filteredMovements.length} movimientos en {selectedPeriod}
                    </span>
                </div>
                <div className="overflow-x-auto">
                    {recentMovements.length === 0 ? (
                        <div className="flex items-center justify-center py-8 text-white/40">
                            No hay movimientos en este período
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="text-left border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
                                    <th className="pb-3 font-medium">Producto</th>
                                    <th className="pb-3 font-medium">Tipo</th>
                                    <th className="pb-3 font-medium text-center">Cantidad</th>
                                    <th className="pb-3 font-medium">Motivo</th>
                                    <th className="pb-3 font-medium text-right">Fecha</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentMovements.map((movement: Movement, index) => {
                                    const product = products.find(p => p.id === movement.product_id);
                                    const isEntry = movement.movement_type.toLowerCase() === 'entrada';

                                    return (
                                        <motion.tr
                                            key={movement.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="border-b border-white/5 hover:bg-white/5 transition-all"
                                        >
                                            <td className="py-3 text-sm font-medium">
                                                {product?.name || 'Producto eliminado'}
                                            </td>
                                            <td className="py-3">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${isEntry
                                                        ? 'bg-green-500/20 text-green-400'
                                                        : 'bg-red-500/20 text-red-400'
                                                    }`}>
                                                    {isEntry ? '📥 Entrada' : '📤 Salida'}
                                                </span>
                                            </td>
                                            <td className="py-3 text-sm text-center font-medium">{movement.quantity}</td>
                                            <td className="py-3 text-sm text-white/60">{movement.reason || '—'}</td>
                                            <td className="py-3 text-sm text-white/40 text-right">
                                                {new Date(movement.created_at).toLocaleDateString('es-ES', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </motion.div>
        </div>
    );
}