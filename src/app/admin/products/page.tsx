"use client"

import { Button } from "@/components/ui/button"
import {
    Plus,
    Pencil,
    Trash2,
    Search,
    X,
    Loader2,
    Save,
    RotateCcw,
    Archive,
    Zap,
    Filter,
    Camera,
    BarChart3,
    MoreHorizontal,
    DollarSign,
    ShieldCheck,
    TrendingUp,
    Clock,
    Activity,
    ChefHat,
    Layers,
    Signal,
    Box,
    Sparkles,
    ChevronRight,
    ArrowLeft,
    MonitorIcon,
    Flame,
    Utensils,
    Globe,
    Star
} from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { categories } from "@/lib/data"
import { cn, formatPrice } from "@/lib/utils"
import Link from "next/link"
import { toast } from "sonner"

type Product = {
    id: string
    name: string
    category_id: string
    price: number
    description: string | null
    image_url: string | null
    is_available: boolean
    ingredients: string[] | null
    deleted_at: string | null
    created_at: string
}

export default function AdminProductsPremium() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        fetchProducts()
    }, [])

    const fetchProducts = async () => {
        setLoading(true)
        const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
        if (data) setProducts(data as Product[])
        setLoading(false)
    }

    const filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))

    return (
        <div className="min-h-screen bg-[#020406] text-white font-sans selection:bg-orange-500 overflow-hidden flex flex-col h-screen relative">

            {/* 🌌 FONDO ESTRUCTURAL AURA */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-orange-500/5 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full opacity-50" />
            </div>

            {/* HEADER DE INGENIERÍA ELITE */}
            <div className="relative z-30 p-10 flex items-center justify-between border-b border-white/5 bg-slate-900/40 backdrop-blur-3xl shrink-0">
                <div className="flex items-center gap-8">
                    <Link href="/admin/hub">
                        <Button variant="ghost" size="icon" className="h-16 w-16 rounded-[1.5rem] bg-white/5 border border-white/5 hover:bg-orange-600 hover:text-black transition-all group">
                            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-orange-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-orange-500 italic">Menu Intelligence System</span>
                        </div>
                        <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none text-white">Catalog <span className="text-orange-500">Studio</span></h1>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <div className="relative w-96 group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-700 group-focus-within:text-orange-500 transition-all font-black" />
                        <input
                            placeholder="ESCANEAR CATÁLOGO DIGITAL..."
                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-5 pl-16 pr-6 text-xs font-black uppercase tracking-[0.2em] italic focus:outline-none focus:border-orange-500/30 transition-all placeholder:text-slate-800"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button className="h-16 px-12 bg-orange-600 hover:bg-orange-500 text-black font-black uppercase text-xs italic tracking-widest rounded-2xl shadow-3xl shadow-orange-600/20 active:scale-95 transition-all gap-4">
                        <Plus className="w-6 h-6" /> CREAR PROTOCOLO
                    </Button>
                </div>
            </div>

            <div className="relative z-10 p-8 flex-1 overflow-hidden flex flex-col gap-8 max-w-[1800px] mx-auto w-full">

                {/* 1. PRODUCT METRICS ELITE */}
                <div className="grid grid-cols-4 gap-8 shrink-0">
                    {[
                        { label: 'SKUS ACTIVOS', val: products.length, icon: Layers, color: 'text-white', sub: 'Deployment' },
                        { label: 'DISPONIBILIDAD', val: '98%', icon: Signal, color: 'text-emerald-500', sub: 'Active_Nodes' },
                        { label: 'COSTO PROM.', val: '$14.2k', icon: DollarSign, color: 'text-orange-500', sub: 'Market_Index' },
                        { label: 'SALUD DEL MENÚ', val: 'ÓPTIMA', icon: Star, color: 'text-amber-500', sub: 'Performance' },
                    ].map((card, i) => (
                        <div key={i} className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 flex items-center gap-8 group hover:border-orange-500/20 transition-all duration-700 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.02] transition-transform group-hover:rotate-12 duration-1000">
                                <card.icon className="w-20 h-20" />
                            </div>
                            <div className="p-5 bg-white/5 rounded-2xl group-hover:bg-orange-600 group-hover:text-black transition-all">
                                <card.icon className={cn("w-7 h-7", card.color, "group-hover:text-inherit")} />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className={cn("w-1.5 h-1.5 rounded-full", card.color.replace('text', 'bg'))} />
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] italic">{card.label}</p>
                                </div>
                                <p className={cn("text-4xl font-black italic tracking-tighter leading-none text-white")}>{card.val}</p>
                                <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.3em] mt-1.5 italic transition-colors group-hover:text-slate-500">{card.sub}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 2. PRODUCT GRID (THE GALLERY) */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-6 pb-12">
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-10">
                        {filtered.map((prod, i) => (
                            <div key={prod.id} className="group/card relative bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[4rem] overflow-hidden flex flex-col h-[480px] hover:border-orange-500/30 hover:shadow-3xl transition-all duration-500 cursor-pointer shadow-2xl relative">

                                {/* Status Chip Overlay */}
                                <div className="absolute top-6 left-6 z-30 pointer-events-none">
                                    <div className={cn(
                                        "px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] backdrop-blur-2xl border italic shadow-2xl",
                                        prod.is_available ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                                    )}>
                                        {prod.is_available ? 'In_Stock' : 'Depleted'}
                                    </div>
                                </div>

                                {/* Image Canvas with Deep Gradient */}
                                <div className="h-56 relative overflow-hidden bg-black/40">
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent z-10 opacity-80" />
                                    {prod.image_url ? (
                                        <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-1000" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center opacity-[0.03] group-hover/card:opacity-[0.08] transition-opacity">
                                            <Utensils className="w-24 h-24 mb-4" />
                                            <span className="text-4xl font-black italic tracking-tighter uppercase">NO_IMAGE</span>
                                        </div>
                                    )}
                                    <div className="absolute bottom-6 left-10 z-20">
                                        <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.5em] italic drop-shadow-lg leading-none mb-1">
                                            {categories.find(c => c.id === prod.category_id)?.name || 'General_Protocol'}
                                        </p>
                                    </div>
                                </div>

                                {/* Content Elite Section */}
                                <div className="p-10 flex-1 flex flex-col justify-between relative z-20">
                                    <div className="space-y-4">
                                        <h3 className="text-2xl font-black italic tracking-tighter uppercase leading-[0.9] line-clamp-2 group-hover/card:text-orange-500 transition-colors">
                                            {prod.name}
                                        </h3>
                                        <div className="flex gap-4">
                                            <div className="flex items-center gap-2 text-[8px] font-black text-slate-600 uppercase tracking-widest italic leading-none"><Layers className="w-3 h-3" /> SKU_102</div>
                                            <div className="flex items-center gap-2 text-[8px] font-black text-slate-600 uppercase tracking-widest italic leading-none"><Box className="w-3 h-3" /> DEP_HUB</div>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-white/5 flex items-end justify-between">
                                        <div className="space-y-1">
                                            <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.4em] italic leading-none">Market_Value</p>
                                            <p className="text-4xl font-black italic tracking-tighter text-white font-mono leading-none">{formatPrice(prod.price)}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="h-12 w-12 rounded-2xl bg-white/5 border border-white/5 text-slate-600 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center active:scale-90">
                                                <Pencil className="w-5 h-5" />
                                            </button>
                                            <button className="h-12 w-12 rounded-2xl bg-rose-500/5 border border-white/5 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 transition-all flex items-center justify-center active:scale-90">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { 
                    background: rgba(255, 255, 255, 0.05); 
                    border-radius: 10px; 
                }
            `}</style>
        </div>
    )
}
