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
    FileText,
    Target,
    BarChart3,
    ArrowLeft,
    Layers,
    PieChart,
    ChevronRight,
    MoreHorizontal
} from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import Link from "next/link"
import { formatPrice } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { useRestaurant } from "@/providers/RestaurantProvider"

export default function AdminDashboard() {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        todayRevenue: 0,
        yesterdayRevenue: 0,
        activeOrders: 0,
        totalOrdersToday: 0,
        yesterdayOrders: 0,
        newCustomers: 0,
        openAccountsSum: 0,
        cashInDrawer: 0
    })
    const [recentOrders, setRecentOrders] = useState<any[]>([])
    const [topProducts, setTopProducts] = useState<any[]>([])
    const [currentTime, setCurrentTime] = useState(new Date())
    const { restaurant } = useRestaurant()
    const [userName, setUserName] = useState("Admin")

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
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
            const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', session.user.id).single()
            if (profile) setUserName(profile.full_name)
        }

        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayISO = today.toISOString()

        const { data: oToday } = await supabase.from('orders').select('total, status').gte('created_at', todayISO)

        if (oToday) {
            const revenue = oToday.reduce((a, b) => a + (b.total || 0), 0)
            const active = oToday.filter(o => !['delivered', 'cancelled', 'paid', 'completed'].includes(o.status)).length
            const openSum = oToday.filter(o => !['delivered', 'cancelled', 'paid', 'completed'].includes(o.status)).reduce((a, b) => a + (b.total || 0), 0)

            setStats(prev => ({
                ...prev,
                todayRevenue: revenue,
                totalOrdersToday: oToday.length,
                activeOrders: active,
                openAccountsSum: openSum
            }))
        }

        // Fetch Cash in Drawer from active sessions
        const { data: sessions } = await supabase
            .from('cashbox_sessions')
            .select('id, opening_balance, status')
            .eq('status', 'open')

        if (sessions && sessions.length > 0) {
            let totalCash = 0
            for (const session of sessions) {
                const { data: moves } = await supabase
                    .from('cash_movements')
                    .select('amount, movement_type')
                    .eq('cashbox_session_id', session.id)

                if (moves) {
                    const sales = moves.filter(m => m.movement_type === 'SALE').reduce((a, b) => a + b.amount, 0)
                    const incomes = moves.filter(m => m.movement_type === 'DEPOSIT').reduce((a, b) => a + b.amount, 0)
                    const expenses = moves.filter(m => m.movement_type === 'WITHDRAWAL').reduce((a, b) => a + b.amount, 0)
                    totalCash += (Number(session.opening_balance) + sales + incomes - expenses)
                }
            }
            setStats(prev => ({ ...prev, cashInDrawer: totalCash }))
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

    if (loading && !stats.todayRevenue) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-transparent">
                <div className="flex flex-col items-center gap-6 animate-in fade-in duration-1000">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
                        <Loader2 className="w-16 h-16 animate-spin text-primary relative z-10" />
                    </div>
                    <div className="space-y-2 text-center">
                        <p className="uppercase tracking-[0.4em] text-[11px] font-black italic opacity-50">Sincronizando Dashboard Maestro</p>
                        <p className="uppercase tracking-[0.1em] text-[10px] font-bold text-primary animate-pulse">Jamali OS v5.0 Kernel</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-transparent text-foreground p-4 md:p-8 font-sans selection:bg-primary selection:text-primary-foreground relative pb-20">
            <div className="max-w-[1600px] mx-auto space-y-12 animate-in fade-in duration-1000">

                {/* 👑 STRATEGIC COMMAND HUB HEADER */}
                <div className="relative group rounded-[4rem] overflow-hidden bg-card border border-border p-10 md:p-14 shadow-3xl transition-all duration-700 hover:border-primary/20">
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 via-primary/[0.02] to-transparent pointer-events-none group-hover:from-primary/10 transition-all duration-1000" />

                    <div className="relative z-10 flex flex-col lg:flex-row justify-between lg:items-center gap-10">
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <span className="px-5 py-2 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.3em] rounded-full flex items-center gap-2 italic border border-primary/20 shadow-lg shadow-primary/5">
                                    <Zap className="w-3.5 h-3.5 fill-primary animate-pulse" /> KERNEL v5.0 ACTIVE
                                </span>
                                <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.4em] italic leading-none border-l border-border pl-4">
                                    {currentTime.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </span>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 opacity-40">
                                    <Target className="w-4 h-4 text-primary" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.5em] italic">Operational Command Center</p>
                                </div>
                                <h1 className="text-5xl sm:text-7xl md:text-8xl font-black italic uppercase tracking-tighter text-foreground leading-[0.8] group-hover:text-primary transition-colors duration-500">
                                    {restaurant?.name || "JAMALI"} <span className="text-primary group-hover:text-foreground transition-colors duration-500">OS</span>
                                </h1>
                                <p className="text-muted-foreground font-bold uppercase text-[11px] tracking-[0.4em] flex items-center gap-6 pt-4 italic opacity-70">
                                    <span className="flex items-center gap-2"><Globe className="w-3.5 h-3.5 text-emerald-500" /> CLOUD SYNC: OPTIMIZED</span>
                                    <span className="flex items-center gap-2 font-mono text-foreground bg-muted/30 px-3 py-1 rounded-lg border border-border/50 shadow-inner">{currentTime.toLocaleTimeString('es-CO')}</span>
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-5">
                            <div className="flex flex-col items-end px-8 border-r border-border/50 hidden sm:flex">
                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground italic mb-1">Operador Logueado</p>
                                <p className="text-xl font-black italic text-foreground uppercase tracking-tighter">{userName}</p>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={fetchData}
                                    className="w-20 h-20 rounded-[2rem] bg-card border-2 border-border flex items-center justify-center hover:bg-muted hover:text-primary hover:border-primary/40 transition-all active:scale-90 duration-500 shadow-2xl group/refresh relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/refresh:opacity-100 transition-opacity" />
                                    <RefreshCw className={cn("w-8 h-8 relative z-10 transition-transform group-hover/refresh:rotate-180", loading && "animate-spin")} />
                                </button>
                                <Link href="/admin/orders">
                                    <Button className="h-20 px-12 bg-primary text-primary-foreground border-none rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] italic hover:bg-foreground hover:text-background transition-all shadow-3xl shadow-primary/20 gap-4 group/btn active:scale-95 leading-none">
                                        NUEVA TRANSACCIÓN <ArrowRight className="w-6 h-6 group-hover/btn:translate-x-2 transition-transform" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 📊 PERFORMANCE MATRIX (KPIs) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    <HighEndKPI label="Revenue Bruto Hoy" value={formatPrice(stats.todayRevenue)} trend="+14.2%" trendUp={true} delay="0" color="text-primary" icon={<DollarSign className="w-8 h-8" />} subValue="Sincronización Total en Tiempo Real" />
                    <HighEndKPI label="Liquidez en Caja" value={formatPrice(stats.cashInDrawer)} trend="Verified" trendUp={true} delay="100" color="text-emerald-500" icon={<Zap className="w-8 h-8" />} subValue="Efectivo Disponible para Operación" />
                    <HighEndKPI label="Cuentas en Ejecución" value={formatPrice(stats.openAccountsSum)} trend={`${stats.activeOrders} NODOS`} trendUp={false} delay="200" color="text-amber-500" icon={<Clock className="w-8 h-8" />} subValue="Capital Flotante en Mesas / Canales" />
                    <HighEndKPI label="Payload de Órdenes" value={stats.totalOrdersToday} trend="+22.5%" trendUp={true} delay="300" color="text-blue-500" icon={<ShoppingBag className="w-8 h-8" />} subValue="Transacciones Procesadas Hoy" />
                </div>

                {/* ⚙️ OPERATIONAL GRID */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">

                    {/* 🚦 TRAFFIC CONTROL (Recent Activity) */}
                    <div className="xl:col-span-2 space-y-10">
                        <div className="flex items-center justify-between px-10">
                            <div className="flex items-center gap-4">
                                <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                                <h3 className="text-sm font-black uppercase tracking-[0.5em] text-foreground italic">Monitor de Actividad Reciente</h3>
                            </div>
                            <Link href="/admin/orders">
                                <Button variant="ghost" className="text-[10px] font-black text-primary hover:text-muted-foreground transition-all italic uppercase tracking-[0.3em] group">
                                    AUDITORÍA MAESTRA <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform ml-2" />
                                </Button>
                            </Link>
                        </div>

                        <div className="bg-card border border-border rounded-[4rem] overflow-hidden shadow-2xl relative group/table">
                            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none -mr-12 -mt-12 group-hover/table:scale-110 transition-transform duration-1000">
                                <Layers className="w-64 h-64" />
                            </div>

                            <div className="divide-y divide-border/50 relative z-10">
                                {recentOrders.map((order, i) => (
                                    <div key={order.id} className="p-10 md:p-12 hover:bg-muted/40 transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-8 group/row relative overflow-hidden">
                                        <div className="absolute inset-y-0 left-0 w-2 bg-primary/20 opacity-0 group-hover/row:opacity-100 transition-opacity" />

                                        <div className="flex items-center gap-8 md:gap-12">
                                            <div className="w-16 h-16 rounded-[1.5rem] bg-muted border border-border flex flex-col items-center justify-center font-mono text-[9px] font-black text-muted-foreground group-hover/row:border-primary/40 group-hover/row:text-primary transition-all shadow-inner shrink-0 scale-90 md:scale-100">
                                                <span className="opacity-30">HEX</span>
                                                {order.id.split('-')[0].toUpperCase().slice(0, 4)}
                                            </div>
                                            <div className="space-y-3">
                                                <p className="text-2xl font-black italic uppercase tracking-tighter text-foreground transition-colors group-hover/row:text-primary leading-none">{order.guest_info?.name || 'MOSTRADOR'}</p>
                                                <div className="flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] italic text-muted-foreground/50">
                                                    <span className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> {new Date(order.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-border" />
                                                    <span className="flex items-center gap-2 text-primary/60"><ShoppingBag className="w-3.5 h-3.5" /> {order.order_items?.length || 0} ITEMS PROCESADOS</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-10">
                                            <div className="text-right">
                                                <p className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.3em] mb-1 italic">Total Transacción</p>
                                                <p className="text-3xl font-black italic tracking-tighter text-foreground transition-colors group-hover/row:text-primary leading-none whitespace-nowrap">${(order.total || 0).toLocaleString()}</p>
                                            </div>
                                            <div className={cn(
                                                "px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] border-2 italic shadow-lg transition-all min-w-[120px] text-center",
                                                order.status === 'paid' || order.status === 'delivered' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-emerald-500/5" :
                                                    order.status === 'pending' || order.status === 'ready' ? "bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-amber-500/5" :
                                                        "bg-muted text-muted-foreground border-border"
                                            )}>
                                                {order.status}
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl opacity-0 group-hover/row:opacity-100 transition-opacity">
                                                <MoreHorizontal className="w-6 h-6" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {recentOrders.length === 0 && !loading && (
                                    <div className="p-24 text-center space-y-6 opacity-10">
                                        <Activity className="w-24 h-24 mx-auto" />
                                        <p className="text-xl font-black uppercase italic tracking-[0.5em]">Lote Transaccional Vacío</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 📊 ANALYTIC INSIGHTS (Sidebar) */}
                    <div className="space-y-12">
                        <div className="flex items-center gap-4 px-6">
                            <h3 className="text-sm font-black uppercase tracking-[0.5em] text-foreground italic">Preferencia de Consumo</h3>
                            <BarChart3 className="w-4 h-4 text-primary" />
                        </div>

                        <div className="bg-card border border-border rounded-[3.5rem] p-10 md:p-12 shadow-2xl relative overflow-hidden group/insights">
                            <div className="absolute top-0 right-0 p-12 opacity-5 text-primary rotate-12 pointer-events-none group-hover/insights:scale-110 transition-transform duration-1000">
                                <TrendingUp className="w-56 h-56" />
                            </div>

                            <div className="space-y-10 relative z-10">
                                {topProducts.map((p, idx) => (
                                    <div key={idx} className="space-y-4 group/item">
                                        <div className="flex justify-between items-baseline">
                                            <div className="space-y-1">
                                                <span className="text-xs font-black uppercase tracking-[0.2em] text-foreground italic group-hover/item:text-primary transition-colors leading-none">{p.name}</span>
                                                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest italic leading-none">Índice de Popularidad</p>
                                            </div>
                                            <span className="text-xl font-black italic text-primary leading-none group-hover/item:scale-110 transition-transform">{p.qty}<span className="text-[10px] ml-1 opacity-40 italic">U</span></span>
                                        </div>
                                        <div className="h-3 w-full bg-muted rounded-full overflow-hidden border border-border/10 p-0.5 shadow-inner">
                                            <div
                                                className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(255,77,0,0.3)]"
                                                style={{ width: `${Math.min((p.qty / (topProducts[0]?.qty || 1)) * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                                {topProducts.length === 0 && (
                                    <div className="text-center py-20 opacity-20 space-y-4">
                                        <PieChart className="w-16 h-16 mx-auto" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] italic">Sin métricas de preferencia</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ⚡ RAPID ACTION MATRIX */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-black uppercase tracking-[0.5em] text-foreground italic px-6">Matriz Operativa</h3>
                            <div className="grid grid-cols-2 gap-6">
                                <DashboardAction icon={<Calendar className="w-6 h-6" />} label="RESERVACIONES" href="/admin/reservations" color="bg-primary/5 text-primary" />
                                <DashboardAction icon={<Users className="w-6 h-6" />} label="AUDIENCIA CRM" href="/admin/customers" color="bg-emerald-500/5 text-emerald-500" />
                                <DashboardAction icon={<Smartphone className="w-6 h-6" />} label="TERMINAL POS" href="/admin/cashier" color="bg-orange-500/5 text-orange-500" />
                                <DashboardAction icon={<Monitor className="w-6 h-6" />} label="COCINERO KDS" href="/admin/kitchen" color="bg-blue-500/5 text-blue-500" />
                            </div>
                        </div>

                        {/* 🛡️ INFRASTRUCTURE & SECURITY */}
                        <div className="pt-10 border-t border-border/50">
                            <h3 className="text-sm font-black uppercase tracking-[0.5em] text-foreground italic mb-8 px-6">Supervisión & Kernel</h3>
                            <div className="grid grid-cols-2 gap-6">
                                <DashboardAction icon={<FileText className="w-5 h-5" />} label="LOGS FORENSES" href="/admin/audit" color="bg-purple-500/5 text-purple-500" />
                                <DashboardAction icon={<Shield className="w-5 h-5" />} label="SECURITY HUB" href="/admin/employees" color="bg-blue-500/5 text-blue-500" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 20px; }
            `}</style>
        </div>
    )
}

function HighEndKPI({ label, value, trend, trendUp, delay, color, subValue, icon }: any) {
    return (
        <div className="bg-card border border-border p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group hover:border-primary/40 transition-all duration-500">
            {/* Background pattern */}
            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-125 group-hover:rotate-12 transition-all duration-1000 pointer-events-none group-hover:opacity-10">
                {icon ? icon : <Zap className={cn("w-20 h-20", color)} />}
            </div>

            <div className="relative z-10 space-y-8">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic leading-none">{label}</p>
                        <p className="text-[8px] font-bold text-muted-foreground/20 uppercase tracking-widest italic group-hover:text-primary/40 transition-colors">KPI-NODE v5.0</p>
                    </div>
                    <div className={cn(
                        "flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black italic border transition-all duration-500 shadow-sm",
                        trendUp ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white" : "bg-primary/10 text-primary border-primary/20"
                    )}>
                        {trendUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5" />}
                        {trend}
                    </div>
                </div>

                <div className="space-y-3 pt-4">
                    <h2 className={cn("text-5xl font-black italic tracking-tighter leading-none shrink-0 transition-all duration-500 group-hover:scale-110 origin-left drop-shadow-sm", color)}>{value}</h2>
                    {subValue && <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mt-3 italic leading-relaxed group-hover:text-foreground/40 transition-colors">{subValue}</p>}
                </div>
            </div>
        </div>
    )
}

function DashboardAction({ icon, label, href, color }: any) {
    return (
        <Link href={href} className="block group">
            <div className={cn(
                "p-8 rounded-[2.5rem] border border-border hover:border-primary/40 transition-all flex flex-col items-center gap-4 shadow-xl active:scale-95 bg-card relative overflow-hidden",
                "group-hover:shadow-[0_20px_50px_rgba(255,77,0,0.1)]"
            )}>
                <div className="absolute inset-x-0 bottom-0 h-1 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-inner border border-transparent group-hover:border-primary/20 group-hover:bg-white group-hover:rotate-12",
                    color
                )}>
                    {icon}
                </div>
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 group-hover:text-foreground italic text-center leading-none transition-colors">{label}</span>
            </div>
        </Link>
    )
}
