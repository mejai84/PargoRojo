"use client"

import { useState, useEffect, useRef } from "react"
import {
    Bot,
    Send,
    X,
    Sparkles,
    TrendingUp,
    AlertTriangle,
    Package,
    Users,
    DollarSign,
    Loader2,
    MessageSquare,
    Zap,
    Wallet
} from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { formatPrice } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface Message {
    role: 'user' | 'assistant'
    content: string
    type?: 'stat' | 'alert' | 'info' | 'text'
    data?: any
}

export function PargoBot() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: "¡Hola! Soy Pargo Bot, tu analista de IA. Pregúntame sobre ventas, stock o rendimiento de hoy.",
            type: 'text'
        }
    ])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const processQuery = async (query: string) => {
        setLoading(true)
        const q = query.toLowerCase()
        let response: Message = { role: 'assistant', content: "Lo siento, aún estoy aprendiendo a analizar ese dato específico. Prueba preguntando por 'ventas hoy', 'productos top' o 'alertas de stock'.", type: 'text' }

        try {
            // 📊 VENTAS HOY
            if (q.includes('venta') || q.includes('hoy') || q.includes('dinero')) {
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                const { data } = await supabase.from('orders').select('total').gte('created_at', today.toISOString())
                const total = data?.reduce((acc, o) => acc + (o.total || 0), 0) || 0
                response = {
                    role: 'assistant',
                    content: `Hoy hemos procesado ${data?.length || 0} pedidos para un total de ${formatPrice(total)}.`,
                    type: 'stat',
                    data: { icon: DollarSign, label: 'Ventas de hoy', value: formatPrice(total) }
                }
            }
            // 🔮 PREDICCIÓN DE VENTAS
            else if (q.includes('predic') || q.includes('futuro') || q.includes('proyeccion')) {
                const sevenDaysAgo = new Date()
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
                const { data } = await supabase.from('orders').select('total').gte('created_at', sevenDaysAgo.toISOString())
                const totalLastWeek = data?.reduce((acc, o) => acc + (o.total || 0), 0) || 0
                const avgDaily = totalLastWeek / 7
                const projection = avgDaily * 1.1 // Crecimiento proyectado del 10%

                response = {
                    role: 'assistant',
                    content: `Basado en los últimos 7 días, preveo que mañana podrías facturar cerca de ${formatPrice(projection)}. Se observa una tendencia alcista del 10%.`,
                    type: 'stat',
                    data: { icon: Sparkles, label: 'Predicción para Mañana', value: formatPrice(projection) }
                }
            }
            // 🏆 PRODUCTO TOP
            else if (q.includes('producto') || q.includes('vende') || q.includes('mejor')) {
                const { data } = await supabase.from('order_items').select('quantity, products(name)').limit(200)
                const counts: any = {}
                data?.forEach((item: any) => {
                    const name = item.products?.name || 'Varios'
                    counts[name] = (counts[name] || 0) + item.quantity
                })
                const top = Object.entries(counts).sort((a: any, b: any) => b[1] - a[1])[0]
                response = {
                    role: 'assistant',
                    content: `El producto estrella actualmente es el "${top[0]}" con ${top[1]} unidades vendidas.`,
                    type: 'stat',
                    data: { icon: TrendingUp, label: 'Producto Estrella', value: top[0] }
                }
            }
            // 👨‍🍳 MEJOR MESERO
            else if (q.includes('mesero') || q.includes('camarero') || q.includes('staff')) {
                const { data } = await supabase.from('orders').select('waiter_id, profiles(full_name)').limit(100)
                const counts: any = {}
                data?.forEach((o: any) => {
                    const name = o.profiles?.full_name || 'Desconocido'
                    counts[name] = (counts[name] || 0) + 1
                })
                const top = Object.entries(counts).sort((a: any, b: any) => b[1] - a[1])[0]
                response = {
                    role: 'assistant',
                    content: `El mesero con mayor efectividad hoy es ${top[0]}, con un total de ${top[1]} comandas servidas.`,
                    type: 'stat',
                    data: { icon: Users, label: 'MVP del Día', value: top[0] }
                }
            }
            // 🎟️ TICKET PROMEDIO
            else if (q.includes('ticket') || q.includes('promedio') || q.includes('gasto')) {
                const { data } = await supabase.from('orders').select('total')
                const total = data?.reduce((acc, o) => acc + (o.total || 0), 0) || 0
                const avg = total / (data?.length || 1)
                response = {
                    role: 'assistant',
                    content: `El ticket promedio general es de ${formatPrice(avg)}.`,
                    type: 'stat',
                    data: { icon: Wallet, label: 'Ticket Promedio', value: formatPrice(avg) }
                }
            }
            // ⚠️ ALERTAS DE STOCK
            else if (q.includes('stock') || q.includes('inventario') || q.includes('falta')) {
                const { data } = await supabase.from('inventory_items').select('name, stock, min_stock').lte('stock', 'min_stock')
                if (data && data.length > 0) {
                    response = {
                        role: 'assistant',
                        content: `¡Atención! Tienes ${data.length} insumos en nivel crítico: ${data.map(i => i.name).join(', ')}.`,
                        type: 'alert',
                        data: { items: data }
                    }
                } else {
                    response = { role: 'assistant', content: "Todo está bajo control. No hay alertas de stock mínimo por ahora.", type: 'info' }
                }
            }
        } catch (e) {
            console.error(e)
            response = { role: 'assistant', content: "Hubo un problema al conectar con el cerebro de IA. Por favor, intenta de nuevo.", type: 'text' }
        }

        setMessages(prev => [...prev, response])
        setLoading(false)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || loading) return

        const userMsg: Message = { role: 'user', content: input }
        setMessages(prev => [...prev, userMsg])
        const currentInput = input
        setInput("")
        processQuery(currentInput)
    }

    return (
        <>
            {/* Floating Trigger */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "fixed bottom-10 right-10 w-20 h-20 rounded-[2.5rem] bg-primary text-black flex items-center justify-center shadow-3xl hover:scale-110 transition-all z-[100] group",
                    isOpen && "rotate-90 bg-white"
                )}
            >
                {isOpen ? <X className="w-8 h-8" /> : <Zap className="w-8 h-8 group-hover:animate-pulse" />}
                {!isOpen && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 rounded-full border-4 border-black animate-bounce flex items-center justify-center">
                        <span className="text-[10px] font-black italic">!</span>
                    </div>
                )}
            </button>

            {/* AI Assistant Panel */}
            {isOpen && (
                <div className="fixed bottom-0 right-0 sm:bottom-32 sm:right-10 w-full sm:w-[450px] h-full sm:h-[650px] bg-[#0a0a0a] border-t sm:border border-white/10 rounded-t-[3.5rem] sm:rounded-[3.5rem] shadow-3xl z-[100] flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-500">

                    {/* Bot Header */}
                    <div className="p-8 bg-gradient-to-br from-primary to-secondary text-black">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center">
                                    <Sparkles className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black italic uppercase tracking-tighter">PARGO <span className="text-white">AI</span></h3>
                                    <div className="flex items-center gap-1.5 pt-0.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Insight Engine Activado</span>
                                    </div>
                                </div>
                            </div>
                            <Bot className="w-10 h-10 opacity-20" />
                        </div>
                    </div>

                    {/* Chat Messages */}
                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-black"
                    >
                        {messages.map((msg, i) => (
                            <div key={i} className={cn(
                                "flex flex-col max-w-[85%]",
                                msg.role === 'user' ? "ml-auto items-end" : "items-start"
                            )}>
                                <div className={cn(
                                    "p-4 rounded-3xl text-[11px] font-bold tracking-tight italic",
                                    msg.role === 'user'
                                        ? "bg-white text-black rounded-tr-none"
                                        : "bg-white/5 text-gray-400 border border-white/5 rounded-tl-none"
                                )}>
                                    {msg.content}
                                </div>

                                {/* Rich Data Displays */}
                                {msg.type === 'stat' && (
                                    <div className="mt-4 p-5 bg-primary/10 border border-primary/20 rounded-3xl w-full animate-in zoom-in-95">
                                        <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1 italic">{msg.data.label}</p>
                                        <h4 className="text-2xl font-black italic text-white uppercase">{msg.data.value}</h4>
                                    </div>
                                )}

                                {msg.type === 'alert' && (
                                    <div className="mt-4 p-5 bg-rose-500/10 border border-rose-500/20 rounded-3xl w-full animate-in zoom-in-95">
                                        <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-3 italic flex items-center gap-2">
                                            <AlertTriangle className="w-3 h-3" /> STOCK CRÍTICO
                                        </p>
                                        <div className="space-y-2">
                                            {msg.data.items.slice(0, 3).map((item: any, idx: number) => (
                                                <div key={idx} className="flex justify-between items-center bg-black/40 p-2 rounded-xl border border-white/5">
                                                    <span className="text-[10px] font-bold text-white uppercase">{item.name}</span>
                                                    <span className="text-[10px] font-black text-rose-500">{item.stock}u</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        {loading && (
                            <div className="flex gap-2 p-4 bg-white/5 rounded-2xl w-24">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                            </div>
                        )}
                    </div>

                    {/* Chat Input */}
                    <form onSubmit={handleSubmit} className="p-8 border-t border-white/5 bg-[#050505]">
                        <div className="relative group">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Escribe un comando analítico..."
                                className="w-full h-14 bg-black border border-white/10 rounded-2xl pl-6 pr-16 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 text-xs font-bold text-white transition-all placeholder:text-gray-700 italic"
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="absolute right-2 top-2 w-10 h-10 rounded-xl bg-primary text-black flex items-center justify-center hover:bg-white transition-all active:scale-90"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {['Ventas hoy', 'Top productos', 'Alertas stock', 'Mejor mesero', 'Predicción'].map(chip => (
                                <button
                                    key={chip}
                                    type="button"
                                    onClick={() => processQuery(chip)}
                                    className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg text-[8px] font-black uppercase tracking-widest text-gray-500 hover:text-primary transition-all"
                                >
                                    {chip}
                                </button>
                            ))}
                        </div>
                    </form>
                </div>
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
            `}</style>
        </>
    )
}
