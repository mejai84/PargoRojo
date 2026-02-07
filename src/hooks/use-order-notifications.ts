"use client"

import { useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"
import { usePathname } from "next/navigation"

// Sonido de alerta (opcional) - Usaremos un beep simple de navegador o un archivo si existe
const playNotificationSound = () => {
    try {
        const audio = new Audio("/sounds/notification.mp3") // Asegúrate de tener este archivo o usa un beep simple
        audio.play().catch(e => console.log("Audio autoplay blocked by browser", e))
    } catch (e) {
        console.error("Error playing sound", e)
    }
}

export function useOrderNotifications() {
    const pathname = usePathname()
    // Solo activar notificaciones en rutas de admin (Cocina, Meseros, Admin)
    const shouldListen = pathname?.startsWith("/admin")

    useEffect(() => {
        if (!shouldListen) return

        // Canal de suscripción a REALTIME
        const channel = supabase
            .channel('realtime-orders')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'orders'
                },
                (payload) => {
                    // SE HA CREADO UN NUEVO PEDIDO
                    console.log('Nuevo pedido recibido:', payload)

                    // Notificar a Cocina / Admin
                    // (En un sistema real, filtraríamos por rol aquí, pero para MVP notificamos a todos en admin)
                    toast.info(`🔔 Nuevo Pedido - Mesa ${payload.new.table_number || '?'}`, {
                        description: `Total: $${payload.new.total_amount}`,
                        duration: 8000, // Duración larga para que lo vean
                        action: {
                            label: "Ver Cocina",
                            onClick: () => window.location.href = "/admin/kitchen"
                        }
                    })
                    playNotificationSound()
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: "status=eq.READY" // Solo cuando pasa a LISTO
                },
                (payload) => {
                    // PEDIDO LISTO PARA SERVIR
                    console.log('Pedido listo:', payload)

                    toast.success(`✅ Pedido Listo - Mesa ${payload.new.table_number || '?'}`, {
                        description: "¡Ya puedes llevarlo a la mesa!",
                        duration: 10000,
                        action: {
                            label: "Ver Pedidos",
                            onClick: () => window.location.href = "/admin/orders"
                        }
                    })
                    playNotificationSound()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [shouldListen])
}
