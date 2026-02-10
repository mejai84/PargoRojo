"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import {
    Search,
    ShoppingBag,
    Plus,
    Minus,
    X,
    CheckCircle2,
    Loader2,
    ArrowLeft,
    CreditCard,
    Banknote,
    Receipt,
    Zap,
    Utensils,
    Star,
    Flame,
    LayoutGrid,
    ChevronRight,
    SearchIcon,
    Trash2,
    Smartphone,
    UserCircle2
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useRestaurant } from "@/providers/RestaurantProvider"
import { toast } from "sonner"
import { cn, formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// ----------------------------------------------------------------------
// TIPOS
// ----------------------------------------------------------------------
type Product = {
    id: string
    name: string
    price: number
    category_id: string
    image_url?: string
}

type Category = {
    id: string
    name: string
}

type CartItem = {
    product: Product
    qty: number
}

export default function PosPremiumPage() {
    const { restaurant } = useRestaurant()
    const router = useRouter()

    // UI State
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [activeCategory, setActiveCategory] = useState<string>('all')
    const [cart, setCart] = useState<CartItem[]>([])
    const [paymentModal, setPaymentModal] = useState(false)
    const [currentTime, setCurrentTime] = useState(new Date())

    // Data State
    const [categories, setCategories] = useState<Category[]>([])
    const [products, setProducts] = useState<Product[]>([])

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        if (restaurant) fetchData()
        return () => clearInterval(timer)
    }, [restaurant])

    const fetchData = async () => {
        setLoading(true)
        const { data: cats } = await supabase.from('categories').select('*').eq('restaurant_id', restaurant?.id)
        const { data: prods } = await supabase.from('products').select('*').eq('restaurant_id', restaurant?.id).eq('is_available', true)

        if (cats) setCategories(cats)
        if (prods) setProducts(prods as any)
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
        toast.success(`+1 ${product.name}`, { duration: 1000 })
    }

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.map(item => {
            if (item.product.id === productId) return { ...item, qty: Math.max(0, item.qty - 1) }
            return item
        }).filter(item => item.qty > 0))
    }

    const clearCart = () => {
        setCart([])
        toast.info("Carrito vaciado")
    }

    const total = cart.reduce((acc, curr) => acc + (curr.product.price * curr.qty), 0)

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCat = activeCategory === 'all' || p.category_id === activeCategory
        return matchesSearch && matchesCat
    })

    if (loading && products.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <div className="flex flex-col items-center gap-8 animate-in fade-in duration-1000">
                    <Loader2 className="w-16 h-16 text-orange-500 animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-orange-500 italic animate-pulse">Iniciando Terminal POS Premium...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen text-white font-sans relative overflow-hidden flex flex-col">

            {/* 🖼️ FONDO PREMIUM: Bar/Lounge Elegante con Blur */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center scale-105 pointer-events-none" />
            <div className="absolute inset-0 backdrop-blur-[80px] bg-slate-950/90 pointer-events-none" />

            {/* HEADER SUPERIOR */}
            <div className="relative z-20 p-6 flex items-center justify-between border-b border-white/5 bg-slate-950/40 backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-6">
                    <Link href="/admin">
                        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10">
                            <ArrowLeft className="w-5 h-5 text-slate-400" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">TERMINAL <span className="text-orange-500">POS</span> </h1>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.4em] mt-1">NODO VENTA_DIRECTA_ACTIVE</p>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <div className="text-right hidden md:block">
                        <p className="text-xl font-black italic tracking-tighter font-mono">
                            {currentTime.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-[8px] font-bold text-orange-500 uppercase tracking-widest">SISTEMA EN LÍNEA</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="h-12 px-6 flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl">
                            <UserCircle2 className="w-5 h-5 text-orange-500" />
                            <span className="text-xs font-black italic uppercase">Cajero: Admin</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN POS INTERFACE */}
            <div className="relative z-10 flex-1 flex overflow-hidden">

                {/* 1. SIDEBAR CATEGORIES (Vertical Pro) */}
                <div className="w-24 md:w-32 bg-slate-950/60 backdrop-blur-3xl border-r border-white/5 flex flex-col py-6 shrink-0 overflow-y-auto no-scrollbar">
                    <button
                        onClick={() => setActiveCategory('all')}
                        className={cn(
                            "flex flex-col items-center gap-2 p-4 transition-all border-l-4",
                            activeCategory === 'all'
                                ? "border-orange-500 bg-orange-500/10 text-orange-500"
                                : "border-transparent text-slate-500 hover:text-slate-300"
                        )}
                    >
                        <LayoutGrid className="w-6 h-6" />
                        <span className="text-[9px] font-black uppercase tracking-wider italic text-center">TODO</span>
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={cn(
                                "flex flex-col items-center gap-2 p-6 transition-all border-l-4",
                                activeCategory === cat.id
                                    ? "border-orange-500 bg-orange-500/10 text-orange-500"
                                    : "border-transparent text-slate-500 hover:text-slate-300"
                            )}
                        >
                            <span className="text-[9px] font-black uppercase tracking-widest italic text-center leading-relaxed">
                                {cat.name}
                            </span>
                        </button>
                    ))}
                </div>

                {/* 2. PRODUCT GRID (Central Command) */}
                <div className="flex-1 flex flex-col min-w-0 bg-slate-950/20 backdrop-blur-sm">
                    {/* Search Bar */}
                    <div className="p-6 shrink-0">
                        <div className="relative group max-w-xl">
                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-orange-500 transition-colors" />
                            <input
                                type="search"
                                autoComplete="new-password"
                                placeholder="Escanear o Buscar Código/Nombre..."
                                className="w-full bg-slate-900/60 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-orange-500/50 transition-all focus:ring-1 focus:ring-orange-500/20"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Grid Scrollable */}
                    <div className="flex-1 overflow-y-auto p-6 pt-0 custom-scrollbar">
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                            {filteredProducts.map(prod => (
                                <div
                                    key={prod.id}
                                    onClick={() => addToCart(prod)}
                                    className="group relative bg-slate-800/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-5 cursor-pointer transition-all hover:scale-[1.02] hover:border-orange-500/40 hover:bg-slate-700/50 active:scale-95 flex flex-col h-44 justify-between overflow-hidden"
                                >
                                    {/* Icon Backdrop */}
                                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-all">
                                        <Utensils className="w-20 h-20" />
                                    </div>

                                    <div className="relative z-10 flex flex-col h-full justify-between">
                                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 group-hover:bg-orange-500 group-hover:text-black transition-all">
                                            <Plus className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black italic tracking-tighter uppercase group-hover:text-orange-400 transition-colors line-clamp-2">
                                                {prod.name}
                                            </h3>
                                            <p className="text-lg font-black text-white mt-1 font-mono tracking-tighter">
                                                {formatPrice(prod.price)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 3. CART PANEL (Glass Receipt) */}
                <div className="w-[350px] md:w-[450px] bg-slate-950/80 backdrop-blur-3xl border-l border-white/10 flex flex-col shrink-0">
                    <div className="p-8 border-b border-white/5 shrink-0 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <ShoppingBag className="w-6 h-6 text-orange-500" />
                            <h2 className="text-xl font-black italic uppercase tracking-tighter">RESUMEN <span className="text-slate-500">ORDEN</span></h2>
                        </div>
                        <Button variant="ghost" onClick={clearCart} className="text-xs font-bold text-red-500/60 hover:text-red-500 hover:bg-red-500/10">
                            LIMPIAR
                        </Button>
                    </div>

                    {/* Cart Items Area */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                                <Receipt className="w-20 h-20 mb-4" />
                                <p className="text-sm font-black uppercase tracking-[0.2em] italic">Esperando Items...</p>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.product.id} className="flex items-center gap-4 bg-white/5 border border-white/5 rounded-2xl p-4 animate-in slide-in-from-right-4 duration-300">
                                    <div className="w-10 h-10 bg-orange-500 text-black flex items-center justify-center rounded-xl font-black italic text-sm">
                                        {item.qty}x
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm text-white truncate uppercase">{item.product.name}</p>
                                        <p className="text-xs font-mono text-slate-500">{formatPrice(item.product.price)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black italic text-sm">${(item.product.price * item.qty).toLocaleString()}</p>
                                        <div className="flex gap-2 mt-1">
                                            <button onClick={() => removeFromCart(item.product.id)} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all">
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <button onClick={() => addToCart(item.product)} className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white transition-all">
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Checkout Footer */}
                    <div className="p-8 bg-slate-900 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] border-t border-white/10 shrink-0">
                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                                <span>Subtotal</span>
                                <span>{formatPrice(total)}</span>
                            </div>
                            <div className="flex justify-between text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                                <span>Impuestos Incluidos</span>
                                <span>$0.00</span>
                            </div>
                            <div className="h-px bg-white/5" />
                            <div className="flex justify-between items-end">
                                <p className="text-xs font-black italic text-orange-500 uppercase tracking-widest">TOTAL A PAGAR</p>
                                <p className="text-5xl font-black italic tracking-tighter text-white drop-shadow-lg leading-none">
                                    {formatPrice(total)}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={() => toast.info("PROCESANDO TERMINAL DE PAGO...")}
                                className="flex-1 h-20 bg-orange-600 hover:bg-orange-700 text-black font-black uppercase text-lg italic tracking-[0.2em] rounded-3xl shadow-2xl shadow-orange-600/30 group active:scale-95 transition-all"
                                disabled={cart.length === 0}
                            >
                                <Banknote className="w-7 h-7 mr-4 group-hover:scale-110 transition-transform" />
                                PAGAR AHORA
                            </Button>
                            <Button
                                onClick={() => toast.info("LINK DE PAGO DIGITAL ENVIADO")}
                                variant="ghost" className="h-20 w-20 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10"
                            >
                                <Smartphone className="w-8 h-8 text-slate-400" />
                            </Button>
                        </div>
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
