"use client"

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Plus, Search, Printer, Trash2, Loader2, X, FileText, CheckCircle, Wallet, ArrowLeft, Eye, ShieldCheck, History, ArrowRight, Download, Camera } from "lucide-react"
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
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)
    const [previewVoucher, setPreviewVoucher] = useState<PettyCashVoucher | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [signature, setSignature] = useState<string | null>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("other")
    const [showSuccess, setShowSuccess] = useState(false)
    const [lastSavedVoucher, setLastSavedVoucher] = useState<any>(null)

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
        const { data } = await supabase
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

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true)
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

        ctx.lineWidth = 3
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.strokeStyle = '#000'
        ctx.beginPath()
        ctx.moveTo(x, y)
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
            e.preventDefault()
            x = (e.touches[0].clientX - rect.left) * (canvas.width / rect.width)
            y = (e.touches[0].clientY - rect.top) * (canvas.height / rect.height)
        } else {
            x = (e.clientX - rect.left) * (canvas.width / rect.width)
            y = (e.clientY - rect.top) * (canvas.height / rect.height)
        }

        ctx.lineTo(x, y)
        ctx.stroke()
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
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No se encontró sesión de usuario");

            const { data: profile } = await supabase
                .from('profiles')
                .select('restaurant_id')
                .eq('id', user.id)
                .single();

            if (!profile?.restaurant_id) throw new Error("No se encontró restaurant_id en el perfil");

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
                signature_data: signature,
                restaurant_id: profile.restaurant_id
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
            console.error(error);
            alert(`Error al guardar comprobante: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const filteredVouchers = vouchers.filter(v =>
        v.beneficiary_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.concept.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-transparent text-foreground p-4 md:p-8 font-sans selection:bg-primary selection:text-primary-foreground relative">

            <div className="max-w-[1400px] mx-auto space-y-12 animate-in fade-in duration-1000">

                {/* 🔝 STRATEGIC HEADER */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 border-b border-white/5 pb-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2.5">
                            <Wallet className="w-4 h-4 text-orange-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-500 italic">Financial Governance v3.0</span>
                        </div>
                        <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white leading-none">Caja <span className="text-orange-500 italic">Menor</span></h1>
                        <p className="text-slate-500 font-bold text-sm uppercase tracking-widest italic opacity-70">Auditoría y control de egresos operativos</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <Link href="/admin">
                            <Button variant="ghost" className="h-16 px-8 bg-white/5 border border-white/5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] italic text-white transition-all gap-3 hover:bg-white/10 active:scale-95 group">
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> RETORNO
                            </Button>
                        </Link>
                        <Button
                            onClick={() => {
                                setShowSuccess(false);
                                setIsModalOpen(true);
                            }}
                            className="h-16 px-10 bg-orange-600 text-black hover:bg-orange-500 font-black uppercase text-[10px] tracking-[0.2em] italic rounded-2xl shadow-2xl shadow-orange-500/20 transition-all gap-3 border-none group active:scale-95"
                        >
                            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> EMITIR PROTOCOLO DE GASTO
                        </Button>
                    </div>
                </div>

                {/* 📋 VOUCHERS REGISTRY */}
                <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-6 duration-1000">
                    <div className="p-10 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3 text-white">
                                <History className="w-6 h-6 text-orange-500" /> Auditoría de Movimientos
                            </h2>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic opacity-60">Historial completo de egresos autorizados</p>
                        </div>

                        <div className="relative w-full md:w-[450px] group/search">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-700 group-focus-within/search:text-orange-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="IDENTIFICADOR O CONCEPTO..."
                                className="w-full h-16 bg-white/[0.02] border border-white/10 rounded-[2rem] pl-16 pr-8 outline-none focus:border-orange-500/30 transition-all text-sm font-black italic uppercase text-white placeholder:text-slate-800 shadow-inner"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-separate border-spacing-0">
                            <thead>
                                <tr className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic border-b border-white/5">
                                    <th className="px-10 py-6 bg-white/[0.02]">Protocolo ID</th>
                                    <th className="px-10 py-6 bg-white/[0.02]">Cronología</th>
                                    <th className="px-10 py-6 bg-white/[0.02]">Entidad Receptora</th>
                                    <th className="px-10 py-6 bg-white/[0.02]">Naturaleza Operativa</th>
                                    <th className="px-10 py-6 bg-white/[0.02] text-right">Impacto Neto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {filteredVouchers.map((voucher, idx) => (
                                    <tr key={voucher.id} className="hover:bg-white/[0.03] transition-all duration-300 group border-b border-white/5">
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2.5 h-2.5 rounded-full bg-orange-500/40 group-hover:bg-orange-500 transition-colors animate-pulse" />
                                                <span className="font-mono text-orange-500 font-black italic text-sm tracking-tighter">
                                                    P-{String(voucher.voucher_number).padStart(5, '0')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="text-xs font-black text-muted-foreground italic uppercase tracking-tighter opacity-70">
                                                {voucher.date}
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="space-y-1">
                                                <div className="font-black text-white uppercase italic text-base tracking-tighter group-hover:text-orange-500 transition-colors">{voucher.beneficiary_name}</div>
                                                <div className="text-[9px] text-slate-500 font-black tracking-[0.3em] uppercase italic">{voucher.cargo || 'EXTERNO'}</div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="space-y-2">
                                                <div className="max-w-[300px] truncate text-xs font-bold text-slate-400 italic uppercase tracking-tighter">"{voucher.concept}"</div>
                                                <span className="inline-flex items-center px-3 py-1 bg-white/5 rounded-full border border-white/5 text-[9px] font-black text-orange-500 italic uppercase tracking-widest">
                                                    {voucher.category || 'VARIOS'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <div className="flex justify-end gap-3 items-center">
                                                <div className="flex opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-4 group-hover:translate-x-0">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-12 w-12 text-muted-foreground hover:bg-muted hover:text-foreground rounded-xl"
                                                        onClick={() => {
                                                            setPreviewVoucher(voucher);
                                                            setIsPreviewOpen(true);
                                                        }}
                                                    >
                                                        <Eye className="w-5 h-5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-12 w-12 text-primary hover:bg-primary hover:text-background rounded-xl"
                                                        onClick={() => handlePrint(voucher)}
                                                    >
                                                        <Printer className="w-5 h-5" />
                                                    </Button>
                                                </div>
                                                <div className="py-3 px-6 bg-rose-500/5 text-rose-500 rounded-[1.5rem] font-black border border-rose-500/10 italic text-xl tracking-tighter shadow-inner min-w-[150px] text-center">
                                                    -${voucher.amount.toLocaleString('es-CO')}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredVouchers.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-10 py-32 text-center">
                                            <div className="flex flex-col items-center justify-center gap-4 opacity-20">
                                                <ShieldCheck className="w-20 h-20 text-muted-foreground" />
                                                <p className="italic text-base uppercase font-black tracking-[0.4em]">Integridad de Bóveda: Sin movimientos</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 💎 STRATEGIC EMISSION MODAL */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-500">
                        <div className="bg-slate-950/40 backdrop-blur-3xl w-full max-w-5xl rounded-[4rem] border border-white/5 shadow-3xl relative overflow-hidden flex flex-col max-h-[95vh] outline-none">

                            {/* Decorative background for modal */}
                            <div className="absolute top-0 right-0 p-20 opacity-[0.02] pointer-events-none -mr-20 -mt-20">
                                <Wallet className="w-96 h-96 text-orange-500" />
                            </div>

                            <div className="px-12 py-10 border-b border-white/5 flex justify-between items-center bg-white/[0.02] relative z-10">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-orange-500 animate-pulse" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-500 italic">Emission Protocol</span>
                                    </div>
                                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">Autorizar <span className="text-orange-500">Egreso</span></h1>
                                </div>
                                <Button variant="ghost" size="icon" className="rounded-2xl h-14 w-14 text-slate-500 hover:bg-white/5 hover:text-white active:scale-90 transition-all border border-transparent" onClick={() => {
                                    setIsModalOpen(false);
                                    setShowSuccess(false);
                                }}>
                                    <X className="w-8 h-8" />
                                </Button>
                            </div>

                            <div className="p-12 overflow-y-auto custom-scrollbar relative z-10 selection:bg-primary selection:text-primary-foreground">
                                {showSuccess ? (
                                    <div className="text-center py-16 space-y-10 animate-in zoom-in-95 duration-700">
                                        <div className="w-40 h-40 bg-primary/10 text-primary rounded-[3rem] flex items-center justify-center mx-auto mb-8 border border-primary/20 shadow-3xl shadow-primary/10 relative">
                                            <div className="absolute inset-0 bg-primary/20 rounded-[3rem] animate-ping" />
                                            <CheckCircle className="w-20 h-20 relative z-10" />
                                        </div>
                                        <div className="space-y-3">
                                            <h2 className="text-6xl font-black text-foreground uppercase tracking-tighter italic leading-none">Protocolo <br /> <span className="text-primary italic">Confirmado</span></h2>
                                            <p className="text-muted-foreground mt-4 font-bold italic uppercase tracking-widest text-sm opacity-60">El comprobante P-{String(lastSavedVoucher?.voucher_number).padStart(5, '0')} ha sido indexado.</p>
                                        </div>
                                        <div className="flex flex-col gap-5 pt-10 max-w-md mx-auto">
                                            <Button
                                                onClick={() => handlePrint(lastSavedVoucher)}
                                                className="h-24 text-2xl font-black bg-foreground text-background hover:bg-primary hover:text-primary-foreground gap-5 rounded-[2rem] shadow-3xl transition-all uppercase italic tracking-[0.1em] border-none group"
                                            >
                                                <Printer className="w-8 h-8 group-hover:scale-110 transition-transform" /> DESCARGAR TICKET
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                onClick={() => {
                                                    setIsModalOpen(false);
                                                    setShowSuccess(false);
                                                }}
                                                className="h-16 font-black rounded-2xl text-muted-foreground/40 hover:text-foreground uppercase text-[10px] tracking-[0.3em] italic hover:bg-muted/50 transition-all"
                                            >
                                                CONCLUIR OPERACIÓN Y CERRAR
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-12">
                                        <div className="grid grid-cols-1 gap-10">
                                            {/* ENTITY SELECTION */}
                                            <div className="space-y-10">
                                                <div className="flex items-center gap-4 px-4">
                                                    <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-primary italic font-black text-sm shadow-sm">
                                                        01
                                                    </div>
                                                    <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground italic">Entidad Receptora del Capital</h2>
                                                </div>

                                                <div className="grid md:grid-cols-2 gap-8 p-10 bg-white/[0.02] rounded-[3rem] border border-white/5 shadow-inner relative overflow-hidden">
                                                    <div className="space-y-4">
                                                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 ml-6 italic">Selección Maestro</label>
                                                        <select
                                                            className="w-full h-18 bg-white/[0.03] border border-white/10 rounded-[2rem] px-8 outline-none focus:border-orange-500/40 transition-all font-black italic text-sm tracking-tight text-white appearance-none shadow-sm cursor-pointer"
                                                            value={selectedEmployeeId}
                                                            onChange={(e) => handleEmployeeSelect(e.target.value)}
                                                        >
                                                            <option value="other" className="bg-slate-900 uppercase">VENTA DIRECTA / PROVEEDOR EXTERNO</option>
                                                            {employees.map(emp => (
                                                                <option key={emp.id} value={emp.id} className="bg-slate-900 uppercase">
                                                                    {emp.full_name.toUpperCase()} — [{emp.role.toUpperCase()}]
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 ml-6 italic">Identificación Nominal</label>
                                                        <input
                                                            required
                                                            className="w-full h-18 bg-white/[0.03] border border-white/10 rounded-[2rem] px-8 outline-none focus:border-orange-500/40 transition-all font-black text-lg italic text-white shadow-sm placeholder:text-slate-800 uppercase"
                                                            placeholder="NOMBRE COMPLETO"
                                                            value={formData.beneficiary_name}
                                                            onChange={e => setFormData({ ...formData, beneficiary_name: e.target.value.toUpperCase() })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* VALUATION ENGINE */}
                                            <div className="space-y-10">
                                                <div className="flex items-center gap-4 px-4">
                                                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-orange-500 italic font-black text-sm shadow-sm">
                                                        02
                                                    </div>
                                                    <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 italic">Valuación Financiera</h2>
                                                </div>

                                                <div className="grid md:grid-cols-3 gap-8 p-10 bg-white/[0.02] rounded-[3.5rem] border border-white/5 shadow-inner">
                                                    <div className="md:col-span-1 space-y-4">
                                                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-500/60 ml-6 italic">Magnitud del Egreso ($)</label>
                                                        <div className="relative">
                                                            <span className="absolute left-8 top-1/2 -translate-y-1/2 text-orange-500 font-black text-2xl italic opacity-50">$</span>
                                                            <input
                                                                required
                                                                type="number"
                                                                className="w-full h-24 bg-white/[0.03] border-none ring-4 ring-orange-500/10 focus:ring-orange-500/30 rounded-[2.5rem] pl-16 pr-8 outline-none transition-all font-black text-4xl text-orange-500 text-center italic shadow-2xl"
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
                                                    </div>
                                                    <div className="md:col-span-2 space-y-4">
                                                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500/60 ml-6 italic">Valor Indexado en Letras</label>
                                                        <div className="w-full h-24 bg-white/[0.02] border border-white/5 rounded-[2.5rem] px-10 flex items-center text-slate-600 font-black uppercase italic tracking-tighter text-sm leading-relaxed shadow-sm">
                                                            {formData.amount_in_words || "PROTOCOLO DE VALOR VACÍO"}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* OPERATIONAL CONTEXT */}
                                            <div className="space-y-10">
                                                <div className="flex items-center gap-4 px-4">
                                                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-orange-500 italic font-black text-sm shadow-sm">
                                                        03
                                                    </div>
                                                    <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 italic">Contexto Operativo & Causal</h2>
                                                </div>

                                                <div className="grid md:grid-cols-2 gap-8 p-10 bg-white/[0.02] rounded-[3.5rem] border border-white/5 shadow-inner">
                                                    <div className="space-y-4">
                                                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500/60 ml-6 italic">Naturaleza del Gasto</label>
                                                        <div className="relative">
                                                            <input
                                                                required
                                                                list="concepts-list"
                                                                className="w-full h-20 bg-white/[0.03] border border-white/10 rounded-[2rem] px-8 outline-none focus:border-orange-500/30 transition-all font-black italic tracking-tight text-white shadow-sm placeholder:text-slate-800"
                                                                placeholder="EJ: INSUMOS CRÍTICOS..."
                                                                value={formData.concept}
                                                                onChange={e => setFormData({ ...formData, concept: e.target.value.toUpperCase() })}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500/60 ml-6 italic">Clasificador Contable</label>
                                                        <select
                                                            className="w-full h-20 bg-white/[0.03] border border-white/10 rounded-[2rem] px-8 outline-none focus:border-orange-500/30 transition-all font-black italic tracking-tighter text-white shadow-sm cursor-pointer appearance-none"
                                                            value={formData.category}
                                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                                        >
                                                            <option value="Limpieza" className="bg-slate-900">PROTOCOLOS DE LIMPIEZA</option>
                                                            <option value="Comida / Insumos" className="bg-slate-900">MATERIA PRIMA (COCINA)</option>
                                                            <option value="Reparaciones" className="bg-slate-900">MANTENIMIENTO TÉCNICO</option>
                                                            <option value="Servicios Públicos" className="bg-slate-900">SUMINISTROS & SERVICIOS</option>
                                                            <option value="Nómina" className="bg-slate-900">PASIVOS LABORALES (ADELANTOS)</option>
                                                            <option value="Otros" className="bg-slate-900">REQUERIMIENTOS VARIOS</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* SECURITY PROTOCOL - SIGNATURE */}
                                            <div className="space-y-10">
                                                <div className="flex items-center gap-4 px-4">
                                                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-orange-500 italic font-black text-sm shadow-sm">
                                                        04
                                                    </div>
                                                    <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 italic">Protocolo de Seguridad (Firma)</h2>
                                                </div>

                                                <div className="p-10 bg-white/[0.02] rounded-[4rem] border-2 border-dashed border-white/10 shadow-sm group/signature">
                                                    <div className="flex justify-between items-center mb-8 px-6">
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.5em] italic">Autenticación Biométrica/Digital</p>
                                                            <p className="text-[9px] text-slate-600 font-bold uppercase italic opacity-40">Firma requerida para liberación de fondos</p>
                                                        </div>
                                                        {signature && (
                                                            <Button type="button" variant="ghost" size="sm" className="h-10 px-6 text-rose-500 text-[10px] font-black hover:bg-rose-500/10 rounded-xl uppercase tracking-widest gap-2 border border-transparent hover:border-rose-500/20" onClick={clearSignature}>
                                                                <Trash2 className="w-4 h-4" /> RESETEAR FIRMA
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <div className="relative bg-black rounded-[3rem] overflow-hidden shadow-[inset_0_2px_20px_rgba(0,0,0,0.5)] h-80 ring-1 ring-white/10 group-hover/signature:ring-orange-500/20 transition-all duration-500">
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
                                                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-[0.02]">
                                                                <Camera className="w-32 h-32 mb-4" />
                                                                <span className="text-5xl font-black text-white uppercase italic tracking-[0.3em] -rotate-3 leading-none">VALIDACIÓN DIGITAL</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <datalist id="concepts-list">
                                            {EXPENSE_CONCEPTS.map(c => (
                                                <option key={c} value={c} />
                                            ))}
                                        </datalist>

                                        {/* ACCION DE EMISIÓN */}
                                        <div className="flex flex-col md:flex-row gap-6 pt-10">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    const tempVoucher: PettyCashVoucher = {
                                                        id: 'preview',
                                                        voucher_number: 0,
                                                        date: new Date().toLocaleDateString('es-CO'),
                                                        beneficiary_name: formData.beneficiary_name,
                                                        cargo: formData.cargo || 'OPERADOR',
                                                        amount: formData.amount,
                                                        amount_in_words: formData.amount_in_words,
                                                        concept: formData.concept,
                                                        accounting_code: formData.accounting_code,
                                                        category: formData.category,
                                                        signature_data: signature
                                                    };
                                                    setPreviewVoucher(tempVoucher);
                                                    setIsPreviewOpen(true);
                                                }}
                                                disabled={!formData.beneficiary_name || formData.amount <= 0 || !signature}
                                                className="w-full md:w-1/3 h-24 text-base font-black uppercase tracking-[0.3em] border-2 border-white/10 rounded-[2.5rem] text-slate-700 hover:text-white hover:border-white transition-all italic shadow-xl bg-white/5 active:scale-95 flex flex-col items-center justify-center gap-1"
                                            >
                                                <Eye className="w-6 h-6 border-none shadow-none" />
                                                <span>AUDITAR PREVIA</span>
                                            </Button>

                                            <Button
                                                type="submit"
                                                disabled={loading || !signature || !formData.beneficiary_name || formData.amount <= 0}
                                                className={cn(
                                                    "flex-1 h-24 text-3xl font-black uppercase tracking-[0.1em] transition-all rounded-[2.5rem] shadow-2xl italic border-none group relative overflow-hidden",
                                                    (!signature || loading || !formData.beneficiary_name || formData.amount <= 0)
                                                        ? "bg-white/5 text-slate-800 cursor-not-allowed opacity-50"
                                                        : "bg-orange-600 text-black hover:bg-orange-500 hover:scale-[1.02] shadow-orange-500/20 active:scale-95"
                                                )}
                                            >
                                                {loading ? (
                                                    <div className="flex items-center gap-6">
                                                        <Loader2 className="w-10 h-10 animate-spin" />
                                                        <span className="text-xl">INDEXANDO DATOS...</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-center gap-6">
                                                        EJECUTAR DESEMBOLSO
                                                        <ArrowRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
                                                    </div>
                                                )}
                                            </Button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 🔍 INSPECTION MODAL (PREVIEW) */}
                {isPreviewOpen && previewVoucher && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-500">
                        <div className="bg-slate-950/40 w-full max-w-2xl rounded-[4rem] shadow-3xl border border-white/5 overflow-hidden flex flex-col max-h-[95vh] outline-none">

                            <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center shadow-inner">
                                        <Eye className="w-6 h-6 text-orange-500" />
                                    </div>
                                    <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white leading-none">Inspección de <span className="text-orange-500 italic">Documento</span></h3>
                                </div>
                                <Button variant="ghost" size="icon" className="rounded-2xl h-14 w-14 text-slate-500 hover:bg-white/5 hover:text-white active:scale-90" onClick={() => setIsPreviewOpen(false)}>
                                    <X className="w-8 h-8" />
                                </Button>
                            </div>

                            <div className="p-12 overflow-y-auto custom-scrollbar">
                                <div className="border border-white/10 rounded-[3.5rem] p-10 space-y-10 bg-white/[0.01] relative overflow-hidden group/v">
                                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover/v:opacity-100 transition-opacity duration-1000" />

                                    {/* Cabecera del Voucher */}
                                    <div className="flex justify-between items-start border-b border-white/5 pb-10 relative z-10">
                                        <div className="space-y-2">
                                            <div className="text-[10px] font-black uppercase tracking-[0.5em] text-orange-500 italic leading-none">Establecimiento Autorizado</div>
                                            <div className="text-2xl font-black uppercase italic tracking-tighter text-white">JAMALI OPERATING SYSTEM</div>
                                        </div>
                                        <div className="text-right space-y-2">
                                            <div className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-700 italic leading-none">Comprobante Cod.</div>
                                            <div className="text-3xl font-black italic text-orange-500 leading-none tracking-tighter">#{String(previewVoucher.voucher_number || '0000').padStart(5, '4')}</div>
                                        </div>
                                    </div>

                                    {/* Cuerpo del Voucher */}
                                    <div className="grid grid-cols-2 gap-10 relative z-10">
                                        <div className="space-y-2">
                                            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-700 italic">Fecha de Emisión</div>
                                            <div className="font-black text-white italic text-lg uppercase tracking-tight">{previewVoucher.date}</div>
                                        </div>
                                        <div className="space-y-2 text-right">
                                            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-500/60 italic">Cuantía Transada</div>
                                            <div className="text-3xl font-black text-white italic leading-none tracking-tighter drop-shadow-lg">${previewVoucher.amount.toLocaleString('es-CO')}</div>
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-700 italic">Beneficiario Titular</div>
                                            <div className="font-black text-white uppercase italic text-2xl tracking-tighter leading-none">{previewVoucher.beneficiary_name}</div>
                                            <div className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] italic">{previewVoucher.cargo}</div>
                                        </div>
                                        <div className="col-span-2 space-y-3">
                                            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-700 italic">Naturaleza del Egreso / Concepto</div>
                                            <div className="font-black text-white/80 italic text-base uppercase tracking-tight border-l-4 border-orange-500/40 pl-6 py-2 bg-white/5 rounded-r-2xl shadow-inner">"{previewVoucher.concept}"</div>
                                        </div>
                                        <div className="col-span-2 p-8 bg-black/40 rounded-[2.5rem] border border-white/5 shadow-inner">
                                            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-700 mb-4 italic">Indexación Literal de Valor</div>
                                            <div className="text-xs font-black uppercase italic text-slate-400 leading-relaxed tracking-widest leading-relaxed">{previewVoucher.amount_in_words}</div>
                                        </div>
                                    </div>

                                    {/* Firma */}
                                    {previewVoucher.signature_data && (
                                        <div className="pt-10 border-t border-border flex flex-col items-center relative z-10">
                                            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 mb-6 italic">Validación de Firma Digital</div>
                                            <div className="w-full h-40 bg-card rounded-[3rem] border border-border p-4 overflow-hidden flex items-center justify-center shadow-2xl relative group/s">
                                                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/s:opacity-100 transition-opacity" />
                                                <img src={previewVoucher.signature_data} alt="Firma" className="max-h-full max-w-full object-contain relative z-10 pointer-events-none grayscale hover:grayscale-0 transition-all duration-700" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-10 bg-muted/20 border-t border-border flex gap-6">
                                <Button
                                    onClick={() => handlePrint(previewVoucher)}
                                    className="flex-1 h-18 bg-foreground text-background hover:bg-primary hover:text-primary-foreground font-black rounded-3xl gap-4 uppercase text-[10px] tracking-[0.3em] italic shadow-2xl transition-all border-none group"
                                >
                                    <Download className="w-5 h-5 group-hover:translate-y-1 transition-transform" /> DESCARGAR PROTOCOLO
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsPreviewOpen(false)}
                                    className="px-10 h-18 bg-card border-border text-muted-foreground/40 font-black rounded-3xl uppercase text-[10px] tracking-[0.3em] italic hover:text-foreground hover:border-foreground transition-all shadow-xl"
                                >
                                    CERRAR INSPECCIÓN
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
