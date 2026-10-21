import { motion } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import {
    getInvoices,
    createInvoice,
    cancelInvoice,
    deleteInvoice,
    type Invoice,
} from "../services/invoiceService";
import { getSales, type Sale } from "../services/saleService";
import { getCustomers, type Customer } from "../services/customerService";
import {
    FileText,
    Plus,
    Trash2,
    X,
    Search,
    DollarSign,
    Eye,
    Printer,
    Ban,
    Receipt,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import toast from "react-hot-toast";
import { formatCurrency } from "../utils/formatCurrency";

type ColorKey = 'blue' | 'green' | 'red' | 'yellow' | 'purple';

const colorClasses: Record<ColorKey, { text: string; bg: string }> = {
    blue: { text: "text-blue-400", bg: "bg-blue-500/20" },
    green: { text: "text-green-400", bg: "bg-green-500/20" },
    red: { text: "text-red-400", bg: "bg-red-500/20" },
    yellow: { text: "text-yellow-400", bg: "bg-yellow-500/20" },
    purple: { text: "text-purple-400", bg: "bg-purple-500/20" },
};

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("todos");

    // Modales
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [saving, setSaving] = useState(false);

    // Formulario
    const [selectedSale, setSelectedSale] = useState("");
    const [invoiceType, setInvoiceType] = useState("FACTURA");
    const [notes, setNotes] = useState("");
    const [cancelReason, setCancelReason] = useState("");

    // ============ CARGAR DATOS ============
    const loadData = useCallback(async () => {
        try {
            const [invoicesData, salesData, customersData] = await Promise.all([
                getInvoices(),
                getSales(),
                getCustomers(),
            ]);
            setInvoices(invoicesData);
            setSales(salesData);
            setCustomers(customersData);
        } catch (error) {
            console.log(error);
            toast.error("Error al cargar datos");
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // ============ CREAR FACTURA ============
    const handleSave = async () => {
        if (!selectedSale) {
            toast.error("Seleccione una venta");
            return;
        }

        setSaving(true);
        try {
            const sale = sales.find((s) => s.id === selectedSale);

            await createInvoice({
                sale_id: selectedSale,
                customer_id: sale?.customer_id,
                type: invoiceType,
                notes,
                created_by: "admin",
            });

            toast.success("Factura emitida exitosamente");
            await loadData();
            closeModal();
        } catch (error: unknown) {
            console.log(error);
            const errorMessage =
                error && typeof error === "object" && "response" in error
                    ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
                    : undefined;
            toast.error(errorMessage || "Error al emitir factura");
        } finally {
            setSaving(false);
        }
    };

    // ============ ANULAR FACTURA ============
    const handleCancel = async () => {
        if (!selectedInvoice) return;
        if (!cancelReason.trim()) {
            toast.error("Ingrese el motivo de anulación");
            return;
        }

        try {
            await cancelInvoice(selectedInvoice.id, cancelReason);
            toast.success("Factura anulada");
            await loadData();
            setShowCancelModal(false);
            setShowDetailModal(false);
            setCancelReason("");
        } catch (error: unknown) {
            console.log(error);
            toast.error("Error al anular factura");
        }
    };

    // ============ ELIMINAR ============
    const handleDelete = async (invoice: Invoice) => {
        if (!window.confirm(`¿Eliminar la factura ${invoice.invoice_number}?`)) return;
        try {
            await deleteInvoice(invoice.id);
            toast.success("Factura eliminada");
            await loadData();
        } catch (error) {
            console.log(error);
            toast.error("Error al eliminar");
        }
    };

    // ============ GENERAR PDF ============
    const generatePDF = (invoice: Invoice) => {
        const doc = new jsPDF();
        const sale = sales.find((s) => s.id === invoice.sale_id);
        const customer = customers.find((c) => c.id === invoice.customer_id);

        const pageWidth = doc.internal.pageSize.getWidth();
        const fecha = new Date(invoice.created_at);

        // ============ FRANJA SUPERIOR AZUL ============
        doc.setFillColor(37, 99, 235);
        doc.rect(0, 0, pageWidth, 8, "F");

        // ============ HEADER - LOGO Y DATOS DEL NEGOCIO ============
        doc.setFillColor(37, 99, 235);
        doc.roundedRect(14, 15, 24, 24, 3, 3, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("J", 22, 32);

        doc.setTextColor(30, 30, 30);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("JESÚS ES MI PASTOR", 44, 22);

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(90, 90, 90);
        doc.text("Venta de Ropa, Calzado y Artículos para el Hogar y Mucho Mas...", 44, 28);
        doc.text("RUC: 001-150390-1001A  |  Tel: 8888-1234", 44, 33);
        doc.text("Nandaime, Granada, Mercado Municipal Nandaime", 44, 38);

        // ============ RECUADRO DEL TIPO DE DOCUMENTO ============
        const docBoxX = pageWidth - 75;
        doc.setFillColor(37, 99, 235);
        doc.roundedRect(docBoxX, 15, 61, 24, 2, 2, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(invoice.type || "FACTURA", docBoxX + 30.5, 23, { align: "center" });

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`N°: ${invoice.invoice_number}`, docBoxX + 30.5, 30, { align: "center" });
        doc.setFontSize(7);
        doc.text(
            `${fecha.toLocaleDateString('es-ES')} - ${fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`,
            docBoxX + 30.5, 36, { align: "center" }
        );

        // ============ LÍNEA DIVISORIA ============
        doc.setDrawColor(37, 99, 235);
        doc.setLineWidth(1);
        doc.line(14, 45, pageWidth - 14, 45);

        // ============ DATOS DEL CLIENTE ============
        doc.setFillColor(245, 247, 250);
        doc.roundedRect(14, 50, pageWidth - 28, 24, 2, 2, "F");

        doc.setFillColor(37, 99, 235);
        doc.rect(14, 50, 3, 24, "F");

        doc.setTextColor(37, 99, 235);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("DATOS DEL CLIENTE", 20, 56);

        doc.setTextColor(40, 40, 40);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`Nombre: ${customer?.name || "Cliente Genérico"}`, 20, 63);

        if (customer?.ruc) {
            doc.text(`RUC: ${customer.ruc}`, 20, 69);
        }

        if (customer?.phone) {
            doc.text(`Teléfono: ${customer.phone}`, 110, 63);
        }
        if (customer?.address) {
            const address = customer.address.length > 35
                ? customer.address.substring(0, 35) + "..."
                : customer.address;
            doc.text(`Dirección: ${address}`, 110, 69);
        }

        // ============ TABLA DE PRODUCTOS ============
        const tableStartY = 82;

        if (sale?.items && sale.items.length > 0) {
            autoTable(doc, {
                startY: tableStartY,
                head: [["#", "DESCRIPCIÓN", "CANT.", "P. UNIT.", "TOTAL"]],
                body: sale.items.map((item, index) => [
                    String(index + 1).padStart(3, "0"),
                    item.product_name || "—",
                    item.quantity.toString(),
                    `C$ ${formatCurrency(item.unit_price)}`,
                    `C$ ${formatCurrency(item.total)}`,
                ]),
                theme: "plain",
                headStyles: {
                    fillColor: [37, 99, 235],
                    textColor: [255, 255, 255],
                    fontSize: 9,
                    fontStyle: "bold",
                    halign: "center",
                    cellPadding: 3,
                },
                bodyStyles: {
                    fontSize: 9,
                    textColor: [40, 40, 40],
                    cellPadding: 3,
                },
                columnStyles: {
                    0: { halign: "center", cellWidth: 15 },
                    1: { halign: "left", cellWidth: 90 },
                    2: { halign: "center", cellWidth: 20 },
                    3: { halign: "right", cellWidth: 30 },
                    4: { halign: "right", cellWidth: 30 },
                },
                alternateRowStyles: {
                    fillColor: [248, 250, 252],
                },
                margin: { left: 14, right: 14 },
            });
        }

        // ============ RECUADRO DE TOTALES ============
        const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || 150;
        const totalsX = pageWidth - 80;
        const totalsY = finalY + 8;

        doc.setFillColor(245, 247, 250);
        doc.roundedRect(totalsX, totalsY, 66, 36, 2, 2, "F");
        doc.setDrawColor(37, 99, 235);
        doc.setLineWidth(0.3);
        doc.roundedRect(totalsX, totalsY, 66, 36, 2, 2);

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80, 80, 80);

        doc.text("SUBTOTAL:", totalsX + 4, totalsY + 9);
        doc.text(
            `C$ ${formatCurrency(invoice.subtotal)}`,
            totalsX + 62, totalsY + 9, { align: "right" }
        );

        doc.text("IVA (15%):", totalsX + 4, totalsY + 17);
        doc.text(
            `C$ ${formatCurrency(invoice.tax)}`,
            totalsX + 62, totalsY + 17, { align: "right" }
        );

        doc.setDrawColor(37, 99, 235);
        doc.setLineWidth(0.5);
        doc.line(totalsX + 4, totalsY + 22, totalsX + 62, totalsY + 22);

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(37, 99, 235);
        doc.text("TOTAL:", totalsX + 4, totalsY + 31);
        doc.text(
            `C$ ${formatCurrency(invoice.total)}`,
            totalsX + 62, totalsY + 31, { align: "right" }
        );

        // ============ INFORMACIÓN ADICIONAL ============
        let infoY = totalsY + 45;

        if (sale?.payment_method) {
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(14, infoY - 5, 100, 12, 2, 2, "F");

            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(80, 80, 80);
            doc.text("MÉTODO DE PAGO:", 18, infoY + 3);

            doc.setFont("helvetica", "normal");
            const paymentColor: [number, number, number] = sale.payment_method === "EFECTIVO"
                ? [22, 163, 74]
                : [202, 138, 4];
            doc.setTextColor(paymentColor[0], paymentColor[1], paymentColor[2]);
            doc.text(
                sale.payment_method === "EFECTIVO" ? "Efectivo - Pagado" : "Crédito - Pendiente",
                55, infoY + 3
            );

            infoY += 12;
        }

        if (invoice.notes && invoice.status !== "ANULADA") {
            doc.setTextColor(100, 100, 100);
            doc.setFontSize(8);
            doc.setFont("helvetica", "italic");
            doc.text("Observaciones:", 14, infoY + 5);
            doc.setFont("helvetica", "normal");

            const notesText = invoice.notes.length > 90
                ? invoice.notes.substring(0, 90) + "..."
                : invoice.notes;
            doc.text(notesText, 14, infoY + 11);
        }

        // ============ MARCA DE AGUA ANULADA ============
        if (invoice.status === "ANULADA") {
            doc.setTextColor(220, 38, 38);
            doc.setFontSize(60);
            doc.setFont("helvetica", "bold");
            doc.text("ANULADA", pageWidth / 2, 150, {
                align: "center",
                angle: 20,
            });

            if (invoice.notes) {
                doc.setFontSize(9);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(150, 150, 150);
                doc.text(`Motivo de anulación: ${invoice.notes}`, pageWidth / 2, 200, {
                    align: "center",
                });
            }
        }

        // ============ FOOTER ============
        const footerY = 265;

        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(14, footerY, pageWidth - 14, footerY);

        doc.setFont("courier", "bold");
        doc.setFontSize(13);
        doc.setTextColor(40, 40, 40);
        doc.text(`*${invoice.invoice_number}*`, pageWidth / 2, footerY + 8, {
            align: "center",
        });

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(37, 99, 235);
        doc.text("¡GRACIAS POR SU COMPRA!", pageWidth / 2, footerY + 18, {
            align: "center",
        });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(130, 130, 130);
        doc.text(
            "Este documento es un comprobante de venta",
            pageWidth / 2, footerY + 24, { align: "center" }
        );
        doc.text(
            "Generado por InventoryX - Sistema de Gestión Comercial",
            pageWidth / 2, footerY + 29, { align: "center" }
        );

        doc.setFillColor(37, 99, 235);
        doc.rect(0, 297, pageWidth, 3, "F");

        doc.save(`${invoice.invoice_number}.pdf`);
    };

    // ============ VER DETALLE ============
    const openDetail = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setShowDetailModal(true);
    };

    // ============ CERRAR MODAL ============
    const closeModal = () => {
        setShowModal(false);
        setSelectedSale("");
        setInvoiceType("FACTURA");
        setNotes("");
    };

    // ============ FILTRAR ============
    const filteredInvoices = invoices.filter((inv) => {
        const matchesSearch = inv.invoice_number.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = filterStatus === "todos" || inv.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    // ============ VENTAS SIN FACTURA ============
    const salesWithoutInvoice = sales.filter(
        (sale) => !invoices.some((inv) => inv.sale_id === sale.id && inv.status !== "ANULADA")
    );

    // ============ KPIS ============
    const totalInvoices = invoices.length;
    const issuedInvoices = invoices.filter((i) => i.status === "EMITIDA").length;
    const cancelledInvoices = invoices.filter((i) => i.status === "ANULADA").length;
    const totalBilled = invoices
        .filter((i) => i.status === "EMITIDA")
        .reduce((sum, i) => sum + (Number(i.total) || 0), 0);

    const kpis = [
        {
            title: "Total Facturas",
            value: totalInvoices,
            subtitle: `${issuedInvoices} emitidas`,
            icon: FileText,
            color: "blue" as ColorKey,
            gradient: "from-blue-500/20 to-blue-600/5",
            border: "border-blue-500/20",
        },
        {
            title: "Facturado",
            value: `C$ ${formatCurrency(totalBilled)}`,
            subtitle: "Total facturado",
            icon: DollarSign,
            color: "green" as ColorKey,
            gradient: "from-green-500/20 to-green-600/5",
            border: "border-green-500/20",
        },
        {
            title: "Anuladas",
            value: cancelledInvoices,
            subtitle: "Facturas canceladas",
            icon: Ban,
            color: "red" as ColorKey,
            gradient: "from-red-500/20 to-red-600/5",
            border: "border-red-500/20",
        },
    ];

    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Receipt className="text-blue-400" size={28} />
                        Facturación
                    </h1>
                    <p className="text-white/40 mt-1">
                        Emisión y gestión de facturas
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
                >
                    <Plus size={20} />
                    Nueva Factura
                </button>
            </div>

            {/* KPIS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                {/* Filtros */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-1">
                        {[
                            { value: "todos", label: "Todas" },
                            { value: "EMITIDA", label: "Emitidas" },
                            { value: "ANULADA", label: "Anuladas" },
                        ].map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setFilterStatus(option.value)}
                                className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${filterStatus === option.value
                                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/20"
                                        : "text-white/40 hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar factura..."
                            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-blue-500/50"
                        />
                    </div>
                </div>

                {/* Tabla */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
                                <th className="pb-3 font-medium">N° Factura</th>
                                <th className="pb-3 font-medium">Cliente</th>
                                <th className="pb-3 font-medium text-center">Tipo</th>
                                <th className="pb-3 font-medium text-center">Estado</th>
                                <th className="pb-3 font-medium text-right">Total</th>
                                <th className="pb-3 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-10 text-center text-white/40">
                                        No hay facturas registradas
                                    </td>
                                </tr>
                            ) : (
                                filteredInvoices.map((invoice, index) => {
                                    const customer = customers.find((c) => c.id === invoice.customer_id);
                                    const isCancelled = invoice.status === "ANULADA";

                                    return (
                                        <motion.tr
                                            key={invoice.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                            className="border-b border-white/5 hover:bg-white/5 transition-all"
                                        >
                                            <td className="py-3.5">
                                                <div className="font-medium text-sm">{invoice.invoice_number}</div>
                                                <div className="text-xs text-white/40">
                                                    {new Date(invoice.created_at).toLocaleDateString('es-ES')}
                                                </div>
                                            </td>
                                            <td className="py-3.5 text-sm text-white/70">
                                                {customer?.name || "Cliente Genérico"}
                                            </td>
                                            <td className="py-3.5 text-center">
                                                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/20">
                                                    {invoice.type}
                                                </span>
                                            </td>
                                            <td className="py-3.5 text-center">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${isCancelled
                                                        ? "bg-red-500/20 text-red-400 border border-red-500/20"
                                                        : "bg-green-500/20 text-green-400 border border-green-500/20"
                                                    }`}>
                                                    {isCancelled ? "❌ Anulada" : "✅ Emitida"}
                                                </span>
                                            </td>
                                            <td className="py-3.5 text-sm font-bold text-right text-green-400">
                                                C$ {formatCurrency(invoice.total)}
                                            </td>
                                            <td className="py-3.5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openDetail(invoice)}
                                                        className="p-2 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all"
                                                        title="Ver detalle"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => generatePDF(invoice)}
                                                        className="p-2 rounded-xl bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-all"
                                                        title="Imprimir PDF"
                                                    >
                                                        <Printer size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(invoice)}
                                                        className="p-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* MODAL CREAR FACTURA */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] border border-white/10 rounded-3xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <Receipt className="text-blue-400" size={24} />
                                Nueva Factura
                            </h2>
                            <button
                                onClick={closeModal}
                                className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Selección de venta */}
                            <div>
                                <label className="text-sm text-white/40 block mb-1.5">
                                    Seleccione una Venta *
                                </label>
                                <select
                                    value={selectedSale}
                                    onChange={(e) => setSelectedSale(e.target.value)}
                                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50"
                                >
                                    <option value="" className="bg-[#1a1a2e]">
                                        Seleccionar venta sin factura
                                    </option>
                                    {salesWithoutInvoice.map((sale) => {
                                        const customer = customers.find((c) => c.id === sale.customer_id);
                                        return (
                                            <option key={sale.id} value={sale.id} className="bg-[#1a1a2e]">
                                                {sale.sale_number} - {customer?.name || sale.customer_name_optional || "Cliente Genérico"} - C$ {formatCurrency(sale.total)}
                                            </option>
                                        );
                                    })}
                                </select>
                                {salesWithoutInvoice.length === 0 && (
                                    <p className="text-xs text-yellow-400 mt-1">
                                        ⚠️ No hay ventas pendientes de facturar
                                    </p>
                                )}
                            </div>

                            {/* Tipo de documento */}
                            <div>
                                <label className="text-sm text-white/40 block mb-1.5">
                                    Tipo de Documento
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {["FACTURA", "BOLETA", "NOTA_CREDITO"].map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setInvoiceType(type)}
                                            className={`py-3 rounded-xl font-medium text-xs transition-all ${invoiceType === type
                                                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/20"
                                                    : "bg-white/5 text-white/40 hover:bg-white/10 border border-white/10"
                                                }`}
                                        >
                                            {type === "FACTURA" ? "📄 Factura" :
                                                type === "BOLETA" ? "🧾 Boleta" :
                                                    "🔄 Nota Crédito"}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Notas */}
                            <div>
                                <label className="text-sm text-white/40 block mb-1.5">
                                    Notas (opcional)
                                </label>
                                <input
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Observaciones adicionales"
                                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50"
                                />
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
                                    disabled={saving || !selectedSale}
                                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 py-3 rounded-xl font-semibold transition-all disabled:opacity-50"
                                >
                                    {saving ? "Emitiendo..." : (
                                        <>
                                            <FileText size={18} />
                                            Emitir Factura
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* MODAL DETALLE */}
            {showDetailModal && selectedInvoice && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] border border-white/10 rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold">Detalle de Factura</h2>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 rounded-xl p-3">
                                    <p className="text-xs text-white/40">N° Factura</p>
                                    <p className="font-semibold mt-1">{selectedInvoice.invoice_number}</p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3">
                                    <p className="text-xs text-white/40">Tipo</p>
                                    <p className="font-semibold mt-1">{selectedInvoice.type}</p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3">
                                    <p className="text-xs text-white/40">Cliente</p>
                                    <p className="font-semibold mt-1">
                                        {customers.find((c) => c.id === selectedInvoice.customer_id)?.name || "Cliente Genérico"}
                                    </p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3">
                                    <p className="text-xs text-white/40">Estado</p>
                                    <p className={`font-semibold mt-1 ${selectedInvoice.status === "ANULADA" ? "text-red-400" : "text-green-400"
                                        }`}>
                                        {selectedInvoice.status === "ANULADA" ? "❌ Anulada" : "✅ Emitida"}
                                    </p>
                                </div>
                            </div>

                            {/* Totales */}
                            <div className="pt-4 border-t border-white/10 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/40">Subtotal:</span>
                                    <span>C$ {formatCurrency(selectedInvoice.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/40">IVA (15%):</span>
                                    <span>C$ {formatCurrency(selectedInvoice.tax)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold pt-2 border-t border-white/10">
                                    <span>Total:</span>
                                    <span className="text-green-400">
                                        C$ {formatCurrency(selectedInvoice.total)}
                                    </span>
                                </div>
                            </div>

                            {/* Botones de acción */}
                            <div className="flex gap-3 pt-4 border-t border-white/5">
                                <button
                                    onClick={() => generatePDF(selectedInvoice)}
                                    className="flex-1 flex items-center justify-center gap-2 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 py-3 rounded-xl font-semibold transition-all"
                                >
                                    <Printer size={18} />
                                    Imprimir PDF
                                </button>
                                {selectedInvoice.status === "EMITIDA" && (
                                    <button
                                        onClick={() => setShowCancelModal(true)}
                                        className="flex-1 flex items-center justify-center gap-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 py-3 rounded-xl font-semibold transition-all"
                                    >
                                        <Ban size={18} />
                                        Anular Factura
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* MODAL ANULAR */}
            {showCancelModal && selectedInvoice && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] border border-red-500/30 rounded-3xl p-8 w-full max-w-md"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-red-400">Anular Factura</h2>
                            <button
                                onClick={() => {
                                    setShowCancelModal(false);
                                    setCancelReason("");
                                }}
                                className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <p className="text-sm text-white/60 mb-4">
                            ¿Está seguro de anular la factura <b>{selectedInvoice.invoice_number}</b>?
                        </p>

                        <div className="mb-4">
                            <label className="text-sm text-white/40 block mb-1.5">
                                Motivo de anulación *
                            </label>
                            <input
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="Ej: Error en monto, cliente canceló"
                                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-red-500/50"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowCancelModal(false);
                                    setCancelReason("");
                                }}
                                className="flex-1 bg-white/5 text-white/60 hover:bg-white/10 py-3 rounded-xl font-semibold transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCancel}
                                className="flex-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 py-3 rounded-xl font-semibold transition-all"
                            >
                                Anular Factura
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}