"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Plus, Package, AlertTriangle, TrendingDown, TrendingUp, Search, Filter, ArrowLeft, Edit, Trash2 } from "lucide-react"
import Link from "next/link"

type Ingredient = {
    id: string
    name: string
    description: string
    unit: string
    current_stock: number
    min_stock: number
    max_stock: number
    cost_per_unit: number
    supplier: string
    category: string
    active: boolean
}

export default function InventoryPage() {
    const [ingredients, setIngredients] = useState<Ingredient[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedCategory, setSelectedCategory] = useState<string>("all")
    const [showLowStock, setShowLowStock] = useState(false)

    useEffect(() => {
        loadIngredients()
    }, [])

    const loadIngredients = async () => {
        const { data, error } = await supabase
            .from('ingredients')
            .select('*')
            .eq('active', true)
            .order('name', { ascending: true })

        if (!error && data) {
            setIngredients(data)
        }
        setLoading(false)
    }

    const categories = ['all', ...Array.from(new Set(ingredients.map(i => i.category)))]

    const filteredIngredients = ingredients.filter(ingredient => {
        const matchesSearch = ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = selectedCategory === 'all' || ingredient.category === selectedCategory
        const matchesLowStock = !showLowStock || ingredient.current_stock <= ingredient.min_stock
        return matchesSearch && matchesCategory && matchesLowStock
    })

    const lowStockCount = ingredients.filter(i => i.current_stock <= i.min_stock).length
    const totalValue = ingredients.reduce((sum, i) => sum + (i.current_stock * i.cost_per_unit), 0)

    const getStockStatus = (ingredient: Ingredient) => {
        const percentage = (ingredient.current_stock / ingredient.max_stock) * 100
        if (ingredient.current_stock <= ingredient.min_stock) {
            return { label: 'Crítico', color: 'bg-red-500/20 text-red-500 border-red-500/30', icon: AlertTriangle }
        } else if (percentage < 30) {
            return { label: 'Bajo', color: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30', icon: TrendingDown }
        } else {
            return { label: 'Normal', color: 'bg-green-500/20 text-green-500 border-green-500/30', icon: TrendingUp }
        }
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
                        <Link href="/admin">
                            <Button variant="outline" size="icon">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold">Control de Inventario</h1>
                            <p className="text-muted-foreground">Gestiona ingredientes y stock</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/admin/inventory/movements">
                            <Button variant="outline" className="gap-2">
                                <Package className="w-4 h-4" />
                                Movimientos
                            </Button>
                        </Link>
                        <Link href="/admin/inventory/recipes">
                            <Button variant="outline" className="gap-2">
                                <Package className="w-4 h-4" />
                                Recetas
                            </Button>
                        </Link>
                        <Button className="gap-2">
                            <Plus className="w-4 h-4" />
                            Nuevo Ingrediente
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="p-6 rounded-2xl bg-card border border-white/10">
                        <div className="text-sm text-muted-foreground mb-1">Total Ingredientes</div>
                        <div className="text-3xl font-bold">{ingredients.length}</div>
                    </div>
                    <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20">
                        <div className="text-sm text-red-600 mb-1">Stock Bajo</div>
                        <div className="text-3xl font-bold text-red-500">{lowStockCount}</div>
                    </div>
                    <div className="p-6 rounded-2xl bg-primary/10 border border-primary/20">
                        <div className="text-sm text-primary mb-1">Valor Total</div>
                        <div className="text-3xl font-bold text-primary">
                            ${totalValue.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                        </div>
                    </div>
                    <div className="p-6 rounded-2xl bg-green-500/10 border border-green-500/20">
                        <div className="text-sm text-green-600 mb-1">Categorías</div>
                        <div className="text-3xl font-bold text-green-500">{categories.length - 1}</div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar ingredientes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-white/10 focus:border-primary focus:outline-none"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-4 py-3 rounded-xl bg-card border border-white/10 focus:border-primary focus:outline-none"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>
                                    {cat === 'all' ? 'Todas las categorías' : cat}
                                </option>
                            ))}
                        </select>
                        <Button
                            variant={showLowStock ? "default" : "outline"}
                            onClick={() => setShowLowStock(!showLowStock)}
                            className="gap-2"
                        >
                            <Filter className="w-4 h-4" />
                            Solo Stock Bajo
                        </Button>
                    </div>
                </div>

                {/* Ingredients Table */}
                <div className="bg-card rounded-2xl border border-white/10 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5 border-b border-white/10">
                                <tr>
                                    <th className="text-left p-4 font-bold">Ingrediente</th>
                                    <th className="text-left p-4 font-bold">Categoría</th>
                                    <th className="text-right p-4 font-bold">Stock Actual</th>
                                    <th className="text-right p-4 font-bold">Stock Mínimo</th>
                                    <th className="text-right p-4 font-bold">Costo/Unidad</th>
                                    <th className="text-right p-4 font-bold">Valor Total</th>
                                    <th className="text-center p-4 font-bold">Estado</th>
                                    <th className="text-center p-4 font-bold">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredIngredients.map(ingredient => {
                                    const status = getStockStatus(ingredient)
                                    const StatusIcon = status.icon
                                    const totalValue = ingredient.current_stock * ingredient.cost_per_unit

                                    return (
                                        <tr key={ingredient.id} className="hover:bg-white/5 transition-colors">
                                            <td className="p-4">
                                                <div>
                                                    <div className="font-bold">{ingredient.name}</div>
                                                    {ingredient.description && (
                                                        <div className="text-sm text-muted-foreground">{ingredient.description}</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="px-3 py-1 rounded-full bg-white/10 text-sm">
                                                    {ingredient.category}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="font-bold">{ingredient.current_stock}</div>
                                                <div className="text-sm text-muted-foreground">{ingredient.unit}</div>
                                            </td>
                                            <td className="p-4 text-right text-muted-foreground">
                                                {ingredient.min_stock} {ingredient.unit}
                                            </td>
                                            <td className="p-4 text-right">
                                                ${ingredient.cost_per_unit.toLocaleString('es-CO')}
                                            </td>
                                            <td className="p-4 text-right font-bold">
                                                ${totalValue.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-center">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${status.color}`}>
                                                        <StatusIcon className="w-3 h-3" />
                                                        {status.label}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button variant="ghost" size="sm">
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="text-destructive">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {filteredIngredients.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p className="text-lg">No se encontraron ingredientes</p>
                    </div>
                )}
            </div>
        </div>
    )
}
