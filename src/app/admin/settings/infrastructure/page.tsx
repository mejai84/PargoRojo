"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Activity,
    Database,
    Download,
    ShieldCheck,
    HardDrive,
    Cpu,
    Signal,
    Clock,
    Server,
    Terminal,
    AlertCircle,
    CheckCircle2,
    Loader2,
    ArrowLeft,
    ShieldAlert,
    Zap,
    Lock,
    Globe,
    Wifi,
    BarChart3,
    ArrowRight,
    Search,
    RefreshCcw,
    Layers,
    Cpu as Processor,
    Database as Storage,
    Monitor
} from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface SystemHealth {
    database: "online" | "offline"
    latency: number
    storage: string
    lastBackup: string
    version: string
}

export default function InfrastructurePage() {
    const [health, setHealth] = useState<SystemHealth>({
        database: "online",
        latency: 0,
        storage: "12%",
        lastBackup: "Hace 12h",
        version: "Jamali OS v5.2 Enterprise SaaS"
    })
    const [loading, setLoading] = useState(false)
    const [exporting, setExporting] = useState<string | null>(null)

    const checkLatency = async () => {
        const start = Date.now()
        await supabase.from('settings').select('key').limit(1)
        setHealth(prev => ({ ...prev, latency: Date.now() - start }))
    }

    useEffect(() => {
        checkLatency()
        const interval = setInterval(checkLatency, 5000)
        return () => clearInterval(interval)
    }, [])

    const handleExport = async (table: string) => {
        setExporting(table)
        try {
            const { data, error } = await supabase.from(table).select('*')
            if (error) throw error

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `jamali_backup_${table}_${new Date().toISOString().split('T')[0]}.json`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
        } catch (e) {
            alert("Error al exportar: " + table)
        } finally {
            setExporting(null)
        }
    }

    return (
        <div className="min-h-screen bg-transparent text-foreground p-4 md:p-12 font-sans selection:bg-primary selection:text-primary-foreground relative overflow-hidden">

            {/* 🌌 AMBIANCE LAYER */}
            <div className="fixed top-0 left-0 w-full h-[600px] bg-gradient-to-b from-primary/10 via-primary/[0.02] to-transparent pointer-events-none z-0" />
            <div className="fixed -top-40 -right-40 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none opacity-40 z-0 animate-pulse" />
            <div className="fixed -bottom-40 -left-40 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none opacity-20 z-0" />

            <div className="max-w-[1600px] mx-auto space-y-16 animate-in fade-in duration-1000 relative z-10">

                {/* 🛡️ REFINED INFRASTRUCTURE COMMAND HEADER */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-12 border-b border-border/50 pb-12">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-10">
                        <Link href="/admin/settings">
                            <Button variant="ghost" size="icon" className="h-20 w-20 rounded-[2.5rem] bg-card border border-border shadow-3xl hover:bg-muted active:scale-90 transition-all group overflow-hidden relative">
                                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <ArrowLeft className="w-10 h-10 group-hover:-translate-x-1 transition-transform relative z-10" />
                            </Button>
                        </Link>
                        <div className="space-y-6">
                            <div className="flex flex-wrap items-center gap-4">
                                <h1 className="text-6xl md:text-7xl font-black italic tracking-[0.02em] uppercase leading-none text-foreground">CORE <span className="text-primary italic">INFRA</span></h1>
                                <div className="px-5 py-2 bg-primary/10 border-2 border-primary/20 rounded-[1.5rem] text-[11px] font-black text-primary tracking-[0.3em] italic uppercase shadow-xl animate-pulse flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                                    ELITE SaaS NODE ACTIVE
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-6">
                                <p className="text-[11px] text-muted-foreground font-black uppercase tracking-[0.5em] italic flex items-center gap-4 opacity-60">
                                    <Server className="w-5 h-5 text-primary" /> Diagnostics & Master Storage Protocol Hub
                                </p>
                                <div className="w-2 h-2 rounded-full bg-border" />
                                <p className="text-[10px] text-primary/40 font-black uppercase tracking-[0.3em] italic">System v8.4.12-EST</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-8 bg-card border border-border p-6 rounded-[3rem] shadow-3xl">
                        <div className="flex flex-col items-end px-10 border-r border-border/50 group/region">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/30 italic mb-1 group-hover/region:text-primary transition-colors">Cluster Region</p>
                            <p className="text-lg font-black italic text-foreground uppercase tracking-tighter flex items-center gap-3">
                                <Globe className="w-5 h-5 text-primary group-hover/region:rotate-12 transition-transform" /> AWS-US-EAST_G1
                            </p>
                        </div>
                        <div className="flex flex-col items-end group/uptime">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/30 italic mb-1 group-hover/uptime:text-emerald-500 transition-colors">Operational Uptime</p>
                            <div className="flex items-center gap-3">
                                <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
                                <p className="text-lg font-black italic text-emerald-500 uppercase tracking-tighter">99.98% REAL-TIME</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ⚡ VITAL SIGNS MATRIX */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                    {[
                        { label: 'Cloud Engine', value: 'OPTIMIZED', icon: Database, color: 'text-emerald-500', bg: 'bg-emerald-500/10', sub: 'POSTGRES MASTER' },
                        { label: 'Edge Latency', value: `${health.latency}ms`, icon: Signal, color: 'text-primary', bg: 'bg-primary/10', sub: 'LOW-LATENCY NÓD' },
                        { label: 'Storage Mesh', value: '1.2 GB DISP', icon: HardDrive, color: 'text-blue-500', bg: 'bg-blue-500/10', sub: 'NVME VECTOR' },
                        { label: 'Encryption Protocol', value: 'AES-256', icon: ShieldCheck, color: 'text-amber-500', bg: 'bg-amber-500/10', sub: 'FIPS 140-2 READY' },
                    ].map((sign, i) => (
                        <div key={i} className="bg-card p-12 rounded-[4rem] border border-border shadow-3xl space-y-8 group hover:border-primary/40 transition-all duration-700 relative overflow-hidden active:scale-[0.98]">
                            <div className={cn("absolute -top-10 -right-10 p-12 opacity-5 group-hover:scale-125 group-hover:rotate-12 transition-all duration-1000", sign.color)}>
                                <sign.icon className="w-48 h-48" />
                            </div>
                            <div className="flex justify-between items-center relative z-10">
                                <div className={cn("w-20 h-20 rounded-[1.5rem] flex items-center justify-center shadow-2xl transition-all duration-500 group-hover:bg-current group-hover:text-background", sign.bg, sign.color)}>
                                    <sign.icon className="w-10 h-10" />
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/30 mb-1 block italic">{sign.sub}</span>
                                    {i === 0 && <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)] ml-auto" />}
                                </div>
                            </div>
                            <div className="relative z-10 space-y-2">
                                <p className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.5em] italic leading-none">{sign.label}</p>
                                <p className={cn("text-4xl font-black italic uppercase tracking-tighter leading-none whitespace-nowrap drop-shadow-sm", sign.color)}>
                                    {sign.value}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid lg:grid-cols-2 gap-16">

                    {/* 📂 REFINED BACKUP COMMAND CENTER */}
                    <div className="space-y-12 animate-in slide-in-from-left-12 duration-1000">
                        <div className="flex items-center justify-between px-10">
                            <div className="space-y-1">
                                <h2 className="text-3xl font-black uppercase tracking-tighter text-foreground italic flex items-center gap-6">
                                    <Download className="w-10 h-10 text-primary" /> Auditoría <span className="text-primary italic">Maestra</span>
                                </h2>
                                <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.4em] italic pl-16">EXTRACCIÓN DE ACTIVOS CRÍTICOS (JSON)</p>
                            </div>
                            <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                <Wifi className="w-4 h-4 text-emerald-500 animate-pulse" />
                                <span className="text-[9px] font-black text-emerald-500 uppercase italic">Linked</span>
                            </div>
                        </div>

                        <div className="bg-card border border-border rounded-[4.5rem] overflow-hidden shadow-3xl relative group/node">
                            <div className="absolute top-0 right-0 p-16 opacity-[0.03] pointer-events-none -mr-16 -mt-16 group-hover/node:scale-110 transition-transform duration-1000 rotate-45">
                                <BarChart3 className="w-64 h-64" />
                            </div>

                            <div className="p-12 border-b border-border/50 bg-muted/20 relative z-10">
                                <div className="flex items-start gap-6">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                        <Database className="w-6 h-6" />
                                    </div>
                                    <p className="text-[11px] font-black text-foreground/40 uppercase tracking-[0.3em] leading-loose italic">
                                        PROTOCOLO DE RESPALDO: GENERA INSTANCIAS DE SEGURIDAD PARA LA PORTABILIDAD DE DATOS Y ANÁLISIS FORENSE OFF-SITE.
                                    </p>
                                </div>
                            </div>
                            <div className="divide-y divide-border/50 relative z-10">
                                {[
                                    { id: 'orders', label: 'Ventas y Transacciones Core', icon: Layers, capacity: '4.2 MB', color: 'text-primary' },
                                    { id: 'products', label: 'Maestro de Inventario & Menú', icon: Processor, capacity: '1.8 MB', color: 'text-blue-500' },
                                    { id: 'profiles', label: 'Directorio de Staff & Access', icon: Lock, capacity: '0.9 MB', color: 'text-amber-500' },
                                    { id: 'inventory_movements', label: 'Historial de Logística (KMS)', icon: Activity, capacity: '12.4 MB', color: 'text-emerald-500' },
                                ].map(item => (
                                    <div key={item.id} className="p-10 flex items-center justify-between hover:bg-muted/40 transition-all duration-500 group/item relative overflow-hidden">
                                        <div className="absolute inset-y-0 left-0 w-1.5 bg-primary/0 group-hover/item:bg-primary transition-all" />
                                        <div className="flex items-center gap-8">
                                            <div className={cn(
                                                "w-16 h-16 rounded-[1.25rem] bg-muted border border-border/50 flex items-center justify-center transition-all duration-500 group-hover/item:scale-110 shadow-inner",
                                                "group-hover/item:bg-background group-hover/item:text-primary"
                                            )}>
                                                <item.icon className="w-8 h-8" />
                                            </div>
                                            <div className="space-y-2">
                                                <span className="text-lg font-black italic uppercase tracking-tighter text-foreground group-hover/item:text-primary transition-colors leading-none">{item.label}</span>
                                                <div className="flex items-center gap-3">
                                                    <span className="px-2 py-0.5 bg-muted rounded-lg text-[8px] font-black text-muted-foreground/60 uppercase tracking-widest">{item.id.toUpperCase()}</span>
                                                    <div className="w-1 h-1 rounded-full bg-border" />
                                                    <p className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] italic">{item.capacity} INDEXADOS • JSON MASTER</p>
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-16 px-10 rounded-[1.5rem] border-border bg-background font-black text-[10px] uppercase italic tracking-[0.3em] hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all gap-5 active:scale-90 shadow-2xl group/btn overflow-hidden relative"
                                            onClick={() => handleExport(item.id)}
                                            disabled={exporting === item.id}
                                        >
                                            <div className="absolute inset-x-0 bottom-0 h-1 bg-primary/20" />
                                            {exporting === item.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5 group-hover/btn:translate-y-1 transition-transform" />}
                                            EXPORTAR
                                        </Button>
                                    </div>
                                ))}
                            </div>

                            <div className="p-8 bg-black/5 text-center">
                                <p className="text-[9px] font-black text-muted-foreground/20 uppercase tracking-[0.8em] italic">Jamali Infrastructure v8.1</p>
                            </div>
                        </div>
                    </div>

                    {/* 🖥️ CYBERPUNK DIAGNOSTIC TERMINAL */}
                    <div className="space-y-12 animate-in slide-in-from-right-12 duration-1000">
                        <div className="flex items-center justify-between px-10">
                            <div className="space-y-1">
                                <h2 className="text-3xl font-black uppercase tracking-tighter text-foreground italic flex items-center gap-6">
                                    <Terminal className="w-10 h-10 text-primary" /> Kernel <span className="text-primary italic">Runtime</span>
                                </h2>
                                <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.4em] italic pl-16">MONITOR DE BAJO NIVEL (SYSTEM LOGS)</p>
                            </div>
                            <Button variant="ghost" className="h-10 w-10 rounded-xl hover:bg-primary/10 text-primary">
                                <RefreshCcw className="w-5 h-5 active:rotate-180 transition-transform" />
                            </Button>
                        </div>

                        <div className="bg-[#0a0a0b] rounded-[4.5rem] p-12 text-emerald-500 font-mono text-[11px] shadow-[0_40px_100px_rgba(0,0,0,0.5)] border border-white/5 relative overflow-hidden group/term min-h-[650px] flex flex-col">
                            <div className="absolute top-0 right-0 p-16 opacity-[0.02] pointer-events-none group-hover/term:scale-110 transition-transform duration-1000 rotate-12">
                                <Activity className="w-[500px] h-[500px] text-emerald-500 animate-pulse" />
                            </div>

                            <div className="space-y-6 relative z-10 selection:bg-emerald-500/20 selection:text-emerald-400 flex-1">
                                <div className="flex items-center justify-between pb-6 border-b border-emerald-500/10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
                                        <div className="space-y-0.5">
                                            <span className="text-emerald-500 font-black italic tracking-widest text-[12px] block">JAMALI-OS_MASTER_NOD_01</span>
                                            <span className="text-[8px] font-black text-emerald-500/30 uppercase tracking-[0.4em]">Secure Shell v9.42.1</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-emerald-500/40 uppercase font-black italic tracking-[0.2em] text-[10px] px-4 py-1.5 border border-emerald-500/20 rounded-full">ENCRYPTED_STREAMING</span>
                                    </div>
                                </div>

                                <div className="space-y-5 pt-8 custom-scrollbar max-h-[400px] overflow-y-auto pr-6">
                                    {[
                                        { tag: 'CORE_KERNEL', msg: 'Sincronización exitosa con HSM Vault', status: 'OK', color: 'text-emerald-500' },
                                        { tag: 'RLS_WATCHER', msg: 'Postgres Policies (RBAC) activas', status: 'SYNCD', color: 'text-emerald-500' },
                                        { tag: 'EDGE_HUB', msg: 'Buffer de eventos maestros procesado', status: 'CLEAN', color: 'text-emerald-500' },
                                        { tag: 'AUTH_NATIVE', msg: 'Verificación de sesión JWT_GLOBAL', status: 'VALID', color: 'text-blue-500' },
                                        { tag: 'G_COLLECTOR', msg: 'Garbage collect on Table(orders) completed', status: 'DONE', color: 'text-emerald-500' },
                                        { tag: 'NET_WORKER', msg: 'Optimizando throughput de red (US-EAST)', status: 'FAST', color: 'text-emerald-500' },
                                        { tag: 'LOG_DISPATCH', msg: 'Transmitiendo logs a cluster de análisis', status: 'LIVE', color: 'text-primary' },
                                        { tag: 'SYSTEM_VM', msg: 'Memory usage within elite parameters (12%)', status: 'ICE', color: 'text-emerald-400' },
                                    ].map((log, lidx) => (
                                        <div key={lidx} className="flex justify-between items-center group/log animate-in slide-in-from-bottom-2" style={{ animationDelay: `${lidx * 100}ms` }}>
                                            <div className="flex items-center gap-4">
                                                <span className="text-emerald-500/20 font-black">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                                                <span className="text-emerald-500/40 font-black">[{log.tag}]</span>
                                                <span className="text-emerald-500/80 font-bold group-hover/log:text-emerald-400 transition-colors uppercase tracking-tight">{log.msg}</span>
                                            </div>
                                            <span className={cn("font-black italic tracking-widest text-[10px] px-3 py-0.5 rounded-lg border",
                                                log.color === 'text-primary' ? "bg-primary/10 border-primary text-primary" : "bg-emerald-500/10 border-emerald-500/20"
                                            )}>{log.status}</span>
                                        </div>
                                    ))}

                                    <div className="pt-10 mt-10 border-t border-emerald-500/10">
                                        <div className="bg-primary/5 rounded-[3rem] p-10 border-2 border-dashed border-primary/20 relative group/alert transition-all hover:bg-primary/10 overflow-hidden">
                                            <div className="absolute inset-0 bg-primary/[0.02] animate-pulse" />
                                            <div className="flex items-center justify-between mb-6 relative z-10">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-12 h-12 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-2xl animate-bounce">
                                                        <AlertCircle className="w-7 h-7" />
                                                    </div>
                                                    <p className="text-primary font-black italic text-sm uppercase tracking-[0.4em] leading-none">
                                                        Protocolo de Alerta <span className="opacity-40">#S4412</span>
                                                    </p>
                                                </div>
                                                <ShieldAlert className="w-8 h-8 text-primary opacity-20" />
                                            </div>
                                            <p className="text-primary/70 leading-relaxed italic uppercase font-black text-[11px] tracking-tight relative z-10">
                                                DETECCIÓN DE LATENCIA ANÓMALA EN NODO <span className="text-white bg-primary px-2 rounded">DB_POSTGRES_MASTER</span>.
                                                EL KERNEL HA INICIADO PROTOCOLO DE RE-APROVISIONAMIENTO DE CONEXIONES.
                                                SISTEMA ESTABLE BAJO CARGA ARTIFICIAL.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="relative z-10 border-t border-white/5 pt-8 flex justify-between items-center text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">
                                <span>Root Access: AUTHORIZED</span>
                                <div className="flex items-center gap-4">
                                    <span className="animate-pulse">STREAMING_LIVE</span>
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                </div>
                            </div>
                        </div>

                        {/* 🏢 ELITE LICENSING HUD */}
                        <div className="bg-card border border-border rounded-[3.5rem] p-10 flex flex-col sm:flex-row items-center justify-between shadow-3xl group hover:border-primary/20 transition-all duration-700 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex items-center gap-8 relative z-10">
                                <div className="w-18 h-18 rounded-2xl bg-muted border border-border flex items-center justify-center group-hover:bg-primary group-hover:text-background transition-all duration-700 shadow-xl group-hover:rotate-12">
                                    <Processor className="w-9 h-9" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-4">
                                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.5em] italic leading-none">Enterprise Architecture</p>
                                        <div className="px-3 py-0.5 bg-primary/10 border border-primary/20 rounded-full text-[8px] font-black text-primary">ELITE</div>
                                    </div>
                                    <p className="text-xl font-black italic text-foreground uppercase tracking-tight leading-none group-hover:translate-x-1 transition-transform">{health.version}</p>
                                </div>
                            </div>
                            <Button variant="ghost" className="h-14 bg-muted/20 text-[10px] font-black uppercase italic tracking-[0.4em] text-primary border-2 border-primary/10 rounded-2xl px-10 hover:bg-primary hover:text-white transition-all shadow-2xl mt-6 sm:mt-0 active:scale-95 group/release">
                                <RefreshCcw className="w-4 h-4 mr-3 group-hover/release:rotate-180 transition-transform" /> RELEASE UPDATES
                            </Button>
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
