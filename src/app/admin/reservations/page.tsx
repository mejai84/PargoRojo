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
    CalendarCheck
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

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
    const [showEditModal, setShowEditModal] = useState(false)
    const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
    const [isCreating, setIsCreating] = useState(false)

    useEffect(() => {
        loadReservations()

        // Realtime updates
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
        } else {
            alert("Error: " + error.message)
        }
    }

    const updateStatus = async (id: string, status: string) => {
        await supabase
            .from('reservations')
            .update({ status })
            .eq('id', id)
        loadReservations()
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Seguro que desea eliminar esta reserva?')) return
        await supabase.from('reservations').delete().eq('id', id)
        loadReservations()
    }

    const sendWhatsApp = (res: Reservation, type: 'confirm' | 'cancel') => {
        const phone = res.customer_phone.replace(/\s+/g, '')
        const message = type === 'confirm'
            ? `*RESERVA CONFIRMADA - PARGO ROJO* 🐟\n\nHola ${res.customer_name}, un gusto saludarte. Te confirmamos tu mesa para:\n\n📅 *Día:* ${res.reservation_date}\n⏰ *Hora:* ${res.reservation_time}\n👥 *Personas:* ${res.num_people}\n\n¡Te esperamos para vivir la mejor experiencia de mar! 🍽️`
            : `*RESERVA CANCELADA - PARGO ROJO* 🥀\n\nHola ${res.customer_name}. Lamentamos informarte que no tenemos disponibilidad para tu solicitud de reserva el día ${res.reservation_date} a las ${res.reservation_time}. Por favor intenta con otro horario o visítanos directamente.`

        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank')
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
            case 'pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
            case 'cancelled': return 'bg-rose-500/10 text-rose-500 border-rose-500/20'
            case 'completed': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
            default: return 'bg-muted text-muted-foreground border-border'
        }
    }

    if (loading) return (
        <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-8 gap-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="font-black italic uppercase text-[10px] tracking-[0.3em] text-muted-foreground animate-pulse">Sincronizando Agenda Táctica...</p>
        </div>
    )

    return (
        <div className="min-h-screen bg-transparent text-foreground p-4 md:p-8 selection:bg-primary selection:text-primary-foreground font-sans">
            <div className="max-w-[1400px] mx-auto space-y-10">

                {/* 🔝 PREMIUM HEADER */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="space-y-2">
                        <div className="flex items-center gap-4">
                            <Link href="/admin">
                                <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl bg-card border border-border hover:bg-muted transition-all shadow-sm">
                                    <ArrowLeft className="w-5 h-5 text-foreground" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none text-foreground">Gestión de <span className="text-primary italic">Reservas</span></h1>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] mt-2 italic flex items-center gap-2 opacity-70">
                                    <CalendarDays className="w-3.5 h-3.5 text-primary" /> Control de ocupación y agenda corporativa
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex bg-muted/50 p-1.5 rounded-2xl border border-border mr-4 shadow-inner">
                            {['upcoming', 'pending', 'confirmed', 'all'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={cn(
                                        "px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all italic duration-300",
                                        filter === f ? "bg-card text-primary shadow-lg border border-border/50" : "text-muted-foreground/50 hover:text-foreground"
                                    )}
                                >
                                    {f === 'upcoming' ? 'PRÓXIMAS' : f === 'pending' ? 'PENDIENTES' : f === 'confirmed' ? 'CONFIRMADAS' : 'HISTORIAL'}
                                </button>
                            ))}
                        </div>
                        <Button
                            onClick={() => setShowNewModal(true)}
                            className="h-14 px-8 bg-primary text-primary-foreground border-none rounded-2xl font-black uppercase text-[10px] tracking-widest italic hover:scale-105 transition-all shadow-xl shadow-primary/20 gap-3"
                        >
                            <Plus className="w-5 h-5" /> AGENDAR MESA
                        </Button>
                    </div>
                </div>

                {/* 📊 KPI DASHLET */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-1000">
                    <ReservationKPI label="Por Confirmar" value={reservations.filter(r => r.status === 'pending').length} color="text-amber-500" icon={<Bell />} delay="0" />
                    <ReservationKPI label="Reserva Activa" value={reservations.filter(r => r.status === 'confirmed').length} color="text-emerald-500" icon={<CalendarCheck />} delay="100" />
                    <ReservationKPI label="Pax Esperados Hoy" value={reservations.filter(r => r.reservation_date === new Date().toISOString().split('T')[0]).reduce((a, b) => a + b.num_people, 0)} color="text-blue-500" icon={<Users />} delay="200" />
                </div>

                {/* 🔍 QUICK SEARCH */}
                <div className="relative group max-w-2xl animate-in slide-in-from-left-4 duration-500">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="BUSCAR EXPEDIENTE POR CLIENTE O TELÉFONO..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-18 pl-16 pr-8 rounded-[2.5rem] bg-card border border-border focus:border-primary focus:outline-none font-black italic text-xs tracking-widest transition-all text-foreground shadow-xl placeholder:text-muted-foreground/30 uppercase"
                    />
                </div>

                {/* 📝 RESERVATIONS LIST */}
                <div className="grid grid-cols-1 gap-6 animate-in fade-in duration-1000">
                    {filteredReservations.length > 0 ? (
                        filteredReservations.map(reservation => (
                            <div
                                key={reservation.id}
                                className="group bg-card rounded-[3rem] p-8 border border-border hover:border-primary/30 hover:bg-muted/10 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative overflow-hidden shadow-2xl"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-primary/10 transition-all" />

                                <div className="flex gap-8 items-center relative z-10">
                                    <div className="flex flex-col items-center justify-center w-22 h-22 bg-foreground rounded-[2rem] border border-border shadow-black/20 group-hover:border-primary transition-all group-hover:scale-105">
                                        <span className="text-[10px] font-black uppercase text-background/60 tracking-widest italic">{new Date(reservation.reservation_date + 'T12:00:00').toLocaleDateString('es-CO', { month: 'short' })}</span>
                                        <span className="text-4xl font-black italic text-background leading-none mt-1">{new Date(reservation.reservation_date + 'T12:00:00').getDate()}</span>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex flex-wrap items-center gap-4">
                                            <h3 className="text-3xl font-black italic uppercase tracking-tighter text-foreground group-hover:text-primary transition-colors leading-none">{reservation.customer_name}</h3>
                                            <span className={cn(
                                                "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border italic transition-colors shadow-sm",
                                                getStatusColor(reservation.status)
                                            )}>
                                                {reservation.status === 'pending' ? 'Pendiente' :
                                                    reservation.status === 'confirmed' ? 'Confirmada' :
                                                        reservation.status === 'cancelled' ? 'Cancelada' : 'Completada'}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap gap-8 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 italic">
                                            <span className="flex items-center gap-2.5 group-hover:text-foreground transition-colors">
                                                <Clock className="w-4 h-4 text-primary" /> {reservation.reservation_time}
                                            </span>
                                            <span className="flex items-center gap-2.5 group-hover:text-foreground transition-colors">
                                                <Users className="w-4 h-4 text-primary" /> {reservation.num_people} COMENSALES
                                            </span>
                                            <span className="flex items-center gap-2.5 group-hover:text-foreground transition-colors">
                                                <Phone className="w-4 h-4 text-primary" /> {reservation.customer_phone}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-4 relative z-10 pt-6 lg:pt-0 border-t lg:border-t-0 border-border/50">
                                    {reservation.status === 'pending' && (
                                        <>
                                            <Button
                                                onClick={() => { updateStatus(reservation.id, 'confirmed'); sendWhatsApp(reservation, 'confirm'); }}
                                                className="h-14 px-8 bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-widest italic rounded-2xl hover:scale-105 transition-all gap-2 border-none shadow-lg shadow-primary/20"
                                            >
                                                <Check className="w-4 h-4" /> CONFIRMAR
                                            </Button>
                                            <Button
                                                onClick={() => { updateStatus(reservation.id, 'cancelled'); sendWhatsApp(reservation, 'cancel'); }}
                                                variant="ghost"
                                                className="h-14 px-8 bg-rose-500/10 text-rose-500 border border-rose-500/20 font-black uppercase text-[10px] tracking-widest italic rounded-2xl hover:bg-rose-500 hover:text-white transition-all gap-2"
                                            >
                                                <X className="w-4 h-4" /> RECHAZAR
                                            </Button>
                                        </>
                                    )}
                                    {reservation.status === 'confirmed' && (
                                        <Button
                                            onClick={() => updateStatus(reservation.id, 'completed')}
                                            variant="ghost"
                                            className="h-14 px-8 bg-blue-500/10 text-blue-500 border border-blue-500/20 font-black uppercase text-[10px] tracking-widest italic rounded-2xl hover:bg-blue-500 hover:text-white transition-all gap-2"
                                        >
                                            <CheckCircle2 className="w-4 h-4" /> MARCAR ASISTENCIA
                                        </Button>
                                    )}

                                    <div className="flex gap-3 ml-4">
                                        <Button onClick={() => sendWhatsApp(reservation, 'confirm')} variant="ghost" size="icon" className="h-14 w-14 rounded-2xl bg-muted border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-all shadow-sm active:scale-95">
                                            <Share2 className="w-5 h-5" />
                                        </Button>
                                        <Button onClick={() => handleDelete(reservation.id)} variant="ghost" size="icon" className="h-14 w-14 rounded-2xl bg-muted border border-border text-muted-foreground hover:text-rose-500 hover:border-rose-500/30 transition-all shadow-sm active:scale-95">
                                            <Trash2 className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>

                                {reservation.notes && (
                                    <div className="absolute top-0 right-14 bg-primary/20 text-primary px-6 py-2 rounded-b-[1.5rem] text-[9px] font-black uppercase tracking-[0.2em] italic border-x border-b border-primary/20 flex items-center gap-2 shadow-sm animate-in slide-in-from-top-4">
                                        <Info className="w-3.5 h-3.5" /> OBSERVACIONES: {reservation.notes}
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-32 bg-muted/20 rounded-[4rem] border-2 border-border border-dashed space-y-6 animate-in zoom-in-95 duration-700">
                            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto border border-border opacity-50">
                                <CalendarIcon className="w-12 h-12 text-muted-foreground/30" />
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-2xl font-black italic uppercase tracking-tighter text-foreground">Agenda Despejada</h4>
                                <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest italic">No se registran reservas tácticas para este filtro.</p>
                            </div>
                            <Button onClick={() => setFilter('all')} variant="ghost" className="text-primary font-black uppercase text-[11px] tracking-[0.3em] italic hover:bg-primary/10 rounded-xl transition-all">Ver Historial Completo</Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Manual Modal - Updated styling */}
            {showNewModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="relative z-10 bg-card border border-border p-12 rounded-[4rem] w-full max-w-2xl animate-in zoom-in-95 duration-500 shadow-3xl text-foreground shadow-black/50 overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none rotate-12">
                            <CalendarIcon className="w-60 h-60 -mr-20 -mt-20" />
                        </div>

                        <div className="flex items-center justify-between mb-12 relative z-10">
                            <div>
                                <h2 className="text-5xl font-black italic uppercase tracking-tighter leading-none text-foreground">Agendar <span className="text-primary">Mesa</span></h2>
                                <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-[0.3em] mt-3 italic opacity-60">Inserción manual de reserva en el calendario</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setShowNewModal(false)} className="rounded-[1.5rem] w-14 h-14 hover:bg-muted shrink-0 shadow-lg border border-border bg-card transition-all">
                                <X className="w-8 h-8 text-muted-foreground/40" />
                            </Button>
                        </div>

                        <form onSubmit={handleCreateReservation} className="grid grid-cols-2 gap-8 relative z-10">
                            <div className="col-span-2 space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60 ml-4 italic">Titular de la Reserva</label>
                                <input name="name" required placeholder="NOMBRE COMPLETO DEL CLIENTE" className="w-full h-16 bg-muted/50 border border-border rounded-[2rem] px-8 outline-none text-foreground focus:border-primary font-black italic text-xs tracking-widest placeholder:text-muted-foreground/20 uppercase shadow-inner" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60 ml-4 italic">Contacto Telefónico</label>
                                <input name="phone" required placeholder="+57 300..." className="w-full h-16 bg-muted/50 border border-border rounded-[2rem] px-8 outline-none text-foreground focus:border-primary font-black italic text-xs tracking-widest placeholder:text-muted-foreground/20 shadow-inner" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60 ml-4 italic">Número de Pax</label>
                                <input name="guests" type="number" min="1" defaultValue="2" required className="w-full h-16 bg-muted/50 border border-border rounded-[2rem] px-8 outline-none text-foreground focus:border-primary font-black italic text-lg tracking-widest shadow-inner" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60 ml-4 italic">Día de Visita</label>
                                <input name="date" type="date" required className="w-full h-16 bg-muted/50 border border-border rounded-[2rem] px-8 outline-none text-foreground focus:border-primary font-black italic text-xs tracking-widest cursor-pointer shadow-inner" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60 ml-4 italic">Franja Horaria</label>
                                <input name="time" type="time" required className="w-full h-16 bg-muted/50 border border-border rounded-[2rem] px-8 outline-none text-foreground focus:border-primary font-black italic text-xs tracking-widest cursor-pointer shadow-inner" />
                            </div>
                            <div className="col-span-2 space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60 ml-4 italic">Notas Estratégicas</label>
                                <textarea name="notes" placeholder="REQUERIMIENTOS ESPECIALES O ALERGIAS..." className="w-full h-32 bg-muted/50 border border-border rounded-[2.5rem] px-8 py-6 outline-none resize-none text-foreground focus:border-primary font-bold italic text-xs tracking-tight placeholder:text-muted-foreground/20 shadow-inner" />
                            </div>
                            <div className="col-span-2 flex gap-4 mt-8">
                                <Button type="submit" disabled={isCreating} className="flex-1 h-20 bg-foreground text-background hover:bg-primary font-black uppercase italic tracking-[0.3em] rounded-3xl shadow-2xl transition-all border-none text-sm group active:scale-95">
                                    {isCreating ? <Loader2 className="animate-spin w-6 h-6" /> : (
                                        <span className="flex items-center gap-3">CONFIRMAR BLOQUEO DE MESA <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" /></span>
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
            `}</style>
        </div>
    )
}

function ReservationKPI({ label, value, color, icon, delay }: any) {
    return (
        <div className={cn("bg-card border border-border p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group hover:border-primary/40 transition-all animate-in fade-in slide-in-from-bottom-4 duration-700")} style={{ animationDelay: `${delay}ms` }}>
            <div className={cn("absolute top-0 right-0 p-8 opacity-5 group-hover:scale-125 group-hover:opacity-10 transition-all duration-700 pointer-events-none")}>
                {icon}
            </div>
            <div className="relative z-10 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground italic group-hover:text-foreground transition-colors">{label}</p>
                <p className={cn("text-5xl font-black italic tracking-tighter leading-none drop-shadow-sm", color)}>{value}</p>
            </div>
        </div>
    )
}

function ArrowRight(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
        </svg>
    )
}
