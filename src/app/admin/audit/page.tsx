"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { useRestaurant } from "@/providers/RestaurantProvider"
import {
    ShieldAlert,
    History,
    User,
    Clock,
    Database,
    Search,
    ArrowRight,
    Eye,
    Info
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"

interface AuditLog {
    id: string
    user_id: string
    action: string
    entity_type: string
    entity_id: string
    old_values: any
    new_values: any
    created_at: string
    profiles: {
        full_name: string
        email: string
    }
}

export default function AuditPage() {
    const { restaurant } = useRestaurant()
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        const fetchLogs = async () => {
            if (!restaurant) return

            try {
                setLoading(true)
                const { data, error } = await supabase
                    .from('audit_logs')
                    .select(`
            *,
            profiles:user_id (full_name, email)
          `)
                    .eq('restaurant_id', restaurant.id)
                    .order('created_at', { ascending: false })
                    .limit(100)

                if (error) throw error
                setLogs(data || [])
            } catch (error) {
                console.error("Error fetching audit logs:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchLogs()
    }, [restaurant])

    const filteredLogs = logs.filter(log =>
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getActionBadge = (action: string) => {
        switch (action.toUpperCase()) {
            case 'INSERT': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
            case 'UPDATE': return 'bg-amber-100 text-amber-700 border-amber-200'
            case 'DELETE': return 'bg-rose-100 text-rose-700 border-rose-200'
            default: return 'bg-slate-100 text-slate-700 border-slate-200'
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white font-black italic text-[10px] uppercase tracking-[0.2em]">
                        <ShieldAlert className="w-3 h-3 text-primary" />
                        Control de Auditoría
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black italic tracking-tighter text-slate-900 uppercase">
                            Trazabilidad <span className="text-primary italic">SaaS</span>
                        </h1>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                            Registro inmutable de todas las acciones críticas del sistema
                        </p>
                    </div>
                </div>

                <div className="relative w-full md:w-80 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar por usuario o acción..."
                        className="w-full h-12 pl-12 pr-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-primary/50 text-xs font-bold uppercase tracking-widest placeholder:text-slate-300 transition-all font-mono"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-200">
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sujeto</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operación</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Entidad</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Fecha / Hora</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-8 py-6 h-16 bg-slate-50/20" />
                                    </tr>
                                ))
                            ) : filteredLogs.length > 0 ? (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-500 italic text-xs border border-slate-200">
                                                    {log.profiles?.full_name?.charAt(0) || <User className="w-4 h-4" />}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-xs font-black italic text-slate-900 uppercase truncate">
                                                        {log.profiles?.full_name || "Sistema"}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate">
                                                        {log.profiles?.email || "internal@system.pos"}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getActionBadge(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                                <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest font-mono">
                                                    {log.entity_type}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                                                    {format(new Date(log.created_at), "PPP", { locale: es })}
                                                </span>
                                                <div className="flex items-center gap-1.5 pt-0.5">
                                                    <Clock className="w-3 h-3 text-slate-400" />
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        {format(new Date(log.created_at), "p")}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="rounded-xl h-10 w-10 p-0 text-slate-400 hover:text-primary hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <Database className="w-12 h-12 text-slate-200" />
                                            <div className="space-y-1">
                                                <p className="text-xs font-black italic text-slate-400 uppercase tracking-widest">No hay registros de auditoría</p>
                                                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Las acciones del sistema aparecerán aquí en tiempo real</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Stats Mini */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 border-none p-6 rounded-[2rem] text-white shadow-xl shadow-slate-900/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] rounded-full -mr-16 -mt-16 group-hover:bg-primary/30 transition-all" />
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black italic text-primary uppercase tracking-[0.2em]">Total Eventos</p>
                            <p className="text-3xl font-black italic tracking-tighter uppercase">{logs.length}</p>
                        </div>
                        <History className="w-10 h-10 text-primary opacity-20" />
                    </div>
                </div>

                <div className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm relative overflow-hidden group">
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black italic text-slate-400 uppercase tracking-[0.2em]">Alertas Críticas</p>
                            <p className="text-3xl font-black italic tracking-tighter uppercase text-slate-900">0</p>
                        </div>
                        <ShieldAlert className="w-10 h-10 text-rose-500 opacity-10" />
                    </div>
                </div>

                <div className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm relative overflow-hidden group flex items-center justify-center">
                    <Button variant="ghost" className="w-full h-full text-[10px] font-black uppercase italic tracking-[0.2em] gap-3 text-slate-500">
                        Exportar Reporte Maestro
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
