
"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { MessageCircle } from "lucide-react"

export function WhatsAppButton() {
    const [config, setConfig] = useState<{ enabled: boolean, phone: string } | null>(null)

    useEffect(() => {
        const fetchConfig = async () => {
            const { data } = await supabase
                .from('settings')
                .select('value')
                .eq('key', 'feature_flags')
                .single()

            if (data?.value) {
                const features = data.value as any
                setConfig({
                    enabled: !!features.whatsapp_enabled,
                    phone: features.whatsapp_phone || ""
                })
            }
        }

        fetchConfig()

        // Listen for changes in settings
        const channel = supabase
            .channel('settings_changes')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'settings',
                filter: 'key=eq.feature_flags'
            }, (payload) => {
                const features = payload.new.value as any
                setConfig({
                    enabled: !!features.whatsapp_enabled,
                    phone: features.whatsapp_phone || ""
                })
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    if (!config?.enabled || !config.phone) return null

    const whatsappUrl = `https://wa.me/${config.phone.replace(/\+/g, '')}?text=Hola Pargo Rojo! Quiero hacer un pedido o una consulta.`

    return (
        <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-24 right-6 z-40 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 group overflow-hidden"
            title="Escríbenos por WhatsApp"
        >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <MessageCircle className="w-6 h-6 relative z-10" />
        </a>
    )
}
