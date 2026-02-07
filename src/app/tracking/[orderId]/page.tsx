"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { useParams } from "next/navigation"
import {
    CheckCircle2,
    ChefHat,
    Bike,
    MapPin,
    Store,
    Clock,
    Phone,
    User,
    Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

export default function OrderTrackingPage() {
    const params = useParams()
    const orderId = params?.orderId as string
    const [loading, setLoading] = useState(true)
    const [order, setOrder] = useState<any>(null)
    const [delivery, setDelivery] = useState<any>(null)

    // Estados Visuales
    const STATUS_STEPS = [
        { id: 'pending', label: 'Recibido', icon: Store, description: "Hemos recibido tu pedido" },
        { id: 'preparing', label: 'En Cocina', icon: ChefHat, description: "Nuestros chefs están cocinando" },
        { id: 'ready', label: 'Listo', icon: CheckCircle2, description: "Tu pedido está empacado" },
        { id: 'picked_up', label: 'En Camino', icon: Bike, description: "El domiciliario va en ruta" },
        { id: 'delivered', label: 'Entregado', icon: MapPin, description: "¡Disfruta tu comida!" }
    ]

    useEffect(() => {
        if (!orderId) return
        loadOrder()

        // Suscripción Realtime para actualizaciones en vivo
        const channel = supabase
            .channel(`tracking:${orderId}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
                (payload) => {
                    setOrder(prev => ({ ...prev, ...payload.new }))
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'delivery_tracking', filter: `order_id=eq.${orderId}` },
                (payload) => {
                    setDelivery(prev => ({ ...prev, ...payload.new }))
                }
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [orderId])

    const loadOrder = async () => {
        try {
            // Cargar Orden
            const { data: orderData, error } = await supabase
                .from('orders')
                .select('*, order_items(*, products(*))')
                .eq('id', orderId)
                .single()

            if (error) throw error
            setOrder(orderData)

            // Cargar Delivery Tracking (si existe)
            const { data: deliveryData } = await supabase
                .from('delivery_tracking')
                .select('*, profiles(full_name, phone)') // Asumiendo que driver_id pointea a profiles
                .eq('order_id', orderId)
                .maybeSingle()

            if (deliveryData) setDelivery(deliveryData)
        } catch (e) {
            console.error("Error loading order", e)
        } finally {
            setLoading(false)
        }
    }

    // Calcular estado actual combinado
    const getCurrentStatusStep = () => {
        if (!order) return 0

        // Prioridad: Entregado > En Camino > Listo > Preparando > Pendiente
        if (order.status === 'delivered') return 4
        if (delivery?.status === 'picked_up') return 3 // En camino (estado específico de delivery)
        if (order.status === 'ready') return 2
        if (order.status === 'preparing') return 1
        return 0 // pending
    }

    const currentStepIndex = getCurrentStatusStep()

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
    )

    if (!order) return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
            <h1 className="text-2xl font-black text-slate-900 mb-2">Pedido no encontrado</h1>
            <p className="text-slate-500 mb-8">No pudimos encontrar la información de este pedido.</p>
            <Link href="/" className="px-6 py-3 bg-primary text-black font-bold rounded-xl">Volver al Inicio</Link>
        </div>
    )

    return (
        <div className="min-h-screen bg-[#F8F9FE] font-sans pb-20">
            {/* Header */}
            <div className="bg-white p-6 shadow-sm border-b border-gray-100 sticky top-0 z-20">
                <div className="flex justify-between items-center max-w-2xl mx-auto">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#FF0075]">Pargo Rojo</p>
                        <h1 className="text-xl font-black italic text-[#1E2022]">TU PEDIDO</h1>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Orden #</p>
                        <p className="text-lg font-black font-mono text-[#1E2022]">{order.id.split('-')[0].toUpperCase()}</p>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto p-6 space-y-8">

                {/* 1. STATUS TIMELINE */}
                <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-gray-200/50 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gray-100">
                        <div
                            className="h-full bg-[#FF0075] transition-all duration-1000 ease-in-out"
                            style={{ width: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
                        />
                    </div>

                    <div className="space-y-8 relative z-10 pt-4">
                        {STATUS_STEPS.map((step, index) => {
                            const isActive = index === currentStepIndex
                            const isPast = index < currentStepIndex
                            const isFuture = index > currentStepIndex

                            return (
                                <div key={step.id} className={cn("flex gap-4 transition-opacity duration-500", isFuture && "opacity-30 grayscale")}>
                                    <div className="flex flex-col items-center">
                                        <div className={cn(
                                            "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                                            isActive ? "bg-[#FF0075] border-[#FF0075] text-white scale-110 shadow-lg shadow-[#FF0075]/30" :
                                                isPast ? "bg-emerald-500 border-emerald-500 text-white" :
                                                    "bg-white border-gray-200 text-gray-300"
                                        )}>
                                            <step.icon className="w-5 h-5" />
                                        </div>
                                        {index !== STATUS_STEPS.length - 1 && (
                                            <div className={cn("w-0.5 h-full min-h-[2rem] my-2 bg-gray-100", isPast && "bg-emerald-500/30")} />
                                        )}
                                    </div>
                                    <div className={cn("pt-2", isActive && "scale-105 origin-left transition-transform")}>
                                        <h3 className={cn("text-lg font-bold leading-none mb-1", isActive ? "text-[#1E2022]" : "text-gray-500")}>
                                            {step.label}
                                        </h3>
                                        <p className="text-xs text-gray-400 font-medium max-w-[200px]">
                                            {isActive ? step.description : (isPast ? "Completado" : "Pendiente")}
                                        </p>
                                    </div>
                                    {isActive && (
                                        <div className="ml-auto flex items-center">
                                            <span className="flex h-3 w-3 relative">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF0075] opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FF0075]"></span>
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* 2. DRIVER INFO (Only if assigned) */}
                {delivery?.status === 'picked_up' && (
                    <div className="bg-[#1E2235] rounded-[2rem] p-6 text-white shadow-xl animate-in slide-in-from-bottom-4">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-white/10 rounded-full">
                                <Bike className="w-6 h-6 text-[#FF0075]" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">Tu Domiciliario</h3>
                                <p className="text-white/60 text-xs">Va en camino a tu ubicación</p>
                            </div>
                        </div>

                        {/* Fake Map preview */}
                        <div className="h-32 bg-white/5 rounded-xl border border-white/10 relative overflow-hidden mb-4 group cursor-pointer">
                            <div className="absolute inset-0 flex items-center justify-center opacity-30 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=40.714728,-73.998672&zoom=12&size=400x200&key=FAKE_KEY')] bg-cover bg-center grayscale group-hover:grayscale-0 transition-all">
                                {/* Fallback visual pattern if no map key */}
                                <div className="absolute inset-0 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:16px_16px]"></div>
                            </div>
                            <div className="relative z-10 bg-black/50 px-4 py-2 rounded-full backdrop-blur-md flex items-center gap-2 border border-white/10">
                                <span className="w-2 h-2 bg-[#FF0075] rounded-full animate-pulse" />
                                <span className="text-xs font-bold tracking-widest uppercase">En ruta</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#FF0075] rounded-full flex items-center justify-center font-bold">
                                    <User className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="font-bold">{delivery.profiles?.full_name || "Repartidor"}</p>
                                    <p className="text-[10px] text-white/50 uppercase tracking-wider">Pargo Delivery Team</p>
                                </div>
                            </div>
                            {delivery.profiles?.phone && (
                                <a href={`tel:${delivery.profiles.phone}`} className="p-3 bg-emerald-500 rounded-full hover:bg-emerald-400 transition-colors">
                                    <Phone className="w-5 h-5 text-white" />
                                </a>
                            )}
                        </div>
                    </div>
                )}

                {/* 3. ORDER DETAILS */}
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                        <ShoppingBasket className="w-4 h-4" /> Detalle del Pedido
                    </h3>
                    <div className="space-y-4">
                        {order.order_items.map((item: any) => (
                            <div key={item.id} className="flex justify-between items-start">
                                <div className="flex gap-3">
                                    <div className="w-6 h-6 bg-gray-100 rounded text-xs font-bold flex items-center justify-center text-gray-600">
                                        {item.quantity}x
                                    </div>
                                    <span className="font-bold text-[#1E2022] text-sm">
                                        {item.products?.name || "Producto"}
                                    </span>
                                </div>
                                <span className="font-bold text-[#1E2022] text-sm">
                                    ${(item.unit_price * item.quantity).toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 pt-6 border-t border-gray-100 flex justify-between items-center">
                        <span className="font-bold text-gray-500 uppercase text-xs">Total a Pagar</span>
                        <span className="text-2xl font-black text-[#1E2022]">${order.total_amount.toLocaleString()}</span>
                    </div>
                </div>

                {/* Footer Help */}
                <div className="text-center pb-8">
                    <p className="text-xs text-gray-400 font-medium mb-2">¿Necesitas ayuda?</p>
                    <a href="tel:+573000000000" className="text-[#FF0075] font-bold text-sm underline">Llamar al Restaurante</a>
                </div>

            </div>
        </div>
    )
}

function ShoppingBasket(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m5 11 4-7" />
            <path d="m19 11-4-7" />
            <path d="M2 11h20" />
            <path d="m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8c.9 0 1.8-.7 2-1.6l1.7-7.4" />
            <path d="m9 11 1 9" />
            <path d="m15 11-1 9" />
        </svg>
    )
}
