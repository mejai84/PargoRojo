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
    Users,
    Loader2,
    X,
    Save
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

    // Modal State
    const [adjustmentModal, setAdjustmentModal] = useState<{ isOpen: boolean, ingredient: Ingredient | null }>({ isOpen: false, ingredient: null })
    const [adjustmentData, setAdjustmentData] = useState({ type: 'IN', quantity: '', reason: '' })
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        loadIngredients()

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

    const handleQuickAdjustment = (ingredient: Ingredient) => {
        setAdjustmentData({ type: 'IN', quantity: '', reason: '' })
        setAdjustmentModal({ isOpen: true, ingredient })
    }

    const submitAdjustment = async () => {
        if (!adjustmentModal.ingredient || !adjustmentData.quantity) return
        setSubmitting(true)

        const qty = parseFloat(adjustmentData.quantity)
        const finalQty = adjustmentData.type === 'IN' ? qty : -qty

        try {
            const { data: { user } } = await supabase.auth.getUser()

            // 1. Registrar movimiento
            await supabase.from('inventory_movements').insert({
                ingredient_id: adjustmentModal.ingredient.id,
                user_id: user?.id,
                type: adjustmentData.type === 'IN' ? 'IN' : 'OUT',
                quantity: qty,
                cost_per_unit: adjustmentModal.ingredient.cost_per_unit,
                reason: adjustmentData.reason || 'Ajuste rápido de inventario'
            })

            // 2. Actualizar stock
            await supabase.from('ingredients').update({
                current_stock: adjustmentModal.ingredient.current_stock + finalQty
            }).eq('id', adjustmentModal.ingredient.id)

            setAdjustmentModal({ isOpen: false, ingredient: null })
        } catch (error) {
            console.error(error)
            alert("Error al ajustar stock")
        } finally {
            setSubmitting(false)
        }
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
        <div className="min-h-screen bg-transparent flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
    )

    return (
        <div className="min-h-screen bg-transparent text-slate-900 p-4 md:p-8 selection:bg-primary selection:text-black font-sans relative">
            <div className="max-w-[1600px] mx-auto space-y-10">

                {/* 🔝 PREMIUM HEADER */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-4">
                            <Link href="/admin">
                                <Button variant="ghost" size="icon" className="rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-sm">
                                    <ArrowLeft className="w-5 h-5 text-slate-900" />
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

                    <div className="flex flex-wrap items-center gap-3">
                        <Link href="/admin/inventory/purchase-orders">
                            <Button className="h-14 px-8 bg-emerald-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest italic hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/10 gap-2">
                                <TrendingUp className="w-5 h-5" /> ENTRADA STOCK
                            </Button>
                        </Link>
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
                <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-[2rem] border border-slate-200 shadow-sm">
                    <div className="flex-1 relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar ingredientes por nombre o categoría..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-14 pl-14 pr-6 rounded-2xl bg-slate-50 border border-slate-200 focus:border-primary focus:outline-none font-bold text-sm italic transition-all text-slate-900"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="h-14 px-6 rounded-2xl bg-slate-50 border border-slate-200 focus:border-primary outline-none font-black text-[10px] uppercase tracking-widest appearance-none cursor-pointer hover:bg-white transition-all min-w-[200px] text-slate-900"
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
                                "h-14 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest italic gap-2 transition-all border shadow-sm",
                                showLowStock ? "bg-rose-500 border-rose-500 text-white" : "bg-white border-slate-200 text-slate-400 hover:border-rose-500/50"
                            )}
                        >
                            <Filter className="w-4 h-4" />
                            CRÍTICOS
                        </Button>
                    </div>
                </div>

                {/* 📦 INVENTORY GRID */}
                <div className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-sm min-h-[500px]">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                    <th className="px-8 py-6 text-left">ITEM</th>
                                    <th className="px-8 py-6 text-center">CATEGORÍA</th>
                                    <th className="px-8 py-6 text-right">DISPONIBILIDAD</th>
                                    <th className="px-8 py-6 text-center">ESTADO</th>
                                    <th className="px-8 py-6 text-right">ACCIONES</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredIngredients.map(ingredient => {
                                    const status = getStockStatus(ingredient)
                                    const StatusIcon = status.icon
                                    const stockPercentage = Math.min((ingredient.current_stock / (ingredient.min_stock * 3)) * 100, 100)

                                    return (
                                        <tr key={ingredient.id} className="group hover:bg-slate-50 transition-all">
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-lg italic tracking-tighter uppercase group-hover:text-primary transition-colors text-slate-900">{ingredient.name}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{ingredient.supplier || 'Pargo Rojo'}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className="px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[9px] font-black uppercase tracking-widest text-slate-500">
                                                    {ingredient.category}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex flex-col items-end">
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-xl font-black italic text-slate-900">{ingredient.current_stock}</span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">{ingredient.unit}</span>
                                                    </div>
                                                    <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                                                        <div
                                                            className={cn("h-full transition-all duration-1000", status.progress)}
                                                            style={{ width: `${stockPercentage}%` }}
                                                        />
                                                    </div>
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
                                                <div className="flex items-center justify-end gap-2 opacity-100">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleQuickAdjustment(ingredient)}
                                                        className="h-10 px-4 rounded-xl bg-slate-100 text-slate-600 hover:bg-primary hover:text-black font-black uppercase text-[10px] tracking-widest"
                                                    >
                                                        AJUSTAR
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
                    <div className="text-center py-24 bg-slate-50 rounded-[3rem] border border-slate-200 border-dashed">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
                            <Box className="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">Sin stock encontrado</h3>
                        <p className="text-slate-500 font-medium italic">Intenta cambiar los filtros de búsqueda.</p>
                    </div>
                )}
            </div>

            {/* QUICK ADJUSTMENT MODAL */}
            {adjustmentModal.isOpen && adjustmentModal.ingredient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">Ajuste Rápido</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{adjustmentModal.ingredient.name}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setAdjustmentModal({ isOpen: false, ingredient: null })} className="rounded-xl hover:bg-white">
                                <X className="w-5 h-5 text-slate-500" />
                            </Button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setAdjustmentData({ ...adjustmentData, type: 'IN' })}
                                    className={cn(
                                        "h-16 rounded-2xl font-black uppercase text-xs tracking-widest transition-all border-2",
                                        adjustmentData.type === 'IN' ? "bg-emerald-50 border-emerald-500 text-emerald-600" : "bg-white border-slate-200 text-slate-400 hover:border-emerald-200"
                                    )}
                                >
                                    AGREGAR (+)
                                </button>
                                <button
                                    onClick={() => setAdjustmentData({ ...adjustmentData, type: 'OUT' })}
                                    className={cn(
                                        "h-16 rounded-2xl font-black uppercase text-xs tracking-widest transition-all border-2",
                                        adjustmentData.type === 'OUT' ? "bg-rose-50 border-rose-500 text-rose-600" : "bg-white border-slate-200 text-slate-400 hover:border-rose-200"
                                    )}
                                >
                                    RETIRAR (-)
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Cantidad ({adjustmentModal.ingredient.unit})</label>
                                    <input
                                        type="number"
                                        autoFocus
                                        className="w-full h-16 text-center text-3xl font-black italic bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-primary text-slate-900"
                                        placeholder="0"
                                        value={adjustmentData.quantity}
                                        onChange={(e) => setAdjustmentData({ ...adjustmentData, quantity: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Motivo / Nota</label>
                                    <input
                                        type="text"
                                        className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary text-sm font-medium text-slate-700"
                                        placeholder="Ej: Compra diaria, Merma, etc."
                                        value={adjustmentData.reason}
                                        onChange={(e) => setAdjustmentData({ ...adjustmentData, reason: e.target.value })}
                                    />
                                </div>
                            </div>

                            <Button
                                onClick={submitAdjustment}
                                disabled={submitting || !adjustmentData.quantity}
                                className="w-full h-16 rounded-2xl bg-slate-900 text-white font-black uppercase text-sm tracking-widest hover:bg-primary hover:text-black transition-all gap-2"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                CONFIRMAR AJUSTE
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function InventoryKPI({ label, value, icon, color, subValue, highlight }: any) {
    return (
        <div className={cn(
            "bg-white border p-8 rounded-[2rem] shadow-sm relative overflow-hidden group transition-all",
            highlight ? "border-rose-500 animate-pulse" : "border-slate-200"
        )}>
            <div className={`absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all ${color}`}>
                {icon}
            </div>
            <div className="relative z-10 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">{label}</p>
                <div className="flex flex-col">
                    <span className="text-4xl font-black tracking-tighter italic text-slate-900">{value}</span>
                    {subValue && <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{subValue}</span>}
                </div>
            </div>
        </div>
    )
}
