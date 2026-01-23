
"use client"

import { Button } from "@/components/ui/button"
import { Clock, Check, AlertTriangle, ArrowLeft, RefreshCw, Loader2, Flame, Bell, Eye, X } from "lucide-react"
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
    } | null
}


type Order = {
    id: string
    created_at: string
    status: string
    order_items: OrderItem[]
    guest_info?: any
    tables?: {
        table_name: string
    }
}

export default function KitchenPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

    const fetchOrders = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                tables (table_name),
                order_items (
                    quantity,
                    customizations,
                    products (
                        id,
                        name,
                        is_available
                    )

                )
            `)
            .in('status', ['pending', 'preparing'])
            .order('created_at', { ascending: true })

        if (error) {
            console.error(error)
        } else {
            setOrders(data as any || [])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchOrders()

        // Realtime subscription for instant orders
        const channel = supabase
            .channel('kitchen-orders')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'orders'
            }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    // Play notification sound
                    const audio = new Audio('/sounds/new-order.mp3')
                    audio.play().catch(e => console.log("Audio play blocked by browser"))
                }
                fetchOrders()
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'order_items'
            }, () => {
                fetchOrders()
            })
            .subscribe()

        // Auto-refresh timer for elapsed time
        const interval = setInterval(() => {
            setOrders(prev => [...prev]) // Trigger re-render for time calculation
        }, 10000)

        return () => {
            supabase.removeChannel(channel)
            clearInterval(interval)
        }
    }, [])

    const updateStatus = async (id: string, newStatus: string) => {
        // Validación de orden cronológico si se va a preparar
        if (newStatus === 'preparing') {
            const currentOrder = orders.find(o => o.id === id);
            if (currentOrder) {
                const olderPendingOrders = orders.filter(o =>
                    o.status === 'pending' &&
                    new Date(o.created_at).getTime() < new Date(currentOrder.created_at).getTime()
                );

                if (olderPendingOrders.length > 0) {
                    const confirmProceed = window.confirm(
                        `¡Atención! Hay ${olderPendingOrders.length} pedido(s) pendientes que se registraron ANTES que este.\n\n` +
                        `¿Está seguro de que desea saltarse el turno e iniciar este pedido primero?`
                    );
                    if (!confirmProceed) return;
                }
            }
        }

        // Optimistic update
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o).filter(o => newStatus !== 'ready' || o.id !== id))

        const updateData: any = { status: newStatus }
        if (newStatus === 'preparing') {
            updateData.preparation_started_at = new Date().toISOString()
        } else if (newStatus === 'ready') {
            updateData.preparation_finished_at = new Date().toISOString()
        }

        const { error } = await supabase.from('orders').update(updateData).eq('id', id)
        if (error) {
            console.error("Error updating status:", error)
            fetchOrders() // Revert on error
            return
        }

        if (selectedOrder && selectedOrder.id === id) {
            if (newStatus === 'ready') setSelectedOrder(null)
            else setSelectedOrder({ ...selectedOrder, status: newStatus })
        }
    }

    const getElapsed = (dateString: string) => {
        const start = new Date(dateString).getTime()
        const now = new Date().getTime()
        const diff = Math.floor((now - start) / 60000)
        return diff
    }

    const toggleProductAvailability = async (productId: string, currentStatus: boolean) => {
        const { error } = await supabase.from('products').update({ is_available: !currentStatus }).eq('id', productId)
        if (error) {
            alert("Error al actualizar disponibilidad: " + error.message)
        } else {
            fetchOrders()
        }
    }


    const getStatusStyles = (order: Order) => {
        const minutes = getElapsed(order.created_at)

        if (order.status === 'preparing') {
            return {
                border: 'border-orange-500',
                headerBg: 'bg-orange-500',
                bodyBg: 'bg-white',
                label: 'MARCHANDO',
                icon: Flame,
                textColor: 'text-orange-700'
            }
        }

        if (minutes > 20) {
            return {
                border: 'border-rose-600 ring-2 ring-rose-500/20',
                headerBg: 'bg-rose-600',
                bodyBg: 'bg-rose-50',
                label: '¡CRÍTICO!',
                icon: Bell,
                textColor: 'text-rose-700'
            }
        }

        if (minutes > 10) {
            return {
                border: 'border-amber-500',
                headerBg: 'bg-amber-500',
                bodyBg: 'bg-amber-50/30',
                label: 'DEMORADO',
                icon: AlertTriangle,
                textColor: 'text-amber-700'
            }
        }

        return {
            border: 'border-gray-200',
            headerBg: 'bg-[#1a1a1a]', // Dark mode headers for fresh orders
            bodyBg: 'bg-white',
            label: 'NUEVO',
            icon: Clock,
            textColor: 'text-gray-600'
        }
    }

    const preparingCount = orders.filter(o => o.status === 'preparing').length
    const pendingCount = orders.filter(o => o.status === 'pending').length

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-4 md:p-6">
            {/* Elegant Header */}
            <div className="max-w-[1600px] mx-auto mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin">
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-white shadow-sm border border-gray-100">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-gray-900">
                            COCINA <span className="text-primary">KDS</span>
                        </h1>
                        <p className="text-sm text-gray-500 font-medium">Gestión de pedidos en tiempo real</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex gap-2">
                        <div className="px-4 py-2 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                            <span className="text-xs font-bold text-gray-500 uppercase">Marchando: <span className="text-gray-900">{preparingCount}</span></span>
                        </div>
                        <div className="px-4 py-2 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-gray-400" />
                            <span className="text-xs font-bold text-gray-500 uppercase">En Cola: <span className="text-gray-900">{pendingCount}</span></span>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={fetchOrders}
                        className={cn("rounded-2xl border-gray-200 bg-white hover:bg-gray-50", loading && "animate-spin")}
                    >
                        <RefreshCw className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* Orders Masonry-like Grid */}
            <div className="max-w-[1600px] mx-auto">
                {orders.length === 0 && !loading ? (
                    <div className="flex flex-col items-center justify-center h-[50vh] bg-white rounded-[3rem] border border-gray-100 shadow-sm text-center p-12">
                        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6">
                            <Check className="w-12 h-12 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">¡Todo entregado!</h2>
                        <p className="text-gray-500 max-w-xs mt-2">No hay órdenes pendientes para preparar en este momento.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                        {orders.map((order) => {
                            const styles = getStatusStyles(order)
                            const Icon = styles.icon
                            const minutes = getElapsed(order.created_at)

                            return (
                                <div
                                    key={order.id}
                                    className={cn(
                                        "flex flex-col rounded-[2rem] bg-white border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden",
                                        styles.border,
                                        order.status === 'preparing' && "ring-4 ring-orange-500/10"
                                    )}
                                >
                                    {/* Order Header */}
                                    <div className={cn(
                                        "p-4 flex justify-between items-center text-white transition-colors duration-500",
                                        styles.headerBg,
                                        minutes > 15 && "animate-pulse"
                                    )}>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black tracking-widest uppercase opacity-80">{order.tables?.table_name || 'MOSTRADOR'}</span>
                                            <span className="text-2xl font-black italic">#{order.id.split('-')[0].toUpperCase()}</span>
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-black/20 backdrop-blur-md rounded-full text-[10px] font-black mb-1">
                                                <Icon className="w-3 h-3" />
                                                {styles.label}
                                            </div>
                                            <span className={cn(
                                                "text-xl font-black italic font-mono",
                                                minutes > 15 ? "text-yellow-300" : "text-white"
                                            )}>{minutes}m</span>
                                        </div>
                                    </div>

                                    {/* Alerta de Observaciones */}
                                    {order.order_items.some(i => i.customizations?.notes) && (
                                        <div className="bg-red-600 text-white px-4 py-1 flex items-center gap-2 animate-pulse">
                                            <AlertTriangle className="w-3 h-3" />
                                            <span className="text-[10px] font-black uppercase tracking-tighter">¡PEDIDO CON OBSERVACIONES!</span>
                                        </div>
                                    )}


                                    {/* Order Content */}
                                    <div className={cn("p-5 flex-1 space-y-3", styles.bodyBg)}>
                                        {order.order_items.map((item, idx) => (
                                            <div key={idx} className="flex gap-3">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm border shrink-0",
                                                    order.status === 'preparing' ? "bg-orange-50 border-orange-200 text-orange-700" : "bg-gray-50 border-gray-100 text-gray-600"
                                                )}>
                                                    {item.quantity}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <p className="font-bold text-gray-900 leading-tight">{item.products?.name}</p>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => toggleProductAvailability(item.products?.id || '', item.products?.is_available || false)}
                                                            className={cn(
                                                                "h-6 w-6 rounded-md",
                                                                item.products?.is_available ? "text-green-500 hover:text-red-500 hover:bg-red-50" : "text-red-500 bg-red-50 hover:bg-green-50 hover:text-green-500"
                                                            )}
                                                            title={item.products?.is_available ? "Marcar como AGOTADO" : "Marcar como DISPONIBLE"}
                                                        >
                                                            <div className={cn("w-2 h-2 rounded-full", item.products?.is_available ? "bg-current" : "bg-current animate-pulse")} />
                                                        </Button>
                                                    </div>
                                                    {item.customizations?.notes && (
                                                        <div className="mt-1 p-2 bg-primary/5 border border-primary/10 rounded-lg">
                                                            <p className="text-[11px] text-primary font-black uppercase leading-tight">
                                                                OBS: {item.customizations.notes}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {item.customizations && !item.customizations.notes && Object.keys(item.customizations).length > 0 && (
                                                        <p className="text-[10px] text-orange-600 font-bold uppercase mt-0.5">
                                                            {Object.entries(item.customizations).map(([k, v]) => `${k}: ${v}`).join(', ')}
                                                        </p>
                                                    )}
                                                </div>

                                            </div>
                                        ))}
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="p-3 bg-gray-50/50 border-t border-gray-100 flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setSelectedOrder(order)}
                                            className="h-12 w-12 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 shrink-0"
                                        >
                                            <Eye className="w-5 h-5 text-gray-500" />
                                        </Button>

                                        {order.status === 'pending' ? (
                                            <Button
                                                onClick={() => updateStatus(order.id, 'preparing')}
                                                className="flex-1 h-12 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl gap-2 active:scale-95 transition-all"
                                            >
                                                <Flame className="w-4 h-4 text-orange-400" />
                                                MARCHAR
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={() => updateStatus(order.id, 'ready')}
                                                className="flex-1 h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl gap-2 active:scale-95 transition-all shadow-md shadow-primary/20"
                                            >
                                                <Check className="w-4 h-4" />
                                                LISTO
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Order Detail Backdrop Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className={cn("p-8 flex justify-between items-start text-white", getStatusStyles(selectedOrder).headerBg)}>
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="px-3 py-1 bg-black/20 rounded-full text-[10px] font-black uppercase tracking-widest">Detalle de Comanda</span>
                                    <span className="text-xs font-mono font-bold opacity-70">ID: {selectedOrder.id.split('-')[0].toUpperCase()}</span>
                                </div>
                                <h2 className="text-5xl font-black tracking-tighter">
                                    {selectedOrder.tables?.table_name || 'MOSTRADOR'}
                                </h2>
                                <div className="mt-4 flex items-center gap-4 text-lg font-bold">
                                    <div className="flex items-center gap-2 bg-black/10 px-4 py-1.5 rounded-full">
                                        <Clock className="w-5 h-5" />
                                        <span>Hace {getElapsed(selectedOrder.created_at)} min</span>
                                    </div>
                                    <span className="uppercase tracking-widest text-xs opacity-80">{selectedOrder.status === 'preparing' ? 'EN PREPARACIÓN' : 'EN ESPERA'}</span>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-12 w-12 rounded-full bg-black/10 hover:bg-black/20 text-white"
                                onClick={() => setSelectedOrder(null)}
                            >
                                <X className="w-6 h-6" />
                            </Button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8 max-h-[60vh] overflow-y-auto">
                            <h3 className="text-xs font-black text-gray-400 tracking-[0.2em] mb-6 uppercase">Lista de Productos</h3>
                            <div className="space-y-4">
                                {selectedOrder.order_items.map((item, i) => (
                                    <div key={i} className="flex items-start gap-6 p-6 bg-gray-50 rounded-3xl border border-gray-100">
                                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-3xl font-black text-gray-900 shadow-sm border border-gray-100 shrink-0">
                                            {item.quantity}
                                        </div>
                                        <div className="flex-1 py-1">
                                            <div className="flex justify-between items-start">
                                                <p className="text-2xl font-bold text-gray-900 leading-tight mb-2">{item.products?.name}</p>
                                                <Button
                                                    onClick={() => toggleProductAvailability(item.products?.id || '', item.products?.is_available || false)}
                                                    className={cn(
                                                        "rounded-xl h-10 px-4 font-bold text-xs uppercase transition-all shadow-sm shrink-0",
                                                        item.products?.is_available ? "bg-white border border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200" : "bg-red-500 text-white hover:bg-green-500"
                                                    )}
                                                >
                                                    {item.products?.is_available ? "PRODUCTO EN STOCK" : "PRODUCTO AGOTADO"}
                                                </Button>
                                            </div>
                                            {item.customizations?.notes && (
                                                <div className="p-4 bg-primary/5 rounded-2xl border-2 border-primary/10 mb-2">
                                                    <h4 className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Observaciones del Cliente</h4>
                                                    <p className="text-lg font-black text-primary leading-tight uppercase italic">{item.customizations.notes}</p>
                                                </div>
                                            )}
                                            {item.customizations && !item.customizations.notes && Object.keys(item.customizations).length > 0 && (
                                                <div className="p-3 bg-orange-50 rounded-xl border border-orange-100">
                                                    <p className="text-sm font-bold text-orange-700 uppercase">
                                                        {Object.entries(item.customizations).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-4">
                            <Button
                                variant="outline"
                                className="h-16 flex-1 rounded-2xl border-gray-200 font-bold text-lg"
                                onClick={() => setSelectedOrder(null)}
                            >
                                CERRAR
                            </Button>

                            {selectedOrder.status === 'pending' ? (
                                <Button
                                    onClick={() => updateStatus(selectedOrder.id, 'preparing')}
                                    className="h-16 flex-[2] bg-gray-900 hover:bg-gray-800 text-white font-black text-xl rounded-2xl shadow-lg active:scale-95 transition-all gap-3"
                                >
                                    <Flame className="w-6 h-6 text-orange-400" />
                                    MARCHAR AHORA
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => updateStatus(selectedOrder.id, 'ready')}
                                    className="h-16 flex-[2] bg-primary hover:bg-primary/90 text-white font-black text-xl rounded-2xl shadow-xl shadow-primary/20 active:scale-95 transition-all gap-3"
                                >
                                    <Check className="w-6 h-6" />
                                    TERMINAR PEDIDO
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
