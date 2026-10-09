import { motion } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import {
    getPayrolls,
    createPayroll,
    deletePayroll,
    type Payroll,
} from "../services/payrollService";
import { getEmployees, type Employee } from "../services/employeeService";
import {
    DollarSign,
    Plus,
    Trash2,
    X,
    Search,
    FileText,
    Receipt,
    TrendingUp,
    TrendingDown,
    Download,
    Calendar,
    UserCircle,
    Printer,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import toast from "react-hot-toast";

type ColorKey = 'blue' | 'green' | 'red' | 'yellow' | 'purple';

const colorClasses: Record<ColorKey, { text: string; bg: string }> = {
    blue: { text: "text-blue-400", bg: "bg-blue-500/20" },
    green: { text: "text-green-400", bg: "bg-green-500/20" },
    red: { text: "text-red-400", bg: "bg-red-500/20" },
    yellow: { text: "text-yellow-400", bg: "bg-yellow-500/20" },
    purple: { text: "text-purple-400", bg: "bg-purple-500/20" },
};

export default function PayrollPage() {
    const [payrolls, setPayrolls] = useState<Payroll[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);

    // Formulario
    const [formData, setFormData] = useState({
        employee_id: "",
        period: new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
        base_salary: 0,
        bonuses: 0,
        bonus_description: "",
        deductions: 0,
        deduction_description: "",
        payment_method: "EFECTIVO",
        status: "PAGADA",
    });

    // ============ CARGAR DATOS ============
    const loadData = useCallback(async () => {
        try {
            const [payrollsData, employeesData] = await Promise.all([
                getPayrolls(),
                getEmployees(),
            ]);
            setPayrolls(payrollsData);
            setEmployees(employeesData);
        } catch (error) {
            console.log(error);
            toast.error("Error al cargar datos");
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // ============ SELECCIONAR EMPLEADO ============
    const handleEmployeeChange = (employeeId: string) => {
        const employee = employees.find((e) => e.id === employeeId);
        setFormData({
            ...formData,
            employee_id: employeeId,
            base_salary: employee ? Number(employee.salary) : 0,
        });
    };

    // ============ CÁLCULO DE SALARIO NETO ============
    const netSalary =
        Number(formData.base_salary) +
        Number(formData.bonuses) -
        Number(formData.deductions);

    // ============ GUARDAR ============
    const handleSave = async () => {
        if (!formData.employee_id) {
            toast.error("Seleccione un empleado");
            return;
        }
        if (!formData.period.trim()) {
            toast.error("Ingrese el período de pago");
            return;
        }
        if (Number(formData.base_salary) <= 0) {
            toast.error("El salario base debe ser mayor a 0");
            return;
        }

        setSaving(true);
        try {
            await createPayroll({
                employee_id: formData.employee_id,
                period: formData.period,
                base_salary: Number(formData.base_salary),
                bonuses: Number(formData.bonuses),
                bonus_description: formData.bonus_description,
                deductions: Number(formData.deductions),
                deduction_description: formData.deduction_description,
                payment_method: formData.payment_method,
                status: formData.status,
                created_by: "admin",
            });

            toast.success("Planilla registrada exitosamente");
            await loadData();
            closeModal();
        } catch (error) {
            console.log(error);
            toast.error("Error al registrar planilla");
        } finally {
            setSaving(false);
        }
    };

    // ============ ELIMINAR ============
    const handleDelete = async (payroll: Payroll) => {
        if (!window.confirm(`¿Eliminar el registro de planilla de ${payroll.employee_name}?`)) return;
        try {
            await deletePayroll(payroll.id);
            toast.success("Registro eliminado");
            await loadData();
        } catch (error) {
            console.log(error);
            toast.error("Error al eliminar");
        }
    };

    // ============ CERRAR MODAL ============
    const closeModal = () => {
        setShowModal(false);
        setFormData({
            employee_id: "",
            period: new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
            base_salary: 0,
            bonuses: 0,
            bonus_description: "",
            deductions: 0,
            deduction_description: "",
            payment_method: "EFECTIVO",
            status: "PAGADA",
        });
    };

    // ============ GENERAR PDF DE COMPROBANTE ============
    const generatePDF = (payroll: Payroll) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const fecha = new Date(payroll.created_at);

        // Franja superior
        doc.setFillColor(37, 99, 235);
        doc.rect(0, 0, pageWidth, 8, "F");

        // Logo
        doc.setFillColor(37, 99, 235);
        doc.roundedRect(14, 15, 24, 24, 3, 3, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("J", 22, 32);

        // Nombre negocio
        doc.setTextColor(30, 30, 30);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("JESÚS ES MI PASTOR", 44, 22);

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(90, 90, 90);
        doc.text("RUC: 001-150390-1001A  |  Tel: 8888-1234", 44, 28);
        doc.text("Nandaime, Granada, Mercado Municipal Nandaime", 44, 34);

        // Recuadro título
        doc.setFillColor(37, 99, 235);
        doc.roundedRect(pageWidth - 75, 15, 61, 24, 2, 2, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("COMPROBANTE", pageWidth - 44.5, 22, { align: "center" });
        doc.setFontSize(9);
        doc.text("DE PAGO", pageWidth - 44.5, 28, { align: "center" });
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.text(fecha.toLocaleDateString('es-ES'), pageWidth - 44.5, 34, { align: "center" });

        // Línea divisoria
        doc.setDrawColor(37, 99, 235);
        doc.setLineWidth(1);
        doc.line(14, 45, pageWidth - 14, 45);

        // Datos del empleado
        doc.setFillColor(245, 247, 250);
        doc.roundedRect(14, 52, pageWidth - 28, 30, 2, 2, "F");
        doc.setFillColor(37, 99, 235);
        doc.rect(14, 52, 3, 30, "F");

        doc.setTextColor(37, 99, 235);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("DATOS DEL EMPLEADO", 20, 59);

        doc.setTextColor(40, 40, 40);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`Nombre: ${payroll.employee_name || "—"}`, 20, 66);
        doc.text(`Cargo: ${payroll.employee_position || "—"}`, 20, 72);
        doc.text(`Período: ${payroll.period}`, 20, 78);

        // Detalle de pago
        autoTable(doc, {
            startY: 92,
            head: [["CONCEPTO", "MONTO"]],
            body: [
                ["Salario Base", `C$ ${Number(payroll.base_salary).toFixed(2)}`],
                [
                    `Bonos${payroll.bonus_description ? ` (${payroll.bonus_description})` : ""}`,
                    `+ C$ ${Number(payroll.bonuses).toFixed(2)}`,
                ],
                [
                    `Deducciones${payroll.deduction_description ? ` (${payroll.deduction_description})` : ""}`,
                    `- C$ ${Number(payroll.deductions).toFixed(2)}`,
                ],
            ],
            theme: "grid",
            headStyles: {
                fillColor: [37, 99, 235],
                textColor: [255, 255, 255],
                fontSize: 10,
                fontStyle: "bold",
            },
            bodyStyles: {
                fontSize: 10,
                textColor: [40, 40, 40],
            },
            columnStyles: {
                0: { halign: "left" },
                1: { halign: "right", cellWidth: 50 },
            },
            margin: { left: 14, right: 14 },
        });

        // Total Neto
        const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || 150;

        doc.setFillColor(37, 99, 235);
        doc.roundedRect(14, finalY + 8, pageWidth - 28, 18, 2, 2, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.text("SALARIO NETO A PAGAR:", 20, finalY + 20);
        doc.text(
            `C$ ${Number(payroll.net_salary).toFixed(2)}`,
            pageWidth - 20, finalY + 20, { align: "right" }
        );

        // Método de pago
        doc.setTextColor(60, 60, 60);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`Método de pago: ${payroll.payment_method}`, 14, finalY + 36);
        doc.text(`Estado: ${payroll.status === "PAGADA" ? "✅ Pagada" : "⏳ Pendiente"}`, 14, finalY + 42);

        // Footer
        const footerY = 270;
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(14, footerY, pageWidth - 14, footerY);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(37, 99, 235);
        doc.text("RECIBO DE PAGO", pageWidth / 2, footerY + 10, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(130, 130, 130);
        doc.text("Generado por InventoryX - Sistema de Gestión", pageWidth / 2, footerY + 18, { align: "center" });

        doc.save(`Planilla_${payroll.employee_name}_${payroll.period}.pdf`);
    };

    // ============ FILTRAR ============
    const filteredPayrolls = payrolls.filter((p) => {
        const employee = employees.find((e) => e.id === p.employee_id);
        return (
            p.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
            p.period.toLowerCase().includes(search.toLowerCase()) ||
            employee?.name.toLowerCase().includes(search.toLowerCase())
        );
    });

    // ============ KPIS ============
    const totalPayrolls = payrolls.length;
    const totalPaid = payrolls
        .filter((p) => p.status === "PAGADA")
        .reduce((sum, p) => sum + (Number(p.net_salary) || 0), 0);
    const totalPending = payrolls
        .filter((p) => p.status === "PENDIENTE")
        .reduce((sum, p) => sum + (Number(p.net_salary) || 0), 0);
    const currentMonth = new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    const monthPayroll = payrolls
        .filter((p) => p.period.toLowerCase() === currentMonth.toLowerCase())
        .reduce((sum, p) => sum + (Number(p.net_salary) || 0), 0);

    const kpis = [
        {
            title: "Total Planillas",
            value: totalPayrolls,
            subtitle: "Registros generados",
            icon: FileText,
            color: "blue" as ColorKey,
            gradient: "from-blue-500/20 to-blue-600/5",
            border: "border-blue-500/20",
        },
        {
            title: "Total Pagado",
            value: `C$ ${totalPaid.toFixed(2)}`,
            subtitle: "Salarios pagados",
            icon: TrendingUp,
            color: "green" as ColorKey,
            gradient: "from-green-500/20 to-green-600/5",
            border: "border-green-500/20",
        },
        {
            title: "Pendiente",
            value: `C$ ${totalPending.toFixed(2)}`,
            subtitle: "Por pagar",
            icon: TrendingDown,
            color: "yellow" as ColorKey,
            gradient: "from-yellow-500/20 to-yellow-600/5",
            border: "border-yellow-500/20",
        },
        {
            title: "Nómina del Mes",
            value: `C$ ${monthPayroll.toFixed(2)}`,
            subtitle: currentMonth,
            icon: DollarSign,
            color: "purple" as ColorKey,
            gradient: "from-purple-500/20 to-purple-600/5",
            border: "border-purple-500/20",
        },
    ];

    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Receipt className="text-blue-400" size={28} />
                        Planilla de Pago
                    </h1>
                    <p className="text-white/40 mt-1">
                        Gestión de nómina y pagos a empleados
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white shadow-lg shadow-green-500/30 transition-all hover:scale-105"
                >
                    <Plus size={20} />
                    Nueva Planilla
                </button>
            </div>

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

            {/* TABLA */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-6 backdrop-blur-xl"
            >
                <div className="flex items-center justify-between mb-6">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por empleado o período..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-blue-500/50"
                        />
                    </div>
                    <span className="text-xs text-white/30">
                        {filteredPayrolls.length} de {totalPayrolls}
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
                                <th className="pb-3 font-medium">Empleado</th>
                                <th className="pb-3 font-medium">Período</th>
                                <th className="pb-3 font-medium text-right">Base</th>
                                <th className="pb-3 font-medium text-right">Bonos</th>
                                <th className="pb-3 font-medium text-right">Deducciones</th>
                                <th className="pb-3 font-medium text-right">Neto</th>
                                <th className="pb-3 font-medium text-center">Estado</th>
                                <th className="pb-3 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPayrolls.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-10 text-center text-white/40">
                                        No hay registros de planilla
                                    </td>
                                </tr>
                            ) : (
                                filteredPayrolls.map((payroll, index) => (
                                    <motion.tr
                                        key={payroll.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        className="border-b border-white/5 hover:bg-white/5 transition-all"
                                    >
                                        <td className="py-3.5">
                                            <div className="font-medium text-sm">
                                                {payroll.employee_name || "—"}
                                            </div>
                                            <div className="text-xs text-white/40">
                                                {payroll.employee_position || "—"}
                                            </div>
                                        </td>
                                        <td className="py-3.5 text-sm text-white/70">
                                            {payroll.period}
                                        </td>
                                        <td className="py-3.5 text-sm text-right">
                                            C$ {Number(payroll.base_salary).toFixed(2)}
                                        </td>
                                        <td className="py-3.5 text-sm text-right text-green-400">
                                            + C$ {Number(payroll.bonuses).toFixed(2)}
                                        </td>
                                        <td className="py-3.5 text-sm text-right text-red-400">
                                            - C$ {Number(payroll.deductions).toFixed(2)}
                                        </td>
                                        <td className="py-3.5 text-sm font-bold text-right text-green-400">
                                            C$ {Number(payroll.net_salary).toFixed(2)}
                                        </td>
                                        <td className="py-3.5 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                                payroll.status === "PAGADA"
                                                    ? "bg-green-500/20 text-green-400 border border-green-500/20"
                                                    : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/20"
                                            }`}>
                                                {payroll.status === "PAGADA" ? "✅ Pagada" : "⏳ Pendiente"}
                                            </span>
                                        </td>
                                        <td className="py-3.5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => generatePDF(payroll)}
                                                    className="p-2 rounded-xl bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-all"
                                                    title="Imprimir comprobante"
                                                >
                                                    <Printer size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(payroll)}
                                                    className="p-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* MODAL NUEVA PLANILLA */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] border border-white/10 rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <Receipt className="text-green-400" size={24} />
                                Nueva Planilla
                            </h2>
                            <button
                                onClick={closeModal}
                                className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Empleado */}
                            <div>
                                <label className="text-sm text-white/40 block mb-1.5 flex items-center gap-2">
                                    <UserCircle size={14} />
                                    Empleado *
                                </label>
                                <select
                                    value={formData.employee_id}
                                    onChange={(e) => handleEmployeeChange(e.target.value)}
                                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50"
                                >
                                    <option value="" className="bg-[#1a1a2e]">
                                        Seleccionar empleado
                                    </option>
                                    {employees
                                        .filter((e) => e.status)
                                        .map((e) => (
                                            <option key={e.id} value={e.id} className="bg-[#1a1a2e]">
                                                {e.name} - {e.position} - C$ {Number(e.salary).toFixed(2)}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            {/* Período */}
                            <div>
                                <label className="text-sm text-white/40 block mb-1.5 flex items-center gap-2">
                                    <Calendar size={14} />
                                    Período de Pago *
                                </label>
                                <input
                                    value={formData.period}
                                    onChange={(e) =>
                                        setFormData({ ...formData, period: e.target.value })
                                    }
                                    placeholder="Ej: Octubre 2026"
                                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Salario Base */}
                                <div>
                                    <label className="text-sm text-white/40 block mb-1.5">
                                        Salario Base
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.base_salary === 0 ? "" : formData.base_salary}
                                        onChange={(e) =>
                                            setFormData({ ...formData, base_salary: Number(e.target.value) || 0 })
                                        }
                                        placeholder="0.00"
                                        className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50"
                                    />
                                </div>

                                {/* Método de pago */}
                                <div>
                                    <label className="text-sm text-white/40 block mb-1.5">
                                        Método de Pago
                                    </label>
                                    <select
                                        value={formData.payment_method}
                                        onChange={(e) =>
                                            setFormData({ ...formData, payment_method: e.target.value })
                                        }
                                        className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50"
                                    >
                                        <option value="EFECTIVO" className="bg-[#1a1a2e]">💵 Efectivo</option>
                                        <option value="TRANSFERENCIA" className="bg-[#1a1a2e]">🏦 Transferencia</option>
                                    </select>
                                </div>

                                {/* Bonos */}
                                <div>
                                    <label className="text-sm text-white/40 block mb-1.5 text-green-400">
                                        Bonos (opcional)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.bonuses === 0 ? "" : formData.bonuses}
                                        onChange={(e) =>
                                            setFormData({ ...formData, bonuses: Number(e.target.value) || 0 })
                                        }
                                        placeholder="0.00"
                                        className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-green-500/50"
                                    />
                                </div>

                                {/* Descripción bonos */}
                                <div>
                                    <label className="text-sm text-white/40 block mb-1.5 text-green-400">
                                        Descripción del Bono
                                    </label>
                                    <input
                                        value={formData.bonus_description}
                                        onChange={(e) =>
                                            setFormData({ ...formData, bonus_description: e.target.value })
                                        }
                                        placeholder="Ej: Horas extras, comisiones"
                                        className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-green-500/50"
                                    />
                                </div>

                                {/* Deducciones */}
                                <div>
                                    <label className="text-sm text-white/40 block mb-1.5 text-red-400">
                                        Deducciones (opcional)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.deductions === 0 ? "" : formData.deductions}
                                        onChange={(e) =>
                                            setFormData({ ...formData, deductions: Number(e.target.value) || 0 })
                                        }
                                        placeholder="0.00"
                                        className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-red-500/50"
                                    />
                                </div>

                                {/* Descripción deducciones */}
                                <div>
                                    <label className="text-sm text-white/40 block mb-1.5 text-red-400">
                                        Descripción de la Deducción
                                    </label>
                                    <input
                                        value={formData.deduction_description}
                                        onChange={(e) =>
                                            setFormData({ ...formData, deduction_description: e.target.value })
                                        }
                                        placeholder="Ej: INSS, adelanto"
                                        className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-red-500/50"
                                    />
                                </div>
                            </div>

                            {/* Resumen de pago */}
                            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-5">
                                <p className="text-xs text-blue-300 uppercase tracking-wider mb-3">
                                    Resumen del Pago
                                </p>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-white/50">Salario Base:</span>
                                        <span className="font-semibold">
                                            C$ {Number(formData.base_salary).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm text-green-400">
                                        <span>+ Bonos:</span>
                                        <span className="font-semibold">
                                            C$ {Number(formData.bonuses).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm text-red-400">
                                        <span>- Deducciones:</span>
                                        <span className="font-semibold">
                                            C$ {Number(formData.deductions).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold pt-3 border-t border-blue-500/30">
                                        <span>NETO A PAGAR:</span>
                                        <span className="text-green-400">
                                            C$ {netSalary.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Estado */}
                            <div>
                                <label className="text-sm text-white/40 block mb-1.5">Estado del Pago</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, status: "PAGADA" })}
                                        className={`py-3 rounded-xl font-semibold transition-all ${
                                            formData.status === "PAGADA"
                                                ? "bg-green-500/20 text-green-400 border border-green-500/20"
                                                : "bg-white/5 text-white/40 hover:bg-white/10 border border-white/10"
                                        }`}
                                    >
                                        ✅ Pagada
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, status: "PENDIENTE" })}
                                        className={`py-3 rounded-xl font-semibold transition-all ${
                                            formData.status === "PENDIENTE"
                                                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/20"
                                                : "bg-white/5 text-white/40 hover:bg-white/10 border border-white/10"
                                        }`}
                                    >
                                        ⏳ Pendiente
                                    </button>
                                </div>
                            </div>

                            {/* Botones */}
                            <div className="flex gap-3 pt-4 border-t border-white/5">
                                <button
                                    onClick={closeModal}
                                    className="flex-1 flex items-center justify-center gap-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 py-3 rounded-xl font-semibold transition-all"
                                >
                                    <X size={18} />
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 py-3 rounded-xl font-semibold transition-all disabled:opacity-50"
                                >
                                    {saving ? "Guardando..." : (
                                        <>
                                            <Download size={18} />
                                            Registrar Planilla
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}