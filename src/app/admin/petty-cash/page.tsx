"use client"

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Plus, Search, Printer, Trash2, Loader2, X, FileText, CheckCircle, Wallet, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

type Employee = {
    id: string
    full_name: string
    role: string
}

type PettyCashVoucher = {
    id: string
    voucher_number: number
    date: string
    beneficiary_name: string
    cargo: string
    amount: number
    amount_in_words: string
    concept: string
    accounting_code: string
    signature_data: string | null
    category: string
}

const EXPENSE_CONCEPTS = [
    "Insumos de cocina (Verduras/Frutas)",
    "Insumos de cocina (Carnes/Pescados)",
    "Insumos de cocina (Abarrotes/Secos)",
    "Artículos de limpieza y aseo",
    "Gas o Combustible (Bombona/Recarga)",
    "Servicios Públicos (Agua/Luz/Internet)",
    "Mantenimiento técnico (Estufas/Neveras)",
    "Reparaciones locativas menores",
    "Adelanto de nómina / Prestamos",
    "Pago de transporte / Domicilios externos",
    "Papelería y útiles de oficina",
    "Publicidad y Marketing Digital",
    "Compra de menaje (Platos/Vasos/Cubiertos)",
    "Pago de proveedores ocasionales",
    "Dotación de empleados (Uniformes)",
    "Compra de Hielo y Bebidas externas",
    "Propina para personal de apoyo",
    "Imprevistos de salón / Decoración",
    "Seguros / Impuestos / Permisos",
    "Ems (Seguridad y Bioseguridad)"
];

function numeroALetras(num: number): string {
    const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const especiales = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
    const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

    if (num === 0) return 'CERO PESOS';
    if (num === 100) return 'CIEN PESOS';

    function convertir(n: number): string {
        if (n < 10) return unidades[n];
        if (n < 20) return especiales[n - 10];
        if (n < 100) {
            const d = Math.floor(n / 10);
            const u = n % 10;
            return u === 0 ? decenas[d] : `${decenas[d]} Y ${unidades[u]}`;
        }
        if (n < 1000) {
            const c = Math.floor(n / 100);
            const r = n % 100;
            if (n === 100) return 'CIEN';
            return r === 0 ? centenas[c] : `${centenas[c]} ${convertir(r)}`;
        }
        if (n < 1000000) {
            const m = Math.floor(n / 1000);
            const r = n % 1000;
            const mil = m === 1 ? 'MIL' : `${convertir(m)} MIL`;
            return r === 0 ? mil : `${mil} ${convertir(r)}`;
        }
        return 'VALOR MUY ALTO';
    }

    return `${convertir(num)} PESOS M/CTE`.toUpperCase();
}

export default function PettyCashPage() {
    const [vouchers, setVouchers] = useState<PettyCashVoucher[]>([])
    const [employees, setEmployees] = useState<Employee[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [signature, setSignature] = useState<string | null>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("other")
    const [showSuccess, setShowSuccess] = useState(false)
    const [lastSavedVoucher, setLastSavedVoucher] = useState<any>(null)

    // Form state
    const [formData, setFormData] = useState({
        beneficiary_name: "",
        cargo: "",
        amount: 0,
        amount_in_words: "",
        concept: "",
        accounting_code: "5105",
        category: "Otros"
    })

    useEffect(() => {
        fetchVouchers()
        fetchEmployees()
    }, [])

    async function fetchVouchers() {
        setLoading(true)
        const { data, error } = await supabase
            .from('petty_cash_vouchers')
            .select('*')
            .order('created_at', { ascending: false })

        if (data) setVouchers(data)
        setLoading(false)
    }

    async function fetchEmployees() {
        const { data } = await supabase
            .from('profiles')
            .select('id, full_name, role')
            .in('role', ['admin', 'manager', 'staff', 'cook', 'waiter', 'cashier', 'cleaner'])

        if (data) setEmployees(data)
    }

    const handleEmployeeSelect = (id: string) => {
        setSelectedEmployeeId(id)
        if (id === "other") {
            setFormData({ ...formData, beneficiary_name: "", cargo: "" })
        } else {
            const emp = employees.find(e => e.id === id)
            if (emp) {
                setFormData({
                    ...formData,
                    beneficiary_name: emp.full_name,
                    cargo: emp.role.toUpperCase()
                })
            }
        }
    }

    // Signature Pad Logic
    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true)
        draw(e)
    }

    const stopDrawing = () => {
        setIsDrawing(false)
        const canvas = canvasRef.current
        if (canvas) {
            setSignature(canvas.toDataURL())
        }
    }

    useEffect(() => {
        const resizeCanvas = () => {
            const canvas = canvasRef.current;
            if (canvas && canvas.parentElement) {
                const rect = canvas.parentElement.getBoundingClientRect();
                canvas.width = rect.width;
                canvas.height = rect.height;
                setSignature(null);
            }
        };

        if (isModalOpen && !showSuccess) {
            setTimeout(resizeCanvas, 100);
            window.addEventListener('resize', resizeCanvas);
        }
        return () => window.removeEventListener('resize', resizeCanvas);
    }, [isModalOpen, showSuccess]);

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!canvas || !ctx) return

        const rect = canvas.getBoundingClientRect()
        let x, y

        if ('touches' in e) {
            x = (e.touches[0].clientX - rect.left) * (canvas.width / rect.width)
            y = (e.touches[0].clientY - rect.top) * (canvas.height / rect.height)
        } else {
            x = (e.clientX - rect.left) * (canvas.width / rect.width)
            y = (e.clientY - rect.top) * (canvas.height / rect.height)
        }

        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.strokeStyle = '#000'

        ctx.lineTo(x, y)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(x, y)
    }

    const clearSignature = () => {
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            setSignature(null)
        }
    }

    const handlePrint = (voucher: any) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Comprobante de Caja Menor - #${voucher.voucher_number}</title>
                <style>
                    body { font-family: 'Courier New', Courier, monospace; padding: 20px; color: #000; }
                    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
                    .row { display: flex; justify-content: space-between; margin-bottom: 10px; }
                    .label { font-weight: bold; }
                    .signature-box { border: 1px solid #000; height: 100px; margin-top: 30px; position: relative; }
                    .signature-label { position: absolute; bottom: 5px; left: 5px; font-size: 10px; }
                    .signature-img { max-height: 80px; display: block; margin: 10px auto; }
                    @media print { .no-print { display: none; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>COMPROBANTE DE CAJA MENOR</h1>
                    <h2># ${voucher.voucher_number}</h2>
                </div>
                <div class="row">
                    <span><span class="label">Fecha:</span> ${voucher.date}</span>
                    <span><span class="label">Valor:</span> $${voucher.amount.toLocaleString('es-CO')}</span>
                </div>
                <div class="row">
                    <span><span class="label">Pagado a:</span> ${voucher.beneficiary_name}</span>
                </div>
                <div class="row">
                    <span><span class="label">Concepto:</span> ${voucher.concept}</span>
                </div>
                <div class="row">
                    <span><span class="label">Categoría:</span> ${voucher.category || 'Otros'}</span>
                </div>
                <div class="row" style="margin-top: 20px;">
                    <span><span class="label">Cantidad en letras:</span> ${voucher.amount_in_words}</span>
                </div>
                <div class="signature-box">
                    ${voucher.signature_data ? `<img src="${voucher.signature_data}" class="signature-img" />` : ''}
                    <span class="signature-label">Firma del Beneficiario</span>
                </div>
                <div style="margin-top: 20px; text-align: center; font-size: 10px;">
                    Comprobante generado por Pargo Rojo Admin
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!signature) {
            alert("Por favor firme el comprobante.");
            return;
        }

        try {
            setLoading(true);

            // Construimos el objeto con todos los campos
            const voucherToSave = {
                beneficiary_name: formData.beneficiary_name,
                cargo: formData.cargo,
                amount: formData.amount,
                amount_in_words: formData.amount_in_words,
                concept: formData.concept,
                accounting_code: formData.accounting_code,
                category: formData.category,
                date: new Date().toISOString().split('T')[0],
                status: 'paid',
                signature_data: signature
            };

            const { data, error } = await supabase
                .from('petty_cash_vouchers')
                .insert([voucherToSave])
                .select()
                .single()

            if (error) throw error;

            setLastSavedVoucher(data);
            setShowSuccess(true);
            fetchVouchers();

            // Limpiar formulario
            setFormData({
                beneficiary_name: "",
                cargo: "",
                amount: 0,
                amount_in_words: "",
                concept: "",
                accounting_code: "5105",
                category: "Otros"
            });
            setSignature(null);
            setSelectedEmployeeId("other");
        } catch (error: any) {
            console.error("Error completo de Supabase:", error);
            const errorMsg = error.message || "Error desconocido";
            const errorDetails = error.details || "Sin detalles adicionales";
            const errorCode = error.code || "N/A";

            alert(`ERROR AL GUARDAR:\n\nMensaje: ${errorMsg}\nCód: ${errorCode}\nDetalles: ${errorDetails}\n\nRECOMENDACIÓN: Verifique los permisos de la tabla petty_cash_vouchers.`);
        } finally {
            setLoading(false);
        }
    };

    const filteredVouchers = vouchers.filter(v =>
        v.beneficiary_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.concept.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-sans selection:bg-primary selection:text-black relative overflow-hidden">
            {/* Mesh Gradients for Premium Feel */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto space-y-12 relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                                <Wallet className="w-8 h-8 text-primary" />
                            </div>
                            <h1 className="text-4xl font-black tracking-tighter uppercase italic">Control de <span className="text-primary">Caja Menor</span></h1>
                        </div>
                        <p className="text-gray-400 font-medium italic pl-14">Gestión de gastos operativos y comprobantes de egreso</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/admin">
                            <Button variant="ghost" className="rounded-2xl h-14 font-black uppercase text-xs tracking-widest gap-2">
                                <ArrowLeft className="w-4 h-4" /> VOLVER
                            </Button>
                        </Link>
                        <Button onClick={() => {
                            setShowSuccess(false);
                            setIsModalOpen(true);
                        }} className="bg-primary text-black hover:bg-white font-black h-14 px-8 rounded-2xl shadow-xl shadow-primary/20 gap-2 transition-all hover:scale-[1.02] uppercase text-xs tracking-widest italic">
                            <Plus className="w-5 h-5" /> NUEVO COMPROBANTE
                        </Button>
                    </div>
                </div>

                {/* Vouchers Table */}
                <div className="bg-[#111]/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="p-8 border-b border-white/10 bg-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <h2 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2 text-white">
                            <FileText className="w-5 h-5 text-primary" /> Historial de Movimientos
                        </h2>
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Buscar por beneficiario o concepto..."
                                className="w-full bg-black/60 border border-white/10 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-primary transition-all text-sm font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] border-b border-white/5 bg-white/2">
                                    <th className="px-8 py-5"># Número</th>
                                    <th className="px-8 py-5">Fecha</th>
                                    <th className="px-8 py-5">Beneficiario</th>
                                    <th className="px-8 py-5">Concepto / Categoría</th>
                                    <th className="px-8 py-5 text-right">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredVouchers.map((voucher) => (
                                    <tr key={voucher.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-8 py-6 font-mono text-primary font-black italic">
                                            #{String(voucher.voucher_number).padStart(4, '0')}
                                        </td>
                                        <td className="px-8 py-6 text-xs font-bold text-gray-500">{voucher.date}</td>
                                        <td className="px-8 py-6">
                                            <div className="font-black text-white uppercase italic text-sm">{voucher.beneficiary_name}</div>
                                            <div className="text-[10px] text-gray-500 font-black tracking-widest uppercase">{voucher.cargo}</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="max-w-xs truncate text-sm font-medium text-gray-300 mb-1">{voucher.concept}</div>
                                            <span className="text-[9px] uppercase font-black px-2 py-0.5 bg-primary/10 rounded-lg border border-primary/20 text-primary italic">
                                                {voucher.category || 'Otros'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-3 items-center">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-10 w-10 text-primary hover:bg-primary hover:text-black opacity-0 group-hover:opacity-100 transition-all rounded-xl"
                                                    onClick={() => handlePrint(voucher)}
                                                >
                                                    <Printer className="w-5 h-5" />
                                                </Button>
                                                <div className="py-2 px-4 bg-rose-500/10 text-rose-500 rounded-xl font-black border border-rose-500/20 italic text-lg tracking-tighter">
                                                    -${voucher.amount.toLocaleString('es-CO')}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredVouchers.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center text-gray-500 italic text-sm">
                                            No se encontraron comprobantes registrados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal para Nuevo Comprobante */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="bg-[#0a0a0a] w-full max-w-4xl rounded-[3rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col max-h-[95vh]">
                            <div className="p-10 border-b border-white/10 flex justify-between items-center bg-white/5 relative z-10">
                                <div>
                                    <h1 className="text-3xl font-black text-primary tracking-tighter uppercase italic">Nuevo Comprobante</h1>
                                    <p className="text-gray-500 text-[10px] uppercase tracking-[0.3em] font-black">Caja Menor & Gastos Operativos</p>
                                </div>
                                <Button variant="ghost" size="icon" className="rounded-2xl h-12 w-12 hover:bg-rose-500/20 hover:text-rose-500" onClick={() => {
                                    setIsModalOpen(false);
                                    setShowSuccess(false);
                                }}>
                                    <X className="w-6 h-6" />
                                </Button>
                            </div>

                            <div className="p-10 overflow-y-auto custom-scrollbar relative z-10">
                                {showSuccess ? (
                                    <div className="text-center py-12 space-y-8 animate-in zoom-in-95 duration-500">
                                        <div className="w-32 h-32 bg-primary/20 text-primary rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-primary/30 shadow-2xl shadow-primary/20">
                                            <CheckCircle className="w-16 h-16" />
                                        </div>
                                        <div>
                                            <h2 className="text-5xl font-black text-white uppercase tracking-tighter italic">¡Éxito!</h2>
                                            <p className="text-gray-400 mt-2 font-medium italic">El comprobante #{lastSavedVoucher?.voucher_number} ha sido guardado exitosamente.</p>
                                        </div>
                                        <div className="flex flex-col gap-4 pt-6 max-w-sm mx-auto">
                                            <Button
                                                onClick={() => handlePrint(lastSavedVoucher)}
                                                className="h-20 text-xl font-black bg-primary text-black hover:bg-white gap-3 rounded-[1.5rem] shadow-2xl transition-all uppercase italic tracking-[0.1em]"
                                            >
                                                <Printer className="w-6 h-6" /> IMPRIMIR TICKET
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                onClick={() => {
                                                    setIsModalOpen(false);
                                                    setShowSuccess(false);
                                                }}
                                                className="h-14 font-black rounded-2xl text-gray-500 hover:text-white uppercase text-xs tracking-widest italic"
                                            >
                                                TERMINAR Y VOLVER
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-10">
                                        <div className="space-y-6">
                                            {/* Fila 1: Beneficiario */}
                                            <div className="grid md:grid-cols-2 gap-6 p-8 bg-white/5 rounded-[2.5rem] border border-white/5">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-2 italic">Seleccionar Operador</label>
                                                    <select
                                                        className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-primary transition-all font-bold text-white appearance-none h-16 shadow-inner"
                                                        value={selectedEmployeeId}
                                                        onChange={(e) => handleEmployeeSelect(e.target.value)}
                                                    >
                                                        <option value="other" className="bg-[#1a1a1a] text-white">Externo / Proveedor</option>
                                                        {employees.map(emp => (
                                                            <option key={emp.id} value={emp.id} className="bg-[#1a1a1a] text-white">
                                                                {emp.full_name.toUpperCase()} ({emp.role.toUpperCase()})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-2 italic">Nombre del Beneficiario</label>
                                                    <input
                                                        required
                                                        className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-primary transition-all font-black text-white h-16 placeholder:text-gray-700 uppercase italic"
                                                        placeholder="Nombre Completo"
                                                        value={formData.beneficiary_name}
                                                        onChange={e => setFormData({ ...formData, beneficiary_name: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            {/* Fila 2: Valor y Monto en letras */}
                                            <div className="grid md:grid-cols-3 gap-6 p-8 bg-white/5 rounded-[2.5rem] border border-white/5">
                                                <div className="md:col-span-1 space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary ml-2 italic">Monto a Retirar ($)</label>
                                                    <input
                                                        required
                                                        type="number"
                                                        className="w-full bg-black border-2 border-primary/30 rounded-2xl px-6 py-4 outline-none focus:border-primary transition-all font-black text-4xl text-primary h-20 text-center italic"
                                                        placeholder="0"
                                                        value={formData.amount || ""}
                                                        onChange={e => {
                                                            const val = parseFloat(e.target.value) || 0;
                                                            setFormData({
                                                                ...formData,
                                                                amount: val,
                                                                amount_in_words: numeroALetras(val)
                                                            })
                                                        }}
                                                    />
                                                </div>
                                                <div className="md:col-span-2 space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-2 italic">Valor en Letras</label>
                                                    <div className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 flex items-center h-20 text-gray-400 font-bold uppercase italic tracking-tighter text-sm">
                                                        {formData.amount_in_words || "Cero Pesos"}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Fila 3: Concepto y Categoría */}
                                            <div className="grid md:grid-cols-2 gap-6 p-8 bg-white/5 rounded-[2.5rem] border border-white/5">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-2 italic">Concepto del Gasto</label>
                                                    <input
                                                        required
                                                        list="concepts-list"
                                                        className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-primary transition-all font-bold h-16 placeholder:text-gray-700 italic"
                                                        placeholder="Motivo del egreso..."
                                                        value={formData.concept}
                                                        onChange={e => setFormData({ ...formData, concept: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-2 italic">Categoría Contable</label>
                                                    <select
                                                        className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-primary transition-all font-black text-white h-16"
                                                        value={formData.category}
                                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                                    >
                                                        <option value="Limpieza">Limpieza & Aseo</option>
                                                        <option value="Comida / Insumos">Insumos Cocina</option>
                                                        <option value="Reparaciones">Mantenimiento</option>
                                                        <option value="Servicios Públicos">Servicios Públicos</option>
                                                        <option value="Nómina">Adelantos Nómina</option>
                                                        <option value="Otros">Otros Gastos</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <datalist id="concepts-list">
                                            {EXPENSE_CONCEPTS.map(c => (
                                                <option key={c} value={c} />
                                            ))}
                                        </datalist>

                                        {/* FIRMA DIGITAL */}
                                        <div className="p-10 bg-[#111] rounded-[3rem] border-2 border-dashed border-white/10 shadow-inner">
                                            <div className="flex justify-between items-center mb-6 px-2">
                                                <h3 className="text-xs font-black text-primary uppercase tracking-[0.4em] italic">Firma del Beneficiario</h3>
                                                {signature && (
                                                    <Button type="button" variant="ghost" size="sm" className="text-rose-500 text-[10px] font-black hover:bg-rose-500/10 uppercase tracking-widest gap-2" onClick={clearSignature}>
                                                        <Trash2 className="w-4 h-4" /> BORRAR
                                                    </Button>
                                                )}
                                            </div>
                                            <div className="relative bg-white rounded-[2rem] overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.1)] h-64 md:h-72 ring-8 ring-black/20">
                                                <canvas
                                                    ref={canvasRef}
                                                    className="w-full h-full cursor-crosshair touch-none"
                                                    onMouseDown={startDrawing}
                                                    onMouseMove={draw}
                                                    onMouseUp={stopDrawing}
                                                    onMouseOut={stopDrawing}
                                                    onTouchStart={startDrawing}
                                                    onTouchMove={draw}
                                                    onTouchEnd={stopDrawing}
                                                />
                                                {!signature && (
                                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05]">
                                                        <span className="text-6xl font-black text-black uppercase italic tracking-[0.5em] -rotate-12 translate-y-4">FIRME AQUÍ</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={loading || !signature || !formData.beneficiary_name || formData.amount <= 0}
                                            className={cn(
                                                "w-full h-24 text-3xl font-black uppercase tracking-[0.2em] transition-all rounded-[2.5rem] shadow-2xl italic",
                                                (!signature || loading || !formData.beneficiary_name || formData.amount <= 0)
                                                    ? "bg-gray-800 text-gray-500 cursor-not-allowed opacity-50"
                                                    : "bg-primary text-black hover:bg-white hover:scale-[1.02] shadow-primary/30 active:scale-95"
                                            )}
                                        >
                                            {loading ? (
                                                <div className="flex items-center gap-4">
                                                    <Loader2 className="w-10 h-10 animate-spin" />
                                                    PROCESANDO
                                                </div>
                                            ) : (
                                                "EMITIR COMPROBANTE"
                                            )}
                                        </Button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: var(--primary);
                }
            `}</style>
            </div>
        </div>
    )
}
