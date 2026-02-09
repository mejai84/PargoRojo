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
    Timer,
    Activity,
    Cpu,
    BarChart3,
    Target,
    Award,
    Gauge,
    Play,
    CheckCircle,
    Package
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
    { id: 'pending' as const, label: 'COLA DE ENTRADA', color: 'text-slate-300' },
    { id: 'preparing' as const, label: 'EN FOGÓN ACTIVO', color: 'text-slate-300' },
    { id: 'ready' as const, label: 'LISTO / PICKUP', color: 'text-slate-300' }
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
                        return (end - start) / 60000
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
            toast.success(`PEDIDO ACTUALIZADO`, {
                icon: newStatus === 'ready' ? <Check className="text-emerald-500" /> : <Flame className="text-primary" />
            })
        }
    }

    const getElapsed = (dateString: string) => {
        const start = new Date(dateString).getTime()
        const diff = Math.floor((new Date().getTime() - start) / 60000)
        return diff
    }

    const formatTime = (minutes: number) => {
        const hrs = Math.floor(minutes / 60)
        const mins = minutes % 60
        const secs = Math.floor((new Date().getTime() - new Date(currentTime).getTime()) / 1000) % 60
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const getTimeColor = (minutes: number) => {
        if (minutes < 5) return 'text-emerald-400'
        if (minutes < 10) return 'text-yellow-400'
        if (minutes < 15) return 'text-orange-400'
        return 'text-red-400'
    }

    const filteredOrders = orders.filter(order => {
        if (activeStationId === 'TODAS') return true
        return order.order_items.some(item => item.products?.station_id === activeStationId)
    })

    const preparingCount = orders.filter(o => o.status === 'preparing').length
    const criticalOrders = orders.filter(o => getElapsed(o.created_at) > 15).length

    if (loading && orders.length === 0) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
            <div className="flex flex-col items-center gap-8">
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
                <p className="text-sm font-bold uppercase tracking-wider text-slate-400">Cargando KDS...</p>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-slate-900 text-white font-sans relative overflow-hidden">

            {/* Background Effect */}
            <div className="fixed inset-0 bg-gradient-to-br from-orange-900/20 via-slate-900 to-slate-950 pointer-events-none" />
            <div className="fixed inset-0 bg-[url('/fire-texture.png')] opacity-5 pointer-events-none" />

            <div className="relative z-10 p-6 space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/admin">
                            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl bg-slate-800/50 border border-slate-700 hover:bg-slate-700">
                                <ArrowLeft className="w-6 h-6" />
                            </Button>
                        </Link>

                        <div className="flex items-center gap-4">
                            <h1 className="text-4xl font-black italic text-white">
                                KDS <span className="text-white">PRO</span>
                            </h1>
                            <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center gap-2">
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">REALTIME_SYNC_ACTIVE</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Station Filters */}
                        <div className="flex items-center gap-2 bg-slate-800/50 p-1.5 rounded-xl border border-slate-700">
                            <button
                                onClick={() => setActiveStationId("TODAS")}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                                    activeStationId === "TODAS"
                                        ? "bg-primary text-black shadow-lg shadow-primary/20"
                                        : "text-slate-400 hover:text-white"
                                )}
                            >
                                TODAS
                            </button>
                            {stations.map(station => (
                                <button
                                    key={station.id}
                                    onClick={() => setActiveStationId(station.id)}
                                    className={cn(
                                        "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                                        activeStationId === station.id
                                            ? "bg-primary text-black shadow-lg shadow-primary/20"
                                            : "text-slate-400 hover:text-white"
                                    )}
                                >
                                    {station.name}
                                </button>
                            ))}
                        </div>

                        {/* En Fogón Counter */}
                        <div className="px-6 py-3 bg-primary/20 border border-primary/30 rounded-xl">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">EN FOGÓN:</span>
                            <span className="text-2xl font-black text-primary">{preparingCount}</span>
                        </div>

                        <Button onClick={fetchData} variant="ghost" size="icon" className="h-12 w-12 rounded-xl bg-slate-800/50 border border-slate-700 hover:bg-slate-700">
                            <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
                        </Button>
                    </div>
                </div>

                {/* Metrics Dashboard */}
                {showMetrics && (
                    <div className="grid grid-cols-4 gap-4 animate-in slide-in-from-top-4 duration-300">
                        <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                                <Target className="w-5 h-5 text-blue-400" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Activas</span>
                            </div>
                            <p className="text-3xl font-black text-blue-400">{metrics.totalOrders}</p>
                        </div>
                        <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                                <Timer className="w-5 h-5 text-amber-400" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Promedio</span>
                            </div>
                            <p className="text-3xl font-black text-amber-400">{metrics.avgPrepTime}<span className="text-lg">min</span></p>
                        </div>
                        <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                                <Award className="w-5 h-5 text-emerald-400" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Hoy</span>
                            </div>
                            <p className="text-3xl font-black text-emerald-400">{metrics.completedToday}</p>
                        </div>
                        <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                                <Gauge className="w-5 h-5 text-primary" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Eficiencia</span>
                            </div>
                            <p className="text-3xl font-black text-primary">{metrics.efficiency}<span className="text-lg">%</span></p>
                        </div>
                    </div>
                )}

                {/* Kanban Columns */}
                <div className="grid grid-cols-3 gap-6 h-[calc(100vh-200px)]">
                    {STATUS_COLUMNS.map(column => (
                        <div key={column.id} className="flex flex-col">
                            {/* Column Header */}
                            <div className="bg-slate-800/70 backdrop-blur-sm border border-slate-700 rounded-t-2xl p-4 flex items-center justify-between">
                                <h2 className={cn("text-sm font-black italic uppercase tracking-wider", column.color)}>
                                    {column.label}
                                </h2>
                                <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center">
                                    <span className="text-sm font-black text-slate-300">
                                        {filteredOrders.filter(o => o.status === column.id).length}
                                    </span>
                                </div>
                            </div>

                            {/* Column Content */}
                            <div className="flex-1 bg-slate-800/30 backdrop-blur-sm border-x border-b border-slate-700 rounded-b-2xl p-4 overflow-y-auto space-y-4 custom-scrollbar">
                                {filteredOrders
                                    .filter(o => o.status === column.id)
                                    .map((order) => {
                                        const minutes = getElapsed(order.created_at)
                                        const timeColor = getTimeColor(minutes)
                                        const itemsToDisplay = order.order_items.filter(item =>
                                            activeStationId === 'TODAS' || item.products?.station_id === activeStationId
                                        )

                                        if (itemsToDisplay.length === 0) return null

                                        return (
                                            <div
                                                key={order.id}
                                                className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-2xl p-4 space-y-3 hover:border-primary/30 transition-all"
                                            >
                                                {/* Order Header */}
                                                <div className="flex items-start justify-between">
                                                    <h3 className="text-xl font-black italic uppercase text-white">
                                                        {order.tables?.table_name || 'DOMICILIO'}
                                                    </h3>
                                                    <div className={cn("text-sm font-mono font-bold tabular-nums", timeColor)}>
                                                        {String(Math.floor(minutes / 60)).padStart(2, '0')}:
                                                        {String(minutes % 60).padStart(2, '0')}:
                                                        {String(Math.floor((Date.now() - new Date(order.created_at).getTime()) / 1000) % 60).padStart(2, '0')}
                                                        {minutes > 15 && <AlertTriangle className="w-3 h-3 inline ml-1 animate-pulse" />}
                                                    </div>
                                                </div>

                                                {/* Order Items */}
                                                <div className="space-y-2">
                                                    {itemsToDisplay.map((item, idx) => (
                                                        <div key={idx} className="flex items-start gap-2 text-sm">
                                                            <span className="font-bold text-white min-w-[24px]">{item.quantity}x</span>
                                                            <span className="text-slate-300">{item.products?.name}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Notes */}
                                                {order.notes && (
                                                    <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                                        <p className="text-xs text-amber-400">{order.notes}</p>
                                                    </div>
                                                )}

                                                {/* Action Buttons */}
                                                <div className="flex gap-2 pt-2">
                                                    {order.status === 'pending' && (
                                                        <Button
                                                            onClick={() => updateStatus(order.id, 'preparing')}
                                                            className="flex-1 bg-primary hover:bg-primary/90 text-black font-bold uppercase text-xs rounded-lg h-10"
                                                        >
                                                            EMPEZAR
                                                        </Button>
                                                    )}
                                                    {order.status === 'preparing' && (
                                                        <Button
                                                            onClick={() => updateStatus(order.id, 'ready')}
                                                            className="flex-1 bg-primary hover:bg-primary/90 text-black font-bold uppercase text-xs rounded-lg h-10"
                                                        >
                                                            COMPLETAR
                                                        </Button>
                                                    )}
                                                    {order.status === 'ready' && (
                                                        <Button
                                                            onClick={() => updateStatus(order.id, 'delivered')}
                                                            className="flex-1 bg-primary hover:bg-primary/90 text-black font-bold uppercase text-xs rounded-lg h-10"
                                                        >
                                                            RETIRADO
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}

                                {filteredOrders.filter(o => o.status === column.id).length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center py-12 opacity-30">
                                        <Package className="w-16 h-16 text-slate-600 mb-3" />
                                        <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
                                            Sin órdenes
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
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(15, 23, 42, 0.3);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 77, 0, 0.3);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 77, 0, 0.5);
                }
            `}</style>
        </div>
    )
}
