"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
    Loader2,
    Save,
    Truck,
    MapPin,
    Clock,
    DollarSign,
    Settings,
    ArrowLeft,
    ShieldCheck,
    Zap,
    Briefcase,
    Globe,
    Activity,
    Navigation,
    Phone,
    FileText,
    CheckCircle2,
    AlertCircle,
    Package
} from "lucide-react"
import { cn, formatPrice } from "@/lib/utils"
import Link from "next/link"

interface DeliverySettings {
    id: string
    delivery_fee_enabled: boolean
    delivery_fee: number
    free_delivery_threshold: number | null
    max_delivery_radius_km: number
    estimated_delivery_time_min: number
    estimated_delivery_time_max: number
    restaurant_address: string
    restaurant_lat: number | null
    restaurant_lng: number | null
    restaurant_phone: string
    delivery_active: boolean
    pickup_active: boolean
    notes: string
}

export default function DeliveryConfigPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [settings, setSettings] = useState<DeliverySettings | null>(null)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('delivery_settings')
                .select('*')
                .single()

            if (error) throw error
            setSettings(data)
        } catch (error: any) {
            console.error('Error fetching settings:', error)
            setMessage({ type: 'error', text: 'Error al cargar configuración de logística' })
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!settings) return

        setSaving(true)
        setMessage(null)

        try {
            const { error } = await supabase
                .from('delivery_settings')
                .update({
                    delivery_fee_enabled: settings.delivery_fee_enabled,
                    delivery_fee: settings.delivery_fee,
                    free_delivery_threshold: settings.free_delivery_threshold,
                    max_delivery_radius_km: settings.max_delivery_radius_km,
                    estimated_delivery_time_min: settings.estimated_delivery_time_min,
                    estimated_delivery_time_max: settings.estimated_delivery_time_max,
                    restaurant_address: settings.restaurant_address,
                    restaurant_phone: settings.restaurant_phone,
                    delivery_active: settings.delivery_active,
                    pickup_active: settings.pickup_active,
                    notes: settings.notes,
                    updated_at: new Date().toISOString()
                })
                .eq('id', settings.id)

            if (error) throw error

            setMessage({ type: 'success', text: '✅ Logística sincronizada correctamente' })
            setTimeout(() => setMessage(null), 5000)
            await fetchSettings()
        } catch (error: any) {
            console.error('Error saving settings:', error)
            setMessage({ type: 'error', text: `Error de protocolo: ${error.message}` })
        } finally {
            setSaving(false)
        }
    }

    const updateSetting = (key: keyof DeliverySettings, value: any) => {
        if (!settings) return
        setSettings({ ...settings, [key]: value })
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-transparent">
            <div className="flex flex-col items-center gap-8 animate-in fade-in duration-1000">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
                    <Loader2 className="w-16 h-16 text-primary animate-spin relative z-10" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary italic animate-pulse">Iniciando Protocolo de Logística...</p>
            </div>
        </div>
    )

    if (!settings) return (
        <div className="min-h-screen p-12 flex flex-col items-center justify-center gap-8">
            <AlertCircle className="w-20 h-20 text-red-500 animate-bounce" />
            <h2 className="text-3xl font-black italic uppercase tracking-tighter">Nudo de Configuración No Detectado</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60 italic text-center max-w-md leading-loose">
                EL KERNEL DE LOGÍSTICA REQUIERE UNA TABLA DE REFERENCIA ACTIVA EN EL VAULT DE DATOS.
            </p>
        </div>
    )

    return (
        <div className="min-h-screen bg-transparent text-foreground p-4 md:p-12 font-sans selection:bg-primary selection:text-primary-foreground relative overflow-hidden">

            {/* 🌌 AMBIANCE LAYER */}
            <div className="fixed top-0 left-0 w-full h-[600px] bg-gradient-to-b from-primary/10 via-primary/[0.02] to-transparent pointer-events-none z-0" />
            <div className="fixed -bottom-40 -left-40 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none opacity-20 z-0 animate-pulse" />

            <div className="max-w-[1600px] mx-auto space-y-16 animate-in fade-in duration-1000 relative z-10">

                {/* 🚀 LOGISTICS COMMAND HEADER */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-12 border-b border-border/50 pb-12">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-10">
                        <Link href="/admin">
                            <Button variant="ghost" size="icon" className="h-20 w-20 rounded-[2.5rem] bg-card border border-border shadow-3xl hover:bg-muted active:scale-90 transition-all group overflow-hidden relative">
                                <ArrowLeft className="w-10 h-10 group-hover:-translate-x-1 transition-transform relative z-10" />
                            </Button>
                        </Link>
                        <div className="space-y-6">
                            <div className="flex flex-wrap items-center gap-4">
                                <h1 className="text-6xl md:text-7xl font-black italic tracking-tighter uppercase leading-none text-foreground">CONFIG <span className="text-primary italic">LOGÍSTICA</span></h1>
                                <div className="px-5 py-2 bg-primary/10 border-2 border-primary/20 rounded-[1.5rem] text-[11px] font-black text-primary tracking-[0.3em] italic uppercase shadow-xl animate-pulse flex items-center gap-3">
                                    <Activity className="w-3 h-3" />
                                    REAL-TIME DISPATCH ENGINE
                                </div>
                            </div>
                            <p className="text-[11px] text-muted-foreground font-black uppercase tracking-[0.5em] italic flex items-center gap-4 opacity-60">
                                <Truck className="w-5 h-5 text-primary" /> Maestro de Parámetros para Domicilios & Recogidas en Local
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        {message && (
                            <div className={cn(
                                "hidden lg:flex items-center gap-4 px-8 py-4 rounded-[2rem] border-2 font-black italic text-[10px] uppercase tracking-widest animate-in slide-in-from-right duration-500",
                                message.type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-red-500/10 border-red-500/20 text-red-500"
                            )}>
                                {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                {message.text}
                            </div>
                        )}
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="h-20 px-12 bg-foreground text-background hover:bg-primary hover:text-primary-foreground font-black uppercase text-xs tracking-[0.4em] italic rounded-[2.5rem] shadow-3xl shadow-primary/20 transition-all gap-5 border-none group active:scale-95"
                        >
                            {saving ? <Loader2 className="w-7 h-7 animate-spin" /> : (
                                <>
                                    <Save className="w-7 h-7 group-hover:scale-110 transition-transform" />
                                    ACTUALIZAR PROTOCOLO
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

                    {/* 📦 STATUS MONITOR HUB */}
                    <div className="bg-card border border-border rounded-[4.5rem] p-12 md:p-16 shadow-3xl relative overflow-hidden group/mod">
                        <div className="absolute top-0 right-0 p-16 opacity-[0.03] pointer-events-none -mr-16 -mt-16 group-hover/mod:scale-110 transition-all duration-1000">
                            <Package className="w-[500px] h-[500px]" />
                        </div>

                        <div className="flex items-center gap-6 mb-16 border-l-8 border-primary px-8 relative z-10">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-xl">
                                <Truck className="w-9 h-9" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter italic leading-none">Nodos de Servicio</h3>
                                <p className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.4em] italic">ACTIVE CHANNELS MONITOR</p>
                            </div>
                        </div>

                        <div className="space-y-8 relative z-10">
                            {[
                                { id: 'delivery_active', label: 'Protocolo de Domicilios', sub: 'DESCRIPCIÓN: ENTREGAS EXTERNAS VÍA MOTORIZADOS', icon: Truck },
                                { id: 'pickup_active', label: 'Protocolo de Recogida', sub: 'DESCRIPCIÓN: CLIENTE RETIRA EN PUNTO DE VENTA', icon: MapPin },
                            ].map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => updateSetting(item.id as any, !settings[item.id as keyof DeliverySettings])}
                                    className={cn(
                                        "w-full p-10 rounded-[3rem] border-4 flex items-center justify-between transition-all group/switch shadow-xl relative overflow-hidden",
                                        settings[item.id as keyof DeliverySettings]
                                            ? "bg-primary/5 border-primary text-primary"
                                            : "bg-muted/40 border-border/50 text-muted-foreground/30"
                                    )}
                                >
                                    <div className="flex items-center gap-8 relative z-10">
                                        <div className={cn(
                                            "w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-500 shadow-2xl group-hover/switch:scale-110 group-hover/switch:rotate-6",
                                            settings[item.id as keyof DeliverySettings] ? "bg-primary text-primary-foreground" : "bg-muted-foreground/10 text-muted-foreground"
                                        )}>
                                            <item.icon className="w-8 h-8" />
                                        </div>
                                        <div className="text-left">
                                            <span className="text-xl font-black uppercase tracking-tighter italic block leading-none mb-2 transition-colors group-hover/switch:text-foreground">{item.label}</span>
                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">{item.sub}</p>
                                        </div>
                                    </div>
                                    <div className={cn(
                                        "w-16 h-8 rounded-full relative transition-all border-2 border-transparent relative z-10",
                                        settings[item.id as keyof DeliverySettings] ? "bg-primary shadow-lg shadow-primary/20" : "bg-muted-foreground/10"
                                    )}>
                                        <div className={cn(
                                            "w-6 h-6 rounded-full bg-white absolute top-0.5 shadow-xl transition-all duration-500",
                                            settings[item.id as keyof DeliverySettings] ? "translate-x-9" : "translate-x-1"
                                        )} />
                                    </div>
                                    <div className="absolute inset-x-0 bottom-0 h-1.5 bg-current opacity-5" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 💰 FINANCIAL MATRIX */}
                    <div className="bg-card border border-border rounded-[4.5rem] p-12 md:p-16 shadow-3xl relative overflow-hidden group/fin transition-all hover:border-primary/20">
                        <div className="absolute top-0 right-0 p-16 opacity-[0.03] pointer-events-none -mr-16 -mt-16 group-hover/fin:scale-110 transition-all duration-1000 rotate-45">
                            <DollarSign className="w-[500px] h-[500px]" />
                        </div>

                        <div className="flex items-center gap-6 mb-16 border-l-8 border-primary px-8 relative z-10">
                            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-xl">
                                <DollarSign className="w-9 h-9" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter italic leading-none">Matriz de Tarifas</h3>
                                <p className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.4em] italic">REVENUE & LOGISTICS LEDGER</p>
                            </div>
                        </div>

                        <div className="space-y-12 relative z-10">
                            <button
                                onClick={() => updateSetting('delivery_fee_enabled', !settings.delivery_fee_enabled)}
                                className={cn(
                                    "w-full h-24 rounded-[3rem] border-4 flex items-center justify-between px-10 transition-all group/toggle shadow-xl",
                                    settings.delivery_fee_enabled
                                        ? "bg-amber-500/5 border-amber-500 text-amber-500"
                                        : "bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-emerald-500/10"
                                )}
                            >
                                <div className="flex items-center gap-8">
                                    <div className={cn(
                                        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-2xl",
                                        settings.delivery_fee_enabled ? "bg-amber-500 text-white" : "bg-emerald-500 text-white"
                                    )}>
                                        {settings.delivery_fee_enabled ? <DollarSign className="w-7 h-7" /> : <ShieldCheck className="w-7 h-7" />}
                                    </div>
                                    <div className="text-left">
                                        <span className="text-lg font-black uppercase tracking-tighter italic block leading-none mb-1 group-hover/toggle:text-foreground transition-colors">
                                            {settings.delivery_fee_enabled ? "Cobro de Envío Activo" : "Estrategia: Envío Gratuito"}
                                        </span>
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">DEFINIR SI EL CLIENTE ASUME COSTO DE ENTREGAS</p>
                                    </div>
                                </div>
                                <Activity className={cn("w-6 h-6 animate-pulse", settings.delivery_fee_enabled ? "text-amber-500" : "text-emerald-500")} />
                            </button>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-4 group/input">
                                    <label className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.5em] ml-10 italic flex items-center gap-3">
                                        <DollarSign className="w-4 h-4 text-primary" /> TARIFA BASE (COP)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={settings.delivery_fee}
                                            onChange={(e) => updateSetting('delivery_fee', parseFloat(e.target.value) || 0)}
                                            disabled={!settings.delivery_fee_enabled}
                                            className={cn(
                                                "w-full h-20 px-10 rounded-[2.5rem] border-4 font-black text-4xl italic transition-all outline-none text-center shadow-inner",
                                                settings.delivery_fee_enabled
                                                    ? "bg-muted/30 border-primary/20 text-foreground focus:border-primary"
                                                    : "bg-muted/10 border-border/20 text-muted-foreground/20 cursor-not-allowed"
                                            )}
                                        />
                                        <span className="absolute left-8 top-1/2 -translate-y-1/2 text-2xl font-black opacity-10">$</span>
                                    </div>
                                </div>

                                <div className="space-y-4 group/input">
                                    <label className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.5em] ml-10 italic flex items-center gap-3">
                                        <ShieldCheck className="w-4 h-4 text-emerald-500" /> UMBRAL ENVÍO GRATIS
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={settings.free_delivery_threshold || ''}
                                            onChange={(e) => updateSetting('free_delivery_threshold', e.target.value ? parseFloat(e.target.value) : null)}
                                            className="w-full h-20 bg-muted/30 border-4 border-emerald-500/10 rounded-[2.5rem] px-10 outline-none focus:border-emerald-500 transition-all font-black text-3xl italic text-foreground text-center shadow-inner placeholder:text-muted-foreground/5 leading-none"
                                            placeholder="0.00"
                                        />
                                        <span className="absolute left-8 top-1/2 -translate-y-1/2 text-xl font-black text-emerald-500/20">$</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 📍 GEOSPATIAL PARAMETERS */}
                    <div className="bg-card border border-border rounded-[4.5rem] p-12 md:p-16 shadow-3xl relative overflow-hidden group/geo transition-all hover:border-primary/20">
                        <div className="absolute top-0 right-0 p-16 opacity-[0.03] pointer-events-none -mr-16 -mt-16 group-hover/geo:scale-110 transition-all duration-1000">
                            <Navigation className="w-[500px] h-[500px]" />
                        </div>

                        <div className="flex items-center gap-6 mb-16 border-l-8 border-primary px-8 relative z-10">
                            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-xl">
                                <MapPin className="w-9 h-9" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter italic leading-none">Parámetros Geo</h3>
                                <p className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.4em] italic">GEOSPATIAL SPHERE CONTROL</p>
                            </div>
                        </div>

                        <div className="space-y-12 relative z-10">
                            <div className="space-y-6 group/input">
                                <label className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.5em] ml-10 italic flex items-center gap-3 leading-none">
                                    <Activity className="w-4 h-4 text-blue-500" /> RADIO MÁXIMO DE OPERACIÓN (KM)
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={settings.max_delivery_radius_km}
                                        onChange={(e) => updateSetting('max_delivery_radius_km', parseFloat(e.target.value) || 3)}
                                        className="w-full h-24 bg-muted/30 border-4 border-blue-500/10 rounded-[3rem] px-12 outline-none focus:border-blue-500 transition-all font-black text-6xl italic text-blue-500 text-center shadow-inner tracking-tighter"
                                        placeholder="0"
                                    />
                                    <span className="absolute right-12 top-1/2 -translate-y-1/2 text-2xl font-black text-blue-500/20 italic">KM</span>
                                </div>
                                <p className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.3em] text-center italic">EL SISTEMA RECHAZARÁ AUTOMÁTICAMENTE ENTREGAS FUERA DE ESTA ÓRBITA GEOGRÁFICA.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-4 group/input">
                                    <label className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.5em] ml-10 italic leading-none flex items-center gap-3">
                                        <Briefcase className="w-4 h-4" /> DIRECCIÓN CORE HUB
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.restaurant_address}
                                        onChange={(e) => updateSetting('restaurant_address', e.target.value)}
                                        className="w-full h-18 bg-muted/30 border border-border rounded-[2rem] px-10 outline-none focus:border-primary transition-all font-semibold text-sm italic text-foreground tracking-tight shadow-inner"
                                        placeholder="ESTABLECIMIENTO FÍSICO"
                                    />
                                </div>

                                <div className="space-y-4 group/input">
                                    <label className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.5em] ml-10 italic leading-none flex items-center gap-3">
                                        <Phone className="w-4 h-4" /> CONTACTO LOGÍSTICA
                                    </label>
                                    <input
                                        type="tel"
                                        value={settings.restaurant_phone}
                                        onChange={(e) => updateSetting('restaurant_phone', e.target.value)}
                                        className="w-full h-18 bg-muted/30 border border-border rounded-[2rem] px-10 outline-none focus:border-primary transition-all font-black text-xl italic text-foreground tracking-tighter shadow-inner"
                                        placeholder="+57 300 000 0000"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ⏱️ CHRONOS MATRIX (TIMES) */}
                    <div className="bg-card border border-border rounded-[4.5rem] p-12 md:p-16 shadow-3xl relative overflow-hidden group/clock transition-all hover:border-primary/20">
                        <div className="absolute top-0 right-0 p-16 opacity-[0.03] pointer-events-none -mr-16 -mt-16 group-hover/clock:scale-110 transition-all duration-1000 -rotate-90">
                            <Clock className="w-[500px] h-[500px]" />
                        </div>

                        <div className="flex items-center gap-6 mb-16 border-l-8 border-primary px-8 relative z-10">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-xl">
                                <Clock className="w-9 h-9" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter italic leading-none">Matriz Chronos</h3>
                                <p className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.4em] italic">ESTIMATED DISPATCH TIMES</p>
                            </div>
                        </div>

                        <div className="space-y-12 relative z-10">
                            <div className="grid grid-cols-2 gap-10">
                                <div className="space-y-4 group/input">
                                    <label className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.5em] ml-10 italic leading-none">MÍNIMO (MIN)</label>
                                    <input
                                        type="number"
                                        value={settings.estimated_delivery_time_min}
                                        onChange={(e) => updateSetting('estimated_delivery_time_min', parseInt(e.target.value) || 30)}
                                        className="w-full h-32 bg-muted/30 border-4 border-primary/10 rounded-[3rem] px-10 outline-none focus:border-primary transition-all font-black text-6xl italic text-foreground text-center shadow-inner tracking-tighter leading-none"
                                    />
                                </div>
                                <div className="space-y-4 group/input">
                                    <label className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.5em] ml-10 italic leading-none">MÁXIMO (MIN)</label>
                                    <input
                                        type="number"
                                        value={settings.estimated_delivery_time_max}
                                        onChange={(e) => updateSetting('estimated_delivery_time_max', parseInt(e.target.value) || 45)}
                                        className="w-full h-32 bg-muted/30 border-4 border-primary/10 rounded-[3rem] px-10 outline-none focus:border-primary transition-all font-black text-6xl italic text-primary text-center shadow-inner tracking-tighter leading-none"
                                    />
                                </div>
                            </div>
                            <div className="bg-primary/5 border-2 border-primary/20 rounded-[3rem] p-12 relative overflow-hidden group/precl">
                                <div className="absolute inset-0 bg-primary/[0.02] animate-pulse" />
                                <div className="flex items-center gap-8 relative z-10">
                                    <div className="w-20 h-20 rounded-[1.5rem] bg-primary text-primary-foreground flex items-center justify-center shadow-2xl group-hover/precl:scale-110 transition-transform">
                                        <Clock className="w-10 h-10" />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[11px] font-black text-primary uppercase tracking-[0.5em] italic leading-none">PREVISUALIZACIÓN AL CLIENTE</p>
                                        <p className="text-4xl font-black italic uppercase tracking-tighter text-foreground leading-none">
                                            {settings.estimated_delivery_time_min} - {settings.estimated_delivery_time_max} MINS
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 📝 INTERNAL PROTOCOLS */}
                    <div className="md:col-span-2 bg-card border border-border rounded-[4.5rem] p-12 md:p-16 shadow-3xl relative overflow-hidden group/note transition-all hover:border-primary/20">
                        <div className="absolute top-0 right-0 p-16 opacity-[0.03] pointer-events-none -mr-16 -mt-16 group-hover/note:scale-110 transition-all duration-1000">
                            <FileText className="w-[500px] h-[500px]" />
                        </div>

                        <div className="flex items-center gap-6 mb-16 border-l-8 border-primary px-8 relative z-10">
                            <div className="w-16 h-16 rounded-2xl bg-foreground/10 flex items-center justify-center text-foreground shadow-xl">
                                <FileText className="w-9 h-9" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter italic leading-none">Protocolos Internos</h3>
                                <p className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.4em] italic">INTERNAL NOTES & OPERATIONAL GUIDES</p>
                            </div>
                        </div>

                        <div className="relative z-10">
                            <textarea
                                value={settings.notes || ''}
                                onChange={(e) => updateSetting('notes', e.target.value)}
                                className="w-full h-48 bg-muted/30 border-4 border-border rounded-[4rem] p-12 outline-none focus:border-primary transition-all font-black text-sm italic text-foreground tracking-tight shadow-inner resize-none uppercase tracking-[0.05em] leading-relaxed placeholder:text-muted-foreground/10"
                                placeholder="ASIGNA REGLAS ESPECIALES PARA EL KERNEL DE DESPACHO... EJ: COBRO ADICIONAL FINES DE SEMANA, ZONA NORTE LIMITADA."
                            />
                        </div>
                    </div>
                </div>

                {/* 🏷️ GLOBAL METRIC */}
                <div className="p-10 bg-foreground rounded-[4rem] text-background flex flex-col md:flex-row items-center justify-between shadow-3xl group/metric relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover/metric:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-10 relative z-10">
                        <div className="w-20 h-20 rounded-[2rem] bg-background/10 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-2xl group-hover/metric:rotate-12 transition-transform duration-500">
                            <Activity className="w-10 h-10 text-primary drop-shadow-[0_0_15px_rgba(255,77,0,0.6)]" />
                        </div>
                        <div className="space-y-2 text-center md:text-left">
                            <h4 className="text-2xl font-black italic uppercase tracking-tighter text-primary">Master Dispatch Status</h4>
                            <p className="text-[10px] text-background/40 font-black uppercase tracking-[0.4em] italic leading-none">
                                SYSTEM v8.42 • KERNEL OPTIMIZED FOR LOW LATENCY DISPATCH
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-12 mt-8 md:mt-0 relative z-10">
                        <div className="text-right">
                            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white/20 mb-1 italic">Throughput</p>
                            <p className="text-2xl font-black italic tracking-tighter text-emerald-500">99.8% STABLE</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white/20 mb-1 italic">Node Region</p>
                            <p className="text-2xl font-black italic tracking-tighter text-white">US-EAST_G1</p>
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
