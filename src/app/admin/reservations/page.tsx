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
    Info
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
            case 'confirmed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            case 'pending': return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            case 'cancelled': return 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            case 'completed': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
            default: return 'bg-white/5 text-gray-400 border-white/5'
        }
    }

    if (loading) return (
        <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-8 gap-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="font-black italic uppercase text-[10px] tracking-[0.3em] text-slate-400">Sincronizando Calendario...</p>
        </div>
    )

    return (
        <div className="min-h-screen bg-transparent text-slate-900 p-4 md:p-8 selection:bg-primary font-sans">
            <div className="max-w-[1400px] mx-auto space-y-10">

                {/* 🔝 PREMIUM HEADER */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="space-y-2">
                        <div className="flex items-center gap-4">
                            <Link href="/admin">
                                <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-sm">
                                    <ArrowLeft className="w-5 h-5 text-slate-900" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none text-slate-900">Gestión de <span className="text-primary">Reservas</span></h1>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-2 italic flex items-center gap-2">
                                    <CalendarDays className="w-3 h-3" /> Control de ocupación y agenda en tiempo real
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-200 mr-4 shadow-inner">
                            {['upcoming', 'pending', 'confirmed', 'all'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={cn(
                                        "px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all italic",
                                        filter === f ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-900"
                                    )}
                                >
                                    {f === 'upcoming' ? 'PRÓXIMAS' : f === 'pending' ? 'PENDIENTES' : f === 'confirmed' ? 'CONFIRMADAS' : 'HISTORIAL'}
                                </button>
                            ))}
                        </div>
                        <Button
                            onClick={() => setShowNewModal(true)}
                            className="h-14 px-8 bg-primary text-black rounded-2xl font-black uppercase text-[10px] tracking-widest italic hover:bg-white transition-all shadow-xl shadow-primary/20 gap-3"
                        >
                            <Plus className="w-5 h-5" /> NUEVA RESERVA
                        </Button>
                    </div>
                </div>

                {/* 📊 KPI DASHLET */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-1000">
                    <ReservationKPI label="Por Confirmar" value={reservations.filter(r => r.status === 'pending').length} color="text-amber-400" icon={<Bell />} />
                    <ReservationKPI label="Próximas Ventas" value={reservations.filter(r => r.status === 'confirmed').length} color="text-emerald-400" icon={<CheckCircle2 />} />
                    <ReservationKPI label="Total Personas/Hoy" value={reservations.filter(r => r.reservation_date === new Date().toISOString().split('T')[0]).reduce((a, b) => a + b.num_people, 0)} color="text-blue-400" icon={<Users />} />
                </div>

                {/* 🔍 QUICK SEARCH */}
                <div className="relative group max-w-2xl">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar por cliente o teléfono..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-16 pl-16 pr-6 rounded-[2rem] bg-white border border-slate-200 focus:border-primary focus:outline-none font-black italic text-sm tracking-tight transition-all text-slate-900 shadow-sm"
                    />
                </div>

                {/* 📝 RESERVATIONS LIST */}
                <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {filteredReservations.length > 0 ? (
                        filteredReservations.map(reservation => (
                            <div
                                key={reservation.id}
                                className="group bg-white rounded-[2.5rem] p-8 border border-slate-200 hover:border-primary/20 hover:bg-slate-50 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative overflow-hidden shadow-sm"
                            >
                                {/* Date Badge */}
                                <div className="flex gap-8 items-center relative z-10">
                                    <div className="flex flex-col items-center justify-center w-20 h-20 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl group-hover:border-primary/20 transition-all">
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{new Date(reservation.reservation_date + 'T12:00:00').toLocaleDateString('es-CO', { month: 'short' })}</span>
                                        <span className="text-3xl font-black italic text-white leading-none mt-1">{new Date(reservation.reservation_date + 'T12:00:00').getDate()}</span>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 group-hover:text-primary transition-colors line-clamp-1">{reservation.customer_name}</h3>
                                            <span className={cn(
                                                "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border italic",
                                                getStatusColor(reservation.status)
                                            )}>
                                                {reservation.status === 'pending' ? '🟡 Pendiente' :
                                                    reservation.status === 'confirmed' ? '🟢 Confirmada' :
                                                        reservation.status === 'cancelled' ? '🔴 Cancelada' : '🔵 Completada'}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            <span className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-primary" /> {reservation.reservation_time}
                                            </span>
                                            <span className="flex items-center gap-2">
                                                <Users className="w-4 h-4 text-primary" /> {reservation.num_people} PAX
                                            </span>
                                            <span className="flex items-center gap-2">
                                                <Phone className="w-4 h-4 text-primary" /> {reservation.customer_phone}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 relative z-10 pt-6 lg:pt-0 border-t lg:border-t-0 border-white/5">
                                    {reservation.status === 'pending' && (
                                        <>
                                            <Button
                                                onClick={() => { updateStatus(reservation.id, 'confirmed'); sendWhatsApp(reservation, 'confirm'); }}
                                                className="h-12 px-6 bg-emerald-500 text-black font-black uppercase text-[9px] tracking-widest italic rounded-xl hover:bg-white transition-all gap-2"
                                            >
                                                <Check className="w-3.5 h-3.5" /> CONFIRMAR
                                            </Button>
                                            <Button
                                                onClick={() => { updateStatus(reservation.id, 'cancelled'); sendWhatsApp(reservation, 'cancel'); }}
                                                variant="ghost"
                                                className="h-12 px-6 bg-rose-500/10 text-rose-500 border border-rose-500/10 font-black uppercase text-[9px] tracking-widest italic rounded-xl hover:bg-rose-500 hover:text-white transition-all gap-2"
                                            >
                                                <X className="w-3.5 h-3.5" /> RECHAZAR
                                            </Button>
                                        </>
                                    )}
                                    {reservation.status === 'confirmed' && (
                                        <Button
                                            onClick={() => updateStatus(reservation.id, 'completed')}
                                            variant="ghost"
                                            className="h-12 px-6 bg-blue-500/10 text-blue-400 border border-blue-500/10 font-black uppercase text-[9px] tracking-widest italic rounded-xl hover:bg-blue-500 hover:text-white transition-all gap-2"
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5" /> COMPLETAR
                                        </Button>
                                    )}

                                    <div className="flex gap-2 ml-4">
                                        <Button onClick={() => sendWhatsApp(reservation, 'confirm')} variant="ghost" size="icon" className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-emerald-500 hover:border-emerald-500/30">
                                            <Share2 className="w-4 h-4" />
                                        </Button>
                                        <Button onClick={() => handleDelete(reservation.id)} variant="ghost" size="icon" className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-500/30">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                {reservation.notes && (
                                    <div className="absolute top-0 right-10 bg-primary/20 text-primary px-4 py-2 rounded-b-2xl text-[8px] font-black uppercase tracking-widest italic border-x border-b border-primary/30 flex items-center gap-2">
                                        <Info className="w-3 h-3" /> {reservation.notes}
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-24 bg-slate-50 rounded-[3rem] border border-slate-200 border-dashed space-y-4">
                            <CalendarIcon className="w-16 h-16 text-slate-200 mx-auto mb-2" />
                            <h4 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">Sin registros activos</h4>
                            <p className="text-slate-500 font-medium italic">No se encontraron reservas para el filtro seleccionado.</p>
                            <Button onClick={() => setFilter('all')} variant="link" className="text-primary font-black uppercase text-[10px] tracking-widest italic">Ver todo el historial</Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Manual Modal - Updated styling */}
            {showNewModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 p-10 rounded-[3rem] w-full max-w-2xl animate-in zoom-in duration-300 shadow-3xl text-slate-900">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h2 className="text-4xl font-black italic uppercase tracking-tighter">Nueva <span className="text-primary">Reserva</span></h2>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Ingreso manual de mesa al sistema</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setShowNewModal(false)} className="rounded-full hover:bg-slate-900 hover:text-white shrink-0 shadow-sm border border-slate-100 bg-white">
                                <X className="w-6 h-6" />
                            </Button>
                        </div>

                        <form onSubmit={handleCreateReservation} className="grid grid-cols-2 gap-6">
                            <div className="col-span-2 space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Cliente</label>
                                <input name="name" required placeholder="Nombre completo" className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none text-slate-900 focus:border-primary font-bold italic" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Teléfono</label>
                                <input name="phone" required placeholder="Ej: 300 123 4567" className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none text-slate-900 focus:border-primary font-black italic" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Comensales</label>
                                <input name="guests" type="number" min="1" defaultValue="2" required className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none text-slate-900 focus:border-primary font-black italic" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Fecha</label>
                                <input name="date" type="date" required className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none text-slate-900 focus:border-primary font-black italic" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Hora</label>
                                <input name="time" type="time" required className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none text-slate-900 focus:border-primary font-black italic" />
                            </div>
                            <div className="col-span-2 space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Observaciones</label>
                                <textarea name="notes" placeholder="Mesa especial, alergias, decoraciones..." className="w-full h-28 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none resize-none text-slate-900 focus:border-primary font-bold italic" />
                            </div>
                            <div className="col-span-2 flex gap-4 mt-6">
                                <Button type="submit" disabled={isCreating} className="flex-1 h-16 bg-primary text-black font-black uppercase italic tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 hover:bg-white transition-all">
                                    {isCreating ? <Loader2 className="animate-spin w-5 h-5" /> : "AGENDAR RESERVA"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

function ReservationKPI({ label, value, color, icon }: any) {
    return (
        <div className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm relative overflow-hidden group">
            <div className={cn("absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 group-hover:opacity-10 transition-all", color)}>
                {icon}
            </div>
            <div className="relative z-10 space-y-1">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 italic">{label}</p>
                <p className={cn("text-4xl font-black italic tracking-tighter leading-none", color)}>{value}</p>
            </div>
        </div>
    )
}
