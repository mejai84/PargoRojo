"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { X, Check, Eye, BellRing, ShoppingBag } from "lucide-react"
import { useRouter } from "next/navigation"
import { formatPrice } from "@/lib/utils"

// Interfaces para los tipos de pedido
interface IncomingOrder {
    id: string
    created_at: string
    user_id: string | null
    status: string
    total: number
    order_type: 'delivery' | 'pickup' | 'dine_in'
    table_id?: string
    guest_info?: {
        name: string
        phone: string
    }
    notes?: string
    payment_method: string
    payment_status: string
}

export function IncomingOrderAlert() {
    const [incomingOrder, setIncomingOrder] = useState<IncomingOrder | null>(null)
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null)
    const router = useRouter()

    useEffect(() => {
        // Inicializar audio
        const sound = new Audio('/sounds/new-order.mp3')
        sound.loop = true // Repetir hasta que se atienda
        setAudio(sound)

        // Suscribirse a nuevos pedidos
        const channel = supabase.channel('alert-new-orders')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'orders',
                    filter: "status=eq.pending" // Solo pedidos pendientes
                },
                (payload) => {
                    const newOrder = payload.new as IncomingOrder

                    // Solo alertar si es pedido online (delivery/pickup) O si se requiere atención
                    // Puedes ajustar esto según necesidad. Por ahora alertamos de TODOS los pedidos pendientes.
                    // Generalmente los pedidos en mesa se crean 'open' o 'pending', pero si los crea el mesero, quizás no necesiten alerta sonora en caja.
                    // Asumiremos que si no tiene table_id es online.
                    if (!newOrder.table_id) {
                        setIncomingOrder(newOrder)
                        playSound(sound)
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
            if (sound) {
                sound.pause()
                sound.currentTime = 0
            }
        }
    }, [])

    const playSound = (sound: HTMLAudioElement) => {
        sound.currentTime = 0
        sound.play().catch(e => console.log("Error playing sound, user interaction needed:", e))
    }

    const stopSound = () => {
        if (audio) {
            audio.pause()
            audio.currentTime = 0
        }
    }

    const handleDismiss = () => {
        stopSound()
        setIncomingOrder(null)
    }

    const handleViewOrder = () => {
        stopSound()
        if (incomingOrder) {
            router.push(`/admin/orders?highlight=${incomingOrder.id}`)
            setIncomingOrder(null)
        }
    }

    const handleQuickAccept = async () => {
        if (!incomingOrder) return
        stopSound()

        try {
            await supabase
                .from('orders')
                .update({ status: 'preparing' }) // O el estado que corresponda para confirmar
                .eq('id', incomingOrder.id)

            setIncomingOrder(null)
        } catch (error) {
            console.error("Error accepting order", error)
        }
    }

    if (!incomingOrder) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] shadow-3xl max-w-md w-full overflow-hidden border-2 border-primary animate-in zoom-in-95 duration-300">
                {/* Header Animado */}
                <div className="bg-primary p-6 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/10 animate-pulse" />
                    <div className="relative z-10 flex flex-col items-center gap-2">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg animate-bounce">
                            <BellRing className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-black">
                            ¡NUEVO PEDIDO!
                        </h2>
                        <p className="text-xs font-bold uppercase tracking-widest text-black/70">
                            {incomingOrder.order_type === 'delivery' ? '🛵 A Domicilio' : '🥡 Para Llevar'}
                        </p>
                    </div>
                </div>

                {/* Detalles */}
                <div className="p-8 space-y-6">
                    <div className="text-center space-y-2">
                        <div className="text-4xl font-black text-slate-900 tracking-tighter">
                            {formatPrice(incomingOrder.total)}
                        </div>
                        <div className="inline-block px-4 py-1 bg-slate-100 rounded-full border border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                            {incomingOrder.payment_method === 'cash' ? '💵 Efectivo' : '💳 Digital'} -
                            <span className={incomingOrder.payment_status === 'paid' ? 'text-emerald-600 ml-1' : 'text-amber-500 ml-1'}>
                                {incomingOrder.payment_status === 'paid' ? 'PAGADO' : 'PENDIENTE'}
                            </span>
                        </div>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-sm space-y-2">
                        <div className="flex justify-between">
                            <span className="text-slate-500 font-bold">Cliente:</span>
                            <span className="font-bold text-slate-900 uppercase">{incomingOrder.guest_info?.name || 'Cliente'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500 font-bold">Teléfono:</span>
                            <span className="font-bold text-slate-900">{incomingOrder.guest_info?.phone || '---'}</span>
                        </div>
                        {incomingOrder.notes && (
                            <div className="pt-2 border-t border-slate-200 mt-2">
                                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Nota:</span>
                                <p className="text-xs italic font-medium text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100">
                                    "{incomingOrder.notes}"
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            onClick={handleDismiss}
                            variant="ghost"
                            className="h-14 rounded-xl border border-slate-200 text-slate-400 font-bold uppercase tracking-wider hover:bg-slate-50 hover:text-slate-600"
                        >
                            IGNORAR
                        </Button>
                        <Button
                            onClick={handleViewOrder}
                            className="h-14 rounded-xl bg-slate-900 text-white font-bold uppercase tracking-wider hover:bg-black shadow-xl"
                        >
                            <Eye className="w-5 h-5 mr-2" /> VER DETALLES
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
