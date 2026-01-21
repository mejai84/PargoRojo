"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon, Clock, Users, Phone, MessageSquare, Check, X, ArrowLeft, Trash2 } from "lucide-react"
import Link from "next/link"

type Reservation = {
    id: string
    customer_name: string
    phone: string
    reservation_date: string
    reservation_time: string
    guests: number
    notes: string
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
}

export default function AdminReservationsPage() {
    const [reservations, setReservations] = useState<Reservation[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('upcoming') // upcoming, all

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

    const updateStatus = async (id: string, status: string) => {
        await supabase
            .from('reservations')
            .update({ status })
            .eq('id', id)

        loadReservations()
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

    if (loading) return <div className="p-8 text-center">Cargando...</div>

    return (
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
                                        <div className="text-xs text-muted-foreground uppercase">{new Date(reservation.reservation_date).toLocaleDateString('es-CO', { month: 'short' })}</div>
                                        <div className="text-2xl font-bold">{new Date(reservation.reservation_date).getDate()}</div>
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
                                                {reservation.guests} personas
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Phone className="w-4 h-4" />
                                                {reservation.phone}
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
                                                onClick={() => updateStatus(reservation.id, 'confirmed')}
                                            >
                                                <Check className="w-4 h-4" />
                                                Confirmar
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="border-red-500/50 text-red-500 hover:bg-red-500/10 gap-2"
                                                onClick={() => updateStatus(reservation.id, 'cancelled')}
                                            >
                                                <X className="w-4 h-4" />
                                                Rechazar
                                            </Button>
                                        </>
                                    )}
                                    {reservation.status === 'confirmed' && (
                                        <Button
                                            variant="outline"
                                            className="border-blue-500/50 text-blue-500 hover:bg-blue-500/10 gap-2"
                                            onClick={() => updateStatus(reservation.id, 'completed')}
                                        >
                                            <Check className="w-4 h-4" />
                                            Marcar Completada
                                        </Button>
                                    )}
                                    {reservation.status !== 'pending' && (
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="text-muted-foreground hover:text-white"
                                            onClick={() => {
                                                if (confirm('¿Eliminar reserva?')) {
                                                    supabase.from('reservations').delete().eq('id', reservation.id).then(loadReservations)
                                                }
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
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
    )
}
