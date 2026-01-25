"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Loader2, Save, MapPin, Phone, Mail, Instagram, Facebook, Youtube, Video, Twitter, Link2 } from "lucide-react"

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
        name: "PARGO ROJO",
        logo_url: "",
        tagline: "Gran Rafa | Restaurante & Asados",
        primary_color: "#FF6B35",
        address: "C.Cial. Cauca Centro, Caucasia",
        phone: "320 784 8287",
        email: "contacto@pargorojo.com",
        instagram_url: "",
        facebook_url: "",
        tiktok_url: "",
        youtube_url: "",
        threads_url: "",
        twitter_url: ""
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
            if (info) setBusinessInfo(prev => ({
                ...prev,
                ...info.value
            }))
        }
        setLoading(false)
    }

    const handleSave = async () => {
        setSaving(true)
        try {
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
            alert("Configuración actualizada correctamente")
        } catch (e) {
            alert("Error al guardar")
        }
        setSaving(false)
    }

    const toggle = (key: string) => {
        setFeatureFlags((prev: any) => ({ ...prev, [key]: !prev[key] }))
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
            <Loader2 className="animate-spin text-primary w-10 h-10" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cargando Preferencias...</p>
        </div>
    )

    return (
        <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">Configuración <span className="text-primary italic">Global</span></h1>
                    <p className="text-slate-500 font-medium text-sm mt-1 uppercase tracking-wider">Centro de Control de Identidad y Operaciones</p>
                </div>
                <Button onClick={handleSave} disabled={saving} className="h-14 px-10 bg-slate-900 text-white hover:bg-primary hover:text-black font-black uppercase text-xs tracking-widest italic rounded-2xl shadow-xl transition-all gap-3 shrink-0">
                    {saving ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                    GUARDAR CAMBIOS
                </Button>
            </div>

            <div className="grid lg:grid-cols-2 gap-10">
                {/* 🎨 WHITE LABEL & CONTACT SECTION */}
                <div className="space-y-10">
                    <div className="space-y-6">
                        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 italic px-4">Identidad Visual</h2>
                        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm space-y-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Nombre Comercial</label>
                                <input
                                    className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none focus:border-primary font-black italic text-xl transition-all"
                                    value={businessInfo.name}
                                    onChange={e => setBusinessInfo({ ...businessInfo, name: e.target.value.toUpperCase() })}
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Eslogan / Tagline</label>
                                <input
                                    className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none focus:border-primary font-bold text-slate-600 transition-all text-sm"
                                    value={businessInfo.tagline}
                                    onChange={e => setBusinessInfo({ ...businessInfo, tagline: e.target.value })}
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Logo del Negocio</label>
                                <div className="flex items-center gap-6">
                                    <div className="w-24 h-24 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center p-2 overflow-hidden shrink-0">
                                        {businessInfo.logo_url ? (
                                            <img src={businessInfo.logo_url} alt="Logo" className="w-full h-full object-contain" />
                                        ) : (
                                            <span className="text-[10px] text-slate-400 font-bold">SIN LOGO</span>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:uppercase file:bg-primary file:text-black hover:file:bg-slate-900 hover:file:text-white transition-all text-sm text-slate-500"
                                            onChange={async (e) => {
                                                if (!e.target.files || e.target.files.length === 0) return
                                                const file = e.target.files[0]
                                                const fileExt = file.name.split('.').pop()
                                                const fileName = `logo-${Date.now()}.${fileExt}`
                                                try {
                                                    const { error } = await supabase.storage.from('brand_assets').upload(fileName, file)
                                                    if (error) throw error
                                                    const { data: { publicUrl } } = supabase.storage.from('brand_assets').getPublicUrl(fileName)
                                                    setBusinessInfo({ ...businessInfo, logo_url: publicUrl })
                                                } catch (error) {
                                                    alert('Error subiendo logo')
                                                    console.error(error)
                                                }
                                            }}
                                        />
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Recomendado: 500x500 PNG transparente</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 italic px-4">Información de Contacto</h2>
                        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 flex items-center gap-2"><MapPin className="w-3 h-3" /> Dirección</label>
                                    <input
                                        className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none focus:border-primary font-bold text-slate-600 transition-all text-sm"
                                        value={businessInfo.address}
                                        onChange={e => setBusinessInfo({ ...businessInfo, address: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 flex items-center gap-2"><Phone className="w-3 h-3" /> Teléfono</label>
                                    <input
                                        className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none focus:border-primary font-bold text-slate-600 transition-all text-sm"
                                        value={businessInfo.phone}
                                        onChange={e => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 flex items-center gap-2"><Mail className="w-3 h-3" /> Email Público</label>
                                <input
                                    className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none focus:border-primary font-bold text-slate-600 transition-all text-sm"
                                    value={businessInfo.email}
                                    onChange={e => setBusinessInfo({ ...businessInfo, email: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 🎥 SOCIAL MEDIA & VIDEO SECTION */}
                <div className="space-y-10">
                    <div className="space-y-6">
                        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 italic px-4">Ecosistema Digital</h2>
                        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 flex items-center gap-2"><Instagram className="w-3 h-3 text-pink-500" /> Instagram URL</label>
                                    <input
                                        className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none focus:border-primary text-xs font-medium text-slate-600"
                                        placeholder="https://..."
                                        value={businessInfo.instagram_url}
                                        onChange={e => setBusinessInfo({ ...businessInfo, instagram_url: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 flex items-center gap-2"><Facebook className="w-3 h-3 text-blue-600" /> Facebook URL</label>
                                    <input
                                        className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none focus:border-primary text-xs font-medium text-slate-600"
                                        placeholder="https://..."
                                        value={businessInfo.facebook_url}
                                        onChange={e => setBusinessInfo({ ...businessInfo, facebook_url: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 flex items-center gap-2"><Video className="w-4 h-4 text-black" /> TikTok URL</label>
                                    <input
                                        className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none focus:border-primary text-xs font-medium text-slate-600"
                                        placeholder="https://..."
                                        value={businessInfo.tiktok_url}
                                        onChange={e => setBusinessInfo({ ...businessInfo, tiktok_url: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 flex items-center gap-2"><Youtube className="w-4 h-4 text-red-600" /> YouTube URL</label>
                                    <input
                                        className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none focus:border-primary text-xs font-medium text-slate-600"
                                        placeholder="https://..."
                                        value={businessInfo.youtube_url}
                                        onChange={e => setBusinessInfo({ ...businessInfo, youtube_url: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 flex items-center gap-2"><Link2 className="w-4 h-4 text-slate-900" /> Threads URL</label>
                                    <input
                                        className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none focus:border-primary text-xs font-medium text-slate-600"
                                        placeholder="https://..."
                                        value={businessInfo.threads_url}
                                        onChange={e => setBusinessInfo({ ...businessInfo, threads_url: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 flex items-center gap-2"><Twitter className="w-4 h-4 text-slate-900" /> Twitter / X URL</label>
                                    <input
                                        className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none focus:border-primary text-xs font-medium text-slate-600"
                                        placeholder="https://..."
                                        value={businessInfo.twitter_url}
                                        onChange={e => setBusinessInfo({ ...businessInfo, twitter_url: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 italic px-4">Características Operativas</h2>
                        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm overflow-hidden">
                            {[
                                { key: 'enable_kitchen_kds', label: 'Monitor de Cocina (KDS)', sub: 'Habilitar interfaz táctil para cocineros.' },
                                { key: 'enable_waiter_pos', label: 'POS para Meseros', sub: 'Activar terminal de toma de pedidos en móviles.' },
                                { key: 'require_cashier_approval', label: 'Control de Caja', sub: 'Los pedidos requieren pago antes de procesarse.' },
                                { key: 'menu_show_images', label: 'Imágenes en Menú', sub: 'Mostrar fotos de platos (o fichas compactas).' },
                                { key: 'enable_reservations', label: 'Reservas en Línea', sub: 'Permitir que clientes reserven mesas.' },
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
