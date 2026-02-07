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

    useEffect(() => {
        async function loadProfile() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Cargar perfil
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

            // Cargar estadísticas simples (simuladas por ahora, luego conectadas a DB real)
            // En un futuro: SELECT count(*) FROM shifts WHERE user_id = ...

            setUser({ ...user, profile })
            setStats({
                shiftsThisMonth: 12, // Placeholder
                hoursWorked: 94.5,   // Placeholder
                tipsEstimated: 450000, // Placeholder
                rank: 'Experto'
            })
            setLoading(false)
        }
        loadProfile()
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">

            {/* Header Personal */}
            <div className="relative overflow-hidden rounded-[3rem] bg-white border border-slate-200 p-8 md:p-12 shadow-sm group">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                    <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-xl flex items-center justify-center text-3xl">
                        👤
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
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Propinas Est.</p>
                            <h3 className="text-3xl font-black italic tracking-tighter text-emerald-600">
                                {formatPrice(stats.tipsEstimated)}
                            </h3>
                        </div>
                        <div className="pt-4 border-t border-slate-100">
                            <Button variant="ghost" className="w-full justify-between text-xs font-bold uppercase tracking-widest text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
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
                            <p className="text-[10px] font-bold text-slate-400 uppercase">
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
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nivel</p>
                            <h3 className="text-3xl font-black italic tracking-tighter text-amber-600">
                                {stats.rank}
                            </h3>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-4">
                            <div className="bg-amber-500 h-full w-[75%]" />
                        </div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase text-right">750 / 1000 XP</p>
                    </div>
                </div>

            </div>

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

                <div className="p-8 rounded-[2.5rem] bg-slate-900 text-white space-y-6 flex flex-col justify-between">
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-white/50 mb-2">Seguridad</h3>
                        <p className="text-sm text-slate-400">
                            Mantén tu cuenta segura. Si olvidas tu contraseña, contacta al administrador.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <Button variant="outline" className="w-full justify-between h-14 bg-white/5 border-white/10 hover:bg-white/10 text-white hover:text-white">
                            Cambiar Contraseña <ArrowRight className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="destructive"
                            className="w-full justify-between h-14 bg-rose-600 hover:bg-rose-700 text-white"
                            onClick={async () => {
                                await supabase.auth.signOut()
                                window.location.href = "/login"
                            }}
                        >
                            Cerrar Sesión <LogOut className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

        </div>
    )
}
