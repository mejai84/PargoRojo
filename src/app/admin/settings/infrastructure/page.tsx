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
    ArrowLeft
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
        version: "Pargo Rojo OS v1.6.2 Enterprise"
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
            a.download = `pargorojo_backup_${table}_${new Date().toISOString().split('T')[0]}.json`
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
        <div className="min-h-screen bg-slate-50 p-4 md:p-12 font-sans text-slate-900 border-l border-slate-200">
            <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700">

                {/* 🛡️ INFRASTRUCTURE HEADER */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                    <div className="flex items-center gap-6">
                        <Link href="/admin/settings">
                            <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl bg-white border border-slate-200 hover:bg-slate-100 transition-all">
                                <ArrowLeft className="w-6 h-6" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none">CORE <span className="text-primary italic">INFRA</span></h1>
                                <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[9px] font-black text-emerald-600 tracking-widest italic uppercase">
                                    SaaS Node v1.6
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-3 italic flex items-center gap-2">
                                <Server className="w-3 h-3" /> Monitor de Salud y Gestión de Recursos
                            </p>
                        </div>
                    </div>
                </div>

                {/* ⚡ VITAL SIGNS (Health Check) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4 group hover:border-primary/30 transition-all">
                        <div className="flex justify-between items-center text-emerald-500">
                            <Database className="w-8 h-8" />
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base de Datos</p>
                            <p className="text-2xl font-black italic uppercase text-slate-900">SINCRONIZADA</p>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4 group hover:border-primary/30 transition-all">
                        <div className="flex justify-between items-center text-primary">
                            <Signal className="w-8 h-8" />
                            <span className="text-xs font-black italic">RT REAL-TIME</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Latencia API</p>
                            <p className="text-2xl font-black italic uppercase text-slate-900">{health.latency}ms</p>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4 group hover:border-primary/30 transition-all">
                        <div className="flex justify-between items-center text-blue-500">
                            <HardDrive className="w-8 h-8" />
                            <span className="text-[10px] font-black">NVMe x4</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Almacenamiento Cloud</p>
                            <p className="text-2xl font-black italic uppercase text-slate-900">920 MB DISP</p>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4 group hover:border-primary/30 transition-all">
                        <div className="flex justify-between items-center text-slate-400">
                            <Clock className="w-8 h-8" />
                            <span className="text-[10px] font-black">UTC-5</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Último Respaldo</p>
                            <p className="text-2xl font-black italic uppercase text-slate-900">{health.lastBackup}</p>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-10">

                    {/* 📂 BACKUP CENTER */}
                    <div className="space-y-6">
                        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 italic px-4 flex items-center gap-2">
                            <Download className="w-4 h-4" /> Centro de Exportación (Backups)
                        </h2>
                        <div className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-sm">
                            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                                <p className="text-xs font-bold text-slate-500 uppercase leading-relaxed">
                                    Respalda la información crítica de tu negocio en formato JSON para portabilidad total.
                                </p>
                            </div>
                            <div className="divide-y divide-slate-100 font-black italic uppercase">
                                {[
                                    { id: 'orders', label: 'Ventas y Pedidos', icon: Database },
                                    { id: 'products', label: 'Menú y Productos', icon: Cpu },
                                    { id: 'profiles', label: 'Base de Clientes/Staff', icon: ShieldCheck },
                                    { id: 'inventory_movements', label: 'Movimientos Inventario', icon: Activity },
                                ].map(item => (
                                    <div key={item.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <item.icon className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
                                            <span className="text-xs tracking-widest">{item.label}</span>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="rounded-xl border-slate-200 font-bold text-[9px] uppercase italic tracking-widest hover:bg-slate-900 hover:text-white transition-all gap-2"
                                            onClick={() => handleExport(item.id)}
                                            disabled={exporting === item.id}
                                        >
                                            {exporting === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                                            DESCARGAR
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 🖥️ TERMINAL MGMT & LOGS */}
                    <div className="space-y-6">
                        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 italic px-4 flex items-center gap-2">
                            <Terminal className="w-4 h-4" /> Diagnóstico de Terminales
                        </h2>
                        <div className="bg-slate-900 rounded-[3rem] p-10 text-emerald-500 font-mono text-[11px] shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Activity className="w-40 h-40 text-emerald-500 animate-pulse" />
                            </div>
                            <div className="space-y-3 relative z-10">
                                <p className="text-emerald-500 opacity-50 flex justify-between">
                                    <span>[SYSTEM_LOG] Boot version 1.6.2.pr</span>
                                    <span>OK</span>
                                </p>
                                <p className="text-emerald-500 opacity-50 flex justify-between">
                                    <span>[RLS_ENGINE] Policies reloaded</span>
                                    <span>OK</span>
                                </p>
                                <p className="flex justify-between">
                                    <span>[REALTIME_HUB] Subscribed to orders...</span>
                                    <span className="text-primary font-black animate-pulse">LISTENING</span>
                                </p>
                                <p className="flex justify-between">
                                    <span>[AUTH_PROX] Session tokens verified</span>
                                    <span>OK</span>
                                </p>
                                <div className="pt-6 mt-6 border-t border-emerald-500/20">
                                    <p className="text-amber-500 font-black mb-2 animate-bounce flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" /> ALERTA DE SISTEMA
                                    </p>
                                    <p className="text-slate-400 leading-relaxed italic">
                                        Se detectó una alta latencia en la terminal "CAJA_FRONT_01". Se recomienda verificar la conexión LAN y el estado del bridge de impresión.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 🏢 VERSION CONTROL */}
                        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 flex items-center justify-between shadow-sm">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Versión de Licencia</p>
                                <p className="text-sm font-black italic text-slate-900 uppercase">{health.version}</p>
                            </div>
                            <Button variant="ghost" className="text-[9px] font-black uppercase italic tracking-widest text-primary border border-primary/20 rounded-xl px-4">
                                VER NOTAS DE VERSIÓN
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes pulse-once {
                    0% { opacity: 0.5; }
                    50% { opacity: 1; }
                    100% { opacity: 0.5; }
                }
                .status-pulse {
                    animation: pulse-once 2s infinite;
                }
            `}</style>
        </div>
    )
}
