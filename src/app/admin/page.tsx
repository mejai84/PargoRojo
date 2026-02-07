"use client"

import { Button } from "@/components/ui/button"
import {
    DollarSign,
    ShoppingBag,
    Users,
    TrendingUp,
    Clock,
    Loader2,
    ArrowUpRight,
    ArrowDownRight,
    Eye,
    Zap,
    Calendar,
    ArrowRight,
    Search,
    RefreshCw,
    Activity,
    Smartphone,
    Monitor,
    Globe,
    Shield,
    FileText
} from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import Link from "next/link"
import { formatPrice } from "@/lib/utils"
import { cn } from "@/lib/utils"

export default function AdminDashboard() {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        todayRevenue: 0,
        yesterdayRevenue: 0,
        activeOrders: 0,
        totalOrdersToday: 0,
        yesterdayOrders: 0,
        newCustomers: 0
    })
    const [recentOrders, setRecentOrders] = useState<any[]>([])
    const [topProducts, setTopProducts] = useState<any[]>([])
    const [currentTime, setCurrentTime] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        fetchData()

        const channel = supabase.channel('dashboard-sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchData)
            .subscribe()

        return () => {
            clearInterval(timer)
            supabase.removeChannel(channel)
        }
    }, [])

    const fetchData = async () => {
        setLoading(true)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayISO = today.toISOString()

        const { data: oToday } = await supabase.from('orders').select('total, status').gte('created_at', todayISO)

        if (oToday) {
            const revenue = oToday.reduce((a, b) => a + (b.total || 0), 0)
            const active = oToday.filter(o => !['delivered', 'cancelled'].includes(o.status)).length
            setStats(prev => ({
                ...prev,
                todayRevenue: revenue,
                totalOrdersToday: oToday.length,
                activeOrders: active
            }))
        }

        const { data: recent } = await supabase
            .from('orders')
            .select(`*, order_items(quantity, products(name))`)
            .order('created_at', { ascending: false })
            .limit(6)

        if (recent) setRecentOrders(recent)

        const { data: items } = await supabase
            .from('order_items')
            .select('quantity, unit_price, products(name)')
            .gte('created_at', todayISO)

        if (items) {
            const counts: any = {}
            items.forEach((it: any) => {
                const name = it.products?.name || 'Insumo'
                counts[name] = (counts[name] || 0) + it.quantity
            })
            setTopProducts(Object.entries(counts).map(([name, qty]) => ({ name, qty: qty as number })).sort((a, b) => b.qty - a.qty).slice(0, 5))
        }

        setLoading(false)
    }

    return (
        <div className="space-y-12 animate-in fade-in duration-700">

            {/* 👑 VIP HERO HEADER */}
            <div className="relative group rounded-[3rem] overflow-hidden bg-white border border-slate-200 p-8 md:p-12 shadow-sm">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
                <div className="relative z-10 flex flex-col lg:flex-row justify-between lg:items-center gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-2">
                                <Activity className="w-3 h-3" /> SISTEMA OPERATIVO
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{currentTime.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                        </div>
                        <h1 className="text-3xl sm:text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
                            COMMAND <span className="text-primary italic">CENTER</span>
                        </h1>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] flex items-center gap-4">
                            <span className="flex items-center gap-1.5"><Globe className="w-3 h-3 text-emerald-600" /> Cloud Sync Active</span>
                            <span className="flex items-center gap-1.5 font-mono text-slate-900">{currentTime.toLocaleTimeString('es-CO')}</span>
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <button onClick={fetchData} className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center hover:bg-primary hover:text-black hover:border-primary transition-all group-hover:rotate-180 duration-500 shadow-sm">
                            <RefreshCw className="w-6 h-6" />
                        </button>
                        <Link href="/admin/orders">
                            <Button className="h-14 px-8 bg-primary text-black rounded-2xl font-black uppercase text-[10px] tracking-widest italic hover:bg-slate-900 hover:text-white transition-all shadow-xl shadow-primary/20 gap-3">
                                NUEVA VENTA <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* 📊 CORE METRICS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <HighEndKPI label="Ventas Brutas" value={formatPrice(stats.todayRevenue)} trend="+12.5%" trendUp={true} delay="0" color="text-primary" />
                <HighEndKPI label="Flujo de Caja" value={stats.totalOrdersToday} subValue="Órdenes hoy" trend="+4%" trendUp={true} delay="100" color="text-slate-900" />
                <HighEndKPI label="Ocupación Live" value={stats.activeOrders} subValue="Mesas activas" trend="High" trendUp={true} delay="200" color="text-emerald-600" />
                <HighEndKPI label="Fidelización" value="24" subValue="Nuevos Clientes" trend="+8%" trendUp={true} delay="300" color="text-blue-600" />
            </div>

            {/* 🛠️ CONTROL GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                {/* Traffic Control (Orders) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-6">
                        <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 italic">Tráfico de Pedidos</h3>
                        <Link href="/admin/orders" className="text-[10px] font-black text-primary hover:underline italic uppercase tracking-widest">Auditar Todo</Link>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-sm">
                        <div className="divide-y divide-slate-100">
                            {recentOrders.map((order, i) => (
                                <div key={order.id} className="p-6 md:p-8 hover:bg-slate-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                                    <div className="flex items-center gap-4 md:gap-6">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center font-mono text-[10px] font-black text-slate-400 group-hover:border-primary/30 group-hover:text-primary transition-all">
                                            #{order.id.split('-')[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-black italic uppercase tracking-tight text-slate-900">{order.guest_info?.name || 'Mostrador'}</p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">{new Date(order.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
                                                <div className="w-1 h-1 rounded-full bg-slate-200" />
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">{order.order_items?.length || 0} ITEMS</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <span className="text-lg font-black italic tracking-tighter text-slate-900">${(order.total || 0).toLocaleString()}</span>
                                        <div className={cn(
                                            "px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border italic",
                                            order.status === 'delivered' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                                                order.status === 'pending' ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : "bg-slate-100 text-slate-500 border-slate-200"
                                        )}>
                                            {order.status}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Popular Insights */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-6">
                        <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 italic">Preferencia HOY</h3>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-[3rem] p-8 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 text-primary rotate-12">
                            <TrendingUp className="w-40 h-40" />
                        </div>
                        <div className="space-y-6 relative z-10">
                            {topProducts.map((p, idx) => (
                                <div key={idx} className="space-y-2">
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">{p.name}</span>
                                        <span className="text-xs font-black italic text-slate-900">{p.qty}u</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all duration-1000"
                                            style={{ width: `${Math.min((p.qty / (topProducts[0]?.qty || 1)) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                            {topProducts.length === 0 && <p className="text-[10px] text-slate-300 font-bold uppercase text-center py-10">Sin data de ventas</p>}
                        </div>
                    </div>

                    {/* Quick Access Grid */}
                    <div className="grid grid-cols-2 gap-4 pt-4">
                        <DashboardAction icon={<Calendar />} label="Agenda" href="/admin/reservations" />
                        <DashboardAction icon={<Users />} label="Clientes" href="/admin/customers" />
                        <DashboardAction icon={<Smartphone />} label="POS APP" href="/admin/cashier" />
                        <DashboardAction icon={<Monitor />} label="Cocinero" href="/admin/kitchen" />
                    </div>

                    {/* SUPERVISION & SECURITY */}
                    <div className="pt-8 border-t border-slate-100">
                        <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 italic mb-6">Supervisión</h3>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            <DashboardAction icon={<FileText className="text-purple-500" />} label="Auditoría" href="/admin/audit" />
                            <DashboardAction icon={<Shield className="text-emerald-500" />} label="Permisos" href="/admin/employees" />
                            <DashboardAction icon={<Users className="text-blue-500" />} label="Staff" href="/admin/employees" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function HighEndKPI({ label, value, trend, trendUp, delay, color, subValue }: any) {
    return (
        <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-sm relative overflow-hidden group hover:border-primary/50 transition-all">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-125 group-hover:rotate-6 transition-all duration-700">
                <Zap className={cn("w-12 h-12", color)} />
            </div>
            <div className="relative z-10 space-y-4">
                <div className="flex justify-between items-start">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 italic">{label}</p>
                    <div className={cn("flex items-center gap-1.5 text-[10px] font-black italic", trendUp ? "text-emerald-600" : "text-rose-600")}>
                        {trendUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        {trend}
                    </div>
                </div>
                <div>
                    <h2 className={cn("text-4xl font-black italic tracking-tighter leading-none shrink-0", color)}>{value}</h2>
                    {subValue && <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2 italic">{subValue}</p>}
                </div>
            </div>
        </div>
    )
}

function DashboardAction({ icon, label, href }: any) {
    return (
        <Link href={href}>
            <div className="p-6 rounded-[2rem] bg-white border border-slate-100 hover:border-primary/50 hover:bg-slate-50 transition-all flex flex-col items-center gap-3 group shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                    {icon}
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-900 transition-colors">{label}</span>
            </div>
        </Link>
    )
}
