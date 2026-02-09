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
    Flame
} from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { categories } from "@/lib/data"
import { cn } from "@/lib/utils"
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

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [stations, setStations] = useState<{ id: string, name: string }[]>([])
    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [showDeleted, setShowDeleted] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")

    const [formData, setFormData] = useState<Partial<Product & { station_id: string }>>({
        name: '', price: 0, category_id: categories[0]?.id || '', description: '', image_url: '', ingredients: [], station_id: ''
    })

    const fetchProducts = async () => {
        setLoading(true)
        const [prodRes, statRes] = await Promise.all([
            supabase.from('products').select('*').order('created_at', { ascending: false }),
            supabase.from('prep_stations').select('id, name').eq('is_active', true)
        ])

        if (prodRes.data) setProducts(prodRes.data as Product[])
        if (statRes.data) setStations(statRes.data)
        setLoading(false)
    }

    useEffect(() => { fetchProducts() }, [])

    const handleEdit = (product: Product & { station_id?: string }) => {
        setEditingId(product.id)
        setFormData({ ...product })
        setIsEditing(true)
    }

    const handleSave = async () => {
        if (!formData.name || !formData.price) return
        const productData = {
            name: formData.name,
            price: parseFloat(formData.price.toString()),
            category_id: formData.category_id,
            description: formData.description,
            image_url: formData.image_url,
            ingredients: formData.ingredients || [],
            station_id: formData.station_id || null,
            is_available: true
        }

        if (editingId) await supabase.from('products').update(productData).eq('id', editingId)
        else await supabase.from('products').insert([productData])

        setIsEditing(false)
        setEditingId(null)
        fetchProducts()
        toast.success("Catálogo sincronizado")
    }

    const handleDelete = async (id: string) => {
        if (!confirm("¿Mover a papelera?")) return
        await supabase.from('products').update({ deleted_at: new Date().toISOString() }).eq('id', id)
        fetchProducts()
        toast.info("Item movido a papelera")
    }

    const filteredProducts = products
        .filter(p => showDeleted ? p.deleted_at : !p.deleted_at)
        .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))

    if (loading && products.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-transparent">
                <div className="flex flex-col items-center gap-8 animate-in fade-in duration-1000">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
                        <Loader2 className="w-16 h-16 text-primary animate-spin relative z-10" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary italic animate-pulse">Indexando Catálogo Elite...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-transparent text-foreground p-4 md:p-12 font-sans selection:bg-primary selection:text-primary-foreground relative overflow-hidden">

            {/* 🌌 AMBIANCE LAYER */}
            <div className="fixed top-0 left-0 w-full h-[600px] bg-gradient-to-b from-primary/10 via-primary/[0.02] to-transparent pointer-events-none z-0" />
            <div className="fixed -bottom-40 -right-40 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none opacity-20 z-0 animate-pulse" />

            <div className="max-w-[1600px] mx-auto space-y-16 animate-in fade-in duration-1000 relative z-10">

                {/* 🚀 CATALOG COMMAND HEADER */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-12 border-b border-border/50 pb-12">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-10">
                        <Link href="/admin">
                            <Button variant="ghost" size="icon" className="h-20 w-20 rounded-[2.5rem] bg-card border border-border shadow-3xl hover:bg-muted active:scale-90 transition-all group overflow-hidden relative">
                                <ArrowLeft className="w-10 h-10 group-hover:-translate-x-1 transition-transform relative z-10" />
                            </Button>
                        </Link>
                        <div className="space-y-6">
                            <div className="flex flex-wrap items-center gap-4">
                                <h1 className="text-6xl md:text-7xl font-black italic tracking-tighter uppercase leading-none text-foreground">CATÁLOGO <span className="text-primary italic">MASTER</span></h1>
                                <div className="px-5 py-2 bg-primary/10 border-2 border-primary/20 rounded-[1.5rem] text-[11px] font-black text-primary tracking-[0.3em] italic uppercase shadow-xl animate-pulse flex items-center gap-3">
                                    <Sparkles className="w-4 h-4" />
                                    ELITE SKU_SYNC_ON
                                </div>
                            </div>
                            <p className="text-[11px] text-muted-foreground font-black uppercase tracking-[0.5em] italic flex items-center gap-4 opacity-60">
                                <Layers className="w-5 h-5 text-primary" /> Curaduría Gastronómica & Gestión de Atributos del Menú
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setShowDeleted(!showDeleted)}
                            className={cn(
                                "h-20 px-8 rounded-[2.5rem] border-4 flex items-center justify-center transition-all font-black text-[10px] tracking-[0.4em] italic gap-5 shadow-3xl group relative overflow-hidden active:scale-95",
                                showDeleted
                                    ? "bg-rose-500 border-rose-500 text-white hover:bg-rose-600"
                                    : "bg-card border-border/40 text-muted-foreground hover:border-primary/40 hover:text-primary"
                            )}
                        >
                            <div className="absolute inset-0 bg-current opacity-0 group-hover:opacity-10 transition-opacity" />
                            {showDeleted ? <RotateCcw className="w-6 h-6 group-hover:rotate-180 transition-transform duration-700" /> : <Archive className="w-6 h-6" />}
                            {showDeleted ? 'VER ACTIVOS_HUB' : 'ACCEDER PAPELERA'}
                        </button>
                        <Button
                            onClick={() => { setEditingId(null); setFormData({ name: '', price: 0, category_id: categories[0]?.id, ingredients: [] }); setIsEditing(true); }}
                            className="h-20 px-12 bg-foreground text-background hover:bg-primary hover:text-white font-black uppercase text-xs tracking-[0.4em] italic rounded-[2.5rem] shadow-3xl transition-all gap-5 border-none group active:scale-95"
                        >
                            <Plus className="w-7 h-7 group-hover:scale-110 transition-transform" />
                            INGRESAR PLATO ELITE
                        </Button>
                    </div>
                </div>

                {/* 🔍 GLOBAL FILTERS MESH */}
                <div className="flex flex-col lg:flex-row gap-8 bg-card/60 backdrop-blur-3xl p-8 rounded-[4rem] border-4 border-border/20 shadow-3xl relative overflow-hidden group/filters">
                    <div className="absolute inset-0 bg-primary/2 opacity-0 group-hover/filters:opacity-100 transition-opacity" />

                    <div className="flex-1 relative group/search">
                        <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground group-focus-within/search:text-primary transition-colors" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="FILTRAR MATRIZ DE PRODUCTOS POR ATRIBUTOS O SKU..."
                            className="w-full h-20 pl-20 pr-8 rounded-[2.5rem] bg-muted/40 border-4 border-border/40 focus:border-primary/50 outline-none font-black text-sm italic tracking-[0.2em] uppercase transition-all text-foreground placeholder:text-muted-foreground/20 shadow-inner"
                        />
                    </div>

                    <div className="flex items-center gap-4 relative z-10">
                        <Button variant="ghost" className="h-20 w-20 bg-card border-4 border-border/40 rounded-[2.5rem] hover:text-primary hover:border-primary/40 shadow-3xl transition-all group/btn active:scale-95">
                            <Filter className="w-8 h-8 group-hover:scale-110 transition-transform" />
                        </Button>
                        <Button variant="ghost" className="h-20 w-20 bg-card border-4 border-border/40 rounded-[2.5rem] hover:text-primary hover:border-primary/40 shadow-3xl transition-all group/btn active:scale-95">
                            <BarChart3 className="w-8 h-8 group-hover:scale-110 transition-transform" />
                        </Button>
                    </div>
                </div>

                {/* 🍱 SKU MASTER GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
                    {filteredProducts.map((p, idx) => (
                        <div
                            key={p.id}
                            className="bg-card border-4 border-border/40 rounded-[4.5rem] p-10 space-y-8 hover:border-primary/40 shadow-[0_30px_60px_rgba(0,0,0,0.3)] hover:shadow-primary/5 transition-all group/card relative overflow-hidden animate-in fade-in duration-700 active:scale-[0.98]"
                            style={{ animationDelay: `${idx * 50}ms` }}
                        >
                            {/* 🖼️ SKU VISUAL NODE */}
                            <div className="relative aspect-[1/1] w-full rounded-[3.5rem] overflow-hidden bg-muted/40 border-4 border-border/20 group-hover/card:border-primary/20 transition-all">
                                {p.image_url ? (
                                    <Image
                                        src={p.image_url}
                                        alt={p.name}
                                        fill
                                        className="object-cover group-hover/card:scale-110 transition-transform duration-1000 opacity-90 group-hover/card:opacity-100"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/10 group-hover/card:text-primary/10 transition-colors">
                                        <ChefHat className="w-24 h-24 mb-4" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.4em] italic">NULL_VISUAL_01</span>
                                    </div>
                                )}
                                <div className="absolute top-6 right-6 px-6 py-3 bg-foreground/90 backdrop-blur-3xl rounded-[1.5rem] text-xl font-black italic text-background border border-white/10 uppercase tracking-tighter shadow-2xl group-hover/card:bg-primary group-hover/card:text-white transition-all">
                                    ${p.price.toLocaleString()}
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
                            </div>

                            {/* 📄 SKU DATA MESH */}
                            <div className="space-y-6 relative z-10">
                                <div className="flex justify-between items-start gap-6">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2 opacity-40 group-hover/card:opacity-100 transition-opacity">
                                            <Signal className="w-3 h-3 text-primary animate-pulse" />
                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] italic">
                                                {categories.find(c => c.id === p.category_id)?.name || 'GENERIC SKU'}
                                            </span>
                                        </div>
                                        <h3 className="text-3xl font-black italic uppercase tracking-tighter text-foreground group-hover/card:text-primary transition-all truncate leading-tight">{p.name}</h3>
                                    </div>
                                    <button
                                        onClick={() => handleEdit(p)}
                                        className="shrink-0 w-16 h-16 rounded-2xl bg-muted/40 border-2 border-border/40 flex items-center justify-center hover:bg-foreground hover:text-background transition-all shadow-xl text-muted-foreground active:scale-75"
                                    >
                                        <Pencil className="w-7 h-7" />
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-2.5 min-h-[50px] overflow-hidden">
                                    {p.ingredients?.slice(0, 3).map((ing, i) => (
                                        <span key={i} className="px-4 py-1.5 bg-muted/40 rounded-xl text-[9px] font-black text-muted-foreground uppercase tracking-widest italic border border-border/20 group-hover/card:border-primary/10 transition-all">{ing}</span>
                                    ))}
                                    {p.ingredients && p.ingredients.length > 3 && (
                                        <span className="px-4 py-1.5 bg-primary/10 rounded-xl text-[9px] font-black text-primary uppercase tracking-widest italic border border-primary/20">+{p.ingredients.length - 3} COMPONENTS</span>
                                    )}
                                </div>

                                <div className="flex gap-4 pt-6 border-t-2 border-border/20 group-hover/card:border-primary/10 transition-colors">
                                    <Button className="flex-1 h-16 bg-muted/40 border-2 border-border/40 text-muted-foreground font-black uppercase text-[10px] tracking-[0.4em] italic rounded-2xl hover:bg-foreground hover:text-background transition-all shadow-xl group/btn active:scale-95 border-none">
                                        <Activity className="w-4 h-4 mr-3" /> ANALYZE
                                    </Button>
                                    {showDeleted ? (
                                        <Button onClick={() => supabase.from('products').update({ deleted_at: null }).eq('id', p.id).then(fetchProducts)} className="w-16 h-16 bg-emerald-500/10 text-emerald-500 border-2 border-emerald-500/20 rounded-2xl hover:bg-emerald-500 hover:text-white transition-all shadow-xl active:scale-75 border-none">
                                            <RotateCcw className="w-7 h-7" />
                                        </Button>
                                    ) : (
                                        <Button onClick={() => handleDelete(p.id)} className="w-16 h-16 bg-rose-500/10 text-rose-500 border-2 border-rose-500/20 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-xl active:scale-75 border-none">
                                            <Trash2 className="w-7 h-7" />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* 🏷️ STATUS INDICATOR */}
                            <div className="absolute bottom-6 left-10 flex items-center gap-2 opacity-20 group-hover/card:opacity-100 transition-opacity">
                                <div className={cn("w-2 h-2 rounded-full", p.is_available ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
                                <span className="text-[8px] font-black text-white uppercase tracking-widest italic">{p.is_available ? 'ONLINE_READY' : 'OFFLINE_BUSY'}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredProducts.length === 0 && !loading && (
                    <div className="py-56 flex flex-col items-center justify-center gap-12 bg-black/5 rounded-[6rem] border-4 border-dashed border-border/20">
                        <Box className="w-32 h-32 text-muted-foreground/10 animate-pulse" />
                        <div className="text-center space-y-4">
                            <p className="text-6xl font-black italic uppercase tracking-tighter text-muted-foreground/20 leading-none">Catalog_Empty_Exception</p>
                            <p className="text-[12px] font-black uppercase tracking-[0.8em] text-muted-foreground/10 italic">EL KERNEL NO DETECTA SKUS BAJO LOS PARÁMETROS DE FILTRADO SELECCIONADOS.</p>
                        </div>
                    </div>
                )}

                {/* 🏷️ GLOBAL METRIC */}
                <div className="p-10 bg-foreground rounded-[4rem] text-background flex flex-col md:flex-row items-center justify-between shadow-3xl group/metric relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover/metric:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-10 relative z-10">
                        <div className="w-20 h-20 rounded-[2rem] bg-background/10 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-2xl group-hover/metric:rotate-12 transition-transform duration-500">
                            <Flame className="w-10 h-10 text-primary drop-shadow-[0_0_15px_rgba(255,77,0,0.6)]" />
                        </div>
                        <div className="space-y-2 text-center md:text-left">
                            <h4 className="text-2xl font-black italic uppercase tracking-tighter text-primary">Master Catalog Hub</h4>
                            <p className="text-[10px] text-background/40 font-black uppercase tracking-[0.4em] italic leading-none">
                                SYSTEM v8.42 • KERNEL OPTIMIZED FOR SKU ATTRIBUTE INTEGRITY
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-12 mt-8 md:mt-0 relative z-10">
                        <div className="text-right">
                            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white/20 mb-1 italic">Active SKU</p>
                            <p className="text-2xl font-black italic tracking-tighter text-emerald-500">{products.length} ITEMS</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white/20 mb-1 italic">Node Region</p>
                            <p className="text-2xl font-black italic tracking-tighter text-white">SA-EAST_CORE</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 🛠️ SKU MODAL REFINED */}
            {isEditing && (
                <div className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-card border-4 border-primary/20 rounded-[5rem] w-full max-w-[1700px] h-[90vh] overflow-hidden flex flex-col shadow-[0_0_150px_rgba(255,102,0,0.15)] animate-in zoom-in-95 duration-500 relative">

                        {/* HEADER HUB */}
                        <div className="p-16 border-b-4 border-border/40 bg-muted/20 flex justify-between items-center relative overflow-hidden group/modal-head">
                            <div className="absolute top-0 right-0 p-16 opacity-[0.03] pointer-events-none -mr-16 -mt-16 group-hover/modal-head:scale-110 transition-transform duration-1000 rotate-12">
                                <MonitorIcon className="w-[450px] h-[450px]" />
                            </div>

                            <div className="space-y-4 relative z-10">
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-[2.5rem] bg-primary text-black flex items-center justify-center shadow-3xl">
                                        <ChefHat className="w-10 h-10" />
                                    </div>
                                    <h2 className="text-6xl font-black italic uppercase tracking-tighter text-white leading-none">MASTER <span className="text-primary italic">SKU EDITOR</span></h2>
                                </div>
                                <p className="text-[11px] font-black text-primary/40 uppercase tracking-[0.6em] italic pl-28 italic">INTEGRACIÓN DE ATRIBUTOS GASTRONÓMICOS & KDS</p>
                            </div>
                            <Button variant="ghost" className="h-20 w-20 rounded-[2.5rem] bg-white/5 hover:bg-primary hover:text-white transition-all active:scale-90 relative z-10 border-none" onClick={() => setIsEditing(false)}>
                                <X className="w-10 h-10" />
                            </Button>
                        </div>

                        {/* CONTENT CORE */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-16">
                            <div className="grid lg:grid-cols-2 gap-20">

                                {/* LEFT CORE: METADATA */}
                                <div className="space-y-12">
                                    <div className="space-y-6 group/field">
                                        <label className="text-[11px] font-black text-white/20 uppercase tracking-[0.5em] ml-12 italic group-hover/field:text-primary transition-colors flex items-center gap-4">
                                            <Signal className="w-4 h-4" /> DENOMINACIÓN DEL PLATO_MASTER
                                        </label>
                                        <input
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full h-28 bg-muted/40 border-4 border-border/40 rounded-[3.5rem] px-12 outline-none text-white focus:border-primary font-black italic text-5xl tracking-tighter shadow-inner transition-all placeholder:text-white/5 uppercase"
                                            placeholder="EJ: PARGO ROJO BRASEADO_XLR"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                        <div className="space-y-6 group/field">
                                            <label className="text-[11px] font-black text-white/20 uppercase tracking-[0.5em] ml-12 italic group-hover/field:text-primary transition-colors flex items-center gap-4">
                                                <DollarSign className="w-4 h-4" /> COSTO_SKU (COP)
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={formData.price}
                                                    onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                                                    className="w-full h-24 bg-muted/40 border-4 border-border/40 rounded-[3rem] px-16 outline-none text-primary font-black italic text-4xl tracking-tighter shadow-inner transition-all tabular-nums"
                                                />
                                                <span className="absolute left-8 top-1/2 -translate-y-1/2 text-2xl font-black opacity-10 italic">$</span>
                                            </div>
                                        </div>
                                        <div className="space-y-6 group/field">
                                            <label className="text-[11px] font-black text-white/20 uppercase tracking-[0.5em] ml-12 italic group-hover/field:text-primary transition-colors flex items-center gap-4">
                                                <Layers className="w-4 h-4" /> CLASIFICACIÓN_CLUSTER
                                            </label>
                                            <div className="relative">
                                                <select
                                                    value={formData.category_id}
                                                    onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                                                    className="w-full h-24 bg-muted/40 border-4 border-border/40 rounded-[3rem] px-12 outline-none text-white focus:border-primary font-black uppercase italic tracking-[0.2em] text-sm cursor-pointer shadow-inner transition-all appearance-none"
                                                >
                                                    {categories.map(c => <option key={c.id} value={c.id} className="bg-card text-white uppercase">{c.name.toUpperCase()}</option>)}
                                                </select>
                                                <ChevronRight className="absolute right-8 top-1/2 -translate-y-1/2 w-6 h-6 text-white/10 pointer-events-none rotate-90" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                        <div className="space-y-6 group/field">
                                            <label className="text-[11px] font-black text-white/20 uppercase tracking-[0.5em] ml-12 italic group-hover/field:text-primary transition-colors flex items-center gap-4">
                                                <Activity className="w-4 h-4" /> ESTACIÓN KDS_NODE
                                            </label>
                                            <div className="relative">
                                                <select
                                                    value={formData.station_id || ''}
                                                    onChange={e => setFormData({ ...formData, station_id: e.target.value })}
                                                    className="w-full h-24 bg-muted/40 border-4 border-border/40 rounded-[3rem] px-12 outline-none text-white focus:border-primary font-black uppercase italic tracking-[0.2em] text-sm cursor-pointer shadow-inner transition-all appearance-none"
                                                >
                                                    <option value="" className="bg-card text-white uppercase">SIN ASIGNACIÓN_NODE</option>
                                                    {stations.map(s => <option key={s.id} value={s.id} className="bg-card text-white uppercase">{s.name.toUpperCase()}</option>)}
                                                </select>
                                                <ChevronRight className="absolute right-8 top-1/2 -translate-y-1/2 w-6 h-6 text-white/10 pointer-events-none rotate-90" />
                                            </div>
                                        </div>
                                        <div className="space-y-6 group/field">
                                            <label className="text-[11px] font-black text-white/20 uppercase tracking-[0.5em] ml-12 italic group-hover/field:text-primary transition-colors flex items-center gap-4">
                                                <Camera className="w-4 h-4" /> VISUAL_ASSET_URL
                                            </label>
                                            <input
                                                value={formData.image_url || ''}
                                                onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                                                className="w-full h-24 bg-muted/40 border-4 border-border/40 rounded-[3rem] px-12 outline-none text-white/50 focus:border-primary font-mono text-xs shadow-inner transition-all placeholder:text-white/5"
                                                placeholder="HTTPS://ASSETS.SERVER/IMAGE_MASTER.JPG"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT CORE: RECIPE & DESCRIPTION */}
                                <div className="space-y-12">
                                    <div className="space-y-6 group/field">
                                        <label className="text-[11px] font-black text-white/20 uppercase tracking-[0.5em] ml-12 italic group-hover/field:text-primary transition-colors flex items-center gap-4">
                                            <ChefHat className="w-4 h-4" /> MATRIZ DE COMPONENTES (RECETA_SYS)
                                        </label>
                                        <textarea
                                            value={formData.ingredients?.join(', ')}
                                            onChange={e => setFormData({ ...formData, ingredients: e.target.value.split(',').map(i => i.trim()) })}
                                            className="w-full h-48 bg-muted/40 border-4 border-border/40 rounded-[4rem] p-12 outline-none text-white focus:border-primary font-black italic text-lg shadow-inner resize-none transition-all placeholder:text-white/5 uppercase tracking-wide leading-relaxed"
                                            placeholder="ASIGNA LOS COMPONENTES TÁCTICOS SEPARADOS POR COMA..."
                                        />
                                    </div>
                                    <div className="space-y-6 group/field">
                                        <label className="text-[11px] font-black text-white/20 uppercase tracking-[0.5em] ml-12 italic group-hover/field:text-primary transition-colors flex items-center gap-4">
                                            <Sparkles className="w-4 h-4" /> STORYTELLING & NOTAS DEL CHEF
                                        </label>
                                        <textarea
                                            value={formData.description || ''}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full h-56 bg-muted/40 border-4 border-border/40 rounded-[4rem] p-12 outline-none text-white focus:border-primary font-black italic text-lg shadow-inner resize-none transition-all placeholder:text-white/5 uppercase tracking-wide leading-relaxed"
                                            placeholder="DESCRIBE LA MÍSTICA Y EL VALOR DIFERENCIAL DEL SKU..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* FOOTER HUB */}
                        <div className="p-12 bg-muted/20 border-t-4 border-border/40 flex flex-col md:flex-row gap-8 relative z-10">
                            <Button
                                variant="ghost"
                                onClick={() => setIsEditing(false)}
                                className="flex-1 h-28 rounded-[3rem] font-black uppercase tracking-[0.6em] italic text-white/20 hover:bg-white/5 transition-all text-sm group"
                            >
                                <ArrowLeft className="w-6 h-6 mr-4 group-hover:-translate-x-2 transition-transform" /> ABORTAR EDICIÓN
                            </Button>
                            <Button
                                onClick={handleSave}
                                className="flex-[2] h-28 bg-foreground text-background rounded-[3rem] font-black uppercase italic text-3xl tracking-tighter shadow-3xl shadow-primary/20 hover:bg-primary hover:text-white transition-all border-none group active:scale-95"
                            >
                                <Save className="w-10 h-10 mr-8 group-hover:scale-110 transition-transform" /> SALVAR SKU_MASTER PRO
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,102,0,0.1); border-radius: 20px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,102,0,0.3); }
                @keyframes bounce-in {
                    0% { transform: scale(0.3); opacity: 0; }
                    50% { transform: scale(1.05); opacity: 0.8; }
                    70% { transform: scale(0.9); opacity: 0.9; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .animate-in.bounce-in { animation: bounce-in 0.8s cubic-bezier(0.250, 0.460, 0.450, 0.940) both; }
            `}</style>
        </div>
    )
}
