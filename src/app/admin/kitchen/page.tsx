
"use client"

import { Button } from "@/components/ui/button"
import { Clock, Check, AlertTriangle, ArrowLeft, RefreshCw, Loader2, Flame, Bell, Eye, X, ZoomIn } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"

type OrderItem = {
    quantity: number
    customizations: any
    products: {
        name: string
    } | null
}

type Order = {
    id: string
    created_at: string
    status: string
    order_items: OrderItem[]
    guest_info?: any
}

export default function KitchenPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null) // Para el popup

    const fetchOrders = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                order_items (
                    quantity,
                    customizations,
                    products (
                        name
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
        const interval = setInterval(fetchOrders, 10000)
        return () => clearInterval(interval)
    }, [])

    const updateStatus = async (id: string, newStatus: string) => {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o).filter(o => newStatus !== 'ready' || o.id !== id))

        await supabase.from('orders').update({ status: newStatus }).eq('id', id)

        if (selectedOrder && selectedOrder.id === id) {
            setSelectedOrder(null) // Cerrar modal si se completa desde ahí
        }

        if (newStatus !== 'ready') fetchOrders()
    }

    const getElapsed = (dateString: string) => {
        const start = new Date(dateString).getTime()
        const now = new Date().getTime()
        const diff = Math.floor((now - start) / 60000)
        return `${diff} min`
    }

    const getStatusInfo = (order: Order) => {
        const minutes = parseInt(getElapsed(order.created_at))

        if (order.status === 'preparing') {
            // Estado EN PLANCHA: Muy visible, fondo amarillo oscuro
            return {
                color: 'border-yellow-500',
                bgHeader: 'bg-yellow-600 text-black',
                bgBody: 'bg-yellow-950/30',
                label: 'EN PLANCHA 🔥',
                icon: Flame
            }
        }

        if (minutes > 20) return { color: 'border-red-600', bgHeader: 'bg-red-600', bgBody: 'bg-gray-900', label: 'DEMORADO ⚠️', icon: AlertTriangle }

        // Estado NORMAL EN COLA
        return { color: 'border-slate-600', bgHeader: 'bg-slate-700', bgBody: 'bg-gray-900', label: 'EN COLA', icon: Bell }
    }

    const preparing = orders.filter(o => o.status === 'preparing')
    const pending = orders.filter(o => o.status === 'pending')

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-6 font-sans">
            {/* Header KDS */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <Link href="/admin/orders">
                        <Button variant="outline" size="icon" className="border-white/20 hover:bg-white/10 text-white">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold font-mono tracking-tight flex items-center gap-2">
                        COCINA <span className="text-primary">KDS</span>
                    </h1>
                    <Button variant="ghost" size="icon" onClick={fetchOrders} className={`text-white hover:bg-white/10 ${loading ? "animate-spin" : ""}`}>
                        <RefreshCw className="w-5 h-5" />
                    </Button>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                    <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 text-yellow-500 rounded-lg border border-yellow-500/30 animate-pulse">
                        <Flame className="w-5 h-5" />
                        <span className="font-bold text-xl">{preparing.length}</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 text-slate-300 rounded-lg border border-slate-600">
                        <Bell className="w-5 h-5" />
                        <span className="font-bold text-xl">{pending.length}</span>
                    </div>
                </div>
            </div>

            {/* Grid */}
            {loading && orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground gap-4">
                    <Loader2 className="w-12 h-12 animate-spin" />
                    <p>Cargando comandas...</p>
                </div>
            ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500 gap-4 border-2 border-dashed border-gray-800 rounded-3xl bg-gray-900/20">
                    <Check className="w-24 h-24 opacity-20" />
                    <p className="text-3xl font-mono font-bold">TODO LIMPIO</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {[...preparing, ...pending].map((order) => {
                        const style = getStatusInfo(order)
                        const StatusIcon = style.icon

                        return (
                            <div
                                key={order.id}
                                className={`flex flex-col rounded-xl overflow-hidden border-2 shadow-lg transition-all duration-300 h-full ${style.color} ${style.bgBody} ${order.status === 'preparing' ? 'scale-[1.02] ring-4 ring-yellow-500/20' : 'opacity-90'}`}
                            >
                                {/* Ticket Header */}
                                <div className={`p-3 flex justify-between items-start ${style.bgHeader} text-white`}>
                                    <div>
                                        <div className="flex items-center gap-2 font-bold opacity-90 text-xs mb-1">
                                            <StatusIcon className="w-4 h-4" /> {style.label}
                                        </div>
                                        <span className="text-2xl font-black tracking-widest">#{order.id.split('-')[0].toUpperCase()}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className="font-mono font-bold text-xl bg-black/30 px-2 py-1 rounded">
                                            {getElapsed(order.created_at)}
                                        </div>
                                    </div>
                                </div>

                                {/* Ticket Body (Preview - max 4 items) */}
                                <div className="p-4 flex-1 space-y-3">
                                    {order.order_items.map((item, i) => (
                                        <div key={i} className="flex items-start gap-3 pb-2 border-b border-white/5 last:border-0">
                                            <span className={`font-bold text-lg px-2 rounded-md font-mono min-w-[2rem] text-center ${order.status === 'preparing' ? 'bg-yellow-500 text-black' : 'bg-slate-700 text-white'}`}>
                                                {item.quantity}
                                            </span>
                                            <span className="font-bold text-lg leading-tight break-words">
                                                {item.products?.name || "Producto"}
                                            </span>
                                        </div>
                                    ))}
                                    {/* Si hay muchos items, mostrar indicador */}
                                    {/* (Omitido por ahora para mostrar todo, el scroll del card manejará overflow si es necesario) */}
                                </div>

                                {/* Actions */}
                                <div className="p-2 gap-2 grid grid-cols-[auto_1fr] bg-black/20 border-t border-white/5 mt-auto">
                                    <Button
                                        variant="secondary"
                                        onClick={() => setSelectedOrder(order)}
                                        className="h-14 w-14 rounded-lg bg-gray-800 hover:bg-gray-700 border border-white/10"
                                    >
                                        <ZoomIn className="w-6 h-6" />
                                    </Button>

                                    {order.status === 'pending' ? (
                                        <Button
                                            onClick={() => updateStatus(order.id, 'preparing')}
                                            className="h-14 text-lg font-bold bg-yellow-600 hover:bg-yellow-500 text-white w-full"
                                        >
                                            MARCHAR 🔥
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={() => updateStatus(order.id, 'ready')}
                                            className="h-14 text-lg font-bold bg-green-600 hover:bg-green-500 text-white w-full"
                                        >
                                            LISTO ✅
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* BIG DETAIL MODAL */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-200">
                    <div className="bg-gray-900 w-full max-w-4xl rounded-3xl border border-white/10 shadow-2xl flex flex-col max-h-[90vh]">
                        {/* Header Modal */}
                        <div className={`p-6 flex justify-between items-center ${selectedOrder.status === 'preparing' ? 'bg-yellow-600 text-black' : 'bg-slate-800 text-white'} rounded-t-3xl`}>
                            <div>
                                <h2 className="text-4xl font-black tracking-widest">#{selectedOrder.id.split('-')[0].toUpperCase()}</h2>
                                <div className="flex items-center gap-3 mt-2 text-lg font-bold opacity-90">
                                    <Clock className="w-5 h-5" /> {getElapsed(selectedOrder.created_at)}
                                    <span>•</span>
                                    {selectedOrder.status === 'preparing' ? 'EN PLANCHA 🔥' : 'EN COLA'}
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full bg-black/20 hover:bg-black/40" onClick={() => setSelectedOrder(null)}>
                                <X className="w-8 h-8" />
                            </Button>
                        </div>

                        {/* Body Modal - Huge Text for Kitchen */}
                        <div className="flex-1 overflow-y-auto p-8 bg-black/20">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold uppercase opacity-50 border-b border-white/10 pb-2">Comanda Completa</h3>
                                    {selectedOrder.order_items.map((item, i) => (
                                        <div key={i} className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                                            <span className={`text-3xl font-black px-4 py-2 rounded-xl min-w-[3.5rem] text-center ${selectedOrder.status === 'preparing' ? 'bg-yellow-500 text-black' : 'bg-slate-700 text-white'}`}>
                                                {item.quantity}
                                            </span>
                                            <div>
                                                <p className="text-3xl font-bold leading-tight">
                                                    {item.products?.name || "Producto"}
                                                </p>
                                                {/* Aquí se mostrarían ingredientes extra/menos si los tuviéramos en customizations */}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold uppercase opacity-50 border-b border-white/10 pb-2">Información Extra</h3>
                                    <div className="p-6 bg-white/5 rounded-2xl space-y-4">
                                        <div>
                                            <label className="text-sm uppercase opacity-50 font-bold">Cliente</label>
                                            <p className="text-2xl font-medium">{selectedOrder.guest_info?.name || "Cliente Registrado"}</p>
                                        </div>
                                        {selectedOrder.guest_info?.phone && (
                                            <div>
                                                <label className="text-sm uppercase opacity-50 font-bold">Teléfono</label>
                                                <p className="text-xl font-mono">{selectedOrder.guest_info.phone}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 border-t border-white/10 flex gap-4 bg-gray-900 rounded-b-3xl">
                            <Button variant="outline" className="h-20 flex-1 text-2xl" onClick={() => setSelectedOrder(null)}>
                                Cerrar
                            </Button>
                            {selectedOrder.status === 'pending' ? (
                                <Button
                                    onClick={() => updateStatus(selectedOrder.id, 'preparing')}
                                    className="h-20 flex-[2] text-3xl font-bold bg-yellow-600 hover:bg-yellow-500 text-white"
                                >
                                    MARCHAR 🔥
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => updateStatus(selectedOrder.id, 'ready')}
                                    className="h-20 flex-[2] text-3xl font-bold bg-green-600 hover:bg-green-500 text-white"
                                >
                                    LISTO ✅
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
