"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell
} from "recharts"
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    ShoppingBag,
    Users,
    ArrowLeft,
    Loader2,
    Calendar,
    ChevronRight,
    UtensilsCrossed,
    Trophy
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AnalyticsDashboard() {
    const [loading, setLoading] = useState(true)
    const [kpis, setKpis] = useState<any>(null)
    const [dailySales, setDailySales] = useState([])
    const [topProducts, setTopProducts] = useState([])
    const [categorySales, setCategorySales] = useState([])

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [kpiRes, dailyRes, topRes, catRes] = await Promise.all([
                supabase.rpc('get_dashboard_kpis'),
                supabase.rpc('get_sales_daily'),
                supabase.rpc('get_top_products'),
                supabase.rpc('get_sales_by_category')
            ])

            if (kpiRes.data) setKpis(kpiRes.data[0])
            if (dailyRes.data) setDailySales(dailyRes.data.reverse())
            if (topRes.data) setTopProducts(topRes.data)
            if (catRes.data) setCategorySales(catRes.data)

        } catch (error) {
            console.error("Error fetching analytics:", error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-black">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
    )

    const COLORS = ['#ff6b35', '#22c55e', '#3b82f6', '#eab308', '#a855f7', '#ec4899']

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8 selection:bg-primary selection:text-black">
            <div className="max-w-7xl mx-auto space-y-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="w-10 h-10 text-primary" />
                            <h1 className="text-4xl font-black tracking-tighter uppercase italic">Estadísticas <span className="text-primary">Globales</span></h1>
                        </div>
                        <p className="text-gray-500 font-medium italic">Rendimiento comercial de Pargo Rojo - Gran Rafa</p>
                    </div>

                    <div className="flex gap-2">
                        <Link href="/admin">
                            <Button variant="ghost" className="rounded-2xl h-14 font-black uppercase text-xs tracking-widest gap-2">
                                <ArrowLeft className="w-4 h-4" /> VOLVER
                            </Button>
                        </Link>
                        <Button
                            onClick={fetchData}
                            className="bg-primary text-black h-14 px-8 rounded-2xl font-black uppercase text-xs tracking-widest italic hover:bg-white transition-all shadow-xl shadow-primary/10"
                        >
                            ACTUALIZAR DATOS
                        </Button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KPICard
                        title="Ventas del Mes"
                        value={`$${kpis?.total_revenue_month?.toLocaleString() || 0}`}
                        icon={<DollarSign className="w-6 h-6" />}
                        trend="+12% vs mes anterior"
                        color="text-emerald-400"
                    />
                    <KPICard
                        title="Pedidos Totales"
                        value={kpis?.total_orders_month || 0}
                        icon={<ShoppingBag className="w-6 h-6" />}
                        trend="En tendencia alcista"
                        color="text-blue-400"
                    />
                    <KPICard
                        title="Ticket Promedio"
                        value={`$${Math.round(kpis?.avg_ticket || 0).toLocaleString()}`}
                        icon={<TrendingUp className="w-6 h-6" />}
                        trend="Optimizado"
                        color="text-primary"
                    />
                    <KPICard
                        title="Clientes Leales"
                        value={kpis?.total_customers || 0}
                        icon={<Users className="w-6 h-6" />}
                        trend="Acumulando puntos"
                        color="text-purple-400"
                    />
                </div>

                {/* Main Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Ventas Diarias */}
                    <div className="lg:col-span-2 bg-[#111] border border-white/5 p-8 rounded-[2.5rem] shadow-2xl space-y-8">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.4em] flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-primary" /> Histórico de Ventas (30d)
                            </h3>
                        </div>
                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={dailySales}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                    <XAxis
                                        dataKey="day"
                                        stroke="#555"
                                        fontSize={10}
                                        tickFormatter={(val) => new Date(val).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                    />
                                    <YAxis stroke="#555" fontSize={10} tickFormatter={(val) => `$${val / 1000}k`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '15px' }}
                                        labelStyle={{ color: '#ff6b35', fontWeight: 'bold' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="total_sales"
                                        stroke="#ff6b35"
                                        strokeWidth={4}
                                        dot={{ fill: '#ff6b35', strokeWidth: 2 }}
                                        activeDot={{ r: 8 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Ventas por Categoría */}
                    <div className="bg-[#111] border border-white/5 p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.4em] mb-12 self-start flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4 text-primary" /> Por Categoría
                        </h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categorySales}
                                        innerRadius={80}
                                        outerRadius={120}
                                        paddingAngle={5}
                                        dataKey="total_sales"
                                        nameKey="category"
                                    >
                                        {categorySales.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-8 space-y-2 w-full">
                            {categorySales.slice(0, 4).map((cat: any, i) => (
                                <div key={i} className="flex justify-between items-center bg-black/40 p-3 rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                        <span className="text-[11px] font-black uppercase text-gray-400">{cat.category}</span>
                                    </div>
                                    <span className="text-xs font-bold font-mono">${cat.total_sales?.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Row: Top Products */}
                <div className="bg-[#111] border border-white/5 p-10 rounded-[3rem] shadow-2xl space-y-10">
                    <div className="flex items-center gap-3">
                        <Trophy className="w-8 h-8 text-yellow-500" />
                        <div>
                            <h3 className="text-xl font-black uppercase italic tracking-tighter">Top Productos</h3>
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Los favoritos de los clientes</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {topProducts.map((p: any, i) => (
                            <div key={i} className="bg-black/40 p-6 rounded-[2rem] border border-white/5 flex items-center justify-between group hover:border-primary/20 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary italic">
                                        #{i + 1}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm uppercase group-hover:text-primary transition-colors">{p.product_name}</h4>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{p.total_quantity} Ventas</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-black italic font-mono text-emerald-400">${Math.round(p.total_revenue / 1000)}k</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

function KPICard({ title, value, icon, trend, color }: any) {
    return (
        <div className="bg-[#111] border border-white/5 p-8 rounded-[2rem] shadow-2xl space-y-4 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all ${color}`}>
                {icon}
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">{title}</p>
            <div className="flex flex-col">
                <span className="text-3xl font-black tracking-tighter italic">{value}</span>
                <span className={`text-[10px] font-bold mt-2 ${color}`}>{trend}</span>
            </div>
        </div>
    )
}
