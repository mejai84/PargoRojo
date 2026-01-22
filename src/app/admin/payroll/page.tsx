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
    employee_id: string
    start_time: string
    end_time: string | null
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
                .eq('status', 'active')

            if (shiftData) setActiveShifts(shiftData)

        } catch (error) {
            console.error("Error fetching payroll data:", error)
        }
        setLoading(false)
    }

    const startShift = async (employeeId: string) => {
        const { error } = await supabase
            .from('shifts')
            .insert([{
                employee_id: employeeId,
                status: 'active',
                start_time: new Date().toISOString()
            }])

        if (!error) fetchData()
    }

    const endShift = async (shiftId: string) => {
        const shift = activeShifts.find(s => s.id === shiftId)
        if (!shift) return

        const endTime = new Date()
        const startTime = new Date(shift.start_time)
        const diffMs = endTime.getTime() - startTime.getTime()
        const diffHours = diffMs / (1000 * 60 * 60)

        // Asignar pago (ejemplo: 10,000 por hora si no está definido)
        const rate = shift.employee.hourly_rate || 5000 // Valor por defecto
        const totalPay = diffHours * rate

        const { error } = await supabase
            .from('shifts')
            .update({
                end_time: endTime.toISOString(),
                total_hours: parseFloat(diffHours.toFixed(2)),
                total_payment: Math.round(totalPay),
                status: 'completed'
            })
            .eq('id', shiftId)

        if (!error) fetchData()
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Nómina & Turnos</h1>
                    <p className="text-muted-foreground">Control de horas laboradas y liquidación de personal.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2">
                        <History className="w-5 h-5" />
                        Historial
                    </Button>
                    <Button className="gap-2 font-bold px-6">
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

                    <div className="bg-card border border-white/10 rounded-3xl overflow-hidden">
                        {activeShifts.length === 0 ? (
                            <div className="p-12 text-center text-muted-foreground italic">
                                No hay empleados con turno activo en este momento.
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {activeShifts.map(shift => (
                                    <div key={shift.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                                <Users className="w-6 h-6 text-emerald-500" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-lg">{shift.employee.full_name}</div>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <span className="uppercase text-[10px] bg-white/10 px-2 py-0.5 rounded font-black tracking-widest">{shift.employee.role}</span>
                                                    <span>• Inicio: {new Date(shift.start_time).toLocaleTimeString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <div className="text-sm text-muted-foreground uppercase font-black text-[10px] tracking-tight">Tiempo Transcurrido</div>
                                                <div className="font-mono text-xl font-bold text-primary animate-pulse">
                                                    {(() => {
                                                        const diff = new Date().getTime() - new Date(shift.start_time).getTime()
                                                        const hours = Math.floor(diff / 3600000)
                                                        const minutes = Math.floor((diff % 3600000) / 60000)
                                                        return `${hours}h ${minutes}m`
                                                    })()}
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => endShift(shift.id)}
                                                variant="destructive"
                                                className="gap-2 rounded-2xl h-12 px-6"
                                            >
                                                <Square className="w-4 h-4 fill-white" />
                                                Cerrar Turno
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
                    <div className="bg-card border border-white/10 rounded-3xl p-6 space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Buscar empleado..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm outline-none focus:border-primary transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto no-scrollbar">
                            {employees
                                .filter(e => e.full_name.toLowerCase().includes(searchQuery.toLowerCase()) && !activeShifts.find(s => s.employee_id === e.id))
                                .map(employee => (
                                    <div key={employee.id} className="p-3 rounded-2xl border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all flex items-center justify-between group">
                                        <span className="font-bold">{employee.full_name}</span>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl"
                                            onClick={() => startShift(employee.id)}
                                        >
                                            <Play className="w-4 h-4" />
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
