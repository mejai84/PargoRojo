"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { getPosStatus, PosStatus } from "@/actions/pos"
import {
    Wallet,
    Plus,
    Minus,
    Lock,
    Clock,
    User as UserIcon,
    RefreshCw,
    Loader2,
    X,
    DollarSign,
    Scale,
    ArrowLeft,
    HandCoins,
    Banknote,
    Receipt,
    BadgeCheck,
    AlertTriangle,
    Zap,
    Signal,
    Activity,
    ChevronRight,
    Search,
    History,
    FileText,
    TrendingUp,
    TrendingDown,
    Calculator,
    Target
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"

// Types aligned with DB Schema
type Movement = {
    id: string
    movement_type: 'SALE' | 'REFUND' | 'DEPOSIT' | 'WITHDRAWAL' | 'OPENING'
    amount: number
    payment_method?: string
    description: string
    created_at: string
}

// Billetes colombianos para la calculadora
const DENOMINATIONS = [
    { value: 100000, color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
    { value: 50000, color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" },
    { value: 20000, color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
    { value: 10000, color: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
    { value: 5000, color: "bg-muted text-muted-foreground border-border" },
    { value: 2000, color: "bg-muted text-muted-foreground border-border" },
    { value: 1000, color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
    { value: 500, color: "bg-muted/50 text-muted-foreground/80 border-border/50", isCoin: true },
    { value: 200, color: "bg-muted/50 text-muted-foreground/80 border-border/50", isCoin: true },
    { value: 100, color: "bg-muted/50 text-muted-foreground/80 border-border/50", isCoin: true },
    { value: 50, color: "bg-muted/50 text-muted-foreground/80 border-border/50", isCoin: true }
]

export default function CashierPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [status, setStatus] = useState<PosStatus | null>(null)

    // Data State
    const [movements, setMovements] = useState<Movement[]>([])
    const [balance, setBalance] = useState({
        total: 0,
        sales: 0,
        expenses: 0,
        incomes: 0
    })

    // Modal State
    const [modalOpen, setModalOpen] = useState<'income' | 'expense' | 'audit' | 'close' | 'z-report' | null>(null)
    const [modalData, setModalData] = useState({
        amount: 0,
        reason: "",
        payment_method: 'CASH'
    })
    const [submittingModal, setSubmittingModal] = useState(false)

    // Estado calculadora de billetes
    const [billCounts, setBillCounts] = useState<Record<number, number>>({})

    // Estado Reporte Z
    const [zReportData, setZReportData] = useState<any>(null)

    // Initial Switchboard Logic
    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return router.push("/login")

            const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
            setCurrentUser(profile)

            try {
                const posStatus = await getPosStatus(user.id)
                console.log("POS Status:", posStatus)
                setStatus(posStatus)

                if (!posStatus.hasActiveShift) {
                    console.log("No active shift, redirecting...")
                    return router.push("/admin/cashier/start-shift")
                }
                if (!posStatus.hasOpenCashbox) {
                    console.log("No open cashbox, redirecting...")
                    return router.push("/admin/cashier/open-box")
                }

                if (posStatus.activeCashboxSession?.id) {
                    await fetchDashboardData(posStatus.activeCashboxSession.id)
                } else {
                    console.error("Missing session ID despite hasOpenCashbox being true")
                    router.push("/admin/cashier/open-box")
                }

            } catch (error) {
                console.error("Error validating POS status:", error)
            } finally {
                setLoading(false)
            }
        }
        init()
    }, [router])

    const fetchDashboardData = async (sessionId: string) => {
        setRefreshing(true)
        if (!sessionId) return

        const { data: movements, error: movementsError } = await supabase
            .from('cash_movements')
            .select('*')
            .eq('cashbox_session_id', sessionId)
            .order('created_at', { ascending: false })

        if (movementsError) {
            console.error("Error fetching movements:", movementsError)
            return
        }

        setMovements(movements || [])

        // Calcular balances
        const sales = (movements || []).filter(m => m.movement_type === 'SALE').reduce((acc, m) => acc + Number(m.amount), 0)
        const expenses = (movements || []).filter(m => m.movement_type === 'WITHDRAWAL').reduce((acc, m) => acc + Number(m.amount), 0)
        const partials = (movements || []).filter(m => m.movement_type === 'DEPOSIT').reduce((acc, m) => acc + Number(m.amount), 0)

        // Saldo inicial (opening_amount)
        const { data: session, error: sessionError } = await supabase
            .from('cashbox_sessions')
            .select('opening_amount')
            .eq('id', sessionId)
            .maybeSingle()

        if (sessionError) {
            console.error("Error fetching session:", sessionError)
        }

        const opening = Number(session?.opening_amount || 0)

        setBalance({
            total: opening + sales + partials - expenses,
            sales: sales,
            expenses: expenses,
            incomes: partials
        })
        setRefreshing(false)
    }

    // Funciones Calculadora
    const updateBillCount = (denom: number, delta: number) => {
        setBillCounts(prev => {
            const current = prev[denom] || 0
            const next = Math.max(0, current + delta)
            return { ...prev, [denom]: next }
        })
    }

    // Calcular total contado en tiempo real
    const calculatedTotal = Object.entries(billCounts).reduce((acc, [denom, count]) => acc + (Number(denom) * count), 0)

    // Sincronizar calculadora con modalData
    useEffect(() => {
        if (modalOpen === 'close' || modalOpen === 'audit') {
            setModalData(prev => ({ ...prev, amount: calculatedTotal }))
        }
    }, [calculatedTotal, modalOpen])

    const handleMovement = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!status?.activeCashboxSession || modalData.amount <= 0) return

        setSubmittingModal(true)
        try {
            const type = modalOpen === 'income' ? 'DEPOSIT' : 'WITHDRAWAL'
            const { error } = await supabase.from('cash_movements').insert({
                cashbox_session_id: status.activeCashboxSession.id,
                user_id: currentUser.id,
                movement_type: type,
                amount: modalData.amount,
                description: modalData.reason
            })

            if (error) throw error
            setModalOpen(null)
            setModalData({ amount: 0, reason: "", payment_method: 'CASH' })
            fetchDashboardData(status.activeCashboxSession.id)
            toast.success("Movimiento registrado con éxito")
        } catch (error: any) {
            toast.error("Error: " + error.message)
        } finally {
            setSubmittingModal(false)
        }
    }

    const handleCloseCashbox = async () => {
        if (!status?.activeCashboxSession) return
        setSubmittingModal(true)
        try {
            const { closeCashbox } = await import("@/actions/pos")
            const result = await closeCashbox(
                status.activeCashboxSession.id,
                currentUser.id,
                modalData.amount, // Viene de la calculadora
                modalData.reason
            )

            setZReportData({
                systemAmount: result.systemAmount,
                countedAmount: modalData.amount,
                difference: result.difference,
                sales: balance.sales,
                expenses: balance.expenses
            })
            setModalOpen('z-report')

        } catch (e: any) {
            toast.error(e.message)
            setSubmittingModal(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-transparent">
            <div className="flex flex-col items-center gap-8 animate-in fade-in duration-1000">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
                    <Loader2 className="w-16 h-16 text-primary animate-spin relative z-10" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary italic animate-pulse">Sincronizando Terminal de Caja...</p>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-transparent text-foreground p-4 md:p-12 font-sans selection:bg-primary selection:text-primary-foreground relative overflow-hidden">

            {/* 🌌 AMBIANCE LAYER */}
            <div className="fixed top-0 left-0 w-full h-[600px] bg-gradient-to-b from-primary/10 via-primary/[0.02] to-transparent pointer-events-none z-0" />
            <div className="fixed -bottom-40 -left-40 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none opacity-20 z-0 animate-pulse" />

            <div className="max-w-[1600px] mx-auto space-y-16 animate-in fade-in duration-1000 relative z-10">

                {/* 🏦 CASHIER COMMAND HEADER */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-12 border-b border-border/50 pb-12">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-10">
                        <Link href="/admin">
                            <Button variant="ghost" size="icon" className="h-20 w-20 rounded-[2.5rem] bg-card border border-border shadow-3xl hover:bg-muted active:scale-90 transition-all group overflow-hidden relative">
                                <ArrowLeft className="w-10 h-10 group-hover:-translate-x-1 transition-transform relative z-10" />
                            </Button>
                        </Link>
                        <div className="space-y-6">
                            <div className="flex flex-wrap items-center gap-4">
                                <h1 className="text-6xl md:text-7xl font-black italic tracking-tighter uppercase leading-none text-foreground">CONTROL <span className="text-primary italic">CAJA</span></h1>
                                <div className="px-5 py-2 bg-emerald-500/10 border-2 border-emerald-500/20 rounded-[1.5rem] text-[11px] font-black text-emerald-500 tracking-[0.3em] italic uppercase shadow-xl animate-pulse flex items-center gap-3">
                                    <Activity className="w-3 h-3" />
                                    SESIÓN ACTIVA_HUB_01
                                </div>
                            </div>
                            <p className="text-[11px] text-muted-foreground font-black uppercase tracking-[0.5em] italic flex items-center gap-4 opacity-60">
                                <Wallet className="w-5 h-5 text-primary" /> Maestro de Movimientos, Flujo de Efectivo & Auditoría de Turno
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden lg:flex flex-col items-end gap-2 px-8 border-r border-border/50">
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest italic leading-none">TERMINAL OPERATOR</p>
                            <p className="text-xl font-black italic text-foreground tracking-tighter uppercase leading-none">{currentUser?.full_name}</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => fetchDashboardData(status?.activeCashboxSession?.id)}
                            disabled={refreshing}
                            className="w-20 h-20 rounded-[2.5rem] bg-card border border-border hover:bg-muted hover:text-primary transition-all shadow-3xl group"
                        >
                            <RefreshCw className={cn("w-8 h-8 group-hover:rotate-180 transition-transform duration-700", refreshing && "animate-spin")} />
                        </Button>
                    </div>
                </div>

                {/* 📊 CORE BALANCE GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* LEFT: FINANCIAL STATUS CARD */}
                    <div className="lg:col-span-4 space-y-12 animate-in slide-in-from-left-12 duration-1000">
                        <div className="bg-foreground rounded-[4.5rem] p-12 shadow-[0_50px_100px_rgba(0,0,0,0.5)] relative overflow-hidden group/bal">
                            <div className="absolute top-0 right-0 p-12 opacity-[0.05] pointer-events-none -mr-8 -mt-8 group-hover/bal:scale-110 transition-transform duration-1000 rotate-12">
                                <Banknote className="w-64 h-64 text-white" />
                            </div>

                            <div className="space-y-8 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-black shadow-2xl">
                                        <Wallet className="w-6 h-6" />
                                    </div>
                                    <p className="text-[11px] font-black text-primary uppercase tracking-[0.4em] italic leading-none">SALDO ESTIMADO</p>
                                </div>
                                <h2 className="text-7xl font-black italic tracking-tighter text-background leading-none drop-shadow-2xl">
                                    {balance.total.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                                </h2>

                                <div className="grid grid-cols-2 gap-6 pt-10 border-t border-white/10">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 opacity-40">
                                            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                                            <p className="text-[9px] font-black text-white uppercase tracking-widest italic">VENTAS BRUTAS</p>
                                        </div>
                                        <p className="text-2xl font-black italic text-white tracking-tighter">{balance.sales.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 opacity-40">
                                            <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                                            <p className="text-[9px] font-black text-white uppercase tracking-widest italic">GASTOS OPERATIVOS</p>
                                        </div>
                                        <p className="text-2xl font-black italic text-white tracking-tighter">{balance.expenses.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* QUICK COMMANDS */}
                        <div className="grid grid-cols-2 gap-8">
                            <Button
                                onClick={() => setModalOpen('income')}
                                className="h-32 rounded-[3.5rem] bg-card border border-border hover:bg-primary/5 hover:border-primary/40 transition-all flex flex-col gap-4 shadow-3xl group active:scale-95 border-none"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                    <Plus className="w-7 h-7" />
                                </div>
                                <span className="font-black uppercase text-[10px] tracking-[0.3em] italic text-foreground">INGRESO CAJA</span>
                            </Button>
                            <Button
                                onClick={() => setModalOpen('expense')}
                                className="h-32 rounded-[3.5rem] bg-card border border-border hover:bg-primary/5 hover:border-primary/40 transition-all flex flex-col gap-4 shadow-3xl group active:scale-95 border-none"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
                                    <Minus className="w-7 h-7" />
                                </div>
                                <span className="font-black uppercase text-[10px] tracking-[0.3em] italic text-foreground">EGRESO CAJA</span>
                            </Button>
                            <Button
                                onClick={() => { setBillCounts({}); setModalData(prev => ({ ...prev, amount: 0 })); setModalOpen('audit') }}
                                className="h-28 rounded-[3rem] bg-card border border-border hover:bg-indigo-500/10 hover:border-indigo-500/40 transition-all flex flex-col gap-3 shadow-3xl group active:scale-95 border-none"
                            >
                                <Scale className="w-6 h-6 text-indigo-500 group-hover:scale-110 transition-transform" />
                                <span className="font-black uppercase text-[9px] tracking-[0.3em] italic text-foreground">ARQUEO PARCIAL</span>
                            </Button>
                            <Link href="/admin/cashier/close-shift" className="col-span-1">
                                <Button className="w-full h-28 rounded-[3rem] bg-card border border-border hover:bg-rose-500/10 hover:border-rose-500/40 transition-all flex flex-col gap-3 shadow-3xl group active:scale-95 border-none">
                                    <Lock className="w-6 h-6 text-rose-500 group-hover:scale-110 transition-transform" />
                                    <span className="font-black uppercase text-[9px] tracking-[0.3em] italic text-foreground">CERRAR TURNO</span>
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* RIGHT: MOVEMENTS LOG HUB */}
                    <div className="lg:col-span-8 animate-in slide-in-from-right-12 duration-1000">
                        <div className="bg-card border border-border rounded-[4.5rem] shadow-3xl min-h-[700px] flex flex-col relative overflow-hidden group/log transition-all hover:border-primary/20">
                            <div className="absolute top-0 right-0 p-16 opacity-[0.03] pointer-events-none -mr-12 -mt-12 group-hover/log:scale-110 transition-all duration-1000">
                                <History className="w-[600px] h-[600px]" />
                            </div>

                            <div className="p-12 border-b border-border/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
                                <div className="space-y-1 border-l-8 border-primary px-8">
                                    <h3 className="text-3xl font-black text-foreground uppercase tracking-tighter italic leading-none">Matriz de Movimientos</h3>
                                    <p className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.4em] italic leading-none">CHRONOLOGICAL TRANSACTION LEDGER</p>
                                </div>
                                <div className="relative group/search">
                                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within/search:text-primary transition-colors" />
                                    <input
                                        type="search"
                                        autoComplete="new-password"
                                        onChange={(e) => {
                                            if (e.target.value.length > 3) {
                                                // toast.info(`Filtrando por: ${e.target.value}`)
                                            }
                                        }}
                                        placeholder="BUSCAR MOVIMIENTO..."
                                        className="h-16 w-[300px] bg-muted/40 border border-border rounded-[2rem] pl-16 pr-8 outline-none focus:border-primary font-black italic text-[10px] tracking-[0.2em] uppercase transition-all shadow-inner"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 relative z-10 overflow-hidden">
                                <div className="h-full overflow-y-auto custom-scrollbar p-6">
                                    <div className="space-y-4">
                                        {movements.map((move) => (
                                            <div key={move.id} className="group/row bg-muted/20 border border-border/40 rounded-[2.5rem] p-8 flex items-center justify-between hover:bg-muted/40 hover:border-primary/20 transition-all active:scale-[0.99] cursor-default">
                                                <div className="flex items-center gap-8">
                                                    <div className={cn(
                                                        "w-16 h-16 rounded-2xl flex items-center justify-center transition-all shadow-2xl group-hover/row:scale-110",
                                                        move.movement_type === 'SALE' ? "bg-emerald-500 text-white" :
                                                            move.movement_type === 'WITHDRAWAL' ? "bg-rose-500 text-white" :
                                                                "bg-primary text-black"
                                                    )}>
                                                        {move.movement_type === 'SALE' ? <Receipt className="w-8 h-8" /> :
                                                            move.movement_type === 'WITHDRAWAL' ? <TrendingDown className="w-8 h-8" /> :
                                                                <TrendingUp className="w-8 h-8" />}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-4">
                                                            <span className={cn(
                                                                "text-[9px] font-black uppercase tracking-widest italic leading-none",
                                                                move.movement_type === 'SALE' ? "text-emerald-500" :
                                                                    move.movement_type === 'WITHDRAWAL' ? "text-rose-500" :
                                                                        "text-primary"
                                                            )}>{move.movement_type}</span>
                                                            <span className="text-[9px] font-black text-muted-foreground uppercase opacity-30 italic">{new Date(move.created_at).toLocaleTimeString()}</span>
                                                        </div>
                                                        <h4 className="text-xl font-black italic text-foreground uppercase tracking-tight group-hover/row:text-primary transition-colors underline-offset-4 decoration-primary/20">{move.description || 'CONCEPTO NO ESPECIFICADO'}</h4>
                                                    </div>
                                                </div>
                                                <div className="text-right space-y-1">
                                                    <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest italic leading-none">TOTAL NETO</p>
                                                    <p className={cn(
                                                        "text-3xl font-black italic tracking-tighter leading-none transition-all group-hover/row:scale-105",
                                                        move.movement_type === 'WITHDRAWAL' ? 'text-rose-500' : 'text-foreground group-hover/row:text-primary'
                                                    )}>
                                                        {move.movement_type === 'WITHDRAWAL' ? '-' : ''}${move.amount.toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}

                                        {movements.length === 0 && !refreshing && (
                                            <div className="py-32 flex flex-col items-center justify-center gap-8 border-4 border-dashed border-border/50 rounded-[4.5rem]">
                                                <History className="w-20 h-20 text-muted-foreground/10" />
                                                <div className="text-center space-y-3">
                                                    <p className="text-3xl font-black italic uppercase tracking-tighter text-muted-foreground/40">Sin Registros en Sesión</p>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/20 italic">EL KERNEL DE MOVIMIENTOS SE ENCUENTRA EN ESTADO VIRGINAL.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 🏷️ GLOBAL METRIC */}
                <div className="p-10 bg-foreground rounded-[4rem] text-background flex flex-col md:flex-row items-center justify-between shadow-3xl group/metric relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover/metric:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-10 relative z-10">
                        <div className="w-20 h-20 rounded-[2rem] bg-background/10 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-2xl group-hover/metric:rotate-12 transition-transform duration-500">
                            <Activity className="w-10 h-10 text-primary drop-shadow-[0_0_15px_rgba(255,77,0,0.6)]" />
                        </div>
                        <div className="space-y-2 text-center md:text-left">
                            <h4 className="text-2xl font-black italic uppercase tracking-tighter text-primary">Master POS Ledger</h4>
                            <p className="text-[10px] text-background/40 font-black uppercase tracking-[0.4em] italic leading-none">
                                SYSTEM v8.42 • KERNEL OPTIMIZED FOR CORE FINANCIAL OPERATIONS
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-12 mt-8 md:mt-0 relative z-10">
                        <div className="text-right">
                            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white/20 mb-1 italic">Throughput</p>
                            <p className="text-2xl font-black italic tracking-tighter text-emerald-500">99.8% STABLE</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white/20 mb-1 italic">Node Region</p>
                            <p className="text-2xl font-black italic tracking-tighter text-white">US-EAST_G1</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* I/O MODALS REFINED */}
            {modalOpen && (modalOpen === 'income' || modalOpen === 'expense') && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-card border-4 border-primary/20 rounded-[4.5rem] w-full max-w-2xl p-16 shadow-[0_0_100px_rgba(255,77,0,0.1)] relative overflow-hidden group/modal animate-in zoom-in-95 duration-500">
                        <div className="absolute top-0 right-0 p-16 opacity-[0.03] pointer-events-none -mr-16 -mt-16 group-hover/modal:scale-110 transition-transform duration-1000 rotate-12">
                            {modalOpen === 'income' ? <Plus className="w-[400px] h-[400px]" /> : <Minus className="w-[400px] h-[400px]" />}
                        </div>

                        <div className="flex justify-between items-start mb-16 relative z-10">
                            <div className="space-y-4">
                                <div className="flex items-center gap-5">
                                    <div className={cn(
                                        "w-16 h-16 rounded-2xl flex items-center justify-center shadow-3xl",
                                        modalOpen === 'income' ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                                    )}>
                                        {modalOpen === 'income' ? <TrendingUp className="w-8 h-8" /> : <TrendingDown className="w-8 h-8" />}
                                    </div>
                                    <h2 className="text-5xl font-black italic uppercase tracking-tighter text-foreground leading-none">
                                        REPORTE DE <span className={cn("italic", modalOpen === 'income' ? "text-emerald-500" : "text-rose-500")}> {modalOpen === 'income' ? 'INGRESO' : 'EGRESO'}</span>
                                    </h2>
                                </div>
                                <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.4em] italic pl-20 italic">REGISTRO DE FLUJO MANUAL EN KERNEL POS</p>
                            </div>
                            <Button variant="ghost" className="h-16 w-16 rounded-[1.5rem] bg-muted/40 hover:bg-primary hover:text-white transition-all active:scale-90" onClick={() => setModalOpen(null)}>
                                <X className="w-8 h-8" />
                            </Button>
                        </div>

                        <form onSubmit={handleMovement} className="space-y-12 relative z-10">
                            <div className="space-y-6 group/input">
                                <label className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.5em] ml-10 italic">TOTAL DEL MOVIMIENTO (COP)</label>
                                <div className="relative">
                                    <input
                                        autoFocus
                                        type="number"
                                        className="w-full h-32 bg-muted/30 border-4 border-border rounded-[3.5rem] px-12 outline-none focus:border-primary transition-all font-black text-7xl italic text-foreground tracking-tighter shadow-inner text-center"
                                        placeholder="0"
                                        value={modalData.amount || ''}
                                        onChange={e => setModalData({ ...modalData, amount: parseFloat(e.target.value) || 0 })}
                                    />
                                    <span className="absolute left-12 top-1/2 -translate-y-1/2 text-4xl font-black opacity-10 italic">$</span>
                                </div>
                            </div>
                            <div className="space-y-6 group/input">
                                <label className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.5em] ml-10 italic">PROTOCOLO DE JUSTIFICACIÓN</label>
                                <textarea
                                    className="w-full h-40 bg-muted/30 border-4 border-border rounded-[3.5rem] p-10 font-black text-lg italic text-foreground placeholder:text-muted-foreground/10 outline-none resize-none transition-all shadow-inner uppercase tracking-tight"
                                    placeholder="DEFINE EL ORIGEN O DESTINO DE LOS RECURSOS..."
                                    value={modalData.reason}
                                    onChange={e => setModalData({ ...modalData, reason: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-8">
                                <Button variant="ghost" className="flex-1 h-24 rounded-[2.5rem] font-black uppercase tracking-[0.5em] italic text-muted-foreground/40 hover:bg-muted/10" onClick={() => setModalOpen(null)}>ABORTAR</Button>
                                <Button disabled={submittingModal || modalData.amount <= 0} className="flex-[2] h-24 rounded-[2.5rem] bg-foreground text-background font-black uppercase tracking-[0.5em] italic hover:bg-primary hover:text-white transition-all shadow-3xl text-xl border-none">
                                    {submittingModal ? <Loader2 className="w-10 h-10 animate-spin" /> : 'AUTORIZAR REGISTRO'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CALCULATOR & ARQUEO MODAL REFINED */}
            {(modalOpen === 'close' || modalOpen === 'audit') && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-500">
                    <div className="w-full max-w-[1700px] h-[90vh] bg-card border-4 border-border/40 rounded-[5rem] overflow-hidden flex flex-col xl:flex-row shadow-[0_0_150px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom-20 duration-700 relative">

                        {/* Left Side: Calculator Mesh */}
                        <div className="flex-1 p-16 overflow-y-auto custom-scrollbar bg-black/20 relative group/calc">
                            <div className="absolute inset-0 bg-primary/2 opacity-0 group-hover/calc:opacity-100 transition-opacity" />

                            <div className="flex items-center gap-10 mb-20 relative z-10">
                                <div className="w-20 h-20 bg-primary rounded-[2rem] flex items-center justify-center text-black shadow-3xl">
                                    <Calculator className="w-10 h-10" />
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-5xl font-black italic uppercase tracking-tighter text-white">Kernel <span className="text-primary italic">Calculadora</span></h2>
                                    <p className="text-[11px] font-black text-primary/40 uppercase tracking-[0.6em] italic leading-none pl-2">PROTOCOLO DE ARQUEO FÍSICO DE DIVISAS</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 relative z-10">
                                {DENOMINATIONS.map(d => (
                                    <div key={d.value} className={cn(
                                        "bg-card border-4 border-white/5 p-8 rounded-[3.5rem] flex flex-col items-center justify-between gap-8 transition-all duration-500 hover:border-primary/40 hover:bg-primary/5 group/denom",
                                        d.color.split(' ')[0]
                                    )}>
                                        <div className="flex justify-between w-full opacity-40">
                                            <span className="text-[9px] font-black uppercase tracking-widest italic">{d.isCoin ? 'MONEDA_M0' : 'BILLETE_B0'}</span>
                                            <Signal className="w-4 h-4" />
                                        </div>
                                        <h3 className="text-4xl font-black italic tracking-tighter text-white group-hover/denom:scale-110 transition-transform">${d.value.toLocaleString()}</h3>
                                        <div className="flex items-center justify-between w-full bg-black/40 p-3 rounded-[2rem] shadow-inner">
                                            <button onClick={() => updateBillCount(d.value, -1)} className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center text-white/40 active:scale-75 shadow-lg"><Minus className="w-6 h-6" /></button>
                                            <span className="text-3xl font-black italic text-white/60 group-hover/denom:text-white transition-colors tabular-nums">{billCounts[d.value] || 0}</span>
                                            <button onClick={() => updateBillCount(d.value, 1)} className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center text-white/40 active:scale-75 shadow-lg"><Plus className="w-6 h-6" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Side: Control & Summary */}
                        <div className="xl:w-[500px] p-16 bg-card border-l-4 border-border/40 flex flex-col relative z-20 shadow-[-50px_0_100px_rgba(0,0,0,0.5)]">
                            <div className="absolute top-0 right-0 p-16 opacity-[0.03] pointer-events-none -mr-12 -mt-12 group-hover:scale-110 transition-all duration-1000">
                                <Target className="w-[500px] h-[500px]" />
                            </div>

                            <div className="flex justify-between items-center mb-20 relative z-10">
                                <h3 className="text-[11px] font-black uppercase text-white/20 tracking-[0.5em] italic">Resumen de Escaneo</h3>
                                <Button variant="ghost" size="icon" onClick={() => setModalOpen(null)} className="rounded-2xl h-16 w-16 bg-white/5 hover:bg-red-500 hover:text-white transition-all"><X className="w-8 h-8" /></Button>
                            </div>

                            <div className="flex-1 flex flex-col justify-center space-y-16 relative z-10">
                                <div className="text-center space-y-4 group/total">
                                    <p className="text-[11px] font-black text-primary uppercase tracking-[0.8em] italic leading-none pl-2 animate-pulse">TOTAL CONTADO</p>
                                    <h2 className="text-8xl font-black italic tracking-tighter text-white leading-none tabular-nums group-hover/total:scale-110 transition-transform duration-700">${calculatedTotal.toLocaleString()}</h2>
                                </div>

                                <div className="p-10 bg-amber-500/10 rounded-[4rem] border-4 border-amber-500/20 text-center space-y-6 shadow-3xl group/warn overflow-hidden relative">
                                    <div className="absolute inset-0 bg-amber-500/5 animate-pulse" />
                                    <Lock className="w-12 h-12 text-amber-500 mx-auto group-hover/warn:rotate-12 transition-transform relative z-10" />
                                    <div className="space-y-2 relative z-10">
                                        <p className="text-[12px] font-black text-amber-500 uppercase tracking-[0.4em] italic leading-none">CIERRE CIEGO ACTIVADO</p>
                                        <p className="text-[10px] font-black text-amber-500/40 uppercase italic leading-relaxed px-4">
                                            EL SISTEMA NO REVELARÁ EL SALDO TEÓRICO HASTA LA CONFIRMACIÓN FINAL PARA GARANTIZAR INTEGRIDAD FORENSE.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-6 group/notes">
                                    <label className="text-[11px] font-black text-white/20 uppercase tracking-[0.6em] ml-10 italic flex items-center gap-4 group-hover/notes:text-primary transition-colors">
                                        <FileText className="w-4 h-4" /> NOVEDADES OPERATIVAS
                                    </label>
                                    <textarea
                                        className="w-full h-48 bg-white/5 border-4 border-white/5 rounded-[4rem] p-10 font-black text-lg italic text-white placeholder:text-white/5 outline-none resize-none transition-all shadow-inner uppercase tracking-tight focus:border-primary/40"
                                        placeholder="REGISTRA FACTURAS, GASTOS MENORES O ANOMALÍAS..."
                                        value={modalData.reason}
                                        onChange={e => setModalData({ ...modalData, reason: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="mt-16 relative z-10">
                                {modalOpen === 'audit' ? (
                                    <Button
                                        disabled={submittingModal || calculatedTotal === 0}
                                        onClick={async () => {
                                            if (!status?.activeCashboxSession) return
                                            setSubmittingModal(true)
                                            try {
                                                const { performPartialAudit } = await import("@/actions/pos")
                                                const res = await performPartialAudit(status.activeCashboxSession.id, currentUser.id, calculatedTotal, modalData.reason)
                                                toast.success(`Arqueo registrado exitosamente. DIFERENCIA: $${res.difference.toLocaleString()}`)
                                                setModalOpen(null)
                                            } catch (e: any) { toast.error(e.message) }
                                            finally { setSubmittingModal(false) }
                                        }}
                                        className="w-full h-28 rounded-[3rem] bg-indigo-600 text-white font-black uppercase italic tracking-[0.4em] text-xl hover:bg-indigo-700 shadow-3xl shadow-indigo-600/30 transition-all active:scale-95 border-none group"
                                    >
                                        {submittingModal ? <Loader2 className="w-10 h-10 animate-spin" /> : (
                                            <>
                                                <BadgeCheck className="w-8 h-8 mr-6 group-hover:scale-110 transition-transform" /> EJECUTAR ARQUEO PARCIAL
                                            </>
                                        )}
                                    </Button>
                                ) : (
                                    <Button
                                        disabled={submittingModal}
                                        onClick={handleCloseCashbox}
                                        className="w-full h-28 rounded-[3rem] bg-rose-600 text-white font-black uppercase italic tracking-[0.4em] text-xl hover:bg-rose-700 shadow-3xl shadow-rose-600/30 transition-all active:scale-95 border-none group"
                                    >
                                        {submittingModal ? <Loader2 className="w-10 h-10 animate-spin" /> : (
                                            <>
                                                <PowerOff className="w-8 h-8 mr-6 group-hover:scale-110 transition-transform" /> SUBIR REPORTE Z Y CERRAR
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Z REPORT MODAL REFINED */}
            {modalOpen === 'z-report' && zReportData && (
                <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-[100px] flex items-center justify-center p-8 animate-in zoom-in-90 duration-700">
                    <div className="bg-card w-full max-w-2xl rounded-[6rem] p-20 text-center relative overflow-hidden shadow-[0_0_150px_rgba(0,0,0,0.8)] border-4 border-white/10 group/final">
                        <div className={cn(
                            "absolute top-0 left-0 w-full h-4",
                            zReportData.difference === 0 ? "bg-emerald-500 animate-pulse" : "bg-rose-500 animate-pulse"
                        )} />

                        <div className="mb-12 flex justify-center relative">
                            {zReportData.difference === 0 ? (
                                <div className="relative">
                                    <div className="absolute inset-0 bg-emerald-500 blur-3xl opacity-20 scale-150 animate-pulse" />
                                    <div className="w-32 h-32 bg-emerald-500 rounded-[3rem] flex items-center justify-center text-white shadow-3xl relative z-10 animate-in bounce-in">
                                        <BadgeCheck className="w-16 h-16" />
                                    </div>
                                </div>
                            ) : (
                                <div className="relative">
                                    <div className="absolute inset-0 bg-rose-500 blur-3xl opacity-20 scale-150 animate-pulse" />
                                    <div className="w-32 h-32 bg-rose-500 rounded-[3rem] flex items-center justify-center text-white shadow-3xl relative z-10 animate-in shake">
                                        <AlertTriangle className="w-16 h-16" />
                                    </div>
                                </div>
                            )}
                        </div>

                        <h2 className="text-6xl font-black uppercase italic tracking-tighter text-white mb-6 leading-none">
                            {zReportData.difference === 0 ? "PROTOCOLO <span className='text-emerald-500'>LIMPIO</span>" : "NOVEDAD EN <span className='text-rose-500'>CIERRE</span>"}
                        </h2>
                        <p className="text-white/20 font-black text-[12px] uppercase tracking-[0.4em] mb-16 italic px-10">
                            {zReportData.difference === 0 ? "SISTEMA FÍSICO Y LÓGICO EN PERFECTA SINCRONÍA. INTEGRIDAD FORENSE VERIFICADA." : "DISCREPANCIA DETECTADA EN EL FLUJO FÍSICO DE CAJA. SE HA GENERADO UNA ALERTA EN EL PANEL DE AUDITORÍA."}
                        </p>

                        <div className="space-y-6 bg-white/5 p-12 rounded-[4rem] border-4 border-white/5 mb-16 shadow-inner relative group/data">
                            <div className="absolute inset-0 bg-emerald-500/2 opacity-0 group-hover/data:opacity-100 transition-opacity" />
                            <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-[0.6em] text-white/20 italic">
                                <span>SALDO TEÓRICO_SESSION</span>
                                <span className="text-white tracking-tighter text-2xl">${zReportData.systemAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-[0.6em] text-white/20 italic">
                                <span>CONTEO FÍSICO_MANUAL</span>
                                <span className="text-white tracking-tighter text-2xl">${zReportData.countedAmount.toLocaleString()}</span>
                            </div>
                            <div className={cn("flex justify-between items-center text-4xl font-black uppercase tracking-tighter pt-8 border-t-4 border-white/5 italic",
                                zReportData.difference === 0 ? "text-emerald-500" : "text-rose-500")}>
                                <span className="text-[12px] tracking-[0.8em]">DIFERENCIA_NETA</span>
                                <span>{zReportData.difference > 0 ? '+' : ''}${zReportData.difference.toLocaleString()}</span>
                            </div>
                        </div>

                        <Button
                            onClick={() => router.push('/admin')}
                            className="w-full h-28 rounded-[3rem] bg-foreground text-background font-black uppercase italic tracking-[0.5em] hover:bg-primary hover:text-black transition-all hover:scale-105 active:scale-95 border-none text-2xl shadow-3xl relative group/exit overflow-hidden"
                        >
                            <div className="absolute inset-x-0 bottom-0 h-2 bg-primary/20 opacity-0 group-hover/exit:opacity-100 transition-opacity" />
                            LIBERAR TERMINAL POS
                        </Button>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,102,0,0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,102,0,0.3); }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .animate-shake { animation: shake 0.5s ease-in-out infinite; }
            `}</style>
        </div>
    )
}

function PowerOff(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M18.36 6.64A9 9 0 1 1 5.64 6.64" />
            <line x1="12" y1="2" x2="12" y2="12" />
        </svg>
    )
}
