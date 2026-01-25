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
    DollarSign
} from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { categories } from "@/lib/data"
import { cn } from "@/lib/utils"

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
    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [showDeleted, setShowDeleted] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")

    const [formData, setFormData] = useState<Partial<Product>>({
        name: '', price: 0, category_id: categories[0]?.id || '', description: '', image_url: '', ingredients: []
    })

    const fetchProducts = async () => {
        setLoading(true)
        const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
        if (data) setProducts(data as Product[])
        setLoading(false)
    }

    useEffect(() => { fetchProducts() }, [])

    const handleEdit = (product: Product) => {
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
            is_available: true
        }

        if (editingId) await supabase.from('products').update(productData).eq('id', editingId)
        else await supabase.from('products').insert([productData])

        setIsEditing(false); setEditingId(null); fetchProducts()
    }

    const handleDelete = async (id: string) => {
        if (!confirm("¿Mover a papelera?")) return
        await supabase.from('products').update({ deleted_at: new Date().toISOString() }).eq('id', id)
        fetchProducts()
    }

    const filteredProducts = products
        .filter(p => showDeleted ? p.deleted_at : !p.deleted_at)
        .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))

    return (
        <div className="space-y-12 animate-in fade-in duration-700">

            {/* 👑 PREMIUM CATALOG HEADER */}
            <div className="relative group rounded-[3rem] overflow-hidden bg-white border border-slate-200 p-8 md:p-12 shadow-sm">
                <div className="absolute top-0 right-0 w-1/4 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
                <div className="relative z-10 flex flex-col lg:flex-row justify-between lg:items-center gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-2 italic">
                                <Zap className="w-3 h-3" /> INVENTARIO ACTIVO
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{products.length} SKU Registrados</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
                            CATÁLOGO <span className="text-primary italic">ELITE</span>
                        </h1>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] flex items-center gap-4">
                            Optimiza tu oferta gastronómica desde el núcleo
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => setShowDeleted(!showDeleted)}
                            className={cn(
                                "h-14 px-6 rounded-2xl border flex items-center justify-center transition-all font-black text-[10px] tracking-widest italic gap-3 shadow-sm",
                                showDeleted ? "bg-rose-500 text-white border-rose-500" : "bg-white border-slate-200 text-slate-400 hover:text-slate-900"
                            )}
                        >
                            {showDeleted ? <RotateCcw className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                            {showDeleted ? 'VER ACTIVOS' : 'PAPELERA'}
                        </button>
                        <Button onClick={() => { setEditingId(null); setFormData({ name: '', price: 0, category_id: categories[0]?.id, ingredients: [] }); setIsEditing(true); }} className="h-14 px-8 bg-primary text-black rounded-2xl font-black uppercase text-[10px] tracking-widest italic hover:bg-slate-900 hover:text-white transition-all shadow-xl shadow-primary/20 gap-3">
                            NUEVO PLATO <Plus className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* 🔍 SEARCH & FILTERS */}
            <div className="flex flex-col md:flex-row gap-4 items-center px-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="BUSCAR EN EL CATÁLOGO..."
                        className="w-full h-16 bg-white border border-slate-200 rounded-[2rem] pl-16 pr-6 outline-none focus:border-primary text-xs font-black italic uppercase tracking-widest placeholder:text-slate-300 transition-all font-mono text-slate-900 shadow-sm"
                    />
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" className="h-16 w-16 bg-white border border-slate-200 rounded-[2rem] hover:text-primary shadow-sm"><Filter className="w-6 h-6" /></Button>
                    <Button variant="ghost" className="h-16 w-16 bg-white border border-slate-200 rounded-[2rem] hover:text-primary shadow-sm"><BarChart3 className="w-6 h-6" /></Button>
                </div>
            </div>

            {/* 📦 SKU GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredProducts.map((p, idx) => (
                    <div
                        key={p.id}
                        className="bg-white border border-slate-200 rounded-[3rem] p-8 space-y-6 hover:border-primary shadow-sm transition-all group relative overflow-hidden animate-in fade-in duration-500"
                        style={{ animationDelay: `${idx * 50}ms` }}
                    >
                        <div className="relative aspect-[4/3] w-full rounded-[2rem] overflow-hidden bg-slate-50 border border-slate-100 mb-2">
                            {p.image_url ? (
                                <Image src={p.image_url} alt={p.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-200">
                                    <Camera className="w-12 h-12 mb-2" />
                                    <span className="text-[8px] font-black uppercase tracking-widest">SIN VISUAL</span>
                                </div>
                            )}
                            <div className="absolute top-4 right-4 px-3 py-1.5 bg-white/80 backdrop-blur-md rounded-full text-[8px] font-black italic text-slate-900 border border-slate-200 uppercase tracking-widest shadow-sm">
                                ${p.price.toLocaleString()}
                            </div>
                        </div>

                        <div className="space-y-4 relative z-10">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 group-hover:text-primary transition-colors truncate leading-none mb-2">{p.name}</h3>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">{categories.find(c => c.id === p.category_id)?.name || 'MISC'}</p>
                                </div>
                                <button onClick={() => handleEdit(p)} className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all shadow-sm text-slate-400">
                                    <Pencil className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-1.5 min-h-[40px]">
                                {p.ingredients?.slice(0, 3).map((ing, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-slate-50 rounded-md text-[8px] font-bold text-slate-400 uppercase tracking-widest border border-slate-100">{ing}</span>
                                ))}
                            </div>

                            <div className="flex gap-2 pt-2 border-t border-slate-100">
                                <Button className="flex-1 h-11 bg-white border border-slate-200 text-slate-900 [font-size:8px] font-black uppercase tracking-widest italic rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm">STATUS</Button>
                                {showDeleted ? (
                                    <Button onClick={() => supabase.from('products').update({ deleted_at: null }).eq('id', p.id).then(fetchProducts)} className="w-12 h-11 bg-emerald-50 text-emerald-500 border border-emerald-100 rounded-xl"><RotateCcw className="w-4 h-4" /></Button>
                                ) : (
                                    <Button onClick={() => handleDelete(p.id)} className="w-11 h-11 bg-rose-50 text-rose-500 border border-rose-100 rounded-xl hover:bg-rose-500 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></Button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 🛠️ EDITOR OVERLAY (ELITE MODAL) */}
            {isEditing && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 p-10 md:p-16 rounded-[4rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in duration-300 shadow-3xl text-slate-900">
                        <div className="flex justify-between items-center mb-12">
                            <h2 className="text-5xl font-black italic uppercase tracking-tighter text-slate-900">Editor <span className="text-primary">SKU</span></h2>
                            <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)} className="h-16 w-16 rounded-[2rem] bg-white border border-slate-200 text-slate-900 hover:bg-slate-900 hover:text-white shadow-sm"><X className="w-8 h-8" /></Button>
                        </div>

                        <div className="grid lg:grid-cols-2 gap-12">
                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">IDENTIDAD DEL PLATO</label>
                                    <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none text-slate-900 focus:border-primary font-black italic text-xl shadow-inner" placeholder="EJ: PARGO ROJO BRASEADO" />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">COSTO OPERATIVO</label>
                                        <div className="relative">
                                            <input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-12 outline-none text-primary font-black italic text-xl shadow-inner" />
                                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">CLASificación</label>
                                        <select value={formData.category_id} onChange={e => setFormData({ ...formData, category_id: e.target.value })} className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none text-slate-900 focus:border-primary font-black uppercase italic tracking-widest text-xs cursor-pointer shadow-inner">
                                            {categories.map(c => <option key={c.id} value={c.id} className="bg-white text-slate-900 uppercase">{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">VISUAL SKU (URL)</label>
                                    <input value={formData.image_url || ''} onChange={e => setFormData({ ...formData, image_url: e.target.value })} className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none text-slate-900 focus:border-primary font-mono text-xs shadow-inner" placeholder="https://..." />
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">COMPONENTES (RECETA)</label>
                                    <textarea value={formData.ingredients?.join(', ')} onChange={e => setFormData({ ...formData, ingredients: e.target.value.split(',').map(i => i.trim()) })} className="w-full h-32 bg-slate-50 border border-slate-200 rounded-3xl p-6 outline-none text-slate-900 focus:border-primary font-bold italic text-sm shadow-inner resize-none" placeholder="COMPONENTES SEPARADOS POR COMA..." />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">STORYTELLING</label>
                                    <textarea value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full h-40 bg-slate-50 border border-slate-200 rounded-3xl p-6 outline-none text-slate-900 focus:border-primary font-bold italic text-sm shadow-inner resize-none" placeholder="LA MÍSTICA DEL PLATO..." />
                                </div>
                            </div>
                        </div>

                        <div className="mt-16 flex gap-6">
                            <Button variant="ghost" onClick={() => setIsEditing(false)} className="flex-1 h-20 rounded-[2rem] font-black uppercase tracking-widest italic text-slate-400">CANCELAR</Button>
                            <Button onClick={handleSave} className="flex-[2] h-20 bg-primary text-black rounded-[2rem] font-black uppercase italic text-2xl tracking-tighter shadow-3xl shadow-primary/10 hover:bg-slate-900 hover:text-white transition-all">SALVAR SKU ELITE</Button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
            `}</style>
        </div>
    )
}
