'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { startShift } from "@/actions/pos"
import { supabase } from "@/lib/supabase/client"
import { Loader2, Sun, Moon, Sunset, Clock, Users, ArrowRight, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

// Removí 'sonner' porque no estoy seguro si está instalado en tu proyecto.
// Usaré alert/console temporalmente o componentes nativos si fallara.

export default function StartShiftPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [shifts, setShifts] = useState<any[]>([])
    const [fetchingShifts, setFetchingShifts] = useState(true)
    const [recommendedShiftId, setRecommendedShiftId] = useState<string | null>(null)

    useEffect(() => {
        const init = async () => {
            // 1. Obtener Usuario
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).single()
                setUser({ ...user, profile })
            }

            // 2. Cargar turnos configurados
            const { data } = await supabase
                .from('shift_definitions')
                .select('*')
                .eq('is_active', true)
                .order('start_time')

            setShifts(data || [])
            setFetchingShifts(false)

            // 3. Calcular turno recomendado
            if (data) {
                const currentHour = new Date().getHours()
                // Lógica simple de recomendación basada en hora de inicio
                // Mañana: 06-14, Tarde: 14-22, Noche: 22-06
                // Asumimos que start_time viene como 'HH:MM:SS'
                const recommended = data.find(s => {
                    const start = parseInt(s.start_time.split(':')[0])
                    const end = parseInt(s.end_time.split(':')[0])

                    // Manejo de turno nocturno que cruza medianoche (ej: 22 a 06)
                    if (start > end) {
                        return currentHour >= start || currentHour < end
                    }
                    return currentHour >= start && currentHour < end
                })

                if (recommended) setRecommendedShiftId(recommended.id)
            }
        }
        init()
    }, [])

    const handleStartShift = async (shiftDefId: string) => {
        setLoading(true)
        try {
            const result = await startShift(shiftDefId)

            if (result.success) {
                router.push("/admin/cashier/open-box")
            } else {
                alert("Atención: " + (result.error || "Error desconocido"))
                setLoading(false)
            }
        } catch (error: any) {
            console.error("Error en el cliente:", error)
            alert("Error crítico: " + error.message)
            setLoading(false)
        }
    }

    const getShiftIcon = (name: string) => {
        const n = name.toLowerCase()
        if (n.includes('mañana') || n.includes('día')) return <Sun className="w-12 h-12 text-amber-500" />
        if (n.includes('tarde')) return <Sunset className="w-12 h-12 text-orange-500" />
        if (n.includes('noche')) return <Moon className="w-12 h-12 text-indigo-500" />
        return <Clock className="w-12 h-12 text-slate-400" />
    }

    const getShiftColor = (name: string) => {
        const n = name.toLowerCase()
        if (n.includes('mañana')) return "border-amber-200 bg-amber-50/50 hover:border-amber-400 hover:bg-amber-50"
        if (n.includes('tarde')) return "border-orange-200 bg-orange-50/50 hover:border-orange-400 hover:bg-orange-50"
        if (n.includes('noche')) return "border-indigo-200 bg-indigo-50/50 hover:border-indigo-400 hover:bg-indigo-50"
        return "border-slate-200 bg-slate-50/50 hover:border-slate-400 hover:bg-slate-50"
    }

    if (fetchingShifts) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
            <div className="max-w-5xl w-full space-y-12 animate-in fade-in zoom-in-95 duration-500">

                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-slate-900">
                        ¡Hola, <span className="text-primary">{user?.profile?.full_name?.split(' ')[0] || 'Compañero'}</span>! 👋
                    </h1>
                    <p className="text-slate-500 text-xl max-w-2xl mx-auto">
                        Selecciona tu jornada para hoy <span className="font-bold text-slate-900">{new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                    </p>
                </div>

                {/* Grid de Turnos */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {shifts.map((shift) => {
                        const isRecommended = shift.id === recommendedShiftId

                        return (
                            <div
                                key={shift.id}
                                onClick={() => !loading && handleStartShift(shift.id)}
                                className={cn(
                                    "relative group cursor-pointer rounded-[2.5rem] p-8 border-2 transition-all duration-300 transform flex flex-col items-center text-center gap-6",
                                    getShiftColor(shift.name),
                                    isRecommended ? "ring-4 ring-primary/20 scale-105 shadow-2xl z-10 bg-white" : "opacity-80 hover:opacity-100 bg-white hover:-translate-y-2 shadow-sm hover:shadow-xl"
                                )}
                            >
                                {isRecommended && (
                                    <div className="absolute -top-4 bg-primary text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-lg flex items-center gap-2 animate-bounce">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Turno Actual
                                    </div>
                                )}

                                <div className="p-6 bg-white rounded-3xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                                    {getShiftIcon(shift.name)}
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900">
                                        {shift.name}
                                    </h3>
                                    <p className="text-lg font-bold text-slate-400 font-mono">
                                        {shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)}
                                    </p>
                                </div>

                                <div className="w-full pt-4 mt-auto">
                                    <Button
                                        className={cn(
                                            "w-full rounded-2xl font-black h-14 text-base tracking-wide uppercase",
                                            loading ? "opacity-50 cursor-not-allowed" : ""
                                        )}
                                        disabled={loading}
                                        variant={isRecommended ? "default" : "outline"}
                                    >
                                        {loading && isRecommended ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                {isRecommended ? "MARCAR ENTRADA" : "Seleccionar"}
                                                {!loading && <ArrowRight className="ml-2 w-5 h-5" />}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Footer Info */}
                <div className="text-center">
                    <p className="text-xs text-slate-400 font-medium max-w-md mx-auto">
                        Al marcar entrada, se registrará tu hora de inicio exacta: <span className="font-mono text-slate-600 font-bold">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>.
                    </p>
                </div>

            </div>
        </div>
    )
}
