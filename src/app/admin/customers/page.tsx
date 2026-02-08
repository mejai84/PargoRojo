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
    CheckCircle2,
    Settings2,
    X
} from "lucide-react"
import { Button } from "@/components/ui/button"
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

interface WhatsAppTemplate {
    id: string
    slug: string
    name: string
    content: string
    variables: string[]
    is_active: boolean
}

export default function CustomersPage() {
    const [view, setView] = useState<'database' | 'loyalty' | 'notifications'>('database')
    const [customers, setCustomers] = useState<Customer[]>([])
    const [notifications, setNotifications] = useState<PendingNotification[]>([])
    const [templates, setTemplates] = useState<WhatsAppTemplate[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    // Modal State
    const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null)
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)

    const fetchInitialData = async () => {
        setLoading(true)
        const { data: profiles } = await supabase.from('profiles').select('*')
        const { data: orders } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
        const { data: pendingNotifs } = await supabase.from('customer_notifications').select('*, profiles!customer_id(full_name)').eq('status', 'pending')
        const { data: templateData } = await supabase.from('whatsapp_templates').select('*').order('name')

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
        if (templateData) setTemplates(templateData)
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

    const handleUpdateTemplate = async () => {
        if (!editingTemplate) return
        try {
            const { error } = await supabase
                .from('whatsapp_templates')
                .update({ content: editingTemplate.content, is_active: editingTemplate.is_active })
                .eq('id', editingTemplate.id)

            if (error) throw error
            setIsTemplateModalOpen(false)
            fetchInitialData()
        } catch (e: any) {
            alert("Error: " + e.message)
        }
    }

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-12 animate-in fade-in duration-700 font-sans text-slate-900">

            {/* 👑 PREMIUM CRM HEADER */}
            <div className="relative group rounded-[3rem] overflow-hidden bg-slate-50 border border-slate-200 p-8 md:p-12 shadow-sm">
                <div className="absolute top-0 right-0 w-1/4 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
                <div className="relative z-10 flex flex-col lg:flex-row justify-between lg:items-center gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-primary/20 text-primary text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-2 italic">
                                <Users className="w-3 h-3" /> CRM INTELLIGENCE
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{customers.length} Registros Activos</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
                            CUSTOMER <span className="text-primary italic">ELITE</span>
                        </h1>
                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] flex items-center gap-4">
                            Gestión avanzada de fidelización y experiencia multicanal
                        </p>
                    </div>

                    <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 font-black italic">
                        <button onClick={() => setView('database')} className={cn("px-6 py-3 rounded-xl text-[9px] uppercase tracking-widest transition-all", view === 'database' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-900")}>BASE DE DATOS</button>
                        <button onClick={() => setView('notifications')} className={cn("px-6 py-3 rounded-xl text-[9px] uppercase tracking-widest transition-all relative", view === 'notifications' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-900")}>
                            NOTIFICACIONES
                            {notifications.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[8px] flex items-center justify-center border-2 border-white animate-bounce">{notifications.length}</span>}
                        </button>
                    </div>
                </div>
            </div>

            {view === 'database' ? (
                <>
                    {/* 🔍 SEARCH & KPI BAR */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 relative group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="FILTRAR POR NOMBRE, EMAIL O TELÉFONO..."
                                className="w-full h-18 bg-white border border-slate-200 rounded-[2.5rem] pl-16 pr-6 outline-none focus:border-primary/50 text-xs font-black italic uppercase tracking-widest placeholder:text-slate-300 transition-all font-mono shadow-sm"
                            />
                        </div>
                        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-4 flex items-center justify-around translate-y-0 hover:-translate-y-1 transition-transform shadow-sm">
                            <div className="text-center">
                                <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Puntos Totales</p>
                                <p className="text-xl font-black text-slate-900 italic">{customers.reduce((a, b) => a + b.points, 0).toLocaleString()}</p>
                            </div>
                            <div className="w-px h-10 bg-slate-100" />
                            <div className="text-center">
                                <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Ticket Promedio</p>
                                <p className="text-xl font-black text-primary italic">{formatPrice(customers.reduce((a, b) => a + b.totalSpent, 0) / (customers.length || 1))}</p>
                            </div>
                        </div>
                    </div>

                    {/* 👥 CUSTOMERS INDUSTRIAL LIST */}
                    <div className="bg-white border border-slate-200 rounded-[3.5rem] overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 italic">
                                        <th className="p-4 md:p-8">Identidad del Usuario</th>
                                        <th className="p-4 md:p-8 hidden md:table-cell">Jerarquía</th>
                                        <th className="p-4 md:p-8 text-center hidden sm:table-cell">Nivel Loyalty</th>
                                        <th className="p-4 md:p-8 text-center hidden lg:table-cell">Frecuencia</th>
                                        <th className="p-4 md:p-8 text-right">Lifetime Value</th>
                                        <th className="p-4 md:p-8 text-right hidden lg:table-cell">Acciones Tácticas</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredCustomers.map((customer, i) => (
                                        <tr key={i} className="hover:bg-slate-50 transition-colors group border-b border-slate-100 last:border-0">
                                            <td className="p-4 md:p-8">
                                                <div className="flex items-center gap-3 md:gap-6">
                                                    <div className="w-10 h-10 md:w-14 md:h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-sm md:text-xl font-black text-primary italic group-hover:bg-primary group-hover:text-black transition-all shrink-0">
                                                        {customer.name.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-black text-sm md:text-xl italic uppercase tracking-tighter text-slate-900 truncate">{customer.name}</p>
                                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1 md:mt-2">
                                                            <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 overflow-hidden text-ellipsis"><Mail className="w-2.5 h-2.5 md:w-3 md:h-3" /> <span className="truncate">{customer.email || '—'}</span></span>
                                                            <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Phone className="w-2.5 h-2.5 md:w-3 md:h-3 text-primary" /> {customer.phone}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 md:p-8 hidden md:table-cell">
                                                <div className={cn(
                                                    "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest italic border",
                                                    customer.type === 'user' ? "bg-primary/10 border-primary/20 text-primary" : "bg-slate-50 border-slate-100 text-slate-400"
                                                )}>
                                                    {customer.type === 'user' && <ShieldCheck className="w-3 h-3" />}
                                                    {customer.type === 'user' ? 'MEMBRESÍA' : 'INVITADO'}
                                                </div>
                                            </td>
                                            <td className="p-4 md:p-8 text-center hidden sm:table-cell">
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className="flex items-center gap-1.5 text-amber-500 font-black italic">
                                                        <Star className="w-3 h-3 md:w-4 md:h-4 fill-amber-500" />
                                                        <span className="text-base md:text-xl">{customer.points}</span>
                                                    </div>
                                                    <span className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest">PUNTOS</span>
                                                </div>
                                            </td>
                                            <td className="p-4 md:p-8 text-center hidden lg:table-cell">
                                                <div className="inline-block px-5 py-2 bg-slate-50 rounded-2xl border border-slate-100 hover:border-primary/20 transition-all">
                                                    <span className="text-xl font-black italic text-slate-900">{customer.totalOrders}</span>
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Visitas</span>
                                                </div>
                                            </td>
                                            <td className="p-4 md:p-8 text-right">
                                                <p className="text-base md:text-2xl font-black italic tracking-tighter text-primary leading-none group-hover:scale-110 transition-transform origin-right">{formatPrice(customer.totalSpent)}</p>
                                                <p className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 md:mt-2 flex items-center justify-end gap-1.5"><Calendar className="w-2.5 h-2.5 md:w-3 md:h-3" /> {customer.lastOrder !== 'Sin pedidos' ? new Date(customer.lastOrder).toLocaleDateString() : '—'}</p>
                                            </td>
                                            <td className="p-4 md:p-8 text-right hidden lg:table-cell">
                                                <div className="flex justify-end gap-2">
                                                    <button className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all shadow-sm text-slate-400"><MessageSquare className="w-3.5 h-3.5" /></button>
                                                    <button className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-black transition-all"><Send className="w-3.5 h-3.5" /></button>
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
                            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">COLA DE <span className="text-primary text-3xl">MENSAJERÍA</span></h2>
                            <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[9px] font-black text-emerald-600 uppercase tracking-widest italic">
                                <Zap className="w-3 h-3" /> Motor de fidelización activo
                            </div>
                        </div>

                        {notifications.length === 0 ? (
                            <div className="p-20 bg-white border border-slate-200 rounded-[3rem] text-center space-y-4">
                                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto opacity-20" />
                                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">Todas las notificaciones han sido procesadas</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {notifications.map(notif => (
                                    <div key={notif.id} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center gap-8 hover:border-primary/20 transition-all group shadow-sm">
                                        <div className="w-20 h-20 rounded-[1.5rem] bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 group-hover:bg-primary/10 transition-all">
                                            <MessageCircle className="w-10 h-10 text-primary" />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-xl font-black italic uppercase text-slate-900 tracking-tighter">{notif.customer_name || 'Nuevo Cliente'}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{notif.phone}</p>
                                                </div>
                                                <span className="px-3 py-1 bg-slate-50 rounded-full text-[8px] font-black text-slate-400 uppercase tracking-widest italic">{notif.template_slug}</span>
                                            </div>
                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] font-bold italic text-slate-500 mt-2">
                                                "{notif.content}"
                                            </div>
                                        </div>
                                        <Button onClick={() => sendWhatsApp(notif)} className="h-20 w-full md:w-32 bg-primary text-black rounded-2xl font-black flex flex-col items-center justify-center gap-2 hover:bg-slate-900 hover:text-white transition-all">
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
                        <div className="p-8 bg-white border border-slate-200 rounded-[3rem] space-y-6 shadow-sm">
                            <h3 className="text-sm font-black uppercase italic tracking-widest text-slate-900 border-b border-slate-100 pb-4">PLANTILLAS AUTOMÁTICAS</h3>
                            <div className="space-y-4">
                                {templates.map(t => (
                                    <div
                                        key={t.id}
                                        onClick={() => { setEditingTemplate(t); setIsTemplateModalOpen(true); }}
                                        className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-primary/20 transition-all cursor-pointer"
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 group-hover:text-slate-900 uppercase italic leading-none">{t.name}</span>
                                            <span className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">Motor: {t.slug}</span>
                                        </div>
                                        <div className={cn("w-2 h-2 rounded-full", t.is_active ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
                                    </div>
                                ))}
                            </div>
                            <Button
                                onClick={() => { setEditingTemplate(templates[0]); setIsTemplateModalOpen(true); }}
                                variant="ghost"
                                className="w-full h-14 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest italic gap-2 hover:bg-slate-900 hover:text-white transition-all text-slate-500"
                            >
                                <Settings2 className="w-4 h-4" /> CONFIGURAR MOTOR
                            </Button>
                        </div>

                        <div className="p-8 bg-primary/5 rounded-[3rem] border border-primary/10 relative overflow-hidden group">
                            <div className="absolute -bottom-6 -right-6 opacity-5 group-hover:scale-110 transition-transform"><TrendingUp className="w-40 h-40 text-primary" /></div>
                            <h3 className="text-[10px] font-black uppercase text-primary tracking-widest mb-4 italic">INSIGHT DEL DÍA</h3>
                            <p className="text-lg font-black italic uppercase tracking-tighter text-slate-900 mb-2">TASA DE APERTURA: 98%</p>
                            <p className="text-xs font-bold text-slate-500 leading-tight">La mensajería multicanal ha incrementado la recompra en un 12.5% esta semana.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* 🛠️ MODAL CONFIGURACIÓN DE PLANTILLA */}
            {isTemplateModalOpen && editingTemplate && (
                <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="text-xl font-black italic uppercase tracking-tighter">Editar Plantilla <span className="text-primary">{editingTemplate.name}</span></h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Identificador: {editingTemplate.slug}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setIsTemplateModalOpen(false)} className="rounded-2xl">
                                <X className="w-6 h-6" />
                            </Button>
                        </div>
                        <div className="p-10 space-y-8">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Contenido del Mensaje</h4>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[8px] font-black uppercase text-slate-400">Estado:</span>
                                        <button
                                            onClick={() => setEditingTemplate({ ...editingTemplate, is_active: !editingTemplate.is_active })}
                                            className={cn(
                                                "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest italic transition-all",
                                                editingTemplate.is_active ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-slate-100 text-slate-400 border border-slate-200"
                                            )}
                                        >
                                            {editingTemplate.is_active ? 'Activo' : 'Inactivo'}
                                        </button>
                                    </div>
                                </div>
                                <textarea
                                    value={editingTemplate.content}
                                    onChange={(e) => setEditingTemplate({ ...editingTemplate, content: e.target.value })}
                                    className="w-full h-40 bg-slate-50 border border-slate-200 rounded-[2rem] p-6 text-sm font-bold italic text-slate-700 outline-none focus:border-primary/50 transition-all font-sans"
                                    placeholder="Escribe el mensaje aquí..."
                                />
                                <div className="flex flex-wrap gap-2">
                                    {editingTemplate.variables?.map(v => (
                                        <span key={v} className="px-2 py-1 bg-slate-100 rounded-md text-[8px] font-mono text-slate-500">{"{{" + v + "}}"}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="p-6 bg-amber-50 rounded-2xl border border-amber-200/50 flex gap-4">
                                <Zap className="w-6 h-6 text-amber-500 shrink-0" />
                                <p className="text-[10px] font-bold text-amber-900 leading-relaxed italic">
                                    Estas plantillas son despachadas automáticamente a la cola de notificaciones cuando ocurren ciertos triggers en el sistema. Puedes pre-estructurar el mensaje usando variables.
                                </p>
                            </div>
                        </div>
                        <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                            <Button
                                onClick={handleUpdateTemplate}
                                className="flex-1 h-14 bg-primary text-black hover:bg-slate-900 hover:text-white font-black rounded-2xl gap-2 uppercase text-xs tracking-widest italic"
                            >
                                <CheckCircle2 className="w-5 h-5" /> GUARDAR CONFIGURACIÓN
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setIsTemplateModalOpen(false)}
                                className="px-8 h-14 border-slate-200 text-slate-500 font-black rounded-2xl uppercase text-xs tracking-widest italic"
                            >
                                CANCELAR
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
            `}</style>
        </div>
    )
}
