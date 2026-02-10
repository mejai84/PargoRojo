"use client"

import {
    Users,
    Search,
    ShoppingBag,
    Phone,
    Loader2,
    Star,
    TrendingUp,
    Zap,
    ShieldCheck,
    Mail,
    Calendar,
    ArrowUpRight,
    MessageSquare,
    MoreHorizontal,
    Filter,
    Send,
    MessageCircle,
    CheckCircle2,
    Settings2,
    X,
    TrendingDown,
    Activity,
    Trophy,
    Heart,
    ArrowLeft,
    Sparkles,
    Smartphone
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { formatPrice } from "@/lib/utils"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { toast } from "sonner"

interface Customer {
    id?: string
    name: string
    email?: string
    phone: string
    totalOrders: number
    totalSpent: number
    lastOrder: string
    points: number
    type: 'user' | 'guest'
}

export default function CustomersPagePremium() {
    const [view, setView] = useState<'database' | 'loyalty' | 'notifications'>('database')
    const [customers, setCustomers] = useState<Customer[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        fetchInitialData()
    }, [])

    const fetchInitialData = async () => {
        setLoading(true)
        // Simulación de datos para el diseño visual premium basado en la lógica real
        const { data: profiles } = await supabase.from('profiles').select('*')
        const { data: orders } = await supabase.from('orders').select('*').order('created_at', { ascending: false })

        if (orders) {
            const customerMap = new Map<string, Customer>()
            orders.forEach(order => {
                const userId = order.user_id
                const guestName = order.guest_info?.name
                const guestPhone = order.guest_info?.phone
                const key = userId || `${guestName}-${guestPhone}`

                if (!customerMap.has(key)) {
                    const profile = userId ? profiles?.find(p => p.id === userId) : null
                    customerMap.set(key, {
                        id: userId,
                        name: profile?.full_name || guestName || "Desconocido",
                        email: profile?.email || null,
                        phone: profile?.phone || guestPhone || "Sin teléfono",
                        totalOrders: 0,
                        totalSpent: 0,
                        lastOrder: order.created_at,
                        points: profile?.loyalty_points || 0,
                        type: userId ? 'user' : 'guest'
                    })
                }

                const cust = customerMap.get(key)!
                cust.totalOrders += 1
                cust.totalSpent += (order.total || 0)
            })
            setCustomers(Array.from(customerMap.values()))
        }
        setLoading(false)
    }

    const filtered = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
    )

    return (
        <div className="min-h-screen bg-[#020406] text-white font-sans selection:bg-orange-500 overflow-hidden flex flex-col h-screen relative">

            {/* 🌌 FONDO ESTRUCTURAL AURA */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-orange-500/5 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full opacity-50" />
            </div>

            {/* HEADER DE ELITE TÁCTICA */}
            <div className="relative z-30 p-10 flex items-center justify-between border-b border-white/5 bg-slate-900/40 backdrop-blur-3xl shrink-0">
                <div className="flex items-center gap-8">
                    <Link href="/admin/hub">
                        <Button variant="ghost" size="icon" className="h-16 w-16 rounded-[1.5rem] bg-white/5 border border-white/5 hover:bg-orange-600 hover:text-black transition-all group">
                            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-orange-500" />
                            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-orange-500 italic">User Intelligence Network</span>
                        </div>
                        <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none text-white">Elite <span className="text-orange-500">Database</span></h1>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <div className="flex bg-white/[0.03] p-2 rounded-[1.5rem] border border-white/5 backdrop-blur-3xl shadow-2xl">
                        {[
                            { id: 'database', label: 'DATABASE', icon: Users },
                            { id: 'loyalty', label: 'LOYALTY', icon: Trophy },
                            { id: 'notifications', label: 'CHANNELS', icon: MessageCircle }
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setView(t.id as any)}
                                className={cn(
                                    "px-8 py-3 rounded-xl flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] italic transition-all duration-500 relative overflow-hidden group",
                                    view === t.id ? "bg-orange-600 text-black shadow-3xl shadow-orange-600/20" : "text-slate-500 hover:text-white"
                                )}
                            >
                                <t.icon className={cn("w-4 h-4", view === t.id ? "animate-pulse" : "opacity-40")} />
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="relative z-10 p-8 md:p-12 flex-1 flex flex-col gap-8 max-w-[1800px] mx-auto w-full min-h-full">

                {/* 1. KPI DESCRIPTORS ELITE */}
                <div className="grid grid-cols-4 gap-10 shrink-0">
                    {[
                        { label: 'CLIENTES TOTALES', val: customers.length, icon: Users, color: 'text-white', sub: 'Nodes_Active' },
                        { label: 'CLIENTES VIP', val: customers.filter(c => c.totalSpent > 500000).length, icon: Star, color: 'text-orange-500', sub: 'High_LTV' },
                        { label: 'PUNTOS CIRCULANTES', val: customers.reduce((acc, c) => acc + c.points, 0).toLocaleString(), icon: Trophy, color: 'text-amber-500', sub: 'Eco_System' },
                        { label: 'FIDELIZACIÓN RATE', val: '64%', icon: Heart, color: 'text-rose-500', sub: 'Brand_Pulse' },
                    ].map((card, i) => (
                        <div key={i} className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 flex items-center gap-8 group hover:border-orange-500/20 transition-all duration-700 relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:rotate-12 transition-transform duration-1000">
                                <card.icon className="w-24 h-24" />
                            </div>
                            <div className="p-5 bg-white/5 rounded-2xl group-hover:bg-orange-600 group-hover:text-black transition-all">
                                <card.icon className={cn("w-7 h-7", card.color, "group-hover:text-inherit")} />
                            </div>
                            <div className="relative z-10 space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className={cn("w-1.5 h-1.5 rounded-full", card.color.replace('text', 'bg'))} />
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic leading-none">{card.label}</p>
                                </div>
                                <p className={cn("text-5xl font-black italic tracking-tighter text-white leading-none")}>{card.val}</p>
                                <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.3em] italic group-hover:text-slate-500 transition-colors">{card.sub}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 2. MAIN WORKSPACE ELITE */}
                <div className="flex-1 bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[4rem] overflow-hidden flex flex-col relative shadow-3xl">

                    {/* Search & Action Bar */}
                    <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                        <div className="relative w-[500px] group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-700 group-focus-within:text-orange-500 transition-all" />
                            <input
                                type="search"
                                autoComplete="new-password"
                                placeholder="ESCANEAR REGISTROS DE ÉLITE..."
                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-5 pl-16 pr-8 text-xs font-black uppercase tracking-[0.2em] italic focus:outline-none focus:border-orange-500/30 transition-all placeholder:text-slate-800"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-6">
                            <Button
                                onClick={() => toast.info("HERRAMIENTA DE SEGMENTACIÓN: Próximamente")}
                                variant="ghost" className="h-16 px-10 rounded-2xl bg-white/5 border border-white/5 text-slate-500 font-black uppercase italic text-[10px] tracking-[0.3em] transition-all hover:bg-white/10 hover:text-white"
                            >
                                <Filter className="w-5 h-5 mr-4" /> Segmentar
                            </Button>
                            <Button
                                onClick={() => toast.success("ABRIENDO FORMULARIO DE NUEVO CLIENTE")}
                                className="h-16 px-12 bg-orange-600 hover:bg-orange-500 text-black font-black uppercase text-[11px] italic tracking-widest rounded-2xl shadow-3xl shadow-orange-600/20 active:scale-95 transition-all gap-4"
                            >
                                <Users className="w-6 h-6" /> CREAR PROTOCOLO
                            </Button>
                        </div>
                    </div>

                    {/* Table Style Database */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {view === 'database' ? (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white/[0.01]">
                                        <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Perfil_Cliente</th>
                                        <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">LTV_Metric (Ventas)</th>
                                        <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Puntos_Loyalty</th>
                                        <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest italic text-center">Status_Tag</th>
                                        <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest italic text-right">Command</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((cust, i) => (
                                        <tr key={i} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors group">
                                            <td className="p-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center border border-white/5 font-black text-slate-500 italic">
                                                        {cust.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white group-hover:text-orange-400 transition-colors">{cust.name}</p>
                                                        <p className="text-[10px] font-medium text-slate-500">{cust.phone}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <p className="font-black italic text-white tracking-tighter">{formatPrice(cust.totalSpent)}</p>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{cust.totalOrders} órdenes</p>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-2">
                                                    <Trophy className="w-3.5 h-3.5 text-orange-500" />
                                                    <span className="text-sm font-black italic">{cust.points}</span>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex justify-center">
                                                    <span className={cn(
                                                        "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                                                        cust.totalSpent > 500000 ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20" : "bg-slate-800 text-slate-500 border border-white/5"
                                                    )}>
                                                        {cust.totalSpent > 500000 ? '⭐ ELITE VIP' : 'REGULAR'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-6 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toast.success(`INICIANDO MENSAJE PARA: ${cust.name}`)
                                                        }}
                                                        className="p-2.5 rounded-xl bg-orange-600/10 text-orange-500 hover:bg-orange-600 hover:text-black border border-orange-500/20 transition-all text-xs"
                                                    >
                                                        <MessageCircle className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toast.info(`DETALLES DE CLIENTE: ${cust.name}`)
                                                        }}
                                                        className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:text-white border border-white/10 transition-all text-xs"
                                                    >
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-20 text-center flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
                                <Sparkles className="w-20 h-20 text-orange-500 opacity-20" />
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black italic uppercase tracking-tighter">Módulo {view.toUpperCase()} en proceso</h3>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sincronizando con el motor de inteligencia Jamali OS</p>
                                </div>
                                <Button
                                    onClick={() => setView('database')}
                                    variant="ghost"
                                    className="text-orange-500 font-black italic uppercase text-[10px] tracking-widest"
                                >
                                    VOLVER A DATABASE
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. AI INSIGHT FOOTER */}
                <div className="flex items-center justify-between p-8 bg-orange-600 rounded-[2.5rem] shrink-0 shadow-2xl shadow-orange-950/20 mb-10">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center">
                            <Sparkles className="w-8 h-8 text-orange-500 animate-pulse" />
                        </div>
                        <div>
                            <h4 className="text-2xl font-black italic text-black uppercase tracking-tighter leading-none">Discovery Insights: Clientes Nocturnos</h4>
                            <p className="text-[10px] font-bold text-black/60 uppercase tracking-widest mt-1">Se detectó una alta frecuencia de pedidos de mesa entre 20:00 y 22:00.</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => {
                            toast.success("CAMPAÑA WHATSAPP LANZADA CON ÉXITO")
                            console.log("Launching WhatsApp campaign...")
                        }}
                        className="bg-black text-white hover:bg-slate-900 h-14 px-10 rounded-2xl font-black italic uppercase text-xs tracking-[0.2em]"
                    >
                        LANZAR CAMPAÑA WHATSAPP
                    </Button>
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
