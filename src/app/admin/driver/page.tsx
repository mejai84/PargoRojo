"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Loader2, MapPin, Phone, Car, Check, Navigation, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useOrderNotifications } from "@/hooks/use-order-notifications"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function DriverApp() {
    const [loading, setLoading] = useState(true)
    const [deliveries, setDeliveries] = useState<any[]>([])
    const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending')
    const [userId, setUserId] = useState<string | null>(null)

    useOrderNotifications() // Para alertas

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setUserId(user.id)

        // Cargar entregas Asignadas (pending/picked_up) o Completadas (delivered)
        const { data, error } = await supabase
            .from('delivery_tracking')
            .select(`
                *,
                orders (
                    id,
                    total_amount,
                    guest_info,
                    customer_name,
                    delivery_address, 
                    order_items (quantity, products(name))
                )
            `)
            .eq('driver_id', user.id)
            .order('assigned_at', { ascending: false })

        if (data) setDeliveries(data)
        setLoading(false)
    }

    const handleUpdateStatus = async (orderId: string, newStatus: string) => {
        const { error } = await supabase
            .from('delivery_tracking')
            .update({
                status: newStatus,
                ...(newStatus === 'picked_up' ? { picked_up_at: new Date().toISOString() } : {}),
                ...(newStatus === 'delivered' ? { delivered_at: new Date().toISOString() } : {})
            })
            .eq('order_id', orderId)

        if (!error) {
            toast.success(newStatus === 'picked_up' ? "📦 Pedido Recogido" : "✅ Entrega Confirmada")

            // También actualizamos la orden principal a 'delivered' si corresponde
            if (newStatus === 'delivered') {
                await supabase.from('orders').update({ status: 'delivered' }).eq('id', orderId)
            }
            loadData()
        } else {
            toast.error("Error al actualizar estado")
        }
    }

    const openGoogleMaps = (address: any) => {
        const query = typeof address === 'string' ? address : address?.address || "Restaurante"
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank')
    }

    const filtered = deliveries.filter(d =>
        activeTab === 'pending'
            ? ['assigned', 'picked_up'].includes(d.status)
            : ['delivered', 'failed'].includes(d.status)
    )

    if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>

    return (
        <div className="min-h-screen bg-slate-50 pb-24 font-sans">
            {/* Header Móvil */}
            <div className="bg-slate-900 text-white p-6 rounded-b-[2rem] shadow-xl relative overflow-hidden">
                <div className="relative z-10 flex justify-between items-center">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Panel Domiciliario</p>
                        <h1 className="text-2xl font-black italic">MIS ENTREGAS</h1>
                    </div>
                    <div className="w-12 h-12 bg-primary text-black rounded-full flex items-center justify-center font-black">
                        {filtered.length}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex p-4 gap-2">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={cn(
                        "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        activeTab === 'pending' ? "bg-white text-primary shadow-sm ring-1 ring-slate-200" : "text-slate-400"
                    )}
                >
                    Por Entregar
                </button>
                <button
                    onClick={() => setActiveTab('completed')}
                    className={cn(
                        "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        activeTab === 'completed' ? "bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200" : "text-slate-400"
                    )}
                >
                    Historial
                </button>
            </div>

            {/* Lista */}
            <div className="px-4 space-y-4">
                {filtered.map(delivery => {
                    const order = delivery.orders
                    const address = order?.delivery_address || "Sin dirección"
                    const contact = order?.guest_info || { name: order?.customer_name || 'Cliente', phone: '' }

                    return (
                        <div key={delivery.order_id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col gap-4">

                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-black italic text-slate-900">#{order.id.split('-')[0].toUpperCase()}</h3>
                                    <p className="text-xs font-bold text-slate-500">{contact.name}</p>
                                </div>
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                    delivery.status === 'picked_up' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                        delivery.status === 'assigned' ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                                )}>
                                    {delivery.status === 'picked_up' ? 'En Ruta' : delivery.status === 'assigned' ? 'Asignado' : 'Entregado'}
                                </span>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-2xl space-y-3">
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-4 h-4 text-rose-500 mt-1 shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-700 leading-tight">
                                            {typeof address === 'string' ? address : (address as any).address}
                                        </p>
                                        <button
                                            onClick={() => openGoogleMaps(address)}
                                            className="text-[10px] font-black text-primary underline mt-1 uppercase tracking-wider flex items-center gap-1"
                                        >
                                            <Navigation className="w-3 h-3" /> Abrir Maps
                                        </button>
                                    </div>
                                </div>

                                {/* MAPA VISUAL */}
                                <div className="w-full h-32 rounded-xl overflow-hidden border border-slate-200 relative bg-slate-200">
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        frameBorder="0"
                                        scrolling="no"
                                        marginHeight={0}
                                        marginWidth={0}
                                        src={`https://maps.google.com/maps?q=${encodeURIComponent(typeof address === 'string' ? address : (address as any).address || "")}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                                        className="w-full h-full opacity-90"
                                    />
                                    <div className="absolute inset-0 pointer-events-none shadow-inner" />
                                </div>

                                {contact.phone && (
                                    <div className="flex items-center gap-3">
                                        <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                                        <a href={`tel:${contact.phone}`} className="text-xs font-bold text-slate-700 hover:text-emerald-600 hover:underline">
                                            {contact.phone}
                                        </a>
                                    </div>
                                )}
                            </div>

                            {/* Acciones */}
                            {delivery.status !== 'delivered' && (
                                <div className="flex gap-2 pt-2">
                                    {delivery.status === 'assigned' ? (
                                        <Button
                                            onClick={() => handleUpdateStatus(delivery.order_id, 'picked_up')}
                                            className="flex-1 h-12 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-800"
                                        >
                                            Recoger Pedido
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={() => handleUpdateStatus(delivery.order_id, 'delivered')}
                                            className="flex-1 h-12 bg-primary text-black rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-white shadow-lg shadow-primary/20"
                                        >
                                            Confirmar Entrega <Check className="w-4 h-4 ml-2" />
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}

                {filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-12 text-slate-300 text-center">
                        <Car className="w-16 h-16 mb-4 opacity-50" />
                        <p className="text-xs font-bold uppercase tracking-widest">No tienes entregas {activeTab === 'pending' ? 'pendientes' : 'completadas'}</p>
                    </div>
                )}
            </div>
        </div>
    )
}
