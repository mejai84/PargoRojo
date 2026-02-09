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
    Zap
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { useRestaurant } from "@/providers/RestaurantProvider"

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
    notes?: string // Observaciones generales
}

interface Station {
    id: string
    name: string
}

const STATUS_COLUMNS = [
    { id: 'pending' as const, label: 'RECIBIDAS', color: 'text-blue-600', bg: 'bg-white', accent: 'border-slate-200' },
    { id: 'preparing' as const, label: 'EN FOGÓN', color: 'text-primary', bg: 'bg-white', accent: 'border-slate-200' },
    { id: 'ready' as const, label: 'LISTAS', color: 'text-emerald-600', bg: 'bg-white', accent: 'border-slate-200' }
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

            // 1. Cargar Estaciones
            const { data: stationsData, error: sError } = await supabase
                .from('prep_stations')
                .select('id, name')
                .eq('is_active', true)
                .eq('restaurant_id', restaurant?.id)

            if (sError) console.error("Error cargando estaciones:", sError)
            setStations(stationsData || [])

            // 2. Cargar Órdenes
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

        const { error } = await supabase.from('orders').update(updateData).eq('id', id)
        if (!error) fetchData()
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

    return (
        <div className="min-h-screen bg-transparent text-slate-900 p-4 md:p-8 selection:bg-primary font-sans">

            {/* 🔝 PREMIUM KDS HEADER */}
            <div className="max-w-[1900px] mx-auto mb-10 flex flex-col xl:flex-row justify-between items-center gap-8 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="flex items-center gap-6">
                    <Link href="/admin">
                        <Button variant="ghost" size="icon" className="h-16 w-16 rounded-[2rem] bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-sm">
                            <ArrowLeft className="w-6 h-6 text-slate-900" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none text-slate-900">CORE <span className="text-primary">KDS</span></h1>
                            <div className="px-4 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-full text-[9px] font-black text-rose-500 animate-pulse tracking-widest italic">
                                SENSOR ACTIVADO
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-3 italic flex items-center gap-2">
                            <Zap className="w-3 h-3" /> Estación: {stations.find(s => s.id === activeStationId)?.name || "TODAS"}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 p-3 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <button
                        onClick={() => setActiveStationId("TODAS")}
                        className={cn(
                            "px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all italic",
                            activeStationId === "TODAS" ? "bg-primary text-black" : "text-slate-400 hover:text-slate-900"
                        )}
                    >
                        TODAS
                    </button>
                    {stations.map(station => (
                        <button
                            key={station.id}
                            onClick={() => setActiveStationId(station.id)}
                            className={cn(
                                "px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all italic",
                                activeStationId === station.id ? "bg-primary text-black" : "text-slate-400 hover:text-slate-900"
                            )}
                        >
                            {station.name}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex gap-2">
                        <div className="px-6 py-3 bg-white rounded-2xl border border-primary/20 flex flex-col items-center shadow-sm">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">En Fuego</span>
                            <span className="text-xl font-black text-primary italic leading-none">{preparingCount}</span>
                        </div>
                        <div className="px-6 py-3 bg-white rounded-2xl border border-slate-200 flex flex-col items-center border-dashed shadow-sm">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tiempo Prom</span>
                            <span className="text-xl font-black text-slate-900 italic leading-none">12M</span>
                        </div>
                    </div>
                    <Button onClick={fetchData} className="h-16 w-16 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-sm">
                        <RefreshCw className={cn("w-6 h-6 text-slate-900", loading && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {/* 🗂️ KANBAN ENGINE */}
            <div className="max-w-[1900px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-220px)] animate-in fade-in duration-1000">
                {STATUS_COLUMNS.map(column => (
                    <div key={column.id} className={cn("flex flex-col h-full rounded-[3.5rem] border overflow-hidden", column.bg, column.accent)}>
                        <div className="p-8 pb-4 flex items-center justify-between">
                            <h2 className={cn("text-[10px] font-black uppercase tracking-[0.4em] italic", column.color)}>
                                {column.label}
                            </h2>
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-400">
                                {filteredOrders.filter(o => o.status === column.id).length}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            {filteredOrders
                                .filter(o => o.status === column.id)
                                .map(order => {
                                    const minutes = getElapsed(order.created_at)
                                    // Filtrar items por estación si no es 'TODAS'
                                    const itemsToDisplay = order.order_items.filter(item =>
                                        activeStationId === 'TODAS' || item.products?.station_id === activeStationId
                                    )

                                    if (itemsToDisplay.length === 0) return null

                                    return (
                                        <div key={order.id} className="group bg-white rounded-[2.5rem] border border-slate-200 p-8 space-y-6 hover:border-primary/30 transition-all relative overflow-hidden shadow-sm">

                                            {/* Priority Marker */}
                                            {minutes > 15 && (
                                                <div className="absolute top-0 right-0 p-8 opacity-5 text-rose-500 scale-150 rotate-12">
                                                    <AlertTriangle className="w-20 h-20" />
                                                </div>
                                            )}

                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 leading-none underline decoration-primary/30">
                                                        {order.tables?.table_name || 'DELIVERY / PICKUP'}
                                                    </h3>
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-2 font-mono">
                                                        TOKEN: #{order.id.split('-')[0].toUpperCase()}
                                                    </p>
                                                    {/* Información del Cliente (si no es mesa) */}
                                                    {!order.tables && order.guest_info && (
                                                        <div className="mt-2 text-xs font-bold text-slate-600">
                                                            👤 {(order.guest_info as any).name} <br />
                                                            📞 {(order.guest_info as any).phone}
                                                        </div>
                                                    )}
                                                    {/* NOTAS GENERALES DEL PEDIDO */}
                                                    {order.notes && (
                                                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                                                            <p className="text-[10px] font-black text-red-600 uppercase italic leading-tight flex items-start gap-1">
                                                                📝 {order.notes}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className={cn(
                                                    "flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black italic border uppercase shrink-0",
                                                    minutes > 15 ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : "bg-slate-50 text-slate-400 border-slate-200"
                                                )}>
                                                    <Timer className="w-3 h-3" /> {minutes} MIN
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                {itemsToDisplay.map((item, idx) => {
                                                    return (
                                                        <div key={idx} className="flex gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-lg font-black text-primary italic shrink-0">
                                                                {item.quantity}
                                                            </div>
                                                            <div className="space-y-2 flex-1 pt-1">
                                                                <p className="text-sm font-black uppercase italic tracking-tight text-slate-900 group-hover:text-primary transition-colors">{item.products?.name}</p>

                                                                {/* NOTAS DEL PRODUCTO ESPECÍFICO */}
                                                                {(item.customizations?.notes || (item.customizations as any)?.name) && (
                                                                    <div className="space-y-1">
                                                                        {(item.customizations as any)?.name && (item.customizations as any).name !== item.products?.name && (
                                                                            <p className="text-[10px] text-slate-500 italic">{(item.customizations as any).name}</p>
                                                                        )}
                                                                        {item.customizations?.notes && (
                                                                            <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg inline-block">
                                                                                <p className="text-[9px] font-black text-amber-600 uppercase italic leading-tight">
                                                                                    ⚠️ {item.customizations.notes}
                                                                                </p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>

                                            <div className="pt-4 flex gap-2">
                                                {order.status === 'pending' ? (
                                                    <Button onClick={() => updateStatus(order.id, 'preparing')} className="flex-1 h-14 bg-white text-black rounded-2xl font-black uppercase text-[9px] tracking-widest italic hover:bg-primary transition-all shadow-xl">
                                                        MARCHAR <ChevronRight className="w-3 h-3 ml-1" />
                                                    </Button>
                                                ) : order.status === 'preparing' ? (
                                                    <Button onClick={() => updateStatus(order.id, 'ready')} className="flex-1 h-14 bg-primary text-black rounded-2xl font-black uppercase text-[9px] tracking-widest italic hover:bg-white transition-all shadow-xl shadow-primary/20">
                                                        TERMINAR <Check className="w-3.5 h-3.5 ml-1" />
                                                    </Button>
                                                ) : (
                                                    <Button onClick={() => updateStatus(order.id, 'delivered')} className="flex-1 h-14 bg-emerald-500 text-white rounded-2xl font-black uppercase text-[9px] tracking-widest italic hover:bg-white hover:text-black transition-all">
                                                        ENTREGADO <Check className="w-3.5 h-3.5 ml-1" />
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

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
            `}</style>
        </div>
    )
}
