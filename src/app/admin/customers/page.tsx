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
        <div className="min-h-screen text-white font-sans relative overflow-hidden flex flex-col h-screen">

            {/* 🖼️ FONDO PREMIUM: Lifestyle / Social con Blur */}
            <div className="fixed inset-0 bg-[url('https://images.unsplash.com/photo-1556740734-7f1a02dd1d5c?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center scale-105 pointer-events-none" />
            <div className="fixed inset-0 backdrop-blur-[80px] bg-slate-950/90 pointer-events-none" />

            {/* HEADER DE ELITE */}
            <div className="relative z-20 p-8 flex items-center justify-between border-b border-white/5 bg-slate-950/40 backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-6">
                    <Link href="/admin">
                        <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10">
                            <ArrowLeft className="w-6 h-6 text-slate-400" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none">ELITE <span className="text-orange-500">DATABASE</span></h1>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] mt-2 italic shadow-sm">Customer Relationship & Loyalty Intelligence</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex bg-slate-900/40 p-1.5 rounded-2xl border border-white/5">
                        {[
                            { id: 'database', label: 'CLIENTES', icon: Users },
                            { id: 'loyalty', label: 'FIDELIDAD', icon: Trophy },
                            { id: 'notifications', label: 'MENSAJERÍA', icon: MessageCircle }
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setView(t.id as any)}
                                className={cn(
                                    "px-6 py-2.5 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all",
                                    view === t.id ? "bg-orange-500 text-black shadow-xl shadow-orange-500/20" : "text-slate-500 hover:text-white"
                                )}
                            >
                                <t.icon className="w-3.5 h-3.5" />
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="relative z-10 p-8 flex-1 overflow-hidden flex flex-col gap-8 max-w-[1800px] mx-auto w-full">

                {/* 1. KPI DESCRIPTORS */}
                <div className="grid grid-cols-4 gap-6 shrink-0">
                    {[
                        { label: 'CLIENTES TOTALES', val: customers.length, icon: Users, color: 'text-white' },
                        { label: 'CLIENTES VIP (LTV > 500k)', val: customers.filter(c => c.totalSpent > 500000).length, icon: Star, color: 'text-yellow-400' },
                        { label: 'PUNTOS CIRCULANTES', val: customers.reduce((acc, c) => acc + c.points, 0).toLocaleString(), icon: Trophy, color: 'text-orange-500' },
                        { label: 'FIDELIZACIÓN RATE', val: '64%', icon: Heart, color: 'text-rose-500' },
                    ].map((card, i) => (
                        <div key={i} className="bg-slate-800/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex items-center gap-6 group hover:border-orange-500/20 transition-all">
                            <div className="p-4 bg-white/5 rounded-2xl group-hover:bg-orange-500/10 transition-all">
                                <card.icon className={cn("w-6 h-6", card.color)} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{card.label}</p>
                                <p className={cn("text-3xl font-black italic tracking-tighter", card.color)}>{card.val}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 2. MAIN WORKSPACE */}
                <div className="flex-1 bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] overflow-hidden flex flex-col relative">

                    {/* Search & Action Bar */}
                    <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                        <div className="relative w-96 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-orange-500 transition-colors" />
                            <input
                                placeholder="Buscar en la base de datos de élite..."
                                className="w-full bg-slate-800/30 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-orange-500/50"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-4">
                            <Button variant="ghost" className="h-12 rounded-xl bg-white/5 border border-white/10 text-slate-400">
                                <Filter className="w-4 h-4 mr-2" /> Segmentar
                            </Button>
                            <Button className="h-12 px-8 bg-orange-600 hover:bg-orange-700 text-black font-black uppercase text-[10px] italic tracking-widest rounded-xl">
                                NUEVE REGISTRO
                            </Button>
                        </div>
                    </div>

                    {/* Table Style Database */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
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
                                                <button className="p-2.5 rounded-xl bg-orange-600/10 text-orange-500 hover:bg-orange-600 hover:text-black border border-orange-500/20 transition-all">
                                                    <MessageCircle className="w-4 h-4" />
                                                </button>
                                                <button className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:text-white border border-white/10 transition-all">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 3. AI INSIGHT FOOTER */}
                <div className="flex items-center justify-between p-8 bg-orange-600 rounded-[2.5rem] shrink-0 shadow-2xl shadow-orange-950/20">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center">
                            <Sparkles className="w-8 h-8 text-orange-500 animate-pulse" />
                        </div>
                        <div>
                            <h4 className="text-2xl font-black italic text-black uppercase tracking-tighter leading-none">Discovery Insights: Clientes Nocturnos</h4>
                            <p className="text-[10px] font-bold text-black/60 uppercase tracking-widest mt-1">Se detectó una alta frecuencia de pedidos de mesa entre 20:00 y 22:00.</p>
                        </div>
                    </div>
                    <Button className="bg-black text-white hover:bg-slate-900 h-14 px-10 rounded-2xl font-black italic uppercase text-xs tracking-[0.2em]">
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
