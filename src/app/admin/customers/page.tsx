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
    X,
    TrendingDown,
    Activity
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

    if (loading && customers.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-muted-foreground font-black uppercase tracking-widest text-xs italic animate-pulse">Sincronizando Base de Datos CRM...</p>
            </div>
        )
    }

    return (
        <div className="space-y-12 animate-in fade-in duration-700 bg-transparent text-foreground p-4 md:p-8">

            {/* 👑 PREMIUM CRM HEADER */}
            <div className="relative group rounded-[3rem] overflow-hidden bg-card border border-border p-8 md:p-12 shadow-xl">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
                <div className="relative z-10 flex flex-col lg:flex-row justify-between lg:items-center gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-2 italic">
                                <Users className="w-3 h-3" /> CRM INTELLIGENCE
                            </span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic">{customers.length} REGISTROS ACTIVOS</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-foreground leading-none">
                            CUSTOMER <span className="text-primary italic">ELITE</span>
                        </h1>
                        <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-[0.3em] flex items-center gap-4 italic opacity-70">
                            Gestión avanzada de fidelización y experiencia multicanal
                        </p>
                    </div>

                    <div className="flex bg-muted/50 p-1.5 rounded-2xl border border-border font-black italic shadow-inner">
                        <button onClick={() => setView('database')} className={cn("px-8 py-3 rounded-xl text-[9px] uppercase tracking-[0.2em] transition-all duration-300", view === 'database' ? "bg-card text-foreground shadow-lg border border-border/50" : "text-muted-foreground/50 hover:text-foreground")}>BASE DE DATOS</button>
                        <button onClick={() => setView('notifications')} className={cn("px-8 py-3 rounded-xl text-[9px] uppercase tracking-[0.2em] transition-all duration-300 relative", view === 'notifications' ? "bg-card text-foreground shadow-lg border border-border/50" : "text-muted-foreground/50 hover:text-foreground")}>
                            NOTIFICACIONES
                            {notifications.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground rounded-full text-[9px] flex items-center justify-center border-2 border-card animate-bounce shadow-lg">{notifications.length}</span>}
                        </button>
                    </div>
                </div>
            </div>

            {view === 'database' ? (
                <>
                    {/* 🔍 SEARCH & KPI BAR */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-top-4 duration-500">
                        <div className="lg:col-span-2 relative group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="FILTRAR POR NOMBRE, EMAIL O TELÉFONO..."
                                className="w-full h-20 bg-card border border-border rounded-[2.5rem] pl-18 pr-8 outline-none focus:border-primary/50 text-xs font-black italic uppercase tracking-[0.2em] text-foreground placeholder:text-muted-foreground/30 transition-all shadow-xl font-mono"
                            />
                        </div>
                        <div className="bg-card border border-border rounded-[2.5rem] p-6 flex items-center justify-around group hover:border-primary/30 transition-all shadow-xl">
                            <div className="text-center group/kpi">
                                <p className="text-[9px] font-black text-muted-foreground uppercase mb-2 tracking-widest italic">Puntos Totales</p>
                                <p className="text-2xl font-black text-foreground italic tracking-tighter transition-transform group-hover/kpi:scale-110">{customers.reduce((a, b) => a + b.points, 0).toLocaleString()}</p>
                            </div>
                            <div className="w-px h-12 bg-border" />
                            <div className="text-center group/kpi">
                                <p className="text-[9px] font-black text-muted-foreground uppercase mb-2 tracking-widest italic">Ticket Promedio</p>
                                <p className="text-2xl font-black text-primary italic tracking-tighter transition-transform group-hover/kpi:scale-110">{formatPrice(customers.reduce((a, b) => a + b.totalSpent, 0) / (customers.length || 1))}</p>
                            </div>
                        </div>
                    </div>

                    {/* 👥 CUSTOMERS INDUSTRIAL LIST */}
                    <div className="bg-card border border-border rounded-[3rem] shadow-2xl relative overflow-hidden animate-in fade-in duration-1000">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse min-w-[900px]">
                                <thead>
                                    <tr className="bg-muted/30 text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground border-b border-border/50 italic">
                                        <th className="p-8">Identidad del Perfil</th>
                                        <th className="p-8 hidden md:table-cell text-center">Jerarquía CRM</th>
                                        <th className="p-8 text-center hidden sm:table-cell">Loyalty Scoring</th>
                                        <th className="p-8 text-center hidden lg:table-cell">Frecuencia Habitual</th>
                                        <th className="p-8 text-right">Lifetime Value (LTV)</th>
                                        <th className="p-8 text-right hidden lg:table-cell">Acciones de Fidelización</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/30">
                                    {filteredCustomers.map((customer, i) => (
                                        <tr key={i} className="hover:bg-muted/20 transition-all group border-b border-border/10 last:border-0">
                                            <td className="p-8">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-16 h-16 rounded-[1.5rem] bg-muted border border-border flex items-center justify-center text-2xl font-black text-primary italic group-hover:bg-primary group-hover:text-primary-foreground transition-all shrink-0 shadow-sm">
                                                        {customer.name.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-black text-2xl italic uppercase tracking-tighter text-foreground truncate transition-colors group-hover:text-primary">{customer.name}</p>
                                                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-2">
                                                            <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest flex items-center gap-1.5 truncate group-hover:text-muted-foreground transition-colors"><Mail className="w-3.5 h-3.5 opacity-50" /> {customer.email || 'SIN CORREO REGISTRADO'}</span>
                                                            <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest flex items-center gap-1.5 whitespace-nowrap group-hover:text-muted-foreground transition-colors"><Phone className="w-3.5 h-3.5 text-primary" /> {customer.phone}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-8 hidden md:table-cell text-center">
                                                <div className={cn(
                                                    "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest italic border transition-colors",
                                                    customer.type === 'user' ? "bg-primary/10 border-primary/20 text-primary" : "bg-muted text-muted-foreground/50 border-border"
                                                )}>
                                                    {customer.type === 'user' && <ShieldCheck className="w-3 h-3" />}
                                                    {customer.type === 'user' ? 'MEMBRESÍA ACTIVA' : 'INVITADO'}
                                                </div>
                                            </td>
                                            <td className="p-8 text-center hidden sm:table-cell">
                                                <div className="flex flex-col items-center gap-1 group/points">
                                                    <div className="flex items-center gap-2 text-amber-500 font-black italic transition-transform group-hover/points:scale-110">
                                                        <Star className="w-4 h-4 fill-amber-500" />
                                                        <span className="text-2xl tracking-tighter">{customer.points}</span>
                                                    </div>
                                                    <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] italic">PTS ACUMULADOS</span>
                                                </div>
                                            </td>
                                            <td className="p-8 text-center hidden lg:table-cell">
                                                <div className="inline-block px-6 py-3 bg-muted/40 rounded-2xl border border-border group-hover:border-primary/20 transition-all">
                                                    <span className="text-2xl font-black italic text-foreground tracking-tighter">{customer.totalOrders}</span>
                                                    <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest ml-3 italic">Visitas Totales</span>
                                                </div>
                                            </td>
                                            <td className="p-8 text-right">
                                                <p className="text-3xl font-black italic tracking-tighter text-primary leading-none transition-all group-hover:scale-110 origin-right drop-shadow-sm">{formatPrice(customer.totalSpent)}</p>
                                                <p className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mt-3 flex items-center justify-end gap-2 italic"><Calendar className="w-3.5 h-3.5 opacity-50" /> {customer.lastOrder !== 'Sin pedidos' ? `Última: ${new Date(customer.lastOrder).toLocaleDateString()}` : 'SIN ACTIVIDAD RECIENTE'}</p>
                                            </td>
                                            <td className="p-8 text-right hidden lg:table-cell">
                                                <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                    <button
                                                        onClick={() => {
                                                            const phone = customer.phone.replace(/\D/g, '');
                                                            if (phone) window.open(`https://wa.me/${phone}`, '_blank');
                                                        }}
                                                        title="WhatsApp Directo"
                                                        className="w-12 h-12 rounded-2xl bg-muted border border-border flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-sm text-muted-foreground active:scale-95"
                                                    >
                                                        <MessageSquare className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSearchTerm(customer.name);
                                                            setView('notifications');
                                                        }}
                                                        title="Historial de Mensajería"
                                                        className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-all shadow-sm active:scale-95"
                                                    >
                                                        <Send className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredCustomers.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-20 text-center">
                                                <Users className="w-20 h-20 text-muted-foreground/10 mx-auto mb-6" />
                                                <p className="text-muted-foreground/30 font-black uppercase tracking-[0.5em] italic text-sm">Sin coincidencias en el CRM</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                /* 📱 WHATSAPP EXPERIENCE LOOP - NOTIFICATION CENTER */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in slide-in-from-bottom-8 duration-700">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="flex flex-col sm:flex-row items-baseline justify-between gap-4">
                            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-foreground">COLA DE <span className="text-primary text-5xl">COMUNICACIÓN</span></h2>
                            <div className="flex items-center gap-3 px-6 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] italic shadow-inner">
                                <Zap className="w-4 h-4 animate-pulse" /> Motor de fidelización activo y sincronizado
                            </div>
                        </div>

                        {notifications.length === 0 ? (
                            <div className="p-24 bg-card border border-border rounded-[4rem] text-center space-y-6 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/50" />
                                <CheckCircle2 className="w-24 h-24 text-emerald-500 mx-auto opacity-10" />
                                <div className="space-y-2">
                                    <p className="text-foreground/80 font-black uppercase text-xl italic tracking-tight">Bandeja Despejada</p>
                                    <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-[0.3em] italic">Todas las notificaciones tácticas han sido procesadas.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid gap-6">
                                {notifications.map(notif => (
                                    <div key={notif.id} className="bg-card border border-border rounded-[3rem] p-8 flex flex-col md:flex-row items-center gap-10 hover:border-primary/40 transition-all group shadow-2xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-8 opacity-5 text-primary rotate-12 pointer-events-none transition-transform group-hover:scale-125">
                                            <MessageCircle className="w-40 h-40 -mr-16 -mt-16" />
                                        </div>
                                        <div className="w-24 h-24 rounded-[2rem] bg-muted border border-border flex items-center justify-center shrink-0 group-hover:bg-primary/10 group-hover:border-primary/30 transition-all shadow-inner relative z-10">
                                            <MessageCircle className="w-12 h-12 text-primary" />
                                        </div>
                                        <div className="flex-1 space-y-4 relative z-10 w-full">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-3xl font-black italic uppercase text-foreground tracking-tighter group-hover:text-primary transition-colors leading-none">{notif.customer_name || 'Prospecto Nuevo'}</p>
                                                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-2 italic flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-primary" /> {notif.phone}</p>
                                                </div>
                                                <span className="px-4 py-1.5 bg-muted rounded-full text-[9px] font-black text-muted-foreground uppercase tracking-widest italic border border-border/50 shadow-sm">{notif.template_slug}</span>
                                            </div>
                                            <div className="p-6 bg-muted/40 rounded-[2rem] border border-border/50 text-xs font-bold italic text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed shadow-inner font-sans border-l-4 border-l-primary">
                                                "{notif.content}"
                                            </div>
                                        </div>
                                        <Button onClick={() => sendWhatsApp(notif)} className="h-24 w-full md:w-40 bg-foreground text-background rounded-3xl font-black flex flex-col items-center justify-center gap-2 hover:bg-primary hover:text-primary-foreground transition-all shadow-xl active:scale-95 border-none relative z-10">
                                            <Send className="w-6 h-6" />
                                            <span className="text-[9px] uppercase tracking-[0.3em] italic">ENVIAR</span>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sidebar: Templates & Status */}
                    <div className="space-y-8">
                        <div className="p-10 bg-card border border-border rounded-[3rem] space-y-8 shadow-xl">
                            <div className="flex items-center gap-4 border-b border-border pb-6">
                                <Settings2 className="w-6 h-6 text-primary" />
                                <h3 className="text-sm font-black uppercase italic tracking-[0.3em] text-foreground leading-none">MOTOR DE MENSAJERÍA</h3>
                            </div>
                            <div className="space-y-5">
                                {templates.map(t => (
                                    <div
                                        key={t.id}
                                        onClick={() => { setEditingTemplate(t); setIsTemplateModalOpen(true); }}
                                        className="flex items-center justify-between p-5 bg-muted/30 rounded-[2rem] border border-border/50 group hover:border-primary/40 hover:bg-muted/50 transition-all cursor-pointer shadow-sm"
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-black text-muted-foreground group-hover:text-foreground uppercase italic tracking-widest leading-none transition-colors">{t.name}</span>
                                            <span className="text-[8px] font-bold text-muted-foreground/50 mt-2 uppercase tracking-tighter italic">SLUG ID: {t.slug}</span>
                                        </div>
                                        <div className={cn("w-2.5 h-2.5 rounded-full shadow-sm", t.is_active ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/30")} />
                                    </div>
                                ))}
                            </div>
                            <Button
                                onClick={() => {
                                    if (templates && templates.length > 0) {
                                        setEditingTemplate(templates[0]);
                                        setIsTemplateModalOpen(true);
                                    } else {
                                        alert("Configuración de plantillas no inicializada.");
                                    }
                                }}
                                variant="ghost"
                                className="w-full h-16 border-2 border-dashed border-border rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] italic gap-3 hover:bg-muted hover:border-primary/50 transition-all text-muted-foreground hover:text-foreground"
                            >
                                <Settings2 className="w-5 h-5 opacity-40" /> PANEL DE CONFIGURACIÓN
                            </Button>
                        </div>

                        <div className="p-10 bg-primary/5 rounded-[3.5rem] border border-primary/10 relative overflow-hidden group shadow-xl transition-all hover:bg-primary/10">
                            <div className="absolute -bottom-10 -right-10 opacity-5 group-hover:scale-125 transition-transform duration-700 pointer-events-none rotate-12"><Activity className="w-60 h-60 text-primary" /></div>
                            <div className="relative z-10 space-y-5">
                                <div className="flex items-center gap-3">
                                    <TrendingUp className="w-5 h-5 text-primary" />
                                    <h3 className="text-[11px] font-black uppercase text-primary tracking-[0.3em] italic">ANALYTICS INSIGHT</h3>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-3xl font-black italic uppercase tracking-tighter text-foreground leading-none">98.4% APERTURA</p>
                                    <p className="text-[9px] font-black text-primary/60 uppercase tracking-widest italic tracking-[0.2em]">RENDIMIENTO DE CAMPAÑAS</p>
                                </div>
                                <p className="text-xs font-bold text-muted-foreground leading-relaxed italic border-t border-primary/10 pt-4">
                                    La estrategia de mensajería proactiva ha optimizado la tasa de retorno del cliente en un <span className="text-emerald-500 font-black">+14.2%</span> este cuatrimestre.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 🛠️ MODAL CONFIGURACIÓN DE PLANTILLA */}
            {isTemplateModalOpen && editingTemplate && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-card w-full max-w-3xl rounded-[4rem] shadow-3xl overflow-hidden flex flex-col border border-border animate-in zoom-in-95 duration-300 shadow-black/50">
                        <div className="p-11 border-b border-border flex justify-between items-center bg-muted/30">
                            <div className="space-y-2">
                                <h3 className="text-3xl font-black italic uppercase tracking-tighter text-foreground leading-none">Sincronizar Plantilla <span className="text-primary">{editingTemplate.name}</span></h3>
                                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.3em] italic">IDENTIFICADOR DE SISTEMA: {editingTemplate.slug.toUpperCase()}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setIsTemplateModalOpen(false)} className="rounded-[1.5rem] w-14 h-14 hover:bg-card transition-colors">
                                <X className="w-8 h-8 text-muted-foreground/40" />
                            </Button>
                        </div>
                        <div className="p-12 space-y-10 custom-scrollbar max-h-[60vh] overflow-y-auto">
                            <div className="space-y-6">
                                <div className="flex justify-between items-center px-2">
                                    <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground italic">CORPUS DEL MENSAJE</h4>
                                    <div className="flex items-center gap-4">
                                        <span className="text-[9px] font-black uppercase text-muted-foreground/40 italic">ESTADO OPERATIVO:</span>
                                        <button
                                            onClick={() => setEditingTemplate({ ...editingTemplate, is_active: !editingTemplate.is_active })}
                                            className={cn(
                                                "px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest italic transition-all shadow-sm border",
                                                editingTemplate.is_active ? "bg-emerald-500 text-white border-emerald-600" : "bg-muted text-muted-foreground border-border"
                                            )}
                                        >
                                            {editingTemplate.is_active ? 'ENABLED' : 'DISABLED'}
                                        </button>
                                    </div>
                                </div>
                                <div className="group relative">
                                    <textarea
                                        value={editingTemplate.content}
                                        onChange={(e) => setEditingTemplate({ ...editingTemplate, content: e.target.value })}
                                        className="w-full h-48 bg-muted/50 border border-border rounded-[2.5rem] p-8 text-sm font-bold italic text-foreground outline-none focus:border-primary/50 focus:bg-muted transition-all font-sans leading-relaxed shadow-inner placeholder:text-muted-foreground/20"
                                        placeholder="ESTRUCTURA EL MENSAJE DE IMPACTO..."
                                    />
                                    <div className="absolute bottom-6 right-8 flex gap-3">
                                        {editingTemplate.variables?.map(v => (
                                            <span key={v} className="px-3 py-1.5 bg-card/80 backdrop-blur-md rounded-xl text-[9px] font-mono text-primary border border-primary/20 shadow-sm">{"{{" + v + "}}"}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-10 bg-amber-500/5 rounded-[2.5rem] border border-amber-500/10 flex gap-6 items-start shadow-inner">
                                <div className="p-3 bg-amber-500/10 rounded-2xl"><Zap className="w-8 h-8 text-amber-500 animate-pulse" /></div>
                                <div className="space-y-2">
                                    <p className="text-[11px] font-black uppercase text-amber-600 tracking-widest italic">PROTOCOLOS DE DISPARO (TRIGGERS)</p>
                                    <p className="text-[10px] font-bold text-amber-700/60 leading-relaxed italic font-sans">
                                        Estas estructuras se inyectan en la cola CRM mediante eventos críticos del sistema (Cierre de Mesa, Registro de Meseros, Login). El uso de variables {"{{ }}"} permite inyectar datos dinámicos del perfil.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="p-12 bg-muted/20 border-t border-border flex flex-col sm:flex-row gap-6">
                            <Button
                                onClick={handleUpdateTemplate}
                                className="flex-[3] h-20 bg-foreground text-background hover:bg-primary hover:text-primary-foreground font-black rounded-3xl gap-4 uppercase text-sm tracking-[0.2em] italic transition-all shadow-2xl border-none"
                            >
                                <CheckCircle2 className="w-7 h-7" /> GUARDAR ESTRUCTURA TÁCTICA
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => setIsTemplateModalOpen(false)}
                                className="flex-1 h-20 text-muted-foreground font-black rounded-3xl uppercase text-xs tracking-widest italic hover:bg-muted transition-all"
                            >
                                ABORTAR
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 20px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--primary); }
            `}</style>
        </div>
    )
}
