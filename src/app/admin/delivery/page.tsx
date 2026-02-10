"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import {
    Bike,
    MapPin,
    Clock,
    CheckCircle2,
    Users,
    Search,
    RefreshCw,
    AlertCircle,
    ArrowRight,
    Filter,
    Phone,
    Loader2,
    Radar,
    Navigation,
    Shield,
    Flame,
    Smartphone,
    ArrowLeft,
    Timer,
    Package,
    Activity
} from "lucide-react"
import { cn, formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { toast } from "sonner"

// Tipos
type Order = {
    id: string
    created_at: string
    status: string
    total: number
    delivery_address: any
    guest_info: any
    payment_method: string
    payment_status: string
    items_count?: number
}

type Driver = {
    id: string
    full_name: string
    status: 'available' | 'busy' | 'offline'
    current_orders: number
    phone?: string
}

export default function DeliveryManagerPremium() {
    const [loading, setLoading] = useState(true)
    const [orders, setOrders] = useState<Order[]>([])
    const [drivers, setDrivers] = useState<Driver[]>([])
    const [assigningOrder, setAssigningOrder] = useState<string | null>(null)
    const [currentTime, setCurrentTime] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        fetchData()

        const channel = supabase.channel('delivery-ops-premium')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchData)
            .subscribe()

        return () => {
            clearInterval(timer)
            supabase.removeChannel(channel)
        }
    }, [])

    const fetchData = async () => {
        setLoading(true)
        const { data: rawOrders } = await supabase
            .from('orders')
            .select(`*, order_items(count)`)
            .eq('order_type', 'delivery')
            .in('status', ['preparing', 'ready'])
            .order('created_at', { ascending: true })

        setOrders(rawOrders?.map(o => ({ ...o, items_count: o.order_items?.[0]?.count || 0 })) || [])

        // Mock Drivers for visual premium
        const mockDrivers: Driver[] = [
            { id: '1', full_name: 'Carlos Rodríguez', status: 'available', current_orders: 0, phone: '3001234567' },
            { id: '2', full_name: 'Andrés López', status: 'busy', current_orders: 1, phone: '3007654321' },
            { id: '3', full_name: 'Juan Pérez', status: 'available', current_orders: 0, phone: '3109876543' },
        ]
        setDrivers(mockDrivers)
        setLoading(false)
    }

    const getElapsed = (dateString: string) => {
        const start = new Date(dateString).getTime()
        const diff = Math.floor((new Date().getTime() - start) / 60000)
        return diff
    }

    return (
        <div className="min-h-screen text-white font-sans relative overflow-hidden flex flex-col h-screen">

            {/* 🖼️ FONDO PREMIUM: Ciudad de Noche / Luces / Movimiento con Blur */}
            <div className="fixed inset-0 bg-[url('https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center scale-105 pointer-events-none" />
            <div className="fixed inset-0 backdrop-blur-[90px] bg-slate-950/90 pointer-events-none" />

            {/* HEADER DE DESPACHO */}
            <div className="relative z-20 p-8 flex items-center justify-between border-b border-white/5 bg-slate-950/40 backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-6">
                    <Link href="/admin">
                        <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10">
                            <ArrowLeft className="w-6 h-6 text-slate-400" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none">DELIVERY <span className="text-orange-500">RADAR</span></h1>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] mt-2 italic flex items-center gap-3">
                            FLEET MANAGEMENT & DISPATCH CENTER
                            <Radar className="w-3 h-3 text-orange-500 animate-spin" />
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <div className="text-right">
                        <p className="text-3xl font-black italic tracking-tighter font-mono">
                            {currentTime.toLocaleTimeString('es-CO')}
                        </p>
                        <p className="text-[9px] font-bold text-orange-500 uppercase tracking-widest text-right">ACTIVE OPS STATUS</p>
                    </div>
                </div>
            </div>

            <div className="relative z-10 p-8 flex-1 overflow-hidden grid grid-cols-12 gap-8 max-w-[1800px] mx-auto w-full">

                {/* LEFT: PENDING ORDERS (THE RADAR) */}
                <div className="col-span-8 flex flex-col space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-black uppercase tracking-[0.4em] text-slate-500 italic flex items-center gap-3">
                            <Package className="w-4 h-4 text-orange-500" /> Órdenes en Cola de Despacho
                        </h2>
                        <span className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-black text-slate-400 border border-white/10 uppercase tracking-widest">
                            {orders.length} PENDIENTES
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-4">
                        {orders.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 opacity-30 italic text-center">
                                <Navigation className="w-20 h-20 mb-4 animate-pulse" />
                                <p className="text-sm font-black uppercase tracking-widest">Sin entregas por asignar</p>
                            </div>
                        ) : (
                            orders.map((order, i) => {
                                const elapsed = getElapsed(order.created_at)
                                return (
                                    <div key={order.id} className="group bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 flex items-center justify-between transition-all hover:border-orange-500/40 relative overflow-hidden">
                                        {/* Status Glow */}
                                        <div className={cn("absolute left-0 top-0 bottom-0 w-2", elapsed > 15 ? "bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]" : "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]")} />

                                        <div className="flex items-center gap-8">
                                            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-orange-500 shadow-inner">
                                                <Bike className="w-8 h-8" />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-3xl font-black italic tracking-tighter uppercase leading-none">#{order.id.substring(0, 4)}</h3>
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-l border-white/10 pl-3">
                                                        {order.guest_info?.name || 'Cliente Premium'}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-medium text-slate-400 leading-tight italic flex items-center gap-2">
                                                    <MapPin className="w-3 h-3 text-orange-500" /> {order.delivery_address?.address || 'Dirección no especificada'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-12">
                                            <div className="text-center">
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">TIEMPO TRANSC.</p>
                                                <div className={cn("flex items-center gap-2", elapsed > 15 ? "text-red-500" : "text-white")}>
                                                    <Timer className="w-5 h-5" />
                                                    <span className="text-2xl font-black italic tracking-tighter font-mono">{elapsed}m</span>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => setAssigningOrder(order.id)}
                                                className="h-16 px-10 bg-orange-600 hover:bg-orange-700 text-black font-black uppercase text-[10px] italic tracking-widest rounded-2xl shadow-xl shadow-orange-600/30 active:scale-95 transition-all"
                                            >
                                                ASIGNAR REPARTIDOR
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* RIGHT: DRIVER FLEET (THE FORCE) */}
                <div className="col-span-4 flex flex-col space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-black uppercase tracking-[0.4em] text-slate-500 italic flex items-center gap-3">
                            <Users className="w-4 h-4 text-orange-500" /> Flota de Repartidores
                        </h2>
                        <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
                            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">ACTIVE_READY</span>
                        </div>
                    </div>

                    <div className="flex-1 bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-8 flex flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                            {drivers.map((driver, i) => (
                                <div key={driver.id} className="group bg-white/5 border border-white/5 rounded-2xl p-6 transition-all hover:bg-white/10 hover:border-orange-500/20 cursor-pointer">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center relative">
                                                <Users className="w-5 h-5 text-slate-400" />
                                                <div className={cn("absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-900", driver.status === 'available' ? "bg-emerald-500" : "bg-orange-500")} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black italic uppercase tracking-tight text-white">{driver.full_name}</h4>
                                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{driver.status === 'available' ? 'LIBRE' : 'EN RUTA'}</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-500 hover:text-white rounded-xl">
                                            <Phone className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map(s => <div key={s} className="w-1 h-3 bg-orange-500/20 rounded-full" />)}
                                        </div>
                                        <span className="text-[10px] font-black italic text-slate-400 uppercase tracking-widest">Eficiencia: 98%</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 pt-8 border-t border-white/5">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">CAPACIDAD FLOTA</p>
                                    <p className="text-3xl font-black italic text-white tracking-tighter">75%</p>
                                </div>
                                <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-orange-500" style={{ width: '75%' }} />
                                </div>
                            </div>
                            <Button className="w-full h-14 bg-white/5 border border-white/10 text-slate-200 font-black uppercase text-[10px] italic tracking-widest rounded-2xl hover:bg-white/10">
                                GESTIONAR REPARTIDORES
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
