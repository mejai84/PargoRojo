"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, User, MessageSquare, CheckCircle, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ReservationsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        date: '',
        time: '',
        guests: 2,
        notes: ''
    })

    const today = new Date().toISOString().split('T')[0]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { error } = await supabase
                .from('reservations')
                .insert({
                    customer_name: formData.name,
                    phone: formData.phone,
                    reservation_date: formData.date,
                    reservation_time: formData.time,
                    guests: formData.guests,
                    notes: formData.notes,
                    status: 'pending' // pending confirmation
                })

            if (error) throw error

            setSuccess(true)
        } catch (error) {
            console.error('Error creating reservation:', error)
            alert('Hubo un error al crear la reserva. Por favor intenta de nuevo.')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-6">
                <div className="bg-card w-full max-w-md p-8 rounded-3xl border border-white/10 text-center">
                    <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-bold mb-4">¡Reserva Recibida!</h2>
                    <p className="text-muted-foreground mb-8">
                        Hemos recibido tu solicitud de reserva para el {formData.date} a las {formData.time}.
                        <br />
                        Te confirmaremos por teléfono o WhatsApp en breve.
                    </p>
                    <Button
                        onClick={() => router.push('/')}
                        className="w-full h-12 text-lg rounded-xl"
                    >
                        Volver al Inicio
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Hero Section */}
            <div className="relative h-[40vh] bg-[url('/images/hero-bg.jpg')] bg-cover bg-center">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent">
                    <div className="absolute bottom-0 left-0 p-8">
                        <h1 className="text-5xl font-bold mb-4">Reservas</h1>
                        <p className="text-xl text-gray-300">Reserva tu mesa en el mejor ambiente</p>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto p-6 -mt-20 relative z-10">
                <div className="bg-card rounded-3xl border border-white/10 p-8 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-400">
                                    <User className="w-4 h-4" /> NOMBRE
                                </label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-lg focus:border-primary focus:outline-none transition-colors"
                                    placeholder="Tu nombre completo"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-400">
                                    <MessageSquare className="w-4 h-4" /> TELÉFONO
                                </label>
                                <input
                                    required
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-lg focus:border-primary focus:outline-none transition-colors"
                                    placeholder="300 123 4567"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-400">
                                    <Calendar className="w-4 h-4" /> FECHA
                                </label>
                                <input
                                    required
                                    type="date"
                                    min={today}
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-lg focus:border-primary focus:outline-none transition-colors [color-scheme:dark]"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-400">
                                    <Clock className="w-4 h-4" /> HORA
                                </label>
                                <select
                                    required
                                    value={formData.time}
                                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-lg focus:border-primary focus:outline-none transition-colors appearance-none cursor-pointer"
                                >
                                    <option value="" className="bg-gray-900">Seleccionar hora</option>
                                    <option value="12:00" className="bg-gray-900">12:00 PM - Almuerzo</option>
                                    <option value="13:00" className="bg-gray-900">01:00 PM - Almuerzo</option>
                                    <option value="14:00" className="bg-gray-900">02:00 PM - Almuerzo</option>
                                    <option value="15:00" className="bg-gray-900">03:00 PM - Tarde</option>
                                    <option value="19:00" className="bg-gray-900">07:00 PM - Cena</option>
                                    <option value="20:00" className="bg-gray-900">08:00 PM - Cena</option>
                                    <option value="21:00" className="bg-gray-900">09:00 PM - Cena</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-400">
                                <User className="w-4 h-4" /> PERSONAS
                            </label>
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15].map(num => (
                                    <button
                                        key={num}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, guests: num })}
                                        className={`
                                            w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg transition-all
                                            ${formData.guests === num
                                                ? 'bg-primary text-black scale-110 shadow-lg shadow-primary/50'
                                                : 'bg-white/5 hover:bg-white/10'}
                                        `}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-400">
                                <MessageSquare className="w-4 h-4" /> MENSAJE ESPECIAL (Opcional)
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-base focus:border-primary focus:outline-none transition-colors h-32 resize-none"
                                placeholder="Celebración de cumpleaños, alergias, ubicación preferida..."
                            />
                        </div>

                        <Button
                            disable={loading}
                            type="submit"
                            className="w-full h-16 text-xl font-bold rounded-2xl bg-primary hover:bg-primary/90 text-black shadow-xl shadow-primary/20"
                        >
                            {loading ? (
                                <><Loader2 className="w-6 h-6 mr-2 animate-spin" /> Reservando...</>
                            ) : (
                                "CONFIRMAR RESERVA"
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    )
}
