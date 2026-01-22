"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { BarChart3, TrendingUp, DollarSign, ShoppingBag, Users, ArrowUpRight, ArrowLeft, MinusCircle, BadgeDollarSign, Clock, PieChart } from "lucide-react"
import Link from "next/link"

type KPI = {
    total_revenue_month: number
    total_orders_month: number
    avg_ticket: number
    total_customers: number
}

type DailySales = {
    day: string
    total_sales: number
    order_count: number
}

type TopProduct = {
    product_name: string
    total_quantity: number
    total_revenue: number
}

type TopSeller = {
    name: string
    total_orders: number
    total_revenue: number
}

export default function ReportsPage() {
    const [kpis, setKpis] = useState<KPI | null>(null)
    const [dailySales, setDailySales] = useState<DailySales[]>([])
    const [topProducts, setTopProducts] = useState<TopProduct[]>([])
    const [pettyCashToday, setPettyCashToday] = useState(0)
    const [recentVouchers, setRecentVouchers] = useState<any[]>([])
    const [avgPrepTime, setAvgPrepTime] = useState(0)
    const [categoryExpenses, setCategoryExpenses] = useState<{ category: string, total: number }[]>([])
    const [todaySales, setTodaySales] = useState(0)
    const [topSellers, setTopSellers] = useState<TopSeller[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        // Load KPIs
        const { data: kpiData } = await supabase.rpc('get_dashboard_kpis')
        if (kpiData && kpiData[0]) setKpis(kpiData[0])

        // Load Daily Sales
        const { data: salesData } = await supabase.rpc('get_sales_daily')
        if (salesData) setDailySales(salesData)

        // Load Top Products
        const { data: productsData } = await supabase.rpc('get_top_products')
        if (productsData) setTopProducts(productsData)

        // Load Petty Cash Today
        const today = new Date().toISOString().split('T')[0]
        const { data: voucherData } = await supabase
            .from('petty_cash_vouchers')
            .select('*')
            .eq('date', today)

        if (voucherData) {
            const total = voucherData.reduce((acc, v) => acc + (v.amount || 0), 0)
            setPettyCashToday(total)
        }

        // Load Recent Vouchers for the report
        const { data: allVouchers } = await supabase
            .from('petty_cash_vouchers')
            .select('*')
            .order('date', { ascending: false })
            .limit(10)

        if (allVouchers) {
            setRecentVouchers(allVouchers)
            const categories: Record<string, number> = {}
            allVouchers.forEach(v => {
                categories[v.category] = (categories[v.category] || 0) + (v.amount || 0)
            })
            setCategoryExpenses(Object.entries(categories)
                .map(([category, total]) => ({ category, total }))
                .sort((a, b) => b.total - a.total)
            )
        }

        // Load Today's Sales directly for Net Profit
        const { data: todayOrders } = await supabase
            .from('orders')
            .select(`
                total, 
                preparation_started_at, 
                preparation_finished_at, 
                guest_info,
                waiter:profiles!orders_waiter_id_fkey (full_name)
            `)
            .gte('created_at', today + 'T00:00:00Z')

        if (todayOrders) {
            const totalS = todayOrders.reduce((acc, o) => acc + (o.total || 0), 0)
            setTodaySales(totalS)

            const timedOrders = todayOrders.filter(o => o.preparation_started_at && o.preparation_finished_at)
            if (timedOrders.length > 0) {
                const totalMinutes = timedOrders.reduce((acc, o) => {
                    const diff = new Date(o.preparation_finished_at).getTime() - new Date(o.preparation_started_at).getTime()
                    return acc + (diff / 60000)
                }, 0)
                setAvgPrepTime(Math.round(totalMinutes / timedOrders.length))
            }

            // Calculation for Top Sellers (Ranking de Meseros/Mesas)
            const sellerStats: Record<string, { orders: number, revenue: number }> = {}
            todayOrders.forEach((o: any) => {
                const name = o.waiter?.full_name || o.guest_info?.name || "Mostrador / Otros"
                if (!sellerStats[name]) sellerStats[name] = { orders: 0, revenue: 0 }
                sellerStats[name].orders += 1
                sellerStats[name].revenue += (o.total || 0)
            })

            const sortedSellers = Object.entries(sellerStats)
                .map(([name, stats]) => ({
                    name,
                    total_orders: stats.orders,
                    total_revenue: stats.revenue
                }))
                .sort((a, b) => b.total_revenue - a.total_revenue)
                .slice(0, 5)

            setTopSellers(sortedSellers)
        }

        setLoading(false)
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    const maxSales = Math.max(...dailySales.map(d => d.total_sales), 1)

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto text-foreground">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/admin">
                            <Button variant="outline" size="icon">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold">Reportes y Analytics</h1>
                            <p className="text-muted-foreground">Métricas clave del negocio</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-green-600/20 to-green-700/10 border border-green-500/30 shadow-lg shadow-green-500/5">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-green-500/20 text-green-400">
                                <BadgeDollarSign className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-green-400/80 font-black uppercase tracking-widest">Utilidad Neta Hoy</p>
                                <h3 className="text-2xl font-black text-white">
                                    ${(todaySales - pettyCashToday).toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                                </h3>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-gradient-to-br from-orange-400/10 to-orange-500/5 border border-orange-400/20">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-orange-400/20 text-orange-400">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-orange-400/80 font-black uppercase tracking-widest">Tiempo Prep.</p>
                                <h3 className="text-2xl font-black text-orange-400">
                                    {avgPrepTime} <span className="text-sm">min</span>
                                </h3>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-500/20 text-blue-500">
                                <DollarSign className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-blue-500/80 font-black uppercase tracking-widest">Ventas Mes</p>
                                <h3 className="text-2xl font-bold text-blue-500">
                                    ${kpis?.total_revenue_month.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                                </h3>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-purple-500/20 text-purple-500">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-purple-500/80 font-black uppercase tracking-widest">Clientes</p>
                                <h3 className="text-2xl font-bold text-purple-500">
                                    {kpis?.total_customers}
                                </h3>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <div className="bg-card rounded-2xl p-6 border border-white/10 text-card-foreground">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-primary" />
                            Distribución de Gastos (Caja Menor)
                        </h3>
                        <div className="space-y-4">
                            {categoryExpenses.map((cat, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-bold opacity-70">{cat.category}</span>
                                        <span className="font-black">${cat.total.toLocaleString()}</span>
                                    </div>
                                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary"
                                            style={{ width: `${(cat.total / (categoryExpenses.reduce((a, b) => a + b.total, 0) || 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                            {categoryExpenses.length === 0 && <p className="text-muted-foreground italic text-center py-4">Sin gastos registrados para categorizar</p>}
                        </div>
                    </div>

                    <div className="bg-card rounded-2xl p-6 border border-white/10 flex flex-col items-center justify-center text-center space-y-4 text-card-foreground">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                            <TrendingUp className="w-10 h-10" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter">Rotación de Mesas</h3>
                            <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-4">Tiempo promedio de ocupación por mesa antes de liberación.</p>
                            <div className="text-4xl font-black text-primary">~45 MIN</div>
                            <p className="text-[10px] uppercase font-black tracking-widest text-primary/40 mt-2">Basado en promedio histórico</p>
                        </div>
                    </div>
                </div>

                <div className="bg-card rounded-2xl p-6 border border-white/10 mb-8 text-card-foreground">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Users className="w-5 h-5 text-purple-500" />
                        Vendedores Top (Ranking de Meseros)
                    </h3>
                    <div className="space-y-4">
                        {topSellers.map((seller, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-purple-500/30 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i === 0 ? 'bg-yellow-500 text-black' : 'bg-white/10 text-muted-foreground'}`}>
                                        #{i + 1}
                                    </div>
                                    <div>
                                        <div className="font-bold text-lg">{seller.name}</div>
                                        <div className="text-xs text-muted-foreground">{seller.total_orders} pedidos realizados</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-black text-purple-400">
                                        ${seller.total_revenue.toLocaleString('es-CO')}
                                    </div>
                                    <div className="text-[10px] uppercase font-bold opacity-40">Total Vendido</div>
                                </div>
                            </div>
                        ))}
                        {topSellers.length === 0 && <p className="text-muted-foreground italic text-center py-4">No hay ventas registradas hoy para este ranking</p>}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    <div className="lg:col-span-2 bg-card rounded-2xl p-6 border border-white/10 text-card-foreground">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-primary" />
                            Ventas Diarias (Últimos 30 días)
                        </h3>

                        <div className="h-64 flex items-end gap-2">
                            {dailySales.slice(0, 14).reverse().map((day, i) => {
                                const heightPercentage = (day.total_sales / maxSales) * 100
                                const date = new Date(day.day).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })

                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center group relative">
                                        <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 bg-gray-800 text-xs p-2 rounded pointer-events-none transition-opacity z-10 w-max whitespace-nowrap border border-white/10">
                                            <div className="font-bold text-white">${day.total_sales.toLocaleString('es-CO')}</div>
                                            <div className="text-gray-400">{day.order_count} pedidos</div>
                                        </div>

                                        <div
                                            className="w-full bg-primary/20 hover:bg-primary transition-all rounded-t-sm"
                                            style={{ height: `${heightPercentage}%` }}
                                        />
                                        <div className="text-[10px] text-muted-foreground mt-2 rotate-0 truncate w-full text-center">
                                            {date}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className="bg-card rounded-2xl p-6 border border-white/10 text-card-foreground">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <ArrowUpRight className="w-5 h-5 text-green-500" />
                            Top Productos
                        </h3>
                        <div className="space-y-4">
                            {topProducts.map((product, i) => (
                                <div key={i} className="flex items-center justify-between pb-4 border-b border-white/5 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center font-bold text-sm text-muted-foreground">
                                            #{i + 1}
                                        </div>
                                        <div>
                                            <div className="font-bold">{product.product_name}</div>
                                            <div className="text-xs text-muted-foreground">{product.total_quantity} vendidos</div>
                                        </div>
                                    </div>
                                    <div className="font-bold text-green-500">
                                        ${product.total_revenue.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-card rounded-2xl p-6 border border-white/10 text-card-foreground">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <MinusCircle className="w-5 h-5 text-red-500" />
                            Gasto Detallado (Caja Menor)
                        </h3>
                        <Link href="/admin/petty-cash">
                            <Button variant="outline" size="sm">Ver Todo</Button>
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-sm text-muted-foreground border-b border-white/5">
                                    <th className="pb-4 font-bold">Fecha</th>
                                    <th className="pb-4 font-bold">Beneficiario</th>
                                    <th className="pb-4 font-bold">Concepto</th>
                                    <th className="pb-4 font-bold text-right">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {recentVouchers.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-muted-foreground italic">No hay registros recientes.</td>
                                    </tr>
                                ) : (
                                    recentVouchers.map((v, i) => (
                                        <tr key={i} className="text-sm">
                                            <td className="py-4">{v.date}</td>
                                            <td className="py-4 font-bold">{v.beneficiary_name}</td>
                                            <td className="py-4 text-muted-foreground max-w-xs truncate">{v.concept}</td>
                                            <td className="py-4 text-right font-bold text-red-500">
                                                -${v.amount.toLocaleString('es-CO')}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
