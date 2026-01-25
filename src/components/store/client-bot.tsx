"use client"

import { useState, useEffect, useRef } from "react"
import { MessageCircle, Send, X, MapPin, Clock, Phone, Utensils, Sparkles } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface Message {
    role: 'user' | 'assistant'
    content: React.ReactNode
}

export function ClientBot() {
    const pathname = usePathname()
    // Ocultar en rutas de admin
    if (pathname?.startsWith('/admin')) return null

    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: "¡Hola! 👋 Bienvenido a Pargo Rojo. ¿En qué puedo ayudarte hoy? 😊"
        }
    ])
    const [input, setInput] = useState("")
    const [businessInfo, setBusinessInfo] = useState<any>(null)
    const scrollRef = useRef<HTMLDivElement>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const fetchInfo = async () => {
            const { data } = await supabase.from('settings').select('value').eq('key', 'business_info').single()
            if (data?.value) setBusinessInfo(data.value)
        }
        fetchInfo()
    }, [])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const processQuery = async (query: string) => {
        setLoading(true)
        const q = query.toLowerCase()
        let responseContent: React.ReactNode = "Lo siento, no entendí tu pregunta. ¿Podrías intentar con las opciones de abajo? 👇"

        // Simular pequeño delay para naturalidad
        await new Promise(r => setTimeout(r, 600))

        if (q.includes('horario') || q.includes('abierto') || q.includes('abre')) {
            responseContent = "Estamos abiertos todos los días de 11:00 AM a 10:00 PM. ¡Te esperamos! 🕙"
        }
        else if (q.includes('ubicacion') || q.includes('direccion') || q.includes('donde')) {
            responseContent = (
                <div className="flex flex-col gap-2">
                    <span>Nos encontramos en:</span>
                    <span className="font-bold">{businessInfo?.address || "C.Cial. Cauca Centro, Caucasia"}</span>
                    <a
                        href={`https://maps.google.com/?q=${businessInfo?.address || "Pargo Rojo Caucasia"}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline text-xs mt-1 block"
                    >
                        Ver en mapa 📍
                    </a>
                </div>
            )
        }
        else if (q.includes('telefono') || q.includes('contacto') || q.includes('llamar')) {
            responseContent = (
                <div className="flex flex-col gap-2">
                    <span>Puedes contactarnos al:</span>
                    <a href={`tel:${businessInfo?.phone}`} className="font-bold text-lg text-primary">{businessInfo?.phone || "320 784 8287"}</a>
                </div>
            )
        }
        else if (q.includes('menu') || q.includes('carta') || q.includes('platos')) {
            responseContent = (
                <div className="flex flex-col gap-2">
                    <span>¡Tenemos una carta deliciosa! Especialidad en comida de mar y asados.</span>
                    <Link href="/menu" onClick={() => setIsOpen(false)} className="bg-primary text-black px-4 py-2 rounded-xl font-bold text-center mt-2 hover:opacity-90 transition-opacity">
                        Ver Menú Completo 🍽️
                    </Link>
                </div>
            )
        }
        else if (q.includes('sugerencia') || q.includes('recomienda') || q.includes('rico')) {
            // Podríamos hacer fetch random, por ahora hardcodeamos un top seller
            responseContent = "¡Te recomiendo probar nuestra 'Cazuela de Mariscos' o el 'Pargo Rojo Frito'! Son los favoritos de la casa. 🦐🐟"
        }

        setMessages(prev => [...prev, { role: 'assistant', content: responseContent }])
        setLoading(false)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || loading) return

        const userMsg = input
        setMessages(prev => [...prev, { role: 'user', content: userMsg }])
        setInput("")
        processQuery(userMsg)
    }

    const handleQuickReply = (text: string) => {
        setMessages(prev => [...prev, { role: 'user', content: text }])
        processQuery(text)
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "fixed bottom-24 right-6 md:bottom-10 md:right-32 w-14 h-14 md:w-16 md:h-16 rounded-full bg-white text-primary border-2 border-primary shadow-2xl flex items-center justify-center hover:scale-110 transition-all z-[90] group",
                    isOpen && "hidden"
                )}
            >
                <MessageCircle className="w-7 h-7 md:w-8 md:h-8 group-hover:animate-bounce" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping" />
            </button>

            {isOpen && (
                <div className="fixed bottom-0 right-0 md:bottom-28 md:right-8 w-full md:w-[380px] h-full md:h-[550px] bg-white md:rounded-3xl shadow-3xl z-[100] flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in border border-gray-100 font-sans">

                    {/* Header */}
                    <div className="bg-primary p-4 flex items-center justify-between text-black">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                {businessInfo?.logo_url ? (
                                    <img src={businessInfo.logo_url} className="w-full h-full object-cover rounded-full" />
                                ) : (
                                    <Sparkles className="w-5 h-5 text-white" />
                                )}
                            </div>
                            <div>
                                <h3 className="font-black italic uppercase text-white leading-none text-lg">ASISTENTE</h3>
                                <p className="text-[10px] uppercase font-bold text-black/60 tracking-wider">En línea ahora</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-black/10 rounded-full text-white transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                        {messages.map((msg, i) => (
                            <div key={i} className={cn("flex w-full mb-2", msg.role === 'user' ? "justify-end" : "justify-start")}>
                                <div className={cn(
                                    "max-w-[80%] p-3.5 rounded-2xl text-sm shadow-sm",
                                    msg.role === 'user'
                                        ? "bg-primary text-black rounded-tr-none font-medium"
                                        : "bg-white text-gray-700 rounded-tl-none border border-gray-100"
                                )}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start w-full">
                                <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 flex gap-1">
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="p-2 bg-slate-50 overflow-x-auto flex gap-2 w-full scrollbar-none px-4 pb-2">
                        {[
                            { icon: Clock, label: "Horario", val: "horario" },
                            { icon: MapPin, label: "Ubicación", val: "ubicacion" },
                            { icon: Utensils, label: "Menú", val: "menu" },
                            { icon: Sparkles, label: "Sugerencia", val: "sugerencia" },
                        ].map((action, i) => (
                            <button
                                key={i}
                                onClick={() => handleQuickReply(action.val)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-[10px] font-bold uppercase tracking-wide text-gray-600 hover:text-primary hover:border-primary transition-all whitespace-nowrap shadow-sm"
                            >
                                <action.icon className="w-3 h-3" />
                                {action.label}
                            </button>
                        ))}
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-gray-100 flex gap-2">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Escribe tu consulta..."
                            className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-gray-900 placeholder:text-gray-400"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || loading}
                            className="w-12 h-12 bg-primary text-black rounded-xl flex items-center justify-center disabled:opacity-50 hover:bg-primary/90 transition-all shadow-md active:scale-95"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            )}
        </>
    )
}
