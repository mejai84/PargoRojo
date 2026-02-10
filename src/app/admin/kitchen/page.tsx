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
    CheckCircle,
    Play,
    Pause,
    SkipForward,
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
    } | null
}

type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

type Order = {
    id: string
    created_at: string
    status: OrderStatus
    order_items: OrderItem[]
    tables?: {
        table_name: string
    }
    notes?: string
}

const STATUS_COLUMNS = [
    { id: 'pending' as const, label: 'COLA DE ENTRADA', color: 'text-slate-200' },
    { id: 'preparing' as const, label: 'EN FOGÓN ACTIVO', color: 'text-slate-200' },
    { id: 'ready' as const, label: 'LISTO / PICKUP', color: 'text-slate-200' }
];

export default function KitchenPage() {
    const { restaurant } = useRestaurant()
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [activeStationId, setActiveStationId] = useState<string>("TODAS")
    const [currentTime, setCurrentTime] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        if (restaurant) fetchData()

        const channel = supabase
            .channel('kitchen-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
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
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *, 
                    tables (table_name), 
                    order_items (
                        quantity, 
                        products (id, name, station_id, preparation_time)
                    )
                `)
                .eq('restaurant_id', restaurant?.id)
                .in('status', ['pending', 'preparing', 'ready'])
                .order('created_at', { ascending: true })

            if (!error) setOrders(data || [])
        } finally {
            setLoading(false)
        }
    }

    const updateStatus = async (id: string, newStatus: OrderStatus) => {
        const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', id)
        if (!error) {
            fetchData()
            toast.success(`PEDIDO ACTUALIZADO`)
        }
    }

    const getElapsed = (dateString: string) => {
        const start = new Date(dateString).getTime()
        const diff = Math.floor((new Date().getTime() - start) / 60000)
        return diff
    }

    const getTimeColor = (minutes: number) => {
        if (minutes < 5) return 'text-emerald-400'
        if (minutes < 12) return 'text-yellow-400'
        return 'text-red-500'
    }

    const preparingCount = orders.filter(o => o.status === 'preparing').length

    return (
        <div className="min-h-screen bg-black text-white font-sans relative overflow-hidden">

            {/* 🖼️ CAPA 1: FONDO DE COCINA REAL CON BLUR */}
            <div className="fixed inset-0 bg-[url('https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center scale-110 pointer-events-none" />

            {/* 🌫️ CAPA 2: DESENFOQUE Y OSCURECIMIENTO */}
            <div className="fixed inset-0 backdrop-blur-[40px] bg-slate-950/80 pointer-events-none" />

            {/* 🎇 CAPA 3: GRADIENTE DE CHISPAS / BOKEH */}
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,120,40,0.15)_0%,transparent_50%),radial-gradient(circle_at_80%_70%,rgba(255,80,0,0.1)_0%,transparent_50%)] pointer-events-none" />

            <div className="relative z-10 p-6 space-y-6 h-screen flex flex-col">

                {/* HEADER (Estilo Mockup) */}
                <div className="flex items-center justify-between shrink-0 mb-2">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-4">
                            <h1 className="text-5xl font-black tracking-tight text-white italic">KDS PRO</h1>
                            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">REALTIME_SYNC_ACTIVE</span>
                            </div>
                        </div>

                        {/* Filtros de Estación */}
                        <div className="flex items-center gap-2 bg-slate-800/40 backdrop-blur-md p-1.5 rounded-2xl border border-white/5">
                            {['TODAS', 'PARRILLA', 'FRÍOS', 'POSTRES'].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setActiveStationId(s)}
                                    className={cn(
                                        "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                                        activeStationId === s ? "bg-slate-700 text-white shadow-xl" : "text-slate-500 hover:text-slate-300"
                                    )}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="px-6 py-3 bg-slate-800/50 backdrop-blur-md border border-white/5 rounded-2xl">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">EN FOGÓN:</span>
                            <span className="text-xl font-black text-orange-500">{preparingCount}</span>
                        </div>
                        <Link href="/admin">
                            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-slate-800/40 border border-white/5">
                                <ArrowLeft className="w-5 h-5 text-slate-400" />
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* COLUMNAS (Estilo Mockup) */}
                <div className="grid grid-cols-3 gap-6 flex-1 min-h-0">
                    {STATUS_COLUMNS.map(column => (
                        <div key={column.id} className="flex flex-col min-h-0 bg-slate-400/5 rounded-[2.5rem] border border-white/5 overflow-hidden">
                            <div className="p-6 shrink-0 flex items-center justify-between bg-white/[0.02]">
                                <h2 className="text-lg font-black italic text-slate-100 tracking-tight">{column.label}</h2>
                                <div className="w-8 h-8 rounded-xl bg-slate-800/50 flex items-center justify-center font-black text-sm text-slate-400">
                                    {orders.filter(o => o.status === column.id).length}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                {orders.filter(o => o.status === column.id).map((order) => {
                                    const mins = getElapsed(order.created_at)
                                    return (
                                        <div key={order.id} className="bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 space-y-4 shadow-2xl relative group overflow-hidden">
                                            {/* Glow effect on hover */}
                                            <div className="absolute inset-0 bg-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                            <div className="flex items-start justify-between relative z-10">
                                                <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter">
                                                    {order.tables?.table_name || 'DOMICILIO'}
                                                </h3>
                                                <div className={cn("text-xs font-mono font-bold tracking-widest", getTimeColor(mins))}>
                                                    00:{mins < 10 ? '0' + mins : mins}:00
                                                </div>
                                            </div>

                                            {/* Items con barra de estado */}
                                            <div className="space-y-3 relative z-10">
                                                <div className="h-1 w-full bg-slate-700/50 rounded-full overflow-hidden">
                                                    <div className={cn(
                                                        "h-full transition-all duration-1000",
                                                        mins < 5 ? "bg-emerald-500 w-1/3" : mins < 12 ? "bg-orange-500 w-2/3" : "bg-red-500 w-full"
                                                    )} />
                                                </div>
                                                <div className="space-y-2">
                                                    {order.order_items.map((item, idx) => (
                                                        <div key={idx} className="flex items-center gap-3 text-sm">
                                                            <span className="font-bold text-orange-500">{item.quantity}x</span>
                                                            <span className="font-medium text-slate-200">{item.products?.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Botones (Estilo Mockup) */}
                                            <div className="flex gap-2 relative z-10 pt-2">
                                                {order.status === 'pending' && (
                                                    <>
                                                        <div className="flex gap-1.5 mr-auto">
                                                            {[Pause, RefreshCw, Play].map((Icon, i) => (
                                                                <button key={i} className="p-2.5 rounded-xl bg-slate-700/50 border border-white/5 hover:bg-slate-600 transition-colors">
                                                                    <Icon className="w-4 h-4 text-slate-300" />
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <Button
                                                            onClick={() => updateStatus(order.id, 'preparing')}
                                                            className="h-12 px-6 bg-orange-500 hover:bg-orange-600 text-black font-black uppercase text-[10px] italic tracking-widest rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.3)]"
                                                        >
                                                            EMPEZAR
                                                        </Button>
                                                    </>
                                                )}
                                                {order.status === 'preparing' && (
                                                    <Button
                                                        onClick={() => updateStatus(order.id, 'ready')}
                                                        className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-black font-black uppercase text-[10px] italic tracking-widest rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.3)]"
                                                    >
                                                        COMPLETAR
                                                    </Button>
                                                )}
                                                {order.status === 'ready' && (
                                                    <Button
                                                        onClick={() => updateStatus(order.id, 'delivered')}
                                                        className="w-full h-12 bg-orange-500/20 hover:bg-orange-500/30 text-orange-500 border border-orange-500/30 font-black uppercase text-[10px] italic tracking-widest rounded-xl"
                                                    >
                                                        RETIRADO
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
