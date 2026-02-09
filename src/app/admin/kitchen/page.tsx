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
    Cpu
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
    order_items: (OrderItem & { products: { station_id: string } })[]
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

const STATUS_COLUMNS = [
    { id: 'pending' as const, label: 'POR PROCESAR', color: 'text-blue-500', bg: 'bg-blue-500/5', accent: 'border-blue-500/20' },
    { id: 'preparing' as const, label: 'EN FOGÓN / PREP', color: 'text-primary', bg: 'bg-primary/5', accent: 'border-primary/20' },
    { id: 'ready' as const, label: 'LISTAS / PICKUP', color: 'text-emerald-500', bg: 'bg-emerald-500/5', accent: 'border-emerald-500/20' }
];

export default function KitchenPage() {
    const { restaurant } = useRestaurant()
    const [orders, setOrders] = useState<Order[]>([])
    const [stations, setStations] = useState<Station[]>([])
    const [loading, setLoading] = useState(true)
    const [activeStationId, setActiveStationId] = useState<string>("TODAS")
    const [currentTime, setCurrentTime] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)

        if (restaurant) {
            fetchData()
        }

        const channel = supabase
            .channel('kitchen-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    new Audio('/sounds/new-order.mp3').play().catch(() => { })
                    toast.info("NUEVO PEDIDO ENTRANTE", { icon: <Bell className="text-primary" /> })
                }
                fetchData()
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
                        products (id, name, is_available, station_id)
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

    const updateStatus = async (id: string, newStatus: OrderStatus) => {
        const updateData: any = { status: newStatus }
        if (newStatus === 'preparing') updateData.preparation_started_at = new Date().toISOString()
        if (newStatus === 'ready') updateData.preparation_finished_at = new Date().toISOString()

        const { error } = await supabase.from('orders').update(updateData).eq(id, id)
        if (!error) {
            fetchData()
            toast.success(`PEDIDO ACTUALIZADO A ${newStatus.toUpperCase()}`)
        }
    }

    const getElapsed = (dateString: string) => {
        const start = new Date(dateString).getTime()
        const diff = Math.floor((new Date().getTime() - start) / 60000)
        return diff
    }

    const filteredOrders = orders.filter(order => {
        if (activeStationId === 'TODAS') return true
        return order.order_items.some(item => item.products?.station_id === activeStationId)
    })

    const preparingCount = orders.filter(o => o.status === 'preparing').length

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
                                <h1 className="text-6xl md:text-7xl font-black italic tracking-tighter uppercase leading-none text-foreground">CORE <span className="text-primary italic">KDS</span></h1>
                                <div className="px-5 py-2 bg-rose-500/10 border-2 border-rose-500/20 rounded-[1.5rem] text-[11px] font-black text-rose-500 tracking-[0.3em] italic uppercase shadow-xl animate-pulse flex items-center gap-3">
                                    <Activity className="w-3 h-3" />
                                    FOGON_SENSOR_V12
                                </div>
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

                {/* 🏗️ KDS KANBAN GRID */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-12 overflow-hidden pb-4">
                    {STATUS_COLUMNS.map(column => (
                        <div key={column.id} className={cn("flex flex-col h-full rounded-[4.5rem] border-4 overflow-hidden shadow-3xl backdrop-blur-md transition-all", column.bg, column.accent)}>
                            <div className="p-10 pb-6 flex items-center justify-between border-b-2 border-current/5 relative overflow-hidden group/col">
                                <div className="absolute inset-0 bg-current/2 opacity-[0.05] group-hover/col:opacity-10 transition-opacity" />
                                <h2 className={cn("text-[12px] font-black uppercase tracking-[0.6em] italic relative z-10", column.color)}>
                                    {column.label}
                                </h2>
                                <div className="w-12 h-12 rounded-2xl bg-card border-2 border-current/20 flex items-center justify-center text-[12px] font-black text-foreground shadow-xl relative z-10">
                                    {filteredOrders.filter(o => o.status === column.id).length}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                                {filteredOrders
                                    .filter(o => o.status === column.id)
                                    .map((order, idx) => {
                                        const minutes = getElapsed(order.created_at)
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
                                                        "flex flex-col items-center gap-1 px-4 py-2 rounded-[1.5rem] border-2 italic transition-all shadow-xl",
                                                        minutes > 15
                                                            ? "bg-rose-500 text-white border-rose-400 animate-pulse shadow-[0_0_20px_rgba(244,63,94,0.3)]"
                                                            : "bg-muted/40 text-muted-foreground border-border/40"
                                                    )}>
                                                        <span className="text-[10px] font-black uppercase tracking-widest">{minutes} M</span>
                                                        <Clock className="w-4 h-4 opacity-50" />
                                                    </div>
                                                </div>

                                                {/* Alerts / Notes */}
                                                {order.notes && (
                                                    <div className="p-5 bg-rose-500/10 border-2 border-rose-500/20 rounded-[2rem] flex items-start gap-4">
                                                        <AlertTriangle className="w-6 h-6 text-rose-500 flex-shrink-0 mt-1" />
                                                        <p className="text-[11px] font-black text-rose-500 uppercase italic leading-tight tracking-tight">
                                                            ATENCIÓN: {order.notes}
                                                        </p>
                                                    </div>
                                                )}

                                                <div className="space-y-5 border-t-2 border-border/20 pt-6">
                                                    {itemsToDisplay.map((item, i) => (
                                                        <div key={i} className="flex gap-6 group/item">
                                                            <div className="w-14 h-14 rounded-[1.2rem] bg-foreground text-background flex items-center justify-center text-2xl font-black italic shadow-xl group-hover/item:text-primary transition-colors">
                                                                {item.quantity}
                                                            </div>
                                                            <div className="space-y-3 flex-1 pt-1">
                                                                <p className="text-base font-black uppercase italic tracking-tighter text-foreground leading-none">{item.products?.name}</p>

                                                                {/* Customizations */}
                                                                {(item.customizations?.notes || (item.customizations as any)?.name) && (
                                                                    <div className="space-y-2">
                                                                        {item.customizations?.notes && (
                                                                            <div className="px-4 py-2 bg-amber-500/10 border-2 border-amber-500/20 rounded-xl inline-flex items-center gap-3">
                                                                                <Zap className="w-3 h-3 text-amber-500" />
                                                                                <p className="text-[9px] font-black text-amber-500 uppercase italic leading-none whitespace-nowrap">
                                                                                    {item.customizations.notes}
                                                                                </p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="pt-4 flex gap-4">
                                                    {order.status === 'pending' ? (
                                                        <Button
                                                            onClick={() => updateStatus(order.id, 'preparing')}
                                                            className="flex-1 h-20 bg-foreground text-background hover:bg-primary hover:text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.4em] italic transition-all shadow-xl group/march active:scale-95"
                                                        >
                                                            MARCHAR_SYNC <ArrowRight className="w-5 h-5 ml-4 group-hover/march:translate-x-2 transition-transform" />
                                                        </Button>
                                                    ) : order.status === 'preparing' ? (
                                                        <Button
                                                            onClick={() => updateStatus(order.id, 'ready')}
                                                            className="flex-1 h-20 bg-primary text-black hover:bg-emerald-500 hover:text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.4em] italic transition-all shadow-xl group/ready active:scale-95"
                                                        >
                                                            DESPACHAR <Check className="w-6 h-6 ml-4 group-hover/ready:scale-125 transition-transform" />
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            onClick={() => updateStatus(order.id, 'delivered')}
                                                            className="flex-1 h-20 bg-emerald-500 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.4em] italic shadow-xl group/final active:scale-95"
                                                        >
                                                            FINALIZADO <Check className="w-6 h-6 ml-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* 🏷️ GLOBAL METRIC HUB */}
                <div className="p-10 bg-foreground rounded-[4rem] text-background flex flex-col md:flex-row items-center justify-between shadow-3xl group/metric relative overflow-hidden shrink-0 mt-4">
                    <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover/metric:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-10 relative z-10">
                        <div className="w-20 h-20 rounded-[2rem] bg-background/10 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-2xl group-hover/metric:rotate-12 transition-transform duration-500">
                            <MonitorIcon className="w-10 h-10 text-primary drop-shadow-[0_0_15px_rgba(255,77,0,0.6)]" />
                        </div>
                        <div className="space-y-2 text-center md:text-left">
                            <h4 className="text-2xl font-black italic uppercase tracking-tighter text-primary">Master Kitchen Hub</h4>
                            <p className="text-[10px] text-background/40 font-black uppercase tracking-[0.4em] italic leading-none">
                                SYSTEM v8.42 • KERNEL OPTIMIZED FOR KDS_REALTIME_SYNC
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-12 mt-8 md:mt-0 relative z-10">
                        <div className="text-right">
                            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white/20 mb-1 italic">Process Load</p>
                            <p className="text-2xl font-black italic tracking-tighter text-emerald-500">{orders.length} NODOS ACTIVOS</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white/20 mb-1 italic">Sensor Health</p>
                            <p className="text-2xl font-black italic tracking-tighter text-white">NOMINAL_SYNC</p>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,102,0,0.1); border-radius: 20px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,102,0,0.3); }
                .no-scrollbar::-webkit-scrollbar { display: none; }
            `}</style>
        </div>
    )
}
