"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Plus, Tag, Calendar, Percent, DollarSign, Trash2, StopCircle, PlayCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

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
}

export default function CouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadCoupons()
    }, [])

    const loadCoupons = async () => {
        const { data } = await supabase
            .from('coupons')
            .select('*')
            .order('created_at', { ascending: false })

        if (data) setCoupons(data as any)
        setLoading(false)
    }

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        await supabase
            .from('coupons')
            .update({ active: !currentStatus })
            .eq('id', id)

        loadCoupons()
    }

    const deleteCoupon = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este cupón?')) return

        await supabase
            .from('coupons')
            .delete()
            .eq('id', id)

        loadCoupons()
    }

    if (loading) return <div className="p-8 text-center">Cargando...</div>

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/admin">
                            <Button variant="outline" size="icon">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold">Cupones y Ofertas</h1>
                            <p className="text-muted-foreground">Gestiona los descuentos activos</p>
                        </div>
                    </div>
                    <Button className="gap-2">
                        <Plus className="w-4 h-4" />
                        Nuevo Cupón
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {coupons.map(coupon => (
                        <div key={coupon.id} className={`
                            relative p-6 rounded-2xl border transition-all
                            ${coupon.active
                                ? 'bg-card border-white/10'
                                : 'bg-gray-900/50 border-white/5 opacity-70'}
                        `}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`
                                        w-10 h-10 rounded-full flex items-center justify-center
                                        ${coupon.discount_type === 'percentage' ? 'bg-purple-500/20 text-purple-500' : 'bg-green-500/20 text-green-500'}
                                    `}>
                                        {coupon.discount_type === 'percentage' ? <Percent className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold tracking-tight">{coupon.code}</h3>
                                        <div className="text-sm text-muted-foreground">{coupon.discount_type === 'percentage' ? 'Porcentaje' : 'Monto Fijo'}</div>
                                    </div>
                                </div>
                                <div className={`px-2 py-1 rounded-md text-xs font-bold ${coupon.active ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                    {coupon.active ? 'ACTIVO' : 'INACTIVO'}
                                </div>
                            </div>

                            <div className="space-y-3 mb-6">
                                <p className="text-sm font-medium">
                                    {coupon.description}
                                </p>

                                <div className="flex items-center justify-between text-sm py-2 border-t border-white/5">
                                    <span className="text-muted-foreground">Descuento:</span>
                                    <span className="font-bold text-primary">
                                        {coupon.discount_type === 'percentage'
                                            ? `${coupon.discount_value}%`
                                            : `$${coupon.discount_value.toLocaleString('es-CO')}`}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Mínimo Compra:</span>
                                    <span>${coupon.min_purchase.toLocaleString('es-CO')}</span>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Usos:</span>
                                    <span>{coupon.usage_count} / {coupon.usage_limit || '∞'}</span>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4 border-t border-white/10">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => toggleStatus(coupon.id, coupon.active)}
                                >
                                    {coupon.active ? (
                                        <>
                                            <StopCircle className="w-4 h-4 mr-2" />
                                            Pausar
                                        </>
                                    ) : (
                                        <>
                                            <PlayCircle className="w-4 h-4 mr-2" />
                                            Activar
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="hover:bg-red-500/20 hover:text-red-500 hover:border-red-500/50"
                                    onClick={() => deleteCoupon(coupon.id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                {coupons.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        <Tag className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p className="text-lg">No hay cupones creados</p>
                    </div>
                )}
            </div>
        </div>
    )
}
