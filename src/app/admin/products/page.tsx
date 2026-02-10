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
        <div className="min-h-screen text-white font-sans relative overflow-hidden flex flex-col h-screen">

            {/* 🖼️ FONDO PREMIUM: Splash Culinario / Ingredientes Pro con Blur */}
            <div className="fixed inset-0 bg-[url('https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center scale-105 pointer-events-none" />
            <div className="fixed inset-0 backdrop-blur-[100px] bg-slate-950/90 pointer-events-none" />

            {/* HEADER DE INGENIERÍA */}
            <div className="relative z-20 p-8 flex items-center justify-between border-b border-white/5 bg-slate-950/40 backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-6">
                    <Link href="/admin">
                        <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10">
                            <ArrowLeft className="w-6 h-6 text-slate-400" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none">CATALOG <span className="text-orange-500">STUDIO</span></h1>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] mt-2 italic flex items-center gap-3">
                            MENU ENGINEERING & DIGITAL SHOWCASE
                            <Sparkles className="w-3 h-3 text-orange-500" />
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="relative w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-orange-500 transition-colors" />
                        <input
                            placeholder="Buscar en el catálogo..."
                            className="w-full bg-slate-800/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-orange-500/50"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button className="h-14 px-10 bg-orange-600 hover:bg-orange-700 text-black font-black uppercase text-[10px] italic tracking-widest rounded-2xl shadow-xl shadow-orange-600/30">
                        <Plus className="w-5 h-5 mr-3" /> CREAR PRODUCTO
                    </Button>
                </div>
            </div>

            <div className="relative z-10 p-8 flex-1 overflow-hidden flex flex-col gap-8 max-w-[1800px] mx-auto w-full">

                {/* 1. PRODUCT METRICS */}
                <div className="grid grid-cols-4 gap-6 shrink-0">
                    {[
                        { label: 'SKUS ACTIVOS', val: products.length, icon: Layers, color: 'text-white' },
                        { label: 'DISPONIBILIDAD', val: '98%', icon: Signal, color: 'text-emerald-400' },
                        { label: 'COSTO PROM.', val: '$14.2k', icon: DollarSign, color: 'text-orange-500' },
                        { label: 'SALUD DEL MENÚ', val: 'ÓPTIMA', icon: Star, color: 'text-yellow-400' },
                    ].map((card, i) => (
                        <div key={i} className="bg-slate-800/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex items-center gap-6 group hover:scale-[1.02] transition-all">
                            <div className="p-4 bg-white/5 rounded-2xl group-hover:bg-orange-500/10 transition-all">
                                <card.icon className={cn("w-6 h-6", card.color)} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{card.label}</p>
                                <p className={cn("text-3xl font-black italic tracking-tighter", card.color)}>{card.val}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 2. PRODUCT GRID (THE GALLERY) */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 pb-10">
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                        {filtered.map((prod, i) => (
                            <div key={prod.id} className="group relative bg-slate-900/60 backdrop-blur-3xl border border-white/5 rounded-[3rem] overflow-hidden flex flex-col h-[380px] hover:border-orange-500/40 transition-all cursor-pointer">
                                {/* Image Canvas */}
                                <div className="h-48 relative overflow-hidden bg-slate-800">
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent z-10 opacity-60" />
                                    {prod.image_url ? (
                                        <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center opacity-10">
                                            <Utensils className="w-20 h-20" />
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4 z-20">
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border backdrop-blur-md",
                                            prod.is_available ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                                        )}>
                                            {prod.is_available ? 'AVAILABLE' : 'OUT_OF_STOCK'}
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-8 flex-1 flex flex-col justify-between">
                                    <div>
                                        <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest italic mb-2">
                                            {categories.find(c => c.id === prod.category_id)?.name || 'General'}
                                        </p>
                                        <h3 className="text-xl font-black italic tracking-tighter uppercase leading-tight line-clamp-2 group-hover:text-white transition-colors">
                                            {prod.name}
                                        </h3>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-2xl font-black italic tracking-tighter font-mono">{formatPrice(prod.price)}</p>
                                        <div className="flex gap-2">
                                            <button className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all">
                                                <Trash2 className="w-4 h-4" />
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
