"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Printer, Save, Plus, Trash2, ArrowLeft, Loader2, Settings, Wifi, WifiOff } from "lucide-react"
import Link from "next/link"

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
            // Default initial config
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
            name: "Nueva Impresora",
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
            // Use String comparison to be safe with IDs from different sources
            setPrinters(prev => prev.filter(p => String(p.id) !== String(id)))
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/settings">
                            <Button variant="outline" size="icon">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-tighter">Configuración de Impresoras</h1>
                            <p className="text-muted-foreground">Gestiona los terminales de impresión para diferentes zonas.</p>
                        </div>
                    </div>
                    <Button onClick={saveConfig} disabled={saving} className="bg-primary text-black hover:bg-primary/90 font-bold gap-2">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Guardar Cambios
                    </Button>
                </div>

                <div className="grid gap-6">
                    {printers.map((printer) => (
                        <div key={printer.id} className="p-6 rounded-2xl bg-card border border-white/10 hover:border-primary/30 transition-all shadow-xl">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className={`p-4 rounded-xl ${printer.status === 'online' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                        <Printer className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <input
                                            value={printer.name}
                                            onChange={(e) => updatePrinter(printer.id, { name: e.target.value })}
                                            className="text-xl font-bold bg-transparent border-none p-0 focus:ring-0 w-full"
                                        />
                                        <div className="flex items-center gap-2 text-sm mt-1">
                                            {printer.status === 'online' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                                            <span className={printer.status === 'online' ? 'text-green-500 font-bold uppercase' : 'text-red-500 font-bold uppercase text-[10px]'}>
                                                {printer.status === 'online' ? 'En Línea' : 'Desconectada'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        removePrinter(printer.id);
                                    }}
                                    className="text-destructive hover:bg-destructive/10 shrink-0"
                                >
                                    <Trash2 className="w-5 h-5 pointer-events-none" />
                                </Button>
                            </div>

                            <div className="grid md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Zona / Propósito</label>
                                    <select
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 outline-none focus:border-primary"
                                        value={printer.type}
                                        onChange={(e) => updatePrinter(printer.id, { type: e.target.value as any })}
                                    >
                                        <option value="cashier">Caja / Facturación</option>
                                        <option value="kitchen">Cocina (KDS)</option>
                                        <option value="bar">Bar / Bebidas</option>
                                        <option value="other">Otros / General</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Conexión</label>
                                    <select
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 outline-none focus:border-primary"
                                        value={printer.connection}
                                        onChange={(e) => updatePrinter(printer.id, { connection: e.target.value as any })}
                                    >
                                        <option value="usb">USB (Local)</option>
                                        <option value="network">Red (LAN / IP)</option>
                                        <option value="bluetooth">Bluetooth</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tamaño Papel</label>
                                    <select
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 outline-none focus:border-primary"
                                        value={printer.paper_size}
                                        onChange={(e) => updatePrinter(printer.id, { paper_size: e.target.value as any })}
                                    >
                                        <option value="80mm">80mm (Estándar)</option>
                                        <option value="58mm">58mm (Pequeño)</option>
                                    </select>
                                </div>

                                {printer.connection === 'network' && (
                                    <div className="md:col-span-3 space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Dirección IP de la Impresora</label>
                                        <input
                                            placeholder="192.168.1.100"
                                            value={printer.target_ip || ""}
                                            onChange={(e) => updatePrinter(printer.id, { target_ip: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-2 outline-none focus:border-primary font-mono"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    <Button
                        variant="outline"
                        onClick={addPrinter}
                        className="h-24 border-dashed border-2 bg-transparent hover:bg-white/5 gap-2 text-muted-foreground text-lg"
                    >
                        <Plus className="w-6 h-6" /> Añadir Impresora
                    </Button>
                </div>

                <div className="mt-8 p-6 rounded-2xl bg-white/5 border border-white/10">
                    <h3 className="font-bold flex items-center gap-2 mb-2">
                        <Settings className="w-4 h-4 text-primary" />
                        Aviso sobre impresión web
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Dado que esta es una aplicación web, la impresión directa requiere que las impresoras estén configuradas en su sistema operativo o mediante un controlador de puente (Bridge). Las zonas ayudan a dirigir los pedidos a los terminales correctos.
                    </p>
                </div>
            </div>
        </div>
    )
}
