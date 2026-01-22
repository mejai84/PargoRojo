"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon, Clock, Users, Phone, MessageSquare, Check, X, ArrowLeft, Trash2, Plus, Loader2, Edit } from "lucide-react"
import Link from "next/link"

type Reservation = {
    id: string
    customer_name: string
    customer_phone: string
    reservation_date: string
    reservation_time: string
    num_people: number
    notes: string
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
}

export default function AdminReservationsPage() {
    const [reservations, setReservations] = useState<Reservation[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('upcoming') // upcoming, all
    const [showNewModal, setShowNewModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
    const [isCreating, setIsCreating] = useState(false)

    useEffect(() => {
        loadReservations()
    }, [filter])

    const loadReservations = async () => {
        let query = supabase
            .from('reservations')
            .select('*')
            .order('reservation_date', { ascending: true })
            .order('reservation_time', { ascending: true })

        if (filter === 'upcoming') {
            const today = new Date().toISOString().split('T')[0]
            query = query.gte('reservation_date', today)
        }

        const { data } = await query
        if (data) setReservations(data as any)
        setLoading(false)
    }

    const handleCreateReservation = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsCreating(true)
        const formData = new FormData(e.currentTarget)

        // As admin, we mark it as confirmed automatically
        const { data, error } = await supabase
            .from('reservations')
            .insert([{
                customer_name: formData.get('name'),
                customer_email: formData.get('email') || 'presencial@pargo.rojo',
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
        if (!confirm('¿Seguro que desea eliminar esta reserva? Esta acción no se puede deshacer.')) return

        setLoading(true)
        const { error } = await supabase
            .from('reservations')
            .delete()
            .eq('id', id)

        if (!error) {
            loadReservations()
        } else {
            alert("Error: " + error.message)
        }
        setLoading(false)
    }

    const handleEditReservation = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!selectedReservation) return
        setIsCreating(true)
        const formData = new FormData(e.currentTarget)

        const { error } = await supabase
            .from('reservations')
            .update({
                customer_name: formData.get('name'),
                customer_phone: formData.get('phone'),
                reservation_date: formData.get('date'),
                reservation_time: formData.get('time'),
                num_people: parseInt(formData.get('guests') as string),
                notes: formData.get('notes'),
                status: formData.get('status')
            })
            .eq('id', selectedReservation.id)

        setIsCreating(false)
        if (!error) {
            setShowEditModal(false)
            setSelectedReservation(null)
            loadReservations()
        } else {
            alert("Error: " + error.message)
        }
    }

    const sendWhatsApp = (res: Reservation, type: 'confirm' | 'cancel') => {
        const phone = res.customer_phone.replace(/\s+/g, '')
        const message = type === 'confirm'
            ? `Hola ${res.customer_name}, te confirmamos tu reserva en Pargo Rojo para el día ${res.reservation_date} a las ${res.reservation_time} (${res.num_people} personas). ¡Te esperamos!`
            : `Hola ${res.customer_name}, lamentamos informarte que no tenemos disponibilidad para tu solicitud de reserva el día ${res.reservation_date} a las ${res.reservation_time}.`

        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank')
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-green-500/20 text-green-500 border-green-500/30'
            case 'pending': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'
            case 'cancelled': return 'bg-red-500/20 text-red-500 border-red-500/30'
            case 'completed': return 'bg-blue-500/20 text-blue-500 border-blue-500/30'
            default: return 'bg-gray-500/20 text-gray-500'
        }
    }

    if (loading) return <div className="p-8 text-center text-white"><Loader2 className="animate-spin inline-block mr-2" /> Cargando...</div>

    return (
        <>
            <div className="min-h-screen bg-background p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <Link href="/admin">
                                <Button variant="outline" size="icon">
                                    <ArrowLeft className="w-5 h-5" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold">Reservas</h1>
                                <p className="text-muted-foreground">Gestiona las reservas de mesas</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex gap-2 bg-card p-1 rounded-lg border border-white/10">
                                <button
                                    onClick={() => setFilter('upcoming')}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === 'upcoming' ? 'bg-primary text-black' : 'text-muted-foreground hover:text-white'}`}
                                >
                                    Próximas
                                </button>
                                <button
                                    onClick={() => setFilter('all')}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === 'all' ? 'bg-primary text-black' : 'text-muted-foreground hover:text-white'}`}
                                >
                                    Todas
                                </button>
                            </div>
                            <Button onClick={() => setShowNewModal(true)} className="bg-primary hover:bg-primary/90 text-black font-bold gap-2">
                                <Plus className="w-4 h-4" />
                                Nueva Reserva
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        {reservations.map(reservation => (
                            <div
                                key={reservation.id}
                                className="bg-card rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all"
                            >
                                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                    <div className="flex gap-6 items-start">
                                        <div className="flex flex-col items-center justify-center w-16 h-16 bg-white/5 rounded-xl border border-white/5">
                                            <div className="text-xs text-muted-foreground uppercase">{new Date(reservation.reservation_date + 'T12:00:00').toLocaleDateString('es-CO', { month: 'short' })}</div>
                                            <div className="text-2xl font-bold">{new Date(reservation.reservation_date + 'T12:00:00').getDate()}</div>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-xl font-bold">{reservation.customer_name}</h3>
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getStatusColor(reservation.status)} uppercase`}>
                                                    {reservation.status === 'pending' ? 'Pendiente' :
                                                        reservation.status === 'confirmed' ? 'Confirmada' :
                                                            reservation.status === 'cancelled' ? 'Cancelada' : 'Completada'}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1.5">
                                                    <Clock className="w-4 h-4" />
                                                    {reservation.reservation_time}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Users className="w-4 h-4" />
                                                    {reservation.num_people} personas
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Phone className="w-4 h-4" />
                                                    {reservation.customer_phone}
                                                </span>
                                            </div>
                                            {reservation.notes && (
                                                <div className="mt-2 flex items-start gap-2 text-sm text-yellow-500/80 bg-yellow-500/10 p-2 rounded-lg">
                                                    <MessageSquare className="w-4 h-4 mt-0.5" />
                                                    {reservation.notes}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 border-t md:border-t-0 pt-4 md:pt-0 border-white/5">
                                        {reservation.status === 'pending' && (
                                            <>
                                                <Button
                                                    className="bg-green-500 hover:bg-green-600 text-black font-bold gap-2"
                                                    onClick={() => {
                                                        updateStatus(reservation.id, 'confirmed')
                                                        sendWhatsApp(reservation, 'confirm')
                                                    }}
                                                >
                                                    <Check className="w-4 h-4" />
                                                    Confirmar
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="border-red-500/50 text-red-500 hover:bg-red-500/10 gap-2"
                                                    onClick={() => {
                                                        updateStatus(reservation.id, 'cancelled')
                                                        sendWhatsApp(reservation, 'cancel')
                                                    }}
                                                >
                                                    <X className="w-4 h-4" />
                                                    Rechazar
                                                </Button>
                                            </>
                                        )}
                                        {reservation.status === 'confirmed' && (
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    className="border-green-500/50 text-green-500 hover:bg-green-500/10 gap-2"
                                                    onClick={() => sendWhatsApp(reservation, 'confirm')}
                                                >
                                                    Re-enviar WhatsApp
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="border-blue-500/50 text-blue-500 hover:bg-blue-500/10 gap-2"
                                                    onClick={() => updateStatus(reservation.id, 'completed')}
                                                >
                                                    <Check className="w-4 h-4" />
                                                    Completar
                                                </Button>
                                            </div>
                                        )}
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="text-muted-foreground hover:bg-white/5"
                                            onClick={() => {
                                                setSelectedReservation(reservation)
                                                setShowEditModal(true)
                                            }}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleDelete(reservation.id);
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4 pointer-events-none" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {reservations.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                <CalendarIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                <p className="text-lg">No hay reservas {filter === 'upcoming' ? 'próximas' : 'encontradas'}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Manual Creation Modal */}
            {showNewModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card border border-white/10 p-8 rounded-[2.5rem] w-full max-xl animate-in fade-in zoom-in duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">Nueva Reserva Manual</h2>
                            <Button variant="ghost" size="icon" onClick={() => setShowNewModal(false)}>
                                <X className="w-6 h-6" />
                            </Button>
                        </div>

                        <form onSubmit={handleCreateReservation} className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-2">
                                <label className="text-sm font-medium text-white">Nombre Cliente</label>
                                <input name="name" required className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 outline-none text-white focus:border-primary/50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white">Teléfono</label>
                                <input name="phone" required className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 outline-none text-white focus:border-primary/50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white">Personas</label>
                                <input name="guests" type="number" min="1" defaultValue="2" required className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 outline-none text-white focus:border-primary/50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white">Fecha</label>
                                <input name="date" type="date" required className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 outline-none [color-scheme:dark] text-white focus:border-primary/50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white">Hora</label>
                                <input name="time" type="time" required className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 outline-none [color-scheme:dark] text-white focus:border-primary/50" />
                            </div>
                            <div className="col-span-2 space-y-2">
                                <label className="text-sm font-medium text-white">Notas / Mesa</label>
                                <textarea name="notes" placeholder="Ej: Mesa 5, Cumpleaños..." className="w-full h-24 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none resize-none text-white focus:border-primary/50" />
                            </div>
                            <div className="col-span-2 flex gap-3 mt-4">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowNewModal(false)}>Cancelar</Button>
                                <Button type="submit" disabled={isCreating} className="flex-1 bg-primary text-black font-bold">
                                    {isCreating ? <Loader2 className="animate-spin w-4 h-4" /> : "Guardar Reserva"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && selectedReservation && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card border border-white/10 p-8 rounded-[2.5rem] w-full max-w-xl animate-in fade-in zoom-in duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">Editar Reserva</h2>
                            <Button variant="ghost" size="icon" onClick={() => setShowEditModal(false)}>
                                <X className="w-6 h-6" />
                            </Button>
                        </div>

                        <form onSubmit={handleEditReservation} className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-2">
                                <label className="text-sm font-medium text-white">Nombre Cliente</label>
                                <input name="name" defaultValue={selectedReservation.customer_name} required className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 outline-none text-white focus:border-primary/50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white">Teléfono</label>
                                <input name="phone" defaultValue={selectedReservation.customer_phone} required className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 outline-none text-white focus:border-primary/50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white">Personas</label>
                                <input name="guests" type="number" min="1" defaultValue={selectedReservation.num_people} required className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 outline-none text-white focus:border-primary/50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white">Fecha</label>
                                <input name="date" type="date" defaultValue={selectedReservation.reservation_date} required className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 outline-none [color-scheme:dark] text-white focus:border-primary/50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white">Hora</label>
                                <input name="time" type="time" defaultValue={selectedReservation.reservation_time} required className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 outline-none [color-scheme:dark] text-white focus:border-primary/50" />
                            </div>
                            <div className="col-span-2 space-y-2">
                                <label className="text-sm font-medium text-white">Estado</label>
                                <select name="status" defaultValue={selectedReservation.status} className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 outline-none text-white focus:border-primary/50">
                                    <option value="pending" className="bg-slate-900">Pendiente</option>
                                    <option value="confirmed" className="bg-slate-900">Confirmada</option>
                                    <option value="cancelled" className="bg-slate-900">Cancelada</option>
                                    <option value="completed" className="bg-slate-900">Completada</option>
                                </select>
                            </div>
                            <div className="col-span-2 space-y-2">
                                <label className="text-sm font-medium text-white">Notas / Mesa</label>
                                <textarea name="notes" defaultValue={selectedReservation.notes} className="w-full h-24 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none resize-none text-white focus:border-primary/50" />
                            </div>
                            <div className="col-span-2 flex gap-3 mt-4">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowEditModal(false)}>Cancelar</Button>
                                <Button type="submit" disabled={isCreating} className="flex-1 bg-primary text-black font-bold">
                                    {isCreating ? <Loader2 className="animate-spin w-4 h-4" /> : "Actualizar Reserva"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}

