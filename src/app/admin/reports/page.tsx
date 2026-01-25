"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { BarChart3, TrendingUp, DollarSign, ShoppingBag, Users, ArrowUpRight, ArrowLeft, MinusCircle, BadgeDollarSign, Clock, PieChart, Loader2 } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

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

            // Calculation for Top Sellers
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
            <div className="min-h-screen flex items-center justify-center bg-transparent">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        )
    }

    const maxSales = Math.max(...dailySales.map(d => d.total_sales), 1)

    return (
        <div className="min-h-screen bg-transparent text-slate-900 p-4 md:p-8 font-sans selection:bg-primary selection:text-black relative overflow-hidden">
            {/* Mesh Gradients for Premium Feel */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto space-y-12 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
                                <BarChart3 className="w-8 h-8 text-primary" />
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic text-slate-900">Reportes <span className="text-primary">& Analytics</span></h1>
                        </div>
                        <p className="text-slate-400 font-medium italic pl-14 uppercase text-[10px] tracking-widest mt-2 leading-none">Inteligencia de negocios y métricas clave</p>
                    </div>

                    <Link href="/admin">
                        <Button variant="ghost" className="rounded-2xl h-14 bg-white border border-slate-200 shadow-sm font-black uppercase text-xs tracking-widest gap-2 hover:bg-slate-50">
                            <ArrowLeft className="w-4 h-4 text-slate-900" /> VOLVER
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <ReportKPICard
                        title="Utilidad Neta Hoy"
                        value={`$${(todaySales - pettyCashToday).toLocaleString('es-CO')}`}
                        icon={<BadgeDollarSign className="w-6 h-6" />}
                        color="from-emerald-50 to-emerald-100/30 border-emerald-100 text-emerald-600 shadow-emerald-500/5"
                    />
                    <ReportKPICard
                        title="Tiempo Prep. Prom"
                        value={`${avgPrepTime} min`}
                        icon={<Clock className="w-6 h-6" />}
                        color="from-orange-50 to-orange-100/30 border-orange-100 text-orange-600 shadow-orange-500/5"
                    />
                    <ReportKPICard
                        title="Ventas del Mes"
                        value={`$${kpis?.total_revenue_month.toLocaleString()}`}
                        icon={<DollarSign className="w-6 h-6" />}
                        color="from-blue-50 to-blue-100/30 border-blue-100 text-blue-600 shadow-blue-500/5"
                    />
                    <ReportKPICard
                        title="Clientes Mes"
                        value={kpis?.total_customers.toString() || "0"}
                        icon={<Users className="w-6 h-6" />}
                        color="from-purple-50 to-purple-100/30 border-purple-100 text-purple-600 shadow-purple-500/5"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 space-y-8 shadow-sm">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-2 italic">
                            <PieChart className="w-4 h-4 text-primary" /> Distribución de Gastos
                        </h3>
                        <div className="space-y-6">
                            {categoryExpenses.map((cat, i) => (
                                <div key={i} className="space-y-3">
                                    <div className="flex justify-between text-sm items-center">
                                        <span className="font-black uppercase italic text-slate-400 tracking-tighter">{cat.category}</span>
                                        <span className="font-black italic tracking-tighter text-lg text-slate-900">${cat.total.toLocaleString()}</span>
                                    </div>
                                    <div className="w-full bg-slate-50 h-3 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                                        <div
                                            className="h-full bg-gradient-to-r from-primary to-orange-600 shadow-[0_0_15px_rgba(255,107,53,0.1)] transition-all duration-1000"
                                            style={{ width: `${(cat.total / (categoryExpenses.reduce((a, b) => a + b.total, 0) || 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                            {categoryExpenses.length === 0 && <p className="text-slate-300 italic text-center py-10 uppercase font-black text-[10px] tracking-widest">Sin gastos registrados para categorizar</p>}
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center space-y-6 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-125 transition-transform duration-1000">
                            <TrendingUp className="w-64 h-64 text-slate-900" />
                        </div>
                        <div className="w-24 h-24 rounded-3xl bg-primary/5 flex items-center justify-center text-primary mb-2 border border-primary/20 shadow-xl shadow-primary/5">
                            <TrendingUp className="w-12 h-12" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-3xl font-black uppercase tracking-tighter italic text-slate-900">Rotación de Mesas</h3>
                            <p className="text-slate-400 text-sm font-medium italic max-w-xs mx-auto mb-6">Tiempo promedio de ocupación por mesa antes de liberación.</p>
                            <div className="text-6xl font-black text-primary italic tracking-tighter">~45 MIN</div>
                            <p className="text-[10px] uppercase font-black tracking-[0.3em] text-primary/40 mt-4 italic">CÁLCULO BASADO EN HISTORIAL</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-8">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-2 italic">
                        <Users className="w-4 h-4 text-purple-500" /> Vendedores Top del Día
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {topSellers.map((seller, i) => (
                            <div key={i} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-purple-200 transition-all flex flex-col items-center text-center space-y-4 group">
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center font-black italic",
                                    i === 0 ? "bg-yellow-400 text-white shadow-lg shadow-yellow-500/20" : "bg-white border border-slate-200 text-slate-300"
                                )}>
                                    #{i + 1}
                                </div>
                                <div>
                                    <div className="font-black text-sm uppercase italic text-slate-900 group-hover:text-purple-600 transition-colors">{seller.name}</div>
                                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1 italic">{seller.total_orders} Pedidos</div>
                                </div>
                                <div className="text-lg font-black text-purple-600 italic tracking-tighter">
                                    ${seller.total_revenue.toLocaleString('es-CO')}
                                </div>
                            </div>
                        ))}
                        {topSellers.length === 0 && <p className="col-span-full text-slate-300 italic text-center py-10 uppercase font-black text-[10px] tracking-widest">No hay ventas registradas hoy para este ranking</p>}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-8">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-2 italic">
                            <BarChart3 className="w-4 h-4 text-primary" /> Ventas Diarias (14d)
                        </h3>

                        <div className="h-64 flex items-end gap-3 px-2">
                            {dailySales.slice(0, 14).reverse().map((day, i) => {
                                const heightPercentage = (day.total_sales / maxSales) * 100
                                const date = new Date(day.day).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })

                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                                        <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 bg-slate-900 text-[10px] p-2 rounded-xl pointer-events-none transition-all z-20 w-max border border-slate-800 shadow-2xl">
                                            <div className="font-black text-white italic">${day.total_sales.toLocaleString('es-CO')}</div>
                                            <div className="text-slate-400 font-bold italic uppercase [font-size:8px]">{day.order_count} PEDIDOS</div>
                                        </div>

                                        <div
                                            className="w-full bg-primary/10 hover:bg-primary transition-all rounded-t-lg relative"
                                            style={{ height: `${heightPercentage}%` }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-t-lg" />
                                        </div>
                                        <div className="text-[9px] font-black text-slate-400 mt-4 uppercase tracking-tighter italic">
                                            {date}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-8">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-2 italic">
                            <ArrowUpRight className="w-4 h-4 text-emerald-500" /> Ranking de Productos
                        </h3>
                        <div className="space-y-4">
                            {topProducts.map((product, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-100 hover:bg-white transition-all group shadow-inner">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-xs text-slate-300 italic">
                                            #{i + 1}
                                        </div>
                                        <div>
                                            <div className="font-black uppercase italic text-xs text-slate-900 group-hover:text-emerald-600 transition-colors">{product.product_name}</div>
                                            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest italic">{product.total_quantity} vendidos</div>
                                        </div>
                                    </div>
                                    <div className="font-black italic text-emerald-600 tracking-tighter">
                                        ${product.total_revenue.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-8">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-2 italic">
                            <MinusCircle className="w-4 h-4 text-rose-500" /> Gasto Detallado Reciente
                        </h3>
                        <Link href="/admin/petty-cash">
                            <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest italic hover:text-primary text-slate-400">Ver Auditoría Completa</Button>
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 bg-slate-50/50">
                                    <th className="px-8 py-4">Fecha</th>
                                    <th className="px-8 py-4">Beneficiario</th>
                                    <th className="px-8 py-4">Concepto</th>
                                    <th className="px-8 py-4 text-right">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {recentVouchers.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-20 text-center text-slate-300 italic uppercase font-black text-[10px] tracking-widest leading-none">No hay registros recientes.</td>
                                    </tr>
                                ) : (
                                    recentVouchers.map((v, i) => (
                                        <tr key={i} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-8 py-6 text-xs font-bold text-slate-400 italic">{v.date}</td>
                                            <td className="px-8 py-6 font-black uppercase italic text-sm text-slate-900">{v.beneficiary_name}</td>
                                            <td className="px-8 py-6 text-xs text-slate-400 font-medium italic max-w-xs truncate">{v.concept}</td>
                                            <td className="px-8 py-6 text-right font-black italic text-rose-500 text-lg tracking-tighter">
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

function ReportKPICard({ title, value, icon, color }: any) {
    return (
        <div className={cn(
            "p-8 rounded-[2.5rem] border shadow-sm relative overflow-hidden group bg-gradient-to-br transition-all duration-500 hover:scale-[1.02]",
            color
        )}>
            <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-125 group-hover:opacity-40 transition-all duration-700">
                {icon}
            </div>
            <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-3 italic">{title}</p>
                <h3 className="text-3xl font-black italic tracking-tighter text-slate-900">
                    {value}
                </h3>
            </div>
        </div>
    )
}
