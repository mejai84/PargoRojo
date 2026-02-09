"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
    Clock,
    Play,
    Square,
    CheckCircle2,
    BadgeDollarSign,
    Calendar,
    Search,
    Loader2,
    History,
    Users,
    TrendingUp,
    ShieldCheck,
    ArrowRight,
    ArrowLeft,
    Timer,
    Calculator,
    Zap
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { toast } from "sonner"

interface Employee {
    id: string
    full_name: string
    role: string
    hourly_rate?: number
}

interface Shift {
    id: string
    user_id: string
    started_at: string
    ended_at: string | null
    total_hours: number | null
    total_payment: number | null
    status: string
    employee: Employee
}

export default function PayrollPage() {
    const [employees, setEmployees] = useState<Employee[]>([])
    const [activeShifts, setActiveShifts] = useState<Shift[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        setLoading(true)
        try {
            const { data: empData } = await supabase
                .from('profiles')
                .select('*')
                .in('role', ['staff', 'cook', 'waiter', 'cashier'])

            if (empData) setEmployees(empData)

            const { data: shiftData } = await supabase
                .from('shifts')
                .select('*, employee:profiles(*)')
                .eq('status', 'OPEN')

            if (shiftData) setActiveShifts(shiftData)

        } catch (error) {
            console.error("Error fetching payroll data:", error)
        }
        setLoading(false)
    }

    const startShift = async (employeeId: string) => {
        try {
            const { data: profile } = await supabase.from('profiles').select('restaurant_id').eq('id', employeeId).single()
            if (!profile?.restaurant_id) {
                toast.error("El perfil del empleado no tiene un restaurante asignado")
                return
            }

            const { error } = await supabase
                .from('shifts')
                .insert([{
                    user_id: employeeId,
                    restaurant_id: profile.restaurant_id,
                    status: 'OPEN',
                    started_at: new Date().toISOString()
                }])

            if (error) throw error

            toast.success("Turno iniciado exitosamente")
            fetchData()
        } catch (error: any) {
            toast.error("Error al iniciar turno: " + error.message)
        }
    }

    const endShift = async (shiftId: string) => {
        const shift = activeShifts.find(s => s.id === shiftId)
        if (!shift) return

        setLoading(true)
        try {
            const endTime = new Date()
            const startTime = new Date(shift.started_at)
            const diffMs = endTime.getTime() - startTime.getTime()
            const diffHours = diffMs / (1000 * 60 * 60)

            const rate = shift.employee.hourly_rate || 5000
            const totalPay = diffHours * rate

            const { error } = await supabase
                .from('shifts')
                .update({
                    ended_at: endTime.toISOString(),
                    total_hours: parseFloat(diffHours.toFixed(2)),
                    total_payment: Math.round(totalPay),
                    status: 'CLOSED'
                })
                .eq('id', shiftId)

            if (error) throw error

            toast.success(`Turno cerrado. Pago estimado: $${Math.round(totalPay).toLocaleString()}`)
            fetchData()
        } catch (error: any) {
            toast.error("Error al cerrar turno: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    const executeLiquidation = async () => {
        setLoading(true)
        try {
            // 1. Obtener todos los turnos CERRADOS
            const { data: closedShifts, error: shiftsError } = await supabase
                .from('shifts')
                .select('*, employee:profiles(*)')
                .eq('status', 'CLOSED')

            if (shiftsError) throw shiftsError
            if (!closedShifts || closedShifts.length === 0) {
                toast.info("No hay turnos CERRADOS para liquidar")
                setLoading(false)
                return
            }

            // 2. Agrupar por empleado
            const employeeShifts: Record<string, any[]> = {}
            closedShifts.forEach(s => {
                if (!employeeShifts[s.user_id]) employeeShifts[s.user_id] = []
                employeeShifts[s.user_id].push(s)
            })

            // 3. Crear liquidaciones y marcar turnos
            for (const [employeeId, shifts] of Object.entries(employeeShifts)) {
                const totalAmount = shifts.reduce((sum, s) => sum + (Number(s.total_payment) || 0), 0)
                const restaurantId = shifts[0].restaurant_id

                // Período
                const start = shifts.reduce((min, s) => s.started_at < min ? s.started_at : min, shifts[0].started_at).split('T')[0]
                const end = shifts.reduce((max, s) => s.started_at > max ? s.started_at : max, shifts[0].started_at).split('T')[0]

                const { error: liqError } = await supabase
                    .from('employee_liquidations')
                    .insert({
                        employee_id: employeeId,
                        restaurant_id: restaurantId,
                        period_start: start,
                        period_end: end,
                        total_amount: totalAmount,
                        status: 'pending'
                    })

                if (liqError) throw liqError

                await supabase
                    .from('shifts')
                    .update({ status: 'PAID' })
                    .in('id', shifts.map(s => s.id))
            }

            toast.success("Liquidación completada exitosamente")
            fetchData()
        } catch (error: any) {
            console.error("Error liquidación:", error)
            toast.error("Error en liquidación: " + (error.message || "Error desconocido"))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-transparent text-foreground p-4 md:p-8 font-sans selection:bg-primary selection:text-primary-foreground relative">
            <div className="max-w-[1400px] mx-auto space-y-12 animate-in fade-in duration-1000">

                {/* 🔝 STRATEGIC HEADER */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 border-b border-border/50 pb-10">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2.5">
                            <BadgeDollarSign className="w-4 h-4 text-primary animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary italic">Human Capital Ledger v2.4</span>
                        </div>
                        <h1 className="text-5xl font-black italic uppercase tracking-tighter text-foreground leading-none">Nómina <span className="text-primary italic">& Turnos</span></h1>
                        <p className="text-muted-foreground font-bold text-sm uppercase tracking-widest italic opacity-70">Monitoreo de asistencia y liquidación en tiempo real</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <Link href="/admin">
                            <Button variant="ghost" className="h-16 px-8 bg-card border border-border rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] italic shadow-xl transition-all gap-3 hover:bg-muted active:scale-95 group">
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> RETORNO
                            </Button>
                        </Link>
                        <Button
                            onClick={executeLiquidation}
                            disabled={loading}
                            className="h-16 px-10 bg-primary text-primary-foreground hover:bg-foreground hover:text-background font-black uppercase text-[10px] tracking-[0.2em] italic rounded-2xl shadow-3xl transition-all gap-3 border-none ring-offset-background focus-visible:ring-2 focus-visible:ring-primary active:scale-95 group"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Calculator className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                            EJECUTAR LIQUIDACIÓN
                        </Button>
                    </div>
                </div>

                {/* 🕒 SHIFT DASHBOARD */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* ACTIVE SHIFTS LIST */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between px-4">
                            <h2 className="text-2xl font-black italic tracking-tighter uppercase flex items-center gap-4">
                                <Timer className="w-8 h-8 text-primary" />
                                Monitor de Operaciones <span className="text-primary/40">({activeShifts.length})</span>
                            </h2>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/10 rounded-lg animate-pulse">
                                    <Zap className="w-4 h-4 text-emerald-500" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 italic">LIVE SYSTEM</span>
                            </div>
                        </div>

                        <div className="bg-card border border-border rounded-[3.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-6 duration-1000">
                            {activeShifts.length === 0 ? (
                                <div className="p-32 text-center">
                                    <div className="flex flex-col items-center justify-center gap-6 opacity-10">
                                        <Clock className="w-24 h-24" />
                                        <div className="space-y-2">
                                            <p className="text-base font-black uppercase italic tracking-[0.5em] leading-none">Bóveda de Turnos Vacía</p>
                                            <p className="text-[10px] uppercase font-bold tracking-[0.3em]">No se han detectado marcaciones activas</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="divide-y divide-border/50">
                                    {activeShifts.map(shift => (
                                        <div key={shift.id} className="p-10 flex flex-col sm:flex-row items-center justify-between gap-8 hover:bg-muted/30 transition-all duration-500 group">
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 rounded-[1.5rem] bg-muted border border-border flex items-center justify-center relative overflow-hidden group-hover:bg-primary/10 transition-colors">
                                                    <Users className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors z-10" />
                                                    <div className="absolute inset-x-0 bottom-0 h-1 bg-emerald-500 animate-pulse" />
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="font-black italic uppercase text-2xl text-foreground tracking-tighter leading-none group-hover:text-primary transition-colors">{shift.employee.full_name}</div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="bg-muted px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest italic border border-border/50">{shift.employee.role}</span>
                                                        <div className="flex items-center gap-2 opacity-40">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            <span className="text-[9px] font-bold uppercase tracking-widest">{new Date(shift.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-10">
                                                <div className="text-right space-y-2">
                                                    <div className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.3em] italic leading-none opacity-40">Horas Acumuladas</div>
                                                    <div className="font-mono text-3xl font-black text-primary italic leading-none tracking-tighter">
                                                        {(() => {
                                                            const diff = new Date().getTime() - new Date(shift.started_at).getTime()
                                                            const hours = Math.floor(diff / 3600000)
                                                            const minutes = Math.floor((diff % 3600000) / 60000)
                                                            return `${hours}H ${minutes}M`
                                                        })()}
                                                    </div>
                                                </div>
                                                <Button
                                                    onClick={() => endShift(shift.id)}
                                                    className="h-16 px-8 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-2xl hover:bg-rose-500 hover:text-white transition-all font-black uppercase text-[10px] tracking-[0.2em] italic gap-3 group/btn shadow-sm"
                                                >
                                                    <Square className="w-4 h-4 fill-current group-hover:scale-90 transition-transform" />
                                                    CERRAR TURNO
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* STAFF SELECTION ENGINE */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 px-4">
                            <h2 className="text-2xl font-black italic tracking-tighter uppercase flex items-center gap-4">
                                <Play className="w-8 h-8 text-emerald-500" />
                                Iniciar Ciclo
                            </h2>
                        </div>
                        <div className="bg-card border border-border rounded-[3.5rem] p-10 space-y-8 shadow-2xl relative overflow-hidden group/entry">
                            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none -mr-10 -mt-10 group-focus-within/entry:scale-110 transition-transform duration-1000">
                                <Users className="w-32 h-32" />
                            </div>

                            <div className="relative group/search">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/30 group-focus-within/search:text-primary transition-colors" />
                                <input
                                    type="text"
                                    placeholder="FILTRAR PERSONAL..."
                                    className="w-full h-16 bg-muted/30 border border-border rounded-[2rem] pl-16 pr-8 text-xs outline-none focus:border-primary transition-all font-black uppercase italic tracking-widest shadow-inner placeholder:text-muted-foreground/10"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pt-2 pr-2">
                                {employees
                                    .filter(e => e.full_name.toLowerCase().includes(searchQuery.toLowerCase()) && !activeShifts.find(s => s.user_id === e.id))
                                    .map(employee => (
                                        <div key={employee.id} className="p-6 rounded-3xl border border-border/50 bg-muted/20 hover:border-primary/40 hover:bg-card transition-all duration-300 flex items-center justify-between group/item shadow-sm">
                                            <div className="space-y-1">
                                                <span className="font-black italic uppercase text-sm text-foreground tracking-tighter group-hover/item:text-primary transition-colors leading-none">{employee.full_name}</span>
                                                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 italic">{employee.role}</p>
                                            </div>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-12 w-12 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl shadow-inner border border-emerald-500/20 group-hover/item:scale-110 transition-all"
                                                onClick={() => startShift(employee.id)}
                                            >
                                                <Play className="w-5 h-5 fill-current" />
                                            </Button>
                                        </div>
                                    ))}
                                {employees.length === 0 && (
                                    <div className="text-center py-10 opacity-20 italic text-xs uppercase font-black tracking-widest">
                                        Cero coincidencias
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ANALYTIC MINI WIDGET */}
                        <div className="bg-foreground rounded-[3rem] p-8 text-background shadow-3xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] rounded-full -mr-16 -mt-16" />
                            <div className="relative z-10 flex items-center justify-between">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black italic text-primary uppercase tracking-[0.4em]">Personal Registrado</p>
                                    <p className="text-4xl font-black italic tracking-tighter uppercase leading-none">{employees.length}<span className="text-sm ml-2 opacity-30">UNIT</span></p>
                                </div>
                                <Users className="w-12 h-12 text-primary opacity-20" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
            `}</style>
        </div>
    )
}
