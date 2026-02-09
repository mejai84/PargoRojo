"use client"

import { Button } from "@/components/ui/button"
import {
    Clock,
    Check,
    AlertTriangle,
    ArrowLeft,
    RefreshCw,
    Loader2,
    Flame,
    Bell,
    Eye,
    X,
    Timer,
    Utensils,
    ChevronRight,
    Search,
    Zap,
    Activity,
    Box,
    Sparkles,
    MonitorIcon,
    ArrowRight,
    Signal,
    Layers,
    Cpu,
    TrendingUp,
    BarChart3,
    Target,
    Award,
    Gauge
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { useRestaurant } from "@/providers/RestaurantProvider"
import { toast } from "sonner"

type OrderItem = {
    quantity: number
    customizations: any
    products: {
        id: string
        name: string
        is_available: boolean
        preparation_time?: number
        station_id?: string
        categories?: {
            name: string
        }
    } | null
}

type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

type Order = {
    id: string
    created_at: string
    status: OrderStatus
    order_items: OrderItem[]
    guest_info?: any
    tables?: {
        table_name: string
    }
    preparation_started_at?: string
    preparation_finished_at?: string
    notes?: string
}

interface Station {
    id: string
    name: string
}

interface KitchenMetrics {
    totalOrders: number
    avgPrepTime: number
    completedToday: number
    efficiency: number
}

const STATUS_COLUMNS = [
    { id: 'pending' as const, label: 'COLA DE ENTRADA', color: 'text-blue-500', bg: 'bg-blue-500/5', accent: 'border-blue-500/20', icon: Clock },
    { id: 'preparing' as const, label: 'EN FOGÓN ACTIVO', color: 'text-primary', bg: 'bg-primary/5', accent: 'border-primary/20', icon: Flame },
    { id: 'ready' as const, label: 'LISTO / PICKUP', color: 'text-emerald-500', bg: 'bg-emerald-500/5', accent: 'border-emerald-500/20', icon: Check }
];

export default function KitchenPage() {
    const { restaurant } = useRestaurant()
    const [orders, setOrders] = useState<Order[]>([])
    const [stations, setStations] = useState<Station[]>([])
    const [loading, setLoading] = useState(true)
    const [activeStationId, setActiveStationId] = useState<string>("TODAS")
    const [currentTime, setCurrentTime] = useState(new Date())
    const [showMetrics, setShowMetrics] = useState(false)
    const [metrics, setMetrics] = useState<KitchenMetrics>({
        totalOrders: 0,
        avgPrepTime: 0,
        completedToday: 0,
        efficiency: 0
    })

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)

        if (restaurant) {
            fetchData()
            calculateMetrics()
        }

        const channel = supabase
            .channel('kitchen-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    new Audio('/sounds/new-order.mp3').play().catch(() => { })
                    toast.info("NUEVO PEDIDO ENTRANTE", {
                        icon: <Bell className="text-primary animate-bounce" />,
                        duration: 5000
                    })
                }
                fetchData()
                calculateMetrics()
            })
            .subscribe()

        return () => {
            clearInterval(timer)
            supabase.removeChannel(channel)
        }
    }, [restaurant])

    const fetchData = async () => {
        try {
            setLoading(true)

            const { data: stationsData, error: sError } = await supabase
                .from('prep_stations')
                .select('id, name')
                .eq('is_active', true)
                .eq('restaurant_id', restaurant?.id)

            if (sError) console.error("Error cargando estaciones:", sError)
            setStations(stationsData || [])

            const { data, error: oError } = await supabase
                .from('orders')
                .select(`
                    *, 
                    tables (table_name), 
                    order_items (
                        quantity, 
                        customizations, 
                        products (id, name, is_available, station_id, preparation_time)
                    )
                `)
                .eq('restaurant_id', restaurant?.id)
                .in('status', ['pending', 'preparing', 'ready'])
                .order('created_at', { ascending: true })

            if (oError) {
                console.error("Error cargando pedidos KDS:", oError)
                setOrders([])
            } else {
                setOrders(data || [])
            }
        } catch (err) {
            console.error("Error fatal en KDS:", err)
            setOrders([])
        } finally {
            setLoading(false)
        }
    }

    const calculateMetrics = async () => {
        try {
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            const { data: completedOrders } = await supabase
                .from('orders')
                .select('preparation_started_at, preparation_finished_at')
                .eq('restaurant_id', restaurant?.id)
                .eq('status', 'delivered')
                .gte('created_at', today.toISOString())

            if (completedOrders && completedOrders.length > 0) {
                const times = completedOrders
                    .filter(o => o.preparation_started_at && o.preparation_finished_at)
                    .map(o => {
                        const start = new Date(o.preparation_started_at!).getTime()
                        const end = new Date(o.preparation_finished_at!).getTime()
                        return (end - start) / 60000 // minutes
                    })

                const avgTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0
                const efficiency = avgTime > 0 ? Math.min(100, Math.max(0, 100 - (avgTime - 10) * 5)) : 0

                setMetrics({
                    totalOrders: orders.length,
                    avgPrepTime: Math.round(avgTime),
                    completedToday: completedOrders.length,
                    efficiency: Math.round(efficiency)
                })
            }
        } catch (err) {
            console.error("Error calculando métricas:", err)
        }
    }

    const updateStatus = async (id: string, newStatus: OrderStatus) => {
        const updateData: any = { status: newStatus }
        if (newStatus === 'preparing') updateData.preparation_started_at = new Date().toISOString()
        if (newStatus === 'ready') updateData.preparation_finished_at = new Date().toISOString()

        const { error } = await supabase.from('orders').update(updateData).eq('id', id)
        if (!error) {
            fetchData()
            calculateMetrics()
            toast.success(`PEDIDO ACTUALIZADO A ${newStatus.toUpperCase()}`, {
                icon: newStatus === 'ready' ? <Check className="text-emerald-500" /> : <Flame className="text-primary" />
            })
        }
    }

    const getElapsed = (dateString: string) => {
        const start = new Date(dateString).getTime()
        const diff = Math.floor((new Date().getTime() - start) / 60000)
        return diff
    }

    const getTimeColor = (minutes: number) => {
        if (minutes < 5) return { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/30' }
        if (minutes < 10) return { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/30' }
        if (minutes < 15) return { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/30' }
        return { bg: 'bg-rose-500/10', text: 'text-rose-500', border: 'border-rose-500/30', pulse: true }
    }

    const getEstimatedTime = (items: OrderItem[]) => {
        const maxTime = Math.max(...items.map(item => item.products?.preparation_time || 10))
        return maxTime
    }

    const filteredOrders = orders.filter(order => {
        if (activeStationId === 'TODAS') return true
        return order.order_items.some(item => item.products?.station_id === activeStationId)
    })

    const preparingCount = orders.filter(o => o.status === 'preparing').length
    const criticalOrders = orders.filter(o => getElapsed(o.created_at) > 15).length

    if (loading && orders.length === 0) return (
        <div className="min-h-screen flex items-center justify-center bg-transparent">
            <div className="flex flex-col items-center gap-8 animate-in fade-in duration-1000">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
                    <Loader2 className="w-16 h-16 text-primary animate-spin relative z-10" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary italic animate-pulse">Sincronizando Nodos de Cocina...</p>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-transparent text-foreground p-4 md:p-12 font-sans selection:bg-primary selection:text-primary-foreground relative overflow-hidden">

            {/* 🌌 AMBIANCE LAYER */}
            <div className="fixed top-0 left-0 w-full h-[600px] bg-gradient-to-b from-primary/10 via-primary/[0.02] to-transparent pointer-events-none z-0" />
            <div className="fixed -bottom-40 -left-40 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none opacity-20 z-0 animate-pulse" />

            <div className="max-w-[1900px] mx-auto space-y-12 animate-in fade-in duration-1000 relative z-10 h-[calc(100vh-100px)] flex flex-col">

                {/* 🚀 KITCHEN MANAGEMENT HEADER */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-12 border-b border-border/50 pb-12 shrink-0">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-10">
                        <Link href="/admin">
                            <Button variant="ghost" size="icon" className="h-20 w-20 rounded-[2.5rem] bg-card border border-border shadow-3xl hover:bg-muted active:scale-90 transition-all group overflow-hidden relative">
                                <ArrowLeft className="w-10 h-10 group-hover:-translate-x-1 transition-transform relative z-10" />
                            </Button>
                        </Link>
                        <div className="space-y-6">
                            <div className="flex flex-wrap items-center gap-4">
                                <h1 className="text-6xl md:text-7xl font-black italic tracking-tighter uppercase leading-none text-foreground">KDS <span className="text-primary italic">PRO</span></h1>
                                <div className="px-5 py-2 bg-primary/10 border-2 border-primary/20 rounded-[1.5rem] text-[11px] font-black text-primary tracking-[0.3em] italic uppercase shadow-xl animate-pulse flex items-center gap-3">
                                    <Activity className="w-3 h-3" />
                                    REALTIME_SYNC_ACTIVE
                                </div>
                                {criticalOrders > 0 && (
                                    <div className="px-5 py-2 bg-rose-500/10 border-2 border-rose-500/20 rounded-[1.5rem] text-[11px] font-black text-rose-500 tracking-[0.3em] italic uppercase shadow-xl animate-pulse flex items-center gap-3">
                                        <AlertTriangle className="w-3 h-3 animate-bounce" />
                                        {criticalOrders} CRÍTICAS
                                    </div>
                                )}
                            </div>
                            <p className="text-[11px] text-muted-foreground font-black uppercase tracking-[0.5em] italic flex items-center gap-4 opacity-60">
                                <Flame className="w-5 h-5 text-primary" /> Estación: {stations.find(s => s.id === activeStationId)?.name || "CENTRO_CONTROL_TOTAL"}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6">
                        {/* Station Switcher */}
                        <div className="flex bg-card/60 backdrop-blur-md p-2 rounded-[2rem] border-2 border-border/40 shadow-xl overflow-x-auto no-scrollbar max-w-full">
                            <button
                                onClick={() => setActiveStationId("TODAS")}
                                className={cn(
                                    "px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all italic whitespace-nowrap",
                                    activeStationId === "TODAS" ? "bg-primary text-black shadow-lg" : "text-muted-foreground/40 hover:text-foreground"
                                )}
                            >
                                TODAS
                            </button>
                            {stations.map(station => (
                                <button
                                    key={station.id}
                                    onClick={() => setActiveStationId(station.id)}
                                    className={cn(
                                        "px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all italic whitespace-nowrap",
                                        activeStationId === station.id ? "bg-primary text-black shadow-lg" : "text-muted-foreground/40 hover:text-foreground"
                                    )}
                                >
                                    {station.name.toUpperCase()}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowMetrics(!showMetrics)}
                                className="px-8 py-4 bg-slate-900 text-white rounded-[2rem] flex flex-col items-center shadow-3xl group/metrics active:scale-95 transition-all border-2 border-primary/20 hover:border-primary/40"
                            >
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 italic">ANALÍTICA</span>
                                <BarChart3 className="w-6 h-6 text-primary group-hover/metrics:scale-110 transition-transform" />
                            </button>
                            <div className="px-8 py-4 bg-foreground rounded-[2rem] text-background flex flex-col items-center shadow-3xl group/fire active:scale-95 transition-all">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 italic">EN FOGÓN</span>
                                <span className="text-3xl font-black italic text-primary drop-shadow-[0_0_10px_rgba(255,77,0,0.5)] group-hover/fire:scale-110 transition-transform">{preparingCount}</span>
                            </div>
                            <Button onClick={fetchData} className="h-20 w-20 bg-card border-4 border-border/40 rounded-[2.5rem] hover:text-primary hover:border-primary/40 shadow-3xl transition-all group/btn active:scale-90 flex items-center justify-center">
                                <RefreshCw className={cn("w-8 h-8 group-hover/btn:rotate-180 transition-transform duration-700", loading && "animate-spin")} />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* 📊 METRICS DASHBOARD */}
                {showMetrics && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 animate-in slide-in-from-top-4 duration-500 shrink-0">
                        <div className="bg-card/60 backdrop-blur-xl p-8 rounded-[3rem] border-2 border-border/40 shadow-2xl space-y-4">
                            <div className="flex items-center justify-between">
                                <Target className="w-8 h-8 text-blue-500" />
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">ÓRDENES ACTIVAS</span>
                            </div>
                            <p className="text-5xl font-black italic text-blue-500">{metrics.totalOrders}</p>
                        </div>
                        <div className="bg-card/60 backdrop-blur-xl p-8 rounded-[3rem] border-2 border-border/40 shadow-2xl space-y-4">
                            <div className="flex items-center justify-between">
                                <Timer className="w-8 h-8 text-amber-500" />
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">TIEMPO PROMEDIO</span>
                            </div>
                            <p className="text-5xl font-black italic text-amber-500">{metrics.avgPrepTime}<span className="text-2xl">min</span></p>
                        </div>
                        <div className="bg-card/60 backdrop-blur-xl p-8 rounded-[3rem] border-2 border-border/40 shadow-2xl space-y-4">
                            <div className="flex items-center justify-between">
                                <Award className="w-8 h-8 text-emerald-500" />
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">COMPLETADAS HOY</span>
                            </div>
                            <p className="text-5xl font-black italic text-emerald-500">{metrics.completedToday}</p>
                        </div>
                        <div className="bg-card/60 backdrop-blur-xl p-8 rounded-[3rem] border-2 border-border/40 shadow-2xl space-y-4">
                            <div className="flex items-center justify-between">
                                <Gauge className="w-8 h-8 text-primary" />
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">EFICIENCIA</span>
                            </div>
                            <p className="text-5xl font-black italic text-primary">{metrics.efficiency}<span className="text-2xl">%</span></p>
                        </div>
                    </div>
                )}

                {/* 🏗️ KDS KANBAN GRID */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-12 overflow-hidden pb-4">
                    {STATUS_COLUMNS.map(column => (
                        <div key={column.id} className={cn("flex flex-col h-full rounded-[4.5rem] border-4 overflow-hidden shadow-3xl backdrop-blur-md transition-all", column.bg, column.accent)}>
                            <div className="p-10 pb-6 flex items-center justify-between border-b-2 border-current/5 relative overflow-hidden group/col">
                                <div className="absolute inset-0 bg-current/2 opacity-[0.05] group-hover/col:opacity-10 transition-opacity" />
                                <div className="flex items-center gap-4 relative z-10">
                                    <column.icon className={cn("w-8 h-8", column.color)} />
                                    <h2 className={cn("text-[12px] font-black uppercase tracking-[0.6em] italic", column.color)}>
                                        {column.label}
                                    </h2>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-card border-2 border-current/20 flex items-center justify-center text-[12px] font-black text-foreground shadow-xl relative z-10">
                                    {filteredOrders.filter(o => o.status === column.id).length}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                                {filteredOrders
                                    .filter(o => o.status === column.id)
                                    .map((order, idx) => {
                                        const minutes = getElapsed(order.created_at)
                                        const timeStyle = getTimeColor(minutes)
                                        const estimatedTime = getEstimatedTime(order.order_items)
                                        const itemsToDisplay = order.order_items.filter(item =>
                                            activeStationId === 'TODAS' || item.products?.station_id === activeStationId
                                        )

                                        if (itemsToDisplay.length === 0) return null

                                        return (
                                            <div
                                                key={order.id}
                                                className={cn(
                                                    "group/card bg-card/80 backdrop-blur-xl rounded-[3.5rem] border-4 p-8 space-y-8 transition-all relative overflow-hidden shadow-2xl animate-in zoom-in-95 active:scale-[0.98]",
                                                    minutes > 15 ? "border-rose-500/40 shadow-rose-500/10" : "border-border/40 hover:border-primary/40",
                                                    timeStyle.pulse && "animate-pulse"
                                                )}
                                                style={{ animationDelay: `${idx * 100}ms` }}
                                            >
                                                {/* Header Info */}
                                                <div className="flex justify-between items-start">
                                                    <div className="space-y-2">
                                                        <h3 className="text-3xl font-black italic uppercase tracking-tighter text-foreground leading-none group-hover/card:text-primary transition-colors">
                                                            {order.tables?.table_name || 'DOMICILIO / HUB'}
                                                        </h3>
                                                        <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.4em] italic font-mono flex items-center gap-2">
                                                            <Cpu className="w-3 h-3 text-primary" /> NODE_{order.id.split('-')[0].toUpperCase()}
                                                        </p>
                                                    </div>
                                                    <div className={cn(
                                                        "px-6 py-3 rounded-[1.5rem] border-2 flex flex-col items-center min-w-[100px] shadow-lg",
                                                        timeStyle.bg,
                                                        timeStyle.border
                                                    )}>
                                                        <Timer className={cn("w-5 h-5 mb-1", timeStyle.text)} />
                                                        <span className={cn("text-2xl font-black italic leading-none", timeStyle.text)}>{minutes}</span>
                                                        <span className={cn("text-[8px] font-black uppercase tracking-widest mt-1", timeStyle.text)}>MIN</span>
                                                    </div>
                                                </div>

                                                {/* Items List */}
                                                <div className="space-y-4">
                                                    {itemsToDisplay.map((item, itemIdx) => (
                                                        <div key={itemIdx} className="flex items-center gap-6 bg-muted/20 p-6 rounded-[2rem] border border-border/20 group/item hover:bg-muted/40 transition-all">
                                                            <div className="w-12 h-12 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-xl font-black text-primary shadow-lg group-hover/item:scale-110 transition-transform">
                                                                {item.quantity}
                                                            </div>
                                                            <div className="flex-1 space-y-1">
                                                                <p className="text-lg font-black uppercase tracking-tight text-foreground leading-none">{item.products?.name}</p>
                                                                {item.customizations && Object.keys(item.customizations).length > 0 && (
                                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide italic">
                                                                        + {Object.values(item.customizations).join(', ')}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            {item.products?.preparation_time && (
                                                                <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                                                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest italic">
                                                                        ~{item.products.preparation_time}min
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Notes */}
                                                {order.notes && (
                                                    <div className="p-6 bg-amber-500/5 border-2 border-amber-500/20 rounded-[2rem]">
                                                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2 italic flex items-center gap-2">
                                                            <AlertTriangle className="w-3 h-3" /> NOTA ESPECIAL
                                                        </p>
                                                        <p className="text-sm font-bold text-foreground">{order.notes}</p>
                                                    </div>
                                                )}

                                                {/* Action Buttons */}
                                                <div className="flex gap-4 pt-4 border-t-2 border-border/10">
                                                    {order.status === 'pending' && (
                                                        <Button
                                                            onClick={() => updateStatus(order.id, 'preparing')}
                                                            className="flex-1 h-16 bg-primary hover:bg-primary/90 text-black rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] italic shadow-xl shadow-primary/20 gap-3 group/btn"
                                                        >
                                                            <Flame className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                                                            INICIAR PREPARACIÓN
                                                        </Button>
                                                    )}
                                                    {order.status === 'preparing' && (
                                                        <Button
                                                            onClick={() => updateStatus(order.id, 'ready')}
                                                            className="flex-1 h-16 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] italic shadow-xl shadow-emerald-500/20 gap-3 group/btn"
                                                        >
                                                            <Check className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                                                            MARCAR LISTO
                                                        </Button>
                                                    )}
                                                    {order.status === 'ready' && (
                                                        <Button
                                                            onClick={() => updateStatus(order.id, 'delivered')}
                                                            className="flex-1 h-16 bg-slate-900 hover:bg-slate-800 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] italic shadow-xl gap-3 group/btn"
                                                        >
                                                            <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                                                            ENTREGADO
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}

                                {filteredOrders.filter(o => o.status === column.id).length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center py-20 space-y-6 opacity-20">
                                        <column.icon className="w-24 h-24 text-muted-foreground" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground italic">
                                            SIN ÓRDENES EN {column.label}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: hsl(var(--primary) / 0.2);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: hsl(var(--primary) / 0.4);
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    )
}
