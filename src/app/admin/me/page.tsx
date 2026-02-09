"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import {
    Loader2,
    Wallet,
    Calendar,
    Award,
    Clock,
    ArrowRight,
    ShieldCheck,
    User,
    LogOut,
    ChevronRight,
    Star,
    Zap,
    Lock,
    Fingerprint,
    History,
    ArrowLeft,
    CheckCircle2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn, formatPrice } from "@/lib/utils"

export default function MyProfilePage() {
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [stats, setStats] = useState({
        shiftsThisMonth: 0,
        hoursWorked: 0,
        tipsEstimated: 0,
        rank: 'Novato'
    })
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [recentTips, setRecentTips] = useState<any[]>([])
    const [newPin, setNewPin] = useState("")
    const [updatingPin, setUpdatingPin] = useState(false)

    useEffect(() => {
        async function loadProfile() {
            const { data: { user: authUser } } = await supabase.auth.getUser()
            if (!authUser) return

            const { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).single()

            const { data: ordersWithTips } = await supabase
                .from('orders')
                .select('id, total, tip_amount, created_at')
                .eq('waiter_id', authUser.id)
                .gt('tip_amount', 0)
                .order('created_at', { ascending: false })
                .limit(10)

            const totalTips = ordersWithTips?.reduce((sum, o) => sum + (Number(o.tip_amount) || 0), 0) || 0
            setRecentTips(ordersWithTips || [])

            setUser({ ...authUser, profile })
            setStats({
                shiftsThisMonth: 12,
                hoursWorked: 94.5,
                tipsEstimated: totalTips,
                rank: profile?.role === 'admin' ? 'Master' : 'Experto'
            })
            setLoading(false)
        }
        loadProfile()
    }, [])

    async function handleUpdatePin() {
        if (!newPin || newPin.length !== 4) return alert("El PIN debe ser de 4 dígitos")
        setUpdatingPin(true)
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ waiter_pin: newPin })
                .eq('id', user.id)

            if (error) throw error
            alert("PIN actualizado correctamente")
            setUser({ ...user, profile: { ...user.profile, waiter_pin: newPin } })
            setNewPin("")
        } catch (e: any) {
            alert("Error: " + e.message)
        } finally {
            setUpdatingPin(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background text-foreground font-black italic">
                <div className="flex flex-col items-center gap-6 animate-in fade-in duration-1000">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
                        <Loader2 className="w-16 h-16 animate-spin text-primary relative z-10" />
                    </div>
                    <div className="space-y-2 text-center">
                        <p className="uppercase tracking-[0.4em] text-[10px] font-black italic opacity-50">Sincronizando Identidad Digital</p>
                        <p className="uppercase tracking-[0.1em] text-[11px] font-bold text-primary animate-pulse">Kernel v5.0 Access</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-transparent text-foreground p-4 md:p-8 font-sans selection:bg-primary selection:text-primary-foreground relative pb-20">
            <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-1000">

                {/* 🔝 STRATEGIC IDENTITY CARD */}
                <div className="relative overflow-hidden rounded-[4rem] bg-card border border-border p-10 md:p-14 shadow-3xl group transition-all duration-700 hover:border-primary/20">
                    <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-primary/5 via-primary/[0.02] to-transparent pointer-events-none group-hover:from-primary/10 transition-all duration-1000" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-10 text-center md:text-left">
                        <div className="relative group/avatar">
                            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-0 group-hover/avatar:scale-110 transition-transform duration-700" />
                            <div className="w-32 h-32 rounded-full bg-card border-[6px] border-primary/20 shadow-2xl flex items-center justify-center text-5xl font-black text-primary italic relative z-10 overflow-hidden group-hover/avatar:border-primary transition-all duration-500">
                                {user?.profile?.full_name?.charAt(0) || <User className="w-12 h-12" />}
                                <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover/avatar:opacity-100 transition-opacity" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-2xl border-4 border-card flex items-center justify-center text-background shadow-xl scale-0 group-hover/avatar:scale-100 transition-transform duration-500 delay-100">
                                <Zap className="w-5 h-5 fill-current" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <div className="flex items-center justify-center md:justify-start gap-4">
                                    <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-foreground italic leading-none group-hover:text-primary transition-colors">
                                        {user?.profile?.full_name}
                                    </h1>
                                    <span className="px-5 py-2 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-primary/20 italic">
                                        {user?.profile?.role || 'K-USER'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-center md:justify-start gap-3 opacity-40">
                                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                    <p className="text-[10px] uppercase font-black tracking-[0.3em] font-mono italic">NODE-ID: {user?.id.slice(0, 12).toUpperCase()}</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                                <div className="bg-muted px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-tighter text-muted-foreground italic border border-border/50 flex items-center gap-2">
                                    <History className="w-3.5 h-3.5" />
                                    ÚLTIMA CONEXIÓN: <span className="text-foreground">HOY, 14:23 CST</span>
                                </div>
                                <div className="bg-muted px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-tighter text-muted-foreground italic border border-border/50 flex items-center gap-2">
                                    <Zap className="w-3.5 h-3.5 text-primary" />
                                    STATUS: <span className="text-emerald-500">OPERATIVO ONLINE</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 📈 PERFORMANCE MATRIX */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* LIQUIDITY GAUGE */}
                    <div className="bg-card p-10 rounded-[3.5rem] border border-border shadow-2xl relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-700">
                        <div className="absolute top-0 right-0 p-8 opacity-5 text-emerald-500 rotate-12 group-hover:scale-125 transition-transform duration-1000">
                            <Wallet className="w-32 h-32" />
                        </div>
                        <div className="relative z-10 space-y-6">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shadow-inner group-hover:bg-emerald-500 group-hover:text-background transition-all duration-500">
                                <Wallet className="w-8 h-8" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 italic">Incentivos Generados</p>
                                <h3 className="text-4xl font-black italic tracking-tighter text-emerald-500 leading-none">
                                    {formatPrice(stats.tipsEstimated)}
                                </h3>
                            </div>
                            <div className="pt-6 border-t border-border/50">
                                <Button
                                    onClick={() => setIsDetailsOpen(true)}
                                    variant="ghost"
                                    className="w-full justify-between h-14 bg-emerald-500/5 px-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 hover:text-background hover:bg-emerald-500 transition-all italic border border-emerald-500/10"
                                >
                                    AUDITAR DETALLE <ArrowRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* OPERATIONAL TIME */}
                    <div className="bg-card p-10 rounded-[3.5rem] border border-border shadow-2xl relative overflow-hidden group hover:border-primary/40 transition-all duration-700">
                        <div className="absolute top-0 right-0 p-8 opacity-5 text-primary -rotate-12 group-hover:scale-125 transition-transform duration-1000">
                            <Clock className="w-32 h-32" />
                        </div>
                        <div className="relative z-10 space-y-6">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-inner group-hover:bg-primary group-hover:text-background transition-all duration-500">
                                <Clock className="w-8 h-8" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 italic">Carga Horaria (MES)</p>
                                <h3 className="text-4xl font-black italic tracking-tighter text-foreground leading-none">
                                    {stats.hoursWorked}<span className="text-xl ml-2 opacity-30">HRS</span>
                                </h3>
                            </div>
                            <div className="pt-6 border-t border-border/50 space-y-3">
                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.3em] italic text-muted-foreground/60">
                                    <div className="flex items-center gap-2">
                                        <Zap className="w-3 h-3 text-primary" />
                                        Métricas de Eficiencia
                                    </div>
                                    <span className="text-primary">{stats.shiftsThisMonth} TURNOS</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden border border-border/30">
                                    <div className="h-full bg-primary w-[75%] animate-pulse" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RANKING ENGINE */}
                    <div className="bg-card p-10 rounded-[3.5rem] border border-border shadow-2xl relative overflow-hidden group hover:border-amber-500/40 transition-all duration-700">
                        <div className="absolute top-0 right-0 p-8 opacity-5 text-amber-500 rotate-6 group-hover:scale-125 transition-transform duration-1000">
                            <Award className="w-32 h-32" />
                        </div>
                        <div className="relative z-10 space-y-6">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shadow-inner group-hover:bg-amber-500 group-hover:text-background transition-all duration-500">
                                <Award className="w-8 h-8" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 italic">Nivel de Reputación</p>
                                <h3 className="text-4xl font-black italic tracking-tighter text-amber-500 leading-none">
                                    {stats.rank}
                                </h3>
                            </div>
                            <div className="pt-6 border-t border-border/50 space-y-3">
                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.3em] italic text-muted-foreground/60 px-1">
                                    <span>XP PROGRESS</span>
                                    <span className="text-amber-500">920 / 1000</span>
                                </div>
                                <div className="w-full bg-muted h-3 rounded-full overflow-hidden border border-border/30">
                                    <div className="bg-gradient-to-r from-amber-600 to-amber-400 h-full w-[92%] shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 🔒 SECURITY & OPERATIONS NODE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

                    {/* SCHEDULE NODE */}
                    <div className="p-10 rounded-[4rem] bg-card border border-border space-y-8 shadow-2xl relative overflow-hidden group/sched">
                        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none -mr-12 -mt-12 group-hover/sched:scale-110 transition-transform duration-1000">
                            <Calendar className="w-32 h-32" />
                        </div>
                        <div className="flex items-center justify-between border-b border-border/50 pb-6 relative z-10">
                            <h3 className="text-sm font-black uppercase tracking-[0.5em] text-foreground flex items-center gap-3 italic">
                                <Calendar className="w-5 h-5 text-primary" /> Cronología Operativa
                            </h3>
                            <div className="px-4 py-1.5 bg-primary/10 rounded-full text-[9px] font-black uppercase tracking-widest text-primary italic border border-primary/20">Semana Current</div>
                        </div>
                        <div className="space-y-4 relative z-10">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center justify-between p-6 rounded-3xl bg-muted/40 border border-border/50 hover:bg-card hover:border-primary/20 transition-all duration-300 group/day shadow-sm">
                                    <div className="flex items-center gap-5">
                                        <div className="font-black text-foreground text-3xl italic tracking-tighter opacity-20 group-hover/day:opacity-100 group-hover/day:text-primary transition-all">0{i + 15}</div>
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">FEBRERO</div>
                                            <div className="text-[9px] font-bold text-muted-foreground uppercase italic tracking-widest leading-none">MIÉRCOLES — OPERACIÓN BASE</div>
                                        </div>
                                    </div>
                                    <div className="px-6 py-3 bg-card border border-border rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] italic shadow-inner group-hover/day:border-primary/20 group-hover/day:text-primary transition-all">
                                        14:00 • 22:00
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SECURITY PROTOCOL NODE */}
                    <div className="p-10 rounded-[4rem] bg-foreground text-background space-y-8 shadow-3xl relative overflow-hidden group/sec">
                        <div className="absolute top-0 right-0 p-16 opacity-10 pointer-events-none -mr-20 -mt-20 group-hover/sec:scale-110 transition-transform duration-1000">
                            <Fingerprint className="w-48 h-48" />
                        </div>

                        <div className="space-y-4 relative z-10">
                            <div className="flex items-center gap-3 text-primary">
                                <Lock className="w-5 h-5" />
                                <h3 className="text-sm font-black uppercase tracking-[0.5em] italic">Protocolo de Seguridad</h3>
                            </div>
                            <p className="text-xs text-background/60 font-medium leading-relaxed italic uppercase tracking-tight max-w-[80%]">
                                GESTIÓN DE CREDENCIALES NIVEL 4. EL PIN DE ACCESO ES REQUERIDO PARA LA VALIDACIÓN DE OPERATIVOS EN SISTEMA POS.
                            </p>
                        </div>

                        <div className="space-y-6 relative z-10">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/60 ml-6 italic">PIN de Operador (4 DIGIT)</label>
                                <div className="flex gap-4">
                                    <div className="relative flex-1">
                                        <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                                        <input
                                            type="password"
                                            maxLength={4}
                                            placeholder={user?.profile?.waiter_pin ? "••••" : "VACIO"}
                                            className="w-full h-18 bg-white/5 border border-white/10 rounded-[2rem] pl-16 pr-8 outline-none focus:border-primary transition-all font-black text-center text-3xl italic tracking-[0.8em] text-white shadow-inner placeholder:text-white/10"
                                            value={newPin}
                                            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                                        />
                                    </div>
                                    <Button
                                        disabled={updatingPin || newPin.length !== 4}
                                        onClick={handleUpdatePin}
                                        className="h-18 px-10 bg-primary text-primary-foreground rounded-[2rem] font-black uppercase italic text-[11px] tracking-[0.2em] border-none shadow-3xl hover:bg-white hover:text-black transition-all active:scale-95 disabled:opacity-20"
                                    >
                                        {updatingPin ? <Loader2 className="w-6 h-6 animate-spin" /> : 'INDEXAR'}
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Button variant="ghost" className="h-16 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black uppercase italic tracking-[0.2em] text-[10px] rounded-2xl transition-all gap-4">
                                    MODIFICAR PASS <ChevronRight className="w-4 h-4 opacity-50" />
                                </Button>
                                <Button
                                    variant="destructive"
                                    className="h-16 bg-rose-500 hover:bg-rose-600 text-white font-black uppercase italic tracking-[0.2em] text-[10px] rounded-2xl shadow-xl shadow-rose-900/20 group/out gap-4"
                                    onClick={async () => {
                                        await supabase.auth.signOut()
                                        window.location.href = "/login"
                                    }}
                                >
                                    ABORTAR SESIÓN <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 👁️ FORENSIC INSPECTION MODAL (TIPS) */}
                {isDetailsOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 bg-background/80 backdrop-blur-2xl animate-in fade-in duration-500">
                        <div className="bg-card w-full max-w-xl rounded-[4rem] shadow-[0_0_150px_rgba(0,0,0,0.5)] border border-border overflow-hidden flex flex-col animate-in zoom-in-95 duration-500 max-h-[90vh] outline-none">

                            <div className="px-12 py-10 border-b border-border/50 flex justify-between items-center bg-muted/20 relative z-10">
                                <div className="flex items-center gap-5">
                                    <div className="p-4 bg-emerald-500/10 rounded-2xl shadow-inner border border-emerald-500/20">
                                        <Wallet className="w-8 h-8 text-emerald-500 shadow-emerald-500/20 shadow-lg" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-3xl font-black italic uppercase text-foreground leading-none tracking-tighter">Historial de <span className="text-emerald-500">Capital</span></h3>
                                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.5em] italic opacity-60">Revenue Audit v2.4</p>
                                    </div>
                                </div>
                                <Button size="icon" variant="ghost" onClick={() => setIsDetailsOpen(false)} className="rounded-2xl h-14 w-14 hover:bg-muted active:scale-90 transition-all border border-transparent hover:border-border">
                                    <X className="w-8 h-8" />
                                </Button>
                            </div>

                            <div className="p-12 space-y-6 overflow-y-auto custom-scrollbar relative z-10">
                                {recentTips.length > 0 ? recentTips.map((tip) => (
                                    <div key={tip.id} className="flex items-center justify-between p-8 bg-muted/40 rounded-[2.5rem] border border-border/50 group/tip hover:border-emerald-500/30 hover:bg-card transition-all duration-300 shadow-sm relative overflow-hidden">
                                        <div className="absolute inset-y-0 left-0 w-1.5 bg-emerald-500/20 group-hover/tip:bg-emerald-500 transition-colors" />
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 italic flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> ORDEN #{tip.id.substring(0, 8).toUpperCase()}
                                            </p>
                                            <p className="text-xs font-black text-foreground italic uppercase tracking-widest">{new Date(tip.created_at).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                                        </div>
                                        <div className="text-right space-y-1">
                                            <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest italic leading-none">ACCESIÓN</p>
                                            <p className="text-3xl font-black italic text-emerald-500 tracking-tighter drop-shadow-sm group-hover/tip:scale-110 transition-transform origin-right leading-none">+{formatPrice(tip.tip_amount)}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-20 opacity-10 space-y-6">
                                        <Wallet className="w-32 h-32 mx-auto" />
                                        <p className="text-xl font-black uppercase italic tracking-[0.5em]">Lote Transaccional Vacío</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-10 bg-muted/20 border-t border-border mt-auto">
                                <div className="flex justify-between items-center bg-emerald-500/5 p-8 rounded-[3rem] border border-emerald-500/20 relative group/total">
                                    <div className="absolute inset-0 bg-emerald-500 opacity-0 group-hover/total:opacity-[0.03] transition-opacity" />
                                    <div className="space-y-1">
                                        <span className="font-black italic uppercase text-[10px] tracking-[0.5em] text-emerald-800 opacity-60">BALANCE ACUMULADO</span>
                                        <div className="flex items-center gap-3">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                            <span className="text-11px font-black uppercase text-emerald-800 italic opacity-40">CARTERA OPERATIVA VIGENTE</span>
                                        </div>
                                    </div>
                                    <span className="text-5xl font-black italic text-emerald-500 tracking-tighter leading-none group-hover:scale-110 transition-transform">{formatPrice(stats.tipsEstimated)}</span>
                                </div>
                                <Button onClick={() => setIsDetailsOpen(false)} className="w-full mt-8 h-20 bg-foreground text-background rounded-3xl font-black uppercase italic tracking-[0.3em] text-base shadow-3xl hover:bg-emerald-500 hover:text-white transition-all active:scale-95 group">
                                    ENTENDIDO / CERRAR AUDITORÍA <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform ml-2" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 20px; }
                .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: rgba(255,77,0,0.2); }
            `}</style>
        </div>
    )
}
