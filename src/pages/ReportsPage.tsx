import { motion } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import { getReportData } from "../services/reportsService";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  FileText,
  Package,
  Users,
  DollarSign,
  Download,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle,
  BarChart3,
  PieChart as PieChartIcon,
  Award,
  Activity,

} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import toast from "react-hot-toast";
import { formatCurrency } from "../utils/formatCurrency";

interface Product {
  id: string;
  name: string;
  stock: number;
  price: number;
  category_id?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: boolean;
}

interface Movement {
  id: string;
  product_id?: string;
  movement_type?: string;
  quantity?: number;
  created_at?: string;
}

type ColorKey = 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'cyan' | 'pink';

const colorClasses: Record<ColorKey, { text: string; bg: string; border: string }> = {
  blue: { text: "text-blue-400", bg: "bg-blue-500/20", border: "border-blue-500/20" },
  green: { text: "text-green-400", bg: "bg-green-500/20", border: "border-green-500/20" },
  red: { text: "text-red-400", bg: "bg-red-500/20", border: "border-red-500/20" },
  yellow: { text: "text-yellow-400", bg: "bg-yellow-500/20", border: "border-yellow-500/20" },
  purple: { text: "text-purple-400", bg: "bg-purple-500/20", border: "border-purple-500/20" },
  cyan: { text: "text-cyan-400", bg: "bg-cyan-500/20", border: "border-cyan-500/20" },
  pink: { text: "text-pink-400", bg: "bg-pink-500/20", border: "border-pink-500/20" },
};

const PIE_COLORS = ["#3B82F6", "#22C55E", "#EAB308", "#EF4444", "#A855F7", "#06B6D4", "#EC4899"];

export default function ReportsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);

  // ============ CARGAR DATOS ============
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getReportData();
      setProducts(data.products || []);
      setUsers(data.users || []);
      setMovements(data.movements || []);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ============ MÉTRICAS ============
  const totalInventoryValue = products.reduce(
    (acc, product) => acc + product.stock * Number(product.price),
    0
  );

  const lowStockProducts = products.filter((p) => p.stock > 0 && p.stock <= 10);
  const outOfStockProducts = products.filter((p) => p.stock === 0);
  const healthyStockProducts = products.filter((p) => p.stock > 10);

  const expensiveProducts = [...products]
    .sort((a, b) => Number(b.price) - Number(a.price))
    .slice(0, 5);

  // Datos para gráfico de stock
  const stockStatusData = [
    { name: "Saludable", value: healthyStockProducts.length, color: "#22C55E" },
    { name: "Bajo Stock", value: lowStockProducts.length, color: "#EAB308" },
    { name: "Agotados", value: outOfStockProducts.length, color: "#EF4444" },
  ].filter((item) => item.value > 0);

  // Datos para gráfico de usuarios por rol
  const usersByRole = users.reduce((acc: any, user) => {
    const role = user.role || "SIN ROL";
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});

  const usersByRoleData = Object.entries(usersByRole).map(([name, value], index) => ({
    name,
    value: value as number,
    color: PIE_COLORS[index % PIE_COLORS.length],
  }));

  // Análisis de movimientos
  const entryMovements = movements.filter(
    (m) => (m.movement_type || "").toLowerCase() === "entrada"
  );
  const exitMovements = movements.filter(
    (m) => (m.movement_type || "").toLowerCase() === "salida"
  );

  // ============ EXPORTAR PDF ============
  const exportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const fecha = new Date();
    const fechaActual = fecha.toLocaleDateString("es-ES");

    // ============ HEADER ============
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageWidth, 8, "F");

    doc.setFillColor(37, 99, 235);
    doc.roundedRect(14, 15, 20, 20, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("J", 20, 29);

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(16);
    doc.text("JESÚS ES MI PASTOR", 40, 22);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(90, 90, 90);
    doc.text("Sistema de Gestión Comercial - InventoryX", 40, 28);
    doc.text(`Reporte generado el: ${fechaActual}`, 40, 34);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(37, 99, 235);
    doc.text("REPORTE GENERAL", 40, 40);

    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.5);
    doc.line(14, 48, pageWidth - 14, 48);

    // ============ RESUMEN EJECUTIVO ============
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(14, 54, pageWidth - 28, 40, 2, 2, "F");

    doc.setTextColor(37, 99, 235);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("RESUMEN EJECUTIVO", 18, 61);

    doc.setTextColor(40, 40, 40);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    doc.text(`Total Productos:`, 18, 70);
    doc.setFont("helvetica", "bold");
    doc.text(`${products.length}`, 55, 70);

    doc.setFont("helvetica", "normal");
    doc.text(`Total Usuarios:`, 18, 76);
    doc.setFont("helvetica", "bold");
    doc.text(`${users.length}`, 55, 76);

    doc.setFont("helvetica", "normal");
    doc.text(`Total Movimientos:`, 18, 82);
    doc.setFont("helvetica", "bold");
    doc.text(`${movements.length}`, 55, 82);

    doc.setFont("helvetica", "normal");
    doc.text(`Valor Inventario:`, 100, 70);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(22, 163, 74);
    doc.text(`C$ ${formatCurrency(totalInventoryValue)}`, 135, 70);

    doc.setTextColor(40, 40, 40);
    doc.setFont("helvetica", "normal");
    doc.text(`Bajo Stock:`, 100, 76);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(202, 138, 4);
    doc.text(`${lowStockProducts.length}`, 135, 76);

    doc.setTextColor(40, 40, 40);
    doc.setFont("helvetica", "normal");
    doc.text(`Agotados:`, 100, 82);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(220, 38, 38);
    doc.text(`${outOfStockProducts.length}`, 135, 82);

    // ============ TABLA DE PRODUCTOS ============
    doc.setTextColor(37, 99, 235);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("INVENTARIO DE PRODUCTOS", 14, 105);

    autoTable(doc, {
      startY: 110,
      head: [["#", "Producto", "Stock", "Precio", "Valor Total"]],
      body: products.slice(0, 20).map((p, i) => [
        i + 1,
        p.name,
        p.stock,
        `C$ ${formatCurrency(p.price)}`,
        `C$ ${formatCurrency(Number(p.price) * p.stock)}`,
      ]),
      theme: "grid",
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: "bold",
      },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    // ============ PRODUCTOS MÁS CAROS ============
    const finalY1 = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || 200;

    doc.setTextColor(37, 99, 235);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("TOP 5 PRODUCTOS MÁS CAROS", 14, finalY1 + 12);

    autoTable(doc, {
      startY: finalY1 + 17,
      head: [["#", "Producto", "Precio", "Stock"]],
      body: expensiveProducts.map((p, i) => [
        i + 1,
        p.name,
        `C$ ${formatCurrency(p.price)}`,
        p.stock,
      ]),
      theme: "grid",
      headStyles: {
        fillColor: [168, 85, 247],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: "bold",
      },
      bodyStyles: { fontSize: 8 },
    });

    // ============ PRODUCTOS CON BAJO STOCK ============
    const finalY2 = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || 250;

    doc.setTextColor(37, 99, 235);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("PRODUCTOS CON BAJO STOCK", 14, finalY2 + 12);

    autoTable(doc, {
      startY: finalY2 + 17,
      head: [["#", "Producto", "Stock", "Precio"]],
      body: lowStockProducts.slice(0, 10).map((p, i) => [
        i + 1,
        p.name,
        p.stock,
        `C$ ${Number(p.price).toFixed(2)}`,
      ]),
      theme: "grid",
      headStyles: {
        fillColor: [234, 179, 8],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: "bold",
      },
      bodyStyles: { fontSize: 8 },
    });

    // ============ FOOTER ============
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(
        `Página ${i} de ${pageCount}`,
        pageWidth / 2,
        290,
        { align: "center" }
      );
      doc.text(
        "Generado por InventoryX - Sistema de Gestión Comercial",
        pageWidth / 2,
        295,
        { align: "center" }
      );
    }

    doc.save(`Reporte_General_${fechaActual.replace(/\//g, "-")}.pdf`);
    toast.success("PDF descargado correctamente");
  };

  // ============ EXPORTAR EXCEL ============
  const exportExcel = () => {
    const workbook = XLSX.utils.book_new();

    // HOJA 1 - RESUMEN
    const resumen = [
      { Indicador: "Total Productos", Valor: products.length },
      { Indicador: "Total Usuarios", Valor: users.length },
      { Indicador: "Total Movimientos", Valor: movements.length },
      { Indicador: "Valor Inventario", Valor: totalInventoryValue },
      { Indicador: "Productos Bajo Stock", Valor: lowStockProducts.length },
      { Indicador: "Productos Agotados", Valor: outOfStockProducts.length },
      { Indicador: "Entradas Registradas", Valor: entryMovements.length },
      { Indicador: "Salidas Registradas", Valor: exitMovements.length },
    ];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(resumen), "Resumen");

    // HOJA 2 - PRODUCTOS
    const productosSheet = XLSX.utils.json_to_sheet(
      products.map((p) => ({
        ID: p.id,
        Nombre: p.name,
        Stock: p.stock,
        Precio: Number(p.price),
        Valor_Total: Number(p.price) * p.stock,
      }))
    );
    XLSX.utils.book_append_sheet(workbook, productosSheet, "Productos");

    // HOJA 3 - USUARIOS
    const usuariosSheet = XLSX.utils.json_to_sheet(
      users.map((u) => ({
        Nombre: u.name,
        Correo: u.email,
        Rol: u.role,
        Estado: u.status ? "Activo" : "Inactivo",
      }))
    );
    XLSX.utils.book_append_sheet(workbook, usuariosSheet, "Usuarios");

    // HOJA 4 - MOVIMIENTOS
    const movimientosSheet = XLSX.utils.json_to_sheet(
      movements.map((m) => ({
        ID: m.id,
        Producto_ID: m.product_id || "",
        Tipo: m.movement_type || "",
        Cantidad: m.quantity || 0,
        Fecha: m.created_at || "",
      }))
    );
    XLSX.utils.book_append_sheet(workbook, movimientosSheet, "Movimientos");

    // HOJA 5 - PRODUCTOS MÁS CAROS
    const carosSheet = XLSX.utils.json_to_sheet(
      expensiveProducts.map((p, i) => ({
        Posicion: i + 1,
        Nombre: p.name,
        Precio: Number(p.price),
        Stock: p.stock,
      }))
    );
    XLSX.utils.book_append_sheet(workbook, carosSheet, "Más Caros");

    // DESCARGAR
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const file = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const fecha = new Date().toISOString().split("T")[0];
    saveAs(file, `Reporte_General_${fecha}.xlsx`);
    toast.success("Excel descargado correctamente");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-white/10 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-white/5 rounded-3xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ============ KPIS ============
  const kpis = [
    {
      title: "Valor del Inventario",
      value: `C$ ${formatCurrency(totalInventoryValue)}`,
      subtitle: "Valor total en stock",
      icon: DollarSign,
      color: "green" as ColorKey,
      gradient: "from-green-500/20 to-green-600/5",
      border: "border-green-500/20",
    },
    {
      title: "Total Productos",
      value: products.length,
      subtitle: `${healthyStockProducts.length} con stock saludable`,
      icon: Package,
      color: "blue" as ColorKey,
      gradient: "from-blue-500/20 to-blue-600/5",
      border: "border-blue-500/20",
    },
    {
      title: "Alertas de Stock",
      value: lowStockProducts.length + outOfStockProducts.length,
      subtitle: `${outOfStockProducts.length} agotados`,
      icon: AlertTriangle,
      color: "red" as ColorKey,
      gradient: "from-red-500/20 to-red-600/5",
      border: "border-red-500/20",
    },
    {
      title: "Movimientos",
      value: movements.length,
      subtitle: `${entryMovements.length} entradas • ${exitMovements.length} salidas`,
      icon: Activity,
      color: "purple" as ColorKey,
      gradient: "from-purple-500/20 to-purple-600/5",
      border: "border-purple-500/20",
    },
  ];

  // ============ KPIS SECUNDARIOS ============
  const secondaryKpis = [
    {
      title: "Total Usuarios",
      value: users.length,
      subtitle: `${users.filter((u) => u.status).length} activos`,
      icon: Users,
      color: "cyan" as ColorKey,
    },
    {
      title: "Producto Más Caro",
      value: `C$ ${formatCurrency(expensiveProducts[0]?.price || 0)}`,
      subtitle: expensiveProducts[0]?.name || "Sin productos",
      icon: Award,
      color: "pink" as ColorKey,
    },
  ];

  return (
    <div className="space-y-6">
      {/* ============ HEADER ============ */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="text-blue-400" size={28} />
            Reportes
          </h1>
          <p className="text-white/40 mt-1">
            Análisis completo del negocio y exportación de datos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportPDF}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-lg shadow-red-500/30 transition-all hover:scale-105"
          >
            <FileText size={18} />
            Exportar PDF
          </button>
          <button
            onClick={exportExcel}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white shadow-lg shadow-green-500/30 transition-all hover:scale-105"
          >
            <FileSpreadsheet size={18} />
            Exportar Excel
          </button>
        </div>
      </div>

      {/* ============ KPIS PRINCIPALES ============ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => {
          const colors = colorClasses[kpi.color];
          return (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-gradient-to-br ${kpi.gradient} border ${kpi.border} rounded-3xl p-5 backdrop-blur-xl hover:scale-[1.02] transition-all`}
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

      {/* ============ KPIS SECUNDARIOS ============ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {secondaryKpis.map((kpi, index) => {
          const colors = colorClasses[kpi.color];
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

      {/* ============ GRÁFICOS ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Estado del Stock */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-6 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <PieChartIcon size={20} className="text-blue-400" />
              Estado del Inventario
            </h3>
            <span className="text-xs text-white/40">{products.length} productos</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="w-full h-[220px]">
              {stockStatusData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-white/40 text-sm">
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
                    >
                      {stockStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#1a1a1a",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="flex flex-col justify-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-white/60">Saludable</span>
                <span className="ml-auto text-sm font-bold text-white">
                  {healthyStockProducts.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-sm text-white/60">Bajo Stock</span>
                <span className="ml-auto text-sm font-bold text-yellow-400">
                  {lowStockProducts.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm text-white/60">Agotados</span>
                <span className="ml-auto text-sm font-bold text-red-400">
                  {outOfStockProducts.length}
                </span>
              </div>
              <div className="pt-2 border-t border-white/10">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/40">Total</span>
                  <span className="font-bold text-white">{products.length}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Gráfico 2: Usuarios por Rol */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-6 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Users size={20} className="text-purple-400" />
              Usuarios por Rol
            </h3>
            <span className="text-xs text-white/40">{users.length} usuarios</span>
          </div>
          <div className="w-full h-[220px]">
            {usersByRoleData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-white/40 text-sm">
                Sin datos
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={usersByRoleData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#666" fontSize={11} />
                  <YAxis stroke="#666" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "#1a1a1a",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                    }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={1000}>
                    {usersByRoleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      </div>

      {/* ============ SECCIÓN 1: TOP 5 PRODUCTOS MÁS CAROS ============ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-6 backdrop-blur-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Award size={20} className="text-purple-400" />
            Top 5 Productos Más Caros
          </h3>
          <span className="text-xs text-white/40">Ranking por precio</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
                <th className="pb-3 font-medium">#</th>
                <th className="pb-3 font-medium">Producto</th>
                <th className="pb-3 font-medium text-center">Stock</th>
                <th className="pb-3 font-medium text-right">Precio</th>
                <th className="pb-3 font-medium text-right">Valor Total</th>
              </tr>
            </thead>
            <tbody>
              {expensiveProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-white/40">
                    No hay productos registrados
                  </td>
                </tr>
              ) : (
                expensiveProducts.map((product, index) => (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-all"
                  >
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${index === 0
                            ? "bg-yellow-500/20 text-yellow-400"
                            : index === 1
                              ? "bg-gray-400/20 text-gray-400"
                              : index === 2
                                ? "bg-orange-500/20 text-orange-400"
                                : "bg-white/5 text-white/40"
                          }`}
                      >
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-3 text-sm font-medium">{product.name}</td>
                    <td className="py-3 text-sm text-center">{product.stock}</td>
                    <td className="py-3 text-sm text-right font-bold text-green-400">
                      C$ ${formatCurrency(product.price)}
                    </td>
                    <td className="py-3 text-sm text-right font-semibold">
                      C$ ${formatCurrency(Number(product.price) * product.stock)}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ============ SECCIÓN 2: PRODUCTOS CON BAJO STOCK ============ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-6 backdrop-blur-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <AlertTriangle size={20} className="text-yellow-400" />
            Productos con Bajo Stock
          </h3>
          <span className="text-xs text-white/40">{lowStockProducts.length} productos</span>
        </div>
        <div className="overflow-x-auto">
          {lowStockProducts.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-white/40 gap-2">
              <CheckCircle size={20} className="text-green-400" />
              No hay productos con bajo stock
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
                  <th className="pb-3 font-medium">#</th>
                  <th className="pb-3 font-medium">Producto</th>
                  <th className="pb-3 font-medium text-center">Stock</th>
                  <th className="pb-3 font-medium text-right">Precio</th>
                  <th className="pb-3 font-medium text-right">Estado</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.slice(0, 10).map((product, index) => (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-all"
                  >
                    <td className="py-3 text-sm text-white/40">{index + 1}</td>
                    <td className="py-3 text-sm font-medium">{product.name}</td>
                    <td className="py-3 text-sm text-center font-bold text-yellow-400">
                      {product.stock}
                    </td>
                    <td className="py-3 text-sm text-right">
                     C$ ${formatCurrency(product.price)}
                    </td>
                    <td className="py-3 text-right">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/20">
                        Bajo Stock
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>

      {/* ============ SECCIÓN 3: PRODUCTOS AGOTADOS ============ */}
      {outOfStockProducts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-gradient-to-br from-red-500/5 to-white/[0.02] border border-red-500/20 rounded-3xl p-6 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <AlertTriangle size={20} className="text-red-400" />
              Productos Agotados
            </h3>
            <span className="text-xs text-red-400">{outOfStockProducts.length} productos</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
                  <th className="pb-3 font-medium">#</th>
                  <th className="pb-3 font-medium">Producto</th>
                  <th className="pb-3 font-medium text-right">Precio</th>
                  <th className="pb-3 font-medium text-right">Estado</th>
                </tr>
              </thead>
              <tbody>
                {outOfStockProducts.slice(0, 10).map((product, index) => (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-all"
                  >
                    <td className="py-3 text-sm text-white/40">{index + 1}</td>
                    <td className="py-3 text-sm font-medium">{product.name}</td>
                    <td className="py-3 text-sm text-right">
                      C$ {Number(product.price).toFixed(2)}
                    </td>
                    <td className="py-3 text-right">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/20">
                        Agotado
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* ============ SECCIÓN 4: EXPORTAR ============ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-6 backdrop-blur-xl"
      >
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Download className="text-blue-400" size={20} />
          Exportar Reportes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={exportPDF}
            className="flex items-center gap-3 p-5 rounded-2xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40 transition-all group"
          >
            <div className="p-3 rounded-xl bg-red-500/20 group-hover:bg-red-500/30 transition-all">
              <FileText className="text-red-400" size={24} />
            </div>
            <div className="text-left">
              <p className="font-semibold text-white">Reporte PDF</p>
              <p className="text-xs text-white/40">
                Documento profesional con tablas y resumen
              </p>
            </div>
          </button>

          <button
            onClick={exportExcel}
            className="flex items-center gap-3 p-5 rounded-2xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 hover:border-green-500/40 transition-all group"
          >
            <div className="p-3 rounded-xl bg-green-500/20 group-hover:bg-green-500/30 transition-all">
              <FileSpreadsheet className="text-green-400" size={24} />
            </div>
            <div className="text-left">
              <p className="font-semibold text-white">Reporte Excel</p>
              <p className="text-xs text-white/40">
                5 hojas con datos detallados del sistema
              </p>
            </div>
          </button>
        </div>
      </motion.div>
    </div>
  );
}