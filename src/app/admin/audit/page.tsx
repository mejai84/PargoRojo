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
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

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
            case 'INSERT': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
            case 'UPDATE': return 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
            case 'DELETE': return 'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]'
            default: return 'bg-muted text-muted-foreground border-border'
        }
    }

    return (
        <div className="min-h-screen bg-transparent text-foreground p-4 md:p-8 font-sans selection:bg-primary selection:text-primary-foreground relative">
            <div className="max-w-[1400px] mx-auto space-y-12 animate-in fade-in duration-1000">

                {/* 🔝 STRATEGIC HEADER */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 border-b border-border/50 pb-10">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2.5">
                            <Lock className="w-4 h-4 text-primary animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary italic">Immutability Protocol v4.1</span>
                        </div>
                        <h1 className="text-5xl font-black italic uppercase tracking-tighter text-foreground leading-none">Trazabilidad <span className="text-primary italic">Audit</span></h1>
                        <p className="text-muted-foreground font-bold text-sm uppercase tracking-widest italic opacity-70">Registro forense de actividad crítica y cambios de estado</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="relative w-full md:w-[400px] group/search">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/30 group-focus-within/search:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="IDENTIFICADOR O SUJETO..."
                                className="w-full h-16 bg-card border border-border rounded-[2rem] pl-16 pr-8 outline-none focus:border-primary transition-all text-sm font-black italic uppercase placeholder:text-muted-foreground/20 shadow-inner"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* 🛡️ AUDIT REGISTRY */}
                <div className="bg-card border border-border rounded-[3.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-6 duration-1000">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-separate border-spacing-0">
                            <thead>
                                <tr className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.3em] italic border-b border-border">
                                    <th className="px-10 py-6 bg-muted/20">Identidad del Sujeto</th>
                                    <th className="px-10 py-6 bg-muted/20">Vector de Acción</th>
                                    <th className="px-10 py-6 bg-muted/20">Entidad Afectada</th>
                                    <th className="px-10 py-6 bg-muted/20">Cronología Forense</th>
                                    <th className="px-10 py-6 bg-muted/20 text-right">Análisis</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
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
                                        <tr key={log.id} className="hover:bg-muted/30 transition-all duration-300 group">
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-muted border border-border flex items-center justify-center font-black text-muted-foreground italic text-sm group-hover:bg-primary/10 group-hover:text-primary transition-all duration-500">
                                                        {log.profiles?.full_name?.charAt(0) || <User className="w-5 h-5" />}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-sm font-black italic text-foreground uppercase tracking-tight truncate group-hover:text-primary transition-colors">
                                                            {log.profiles?.full_name || "KERNEL SYSTEM"}
                                                        </span>
                                                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest truncate opacity-50">
                                                            {log.profiles?.email || "internal@jamalios.com"}
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
                                                <div className="flex items-center gap-3 bg-muted/30 w-fit px-4 py-2 rounded-xl border border-border/50">
                                                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                                    <span className="text-[10px] font-black text-foreground uppercase tracking-[0.3em] font-mono italic">
                                                        {log.entity_type}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="space-y-1.5">
                                                    <div className="text-[10px] font-black text-foreground uppercase tracking-widest italic">
                                                        {format(new Date(log.created_at), "PPP", { locale: es })}
                                                    </div>
                                                    <div className="flex items-center gap-2 opacity-50">
                                                        <Clock className="w-3.5 h-3.5 text-primary" />
                                                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                                                            {format(new Date(log.created_at), "p")}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => setSelectedLog(log)}
                                                    className="rounded-2xl h-14 w-14 bg-muted/20 border border-transparent hover:border-primary/20 hover:bg-card hover:text-primary shadow-sm active:scale-90 transition-all group/btn"
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
                                                    <p className="text-base font-black uppercase italic tracking-[0.5em] leading-none">Cero registros detectados</p>
                                                    <p className="text-[10px] uppercase font-bold tracking-[0.3em]">Protocolo de seguridad inactivo o sin eventos previos</p>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-foreground border-none p-10 rounded-[4rem] text-background shadow-3xl relative overflow-hidden group hover:scale-[1.02] transition-all duration-500">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 blur-[80px] rounded-full -mr-20 -mt-20 group-hover:bg-primary/40 transition-all" />
                        <div className="relative z-10 flex items-center justify-between">
                            <div className="space-y-4">
                                <p className="text-[11px] font-black italic text-primary uppercase tracking-[0.4em]">Densidad de Eventos</p>
                                <p className="text-5xl font-black italic tracking-tighter uppercase leading-none">{logs.length}<span className="text-xl ml-2 opacity-30">UNIT</span></p>
                            </div>
                            <Activity className="w-16 h-16 text-primary opacity-20 group-hover:rotate-12 transition-transform duration-700" />
                        </div>
                    </div>

                    <div className="bg-card border border-border p-10 rounded-[4rem] shadow-2xl relative overflow-hidden group hover:border-primary/40 transition-all duration-500">
                        <div className="relative z-10 flex items-center justify-between">
                            <div className="space-y-4">
                                <p className="text-[11px] font-black italic text-muted-foreground uppercase tracking-[0.4em]">Protocolos Críticos</p>
                                <p className="text-5xl font-black italic tracking-tighter uppercase text-foreground leading-none">00<span className="text-xl ml-2 opacity-10">FAIL</span></p>
                            </div>
                            <ShieldAlert className="w-16 h-16 text-primary opacity-5 group-hover:scale-110 transition-all duration-700" />
                        </div>
                    </div>

                    <div className="bg-card border border-border p-6 rounded-[4rem] shadow-2xl relative overflow-hidden group flex items-center justify-center p-10">
                        <Button variant="ghost" className="w-full h-full text-[11px] font-black uppercase italic tracking-[0.3em] gap-4 text-muted-foreground hover:text-foreground transition-all flex flex-col items-center justify-center group-hover:bg-muted/30 rounded-[3rem]">
                            <Download className="w-8 h-8 text-primary/40 group-hover:text-primary transition-all mb-2" />
                            EXPORTAR DATA MAESTRA
                        </Button>
                    </div>
                </div>
            </div>

            {/* 👓 LOG INSPECTOR MODAL */}
            {selectedLog && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 bg-background/80 backdrop-blur-2xl animate-in fade-in duration-500">
                    <div className="relative bg-card rounded-[4rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-[0_0_150px_rgba(0,0,0,0.5)] border border-border selection:bg-primary selection:text-primary-foreground">

                        {/* Decorative background */}
                        <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none -mr-20 -mt-20">
                            <ShieldAlert className="w-96 h-96" />
                        </div>

                        <div className="px-12 py-10 border-b border-border/50 bg-muted/20 flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-5">
                                <div className="p-4 bg-primary/10 rounded-2xl shadow-inner border border-primary/20">
                                    <ShieldAlert className="w-8 h-8 text-primary shadow-primary/20 shadow-lg" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-3xl font-black italic uppercase tracking-tighter text-foreground leading-none">Análisis <span className="text-primary italic">Forense</span></h3>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em] italic opacity-60">Entry ID: {selectedLog.id.toUpperCase()}</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="rounded-2xl h-14 w-14 hover:bg-muted active:scale-90 transition-all" onClick={() => setSelectedLog(null)}>
                                <X className="w-8 h-8" />
                            </Button>
                        </div>

                        <div className="px-12 py-10 overflow-y-auto custom-scrollbar space-y-10 relative z-10">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="p-8 bg-muted/40 rounded-[2.5rem] border border-border shadow-inner group/card">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4 italic">Operación Atómica</p>
                                    <span className={cn(
                                        "px-6 py-2 rounded-full text-xs font-black uppercase tracking-[0.2em] border italic inline-block shadow-2xl",
                                        getActionBadge(selectedLog.action)
                                    )}>
                                        {selectedLog.action}
                                    </span>
                                </div>
                                <div className="p-8 bg-muted/40 rounded-[2.5rem] border border-border shadow-inner group/card">
                                    <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.4em] mb-4 italic">Entidad Afectada</p>
                                    <p className="text-xl font-black text-foreground uppercase italic tracking-tighter leading-none">{selectedLog.entity_type}</p>
                                </div>
                            </div>

                            <div className="space-y-10">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-6">
                                        <p className="text-[10px] font-black text-foreground uppercase tracking-[0.5em] flex items-center gap-3 italic">
                                            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]" />
                                            Estado de Origen
                                        </p>
                                        <div className="h-px bg-border/50 flex-1 ml-6" />
                                    </div>
                                    <div className="p-10 bg-foreground/95 rounded-[3.5rem] overflow-x-auto shadow-3xl border border-white/5 relative group/c">
                                        <div className="absolute top-4 right-8 text-[9px] font-mono font-black text-white/10 uppercase tracking-widest">Initial State</div>
                                        <pre className="text-xs text-rose-200 font-mono leading-relaxed selection:bg-rose-500/30">
                                            {JSON.stringify(selectedLog.old_values, null, 4)}
                                        </pre>
                                    </div>
                                </div>

                                <div className="flex justify-center relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-dashed border-border/50" />
                                    </div>
                                    <div className="relative z-10 w-16 h-16 bg-card border border-border rounded-2xl flex items-center justify-center shadow-2xl text-primary animate-bounce">
                                        <ArrowRight className="w-8 h-8 rotate-90 md:rotate-0" />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-6">
                                        <p className="text-[10px] font-black text-foreground uppercase tracking-[0.5em] flex items-center gap-3 italic text-emerald-500">
                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                                            Estado de Destino
                                        </p>
                                        <div className="h-px bg-border/50 flex-1 ml-6" />
                                    </div>
                                    <div className="p-10 bg-foreground/95 rounded-[3.5rem] overflow-x-auto shadow-3xl border border-emerald-500/10 relative group/c">
                                        <div className="absolute top-4 right-8 text-[9px] font-mono font-black text-emerald-500/10 uppercase tracking-widest">Final State</div>
                                        <pre className="text-xs text-primary font-mono font-black leading-relaxed selection:bg-primary/20">
                                            {JSON.stringify(selectedLog.new_values, null, 4)}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-12 py-10 bg-muted/20 border-t border-border flex justify-end gap-6">
                            <Button
                                onClick={() => setSelectedLog(null)}
                                className="h-16 px-12 bg-foreground text-background hover:bg-primary hover:text-primary-foreground font-black rounded-3xl gap-4 uppercase text-[10px] tracking-[0.3em] italic shadow-2xl transition-all border-none"
                            >
                                <ArrowLeft className="w-4 h-4" /> RETORNAR AL REGISTRO
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 20px; }
                .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: rgba(255,77,0,0.2); }
            `}</style>
        </div>
    )
}
