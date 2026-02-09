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
    Loader2
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useRestaurant } from "@/providers/RestaurantProvider"
import { createOrderWithNotes } from "@/actions/orders-fixed"
import { toast } from "sonner"
import { cn, formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// ----------------------------------------------------------------------
// TIPOS (Mock y Reales)
// ----------------------------------------------------------------------
type Table = {
    id: string
    table_name: string
    status: 'free' | 'occupied' | 'reserved'
    capacity: number
    active_order_id?: string
    location?: string
}

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

// Eliminado MOCK_TABLES

// ----------------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ----------------------------------------------------------------------
export default function WaiterApp() {
    const { restaurant } = useRestaurant()
    const router = useRouter()
    const [view, setView] = useState<'tables' | 'order'>('tables')
    const [selectedTable, setSelectedTable] = useState<Table | null>(null)
    const [pin, setPin] = useState("")
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [waiterUser, setWaiterUser] = useState<any>(null)
    const [cart, setCart] = useState<{ product: Product, qty: number }[]>([])

    // Data Real (Cargada desde Supabase)
    const [categories, setCategories] = useState<Category[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [realTables, setRealTables] = useState<Table[]>([])
    const [submitting, setSubmitting] = useState(false)
    const [activeCategory, setActiveCategory] = useState<string>('all')

    useEffect(() => {
        if (restaurant) {
            fetchMenu()
            fetchTables()
        }
    }, [restaurant])

    const fetchMenu = async () => {
        const { data: cats } = await supabase.from('categories').select('*').eq('restaurant_id', restaurant?.id)
        const { data: prods } = await supabase.from('products').select('*').eq('restaurant_id', restaurant?.id).eq('is_available', true)

        if (cats) setCategories(cats)
        if (prods) setProducts(prods)
    }

    const fetchTables = async () => {
        const { data } = await supabase.from('tables').select('*').eq('restaurant_id', restaurant?.id).order('table_name')
        if (data) setRealTables(data as any)
    }

    const verifyPin = async (val: string) => {
        if (!restaurant) return
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('restaurant_id', restaurant.id)
            .eq('waiter_pin', val)
            .single()

        if (error || !data) {
            toast.error("PIN Incorrecto")
            setPin("")
            return
        }

        setWaiterUser(data)
        setIsAuthenticated(true)
        toast.success(`Bienvenido, ${data.full_name}`)
    }

    const handleMarchar = async () => {
        if (!selectedTable || cart.length === 0 || submitting) return

        setSubmitting(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user && !waiterUser) throw new Error("No autenticado")

            const orderData = {
                restaurant_id: restaurant!.id,
                user_id: user?.id || waiterUser.id,
                waiter_id: waiterUser?.id || user?.id,
                table_id: selectedTable.id,
                items: cart.map(i => ({
                    product_id: i.product.id,
                    quantity: i.qty,
                    unit_price: i.product.price,
                    subtotal: i.product.price * i.qty
                })),
                subtotal: cartTotal,
                total: cartTotal
            }

            await createOrderWithNotes(orderData)

            // Actualizar estado de mesa
            await supabase.from('tables').update({ status: 'occupied' }).eq('id', selectedTable.id)

            toast.success("¡Comanda enviada a cocina!")
            setCart([])
            setView('tables')
            fetchTables()
        } catch (e: any) {
            toast.error("Error: " + e.message)
        } finally {
            setSubmitting(false)
        }
    }

    // LOGIN SCREEN
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 animate-in fade-in duration-700">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary/20">
                        <Utensils className="w-8 h-8 text-black" />
                    </div>
                    <h1 className="text-4xl font-black italic mb-2 text-slate-900 tracking-tighter uppercase">WAITER<span className="text-primary italic">APP</span></h1>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Portal de Autenticación de Meseros</p>
                </div>

                <div className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-slate-200 border border-slate-100 w-full max-w-sm flex flex-col items-center">
                    <div className="flex gap-4 mb-10">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className={cn("w-5 h-5 rounded-full transition-all duration-300", i < pin.length ? "bg-primary scale-110 shadow-lg shadow-primary/40" : "bg-slate-100 border border-slate-200")} />
                        ))}
                    </div>

                    <div className="grid grid-cols-3 gap-4 w-full">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                            <button
                                key={num}
                                onClick={() => {
                                    const newPin = pin + num
                                    if (newPin.length <= 4) setPin(newPin)
                                    if (newPin.length === 4) {
                                        verifyPin(newPin)
                                    }
                                }}
                                className="h-16 rounded-2xl bg-slate-50 border border-slate-100 text-xl font-black italic text-slate-900 active:bg-primary active:scale-95 transition-all hover:bg-white hover:border-primary/30"
                            >
                                {num}
                            </button>
                        ))}
                        <div />
                        <button onClick={() => {
                            if (pin.length < 4) {
                                const newPin = pin + "0"
                                setPin(newPin)
                                if (newPin.length === 4) verifyPin(newPin)
                            }
                        }} className="h-16 rounded-2xl bg-slate-50 border border-slate-100 text-xl font-black italic text-slate-900 active:bg-primary transition-all">0</button>
                        <button onClick={() => setPin(pin.slice(0, -1))} className="h-16 rounded-2xl bg-rose-50 border border-rose-100 text-rose-500 font-bold active:bg-rose-500 active:text-white transition-all">
                            <X className="w-6 h-6 mx-auto" />
                        </button>
                    </div>

                    <p className="mt-8 text-[9px] font-black text-slate-300 uppercase tracking-widest italic">Terminal Segura POS-JAMALI</p>
                </div>
            </div>
        )
    }

    // ----------------------------------------------------------------------
    // VISTA DE MESAS
    // ----------------------------------------------------------------------
    if (view === 'tables') {
        return (
            <div className="min-h-screen bg-slate-50 pb-20">
                {/* Header */}
                <header className="bg-white px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-black italic uppercase tracking-tighter">SALÓN</h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest italic">{waiterUser?.full_name || 'Iniciando...'}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => { setIsAuthenticated(false); setWaiterUser(null); setPin(""); }}>
                        <LogOut className="w-5 h-5 text-rose-500" />
                    </Button>
                </header>

                {/* Grid Mesas */}
                <div className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {realTables.map(table => (
                        <button
                            key={table.id}
                            onClick={() => {
                                setSelectedTable(table)
                                setView('order')
                            }}
                            className={cn(
                                "aspect-square rounded-[2rem] flex flex-col items-center justify-center gap-2 border-2 transition-all shadow-sm active:scale-95",
                                table.status === 'free' ? "bg-white border-slate-200 hover:border-emerald-500/50" :
                                    table.status === 'occupied' ? "bg-rose-50 border-rose-500/20" :
                                        "bg-amber-50 border-amber-500/20"
                            )}>
                            <div className={cn(
                                "w-12 h-12 rounded-full flex items-center justify-center text-lg shadow-sm",
                                table.status === 'free' ? "bg-emerald-100 text-emerald-600" :
                                    table.status === 'occupied' ? "bg-rose-100 text-rose-600" :
                                        "bg-amber-100 text-amber-600"
                            )}>
                                {table.status === 'free' ? <Utensils className="w-6 h-6" /> :
                                    table.status === 'occupied' ? <Users className="w-6 h-6" /> :
                                        <CheckCircle2 className="w-6 h-6" />}
                            </div>
                            <span className="text-lg font-black italic text-slate-900">{table.table_name}</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                {table.status === 'free' ? 'Libre' : table.status === 'occupied' ? 'Ocupada' : 'Reservada'}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        )
    }

    // ----------------------------------------------------------------------
    // VISTA DE ORDEN (COMANDA)
    // ----------------------------------------------------------------------
    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(p => p.product.id === product.id)
            if (existing) {
                return prev.map(p => p.product.id === product.id ? { ...p, qty: p.qty + 1 } : p)
            }
            return [...prev, { product, qty: 1 }]
        })
    }

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.map(p => p.product.id === productId ? { ...p, qty: p.qty - 1 } : p).filter(p => p.qty > 0))
    }

    const filteredProducts = activeCategory === 'all'
        ? products
        : products.filter(p => p.category_id === activeCategory)

    const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.qty), 0)

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col h-screen overflow-hidden">
            {/* Header Orden */}
            <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0 h-16">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => setView('tables')} className="rounded-xl">
                        <X className="w-6 h-6" />
                    </Button>
                    <div>
                        <h2 className="text-lg font-black italic leading-none">{selectedTable?.table_name}</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Nueva Comanda</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xl font-black text-primary italic">{formatPrice(cartTotal)}</p>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* MENU (IZQUIERDA) */}
                <div className="flex-1 flex flex-col bg-slate-50">
                    {/* Categorías */}
                    <div className="h-14 overflow-x-auto flex items-center gap-2 px-4 border-b border-slate-200 bg-white shrink-0 scrollbar-hide">
                        <button
                            onClick={() => setActiveCategory('all')}
                            className={cn(
                                "px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border",
                                activeCategory === 'all' ? "bg-black text-white border-black" : "bg-transparent border-transparent text-slate-400"
                            )}
                        >
                            Todo
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={cn(
                                    "px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border",
                                    activeCategory === cat.id ? "bg-black text-white border-black" : "bg-transparent border-transparent text-slate-400"
                                )}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    {/* Grid Productos */}
                    <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 content-start custom-scrollbar">
                        {filteredProducts.map(product => {
                            const inCartQty = cart.find(c => c.product.id === product.id)?.qty || 0
                            return (
                                <button
                                    key={product.id}
                                    onClick={() => addToCart(product)}
                                    className={cn(
                                        "bg-white p-3 rounded-2xl border flex flex-col text-left transition-all active:scale-95 hover:border-primary/40 relative",
                                        inCartQty > 0 ? "border-primary ring-1 ring-primary shadow-lg shadow-primary/10" : "border-slate-200 shadow-sm"
                                    )}
                                >
                                    <div className="flex justify-between items-start w-full">
                                        <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-100 uppercase italic">
                                            {product.name.charAt(0)}
                                        </div>
                                        {inCartQty > 0 && (
                                            <span className="bg-primary text-black text-[9px] font-black px-1.5 py-0.5 rounded-lg shadow-sm">
                                                {inCartQty}X
                                            </span>
                                        )}
                                    </div>
                                    <h4 className="font-bold text-[11px] mt-2 leading-tight text-slate-900 line-clamp-2 uppercase italic tracking-tighter">{product.name}</h4>
                                    <p className="text-[10px] font-black text-slate-400 mt-1 italic">{formatPrice(product.price)}</p>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* RESUMEN (DERECHA - SLIDEOVER EN MOBILE O PANEL FIJO EN TABLET) */}
                {cart.length > 0 && (
                    <div className="w-80 bg-white border-l border-slate-200 flex flex-col shadow-2xl z-50 absolute inset-y-0 right-0 md:relative shrink-0 transition-all duration-300">
                        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-black italic uppercase text-sm">Resumen</h3>
                            <span className="bg-black text-white text-[10px] px-2 py-0.5 rounded-full">{cart.reduce((acc, item) => acc + item.qty, 0)} Items</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {cart.map(item => (
                                <div key={item.product.id} className="flex items-center justify-between gap-2 border-b border-dashed border-slate-100 pb-2 last:border-0">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm text-slate-900 leading-tight truncate">{item.product.name}</p>
                                        <div className="flex items-center gap-1 mt-1">
                                            <span className="text-[10px] font-bold text-slate-400">{formatPrice(item.product.price)}</span>
                                            <span className="text-[10px] text-slate-300">x {item.qty}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1 border border-slate-100 shrink-0">
                                        <button onClick={() => removeFromCart(item.product.id)} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-xs font-bold hover:bg-rose-50 hover:text-rose-500 transition-colors">-</button>
                                        <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                                        <button onClick={() => addToCart(item.product)} className="w-6 h-6 flex items-center justify-center bg-black text-white rounded shadow-sm text-xs font-bold hover:bg-primary hover:text-black transition-colors">+</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t border-slate-200 bg-slate-50">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total</span>
                                <span className="text-2xl font-black italic text-slate-900">{formatPrice(cartTotal)}</span>
                            </div>
                            <Button
                                onClick={handleMarchar}
                                disabled={submitting}
                                className="w-full h-14 bg-black text-white hover:bg-primary hover:text-black rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl gap-2 active:scale-95 transition-all"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChefHat className="w-5 h-5" />}
                                MARCHAR COMANDA
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <style jsx global>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
            `}</style>
        </div>
    )
}
