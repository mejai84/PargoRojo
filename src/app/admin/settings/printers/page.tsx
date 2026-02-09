"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
    Printer,
    Save,
    Plus,
    Trash2,
    ArrowLeft,
    Loader2,
    Settings,
    Wifi,
    WifiOff,
    HardDrive,
    Activity,
    Zap,
    ArrowRight,
    Cast,
    Cpu
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface PrinterConfig {
    id: string
    name: string
    type: "cashier" | "kitchen" | "bar" | "other"
    connection: "usb" | "network" | "bluetooth"
    status: "online" | "offline"
    target_ip?: string
    paper_size: "58mm" | "80mm"
}

export default function PrintersSettingsPage() {
    const [printers, setPrinters] = useState<PrinterConfig[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        loadPrinters()
    }, [])

    async function loadPrinters() {
        setLoading(true)
        const { data, error } = await supabase
            .from('settings')
            .select('value')
            .eq('key', 'printers_config')
            .single()

        if (data && data.value) {
            setPrinters(data.value)
        } else {
            setPrinters([
                { id: "1", name: "Caja Principal", type: "cashier", connection: "usb", status: "online", paper_size: "80mm" },
                { id: "2", name: "Cocina Central", type: "kitchen", connection: "network", status: "offline", target_ip: "192.168.1.100", paper_size: "80mm" }
            ])
        }
        setLoading(false)
    }

    async function saveConfig() {
        setSaving(true)
        const { error } = await supabase
            .from('settings')
            .upsert({
                key: 'printers_config',
                value: printers
            }, { onConflict: 'key' })

        if (error) {
            alert("Error al guardar: " + error.message)
        } else {
            alert("¡Configuración guardada correctamente!")
        }
        setSaving(false)
    }

    const addPrinter = () => {
        const newPrinter: PrinterConfig = {
            id: Date.now().toString(),
            name: "NUEVA TERMINAL",
            type: "other",
            connection: "usb",
            status: "offline",
            paper_size: "80mm"
        }
        setPrinters([...printers, newPrinter])
    }

    const updatePrinter = (id: string, updates: Partial<PrinterConfig>) => {
        setPrinters(printers.map(p => p.id === id ? { ...p, ...updates } : p))
    }

    const removePrinter = (id: string) => {
        if (confirm("¿Seguro que desea eliminar esta impresora? Esta acción solo se aplicará cuando guarde los cambios.")) {
            setPrinters(prev => prev.filter(p => String(p.id) !== String(id)))
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-transparent">
                <div className="flex flex-col items-center gap-4 animate-in fade-in duration-1000">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary italic">Sincronizando Periféricos...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-transparent text-foreground p-4 md:p-8 font-sans selection:bg-primary selection:text-primary-foreground relative">
            <div className="max-w-[1400px] mx-auto space-y-12 animate-in fade-in duration-1000">

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
                                <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none text-foreground">Hardware <span className="text-primary italic">Bridge</span></h1>
                                <div className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[9px] font-black text-primary tracking-[0.2em] italic uppercase shadow-sm">
                                    PRINTER HUB v3.1
                                </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.4em] italic flex items-center gap-2 opacity-60">
                                <Printer className="w-3.5 h-3.5 text-primary" /> Gestión de Terminales de Salida y Periféricos POS
                            </p>
                        </div>
                    </div>

                    <Button
                        onClick={saveConfig}
                        disabled={saving}
                        className="h-16 px-10 bg-primary text-primary-foreground hover:bg-foreground hover:text-background font-black uppercase text-[10px] tracking-[0.2em] italic rounded-2xl shadow-3xl transition-all gap-3 border-none ring-offset-background focus-visible:ring-2 focus-visible:ring-primary active:scale-95 group"
                    >
                        {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                            <>
                                <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                GUARDAR ARQUITECTURA
                            </>
                        )}
                    </Button>
                </div>

                {/* 🖨️ PRINTER NODES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {printers.map((printer) => (
                        <div key={printer.id} className="bg-card border border-border rounded-[3.5rem] p-10 md:p-14 shadow-2xl relative overflow-hidden group/card animate-in slide-in-from-bottom-6 duration-700">
                            {/* Decorative Background Icon */}
                            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none -mr-12 -mt-12 group-hover/card:scale-110 transition-all duration-1000">
                                <Printer className="w-64 h-64" />
                            </div>

                            <div className="flex items-start justify-between mb-12 relative z-10">
                                <div className="flex items-center gap-6">
                                    <div className={cn(
                                        "w-20 h-20 rounded-[1.5rem] flex items-center justify-center border-2 shadow-inner transition-all duration-500",
                                        printer.status === 'online' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                                    )}>
                                        <Printer className="w-10 h-10" />
                                    </div>
                                    <div className="space-y-2">
                                        <input
                                            value={printer.name}
                                            onChange={(e) => updatePrinter(printer.id, { name: e.target.value.toUpperCase() })}
                                            className="text-3xl font-black italic uppercase tracking-tighter bg-transparent border-none p-0 focus:ring-0 w-full text-foreground outline-none"
                                        />
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-2.5 h-2.5 rounded-full",
                                                printer.status === 'online' ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'
                                            )} />
                                            <span className={cn(
                                                "text-[10px] font-black uppercase tracking-[0.2em] italic",
                                                printer.status === 'online' ? 'text-emerald-500' : 'text-rose-500'
                                            )}>
                                                {printer.status === 'online' ? 'Status: ONLINE' : 'Status: OFFLINE'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removePrinter(printer.id)}
                                    className="h-14 w-14 rounded-2xl bg-rose-500/5 border border-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all active:scale-90"
                                >
                                    <Trash2 className="w-6 h-6" />
                                </Button>
                            </div>

                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                                <div className="space-y-3">
                                    <label className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 ml-6 italic">Misión / Zona</label>
                                    <select
                                        className="w-full h-16 bg-muted/30 border border-border rounded-2xl px-6 outline-none focus:border-primary transition-all font-black italic text-[11px] uppercase cursor-pointer shadow-inner appearance-none"
                                        value={printer.type}
                                        onChange={(e) => updatePrinter(printer.id, { type: e.target.value as any })}
                                    >
                                        <option value="cashier">FACTURACIÓN</option>
                                        <option value="kitchen">COCINA (KDS)</option>
                                        <option value="bar">BAR / DRINKS</option>
                                        <option value="other">GENERAL</option>
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 ml-6 italic">Interface</label>
                                    <select
                                        className="w-full h-16 bg-muted/30 border border-border rounded-2xl px-6 outline-none focus:border-primary transition-all font-black italic text-[11px] uppercase cursor-pointer shadow-inner appearance-none"
                                        value={printer.connection}
                                        onChange={(e) => updatePrinter(printer.id, { connection: e.target.value as any })}
                                    >
                                        <option value="usb">USB (LOCAL)</option>
                                        <option value="network">LAN (IP/RED)</option>
                                        <option value="bluetooth">BLUETOOTH</option>
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 ml-6 italic">Sustrato</label>
                                    <select
                                        className="w-full h-16 bg-muted/30 border border-border rounded-2xl px-6 outline-none focus:border-primary transition-all font-black italic text-[11px] uppercase cursor-pointer shadow-inner appearance-none"
                                        value={printer.paper_size}
                                        onChange={(e) => updatePrinter(printer.id, { paper_size: e.target.value as any })}
                                    >
                                        <option value="80mm">80MM PRO</option>
                                        <option value="58mm">58MM LITE</option>
                                    </select>
                                </div>

                                {printer.connection === 'network' && (
                                    <div className="md:col-span-2 lg:col-span-3 space-y-3 mt-4">
                                        <label className="text-[9px] font-black uppercase tracking-[0.4em] text-primary/60 ml-6 italic">Vector IP del Dispositivo</label>
                                        <div className="relative group/ip">
                                            <Wifi className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground opacity-20 group-focus-within/ip:text-primary transition-all" />
                                            <input
                                                placeholder="192.168.1.100"
                                                value={printer.target_ip || ""}
                                                onChange={(e) => updatePrinter(printer.id, { target_ip: e.target.value })}
                                                className="w-full h-16 bg-muted/30 border border-border rounded-2xl pl-16 pr-8 outline-none focus:border-primary font-mono font-black text-foreground shadow-inner"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    <Button
                        variant="outline"
                        onClick={addPrinter}
                        className="h-full min-h-[400px] border-dashed border-4 border-border/50 bg-transparent rounded-[3.5rem] hover:bg-muted/30 hover:border-primary/40 group/add transition-all flex flex-col items-center justify-center gap-8 text-muted-foreground/40 hover:text-primary"
                    >
                        <div className="w-24 h-24 rounded-[2rem] border-4 border-dashed border-muted-foreground/20 flex items-center justify-center group-hover/add:scale-110 group-hover/add:border-primary/40 transition-all">
                            <Plus className="w-12 h-12" />
                        </div>
                        <div className="text-center space-y-2">
                            <p className="text-2xl font-black italic uppercase tracking-tighter leading-none">Vincular Nueva Terminal</p>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] italic">HARDWARE ADDITION PROTOCOL</p>
                        </div>
                    </Button>
                </div>

                {/* 📋 INFORMATION HUB */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-card border border-border p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 text-primary rotate-12 group-hover:scale-125 transition-transform duration-1000">
                            <Cast className="w-24 h-24" />
                        </div>
                        <div className="relative z-10 space-y-6">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-inner group-hover:bg-primary group-hover:text-background transition-all duration-500">
                                <Settings className="w-8 h-8" />
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-xl font-black italic uppercase tracking-tighter text-foreground">Web Printing Protocol</h4>
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-relaxed italic opacity-60">
                                    LAS IMPRESORAS DEBEN ESTAR CONFIGURADAS EN EL OS O MEDIANTE JAMALI-BRIDGE PARA OPERACIÓN DIRECTA.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-2 bg-foreground rounded-[3.5rem] p-10 text-background shadow-3xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-1000" />
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                            <div className="w-24 h-24 rounded-[2rem] bg-background/10 backdrop-blur-md border border-white/10 flex items-center justify-center shrink-0 shadow-2xl group-hover:rotate-12 transition-transform">
                                <Cpu className="w-12 h-12 text-primary" />
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-2xl font-black italic uppercase tracking-tighter text-primary">Arquitectura de Salida Inteligente</h4>
                                <p className="text-[11px] text-background/60 font-black uppercase tracking-[0.2em] leading-relaxed italic max-w-2xl">
                                    EL SISTEMA DIRIGE AUTOMÁTICAMENTE LAS COMANDAS A LAS ZONAS DEFINIDAS (COCINA, BAR, CAJA) BASADO EN LA CONFIGURACIÓN DE RUTEO DE PRODUCTOS. REVISE EL MAPEO DE CADA PRODUCTO EN EL CATÁLOGO MAESTRO.
                                </p>
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
