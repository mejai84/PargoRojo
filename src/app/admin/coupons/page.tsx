"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
    Plus, Tag, Calendar, Percent, DollarSign, Trash2, StopCircle,
    PlayCircle, ArrowLeft, X, Save, User, Loader2, Info, Ghost, Heart, Snowflake, Gift, Sparkles, CheckCircle2, Ticket
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

type Coupon = {
    id: string
    code: string
    description: string
    discount_type: 'percentage' | 'fixed'
    discount_value: number
    min_purchase: number
    usage_limit: number | null
    usage_count: number
    active: boolean
    start_date: string
    end_date: string | null
    customer_id: string | null
    seasonal_tag: string | null
    category: string | null
}

type Profile = {
    id: string
    full_name: string | null
    email: string
}

const seasonalOptions = [
    { label: 'General', value: '', icon: Tag },
    { label: 'Halloween', value: 'halloween', icon: Ghost },
    { label: 'Madres / Amor', value: 'mothers_day', icon: Heart },
    { label: 'Navidad', value: 'christmas', icon: Snowflake },
    { label: 'Especial / Regalo', value: 'gift', icon: Gift },
]

export default function CouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([])
    const [profiles, setProfiles] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    // Form state
    const [formData, setFormData] = useState({
        id: '',
        code: '',
        description: '',
        discount_type: 'percentage' as 'percentage' | 'fixed',
        discount_value: 0,
        min_purchase: 0,
        usage_limit: '' as string | number,
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        customer_id: '',
        seasonal_tag: '',
        active: true
    })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        const [couponsRes, profilesRes] = await Promise.all([
            supabase.from('coupons').select('*').order('created_at', { ascending: false }),
            supabase.from('profiles').select('id, full_name, email').order('full_name', { ascending: true })
        ])

        if (couponsRes.data) setCoupons(couponsRes.data as any)
        if (profilesRes.data) setProfiles(profilesRes.data as any)
        setLoading(false)
    }

    const handleOpenModal = (coupon?: Coupon) => {
        if (coupon) {
            setFormData({
                id: coupon.id,
                code: coupon.code,
                description: coupon.description || '',
                discount_type: coupon.discount_type,
                discount_value: coupon.discount_value,
                min_purchase: coupon.min_purchase,
                usage_limit: coupon.usage_limit || '',
                start_date: coupon.start_date ? new Date(coupon.start_date).toISOString().split('T')[0] : '',
                end_date: coupon.end_date ? new Date(coupon.end_date).toISOString().split('T')[0] : '',
                customer_id: coupon.customer_id || '',
                seasonal_tag: coupon.seasonal_tag || '',
                active: coupon.active
            })
        } else {
            setFormData({
                id: '',
                code: '',
                description: '',
                discount_type: 'percentage',
                discount_value: 0,
                min_purchase: 0,
                usage_limit: '',
                start_date: new Date().toISOString().split('T')[0],
                end_date: '',
                customer_id: '',
                seasonal_tag: '',
                active: true
            })
        }
        setIsModalOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)

        const dataToSave = {
            code: formData.code.toUpperCase(),
            description: formData.description,
            discount_type: formData.discount_type,
            discount_value: Number(formData.discount_value),
            min_purchase: Number(formData.min_purchase),
            usage_limit: formData.usage_limit === '' ? null : Number(formData.usage_limit),
            start_date: formData.start_date || new Date().toISOString(),
            end_date: formData.end_date || null,
            customer_id: formData.customer_id || null,
            seasonal_tag: formData.seasonal_tag || null,
            active: formData.active
        }

        try {
            if (formData.id) {
                const { error } = await supabase
                    .from('coupons')
                    .update(dataToSave)
                    .eq('id', formData.id)
                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('coupons')
                    .insert([dataToSave])
                if (error) throw error
            }

            setIsModalOpen(false)
            loadData()
        } catch (error: any) {
            alert(error.message || 'Error al guardar el cupón')
        } finally {
            setSubmitting(false)
        }
    }

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        await supabase
            .from('coupons')
            .update({ active: !currentStatus })
            .eq('id', id)

        loadData()
    }

    const deleteCoupon = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este cupón?')) return

        await supabase
            .from('coupons')
            .delete()
            .eq('id', id)

        loadData()
    }

    return (
        <div className="min-h-screen bg-[#020406] text-white p-4 md:p-8 font-sans selection:bg-orange-500 selection:text-black relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[800px] bg-gradient-to-b from-orange-500/5 to-transparent pointer-events-none" />
            <div className="max-w-[1400px] mx-auto space-y-12 animate-in fade-in duration-1000 relative z-10">

                {/* 🔝 STRATEGIC HEADER */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 border-b border-border/50 pb-10">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2.5">
                            <Sparkles className="w-4 h-4 text-orange-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-500 italic">SISTEMA DE FIDELIZACIÓN v5.0</span>
                        </div>
                        <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white leading-none">CUPONES <span className="text-orange-500 italic">& OFERTAS</span></h1>
                        <p className="text-slate-500 font-bold text-sm uppercase tracking-widest italic opacity-70">Protocolos de fidelización y campañas de conversión</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <Link href="/admin">
                            <Button variant="ghost" className="h-16 px-8 bg-white/[0.02] border border-white/5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] italic shadow-xl transition-all gap-3 hover:bg-white/5 active:scale-95 group">
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> VOLVER
                            </Button>
                        </Link>
                        <Button
                            onClick={() => handleOpenModal()}
                            className="h-16 px-10 bg-orange-600 text-black hover:bg-orange-500 font-black uppercase text-[10px] tracking-[0.2em] italic rounded-2xl shadow-3xl shadow-orange-500/20 transition-all gap-3 border-none active:scale-95 group"
                        >
                            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> CREAR PROTOCOLO DE DESCUENTO
                        </Button>
                    </div>
                </div>

                {/* 🏷️ COUPONS REGISTRY */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {loading && coupons.length === 0 ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-96 rounded-[3.5rem] bg-card/50 border border-border/50 animate-pulse" />
                        ))
                    ) : coupons.map(coupon => {
                        const season = seasonalOptions.find(s => s.value === coupon.seasonal_tag)
                        const SeasonIcon = season?.icon || Tag

                        return (
                            <div key={coupon.id} className={cn(
                                "group relative p-10 rounded-[3.5rem] border transition-all duration-700 hover:border-orange-500/40 shadow-2xl bg-slate-900/40 backdrop-blur-3xl overflow-hidden flex flex-col justify-between min-h-[500px] border-white/5",
                                !coupon.active && "opacity-50 grayscale scale-[0.98]"
                            )}>
                                {/* Background Accent */}
                                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-1000">
                                    <SeasonIcon className="w-32 h-32" />
                                </div>

                                <div className="space-y-8 relative z-10">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-5">
                                            <div className={cn(
                                                "w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 shadow-2xl",
                                                coupon.active ? "bg-orange-500/10 border-orange-500/20 text-orange-500" : "bg-white/5 border-white/5 text-slate-600"
                                            )}>
                                                {coupon.discount_type === 'percentage' ? <Percent className="w-8 h-8" /> : <DollarSign className="w-8 h-8" />}
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-3xl font-black tracking-tighter italic uppercase text-white leading-none group-hover:text-orange-500 transition-colors">{coupon.code}</h3>
                                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 italic w-fit">
                                                    <SeasonIcon className="w-3 h-3" />
                                                    {season?.label || 'General'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "px-4 py-1.5 rounded-full text-[9px] font-black tracking-[0.2em] border italic shadow-sm",
                                            coupon.active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                        )}>
                                            {coupon.active ? 'LIVE' : 'IDLE'}
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <p className="text-sm font-black italic text-muted-foreground/60 leading-relaxed uppercase tracking-tight line-clamp-3 min-h-[3rem]">
                                            {coupon.description || "PROTOCOL DATA: OPERATIONAL DESCRIPTION NOT DEFINED."}
                                        </p>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-muted/40 p-5 rounded-[2rem] border border-border shadow-inner group/val">
                                                <div className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40 mb-2 italic">Valor Neto</div>
                                                <div className="text-3xl font-black text-primary leading-none tracking-tighter italic drop-shadow-sm group-hover/val:scale-110 transition-transform origin-left">
                                                    {coupon.discount_type === 'percentage'
                                                        ? `${coupon.discount_value}%`
                                                        : `$${coupon.discount_value.toLocaleString('es-CO')}`}
                                                </div>
                                            </div>
                                            <div className="bg-muted/40 p-5 rounded-[2rem] border border-border shadow-inner group/val">
                                                <div className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40 mb-2 italic">Mín. Orden</div>
                                                <div className="text-3xl font-black text-foreground leading-none tracking-tighter italic drop-shadow-sm group-hover/val:scale-110 transition-transform origin-left">
                                                    ${coupon.min_purchase.toLocaleString('es-CO')}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-4 border-t border-border/30">
                                            <div className="flex items-center justify-between text-[10px] font-black uppercase italic tracking-widest px-2">
                                                <div className="flex items-center gap-2 text-muted-foreground/40">
                                                    <Calendar className="w-4 h-4 text-primary" />
                                                    Cronología:
                                                </div>
                                                <span className="text-foreground">
                                                    {new Date(coupon.start_date).toLocaleDateString()} — {coupon.end_date ? new Date(coupon.end_date).toLocaleDateString() : 'OPEN'}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] font-black uppercase italic tracking-widest px-2">
                                                <div className="flex items-center gap-2 text-muted-foreground/40">
                                                    <Info className="w-4 h-4 text-primary" />
                                                    Métricas de Uso:
                                                </div>
                                                <span className={cn(
                                                    "text-foreground",
                                                    coupon.usage_limit && coupon.usage_count >= coupon.usage_limit ? "text-rose-500 animate-pulse" : ""
                                                )}>
                                                    [{coupon.usage_count} / {coupon.usage_limit || '∞'}]
                                                </span>
                                            </div>
                                            {coupon.customer_id && (
                                                <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/20 mt-2 group/user transition-all">
                                                    <div className="flex items-center gap-2 text-primary text-[10px] font-black uppercase italic tracking-widest leading-none">
                                                        <User className="w-4 h-4" />
                                                        Acceso Restringido:
                                                    </div>
                                                    <span className="text-primary font-black uppercase italic text-[11px] truncate max-w-[120px] leading-none tracking-tighter group-hover/user:scale-105 transition-transform">
                                                        {profiles.find(p => p.id === coupon.customer_id)?.full_name || 'TITULAR CRM'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-8 border-t border-border/30 relative z-10">
                                    <Button
                                        variant="outline"
                                        className="flex-1 rounded-2xl h-14 bg-muted/20 border-border font-black uppercase text-[10px] tracking-[0.2em] italic gap-3 hover:bg-foreground hover:text-background hover:border-foreground transition-all active:scale-95"
                                        onClick={() => toggleStatus(coupon.id, coupon.active)}
                                    >
                                        {coupon.active ? (
                                            <>
                                                <StopCircle className="w-4 h-4" />
                                                DEBARE
                                            </>
                                        ) : (
                                            <>
                                                <PlayCircle className="w-4 h-4" />
                                                REVIVE
                                            </>
                                        )}
                                    </Button>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="rounded-2xl h-14 w-14 bg-muted/20 border-border hover:bg-card hover:text-primary hover:border-primary transition-all active:scale-90"
                                            onClick={() => handleOpenModal(coupon)}
                                        >
                                            <Save className="w-5 h-5" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="rounded-2xl h-14 w-14 bg-rose-500/5 border-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all active:scale-90"
                                            onClick={() => deleteCoupon(coupon.id)}
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {coupons.length === 0 && !loading && (
                    <div className="text-center py-40 bg-card rounded-[4rem] border-2 border-dashed border-border/50 animate-in zoom-in duration-700">
                        <Ticket className="w-32 h-32 mx-auto mb-8 text-muted-foreground/10" />
                        <p className="text-3xl font-black opacity-20 uppercase tracking-[0.4em] italic mb-6 leading-none">Librería de Cupones Vacía</p>
                        <Button
                            variant="ghost"
                            className="text-primary font-black uppercase tracking-[0.3em] italic hover:bg-primary/5 px-10 h-16 rounded-2xl gap-3 text-sm"
                            onClick={() => handleOpenModal()}
                        >
                            <Plus className="w-5 h-5" /> CONFIGURAR PRIMERA OFERTA
                        </Button>
                    </div>
                )}
            </div>

            {/* 👓 STRATEGIC CONFIGURATION MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-background/80 backdrop-blur-2xl animate-in fade-in duration-500">
                    <div className="bg-card w-full max-w-4xl rounded-[4rem] border border-border shadow-[0_0_150px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-500 max-h-[95vh] outline-none">

                        <div className="px-12 py-10 border-b border-border/50 flex justify-between items-center bg-muted/20 relative z-10">
                            <div className="flex items-center gap-5">
                                <div className="p-4 bg-primary/10 rounded-2xl shadow-inner border border-primary/20">
                                    <Tag className="w-8 h-8 text-primary shadow-primary/20 shadow-lg" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-3xl font-black italic uppercase tracking-tighter text-foreground leading-none">
                                        {formData.id ? 'Optimizar' : 'Inyectar'} <span className="text-primary">Cupón</span>
                                    </h3>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.5em] italic opacity-60">CAMPAIGN ENGINE v5.1</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="rounded-2xl h-14 w-14 hover:bg-muted active:scale-90 transition-all border border-transparent hover:border-border">
                                <X className="w-8 h-8" />
                            </Button>
                        </div>

                        <form onSubmit={handleSubmit} className="px-12 py-10 space-y-12 overflow-y-auto custom-scrollbar relative z-10 selection:bg-primary selection:text-primary-foreground">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                {/* IDENTIFICACION */}
                                <div className="space-y-8">
                                    <div className="flex items-center gap-4 px-4 border-l-4 border-primary/40">
                                        <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground italic">Arquitectura Nominal</h2>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60 ml-6 italic">Identificador (CÓDIGO)</label>
                                            <input
                                                required
                                                placeholder="EJ: VIP-ACCESS-2025"
                                                className="w-full h-18 bg-muted/30 border border-border rounded-[2.5rem] px-8 outline-none focus:border-primary transition-all font-black uppercase text-2xl tracking-tighter italic placeholder:text-muted-foreground/10 text-primary shadow-inner"
                                                value={formData.code}
                                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60 ml-6 italic">Narrativa Promocional</label>
                                            <textarea
                                                placeholder="OBJETIVO DE LA CAMPAÑA..."
                                                className="w-full h-40 bg-muted/30 border border-border rounded-[2.5rem] p-8 outline-none focus:border-primary transition-all font-black italic uppercase tracking-tight text-xs resize-none placeholder:text-muted-foreground/10 shadow-inner"
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value.toUpperCase() })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* LOGICA DE VALOR */}
                                <div className="space-y-8">
                                    <div className="flex items-center gap-4 px-4 border-l-4 border-primary/40">
                                        <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground italic">Métrica de Impacto</h2>
                                    </div>

                                    <div className="space-y-8">
                                        <div className="grid grid-cols-2 gap-4">
                                            {[
                                                { id: 'percentage', label: 'RADIAL (%)', icon: Percent },
                                                { id: 'fixed', label: 'NOMINAL ($)', icon: DollarSign },
                                            ].map((type) => (
                                                <button
                                                    key={type.id}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, discount_type: type.id as any })}
                                                    className={cn(
                                                        "flex flex-col items-center justify-center p-6 rounded-[2.5rem] border-4 transition-all gap-3 shadow-sm",
                                                        formData.discount_type === type.id
                                                            ? "bg-primary/10 border-primary text-primary shadow-primary/20"
                                                            : "bg-muted/30 border-transparent hover:bg-muted/50 text-muted-foreground/40"
                                                    )}
                                                >
                                                    <type.icon className="w-6 h-6" />
                                                    <span className="text-[11px] font-black uppercase tracking-[0.3em] italic">{type.label}</span>
                                                </button>
                                            ))}
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60 ml-6 italic">Cuantía</label>
                                                <input
                                                    type="number"
                                                    required
                                                    className="w-full h-20 bg-card border-4 border-primary/10 rounded-[2rem] px-8 outline-none focus:border-primary transition-all font-black text-3xl italic text-primary text-center shadow-2xl"
                                                    value={formData.discount_value}
                                                    onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60 ml-6 italic">Mínimo Gastado</label>
                                                <input
                                                    type="number"
                                                    className="w-full h-20 bg-muted/30 border border-border rounded-[2rem] px-8 outline-none focus:border-primary transition-all font-black text-3xl italic text-foreground text-center shadow-inner"
                                                    value={formData.min_purchase}
                                                    onChange={(e) => setFormData({ ...formData, min_purchase: Number(e.target.value) })}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60 ml-6 italic">Capacidad de Suministro (LIMIT)</label>
                                            <input
                                                type="number"
                                                placeholder="∞ (ACCESO ILIMITADO)"
                                                className="w-full h-18 bg-muted/30 border border-border rounded-[2rem] px-8 outline-none focus:border-primary transition-all font-black italic text-center text-sm shadow-inner placeholder:text-muted-foreground/10"
                                                value={formData.usage_limit}
                                                onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* CRONOGRAMA & CRM */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pt-10 border-t border-border/50">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60 ml-6 italic">Despliegue</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full h-16 bg-muted/30 border border-border rounded-2xl px-6 outline-none focus:border-primary transition-all font-black italic text-xs shadow-inner cursor-pointer"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60 ml-6 italic">Finalización</label>
                                    <input
                                        type="date"
                                        className="w-full h-16 bg-muted/30 border border-border rounded-2xl px-6 outline-none focus:border-primary transition-all font-black italic text-xs shadow-inner cursor-pointer"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60 ml-6 italic">Tag Estacional</label>
                                    <select
                                        className="w-full h-16 bg-muted/30 border border-border rounded-2xl px-8 outline-none focus:border-primary transition-all font-black italic text-xs shadow-inner cursor-pointer appearance-none"
                                        value={formData.seasonal_tag}
                                        onChange={(e) => setFormData({ ...formData, seasonal_tag: e.target.value })}
                                    >
                                        {seasonalOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label.toUpperCase()}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3 pt-6">
                                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60 ml-6 italic flex items-center gap-2">
                                    <User className="w-4 h-4" /> CRM TARGETING (SOLO PARA TITULAR ESPECÍFICO)
                                </label>
                                <select
                                    className="w-full h-18 bg-muted/30 border border-border rounded-[2.5rem] px-8 outline-none focus:border-primary transition-all font-black italic text-sm shadow-inner cursor-pointer appearance-none"
                                    value={formData.customer_id}
                                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                                >
                                    <option value="">OPEN SOURCE (PÚBLICO GENERAL)</option>
                                    {profiles.map(profile => (
                                        <option key={profile.id} value={profile.id}>
                                            {profile.full_name?.toUpperCase() || 'USUARIO ANÓNIMO'} — [{profile.email.toUpperCase()}]
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col md:flex-row gap-6 pt-10">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsModalOpen(false)}
                                    className="w-full md:w-1/3 h-20 text-xs font-black uppercase tracking-[0.4em] border-2 border-border rounded-[2rem] text-muted-foreground/30 hover:text-foreground hover:border-foreground transition-all italic bg-card active:scale-95"
                                >
                                    ABORTAR
                                </Button>
                                <Button
                                    disabled={submitting}
                                    type="submit"
                                    className="flex-1 h-20 text-xl font-black uppercase tracking-[0.2em] transition-all rounded-[2rem] shadow-3xl italic border-none bg-primary text-primary-foreground hover:bg-foreground hover:text-background hover:scale-[1.02] active:scale-95 group"
                                >
                                    {submitting ? (
                                        <div className="flex items-center gap-4">
                                            <Loader2 className="w-8 h-8 animate-spin" />
                                            INDEXANDO...
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-4">
                                            {formData.id ? 'AUTORIZAR CAMBIOS' : 'LIBERAR CAMPAÑA'}
                                            <CheckCircle2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 20px; }
            `}</style>
        </div>
    )
}
