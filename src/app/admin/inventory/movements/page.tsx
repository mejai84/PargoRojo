"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowUpRight, ArrowDownRight, RefreshCw, ShoppingCart, AlertCircle, FileText } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

type Movement = {
    id: string
    movement_type: 'sale' | 'purchase' | 'adjustment' | 'waste' | 'transfer'
    quantity: number
    previous_stock: number
    new_stock: number
    notes: string
    created_at: string
    reference_type: string
    ingredients: {
        name: string
        unit: string
    }
    created_by_user?: {
        email: string
    }
}

export default function InventoryMovementsPage() {
    const [movements, setMovements] = useState<Movement[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadMovements()
    }, [])

    const loadMovements = async () => {
        const { data, error } = await supabase
            .from('inventory_movements')
            .select(`
                *,
                ingredients (name, unit)
            `)
            .order('created_at', { ascending: false })
            .limit(100)

        if (!error && data) {
            setMovements(data as any)
        }
        setLoading(false)
    }

    const getMovementIcon = (type: string) => {
        switch (type) {
            case 'sale': return ShoppingCart
            case 'purchase': return ArrowUpRight
            case 'waste': return AlertCircle
            case 'adjustment': return RefreshCw
            default: return FileText
        }
    }

    const getMovementColor = (type: string) => {
        switch (type) {
            case 'sale': return 'text-blue-500 bg-blue-500/20'
            case 'purchase': return 'text-green-500 bg-green-500/20'
            case 'waste': return 'text-red-500 bg-red-500/20'
            case 'adjustment': return 'text-yellow-500 bg-yellow-500/20'
            default: return 'text-gray-500 bg-gray-500/20'
        }
    }

    const getMovementLabel = (type: string) => {
        const labels: Record<string, string> = {
            sale: 'Venta',
            purchase: 'Compra',
            adjustment: 'Ajuste',
            waste: 'Desperdicio',
            transfer: 'Traslado'
        }
        return labels[type] || type
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-transparent">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/inventory">
                            <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-sm">
                                <ArrowLeft className="w-5 h-5 text-slate-900" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">Historial de <span className="text-primary">Movimientos</span></h1>
                            <p className="text-slate-400 font-medium italic uppercase text-[10px] tracking-widest mt-1">Log cronológico de cambios en el inventario</p>
                        </div>
                    </div>
                </div>

                {/* Movements List */}
                <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm animate-in fade-in duration-700 delay-200">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                                    <th className="text-left p-6">Fecha</th>
                                    <th className="text-left p-6">Tipo</th>
                                    <th className="text-left p-6">Ingrediente</th>
                                    <th className="text-right p-6">Cantidad</th>
                                    <th className="text-right p-6">Stock Anterior</th>
                                    <th className="text-right p-6">Nuevo Stock</th>
                                    <th className="text-left p-6">Detalle</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {movements.map(movement => {
                                    const Icon = getMovementIcon(movement.movement_type)
                                    const colorClass = getMovementColor(movement.movement_type)

                                    return (
                                        <tr key={movement.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-6 text-[10px] font-bold text-slate-400 whitespace-nowrap italic">
                                                {new Date(movement.created_at).toLocaleString('es-CO')}
                                            </td>
                                            <td className="p-6">
                                                <span className={cn(
                                                    "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest italic border",
                                                    colorClass
                                                )}>
                                                    <Icon className="w-3 h-3" />
                                                    {getMovementLabel(movement.movement_type)}
                                                </span>
                                            </td>
                                            <td className="p-6 font-black uppercase italic text-xs text-slate-900">
                                                {movement.ingredients?.name}
                                            </td>
                                            <td className={`p-6 text-right font-black italic text-lg tracking-tighter ${movement.quantity > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {movement.quantity > 0 ? '+' : ''}{movement.quantity} <span className="text-[10px] uppercase font-bold text-slate-400">{movement.ingredients?.unit}</span>
                                            </td>
                                            <td className="p-6 text-right text-slate-400 text-[10px] font-bold italic">
                                                {movement.previous_stock}
                                            </td>
                                            <td className="p-6 text-right font-black italic text-lg tracking-tighter text-slate-900">
                                                {movement.new_stock}
                                            </td>
                                            <td className="p-6 text-[11px] font-medium text-slate-500 italic max-w-xs truncate">
                                                {movement.notes || '-'}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {movements.length === 0 && (
                    <div className="text-center py-24 bg-white border border-slate-200 rounded-[2.5rem] mt-8 shadow-sm">
                        <FileText className="w-16 h-16 mx-auto mb-4 text-slate-100" />
                        <h4 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">Sin movimientos previos</h4>
                        <p className="text-slate-400 font-medium italic text-[10px] uppercase tracking-widest mt-1">Aún no hay registros de cambio en el inventario.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
