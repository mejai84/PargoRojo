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
    DollarSign,
    Scale,
    ArrowLeft,
    HandCoins,
    Banknote,
    Receipt,
    BadgeCheck,
    AlertTriangle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import Link from "next/link"

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
    { value: 100000, color: "bg-purple-100 text-purple-700 border-purple-200" },
    { value: 50000, color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
    { value: 20000, color: "bg-orange-100 text-orange-700 border-orange-200" },
    { value: 10000, color: "bg-rose-100 text-rose-700 border-rose-200" },
    { value: 5000, color: "bg-slate-100 text-slate-700 border-slate-200" },
    { value: 2000, color: "bg-slate-100 text-slate-700 border-slate-200" },
    { value: 1000, color: "bg-amber-100 text-amber-700 border-amber-200" },
    { value: 500, color: "bg-slate-200 text-slate-600 border-slate-300", isCoin: true },
    { value: 200, color: "bg-slate-200 text-slate-600 border-slate-300", isCoin: true },
    { value: 100, color: "bg-slate-200 text-slate-600 border-slate-300", isCoin: true },
    { value: 50, color: "bg-slate-200 text-slate-600 border-slate-300", isCoin: true }
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
                setStatus(posStatus)

                if (!posStatus.hasActiveShift) {
                    return router.push("/admin/cashier/start-shift")
                }
                if (!posStatus.hasOpenCashbox) {
                    return router.push("/admin/cashier/open-box")
                }

                await fetchDashboardData(posStatus.activeCashboxSession?.id)

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

        const { data: moves } = await supabase
            .from('cash_movements')
            .select('*')
            .eq('cashbox_session_id', sessionId)
            .order('created_at', { ascending: false })

        if (moves) {
            setMovements(moves as any)
            const opening = moves.find(m => m.movement_type === 'OPENING')?.amount || 0
            const sales = moves.filter(m => m.movement_type === 'SALE').reduce((acc, m) => acc + m.amount, 0)
            const incomes = moves.filter(m => m.movement_type === 'DEPOSIT').reduce((acc, m) => acc + m.amount, 0)
            const expenses = moves.filter(m => m.movement_type === 'WITHDRAWAL').reduce((acc, m) => acc + m.amount, 0)

            setBalance({
                total: Number(opening) + Number(sales) + Number(incomes) - Number(expenses),
                sales: Number(sales),
                incomes: Number(incomes),
                expenses: Number(expenses)
            })
        }
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
            alert("Movimiento registrado")
        } catch (error: any) {
            alert("Error: " + error.message)
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

            // Mostrar Reporte Z en lugar de solo salir
            setZReportData({
                systemAmount: result.systemAmount,
                countedAmount: modalData.amount,
                difference: result.difference,
                sales: balance.sales,
                expenses: balance.expenses
            })
            setModalOpen('z-report')

        } catch (e: any) {
            alert(e.message)
            setSubmittingModal(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-black">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
    )

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 font-sans selection:bg-primary selection:text-black relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-[1600px] mx-auto relative z-10">

                {/* HEADER */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                                <Wallet className="w-8 h-8 text-primary" />
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic">Control de <span className="text-primary">Caja</span></h1>
                            <div className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> SESIÓN ACTIVA
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/admin">
                            <Button variant="ghost" className="rounded-2xl h-14 font-black uppercase text-xs tracking-widest gap-2">
                                <ArrowLeft className="w-4 h-4" /> VOLVER
                            </Button>
                        </Link>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => fetchDashboardData(status?.activeCashboxSession?.id)}
                            disabled={refreshing}
                            className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 hover:bg-primary hover:text-black transition-all"
                        >
                            <RefreshCw className={cn("w-6 h-6", refreshing && "animate-spin")} />
                        </Button>
                    </div>
                </div>

                {/* MAIN GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT: ACTIONS & BALANCE */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-xl relative overflow-hidden group">
                            <div className="relative z-10">
                                <p className="text-xs font-black text-primary uppercase tracking-[0.3em] mb-4 italic">Saldo Total Estimado</p>
                                <h2 className="text-6xl font-black tracking-tighter italic text-slate-900">
                                    ${balance.total.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                                </h2>
                                <div className="mt-8 pt-8 border-t border-slate-100 flex justify-between">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Ventas Turno</p>
                                    <p className="text-xl font-black text-slate-900 italic tracking-tighter">${balance.sales.toLocaleString('es-CO')}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Button onClick={() => setModalOpen('income')} className="h-28 rounded-[2.5rem] bg-indigo-500 hover:bg-white hover:text-indigo-600 border border-transparent hover:border-indigo-200 text-white flex flex-col gap-2 shadow-xl shadow-indigo-500/20 transition-all font-black uppercase text-[10px] tracking-widest italic">
                                <Plus className="w-6 h-6" /> INGRESO
                            </Button>
                            <Button onClick={() => setModalOpen('expense')} className="h-28 rounded-[2.5rem] bg-rose-500 hover:bg-white hover:text-rose-600 border border-transparent hover:border-rose-200 text-white flex flex-col gap-2 shadow-xl shadow-rose-500/20 transition-all font-black uppercase text-[10px] tracking-widest italic">
                                <Minus className="w-6 h-6" /> EGRESO
                            </Button>
                            <Button onClick={() => { setBillCounts({}); setModalData(prev => ({ ...prev, amount: 0 })); setModalOpen('audit') }} className="h-24 rounded-[2rem] bg-indigo-50/50 hover:bg-white text-indigo-900 border border-indigo-100 flex flex-col gap-1 font-black uppercase text-[9px] tracking-widest italic col-span-1">
                                <Scale className="w-5 h-5" /> ARQUEO PARCIAL
                            </Button>
                            <Link href="/admin/cashier/close-shift" className="col-span-1">
                                <Button className="w-full h-24 rounded-[2rem] bg-white border border-slate-200 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all flex flex-col gap-1 font-black uppercase text-[9px] tracking-widest italic text-slate-900 shadow-lg">
                                    <Lock className="w-5 h-5" /> CERRAR TURNO
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* RIGHT: MOVEMENTS */}
                    <div className="lg:col-span-8">
                        <div className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-xl min-h-[600px] flex flex-col">
                            <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3 italic">
                                    <Clock className="w-5 h-5 text-primary" /> Historial
                                </h3>
                            </div>
                            <div className="overflow-auto flex-1 p-2">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-white sticky top-0 z-10">
                                        <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                            <th className="px-6 py-4">Tipo</th>
                                            <th className="px-6 py-4">Nota</th>
                                            <th className="px-6 py-4 text-right">Monto</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {movements.map((move) => (
                                            <tr key={move.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className={cn(
                                                        "px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest border",
                                                        move.movement_type === 'SALE' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                            move.movement_type === 'WITHDRAWAL' ? "bg-rose-50 text-rose-600 border-rose-100" :
                                                                "bg-indigo-50 text-indigo-600 border-indigo-100"
                                                    )}>{move.movement_type}</span>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-bold text-slate-600 uppercase italic">{move.description}</td>
                                                <td className="px-6 py-4 text-right font-black italic text-slate-900">${move.amount.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* I/O MODALS */}
                {modalOpen && (modalOpen === 'income' || modalOpen === 'expense') && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
                        <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 space-y-6 shadow-2xl animate-in zoom-in-95">
                            <h2 className="text-2xl font-black uppercase italic text-slate-900 text-center">Registrar {modalOpen === 'income' ? 'Ingreso' : 'Egreso'}</h2>
                            <input
                                autoFocus
                                type="number"
                                className="w-full h-20 bg-slate-50 rounded-2xl text-center text-4xl font-black italic text-slate-900 border-2 border-slate-100 focus:border-primary outline-none"
                                placeholder="$0"
                                value={modalData.amount || ''}
                                onChange={e => setModalData({ ...modalData, amount: parseFloat(e.target.value) || 0 })}
                            />
                            <textarea
                                className="w-full h-24 bg-slate-50 rounded-2xl p-4 font-bold text-slate-600 border border-slate-100 outline-none resize-none"
                                placeholder="Motivo..."
                                value={modalData.reason}
                                onChange={e => setModalData({ ...modalData, reason: e.target.value })}
                            />
                            <div className="flex gap-3">
                                <Button variant="ghost" className="flex-1 h-14 rounded-xl font-black uppercase tracking-widest" onClick={() => setModalOpen(null)}>Cancelar</Button>
                                <Button disabled={submittingModal} className="flex-1 h-14 rounded-xl bg-slate-900 text-white font-black uppercase tracking-widest" onClick={handleMovement}>Confirmar</Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* CALCULATOR & BLIND CLOSE MODAL */}
                {(modalOpen === 'close' || modalOpen === 'audit') && (
                    <div className="fixed inset-0 z-[60] bg-slate-900 flex items-center justify-center p-4 animate-in fade-in duration-300">
                        <div className="w-full max-w-5xl h-[90vh] bg-white rounded-[3rem] overflow-hidden flex flex-col md:flex-row shadow-2xl animate-in slide-in-from-bottom-10">

                            {/* Left: Calculator */}
                            <div className="flex-1 bg-slate-50 p-8 overflow-y-auto custom-scrollbar border-r border-slate-100">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200"><HandCoins className="w-6 h-6 text-slate-400" /></div>
                                    <div>
                                        <h2 className="text-xl font-black uppercase italic text-slate-900">Arqueo de Efectivo</h2>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ingresa la cantidad de billetes</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {DENOMINATIONS.map(d => (
                                        <div key={d.value} className={cn("p-4 rounded-3xl border flex items-center justify-between gap-4 transition-all hover:shadow-md", d.color)}>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black uppercase opacity-50 tracking-widest">{d.isCoin ? 'Moneda' : 'Billete'}</span>
                                                <span className="text-2xl font-black italic tracking-tighter">${d.value.toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center gap-3 bg-white/50 p-1 rounded-2xl backdrop-blur-sm">
                                                <button onClick={() => updateBillCount(d.value, -1)} className="w-10 h-10 rounded-xl bg-white hover:bg-rose-100 flex items-center justify-center text-rose-600 transition-colors shadow-sm"><Minus className="w-4 h-4 font-bold" /></button>
                                                <span className="w-8 text-center font-black text-xl italic text-slate-900">{billCounts[d.value] || 0}</span>
                                                <button onClick={() => updateBillCount(d.value, 1)} className="w-10 h-10 rounded-xl bg-white hover:bg-emerald-100 flex items-center justify-center text-emerald-600 transition-colors shadow-sm"><Plus className="w-4 h-4 font-bold" /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right: Summary & Action */}
                            <div className="w-full md:w-[400px] p-8 flex flex-col bg-white">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-sm font-black uppercase italic text-slate-400 tracking-widest">Resumen</h3>
                                    <Button variant="ghost" size="icon" onClick={() => setModalOpen(null)}><ArrowLeft className="w-5 h-5" /></Button>
                                </div>

                                <div className="flex-1 flex flex-col justify-center space-y-6">
                                    <div className="text-center">
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Total Contado</p>
                                        <h2 className="text-6xl font-black italic tracking-tighter text-slate-900">${calculatedTotal.toLocaleString()}</h2>
                                    </div>

                                    {/* BLIND CLOSE WARNING */}
                                    <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 text-center">
                                        <Lock className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-50" />
                                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest leading-relaxed">
                                            MODO CIERRE CIEGO ACTIVO
                                            <br /><span className="opacity-60">El saldo del sistema está oculto por seguridad.</span>
                                        </p>
                                    </div>

                                    <textarea
                                        className="w-full h-32 bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-sm outline-none resize-none"
                                        placeholder="Observaciones finales del arqueo..."
                                        value={modalData.reason}
                                        onChange={e => setModalData({ ...modalData, reason: e.target.value })}
                                    />
                                </div>

                                <div className="mt-8">
                                    {modalOpen === 'audit' ? (
                                        <Button
                                            disabled={submittingModal || calculatedTotal === 0}
                                            onClick={async () => {
                                                if (!status?.activeCashboxSession) return
                                                setSubmittingModal(true)
                                                try {
                                                    const { performPartialAudit } = await import("@/actions/pos")
                                                    const res = await performPartialAudit(status.activeCashboxSession.id, currentUser.id, calculatedTotal, modalData.reason)
                                                    alert(`Arqueo registrado. DIFERENCIA: $${res.difference.toLocaleString()}`)
                                                    setModalOpen(null)
                                                } catch (e: any) { alert(e.message) }
                                                finally { setSubmittingModal(false) }
                                            }}
                                            className="w-full h-20 rounded-[2rem] bg-indigo-600 text-white font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-600/20"
                                        >
                                            {submittingModal ? <Loader2 className="animate-spin" /> : "GUARDAR ARQUEO"}
                                        </Button>
                                    ) : (
                                        <Button
                                            disabled={submittingModal}
                                            onClick={handleCloseCashbox}
                                            className="w-full h-20 rounded-[2rem] bg-rose-600 text-white font-black uppercase tracking-widest hover:bg-rose-700 shadow-xl shadow-rose-600/20"
                                        >
                                            {submittingModal ? <Loader2 className="animate-spin" /> : "FINALIZAR TURNO"}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Z REPORT MODAL (SUCCESS/FAIL) */}
                {modalOpen === 'z-report' && zReportData && (
                    <div className="fixed inset-0 z-[70] bg-slate-900 flex items-center justify-center p-8 animate-in zoom-in-90 duration-500">
                        <div className="bg-white w-full max-w-md rounded-[3rem] p-10 text-center relative overflow-hidden shadow-2xl">
                            <div className={cn(
                                "absolute top-0 left-0 w-full h-2",
                                zReportData.difference === 0 ? "bg-emerald-500" : "bg-rose-500"
                            )} />

                            <div className="mb-8 flex justify-center">
                                {zReportData.difference === 0 ? (
                                    <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 animate-in bounce-in">
                                        <BadgeCheck className="w-12 h-12" />
                                    </div>
                                ) : (
                                    <div className="w-24 h-24 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 animate-pulse">
                                        <AlertTriangle className="w-12 h-12" />
                                    </div>
                                )}
                            </div>

                            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 mb-2">
                                {zReportData.difference === 0 ? "¡Cierre Perfecto!" : "Descuadre Detectado"}
                            </h2>
                            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mb-10">
                                {zReportData.difference === 0 ? "Tu caja está cuadrada al 100%" : "Se ha registrado la novedad"}
                            </p>

                            <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-8">
                                <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400">
                                    <span>Esperado</span>
                                    <span>${zReportData.systemAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-900">
                                    <span>Contado</span>
                                    <span>${zReportData.countedAmount.toLocaleString()}</span>
                                </div>
                                <div className={cn("flex justify-between text-lg font-black uppercase tracking-tighter pt-4 border-t border-slate-200",
                                    zReportData.difference === 0 ? "text-emerald-600" : "text-rose-600")}>
                                    <span>Diferencia</span>
                                    <span>{zReportData.difference > 0 ? '+' : ''}${zReportData.difference.toLocaleString()}</span>
                                </div>
                            </div>

                            <Button
                                onClick={() => router.push('/admin')}
                                className="w-full h-16 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest hover:scale-105 transition-all"
                            >
                                SALIR DEL SISTEMA
                            </Button>
                        </div>
                    </div>
                )}

            </div>
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 0px; }
            `}</style>
        </div>
    )
}
