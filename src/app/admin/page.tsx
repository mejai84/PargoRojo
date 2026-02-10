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
    Target,
    Bell,
    Settings,
    LayoutDashboard
} from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import Link from "next/link"
import { formatPrice } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { useRestaurant } from "@/providers/RestaurantProvider"
import { toast } from "sonner"

export default function AdminDashboard() {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        todayRevenue: 2450000,
        activeOrders: 18,
        criticalStock: 3,
        occupiedTables: 12,
        totalTables: 20,
        newCustomers: 8,
        rating: 4.8
    })
    const [currentTime, setCurrentTime] = useState(new Date())
    const { restaurant } = useRestaurant()

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        setLoading(false)
        return () => clearInterval(timer)
    }, [])

    const navItems = [
        { label: 'POS VENTA', icon: ShoppingBag, href: '/admin/pos', desc: 'Terminal Punto de Venta' },
        { label: 'KDS COCINA', icon: Flame, href: '/admin/kitchen', desc: 'Central de Producción' },
        { label: 'INVENTARIO', icon: Package, href: '/admin/inventory', desc: 'Control de Suministros' },
        { label: 'NÓMINA', icon: Users, href: '/admin/payroll', desc: 'Gestión de Personal' },
        { label: 'PRODUCTOS', icon: Utensils, href: '/admin/products', desc: 'Ingeniería de Menú' },
        { label: 'REPORTES', icon: BarChart3, href: '/admin/reports', desc: 'Business Intelligence' },
    ]

    return (
        <div className="min-h-screen text-white font-sans relative overflow-hidden">

            {/* 🖼️ FONDO PREMIM: Restaurante de Lujo con Blur */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center scale-105 pointer-events-none" />

            {/* 🌫️ CAPA DE CRISTAL OSCURO PROFUNDO */}
            <div className="absolute inset-0 backdrop-blur-[100px] bg-slate-950/90 pointer-events-none" />

            <div className="relative z-10 p-8 md:p-12 space-y-10 max-w-[1800px] mx-auto flex flex-col min-h-full">

                {/* HEADER EJECUTIVO */}
                <div className="flex items-center justify-between shrink-0">
                    <div className="space-y-1">
                        <h1 className="text-6xl font-black italic tracking-tighter uppercase leading-none">DASHBOARD <span className="text-orange-500">ADMINISTRATIVO</span></h1>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.5em] italic flex items-center gap-4">
                            CENTRAL COMMAND HUB
                            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                            PARGO ROJO OS v2.0
                        </p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-3xl font-black italic tracking-tighter font-mono">
                                {currentTime.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </p>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">TIEMPO REAL DE SISTEMA</p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                onClick={() => toast.info("CENTRO DE NOTIFICACIONES: Sin mensajes nuevos")}
                                variant="ghost" size="icon" className="h-14 w-14 rounded-2xl bg-slate-800/40 border border-white/5"
                            >
                                <Bell className="w-6 h-6 text-slate-400" />
                            </Button>
                            <Link href="/admin/settings">
                                <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl bg-slate-800/40 border border-white/5">
                                    <Settings className="w-6 h-6 text-slate-400" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* KPI CARDS (Estilo Glow) */}
                <div className="grid grid-cols-6 gap-6 shrink-0">
                    {[
                        { label: 'VENTAS HOY', val: formatPrice(stats.todayRevenue), icon: DollarSign, color: 'text-orange-500', glow: 'shadow-orange-500/20' },
                        { label: 'ÓRDENES ACTIVAS', val: stats.activeOrders, icon: Flame, color: 'text-orange-500', glow: 'shadow-orange-500/20' },
                        { label: 'MESAS OCUPADAS', val: `${stats.occupiedTables}/${stats.totalTables}`, icon: LayoutDashboard, color: 'text-white' },
                        { label: 'STOCKS CRÍTICO', val: stats.criticalStock, icon: AlertCircle, color: 'text-red-500' },
                        { label: 'CLIENTES NUEVOS', val: `+${stats.newCustomers}`, icon: Users, color: 'text-blue-400' },
                        { label: 'VALORACIÓN', val: stats.rating, icon: Star, color: 'text-yellow-400' },
                    ].map((card, i) => (
                        <div key={i} className={cn(
                            "bg-slate-800/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 transition-all hover:scale-105 hover:bg-slate-700/50",
                            card.glow && `shadow-2xl ${card.glow}`
                        )}>
                            <div className="flex items-center justify-between mb-4">
                                <card.icon className={cn("w-5 h-5 opacity-40", card.color)} />
                                <TrendingUp className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100" />
                            </div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{card.label}</p>
                            <p className={cn("text-2xl font-black italic", card.color)}>{card.val}</p>
                        </div>
                    ))}
                </div>

                {/* MAIN GRID */}
                <div className="grid grid-cols-12 gap-10 flex-1 min-h-0">

                    {/* MODULOS DE CONTROL */}
                    <div className="col-span-8 flex flex-col space-y-6">
                        <h2 className="text-xs font-black uppercase tracking-[0.4em] text-slate-500 italic">Módulos de Control Operativo</h2>
                        <div className="grid grid-cols-2 gap-6 flex-1 overflow-y-auto pr-4 custom-scrollbar">
                            {navItems.map((item, i) => (
                                <Link key={i} href={item.href}>
                                    <div className="group bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 h-full transition-all hover:border-orange-500/40 cursor-pointer overflow-hidden relative">
                                        <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all">
                                            <item.icon className="w-32 h-32" />
                                        </div>
                                        <div className="relative z-10 flex flex-col h-full justify-between">
                                            <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 group-hover:bg-orange-500 group-hover:text-black transition-all">
                                                <item.icon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-3xl font-black italic tracking-tighter uppercase group-hover:text-orange-500 transition-colors">{item.label}</h3>
                                                <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-2">{item.desc}</p>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* REAL-TIME TRENDS (Estilo Mockup) */}
                    <div className="col-span-4 bg-slate-800/40 backdrop-blur-3xl border border-orange-500/20 rounded-[3rem] p-8 shadow-2xl shadow-orange-950/20 flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between mb-10">
                            <h2 className="text-lg font-black italic uppercase tracking-tight">Real-time <span className="text-orange-500">Sales</span></h2>
                            <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-[9px] font-bold text-emerald-400 uppercase">Live Metrics</div>
                        </div>

                        {/* Simulación Gráfico Trend */}
                        <div className="flex-1 relative mb-6">
                            <div className="absolute inset-0 bg-gradient-to-t from-orange-500/20 to-transparent rounded-3xl border border-orange-500/10 flex items-end p-6 gap-2">
                                {[30, 45, 60, 40, 75, 90, 85, 95, 100].map((h, i) => (
                                    <div key={i} className="flex-1 bg-gradient-to-t from-orange-600 to-orange-400 rounded-lg hover:brightness-150 transition-all" style={{ height: `${h}%` }} />
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="p-5 bg-slate-900/60 rounded-2xl border border-white/5 group hover:border-orange-500/30 transition-all cursor-pointer">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                            <ShoppingBag className="w-5 h-5 text-orange-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black italic uppercase">Última Venta: Mesa 5</p>
                                            <p className="text-[10px] font-medium text-slate-500">Hace 2 minutos</p>
                                        </div>
                                    </div>
                                    <p className="text-lg font-black italic tracking-tighter">$145.000</p>
                                </div>
                            </div>
                            <Button
                                onClick={() => toast.success("CIERRE X GENERADO CORRECTAMENTE")}
                                className="w-full h-16 bg-white text-black font-black uppercase tracking-[0.2em] italic rounded-2xl hover:bg-slate-200 shadow-xl"
                            >
                                EJECUTAR CIERRE X
                            </Button>
                        </div>
                    </div>

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
