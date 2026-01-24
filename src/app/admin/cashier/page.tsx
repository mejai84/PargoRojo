"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { getPosStatus, PosStatus } from "@/actions/pos"
import {
    Wallet,
    CreditCard,
    Smartphone,
    QrCode,
    Plus,
    Minus,
    Calculator,
    Lock,
    Clock,
    User as UserIcon,
    ArrowUpRight,
    ArrowDownRight,
    RefreshCw,
    Loader2,
    Ticket,
    DollarSign,
    Scale,
    Printer,
    Search,
    UserCheck,
    Star
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

// Types aligned with DB Schema
type Movement = {
    id: string
    movement_type: 'SALE' | 'REFUND' | 'DEPOSIT' | 'WITHDRAWAL' | 'OPENING'
    amount: number
    payment_method?: string
    description: string
    created_at: string
}

type CashboxSession = {
    id: string
    status: string
    opening_time: string
    opening_amount: number
    user_id: string
    shift_id: string
}

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
    const [modalOpen, setModalOpen] = useState<'income' | 'expense' | 'audit' | 'close' | null>(null)
    const [modalData, setModalData] = useState({
        amount: 0,
        reason: "",
        payment_method: 'CASH'
    })
    const [submittingModal, setSubmittingModal] = useState(false)

    // Initial Switchboard Logic
    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return router.push("/login")

            // Get User Profile
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
            setCurrentUser(profile)

            // Validate POS Status
            try {
                const posStatus = await getPosStatus(user.id)
                setStatus(posStatus)

                if (!posStatus.hasActiveShift) {
                    return router.push("/admin/cashier/start-shift")
                }
                if (!posStatus.hasOpenCashbox) {
                    return router.push("/admin/cashier/open-box")
                }

                // If all good, fetch dashboard data
                await fetchDashboardData(posStatus.activeCashboxSession?.id)

            } catch (error) {
                console.error("Error validating POS status:", error)
                alert("Error validando estado de caja. Refrescando...")
            } finally {
                setLoading(false)
            }
        }
        init()
    }, [router])

    const fetchDashboardData = async (sessionId: string) => {
        setRefreshing(true)
        if (!sessionId) return

        // 1. Fetch Movements
        const { data: moves } = await supabase
            .from('cash_movements')
            .select('*')
            .eq('cashbox_session_id', sessionId)
            .order('created_at', { ascending: false })

        if (moves) {
            setMovements(moves as any) // Type casting needed due to generated types mismatch sometimes

            // Calculate Balances
            const opening = moves.find(m => m.movement_type === 'OPENING')?.amount || 0
            const sales = moves.filter(m => m.movement_type === 'SALE').reduce((acc, m) => acc + m.amount, 0)
            const incomes = moves.filter(m => m.movement_type === 'DEPOSIT').reduce((acc, m) => acc + m.amount, 0)
            const expenses = moves.filter(m => m.movement_type === 'WITHDRAWAL').reduce((acc, m) => acc + m.amount, 0)

            // TODO: Sum payments from sale_payments table for accurate breakdown by method
            // For now assuming movements reflect cash flow primarily or we aggregate pos_sales later

            setBalance({
                total: opening + sales + incomes - expenses,
                sales,
                incomes,
                expenses
            })
        }
        setRefreshing(false)
    }

    const handleMovement = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!status?.activeCashboxSession || modalData.amount <= 0) return

        setSubmittingModal(true)
        try {
            const type = modalOpen === 'income' ? 'DEPOSIT' : 'WITHDRAWAL' // Map to DB types

            const { error } = await supabase.from('cash_movements').insert({
                cashbox_session_id: status.activeCashboxSession.id,
                user_id: currentUser.id,
                movement_type: type,
                amount: modalData.amount,
                description: modalData.reason,
                // payment_method: modalData.payment_method // Not in schema yet, adding to description or separate table?
                // For now, let's assume movements are strictly cash operational adjustments or add column if needed
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

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-black">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="ml-4 text-white font-bold">Verificando estado de caja...</p>
        </div>
    )

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans selection:bg-primary selection:text-black">
            <div className="max-w-[1600px] mx-auto">

                {/* HEADLINE */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl font-black tracking-tighter uppercase italic">Control de <span className="text-primary">Caja</span></h1>
                            <div className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> SESIÓN ACTIVA
                            </div>
                        </div>
                        <p className="text-gray-500 font-medium italic">Gestión operativa del turno actual</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{currentUser?.full_name}</p>
                            <p className="text-xs font-bold text-primary italic">INICIO: {new Date(status?.activeCashboxSession?.opening_time || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => fetchDashboardData(status?.activeCashboxSession?.id)}
                            disabled={refreshing}
                            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 hover:bg-primary hover:text-black transition-all"
                        >
                            <RefreshCw className={cn("w-5 h-5", refreshing && "animate-spin")} />
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* LEFT COL: STATS & ACTIONS */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* TOTAL BALANCE CARD */}
                        <div className="bg-[#111] border border-white/5 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
                            <div className="absolute -top-10 -right-10 opacity-5 group-hover:scale-110 transition-transform duration-700">
                                <DollarSign className="w-64 h-64 text-primary" />
                            </div>
                            <div className="relative z-10">
                                <p className="text-xs font-black text-primary uppercase tracking-[0.3em] mb-4 italic">Saldo Total Estimado</p>
                                <h2 className="text-6xl font-black tracking-tighter italic">
                                    ${balance.total.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                                </h2>
                                <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Ventas Turno</p>
                                        <p className="text-xl font-black text-white italic">${balance.sales.toLocaleString('es-CO')}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Movimientos</p>
                                        <p className="text-xl font-black text-white italic">{movements.length} <span className="text-[10px] text-gray-400 opacity-50">OPS</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ACTIONS GRID */}
                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                onClick={() => setModalOpen('income')}
                                className="h-28 rounded-[2rem] bg-indigo-500 hover:bg-white hover:text-black text-white flex flex-col gap-2 shadow-xl shadow-indigo-500/10 transition-all font-black uppercase text-xs tracking-widest italic group">
                                <Plus className="w-8 h-8 group-hover:scale-110 transition-transform" />
                                INGRESO
                            </Button>
                            <Button
                                onClick={() => setModalOpen('expense')}
                                className="h-28 rounded-[2rem] bg-rose-500 hover:bg-white hover:text-black text-white flex flex-col gap-2 shadow-xl shadow-rose-500/10 transition-all font-black uppercase text-xs tracking-widest italic group">
                                <Minus className="w-8 h-8 group-hover:scale-110 transition-transform" />
                                EGRESO
                            </Button>
                            <Button
                                disabled
                                className="h-24 rounded-[2rem] bg-white/5 border border-white/10 text-gray-500 cursor-not-allowed flex flex-col gap-1 font-black uppercase text-[10px] tracking-widest italic col-span-1">
                                <Scale className="w-6 h-6" /> ARQUEO (WIP)
                            </Button>
                            <Button
                                onClick={() => alert("Función de cierre en construcción. Usa 'Arqueo' pronto.")}
                                className="h-24 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-rose-600 hover:text-white transition-all flex flex-col gap-1 font-black uppercase text-[10px] tracking-widest italic col-span-1">
                                <Lock className="w-6 h-6" /> CERRAR CAJA
                            </Button>
                        </div>
                    </div>

                    {/* RIGHT COL: MOVEMENTS LIST */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="bg-[#111] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col min-h-[600px]">
                            <div className="p-8 border-b border-white/5 flex justify-between items-center">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-2 italic">
                                    <Clock className="w-4 h-4" /> Historial de Movimientos
                                </h3>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                            <th className="px-8 py-4">TIPO</th>
                                            <th className="px-8 py-4">DESCRIPCIÓN</th>
                                            <th className="px-8 py-4 text-right">MONTO</th>
                                            <th className="px-8 py-4 text-right">HORA</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {movements.map((move) => (
                                            <tr key={move.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="px-8 py-5">
                                                    <div className={cn(
                                                        "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter italic",
                                                        move.movement_type === 'SALE' ? "bg-emerald-500/10 text-emerald-400" :
                                                            move.movement_type === 'DEPOSIT' ? "bg-indigo-500/10 text-indigo-400" :
                                                                move.movement_type === 'WITHDRAWAL' ? "bg-rose-500/10 text-rose-400" :
                                                                    move.movement_type === 'OPENING' ? "bg-blue-500/10 text-blue-400" : "bg-gray-500/10 text-gray-400"
                                                    )}>
                                                        {move.movement_type}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <p className="text-xs font-bold text-white uppercase italic">{move.description || 'Sin descripción'}</p>
                                                </td>
                                                <td className="px-8 py-5 text-right font-black italic text-lg">
                                                    <span className={cn(
                                                        move.movement_type === 'WITHDRAWAL' ? "text-rose-500" : "text-emerald-400"
                                                    )}>
                                                        {move.movement_type === 'WITHDRAWAL' ? '-' : '+'}${move.amount.toLocaleString('es-CO')}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <span className="text-[10px] font-mono text-gray-500">
                                                        {new Date(move.created_at).toLocaleTimeString()}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {movements.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-8 py-20 text-center text-gray-500 italic text-sm">
                                                    No hay movimientos registrados en esta sesión.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* MODAL INGRESO/EGRESO */}
                {modalOpen && (modalOpen === 'income' || modalOpen === 'expense') && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="bg-[#111] w-full max-w-xl rounded-[2.5rem] border border-white/10 shadow-3xl overflow-hidden animate-in zoom-in-95 duration-300">
                            <form onSubmit={handleMovement} className="p-8 space-y-8">
                                <div className="text-center">
                                    <h2 className="text-3xl font-black uppercase tracking-tighter italic">
                                        Registrar <span className={modalOpen === 'income' ? "text-indigo-400" : "text-rose-400"}>
                                            {modalOpen === 'income' ? 'Ingreso' : 'Egreso'}
                                        </span>
                                    </h2>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Monto</label>
                                        <input
                                            type="number"
                                            autoFocus
                                            className="w-full h-20 bg-black border-2 border-white/10 focus:border-primary rounded-2xl px-6 outline-none text-4xl font-black text-center transition-all text-white"
                                            value={modalData.amount || ""}
                                            onChange={e => setModalData({ ...modalData, amount: parseFloat(e.target.value) || 0 })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Motivo</label>
                                        <textarea
                                            required
                                            className="w-full h-24 bg-black border border-white/10 rounded-2xl p-4 outline-none transition-all font-medium text-sm resize-none text-white"
                                            value={modalData.reason}
                                            onChange={e => setModalData({ ...modalData, reason: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <Button type="button" variant="ghost" onClick={() => setModalOpen(null)} className="flex-1 h-16 rounded-2xl font-black uppercase text-xs tracking-widest italic">
                                        CANCELAR
                                    </Button>
                                    <Button type="submit" disabled={submittingModal} className="flex-[2] h-16 rounded-2xl font-black uppercase text-sm tracking-[0.2em] italic bg-white text-black hover:bg-primary transition-all">
                                        {submittingModal ? <Loader2 className="w-6 h-6 animate-spin" /> : "CONFIRMAR"}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
