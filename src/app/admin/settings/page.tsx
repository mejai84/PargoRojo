"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
    Loader2, Save, MapPin, Phone, Mail, Instagram, Facebook,
    Youtube, Video, Twitter, Link2, Palette, ShieldCheck,
    Zap, Globe, Receipt, Coins, MessageSquare, Clock, Layout,
    Award, ChefHat, Heart, Star, Sparkles, Image as ImageIcon,
    Building2, Smartphone, ShieldAlert, CheckCircle2, QrCode,
    Camera, Upload, ArrowRight, Settings, Grid, Monitor,
    Smartphone as Mobile, Keyboard, MousePointer2, Layers,
    HardDrive, Cpu, Wifi, Activity, Database, ArrowLeft,
    Power, RefreshCw, Key
} from "lucide-react"
import { useRestaurant } from "@/providers/RestaurantProvider"
import { toast } from "sonner"
import Link from "next/link"

export default function SettingsPremiumPage() {
    const { restaurant } = useRestaurant()
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<'general' | 'infrastructure' | 'branding'>('general')
    const [currentTime, setCurrentTime] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    const tabs = [
        { id: 'general', label: 'PARÁMETROS GENERALES', icon: Building2 },
        { id: 'branding', label: 'IDENTIDAD VISUAL', icon: Palette },
        { id: 'infrastructure', label: 'INFRAESTRUCTURA CORE', icon: Cpu },
    ]

    return (
        <div className="min-h-screen text-white font-sans relative overflow-hidden flex flex-col">

            {/* 🖼️ FONDO PREMIUM: Oficina Tech / Minimalismo Industrial con Blur */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center scale-105 pointer-events-none" />
            <div className="absolute inset-0 backdrop-blur-[120px] bg-slate-950/95 pointer-events-none" />

            <div className="relative z-10 flex-1 flex flex-col min-h-full">
                {/* HEADER SISTEMA */}
                <div className="relative z-20 p-8 md:p-12 flex items-center justify-between border-b border-white/5 bg-slate-950/40 backdrop-blur-xl shrink-0">
                    <div className="flex items-center gap-6">
                        <Link href="/admin">
                            <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10">
                                <ArrowLeft className="w-6 h-6 text-slate-400" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none">SYSTEM <span className="text-orange-500">INFRA</span></h1>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] mt-2 italic flex items-center gap-3">
                                CORE ENGINE CONFIGURATION
                                <Database className="w-3 h-3 text-orange-500" />
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="text-right">
                            <p className="text-3xl font-black italic tracking-tighter font-mono">
                                {currentTime.toLocaleTimeString('es-CO')}
                            </p>
                            <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest text-right">SYSTEM UPTIME: 99.9%</p>
                        </div>
                        <Button
                            onClick={() => {
                                setLoading(true)
                                setTimeout(() => {
                                    setLoading(false)
                                    toast.success("CONFIGURACIÓN DEL SISTEMA ACTUALIZADA")
                                }, 1000)
                            }}
                            disabled={loading}
                            className="h-14 px-10 bg-orange-600 hover:bg-orange-700 text-black font-black uppercase text-[10px] italic tracking-widest rounded-2xl shadow-xl shadow-orange-600/30"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5 mr-3" /> GUARDAR CAMBIOS</>}
                        </Button>
                    </div>
                </div>

                <div className="relative z-10 flex-1 overflow-hidden flex">

                    {/* SIDEBAR TABS */}
                    <div className="w-80 bg-slate-950/60 border-r border-white/5 p-8 flex flex-col gap-3 shrink-0">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={cn(
                                    "flex items-center gap-4 p-5 rounded-2xl transition-all border shrink-0",
                                    activeTab === tab.id
                                        ? "bg-orange-500 border-orange-400 text-black shadow-xl shadow-orange-500/20"
                                        : "bg-white/5 border-white/5 text-slate-500 hover:bg-white/10 hover:text-white"
                                )}
                            >
                                <tab.icon className="w-5 h-5" />
                                <span className="text-[10px] font-black uppercase tracking-widest italic">{tab.label}</span>
                            </button>
                        ))}

                        <div className="mt-auto space-y-6">
                            <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Storage Status</p>
                                    <HardDrive className="w-4 h-4 text-emerald-500" />
                                </div>
                                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 w-[45%]" />
                                </div>
                                <p className="text-[8px] font-medium text-slate-500 uppercase">1.2 GB / 5 GB Utilizados</p>
                            </div>
                            <Button
                                onClick={() => toast.error("REBOOT REQUERIDO: Contacte con Soporte Técnico")}
                                variant="ghost" className="w-full text-red-500 hover:text-red-400 hover:bg-red-500/10 h-14 rounded-2xl font-black italic uppercase text-[10px] tracking-widest"
                            >
                                <Power className="w-4 h-4 mr-3" /> REBOOT CORE
                            </Button>
                        </div>
                    </div>

                    {/* CONTENT AREA */}
                    <main className="flex-1 overflow-y-auto custom-scrollbar p-12">
                        <div className="max-w-4xl mx-auto space-y-12">

                            {/* Section Header */}
                            <div className="flex items-center gap-6 pb-8 border-b border-white/5">
                                <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center text-orange-500">
                                    {tabs.find(t => t.id === activeTab)?.icon && <Settings className="w-8 h-8" />}
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none">
                                        {tabs.find(t => t.id === activeTab)?.label}
                                    </h2>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 italic shadow-sm">
                                        Ajustes maestros del nodo de inteligencia
                                    </p>
                                </div>
                            </div>

                            {/* Settings Form Simulation */}
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">NOMBRE DEL NEGOCIO</label>
                                    <input
                                        className="w-full bg-slate-900/40 border border-white/10 rounded-xl h-14 px-6 text-sm font-medium focus:outline-none focus:border-orange-500/50"
                                        defaultValue={restaurant?.name || "PARGO ROJO"}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">EMAIL CORPORATIVO</label>
                                    <input
                                        className="w-full bg-slate-900/40 border border-white/10 rounded-xl h-14 px-6 text-sm font-medium focus:outline-none focus:border-orange-500/50"
                                        defaultValue="admin@pargorojo.com"
                                    />
                                </div>
                            </div>

                            {/* Feature Toggles */}
                            <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 space-y-8">
                                <h3 className="text-xs font-black uppercase tracking-[0.4em] text-slate-400 italic">Core Feature Flags</h3>

                                {[
                                    { label: 'Motor de Cocina KDS', desc: 'Activa la central de producción industrial', active: true },
                                    { label: 'Inteligencia de Meseros', desc: 'Habilita la sincronización móvil de comandas', active: true },
                                    { label: 'Check-in de Reservas', desc: 'Inicia el servicio de concierge digital', active: false },
                                    { label: 'Módulo de Fidelización', desc: 'Gestiona la base de datos de élite', active: true }
                                ].map((flag, i) => (
                                    <div key={i} className="flex items-center justify-between group">
                                        <div>
                                            <p className="text-sm font-black italic uppercase tracking-tight text-white">{flag.label}</p>
                                            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{flag.desc}</p>
                                        </div>
                                        <div
                                            onClick={() => toast.info(`CONTROL DE ACCESO: ${flag.label} ${flag.active ? "DESACTIVADO" : "ACTIVADO"}`)}
                                            className={cn(
                                                "w-14 h-7 rounded-full transition-all flex items-center px-1 shadow-inner cursor-pointer",
                                                flag.active ? "bg-orange-600" : "bg-slate-800"
                                            )}
                                        >
                                            <div className={cn("w-5 h-5 rounded-full bg-white shadow-xl transition-all", flag.active ? "translate-x-7" : "translate-x-0")} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                        </div>
                    </main>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { 
                    background: rgba(255, 255, 255, 0.05); 
                    border-radius: 10px; 
                }
            `}</style>
        </div>
    )
}
