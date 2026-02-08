'use client'

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Loader2, Wallet, Calendar, Award, Clock, ArrowRight, ShieldCheck, User, LogOut } from "lucide-react"
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

            // Cargar perfil
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).single()

            // Cargar Propinas Reales de la tabla orders
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
            <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900 font-black italic">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    <p className="uppercase tracking-[0.3em] text-[10px]">Cifrando Datos de Sesión...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-20">

            {/* Header Personal */}
            <div className="relative overflow-hidden rounded-[3rem] bg-white border border-slate-200 p-8 md:p-12 shadow-sm group">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                    <div className="w-24 h-24 rounded-full bg-primary/20 border-4 border-white shadow-xl flex items-center justify-center text-3xl font-black text-primary italic">
                        {user?.profile?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-center md:justify-start gap-3">
                            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-slate-900 italic">
                                {user?.profile?.full_name}
                            </h1>
                            <span className="px-3 py-1 bg-primary text-black text-[10px] font-black uppercase tracking-widest rounded-full">
                                {user?.profile?.role}
                            </span>
                        </div>
                        <p className="text-slate-400 font-bold uppercase text-xs tracking-widest flex items-center justify-center md:justify-start gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" /> ID: {user?.profile?.document_id || 'N/A'}
                        </p>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-100 flex flex-wrap gap-4 justify-center md:justify-start">
                    <div className="bg-slate-50 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter text-slate-500 italic">
                        Ultima Conexión: <span className="text-slate-900">Hoy, 08:30 AM</span>
                    </div>
                    <div className="bg-slate-50 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter text-slate-500 italic">
                        Localización: <span className="text-slate-900">Salón Principal</span>
                    </div>
                </div>
            </div>

            {/* Grid de Métricas Personales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Billetera */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                    <div className="absolute top-0 right-0 p-6 opacity-5 text-emerald-600 rotate-12 group-hover:scale-110 transition-transform">
                        <Wallet className="w-24 h-24" />
                    </div>
                    <div className="relative z-10 space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                            <Wallet className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Propinas Generadas</p>
                            <h3 className="text-3xl font-black italic tracking-tighter text-emerald-600">
                                {formatPrice(stats.tipsEstimated)}
                            </h3>
                        </div>
                        <div className="pt-4 border-t border-slate-100">
                            <Button
                                onClick={() => setIsDetailsOpen(true)}
                                variant="ghost"
                                className="w-full justify-between text-xs font-bold uppercase tracking-widest text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            >
                                Ver Detalle <ArrowRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Horas */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-500/30 transition-all">
                    <div className="absolute top-0 right-0 p-6 opacity-5 text-blue-600 -rotate-12 group-hover:scale-110 transition-transform">
                        <Clock className="w-24 h-24" />
                    </div>
                    <div className="relative z-10 space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Horas Mes</p>
                            <h3 className="text-3xl font-black italic tracking-tighter text-blue-600">
                                {stats.hoursWorked}h
                            </h3>
                        </div>
                        <div className="pt-4 border-t border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase italic">
                                {stats.shiftsThisMonth} Turnos completados
                            </p>
                        </div>
                    </div>
                </div>

                {/* Ranking */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-amber-500/30 transition-all">
                    <div className="absolute top-0 right-0 p-6 opacity-5 text-amber-600 rotate-6 group-hover:scale-110 transition-transform">
                        <Award className="w-24 h-24" />
                    </div>
                    <div className="relative z-10 space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                            <Award className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nivel de Desempeño</p>
                            <h3 className="text-3xl font-black italic tracking-tighter text-amber-600">
                                {stats.rank}
                            </h3>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-4">
                            <div className="bg-amber-500 h-full w-[85%]" />
                        </div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase text-right">850 / 1000 XP</p>
                    </div>
                </div>

            </div>

            {/* MODAL DE DETALLE DE PROPINAS */}
            {isDetailsOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-10 border border-slate-100 animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-2xl font-black italic uppercase text-slate-900 leading-none">Detalle de Propinas</h2>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Últimas participaciones en ventas</p>
                            </div>
                            <Button size="icon" variant="ghost" onClick={() => setIsDetailsOpen(false)} className="rounded-xl">
                                <LogOut className="w-6 h-6 rotate-180" />
                            </Button>
                        </div>

                        <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-4 custom-scrollbar">
                            {recentTips.length > 0 ? recentTips.map((tip) => (
                                <div key={tip.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-primary/30 transition-all">
                                    <div>
                                        <p className="text-[9px] font-black uppercase text-slate-400">Orden #{tip.id.substring(0, 8)}</p>
                                        <p className="text-xs font-bold text-slate-500">{new Date(tip.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400">PROPINA</p>
                                        <p className="text-xl font-black italic text-emerald-600">{formatPrice(tip.tip_amount)}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-10">
                                    <Wallet className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                    <p className="text-sm font-bold text-slate-400 uppercase">No se registraron propinas recientemente</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 pt-8 border-t border-slate-100">
                            <div className="flex justify-between items-center bg-emerald-50 p-6 rounded-3xl">
                                <span className="font-black italic uppercase text-sm text-emerald-800">Total Acumulado</span>
                                <span className="text-3xl font-black italic text-emerald-600">{formatPrice(stats.tipsEstimated)}</span>
                            </div>
                            <Button onClick={() => setIsDetailsOpen(false)} className="w-full mt-6 h-14 bg-black text-white rounded-2xl font-black uppercase italic tracking-widest">
                                ENTENDIDO
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Acciones de Cuenta */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-8 rounded-[2.5rem] bg-white border border-slate-200 space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Próximos Turnos
                    </h3>
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="font-black text-slate-900 text-lg">1{i}</div>
                                    <div className="text-xs uppercase font-bold text-slate-500">Febrero <br /> Jueves</div>
                                </div>
                                <div className="px-3 py-1 bg-white border rounded-lg text-[10px] font-black uppercase tracking-widest">
                                    14:00 - 22:00
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-8 rounded-[2.5rem] bg-white border border-slate-200 space-y-6 flex flex-col justify-between">
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-2">Seguridad de la Cuenta</h3>
                        <p className="text-sm text-slate-600 font-medium mb-6">
                            Mantén tu cuenta segura. Tu PIN actual es necesario para entrar al portal de meseros.
                        </p>

                        <div className="space-y-2 mb-6">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-4 italic">Mi PIN de Acceso</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    maxLength={4}
                                    placeholder={user?.profile?.waiter_pin ? "****" : "Vacio"}
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl py-3 px-6 outline-none focus:border-primary/50 transition-all font-black text-center text-lg italic tracking-[0.5em]"
                                    value={newPin}
                                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                                />
                                <Button
                                    disabled={updatingPin || newPin.length !== 4}
                                    onClick={handleUpdatePin}
                                    className="h-14 px-6 bg-slate-900 text-white rounded-2xl font-black uppercase italic text-[10px]"
                                >
                                    {updatingPin ? <Loader2 className="w-4 h-4 animate-spin" /> : 'ACTUALIZAR PIN'}
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Button variant="outline" className="w-full justify-between h-14 bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-900 font-black uppercase italic tracking-widest text-[10px] rounded-2xl transition-all">
                            Cambiar Contraseña <ArrowRight className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="destructive"
                            className="w-full justify-between h-14 bg-rose-500 hover:bg-rose-600 text-white font-black uppercase italic tracking-widest text-[10px] rounded-2xl shadow-lg shadow-rose-200"
                            onClick={async () => {
                                await supabase.auth.signOut()
                                window.location.href = "/login"
                            }}
                        >
                            Cerrar Sesión Activa <LogOut className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

        </div>
    )
}
