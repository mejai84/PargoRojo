"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowUpRight, ArrowDownRight, RefreshCw, ShoppingCart, AlertCircle, FileText } from "lucide-react"
import Link from "next/link"

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
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/inventory">
                            <Button variant="outline" size="icon">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold">Historial de Movimientos</h1>
                            <p className="text-muted-foreground">Log de cambios en el inventario</p>
                        </div>
                    </div>
                </div>

                {/* Movements List */}
                <div className="bg-card rounded-2xl border border-white/10 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5 border-b border-white/10">
                                <tr>
                                    <th className="text-left p-4 font-bold">Fecha</th>
                                    <th className="text-left p-4 font-bold">Tipo</th>
                                    <th className="text-left p-4 font-bold">Ingrediente</th>
                                    <th className="text-right p-4 font-bold">Cantidad</th>
                                    <th className="text-right p-4 font-bold">Stock Anterior</th>
                                    <th className="text-right p-4 font-bold">Nuevo Stock</th>
                                    <th className="text-left p-4 font-bold">Detalle</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {movements.map(movement => {
                                    const Icon = getMovementIcon(movement.movement_type)
                                    const colorClass = getMovementColor(movement.movement_type)

                                    return (
                                        <tr key={movement.id} className="hover:bg-white/5 transition-colors">
                                            <td className="p-4 text-sm text-muted-foreground whitespace-nowrap">
                                                {new Date(movement.created_at).toLocaleString('es-CO')}
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${colorClass}`}>
                                                    <Icon className="w-3 h-3" />
                                                    {getMovementLabel(movement.movement_type)}
                                                </span>
                                            </td>
                                            <td className="p-4 font-medium">
                                                {movement.ingredients?.name}
                                            </td>
                                            <td className={`p-4 text-right font-bold ${movement.quantity > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {movement.quantity > 0 ? '+' : ''}{movement.quantity} {movement.ingredients?.unit}
                                            </td>
                                            <td className="p-4 text-right text-muted-foreground text-sm">
                                                {movement.previous_stock}
                                            </td>
                                            <td className="p-4 text-right font-bold">
                                                {movement.new_stock}
                                            </td>
                                            <td className="p-4 text-sm text-muted-foreground max-w-xs truncate">
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
                    <div className="text-center py-12 text-muted-foreground">
                        <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p className="text-lg">No hay movimientos registrados</p>
                    </div>
                )}
            </div>
        </div>
    )
}
