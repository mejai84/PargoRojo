"use client"

import {
    Users,
    Search,
    ShoppingBag,
    Phone,
    Loader2,
    Star,
    TrendingUp,
    Zap,
    ShieldCheck,
    Mail,
    Calendar,
    ArrowUpRight,
    MessageSquare,
    MoreHorizontal,
    Filter,
    Send,
    MessageCircle,
    Bell,
    CheckCircle2,
    Settings2,
    X
} from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { formatPrice } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface Customer {
    id?: string
    name: string
    email?: string
    phone: string
    totalOrders: number
    totalSpent: number
    lastOrder: string
    points: number
    type: 'user' | 'guest'
}

interface PendingNotification {
    id: string
    phone: string
    content: string
    template_slug: string
    created_at: string
    customer_name?: string
}

export default function CustomersPage() {
    const [view, setView] = useState<'database' | 'loyalty' | 'notifications'>('database')
    const [customers, setCustomers] = useState<Customer[]>([])
    const [notifications, setNotifications] = useState<PendingNotification[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    const fetchInitialData = async () => {
        setLoading(true)
        const { data: profiles } = await supabase.from('profiles').select('*')
        const { data: orders } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
        const { data: pendingNotifs } = await supabase.from('customer_notifications').select('*, profiles!customer_id(full_name)').eq('status', 'pending')

        if (orders) {
            const customerMap = new Map<string, Customer>()
            orders.forEach(order => {
                const userId = order.user_id
                const guestName = order.guest_info?.name
                const guestPhone = order.guest_info?.phone
                const key = userId || `${guestName}-${guestPhone}`

                if (!customerMap.has(key)) {
                    const profile = userId ? profiles?.find(p => p.id === userId) : null
                    customerMap.set(key, {
                        id: userId,
                        name: profile?.full_name || guestName || "Desconocido",
                        email: profile?.email || null,
                        phone: profile?.phone || guestPhone || "Sin teléfono",
                        totalOrders: 0,
                        totalSpent: 0,
                        lastOrder: order.created_at,
                        points: profile?.loyalty_points || 0,
                        type: userId ? 'user' : 'guest'
                    })
                }
                const customer = customerMap.get(key)!
                customer.totalOrders += 1
                customer.totalSpent += Number(order.total || 0)
            })
            setCustomers(Array.from(customerMap.values()))
        }

        if (pendingNotifs) setNotifications(pendingNotifs.map(n => ({ ...n, customer_name: n.profiles?.full_name })))
        setLoading(false)
    }

    useEffect(() => { fetchInitialData() }, [])

    const sendWhatsApp = async (notif: PendingNotification) => {
        const text = encodeURIComponent(notif.content)
        const phone = notif.phone.replace(/\D/g, '')
        window.open(`https://wa.me/${phone}?text=${text}`, '_blank')

        // Mark as sent
        await supabase.from('customer_notifications').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', notif.id)
        fetchInitialData()
    }

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-12 animate-in fade-in duration-700">

            {/* 👑 PREMIUM CRM HEADER */}
            <div className="relative group rounded-[3rem] overflow-hidden bg-[#0a0a0a] border border-white/5 p-8 md:p-12 shadow-3xl">
                <div className="absolute top-0 right-0 w-1/4 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
                <div className="relative z-10 flex flex-col lg:flex-row justify-between lg:items-center gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-primary/20 text-primary text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-2 italic">
                                <Users className="w-3 h-3" /> CRM INTELLIGENCE
                            </span>
                            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest italic">{customers.length} Registros Activos</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-white leading-none">
                            CUSTOMER <span className="text-primary italic">ELITE</span>
                        </h1>
                        <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em] flex items-center gap-4">
                            Gestión avanzada de fidelización y experiencia multicanal
                        </p>
                    </div>

                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 font-black italic">
                        <button onClick={() => setView('database')} className={cn("px-6 py-3 rounded-xl text-[9px] uppercase tracking-widest transition-all", view === 'database' ? "bg-primary text-black" : "text-gray-500 hover:text-white")}>BASE DE DATOS</button>
                        <button onClick={() => setView('notifications')} className={cn("px-6 py-3 rounded-xl text-[9px] uppercase tracking-widest transition-all relative", view === 'notifications' ? "bg-primary text-black" : "text-gray-500 hover:text-white")}>
                            NOTIFICACIONES
                            {notifications.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[8px] flex items-center justify-center border-2 border-black animate-bounce">{notifications.length}</span>}
                        </button>
                    </div>
                </div>
            </div>

            {view === 'database' ? (
                <>
                    {/* 🔍 SEARCH & KPI BAR */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 relative group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-700 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="FILTRAR POR NOMBRE, EMAIL O TELÉFONO..."
                                className="w-full h-18 bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] pl-16 pr-6 outline-none focus:border-primary/50 text-xs font-black italic uppercase tracking-widest placeholder:text-gray-800 transition-all font-mono"
                            />
                        </div>
                        <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-4 flex items-center justify-around translate-y-0 hover:-translate-y-1 transition-transform">
                            <div className="text-center">
                                <p className="text-[8px] font-bold text-gray-600 uppercase mb-1">Puntos Totales</p>
                                <p className="text-xl font-black text-white italic">{customers.reduce((a, b) => a + b.points, 0).toLocaleString()}</p>
                            </div>
                            <div className="w-px h-10 bg-white/5" />
                            <div className="text-center">
                                <p className="text-[8px] font-bold text-gray-600 uppercase mb-1">Ticket Promedio</p>
                                <p className="text-xl font-black text-primary italic">{formatPrice(customers.reduce((a, b) => a + b.totalSpent, 0) / (customers.length || 1))}</p>
                            </div>
                        </div>
                    </div>

                    {/* 👥 CUSTOMERS INDUSTRIAL LIST */}
                    <div className="bg-[#111]/40 backdrop-blur-md border border-white/5 rounded-[3.5rem] overflow-hidden shadow-3xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white/5 text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 italic">
                                        <th className="p-8">Identidad del Usuario</th>
                                        <th className="p-8">Jerarquía</th>
                                        <th className="p-8 text-center">Nivel Loyalty</th>
                                        <th className="p-8 text-center">Frecuencia</th>
                                        <th className="p-8 text-right">Lifetime Value</th>
                                        <th className="p-8 text-right">Acciones Tácticas</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/2">
                                    {filteredCustomers.map((customer, i) => (
                                        <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="p-8">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-xl font-black text-primary italic group-hover:bg-primary group-hover:text-black transition-all">
                                                        {customer.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-xl italic uppercase tracking-tighter text-white">{customer.name}</p>
                                                        <div className="flex items-center gap-4 mt-2">
                                                            <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-1.5"><Mail className="w-3 h-3" /> {customer.email || '—'}</span>
                                                            <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-1.5"><Phone className="w-3 h-3 text-primary" /> {customer.phone}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-8">
                                                <div className={cn(
                                                    "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest italic border",
                                                    customer.type === 'user' ? "bg-primary/10 border-primary/20 text-primary" : "bg-white/5 border-white/10 text-gray-500"
                                                )}>
                                                    {customer.type === 'user' && <ShieldCheck className="w-3 h-3" />}
                                                    {customer.type === 'user' ? 'MEMBRESÍA' : 'INVITADO'}
                                                </div>
                                            </td>
                                            <td className="p-8 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className="flex items-center gap-1.5 text-amber-500 font-black italic">
                                                        <Star className="w-4 h-4 fill-amber-500" />
                                                        <span className="text-xl">{customer.points}</span>
                                                    </div>
                                                    <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest">PUNTOS RAFITA</span>
                                                </div>
                                            </td>
                                            <td className="p-8 text-center">
                                                <div className="inline-block px-5 py-2 bg-white/2 rounded-2xl border border-white/5 hover:border-primary/20 transition-all">
                                                    <span className="text-xl font-black italic text-white">{customer.totalOrders}</span>
                                                    <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest ml-2 italic">Visitas</span>
                                                </div>
                                            </td>
                                            <td className="p-8 text-right">
                                                <p className="text-2xl font-black italic tracking-tighter text-primary leading-none group-hover:scale-110 transition-transform origin-right">{formatPrice(customer.totalSpent)}</p>
                                                <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest mt-2 flex items-center justify-end gap-1.5"><Calendar className="w-3 h-3" /> {customer.lastOrder !== 'Sin pedidos' ? new Date(customer.lastOrder).toLocaleDateString() : '—'}</p>
                                            </td>
                                            <td className="p-8 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white hover:text-black transition-all shadow-xl"><MessageSquare className="w-4 h-4" /></button>
                                                    <button className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-black transition-all"><Send className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                /* 📱 WHATSAPP EXPERIENCE LOOP - NOTIFICATION CENTER */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in slide-in-from-bottom-5 duration-500">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">COLA DE <span className="text-primary text-3xl">MENSAJERÍA</span></h2>
                            <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[9px] font-black text-emerald-400 uppercase tracking-widest italic">
                                <Zap className="w-3 h-3" /> Motor de fidelización activo
                            </div>
                        </div>

                        {notifications.length === 0 ? (
                            <div className="p-20 bg-[#0a0a0a] border border-white/5 rounded-[3rem] text-center space-y-4">
                                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto opacity-20" />
                                <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em]">Todas las notificaciones han sido procesadas</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {notifications.map(notif => (
                                    <div key={notif.id} className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center gap-8 hover:border-primary/20 transition-all group">
                                        <div className="w-20 h-20 rounded-[1.5rem] bg-white/5 flex items-center justify-center shrink-0 border border-white/5 group-hover:bg-primary/10 transition-all">
                                            <MessageCircle className="w-10 h-10 text-primary" />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-xl font-black italic uppercase text-white tracking-tighter">{notif.customer_name || 'Nuevo Cliente'}</p>
                                                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{notif.phone}</p>
                                                </div>
                                                <span className="px-3 py-1 bg-white/5 rounded-full text-[8px] font-black text-gray-500 uppercase tracking-widest italic">{notif.template_slug}</span>
                                            </div>
                                            <div className="p-4 bg-black rounded-2xl border border-white/5 text-[11px] font-bold italic text-gray-500 mt-2">
                                                "{notif.content}"
                                            </div>
                                        </div>
                                        <Button onClick={() => sendWhatsApp(notif)} className="h-20 w-full md:w-32 bg-primary text-black rounded-2xl font-black flex flex-col items-center justify-center gap-2 hover:bg-white transition-all">
                                            <Send className="w-6 h-6" />
                                            <span className="text-[8px] uppercase tracking-widest">DESPACHAR</span>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sidebar: Templates & Status */}
                    <div className="space-y-8">
                        <div className="p-8 bg-white/5 rounded-[3rem] border border-white/5 space-y-6">
                            <h3 className="text-sm font-black uppercase italic tracking-widest text-white border-b border-white/5 pb-4">PLANTILLAS AUTOMÁTICAS</h3>
                            <div className="space-y-4">
                                {['Bienvenida', 'Puntos Earned', 'Encuesta NPS', 'Orden Lista'].map(t => (
                                    <div key={t} className="flex items-center justify-between p-4 bg-black rounded-2xl border border-white/5 group hover:border-primary/20 transition-all cursor-pointer">
                                        <span className="text-[10px] font-black text-gray-400 group-hover:text-white uppercase italic">{t}</span>
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    </div>
                                ))}
                            </div>
                            <Button variant="ghost" className="w-full h-14 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest italic gap-2 hover:bg-white hover:text-black transition-all">
                                <Settings2 className="w-4 h-4" /> CONFIGURAR MOTOR
                            </Button>
                        </div>

                        <div className="p-8 bg-primary/5 rounded-[3rem] border border-primary/10 relative overflow-hidden group">
                            <div className="absolute -bottom-6 -right-6 opacity-5 group-hover:scale-110 transition-transform"><TrendingUp className="w-40 h-40 text-primary" /></div>
                            <h3 className="text-[10px] font-black uppercase text-primary tracking-widest mb-4 italic">INSIGHT DEL DÍA</h3>
                            <p className="text-lg font-black italic uppercase tracking-tighter text-white mb-2">TASA DE APERTURA: 98%</p>
                            <p className="text-xs font-bold text-gray-600 leading-tight">La mensajería multicanal ha incrementado la recompra en un 12.5% esta semana.</p>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
            `}</style>
        </div>
    )
}
