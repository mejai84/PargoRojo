"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
    Plus, Tag, Calendar, Percent, DollarSign, Trash2, StopCircle,
    PlayCircle, ArrowLeft, X, Save, User, Loader2, Info, Ghost, Heart, Snowflake, Gift
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

    if (loading && coupons.length === 0) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    )

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/admin">
                            <Button variant="outline" size="icon" className="rounded-full">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-4xl font-black tracking-tight uppercase">Cupones & <span className="text-primary italic">Ofertas</span></h1>
                            <p className="text-muted-foreground font-medium">Gestiona descuentos exclusivos y campañas estacionales.</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => handleOpenModal()}
                        className="h-12 px-6 rounded-2xl bg-primary text-black font-black hover:scale-105 transition-all gap-2 shadow-lg shadow-primary/20"
                    >
                        <Plus className="w-5 h-5" />
                        NUEVO CUPÓN
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {coupons.map(coupon => {
                        const season = seasonalOptions.find(s => s.value === coupon.seasonal_tag)
                        const SeasonIcon = season?.icon || Tag

                        return (
                            <div key={coupon.id} className={`
                                group relative p-6 rounded-[2.5rem] border transition-all hover:border-primary/30 shadow-xl
                                ${coupon.active
                                    ? 'bg-card border-white/5'
                                    : 'bg-gray-900/50 border-white/5 opacity-70'}
                            `}>
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`
                                            w-14 h-14 rounded-2xl flex items-center justify-center border-2
                                            ${coupon.active ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-white/5 border-white/10 text-muted-foreground'}
                                        `}>
                                            {coupon.discount_type === 'percentage' ? <Percent className="w-7 h-7" /> : <DollarSign className="w-7 h-7" />}
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black tracking-tighter group-hover:text-primary transition-colors">{coupon.code}</h3>
                                            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                <SeasonIcon className="w-3 h-3" />
                                                {season?.label || 'General'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={cn(
                                        "px-3 py-1 rounded-full text-[10px] font-black tracking-widest border",
                                        coupon.active ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                                    )}>
                                        {coupon.active ? 'ACTIVO' : 'PAUSADO'}
                                    </div>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <p className="text-sm font-medium italic text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                                        {coupon.description || "Sin descripción proporcionada."}
                                    </p>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                                            <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Valor</div>
                                            <div className="text-xl font-black text-primary">
                                                {coupon.discount_type === 'percentage'
                                                    ? `${coupon.discount_value}%`
                                                    : `$${coupon.discount_value.toLocaleString('es-CO')}`}
                                            </div>
                                        </div>
                                        <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                                            <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Mínimo</div>
                                            <div className="text-xl font-black">
                                                ${coupon.min_purchase.toLocaleString('es-CO')}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs font-bold px-1">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Calendar className="w-3.5 h-3.5" />
                                                Vigencia:
                                            </div>
                                            <span>
                                                {new Date(coupon.start_date).toLocaleDateString()} - {coupon.end_date ? new Date(coupon.end_date).toLocaleDateString() : '∞'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs font-bold px-1">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Info className="w-3.5 h-3.5" />
                                                Usos:
                                            </div>
                                            <span className={cn(coupon.usage_limit && coupon.usage_count >= coupon.usage_limit ? "text-red-500" : "")}>
                                                {coupon.usage_count} / {coupon.usage_limit || '∞'}
                                            </span>
                                        </div>
                                        {coupon.customer_id && (
                                            <div className="flex items-center justify-between text-xs font-bold px-1 py-1 rounded-lg bg-primary/5 border border-primary/10">
                                                <div className="flex items-center gap-2 text-primary">
                                                    <User className="w-3.5 h-3.5" />
                                                    Exclusivo:
                                                </div>
                                                <span className="text-primary truncate max-w-[120px]">
                                                    {profiles.find(p => p.id === coupon.customer_id)?.full_name || 'Cliente Especial'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-4 border-t border-white/5">
                                    <Button
                                        variant="outline"
                                        className="flex-1 rounded-xl h-11 font-black uppercase text-xs gap-2"
                                        onClick={() => toggleStatus(coupon.id, coupon.active)}
                                    >
                                        {coupon.active ? (
                                            <>
                                                <StopCircle className="w-4 h-4" />
                                                Pausar
                                            </>
                                        ) : (
                                            <>
                                                <PlayCircle className="w-4 h-4" />
                                                Activar
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="rounded-xl h-11 w-11 hover:bg-white/10"
                                        onClick={() => handleOpenModal(coupon)}
                                    >
                                        <Save className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="rounded-xl h-11 w-11 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20"
                                        onClick={() => deleteCoupon(coupon.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {coupons.length === 0 && !loading && (
                    <div className="text-center py-24 bg-card/30 rounded-[3rem] border border-dashed border-white/10">
                        <Tag className="w-24 h-24 mx-auto mb-6 opacity-10" />
                        <p className="text-2xl font-black opacity-30 uppercase tracking-[0.2em]">No hay cupones activos</p>
                        <Button
                            variant="link"
                            className="mt-4 text-primary font-black uppercase tracking-widest"
                            onClick={() => handleOpenModal()}
                        >
                            Crea el primero ahora
                        </Button>
                    </div>
                )}
            </div>

            {/* Modal de Creación/Edición */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-card w-full max-w-2xl rounded-[3rem] border border-white/10 shadow-3xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
                        <div className="p-8 pb-4 flex justify-between items-center bg-gradient-to-br from-primary/5 to-transparent">
                            <div>
                                <h1 className="text-sm font-black text-primary uppercase tracking-[0.3em] mb-1">Configuración</h1>
                                <h2 className="text-3xl font-black tracking-tight uppercase">
                                    {formData.id ? 'Editar Cupón' : 'Nuevo Cupón'}
                                </h2>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="rounded-full hover:bg-white/5">
                                <X className="w-6 h-6" />
                            </Button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-6 overflow-y-auto max-h-[80vh]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Código y Descripción */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-4">Código del Cupón</label>
                                        <input
                                            required
                                            placeholder="EJ: HALLOWEEN2024"
                                            className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl px-6 outline-none focus:border-primary/50 transition-all font-black uppercase text-lg tracking-widest placeholder:opacity-20"
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-4">Descripción / Nota</label>
                                        <textarea
                                            placeholder="Detalles sobre la promoción..."
                                            className="w-full h-32 bg-white/5 border border-white/5 rounded-2xl p-6 outline-none focus:border-primary/50 transition-all font-medium resize-none"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Configuración de Valor */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-4">Tipo de Descuento</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { id: 'percentage', label: 'Porcentaje (%)', icon: Percent },
                                                { id: 'fixed', label: 'Monto Fijo ($)', icon: DollarSign },
                                            ].map((type) => (
                                                <button
                                                    key={type.id}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, discount_type: type.id as any })}
                                                    className={cn(
                                                        "flex items-center justify-center h-14 rounded-2xl border-2 transition-all gap-2",
                                                        formData.discount_type === type.id
                                                            ? "bg-primary/20 border-primary text-primary"
                                                            : "bg-white/5 border-white/5 hover:bg-white/10"
                                                    )}
                                                >
                                                    <type.icon className="w-4 h-4" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">{type.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-4">Valor</label>
                                            <input
                                                type="number"
                                                required
                                                className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl px-6 outline-none focus:border-primary/50 transition-all font-black text-xl"
                                                value={formData.discount_value}
                                                onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-4">Mín. Compra</label>
                                            <input
                                                type="number"
                                                className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl px-6 outline-none focus:border-primary/50 transition-all font-black text-xl text-emerald-400"
                                                value={formData.min_purchase}
                                                onChange={(e) => setFormData({ ...formData, min_purchase: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-4">Límite de Usos (∞ si vacío)</label>
                                        <input
                                            type="number"
                                            placeholder="Sin límite"
                                            className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl px-6 outline-none focus:border-primary/50 transition-all font-bold"
                                            value={formData.usage_limit}
                                            onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-white/5">
                                {/* Fechas */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-4">Fecha Inicio</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl px-6 outline-none focus:border-primary/50 transition-all font-bold"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-4">Fecha Expiración</label>
                                    <input
                                        type="date"
                                        className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl px-6 outline-none focus:border-primary/50 transition-all font-bold"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    />
                                </div>

                                {/* Temporada */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-4">Tipo Campaña (Opcional)</label>
                                    <select
                                        className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl px-6 outline-none focus:border-primary/50 transition-all font-bold appearance-none"
                                        value={formData.seasonal_tag}
                                        onChange={(e) => setFormData({ ...formData, seasonal_tag: e.target.value })}
                                    >
                                        {seasonalOptions.map(opt => (
                                            <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Restricción de Cliente */}
                            <div className="space-y-2 pt-4 border-t border-white/5">
                                <label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-4 flex items-center gap-2">
                                    <User className="w-3 h-3" /> Restringir a un Cliente Específico
                                </label>
                                <select
                                    className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl px-6 outline-none focus:border-primary/50 transition-all font-bold appearance-none"
                                    value={formData.customer_id}
                                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                                >
                                    <option value="" className="bg-slate-900">Todos los clientes (Público)</option>
                                    {profiles.map(profile => (
                                        <option key={profile.id} value={profile.id} className="bg-slate-900">
                                            {profile.full_name || 'Sin nombre'} ({profile.email})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-4 pt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest hover:bg-white/5"
                                >
                                    CANCELAR
                                </Button>
                                <Button
                                    disabled={submitting}
                                    type="submit"
                                    className="flex-[2] h-14 rounded-2xl bg-primary text-black font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                                >
                                    {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : formData.id ? 'GUARDAR ACTUALIZACIÓN' : 'CREAR CUPÓN AHORA'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
