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
    Info,
    X,
    Lock,
    Activity,
    ArrowLeft,
    Download
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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
    const [staff, setStaff] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

    // Filtros
    const [filterAction, setFilterAction] = useState<string>("ALL")
    const [filterStaff, setFilterStaff] = useState<string>("ALL")
    const [filterEntity, setFilterEntity] = useState<string>("ALL")

    useEffect(() => {
        if (!restaurant) return

        const fetchInitialData = async () => {
            try {
                setLoading(true)

                // 1. Fetch Staff for Filter
                const { data: staffData } = await supabase
                    .from('profiles')
                    .select('id, full_name, email')
                    .eq('restaurant_id', restaurant.id)
                setStaff(staffData || [])

                // 2. Fetch Logs
                const { data, error } = await supabase
                    .from('audit_logs')
                    .select(`
                        *,
                        profiles:user_id (full_name, email)
                    `)
                    .eq('restaurant_id', restaurant.id)
                    .order('created_at', { ascending: false })
                    .limit(200)

                if (error) throw error
                setLogs(data || [])
            } catch (error) {
                console.error("Error fetching audit data:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchInitialData()

        // 3. Realtime Subscription
        const channel = supabase
            .channel('audit_changes')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'audit_logs',
                filter: `restaurant_id=eq.${restaurant.id}`
            }, async (payload) => {
                // Fetch the full record including profile info
                const { data: newLog } = await supabase
                    .from('audit_logs')
                    .select('*, profiles:user_id(full_name, email)')
                    .eq('id', payload.new.id)
                    .single()

                if (newLog) {
                    setLogs(prev => [newLog as AuditLog, ...prev].slice(0, 200))
                }
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [restaurant])

    const filteredLogs = logs.filter(log => {
        const matchesSearch =
            log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.entity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesAction = filterAction === "ALL" || log.action === filterAction
        const matchesStaff = filterStaff === "ALL" || log.user_id === filterStaff
        const matchesEntity = filterEntity === "ALL" || log.entity_type === filterEntity

        return matchesSearch && matchesAction && matchesStaff && matchesEntity
    })

    const entityTypes = Array.from(new Set(logs.map(l => l.entity_type)))

    const getActionBadge = (action: string) => {
        switch (action.toUpperCase()) {
            case 'INSERT': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
            case 'UPDATE': return 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
            case 'DELETE': return 'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]'
            default: return 'bg-muted text-muted-foreground border-border'
        }
    }

    const exportToCSV = () => {
        const headers = ["ID", "Fecha", "Usuario", "Acción", "Entidad", "Entidad ID"]
        const rows = filteredLogs.map(log => [
            log.id,
            log.created_at,
            log.profiles?.full_name || "KERNEL",
            log.action,
            log.entity_type,
            log.entity_id
        ])

        const csvContent = [
            headers.join(","),
            ...rows.map(e => e.join(","))
        ].join("\n")

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", `audit_log_${new Date().toISOString()}.csv`)
        document.body.appendChild(link)
        link.click()
    }

    // Helper to identify changed fields in an update
    const getChangedFields = (oldVals: any, newVals: any) => {
        if (!oldVals || !newVals) return []
        return Object.keys(newVals).filter(key => {
            const oldVal = oldVals[key]
            const newVal = newVals[key]
            return JSON.stringify(oldVal) !== JSON.stringify(newVal)
        })
    }

    return (
        <div className="min-h-screen bg-transparent text-foreground p-4 md:p-12 font-sans selection:bg-primary selection:text-primary-foreground relative">
            <div className="max-w-[1600px] mx-auto space-y-12 animate-in fade-in duration-1000">

                {/* 🔝 STRATEGIC HEADER */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-10 border-b border-border/50 pb-12">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Lock className="w-5 h-5 text-primary" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary italic">Audit Protocol v5.0 • Live</span>
                        </div>
                        <h1 className="text-6xl font-black italic uppercase tracking-tighter text-foreground leading-none">Caja <span className="text-primary italic">Negra</span></h1>
                        <p className="text-muted-foreground font-bold text-sm uppercase tracking-widest italic opacity-70 flex items-center gap-3">
                            Monitor de integridad y trazabilidad operativa
                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-2" />
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full xl:w-auto">
                        {/* Search */}
                        <div className="relative group/search sm:col-span-2 lg:col-span-1">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within/search:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="BUSCAR EVENTO..."
                                className="w-full h-14 bg-card border border-border rounded-2xl pl-14 pr-6 outline-none focus:border-primary transition-all text-[11px] font-black italic uppercase placeholder:text-muted-foreground/20 shadow-inner"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Filter Action */}
                        <select
                            value={filterAction}
                            onChange={(e) => setFilterAction(e.target.value)}
                            className="h-14 bg-card border border-border rounded-2xl px-6 outline-none focus:border-primary transition-all text-[11px] font-black italic uppercase appearance-none cursor-pointer hover:bg-muted/50"
                        >
                            <option value="ALL">TODAS LAS ACCIONES</option>
                            <option value="INSERT">INSERCIONES (+)</option>
                            <option value="UPDATE">MODIFICACIONES (Δ)</option>
                            <option value="DELETE">ELIMINACIONES (-)</option>
                        </select>

                        {/* Filter Staff */}
                        <select
                            value={filterStaff}
                            onChange={(e) => setFilterStaff(e.target.value)}
                            className="h-14 bg-card border border-border rounded-2xl px-6 outline-none focus:border-primary transition-all text-[11px] font-black italic uppercase appearance-none cursor-pointer hover:bg-muted/50 truncate max-w-[200px]"
                        >
                            <option value="ALL">TODOS LOS SUJETOS</option>
                            {staff.map(s => (
                                <option key={s.id} value={s.id}>{s.full_name}</option>
                            ))}
                        </select>

                        {/* Filter Entity */}
                        <select
                            value={filterEntity}
                            onChange={(e) => setFilterEntity(e.target.value)}
                            className="h-14 bg-card border border-border rounded-2xl px-6 outline-none focus:border-primary transition-all text-[11px] font-black italic uppercase appearance-none cursor-pointer hover:bg-muted/50"
                        >
                            <option value="ALL">TODAS LAS ENTIDADES</option>
                            {entityTypes.map(type => (
                                <option key={type} value={type}>{type.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* 🛡️ AUDIT REGISTRY */}
                <div className="bg-card border border-border rounded-[3.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-6 duration-1000 relative">
                    {/* Header Table Info */}
                    <div className="px-10 py-6 bg-muted/30 border-b border-border flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] italic text-muted-foreground">
                        <div className="flex items-center gap-6">
                            <span>Mostrando: {filteredLogs.length} eventos</span>
                            <div className="w-[1px] h-4 bg-border" />
                            <span className="text-emerald-500">Live Feedback Active</span>
                        </div>
                        <div className="flex items-center gap-2">
                            Limit: 200 Entries
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-separate border-spacing-0">
                            <thead>
                                <tr className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.3em] italic">
                                    <th className="px-10 py-6 bg-card border-b border-border">Identidad del Sujeto</th>
                                    <th className="px-10 py-6 bg-card border-b border-border">Vector</th>
                                    <th className="px-10 py-6 bg-card border-b border-border">Entidad</th>
                                    <th className="px-10 py-6 bg-card border-b border-border text-center">Cronología</th>
                                    <th className="px-10 py-6 bg-card border-b border-border text-right">Análisis</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {loading ? (
                                    Array.from({ length: 6 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={5} className="px-10 py-10">
                                                <div className="h-6 bg-muted/50 rounded-full w-2/3" />
                                            </td>
                                        </tr>
                                    ))
                                ) : filteredLogs.length > 0 ? (
                                    filteredLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-muted/20 transition-all duration-300 group">
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-[1.25rem] bg-muted border border-border flex items-center justify-center font-black text-muted-foreground italic text-sm group-hover:bg-primary/10 group-hover:text-primary group-hover:rotate-6 transition-all duration-500">
                                                        {log.profiles?.full_name?.charAt(0) || <User className="w-5 h-5" />}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-sm font-black italic text-foreground uppercase tracking-tight truncate group-hover:text-primary transition-colors">
                                                            {log.profiles?.full_name || "KERNEL SYSTEM"}
                                                        </span>
                                                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest truncate opacity-30">
                                                            {log.profiles?.email || "INTERNAL_SERVICE"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <span className={cn(
                                                    "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border italic shadow-sm",
                                                    getActionBadge(log.action)
                                                )}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-3 bg-muted/30 w-fit px-4 py-2 rounded-xl border border-border/50 group-hover:border-primary/20 transition-colors">
                                                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                                    <span className="text-[10px] font-black text-foreground uppercase tracking-[0.3em] font-mono italic">
                                                        {log.entity_type}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-center italic">
                                                <div className="space-y-1.5">
                                                    <div className="text-[10px] font-black text-foreground uppercase tracking-widest italic">
                                                        {format(new Date(log.created_at), "dd MMM yyyy", { locale: es })}
                                                    </div>
                                                    <div className="flex items-center justify-center gap-2 opacity-30">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                                                            {format(new Date(log.created_at), "HH:mm:ss")}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => setSelectedLog(log)}
                                                    className="rounded-[1.25rem] h-14 w-14 bg-muted/30 border border-transparent hover:border-primary/20 hover:bg-card hover:text-primary shadow-sm active:scale-95 transition-all group/btn"
                                                >
                                                    <Eye className="w-6 h-6 group-hover/btn:scale-110 transition-transform" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-10 py-32 text-center text-muted-foreground/20 italic">
                                            <div className="flex flex-col items-center justify-center gap-6">
                                                <Database className="w-24 h-24" />
                                                <div className="space-y-2">
                                                    <p className="text-base font-black uppercase italic tracking-[0.5em] leading-none">Sin Coincidencias</p>
                                                    <p className="text-[10px] uppercase font-bold tracking-[0.3em]">No se han detectado eventos con los filtros actuales</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 📊 ANALYTIC MINI HUB */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="bg-foreground border-none p-10 rounded-[3.5rem] text-background shadow-3xl relative overflow-hidden group hover:scale-[1.02] transition-all duration-500">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 blur-[80px] rounded-full -mr-20 -mt-20 group-hover:bg-primary/40 transition-all" />
                        <div className="relative z-10 flex items-center justify-between">
                            <div className="space-y-4 text-left">
                                <p className="text-[11px] font-black italic text-primary uppercase tracking-[0.4em]">Eventos en Registro</p>
                                <p className="text-6xl font-black italic tracking-tighter uppercase leading-none">{logs.length}<span className="text-xl ml-3 opacity-30">UNIT</span></p>
                            </div>
                            <Activity className="w-20 h-20 text-primary opacity-20 group-hover:rotate-[30deg] transition-transform duration-1000" />
                        </div>
                    </div>

                    <div className="bg-card border border-border p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group hover:border-primary/40 transition-all duration-500">
                        <div className="relative z-10 flex items-center justify-between">
                            <div className="space-y-4 text-left">
                                <p className="text-[11px] font-black italic text-muted-foreground uppercase tracking-[0.4em]">Eliminaciones (Crítico)</p>
                                <p className="text-6xl font-black italic tracking-tighter uppercase text-rose-500 leading-none">
                                    {logs.filter(l => l.action === 'DELETE').length}
                                    <span className="text-xl ml-3 text-muted-foreground opacity-10">FAIL</span>
                                </p>
                            </div>
                            <ShieldAlert className="w-20 h-20 text-rose-500 opacity-5 group-hover:scale-110 transition-all duration-700" />
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-[3.5rem] shadow-2xl relative overflow-hidden group hover:border-primary/40 transition-all duration-500 group flex items-center justify-center p-12">
                        <Button
                            variant="ghost"
                            onClick={exportToCSV}
                            className="w-full h-full text-[12px] font-black uppercase italic tracking-[0.3em] gap-5 text-muted-foreground hover:text-foreground transition-all flex flex-col items-center justify-center group-hover:bg-muted/30 rounded-[2.5rem]"
                        >
                            <Download className="w-10 h-10 text-primary/40 group-hover:text-primary transition-all mb-2 animate-bounce" />
                            DESCARGAR DATA FORENSE (.CSV)
                        </Button>
                    </div>
                </div>
            </div>

            {/* 👓 LOG INSPECTOR MODAL */}
            {selectedLog && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 bg-background/90 backdrop-blur-3xl animate-in fade-in duration-500">
                    <div className="relative bg-card rounded-[4rem] w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col shadow-[0_0_200px_rgba(0,0,0,0.6)] border border-border selection:bg-primary selection:text-primary-foreground">

                        <div className="px-12 py-12 border-b border-border/50 bg-muted/20 flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-6">
                                <div className="p-5 bg-primary/10 rounded-3xl shadow-inner border border-primary/20">
                                    <ShieldAlert className="w-10 h-10 text-primary animate-pulse shadow-primary/40" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-4xl font-black italic uppercase tracking-tighter text-foreground leading-none">Reporte <span className="text-primary italic">Atómico</span></h3>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.5em] italic opacity-40">HSA: {selectedLog.id.split('-')[0].toUpperCase()} • {format(new Date(selectedLog.created_at), "PPP", { locale: es })}</p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-2xl h-16 w-16 hover:bg-muted active:scale-95 transition-all text-muted-foreground hover:text-foreground"
                                onClick={() => setSelectedLog(null)}
                            >
                                <X className="w-10 h-10" />
                            </Button>
                        </div>

                        <div className="px-12 py-10 overflow-y-auto custom-scrollbar space-y-12 relative z-10 flex-1">
                            <div className="grid md:grid-cols-3 gap-8">
                                <div className="p-8 bg-muted/40 rounded-[2.5rem] border border-border shadow-inner group/card group-hover:border-primary/20 transition-all">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4 italic">Vector</p>
                                    <span className={cn(
                                        "px-6 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.2em] border italic inline-block shadow-2xl",
                                        getActionBadge(selectedLog.action)
                                    )}>
                                        {selectedLog.action}
                                    </span>
                                </div>
                                <div className="p-8 bg-muted/40 rounded-[2.5rem] border border-border shadow-inner relative overflow-hidden">
                                    <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.4em] mb-4 italic">Entidad</p>
                                    <div className="flex items-center gap-4">
                                        <Database className="w-6 h-6 text-primary/40" />
                                        <p className="text-2xl font-black text-foreground uppercase italic tracking-tighter leading-none">{selectedLog.entity_type}</p>
                                    </div>
                                </div>
                                <div className="p-8 bg-muted/40 rounded-[2.5rem] border border-border shadow-inner relative overflow-hidden">
                                    <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.4em] mb-4 italic">Responsable</p>
                                    <div className="flex items-center gap-4">
                                        <User className="w-6 h-6 text-primary/40" />
                                        <p className="text-lg font-black text-foreground uppercase italic tracking-tighter leading-none truncate">{selectedLog.profiles?.full_name || "KERNEL SYSTEM"}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-12 pb-12">
                                {/* Compare View */}
                                <div className="grid lg:grid-cols-2 gap-12 relative">
                                    {/* Arrow connection */}
                                    <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-16 h-16 bg-card border border-border rounded-full items-center justify-center shadow-3xl text-primary animate-pulse">
                                        <ArrowRight className="w-8 h-8" />
                                    </div>

                                    {/* STATE A */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-8">
                                            <p className="text-[11px] font-black text-foreground uppercase tracking-[0.5em] flex items-center gap-4 italic opacity-40">
                                                <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]" />
                                                E. Inicial
                                            </p>
                                        </div>
                                        <div className="p-8 bg-foreground/95 rounded-[3rem] overflow-x-auto shadow-4xl border border-white/5 relative min-h-[300px] flex">
                                            {selectedLog.old_values ? (
                                                <pre className="text-xs text-rose-300 font-mono leading-relaxed selection:bg-rose-500/30 w-full overflow-y-auto custom-scrollbar">
                                                    {JSON.stringify(selectedLog.old_values, null, 4)}
                                                </pre>
                                            ) : (
                                                <div className="m-auto flex flex-col items-center gap-4 opacity-10">
                                                    <Info className="w-12 h-12" />
                                                    <span className="text-[10px] font-black uppercase italic tracking-widest">N/A (Cero Estado)</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* STATE B */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-8">
                                            <p className="text-[11px] font-black text-foreground uppercase tracking-[0.5em] flex items-center gap-4 italic text-emerald-500">
                                                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                                                E. Final
                                            </p>
                                        </div>
                                        <div className="p-8 bg-foreground/95 rounded-[3rem] overflow-x-auto shadow-4xl border border-emerald-500/10 relative min-h-[300px] flex">
                                            {selectedLog.new_values ? (
                                                <div className="w-full h-full relative">
                                                    <pre className="text-xs text-emerald-400 font-mono leading-relaxed selection:bg-primary/20 w-full overflow-y-auto custom-scrollbar">
                                                        {JSON.stringify(selectedLog.new_values, null, 4)}
                                                    </pre>

                                                    {/* Highlight changed fields if it's an update */}
                                                    {selectedLog.action === 'UPDATE' && (
                                                        <div className="mt-8 pt-8 border-t border-white/5">
                                                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4 italic">Campos Modificados:</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {getChangedFields(selectedLog.old_values, selectedLog.new_values).map(field => (
                                                                    <span key={field} className="px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-lg text-[10px] font-black mono italic uppercase">
                                                                        {field}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="m-auto flex flex-col items-center gap-4 opacity-10">
                                                    <Database className="w-12 h-12" />
                                                    <span className="text-[10px] font-black uppercase italic tracking-widest">Estado Nulo</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-12 py-10 bg-muted/30 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-6">
                            <div className="flex items-center gap-4 bg-card px-6 py-3 rounded-2xl border border-border">
                                <Activity className="w-4 h-4 text-primary" />
                                <span className="text-[10px] font-black uppercase italic tracking-widest text-muted-foreground">ID DE SEGUIMIENTO: {selectedLog.id}</span>
                            </div>
                            <Button
                                onClick={() => setSelectedLog(null)}
                                className="h-16 px-16 bg-foreground text-background hover:bg-primary hover:text-white font-black rounded-[2rem] gap-4 uppercase text-[12px] tracking-[0.3em] italic shadow-3xl transition-all border-none scale-100 hover:scale-105 active:scale-95 group"
                            >
                                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-2 transition-transform" /> CANCELAR INSPECCIÓN
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,100,0,0.1); border-radius: 20px; }
                .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: rgba(255,100,0,0.3); }
                select {
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23ff4d00' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 1.5rem center;
                    background-size: 1.25rem;
                }
            `}</style>
        </div>
    )
}
