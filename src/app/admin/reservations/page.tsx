"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
    Calendar as CalendarIcon,
    Clock,
    Users,
    Phone,
    MessageSquare,
    Check,
    X,
    ArrowLeft,
    Trash2,
    Plus,
    Loader2,
    Edit,
    Search,
    Filter,
    CalendarDays,
    Settings,
    Bell,
    Share2,
    CheckCircle2,
    Info,
    CalendarCheck,
    Activity,
    Signal,
    Box,
    Sparkles,
    MonitorIcon,
    ChevronRight,
    ArrowRight,
    Flame,
    Mail,
    Zap
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type Reservation = {
    id: string
    customer_name: string
    customer_phone: string
    customer_email: string
    reservation_date: string
    reservation_time: string
    num_people: number
    notes: string
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
}

export default function AdminReservationsPage() {
    const [reservations, setReservations] = useState<Reservation[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('upcoming') // upcoming, all, pending, confirmed
    const [searchTerm, setSearchTerm] = useState("")
    const [showNewModal, setShowNewModal] = useState(false)
    const [isCreating, setIsCreating] = useState(false)

    useEffect(() => {
        loadReservations()

        const channel = supabase
            .channel('reservations-live')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => {
                loadReservations()
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [filter])

    const loadReservations = async () => {
        let query = supabase
            .from('reservations')
            .select('*')
            .order('reservation_date', { ascending: true })
            .order('reservation_time', { ascending: true })

        if (filter === 'upcoming') {
            const today = new Date().toISOString().split('T')[0]
            query = query.gte('reservation_date', today).neq('status', 'cancelled')
        } else if (filter === 'pending') {
            query = query.eq('status', 'pending')
        } else if (filter === 'confirmed') {
            query = query.eq('status', 'confirmed')
        }

        const { data } = await query
        if (data) setReservations(data as any)
        setLoading(false)
    }

    const filteredReservations = reservations.filter(res =>
        res.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.customer_phone.includes(searchTerm)
    )

    const handleCreateReservation = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsCreating(true)
        const formData = new FormData(e.currentTarget)

        const { error } = await supabase
            .from('reservations')
            .insert([{
                customer_name: formData.get('name'),
                customer_email: formData.get('email') || 'presencial@pargorojo.com',
                customer_phone: formData.get('phone'),
                reservation_date: formData.get('date'),
                reservation_time: formData.get('time'),
                num_people: parseInt(formData.get('guests') as string),
                notes: formData.get('notes'),
                status: 'confirmed'
            }])

        setIsCreating(false)
        if (!error) {
            setShowNewModal(false)
            loadReservations()
            toast.success("Reserva agendada y bloqueada")
        } else {
            toast.error("Error: " + error.message)
        }
    }

    const updateStatus = async (id: string, status: string) => {
        await supabase.from('reservations').update({ status }).eq('id', id)
        loadReservations()
        toast.info(`Estado de reserva actualizado a ${status.toUpperCase()}`)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Seguro que desea eliminar esta reserva?')) return
        await supabase.from('reservations').delete().eq('id', id)
        loadReservations()
        toast.error("Registro de reserva eliminado")
    }

    const sendWhatsApp = (res: Reservation, type: 'confirm' | 'cancel') => {
        const phone = res.customer_phone.replace(/\s+/g, '')
        const message = type === 'confirm'
            ? `*RESERVA CONFIRMADA - PARGO ROJO* 🐟\n\nHola ${res.customer_name}, un gusto saludarte. Te confirmamos tu mesa para:\n\n📅 *Día:* ${res.reservation_date}\n⏰ *Hora:* ${res.reservation_time}\n👥 *Personas:* ${res.num_people}\n\n¡Te esperamos para vivir la mejor experiencia de mar! 🍽️`
            : `*RESERVA CANCELADA - PARGO ROJO* 🥀\n\nHola ${res.customer_name}. Lamentamos informarte que no tenemos disponibilidad para tu solicitud de reserva el día ${res.reservation_date} a las ${res.reservation_time}. Por favor intenta con otro horario o visítanos directamente.`

        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank')
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-transparent">
            <div className="flex flex-col items-center gap-8 animate-in fade-in duration-1000">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
                    <Loader2 className="w-16 h-16 text-primary animate-spin relative z-10" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary italic animate-pulse">Sincronizando Agenda Táctica...</p>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-transparent text-foreground p-4 md:p-12 font-sans selection:bg-primary selection:text-primary-foreground relative overflow-hidden">

            {/* 🌌 AMBIANCE LAYER */}
            <div className="fixed top-0 left-0 w-full h-[600px] bg-gradient-to-b from-primary/10 via-primary/[0.02] to-transparent pointer-events-none z-0" />
            <div className="fixed -bottom-40 -right-40 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none opacity-20 z-0 animate-pulse" />

            <div className="max-w-[1700px] mx-auto space-y-16 animate-in fade-in duration-1000 relative z-10">

                {/* 🚀 RESERVATIONS HEADER */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-12 border-b border-border/50 pb-12">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-10">
                        <Link href="/admin">
                            <Button variant="ghost" size="icon" className="h-20 w-20 rounded-[2.5rem] bg-card border border-border shadow-3xl hover:bg-muted active:scale-90 transition-all group overflow-hidden relative">
                                <ArrowLeft className="w-10 h-10 group-hover:-translate-x-1 transition-transform relative z-10" />
                            </Button>
                        </Link>
                        <div className="space-y-6">
                            <div className="flex flex-wrap items-center gap-4">
                                <h1 className="text-6xl md:text-7xl font-black italic tracking-tighter uppercase leading-none text-foreground text-glow whitespace-nowrap">AGENDA <span className="text-primary italic">TÁCTICA</span></h1>
                                <div className="px-5 py-2 bg-primary/10 border-2 border-primary/20 rounded-[1.5rem] text-[11px] font-black text-primary tracking-[0.3em] italic uppercase shadow-xl animate-pulse flex items-center gap-3">
                                    <CalendarCheck className="w-4 h-4" />
                                    RESERVATION_ENGINE_V8
                                </div>
                            </div>
                            <p className="text-[11px] text-muted-foreground font-black uppercase tracking-[0.5em] italic flex items-center gap-4 opacity-60">
                                <Zap className="w-5 h-5 text-primary" /> Control de Ocupación, Concieriery & Bloqueos de Mesa
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6">
                        <div className="flex bg-card/60 backdrop-blur-md p-2 rounded-[2rem] border-2 border-border/40 shadow-xl overflow-x-auto no-scrollbar max-w-full">
                            {[
                                { id: 'upcoming', label: 'PRÓXIMAS' },
                                { id: 'pending', label: 'PENDIENTES' },
                                { id: 'confirmed', label: 'CONFIRMADAS' },
                                { id: 'all', label: 'HISTORIAL' }
                            ].map((f) => (
                                <button
                                    key={f.id}
                                    onClick={() => setFilter(f.id)}
                                    className={cn(
                                        "px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all italic whitespace-nowrap",
                                        filter === f.id ? "bg-primary text-black shadow-lg" : "text-muted-foreground/40 hover:text-foreground"
                                    )}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                        <Button
                            onClick={() => setShowNewModal(true)}
                            className="h-20 px-10 bg-foreground text-background hover:bg-primary hover:text-white font-black uppercase text-xs tracking-[0.4em] italic rounded-[2.5rem] shadow-3xl transition-all gap-5 border-none group active:scale-95 whitespace-nowrap"
                        >
                            <Plus className="w-7 h-7 group-hover:scale-110 transition-transform" />
                            AGENDAR MESA ELITE
                        </Button>
                    </div>
                </div>

                {/* 📊 KPI DASHBOARD */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <ReservationKPI
                        label="Gestiones Pendientes"
                        value={reservations.filter(r => r.status === 'pending').length}
                        color="text-amber-500"
                        icon={<Bell className="w-20 h-20" />}
                        sub="ALERTA_FOLLOW_UP"
                        delay={0}
                        highlight={reservations.filter(r => r.status === 'pending').length > 0}
                    />
                    <ReservationKPI
                        label="Reservas Confirmadas"
                        value={reservations.filter(r => r.status === 'confirmed').length}
                        color="text-emerald-500"
                        icon={<CheckCircle2 className="w-20 h-20" />}
                        sub="FLUJO_ASEGURADO"
                        delay={100}
                    />
                    <ReservationKPI
                        label="Comensales Esperados"
                        value={reservations.filter(r => r.reservation_date === new Date().toISOString().split('T')[0]).reduce((a, b) => a + b.num_people, 0)}
                        color="text-blue-500"
                        icon={<Users className="w-20 h-20" />}
                        sub="PAX_QUOTA_TODAY"
                        delay={200}
                    />
                </div>

                {/* 🔍 SEARCH MATRIX */}
                <div className="flex flex-col lg:flex-row gap-8 bg-card/60 backdrop-blur-3xl p-8 rounded-[4rem] border-4 border-border/20 shadow-3xl relative overflow-hidden group/filters">
                    <div className="absolute inset-0 bg-primary/2 opacity-0 group-hover/filters:opacity-100 transition-opacity" />

                    <div className="flex-1 relative group/search">
                        <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground group-focus-within/search:text-primary transition-colors" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="LOCALIZAR EXPEDIENTE POR NOMBRE DE CLIENTE O REGISTRO TELEFÓNICO..."
                            className="w-full h-20 pl-20 pr-8 rounded-[2.5rem] bg-muted/40 border-4 border-border/40 focus:border-primary/50 outline-none font-black text-sm italic tracking-[0.2em] uppercase transition-all text-foreground placeholder:text-muted-foreground/20 shadow-inner"
                        />
                    </div>

                    <div className="flex items-center gap-4 relative z-10">
                        <Button variant="ghost" className="h-20 w-20 bg-card border-4 border-border/40 rounded-[2.5rem] hover:text-primary hover:border-primary/40 shadow-3xl transition-all group/btn active:scale-95">
                            <Filter className="w-8 h-8 group-hover:scale-110 transition-transform" />
                        </Button>
                        <Button variant="ghost" className="h-20 w-20 bg-card border-4 border-border/40 rounded-[2.5rem] hover:text-primary hover:border-primary/40 shadow-3xl transition-all group/btn active:scale-95">
                            <Settings className="w-8 h-8 group-hover:scale-110 transition-transform" />
                        </Button>
                    </div>
                </div>

                {/* 🛡️ RESERVATIONS LIST ENGINE */}
                <div className="space-y-8">
                    {filteredReservations.length > 0 ? (
                        filteredReservations.map((reservation, idx) => (
                            <div
                                key={reservation.id}
                                className="group/item bg-card border-4 border-border/40 rounded-[4.5rem] p-10 flex flex-col xl:flex-row xl:items-center justify-between gap-12 hover:border-primary/40 shadow-3xl transition-all relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 active:scale-[0.99]"
                                style={{ animationDelay: `${idx * 50}ms` }}
                            >
                                {/* Background Ornament */}
                                <div className="absolute top-0 right-0 p-16 opacity-[0.02] text-primary rotate-12 group-hover/item:scale-110 group-hover/item:rotate-0 transition-transform duration-1000 pointer-events-none">
                                    <CalendarDays className="w-80 h-80 -mr-20 -mt-20" />
                                </div>

                                <div className="flex flex-col md:flex-row gap-12 items-start md:items-center relative z-10 flex-1">
                                    {/* Date Node */}
                                    <div className="flex flex-col items-center justify-center min-w-[120px] h-32 bg-foreground rounded-[2.5rem] border-4 border-border group-hover/item:border-primary transition-all group-hover/item:shadow-primary/20 shadow-2xl relative overflow-hidden group/date">
                                        <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover/date:opacity-100 transition-opacity" />
                                        <span className="text-[10px] font-black uppercase text-background/40 tracking-[0.4em] italic leading-none mb-1">{new Date(reservation.reservation_date + 'T12:00:00').toLocaleDateString('es-CO', { month: 'short' })}</span>
                                        <span className="text-5xl font-black italic text-background tracking-tighter leading-none">{new Date(reservation.reservation_date + 'T12:00:00').getDate()}</span>
                                    </div>

                                    <div className="space-y-6 flex-1">
                                        <div className="flex flex-wrap items-center gap-6">
                                            <h3 className="text-4xl font-black italic uppercase tracking-tighter text-foreground group-hover/item:text-primary transition-colors leading-none">{reservation.customer_name}</h3>
                                            <div className={cn(
                                                "px-6 py-2 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] border-2 italic transition-all shadow-xl",
                                                reservation.status === 'confirmed' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                                                    reservation.status === 'pending' ? "bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse" :
                                                        reservation.status === 'cancelled' ? "bg-rose-500/10 text-rose-500 border-rose-500/20" :
                                                            "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                            )}>
                                                {reservation.status === 'pending' ? 'EN_ESPERA' :
                                                    reservation.status === 'confirmed' ? 'CONFIRMADA' :
                                                        reservation.status === 'cancelled' ? 'CANCELADA' : 'COMPLETADA'}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-10 text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 italic">
                                            <span className="flex items-center gap-3 group-hover/item:text-foreground transition-colors">
                                                <Clock className="w-5 h-5 text-primary" /> {reservation.reservation_time} HOURS
                                            </span>
                                            <span className="flex items-center gap-3 group-hover/item:text-foreground transition-colors">
                                                <Users className="w-5 h-5 text-primary" /> {reservation.num_people.toString().padStart(2, '0')} COMENSALES
                                            </span>
                                            <span className="flex items-center gap-3 group-hover/item:text-foreground transition-colors">
                                                <Phone className="w-5 h-5 text-primary" /> {reservation.customer_phone}
                                            </span>
                                            {reservation.customer_email && (
                                                <span className="flex items-center gap-3 group-hover/item:text-foreground transition-colors hidden md:flex">
                                                    <Mail className="w-5 h-5 text-primary" /> {reservation.customer_email.toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions Hub */}
                                <div className="flex flex-wrap items-center gap-5 relative z-10 pt-8 xl:pt-0 border-t-2 xl:border-t-0 border-border/20">
                                    {reservation.status === 'pending' && (
                                        <>
                                            <Button
                                                onClick={() => { updateStatus(reservation.id, 'confirmed'); sendWhatsApp(reservation, 'confirm'); }}
                                                className="h-20 px-8 bg-foreground text-background hover:bg-emerald-500 hover:text-white font-black uppercase text-[10px] tracking-widest italic rounded-[2.5rem] transition-all gap-4 border-none shadow-3xl active:scale-95 group/conf"
                                            >
                                                <Check className="w-6 h-6 group-hover/conf:scale-110 transition-transform" /> CONFIRMAR_RES
                                            </Button>
                                            <Button
                                                onClick={() => { updateStatus(reservation.id, 'cancelled'); sendWhatsApp(reservation, 'cancel'); }}
                                                className="h-20 px-8 bg-muted/40 text-rose-500 hover:bg-rose-500 hover:text-white border-2 border-border/40 hover:border-rose-500/20 font-black uppercase text-[10px] tracking-widest italic rounded-[2.5rem] transition-all gap-4 shadow-xl active:scale-95 group/rej"
                                            >
                                                <X className="w-6 h-6 group-hover/rej:scale-110 transition-transform" /> RECHAZAR
                                            </Button>
                                        </>
                                    )}
                                    {reservation.status === 'confirmed' && (
                                        <Button
                                            onClick={() => updateStatus(reservation.id, 'completed')}
                                            className="h-20 px-10 bg-muted/40 text-blue-500 hover:bg-blue-500 hover:text-white border-2 border-border/40 hover:border-blue-500/20 font-black uppercase text-[10px] tracking-widest italic rounded-[2.5rem] transition-all gap-4 shadow-xl active:scale-95 group/check"
                                        >
                                            <CheckCircle2 className="w-6 h-6 group-hover/check:scale-110 transition-transform" /> REGISTRAR ASISTENCIA
                                        </Button>
                                    )}

                                    <div className="flex gap-4 ml-6">
                                        <Button onClick={() => sendWhatsApp(reservation, 'confirm')} className="h-20 w-20 rounded-[2.5rem] bg-muted/40 border-2 border-border/40 text-muted-foreground hover:text-primary hover:border-primary/40 transition-all shadow-xl active:scale-75 flex items-center justify-center">
                                            <MessageSquare className="w-7 h-7" />
                                        </Button>
                                        <Button onClick={() => handleDelete(reservation.id)} className="h-20 w-20 rounded-[2.5rem] bg-muted/40 border-2 border-border/40 text-muted-foreground hover:text-rose-500 hover:border-rose-500/40 transition-all shadow-xl active:scale-75 flex items-center justify-center">
                                            <Trash2 className="w-7 h-7" />
                                        </Button>
                                    </div>
                                </div>

                                {reservation.notes && (
                                    <div className="absolute bottom-10 left-10 flex items-center gap-4 opacity-40 group-hover/item:opacity-100 transition-opacity">
                                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                        <span className="text-[9px] font-black text-white uppercase tracking-[0.4em] italic">REQUERIMIENTOS: {reservation.notes}</span>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="py-64 flex flex-col items-center justify-center gap-12 bg-black/5 rounded-[6rem] border-4 border-dashed border-border/20">
                            <Box className="w-32 h-32 text-muted-foreground/10 animate-pulse" />
                            <div className="text-center space-y-4">
                                <h4 className="text-6xl font-black italic uppercase tracking-tighter text-muted-foreground/20 leading-none">Agenda_Empty_Exception</h4>
                                <p className="text-[12px] font-black uppercase tracking-[0.8em] text-muted-foreground/10 italic">NO SE DETECTAN BLOQUEOS TÁCTICOS BAJO LOS PARÁMETROS SELECCIONADOS.</p>
                            </div>
                            <Button onClick={() => setFilter('all')} variant="ghost" className="h-16 px-10 rounded-2xl font-black uppercase text-[10px] tracking-[0.4em] italic text-primary hover:bg-primary/5 transition-all">RESTAURAR VISIBILIDAD HISTÓRICA</Button>
                        </div>
                    )}
                </div>

                {/* 🏷️ GLOBAL METRIC HUB */}
                <div className="p-10 bg-foreground rounded-[4rem] text-background flex flex-col md:flex-row items-center justify-between shadow-3xl group/metric relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover/metric:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-10 relative z-10">
                        <div className="w-20 h-20 rounded-[2rem] bg-background/10 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-2xl group-hover/metric:rotate-12 transition-transform duration-500">
                            <Flame className="w-10 h-10 text-primary drop-shadow-[0_0_15px_rgba(255,77,0,0.6)]" />
                        </div>
                        <div className="space-y-2 text-center md:text-left">
                            <h4 className="text-2xl font-black italic uppercase tracking-tighter text-primary">Master Reservations Hub</h4>
                            <p className="text-[10px] text-background/40 font-black uppercase tracking-[0.4em] italic leading-none">
                                SYSTEM v8.42 • KERNEL OPTIMIZED FOR CALENDAR SYNC
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-12 mt-8 md:mt-0 relative z-10">
                        <div className="text-right">
                            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white/20 mb-1 italic">Active Nodes</p>
                            <p className="text-2xl font-black italic tracking-tighter text-emerald-500">{reservations.length} RESERVAS</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white/20 mb-1 italic">Region Flux</p>
                            <p className="text-2xl font-black italic tracking-tighter text-white">SA-EAST_CORE</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 🛠️ RESERVATION MODAL ELITE */}
            {showNewModal && (
                <div className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-card border-4 border-primary/20 rounded-[5rem] w-full max-w-2xl p-16 shadow-[0_0_150px_rgba(255,102,0,0.15)] relative overflow-hidden group/modal animate-in zoom-in-95 duration-500">
                        <div className="absolute top-0 right-0 p-16 opacity-[0.03] pointer-events-none -mr-16 -mt-16 group-hover/modal:scale-110 transition-transform duration-1000 rotate-12">
                            <CalendarIcon className="w-[450px] h-[450px]" />
                        </div>

                        <div className="flex justify-between items-start mb-16 relative z-10">
                            <div className="space-y-4">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 rounded-2xl bg-primary text-black flex items-center justify-center shadow-3xl">
                                        <CalendarCheck className="w-8 h-8" />
                                    </div>
                                    <h2 className="text-5xl font-black italic uppercase tracking-tighter text-foreground leading-none">AGENDAR <span className="text-primary italic">NODO_MESA</span></h2>
                                </div>
                                <p className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.4em] italic pl-20 italic">BLOQUEO MANUAL DE DISPONIBILIDAD EN AGENDA TÁCTICA</p>
                            </div>
                            <Button variant="ghost" className="h-16 w-16 rounded-[1.5rem] bg-muted/40 hover:bg-primary hover:text-white transition-all active:scale-90" onClick={() => setShowNewModal(false)}>
                                <X className="w-8 h-8" />
                            </Button>
                        </div>

                        <form onSubmit={handleCreateReservation} className="space-y-12 relative z-10">
                            <div className="space-y-4 group/field">
                                <label className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.5em] ml-10 italic group-hover/field:text-primary transition-colors flex items-center gap-3">
                                    <Signal className="w-4 h-4" /> TITULAR DEL EXPEDIENTE
                                </label>
                                <input name="name" required placeholder="NOMBRE COMPLETO DEL CLIENTE_MASTER" className="w-full h-20 bg-muted/40 border-4 border-border rounded-[2.5rem] px-10 outline-none text-foreground focus:border-primary font-black italic text-xs tracking-[0.4em] shadow-inner transition-all uppercase placeholder:text-muted-foreground/10" />
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4 group/field">
                                    <label className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.5em] ml-10 italic group-hover/field:text-primary transition-colors flex items-center gap-3">
                                        <Phone className="w-4 h-4" /> REGISTRO TELEFÓNICO
                                    </label>
                                    <input name="phone" required placeholder="+57 3XX..." className="w-full h-20 bg-muted/40 border-4 border-border rounded-[2.5rem] px-10 outline-none text-foreground focus:border-primary font-black italic text-lg shadow-inner transition-all tracking-tighter" />
                                </div>
                                <div className="space-y-4 group/field">
                                    <label className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.5em] ml-10 italic group-hover/field:text-primary transition-colors flex items-center gap-3">
                                        <Users className="w-4 h-4" /> AFORO PREVISTO
                                    </label>
                                    <input name="guests" type="number" min="1" defaultValue="2" required className="w-full h-20 bg-muted/40 border-4 border-border rounded-[2.5rem] px-10 outline-none text-foreground focus:border-primary font-black italic text-2xl shadow-inner transition-all tracking-tighter" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4 group/field">
                                    <label className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.5em] ml-10 italic group-hover/field:text-primary transition-colors flex items-center gap-3">
                                        <CalendarDays className="w-4 h-4" /> FECHA DE INTERVENCIÓN
                                    </label>
                                    <input name="date" type="date" required className="w-full h-20 bg-muted/40 border-4 border-border rounded-[2.5rem] px-10 outline-none text-foreground focus:border-primary font-black italic text-xs tracking-[0.4em] shadow-inner transition-all cursor-pointer uppercase" />
                                </div>
                                <div className="space-y-4 group/field">
                                    <label className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.5em] ml-10 italic group-hover/field:text-primary transition-colors flex items-center gap-3">
                                        <Clock className="w-4 h-4" /> FRANJA HORARIA
                                    </label>
                                    <input name="time" type="time" required className="w-full h-20 bg-muted/40 border-4 border-border rounded-[2.5rem] px-10 outline-none text-foreground focus:border-primary font-black italic text-2xl shadow-inner transition-all cursor-pointer tracking-tighter" />
                                </div>
                            </div>

                            <div className="space-y-4 group/field">
                                <label className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.5em] ml-10 italic group-hover/field:text-primary transition-colors flex items-center gap-3">
                                    <Sparkles className="w-4 h-4" /> NOTAS ESTRATÉGICAS & ALERGIAS
                                </label>
                                <textarea name="notes" placeholder="REQUERIMIENTOS ESPECIALES O MATRICES ALÉRGICAS..." className="w-full h-32 bg-muted/40 border-4 border-border rounded-[3rem] px-10 py-6 outline-none resize-none text-foreground focus:border-primary font-bold italic text-xs tracking-wide placeholder:text-muted-foreground/10 shadow-inner transition-all uppercase" />
                            </div>

                            <div className="flex gap-8 pt-8">
                                <Button type="button" variant="ghost" className="flex-1 h-24 rounded-[2.5rem] font-black italic uppercase tracking-[0.5em] text-muted-foreground/40 hover:bg-muted/10 transition-all" onClick={() => setShowNewModal(false)}>ABORTAR_SYNC</Button>
                                <Button type="submit" disabled={isCreating} className="flex-[2] h-24 bg-foreground text-background hover:bg-primary hover:text-white font-black rounded-[3rem] uppercase italic tracking-[0.4em] shadow-5xl transition-all border-none text-xl group active:scale-95">
                                    {isCreating ? <Loader2 className="animate-spin w-8 h-8" /> : (
                                        <span className="flex items-center gap-5">BLOQUEAR NODO_MESA <ArrowRight className="w-8 h-8 group-hover:translate-x-3 transition-transform" /></span>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx global>{`
                input[type="date"]::-webkit-calendar-picker-indicator,
                input[type="time"]::-webkit-calendar-picker-indicator {
                    filter: invert(0.5) sepia(1) saturate(5) hue-rotate(175deg);
                    cursor: pointer;
                }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .text-glow { text-shadow: 0 0 20px rgba(255,102,0,0.2); }
            `}</style>
        </div>
    )
}

function ReservationKPI({ label, value, color, icon, sub, delay, highlight }: any) {
    return (
        <div className={cn(
            "bg-card border-4 p-10 rounded-[4rem] shadow-3xl relative overflow-hidden group transition-all duration-700",
            highlight ? "border-amber-500 shadow-amber-500/20 bg-amber-500/5 animate-pulse" : "border-border/40 hover:border-primary/40"
        )} style={{ animationDelay: `${delay}ms` }}>
            <div className={cn(
                "absolute -top-6 -right-6 p-12 opacity-[0.05] group-hover:scale-125 group-hover:rotate-12 group-hover:opacity-20 transition-all duration-1000",
                color
            )}>
                {icon}
            </div>

            <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-3">
                    <div className={cn("w-2 h-2 rounded-full", color.replace('text', 'bg'))} />
                    <p className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground italic leading-none">{label}</p>
                </div>
                <div className="space-y-2">
                    <span className={cn("text-6xl font-black tracking-tighter italic leading-none", color)}>{value}</span>
                    {sub && <p className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.3em] italic leading-none">{sub}</p>}
                </div>
            </div>
        </div>
    )
}
