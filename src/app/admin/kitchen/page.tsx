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
    order_items: OrderItem[]
    guest_info?: any
    tables?: {
        table_name: string
    }
    preparation_started_at?: string
    preparation_finished_at?: string
}

const STATIONS = ["TODAS", "ENTRADAS", "PLATOS FUERTES", "MARISCOS", "BEBIDAS", "POSTRES"];
const STATUS_COLUMNS = [
    { id: 'pending' as const, label: 'RECIBIDAS', color: 'text-blue-400', bg: 'bg-[#0a0a0a]/50', accent: 'border-blue-500/20' },
    { id: 'preparing' as const, label: 'EN FOGÓN', color: 'text-primary', bg: 'bg-[#0a0a0a]/50', accent: 'border-primary/20' },
    { id: 'ready' as const, label: 'LISTAS', color: 'text-emerald-400', bg: 'bg-[#0a0a0a]/50', accent: 'border-emerald-500/20' }
];

export default function KitchenPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [activeStation, setActiveStation] = useState("TODAS")
    const [currentTime, setCurrentTime] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        fetchOrders()

        const channel = supabase
            .channel('kitchen-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    new Audio('/sounds/new-order.mp3').play().catch(() => { })
                }
                fetchOrders()
            })
            .subscribe()

        return () => {
            clearInterval(timer)
            supabase.removeChannel(channel)
        }
    }, [])

    const fetchOrders = async () => {
        const { data } = await supabase
            .from('orders')
            .select(`*, tables (table_name), order_items (quantity, customizations, products (id, name, is_available, categories (name)))`)
            .in('status', ['pending', 'preparing', 'ready'])
            .order('created_at', { ascending: true })
        if (data) setOrders(data as any)
        setLoading(false)
    }

    const updateStatus = async (id: string, newStatus: OrderStatus) => {
        const updateData: any = { status: newStatus }
        if (newStatus === 'preparing') updateData.preparation_started_at = new Date().toISOString()
        if (newStatus === 'ready') updateData.preparation_finished_at = new Date().toISOString()

        const { error } = await supabase.from('orders').update(updateData).eq('id', id)
        if (!error) fetchOrders()
    }

    const getElapsed = (dateString: string) => {
        const start = new Date(dateString).getTime()
        const diff = Math.floor((new Date().getTime() - start) / 60000)
        return diff
    }

    const preparingCount = orders.filter(o => o.status === 'preparing').length

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8 selection:bg-primary font-sans">

            {/* 🔝 PREMIUM KDS HEADER */}
            <div className="max-w-[1900px] mx-auto mb-10 flex flex-col xl:flex-row justify-between items-center gap-8 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="flex items-center gap-6">
                    <Link href="/admin">
                        <Button variant="ghost" size="icon" className="h-16 w-16 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white hover:text-black transition-all">
                            <ArrowLeft className="w-6 h-6" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none">CORE <span className="text-primary">KDS</span></h1>
                            <div className="px-4 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-full text-[9px] font-black text-rose-500 animate-pulse tracking-widest italic">
                                SENSOR ACTIVADO
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.3em] mt-3 italic flex items-center gap-2">
                            <Zap className="w-3 h-3" /> Monitor de flujo termodinámico de platos
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 p-3 bg-[#0a0a0a] rounded-[2.5rem] border border-white/5 shadow-3xl">
                    {STATIONS.map(station => (
                        <button
                            key={station}
                            onClick={() => setActiveStation(station)}
                            className={cn(
                                "px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all italic",
                                activeStation === station ? "bg-primary text-black" : "text-gray-500 hover:text-white"
                            )}
                        >
                            {station}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex gap-2">
                        <div className="px-6 py-3 bg-[#0a0a0a] rounded-2xl border border-primary/20 flex flex-col items-center">
                            <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">En Fuego</span>
                            <span className="text-xl font-black text-primary italic leading-none">{preparingCount}</span>
                        </div>
                        <div className="px-6 py-3 bg-[#0a0a0a] rounded-2xl border border-white/5 flex flex-col items-center border-dashed">
                            <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Tiempo Prom</span>
                            <span className="text-xl font-black text-white italic leading-none">12M</span>
                        </div>
                    </div>
                    <Button onClick={fetchOrders} className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 hover:bg-white hover:text-black transition-all">
                        <RefreshCw className={cn("w-6 h-6", loading && "animate-spin")} />
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
                            <div className="w-8 h-8 rounded-full bg-black border border-white/5 flex items-center justify-center text-[10px] font-black text-gray-600">
                                {orders.filter(o => o.status === column.id).length}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            {orders.filter(o => o.status === column.id).map(order => {
                                const minutes = getElapsed(order.created_at)
                                return (
                                    <div key={order.id} className="group bg-black rounded-[2.5rem] border border-white/5 p-8 space-y-6 hover:border-primary/30 transition-all relative overflow-hidden">

                                        {/* Priority Marker */}
                                        {minutes > 15 && (
                                            <div className="absolute top-0 right-0 p-8 opacity-5 text-rose-500 scale-150 rotate-12">
                                                <AlertTriangle className="w-20 h-20" />
                                            </div>
                                        )}

                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white leading-none underline decoration-primary/30">
                                                    {order.tables?.table_name || 'MOSTRADOR'}
                                                </h3>
                                                <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mt-2 font-mono">
                                                    TOKEN: #{order.id.split('-')[0].toUpperCase()}
                                                </p>
                                            </div>
                                            <div className={cn(
                                                "flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black italic border uppercase",
                                                minutes > 15 ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : "bg-white/5 text-gray-500 border-white/5"
                                            )}>
                                                <Timer className="w-3 h-3" /> {minutes} MIN
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {order.order_items.map((item, idx) => (
                                                <div key={idx} className="flex gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-[#0a0a0a] border border-white/5 flex items-center justify-center text-lg font-black text-primary italic shrink-0">
                                                        {item.quantity}
                                                    </div>
                                                    <div className="space-y-2 flex-1 pt-1">
                                                        <p className="text-sm font-black uppercase italic tracking-tight text-white group-hover:text-primary transition-colors">{item.products?.name}</p>
                                                        {item.customizations?.notes && (
                                                            <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl">
                                                                <p className="text-[9px] font-black text-primary uppercase italic leading-tight">
                                                                    {item.customizations.notes}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
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
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
            `}</style>
        </div>
    )
}
