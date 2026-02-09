"use client"

import { useState, useEffect, useRef } from "react"
import { MessageCircle, Send, X, MapPin, Clock, Phone, Utensils, Sparkles, Search } from "lucide-react"
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
            content: (
                <div className="space-y-2">
                    <p>¡Hola! 👋 Soy tu asistente de **Pargo Rojo**. ¿En qué puedo ayudarte hoy?</p>
                    <div className="text-[11px] bg-slate-100 p-2 rounded-lg italic">
                        Puedes preguntarme como: "¿Cómo comprar?", "¿Tienen ceviche?", o "Consultar mi pedido"
                    </div>
                </div>
            )
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
        let responseContent: React.ReactNode = "Hmm, esa es una excelente pregunta. 🤔 No tengo la respuesta exacta en este momento, pero puedes llamarnos directamente o preguntar por nuestro menú del día. ¿Te gustaría ver las recomendaciones?"

        await new Promise(r => setTimeout(r, 800))

        // CHECK IF IT'S A TICKET ID (Approx 8 chars hex or uuid)
        const ticketMatch = query.match(/\b[a-fA-F0-9]{8}\b/) || query.match(/\b[a-fA-F0-9-]{36}\b/)

        if (ticketMatch) {
            const ticketId = ticketMatch[0]
            const { data: order } = await supabase.from('orders').select('status, id').ilike('id', `${ticketId}%`).maybeSingle()

            if (order) {
                const statusMap: any = {
                    pending: 'Recibido 📝',
                    preparing: 'En Cocina 🔥',
                    ready: 'Listo para entregar 🎁',
                    delivered: 'Entregado ✅',
                    cancelled: 'Cancelado ❌'
                }
                const statusText = statusMap[order.status] || 'En proceso ⏳'

                responseContent = (
                    <div className="space-y-2">
                        <p>¡Encontré tu pedido! 🕵️‍♂️</p>
                        <div className="bg-slate-100 p-3 rounded-xl border border-primary/20">
                            <p className="text-xs text-gray-500 uppercase font-bold">Ticket #{order.id.slice(0, 8)}</p>
                            <p className="text-lg font-black text-primary">{statusText}</p>
                        </div>
                        <Link href={`/checkout/status/${order.id}`} className="block w-full text-center bg-primary text-black py-2 rounded-lg text-xs font-bold uppercase hover:bg-white border hover:border-primary transition-all">
                            Ver Detalles
                        </Link>
                    </div>
                )
            } else {
                responseContent = "Lo siento, no encuentro ningún pedido con ese número de ticket. 😢 Por favor verifica que esté bien escrito."
            }
        }
        // 0. CONSULTA DE ESTADO DE PEDIDO
        else if (q.includes('donde esta') || q.includes('estado') || (q.includes('consultar') && q.includes('pedido')) || q.includes('rastrear')) {
            responseContent = "¡Claro! Para buscar tu pedido, por favor escribe el **número de ticket** (son los primeros 8 caracteres, ejemplo: e397d3dc). 👇"
        }
        // 1. PROCESO DE COMPRA Y LOGÍSTICA
        else if (q.includes('comprar') || q.includes('pedido') || q.includes('ordenar') || q.includes('pasos')) {
            responseContent = "Para pedir: 1. Ve al Menú. 2. Añade tus platos con el botón (+). 3. Toca el carrito arriba a la derecha. 4. Confirma por WhatsApp. ¡Es súper fácil! 🛒"
        }
        else if (q.includes('domicilio') || q.includes('envi') || q.includes('lleva')) {
            responseContent = "¡Llegamos a todo Caucasia! 🛵 El costo varía según el barrio, pero suele estar entre $3.000 y $6.000. ¿A qué sector necesitas el envío?"
        }
        else if (q.includes('tiempo') || q.includes('demora') || q.includes('tard')) {
            responseContent = "Nuestros platos de mar se preparan al momento para máxima frescura 🍤. El tiempo promedio es de 20 a 35 minutos según la complejidad del plato."
        }
        else if (q.includes('cancela') || q.includes('arrepenti')) {
            responseContent = "Si necesitas cancelar, por favor llámanos de inmediato al 320 784 8287. Si el plato ya entró a cocina, es posible que no podamos cancelarlo. ⚠️"
        }

        // 2. MÉTODOS DE PAGO Y DINERO
        else if (q.includes('pago') || q.includes('pagar') || q.includes('metodo') || q.includes('nequi') || q.includes('daviplata')) {
            responseContent = "Aceptamos Efectivo, Nequi, Daviplata y todas las tarjetas de crédito o débito (Visa, Master, Amex). 💳"
        }
        else if (q.includes('propina')) {
            responseContent = "La propina es voluntaria (10% sugerido). Nuestros meseros te lo agradecerán mucho, ¡dan lo mejor de sí! 👨‍🍳"
        }
        else if (q.includes('barato') || q.includes('economico') || q.includes('precio')) {
            responseContent = "Tenemos opciones para todos los bolsillos, desde entradas de $12.000 hasta pargos gigantes premium. ¡Revisa nuestra sección de 'Combos' para ahorrar! 💸"
        }

        // 3. MENÚ Y COMIDA (ESPECÍFICOS)
        else if (q.includes('pargo')) {
            responseContent = "¡Nuestra especialidad! 🐟 Lo servimos frito, a la plancha o en salsa marinera. Viene con patacones, arroz de coco y ensalada. ¡Es una joya!"
        }
        else if (q.includes('ceviche') || q.includes('camaron') || q.includes('marisco')) {
            responseContent = "Usamos mariscos frescos que llegan cada madrugada. Te recomiendo el Ceviche Gran Pargo, ¡es una explosión de sabor! 🍋🦐"
        }
        else if (q.includes('carne') || q.includes('asado') || q.includes('res') || q.includes('cerdo')) {
            responseContent = "No todo es mar; nuestros cortes de res premium y costillitas BBQ son famosos en Caucasia. 🥩🔥"
        }
        else if (q.includes('niño') || q.includes('kids') || q.includes('infantil')) {
            responseContent = "¡Claro! Tenemos Nuggets de pollo y deditos de pescado que a los niños les encantan. Incluyen papitas fritas. 🍟👶"
        }
        else if (q.includes('vegetariano') || q.includes('ensalada') || q.includes('saludable')) {
            responseContent = "Tenemos ensaladas frescas y platos a base de vegetales. También puedes pedir nuestro arroz de coco con vegetales salteados. 🥗"
        }
        else if (q.includes('bebida') || q.includes('jugo') || q.includes('tomar') || q.includes('cerveza') || q.includes('vino')) {
            responseContent = "Tenemos jugos naturales de la región (Mango, Lulo, Limonada de Coco), gaseosas bien frías y una selección de cervezas y vinos para maridar. 🍹🍷"
        }
        else if (q.includes('postre') || q.includes('dulce')) {
            responseContent = "Prueba nuestro postre de Natas o el Brownie con helado. ¡El final perfecto! 🍨"
        }

        // 4. SOBRE EL LOCAL Y SERVICIOS
        else if (q.includes('reserva') || q.includes('mesa') || q.includes('apartar')) {
            responseContent = "¡Claro! Escríbenos por WhatsApp con la fecha, hora y número de personas para asegurarte el mejor lugar. 🗓️"
        }
        else if (q.includes('cumpleaños') || q.includes('aniversario') || q.includes('festejar')) {
            responseContent = "¡Nos encanta celebrar contigo! 🎂 Avísanos al reservar y podemos decorar tu mesa o tener un detalle especial para el cumpleañero."
        }
        else if (q.includes('mascota') || q.includes('perro') || q.includes('animal') || q.includes('pet')) {
            responseContent = "En nuestra zona de terraza somos 100% Pet Friendly. ¡Trae a tu mejor amigo! 🐾"
        }
        else if (q.includes('wifi') || q.includes('internet')) {
            responseContent = "¡Sí! Tenemos WiFi de alta velocidad para nuestros clientes. Pide la clave a tu mesero favorito. 📶"
        }
        else if (q.includes('parqueadero') || q.includes('carro') || q.includes('moto')) {
            responseContent = "Estamos en el C.Cial Cauca Centro, tenemos parqueadero seguro y vigilado para que comas tranquilo. 🚗"
        }
        else if (q.includes('clima') || q.includes('aire') || q.includes('calor')) {
            responseContent = "Nuestro salón interior cuenta con un excelente aire acondicionado para que disfrutes sin calor. ❄️"
        }
        else if (q.includes('musica') || q.includes('show') || q.includes('vivo')) {
            responseContent = "Los fines de semana solemos tener música en vivo o ambiente alegre. ¡Pregúntanos qué hay para este sábado! 🎶"
        }

        // 5. MARCA, HISTORIA Y PERSONALIDAD
        else if (q.includes('quien es') || q.includes('rafa')) {
            responseContent = "Gran Rafa es el alma de este restaurante. 👨‍🍳 Un apasionado por la cocina tradicional de mar con años de experiencia consintiendo a los caucasianos."
        }
        else if (q.includes('historia') || q.includes('tradicion') || q.includes('años')) {
            responseContent = "Pargo Rojo nació del amor por la cocina de mar. Llevamos años siendo el punto de encuentro favorito en Caucasia gracias a nuestra sazón única. 🌊"
        }
        else if (q.includes('trabajo') || q.includes('empleo') || q.includes('hoja de vida')) {
            responseContent = "¡Siempre buscamos talento! Envía tu hoja de vida a contacto@pargorojo.com o déjala físicamente en el local. 📄"
        }
        else if (q.includes('queja') || q.includes('reclamo') || q.includes('malo')) {
            responseContent = "Lamentamos mucho si algo no salió bien. Por favor, habla con el capitán de meseros o escríbenos a nuestro WhatsApp para solucionarlo de inmediato. Queremos que seas feliz. 🙏"
        }
        else if (q.includes('gracias') || q.includes('chao') || q.includes('adios')) {
            responseContent = "¡Con gusto! Aquí estaré siempre que me necesites. ¡Que tengas un día excelente! 😊🐟"
        }
        else if (q.includes('chiste') || q.includes('risa')) {
            responseContent = "¿Por qué los peces no usan computadora? ¡Porque les da miedo la red! 😆 ¡Espero que te haya gustado!"
        }

        // 6. FALLBACK INTELIGENTE (PRODUCTOS Y GENERAL)
        else {
            const { data: found } = await supabase.from('products').select('name, price, description').ilike('name', `%${q}%`).eq('is_available', true).limit(2)
            if (found && found.length > 0) {
                responseContent = (
                    <div className="space-y-3">
                        <p className="font-bold">✅ Mira lo que encontré:</p>
                        {found.map((p, i) => (
                            <div key={i} className="bg-slate-50 p-3 rounded-xl border border-primary/20">
                                <p className="font-black text-sm uppercase italic">{p.name}</p>
                                <p className="font-black text-primary">${p.price.toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                )
            } else if (q.includes('horario') || q.includes('abierto') || q.includes('abre')) {
                responseContent = "Estamos abiertos todos los días de 11:00 AM a 10:00 PM. ¡Te esperamos para el almuerzo o la cena! 🕙"
            } else if (q.includes('ubicacion') || q.includes('direccion') || q.includes('donde')) {
                responseContent = (
                    <div className="flex flex-col gap-2">
                        <span className="font-bold">📍 Nuestra ubicación:</span>
                        <span className="text-xs">{businessInfo?.address || "C.Cial. Cauca Centro, Caucasia"}</span>
                        <a href={`https://maps.google.com/?q=${businessInfo?.address || "Pargo Rojo Caucasia"}`} target="_blank" rel="noreferrer" className="bg-slate-900 text-white px-3 py-2 rounded-lg text-center text-[10px] font-bold uppercase tracking-widest mt-1">Abrir Google Maps</a>
                    </div>
                )
            } else if (q.includes('menu') || q.includes('carta') || q.includes('platos') || q.includes('recomienda') || q.includes('sugerencia')) {
                const { data: suggestions } = await supabase.from('products').select('name, price').eq('is_available', true).limit(3)
                if (suggestions) {
                    responseContent = (
                        <div className="space-y-2">
                            <p className="font-bold">✨ Recomendados:</p>
                            {suggestions.map((p, i) => <div key={i} className="flex justify-between text-xs bg-slate-50 p-2 rounded-lg border border-slate-100"><span className="font-medium uppercase">{p.name}</span><span className="font-black text-primary">${p.price.toLocaleString()}</span></div>)}
                        </div>
                    )
                }
            }
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
                <div className="fixed bottom-0 right-0 md:bottom-28 md:right-8 w-full md:w-[380px] h-full md:h-[550px] md:max-h-[calc(100vh-140px)] bg-white md:rounded-3xl shadow-3xl z-[100] flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in border border-gray-100 font-sans">

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
                            { icon: Search, label: "Mi Pedido", val: "consultar mi pedido" },
                            { icon: MapPin, label: "Ubicación", val: "ubicacion" },
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
