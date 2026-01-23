"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
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
    Scale
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { generateReceiptPDF } from "@/lib/utils/print-ticket"
import { Printer, Search, UserCheck, Star } from "lucide-react"

type Movement = {
    id: string
    type: 'sale' | 'income' | 'expense' | 'opening' | 'closing'
    amount: number
    payment_method: string
    reason: string
    created_at: string
}

type ShiftBalance = {
    payment_method: string
    initial_amount: number
    final_system_amount: number
    final_real_amount: number
}

type Shift = {
    id: string
    status: string
    opening_date: string
    opening_notes: string
    user_id: string
}

export default function CashierPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [shift, setShift] = useState<Shift | null>(null)
    const [balances, setBalances] = useState<ShiftBalance[]>([])
    const [movements, setMovements] = useState<Movement[]>([])
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [modalOpen, setModalOpen] = useState<'income' | 'expense' | 'audit' | 'close' | null>(null)
    const [auditStep, setAuditStep] = useState<1 | 2>(1)
    const [closingNotes, setClosingNotes] = useState("")
    const [closingPin, setClosingPin] = useState("")
    const [auditData, setAuditData] = useState({
        cash: 0,
        card: 0,
        transfer: 0,
        qr: 0
    })
    const [modalData, setModalData] = useState({
        amount: 0,
        reason: "",
        payment_method: 'cash'
    })
    const [submittingModal, setSubmittingModal] = useState(false)
    const [businessSettings, setBusinessSettings] = useState<any>(null)
    const [loyaltySettings, setLoyaltySettings] = useState<any>(null)

    // Loyalty State
    const [searchPhone, setSearchPhone] = useState("")
    const [foundCustomer, setFoundCustomer] = useState<any>(null)
    const [searchingCustomer, setSearchingCustomer] = useState(false)

    useEffect(() => {
        const fetchAllSettings = async () => {
            const { data } = await supabase.from('settings').select('*')
            if (data) {
                setBusinessSettings(data.find(s => s.key === 'business_info')?.value)
                setLoyaltySettings(data.find(s => s.key === 'tax_settings')?.value)
            }
        }
        fetchAllSettings()
    }, [])

    const handleCloseShift = async () => {
        if (!shift) return
        setSubmittingModal(true)
        try {
            // 1. Check for open orders (optional but recommended)
            const { count } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .in('status', ['pending', 'preparing'])

            if (count && count > 0) {
                alert(`No se puede cerrar caja. Hay ${count} pedido(s) pendientes en cocina.`)
                return
            }

            // 2. Finalize Shift
            const { error } = await supabase
                .from('cash_shifts')
                .update({
                    status: 'closed',
                    closing_date: new Date().toISOString(),
                    closing_notes: closingNotes
                })
                .eq('id', shift.id)

            if (error) throw error

            alert("Caja cerrada exitosamente. Generando reporte final...")
            router.push("/admin/cashier/open")
        } catch (error: any) {
            alert("Error al cerrar caja: " + error.message)
        } finally {
            setSubmittingModal(false)
        }
    }

    const handleAudit = async () => {
        if (!shift) return
        setSubmittingModal(true)
        try {
            // Update physical amounts in shift_balances
            for (const [method, amount] of Object.entries(auditData)) {
                const { error } = await supabase
                    .from('shift_balances')
                    .update({ final_real_amount: amount })
                    .eq('shift_id', shift.id)
                    .eq('payment_method', method)

                if (error) throw error
            }

            setAuditStep(2)
            fetchData()
        } catch (error: any) {
            alert("Error en arqueo: " + error.message)
        } finally {
            setSubmittingModal(false)
        }
    }

    const handleMovement = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!shift || modalData.amount <= 0) return

        setSubmittingModal(true)
        try {
            // 1. Create Movement
            const { error: moveError } = await supabase
                .from('cash_movements')
                .insert([{
                    shift_id: shift.id,
                    type: modalOpen,
                    amount: modalData.amount,
                    payment_method: modalData.payment_method,
                    reason: modalData.reason,
                    created_by: currentUser.id
                }])

            if (moveError) throw moveError

            // 2. Update Balance
            const currentBalance = balances.find(b => b.payment_method === modalData.payment_method)
            if (currentBalance) {
                const newAmount = modalOpen === 'income'
                    ? (currentBalance.final_system_amount || 0) + modalData.amount
                    : (currentBalance.final_system_amount || 0) - modalData.amount

                const { error: balanceError } = await supabase
                    .from('shift_balances')
                    .update({ final_system_amount: newAmount })
                    .eq('shift_id', shift.id)
                    .eq('payment_method', modalData.payment_method)

                if (balanceError) throw balanceError
            }

            setModalOpen(null)
            setModalData({ amount: 0, reason: "", payment_method: 'cash' })
            fetchData()
            alert("Movimiento registrado con éxito")
        } catch (error: any) {
            alert("Error: " + error.message)
        } finally {
            setSubmittingModal(false)
        }
    }

    const fetchData = async () => {
        setRefreshing(true)
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return router.push("/login")

        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        setCurrentUser(profile)

        // 1. Get Open Shift
        const { data: openShift } = await supabase
            .from('cash_shifts')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('status', 'open')
            .single()

        if (!openShift) {
            return router.push("/admin/cashier/open")
        }

        setShift(openShift)

        // 2. Get Balances
        const { data: balancesData } = await supabase
            .from('shift_balances')
            .select('*')
            .eq('shift_id', openShift.id)

        setBalances(balancesData || [])

        // 3. Get Recent Movements
        const { data: movementsData } = await supabase
            .from('cash_movements')
            .select('*')
            .eq('shift_id', openShift.id)
            .order('created_at', { ascending: false })
            .limit(10)

        setMovements(movementsData || [])

        setLoading(false)
        setRefreshing(false)
    }

    const handleSearchCustomer = async () => {
        if (!searchPhone) return
        setSearchingCustomer(true)
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('phone', searchPhone)
                .single()

            if (data) {
                setFoundCustomer(data)
            } else {
                alert("Cliente no encontrado")
                setFoundCustomer(null)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setSearchingCustomer(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [router])

    const totalBalance = balances.reduce((sum, b) => sum + (b.final_system_amount || 0), 0)
    const totalSales = movements.filter(m => m.type === 'sale').reduce((sum, m) => sum + m.amount, 0)
    const ticketCount = movements.filter(m => m.type === 'sale').length

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-black">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
    )

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans selection:bg-primary selection:text-black">
            <div className="max-w-[1600px] mx-auto">

                {/* 🔝 HEADER & STATUS */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl font-black tracking-tighter uppercase italic">Control de <span className="text-primary">Caja</span></h1>
                            <div className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> ABIERTA
                            </div>
                        </div>
                        <p className="text-gray-500 font-medium italic">Gestión operativa del turno actual</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{currentUser?.full_name}</p>
                            <p className="text-xs font-bold text-primary italic">TURNO: {new Date(shift?.opening_date || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={fetchData}
                            disabled={refreshing}
                            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 hover:bg-primary hover:text-black transition-all"
                        >
                            <RefreshCw className={cn("w-5 h-5", refreshing && "animate-spin")} />
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* 💰 LEFT COL: SALDO Y ACCIONES */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* CARD SALDO TOTAL */}
                        <div className="bg-[#111] border border-white/5 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
                            <div className="absolute -top-10 -right-10 opacity-5 group-hover:scale-110 transition-transform duration-700">
                                <DollarSign className="w-64 h-64 text-primary" />
                            </div>
                            <div className="relative z-10">
                                <p className="text-xs font-black text-primary uppercase tracking-[0.3em] mb-4 italic">Saldo Total en Caja</p>
                                <h2 className="text-6xl font-black tracking-tighter italic">
                                    ${totalBalance.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                                </h2>
                                <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Ventas Hoy</p>
                                        <p className="text-xl font-black text-white italic">${totalSales.toLocaleString('es-CO')}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Tickets</p>
                                        <p className="text-xl font-black text-white italic">{ticketCount} <span className="text-[10px] text-gray-400 opacity-50">UNITS</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* LOYALTY SEARCH CARD */}
                        <div className="bg-[#111] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] italic flex items-center gap-2">
                                    <Star className="w-4 h-4 text-yellow-500" /> Programa de Puntos
                                </h3>
                            </div>

                            {!foundCustomer ? (
                                <div className="space-y-4">
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input
                                            type="text"
                                            placeholder="Telefono del Cliente..."
                                            className="w-full h-14 bg-black border border-white/10 rounded-2xl pl-12 pr-4 outline-none focus:border-primary transition-all font-bold text-sm italic"
                                            value={searchPhone}
                                            onChange={e => setSearchPhone(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleSearchCustomer()}
                                        />
                                    </div>
                                    <Button
                                        onClick={handleSearchCustomer}
                                        disabled={searchingCustomer || !searchPhone}
                                        className="w-full h-12 bg-white text-black hover:bg-primary font-black uppercase text-[10px] tracking-widest italic rounded-xl"
                                    >
                                        {searchingCustomer ? <Loader2 className="w-4 h-4 animate-spin" /> : "BUSCAR CLIENTE"}
                                    </Button>
                                </div>
                            ) : (
                                <div className="p-6 bg-primary/5 border border-primary/20 rounded-3xl space-y-4 animate-in slide-in-from-top-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-xs font-black text-primary uppercase italic">{foundCustomer.full_name}</p>
                                            <p className="text-[10px] text-gray-500 font-mono">{foundCustomer.phone}</p>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-white" onClick={() => setFoundCustomer(null)}>
                                            <RefreshCw className="w-3 h-3" />
                                        </Button>
                                    </div>
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <span className="text-3xl font-black italic">{foundCustomer.loyalty_points || 0}</span>
                                            <span className="text-[10px] font-black uppercase text-gray-500 ml-2">Puntos</span>
                                        </div>
                                        <div className="px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded-lg text-[9px] font-black uppercase italic border border-yellow-500/20">
                                            Nivel Bronce
                                        </div>
                                    </div>
                                    <Button className="w-full h-10 bg-primary/20 hover:bg-primary text-primary hover:text-black font-black uppercase text-[10px] tracking-widest italic rounded-xl transition-all">
                                        RECOMPENSAR AHORA
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* ACCIONES CRÍTICAS */}
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
                                onClick={() => {
                                    setAuditStep(1)
                                    setAuditData({ cash: 0, card: 0, transfer: 0, qr: 0 })
                                    setModalOpen('audit')
                                }}
                                className="h-24 rounded-[2rem] bg-white/5 border border-white/10 hover:border-primary hover:text-primary transition-all flex flex-col gap-1 font-black uppercase text-[10px] tracking-widest italic col-span-1">
                                <Scale className="w-6 h-6" /> ARQUEO
                            </Button>
                            <Button
                                onClick={() => setModalOpen('close')}
                                className="h-24 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-rose-600 hover:text-white transition-all flex flex-col gap-1 font-black uppercase text-[10px] tracking-widest italic col-span-1">
                                <Lock className="w-6 h-6" /> CERRAR CAJA
                            </Button>
                        </div>
                    </div>

                    {/* 📊 RIGHT COL: DESGLOSE Y MOVIMIENTOS */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* DESGLOSE POR MEDIO */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'EFECTIVO', amount: balances.find(b => b.payment_method === 'cash')?.final_system_amount || 0, icon: Wallet, color: 'text-emerald-400' },
                                { label: 'TARJETA', amount: balances.find(b => b.payment_method === 'card')?.final_system_amount || 0, icon: CreditCard, color: 'text-blue-400' },
                                { label: 'TRANSF.', amount: balances.find(b => b.payment_method === 'transfer')?.final_system_amount || 0, icon: Smartphone, color: 'text-purple-400' },
                                { label: 'QR / APP', amount: balances.find(b => b.payment_method === 'qr')?.final_system_amount || 0, icon: QrCode, color: 'text-orange-400' },
                            ].map((item, i) => (
                                <div key={i} className="bg-[#111] border border-white/5 rounded-[2rem] p-6 shadow-lg">
                                    <item.icon className={cn("w-6 h-6 mb-4", item.color)} />
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{item.label}</p>
                                    <p className="text-xl font-black italic mt-1">${item.amount.toLocaleString('es-CO')}</p>
                                </div>
                            ))}
                        </div>

                        {/* HISTORIAL RECIENTE */}
                        <div className="bg-[#111] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col">
                            <div className="p-8 border-b border-white/5 flex justify-between items-center">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-2 italic">
                                    <Clock className="w-4 h-4" /> Últimos Movimientos
                                </h3>
                                <Button variant="link" className="text-primary text-[10px] font-black uppercase tracking-widest">Ver Todo</Button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                            <th className="px-8 py-4">TIPO</th>
                                            <th className="px-8 py-4">MOTIVO / REFERENCIA</th>
                                            <th className="px-8 py-4">MEDIO</th>
                                            <th className="px-8 py-4 text-right">MONTO</th>
                                            <th className="px-8 py-4 text-right">ACCIONES</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {movements.map((move) => (
                                            <tr key={move.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="px-8 py-5">
                                                    <div className={cn(
                                                        "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter italic",
                                                        move.type === 'sale' ? "bg-emerald-500/10 text-emerald-400" :
                                                            move.type === 'income' ? "bg-blue-500/10 text-blue-400" :
                                                                move.type === 'expense' ? "bg-rose-500/10 text-rose-400" : "bg-gray-500/10 text-gray-400"
                                                    )}>
                                                        {move.type === 'sale' && <Ticket className="w-3 h-3" />}
                                                        {move.type === 'income' && <ArrowUpRight className="w-3 h-3" />}
                                                        {move.type === 'expense' && <ArrowDownRight className="w-3 h-3" />}
                                                        {move.type}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <p className="text-xs font-bold text-white uppercase italic">{move.reason}</p>
                                                    <p className="text-[9px] text-gray-500 font-mono mt-0.5">{new Date(move.created_at).toLocaleTimeString()}</p>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase">{move.payment_method}</p>
                                                </td>
                                                <td className="px-8 py-5 text-right font-black italic text-lg">
                                                    <span className={cn(
                                                        move.type === 'expense' || move.type === 'opening' ? "text-rose-500" :
                                                            move.type === 'income' || move.type === 'sale' ? "text-emerald-400" :
                                                                "text-white"
                                                    )}>
                                                        {move.type === 'expense' ? '-' : move.type === 'income' || move.type === 'sale' ? '+' : ''}${move.amount.toLocaleString('es-CO')}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    {move.type === 'sale' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={async () => {
                                                                // Fetch full order data for printing
                                                                const { data: order } = await supabase
                                                                    .from('orders')
                                                                    .select('*, tables(table_name), order_items(*, products(name))')
                                                                    .eq('id', move.reason.split('#')[1] || '') // Simple hack for now
                                                                    .single()

                                                                if (order) {
                                                                    generateReceiptPDF(order, businessSettings, loyaltySettings)
                                                                } else {
                                                                    alert("No se pudo recuperar la orden completa para imprimir.")
                                                                }
                                                            }}
                                                            className="h-10 w-10 rounded-xl bg-white/5 border border-white/5 hover:border-primary hover:text-primary transition-all"
                                                        >
                                                            <Printer className="w-5 h-5" />
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {movements.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-8 py-20 text-center text-gray-500 italic text-sm">
                                                    No hay movimientos registrados en este turno.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* 📥 Income/Expense Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-[#111] w-full max-w-xl rounded-[2.5rem] border border-white/10 shadow-3xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <form onSubmit={handleMovement} className="p-8 space-y-8">
                            <div className="text-center">
                                <div className={cn(
                                    "w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4",
                                    modalOpen === 'income' ? "bg-indigo-500/20 text-indigo-400" : "bg-rose-500/20 text-rose-400"
                                )}>
                                    {modalOpen === 'income' ? <Plus className="w-8 h-8" /> : <Minus className="w-8 h-8" />}
                                </div>
                                <h2 className="text-3xl font-black uppercase tracking-tighter italic">
                                    Registrar <span className={modalOpen === 'income' ? "text-indigo-400" : "text-rose-400"}>
                                        {modalOpen === 'income' ? 'Ingreso' : 'Egreso'}
                                    </span>
                                </h2>
                                <p className="text-gray-500 font-medium italic">Afecta el saldo actual en caja</p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Monto del Movimiento</label>
                                    <input
                                        type="number"
                                        autoFocus
                                        className="w-full h-20 bg-black border-2 border-white/10 focus:border-primary rounded-2xl px-6 outline-none text-4xl font-black text-center transition-all"
                                        placeholder="0"
                                        value={modalData.amount || ""}
                                        onChange={e => setModalData({ ...modalData, amount: parseFloat(e.target.value) || 0 })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Medio de Pago</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[
                                            { id: 'cash', icon: Wallet },
                                            { id: 'card', icon: CreditCard },
                                            { id: 'transfer', icon: Smartphone },
                                            { id: 'qr', icon: QrCode },
                                        ].map(m => (
                                            <button
                                                key={m.id}
                                                type="button"
                                                onClick={() => setModalData({ ...modalData, payment_method: m.id })}
                                                className={cn(
                                                    "h-14 rounded-xl border-2 flex items-center justify-center transition-all",
                                                    modalData.payment_method === m.id
                                                        ? "bg-primary/10 border-primary text-primary shadow-[0_0_15px_rgba(255,215,0,0.1)]"
                                                        : "bg-black border-white/5 text-gray-600 hover:border-white/20"
                                                )}
                                            >
                                                <m.icon className="w-6 h-6" />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Motivo / Concepto</label>
                                    <textarea
                                        required
                                        className="w-full h-24 bg-black border border-white/10 rounded-2xl p-4 outline-none focus:border-white/20 transition-all font-medium text-sm resize-none"
                                        placeholder="Ej: Pago de panadería, propina adicional, etc."
                                        value={modalData.reason}
                                        onChange={e => setModalData({ ...modalData, reason: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setModalOpen(null)}
                                    className="flex-1 h-16 rounded-2xl font-black uppercase text-xs tracking-widest italic"
                                >
                                    CANCELAR
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={submittingModal || modalData.amount <= 0 || !modalData.reason}
                                    className={cn(
                                        "flex-[2] h-16 rounded-2xl font-black uppercase text-sm tracking-[0.2em] italic transition-all",
                                        modalOpen === 'income' ? "bg-indigo-500 text-white hover:bg-indigo-400" : "bg-rose-500 text-white hover:bg-rose-400"
                                    )}
                                >
                                    {submittingModal ? <Loader2 className="w-6 h-6 animate-spin" /> : `CONFIRMAR ${modalOpen === 'income' ? 'INGRESO' : 'EGRESO'}`}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 🧮 Audit (Arqueo) Modal */}
            {modalOpen === 'audit' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-[#111] w-full max-w-2xl rounded-[2.5rem] border border-white/10 shadow-3xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-10 space-y-8">
                            <div className="text-center">
                                <div className="w-16 h-16 rounded-2xl bg-primary/20 text-primary mx-auto flex items-center justify-center mb-4">
                                    <Scale className="w-8 h-8" />
                                </div>
                                <h2 className="text-3xl font-black uppercase tracking-tighter italic">
                                    {auditStep === 1 ? 'Conteo Físico' : 'Resultado del Arqueo'}
                                </h2>
                                <p className="text-gray-500 font-medium italic">
                                    {auditStep === 1
                                        ? 'Ingresa los montos físicos contados en caja'
                                        : 'Comparación entre conteo real y sistema'}
                                </p>
                            </div>

                            {auditStep === 1 ? (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            { id: 'cash', label: 'EFECTIVO CONTEO', icon: Wallet },
                                            { id: 'card', label: 'VOUCHERS TARJETA', icon: CreditCard },
                                            { id: 'transfer', label: 'CONFIRM. TRANSF.', icon: Smartphone },
                                            { id: 'qr', label: 'RECIBOS QR', icon: QrCode },
                                        ].map((m) => (
                                            <div key={m.id} className="space-y-1">
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                                                    <m.icon className="w-3 h-3" /> {m.label}
                                                </label>
                                                <input
                                                    type="number"
                                                    className="w-full h-16 bg-black border border-white/10 rounded-2xl px-4 outline-none focus:border-primary transition-all font-black text-xl text-right"
                                                    value={auditData[m.id as keyof typeof auditData] || ""}
                                                    onChange={e => setAuditData({ ...auditData, [m.id]: parseFloat(e.target.value) || 0 })}
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <Button
                                            variant="ghost"
                                            onClick={() => setModalOpen(null)}
                                            className="flex-1 h-16 rounded-2xl font-black uppercase text-xs tracking-widest italic"
                                        >
                                            CANCELAR
                                        </Button>
                                        <Button
                                            onClick={handleAudit}
                                            disabled={submittingModal}
                                            className="flex-[2] h-16 bg-primary text-black hover:bg-white rounded-2xl font-black uppercase text-sm tracking-[0.2em] italic transition-all shadow-lg shadow-primary/20"
                                        >
                                            {submittingModal ? <Loader2 className="w-6 h-6 animate-spin" /> : 'VERIFICAR DIFERENCIAS'}
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-6">
                                    <div className="overflow-hidden rounded-3xl border border-white/5 bg-black">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-white/5 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5">
                                                    <th className="px-6 py-4">MEDIO</th>
                                                    <th className="px-6 py-4 text-right">SISTEMA</th>
                                                    <th className="px-6 py-4 text-right">REAL</th>
                                                    <th className="px-6 py-4 text-right">DIF.</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {balances.map(b => {
                                                    const diff = (b.final_real_amount || 0) - (b.final_system_amount || 0)
                                                    return (
                                                        <tr key={b.payment_method} className="text-sm font-bold italic">
                                                            <td className="px-6 py-4 uppercase text-gray-400">{b.payment_method}</td>
                                                            <td className="px-6 py-4 text-right">${b.final_system_amount.toLocaleString()}</td>
                                                            <td className="px-6 py-4 text-right">${b.final_real_amount.toLocaleString()}</td>
                                                            <td className={cn(
                                                                "px-6 py-4 text-right",
                                                                diff === 0 ? "text-green-500" : diff > 0 ? "text-blue-500" : "text-rose-500"
                                                            )}>
                                                                {diff > 0 ? '+' : ''}${diff.toLocaleString()}
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="p-6 bg-white/5 rounded-3xl space-y-2 border border-white/5">
                                        <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                                            <span className="text-gray-500">Diferencia Total</span>
                                            <span className={cn(
                                                auditData.cash + auditData.card + auditData.transfer + auditData.qr - totalBalance === 0
                                                    ? "text-green-500" : "text-rose-500"
                                            )}>
                                                ${(auditData.cash + auditData.card + auditData.transfer + auditData.qr - totalBalance).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={() => setModalOpen(null)}
                                        className="w-full h-16 bg-white text-black hover:bg-primary rounded-2xl font-black uppercase"
                                    >
                                        ENTENDIDO
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* 🔒 Close Shift Modal */}
            {modalOpen === 'close' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-[#111] w-full max-w-xl rounded-[2.5rem] border border-white/10 shadow-3xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-10 space-y-8">
                            <div className="text-center">
                                <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-500 mx-auto flex items-center justify-center mb-4">
                                    <Lock className="w-8 h-8" />
                                </div>
                                <h2 className="text-3xl font-black uppercase tracking-tighter italic text-rose-500">
                                    Cierre de Caja
                                </h2>
                                <p className="text-gray-500 font-medium italic">Resumen final para finalización de turno</p>
                            </div>

                            <div className="space-y-4">
                                <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                                    <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest italic">
                                        <span className="text-gray-500">Saldo en Sistema</span>
                                        <span className="text-white">${totalBalance.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest italic">
                                        <span className="text-gray-500">Ventas Registradas</span>
                                        <span className="text-emerald-400">+${totalSales.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest italic">
                                        <span className="text-gray-500">Gastos / Egresos</span>
                                        <span className="text-rose-400">-${movements.filter(m => m.type === 'expense').reduce((s, m) => s + m.amount, 0).toLocaleString()}</span>
                                    </div>
                                    <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Neto a Entregar</span>
                                        <span className="text-2xl font-black italic">${totalBalance.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Observaciones Finales</label>
                                    <textarea
                                        className="w-full h-24 bg-black border border-white/10 rounded-2xl p-4 outline-none focus:border-rose-500/50 transition-all font-medium text-sm resize-none"
                                        placeholder="Ej: Caja cuadra perfectamente. Se retira excedente..."
                                        value={closingNotes}
                                        onChange={e => setClosingNotes(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 text-center block">PIN DE CIERRE</label>
                                    <input
                                        type="password"
                                        maxLength={4}
                                        className="w-full h-16 bg-black border border-white/10 rounded-2xl px-6 outline-none focus:border-rose-500 transition-all text-center tracking-[1em] font-black text-2xl"
                                        placeholder="••••"
                                        value={closingPin}
                                        onChange={e => setClosingPin(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <Button
                                    variant="ghost"
                                    onClick={() => setModalOpen(null)}
                                    className="flex-1 h-16 rounded-2xl font-black uppercase text-xs tracking-widest italic"
                                >
                                    VOLVER
                                </Button>
                                <Button
                                    onClick={handleCloseShift}
                                    disabled={submittingModal || !closingPin}
                                    className="flex-[2] h-16 bg-rose-600 text-white hover:bg-rose-500 rounded-2xl font-black uppercase text-xs tracking-[0.2em] italic transition-all group shadow-xl shadow-rose-600/20"
                                >
                                    {submittingModal ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'CONFIRMAR CIERRE FINAL'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
