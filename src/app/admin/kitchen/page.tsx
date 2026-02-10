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
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center scale-110 pointer-events-none" />

            {/* 🌫️ CAPA 2: DESENFOQUE Y OSCURECIMIENTO */}
            <div className="absolute inset-0 backdrop-blur-[40px] bg-slate-950/80 pointer-events-none" />

            {/* 🎇 CAPA 3: GRADIENTE DE CHISPAS / BOKEH */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,120,40,0.15)_0%,transparent_50%),radial-gradient(circle_at_80%_70%,rgba(255,80,0,0.1)_0%,transparent_50%)] pointer-events-none" />

            <div className="relative z-10 p-8 md:p-12 space-y-6 flex flex-col min-h-full">

                {/* HEADER (Estilo Mockup) */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between shrink-0 gap-8 mb-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-8">
                        <div className="space-y-1">
                            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white italic leading-none">KDS <span className="text-orange-500">PRO</span></h1>
                            <div className="flex items-center gap-2.5">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                <span className="text-[8px] md:text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] md:tracking-[0.4em] italic leading-none">Realtime Sync Active</span>
                            </div>
                        </div>

                        {/* Filtros de Estación */}
                        <div className="flex items-center gap-2 bg-white/5 backdrop-blur-3xl p-1.5 md:p-2 rounded-[1.5rem] md:rounded-[2rem] border border-white/5 shadow-2xl overflow-x-auto no-scrollbar max-w-full">
                            {['TODAS', 'PARRILLA', 'FRÍOS', 'POSTRES'].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setActiveStationId(s)}
                                    className={cn(
                                        "px-4 md:px-6 py-2 md:py-3 rounded-[1.2rem] md:rounded-[1.5rem] text-[8px] md:text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] transition-all italic whitespace-nowrap",
                                        activeStationId === s ? "bg-orange-600 text-black shadow-3xl shadow-orange-500/20" : "text-slate-500 hover:text-white"
                                    )}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 md:gap-4 self-end lg:self-center">
                        <div className="px-5 md:px-8 py-3 md:py-4 bg-white/5 backdrop-blur-3xl border border-white/5 rounded-[1.5rem] md:rounded-[2rem] flex items-center gap-3 md:gap-5 shadow-inner">
                            <div className="text-right">
                                <p className="text-[7px] md:text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] md:tracking-[0.4em] italic mb-0.5 md:mb-1 leading-none">Payload</p>
                                <p className="text-lg md:text-2xl font-black italic tracking-tighter text-white leading-none">{preparingCount} ORD</p>
                            </div>
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-600/10 rounded-xl md:rounded-2xl flex items-center justify-center text-orange-500">
                                <Flame className="w-5 h-5 md:w-6 md:h-6 animate-pulse" />
                            </div>
                        </div>
                        <Link href="/admin">
                            <Button variant="ghost" size="icon" className="h-12 w-12 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-white/5 border border-white/5 hover:bg-rose-500/20 hover:text-rose-500 transition-all active:scale-90">
                                <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* COLUMNAS (Estilo Mockup) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 flex-1 min-h-0 bg-transparent">
                    {STATUS_COLUMNS.map(column => (
                        <div key={column.id} className="flex flex-col min-h-0 bg-slate-950/40 backdrop-blur-3xl rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
                            <div className="px-8 py-7 shrink-0 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
                                <div className="space-y-1">
                                    <h2 className="text-xl font-black italic text-white tracking-tighter uppercase leading-none">{column.label}</h2>
                                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.4em] italic leading-none">Queue Protocol</p>
                                </div>
                                <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center font-black text-sm text-orange-500 shadow-xl">
                                    {orders.filter(o => o.status === column.id).length}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                {orders.filter(o => o.status === column.id).map((order) => {
                                    const mins = getElapsed(order.created_at)
                                    return (
                                        <div key={order.id} className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 space-y-6 shadow-3xl relative group overflow-hidden transition-all duration-500 hover:border-orange-500/30">
                                            {/* Glow effect on hover */}
                                            <div className="absolute inset-0 bg-orange-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                            <div className="flex items-start justify-between relative z-10 gap-2">
                                                <div className="space-y-1">
                                                    <p className="text-[7px] md:text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] md:tracking-[0.4em] italic leading-none">Identifier</p>
                                                    <h3 className="text-xl md:text-3xl font-black italic text-white uppercase tracking-tighter leading-none">
                                                        {order.tables?.table_name || 'HUB_PICKUP'}
                                                    </h3>
                                                </div>
                                                <div className={cn("text-[9px] md:text-[11px] font-black tracking-[0.1em] md:tracking-[0.2em] italic bg-black/40 px-2 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl border border-white/5 shrink-0", getTimeColor(mins))}>
                                                    {mins < 10 ? '0' + mins : mins}:00 MIN
                                                </div>
                                            </div>

                                            {/* Items con barra de estado */}
                                            <div className="space-y-4 relative z-10">
                                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden shadow-inner">
                                                    <div className={cn(
                                                        "h-full transition-all duration-1000",
                                                        mins < 5 ? "bg-emerald-500 w-1/3 shadow-[0_0_10px_rgba(16,185,129,0.3)]" :
                                                            mins < 12 ? "bg-orange-500 w-2/3 shadow-[0_0_10px_rgba(249,115,22,0.3)]" :
                                                                "bg-rose-500 w-full shadow-[0_0_10px_rgba(244,63,94,0.3)]"
                                                    )} />
                                                </div>
                                                <div className="space-y-3">
                                                    {order.order_items.map((item, idx) => (
                                                        <div key={idx} className="flex items-center gap-3 md:gap-4 text-sm md:text-base">
                                                            <span className="font-black text-orange-500 italic min-w-[24px] md:min-w-[30px]">{item.quantity}X</span>
                                                            <span className="font-bold text-slate-200 uppercase tracking-tight italic">{item.products?.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Botones (Estilo Mockup) */}
                                            <div className="flex gap-3 relative z-10 pt-4 border-t border-white/5">
                                                {order.status === 'pending' && (
                                                    <>
                                                        <div className="flex gap-2 mr-auto">
                                                            <button
                                                                onClick={() => toast.info("PRODUCCIÓN PAUSADA EN ESTACIÓN")}
                                                                className="h-10 w-10 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all flex items-center justify-center"
                                                            >
                                                                <Pause className="w-4 h-4 md:w-5 md:h-5 text-slate-300" />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    fetchData()
                                                                    toast.success("DATOS SINCRONIZADOS")
                                                                }}
                                                                className="h-10 w-10 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all flex items-center justify-center"
                                                            >
                                                                <RefreshCw className="w-4 h-4 md:w-5 md:h-5 text-slate-300" />
                                                            </button>
                                                        </div>
                                                        <Button
                                                            onClick={() => updateStatus(order.id, 'preparing')}
                                                            className="h-10 md:h-14 px-4 md:px-8 bg-orange-600 hover:bg-orange-500 text-black font-black uppercase text-[10px] md:text-[11px] italic tracking-widest rounded-xl md:rounded-2xl shadow-3xl shadow-orange-500/20 active:scale-95 transition-all"
                                                        >
                                                            EMPEZAR
                                                        </Button>
                                                    </>
                                                )}
                                                {order.status === 'preparing' && (
                                                    <Button
                                                        onClick={() => updateStatus(order.id, 'ready')}
                                                        className="w-full h-15 bg-orange-600 hover:bg-orange-500 text-black font-black uppercase text-[12px] italic tracking-[0.2em] rounded-2xl shadow-3xl shadow-orange-500/20 active:scale-95 transition-all"
                                                    >
                                                        ORDEN COMPLETADA
                                                    </Button>
                                                )}
                                                {order.status === 'ready' && (
                                                    <Button
                                                        onClick={() => updateStatus(order.id, 'delivered')}
                                                        className="w-full h-15 bg-white/5 hover:bg-white/10 text-orange-500 border border-orange-500/30 font-black uppercase text-[12px] italic tracking-[0.2em] rounded-2xl shadow-3xl active:scale-90 transition-all"
                                                    >
                                                        RETIRADO POR GESTIÓN
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
