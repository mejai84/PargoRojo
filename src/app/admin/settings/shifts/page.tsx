"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Clock, Plus, Save, Trash2, Loader2, ArrowLeft, Sun, Moon, Sunset } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface ShiftDefinition {
    id: string
    name: string
    start_time: string
    end_time: string
    is_active: boolean
}

export default function ShiftSettingsPage() {
    const [shifts, setShifts] = useState<ShiftDefinition[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState<string | null>(null) // ID of shift being saved

    useEffect(() => {
        fetchShifts()
    }, [])

    const fetchShifts = async () => {
        const { data } = await supabase
            .from('shift_definitions')
            .select('*')
            .order('start_time')

        if (data) setShifts(data)
        setLoading(false)
    }

    const handleSave = async (shift: ShiftDefinition) => {
        setSaving(shift.id)
        try {
            const { error } = await supabase
                .from('shift_definitions')
                .upsert(shift)

            if (error) throw error
            alert("Turno actualizado correctamente")
        } catch (e: any) {
            alert("Error: " + e.message)
        } finally {
            setSaving(null)
        }
    }

    const handleChange = (id: string, field: keyof ShiftDefinition, value: any) => {
        setShifts(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))
    }

    const createNew = () => {
        const newShift: ShiftDefinition = {
            id: crypto.randomUUID(),
            name: "Nuevo Turno",
            start_time: "08:00:00",
            end_time: "16:00:00",
            is_active: true
        }
        setShifts([...shifts, newShift])
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 p-8 font-sans">
            <div className="max-w-5xl mx-auto space-y-12">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/admin/settings">
                            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl bg-white border border-slate-200"><ArrowLeft className="w-5 h-5" /></Button>
                        </Link>
                        <div>
                            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Configuración de <span className="text-primary">Turnos</span></h1>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">Define los horarios laborales para el cálculo de extras</p>
                        </div>
                    </div>
                    <Button onClick={createNew} className="h-14 px-8 rounded-2xl bg-indigo-600 text-white font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 gap-2">
                        <Plus className="w-5 h-5" /> Nuevo Turno
                    </Button>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 gap-6">
                    {loading ? <Loader2 className="w-10 h-10 animate-spin mx-auto text-slate-300" /> : shifts.map((shift) => (
                        <div key={shift.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all flex flex-col md:flex-row items-center gap-8 group">

                            {/* Icon */}
                            <div className={cn(
                                "w-20 h-20 rounded-[1.5rem] flex items-center justify-center transition-all",
                                shift.name.toLowerCase().includes('mañana') ? "bg-amber-50 text-amber-500" :
                                    shift.name.toLowerCase().includes('tarde') ? "bg-orange-50 text-orange-500" :
                                        shift.name.toLowerCase().includes('noche') ? "bg-indigo-50 text-indigo-500" : "bg-slate-50 text-slate-400"
                            )}>
                                {shift.name.toLowerCase().includes('mañana') ? <Sun className="w-8 h-8" /> :
                                    shift.name.toLowerCase().includes('tarde') ? <Sunset className="w-8 h-8" /> :
                                        shift.name.toLowerCase().includes('noche') ? <Moon className="w-8 h-8" /> : <Clock className="w-8 h-8" />}
                            </div>

                            {/* Inputs */}
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-2">Nombre Turno</label>
                                    <input
                                        value={shift.name}
                                        onChange={(e) => handleChange(shift.id, 'name', e.target.value)}
                                        className="w-full h-14 rounded-2xl bg-slate-50 border border-slate-200 px-4 font-black italic uppercase text-slate-900 outline-none focus:border-primary transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-2">Hora Inicio</label>
                                    <input
                                        type="time"
                                        value={shift.start_time}
                                        onChange={(e) => handleChange(shift.id, 'start_time', e.target.value)}
                                        className="w-full h-14 rounded-2xl bg-slate-50 border border-slate-200 px-4 font-bold text-slate-900 outline-none focus:border-primary transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-2">Hora Fin</label>
                                    <input
                                        type="time"
                                        value={shift.end_time}
                                        onChange={(e) => handleChange(shift.id, 'end_time', e.target.value)}
                                        className="w-full h-14 rounded-2xl bg-slate-50 border border-slate-200 px-4 font-bold text-slate-900 outline-none focus:border-primary transition-all"
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <Button
                                    onClick={() => handleSave(shift)}
                                    disabled={saving === shift.id}
                                    className="h-14 w-14 rounded-2xl bg-slate-900 text-white hover:bg-black transition-all shadow-md"
                                >
                                    {saving === shift.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        if (confirm("¿Eliminar turno?")) {
                                            setShifts(prev => prev.filter(s => s.id !== shift.id))
                                            // TODO: delete from DB
                                        }
                                    }}
                                    className="h-14 w-14 rounded-2xl text-rose-500 hover:bg-rose-50 hover:text-rose-600 border border-rose-100"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </Button>
                            </div>

                        </div>
                    ))}
                </div>

            </div>
        </div>
    )
}
