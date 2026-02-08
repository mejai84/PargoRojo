'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { startShift } from "@/actions/pos"
import { supabase } from "@/lib/supabase/client"
import { Loader2, Sun, Moon, Sunset, Clock, Users, ArrowRight, CheckCircle2, Wallet } from "lucide-react"
import { cn, formatPrice } from "@/lib/utils"

// Removí 'sonner' porque no estoy seguro si está instalado en tu proyecto.
// Usaré alert/console temporalmente o componentes nativos si fallara.

export default function StartShiftPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [shifts, setShifts] = useState<any[]>([])
    const [fetchingShifts, setFetchingShifts] = useState(true)
    const [recommendedShiftId, setRecommendedShiftId] = useState<string | null>(null)
    const [activeShift, setActiveShift] = useState<any>(null)
    const [elapsedTime, setElapsedTime] = useState("")
    const [shiftTips, setShiftTips] = useState(0)

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

            // 3. Verificar si ya hay un turno activo
            if (user) {
                const { data: active } = await supabase
                    .from('shifts')
                    .select('*, shift_definitions(name)')
                    .eq('user_id', user.id)
                    .is('ended_at', null)
                    .order('started_at', { ascending: false })
                    .limit(1)
                    .single()

                if (active) {
                    setActiveShift(active)

                    // 3.1 Cargar Propinas de ESTE turno
                    const { data: shiftOrders } = await supabase
                        .from('orders')
                        .select('tip_amount')
                        .eq('waiter_id', user.id)
                        .gte('created_at', active.started_at)

                    const totalTips = shiftOrders?.reduce((sum, o) => sum + (Number(o.tip_amount) || 0), 0) || 0
                    setShiftTips(totalTips)
                }
            }

            // 4. Calcular turno recomendado
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

    useEffect(() => {
        if (!activeShift) return

        const timer = setInterval(() => {
            const start = new Date(activeShift.started_at).getTime()
            const now = new Date().getTime()
            const diff = now - start

            const hours = Math.floor(diff / (1000 * 60 * 60))
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
            const seconds = Math.floor((diff % (1000 * 60)) / 1000)

            setElapsedTime(`${hours}h ${minutes}m ${seconds}s`)
        }, 1000)

        return () => clearInterval(timer)
    }, [activeShift])

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

    const getMotivationalMessage = () => {
        const hour = new Date().getHours()
        if (hour < 12) return "¡Buenos días! Que hoy sea un gran servicio con excelentes propinas."
        if (hour < 18) return "¡Buenas tardes! Mantén la energía alta, el salón se ve genial."
        return "¡Buenas noches! Vamos por ese último cierre con broche de oro."
    }

    const getBreakReminder = (elapsedMs: number) => {
        const hours = elapsedMs / (1000 * 60 * 60)
        if (hours > 6) return "⚠️ Has superado las 6 horas. ¡No olvides hidratarte!"
        if (hours > 4) return "🔔 Llevas 4 horas. Buen momento para una pausa corta."
        return "✨ Servicio estable. ¡Sigue así!"
    }

    if (fetchingShifts) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        )
    }

    if (activeShift) {
        const elapsedMs = new Date().getTime() - new Date(activeShift.started_at).getTime()

        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 pb-20">
                <div className="max-w-4xl w-full space-y-8 animate-in zoom-in duration-500">

                    {/* Tarjeta Principal de Bienvenida */}
                    <div className="bg-white rounded-[4rem] p-10 md:p-16 shadow-2xl border border-slate-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-primary/10 transition-colors" />

                        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                            <div className="w-24 h-24 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-emerald-500/20 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                                <CheckCircle2 className="w-12 h-12 text-white" />
                            </div>

                            <div className="space-y-2">
                                <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
                                    ¡VAMOS CON <span className="text-primary italic">TODA!</span>
                                </h1>
                                <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] italic">
                                    {getMotivationalMessage()}
                                </p>
                            </div>
                        </div>

                        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Stats Cards */}
                            <div className="bg-slate-50 rounded-[2.5rem] p-8 space-y-4 border border-slate-100 hover:scale-105 transition-transform">
                                <div className="p-3 bg-white w-fit rounded-2xl shadow-sm">
                                    <Clock className="w-6 h-6 text-slate-900" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">TIEMPO EN SERVICIO</p>
                                    <p className="text-2xl font-black text-slate-900 font-mono italic">{elapsedTime || '---'}</p>
                                </div>
                            </div>

                            <div className="bg-emerald-50 rounded-[2.5rem] p-8 space-y-4 border border-emerald-100 hover:scale-105 transition-transform">
                                <div className="p-3 bg-white w-fit rounded-2xl shadow-sm">
                                    <Wallet className="w-6 h-6 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest italic">PROPINAS ACUMULADAS</p>
                                    <p className="text-2xl font-black text-emerald-600 italic">{formatPrice(shiftTips)}</p>
                                </div>
                            </div>

                            <div className="bg-slate-900 rounded-[2.5rem] p-8 space-y-4 border border-slate-800 hover:scale-105 transition-transform">
                                <div className="p-3 bg-white/10 w-fit rounded-2xl shadow-sm">
                                    <Users className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest italic text-left">STATUS DE SALUD</p>
                                    <p className="text-xs font-bold text-white italic text-left leading-tight mt-1">{getBreakReminder(elapsedMs)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-slate-50 rounded-[3rem] border border-slate-100">
                            <div className="flex items-center gap-6">
                                <div className="text-left">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">HORA DE ENTRADA</p>
                                    <p className="text-xl font-black text-slate-900">{new Date(activeShift.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                                <div className="w-[1px] h-10 bg-slate-200" />
                                <div className="text-left">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">TURNO</p>
                                    <p className="text-xl font-black text-slate-900 uppercase italic">{activeShift.shift_definitions?.name || '---'}</p>
                                </div>
                            </div>

                            <Button
                                onClick={() => router.push('/admin/orders')}
                                className="w-full md:w-auto h-20 px-12 bg-primary text-black rounded-[2rem] font-black uppercase italic tracking-tighter text-lg hover:scale-105 transition-all shadow-2xl shadow-primary/20 flex items-center gap-4"
                            >
                                IR A COMANDAS <ArrowRight className="w-6 h-6" />
                            </Button>
                        </div>
                    </div>

                    <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] italic">POWERED BY JAMALI OS • CLOUD EDITION</p>
                </div>
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
                    <p className="text-xs text-slate-300 font-black uppercase tracking-[0.3em] max-w-md mx-auto italic">
                        Al marcar entrada, se registrará tu hora de inicio exacta: <span className="text-slate-500">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </p>
                </div>

            </div>
        </div>
    )
}
