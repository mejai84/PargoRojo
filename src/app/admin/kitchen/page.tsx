
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

        const updateData: any = { status: newStatus }
        if (newStatus === 'preparing') {
            updateData.preparation_started_at = new Date().toISOString()
        } else if (newStatus === 'ready') {
            updateData.preparation_finished_at = new Date().toISOString()
        }

        await supabase.from('orders').update(updateData).eq('id', id)

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
            return {
                color: 'border-orange-500 ring-4 ring-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.3)]',
                bgHeader: 'bg-gradient-to-r from-orange-600 to-red-600 text-white',
                bgBody: 'bg-gray-900',
                label: 'EN PLANCHA 🔥',
                icon: Flame,
                animate: 'animate-pulse'
            }
        }

        if (minutes > 20) {
            return {
                color: 'border-red-600 ring-4 ring-red-600/20 shadow-[0_0_20px_rgba(220,38,38,0.3)]',
                bgHeader: 'bg-red-600',
                bgBody: 'bg-gray-900',
                label: 'DEMORADO ⚠️',
                icon: AlertTriangle,
                animate: 'animate-bounce-subtle'
            }
        }

        return {
            color: 'border-slate-700',
            bgHeader: 'bg-slate-800 text-slate-300',
            bgBody: 'bg-gray-950',
            label: 'EN COLA',
            icon: Bell,
            animate: ''
        }
    }

    const preparing = orders.filter(o => o.status === 'preparing')
    const pending = orders.filter(o => o.status === 'pending')

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-6 font-sans">
            {/* Header KDS Premium */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6 bg-gray-900/50 p-6 rounded-[2rem] border border-white/5 backdrop-blur-md">
                <div className="flex items-center gap-6 w-full md:w-auto">
                    <Link href="/admin/orders">
                        <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-white/10 hover:bg-white/5 text-white">
                            <ArrowLeft className="w-6 h-6" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3">
                            ORDENES <span className="text-primary italic">KDS</span>
                        </h1>
                        <p className="text-xs text-muted-foreground font-bold tracking-widest uppercase opacity-50">Control de Producción en Tiempo Real</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">En Preparación</span>
                        <div className="flex items-center gap-3 px-6 py-3 bg-orange-500/10 text-orange-500 rounded-2xl border border-orange-500/20">
                            <Flame className="w-6 h-6 animate-pulse" />
                            <span className="font-black text-3xl tabular-nums">{preparing.length}</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">En Espera</span>
                        <div className="flex items-center gap-3 px-6 py-3 bg-slate-800/50 text-slate-300 rounded-2xl border border-white/10">
                            <Bell className="w-6 h-6" />
                            <span className="font-black text-3xl tabular-nums">{pending.length}</span>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={fetchOrders}
                        className={`h-14 w-14 rounded-2xl bg-white/5 hover:bg-white/10 text-white transition-all ${loading ? "animate-spin" : ""}`}
                    >
                        <RefreshCw className="w-6 h-6" />
                    </Button>
                </div>
            </div>

            {/* Grid de Comandas */}
            {orders.length === 0 && !loading ? (
                <div className="flex flex-col items-center justify-center h-[60vh] text-gray-700 gap-6 border-4 border-dashed border-gray-900 rounded-[3rem] bg-gray-900/10">
                    <div className="w-32 h-32 rounded-full bg-gray-900/50 flex items-center justify-center">
                        <Check className="w-16 h-16 opacity-20" />
                    </div>
                    <div className="text-center">
                        <p className="text-4xl font-black tracking-tighter text-gray-800">TODO DESPACHADO</p>
                        <p className="text-gray-500 font-bold uppercase tracking-widest mt-2">No hay ordenes pendientes en este momento</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {orders.map((order) => {
                        const style = getStatusInfo(order)
                        const StatusIcon = style.icon

                        return (
                            <div
                                key={order.id}
                                className={`flex flex-col rounded-[2rem] overflow-hidden border-2 transition-all duration-500 h-full bg-gray-950 group ${style.color} ${style.animate}`}
                            >
                                {/* Ticket Header Premium */}
                                <div className={`p-5 flex justify-between items-start ${style.bgHeader}`}>
                                    <div>
                                        <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest mb-2 bg-black/20 w-fit px-3 py-1 rounded-full">
                                            <StatusIcon className="w-3 h-3" /> {style.label}
                                        </div>
                                        <span className="text-3xl font-black tracking-widest font-mono">#{order.id.split('-')[0].toUpperCase()}</span>
                                    </div>
                                    <div className="bg-black/40 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/10">
                                        <div className="text-[10px] font-black uppercase tracking-tighter opacity-70">Tiempo</div>
                                        <div className="font-mono font-black text-xl tabular-nums leading-none">
                                            {getElapsed(order.created_at)}
                                        </div>
                                    </div>
                                </div>

                                {/* Ticket Body - Mucho más legible */}
                                <div className="p-6 flex-1 space-y-4">
                                    {order.order_items.map((item, i) => (
                                        <div key={i} className="flex items-start gap-4 animate-in fade-in slide-in-from-left duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                                            <div className={`text-2xl font-black px-3 py-1 rounded-xl font-mono min-w-[3rem] text-center shadow-lg ${order.status === 'preparing' ? 'bg-orange-500 text-black' : 'bg-slate-800 text-white border border-white/10'}`}>
                                                {item.quantity}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xl font-bold leading-none mb-1 group-hover:text-primary transition-colors">
                                                    {item.products?.name || "Producto"}
                                                </p>
                                                {item.customizations && (
                                                    <p className="text-xs font-bold text-orange-400 uppercase tracking-wide">
                                                        {Object.entries(item.customizations).map(([k, v]) => `${k}: ${v}`).join(', ')}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Actions Footer */}
                                <div className="p-4 gap-3 grid grid-cols-[auto_1fr] bg-black/40 border-t border-white/5">
                                    <Button
                                        variant="secondary"
                                        onClick={() => setSelectedOrder(order)}
                                        className="h-16 w-16 rounded-[1.5rem] bg-gray-800 hover:bg-gray-700 border border-white/10 transition-transform active:scale-95"
                                    >
                                        <Eye className="w-8 h-8" />
                                    </Button>

                                    {order.status === 'pending' ? (
                                        <Button
                                            onClick={() => updateStatus(order.id, 'preparing')}
                                            className="h-16 text-xl font-black bg-orange-600 hover:bg-orange-500 text-white w-full rounded-[1.5rem] shadow-lg shadow-orange-900/20 active:scale-[0.98] transition-all"
                                        >
                                            ¡MARCHAR! 🔥
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={() => updateStatus(order.id, 'ready')}
                                            className="h-16 text-xl font-black bg-green-600 hover:bg-green-500 text-white w-full rounded-[1.5rem] shadow-lg shadow-green-900/20 active:scale-[0.98] transition-all"
                                        >
                                            ENTREGADO ✅
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* BIG DETAIL MODAL PREMIUM */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 bg-black/95 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-300">
                    <div className="bg-[#0f0f0f] w-full max-w-5xl rounded-[3rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh] overflow-hidden">
                        {/* Header Modal */}
                        <div className={`p-8 flex justify-between items-center ${selectedOrder.status === 'preparing' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-white'}`}>
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="px-3 py-1 bg-black/20 rounded-full text-xs font-black uppercase tracking-widest">Orden de Cocina</span>
                                    <span className="text-sm font-bold opacity-70 font-mono">ID: {selectedOrder.id}</span>
                                </div>
                                <h1 className="text-6xl font-black tracking-tighter">ORDEN #{selectedOrder.id.split('-')[0].toUpperCase()}</h1>
                                <div className="flex items-center gap-6 mt-4 text-2xl font-black font-mono">
                                    <div className="flex items-center gap-2"><Clock className="w-6 h-6" /> {getElapsed(selectedOrder.created_at)}</div>
                                    <div className="w-2 h-2 rounded-full bg-white/20" />
                                    <div className="flex items-center gap-2">
                                        {selectedOrder.status === 'preparing' ? <><Flame className="w-6 h-6" /> EN PLANCHA</> : <><Bell className="w-6 h-6" /> EN COLA</>}
                                    </div>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-20 w-20 rounded-full bg-black/20 hover:bg-black/40 text-white" onClick={() => setSelectedOrder(null)}>
                                <X className="w-10 h-10" />
                            </Button>
                        </div>

                        {/* Body Modal - Huge Text */}
                        <div className="flex-1 overflow-y-auto p-10">
                            <div className="grid md:grid-cols-5 gap-12">
                                <div className="md:col-span-3 space-y-8">
                                    <h3 className="text-2xl font-black uppercase opacity-30 tracking-widest">PRODUCTOS PARA PREPARAR</h3>
                                    <div className="space-y-6">
                                        {selectedOrder.order_items.map((item, i) => (
                                            <div key={i} className="flex items-start gap-8 p-8 bg-white/5 rounded-[2.5rem] border border-white/5 shadow-inner">
                                                <span className={`text-6xl font-black px-6 py-4 rounded-3xl min-w-[6rem] text-center shadow-xl ${selectedOrder.status === 'preparing' ? 'bg-orange-500 text-black' : 'bg-slate-700 text-white'}`}>
                                                    {item.quantity}
                                                </span>
                                                <div className="flex-1">
                                                    <p className="text-5xl font-black leading-tight tracking-tight">
                                                        {item.products?.name || "Producto"}
                                                    </p>
                                                    {item.customizations && (
                                                        <div className="mt-4 p-4 bg-orange-500/10 rounded-2xl border border-orange-500/20">
                                                            <p className="text-xl font-bold text-orange-500 uppercase tracking-wide">
                                                                {Object.entries(item.customizations).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="md:col-span-2 space-y-10">
                                    <div className="space-y-6">
                                        <h3 className="text-2xl font-black uppercase opacity-30 tracking-widest">INFO DEL CLIENTE</h3>
                                        <div className="p-8 bg-blue-500/5 rounded-[2.5rem] border border-blue-500/10 space-y-6">
                                            <div>
                                                <label className="text-sm uppercase opacity-40 font-black tracking-widest block mb-2">Nombre</label>
                                                <p className="text-4xl font-black text-blue-400">{selectedOrder.guest_info?.name || "Cliente Local"}</p>
                                            </div>
                                            {selectedOrder.guest_info?.phone && (
                                                <div>
                                                    <label className="text-sm uppercase opacity-40 font-black tracking-widest block mb-2">Teléfono de Contacto</label>
                                                    <p className="text-3xl font-mono font-bold">{selectedOrder.guest_info.phone}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-8 bg-gray-900/50 rounded-[2.5rem] border border-white/5">
                                        <h4 className="text-xl font-black mb-4 uppercase tracking-widest opacity-30">Instrucciones</h4>
                                        <p className="text-gray-400 italic font-medium leading-relaxed">Sin notas adicionales para esta orden.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions Huge */}
                        <div className="p-8 border-t border-white/10 flex gap-6 bg-[#0a0a0a]">
                            <Button variant="outline" className="h-24 flex-1 text-2xl font-black rounded-3xl border-2 tracking-widest uppercase hover:bg-white/5" onClick={() => setSelectedOrder(null)}>
                                VOLVER
                            </Button>
                            {selectedOrder.status === 'pending' ? (
                                <Button
                                    onClick={() => updateStatus(selectedOrder.id, 'preparing')}
                                    className="h-24 flex-[2] text-4xl font-black bg-orange-600 hover:bg-orange-500 text-white rounded-3xl shadow-[0_10px_40px_rgba(234,88,12,0.3)] active:scale-95 transition-all"
                                >
                                    ¡EMPEZAR AHORA! 🔥
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => updateStatus(selectedOrder.id, 'ready')}
                                    className="h-24 flex-[2] text-4xl font-black bg-green-600 hover:bg-green-500 text-white rounded-3xl shadow-[0_10px_40px_rgba(22,163,74,0.3)] active:scale-95 transition-all"
                                >
                                    ¡TERMINADO! ✅
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes bounce-subtle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                }
                .animate-bounce-subtle {
                    animation: bounce-subtle 2s infinite ease-in-out;
                }
            `}</style>
        </div>
    )
}
