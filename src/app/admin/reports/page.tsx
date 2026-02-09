"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
    BarChart3, TrendingUp, DollarSign, ShoppingBag, Users,
    ArrowUpRight, ArrowLeft, MinusCircle, BadgeDollarSign,
    Clock, PieChart, Loader2, Target, Trophy, ArrowRight
} from "lucide-react"
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

    const loadData = async () => {
        setLoading(true)
        try {
            // Load KPIs
            const { data: kpiData } = await supabase.rpc('get_dashboard_kpis')
            if (kpiData && kpiData[0]) {
                setKpis(kpiData[0])
            } else {
                const startOfMonth = new Date()
                startOfMonth.setDate(1)
                startOfMonth.setHours(0, 0, 0, 0)

                const { data: monthOrders } = await supabase
                    .from('orders')
                    .select('total')
                    .gte('created_at', startOfMonth.toISOString())
                    .in('status', ['completed', 'paid', 'delivered'])

                if (monthOrders) {
                    const totalM = monthOrders.reduce((acc, o) => acc + (o.total || 0), 0)
                    const countM = monthOrders.length
                    setKpis({
                        total_revenue_month: totalM,
                        total_orders_month: countM,
                        avg_ticket: countM > 0 ? totalM / countM : 0,
                        total_customers: 0
                    })
                }
            }

            // Load Daily Sales
            const { data: salesData } = await supabase.rpc('get_sales_daily')
            if (salesData) setDailySales(salesData)

            // Load Top Products
            const { data: productsData } = await supabase.rpc('get_top_products')
            if (productsData) setTopProducts(productsData)

            const today = new Date().toISOString().split('T')[0]
            const { data: voucherData } = await supabase
                .from('petty_cash_vouchers')
                .select('*')
                .eq('date', today)

            if (voucherData) {
                const total = voucherData.reduce((acc, v) => acc + (v.amount || 0), 0)
                setPettyCashToday(total)
            }

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

            const { data: todayOrders } = await supabase
                .from('orders')
                .select(`
                    total, 
                    status,
                    preparation_started_at, 
                    preparation_finished_at, 
                    guest_info,
                    waiter:profiles!orders_waiter_id_fkey (full_name)
                `)
                .gte('created_at', today + 'T00:00:00Z')
                .in('status', ['completed', 'paid', 'delivered'])

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

                const sellerStats: Record<string, { orders: number, revenue: number }> = {}
                todayOrders.forEach((o: any) => {
                    const name = o.waiter?.full_name || o.guest_info?.name || "VENTA DIRECTA"
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
        } catch (error) {
            console.error("Error loading reports data:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const maxSales = Math.max(...dailySales.map((d: DailySales) => d.total_sales), 1)

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-transparent gap-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px] italic">Extrayendo Métricas de Alto Mando...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-transparent text-foreground p-4 md:p-8 font-sans selection:bg-primary selection:text-primary-foreground relative">
            <div className="max-w-[1400px] mx-auto space-y-12 animate-in fade-in duration-1000">

                {/* 🔝 STRATEGIC HEADER */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 border-b border-border/50 pb-10">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2.5">
                            <Target className="w-4 h-4 text-primary animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary italic">Intelligence & Unit Economics</span>
                        </div>
                        <h1 className="text-5xl font-black italic uppercase tracking-tighter text-foreground leading-none">Reportes <span className="text-primary italic">Avanzados</span></h1>
                        <p className="text-muted-foreground font-bold text-sm uppercase tracking-widest italic opacity-70">Monitor de salud financiera y eficiencia operativa</p>
                    </div>

                    <Link href="/admin">
                        <Button variant="ghost" className="h-16 px-10 bg-card border border-border rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] italic shadow-xl transition-all gap-3 hover:bg-muted active:scale-95 group">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> RETORNO AL HUB
                        </Button>
                    </Link>
                </div>

                {/* 📊 MACRO KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <ReportKPICard
                        title="Cash Flow Hoy"
                        value={`$${(todaySales - pettyCashToday).toLocaleString('es-CO')}`}
                        icon={<BadgeDollarSign />}
                        color="text-emerald-500"
                        delay="0"
                    />
                    <ReportKPICard
                        title="Eficiencia Cocina"
                        value={`${avgPrepTime} MIN`}
                        icon={<Clock />}
                        color="text-primary"
                        delay="100"
                    />
                    <ReportKPICard
                        title="Facturación Mes"
                        value={`$${kpis?.total_revenue_month.toLocaleString()}`}
                        icon={<TrendingUp />}
                        color="text-blue-500"
                        delay="200"
                    />
                    <ReportKPICard
                        title="Afluencia Mes"
                        value={kpis?.total_customers.toString() || "0"}
                        icon={<Users />}
                        color="text-indigo-500"
                        delay="300"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

                    {/* 🍕 EXPENSE DISTRIBUTION */}
                    <div className="bg-card border border-border rounded-[3.5rem] p-10 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                            <PieChart className="w-64 h-64 -mr-20 -mt-20" />
                        </div>
                        <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.5em] flex items-center gap-3 italic mb-10 relative z-10">
                            <PieChart className="w-4 h-4 text-primary" /> Estructura de Egresos
                        </h3>
                        <div className="space-y-8 relative z-10">
                            {categoryExpenses.map((cat, i) => (
                                <div key={i} className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <span className="font-black uppercase italic text-muted-foreground/60 text-[10px] tracking-widest">{cat.category}</span>
                                        <span className="font-black italic tracking-tighter text-xl text-foreground">${cat.total.toLocaleString()}</span>
                                    </div>
                                    <div className="w-full bg-muted h-3.5 rounded-full overflow-hidden shadow-inner border border-border/50 p-0.5">
                                        <div
                                            className="h-full bg-primary rounded-full shadow-[0_0_20px_rgba(255,77,0,0.3)] transition-all duration-1000 ease-out"
                                            style={{ width: `${(cat.total / (categoryExpenses.reduce((a, b) => a + b.total, 0) || 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                            {categoryExpenses.length === 0 && (
                                <div className="py-20 text-center space-y-4">
                                    <MinusCircle className="w-12 h-12 text-muted-foreground/20 mx-auto" />
                                    <p className="text-muted-foreground/30 italic text-[10px] font-black uppercase tracking-widest">Sin registros de egresos para el periodo analizado</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 🔄 TABLE TURNOVER ANALYTICS */}
                    <div className="bg-card border border-border rounded-[3.5rem] p-10 flex flex-col items-center justify-center text-center space-y-10 shadow-2xl relative overflow-hidden group">
                        <div className="absolute bottom-0 left-0 p-10 opacity-5 pointer-events-none group-hover:-rotate-6 transition-transform duration-1000">
                            <TrendingUp className="w-96 h-96 -ml-24 -mb-24" />
                        </div>
                        <div className="w-24 h-24 rounded-[2rem] bg-primary group-hover:bg-foreground transition-colors flex items-center justify-center text-primary-foreground shadow-2xl relative z-10">
                            <Clock className="w-12 h-12" />
                        </div>
                        <div className="relative z-10 space-y-2">
                            <h3 className="text-3xl font-black italic uppercase tracking-tighter text-foreground">Turnover de Salón</h3>
                            <p className="text-muted-foreground/60 text-xs font-bold uppercase tracking-widest italic leading-relaxed">Ciclo promedio de ocupación por mesa <br /> antes de liberación del activo.</p>
                        </div>
                        <div className="relative z-10 group/time">
                            <div className="text-7xl font-black text-primary italic tracking-tighter leading-none group-hover/time:scale-110 transition-transform duration-500 drop-shadow-xl">~45 MIN</div>
                            <div className="h-1.5 w-full bg-primary/20 rounded-full mt-6 flex overflow-hidden">
                                <div className="h-full bg-primary w-2/3 animate-pulse" />
                            </div>
                            <p className="text-[10px] uppercase font-black tracking-[0.4em] text-primary/40 mt-4 italic">CÁLCULO BASADO EN BIG DATA</p>
                        </div>
                    </div>
                </div>

                {/* 🏆 TOP SELLERS RANKING */}
                <div className="bg-card border border-border rounded-[3.5rem] p-12 shadow-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between mb-12">
                        <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.5em] flex items-center gap-3 italic">
                            <Trophy className="w-5 h-5 text-primary" /> Top Performers de Ventas
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                        {topSellers.map((seller, i) => (
                            <div key={i} className="group p-8 bg-muted/30 rounded-[2.5rem] border border-border hover:border-primary/40 hover:bg-card transition-all duration-500 flex flex-col items-center text-center space-y-6 shadow-sm">
                                <div className={cn(
                                    "w-14 h-14 rounded-2xl flex items-center justify-center font-black italic shadow-xl transition-all duration-500 group-hover:scale-110",
                                    i === 0 ? "bg-primary text-primary-foreground shadow-primary/30" : "bg-card border border-border text-muted-foreground"
                                )}>
                                    {i === 0 ? <Trophy className="w-7 h-7" /> : <span className="text-xl">#{i + 1}</span>}
                                </div>
                                <div className="space-y-1">
                                    <div className="font-black text-sm uppercase italic text-foreground group-hover:text-primary transition-colors tracking-tight leading-none">{seller.name}</div>
                                    <div className="text-[9px] text-muted-foreground/50 font-bold uppercase tracking-[0.2em] italic">{seller.total_orders} TICKETS</div>
                                </div>
                                <div className="text-xl font-black text-foreground italic tracking-tighter opacity-80 group-hover:opacity-100">
                                    ${seller.total_revenue.toLocaleString('es-CO')}
                                </div>
                            </div>
                        ))}
                        {topSellers.length === 0 && (
                            <div className="col-span-full py-16 flex flex-col items-center justify-center gap-4 border-2 border-dashed border-border rounded-[3rem]">
                                <Users className="w-10 h-10 text-muted-foreground/20" />
                                <p className="text-muted-foreground/30 italic text-[10px] font-black uppercase tracking-widest">Protocolo de seguimiento desactivado: Sin ventas registradas hoy</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                    {/* 📊 SALES CHART ENGINE */}
                    <div className="lg:col-span-2 bg-card border border-border rounded-[3.5rem] p-10 shadow-2xl space-y-12">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.5em] flex items-center gap-3 italic text-primary">
                                <BarChart3 className="w-5 h-5" /> Curva de Ingresos (Log 14d)
                            </h3>
                            <div className="flex gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                                <div className="w-2.5 h-2.5 rounded-full bg-muted" />
                            </div>
                        </div>

                        <div className="h-72 flex items-end gap-3 px-2">
                            {dailySales.slice(0, 14).reverse().map((day, i) => {
                                const heightPercentage = (day.total_sales / maxSales) * 100
                                const date = new Date(day.day).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })

                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                                        <div className="opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 absolute bottom-full mb-4 bg-foreground text-background text-[11px] px-4 py-2 rounded-xl pointer-events-none transition-all z-20 w-max shadow-2xl font-black italic">
                                            ${day.total_sales.toLocaleString('es-CO')}
                                            <div className="text-[8px] opacity-60 uppercase tracking-widest mt-1">{day.order_count} ORDERS</div>
                                        </div>

                                        <div
                                            className="w-full bg-primary/20 hover:bg-primary transition-all duration-300 rounded-t-xl relative border-t-4 border-primary/40 group-hover:border-primary group-hover:shadow-[0_0_20px_rgba(255,107,53,0.2)]"
                                            style={{ height: `${heightPercentage}%` }}
                                        />
                                        <div className="text-[9px] font-black text-muted-foreground/40 mt-6 uppercase tracking-widest italic group-hover:text-primary transition-colors">
                                            {date}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* 🔥 PRODUCT PERFORMANCE */}
                    <div className="bg-card border border-border rounded-[3.5rem] p-10 shadow-2xl space-y-10">
                        <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.5em] flex items-center gap-3 italic">
                            <ArrowUpRight className="w-5 h-5 text-emerald-500" /> Best Sellers Hub
                        </h3>
                        <div className="space-y-4">
                            {topProducts.map((product, i) => (
                                <div key={i} className="flex items-center justify-between p-5 bg-muted/30 rounded-3xl border border-border/50 hover:border-emerald-500/40 hover:bg-card transition-all duration-300 group shadow-inner">
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center font-black text-sm text-muted-foreground/40 italic shadow-sm group-hover:text-emerald-500 group-hover:border-emerald-500/20 transition-colors">
                                            {i + 1}
                                        </div>
                                        <div className="space-y-0.5">
                                            <div className="font-black uppercase italic text-xs text-foreground group-hover:text-emerald-500 transition-colors tracking-tight leading-none">{product.product_name}</div>
                                            <div className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest italic opacity-50">{product.total_quantity} UNIDADES</div>
                                        </div>
                                    </div>
                                    <div className="font-black italic text-foreground tracking-tighter opacity-80 group-hover:text-emerald-600 group-hover:opacity-100">
                                        ${product.total_revenue.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 📉 RECENT EXPENSES TABLE */}
                <div className="bg-card border border-border rounded-[4rem] p-12 shadow-2xl space-y-10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none group-hover:scale-125 transition-transform duration-1000">
                        <BadgeDollarSign className="w-80 h-80 -mr-32 -mt-32 " />
                    </div>

                    <div className="flex items-center justify-between relative z-10">
                        <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.5em] flex items-center gap-3 italic">
                            <MinusCircle className="w-5 h-5 text-rose-500" /> Auditoría de Egresos Recientes
                        </h3>
                        <Link href="/admin/petty-cash">
                            <Button variant="ghost" className="h-12 px-8 bg-muted border border-border rounded-[1.5rem] font-black uppercase text-[9px] tracking-[0.3em] italic hover:bg-foreground hover:text-background transition-all">PANEL DE AUDITORÍA <ArrowRight className="w-3.5 h-3.5 ml-2" /></Button>
                        </Link>
                    </div>

                    <div className="overflow-x-auto relative z-10">
                        <table className="w-full text-left border-separate border-spacing-y-4">
                            <thead>
                                <tr className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.3em] italic">
                                    <th className="px-8 pb-4">Protocolo de Fecha</th>
                                    <th className="px-8 pb-4">Entidad Receptora</th>
                                    <th className="px-8 pb-4">Naturaleza del Egreso</th>
                                    <th className="px-8 pb-4 text-right">Impacto Financiero</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentVouchers.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-24 text-center border-2 border-dashed border-border rounded-[3rem]">
                                            <div className="space-y-3">
                                                <BadgeDollarSign className="w-10 h-10 text-muted-foreground/10 mx-auto" />
                                                <p className="text-muted-foreground/20 italic uppercase font-black text-[10px] tracking-widest leading-none">Cero registros detectados en el sistema de egresos</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    recentVouchers.map((v, i) => (
                                        <tr key={i} className="group/row hover:-translate-y-1 transition-transform duration-300">
                                            <td className="px-8 py-7 bg-muted/40 rounded-l-[2rem] border-y border-l border-border/50 text-xs font-black text-muted-foreground italic uppercase tracking-tighter">{v.date}</td>
                                            <td className="px-8 py-7 bg-muted/40 border-y border-border/50 font-black uppercase italic text-sm text-foreground group-hover/row:text-primary transition-colors">{v.beneficiary_name}</td>
                                            <td className="px-8 py-7 bg-muted/40 border-y border-border/50 text-[11px] text-muted-foreground/60 font-black italic max-w-xs truncate uppercase tracking-tight">{v.concept}</td>
                                            <td className="px-8 py-7 bg-muted/40 rounded-r-[2rem] border-y border-r border-border/50 text-right font-black italic text-rose-500 text-xl tracking-tighter shadow-inner">
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

function ReportKPICard({ title, value, icon, color, delay }: any) {
    return (
        <div className={cn(
            "p-10 rounded-[3rem] bg-card border border-border shadow-2xl relative overflow-hidden group hover:border-primary/40 transition-all duration-700 animate-in fade-in slide-in-from-bottom-4",
        )} style={{ animationDelay: `${delay}ms` }}>
            <div className={cn(
                "absolute top-0 right-0 p-10 opacity-5 group-hover:scale-125 group-hover:opacity-10 transition-all duration-700 pointer-events-none",
                color
            )}>
                {icon && typeof icon === 'object' ? { ...icon, props: { ...icon.props, className: "w-40 h-40 -mr-16 -mt-16" } } : null}
                <div className="w-40 h-40 -mr-16 -mt-16 bg-current rounded-full blur-[80px] opacity-20" />
            </div>
            <div className="relative z-10 space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground italic group-hover:text-foreground transition-colors">{title}</p>
                <h3 className={cn("text-4xl font-black italic tracking-tighter leading-none drop-shadow-sm", color)}>
                    {value}
                </h3>
            </div>
        </div>
    )
}
