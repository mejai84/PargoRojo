'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { startShift } from "@/actions/pos"
import { supabase } from "@/lib/supabase/client"
import { Loader2, Sun, Moon, Sunset, Clock, CalendarDays, ArrowRight } from "lucide-react"

export default function StartShiftPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [shifts, setShifts] = useState<any[]>([])
    const [fetchingShifts, setFetchingShifts] = useState(true)

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
                setUser({ ...user, profile })
            }

            // Cargar turnos configurados
            const { data } = await supabase.from('shift_definitions').select('*').eq('is_active', true).order('start_time')
            setShifts(data || [])
            setFetchingShifts(false)
        }
        init()
    }, [])

    const handleStartShift = async (shiftId: string) => {
        setLoading(true)
        try {
            if (!user) return
            await startShift(user.id, shiftId)
            router.push("/admin/cashier/open-box") // Siguiente paso lógico
        } catch (error: any) {
            alert(error.message)
            setLoading(false)
        }
    }

    const getIcon = (name: string) => {
        const n = name.toLowerCase()
        if (n.includes('mañana')) return <Sun className="w-12 h-12 text-amber-500" />
        if (n.includes('tarde')) return <Sunset className="w-12 h-12 text-orange-500" />
        if (n.includes('noche')) return <Moon className="w-12 h-12 text-indigo-500" />
        return <Clock className="w-12 h-12 text-slate-400" />
    }

    const getColor = (name: string) => {
        const n = name.toLowerCase()
        if (n.includes('mañana')) return "hover:bg-amber-50 hover:border-amber-400 text-amber-600"
        if (n.includes('tarde')) return "hover:bg-orange-50 hover:border-orange-500 text-orange-600"
        if (n.includes('noche')) return "hover:bg-indigo-50 hover:border-indigo-600 text-indigo-600"
        return "hover:bg-slate-50 hover:border-slate-300 text-slate-600"
    }

    if (fetchingShifts) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Loader2 className="w-10 h-10 animate-spin text-slate-300" />
        </div>
    )

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-8">
            <div className="max-w-4xl w-full space-y-12 animate-in fade-in zoom-in-95 duration-500">

                <div className="text-center space-y-6">
                    <div className="inline-flex p-6 rounded-[2.5rem] bg-white text-primary mb-4 border border-slate-100 shadow-xl shadow-slate-200/50">
                        <CalendarDays className="w-16 h-16" />
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase italic text-slate-900">
                        Iniciar <span className="text-primary">Jornada</span>
                    </h1>
                    <p className="text-xl text-slate-400 font-bold max-w-lg mx-auto uppercase tracking-widest">
                        Hola, <span className="text-slate-900 italic">{user?.profile?.full_name || 'Cajero'}</span>.
                        <br />Selecciona tu horario asignado.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {shifts.map(shift => (
                        <button
                            key={shift.id}
                            onClick={() => handleStartShift(shift.id)}
                            disabled={loading}
                            className={`group relative h-64 bg-white border border-slate-200 rounded-[3rem] p-8 text-left transition-all duration-300 overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 flex flex-col justify-between ${getColor(shift.name)}`}
                        >
                            <div className="absolute right-0 top-0 p-8 opacity-5 group-hover:opacity-10 group-hover:scale-150 transition-transform duration-700">
                                {getIcon(shift.name)}
                            </div>

                            <div className="relative z-10 flex justify-between items-start">
                                <span className="p-4 bg-slate-50 group-hover:bg-white w-fit rounded-3xl shadow-sm transition-colors mb-4 block">
                                    {getIcon(shift.name)}
                                </span>
                            </div>

                            <div className="relative z-10">
                                <h3 className="text-3xl font-black uppercase italic tracking-tighter mb-2 text-slate-900">{shift.name}</h3>
                                <p className="text-sm font-black opacity-60 uppercase tracking-widest flex items-center gap-2">
                                    {shift.start_time.slice(0, 5)} <ArrowRight className="w-4 h-4" /> {shift.end_time.slice(0, 5)}
                                </p>
                            </div>
                        </button>
                    ))}

                    {shifts.length === 0 && (
                        <div className="col-span-full text-center p-12 bg-white rounded-[3rem] border border-dashed border-slate-300">
                            <p className="text-slate-400 font-black uppercase tracking-widest italic">No hay turnos configurados.</p>
                            <p className="text-xs text-slate-300 mt-2">Contacta al administrador del sistema.</p>
                        </div>
                    )}
                </div>

                {loading && (
                    <div className="flex flex-col items-center justify-center gap-4 text-primary animate-pulse py-8">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="font-black text-xs tracking-[0.3em] uppercase italic">Configurando entorno POS...</span>
                    </div>
                )}
            </div>
        </div>
    )
}
