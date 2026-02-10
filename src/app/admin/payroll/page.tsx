"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
    Users,
    Clock,
    DollarSign,
    Loader2,
    ArrowLeft,
    Search,
    Filter,
    Activity,
    Calendar,
    Wallet,
    TrendingUp,
    MoreHorizontal,
    CheckCircle2,
    XCircle,
    UserPlus,
    Briefcase,
    Zap
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useRestaurant } from "@/providers/RestaurantProvider"

type Employee = {
    id: string
    full_name: string
    role: string
    is_active: boolean
    last_shift?: string
}

export default function PayrollPage() {
    const { restaurant } = useRestaurant()
    const [employees, setEmployees] = useState<Employee[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        if (restaurant) loadData()
    }, [restaurant])

    const loadData = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('restaurant_id', restaurant?.id)
            .order('full_name', { ascending: true })

        if (!error) setEmployees(data || [])
        setLoading(false)
    }

    const stats = [
        { label: 'TURNOS ACTIVOS', val: '6', icon: Zap, color: 'text-orange-500' },
        { label: 'NÓMINA PENDIENTE', val: '$450.000', icon: Wallet, color: 'text-white' },
        { label: 'HORAS TRABAJADAS', val: '124h', icon: Clock, color: 'text-blue-400' }
    ]

    return (
        <div className="min-h-screen text-white font-sans relative overflow-hidden flex flex-col">

            {/* 🖼️ FONDO PREMIUM: Oficina de Diseño con Blur */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center scale-105 pointer-events-none" />
            <div className="absolute inset-0 backdrop-blur-[80px] bg-slate-950/90 pointer-events-none" />

            <div className="relative z-10 p-8 md:p-12 space-y-10 max-w-[1800px] mx-auto flex flex-col min-h-full">

                {/* HEADER (Estilo Mockup) */}
                <div className="flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-6">
                        <Link href="/admin">
                            <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl bg-slate-800/40 border border-white/5">
                                <ArrowLeft className="w-6 h-6 text-slate-400" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none">GESTIÓN DE <span className="text-orange-500">NÓMINA</span></h1>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] mt-2 italic shadow-sm">Recursos Humanos & Liquidaciones</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => toast.info("REGLAS DE CONTRATACIÓN NO DISPONIBLES EN MODO PRUEBA")}
                        className="h-14 px-8 bg-white text-black font-black uppercase text-xs italic tracking-widest rounded-2xl shadow-xl shadow-white/5"
                    >
                        <UserPlus className="w-5 h-5 mr-3 text-orange-600" /> CONTRATAR PERSONAL
                    </Button>
                </div>

                {/* MAIN CONTENT GRID */}
                <div className="flex-1 grid grid-cols-12 gap-10 min-h-0">

                    {/* LEFT: TURNOS Y TURNOS ACTIVOS */}
                    <div className="col-span-9 flex flex-col space-y-8 overflow-hidden">

                        {/* KPI ROW */}
                        <div className="grid grid-cols-3 gap-6 shrink-0">
                            {stats.map((s, i) => (
                                <div key={i} className="bg-slate-800/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex items-center justify-between group hover:bg-slate-700/50 transition-all border-l-4 border-l-orange-500">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{s.label}</p>
                                        <p className={cn("text-3xl font-black italic", s.color)}>{s.val}</p>
                                    </div>
                                    <div className="p-4 bg-slate-900/40 rounded-2xl">
                                        <s.icon className={cn("w-6 h-6 opacity-40 group-hover:opacity-80 transition-opacity", s.color)} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* EMPLEADOS ACTIVOS GRID (Estilo Mockup) */}
                        <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-6">
                            <h2 className="text-xs font-black uppercase tracking-[0.4em] text-slate-500 flex items-center gap-3 italic">
                                <Activity className="w-4 h-4 text-orange-500" /> Turnos de Empleados Activos
                            </h2>
                            <div className="grid grid-cols-2 gap-6">
                                {employees.slice(0, 6).map((emp, i) => (
                                    <div key={i} className="bg-slate-800/30 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-8 flex items-start gap-6 group hover:border-orange-500/40 transition-all">
                                        <div className="relative">
                                            <div className="w-20 h-20 rounded-[1.75rem] bg-slate-700 flex items-center justify-center border-2 border-white/5 overflow-hidden">
                                                <Users className="w-8 h-8 text-slate-400" />
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-slate-900 flex items-center justify-center">
                                                <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-4">
                                            <div>
                                                <h3 className="text-xl font-black italic tracking-tight uppercase group-hover:text-orange-400 transition-colors leading-none">{emp.full_name}</h3>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">INICIO DE TURNO: 14:00</p>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div>
                                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">TIEMPO TRANSCURRIDO:</p>
                                                    <p className="text-lg font-black italic font-mono text-white">04:35:12</p>
                                                </div>
                                                <div className="px-4 py-2 bg-slate-900/60 rounded-xl border border-white/5">
                                                    <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">PROPINAS:</p>
                                                    <p className="text-xs font-black text-emerald-400">$55.200</p>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => toast.success(`TURNO DE ${emp.full_name} FINALIZADO`)}
                                                className="w-full h-11 bg-orange-600/10 hover:bg-orange-600 text-orange-500 hover:text-black font-black uppercase text-[10px] tracking-widest rounded-xl transition-all border border-orange-500/20 group-hover:border-orange-500"
                                            >
                                                FINALIZAR TURNO
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: LISTA YACCIONES */}
                    <div className="col-span-3 flex flex-col space-y-8">
                        {/* LISTA COMPLETA */}
                        <div className="flex-1 bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-8 overflow-hidden flex flex-col">
                            <h2 className="text-sm font-black italic uppercase tracking-widest mb-6">Lista de Empleados</h2>
                            <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                                {employees.map((emp, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("w-2 h-2 rounded-full shadow-sm", emp.is_active ? "bg-emerald-500" : "bg-slate-600")} />
                                            <div>
                                                <p className="text-xs font-black italic uppercase tracking-tight">{emp.full_name}</p>
                                                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">({emp.is_active ? 'ACTIVO' : 'INACTIVO'})</p>
                                            </div>
                                        </div>
                                        <MoreHorizontal className="w-3 h-3 text-slate-600" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ACCIÓN DE CIERRE */}
                        <div
                            onClick={() => toast.info("CALCULANDO LIQUIDACIONES DEL PERIODO...")}
                            className="p-10 bg-orange-600 rounded-[3rem] shadow-[0_20px_50px_rgba(234,88,12,0.3)] group hover:scale-105 transition-all text-center cursor-pointer border-t-[10px] border-white/10 relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                            <Wallet className="w-12 h-12 text-black mx-auto mb-4 drop-shadow-lg" />
                            <h2 className="text-2xl font-black italic text-black uppercase tracking-tighter leading-none mb-2">EJECUTAR LIQUIDACIÓN</h2>
                            <p className="text-[10px] font-bold text-black/60 uppercase tracking-widest">PROCESO DE CIERRE MENSUAL</p>
                        </div>
                    </div>

                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { 
                    background: rgba(255, 255, 255, 0.05); 
                    border-radius: 10px; 
                }
            `}</style>
        </div>
    )
}
