"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
    Wallet,
    CreditCard,
    Smartphone,
    QrCode,
    ArrowRight,
    Lock,
    Clock,
    User as UserIcon,
    AlertCircle,
    Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

export default function OpenCashPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [observations, setObservations] = useState("")
    const [pin, setPin] = useState("")
    const [amounts, setAmounts] = useState({
        cash: 0,
        card: 0,
        transfer: 0,
        qr: 0
    })

    useEffect(() => {
        const checkExistingShift = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return router.push("/login")

            const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
            setCurrentUser(profile)

            // Check if user already has an open shift
            const { data: openShift } = await supabase
                .from('cash_shifts')
                .select('*')
                .eq('user_id', session.user.id)
                .eq('status', 'open')
                .single()

            if (openShift) {
                router.push("/admin/cashier")
            }
            setLoading(false)
        }

        checkExistingShift()
    }, [router])

    const handleOpenCash = async (e: React.FormEvent) => {
        e.preventDefault()
        if (amounts.cash < 0) return alert("El monto no puede ser negativo")

        setSubmitting(true)
        try {
            // 1. Create Shift
            const { data: shift, error: shiftError } = await supabase
                .from('cash_shifts')
                .insert([{
                    user_id: currentUser.id,
                    status: 'open',
                    opening_notes: observations,
                    opening_date: new Date().toISOString()
                }])
                .select()
                .single()

            if (shiftError) throw shiftError

            // 2. Create Balances
            const balancesToInsert = Object.entries(amounts).map(([method, amount]) => ({
                shift_id: shift.id,
                payment_method: method,
                initial_amount: amount,
                final_system_amount: amount
            }))

            const { error: balanceError } = await supabase.from('shift_balances').insert(balancesToInsert)
            if (balanceError) throw balanceError

            // 3. Create Opening Movement for Cash
            if (amounts.cash > 0) {
                await supabase.from('cash_movements').insert([{
                    shift_id: shift.id,
                    type: 'opening',
                    amount: amounts.cash,
                    payment_method: 'cash',
                    reason: 'Saldo inicial de apertura',
                    created_by: currentUser.id
                }])
            }

            alert("Caja abierta exitosamente ✅")
            router.push("/admin/cashier")
        } catch (error: any) {
            alert("Error al abrir caja: " + error.message)
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-black">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
    )

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans selection:bg-primary selection:text-black">
            <div className="max-w-4xl mx-auto py-10">
                {/* Header Premium */}
                <div className="text-center mb-12 space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-4">
                        <Lock className="w-3 h-3" /> Control de Seguridad
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase italic">
                        Apertura de <span className="text-primary">Caja</span>
                    </h1>
                    <p className="text-gray-500 font-medium text-lg italic">Inicia el turno operativo para habilitar ventas</p>
                </div>

                <form onSubmit={handleOpenCash} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Columna Izquierda: Datos y Montos */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* Bloque 1: Operador */}
                        <div className="bg-[#111] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
                            <h3 className="text-xs font-black text-primary uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                <UserIcon className="w-4 h-4" /> Datos del Operador
                            </h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Usuario</label>
                                    <div className="h-14 bg-black border border-white/10 rounded-2xl flex items-center px-4 font-black text-white italic truncate">
                                        {currentUser?.full_name?.toUpperCase() || "CARGANDO..."}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Rol</label>
                                    <div className="h-14 bg-black border border-white/10 rounded-2xl flex items-center px-4 font-black text-primary italic uppercase">
                                        {currentUser?.role || "STAFF"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bloque 2: Fondos Iniciales */}
                        <div className="bg-[#111] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Wallet className="w-32 h-32" />
                            </div>
                            <h3 className="text-xs font-black text-primary uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                <Wallet className="w-4 h-4" /> Saldos Iniciales
                            </h3>

                            <div className="space-y-4">
                                {/* EFECTIVO (Principal) */}
                                <div className="group relative">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-2 text-primary z-10">
                                        <Wallet className="w-6 h-6" />
                                        <span className="font-black italic text-sm">EFECTIVO</span>
                                    </div>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        className="w-full h-24 bg-black border-2 border-white/10 group-focus-within:border-primary rounded-3xl pl-40 pr-8 outline-none text-4xl font-black text-right transition-all"
                                        value={amounts.cash || ""}
                                        onChange={e => setAmounts({ ...amounts, cash: parseFloat(e.target.value) || 0 })}
                                        required
                                        autoFocus
                                    />
                                </div>

                                {/* OTROS MEDIOS */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <div className="h-14 bg-black border border-white/10 rounded-2xl flex items-center px-3 gap-2 opacity-50 cursor-not-allowed">
                                            <CreditCard className="w-4 h-4" />
                                            <span className="text-[10px] font-black tracking-tight">TARJETA</span>
                                            <span className="ml-auto font-black text-xs">$0</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="h-14 bg-black border border-white/10 rounded-2xl flex items-center px-3 gap-2 opacity-50 cursor-not-allowed">
                                            <Smartphone className="w-4 h-4" />
                                            <span className="text-[10px] font-black tracking-tight">TRANSF.</span>
                                            <span className="ml-auto font-black text-xs">$0</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="h-14 bg-black border border-white/10 rounded-2xl flex items-center px-3 gap-2 opacity-50 cursor-not-allowed">
                                            <QrCode className="w-4 h-4" />
                                            <span className="text-[10px] font-black tracking-tight">QR / APP</span>
                                            <span className="ml-auto font-black text-xs">$0</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-500 italic mt-2">
                                    * Normalmente solo el efectivo inicia con fondo de cambio.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Columna Derecha: Observaciones y Acción */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="bg-[#111] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl h-full flex flex-col">
                            <h3 className="text-xs font-black text-primary uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Registro de Turno
                            </h3>

                            <div className="space-y-6 flex-1">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Observaciones de Apertura</label>
                                    <textarea
                                        className="w-full h-32 bg-black border border-white/10 rounded-3xl p-6 outline-none focus:border-primary/50 transition-all font-medium text-sm resize-none"
                                        placeholder="Ej: Iniciando turno tarde con base de cambio completa..."
                                        value={observations}
                                        onChange={e => setObservations(e.target.value)}
                                    />
                                </div>

                                <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 space-y-3">
                                    <div className="flex items-center gap-3 text-primary">
                                        <AlertCircle className="w-5 h-5 shrink-0" />
                                        <p className="text-xs font-bold leading-tight uppercase tracking-tighter italic">
                                            Al abrir caja, se habilita la toma de pedidos y facturación. Este proceso es auditable.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-1 pt-4">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">PIN DE AUTORIZACIÓN (Opcional)</label>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            maxLength={4}
                                            className="w-full h-16 bg-black border border-white/10 rounded-2xl px-6 outline-none focus:border-primary transition-all text-center tracking-[1em] font-black text-2xl"
                                            placeholder="••••"
                                            value={pin}
                                            onChange={e => setPin(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={submitting || amounts.cash < 0}
                                className={cn(
                                    "w-full h-24 mt-8 rounded-[2rem] text-2xl font-black uppercase tracking-[0.2em] italic transition-all group",
                                    (submitting || amounts.cash < 0)
                                        ? "bg-gray-800 text-gray-500"
                                        : "bg-primary text-black hover:bg-white hover:scale-[1.02] shadow-[0_0_30px_rgba(255,215,0,0.2)]"
                                )}
                            >
                                {submitting ? (
                                    <Loader2 className="w-8 h-8 animate-spin" />
                                ) : (
                                    <div className="flex items-center gap-4">
                                        ABRIR CAJA <ArrowRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
                                    </div>
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>

            <style jsx global>{`
                input::-webkit-outer-spin-button,
                input::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                input[type=number] {
                    -moz-appearance: textfield;
                }
            `}</style>
        </div>
    )
}
