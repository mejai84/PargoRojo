"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import {
    Zap,
    TrendingUp,
    Users,
    ShoppingBag,
    DollarSign,
    ArrowLeft,
    RefreshCcw,
    Activity,
    Clock,
    Wallet,
    Bell,
    ChefHat
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn, formatPrice } from "@/lib/utils"

export default function PargoHubPage() {
    const [stats, setStats] = useState({
        revenue: 0,
        orders: 0,
        activeTables: 0,
        avgTicket: 0,
        cashboxStatus: 'CLOSED'
    })
    const [recentSales, setRecentSales] = useState<any[]>([])
    const [peakHours, setPeakHours] = useState<{ hour: number, count: number, intensity: number }[]>([])
    const [businessInfo, setBusinessInfo] = useState({ name: "PARGO HUB", logo: null })
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    useEffect(() => {
        loadHubData()

        // Realtime updates for live feeling
        const channel = supabase.channel('hub-live')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => loadHubData(true))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, () => loadHubData(true))
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [])

    const loadHubData = async (isQuiet = false) => {
        if (!isQuiet) setLoading(true)
        else setRefreshing(true)

        try {
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            // 1. Fetch Today's Orders
            const { data: orders } = await supabase
                .from('orders')
                .select('total, created_at, status')
                .gte('created_at', today.toISOString())

            const totalRev = orders?.reduce((acc, o) => acc + (o.total || 0), 0) || 0
            const totalOrders = orders?.length || 0
            const avg = totalOrders > 0 ? totalRev / totalOrders : 0

            // 2. Fetch Active Tables
            const { count: activeCount } = await supabase
                .from('tables')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'occupied')

            // 3. Fetch Recent Sales
            const { data: recent } = await supabase
                .from('orders')
                .select('id, total, created_at, guest_info')
                .order('created_at', { ascending: false })
                .limit(5)

            // 4. Check Cashbox
            const { data: cashbox } = await supabase
                .from('cashboxes')
                .select('status')
                .eq('name', 'Caja Principal')
                .single()

            setStats({
                revenue: totalRev,
                orders: totalOrders,
                activeTables: activeCount || 0,
                avgTicket: avg,
                cashboxStatus: cashbox?.status || 'UNKNOWN'
            })
            setRecentSales(recent || [])

            // 5. Calculate Peak Hours (Last 30 days for better average)
            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
            const { data: peakData } = await supabase
                .from('orders')
                .select('created_at')
                .gte('created_at', thirtyDaysAgo.toISOString())

            const hourCounts: Record<number, number> = {}
            peakData?.forEach(o => {
                const hour = new Date(o.created_at).getHours()
                hourCounts[hour] = (hourCounts[hour] || 0) + 1
            })

            const maxCount = Math.max(...Object.values(hourCounts), 1)
            const peakArray = Object.entries(hourCounts).map(([hour, count]) => ({
                hour: parseInt(hour),
                count,
                intensity: (count / maxCount) * 100
            })).sort((a, b) => a.hour - b.hour)

            setPeakHours(peakArray)

            // 6. Load Brand Personalization
            const { data: brand } = await supabase
                .from('settings')
                .select('value')
                .eq('key', 'business_info')
                .single()

            if (brand?.value) {
                setBusinessInfo({
                    name: brand.value.business_name || "PARGO HUB",
                    logo: brand.value.logo_url || null
                })
            }

        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 gap-4">
            <Zap className="w-12 h-12 text-primary animate-pulse" />
            <p className="font-black italic uppercase text-[10px] tracking-[0.4em] text-slate-500">Sincronizando Pargo Hub...</p>
        </div>
    )

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-primary pb-20 overflow-x-hidden">
            {/* 🌌 ATMOSPHERIC BACKGROUND */}
            <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
            <div className="fixed -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />

            {/* 📱 MOBILE HEADER */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200 p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin">
                        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-200">
                            <ArrowLeft className="w-5 h-5 text-slate-900" />
                        </Button>
                    </Link>
                    <div className="flex items-center gap-3">
                        {businessInfo.logo ? (
                            <img src={businessInfo.logo} alt="Logo" className="w-10 h-10 rounded-xl object-cover border border-slate-200" />
                        ) : (
                            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
                                <Zap className="w-5 h-5 text-primary" />
                            </div>
                        )}
                        <div>
                            <h1 className="text-xl font-black tracking-tighter uppercase italic leading-none text-slate-900">{businessInfo.name}</h1>
                            <div className="flex items-center gap-1.5 mt-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600">Live Dashboard</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => loadHubData(true)}
                        className={cn("p-3 bg-slate-50 border border-slate-200 rounded-2xl transition-all active:scale-90 text-slate-600", refreshing && "animate-spin text-primary")}
                    >
                        <RefreshCcw className="w-5 h-5" />
                    </button>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl relative">
                        <Bell className="w-5 h-5 text-slate-400" />
                        <div className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
                    </div>
                </div>
            </header>

            <main className="relative z-10 p-6 space-y-8 max-w-lg mx-auto">

                {/* 💰 MAIN KPI: REVENUE */}
                <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm relative overflow-hidden group">
                    <div className="absolute -top-10 -right-10 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                        <DollarSign className="w-48 h-48 text-primary" />
                    </div>
                    <div className="relative z-10 text-center">
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4 italic">Ventas de Hoy</p>
                        <h2 className="text-6xl font-black tracking-tighter italic leading-none text-slate-900">{formatPrice(stats.revenue)}</h2>
                        <div className="mt-8 pt-8 border-t border-slate-100 flex justify-center gap-8">
                            <div className="text-center">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Ticket Prom.</p>
                                <p className="text-xl font-black italic tracking-tighter text-slate-900">{formatPrice(stats.avgTicket)}</p>
                            </div>
                            <div className="w-px h-10 bg-slate-100 self-center" />
                            <div className="text-center">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Ventas Totales</p>
                                <p className="text-xl font-black italic tracking-tighter text-slate-900">{stats.orders}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 🔥 PEAK DEMAND ANALYTICS */}
                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 space-y-6 shadow-sm">
                    <div className="flex justify-between items-center">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic flex items-center gap-2">
                            <TrendingUp className="w-3 h-3 text-orange-500" /> Picos de Demanda
                        </h3>
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg">Tendencia 30d</span>
                    </div>

                    <div className="h-24 flex items-end gap-1.5 px-2">
                        {peakHours.map((p, i) => (
                            <div key={i} className="flex-1 group relative flex flex-col items-center">
                                <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 bg-slate-900 border border-slate-800 p-2 rounded-lg text-[8px] font-black text-white whitespace-nowrap z-50 transition-opacity">
                                    {p.hour}:00 - {p.count} Pedidos
                                </div>
                                <div
                                    className={cn(
                                        "w-full rounded-t-md transition-all duration-700",
                                        p.intensity > 80 ? "bg-orange-600 shadow-[0_0_10px_rgba(234,88,12,0.3)]" :
                                            p.intensity > 40 ? "bg-primary/80" : "bg-slate-200"
                                    )}
                                    style={{ height: `${Math.max(15, p.intensity)}%` }}
                                />
                                <span className="text-[6px] font-black text-slate-400 mt-2">{p.hour}h</span>
                            </div>
                        ))}
                        {peakHours.length === 0 && <p className="w-full text-center text-[8px] font-black text-slate-400 uppercase italic py-8">Calculando datos de afluencia...</p>}
                    </div>
                    <p className="text-[9px] text-slate-500 font-medium italic text-center">
                        {peakHours.length > 0 ? `Tus horas de mayor tráfico son entre las ${peakArrayMax(peakHours)}h. Planifica refuerzos en staff.` : "Necesitamos más datos de ventas para proyectar picos."}
                    </p>
                </div>

                {/* ⚡ GRID FEED: RAPID STATS */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 space-y-4 shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                            <Activity className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Ocupación</p>
                            <p className="text-2xl font-black italic tracking-tighter text-slate-900">{stats.activeTables} <span className="text-[10px] text-slate-500">Mesas</span></p>
                        </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 space-y-4 shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <Wallet className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Estado Caja</p>
                            <p className={cn(
                                "text-sm font-black italic tracking-tighter uppercase",
                                stats.cashboxStatus === 'OPEN' ? "text-emerald-500" : "text-rose-500"
                            )}>
                                {stats.cashboxStatus === 'OPEN' ? '🟢 ABIERTA' : '🔴 CERRADA'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 🕒 REALTIME ACTIVITY LOG */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic flex items-center gap-2">
                            <Clock className="w-3 h-3 text-primary" /> Actividad Reciente
                        </h3>
                        <span className="text-[8px] font-black text-primary uppercase italic">Ver todo</span>
                    </div>

                    <div className="space-y-3">
                        {recentSales.map((sale) => (
                            <div key={sale.id} className="bg-white border border-slate-200 rounded-[2rem] p-5 flex items-center justify-between group active:scale-[0.98] transition-all shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-primary text-[10px] italic">
                                        #{sale.id.split('-')[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase italic tracking-tighter text-slate-900">{sale.guest_info?.name || 'Venta Rápida'}</p>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                            {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-black italic tracking-tighter text-emerald-600">{formatPrice(sale.total)}</p>
                                    <div className="flex items-center justify-end gap-1 mt-0.5">
                                        <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                        <span className="text-[7px] font-black uppercase text-emerald-600 opacity-60">Success</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 🚀 QUICK ACTIONS FOR OWNER */}
                <div className="bg-primary text-black rounded-[2.5rem] p-8 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-primary">
                            <ChefHat className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 leading-none mb-1 italic">Sincronización</p>
                            <h4 className="text-xl font-black italic tracking-tighter uppercase leading-none">Kitchen Ready</h4>
                        </div>
                    </div>
                    <Button variant="ghost" className="h-12 w-12 rounded-2xl bg-black text-white p-0 flex items-center justify-center hover:bg-black/80">
                        <Users className="w-5 h-5" />
                    </Button>
                </div>

            </main>

            {/* 📍 BOTTOM NAV (OPTIONAL FOR APP FEEL) */}
            <nav className="fixed bottom-0 left-0 w-full h-20 bg-white/90 backdrop-blur-xl border-t border-slate-200 flex items-center justify-around px-6 z-50">
                <div className="flex flex-col items-center gap-1 text-primary">
                    <Zap className="w-6 h-6" />
                    <span className="text-[7px] font-black uppercase tracking-[0.2em] italic">Overview</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-900 transition-colors">
                    <ShoppingBag className="w-6 h-6" />
                    <span className="text-[7px] font-black uppercase tracking-[0.2em] italic">Ventas</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-900 transition-colors">
                    <Activity className="w-6 h-6" />
                    <span className="text-[7px] font-black uppercase tracking-[0.2em] italic">Staff</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-900 transition-colors">
                    <TrendingUp className="w-6 h-6" />
                    <span className="text-[7px] font-black uppercase tracking-[0.2em] italic">Analytics</span>
                </div>
            </nav>
        </div>
    )
}

function peakArrayMax(peaks: any[]) {
    if (peaks.length === 0) return ""
    const max = [...peaks].sort((a, b) => b.count - a.count)[0]
    return `${max.hour}:00 y ${max.hour + 1}:00`
}
