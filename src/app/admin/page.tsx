"use client"

import { Button } from "@/components/ui/button"
import { DollarSign, ShoppingBag, Users, TrendingUp, Clock, Loader2, ArrowUp, ArrowDown, Eye } from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import Link from "next/link"

// Función simple para formatear hora
const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

// Componente Card mejorado
const StatsCard = ({ title, value, icon: Icon, trend, trendUp, loading, subtitle, href }: any) => (
    <Link href={href || '#'} className="block">
        <div className="bg-card border border-white/10 rounded-2xl p-6 relative overflow-hidden hover:border-primary/50 transition-all group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin mt-3" />
                        ) : (
                            <h3 className="text-3xl font-bold mt-2">{value}</h3>
                        )}
                        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl group-hover:scale-110 transition-transform">
                        <Icon className="w-6 h-6 text-primary" />
                    </div>
                </div>
                <div className={`text-xs font-semibold ${trendUp ? 'text-green-500' : 'text-red-500'} flex items-center gap-1`}>
                    {trendUp ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                    {trend} vs ayer
                </div>
            </div>
        </div>
    </Link>
)

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
    const [weeklyRevenue, setWeeklyRevenue] = useState<any[]>([])

    const fetchData = async () => {
        setLoading(true)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayISO = today.toISOString()

        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayISO = yesterday.toISOString()

        // 1. Fetch Today's Orders & Stats
        const { data: ordersToday, error: ordersError } = await supabase
            .from('orders')
            .select('*')
            .gte('created_at', todayISO)

        // 2. Fetch Yesterday's Orders for comparison
        const { data: ordersYesterday } = await supabase
            .from('orders')
            .select('*')
            .gte('created_at', yesterdayISO)
            .lt('created_at', todayISO)

        if (!ordersError && ordersToday) {
            const revenue = ordersToday.reduce((acc, order) => acc + (order.total || 0), 0)
            const active = ordersToday.filter(o => !['delivered', 'cancelled'].includes(o.status)).length
            const yesterdayRev = ordersYesterday?.reduce((acc, order) => acc + (order.total || 0), 0) || 0

            setStats(prev => ({
                ...prev,
                todayRevenue: revenue,
                yesterdayRevenue: yesterdayRev,
                totalOrdersToday: ordersToday.length,
                yesterdayOrders: ordersYesterday?.length || 0,
                activeOrders: active
            }))
        }

        // 3. Fetch Recent Orders (limit 5)
        const { data: recent, error: recentError } = await supabase
            .from('orders')
            .select(`
                *,
                order_items (
                    quantity,
                    products (name)
                )
            `)
            .order('created_at', { ascending: false })
            .limit(5)

        if (!recentError && recent) {
            setRecentOrders(recent)
        }

        // 4. Top Products (Simplified aggregation)
        const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select('quantity, price, products(name)')
            .gte('created_at', todayISO)

        if (!itemsError && items) {
            const counts: { [key: string]: { quantity: number; revenue: number } } = {}
            items.forEach((item: any) => {
                const name = item.products?.name || 'Desconocido'
                if (!counts[name]) {
                    counts[name] = { quantity: 0, revenue: 0 }
                }
                counts[name].quantity += item.quantity
                counts[name].revenue += item.quantity * item.price
            })
            const sorted = Object.entries(counts)
                .map(([name, data]) => ({ name, sales: data.quantity, revenue: data.revenue }))
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5)
            setTopProducts(sorted)
        }

        // 5. Weekly Revenue for chart
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 6)
        weekAgo.setHours(0, 0, 0, 0)

        const { data: weekOrders } = await supabase
            .from('orders')
            .select('created_at, total')
            .gte('created_at', weekAgo.toISOString())

        if (weekOrders) {
            const dailyData: Record<string, number> = {}
            // Initialize all days
            for (let i = 0; i < 7; i++) {
                const date = new Date(weekAgo)
                date.setDate(date.getDate() + i)
                const dateStr = date.toISOString().split('T')[0]
                dailyData[dateStr] = 0
            }

            // Add revenue
            weekOrders.forEach(order => {
                const dateStr = order.created_at.split('T')[0]
                if (dailyData[dateStr] !== undefined) {
                    dailyData[dateStr] += order.total || 0
                }
            })

            const weekData = Object.entries(dailyData).map(([date, revenue]) => ({
                date,
                day: new Date(date).toLocaleDateString('es-ES', { weekday: 'short' }),
                revenue
            }))
            setWeeklyRevenue(weekData)
        }

        setLoading(false)
    }

    useEffect(() => {
        fetchData()
        // Opcional: Real-time subscription
        const channel = supabase.channel('dashboard-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchData)
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
            case 'preparing': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
            case 'ready': return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
            case 'delivered': return 'bg-green-500/10 text-green-500 border-green-500/20'
            default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
        }
    }

    const getStatusLabel = (status: string) => {
        const labels: any = {
            pending: 'Pendiente',
            preparing: 'En Cocina',
            ready: 'Listo',
            delivered: 'Entregado',
            cancelled: 'Cancelado',
            out_for_delivery: 'En Reparto'
        }
        return labels[status] || status
    }

    const calculateTrend = (today: number, yesterday: number) => {
        if (yesterday === 0) return '+100%'
        const change = ((today - yesterday) / yesterday) * 100
        return `${change > 0 ? '+' : ''}${change.toFixed(0)}%`
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">Bienvenido al panel de control de Pozu 2.0</p>
                </div>
                <Button onClick={fetchData} variant="outline" size="sm" className="gap-2">
                    <TrendingUp className="w-4 h-4" /> Actualizar
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Ingresos Hoy"
                    value={`${stats.todayRevenue.toFixed(2)}€`}
                    subtitle={`Ayer: ${stats.yesterdayRevenue.toFixed(2)}€`}
                    icon={DollarSign}
                    trend={calculateTrend(stats.todayRevenue, stats.yesterdayRevenue)}
                    trendUp={stats.todayRevenue >= stats.yesterdayRevenue}
                    loading={loading}
                    href="/admin/reports"
                />
                <StatsCard
                    title="Pedidos Activos"
                    value={stats.activeOrders}
                    subtitle="En proceso"
                    icon={Clock}
                    trend={`${stats.activeOrders}`}
                    trendUp={true}
                    loading={loading}
                    href="/admin/orders"
                />
                <StatsCard
                    title="Pedidos Hoy"
                    value={stats.totalOrdersToday}
                    subtitle={`Ayer: ${stats.yesterdayOrders}`}
                    icon={ShoppingBag}
                    trend={calculateTrend(stats.totalOrdersToday, stats.yesterdayOrders)}
                    trendUp={stats.totalOrdersToday >= stats.yesterdayOrders}
                    loading={loading}
                    href="/admin/orders"
                />
                <StatsCard
                    title="Ticket Promedio"
                    value={stats.totalOrdersToday > 0 ? `${(stats.todayRevenue / stats.totalOrdersToday).toFixed(2)}€` : '0.00€'}
                    subtitle="Por pedido"
                    icon={TrendingUp}
                    trend="+0%"
                    trendUp={true}
                    loading={loading}
                    href="/admin/reports"
                />
            </div>

            {/* Weekly Revenue Chart */}
            <div className="bg-card border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold">Ingresos de la Semana</h3>
                    <Link href="/admin/reports">
                        <Button variant="ghost" size="sm" className="gap-2">
                            <Eye className="w-4 h-4" /> Ver Reportes
                        </Button>
                    </Link>
                </div>
                <div className="space-y-4">
                    {weeklyRevenue.map((day, i) => {
                        const maxRevenue = Math.max(...weeklyRevenue.map(d => d.revenue), 1)
                        const width = (day.revenue / maxRevenue) * 100

                        return (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium capitalize">{day.day}</span>
                                    <span className="font-mono font-bold text-primary">{day.revenue.toFixed(2)}€</span>
                                </div>
                                <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
                                        style={{ width: `${width}%` }}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Recent Orders Preview */}
            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-card border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold">Últimos Pedidos</h3>
                        <Link href="/admin/orders">
                            <Button variant="ghost" size="sm" className="gap-2">
                                <Eye className="w-4 h-4" /> Ver Todos
                            </Button>
                        </Link>
                    </div>
                    <div className="space-y-4">
                        {recentOrders.length === 0 && !loading && (
                            <p className="text-center py-10 text-muted-foreground italic">No hay pedidos recientes</p>
                        )}
                        {recentOrders.map((order, i) => (
                            <div key={order.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                        #{order.id.split('-')[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-bold">{order.guest_info?.name || 'Cliente'}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatTime(new Date(order.created_at))} • {order.order_items?.length || 0} Items
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-mono font-bold">{order.total?.toFixed(2)}€</span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(order.status)}`}>
                                        {getStatusLabel(order.status)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Popular Items */}
                <div className="bg-card border border-white/10 rounded-2xl p-6">
                    <h3 className="text-xl font-bold mb-6">Top Productos (Hoy)</h3>
                    <div className="space-y-4">
                        {topProducts.length === 0 && !loading && (
                            <p className="text-center py-10 text-muted-foreground italic">Sin ventas hoy</p>
                        )}
                        {topProducts.map((item, i) => (
                            <div key={i} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground font-mono text-sm">#{i + 1}</span>
                                        <span className="font-medium">{item.name}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{item.sales} ventas</span>
                                    <span className="font-mono font-bold text-primary">{item.revenue.toFixed(2)}€</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
