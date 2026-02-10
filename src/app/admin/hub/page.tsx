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
    Bell,
    ChefHat,
    Wallet,
    Target,
    BarChart3,
    ArrowRight,
    PieChart,
    ChevronRight,
    LayoutGrid,
    Search,
    User,
    Shield
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn, formatPrice } from "@/lib/utils"
import { NotificationBell } from "@/components/admin/notification-bell"

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

            const { data: orders } = await supabase
                .from('orders')
                .select('total, created_at, status')
                .gte('created_at', today.toISOString())

            const totalRev = orders?.reduce((acc, o) => acc + (o.total || 0), 0) || 0
            const totalOrders = orders?.length || 0
            const avg = totalOrders > 0 ? totalRev / totalOrders : 0

            const { count: activeCount } = await supabase
                .from('tables')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'occupied')

            const { data: recent } = await supabase
                .from('orders')
                .select('id, total, created_at, guest_info')
                .order('created_at', { ascending: false })
                .limit(5)

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
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 gap-6">
            <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
                <Zap className="w-16 h-16 text-primary animate-pulse relative z-10" />
            </div>
            <p className="font-black italic uppercase text-[10px] tracking-[0.4em] text-primary animate-pulse">Sincronizando Live Node...</p>
        </div>
    )

    return (
        <div className="min-h-screen bg-[#020406] text-foreground font-sans selection:bg-orange-500 pb-28 overflow-x-hidden relative">

            {/* 🌌 ATMOSPHERIC AMBIANCE */}
            <div className="fixed top-0 left-0 w-full h-[600px] bg-gradient-to-b from-orange-500/10 via-orange-500/[0.02] to-transparent pointer-events-none z-0" />
            <div className="fixed -top-40 -right-40 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none opacity-50 z-0 animate-pulse" />
            <div className="fixed -bottom-40 -left-40 w-[500px] h-[500px] bg-rose-500/5 rounded-full blur-[120px] pointer-events-none opacity-30 z-0" />

            {/* 🔝 MOBILE-CENTRIC COMMAND HEADER */}
            <header className="sticky top-0 z-[100] bg-[#020406]/80 backdrop-blur-2xl border-b border-white/5 p-6 flex items-center justify-between">
                <div className="flex items-center gap-5">
                    <Link href="/admin">
                        <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all active:scale-90 shadow-lg group">
                            <ArrowLeft className="w-6 h-6 text-white group-hover:-translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            {businessInfo.logo ? (
                                <img src={businessInfo.logo} alt="Logo" className="w-12 h-12 rounded-2xl object-cover border-2 border-orange-500/20 shadow-2xl" />
                            ) : (
                                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border-2 border-orange-500/20 shadow-2xl">
                                    <Zap className="w-6 h-6 text-orange-500 drop-shadow-[0_0_8px_rgba(255,102,0,0.5)]" />
                                </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-background animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        </div>
                        <div className="space-y-0 pb-1">
                            <h1 className="text-lg md:text-xl font-black tracking-tighter uppercase italic leading-none border-b border-orange-500/20 pb-0.5 text-white">{businessInfo.name}</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] text-orange-500 italic">Core Live Engine</span>
                                <span className="text-[7px] md:text-[8px] font-bold text-slate-500 uppercase tracking-widest">• Hub v5.0</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => loadHubData(true)}
                        className={cn("h-14 w-14 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center transition-all active:scale-90 text-slate-400 hover:text-orange-500 hover:border-orange-500/20 shadow-xl overflow-hidden relative group", refreshing && "animate-spin text-orange-500")}
                    >
                        <div className="absolute inset-0 bg-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <RefreshCcw className="w-6 h-6 relative z-10" />
                    </button>
                    <NotificationBell variant="header" />
                </div>
            </header>

            <main className="relative z-10 px-6 pt-10 space-y-12 max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-10 duration-1000">

                {/* 💰 PRIMARY REVENUE CORE */}
                <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-12 shadow-3xl relative overflow-hidden group/rev">
                    <div className="absolute -top-12 -right-12 opacity-[0.02] group-hover/rev:scale-110 group-hover/rev:rotate-12 transition-all duration-1000">
                        <DollarSign className="w-48 h-48 md:w-64 md:h-64 text-orange-500" />
                    </div>

                    <div className="relative z-10 text-center space-y-6 md:space-y-8">
                        <div className="space-y-1">
                            <p className="text-[9px] md:text-[10px] font-black text-orange-500 uppercase tracking-[0.3em] md:tracking-[0.5em] italic leading-none">Ventas en Tiempo Real</p>
                            <p className="text-[7px] md:text-[8px] font-bold text-slate-700 uppercase tracking-widest">Sincronizado con Master Ledger</p>
                        </div>

                        <div className="relative inline-block">
                            <div className="absolute -inset-4 bg-orange-500/10 blur-2xl rounded-full scale-150 animate-pulse opacity-0 group-hover/rev:opacity-100 transition-opacity" />
                            <h2 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter italic leading-none text-white drop-shadow-sm whitespace-nowrap">{formatPrice(stats.revenue)}</h2>
                        </div>

                        <div className="pt-6 md:pt-10 border-t border-white/5 flex justify-center gap-8 md:gap-12 items-center">
                            <div className="text-center space-y-1">
                                <p className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] italic opacity-60">Avg. Ticket</p>
                                <p className="text-xl md:text-2xl font-black italic tracking-tighter text-white leading-none">{formatPrice(stats.avgTicket)}</p>
                            </div>
                            <div className="w-px h-10 md:h-14 bg-gradient-to-b from-transparent via-white/5 to-transparent" />
                            <div className="text-center space-y-1">
                                <p className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] italic opacity-60">Orders</p>
                                <p className="text-xl md:text-2xl font-black italic tracking-tighter text-white leading-none">{stats.orders}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 🔥 ANALYTIC PEAK RADAR */}
                <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] p-10 space-y-10 shadow-2xl relative overflow-hidden group/peak">
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <h3 className="text-xs font-black text-white uppercase tracking-[0.4em] italic flex items-center gap-3">
                                <TrendingUp className="w-4 h-4 text-orange-500 animate-bounce-slow" /> Radar de Afluencia
                            </h3>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-7 italic">PROYECCIÓN ÚLTIMOS 30 DÍAS</p>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/5">
                            <Activity className="w-3 h-3 text-orange-500" />
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.1em] italic">Optimizando Staff</span>
                        </div>
                    </div>

                    <div className="h-32 flex items-end gap-2 px-2 relative min-h-[140px]">
                        {peakHours.map((p, i) => (
                            <div key={i} className="flex-1 group/bar relative flex flex-col items-center h-full justify-end">
                                <div className="opacity-0 group-hover/bar:opacity-100 absolute bottom-[110%] mb-2 bg-foreground text-background p-3 rounded-2xl text-[9px] font-black whitespace-nowrap z-50 transition-all scale-75 group-hover/bar:scale-100 shadow-2xl border border-white/10 italic">
                                    <div className="flex flex-col items-center">
                                        <span className="text-primary">{p.hour}:00 HRS</span>
                                        <span>{p.count} TRANSACCIONES</span>
                                    </div>
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-foreground rotate-45 -mt-1" />
                                </div>
                                <div
                                    className={cn(
                                        "w-full rounded-2xl transition-all duration-1000 relative overflow-hidden",
                                        p.intensity > 80 ? "bg-primary shadow-[0_0_20px_rgba(255,77,0,0.4)]" :
                                            p.intensity > 40 ? "bg-primary/40 border border-primary/20" : "bg-muted/50 border border-border/30"
                                    )}
                                    style={{ height: `${Math.max(12, p.intensity)}%` }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                </div>
                                <span className="text-[7px] font-black text-muted-foreground/30 mt-3 group-hover/bar:text-primary transition-colors">{p.hour}h</span>
                            </div>
                        ))}
                        {peakHours.length === 0 && (
                            <div className="w-full flex flex-col items-center justify-center py-12 space-y-4 opacity-10">
                                <BarChart3 className="w-12 h-12" />
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] italic">Calculando Red Neuronal de Demanda...</p>
                            </div>
                        )}
                    </div>

                    <div className="bg-muted/30 p-6 rounded-3xl border border-border/50 text-center relative overflow-hidden">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1/2 bg-primary rounded-r-full" />
                        <p className="text-[10px] text-foreground font-black italic uppercase tracking-tight leading-relaxed">
                            {peakHours.length > 0 ? (
                                <>PUNTO MÁXIMO DE CARGA DETECTADO ENTRE <span className="text-primary underline decoration-primary/30 underline-offset-4">{peakArrayMax(peakHours)}H</span>. RECOMIENDA REFUERZO DE OPERATIVOS.</>
                            ) : "INTEGRANDO DATOS DE AFLUENCIA PARA DETERMINAR CICLOS DE ALTO IMPACTO."}
                        </p>
                    </div>
                </div>

                {/* ⚡ GRID FEED: RAPID ANALYTICS */}
                <div className="grid grid-cols-2 gap-4 md:gap-6">
                    <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-2xl md:rounded-[3rem] p-6 md:p-8 space-y-4 md:space-y-6 shadow-xl relative overflow-hidden group">
                        <div className="absolute -bottom-6 -right-6 opacity-[0.03] group-hover:scale-110 transition-transform">
                            <Activity className="w-20 h-20 md:w-24 md:h-24 text-orange-500" />
                        </div>
                        <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 shadow-inner group-hover:bg-orange-500 group-hover:text-black transition-all duration-500">
                            <Activity className="w-5 h-5 md:w-7 md:h-7" />
                        </div>
                        <div>
                            <p className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] md:tracking-[0.3em] italic mb-1">Ocupación Live</p>
                            <p className="text-2xl md:text-4xl font-black italic tracking-tighter text-white leading-none group-hover:text-orange-500 transition-colors">{stats.activeTables} <span className="text-[9px] md:text-[11px] text-slate-700 uppercase tracking-widest ml-1">Nodes</span></p>
                        </div>
                    </div>

                    <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-2xl md:rounded-[3rem] p-6 md:p-8 space-y-4 md:space-y-6 shadow-xl relative overflow-hidden group">
                        <div className="absolute -bottom-6 -right-6 opacity-[0.03] group-hover:scale-110 transition-transform">
                            <Wallet className="w-20 h-20 md:w-24 md:h-24 text-orange-500" />
                        </div>
                        <div className={cn(
                            "w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center shadow-inner transition-all duration-500",
                            stats.cashboxStatus === 'OPEN' ? "bg-orange-500/10 text-orange-500 group-hover:bg-orange-500 group-hover:text-black" : "bg-rose-500/10 text-rose-500 group-hover:bg-rose-500 group-hover:text-white"
                        )}>
                            <Wallet className="w-5 h-5 md:w-7 md:h-7" />
                        </div>
                        <div>
                            <p className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] md:tracking-[0.3em] italic mb-1">Status Cashbox</p>
                            <p className={cn(
                                "text-[10px] md:text-lg font-black italic tracking-[0.1em] uppercase leading-none flex items-center gap-2",
                                stats.cashboxStatus === 'OPEN' ? "text-orange-500" : "text-rose-500"
                            )}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse shadow-sm" />
                                {stats.cashboxStatus === 'OPEN' ? 'ABIERTA' : 'OFFLINE'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 🕒 REALTIME TRANSACIONAL LOG */}
                <div className="space-y-8">
                    <div className="flex items-center justify-between px-6">
                        <div className="space-y-0.5">
                            <h3 className="text-[11px] font-black text-white uppercase tracking-[0.5em] italic flex items-center gap-3">
                                <Clock className="w-4 h-4 text-orange-500" /> Stream de Ventas
                            </h3>
                            <p className="text-[8px] font-bold text-slate-700 uppercase tracking-widest pl-7">HISTORIAL DE IMPACTO INMEDIATO</p>
                        </div>
                        <Link href="/admin/orders">
                            <Button variant="ghost" className="h-10 px-4 text-[9px] font-black text-orange-500 uppercase italic hover:bg-orange-500/10 transition-all gap-2 group">
                                ANALIZAR STREAM <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </div>

                    <div className="space-y-4">
                        {recentSales.map((sale) => (
                            <div key={sale.id} className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 flex items-center justify-between group active:scale-[0.97] transition-all shadow-xl hover:border-orange-500/20 relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/5 group-hover:bg-orange-500 transition-colors" />
                                <div className="flex items-center gap-4 md:gap-6">
                                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center shadow-inner group-hover:border-orange-500/20 transition-all">
                                        <span className="text-[6px] md:text-[7px] font-black text-slate-700 uppercase italic leading-none mb-1">ID-HEX</span>
                                        <span className="text-[9px] md:text-[11px] font-black text-orange-500 italic leading-none">#{sale.id.split('-')[0].toUpperCase().slice(0, 5)}</span>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-base md:text-xl font-black italic uppercase tracking-tighter text-white group-hover:text-orange-500 transition-colors leading-none truncate max-w-[120px] md:max-w-none">{sale.guest_info?.name || 'VENTA RÁPIDA'}</p>
                                        <div className="flex items-center gap-2 md:gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500/40" />
                                            <p className="text-[8px] md:text-[9px] font-black text-slate-600 uppercase tracking-[0.1em] md:tracking-[0.2em] italic">
                                                {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right space-y-1">
                                    <p className="text-xl md:text-3xl font-black italic tracking-tighter text-white group-hover:text-orange-500 transition-all leading-none">{formatPrice(sale.total)}</p>
                                    <span className="text-[6px] md:text-[8px] font-black uppercase text-emerald-500 italic px-1.5 py-0.5 bg-emerald-500/10 rounded-lg">VERIFIED</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 🚀 QUICK OPS HUB */}
                <div className="bg-white text-black rounded-[4rem] p-10 shadow-3xl flex items-center justify-between relative overflow-hidden group/ops animate-pulse-slow">
                    <div className="absolute inset-x-0 bottom-0 h-2 bg-orange-600" />
                    <div className="absolute top-0 right-0 p-12 opacity-[0.05] pointer-events-none -mr-10 -mt-10 group-hover/ops:scale-110 transition-transform duration-1000">
                        <ChefHat className="w-48 h-48 text-orange-600" />
                    </div>

                    <div className="flex items-center gap-8 relative z-10">
                        <div className="w-18 h-18 rounded-[1.5rem] bg-black border border-black/10 flex items-center justify-center text-orange-500 shadow-2xl group-hover/ops:rotate-12 transition-all">
                            <ChefHat className="w-9 h-9" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-600 italic leading-none animate-pulse">Ops Core Ready</p>
                            <h4 className="text-2xl font-black italic tracking-tighter uppercase leading-none">Control Cocina</h4>
                        </div>
                    </div>
                    <Link href="/admin/kitchen">
                        <Button className="h-16 w-16 rounded-[1.5rem] bg-orange-600 text-black hover:bg-black hover:text-orange-500 transition-all shadow-3xl active:scale-90 border-none group/action">
                            <ChevronRight className="w-8 h-8 group-hover/action:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </div>

            </main>

            {/* 📍 GLOBAL COMMAND BAR */}
            <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-lg h-24 bg-slate-900/80 backdrop-blur-3xl border-2 border-white/5 rounded-[3rem] flex items-center justify-around px-8 z-[100] shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
                <Link href="/admin/hub">
                    <div className="flex flex-col items-center gap-1.5 text-orange-500 group cursor-pointer active:scale-90 transition-all border-t-4 border-orange-500 pt-3 -mt-3">
                        <Zap className="w-7 h-7 drop-shadow-[0_0_8px_rgba(255,102,0,0.3)]" />
                        <span className="text-[8px] font-black uppercase tracking-[0.3em] italic">HUB</span>
                    </div>
                </Link>
                <Link href="/admin/orders">
                    <div className="flex flex-col items-center gap-1.5 text-slate-600 hover:text-orange-500 group cursor-pointer active:scale-90 transition-all pt-3 -mt-3">
                        <ShoppingBag className="w-7 h-7 group-hover:scale-110 transition-transform" />
                        <span className="text-[8px] font-black uppercase tracking-[0.3em] italic">Ventas</span>
                    </div>
                </Link>
                <Link href="/admin/employees">
                    <div className="flex flex-col items-center gap-1.5 text-slate-600 hover:text-orange-500 group cursor-pointer active:scale-90 transition-all pt-3 -mt-3">
                        <Activity className="w-7 h-7 group-hover:scale-110 transition-transform" />
                        <span className="text-[8px] font-black uppercase tracking-[0.3em] italic">Staff</span>
                    </div>
                </Link>
                <Link href="/admin/reports">
                    <div className="flex flex-col items-center gap-1.5 text-slate-600 hover:text-orange-500 group cursor-pointer active:scale-90 transition-all pt-3 -mt-3">
                        <TrendingUp className="w-7 h-7 group-hover:scale-110 transition-transform" />
                        <span className="text-[8px] font-black uppercase tracking-[0.3em] italic">Stats</span>
                    </div>
                </Link>
                <Link href="/admin/settings">
                    <div className="flex flex-col items-center gap-1.5 text-slate-600 hover:text-orange-500 group cursor-pointer active:scale-90 transition-all pt-3 -mt-3">
                        <Shield className="w-7 h-7 group-hover:scale-110 transition-transform" />
                        <span className="text-[8px] font-black uppercase tracking-[0.3em] italic">Core</span>
                    </div>
                </Link>
            </nav>

            <style jsx global>{`
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-3px); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 2s ease-in-out infinite;
                }
                @keyframes pulse-slow {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.95; }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 4s ease-in-out infinite;
                }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 20px; }
            `}</style>
        </div>
    )
}

function peakArrayMax(peaks: any[]) {
    if (peaks.length === 0) return ""
    const max = [...peaks].sort((a, b) => b.count - a.count)[0]
    return `${max.hour}:00 Y ${max.hour + 1}:00`
}
