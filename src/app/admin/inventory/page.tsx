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
        <div className="min-h-screen text-white font-sans relative overflow-hidden">

            {/* 🖼️ FONDO AMBIENTE (Coherente con KDS) */}
            <div className="fixed inset-0 bg-[url('https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center scale-110 pointer-events-none" />
            <div className="fixed inset-0 backdrop-blur-[60px] bg-slate-950/90 pointer-events-none" />

            <div className="relative z-10 p-8 space-y-8 max-w-[1600px] mx-auto">

                {/* HEADER TÉCNICO */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/admin">
                            <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl bg-slate-800/40 border border-white/5 hover:bg-slate-700">
                                <ArrowLeft className="w-6 h-6 text-slate-400" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">KERNEL <span className="text-slate-400">INVENTARIO</span></h1>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-[0.3em]">SUPPLY CHAIN SYNC_ACTIVE</span>
                                <Signal className="w-3 h-3 text-orange-500 animate-pulse" />
                            </div>
                        </div>
                    </div>
                    <Button className="h-14 px-8 bg-orange-600 hover:bg-orange-700 text-black font-black uppercase text-xs italic tracking-widest rounded-2xl shadow-xl shadow-orange-600/20">
                        <Plus className="w-5 h-5 mr-3" /> AGREGAR INSUMO
                    </Button>
                </div>

                {/* BOTONES DE ACCESO RÁPIDO (Estilo Mockup) */}
                <div className="grid grid-cols-4 gap-4">
                    {[
                        { label: 'LIBRO DE RECETAS', icon: ChefHat, href: '/admin/inventory/recipes' },
                        { label: 'PROVEEDORES', icon: Truck, href: '#' },
                        { label: 'CONTROL DE MERMAS', icon: Activity, href: '#' },
                        { label: 'ENTRADA DE SUMINISTROS', icon: Warehouse, href: '#' }
                    ].map((btn, i) => (
                        <Link key={i} href={btn.href}>
                            <button className="w-full flex items-center gap-4 p-5 bg-slate-800/40 backdrop-blur-md rounded-2xl border border-white/5 hover:border-orange-500/50 hover:bg-slate-700/50 transition-all group">
                                <div className="p-3 bg-orange-500/10 rounded-xl group-hover:bg-orange-500/20 transition-colors">
                                    <btn.icon className="w-5 h-5 text-orange-400" />
                                </div>
                                <span className="text-xs font-black tracking-widest uppercase italic">{btn.label}</span>
                            </button>
                        </Link>
                    ))}
                </div>

                {/* KPI CARDS (Estilo Mockup) */}
                <div className="grid grid-cols-4 gap-6">
                    {[
                        { label: 'TOTAL REFERENCIAS', val: ingredients.length, icon: Package, color: 'text-white' },
                        { label: 'STOCK CRÍTICO', val: criticalCount, icon: AlertCircle, color: 'text-red-500' },
                        { label: 'VALORACIÓN TOTAL', val: `$${(totalCost / 1000).toFixed(1)}k`, icon: DollarSign, color: 'text-emerald-400' },
                        { label: 'CATEGORÍAS', val: new Set(ingredients.map(i => i.category)).size, icon: Layers, color: 'text-blue-400' }
                    ].map((card, i) => (
                        <div key={i} className="bg-slate-800/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <card.icon className="w-12 h-12" />
                            </div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">{card.label}</p>
                            <p className={cn("text-4xl font-black italic", card.color)}>{card.val}</p>
                            <div className="mt-4 h-1 w-full bg-slate-700/30 rounded-full overflow-hidden">
                                <div className={cn("h-full bg-current opacity-40", card.color)} style={{ width: '60%' }} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* TABLA COMMAND (Estilo Mockup) */}
                <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] overflow-hidden">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <div className="relative w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                placeholder="Buscar Referencia_Item..."
                                className="w-full bg-slate-800/50 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-orange-500/50 transition-all"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="ghost" className="rounded-xl border border-white/5 text-slate-400">
                            <Filter className="w-4 h-4 mr-2" /> Filtrar
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
                                                    <button className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white border border-white/5">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-orange-500 border border-white/5">
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
