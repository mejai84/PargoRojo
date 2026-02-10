"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
    Plus,
    Package,
    Search,
    Filter,
    ArrowLeft,
    Edit,
    Trash2,
    ChefHat,
    DollarSign,
    Loader2,
    Activity,
    Signal,
    ChevronRight,
    Truck,
    Layers,
    Warehouse,
    AlertCircle,
    MoreHorizontal
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useRestaurant } from "@/providers/RestaurantProvider"

type Ingredient = {
    id: string
    name: string
    unit: string
    current_stock: number
    min_stock: number
    cost_per_unit: number
    category: string
}

export default function InventoryPage() {
    const { restaurant } = useRestaurant()
    const [ingredients, setIngredients] = useState<Ingredient[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        if (restaurant) loadIngredients()
    }, [restaurant])

    const loadIngredients = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('ingredients')
            .select('*')
            .eq('restaurant_id', restaurant?.id)
            .eq('active', true)
            .order('name', { ascending: true })

        if (!error) setIngredients(data || [])
        setLoading(false)
    }

    const getStatusInfo = (current: number, min: number) => {
        if (current <= 0) return { label: 'Sin Stock', color: 'bg-red-500', text: 'text-red-400' }
        if (current <= min) return { label: 'Crítico', color: 'bg-red-500', text: 'text-red-400' }
        if (current <= min * 1.5) return { label: 'Bajo', color: 'bg-yellow-500', text: 'text-yellow-400' }
        return { label: 'Óptimo', color: 'bg-emerald-500', text: 'text-emerald-400' }
    }

    const filtered = ingredients.filter(i =>
        i.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const totalCost = ingredients.reduce((acc, curr) => acc + (curr.current_stock * curr.cost_per_unit), 0)
    const criticalCount = ingredients.filter(i => i.current_stock <= i.min_stock).length

    return (
        <div className="min-h-screen bg-[#020406] text-white font-sans selection:bg-orange-500 overflow-hidden flex flex-col h-screen relative">

            {/* 🌌 FONDO ESTRUCTURAL AURA */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-orange-500/5 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full opacity-50" />
            </div>

            <div className="relative z-30 p-10 md:p-12 space-y-12 max-w-[1800px] mx-auto flex-1 min-h-full flex flex-col">

                {/* HEADER TÉCNICO ELITE */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link href="/admin/hub">
                            <Button variant="ghost" size="icon" className="h-16 w-16 rounded-[1.5rem] bg-white/5 border border-white/5 hover:bg-orange-600 hover:text-black transition-all group">
                                <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Signal className="w-4 h-4 text-orange-500 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-orange-500 italic">Core Supply Intelligence</span>
                            </div>
                            <h1 className="text-6xl font-black italic tracking-tighter uppercase leading-none text-white text-glow">Kernel <span className="text-orange-500">Inventory</span></h1>
                        </div>
                    </div>
                    <Button
                        onClick={() => toast.success("ABRIENDO EDITOR DE NUEVO INSUMO")}
                        className="h-16 px-12 bg-orange-600 hover:bg-orange-500 text-black font-black uppercase text-xs italic tracking-widest rounded-2xl shadow-3xl shadow-orange-600/20 transition-all active:scale-95 gap-4"
                    >
                        <Plus className="w-6 h-6" /> ADQUIRIR PROTOCOLO
                    </Button>
                </div>

                {/* BOTONES DE ACCESO RÁPIDO ELITE */}
                <div className="grid grid-cols-4 gap-8">
                    {[
                        { label: 'LIBRO DE RECETAS', icon: ChefHat, href: '/admin/inventory/recipes', sub: 'Recipe_Engine' },
                        { label: 'PROVEEDORES', icon: Truck, onClick: () => toast.info("MÓDULO DE PROVEEDORES"), sub: 'Vendor_Matrix' },
                        { label: 'CONTROL DE MERMAS', icon: Activity, onClick: () => toast.info("CONTRO DE MERMAS: Registro Activo"), sub: 'Loss_Analysis' },
                        { label: 'ENTRADA SUMINISTROS', icon: Warehouse, onClick: () => toast.info("MODULO DE ENTRADA: Supply Chain"), sub: 'Ingress_Portal' }
                    ].map((btn, i) => {
                        const Content = (
                            <div className="w-full h-24 flex items-center justify-between p-8 bg-slate-900/40 backdrop-blur-3xl rounded-[2rem] border border-white/5 hover:border-orange-500/30 hover:bg-orange-600 group transition-all duration-500 cursor-pointer shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:rotate-12 transition-transform duration-1000">
                                    <btn.icon className="w-16 h-16" />
                                </div>
                                <div className="flex items-center gap-6 relative z-10 transition-all group-hover:translate-x-1">
                                    <div className="p-4 bg-white/5 rounded-xl group-hover:bg-black/10 transition-colors">
                                        <btn.icon className="w-6 h-6 text-orange-400 group-hover:text-black" />
                                    </div>
                                    <div className="space-y-1 text-left">
                                        <p className="text-[11px] font-black tracking-[0.2em] uppercase italic text-white group-hover:text-black leading-none">{btn.label}</p>
                                        <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-600 group-hover:text-black/50 leading-none">{btn.sub}</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-800 group-hover:text-black/30 group-hover:translate-x-1 transition-all" />
                            </div>
                        );
                        return btn.href ? (
                            <Link key={i} href={btn.href} className="block">{Content}</Link>
                        ) : (
                            <button key={i} onClick={btn.onClick} className="block w-full">{Content}</button>
                        );
                    })}
                </div>

                {/* KPI CARDS ELITE */}
                <div className="grid grid-cols-4 gap-8">
                    {[
                        { label: 'REFERENCIAS', val: ingredients.length, icon: Package, color: 'text-white', sub: 'Active_Nodes' },
                        { label: 'STOCK CRÍTICO', val: criticalCount, icon: AlertCircle, color: 'text-rose-500', sub: 'At_Risk' },
                        { label: 'VALORACIÓN', val: `$${(totalCost / 1000).toFixed(1)}k`, icon: DollarSign, color: 'text-orange-500', sub: 'Market_Index' },
                        { label: 'CATEGORÍAS', val: new Set(ingredients.map(i => i.category)).size, icon: Layers, color: 'text-blue-500', sub: 'Cluster_Map' }
                    ].map((card, i) => (
                        <div key={i} className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-8 relative overflow-hidden group shadow-2xl transition-all duration-700 hover:border-orange-500/20">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:rotate-12 transition-transform duration-1000">
                                <card.icon className="w-20 h-20" />
                            </div>
                            <div className="relative z-10 space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className={cn("w-1.5 h-1.5 rounded-full", card.color.replace('text', 'bg'))} />
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic leading-none">{card.label}</p>
                                </div>
                                <p className={cn("text-4xl font-black italic tracking-tighter text-white leading-none")}>{card.val}</p>
                                <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.3em] italic group-hover:text-slate-500 transition-colors">{card.sub}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* TABLA COMMAND ELITE */}
                <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[4rem] overflow-hidden flex-1 flex flex-col shadow-3xl">
                    <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                        <div className="relative w-[500px] group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-700 group-focus-within:text-orange-500 transition-all font-black" />
                            <input
                                type="search"
                                autoComplete="new-password"
                                placeholder="ESCANEAR REGISTROS DE KERNEL..."
                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-5 pl-16 pr-8 text-xs font-black uppercase tracking-[0.2em] italic focus:outline-none focus:border-orange-500/30 transition-all placeholder:text-slate-800"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button
                            onClick={() => toast.info("FILTROS AVANZADOS")}
                            variant="ghost" className="h-16 px-10 rounded-2xl bg-white/5 border border-white/5 text-slate-500 font-black uppercase italic text-[10px] tracking-[0.3em] transition-all hover:bg-white/10 hover:text-white"
                        >
                            <Filter className="w-5 h-5 mr-4" /> Filtrar
                        </Button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/[0.02]">
                                    <th className="p-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">Referencia_Item</th>
                                    <th className="p-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">Cluster_Cat</th>
                                    <th className="p-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">Availability_Metric</th>
                                    <th className="p-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest italic text-center">Health_Status</th>
                                    <th className="p-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest italic text-right">Command</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((item) => {
                                    const status = getStatusInfo(item.current_stock, item.min_stock)
                                    return (
                                        <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors group">
                                            <td className="p-6">
                                                <p className="font-bold text-slate-100">{item.name}</p>
                                            </td>
                                            <td className="p-6">
                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{item.category}</span>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-bold text-slate-200">{item.current_stock} {item.unit}</span>
                                                    <span className={cn("text-[10px] font-black uppercase tracking-tighter opacity-70", status.text)}>({status.label})</span>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex justify-center">
                                                    <div className={cn("w-3 h-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]", status.color, "animate-pulse")} />
                                                </div>
                                            </td>
                                            <td className="p-6 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => toast.success(`EDITANDO: ${item.name}`)}
                                                        className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white border border-white/5"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => toast.info(`MÁS OPCIONES: ${item.name}`)}
                                                        className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-orange-500 border border-white/5"
                                                    >
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
