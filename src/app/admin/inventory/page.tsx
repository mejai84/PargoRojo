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
    Save,
    Activity,
    Signal,
    Workflow,
    ChevronRight,
    ArrowRightCircle,
    Truck,
    Layers,
    Warehouse,
    BarChart4,
    Scale
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

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
            toast.success("Stock actualizado correctamente")
        } catch (error) {
            console.error(error)
            toast.error("Error al ajustar stock")
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
        <div className="min-h-screen flex items-center justify-center bg-transparent">
            <div className="flex flex-col items-center gap-8 animate-in fade-in duration-1000">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
                    <Loader2 className="w-16 h-16 text-primary animate-spin relative z-10" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary italic animate-pulse">Sincronizando Almacén Central...</p>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-transparent text-foreground p-4 md:p-12 font-sans selection:bg-primary selection:text-primary-foreground relative overflow-hidden">

            {/* 🌌 AMBIANCE LAYER */}
            <div className="fixed top-0 left-0 w-full h-[600px] bg-gradient-to-b from-primary/10 via-primary/[0.02] to-transparent pointer-events-none z-0" />
            <div className="fixed -bottom-40 -left-40 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none opacity-20 z-0 animate-pulse" />

            <div className="max-w-[1600px] mx-auto space-y-16 animate-in fade-in duration-1000 relative z-10">

                {/* 📦 INVENTORY COMMAND HEADER */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-12 border-b border-border/50 pb-12">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-10">
                        <Link href="/admin">
                            <Button variant="ghost" size="icon" className="h-20 w-20 rounded-[2.5rem] bg-card border border-border shadow-3xl hover:bg-muted active:scale-90 transition-all group overflow-hidden relative">
                                <ArrowLeft className="w-10 h-10 group-hover:-translate-x-1 transition-transform relative z-10" />
                            </Button>
                        </Link>
                        <div className="space-y-6">
                            <div className="flex flex-wrap items-center gap-4">
                                <h1 className="text-6xl md:text-7xl font-black italic tracking-tighter uppercase leading-none text-foreground">KERNEL <span className="text-primary italic">INVENTARIO</span></h1>
                                <div className="px-5 py-2 bg-primary/10 border-2 border-primary/20 rounded-[1.5rem] text-[11px] font-black text-primary tracking-[0.3em] italic uppercase shadow-xl animate-pulse flex items-center gap-3">
                                    <Activity className="w-3 h-3" />
                                    SUPPLY CHAIN SYNC_ACTIVE
                                </div>
                            </div>
                            <p className="text-[11px] text-muted-foreground font-black uppercase tracking-[0.5em] italic flex items-center gap-4 opacity-60">
                                <Box className="w-5 h-5 text-primary" /> Maestro de Insumos, Control de Mermas & Valoración de Activos
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <Link href="/admin/inventory/purchase-orders">
                            <Button className="h-20 px-12 bg-emerald-500 text-white hover:bg-emerald-600 font-black uppercase text-xs tracking-[0.4em] italic rounded-[2.5rem] shadow-3xl shadow-emerald-500/20 transition-all gap-5 border-none group active:scale-95">
                                <Truck className="w-7 h-7 group-hover:scale-110 transition-transform" />
                                ENTRADA DE SUMINISTROS
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* 📊 KPI CORE MESH */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    <InventoryKPI
                        label="TOTAL REFERENCIAS"
                        value={ingredients.length}
                        icon={<Layers className="w-8 h-8" />}
                        color="text-indigo-500"
                        sub="ITEMS REGISTRADOS"
                    />
                    <InventoryKPI
                        label="STOCK CRÍTICO"
                        value={lowStockCount}
                        icon={<AlertTriangle className="w-8 h-8" />}
                        color="text-rose-500"
                        highlight={lowStockCount > 0}
                        sub="REQUIERE REPOSICIÓN"
                    />
                    <InventoryKPI
                        label="VALORACIÓN TOTAL"
                        value={`$${(totalValue / 1000000).toFixed(1)}M`}
                        icon={<DollarSign className="w-8 h-8" />}
                        color="text-emerald-500"
                        sub={`NETO: $${totalValue.toLocaleString()}`}
                    />
                    <InventoryKPI
                        label="DIVERSIDAD_CAT"
                        value={categories.length - 1}
                        icon={<Workflow className="w-8 h-8" />}
                        color="text-amber-500"
                        sub="CATEGORÍAS ACTIVAS"
                    />
                </div>

                {/* 🔍 SEARCH & FILTER HUB */}
                <div className="flex flex-col lg:flex-row gap-8 bg-card/60 backdrop-blur-3xl p-8 rounded-[4rem] border-4 border-border/20 shadow-3xl relative overflow-hidden group/filters">
                    <div className="absolute inset-0 bg-primary/2 opacity-0 group-hover/filters:opacity-100 transition-opacity" />

                    <div className="flex-1 relative group/search">
                        <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground group-focus-within/search:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="FILTRAR MATRIZ DE INSUMOS POR NOMBRE O CATEGORÍA..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-20 pl-20 pr-8 rounded-[2.5rem] bg-muted/40 border-4 border-border/40 focus:border-primary/50 outline-none font-black text-sm italic tracking-[0.2em] uppercase transition-all text-foreground placeholder:text-muted-foreground/20 shadow-inner"
                        />
                    </div>

                    <div className="flex flex-wrap gap-4 relative z-10">
                        <div className="relative">
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="h-20 px-10 rounded-[2.5rem] bg-muted/40 border-4 border-border/40 focus:border-primary/50 outline-none font-black text-[11px] uppercase tracking-[0.3em] italic appearance-none cursor-pointer hover:bg-card transition-all min-w-[280px] text-foreground pr-16 shadow-inner"
                            >
                                <option value="all">TODAS LAS CATEGORÍAS_SYS</option>
                                {categories.filter(c => c !== 'all').map(cat => (
                                    <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                                ))}
                            </select>
                            <Workflow className="absolute right-8 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                        </div>
                        <Button
                            variant="ghost"
                            onClick={() => setShowLowStock(!showLowStock)}
                            className={cn(
                                "h-20 px-10 rounded-[2.5rem] font-black uppercase text-[11px] tracking-[0.4em] italic gap-4 transition-all border-4 relative overflow-hidden shadow-3xl group/btn active:scale-95",
                                showLowStock
                                    ? "bg-rose-500 border-rose-500 text-white hover:bg-rose-600"
                                    : "bg-card border-border/40 text-muted-foreground hover:border-rose-500/40 hover:text-rose-500"
                            )}
                        >
                            <AlertTriangle className={cn("w-5 h-5", showLowStock && "animate-pulse")} />
                            FILTRAR CRÍTICOS
                        </Button>
                    </div>
                </div>

                {/* 📦 MASTER INGREDIENT LEDGER */}
                <div className="bg-card border border-border rounded-[5rem] shadow-3xl min-h-[700px] flex flex-col relative overflow-hidden group/ledger transition-all hover:border-primary/20">
                    <div className="absolute top-0 right-0 p-20 opacity-[0.03] pointer-events-none -mr-16 -mt-16 group-hover/ledger:scale-110 transition-all duration-1000">
                        <Warehouse className="w-[800px] h-[800px]" />
                    </div>

                    <div className="overflow-x-auto custom-scrollbar relative z-10">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-muted/10 text-[11px] font-black text-white/20 uppercase tracking-[0.5em] border-b border-border/50 italic">
                                    <th className="px-12 py-10 uppercase">Referencia_Item</th>
                                    <th className="px-12 py-10 text-center uppercase">Cluster_Cat</th>
                                    <th className="px-12 py-10 text-right uppercase">Availability_Metric</th>
                                    <th className="px-12 py-10 text-center uppercase">Health_Status</th>
                                    <th className="px-12 py-10 text-right uppercase">Command</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/20">
                                {filteredIngredients.map(ingredient => {
                                    const status = getStockStatus(ingredient)
                                    const StatusIcon = status.icon
                                    const stockPercentage = Math.min((ingredient.current_stock / (ingredient.min_stock * 3)) * 100, 100)

                                    return (
                                        <tr key={ingredient.id} className="group/row hover:bg-muted/10 transition-all cursor-default">
                                            <td className="px-12 py-10">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-16 h-16 rounded-2xl bg-muted/40 border-2 border-border/40 flex items-center justify-center shadow-inner group-hover/row:border-primary/40 transition-all">
                                                        <ChefHat className="w-8 h-8 text-muted-foreground/40 group-hover/row:text-primary transition-colors" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-3xl italic tracking-tighter uppercase group-hover/row:text-primary transition-colors text-foreground leading-none">{ingredient.name}</span>
                                                        <span className="text-[10px] text-muted-foreground/30 font-black uppercase tracking-[0.4em] mt-2 italic flex items-center gap-2">
                                                            <Signal className="w-3 h-3" /> {ingredient.supplier || 'DOMINIO_INTERNO'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-12 py-10 text-center">
                                                <span className="px-5 py-2 rounded-xl bg-card border-2 border-border/60 text-[10px] font-black uppercase tracking-[0.2em] italic text-muted-foreground/60 transition-all group-hover/row:border-primary/20 group-hover/row:text-foreground">
                                                    {ingredient.category}
                                                </span>
                                            </td>
                                            <td className="px-12 py-10 text-right">
                                                <div className="flex flex-col items-end gap-3">
                                                    <div className="flex items-baseline gap-3">
                                                        <span className="text-4xl font-black italic text-foreground tracking-tighter transition-all group-hover/row:scale-110 tabular-nums">{ingredient.current_stock}</span>
                                                        <span className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] italic">{ingredient.unit}</span>
                                                    </div>
                                                    <div className="w-40 h-2 bg-muted/40 rounded-full overflow-hidden border border-border/10 shadow-inner">
                                                        <div
                                                            className={cn("h-full transition-all duration-[1500ms] shadow-[0_0_15px_rgba(255,102,0,0.3)]", status.progress)}
                                                            style={{ width: `${stockPercentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-12 py-10">
                                                <div className="flex justify-center">
                                                    <div className={cn(
                                                        "px-6 py-2 rounded-[1.5rem] border-2 text-[10px] font-black uppercase italic flex items-center gap-3 transition-all group-hover/row:scale-110",
                                                        status.color
                                                    )}>
                                                        <StatusIcon className={cn("w-4 h-4", status.label === 'CRÍTICO' && "animate-pulse")} />
                                                        {status.label}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-12 py-10 text-right">
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => handleQuickAdjustment(ingredient)}
                                                    className="h-14 px-8 rounded-2xl bg-card border border-border/40 text-muted-foreground hover:bg-primary hover:text-white hover:border-primary transition-all font-black uppercase text-[10px] tracking-[0.3em] italic shadow-xl active:scale-95"
                                                >
                                                    MODULAR ADJUST
                                                </Button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    {filteredIngredients.length === 0 && (
                        <div className="py-44 flex flex-col items-center justify-center gap-10 bg-black/5 animate-in fade-in duration-1000 relative">
                            <div className="absolute inset-x-0 h-1 top-0 bg-gradient-to-r from-transparent via-border to-transparent" />
                            <Warehouse className="w-24 h-24 text-muted-foreground/10 animate-pulse" />
                            <div className="text-center space-y-4">
                                <p className="text-5xl font-black italic uppercase tracking-tighter text-muted-foreground/20 leading-none">Database_Zero_Reference</p>
                                <p className="text-[11px] font-black uppercase tracking-[0.6em] text-muted-foreground/10 italic">EL KERNEL NO DETECTA COINCIDENCIAS EN LA CAPA DE DATOS SELECCIONADA.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* 🏷️ GLOBAL METRIC */}
                <div className="p-10 bg-foreground rounded-[4rem] text-background flex flex-col md:flex-row items-center justify-between shadow-3xl group/metric relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover/metric:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-10 relative z-10">
                        <div className="w-20 h-20 rounded-[2rem] bg-background/10 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-2xl group-hover/metric:rotate-12 transition-transform duration-500">
                            <BarChart4 className="w-10 h-10 text-primary drop-shadow-[0_0_15px_rgba(255,77,0,0.6)]" />
                        </div>
                        <div className="space-y-2 text-center md:text-left">
                            <h4 className="text-2xl font-black italic uppercase tracking-tighter text-primary">SCM Master Node</h4>
                            <p className="text-[10px] text-background/40 font-black uppercase tracking-[0.4em] italic leading-none">
                                SYSTEM v8.42 • KERNEL OPTIMIZED FOR SUPPLY CHAIN INTEGRITY
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-12 mt-8 md:mt-0 relative z-10">
                        <div className="text-right">
                            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white/20 mb-1 italic">Stock Health</p>
                            <p className="text-2xl font-black italic tracking-tighter text-emerald-500">OPTIMIZED_A1</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white/20 mb-1 italic">Node Region</p>
                            <p className="text-2xl font-black italic tracking-tighter text-white">EU-WEST_ALPHA</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* QUICK ADJUSTMENT MODAL REFINED */}
            {adjustmentModal.isOpen && adjustmentModal.ingredient && (
                <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-card border-4 border-primary/20 rounded-[4.5rem] w-full max-w-xl p-16 shadow-[0_0_150px_rgba(255,77,0,0.15)] relative overflow-hidden group/modal animate-in zoom-in-95 duration-500">
                        <div className="absolute top-0 right-0 p-16 opacity-[0.03] pointer-events-none -mr-16 -mt-16 group-hover/modal:scale-110 transition-transform duration-1000 rotate-12">
                            <Scale className="w-[450px] h-[450px]" />
                        </div>

                        <div className="flex justify-between items-start mb-16 relative z-10">
                            <div className="space-y-4">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-3xl">
                                        <Scale className="w-8 h-8" />
                                    </div>
                                    <h2 className="text-5xl font-black italic uppercase tracking-tighter text-foreground leading-none">
                                        MODULACIÓN DE <span className="text-primary italic">SUMINISTRO</span>
                                    </h2>
                                </div>
                                <p className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.4em] italic pl-20 italic">ID_INGREDIENT: {adjustmentModal.ingredient.id.slice(0, 8).toUpperCase()}</p>
                            </div>
                            <Button variant="ghost" className="h-16 w-16 rounded-[1.5rem] bg-muted/40 hover:bg-primary hover:text-white transition-all active:scale-90" onClick={() => setAdjustmentModal({ isOpen: false, ingredient: null })}>
                                <X className="w-8 h-8" />
                            </Button>
                        </div>

                        <div className="space-y-12 relative z-10">
                            <div className="grid grid-cols-2 gap-8">
                                <button
                                    onClick={() => setAdjustmentData({ ...adjustmentData, type: 'IN' })}
                                    className={cn(
                                        "h-24 rounded-[2.5rem] font-black uppercase text-[10px] tracking-[0.4em] italic transition-all border-4 flex flex-col items-center justify-center gap-2 group/mode active:scale-95",
                                        adjustmentData.type === 'IN' ? "bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-3xl shadow-emerald-500/20" : "bg-muted/30 border-border/40 text-muted-foreground/30 hover:border-emerald-500/40"
                                    )}
                                >
                                    <Plus className={cn("w-6 h-6", adjustmentData.type === 'IN' && "scale-110 animate-pulse")} />
                                    INGRESAR (+)
                                </button>
                                <button
                                    onClick={() => setAdjustmentData({ ...adjustmentData, type: 'OUT' })}
                                    className={cn(
                                        "h-24 rounded-[2.5rem] font-black uppercase text-[10px] tracking-[0.4em] italic transition-all border-4 flex flex-col items-center justify-center gap-2 group/mode active:scale-95",
                                        adjustmentData.type === 'OUT' ? "bg-rose-500/10 border-rose-500 text-rose-500 shadow-3xl shadow-rose-500/20" : "bg-muted/30 border-border/40 text-muted-foreground/30 hover:border-rose-500/40"
                                    )}
                                >
                                    <Minus className={cn("w-6 h-6", adjustmentData.type === 'OUT' && "scale-110 animate-pulse")} />
                                    RETIRAR (-)
                                </button>
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-5">
                                    <label className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.5em] ml-10 italic">CANTIDAD EN SISTEMA ({adjustmentModal.ingredient.unit})</label>
                                    <div className="relative group/field">
                                        <input
                                            type="number"
                                            autoFocus
                                            className="w-full h-32 bg-muted/40 border-4 border-border rounded-[3.5rem] outline-none focus:border-primary transition-all font-black text-7xl italic text-foreground tracking-tighter text-center shadow-inner"
                                            placeholder="0"
                                            value={adjustmentData.quantity}
                                            onChange={(e) => setAdjustmentData({ ...adjustmentData, quantity: e.target.value })}
                                        />
                                        <span className="absolute right-12 top-1/2 -translate-y-1/2 text-2xl font-black opacity-10 italic uppercase">{adjustmentModal.ingredient.unit}</span>
                                    </div>
                                </div>
                                <div className="space-y-5">
                                    <label className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.5em] ml-10 italic">JUSTIFICACIÓN DEL AJUSTE</label>
                                    <textarea
                                        className="w-full h-40 bg-muted/40 border-4 border-border rounded-[3.5rem] p-10 font-black text-lg italic text-foreground placeholder:text-muted-foreground/10 outline-none resize-none transition-all shadow-inner uppercase tracking-tight"
                                        placeholder="DEFINE EL MOTIVO DEL CAMBIO EN STOCK..."
                                        value={adjustmentData.reason}
                                        onChange={(e) => setAdjustmentData({ ...adjustmentData, reason: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-8">
                                <Button variant="ghost" className="flex-1 h-24 rounded-[2.5rem] font-black uppercase tracking-[0.5em] italic text-muted-foreground/40 hover:bg-muted/10 transition-all" onClick={() => setAdjustmentModal({ isOpen: false, ingredient: null })}>ABORTAR</Button>
                                <Button
                                    onClick={submitAdjustment}
                                    disabled={submitting || !adjustmentData.quantity}
                                    className="flex-[2] h-24 rounded-[2.5rem] bg-foreground text-background font-black uppercase tracking-[0.4em] italic hover:bg-primary hover:text-white transition-all shadow-3xl text-xl border-none active:scale-95"
                                >
                                    {submitting ? <Loader2 className="w-10 h-10 animate-spin" /> : (
                                        <>
                                            <Save className="w-8 h-8 mr-6" /> AUTORIZAR CAMBIOSTOCK
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,102,0,0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,102,0,0.3); }
            `}</style>
        </div>
    )
}

function InventoryKPI({ label, value, icon, color, sub, highlight }: any) {
    return (
        <div className={cn(
            "bg-card border-4 p-10 rounded-[4rem] shadow-3xl relative overflow-hidden group transition-all duration-700",
            highlight ? "border-rose-500 shadow-rose-500/20 bg-rose-500/5 animate-pulse" : "border-border/40 hover:border-primary/40"
        )}>
            <div className={cn(
                "absolute -top-6 -right-6 p-12 opacity-[0.05] group-hover:scale-125 group-hover:rotate-12 group-hover:opacity-20 transition-all duration-1000",
                color
            )}>
                {icon}
            </div>

            <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-3">
                    <div className={cn("w-2 h-2 rounded-full", color.replace('text', 'bg'))} />
                    <p className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground italic leading-none">{label}</p>
                </div>
                <div className="space-y-2">
                    <span className="text-6xl font-black tracking-tighter italic text-foreground leading-none">{value}</span>
                    {sub && <p className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.3em] italic leading-none">{sub}</p>}
                </div>
            </div>
        </div>
    )
}
