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
    TrendingUp
} from "lucide-react"

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
            // Fetch employees with roles that can have shifts
            const { data: empData } = await supabase
                .from('profiles')
                .select('*')
                .in('role', ['staff', 'cook', 'waiter', 'cashier'])

            if (empData) setEmployees(empData)

            // Fetch active shifts
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
        const { data: profile } = await supabase.from('profiles').select('restaurant_id').eq('id', employeeId).single()
        if (!profile?.restaurant_id) return

        const { error } = await supabase
            .from('shifts')
            .insert([{
                user_id: employeeId,
                restaurant_id: profile.restaurant_id,
                status: 'OPEN',
                started_at: new Date().toISOString()
            }])

        if (!error) fetchData()
    }

    const endShift = async (shiftId: string) => {
        const shift = activeShifts.find(s => s.id === shiftId)
        if (!shift) return

        const endTime = new Date()
        const startTime = new Date(shift.started_at)
        const diffMs = endTime.getTime() - startTime.getTime()
        const diffHours = diffMs / (1000 * 60 * 60)

        // Asignar pago (ejemplo: 10,000 por hora si no está definido)
        const rate = shift.employee.hourly_rate || 5000 // Valor por defecto
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

        if (!error) fetchData()
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">Nómina & <span className="text-primary">Turnos</span></h1>
                    <p className="text-slate-400 font-medium italic uppercase text-[10px] tracking-widest mt-1">Control de horas laboradas y liquidación de personal.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" className="h-14 px-6 rounded-2xl border border-slate-200 bg-white shadow-sm font-black uppercase text-[10px] tracking-widest italic gap-2 hover:bg-slate-50">
                        <History className="w-5 h-5 text-slate-400" />
                        Historial
                    </Button>
                    <Button className="h-14 px-8 bg-primary text-black rounded-2xl font-black uppercase text-[10px] tracking-widest italic hover:bg-slate-900 hover:text-white transition-all shadow-xl shadow-primary/20 gap-3">
                        <BadgeDollarSign className="w-5 h-5" />
                        Liquidar Periodo
                    </Button>
                </div>
            </div>

            {/* Shift Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Active Shifts List */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary" />
                        Turnos Activos ({activeShifts.length})
                    </h2>

                    <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
                        {activeShifts.length === 0 ? (
                            <div className="p-20 text-center text-slate-300 italic font-medium flex flex-col items-center gap-4">
                                <div className="p-6 bg-slate-50 rounded-full border border-slate-100">
                                    <Clock className="w-12 h-12 opacity-20" />
                                </div>
                                No hay empleados con turno activo en este momento.
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {activeShifts.map(shift => (
                                    <div key={shift.id} className="p-8 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-500 border border-emerald-100 flex items-center justify-center">
                                                <Users className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <div className="font-black italic uppercase text-lg text-slate-900 leading-none mb-1">{shift.employee.full_name}</div>
                                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                    <span className="bg-slate-100 px-2 py-0.5 rounded italic">{shift.employee.role}</span>
                                                    <span className="italic">• Inicio: {new Date(shift.started_at).toLocaleTimeString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest italic leading-none mb-1">Tiempo Transcurrido</div>
                                                <div className="font-mono text-xl font-black text-primary animate-pulse italic">
                                                    {(() => {
                                                        const diff = new Date().getTime() - new Date(shift.started_at).getTime()
                                                        const hours = Math.floor(diff / 3600000)
                                                        const minutes = Math.floor((diff % 3600000) / 60000)
                                                        return `${hours}h ${minutes}m`
                                                    })()}
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => endShift(shift.id)}
                                                className="h-12 px-6 bg-rose-50 text-rose-500 border border-rose-100 rounded-xl hover:bg-rose-500 hover:text-white transition-all font-black uppercase text-[9px] tracking-widest italic gap-2"
                                            >
                                                <Square className="w-3.5 h-3.5 fill-current" />
                                                CERRAR TURNO
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Staff Selection for Entry */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Play className="w-5 h-5 text-emerald-500" />
                        Iniciar Turno
                    </h2>
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 space-y-6 shadow-sm">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Buscar empleado..."
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-xs outline-none focus:border-primary transition-all font-black uppercase italic tracking-widest shadow-inner"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar pt-2">
                            {employees
                                .filter(e => e.full_name.toLowerCase().includes(searchQuery.toLowerCase()) && !activeShifts.find(s => s.user_id === e.id))
                                .map(employee => (
                                    <div key={employee.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:border-primary/20 hover:bg-white transition-all flex items-center justify-between group">
                                        <span className="font-black italic uppercase text-xs text-slate-900">{employee.full_name}</span>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-10 w-10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl shadow-sm border border-emerald-100"
                                            onClick={() => startShift(employee.id)}
                                        >
                                            <Play className="w-4 h-4 fill-current" />
                                        </Button>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
