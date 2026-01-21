
"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/store/navbar"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Users, MessageSquare, CheckCircle2, ChevronRight, Loader2 } from "lucide-react"
import { createReservation } from "@/app/actions/reservations"

export default function ReservarPage() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            setIsAuthenticated(!!session)
        }
        checkAuth()
    }, [])

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsSubmitting(true)

        const formData = new FormData(e.currentTarget)
        const result = await createReservation(formData)

        setIsSubmitting(false)
        if (result.success) {
            setIsSuccess(true)
        } else {
            alert("Hubo un error al crear la reserva: " + result.error)
        }
    }

    if (isAuthenticated === null) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Navbar />
                <main className="flex-1 flex items-center justify-center p-6">
                    <div className="max-w-md w-full bg-card border border-white/10 p-8 rounded-[2.5rem] text-center space-y-6 animate-in fade-in zoom-in duration-500">
                        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="w-10 h-10 text-primary" />
                        </div>
                        <h1 className="text-3xl font-bold">Reserva tu Mesa</h1>
                        <p className="text-muted-foreground">
                            Para realizar una reserva, necesitas tener una cuenta con nosotros. Es rápido y te permitirá gestionar tus reservas fácilmente.
                        </p>
                        <div className="space-y-3">
                            <Button
                                onClick={() => window.location.href = "/login?redirect=/reservar"}
                                className="w-full h-12 rounded-xl text-lg font-bold"
                            >
                                Iniciar Sesión / Registrarse
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => window.location.href = "/"}
                                className="w-full"
                            >
                                Volver al Inicio
                            </Button>
                        </div>
                    </div>
                </main>
            </div>
        )
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Navbar />
                <main className="flex-1 flex items-center justify-center p-6">
                    <div className="max-w-md w-full bg-card border border-white/10 p-8 rounded-[2.5rem] text-center space-y-6 animate-in fade-in zoom-in duration-500">
                        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-10 h-10 text-primary" />
                        </div>
                        <h1 className="text-3xl font-bold">¡Reserva Recibida!</h1>
                        <p className="text-muted-foreground">
                            Hemos recibido tu solicitud de reserva.
                            <span className="block font-bold text-primary mt-2">La reserva se confirmará sujeta a disponibilidad.</span>
                            Te contactaremos pronto por teléfono o correo electrónico para confirmar si hay mesa disponible.
                        </p>
                        <Button onClick={() => window.location.href = "/"} className="w-full h-12 rounded-xl text-base font-bold">
                            Volver al Inicio
                        </Button>
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            <main className="flex-1 container mx-auto px-6 pt-32 pb-20">
                <div className="max-w-4xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-start">

                        {/* Left Side: Info */}
                        <div className="space-y-8 animate-in fade-in slide-in-from-left-5 duration-700">
                            <div className="space-y-4">
                                <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold border border-primary/20">
                                    Reservas Online
                                </span>
                                <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                                    Reserva tu <br />
                                    <span className="text-gradient">Mesa en Gran Rafa</span>
                                </h1>
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    Asegura tu lugar en el mejor restaurante de Caucasia. Disfruta de un ambiente único y la mejor gastronomía del Caribe.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                                        <Clock className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold">Horario de Atención</h3>
                                        <p className="text-sm text-muted-foreground">Lunes a Domingo: 07:00 AM - 10:00 PM</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                                    <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center">
                                        <Users className="w-6 h-6 text-secondary" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold">Grupos Grandes</h3>
                                        <p className="text-sm text-muted-foreground">Para más de 10 personas, llámanos directamente.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Form */}
                        <div className="bg-card border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-right-5 duration-700 delay-200">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -z-10 rounded-full" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/10 blur-3xl -z-10 rounded-full" />

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium ml-1">Nombre Completo</label>
                                    <input
                                        name="name"
                                        required
                                        placeholder="Juan Perez"
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none focus:border-primary/50 transition-colors"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium ml-1">Correo Electrónico</label>
                                        <input
                                            name="email"
                                            type="email"
                                            required
                                            placeholder="juan@example.com"
                                            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none focus:border-primary/50 transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium ml-1">Teléfono</label>
                                        <input
                                            name="phone"
                                            type="tel"
                                            required
                                            placeholder="300 123 4567"
                                            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none focus:border-primary/50 transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium ml-1 flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5" /> Fecha
                                        </label>
                                        <input
                                            name="date"
                                            type="date"
                                            required
                                            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none focus:border-primary/50 transition-colors [color-scheme:dark]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium ml-1 flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" /> Hora
                                        </label>
                                        <input
                                            name="time"
                                            type="time"
                                            required
                                            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none focus:border-primary/50 transition-colors [color-scheme:dark]"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium ml-1 flex items-center gap-1.5">
                                        <Users className="w-3.5 h-3.5" /> Número de Personas
                                    </label>
                                    <select
                                        name="guests"
                                        required
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none focus:border-primary/50 transition-colors appearance-none"
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                            <option key={n} value={n} className="bg-background">{n} {n === 1 ? 'Persona' : 'Personas'}</option>
                                        ))}
                                        <option value="11" className="bg-background">Más de 10</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium ml-1 flex items-center gap-1.5">
                                        <MessageSquare className="w-3.5 h-3.5" /> Notas Especiales
                                    </label>
                                    <textarea
                                        name="notes"
                                        placeholder="Cumpleaños, alergias, preferencia de mesa..."
                                        rows={3}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 outline-none focus:border-primary/50 transition-colors resize-none"
                                    />
                                </div>

                                <Button
                                    disabled={isSubmitting}
                                    className="w-full h-14 rounded-2xl text-lg font-bold mt-4 shadow-lg shadow-primary/25 group"
                                >
                                    {isSubmitting ? "Procesando..." : "Confirmar Reserva"}
                                    <ChevronRight className={`ml-2 w-5 h-5 transition-transform ${isSubmitting ? 'translate-x-10 opacity-0' : 'group-hover:translate-x-1'}`} />
                                </Button>

                                <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest mt-4">
                                    Sujeto a disponibilidad y confirmación
                                </p>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
