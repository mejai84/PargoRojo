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
    HardDrive, Cpu, Wifi, Activity, Database
} from "lucide-react"
import { useRestaurant } from "@/providers/RestaurantProvider"
import Link from "next/link"

function SimpleSwitch({ checked, onCheckedChange }: { checked: boolean, onCheckedChange: (c: boolean) => void }) {
    return (
        <button
            onClick={() => onCheckedChange(!checked)}
            className={cn(
                "w-16 h-8 rounded-full transition-all flex items-center px-1 shadow-inner relative overflow-hidden group",
                checked ? "bg-primary" : "bg-muted"
            )}
        >
            <div className={cn(
                "w-6 h-6 rounded-full bg-background transition-all shadow-xl relative z-10",
                checked ? "translate-x-8" : "translate-x-0"
            )} />
        </button>
    )
}

const ICON_MAP: any = { Award, ChefHat, Heart, Star, Sparkles, Zap, Utensils: Layout }

export default function SettingsPage() {
    const { restaurant } = useRestaurant()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [activeTab, setActiveTab] = useState<'general' | 'landing' | 'infrastructure'>('general')

    const [featureFlags, setFeatureFlags] = useState<any>({
        enable_kitchen_kds: true,
        enable_waiter_pos: true,
        require_cashier_approval: false,
        enable_reservations: true,
        enable_coupons: true,
        enable_combos: true,
        menu_show_images: true
    })

    const [businessInfo, setBusinessInfo] = useState<any>({
        name: "NEGOCIO",
        logo_url: "",
        tagline: "Eslogan del negocio",
        primary_color: "#FF6B35",
        address: "",
        phone: "",
        email: "",
        instagram_url: "",
        facebook_url: "",
        tiktok_url: "",
        youtube_url: "",
        subdomain: "",
        theme: "light",
        apply_service_charge: false,
        service_charge_percentage: 10,
        currency_symbol: "$",
        tax_percentage: 0,
        loyalty_points_per_1000: 1,
        whatsapp_number: "",
        enable_whatsapp_receipts: false
    })

    const [landingConfig, setLandingConfig] = useState<any>({
        hero: {
            image_url: "",
            title_part1: "",
            title_part2: "",
            tagline: "",
            est_year: "2024",
            location_city: ""
        },
        essence: [],
        experience: {
            image_url: "",
            title_part1: "",
            title_part2: "",
            description: "",
            tour_link: "#"
        }
    })

    useEffect(() => {
        if (restaurant) {
            setBusinessInfo((prev: any) => ({
                ...prev,
                name: restaurant.name || prev.name,
                primary_color: restaurant.primary_color || prev.primary_color,
                logo_url: restaurant.logo_url || prev.logo_url,
                subdomain: restaurant.subdomain || prev.subdomain,
                theme: restaurant.theme || prev.theme,
                apply_service_charge: restaurant.apply_service_charge || false,
                service_charge_percentage: restaurant.service_charge_percentage || 10,
                currency_symbol: restaurant.currency_symbol || "$",
                tax_percentage: restaurant.tax_percentage || 0,
                loyalty_points_per_1000: restaurant.loyalty_points_per_1000 || 1,
                whatsapp_number: restaurant.whatsapp_number || "",
                enable_whatsapp_receipts: restaurant.enable_whatsapp_receipts || false
            }))
            if (restaurant.landing_page_config) {
                setLandingConfig(restaurant.landing_page_config)
            }
            fetchSettings()
        }
    }, [restaurant])

    const fetchSettings = async () => {
        const { data } = await supabase.from('settings').select('*')
        if (data) {
            const flags = data.find(s => s.key === 'feature_flags')
            if (flags) setFeatureFlags(flags.value)

            const info = data.find(s => s.key === 'business_info')
            if (info) {
                setBusinessInfo((prev: any) => ({
                    ...prev,
                    ...info.value
                }))
            }
        }
        setLoading(false)
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("No user")

            await Promise.all([
                supabase.from('settings').upsert({
                    key: 'feature_flags',
                    value: featureFlags,
                    description: 'Global feature flags'
                }),
                supabase.from('settings').upsert({
                    key: 'business_info',
                    value: businessInfo,
                    description: 'Public business identity and contact info'
                })
            ])

            const { data: profile } = await supabase.from('profiles').select('restaurant_id').eq('id', user.id).single()
            if (profile?.restaurant_id) {
                await supabase.from('restaurants').update({
                    name: businessInfo.name,
                    primary_color: businessInfo.primary_color,
                    logo_url: businessInfo.logo_url,
                    subdomain: businessInfo.subdomain,
                    theme: businessInfo.theme,
                    apply_service_charge: businessInfo.apply_service_charge,
                    service_charge_percentage: Number(businessInfo.service_charge_percentage),
                    currency_symbol: businessInfo.currency_symbol,
                    tax_percentage: Number(businessInfo.tax_percentage),
                    loyalty_points_per_1000: Number(businessInfo.loyalty_points_per_1000),
                    whatsapp_number: businessInfo.whatsapp_number,
                    enable_whatsapp_receipts: businessInfo.enable_whatsapp_receipts,
                    landing_page_config: {
                        ...landingConfig,
                        feature_flags: featureFlags
                    }
                }).eq('id', profile.restaurant_id)
            }

            alert("Jamali OS: Configuración avanzada actualizada con éxito.")
            window.location.reload()
        } catch (e) {
            console.error(e)
            alert("Error al guardar cambios")
        }
        setSaving(false)
    }

    const toggle = (key: string) => {
        setFeatureFlags((prev: any) => ({ ...prev, [key]: !prev[key] }))
    }

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-20 gap-8 bg-transparent">
            <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
                <Loader2 className="animate-spin text-primary w-16 h-16 relative z-10" />
            </div>
            <div className="space-y-2 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary italic animate-pulse">Sincronizando Entorno SaaS...</p>
                <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Master Control Hub v5.4</p>
            </div>
        </div>
    )

    return (
        <div className="max-w-[1600px] mx-auto space-y-16 animate-in fade-in duration-1000 pb-32 px-4 md:px-12 font-sans selection:bg-primary selection:text-primary-foreground relative bg-transparent">

            {/* 🔝 STRATEGIC COMMAND HEADER */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-10 border-b border-border/50 pb-12">
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full flex items-center gap-2.5">
                            <Zap className="w-3.5 h-3.5 text-primary fill-primary animate-pulse" />
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary italic">Enterprise Architecture v5.4.12</span>
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-border" />
                        <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-[0.3em] italic leading-none">Global Control Hub</span>
                    </div>
                    <div className="space-y-3">
                        <h1 className="text-6xl md:text-7xl font-black italic uppercase tracking-tighter text-foreground leading-[0.8]">Centro de <span className="text-primary italic">Parámetros</span></h1>
                        <p className="text-muted-foreground font-black text-[11px] uppercase tracking-[0.5em] italic opacity-50 flex items-center gap-3">
                            <Layers className="w-4 h-4 text-primary" /> Orquestación del Kernel y Capa de Identidad
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 bg-card border border-border p-3 rounded-[3rem] shadow-3xl">
                    <div className="flex bg-muted/30 p-2 rounded-[2.5rem] border border-border/50 shadow-inner">
                        {[
                            { id: 'general', label: 'Ecosistema', icon: <Grid className="w-4 h-4" /> },
                            { id: 'landing', label: 'Experiencia', icon: <Monitor className="w-4 h-4" /> },
                            { id: 'infrastructure', label: 'Hardware', icon: <Wifi className="w-4 h-4" /> }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={cn(
                                    "flex items-center gap-3 px-8 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all duration-500 italic relative overflow-hidden group/tab",
                                    activeTab === tab.id ? "bg-background text-primary shadow-2xl border border-primary/20" : "text-muted-foreground/40 hover:text-foreground hover:bg-muted/50"
                                )}
                            >
                                <span className={cn("transition-transform group-hover/tab:scale-110", activeTab === tab.id ? "text-primary" : "text-muted-foreground/30")}>
                                    {tab.icon}
                                </span>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="h-20 px-12 bg-foreground text-background hover:bg-primary hover:text-primary-foreground font-black uppercase text-xs tracking-[0.3em] italic rounded-[2.5rem] shadow-3xl shadow-primary/20 transition-all gap-5 border-none active:scale-95 group leading-none"
                    >
                        {saving ? <Loader2 className="animate-spin w-7 h-7" /> : <Save className="w-7 h-7 group-hover:scale-110 transition-transform" />}
                        SINCRONIZAR KERNEL
                    </Button>
                </div>
            </div>

            {activeTab === 'general' ? (
                <div className="grid lg:grid-cols-2 gap-16 animate-in fade-in slide-in-from-bottom-8 duration-700">

                    {/* 🎨 BRANDING & IDENTITY SUBSYSTEM */}
                    <div className="space-y-12">
                        <SectionHeader icon={<Palette className="w-7 h-7" />} label="Identidad Visual & Estética Core" />

                        <div className="bg-card border border-border rounded-[4rem] p-12 shadow-3xl space-y-12 relative overflow-hidden group/card transition-all hover:border-primary/20">
                            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover/card:scale-110 transition-all duration-1000 grayscale group-hover/card:grayscale-0">
                                <Building2 className="w-80 h-80 -mr-24 -mt-24" />
                            </div>

                            <div className="grid grid-cols-1 gap-10 relative z-10">
                                <div className="space-y-4 group/input">
                                    <label className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/60 ml-8 italic group-focus-within/input:text-primary transition-colors">Identificador de Identidad (NAME)</label>
                                    <input
                                        className="w-full h-20 bg-muted/30 border border-border rounded-[2.5rem] px-10 outline-none focus:border-primary font-black italic text-3xl transition-all shadow-inner text-foreground placeholder:text-muted-foreground/20 leading-none tracking-tighter"
                                        value={businessInfo.name}
                                        onChange={e => setBusinessInfo({ ...businessInfo, name: e.target.value.toUpperCase() })}
                                        placeholder="TITULAR DEL NEGOCIO"
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground/40 ml-8 italic">Paleta de Interfaz (MAESTRO)</label>
                                        <div className="flex items-center gap-6 bg-muted/20 p-6 rounded-[2.5rem] border border-border shadow-inner group/color">
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-current opacity-20 blur-xl rounded-full scale-150" style={{ color: businessInfo.primary_color }} />
                                                <input
                                                    type="color"
                                                    className="w-16 h-16 p-0 border-none bg-transparent cursor-pointer rounded-2xl overflow-hidden shadow-2xl relative z-10 scale-110 hover:scale-125 transition-transform"
                                                    value={businessInfo.primary_color}
                                                    onChange={e => setBusinessInfo({ ...businessInfo, primary_color: e.target.value })}
                                                />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <input
                                                    className="w-full h-8 bg-transparent border-none outline-none font-black italic text-sm tracking-[0.3em] text-primary px-2 uppercase"
                                                    value={businessInfo.primary_color}
                                                    onChange={e => setBusinessInfo({ ...businessInfo, primary_color: e.target.value })}
                                                />
                                                <p className="text-[7px] font-bold text-muted-foreground/30 uppercase tracking-[0.5em] pl-2">HEXADECIMAL VECTOR</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground/40 ml-8 italic">Activo Gráfico (LOGO)</label>
                                        <div className="flex items-center gap-6 bg-muted/20 p-6 rounded-[2.5rem] border border-border shadow-inner group/logo">
                                            <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center p-3 overflow-hidden shrink-0 shadow-2xl relative">
                                                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/logo:opacity-100 transition-opacity" />
                                                {businessInfo.logo_url ? (
                                                    <img src={businessInfo.logo_url} alt="Logo" className="w-full h-full object-contain relative z-10 group-hover/logo:scale-110 transition-transform duration-500" />
                                                ) : (
                                                    <Camera className="w-8 h-8 text-primary opacity-20 relative z-10" />
                                                )}
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                id="logo-upload"
                                                onChange={async (e) => {
                                                    if (!e.target.files?.[0]) return
                                                    const file = e.target.files[0]
                                                    const fileName = `L${Date.now()}-${file.name}`
                                                    try {
                                                        const { error } = await supabase.storage.from('brand_assets').upload(fileName, file)
                                                        if (error) throw error
                                                        const { data: { publicUrl } } = supabase.storage.from('brand_assets').getPublicUrl(fileName)
                                                        setBusinessInfo({ ...businessInfo, logo_url: publicUrl })
                                                    } catch (err) { alert('Error subiendo logo') }
                                                }}
                                            />
                                            <Button
                                                variant="ghost"
                                                className="flex-1 h-14 bg-background border border-border rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] italic hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all shadow-xl gap-3 active:scale-95 group/upload"
                                                onClick={() => document.getElementById('logo-upload')?.click()}
                                            >
                                                <Upload className="w-4 h-4 group-hover/upload:translate-y-[-2px] transition-transform" /> INDEXAR
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6 pt-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground/40 ml-8 italic flex items-center gap-3">
                                        <Palette className="w-3.5 h-3.5" /> Presets de Visualización Jamali OS
                                    </label>
                                    <div className="flex flex-wrap gap-5 px-4">
                                        {[
                                            { color: '#FF6B35', name: 'Original' }, { color: '#3B82F6', name: 'Azure' }, { color: '#10B981', name: 'Emerald' },
                                            { color: '#8B5CF6', name: 'Violet' }, { color: '#F59E0B', name: 'Amber' }, { color: '#EC4899', name: 'Pink' },
                                            { color: '#7CC5D9', name: 'Arctic' }, { color: '#2DD4BF', name: 'Teal' }, { color: '#D4AF37', name: 'Gold' }
                                        ].map(palette => (
                                            <button
                                                key={palette.color}
                                                type="button"
                                                onClick={() => setBusinessInfo({ ...businessInfo, primary_color: palette.color })}
                                                className={cn(
                                                    "w-14 h-14 rounded-[1.5rem] border-4 transition-all p-1 flex items-center justify-center hover:scale-110 active:scale-90 group/preset relative",
                                                    businessInfo.primary_color === palette.color ? "border-primary shadow-3xl shadow-primary/30" : "border-transparent"
                                                )}
                                                title={palette.name}
                                            >
                                                <div className="w-full h-full rounded-xl shadow-inner border border-black/10 transition-transform duration-500 group-hover/preset:rotate-12" style={{ backgroundColor: palette.color }} />
                                                {businessInfo.primary_color === palette.color && (
                                                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg transform scale-110">
                                                        <CheckCircle2 className="w-2.5 h-2.5" />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-10 pt-10 border-t border-border/50">
                                    <div className="space-y-4 group/input">
                                        <label className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground/40 ml-8 italic flex items-center gap-3">
                                            <Globe className="w-4 h-4 text-primary" /> Vector de Subdominio
                                        </label>
                                        <div className="flex items-center h-18 bg-muted/20 border border-border rounded-[2.5rem] px-10 focus-within:border-primary transition-all shadow-inner group/url">
                                            <input
                                                className="flex-1 bg-transparent outline-none font-black italic text-foreground text-base tracking-tight min-w-0"
                                                value={businessInfo.subdomain}
                                                onChange={e => setBusinessInfo({ ...businessInfo, subdomain: e.target.value.toLowerCase() })}
                                                placeholder="instancia-negocio"
                                            />
                                            <span className="text-[10px] font-black text-primary/40 whitespace-nowrap ml-4 uppercase tracking-[0.2em] group-focus-within/url:text-primary transition-colors">.JAMALIOS.COM</span>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground/40 ml-8 italic flex items-center gap-3">
                                            <Monitor className="w-4 h-4 text-primary" /> Visual Runtime Mode
                                        </label>
                                        <div className="relative group/sel">
                                            <select
                                                className="w-full h-18 bg-muted/20 border border-border rounded-[2.5rem] px-10 outline-none focus:border-primary font-black uppercase italic text-[11px] tracking-[0.3em] shadow-inner appearance-none cursor-pointer text-foreground relative z-10 transition-all"
                                                value={businessInfo.theme}
                                                onChange={e => setBusinessInfo({ ...businessInfo, theme: e.target.value })}
                                            >
                                                <option value="light">NODO LIGHT (MODO DÍA)</option>
                                                <option value="dark">NODO DARK (NIGHT PROTOCOL)</option>
                                            </select>
                                            <div className="absolute right-8 top-1/2 -translate-y-1/2 text-primary pointer-events-none group-hover/sel:translate-y-[-45%] transition-transform">
                                                <ArrowRight className="w-5 h-5 opacity-40 rotate-90" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ⚙️ OPERATIONAL KERNEL SUBSYSTEM */}
                    <div className="space-y-16">

                        <div className="space-y-10">
                            <SectionHeader icon={<ShieldCheck className="w-7 h-7" />} label="Protocólos & Seguridad Logística" />
                            <div className="bg-card border border-border rounded-[4rem] p-4 shadow-3xl overflow-hidden relative group/modules">
                                <div className="absolute inset-0 bg-primary/[0.01] pointer-events-none" />
                                {[
                                    { key: 'enable_kitchen_kds', icon: <ChefHat className="w-6 h-6" />, label: 'Master Kitchen (KDS)', sub: 'MOTOR TÁCTIL DE ALTO RENDIMIENTO PARA DESPACHOS.', color: 'text-emerald-500' },
                                    { key: 'enable_waiter_pos', icon: <Mobile className="w-6 h-6" />, label: 'Waiter Mobility (POS)', sub: 'TERMINALES MÓVILES PARA TOMA DE PEDIDOS EN MESA.', color: 'text-blue-500' },
                                    { key: 'require_cashier_approval', icon: <ShieldAlert className="w-6 h-6" />, label: 'Blindaje de Transacción', sub: 'BLOQUEO DE DESPACHO HASTA VERIFICACIÓN DE PAGO.', color: 'text-rose-500' },
                                    { key: 'menu_show_images', icon: <ImageIcon className="w-6 h-6" />, label: 'Rich Media Menu (QR)', sub: 'VISUALIZACIÓN DE IMÁGENES DE ALTA COBERTURA.', color: 'text-amber-500' },
                                ].map((flag, idx) => (
                                    <div key={flag.key} className={cn(
                                        "flex items-center justify-between p-10 hover:bg-muted/40 transition-all duration-500 rounded-[3rem] group relative overflow-hidden",
                                        idx !== 3 && "mb-2"
                                    )}>
                                        <div className="absolute inset-y-0 left-0 w-1.5 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="flex items-center gap-8 relative z-10">
                                            <div className={cn(
                                                "w-18 h-18 rounded-2xl bg-muted/50 border border-border/50 flex items-center justify-center transition-all duration-700 shadow-inner group-hover:scale-110",
                                                flag.color.replace('text', 'bg').replace('500', '10') + " " + flag.color
                                            )}>
                                                {flag.icon}
                                            </div>
                                            <div className="space-y-2">
                                                <div className="font-black italic uppercase text-lg text-foreground tracking-tighter transition-colors group-hover:text-primary leading-none">{flag.label}</div>
                                                <div className="text-[10px] text-muted-foreground/30 font-black uppercase tracking-[0.15em] italic leading-tight max-w-[280px]">{flag.sub}</div>
                                            </div>
                                        </div>
                                        <SimpleSwitch checked={featureFlags[flag.key]} onCheckedChange={() => toggle(flag.key)} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-10">
                            <SectionHeader icon={<Receipt className="w-7 h-7" />} label="Capa Fiscal & Algoritmo de Venta" />
                            <div className="bg-foreground text-background rounded-[4rem] p-12 shadow-3xl space-y-12 relative overflow-hidden group/fiscal">
                                <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none group-hover/fiscal:scale-110 transition-transform duration-1000 grayscale">
                                    <Coins className="w-80 h-80 -mr-24 -mt-24" />
                                </div>

                                <div className="grid grid-cols-2 gap-10 relative z-10">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/60 ml-8 italic leading-none">Simbolo Divisa (CORE)</label>
                                        <input
                                            className="w-full h-20 bg-white/5 border border-white/10 rounded-[2.5rem] px-10 outline-none focus:border-primary font-black italic text-4xl shadow-2xl text-white text-center transition-all placeholder:text-white/10"
                                            value={businessInfo.currency_symbol}
                                            onChange={e => setBusinessInfo({ ...businessInfo, currency_symbol: e.target.value })}
                                            placeholder="$"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/60 ml-8 italic leading-none">Gravity Tax (%)</label>
                                        <input
                                            type="number"
                                            className="w-full h-20 bg-white/5 border border-white/10 rounded-[2.5rem] px-10 outline-none focus:border-primary font-black italic text-3xl shadow-2xl text-white text-center transition-all"
                                            value={businessInfo.tax_percentage}
                                            onChange={e => setBusinessInfo({ ...businessInfo, tax_percentage: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-10 bg-white/5 backdrop-blur-md rounded-[3rem] border border-white/10 shadow-2xl group transition-all hover:bg-white/10 relative z-10">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-4">
                                            <p className="font-black italic uppercase text-lg text-white flex items-center gap-3 group-hover:text-primary transition-colors leading-none">
                                                Cargo de Servicio <span className="text-[10px] py-1.5 px-4 bg-primary text-primary-foreground rounded-full font-black animate-pulse shadow-lg shadow-primary/20">{businessInfo.service_charge_percentage}%</span>
                                            </p>
                                        </div>
                                        <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em] italic leading-tight max-w-[320px]">ALGORITMO DE CÁLCULO AUTOMÁTICO PARA PROPINAS SUGERIDAS EN TERMINALES POS/HUB.</p>
                                    </div>
                                    <SimpleSwitch
                                        checked={businessInfo.apply_service_charge}
                                        onCheckedChange={(c) => setBusinessInfo({ ...businessInfo, apply_service_charge: c })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6 relative z-10 pt-4">
                                    <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 flex items-center gap-5">
                                        <Database className="w-7 h-7 text-primary" />
                                        <div className="space-y-1">
                                            <p className="text-[8px] font-black text-white/40 uppercase tracking-widest leading-none italic">Ledger Logic</p>
                                            <p className="text-xs font-black text-white italic uppercase tracking-tighter">SINCRONIZADO</p>
                                        </div>
                                    </div>
                                    <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 flex items-center gap-5">
                                        <Activity className="w-7 h-7 text-emerald-500" />
                                        <div className="space-y-1">
                                            <p className="text-[8px] font-black text-white/40 uppercase tracking-widest leading-none italic">Tax Precision</p>
                                            <p className="text-xs font-black text-white italic uppercase tracking-tighter">IEEE-754</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : activeTab === 'landing' ? (
                <div className="space-y-20 animate-in slide-in-from-right-12 duration-1000">
                    <div className="grid lg:grid-cols-2 gap-16">
                        {/* 🎬 HERO DESIGNER SUBSYSTEM */}
                        <div className="space-y-12">
                            <SectionHeader icon={<Layout className="w-7 h-7" />} label="Visual Narrative (HERO SECTION)" />

                            <div className="bg-card border border-border rounded-[4.5rem] p-12 shadow-3xl space-y-10 relative overflow-hidden group/hero hover:border-primary/30 transition-all">
                                <div className="absolute top-0 right-0 p-16 opacity-5 pointer-events-none group-hover/hero:scale-110 transition-transform duration-1000">
                                    <ImageIcon className="w-[450px] h-[450px] -mr-40 -mt-40" />
                                </div>

                                <div className="space-y-4 relative z-10 group/input">
                                    <label className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground/40 ml-10 italic group-focus-within/input:text-primary transition-colors">Background Cinematográfico (URL/PATH)</label>
                                    <div className="flex gap-5">
                                        <div className="relative flex-1">
                                            <div className="absolute left-8 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-primary/40 animate-pulse" />
                                            <input
                                                className="w-full h-20 bg-muted/40 border border-border rounded-[2.5rem] pl-16 pr-10 text-[11px] font-mono italic text-foreground shadow-inner focus:border-primary transition-all placeholder:text-muted-foreground/20"
                                                value={landingConfig.hero.image_url}
                                                onChange={e => setLandingConfig({ ...landingConfig, hero: { ...landingConfig.hero, image_url: e.target.value } })}
                                                placeholder="/static/assets/cinematic-hero.webp"
                                            />
                                        </div>
                                        <Button
                                            variant="ghost"
                                            className="h-20 w-24 rounded-[2.5rem] bg-card border border-border hover:bg-primary hover:text-primary-foreground shadow-2xl active:scale-95 transition-all group/upbtn"
                                            onClick={() => {
                                                const url = prompt("CONECTAR URL DE ACTIVO GRÁFICO:");
                                                if (url) setLandingConfig({ ...landingConfig, hero: { ...landingConfig.hero, image_url: url } })
                                            }}
                                        >
                                            <Upload className="w-7 h-7 group-hover/upbtn:scale-110 transition-transform" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground/40 ml-10 italic">Headline Alpha (TEXT)</label>
                                        <input
                                            className="w-full h-20 bg-muted/40 border border-border rounded-[2.5rem] px-10 font-black italic uppercase tracking-tighter text-xl shadow-inner text-foreground focus:border-primary transition-all leading-none"
                                            value={landingConfig.hero.title_part1}
                                            onChange={e => setLandingConfig({ ...landingConfig, hero: { ...landingConfig.hero, title_part1: e.target.value.toUpperCase() } })}
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/60 ml-10 italic">Headline Omega (ACCENT)</label>
                                        <input
                                            className="w-full h-20 bg-primary/5 border border-primary/20 rounded-[2.5rem] px-10 font-black italic uppercase tracking-tighter text-xl text-primary shadow-inner focus:border-primary transition-all leading-none"
                                            value={landingConfig.hero.title_part2}
                                            onChange={e => setLandingConfig({ ...landingConfig, hero: { ...landingConfig.hero, title_part2: e.target.value.toUpperCase() } })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 relative z-10">
                                    <label className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground/40 ml-10 italic">Manifesto Copy (LEAD TAGLINE)</label>
                                    <input
                                        className="w-full h-20 bg-muted/40 border border-border rounded-[2.5rem] px-10 text-[11px] font-black italic uppercase tracking-[0.3em] shadow-inner text-foreground focus:border-primary transition-all leading-relaxed"
                                        value={landingConfig.hero.tagline}
                                        onChange={e => setLandingConfig({ ...landingConfig, hero: { ...landingConfig.hero, tagline: e.target.value.toUpperCase() } })}
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-8 relative z-10 pt-6 border-t border-border/50">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground/30 ml-10 italic">Fundación (LEGACY YEAR)</label>
                                        <div className="relative group/yr">
                                            <input
                                                className="w-full h-18 bg-muted/30 border border-border rounded-[2rem] px-10 text-xl font-black italic text-foreground shadow-inner focus:border-primary transition-all text-center"
                                                value={landingConfig.hero.est_year}
                                                placeholder="2024"
                                                onChange={e => setLandingConfig({ ...landingConfig, hero: { ...landingConfig.hero, est_year: e.target.value } })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground/30 ml-10 italic">Geolocalización (CITY HUB)</label>
                                        <div className="relative group/loc">
                                            <input
                                                className="w-full h-18 bg-muted/30 border border-border rounded-[2rem] px-10 text-xs font-black italic uppercase tracking-widest text-foreground shadow-inner focus:border-primary transition-all text-center"
                                                value={landingConfig.hero.location_city}
                                                placeholder="CIUDAD, PAIS"
                                                onChange={e => setLandingConfig({ ...landingConfig, hero: { ...landingConfig.hero, location_city: e.target.value.toUpperCase() } })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 bg-muted/10 border-2 border-dashed border-border rounded-[3rem] relative overflow-hidden group/preview">
                                    <div className="relative z-10 flex flex-col items-center text-center gap-4">
                                        <div className="w-12 h-1 bg-primary/20 rounded-full" />
                                        <p className="text-[9px] font-black uppercase tracking-[0.5em] text-muted-foreground/30 italic">Live Preview Canvas v5.0</p>
                                        <div className="w-full max-w-[280px] h-32 bg-background/50 rounded-3xl border border-border shadow-2xl relative overflow-hidden">
                                            {landingConfig.hero.image_url && <img src={landingConfig.hero.image_url} alt="H" className="w-full h-full object-cover opacity-60 grayscale group-hover/preview:grayscale-0 transition-all duration-1000 group-hover/preview:scale-110" />}
                                            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                                                <p className="text-[8px] font-black italic text-white/40 mb-1">{landingConfig.hero.title_part1}</p>
                                                <p className="text-[11px] font-black italic text-primary leading-none uppercase">{landingConfig.hero.title_part2}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 🏆 PILARES ESTRATÉGICOS (ESSENCE) */}
                        <div className="space-y-12">
                            <SectionHeader icon={<Award className="w-7 h-7" />} label="Ejes de Valor (BRAND ESSENCE)" />

                            <div className="space-y-8 max-h-[1050px] overflow-y-auto pr-6 custom-scrollbar scroll-smooth">
                                {landingConfig.essence.map((item: any, idx: number) => (
                                    <div key={idx} className="group bg-card border border-border rounded-[4rem] p-10 shadow-3xl relative overflow-hidden hover:border-primary/40 transition-all duration-700 animate-in slide-in-from-right-8" style={{ animationDelay: `${idx * 150}ms` }}>
                                        <div className="absolute -bottom-10 -right-10 opacity-5 group-hover:scale-110 transition-transform duration-1000 grayscale group-hover:grayscale-0">
                                            {ICON_MAP[item.icon] ? <item.icon className="w-72 h-72" /> : <Award className="w-72 h-72" />}
                                        </div>

                                        <div className="flex items-center justify-between mb-8 relative z-10">
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 bg-primary/10 border-2 border-primary/20 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-background transition-all duration-700 shadow-xl shadow-primary/5">
                                                    {ICON_MAP[item.icon] ? <item.icon className="w-8 h-8" /> : <Award className="w-8 h-8" />}
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.5em] italic leading-none">Pilar de Impacto #0{idx + 1}</span>
                                                    <p className="text-[8px] font-bold text-muted-foreground/30 uppercase tracking-widest italic">Core Value Prop</p>
                                                </div>
                                            </div>

                                            <div className="relative group/sel">
                                                <select
                                                    className="bg-muted border border-border text-[10px] font-black uppercase tracking-[0.2em] px-5 py-3 rounded-2xl outline-none focus:border-primary cursor-pointer text-foreground appearance-none pr-10 shadow-inner group-hover/sel:bg-card transition-all"
                                                    value={item.icon}
                                                    onChange={e => {
                                                        const newEssence = [...landingConfig.essence];
                                                        newEssence[idx].icon = e.target.value;
                                                        setLandingConfig({ ...landingConfig, essence: newEssence });
                                                    }}
                                                >
                                                    {Object.keys(ICON_MAP).map(icon => <option key={icon} value={icon}>{icon.toUpperCase()}</option>)}
                                                </select>
                                                <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-20 rotate-90 pointer-events-none" />
                                            </div>
                                        </div>

                                        <div className="space-y-4 relative z-10 group/tit">
                                            <label className="text-[8px] font-black uppercase tracking-[0.5em] text-muted-foreground/40 ml-6 italic group-focus-within/tit:text-primary transition-colors">Descriptor Principal</label>
                                            <input
                                                className="w-full h-18 bg-muted/40 border-none outline-none font-black text-3xl italic uppercase tracking-tighter text-foreground mb-4 leading-none bg-transparent group-hover/tit:text-primary transition-colors focus:ring-0 shadow-none border-b border-transparent focus:border-primary/20"
                                                value={item.title}
                                                onChange={e => {
                                                    const newEssence = [...landingConfig.essence];
                                                    newEssence[idx].title = e.target.value.toUpperCase();
                                                    setLandingConfig({ ...landingConfig, essence: newEssence });
                                                }}
                                            />
                                        </div>

                                        <div className="space-y-4 relative z-10 group/desc">
                                            <label className="text-[8px] font-black uppercase tracking-[0.5em] text-muted-foreground/40 ml-6 italic group-focus-within/desc:text-primary transition-colors">Narrativa de Respaldo</label>
                                            <textarea
                                                className="w-full h-32 bg-muted/20 border border-border/50 rounded-[2.5rem] px-10 py-8 text-[11px] font-black text-muted-foreground uppercase italic resize-none outline-none focus:border-primary/40 transition-all shadow-inner leading-relaxed tracking-wider placeholder:text-muted-foreground/10"
                                                value={item.desc}
                                                placeholder="DESCRIBE EL VALOR DEL PILAR..."
                                                onChange={e => {
                                                    const newEssence = [...landingConfig.essence];
                                                    newEssence[idx].desc = e.target.value.toUpperCase();
                                                    setLandingConfig({ ...landingConfig, essence: newEssence });
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}

                                <Button
                                    variant="ghost"
                                    className="w-full h-32 border-4 border-dashed border-border/50 rounded-[4rem] flex flex-col items-center justify-center gap-4 text-muted-foreground/40 hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all group/add"
                                    onClick={() => {
                                        const newEssence = [...landingConfig.essence, { icon: 'Star', title: 'NUEVO VALOR', desc: 'DESCRIBE TU NUEVO PILAR ESTRATÉGICO AQUÍ.' }];
                                        setLandingConfig({ ...landingConfig, essence: newEssence });
                                    }}
                                >
                                    <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-muted-foreground/40 flex items-center justify-center group-hover/add:rotate-90 group-hover/add:border-primary group-hover/add:scale-110 transition-all">
                                        <Plus className="w-8 h-8" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.5em] italic">Instanciar Nuevo Pilar</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* ⚙️ INFRASTRUCTURE & HARDWARE BRIDGES */
                <div className="grid lg:grid-cols-2 gap-16 animate-in slide-in-from-left-12 duration-1000">
                    <div className="space-y-12">
                        <SectionHeader icon={<Cpu className="w-7 h-7" />} label="Terminal Diagnostics & Hubs" />
                        <div className="grid grid-cols-1 gap-8">
                            <Link href="/admin/settings/infrastructure" className="group">
                                <div className="bg-card border border-border rounded-[4rem] p-12 shadow-3xl hover:border-primary/40 transition-all relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000 grayscale">
                                        <HardDrive className="w-80 h-80 -mr-24 -mt-24" />
                                    </div>
                                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                                        <div className="w-24 h-24 rounded-[2rem] bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-2xl group-hover:rotate-12 transition-transform duration-500">
                                            <HardDrive className="w-12 h-12" />
                                        </div>
                                        <div className="space-y-4">
                                            <h3 className="text-3xl font-black italic uppercase tracking-tighter text-foreground leading-none group-hover:text-primary transition-colors">Infraestructura Core</h3>
                                            <p className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-[0.3em] italic leading-relaxed max-w-sm">GESTIÓN DE SERVIDORES, DB NODES Y BACKUP PROTOCOLS.</p>
                                            <div className="flex items-center gap-2 group-hover:translate-x-2 transition-transform opacity-40 group-hover:opacity-100">
                                                <span className="text-[10px] font-black text-primary uppercase italic">Acceder al Control de Bajo Nivel</span>
                                                <ArrowRight className="w-4 h-4 text-primary" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>

                            <Link href="/admin/settings/printers" className="group">
                                <div className="bg-card border-2 border-border/50 rounded-[4rem] p-12 shadow-3xl hover:border-primary/40 transition-all relative overflow-hidden group/printers">
                                    <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover/printers:scale-110 transition-transform duration-1000 delay-150 grayscale">
                                        <Layers className="w-80 h-80 -mr-24 -mt-24" />
                                    </div>
                                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                                        <div className="w-24 h-24 rounded-[2rem] bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 shadow-2xl group-hover/printers:rotate-[-12deg] transition-transform duration-500">
                                            <Layers className="w-12 h-12" />
                                        </div>
                                        <div className="space-y-4">
                                            <h3 className="text-3xl font-black italic uppercase tracking-tighter text-foreground leading-none group-hover/printers:text-amber-500 transition-colors">Hardware Bridge (Printers)</h3>
                                            <p className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-[0.3em] italic leading-relaxed max-w-sm">RUTEO DE COMANDAS Y CONFIGURACIÓN DE PERIFÉRICOS POS.</p>
                                            <div className="flex items-center gap-2 group-hover/printers:translate-x-2 transition-transform opacity-40 group-hover/printers:opacity-100">
                                                <span className="text-[10px] font-black text-amber-500 uppercase italic">Gestionar Terminales de Salida</span>
                                                <ArrowRight className="w-4 h-4 text-amber-500" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>

                            <Link href="/admin/settings/shifts" className="group">
                                <div className="bg-card border border-border rounded-[4rem] p-12 shadow-3xl hover:border-primary/40 transition-all relative overflow-hidden group/shifts">
                                    <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover/shifts:scale-110 transition-transform duration-1000 delay-300 grayscale">
                                        <Clock className="w-80 h-80 -mr-24 -mt-24" />
                                    </div>
                                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                                        <div className="w-24 h-24 rounded-[2rem] bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 shadow-2xl group-hover/shifts:rotate-12 transition-transform duration-500">
                                            <Clock className="w-12 h-12" />
                                        </div>
                                        <div className="space-y-4">
                                            <h3 className="text-3xl font-black italic uppercase tracking-tighter text-foreground leading-none group-hover/shifts:text-emerald-500 transition-colors">Chronos Engine (Shifts)</h3>
                                            <p className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-[0.3em] italic leading-relaxed max-w-sm">NÚCLEO DE TIEMPO, TURNOS Y ASISTENCIA OPERATIVA.</p>
                                            <div className="flex items-center gap-2 group-hover/shifts:translate-x-2 transition-transform opacity-40 group-hover/shifts:opacity-100">
                                                <span className="text-[10px] font-black text-emerald-500 uppercase italic">Ajustar Ciclos Laborales</span>
                                                <ArrowRight className="w-4 h-4 text-emerald-500" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    </div>

                    <div className="space-y-12">
                        <SectionHeader icon={<ShieldAlert className="w-7 h-7" />} label="Security & System Health" />
                        <div className="bg-foreground text-background rounded-[4rem] p-12 shadow-3xl space-y-12 relative overflow-hidden group/sys">
                            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/sys:opacity-100 transition-opacity" />
                            <div className="space-y-8 relative z-10 text-center md:text-left">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-center md:justify-start gap-4 h-8">
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                                        <p className="text-[11px] font-black text-primary uppercase tracking-[0.5em] italic">System Core Status: OPTIMIZED</p>
                                    </div>
                                    <h4 className="text-4xl font-black italic text-white uppercase tracking-tighter leading-none">Métricas de Rendimiento</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-8 pt-6">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest italic leading-none">DB Query Latency</span>
                                            <span className="text-xs font-black text-emerald-500 italic">24ms</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden p-0.5">
                                            <div className="h-full bg-emerald-500 w-[15%] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest italic leading-none">Storage Load</span>
                                            <span className="text-xs font-black text-primary italic">4.2%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden p-0.5">
                                            <div className="h-full bg-primary w-[4%] rounded-full shadow-[0_0_10px_rgba(255,77,0,0.4)]" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest italic leading-none">Active Workers</span>
                                            <span className="text-xs font-black text-blue-500 italic">8 / 1024</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden p-0.5">
                                            <div className="h-full bg-blue-500 w-[8%] rounded-full shadow-[0_0_10px_rgba(59,130,246,0.4)]" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest italic leading-none">Uptime Ratio</span>
                                            <span className="text-xs font-black text-emerald-400 italic">99.99%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden p-0.5">
                                            <div className="h-full bg-emerald-400 w-[99%] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-12 p-8 bg-white/[0.03] border border-white/10 rounded-[2.5rem] flex flex-col items-center gap-6 group/info hover:bg-white/5 transition-all">
                                    <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover/info:scale-110 transition-transform">
                                        <ShieldCheck className="w-8 h-8" />
                                    </div>
                                    <div className="space-y-3 text-center">
                                        <h5 className="text-xl font-black italic uppercase text-white tracking-tighter">Seguridad de Datos Nivel SaaS</h5>
                                        <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.3em] leading-relaxed italic max-w-sm">ENCRIPTACIÓN AES-256 CON AUTENTICACIÓN MULTI-FACTOR Y CONTROL DE ACCESO BASADO EN ROLES MASTER (RBAC).</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 20px; }
            `}</style>
        </div>
    )
}

function SectionHeader({ icon, label }: { icon: any, label: string }) {
    return (
        <div className="flex items-center gap-6 px-10">
            <div className="w-16 h-16 rounded-2xl bg-card border-2 border-border/50 flex items-center justify-center text-primary shadow-xl group-hover:bg-primary/5 transition-all">
                {icon}
            </div>
            <div className="space-y-1">
                <h2 className="text-sm font-black uppercase tracking-[0.5em] text-foreground italic leading-none">{label}</h2>
                <div className="h-0.5 w-20 bg-primary/20 rounded-full" />
            </div>
        </div>
    )
}

function Plus({ className }: any) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
    )
}
