"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
    Clock,
    Plus,
    Save,
    Trash2,
    Loader2,
    ArrowLeft,
    Sun,
    Moon,
    Sunset,
    Zap,
    Calendar,
    Timer,
    History,
    ArrowRight
} from "lucide-react"
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
    const [saving, setSaving] = useState<string | null>(null)

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
            // Opción de feedback más visual después
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
            name: "NUEVO CICLO",
            start_time: "08:00:00",
            end_time: "16:00:00",
            is_active: true
        }
        setShifts([...shifts, newShift])
    }

    const deleteShift = async (id: string) => {
        if (!confirm("¿Eliminar este ciclo operativo de forma permanente?")) return

        try {
            const { error } = await supabase
                .from('shift_definitions')
                .delete()
                .eq('id', id)

            if (error) throw error
            setShifts(prev => prev.filter(s => s.id !== id))
        } catch (e: any) {
            alert("Error al eliminar: " + e.message)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-transparent">
                <div className="flex flex-col items-center gap-4 animate-in fade-in duration-1000">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary italic">Sincronizando Ciclos...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-transparent text-foreground p-4 md:p-8 font-sans selection:bg-primary selection:text-primary-foreground relative">
            <div className="max-w-[1200px] mx-auto space-y-12 animate-in fade-in duration-1000">

                {/* 🔝 STRATEGIC HEADER */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 border-b border-border/50 pb-10">
                    <div className="flex items-center gap-6">
                        <Link href="/admin/settings">
                            <Button variant="ghost" size="icon" className="h-16 w-16 rounded-2xl bg-card border border-border shadow-2xl hover:bg-muted active:scale-90 transition-all group">
                                <ArrowLeft className="w-8 h-8 group-hover:-translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <h1 className="text-5xl font-black italic uppercase tracking-tighter text-foreground leading-none">Matriz de <span className="text-primary italic">Turnos</span></h1>
                                <div className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[9px] font-black text-primary tracking-[0.2em] italic uppercase shadow-sm">
                                    CHRONOS ENGINE v2.0
                                </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.4em] italic flex items-center gap-2 opacity-60">
                                <History className="w-3.5 h-3.5 text-primary" /> Definición de Ciclos Operativos y Control Horario Maestro
                            </p>
                        </div>
                    </div>

                    <Button
                        onClick={createNew}
                        className="h-16 px-10 bg-foreground text-background hover:bg-primary hover:text-primary-foreground font-black uppercase text-[10px] tracking-[0.2em] italic rounded-2xl shadow-3xl transition-all gap-4 border-none active:scale-95 group"
                    >
                        <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                        INSTANCIAR NUEVO CICLO
                    </Button>
                </div>

                {/* 📊 ANALYTIC MINI HUB */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-card border border-border p-8 rounded-[2.5rem] shadow-xl flex items-center gap-6 group hover:border-primary/20 transition-all">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Timer className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground italic">Ciclos Activos</p>
                            <p className="text-2xl font-black italic text-foreground uppercase">{shifts.filter(s => s.is_active).length} NODOS</p>
                        </div>
                    </div>
                    <div className="bg-card border border-border p-8 rounded-[2.5rem] shadow-xl flex items-center gap-6 group hover:border-emerald-500/20 transition-all">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                            <Zap className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground italic">Optimización</p>
                            <p className="text-2xl font-black italic text-foreground uppercase">REAL-TIME</p>
                        </div>
                    </div>
                    <div className="bg-card border border-border p-8 rounded-[2.5rem] shadow-xl flex items-center gap-6 group hover:border-amber-500/20 transition-all">
                        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                            <Calendar className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground italic">Frecuencia</p>
                            <p className="text-2xl font-black italic text-foreground uppercase">24/7 SYSTEM</p>
                        </div>
                    </div>
                </div>

                {/* 🕒 SHIFT DEFINITION NODES */}
                <div className="grid grid-cols-1 gap-8">
                    {shifts.map((shift) => (
                        <div key={shift.id} className="bg-card p-10 rounded-[3.5rem] border border-border shadow-2xl relative overflow-hidden group/card animate-in slide-in-from-bottom-8 duration-700 flex flex-col lg:flex-row items-center gap-12 hover:border-primary/20 transition-all">

                            {/* Visual Indicator of time */}
                            <div className={cn(
                                "w-24 h-24 rounded-[2rem] flex items-center justify-center shrink-0 shadow-inner transition-all duration-700 relative z-10",
                                shift.name.toLowerCase().includes('mañana') ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                                    shift.name.toLowerCase().includes('tarde') ? "bg-orange-500/10 text-orange-500 border border-orange-500/20" :
                                        shift.name.toLowerCase().includes('noche') ? "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20" : "bg-muted/50 text-muted-foreground border border-border/50"
                            )}>
                                {shift.name.toLowerCase().includes('mañana') ? <Sun className="w-10 h-10 animate-spin-slow" /> :
                                    shift.name.toLowerCase().includes('tarde') ? <Sunset className="w-10 h-10" /> :
                                        shift.name.toLowerCase().includes('noche') ? <Moon className="w-10 h-10" /> : <Clock className="w-10 h-10" />}
                            </div>

                            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-8 w-full relative z-10">
                                <div className="space-y-3 md:col-span-2 group/input">
                                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 ml-6 italic group-focus-within/input:text-primary transition-colors">Identificador del Ciclo</label>
                                    <input
                                        value={shift.name}
                                        onChange={(e) => handleChange(shift.id, 'name', e.target.value.toUpperCase())}
                                        className="w-full h-18 bg-muted/30 border border-border rounded-[2rem] px-8 font-black italic uppercase text-foreground outline-none focus:border-primary transition-all text-xl tracking-tighter shadow-inner"
                                        placeholder="EJ: TURNO MATUTINO..."
                                    />
                                </div>
                                <div className="space-y-3 group/input">
                                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 ml-6 italic">Ingreso Alpha</label>
                                    <div className="relative">
                                        <Clock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-30 group-focus-within/input:text-primary transition-colors" />
                                        <input
                                            type="time"
                                            value={shift.start_time}
                                            onChange={(e) => handleChange(shift.id, 'start_time', e.target.value)}
                                            className="w-full h-18 bg-muted/30 border border-border rounded-2xl pl-14 pr-6 font-black text-xl italic text-foreground outline-none focus:border-primary transition-all shadow-inner"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3 group/input">
                                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 ml-6 italic">Cierre Omega</label>
                                    <div className="relative">
                                        <Clock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-30 group-focus-within/input:text-primary transition-colors" />
                                        <input
                                            type="time"
                                            value={shift.end_time}
                                            onChange={(e) => handleChange(shift.id, 'end_time', e.target.value)}
                                            className="w-full h-18 bg-muted/30 border border-border rounded-2xl pl-14 pr-6 font-black text-xl italic text-foreground outline-none focus:border-primary transition-all shadow-inner"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Node Actions */}
                            <div className="flex lg:flex-col gap-4 relative z-10">
                                <Button
                                    onClick={() => handleSave(shift)}
                                    disabled={saving === shift.id}
                                    className="h-18 w-18 rounded-[2rem] bg-foreground text-background hover:bg-primary hover:text-primary-foreground transition-all shadow-xl active:scale-95 group/btn"
                                >
                                    {saving === shift.id ? <Loader2 className="w-8 h-8 animate-spin" /> : <Save className="w-8 h-8 group-hover/btn:scale-110 transition-transform" />}
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => deleteShift(shift.id)}
                                    className="h-18 w-18 rounded-[2rem] bg-rose-500/5 text-rose-500 hover:bg-rose-500 hover:text-white transition-all border border-rose-500/10 active:scale-90"
                                >
                                    <Trash2 className="w-8 h-8" />
                                </Button>
                            </div>

                        </div>
                    ))}
                </div>

                {/* 📋 INFORMATION PANEL */}
                <div className="bg-card border border-border rounded-[4rem] p-12 shadow-3xl relative overflow-hidden group/info">
                    <div className="absolute top-0 right-0 p-16 opacity-5 pointer-events-none -mr-16 -mt-16 group-hover/info:scale-110 transition-transform duration-1000">
                        <Timer className="w-64 h-64" />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                        <div className="w-20 h-20 rounded-[1.5rem] bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-lg group-hover/info:rotate-12 transition-transform">
                            <Zap className="w-10 h-10" />
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-2xl font-black italic uppercase tracking-tighter text-primary">Protocolo de Desempeño Operativo</h4>
                            <p className="text-[11px] text-muted-foreground font-black uppercase tracking-[0.2em] leading-relaxed italic max-w-3xl opacity-60">
                                LOS CICLOS DEFINIDOS IMPACTAN DIRECTAMENTE EN EL CÁLCULO DE HORAS EXTRA Y LA GESTIÓN DE NÓMINA DINÁMICA.
                                EL SISTEMA TRABAJA CON UN RANGO DE TOLERANCIA DE 15 MINUTOS PARA EL LOG DE ASISTENCIA BASADO EN EL KERNEL DE TIEMPO DEL SERVIDOR.
                            </p>
                            <div className="flex items-center gap-6 pt-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                    <span className="text-[9px] font-black text-foreground uppercase tracking-widest italic">Server Time: SYNCHRONIZED</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(255,77,0,0.5)]" />
                                    <span className="text-[9px] font-black text-foreground uppercase tracking-widest italic">Precision: MS-LEVEL</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <style jsx global>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 12s linear infinite;
                }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
            `}</style>
        </div>
    )
}
