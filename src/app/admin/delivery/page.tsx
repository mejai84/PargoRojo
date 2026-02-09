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
    Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"

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

export default function DeliveryManager() {
    const [loading, setLoading] = useState(true)
    const [orders, setOrders] = useState<Order[]>([])
    const [drivers, setDrivers] = useState<Driver[]>([])
    const [assigningOrder, setAssigningOrder] = useState<string | null>(null)

    useEffect(() => {
        fetchData()

        // Suscripción Realtime
        const interval = setInterval(fetchData, 30000) // Polling de seguridad cada 30s
        const channel = supabase.channel('delivery-ops')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_tracking' }, fetchData)
            .subscribe()

        return () => {
            clearInterval(interval)
            supabase.removeChannel(channel)
        }
    }, [])

    const fetchData = async () => {
        const { data: rawOrders } = await supabase
            .from('orders')
            .select(`*, order_items(count)`)
            .eq('order_type', 'delivery')
            .in('status', ['preparing', 'ready'])
            .order('created_at', { ascending: true })

        const { data: activeDeliveries } = await supabase
            .from('delivery_tracking')
            .select('order_id')
            .not('driver_id', 'is', null)

        const assignedIds = new Set(activeDeliveries?.map(d => d.order_id))
        const pendingAssignment = rawOrders?.filter(o => !assignedIds.has(o.id)).map(o => ({
            ...o,
            items_count: o.order_items?.[0]?.count || 0
        })) || []

        setOrders(pendingAssignment)

        const { data: driverProfiles } = await supabase
            .from('profiles')
            .select('*')

        const validDrivers = driverProfiles?.filter((p: any) => p.role === 'driver' || p.email?.includes('driver')) || []

        const mappedDrivers = validDrivers.map((d: any) => ({
            id: d.id,
            full_name: d.full_name || 'Conductor',
            status: 'available',
            current_orders: 0,
            phone: d.phone
        }))

        setDrivers(mappedDrivers as any)
        setLoading(false)
    }

    const assignDriver = async (orderId: string, driverId: string) => {
        try {
            const { error } = await supabase
                .from('delivery_tracking')
                .upsert({
                    order_id: orderId,
                    driver_id: driverId,
                    status: 'assigned',
                    assigned_at: new Date().toISOString()
                }, { onConflict: 'order_id' })

            if (error) throw error

            setAssigningOrder(null)
            fetchData()

        } catch (e: any) {
            console.error(e)
            alert("Error al asignar: " + e.message)
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-muted/30">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
    )

    return (
        <div className="min-h-screen bg-muted/30 text-foreground p-6 md:p-10 font-sans">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                    <h1 className="text-4xl font-black uppercase italic tracking-tighter text-foreground">
                        Centro de <span className="text-primary">Despacho</span>
                    </h1>
                    <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest mt-1">
                        Gestión de Flota y Envíos
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="px-4 py-2 bg-card border border-border rounded-xl flex items-center gap-3 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sistema Activo</span>
                    </div>
                    <Button variant="outline" onClick={fetchData} className="h-10 w-10 p-0 rounded-xl bg-card hover:bg-muted transition-colors">
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-200px)]">

                {/* 1. PEDIDOS SIN ASIGNAR (LEFT) */}
                <div className="lg:col-span-8 flex flex-col gap-6 h-full">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-black uppercase italic tracking-tight flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-amber-500" />
                            Pendientes de Asignación <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full ml-2 not-italic font-bold">{orders.length}</span>
                        </h2>
                        <div className="flex gap-2">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    placeholder="Buscar pedido..."
                                    className="pl-9 pr-4 py-2 bg-card border border-border rounded-xl text-xs font-bold w-48 focus:outline-none focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                        {orders.length === 0 ? (
                            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-3xl">
                                <CheckCircle2 className="w-10 h-10 mb-2 opacity-50" />
                                <p className="text-sm font-bold uppercase tracking-widest">Todo despachado</p>
                            </div>
                        ) : (
                            orders.map(order => (
                                <div key={order.id} className={cn(
                                    "bg-card border rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all relative group overflow-hidden",
                                    assigningOrder === order.id ? "border-primary ring-2 ring-primary/20" : "border-border"
                                )}>
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="bg-muted text-muted-foreground px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-border">
                                                    #{order.id.split('-')[0]}
                                                </span>
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                                    hace {Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000)} min
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-black italic text-foreground uppercase">
                                                {order.guest_info?.name || "Cliente Web"}
                                            </h3>
                                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                                <MapPin className="w-4 h-4 text-rose-500" />
                                                <span className="truncate max-w-xs">{order.delivery_address?.street || order.delivery_address?.address || "Sin dirección"}</span>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-xl font-black text-foreground">{formatPrice(order.total)}</p>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                                                {order.payment_status === 'paid' ? 'Pagado' : 'Contraentrega'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* ACTIONS */}
                                    <div className="mt-6 pt-6 border-t border-border flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg">
                                                <Clock className="w-3.5 h-3.5" /> Preparando
                                            </div>
                                            <span className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">{order.items_count} Items</span>
                                        </div>

                                        {assigningOrder === order.id ? (
                                            <div className="flex items-center gap-2 animate-in slide-in-from-right-4">
                                                <span className="text-xs font-bold text-primary animate-pulse">Selecciona un conductor 👉</span>
                                                <Button variant="ghost" size="sm" onClick={() => setAssigningOrder(null)} className="h-9 px-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-muted">Cancelar</Button>
                                            </div>
                                        ) : (
                                            <Button
                                                onClick={() => setAssigningOrder(order.id)}
                                                className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all h-12 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20"
                                            >
                                                Asignar Motorizado
                                            </Button>
                                        )}
                                    </div>

                                    {assigningOrder === order.id && <div className="absolute inset-0 bg-primary/5 pointer-events-none" />}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 2. DRIVER LIST (RIGHT) */}
                <div className="lg:col-span-4 bg-card border border-border rounded-[3rem] p-8 shadow-sm flex flex-col h-full overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-black uppercase italic tracking-tight flex items-center gap-2">
                            <Bike className="w-5 h-5 text-primary" />
                            Flota Activa
                        </h2>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar -mr-4 pr-4">
                        {drivers.length === 0 ? (
                            <div className="text-center py-10 opacity-50">
                                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">No hay conductores</p>
                            </div>
                        ) : (
                            drivers.map(driver => (
                                <button
                                    key={driver.id}
                                    disabled={!assigningOrder}
                                    onClick={() => assigningOrder && assignDriver(assigningOrder, driver.id)}
                                    className={cn(
                                        "w-full text-left p-4 rounded-3xl border transition-all group relative overflow-hidden",
                                        assigningOrder
                                            ? "hover:border-primary hover:bg-primary hover:text-primary-foreground cursor-pointer hover:scale-105 shadow-md"
                                            : "border-border hover:border-border/80",
                                        driver.status === 'busy' ? "opacity-50 grayscale" : "bg-card"
                                    )}
                                >
                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center font-bold text-muted-foreground group-hover:bg-white/20 group-hover:text-inherit transition-colors">
                                            {driver.full_name.charAt(0)}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-black italic text-foreground group-hover:text-inherit">{driver.full_name}</h4>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className={cn(
                                                    "w-2 h-2 rounded-full",
                                                    driver.status === 'available' ? "bg-emerald-500" : "bg-amber-500"
                                                )} />
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-inherit/60">
                                                    {driver.status === 'available' ? 'Disponible' : 'Ocupado'}
                                                </span>
                                            </div>
                                        </div>
                                        {assigningOrder && (
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-background text-foreground px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest whitespace-nowrap border border-border">
                                                Asignar
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>

                    {/* Quick Stats Footer */}
                    <div className="mt-6 pt-6 border-t border-border grid grid-cols-2 gap-4">
                        <div className="bg-muted/50 rounded-2xl p-4 text-center border border-border">
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">En Reparto</p>
                            <p className="text-2xl font-black text-foreground italic">0</p>
                        </div>
                        <div className="bg-emerald-500/10 rounded-2xl p-4 text-center border border-emerald-500/20">
                            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 mb-1">Disponibles</p>
                            <p className="text-2xl font-black text-emerald-700 italic">{drivers.filter(d => d.status === 'available').length}</p>
                        </div>
                    </div>
                </div>

            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: var(--border); border-radius: 4px; }
            `}</style>
        </div>
    )
}
