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
    MoreHorizontal,
    Flame,
    Package,
    Utensils,
    Wallet,
    TrendingDown,
    AlertCircle,
    CheckCircle,
    Sparkles,
    Cpu
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

        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayISO = yesterday.toISOString()

        const { data: oToday } = await supabase.from('orders').select('total, status').gte('created_at', todayISO)
        const { data: oYesterday } = await supabase.from('orders').select('total, status').gte('created_at', yesterdayISO).lt('created_at', todayISO)

        if (oToday) {
            const revenue = oToday.reduce((a, b) => a + (b.total || 0), 0)
            const active = oToday.filter(o => !['delivered', 'cancelled', 'paid', 'completed'].includes(o.status)).length
            const openSum = oToday.filter(o => !['delivered', 'cancelled', 'paid', 'completed'].includes(o.status)).reduce((a, b) => a + (b.total || 0), 0)

            setStats(prev => ({
                ...prev,
                todayRevenue: revenue,
                totalOrdersToday: oToday.length,
                activeOrders: active,
                openAccountsSum: openSum,
                yesterdayRevenue: oYesterday?.reduce((a, b) => a + (b.total || 0), 0) || 0,
                yesterdayOrders: oYesterday?.length || 0
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
            .select(`*, order_items(quantity, products(name)), tables(table_name)`)
            .order('created_at', { ascending: false })
            .limit(8)

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

    const revenueChange = stats.yesterdayRevenue > 0
        ? ((stats.todayRevenue - stats.yesterdayRevenue) / stats.yesterdayRevenue * 100).toFixed(1)
        : 0

    const ordersChange = stats.yesterdayOrders > 0
        ? ((stats.totalOrdersToday - stats.yesterdayOrders) / stats.yesterdayOrders * 100).toFixed(1)
        : 0

    if (loading && !stats.todayRevenue) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-transparent">
                <div className="flex flex-col items-center gap-8 animate-in fade-in duration-1000">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
                        <Loader2 className="w-16 h-16 text-primary animate-spin relative z-10" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary italic animate-pulse">Sincronizando Centro de Comando...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-transparent text-foreground p-4 md:p-12 font-sans selection:bg-primary selection:text-primary-foreground relative overflow-hidden">

            {/* 🌌 AMBIANCE LAYER */}
            <div className="fixed top-0 left-0 w-full h-[600px] bg-gradient-to-b from-primary/10 via-primary/[0.02] to-transparent pointer-events-none z-0" />
            <div className="fixed -bottom-40 -right-40 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none opacity-20 z-0 animate-pulse" />

            <div className="max-w-[1900px] mx-auto space-y-12 animate-in fade-in duration-1000 relative z-10">

                {/* 🎯 COMMAND CENTER HEADER */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-12 border-b border-border/50 pb-12">
                    <div className="space-y-6">
                        <div className="flex flex-wrap items-center gap-4">
                            <h1 className="text-6xl md:text-7xl font-black italic tracking-tighter uppercase leading-none text-foreground">
                                COMMAND <span className="text-primary italic">CENTER</span>
                            </h1>
                            <div className="px-5 py-2 bg-emerald-500/10 border-2 border-emerald-500/20 rounded-[1.5rem] text-[11px] font-black text-emerald-500 tracking-[0.3em] italic uppercase shadow-xl animate-pulse flex items-center gap-3">
                                <Activity className="w-3 h-3" />
                                REALTIME_SYNC_ACTIVE
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <p className="text-[11px] text-muted-foreground font-black uppercase tracking-[0.5em] italic flex items-center gap-4 opacity-60">
                                <Cpu className="w-5 h-5 text-primary" />
                                Bienvenido, {userName}
                            </p>
                            <div className="h-4 w-px bg-border/40" />
                            <p className="text-[11px] text-muted-foreground font-black uppercase tracking-[0.5em] italic flex items-center gap-4 opacity-60">
                                <Clock className="w-5 h-5 text-primary" />
                                {currentTime.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </p>
                        </div>
                    </div>

                    <Button
                        onClick={fetchData}
                        className="h-20 w-20 bg-card border-4 border-border/40 rounded-[2.5rem] hover:text-primary hover:border-primary/40 shadow-3xl transition-all group/btn active:scale-90 flex items-center justify-center"
                    >
                        <RefreshCw className={cn("w-8 h-8 group-hover/btn:rotate-180 transition-transform duration-700", loading && "animate-spin")} />
                    </Button>
                </div>

                {/* 📊 CORE METRICS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                    {/* Revenue Card */}
                    <div className="group/card bg-gradient-to-br from-emerald-500/10 via-card/60 to-card/60 backdrop-blur-xl p-8 rounded-[3.5rem] border-4 border-emerald-500/20 shadow-2xl hover:shadow-emerald-500/10 transition-all relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="w-16 h-16 rounded-[2rem] bg-emerald-500/10 border-2 border-emerald-500/20 flex items-center justify-center shadow-lg">
                                    <DollarSign className="w-8 h-8 text-emerald-500" />
                                </div>
                                {Number(revenueChange) !== 0 && (
                                    <div className={cn(
                                        "px-4 py-2 rounded-[1.5rem] border-2 flex items-center gap-2",
                                        Number(revenueChange) > 0
                                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                                            : "bg-rose-500/10 border-rose-500/20 text-rose-500"
                                    )}>
                                        {Number(revenueChange) > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                        <span className="text-xs font-black italic">{Math.abs(Number(revenueChange))}%</span>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-emerald-500/60 uppercase tracking-[0.3em] italic">INGRESOS HOY</p>
                                <p className="text-5xl font-black italic text-emerald-500 leading-none tracking-tighter">
                                    {formatPrice(stats.todayRevenue)}
                                </p>
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                                    Ayer: {formatPrice(stats.yesterdayRevenue)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Active Orders Card */}
                    <div className="group/card bg-gradient-to-br from-primary/10 via-card/60 to-card/60 backdrop-blur-xl p-8 rounded-[3.5rem] border-4 border-primary/20 shadow-2xl hover:shadow-primary/10 transition-all relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="w-16 h-16 rounded-[2rem] bg-primary/10 border-2 border-primary/20 flex items-center justify-center shadow-lg">
                                    <Flame className="w-8 h-8 text-primary" />
                                </div>
                                {stats.activeOrders > 0 && (
                                    <div className="px-4 py-2 rounded-[1.5rem] border-2 bg-primary/10 border-primary/20 text-primary animate-pulse">
                                        <span className="text-xs font-black italic">ACTIVAS</span>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-primary/60 uppercase tracking-[0.3em] italic">ÓRDENES EN PROCESO</p>
                                <p className="text-5xl font-black italic text-primary leading-none tracking-tighter">
                                    {stats.activeOrders}
                                </p>
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                                    Total hoy: {stats.totalOrdersToday} ({Number(ordersChange) > 0 ? '+' : ''}{ordersChange}%)
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Cash in Drawer Card */}
                    <div className="group/card bg-gradient-to-br from-blue-500/10 via-card/60 to-card/60 backdrop-blur-xl p-8 rounded-[3.5rem] border-4 border-blue-500/20 shadow-2xl hover:shadow-blue-500/10 transition-all relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="w-16 h-16 rounded-[2rem] bg-blue-500/10 border-2 border-blue-500/20 flex items-center justify-center shadow-lg">
                                    <Wallet className="w-8 h-8 text-blue-500" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-blue-500/60 uppercase tracking-[0.3em] italic">EFECTIVO EN CAJA</p>
                                <p className="text-5xl font-black italic text-blue-500 leading-none tracking-tighter">
                                    {formatPrice(stats.cashInDrawer)}
                                </p>
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                                    Cuentas abiertas: {formatPrice(stats.openAccountsSum)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Top Products Card */}
                    <div className="group/card bg-gradient-to-br from-amber-500/10 via-card/60 to-card/60 backdrop-blur-xl p-8 rounded-[3.5rem] border-4 border-amber-500/20 shadow-2xl hover:shadow-amber-500/10 transition-all relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="w-16 h-16 rounded-[2rem] bg-amber-500/10 border-2 border-amber-500/20 flex items-center justify-center shadow-lg">
                                    <Utensils className="w-8 h-8 text-amber-500" />
                                </div>
                                {topProducts.length > 0 && (
                                    <div className="px-4 py-2 rounded-[1.5rem] border-2 bg-amber-500/10 border-amber-500/20 text-amber-500">
                                        <span className="text-xs font-black italic">TOP {topProducts.length}</span>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-amber-500/60 uppercase tracking-[0.3em] italic">MÁS VENDIDO HOY</p>
                                {topProducts[0] ? (
                                    <>
                                        <p className="text-3xl font-black italic text-amber-500 leading-none tracking-tighter truncate">
                                            {topProducts[0].name}
                                        </p>
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                                            {topProducts[0].qty} unidades vendidas
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-2xl font-black italic text-amber-500/40 leading-none">Sin datos</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 🎮 QUICK ACCESS MODULES */}
                <div className="space-y-8">
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter text-foreground flex items-center gap-4">
                        <Zap className="w-8 h-8 text-primary" />
                        ACCESO RÁPIDO
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {/* KDS Module */}
                        <Link href="/admin/kitchen">
                            <div className="group/module bg-gradient-to-br from-primary/10 via-card/80 to-card/80 backdrop-blur-xl p-10 rounded-[3.5rem] border-4 border-primary/20 shadow-2xl hover:shadow-primary/20 hover:border-primary/40 transition-all relative overflow-hidden cursor-pointer active:scale-[0.98]">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover/module:opacity-100 transition-opacity" />
                                <div className="absolute top-6 right-6">
                                    <ArrowRight className="w-8 h-8 text-primary opacity-0 group-hover/module:opacity-100 group-hover/module:translate-x-2 transition-all" />
                                </div>
                                <div className="relative z-10 space-y-6">
                                    <div className="w-20 h-20 rounded-[2.5rem] bg-primary/10 border-2 border-primary/20 flex items-center justify-center shadow-xl group-hover/module:scale-110 transition-transform">
                                        <Flame className="w-10 h-10 text-primary" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-3xl font-black italic uppercase tracking-tighter text-foreground group-hover/module:text-primary transition-colors">
                                            KDS PRO
                                        </h3>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                            Kitchen Display System
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Link>

                        {/* Inventory Module */}
                        <Link href="/admin/inventory">
                            <div className="group/module bg-gradient-to-br from-emerald-500/10 via-card/80 to-card/80 backdrop-blur-xl p-10 rounded-[3.5rem] border-4 border-emerald-500/20 shadow-2xl hover:shadow-emerald-500/20 hover:border-emerald-500/40 transition-all relative overflow-hidden cursor-pointer active:scale-[0.98]">
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover/module:opacity-100 transition-opacity" />
                                <div className="absolute top-6 right-6">
                                    <ArrowRight className="w-8 h-8 text-emerald-500 opacity-0 group-hover/module:opacity-100 group-hover/module:translate-x-2 transition-all" />
                                </div>
                                <div className="relative z-10 space-y-6">
                                    <div className="w-20 h-20 rounded-[2.5rem] bg-emerald-500/10 border-2 border-emerald-500/20 flex items-center justify-center shadow-xl group-hover/module:scale-110 transition-transform">
                                        <Package className="w-10 h-10 text-emerald-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-3xl font-black italic uppercase tracking-tighter text-foreground group-hover/module:text-emerald-500 transition-colors">
                                            INVENTARIO PRO
                                        </h3>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                            Gestión de Stock & Recetas
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Link>

                        {/* Payroll Module */}
                        <Link href="/admin/payroll">
                            <div className="group/module bg-gradient-to-br from-blue-500/10 via-card/80 to-card/80 backdrop-blur-xl p-10 rounded-[3.5rem] border-4 border-blue-500/20 shadow-2xl hover:shadow-blue-500/20 hover:border-blue-500/40 transition-all relative overflow-hidden cursor-pointer active:scale-[0.98]">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover/module:opacity-100 transition-opacity" />
                                <div className="absolute top-6 right-6">
                                    <ArrowRight className="w-8 h-8 text-blue-500 opacity-0 group-hover/module:opacity-100 group-hover/module:translate-x-2 transition-all" />
                                </div>
                                <div className="relative z-10 space-y-6">
                                    <div className="w-20 h-20 rounded-[2.5rem] bg-blue-500/10 border-2 border-blue-500/20 flex items-center justify-center shadow-xl group-hover/module:scale-110 transition-transform">
                                        <Users className="w-10 h-10 text-blue-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-3xl font-black italic uppercase tracking-tighter text-foreground group-hover/module:text-blue-500 transition-colors">
                                            NÓMINA
                                        </h3>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                            Gestión de Personal
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Link>

                        {/* POS Module */}
                        <Link href="/admin/pos">
                            <div className="group/module bg-gradient-to-br from-amber-500/10 via-card/80 to-card/80 backdrop-blur-xl p-10 rounded-[3.5rem] border-4 border-amber-500/20 shadow-2xl hover:shadow-amber-500/20 hover:border-amber-500/40 transition-all relative overflow-hidden cursor-pointer active:scale-[0.98]">
                                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover/module:opacity-100 transition-opacity" />
                                <div className="absolute top-6 right-6">
                                    <ArrowRight className="w-8 h-8 text-amber-500 opacity-0 group-hover/module:opacity-100 group-hover/module:translate-x-2 transition-all" />
                                </div>
                                <div className="relative z-10 space-y-6">
                                    <div className="w-20 h-20 rounded-[2.5rem] bg-amber-500/10 border-2 border-amber-500/20 flex items-center justify-center shadow-xl group-hover/module:scale-110 transition-transform">
                                        <ShoppingBag className="w-10 h-10 text-amber-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-3xl font-black italic uppercase tracking-tighter text-foreground group-hover/module:text-amber-500 transition-colors">
                                            PUNTO DE VENTA
                                        </h3>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                            Sistema POS
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Link>

                        {/* Cashier Module */}
                        <Link href="/admin/cashier">
                            <div className="group/module bg-gradient-to-br from-violet-500/10 via-card/80 to-card/80 backdrop-blur-xl p-10 rounded-[3.5rem] border-4 border-violet-500/20 shadow-2xl hover:shadow-violet-500/20 hover:border-violet-500/40 transition-all relative overflow-hidden cursor-pointer active:scale-[0.98]">
                                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent opacity-0 group-hover/module:opacity-100 transition-opacity" />
                                <div className="absolute top-6 right-6">
                                    <ArrowRight className="w-8 h-8 text-violet-500 opacity-0 group-hover/module:opacity-100 group-hover/module:translate-x-2 transition-all" />
                                </div>
                                <div className="relative z-10 space-y-6">
                                    <div className="w-20 h-20 rounded-[2.5rem] bg-violet-500/10 border-2 border-violet-500/20 flex items-center justify-center shadow-xl group-hover/module:scale-110 transition-transform">
                                        <Wallet className="w-10 h-10 text-violet-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-3xl font-black italic uppercase tracking-tighter text-foreground group-hover/module:text-violet-500 transition-colors">
                                            CAJA
                                        </h3>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                            Control de Efectivo
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Link>

                        {/* Audit Module */}
                        <Link href="/admin/audit">
                            <div className="group/module bg-gradient-to-br from-rose-500/10 via-card/80 to-card/80 backdrop-blur-xl p-10 rounded-[3.5rem] border-4 border-rose-500/20 shadow-2xl hover:shadow-rose-500/20 hover:border-rose-500/40 transition-all relative overflow-hidden cursor-pointer active:scale-[0.98]">
                                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent opacity-0 group-hover/module:opacity-100 transition-opacity" />
                                <div className="absolute top-6 right-6">
                                    <ArrowRight className="w-8 h-8 text-rose-500 opacity-0 group-hover/module:opacity-100 group-hover/module:translate-x-2 transition-all" />
                                </div>
                                <div className="relative z-10 space-y-6">
                                    <div className="w-20 h-20 rounded-[2.5rem] bg-rose-500/10 border-2 border-rose-500/20 flex items-center justify-center shadow-xl group-hover/module:scale-110 transition-transform">
                                        <Shield className="w-10 h-10 text-rose-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-3xl font-black italic uppercase tracking-tighter text-foreground group-hover/module:text-rose-500 transition-colors">
                                            AUDITORÍA
                                        </h3>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                            Registro de Eventos
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* 📋 RECENT ACTIVITY */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Recent Orders */}
                    <div className="xl:col-span-2 bg-card/60 backdrop-blur-xl p-10 rounded-[3.5rem] border-4 border-border/40 shadow-2xl space-y-8">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-foreground flex items-center gap-4">
                                <Activity className="w-6 h-6 text-primary" />
                                ACTIVIDAD RECIENTE
                            </h2>
                            <Link href="/admin/orders">
                                <Button variant="ghost" className="text-xs font-black uppercase tracking-widest italic hover:text-primary">
                                    VER TODAS <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                        </div>

                        <div className="space-y-4">
                            {recentOrders.slice(0, 6).map((order, idx) => (
                                <div
                                    key={order.id}
                                    className="group/order bg-muted/20 hover:bg-muted/40 p-6 rounded-[2rem] border-2 border-border/20 hover:border-primary/20 transition-all cursor-pointer"
                                    style={{ animationDelay: `${idx * 50}ms` }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-6">
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl border-2 flex items-center justify-center shadow-lg",
                                                order.status === 'delivered' ? "bg-emerald-500/10 border-emerald-500/20" :
                                                    order.status === 'preparing' ? "bg-primary/10 border-primary/20" :
                                                        "bg-blue-500/10 border-blue-500/20"
                                            )}>
                                                {order.status === 'delivered' ? <CheckCircle className="w-6 h-6 text-emerald-500" /> :
                                                    order.status === 'preparing' ? <Flame className="w-6 h-6 text-primary" /> :
                                                        <Clock className="w-6 h-6 text-blue-500" />}
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-lg font-black uppercase tracking-tight text-foreground">
                                                    {order.tables?.table_name || 'Domicilio'}
                                                </p>
                                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                                                    {order.order_items?.length || 0} items • {new Date(order.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right space-y-1">
                                            <p className="text-xl font-black italic text-foreground">
                                                {formatPrice(order.total)}
                                            </p>
                                            <p className={cn(
                                                "text-[9px] font-black uppercase tracking-widest italic",
                                                order.status === 'delivered' ? "text-emerald-500" :
                                                    order.status === 'preparing' ? "text-primary" :
                                                        "text-blue-500"
                                            )}>
                                                {order.status}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {recentOrders.length === 0 && (
                                <div className="py-20 flex flex-col items-center justify-center opacity-20">
                                    <Activity className="w-16 h-16 text-muted-foreground mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground italic">
                                        SIN ACTIVIDAD RECIENTE
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Top Products */}
                    <div className="bg-card/60 backdrop-blur-xl p-10 rounded-[3.5rem] border-4 border-border/40 shadow-2xl space-y-8">
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-foreground flex items-center gap-4">
                            <BarChart3 className="w-6 h-6 text-amber-500" />
                            TOP PRODUCTOS
                        </h2>

                        <div className="space-y-4">
                            {topProducts.map((product, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between p-6 bg-muted/20 rounded-[2rem] border-2 border-border/20"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border-2 border-amber-500/20 flex items-center justify-center shadow-lg">
                                            <span className="text-sm font-black text-amber-500">#{idx + 1}</span>
                                        </div>
                                        <p className="text-sm font-black uppercase tracking-tight text-foreground truncate max-w-[150px]">
                                            {product.name}
                                        </p>
                                    </div>
                                    <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                        <span className="text-xs font-black text-amber-500 italic">{product.qty}</span>
                                    </div>
                                </div>
                            ))}

                            {topProducts.length === 0 && (
                                <div className="py-20 flex flex-col items-center justify-center opacity-20">
                                    <BarChart3 className="w-16 h-16 text-muted-foreground mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground italic">
                                        SIN DATOS
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
