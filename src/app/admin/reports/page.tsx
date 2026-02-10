"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
    BarChart3,
    TrendingUp,
    DollarSign,
    ShoppingBag,
    Users,
    ArrowUpRight,
    ArrowLeft,
    MinusCircle,
    BadgeDollarSign,
    Clock,
    PieChart,
    Loader2,
    Target,
    Trophy,
    ArrowRight,
    Calendar,
    Filter,
    Download,
    Activity,
    Zap,
    Sparkles,
    Presentation,
    Globe
} from "lucide-react"
import Link from "next/link"
import { cn, formatPrice } from "@/lib/utils"

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

export default function ReportsPagePremium() {
    const [kpis, setKpis] = useState<KPI | null>(null)
    const [dailySales, setDailySales] = useState<DailySales[]>([])
    const [topProducts, setTopProducts] = useState<TopProduct[]>([])
    const [loading, setLoading] = useState(true)
    const [currentTime, setCurrentTime] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        loadData()
        return () => clearInterval(timer)
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            // Mock de datos para el diseño visual premium
            const mockKpis: KPI = {
                total_revenue_month: 45800000,
                total_orders_month: 1240,
                avg_ticket: 36935,
                total_customers: 850
            }
            setKpis(mockKpis)

            const mockSales: DailySales[] = [
                { day: 'Lun', total_sales: 1200000, order_count: 35 },
                { day: 'Mar', total_sales: 1450000, order_count: 42 },
                { day: 'Mie', total_sales: 1100000, order_count: 31 },
                { day: 'Jue', total_sales: 2100000, order_count: 55 },
                { day: 'Vie', total_sales: 3500000, order_count: 88 },
                { day: 'Sab', total_sales: 4200000, order_count: 110 },
                { day: 'Dom', total_sales: 3800000, order_count: 95 },
            ]
            setDailySales(mockSales)

            const mockProducts: TopProduct[] = [
                { product_name: 'Hamburguesa Royale', total_quantity: 450, total_revenue: 12150000 },
                { product_name: 'Pargo Rojo Especial', total_quantity: 320, total_revenue: 15360000 },
                { product_name: 'Tacos al Pastor x3', total_quantity: 280, total_revenue: 7840000 },
                { product_name: 'Soda Artesanal', total_quantity: 600, total_revenue: 5400000 },
            ]
            setTopProducts(mockProducts)

        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen text-white font-sans relative overflow-hidden flex flex-col h-screen">

            {/* 🖼️ FONDO PREMIUM: Centro de Negocios / Analytics con Blur */}
            <div className="fixed inset-0 bg-[url('https://images.unsplash.com/photo-1551288049-bbbda5366991?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center scale-105 pointer-events-none" />
            <div className="fixed inset-0 backdrop-blur-[100px] bg-slate-950/90 pointer-events-none" />

            {/* HEADER ANALÍTICO */}
            <div className="relative z-20 p-8 flex items-center justify-between border-b border-white/5 bg-slate-950/40 backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-6">
                    <Link href="/admin">
                        <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10">
                            <ArrowLeft className="w-6 h-6 text-slate-400" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none">BUSINESS <span className="text-orange-500">INTELLIGENCE</span></h1>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.5em] mt-2 italic shadow-sm">Data Center & Intelligence Hub</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-3xl font-black italic tracking-tighter font-mono">
                            {currentTime.toLocaleTimeString('es-CO')}
                        </p>
                        <p className="text-[9px] font-bold text-orange-500 uppercase tracking-widest text-right">GLOBAL DATA SYNC</p>
                    </div>
                    <div className="flex gap-3">
                        <Button className="h-14 px-8 bg-orange-600 hover:bg-orange-700 text-black font-black uppercase text-xs italic tracking-widest rounded-2xl shadow-xl shadow-orange-600/20">
                            <Download className="w-5 h-5 mr-3" /> EXPORTAR DATA
                        </Button>
                    </div>
                </div>
            </div>

            <div className="relative z-10 p-8 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-8 max-w-[1800px] mx-auto w-full">

                {/* 1. TOP METRICS ROW */}
                <div className="grid grid-cols-4 gap-6 shrink-0">
                    {[
                        { label: 'INGRESOS MES', val: formatPrice(kpis?.total_revenue_month || 0), icon: DollarSign, trend: '+12.5%', color: 'text-orange-500' },
                        { label: 'TRANSACCIONES', val: kpis?.total_orders_month || 0, icon: ShoppingBag, trend: '+8.2%', color: 'text-white' },
                        { label: 'TICKET PROMEDIO', val: formatPrice(kpis?.avg_ticket || 0), icon: Target, trend: '-2.1%', color: 'text-emerald-400' },
                        { label: 'CLIENTES ÚNICOS', val: kpis?.total_customers || 0, icon: Users, trend: '+15.4%', color: 'text-blue-400' },
                    ].map((card, i) => (
                        <div key={i} className="bg-slate-800/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:scale-[1.02] transition-all">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-white/5 rounded-xl">
                                    <card.icon className={cn("w-5 h-5", card.color)} />
                                </div>
                                <span className={cn("text-[10px] font-black px-2 py-1 rounded-full", card.trend.startsWith('+') ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500")}>
                                    {card.trend}
                                </span>
                            </div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{card.label}</p>
                            <p className={cn("text-3xl font-black italic tracking-tighter", card.color)}>{card.val}</p>

                            {/* Decorative Graph */}
                            <div className="absolute bottom-0 left-0 right-0 h-10 opacity-10">
                                <Activity className="w-full h-full text-white" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* 2. SALES CHATS / TRENDING (Centro de Atención) */}
                <div className="grid grid-cols-12 gap-8 flex-1">

                    {/* CHART AREA */}
                    <div className="col-span-8 bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 flex flex-col relative overflow-hidden">
                        <div className="flex items-center justify-between mb-12">
                            <div>
                                <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none mb-2">Revenue <span className="text-orange-500">Analytics</span></h2>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">Análisis Comparativo de Ventas Semanales</p>
                            </div>
                            <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
                                {['7D', '30D', '90D', '1Y'].map(t => (
                                    <button key={t} className={cn("px-4 py-1.5 rounded-lg text-[10px] font-black transition-all", t === '7D' ? "bg-orange-500 text-black" : "text-slate-500 hover:text-white")}>
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Simulación de Gráfico Pro */}
                        <div className="flex-1 flex items-end gap-6 relative">
                            {/* Grid Lines */}
                            <div className="absolute inset-0 flex flex-col justify-between opacity-5">
                                {[1, 2, 3, 4, 5].map(l => <div key={l} className="h-px bg-white w-full" />)}
                            </div>

                            {dailySales.map((s, i) => {
                                const height = (s.total_sales / 4500000) * 100
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-4 relative z-10 group">
                                        <div className="absolute -top-12 bg-orange-500 text-black px-2 py-1 rounded-lg text-[9px] font-black opacity-0 group-hover:opacity-100 transition-all shadow-xl shadow-orange-500/40 -translate-y-2 group-hover:translate-y-0">
                                            {formatPrice(s.total_sales)}
                                        </div>
                                        <div
                                            className="w-full bg-gradient-to-t from-orange-600/80 to-orange-400 rounded-2xl group-hover:brightness-125 transition-all shadow-lg group-hover:shadow-orange-500/20"
                                            style={{ height: `${height}%` }}
                                        />
                                        <span className="text-[11px] font-black uppercase text-slate-500 group-hover:text-white transition-colors italic tracking-widest">{s.day}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* RANKING AREA */}
                    <div className="col-span-4 flex flex-col gap-8">
                        <div className="flex-1 bg-slate-800/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 flex flex-col overflow-hidden relative">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="p-3 bg-yellow-500/10 rounded-2xl">
                                    <Trophy className="w-6 h-6 text-yellow-500" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black italic uppercase tracking-tighter leading-none">Top <span className="text-orange-500">Products</span></h2>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">Basado en volumen de venta</p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-4">
                                {topProducts.map((p, i) => (
                                    <div key={i} className="group relative flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-orange-500/20 transition-all cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <span className="text-xl font-black italic text-slate-700 group-hover:text-orange-500/40 transition-colors">0{i + 1}</span>
                                            <div>
                                                <p className="text-sm font-black italic uppercase tracking-tight text-white">{p.product_name}</p>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{p.total_quantity} UNID vendidas</p>
                                            </div>
                                        </div>
                                        <p className="text-sm font-black italic font-mono text-white">{formatPrice(p.total_revenue)}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8">
                                <Button className="w-full h-14 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 font-black uppercase text-[10px] italic tracking-widest rounded-2xl">
                                    VER REPORTE COMPLETO
                                </Button>
                            </div>
                        </div>

                        {/* SMART INSIGHT (AI Style) */}
                        <div className="p-8 bg-orange-600 rounded-[2.5rem] shadow-2xl shadow-orange-950/40 relative overflow-hidden group cursor-pointer hover:scale-[1.03] transition-all">
                            <div className="absolute top-0 right-0 p-8 opacity-20 rotate-12 group-hover:scale-125 transition-all">
                                <Zap className="w-24 h-24 text-black" />
                            </div>
                            <div className="relative z-10 space-y-4">
                                <div className="flex items-center gap-3">
                                    <Sparkles className="w-5 h-5 text-black" />
                                    <span className="text-[9px] font-black uppercase text-black/60 tracking-widest">AI REVENUE PREDICTION</span>
                                </div>
                                <h3 className="text-3xl font-black italic text-black leading-none uppercase tracking-tighter">Se proyecta un crecimiento del 18% para el fin de semana</h3>
                                <p className="text-[10px] font-bold text-black/60 uppercase tracking-widest leading-relaxed">Basado en el histórico de Jueves de Pargo Rojo.</p>
                            </div>
                        </div>
                    </div>

                </div>

                {/* 3. ADDITIONAL INTELLIGENCE GRID */}
                <div className="grid grid-cols-3 gap-8 shrink-0 pb-10">
                    {[
                        { label: 'COSTO OPERATIVO', val: '$12.4M', icon: BadgeDollarSign, desc: 'Nómina, Suministros y Servicios', color: 'text-rose-500' },
                        { label: 'TIEMPO KDS AVG', val: '14:20 min', icon: Clock, desc: 'Desde orden hasta entrega', color: 'text-yellow-400' },
                        { label: 'RECO GOBAL', val: '94%', icon: Globe, desc: 'Satisfacción basada en encuestas', color: 'text-emerald-400' }
                    ].map((item, i) => (
                        <div key={i} className="bg-slate-900/40 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 flex items-center gap-6 group hover:border-white/20 transition-all">
                            <div className={cn("p-4 bg-white/5 rounded-2xl shadow-inner group-hover:scale-110 transition-all", item.color)}>
                                <item.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{item.label}</h4>
                                <p className="text-2xl font-black italic text-white tracking-tighter leading-none">{item.val}</p>
                                <p className="text-[9px] font-medium text-slate-500 mt-1 uppercase tracking-wider">{item.desc}</p>
                            </div>
                        </div>
                    ))}
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
