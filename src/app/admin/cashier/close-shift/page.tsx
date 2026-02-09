"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import {
    Banknote,
    Coins,
    Calculator,
    ArrowRight,
    CheckCircle2,
    AlertTriangle,
    Loader2,
    CircleDollarSign,
    LogOut,
    Lock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatPrice, cn } from "@/lib/utils"
import { toast } from "sonner"

// Denominaciones Moneda Colombiana (COP)
const DENOMINATIONS = [
    { value: 100000, label: "$100.000", type: 'bill' },
    { value: 50000, label: "$50.000", type: 'bill' },
    { value: 20000, label: "$20.000", type: 'bill' },
    { value: 10000, label: "$10.000", type: 'bill' },
    { value: 5000, label: "$5.000", type: 'bill' },
    { value: 2000, label: "$2.000", type: 'bill' },
    { value: 1000, label: "$1.000", type: 'coin' },
    { value: 500, label: "$500", type: 'coin' },
    { value: 200, label: "$200", type: 'coin' },
    { value: 100, label: "$100", type: 'coin' },
    { value: 50, label: "$50", type: 'coin' },
]

export default function CloseShiftPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [step, setStep] = useState(1) // 1: Arqueo, 2: Resumen, 3: Éxito
    const [counts, setCounts] = useState<Record<number, number>>({})
    const [systemTotal, setSystemTotal] = useState(0) // Lo que el sistema espera (Ventas Cash + Base Inicial - Egresos)
    const [baseAmount, setBaseAmount] = useState(0)
    const [cashSales, setCashSales] = useState(0)
    const [cardSales, setCardSales] = useState(0)
    const [transferSales, setTransferSales] = useState(0)
    const [creditSales, setCreditSales] = useState(0)
    const [expenses, setExpenses] = useState(0)

    // Datos de Sesión
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [shiftId, setShiftId] = useState<string | null>(null)

    useEffect(() => {
        loadSessionData()
    }, [])

    const loadSessionData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // 1. Buscar Perfil y Turno Activo
            const { data: profile } = await supabase
                .from('profiles')
                .select('id, restaurant_id')
                .eq('id', user.id)
                .single()

            const { data: shift } = await supabase
                .from('shifts')
                .select('id')
                .eq('user_id', user.id)
                .is('ended_at', null)
                .single()

            if (!shift) {
                toast.error("No tienes un turno activo para cerrar")
                router.push('/admin/cashier/start-shift') // Redirigir a inicio
                return
            }
            setShiftId(shift.id)

            // 2. Buscar Sesión de Caja Activa
            const { data: session } = await supabase
                .from('cashbox_sessions')
                .select('*')
                .eq('user_id', user.id)
                .eq('status', 'OPEN')
                .maybeSingle()

            if (session) {
                setSessionId(session.id)
                setBaseAmount(session.opening_amount || 0)

                // 3. Calcular Ventas por Método de ESTA sesión
                const { data: orders } = await supabase
                    .from('orders')
                    .select('total, payment_method')
                    .gte('created_at', session.opened_at)
                    .eq('status', 'delivered')
                    .eq('payment_status', 'paid')

                const salesByMethod = (orders || []).reduce((acc: any, order) => {
                    const method = order.payment_method || 'cash'
                    acc[method] = (acc[method] || 0) + (order.total || 0)
                    return acc
                }, {})

                setCashSales(salesByMethod.cash || 0)
                setCardSales(salesByMethod.card || 0)
                setTransferSales(salesByMethod.transfer || 0)
                setCreditSales(salesByMethod.credit || 0)

                // 4. Calcular Egresos de Caja Menor de ESTA sesión
                const { data: vouchers } = await supabase
                    .from('petty_cash_vouchers')
                    .select('amount')
                    .gte('created_at', session.opened_at)
                    .eq('restaurant_id', profile?.restaurant_id)

                const calculatedExpenses = vouchers?.reduce((sum, v) => sum + (v.amount || 0), 0) || 0
                setExpenses(calculatedExpenses)

                // TOTAL ESPERADO EN CAJA (EL EFECTIVO)
                setSystemTotal((session.opening_amount || 0) + (salesByMethod.cash || 0) - calculatedExpenses)
                setLoading(false)
            } else {
                // Si no hay sesión de caja pero hay turno (raro), forzamos cierre de turno solamente
                setSystemTotal(0)
                setLoading(false)
            }

        } catch (error) {
            console.error("Error loading shift", error)
            setLoading(false)
        }
    }

    const handleCountChange = (denom: number, qty: string) => {
        const val = parseInt(qty) || 0
        setCounts(prev => ({ ...prev, [denom]: val }))
    }

    const calculatedTotal = DENOMINATIONS.reduce((sum, d) => sum + (d.value * (counts[d.value] || 0)), 0)
    const difference = calculatedTotal - systemTotal

    const handleCloseShift = async () => {
        if (!shiftId) return

        setLoading(true)
        try {
            const now = new Date().toISOString()
            const { data: { user } } = await supabase.auth.getUser()

            // 1. Cerrar Sesión de Caja (si existe)
            if (sessionId) {
                const { error: sessionError } = await supabase.from('cashbox_sessions').update({
                    status: 'CLOSED',
                    closing_time: now,
                    closing_amount: calculatedTotal,
                    system_amount: systemTotal,
                    closing_notes: "Cierre asistido por Smart Z-Report"
                }).eq('id', sessionId)

                if (sessionError) throw sessionError
            }

            // 2. Cerrar Turno
            const { error: shiftError } = await supabase.from('shifts').update({
                ended_at: now,
                status: 'CLOSED'
            }).eq('id', shiftId)

            if (shiftError) throw shiftError

            setStep(3) // Éxito
            toast.success("Turno y caja cerrados correctamente")
        } catch (error: any) {
            console.error("Error closing", error)
            toast.error("Error al cerrar el turno: " + (error.message || "Error desconocido"))
        } finally {
            setLoading(false)
        }
    }

    if (loading && step !== 3) {
        return <div className="h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
    }

    if (step === 3) {
        return (
            <div className="h-screen flex items-center justify-center bg-muted p-6">
                <div className="bg-card rounded-[3rem] p-12 text-center max-w-lg w-full shadow-2xl space-y-8 animate-in zoom-in duration-500">
                    <div className="w-32 h-32 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-16 h-16 text-emerald-600" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black italic uppercase tracking-tighter text-foreground mb-2">¡TURNO CERRADO!</h1>
                        <p className="text-muted-foreground font-medium">Todo ha quedado registrado correctamente.</p>
                    </div>

                    <div className="bg-muted/50 rounded-3xl p-8 border border-border space-y-4 text-left">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 italic">Resumen de Recaudación</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-[9px] font-bold text-muted-foreground uppercase">Efectivo (Cash)</p>
                                <p className="font-black text-foreground">{formatPrice(cashSales)}</p>
                            </div>
                            <div className="space-y-1 text-right">
                                <p className="text-[9px] font-bold text-muted-foreground uppercase">Tarjetas</p>
                                <p className="font-black text-foreground">{formatPrice(cardSales)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-bold text-muted-foreground uppercase">Transferencias</p>
                                <p className="font-black text-foreground">{formatPrice(transferSales)}</p>
                            </div>
                            <div className="space-y-1 text-right">
                                <p className="text-[9px] font-bold text-muted-foreground uppercase">Ventas Crédito</p>
                                <p className="font-black text-foreground">{formatPrice(creditSales)}</p>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-border flex justify-between items-center">
                            <span className="font-black text-sm uppercase italic">Diferencia Final</span>
                            <span className={cn("text-xl font-black italic", difference === 0 ? "text-emerald-500" : difference > 0 ? "text-blue-500" : "text-rose-500")}>
                                {difference > 0 ? '+' : ''}{formatPrice(difference)}
                            </span>
                        </div>
                    </div>

                    <Button onClick={() => window.location.href = '/login'} className="w-full h-16 text-xl font-black uppercase tracking-widest bg-primary text-primary-foreground rounded-2xl hover:bg-primary/90">
                        <LogOut className="w-6 h-6 mr-2" /> Salir del Sistema
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-muted pb-20 font-sans">
            {/* Header */}
            <div className="bg-card text-foreground p-8 rounded-b-[2.5rem] shadow-xl pt-12 pb-16 relative overflow-hidden">
                <div className="relative z-10 flex justify-between items-center max-w-4xl mx-auto">
                    <div>
                        <div className="flex items-center gap-2 text-primary/80 mb-1">
                            <Lock className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Cierre Seguro</span>
                        </div>
                        <h1 className="text-3xl font-black italic uppercase tracking-tighter">ARQUEO DE CAJA</h1>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Esperado en Caja</p>
                        <p className="text-2xl font-black text-foreground font-mono">{formatPrice(systemTotal)}</p>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 -mt-8 relative z-20 space-y-6">

                {/* 1. Calculadora de Billetes */}
                <div className="bg-card rounded-[2.5rem] p-8 shadow-sm border border-border animate-in slide-in-from-bottom-8 duration-700">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                        <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                            <Calculator className="w-6 h-6" />
                        </div>
                        <h2 className="text-lg font-black uppercase italic tracking-wide text-foreground">Conteo de Efectivo</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                        {/* Billetes */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2"><Banknote className="w-4 h-4" /> Billetes</h3>
                            {DENOMINATIONS.filter(d => d.type === 'bill').map((d) => (
                                <div key={d.value} className="flex items-center gap-4">
                                    <div className="w-24 text-right font-bold text-muted-foreground text-sm">{d.label}</div>
                                    <div className="flex-1 relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 font-bold">x</span>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            className="pl-8 text-right font-mono font-bold bg-muted border-border h-12 rounded-xl focus:ring-primary/20"
                                            value={counts[d.value] || ''}
                                            onChange={(e) => handleCountChange(d.value, e.target.value)}
                                        />
                                    </div>
                                    <div className="w-24 text-right font-bold text-foreground font-mono text-sm">
                                        {formatPrice(d.value * (counts[d.value] || 0)).replace('$ ', '')}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Monedas */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2"><Coins className="w-4 h-4" /> Monedas</h3>
                            {DENOMINATIONS.filter(d => d.type === 'coin').map((d) => (
                                <div key={d.value} className="flex items-center gap-4">
                                    <div className="w-24 text-right font-bold text-muted-foreground text-sm">{d.label}</div>
                                    <div className="flex-1 relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 font-bold">x</span>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            className="pl-8 text-right font-mono font-bold bg-muted border-border h-12 rounded-xl focus:ring-primary/20"
                                            value={counts[d.value] || ''}
                                            onChange={(e) => handleCountChange(d.value, e.target.value)}
                                        />
                                    </div>
                                    <div className="w-24 text-right font-bold text-foreground font-mono text-sm">
                                        {formatPrice(d.value * (counts[d.value] || 0)).replace('$ ', '')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-border flex justify-between items-center bg-muted/50 p-6 rounded-2xl">
                        <span className="text-sm font-black uppercase tracking-widest text-muted-foreground">Total Contado</span>
                        <span className="text-4xl font-black text-foreground tracking-tighter">{formatPrice(calculatedTotal)}</span>
                    </div>
                </div>

                {/* 2. Resumen y Acción */}
                <div className="bg-card rounded-[2.5rem] p-8 shadow-sm border border-border animate-in slide-in-from-bottom-8 duration-700 delay-100">
                    <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
                        <div className="flex-1 w-full space-y-2">
                            <div className="flex justify-between items-center p-4 rounded-xl bg-muted/50 border border-border">
                                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Esperado (Sistema)</span>
                                <span className="font-bold text-foreground">{formatPrice(systemTotal)}</span>
                            </div>
                            <div className={cn(
                                "flex justify-between items-center p-4 rounded-xl border",
                                difference === 0 ? "bg-emerald-50 border-emerald-100 text-emerald-700" :
                                    difference > 0 ? "bg-blue-50 border-blue-100 text-blue-700" : "bg-rose-50 border-rose-100 text-rose-700"
                            )}>
                                <span className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                    {difference === 0 ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                                    Diferencia
                                </span>
                                <span className="font-black text-lg">{formatPrice(difference)}</span>
                            </div>
                        </div>

                        <div className="w-full md:w-auto">
                            <Button
                                onClick={handleCloseShift}
                                disabled={calculatedTotal === 0}
                                className={cn(
                                    "h-20 px-12 rounded-2xl text-lg font-black uppercase tracking-widest italic shadow-xl transition-all w-full md:w-auto",
                                    difference === 0 ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20" :
                                        "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20"
                                )}
                            >
                                {difference === 0 ? 'Confirmar Cierre Perfecto' : 'Cerrar Turno con Diferencia'} <ArrowRight className="w-6 h-6 ml-3" />
                            </Button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
