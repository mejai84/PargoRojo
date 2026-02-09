"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
    Loader2, Save, MapPin, Phone, Mail, Instagram, Facebook,
    Youtube, Video, Twitter, Link2, Palette, ShieldCheck,
    Zap, Globe, Receipt, Coins, MessageSquare, Clock, Layout,
    Award, ChefHat, Heart, Star, Sparkles, Image as ImageIcon
} from "lucide-react"
import { useRestaurant } from "@/providers/RestaurantProvider"

function SimpleSwitch({ checked, onCheckedChange }: { checked: boolean, onCheckedChange: (c: boolean) => void }) {
    return (
        <button
            onClick={() => onCheckedChange(!checked)}
            className={`w-14 h-7 rounded-full transition-all flex items-center px-1 shadow-inner ${checked ? 'bg-primary' : 'bg-slate-200'}`}
        >
            <div className={`w-5 h-5 rounded-full bg-white transition-all shadow-md ${checked ? 'translate-x-7' : 'translate-x-0'}`} />
        </button>
    )
}

const ICON_MAP: any = { Award, ChefHat, Heart, Star, Sparkles, Zap, Utensils: Layout }

export default function SettingsPage() {
    const { restaurant } = useRestaurant()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [activeTab, setActiveTab] = useState<'general' | 'landing'>('general')

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
            est_year: "2012",
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

            // 1. Guardar en Settings (Configuración de la App)
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

            // 2. Sincronizar con la tabla Restaurants (Branding Core & Advanced)
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
        <div className="flex flex-col items-center justify-center p-20 gap-4">
            <Loader2 className="animate-spin text-primary w-10 h-10" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Jamali OS: Cargando Preferencias...</p>
        </div>
    )

    return (
        <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20 px-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-100 pb-8">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Zap className="w-4 h-4 text-primary fill-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Jamali OS Framework v2.0</span>
                    </div>
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">Customización <span className="text-primary italic">SaaS</span></h1>
                    <p className="text-slate-500 font-medium text-sm mt-1 uppercase tracking-wider">Control total de Identidad, Datos y Apariencia</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex bg-slate-100 p-1 rounded-2xl">
                        <button
                            onClick={() => setActiveTab('general')}
                            className={cn("px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", activeTab === 'general' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600")}
                        >
                            General
                        </button>
                        <button
                            onClick={() => setActiveTab('landing')}
                            className={cn("px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", activeTab === 'landing' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600")}
                        >
                            Landing Page
                        </button>
                    </div>
                    <Button onClick={handleSave} disabled={saving} className="h-14 px-10 bg-slate-900 text-white hover:bg-primary hover:text-black font-black uppercase text-xs tracking-widest italic rounded-2xl shadow-xl transition-all gap-3 shrink-0">
                        {saving ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                        APLICAR CAMBIOS
                    </Button>
                </div>
            </div>

            {activeTab === 'general' ? (
                <div className="grid lg:grid-cols-2 gap-10">
                    {/* 🎨 BRANDING & THEME SECTION */}
                    <div className="space-y-10">
                        <div className="space-y-6">
                            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 italic px-4 flex items-center gap-2">
                                <Palette className="w-4 h-4" /> Personalización de Apariencia
                            </h2>
                            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm space-y-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Nombre del Restaurante</label>
                                    <input
                                        className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none focus:border-primary font-black italic text-xl transition-all"
                                        value={businessInfo.name}
                                        onChange={e => setBusinessInfo({ ...businessInfo, name: e.target.value.toUpperCase() })}
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Color Primario (Jamali Skin)</label>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="color"
                                                className="w-16 h-16 p-0 border-none bg-transparent cursor-pointer"
                                                value={businessInfo.primary_color}
                                                onChange={e => setBusinessInfo({ ...businessInfo, primary_color: e.target.value })}
                                            />
                                            <div className="flex-1">
                                                <input
                                                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 outline-none focus:border-primary font-mono text-xs"
                                                    value={businessInfo.primary_color}
                                                    onChange={e => setBusinessInfo({ ...businessInfo, primary_color: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Logo del Negocio</label>
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center p-2 overflow-hidden shrink-0">
                                                {businessInfo.logo_url ? (
                                                    <img src={businessInfo.logo_url} alt="Logo" className="w-full h-full object-contain" />
                                                ) : (
                                                    <Zap className="w-6 h-6 text-slate-200" />
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
                                                    const fileExt = file.name.split('.').pop()
                                                    const fileName = `logo-${Date.now()}.${fileExt}`
                                                    try {
                                                        const { error } = await supabase.storage.from('brand_assets').upload(fileName, file)
                                                        if (error) throw error
                                                        const { data: { publicUrl } } = supabase.storage.from('brand_assets').getPublicUrl(fileName)
                                                        setBusinessInfo({ ...businessInfo, logo_url: publicUrl })
                                                    } catch (err) { alert('Error subiendo logo') }
                                                }}
                                            />
                                            <Button
                                                variant="outline"
                                                className="h-12 px-4 rounded-xl font-black text-[9px] uppercase tracking-widest"
                                                onClick={() => document.getElementById('logo-upload')?.click()}
                                            >
                                                CAMBIAR LOGO
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Paletas de Color Premium</label>
                                    <div className="flex flex-wrap gap-4 px-2">
                                        {[
                                            { name: 'Coral Jamali', color: '#FF6B6B' },
                                            { name: 'Ocean Blue', color: '#3B82F6' },
                                            { name: 'Emerald', color: '#10B981' },
                                            { name: 'Royal Purple', color: '#8B5CF6' },
                                            { name: 'Sunset Orange', color: '#F59E0B' },
                                            { name: 'Gourmet Rose', color: '#EC4899' },
                                            { name: 'Premium Gold', color: '#D4AF37' },
                                            { name: 'Deep Slate', color: '#475569' }
                                        ].map(palette => (
                                            <button
                                                key={palette.color}
                                                type="button"
                                                onClick={() => setBusinessInfo({ ...businessInfo, primary_color: palette.color })}
                                                className={cn(
                                                    "w-12 h-12 rounded-2xl border-2 transition-all p-1 flex items-center justify-center",
                                                    businessInfo.primary_color === palette.color ? "border-primary scale-110 shadow-lg shadow-primary/20" : "border-slate-100 hover:border-slate-300 hover:scale-105"
                                                )}
                                                title={palette.name}
                                            >
                                                <div className="w-full h-full rounded-xl shadow-inner shadow-black/10" style={{ backgroundColor: palette.color }} />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-10 pt-4">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 flex items-center gap-2">
                                            <Globe className="w-3 h-3" /> Subdominio Jamali (ej: pargorojo)
                                        </label>
                                        <div className="flex items-center h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 focus-within:border-primary transition-all">
                                            <input
                                                className="flex-1 bg-transparent outline-none font-bold text-slate-600 text-sm min-w-0"
                                                value={businessInfo.subdomain}
                                                onChange={e => setBusinessInfo({ ...businessInfo, subdomain: e.target.value.toLowerCase() })}
                                                placeholder="nombre-del-negocio"
                                            />
                                            <span className="text-[10px] font-black text-slate-400 whitespace-nowrap ml-2">.jamalios.com</span>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 flex items-center gap-2">
                                            Modo Visual (OS Theme)
                                        </label>
                                        <select
                                            className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 outline-none focus:border-primary font-black uppercase text-[10px] tracking-widest"
                                            value={businessInfo.theme}
                                            onChange={e => setBusinessInfo({ ...businessInfo, theme: e.target.value })}
                                        >
                                            <option value="light">MODO CLARO (LIGHT)</option>
                                            <option value="dark">MODO OSCURO (DARK)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 🏦 FINANCIAL & TAX SECTION */}
                        <div className="space-y-6">
                            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 italic px-4 flex items-center gap-2">
                                <Receipt className="w-4 h-4" /> Configuración Fiscal y Moneda
                            </h2>
                            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm space-y-8">
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Símbolo de Moneda</label>
                                        <input
                                            className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none focus:border-primary font-black text-xl"
                                            value={businessInfo.currency_symbol}
                                            onChange={e => setBusinessInfo({ ...businessInfo, currency_symbol: e.target.value })}
                                            placeholder="$"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Impuesto de Venta (%)</label>
                                        <input
                                            type="number"
                                            className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none focus:border-primary font-black text-xl"
                                            value={businessInfo.tax_percentage}
                                            onChange={e => setBusinessInfo({ ...businessInfo, tax_percentage: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                    <div className="space-y-1">
                                        <p className="font-black italic uppercase text-sm text-slate-900">Propina Sugerida (Service Charge)</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Activa el cálculo automático en la cuenta.</p>
                                    </div>
                                    <SimpleSwitch
                                        checked={businessInfo.apply_service_charge}
                                        onCheckedChange={(c) => setBusinessInfo({ ...businessInfo, apply_service_charge: c })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ⭐ LOYALTY & WHATSAPP SECTION */}
                    <div className="space-y-10">
                        <div className="space-y-6">
                            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 italic px-4 flex items-center gap-2">
                                <Coins className="w-4 h-4" /> Fidelización y Lealtad
                            </h2>
                            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm space-y-6">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Puntos por cada {businessInfo.currency_symbol}1.000 consumidos</label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="number"
                                            className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none focus:border-primary font-black text-xl italic"
                                            value={businessInfo.loyalty_points_per_1000}
                                            onChange={e => setBusinessInfo({ ...businessInfo, loyalty_points_per_1000: e.target.value })}
                                        />
                                        <div className="w-20 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 font-black text-xl italic uppercase">PTS</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 italic px-4 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" /> WhatsApp Professional Hub
                            </h2>
                            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm space-y-6">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Número de WhatsApp (PargoBot)</label>
                                    <input
                                        className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none focus:border-primary font-bold text-slate-600"
                                        placeholder="+57 300 000 0000"
                                        value={businessInfo.whatsapp_number}
                                        onChange={e => setBusinessInfo({ ...businessInfo, whatsapp_number: e.target.value })}
                                    />
                                </div>
                                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                    <div className="space-y-1">
                                        <p className="font-black italic uppercase text-sm text-slate-900">Recibos Automáticos</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Enviar comprobante al pagar.</p>
                                    </div>
                                    <SimpleSwitch
                                        checked={businessInfo.enable_whatsapp_receipts}
                                        onCheckedChange={(c) => setBusinessInfo({ ...businessInfo, enable_whatsapp_receipts: c })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 italic px-4 flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4" /> Módulos Operativos Core
                            </h2>
                            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm overflow-hidden">
                                {[
                                    { key: 'enable_kitchen_kds', label: 'Monitor de Cocina (KDS)', sub: 'Interfaz táctil para pedidos.' },
                                    { key: 'enable_waiter_pos', label: 'POS para Meseros', sub: 'Terminal móvil de pedidos.' },
                                    { key: 'require_cashier_approval', label: 'Seguridad en Pago', sub: 'Pago previo al despacho.' },
                                    { key: 'menu_show_images', label: 'Visualización de Menú', sub: 'Mostrar fotos reales.' },
                                ].map(flag => (
                                    <div key={flag.key} className="flex items-center justify-between p-6 hover:bg-slate-50 transition-all rounded-3xl group">
                                        <div className="space-y-1">
                                            <div className="font-black italic uppercase text-sm text-slate-900 group-hover:text-primary transition-colors">{flag.label}</div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{flag.sub}</div>
                                        </div>
                                        <SimpleSwitch checked={featureFlags[flag.key]} onCheckedChange={() => toggle(flag.key)} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-12 animate-in slide-in-from-right-4 duration-500">
                    <div className="grid lg:grid-cols-2 gap-10">
                        {/* HERO SECTION CONFIG */}
                        <div className="space-y-6">
                            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 italic px-4 flex items-center gap-2">
                                <Zap className="w-4 h-4" /> Sección Hero (Bienvenida)
                            </h2>
                            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-6">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Imagen de Fondo (Full HD)</label>
                                    <div className="flex gap-4">
                                        <input
                                            className="flex-1 h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-mono"
                                            value={landingConfig.hero.image_url}
                                            onChange={e => setLandingConfig({ ...landingConfig, hero: { ...landingConfig.hero, image_url: e.target.value } })}
                                            placeholder="/images/hero.jpg o URL"
                                        />
                                        <Button variant="outline" className="h-12 w-12 rounded-xl p-0" onClick={() => {
                                            const url = prompt("Introduce URL de imagen:");
                                            if (url) setLandingConfig({ ...landingConfig, hero: { ...landingConfig.hero, image_url: url } })
                                        }}>
                                            <ImageIcon className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Título Parte 1</label>
                                        <input className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-black italic uppercase text-sm" value={landingConfig.hero.title_part1} onChange={e => setLandingConfig({ ...landingConfig, hero: { ...landingConfig.hero, title_part1: e.target.value } })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 text-primary">Título Parte 2 (Resaltado)</label>
                                        <input className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-black italic uppercase text-sm text-primary" value={landingConfig.hero.title_part2} onChange={e => setLandingConfig({ ...landingConfig, hero: { ...landingConfig.hero, title_part2: e.target.value } })} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Eslogan del Hero</label>
                                    <input className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-medium" value={landingConfig.hero.tagline} onChange={e => setLandingConfig({ ...landingConfig, hero: { ...landingConfig.hero, tagline: e.target.value } })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Año de Fundación</label>
                                        <input className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm" value={landingConfig.hero.est_year} onChange={e => setLandingConfig({ ...landingConfig, hero: { ...landingConfig.hero, est_year: e.target.value } })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Ciudad, Departamento</label>
                                        <input className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm" value={landingConfig.hero.location_city} onChange={e => setLandingConfig({ ...landingConfig, hero: { ...landingConfig.hero, location_city: e.target.value } })} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ESSENCE SECTION CONFIG */}
                        <div className="space-y-6">
                            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 italic px-4 flex items-center gap-2">
                                <Award className="w-4 h-4" /> Nuestra Esencia (3 Pilares)
                            </h2>
                            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm space-y-4">
                                {landingConfig.essence.map((item: any, idx: number) => (
                                    <div key={idx} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Pilar #{idx + 1}</span>
                                            <select
                                                className="bg-white border-none text-[10px] font-black uppercase"
                                                value={item.icon}
                                                onChange={e => {
                                                    const newEssence = [...landingConfig.essence]
                                                    newEssence[idx].icon = e.target.value
                                                    setLandingConfig({ ...landingConfig, essence: newEssence })
                                                }}
                                            >
                                                {Object.keys(ICON_MAP).map(icon => <option key={icon} value={icon}>{icon}</option>)}
                                            </select>
                                        </div>
                                        <input
                                            className="w-full h-10 bg-white border border-slate-100 rounded-xl px-4 font-black text-xs uppercase italic"
                                            value={item.title}
                                            onChange={e => {
                                                const newEssence = [...landingConfig.essence]
                                                newEssence[idx].title = e.target.value
                                                setLandingConfig({ ...landingConfig, essence: newEssence })
                                            }}
                                        />
                                        <textarea
                                            className="w-full h-20 bg-white border border-slate-100 rounded-xl px-4 py-2 text-[10px] font-medium resize-none"
                                            value={item.desc}
                                            onChange={e => {
                                                const newEssence = [...landingConfig.essence]
                                                newEssence[idx].desc = e.target.value
                                                setLandingConfig({ ...landingConfig, essence: newEssence })
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* EXPERIENCE SECTION CONFIG */}
                        <div className="space-y-6 lg:col-span-2">
                            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 italic px-4 flex items-center gap-2">
                                <Sparkles className="w-4 h-4" /> Sección de Experiencia & Interior
                            </h2>
                            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm grid md:grid-cols-2 gap-10">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Título Grande</label>
                                        <input className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-black italic uppercase text-sm" value={landingConfig.experience.title_part1} onChange={e => setLandingConfig({ ...landingConfig, experience: { ...landingConfig.experience, title_part1: e.target.value } })} />
                                    </div>
                                    <div className="space-y-2 text-primary">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 text-primary">Palabra Clave (Resaltado)</label>
                                        <input className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-black italic uppercase text-sm text-primary" value={landingConfig.experience.title_part2} onChange={e => setLandingConfig({ ...landingConfig, experience: { ...landingConfig.experience, title_part2: e.target.value } })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Descripción General de Ambiente</label>
                                        <textarea className="w-full h-28 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium resize-none" value={landingConfig.experience.description} onChange={e => setLandingConfig({ ...landingConfig, experience: { ...landingConfig.experience, description: e.target.value } })} />
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Imagen de Ambiente/Interior</label>
                                        <input className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-mono" value={landingConfig.experience.image_url} onChange={e => setLandingConfig({ ...landingConfig, experience: { ...landingConfig.experience, image_url: e.target.value } })} placeholder="URL de la imagen" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Link de Tour Virtual / Video</label>
                                        <input className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs" value={landingConfig.experience.tour_link} onChange={e => setLandingConfig({ ...landingConfig, experience: { ...landingConfig.experience, tour_link: e.target.value } })} placeholder="Link de YouTube o Tour 360" />
                                    </div>
                                    <div className="p-6 bg-primary/5 border border-dashed border-primary/20 rounded-3xl flex items-center justify-center text-center">
                                        <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-relaxed">Nota: Estas imágenes deben ser de alta calidad <br /> para mantener la estética Premium.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
