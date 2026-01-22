"use client"

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Plus, Search, Printer, Trash2, Loader2, X, Download, FileText, CheckCircle } from "lucide-react"
import Link from "next/image"

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

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!canvas || !ctx) return

        const rect = canvas.getBoundingClientRect()
        let x, y

        if ('touches' in e) {
            x = e.touches[0].clientX - rect.left
            y = e.touches[0].clientY - rect.top
        } else {
            x = e.clientX - rect.left
            y = e.clientY - rect.top
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
            const voucherToSave = {
                ...formData,
                requested_by: selectedEmployeeId === "other" ? null : selectedEmployeeId,
                signature_data: signature,
                date: new Date().toISOString().split('T')[0],
                status: 'paid'
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

            // Limpiar formulario pero mantener el modal para éxito
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
            console.error("Error creating voucher:", error);
            const errorMsg = error.message || "Error desconocido";
            const errorDetails = error.details || "";
            alert(`Error al crear el comprobante: ${errorMsg}\n${errorDetails}\n\nRECOMENDACIÓN: Asegúrese de haber ejecutado las migraciones en Supabase.`);
        } finally {
            setLoading(false);
        }
    };

    const filteredVouchers = vouchers.filter(v =>
        v.beneficiary_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.concept.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Caja Menor</h1>
                    <p className="text-muted-foreground">Gestión de gastos menores y comprobantes de egreso.</p>
                </div>
                <Button onClick={() => {
                    setShowSuccess(false);
                    setIsModalOpen(true);
                }} className="bg-primary text-black hover:bg-primary/90 font-bold h-12 px-8 rounded-xl shadow-lg shadow-primary/20 gap-2">
                    <Plus className="w-5 h-5" /> Nuevo Comprobante
                </Button>
            </div>

            {/* Vouchers Table */}
            <div className="bg-card border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-6 border-b border-white/10 bg-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" /> Historial de Movimientos
                    </h2>
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar por beneficiario o concepto..."
                            className="w-full bg-background border border-white/10 rounded-xl pl-10 pr-4 py-2 outline-none focus:border-primary transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-sm text-muted-foreground border-b border-white/5 bg-white/5">
                                <th className="px-6 py-4 font-bold"># Número</th>
                                <th className="px-6 py-4 font-bold">Fecha</th>
                                <th className="px-6 py-4 font-bold">Beneficiario</th>
                                <th className="px-6 py-4 font-bold">Concepto / Categoría</th>
                                <th className="px-6 py-4 font-bold text-right">Monto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredVouchers.map((voucher) => (
                                <tr key={voucher.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-4 font-mono text-primary font-bold">
                                        {String(voucher.voucher_number).padStart(4, '0')}
                                    </td>
                                    <td className="px-6 py-4 text-sm whitespace-nowrap">{voucher.date}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold">{voucher.beneficiary_name}</div>
                                        <div className="text-xs text-muted-foreground">{voucher.cargo}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="max-w-xs truncate">{voucher.concept}</div>
                                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-white/5 rounded-full border border-white/10 text-muted-foreground">
                                            {voucher.category || 'Otros'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 items-center">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => handlePrint(voucher)}
                                            >
                                                <Printer className="w-4 h-4" />
                                            </Button>
                                            <div className="py-1 px-3 bg-red-500/10 text-red-500 rounded-lg font-black">
                                                -${voucher.amount.toLocaleString('es-CO')}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredVouchers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card w-full max-w-4xl rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden flex flex-col max-h-[95vh]">
                        <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <div>
                                <h1 className="text-3xl font-black text-primary">NUEVO COMPROBANTE</h1>
                                <p className="text-muted-foreground">Registre el gasto y capture la firma digital.</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => {
                                setIsModalOpen(false);
                                setShowSuccess(false);
                            }}>
                                <X className="w-6 h-6" />
                            </Button>
                        </div>

                        <div className="p-8 overflow-y-auto">
                            {showSuccess ? (
                                <div className="text-center py-12 space-y-6 animate-in zoom-in-95">
                                    <div className="w-24 h-24 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                                        <CheckCircle className="w-12 h-12" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">¡Guardado con Éxito!</h2>
                                        <p className="text-muted-foreground mt-2">El comprobante #{lastSavedVoucher?.voucher_number} ha sido registrado.</p>
                                    </div>
                                    <div className="flex flex-col gap-3 pt-4 max-w-sm mx-auto">
                                        <Button
                                            onClick={() => handlePrint(lastSavedVoucher)}
                                            className="h-16 text-lg font-bold bg-primary text-black hover:bg-primary/90 gap-3 rounded-2xl"
                                        >
                                            <Printer className="w-6 h-6" /> Imprimir Ahora
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setIsModalOpen(false);
                                                setShowSuccess(false);
                                            }}
                                            className="h-14 font-bold rounded-2xl"
                                        >
                                            Cerrar
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Seleccionar Empleado (Opcional)</label>
                                                <select
                                                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-white appearance-none"
                                                    value={selectedEmployeeId}
                                                    onChange={(e) => handleEmployeeSelect(e.target.value)}
                                                >
                                                    <option value="other" className="bg-[#1a1a1a] text-white">Externo / Otro</option>
                                                    {employees.map(emp => (
                                                        <option key={emp.id} value={emp.id} className="bg-[#1a1a1a] text-white">
                                                            {emp.full_name} ({emp.role})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Beneficiario</label>
                                                <input
                                                    required
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-lg"
                                                    placeholder="Nombre de quien recibe"
                                                    value={formData.beneficiary_name}
                                                    onChange={e => setFormData({ ...formData, beneficiary_name: e.target.value })}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Monto ($)</label>
                                                    <input
                                                        required
                                                        type="number"
                                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-black text-xl text-primary"
                                                        placeholder="0"
                                                        value={formData.amount}
                                                        onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Categoría</label>
                                                    <select
                                                        className="w-full bg-[#1a1a1a] border border-white/10 rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-bold text-white"
                                                        value={formData.category}
                                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                                    >
                                                        <option value="Limpieza" className="bg-[#1a1a1a] text-white">Limpieza</option>
                                                        <option value="Comida / Insumos" className="bg-[#1a1a1a] text-white">Comida / Insumos</option>
                                                        <option value="Reparaciones" className="bg-[#1a1a1a] text-white">Reparaciones</option>
                                                        <option value="Servicios Públicos" className="bg-[#1a1a1a] text-white">Servicios Públicos</option>
                                                        <option value="Nómina" className="bg-[#1a1a1a] text-white">Nómina</option>
                                                        <option value="Otros" className="bg-[#1a1a1a] text-white">Otros</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Concepto del Gasto</label>
                                                <textarea
                                                    required
                                                    rows={3}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                                                    placeholder="¿Para qué es este dinero?"
                                                    value={formData.concept}
                                                    onChange={e => setFormData({ ...formData, concept: e.target.value })}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Cantidad en Letras</label>
                                                <input
                                                    required
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm italic"
                                                    placeholder="Ej: Cincuenta mil pesos m/cte"
                                                    value={formData.amount_in_words}
                                                    onChange={e => setFormData({ ...formData, amount_in_words: e.target.value })}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Firma Digital</label>
                                                <div className="relative bg-white rounded-2xl overflow-hidden border-2 border-primary/20 h-48">
                                                    <canvas
                                                        ref={canvasRef}
                                                        width={400}
                                                        height={180}
                                                        className="w-full h-full cursor-crosshair touch-none"
                                                        onMouseDown={startDrawing}
                                                        onMouseMove={draw}
                                                        onMouseUp={stopDrawing}
                                                        onMouseOut={stopDrawing}
                                                        onTouchStart={startDrawing}
                                                        onTouchMove={draw}
                                                        onTouchEnd={stopDrawing}
                                                    />
                                                    {signature && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="absolute top-2 right-2 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                                            onClick={clearSignature}
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" /> Borrar Firma
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full h-20 text-xl font-black uppercase tracking-widest bg-primary text-black hover:bg-primary/90 shadow-2xl shadow-primary/20 rounded-3xl"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-6 h-6 animate-spin mr-3" />
                                                PROCESANDO...
                                            </>
                                        ) : (
                                            "GUARDAR COMPROBANTE"
                                        )}
                                    </Button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
