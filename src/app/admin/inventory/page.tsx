"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
    Plus,
    Package,
    AlertTriangle,
    TrendingDown,
    TrendingUp,
    Search,
    Filter,
    ArrowLeft,
    Edit,
    Trash2,
    Zap,
    History,
    ChefHat,
    DollarSign,
    Box,
    Loader2
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

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

        // Realtime for stock updates
        const channel = supabase
            .channel('inventory-updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'ingredients' }, () => {
                loadIngredients()
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
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
        if (ingredient.current_stock <= ingredient.min_stock) {
            return { label: 'CRÍTICO', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20', icon: AlertTriangle, progress: 'bg-rose-500' }
        } else if (ingredient.current_stock <= ingredient.min_stock * 1.5) {
            return { label: 'BAJO', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: TrendingDown, progress: 'bg-amber-500' }
        } else {
            return { label: 'ÓPTIMO', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: TrendingUp, progress: 'bg-emerald-500' }
        }
    }

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
    )

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8 selection:bg-primary selection:text-black font-sans">
            <div className="max-w-[1600px] mx-auto space-y-10">

                {/* 🔝 PREMIUM HEADER */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-4">
                            <Link href="/admin">
                                <Button variant="ghost" size="icon" className="rounded-2xl bg-white/5 border border-white/10 hover:bg-white hover:text-black">
                                    <ArrowLeft className="w-5 h-5" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-4xl font-black tracking-tighter uppercase italic">Control de <span className="text-primary">Insumos</span></h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="px-2 py-0.5 rounded-md bg-primary/20 text-primary text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                                        <Zap className="w-2.5 h-2.5" /> Motor de Recetas Activo
                                    </div>
                                    <p className="text-xs text-gray-500 font-medium italic">Gestión inteligente de stock y costos</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link href="/admin/inventory/movements">
                            <Button variant="ghost" className="h-14 px-6 rounded-2xl border border-white/5 bg-white/5 hover:bg-white hover:text-black font-black uppercase text-[10px] tracking-widest italic gap-2 transition-all">
                                <History className="w-4 h-4" /> MOVIMIENTOS
                            </Button>
                        </Link>
                        <Link href="/admin/inventory/recipes">
                            <Button variant="ghost" className="h-14 px-6 rounded-2xl border border-white/5 bg-white/5 hover:bg-white hover:text-black font-black uppercase text-[10px] tracking-widest italic gap-2 transition-all">
                                <ChefHat className="w-4 h-4" /> GESTIONAR RECETAS
                            </Button>
                        </Link>
                        <Button className="h-14 px-8 bg-primary text-black rounded-2xl font-black uppercase text-[10px] tracking-widest italic hover:bg-white transition-all shadow-xl shadow-primary/10 gap-2">
                            <Plus className="w-5 h-5" /> NUEVO ITEM
                        </Button>
                    </div>
                </div>

                {/* 📊 KPI DASHLET */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <InventoryKPI
                        label="Total Referencias"
                        value={ingredients.length}
                        icon={<Box className="w-6 h-6" />}
                        color="text-blue-400"
                    />
                    <InventoryKPI
                        label="Stock Crítico"
                        value={lowStockCount}
                        icon={<AlertTriangle className="w-6 h-6" />}
                        color="text-rose-500"
                        highlight={lowStockCount > 0}
                    />
                    <InventoryKPI
                        label="Valoración Almacén"
                        value={`$${(totalValue / 1000000).toFixed(1)}M`}
                        icon={<DollarSign className="w-6 h-6" />}
                        color="text-emerald-400"
                        subValue={`$${totalValue.toLocaleString()} total`}
                    />
                    <InventoryKPI
                        label="Categorías"
                        value={categories.length - 1}
                        icon={<Filter className="w-6 h-6" />}
                        color="text-purple-400"
                    />
                </div>

                {/* 🔍 FILTERS & TOOLS */}
                <div className="flex flex-col md:flex-row gap-4 bg-[#111] p-4 rounded-[2rem] border border-white/5 shadow-2xl">
                    <div className="flex-1 relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar ingredientes por nombre o categoría..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-14 pl-14 pr-6 rounded-2xl bg-black border border-white/5 focus:border-primary focus:outline-none font-bold text-sm italic transition-all"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="h-14 px-6 rounded-2xl bg-black border border-white/5 focus:border-primary outline-none font-black text-[10px] uppercase tracking-widest appearance-none cursor-pointer hover:bg-white/5 transition-all min-w-[200px]"
                        >
                            <option value="all">Todas las categorías</option>
                            {categories.filter(c => c !== 'all').map(cat => (
                                <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                            ))}
                        </select>
                        <Button
                            variant="ghost"
                            onClick={() => setShowLowStock(!showLowStock)}
                            className={cn(
                                "h-14 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest italic gap-2 transition-all border",
                                showLowStock ? "bg-rose-500 border-rose-500 text-white" : "bg-black border-white/5 text-gray-500 hover:border-rose-500/50"
                            )}
                        >
                            <Filter className="w-4 h-4" />
                            CRÍTICOS
                        </Button>
                    </div>
                </div>

                {/* 📦 INVENTORY GRID */}
                <div className="bg-[#111] border border-white/5 rounded-[3rem] overflow-hidden shadow-3xl">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-white/5 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5">
                                    <th className="px-8 py-6 text-left">ITEM / ESPECIFICACIÓN</th>
                                    <th className="px-8 py-6 text-center">CATEGORÍA</th>
                                    <th className="px-8 py-6 text-right">DISPONIBILIDAD</th>
                                    <th className="px-8 py-6 text-right">COSTERÍA</th>
                                    <th className="px-8 py-6 text-center">ESTADO</th>
                                    <th className="px-8 py-6 text-right">ACCIONES</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredIngredients.map(ingredient => {
                                    const status = getStockStatus(ingredient)
                                    const StatusIcon = status.icon
                                    const totalItemValue = ingredient.current_stock * ingredient.cost_per_unit
                                    const stockPercentage = Math.min((ingredient.current_stock / (ingredient.min_stock * 3)) * 100, 100)

                                    return (
                                        <tr key={ingredient.id} className="group hover:bg-white/5 transition-all">
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-lg italic tracking-tighter uppercase group-hover:text-primary transition-colors">{ingredient.name}</span>
                                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">{ingredient.supplier || 'Sin proveedor'}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-gray-400">
                                                    {ingredient.category}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex flex-col items-end">
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-xl font-black italic">{ingredient.current_stock}</span>
                                                        <span className="text-[10px] font-bold text-gray-600 uppercase">{ingredient.unit}</span>
                                                    </div>
                                                    <div className="w-24 h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden">
                                                        <div
                                                            className={cn("h-full transition-all duration-1000", status.progress)}
                                                            style={{ width: `${stockPercentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex flex-col">
                                                    <span className="font-black italic font-mono text-emerald-400 text-lg">${totalItemValue.toLocaleString()}</span>
                                                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Costo: ${ingredient.cost_per_unit}/{ingredient.unit}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex justify-center">
                                                    <div className={cn(
                                                        "px-4 py-1.5 rounded-full border text-[10px] font-black uppercase italic flex items-center gap-2",
                                                        status.color
                                                    )}>
                                                        <StatusIcon className="w-3 h-3" />
                                                        {status.label}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-5 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300">
                                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-white/5 border border-white/5 hover:border-primary hover:text-primary">
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-white/5 border border-white/5 hover:bg-rose-500 hover:text-white">
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
                    <div className="text-center py-24 bg-[#111] rounded-[3rem] border border-white/5 border-dashed">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Box className="w-10 h-10 text-gray-600" />
                        </div>
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter">Sin resultados</h3>
                        <p className="text-gray-500 font-medium italic">No se encontraron artículos para los filtros aplicados.</p>
                        <Button variant="link" onClick={() => { setSearchTerm(""); setSelectedCategory("all"); setShowLowStock(false) }} className="text-primary mt-4 font-black uppercase text-[10px] tracking-widest italic">Limpiar todos los filtros</Button>
                    </div>
                )}
            </div>
        </div>
    )
}

function InventoryKPI({ label, value, icon, color, subValue, highlight }: any) {
    return (
        <div className={cn(
            "bg-[#111] border p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group transition-all",
            highlight ? "border-rose-500/50 animate-pulse" : "border-white/5"
        )}>
            <div className={`absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all ${color}`}>
                {icon}
            </div>
            <div className="relative z-10 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">{label}</p>
                <div className="flex flex-col">
                    <span className="text-4xl font-black tracking-tighter italic">{value}</span>
                    {subValue && <span className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-widest">{subValue}</span>}
                </div>
            </div>
        </div>
    )
}
