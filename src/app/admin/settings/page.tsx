"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Loader2, Save, MapPin, Phone, Mail, Instagram, Facebook, Youtube, Video, Twitter, Link2, Palette, ShieldCheck, Zap, Globe, Receipt } from "lucide-react"
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

export default function SettingsPage() {
    const { restaurant } = useRestaurant()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
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
        threads_url: "",
        twitter_url: "",
        subdomain: "",
        theme: "light"
    })

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        const { data } = await supabase.from('settings').select('*')

        if (data) {
            const flags = data.find(s => s.key === 'feature_flags')
            if (flags) setFeatureFlags(flags.value)

            const info = data.find(s => s.key === 'business_info')
            if (info) setBusinessInfo((prev: any) => ({
                ...prev,
                ...info.value,
                subdomain: restaurant?.subdomain || "",
                theme: restaurant?.theme || "light",
                apply_service_charge: restaurant?.apply_service_charge || false,
                service_charge_percentage: restaurant?.service_charge_percentage || 10
            }))
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

            // 2. Sincronizar con la tabla Restaurants (Branding Core)
            const { data: profile } = await supabase.from('profiles').select('restaurant_id').eq('id', user.id).single()
            if (profile?.restaurant_id) {
                await supabase.from('restaurants').update({
                    name: businessInfo.name,
                    primary_color: businessInfo.primary_color,
                    logo_url: businessInfo.logo_url,
                    subdomain: businessInfo.subdomain,
                    theme: businessInfo.theme,
                    apply_service_charge: businessInfo.apply_service_charge,
                    service_charge_percentage: Number(businessInfo.service_charge_percentage)
                }).eq('id', profile.restaurant_id)
            }

            alert("Jamali OS: Configuración y Apariencia actualizadas correctamente. Recarga para ver los cambios totales.")
            window.location.reload()
        } catch (e) {
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
        <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Zap className="w-4 h-4 text-primary fill-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Jamali OS Framework v2.0</span>
                    </div>
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">Customización <span className="text-primary italic">SaaS</span></h1>
                    <p className="text-slate-500 font-medium text-sm mt-1 uppercase tracking-wider">Control total de Identidad, Datos y Apariencia</p>
                </div>
                <Button onClick={handleSave} disabled={saving} className="h-14 px-10 bg-slate-900 text-white hover:bg-primary hover:text-black font-black uppercase text-xs tracking-widest italic rounded-2xl shadow-xl transition-all gap-3 shrink-0">
                    {saving ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                    APLICAR CAMBIOS
                </Button>
            </div>

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
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Paletas de Color Premium (Selección Rápida)</label>
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

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 flex items-center gap-2"><Globe className="w-3 h-3" /> Subdominio Jamali (ej: pargorojo)</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            className="flex-1 h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 outline-none focus:border-primary font-bold text-slate-600 text-sm"
                                            value={businessInfo.subdomain}
                                            onChange={e => setBusinessInfo({ ...businessInfo, subdomain: e.target.value.toLowerCase() })}
                                            placeholder="nombre-del-negocio"
                                        />
                                        <span className="text-[10px] font-black text-slate-400">.jamalios.com</span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 flex items-center gap-2">
                                        {businessInfo.theme === 'dark' ? <Zap className="w-3 h-3 fill-amber-500 text-amber-500" /> : <Zap className="w-3 h-3 text-slate-400" />}
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

                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Eslogan / Tagline</label>
                                <input
                                    className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none focus:border-primary font-bold text-slate-600 transition-all text-sm"
                                    value={businessInfo.tagline}
                                    onChange={e => setBusinessInfo({ ...businessInfo, tagline: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 italic px-4 flex items-center gap-2">
                            <Receipt className="w-4 h-4" /> Configuración de Servicios y Propinas
                        </h2>
                        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm space-y-8">
                            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                <div className="space-y-1">
                                    <p className="font-black italic uppercase text-sm text-slate-900">Propina Sugerida (Service Charge)</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Activa el cálculo automático de propina en la cuenta.</p>
                                </div>
                                <SimpleSwitch
                                    checked={businessInfo.apply_service_charge}
                                    onCheckedChange={(c) => setBusinessInfo({ ...businessInfo, apply_service_charge: c })}
                                />
                            </div>

                            {businessInfo.apply_service_charge && (
                                <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Porcentaje de Propina (%)</label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="number"
                                            className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none focus:border-primary font-black italic text-xl transition-all"
                                            value={businessInfo.service_charge_percentage}
                                            onChange={e => setBusinessInfo({ ...businessInfo, service_charge_percentage: e.target.value })}
                                            min="0"
                                            max="100"
                                        />
                                        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-xl italic">%</div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase italic ml-2">Este valor se sugerirá al cliente al momento de cerrar la cuenta.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 italic px-4 flex items-center gap-2">
                            <MapPin className="w-4 h-4" /> Datos de Localización y Contacto
                        </h2>
                        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Dirección</label>
                                    <input
                                        className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none focus:border-primary font-bold text-slate-600 transition-all text-sm"
                                        value={businessInfo.address}
                                        onChange={e => setBusinessInfo({ ...businessInfo, address: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Teléfono de Soporte</label>
                                    <input
                                        className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none focus:border-primary font-bold text-slate-600 transition-all text-sm"
                                        value={businessInfo.phone}
                                        onChange={e => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Email de Contacto</label>
                                <input
                                    className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none focus:border-primary font-bold text-slate-600 transition-all text-sm"
                                    value={businessInfo.email}
                                    onChange={e => setBusinessInfo({ ...businessInfo, email: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 🎥 SOCIAL MEDIA & FEATURES SECTION */}
                <div className="space-y-10">
                    <div className="space-y-6">
                        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 italic px-4 flex items-center gap-2">
                            <Link2 className="w-4 h-4" /> Presencia Digital (Redes Sociales)
                        </h2>
                        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 flex items-center gap-2">
                                        <Instagram className="w-3 h-3 text-pink-500" /> Instagram
                                    </label>
                                    <input
                                        className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none focus:border-primary text-xs font-medium"
                                        placeholder="https://instagram.com/tu_usuario"
                                        value={businessInfo.instagram_url}
                                        onChange={e => setBusinessInfo({ ...businessInfo, instagram_url: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 flex items-center gap-2">
                                        <Facebook className="w-3 h-3 text-blue-600" /> Facebook
                                    </label>
                                    <input
                                        className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none focus:border-primary text-xs font-medium"
                                        placeholder="https://facebook.com/tu_pagina"
                                        value={businessInfo.facebook_url}
                                        onChange={e => setBusinessInfo({ ...businessInfo, facebook_url: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 flex items-center gap-2">
                                        <Video className="w-4 h-4 text-black" /> TikTok
                                    </label>
                                    <input
                                        className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none focus:border-primary text-xs font-medium"
                                        placeholder="https://tiktok.com/@tu_cuenta"
                                        value={businessInfo.tiktok_url}
                                        onChange={e => setBusinessInfo({ ...businessInfo, tiktok_url: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 flex items-center gap-2">
                                        <Youtube className="w-4 h-4 text-red-600" /> YouTube
                                    </label>
                                    <input
                                        className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none focus:border-primary text-xs font-medium"
                                        placeholder="https://youtube.com/@tu_canal"
                                        value={businessInfo.youtube_url}
                                        onChange={e => setBusinessInfo({ ...businessInfo, youtube_url: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 italic px-4 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" /> Módulos Operativos (Jamali OS Core)
                        </h2>
                        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm overflow-hidden">
                            {[
                                { key: 'enable_kitchen_kds', label: 'Monitor de Cocina (KDS)', sub: 'Habilitar interfaz táctil para cocineros.' },
                                { key: 'enable_waiter_pos', label: 'POS para Meseros', sub: 'Activar terminal de toma de pedidos en móviles.' },
                                { key: 'require_cashier_approval', label: 'Seguridad en Pago', sub: 'Los pedidos requieren pago antes de procesarse.' },
                                { key: 'menu_show_images', label: 'Visualización de Menú', sub: 'Mostrar fotos reales de los platos.' },
                                { key: 'enable_reservations', label: 'SaaS Reservations', sub: 'Permitir reservas de mesa vía web.' },
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
        </div>
    )
}
