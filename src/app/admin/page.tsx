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
    RefreshCw,
    Activity,
    Flame,
    Package,
    Utensils,
    Wallet,
    TrendingDown,
    AlertCircle,
    CheckCircle,
    Sparkles,
    BarChart3,
    ChevronRight,
    Star,
    Target
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
        cashInDrawer: 0,
        criticalStock: 0,
        activeTables: 0,
        totalTables: 0,
        avgRating: 0
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

        // Stock crítico
        const { data: products } = await supabase.from('products').select('current_stock, min_stock').gt('min_stock', 0)
        const critical = products?.filter(p => p.current_stock <= p.min_stock).length || 0
        setStats(prev => ({ ...prev, criticalStock: critical }))

        // Mesas ocupadas
        const { data: tables } = await supabase.from('tables').select('id, status').eq('restaurant_id', restaurant?.id)
        const occupied = tables?.filter(t => t.status === 'occupied').length || 0
        setStats(prev => ({ ...prev, activeTables: occupied, totalTables: tables?.length || 0 }))

        const { data: recent } = await supabase
            .from('orders')
            .select(`*, order_items(quantity, products(name)), tables(table_name)`)
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

    const revenueChange = stats.yesterdayRevenue > 0
        ? ((stats.todayRevenue - stats.yesterdayRevenue) / stats.yesterdayRevenue * 100).toFixed(1)
        : 0

    if (loading && !stats.todayRevenue) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="flex flex-col items-center gap-8">
                    <Loader2 className="w-16 h-16 text-primary animate-spin" />
                    <p className="text-sm font-bold uppercase tracking-wider text-slate-400">Cargando Dashboard...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white p-6 font-sans relative overflow-hidden">

            {/* Background Effect */}
            <div className="fixed inset-0 bg-gradient-to-br from-orange-900/20 via-slate-900 to-slate-950 pointer-events-none" />

            <div className="max-w-[1900px] mx-auto space-y-8 relative z-10">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-700 pb-6">
                    <div>
                        <h1 className="text-5xl font-black italic text-white mb-2">
                            DASHBOARD <span className="text-white">ADMINISTRATIVO</span>
                        </h1>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                            <span className="font-bold">Bienvenido, {userName}</span>
                            <span>•</span>
                            <span className="font-mono">{currentTime.toLocaleTimeString('es-CO')}</span>
                        </div>
                    </div>
                    <Button onClick={fetchData} variant="ghost" size="icon" className="h-12 w-12 rounded-xl bg-slate-800/50 border border-slate-700 hover:bg-slate-700">
                        <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
                    </Button>
                </div>

                {/* Main Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {/* Revenue */}
                    <div className="bg-gradient-to-br from-orange-900/20 to-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-primary" />
                            </div>
                            {Number(revenueChange) !== 0 && (
                                <div className={cn(
                                    "flex items-center gap-1 text-xs font-bold",
                                    Number(revenueChange) > 0 ? "text-emerald-400" : "text-red-400"
                                )}>
                                    {Number(revenueChange) > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    {Math.abs(Number(revenueChange))}%
                                </div>
                            )}
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Ventas Hoy</p>
                        <p className="text-3xl font-black text-primary">{formatPrice(stats.todayRevenue)}</p>
                    </div>

                    {/* Active Orders */}
                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                                <Flame className="w-6 h-6 text-blue-400" />
                            </div>
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Órdenes Activas</p>
                        <p className="text-3xl font-black text-blue-400">{stats.activeOrders}</p>
                    </div>

                    {/* Critical Stock */}
                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                                <AlertCircle className="w-6 h-6 text-red-400" />
                            </div>
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Inventario Crítico</p>
                        <p className="text-3xl font-black text-red-400">{stats.criticalStock} <span className="text-lg text-slate-500">items</span></p>
                    </div>

                    {/* Tables */}
                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                                <Target className="w-6 h-6 text-amber-400" />
                            </div>
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Mesas Ocupadas</p>
                        <p className="text-3xl font-black text-amber-400">{stats.activeTables}<span className="text-lg text-slate-500">/{stats.totalTables}</span></p>
                    </div>
                </div>

                {/* Quick Access Modules */}
                <div>
                    <h2 className="text-xl font-black italic uppercase text-white mb-6 flex items-center gap-3">
                        <Sparkles className="w-6 h-6 text-primary" />
                        Acceso Rápido
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        <Link href="/admin/pos">
                            <div className="group bg-slate-800/50 backdrop-blur-sm border-2 border-primary/30 rounded-2xl p-6 hover:border-primary/60 transition-all cursor-pointer">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <ShoppingBag className="w-6 h-6 text-primary" />
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <h3 className="text-lg font-black uppercase text-white mb-1">POS</h3>
                                <p className="text-xs text-slate-400">Punto de Venta</p>
                            </div>
                        </Link>

                        <Link href="/admin/kitchen">
                            <div className="group bg-slate-800/50 backdrop-blur-sm border-2 border-primary/30 rounded-2xl p-6 hover:border-primary/60 transition-all cursor-pointer">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Flame className="w-6 h-6 text-primary" />
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <h3 className="text-lg font-black uppercase text-white mb-1">COCINA</h3>
                                <p className="text-xs text-slate-400">KDS Pro</p>
                            </div>
                        </Link>

                        <Link href="/admin/inventory">
                            <div className="group bg-slate-800/50 backdrop-blur-sm border-2 border-primary/30 rounded-2xl p-6 hover:border-primary/60 transition-all cursor-pointer">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Package className="w-6 h-6 text-primary" />
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <h3 className="text-lg font-black uppercase text-white mb-1">INVENTARIO</h3>
                                <p className="text-xs text-slate-400">Gestión de Stock</p>
                            </div>
                        </Link>

                        <Link href="/admin/payroll">
                            <div className="group bg-slate-800/50 backdrop-blur-sm border-2 border-primary/30 rounded-2xl p-6 hover:border-primary/60 transition-all cursor-pointer">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Users className="w-6 h-6 text-primary" />
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <h3 className="text-lg font-black uppercase text-white mb-1">NÓMINA</h3>
                                <p className="text-xs text-slate-400">Gestión de Personal</p>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Recent Activity & Top Products */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Recent Orders */}
                    <div className="xl:col-span-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-black italic uppercase text-white flex items-center gap-3">
                                <Activity className="w-5 h-5 text-primary" />
                                Órdenes Recientes
                            </h2>
                            <Link href="/admin/orders">
                                <Button variant="ghost" className="text-xs font-bold uppercase text-slate-400 hover:text-primary">
                                    Ver Todas <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </Link>
                        </div>

                        <div className="space-y-3">
                            {recentOrders.slice(0, 5).map((order) => (
                                <div
                                    key={order.id}
                                    className="bg-slate-700/30 border border-slate-600/50 rounded-xl p-4 hover:border-primary/30 transition-all"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-10 h-10 rounded-lg border flex items-center justify-center",
                                                order.status === 'delivered' ? "bg-emerald-500/20 border-emerald-500/30" :
                                                    order.status === 'preparing' ? "bg-primary/20 border-primary/30" :
                                                        "bg-blue-500/20 border-blue-500/30"
                                            )}>
                                                {order.status === 'delivered' ? <CheckCircle className="w-5 h-5 text-emerald-400" /> :
                                                    order.status === 'preparing' ? <Flame className="w-5 h-5 text-primary" /> :
                                                        <Clock className="w-5 h-5 text-blue-400" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">
                                                    {order.tables?.table_name || 'Domicilio'}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    {order.order_items?.length || 0} items • {new Date(order.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black text-white">{formatPrice(order.total)}</p>
                                            <p className={cn(
                                                "text-[10px] font-bold uppercase",
                                                order.status === 'delivered' ? "text-emerald-400" :
                                                    order.status === 'preparing' ? "text-primary" :
                                                        "text-blue-400"
                                            )}>
                                                {order.status}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Products */}
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
                        <h2 className="text-lg font-black italic uppercase text-white mb-6 flex items-center gap-3">
                            <BarChart3 className="w-5 h-5 text-amber-400" />
                            Top Productos
                        </h2>

                        <div className="space-y-3">
                            {topProducts.map((product, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between p-3 bg-slate-700/30 border border-slate-600/50 rounded-xl"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                                            <span className="text-xs font-black text-amber-400">#{idx + 1}</span>
                                        </div>
                                        <p className="text-sm font-bold text-white truncate max-w-[150px]">
                                            {product.name}
                                        </p>
                                    </div>
                                    <div className="px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-lg">
                                        <span className="text-xs font-black text-amber-400">{product.qty}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
