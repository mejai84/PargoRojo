"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import {
    Users,
    Utensils,
    ChefHat,
    ArrowRight,
    LogOut,
    Plus,
    Minus,
    Search,
    X,
    CheckCircle2,
    Loader2,
    ArrowLeftRight,
    Receipt,
    Zap,
    Signal,
    Activity,
    Smartphone,
    ShieldCheck,
    Briefcase,
    Globe,
    Lock,
    ArrowLeft,
    Table as TableIcon,
    Flame,
    ShoppingBag,
    LayoutGrid
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useRestaurant } from "@/providers/RestaurantProvider"
import { createOrderWithNotes, addItemsToOrder } from "@/actions/orders-fixed"
import { toast } from "sonner"
import { cn, formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// ----------------------------------------------------------------------
// TIPOS
// ----------------------------------------------------------------------
type Table = {
    id: string
    table_name: string
    status: 'free' | 'occupied' | 'reserved'
    capacity: number
}

type Product = {
    id: string
    name: string
    price: number
    category_id: string
}

type Category = {
    id: string
    name: string
}

// ----------------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ----------------------------------------------------------------------
export default function WaiterAppPremium() {
    const { restaurant } = useRestaurant()
    const router = useRouter()
    const [view, setView] = useState<'tables' | 'order' | 'options'>('tables')
    const [selectedTable, setSelectedTable] = useState<Table | null>(null)
    const [cart, setCart] = useState<{ product: Product, qty: number }[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [activeCategory, setActiveCategory] = useState<string>('all')

    // Data
    const [categories, setCategories] = useState<Category[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [realTables, setRealTables] = useState<Table[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (restaurant) {
            fetchData()
        }
    }, [restaurant])

    const fetchData = async () => {
        setLoading(true)
        const { data: cats } = await supabase.from('categories').select('*').eq('restaurant_id', restaurant?.id)
        const { data: prods } = await supabase.from('products').select('*').eq('restaurant_id', restaurant?.id).eq('is_available', true)
        const { data: tabs } = await supabase.from('tables').select('*').eq('restaurant_id', restaurant?.id).order('table_name')

        if (cats) setCategories(cats)
        if (prods) setProducts(prods as any)
        if (tabs) setRealTables(tabs as any)
        setLoading(false)
    }

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id)
            if (existing) {
                return prev.map(item => item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item)
            }
            return [...prev, { product, qty: 1 }]
        })
    }

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCat = activeCategory === 'all' || p.category_id === activeCategory
        return matchesSearch && matchesCat
    })

    return (
        <div className="min-h-screen text-white font-sans relative overflow-hidden flex flex-col h-screen">

            {/* 🖼️ FONDO PREMIM: Salón de Comedor Elegante con Blur */}
            <div className="fixed inset-0 bg-[url('https://images.unsplash.com/photo-1550966841-3ee5ad60a05a?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center scale-105 pointer-events-none" />
            <div className="fixed inset-0 backdrop-blur-[60px] bg-slate-950/90 pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full">

                {/* HEADER DINÁMICO */}
                <header className="p-6 border-b border-white/5 bg-slate-950/40 backdrop-blur-xl flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        {view !== 'tables' && (
                            <button onClick={() => setView('tables')} className="p-2 bg-white/5 rounded-lg border border-white/10">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        )}
                        <div>
                            <h1 className="text-2xl font-black italic tracking-tighter uppercase leading-none">WAITER <span className="text-orange-500">PRO</span></h1>
                            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">SISTEMA DE COMANDAS MÓVIL</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[8px] font-black uppercase text-emerald-500">ONLINE</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-10 w-10 bg-white/5 border border-white/10 rounded-xl">
                            <Users className="w-4 h-4 text-slate-400" />
                        </Button>
                    </div>
                </header>

                {/* CONTENIDO PRINCIPAL SEGÚN VISTA */}
                <main className="flex-1 overflow-hidden">
                    {view === 'tables' ? (
                        <div className="h-full flex flex-col p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-black italic uppercase tracking-tighter">Selección de <span className="text-orange-500">Mesa</span></h2>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{realTables.length} TOTALES</span>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {realTables.map(table => (
                                        <div
                                            key={table.id}
                                            onClick={() => {
                                                setSelectedTable(table)
                                                setView('order')
                                            }}
                                            className={cn(
                                                "relative aspect-square rounded-[2rem] p-6 flex flex-col justify-between border-2 transition-all cursor-pointer active:scale-95 group overflow-hidden",
                                                table.status === 'free'
                                                    ? "bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/40"
                                                    : "bg-orange-500/5 border-orange-500/20 hover:bg-orange-500/10 hover:border-orange-500/40"
                                            )}
                                        >
                                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-all">
                                                <TableIcon className="w-20 h-20" />
                                            </div>
                                            <div className="relative z-10 flex flex-col h-full justify-between">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center border",
                                                    table.status === 'free' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-orange-500/10 border-orange-500/20 text-orange-500"
                                                )}>
                                                    <span className="text-[10px] font-black italic">{table.capacity}</span>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{table.status === 'free' ? 'DISPONIBLE' : 'OCUPADA'}</p>
                                                    <h3 className="text-3xl font-black italic tracking-tighter group-hover:text-white transition-colors uppercase">{table.table_name}</h3>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex overflow-hidden">
                            {/* Categories Selector */}
                            <div className="w-20 md:w-28 bg-slate-950/60 border-r border-white/5 flex flex-col py-6 overflow-y-auto no-scrollbar shrink-0">
                                <button
                                    onClick={() => setActiveCategory('all')}
                                    className={cn(
                                        "flex flex-col items-center gap-2 p-4 transition-all border-l-4",
                                        activeCategory === 'all' ? "border-orange-500 bg-orange-500/10 text-orange-500" : "border-transparent text-slate-500"
                                    )}
                                >
                                    <LayoutGrid className="w-5 h-5" />
                                    <span className="text-[8px] font-black uppercase text-center italic">ALL</span>
                                </button>
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCategory(cat.id)}
                                        className={cn(
                                            "flex flex-col items-center gap-2 p-5 transition-all border-l-4",
                                            activeCategory === cat.id ? "border-orange-500 bg-orange-500/10 text-orange-500" : "border-transparent text-slate-500"
                                        )}
                                    >
                                        <span className="text-[8px] font-black uppercase text-center italic leading-tight">{cat.name}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Menu Selection Area */}
                            <div className="flex-1 flex flex-col min-w-0">
                                <div className="p-4 border-b border-white/5">
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                            placeholder="Buscar Producto..."
                                            className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-orange-500/50"
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {filteredProducts.map(prod => (
                                            <div
                                                key={prod.id}
                                                onClick={() => addToCart(prod)}
                                                className="bg-slate-800/40 backdrop-blur-xl border border-white/5 rounded-2xl p-4 active:scale-95 transition-all flex flex-col h-32 justify-between"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-orange-500">
                                                    <Plus className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black italic tracking-tighter uppercase line-clamp-2 leading-none mb-1">{prod.name}</p>
                                                    <p className="text-lg font-black italic font-mono text-orange-400 leading-none">{formatPrice(prod.price)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Cart Area (Responsive Column) */}
                            <div className="w-80 bg-slate-950/80 border-l border-white/10 flex flex-col shrink-0 hidden lg:flex">
                                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                    <h2 className="text-lg font-black italic uppercase tracking-tighter">{selectedTable?.table_name} <span className="text-slate-500">ORDEN</span></h2>
                                    <ShoppingBag className="w-5 h-5 text-orange-500" />
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                    {cart.map((item, i) => (
                                        <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/5">
                                            <div className="w-8 h-8 bg-orange-500 text-black flex items-center justify-center rounded-lg font-black italic text-xs">
                                                {item.qty}x
                                            </div>
                                            <div className="flex-1 truncate">
                                                <p className="text-[10px] font-bold text-white uppercase truncate">{item.product.name}</p>
                                                <p className="text-[10px] font-mono text-slate-500">{formatPrice(item.product.price)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-6 bg-slate-900/80 border-t border-white/10">
                                    <div className="flex justify-between items-end mb-6">
                                        <p className="text-[10px] font-black italic text-orange-500 uppercase tracking-widest">TOTAL</p>
                                        <p className="text-3xl font-black italic tracking-tighter text-white">
                                            {formatPrice(cart.reduce((acc, curr) => acc + (curr.product.price * curr.qty), 0))}
                                        </p>
                                    </div>
                                    <Button className="w-full h-14 bg-orange-600 hover:bg-orange-700 text-black font-black uppercase text-sm italic tracking-[0.2em] rounded-2xl">
                                        ENVIAR COMANDA
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                {/* BOTTOM NAVIGATION (For Tablet/Mobile View) */}
                <nav className="p-4 border-t border-white/5 bg-slate-950/80 backdrop-blur-2xl lg:hidden flex gap-4">
                    <Button className="flex-1 h-12 bg-orange-600 text-black font-black uppercase italic rounded-xl">
                        ENVIAR ({cart.length})
                    </Button>
                    <Button variant="ghost" className="h-12 w-12 bg-white/5 border border-white/10 rounded-xl">
                        <Receipt className="w-5 h-5 text-slate-400" />
                    </Button>
                </nav>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 3px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { 
                    background: rgba(255, 255, 255, 0.05); 
                    border-radius: 10px; 
                }
            `}</style>
        </div>
    )
}
