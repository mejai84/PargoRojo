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
    Receipt
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useRestaurant } from "@/providers/RestaurantProvider"
import { createOrderWithNotes, addItemsToOrder } from "@/actions/orders-fixed"
import { toast } from "sonner"
import { cn, formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"

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
export default function WaiterApp() {
    const { restaurant } = useRestaurant()
    const router = useRouter()
    const [view, setView] = useState<'tables' | 'order' | 'options'>('tables')
    const [selectedTable, setSelectedTable] = useState<Table | null>(null)
    const [pin, setPin] = useState("")
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [waiterUser, setWaiterUser] = useState<any>(null)
    const [cart, setCart] = useState<{ product: Product, qty: number }[]>([])

    // UI Flows
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
    const [targetTableId, setTargetTableId] = useState("")
    const [selectedTableOrder, setSelectedTableOrder] = useState<any>(null)
    const [loadingOrder, setLoadingOrder] = useState(false)

    // Data
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

    const fetchTableOrder = async (tableId: string) => {
        setLoadingOrder(true)
        try {
            const { data } = await supabase
                .from('orders')
                .select('*, order_items(*, products(*))')
                .eq('table_id', tableId)
                .in('status', ['pending', 'preparing', 'ready', 'payment_pending'])
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()
            setSelectedTableOrder(data)
        } catch (e) {
            console.error(e)
        } finally {
            setLoadingOrder(false)
        }
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
            const userId = user?.id || waiterUser?.id
            if (!userId) throw new Error("No autenticado")

            const items = cart.map(i => ({
                product_id: i.product.id,
                quantity: i.qty,
                unit_price: i.product.price,
                subtotal: i.product.price * i.qty
            }))

            if (selectedTable.status === 'occupied' && selectedTableOrder) {
                // ADICIONAR A ORDEN EXISTENTE
                await addItemsToOrder(selectedTableOrder.id, items)
                toast.success("¡Adición enviada!")
            } else {
                // NUEVA ORDEN
                const orderData = {
                    restaurant_id: restaurant!.id,
                    user_id: userId,
                    waiter_id: waiterUser?.id || userId,
                    table_id: selectedTable.id,
                    items,
                    subtotal: cartTotal,
                    total: cartTotal
                }
                await createOrderWithNotes(orderData)
                await supabase.from('tables').update({ status: 'occupied' }).eq('id', selectedTable.id)
                toast.success("¡Comanda enviada!")
            }

            setCart([])
            setView('tables')
            setSelectedTableOrder(null)
            fetchTables()
        } catch (e: any) {
            toast.error("Error: " + e.message)
        } finally {
            setSubmitting(false)
        }
    }

    // ----------------------------------------------------------------------
    // UI SCREENS
    // ----------------------------------------------------------------------

    // A. LOGIN
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-white to-slate-100">
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-primary rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary/20 animate-bounce">
                        <ChefHat className="w-10 h-10 text-black" />
                    </div>
                    <h1 className="text-4xl font-black italic mb-2 tracking-tighter uppercase">JAMALI<span className="text-primary italic">OS</span></h1>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Terminal de Meseros V2.0</p>
                </div>

                <div className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-slate-200 border border-slate-100 w-full max-w-sm flex flex-col items-center">
                    <div className="flex gap-4 mb-10">
                        {[0, 1, 2, 3].map((i) => (
                            <div key={i} className={cn("w-6 h-6 rounded-2xl transition-all duration-300 border-2", i < pin.length ? "bg-primary border-primary scale-110" : "bg-slate-50 border-slate-100")} />
                        ))}
                    </div>

                    <div className="grid grid-cols-3 gap-4 w-full">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                            <button key={num} onClick={() => {
                                const newPin = pin + num
                                if (newPin.length <= 4) setPin(newPin)
                                if (newPin.length === 4) verifyPin(newPin)
                            }} className="h-20 rounded-[1.5rem] bg-slate-50 border border-slate-100 text-2xl font-black italic active:bg-primary transition-all active:scale-95">{num}</button>
                        ))}
                        <div />
                        <button onClick={() => {
                            const newPin = pin + "0"
                            if (newPin.length <= 4) setPin(newPin)
                            if (newPin.length === 4) verifyPin(newPin)
                        }} className="h-20 rounded-[1.5rem] bg-slate-50 border border-slate-100 text-2xl font-black italic active:bg-primary transition-all active:scale-95">0</button>
                        <button onClick={() => setPin(pin.slice(0, -1))} className="h-20 rounded-[1.5rem] bg-rose-50 text-rose-500 flex items-center justify-center active:bg-rose-500 active:text-white transition-all"><X className="w-8 h-8" /></button>
                    </div>
                </div>
            </div>
        )
    }

    // B. SALÓN (Mesas)
    if (view === 'tables') {
        return (
            <div className="min-h-screen bg-slate-50 pb-20">
                <header className="bg-white px-8 py-6 flex justify-between items-center shadow-sm sticky top-0 z-10 border-b border-slate-200 backdrop-blur-md bg-white/80">
                    <div>
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter">MESAS</h2>
                        <p className="text-[10px] text-primary font-black uppercase tracking-widest italic">{waiterUser?.full_name}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => { setIsAuthenticated(false); setWaiterUser(null); setPin(""); }} className="rounded-full w-12 h-12 bg-rose-50 border border-rose-100">
                        <LogOut className="w-5 h-5 text-rose-500" />
                    </Button>
                </header>

                <div className="p-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {realTables.map(table => (
                        <button key={table.id} onClick={() => {
                            setSelectedTable(table)
                            if (table.status === 'occupied') {
                                fetchTableOrder(table.id)
                                setView('options')
                            } else {
                                setView('order')
                            }
                        }} className={cn(
                            "aspect-square rounded-[3rem] flex flex-col items-center justify-center gap-2 border-4 transition-all shadow-xl active:scale-95 relative overflow-hidden group",
                            table.status === 'free' ? "bg-white border-slate-100" : "bg-rose-50 border-rose-500/20"
                        )}>
                            <div className={cn(
                                "w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all",
                                table.status === 'free' ? "bg-slate-50 text-slate-300" : "bg-rose-500 text-white animate-pulse"
                            )}>
                                {table.status === 'free' ? <Utensils className="w-8 h-8" /> : <Users className="w-8 h-8" />}
                            </div>
                            <span className="text-2xl font-black italic text-slate-900 tracking-tighter">{table.table_name}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{table.status === 'free' ? 'Libre' : 'Ocupada'}</span>
                            {table.status === 'occupied' && (
                                <div className="absolute top-6 right-6 w-3 h-3 bg-rose-500 rounded-full ring-4 ring-rose-500/20" />
                            )}
                        </button>
                    ))}
                </div>
            </div>
        )
    }

    // C. OPCIONES (Mesa Dashboard)
    if (view === 'options') {
        const currentTotal = selectedTableOrder?.total || 0
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col p-8 animate-in slide-in-from-bottom-10 duration-500">
                <Button variant="ghost" className="self-start mb-10 rounded-full bg-white border border-slate-200 h-12 px-6 font-black italic uppercase" onClick={() => { setView('tables'); setSelectedTableOrder(null); }}>
                    <X className="w-5 h-5 mr-2" /> VOLVER AL SALÓN
                </Button>

                <div className="flex flex-col items-center mb-16">
                    <div className="w-24 h-24 bg-rose-500 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-rose-200 mb-6">
                        <Users className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">{selectedTable?.table_name}</h2>
                    <p className="text-emerald-500 font-black italic text-3xl mt-2">{formatPrice(currentTotal)}</p>
                    <p className="text-[11px] font-black text-slate-400 tracking-[0.3em] uppercase mt-4 italic">Servicio Activo</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto w-full">
                    <button onClick={() => setView('order')} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl flex flex-col items-center gap-6 hover:border-primary active:scale-95 transition-all group">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-primary transition-colors">
                            <Plus className="w-8 h-8 text-black" />
                        </div>
                        <span className="font-black italic uppercase tracking-widest text-sm">Adicionar Productos</span>
                    </button>

                    <button onClick={() => setIsTransferModalOpen(true)} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl flex flex-col items-center gap-6 hover:border-emerald-500 active:scale-95 transition-all group">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                            <ArrowLeftRight className="w-8 h-8 text-black group-hover:text-white" />
                        </div>
                        <span className="font-black italic uppercase tracking-widest text-sm">Unir / Traspasar Mesa</span>
                    </button>

                    <button onClick={() => router.push(`/admin/orders?order=${selectedTableOrder?.id}`)} className="bg-black p-10 rounded-[3rem] shadow-2xl flex flex-col items-center gap-6 active:scale-95 transition-all group col-span-1 md:col-span-2">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-primary transition-colors">
                            <Receipt className="w-8 h-8 text-white group-hover:text-black" />
                        </div>
                        <span className="font-black italic uppercase tracking-widest text-sm text-white">IR A COBRAR</span>
                    </button>
                </div>

                {/* Resumen Consumo */}
                <div className="mt-16 max-w-xl mx-auto w-full">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 text-center italic">Items Consumidos</h3>
                    <div className="space-y-3 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                        {loadingOrder ? <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-200" /> : selectedTableOrder?.order_items?.map((item: any, i: number) => (
                            <div key={i} className="flex justify-between items-center py-3 border-b border-dashed border-slate-100 last:border-0">
                                <span className="font-black italic uppercase text-xs text-slate-600">{item.products?.name} <span className="text-slate-300 ml-1 font-bold">x{item.quantity}</span></span>
                                <span className="font-black italic text-slate-400 text-sm">{formatPrice(item.subtotal)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Modal Traspaso */}
                {isTransferModalOpen && (
                    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
                        <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl">
                            <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-8">Traspasar Mesa</h2>
                            <div className="grid grid-cols-2 gap-3 mb-10 max-h-60 overflow-y-auto pr-2">
                                {realTables.filter(t => t.id !== selectedTable?.id).map(t => (
                                    <button key={t.id} onClick={() => setTargetTableId(t.id)} className={cn(
                                        "h-16 rounded-2xl border-2 font-black italic text-xs tracking-widest uppercase",
                                        targetTableId === t.id ? "border-primary bg-primary/5 text-slate-900" : "border-slate-50 text-slate-300"
                                    )}>{t.table_name}</button>
                                ))}
                            </div>
                            <div className="flex flex-col gap-3">
                                <Button className="h-16 rounded-2xl bg-black text-white hover:bg-emerald-500 font-black italic uppercase tracking-widest" onClick={async () => {
                                    if (!targetTableId || !selectedTableOrder) return
                                    try {
                                        const { transferOrderBetweenTables } = await import("@/actions/orders-fixed")
                                        await transferOrderBetweenTables({ order_id: selectedTableOrder.id, target_table_id: targetTableId, user_id: waiterUser.id })
                                        toast.success("Mesa traspasada")
                                        setView('tables')
                                        fetchTables()
                                    } catch (e: any) { toast.error(e.message) }
                                }}>CONFIRMAR</Button>
                                <Button variant="ghost" className="h-14 font-black italic uppercase text-rose-500" onClick={() => setIsTransferModalOpen(false)}>CANCELAR</Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    // D. MENU (Carta)
    const filteredProducts = activeCategory === 'all' ? products : products.filter(p => p.category_id === activeCategory)
    const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.qty), 0)

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-white">
            <header className="bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0 h-20">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" className="rounded-full w-12 h-12 bg-slate-50" onClick={() => { setView(selectedTable?.status === 'occupied' ? 'options' : 'tables'); setCart([]); }}>
                        <ArrowRight className="w-5 h-5 rotate-180" />
                    </Button>
                    <div>
                        <h2 className="text-xl font-black italic leading-none">{selectedTable?.table_name}</h2>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 italic">{selectedTable?.status === 'occupied' ? 'Adicionando a Servicio' : 'Nueva Comanda'}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-black italic text-primary">{formatPrice(cartTotal)}</p>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden relative">
                <main className="flex-1 flex flex-col bg-slate-50 min-w-0">
                    <div className="h-16 overflow-x-auto flex items-center gap-3 px-6 bg-white shrink-0 scrollbar-hide border-b border-slate-100">
                        {['all', ...categories.map(c => c.id)].map(catId => {
                            const name = catId === 'all' ? 'Todo' : categories.find(c => c.id === catId)?.name
                            return (
                                <button key={catId} onClick={() => setActiveCategory(catId)} className={cn(
                                    "px-6 h-10 rounded-full text-[11px] font-black uppercase tracking-widest transition-all border shrink-0",
                                    activeCategory === catId ? "bg-black text-white border-black" : "bg-white border-slate-100 text-slate-400"
                                )}>{name}</button>
                            )
                        })}
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 lg:grid-cols-4 gap-4 content-start">
                        {filteredProducts.map(product => {
                            const qty = cart.find(c => c.product.id === product.id)?.qty || 0
                            return (
                                <button key={product.id} onClick={() => {
                                    setCart(prev => {
                                        const ex = prev.find(p => p.product.id === product.id)
                                        if (ex) return prev.map(p => p.product.id === product.id ? { ...p, qty: p.qty + 1 } : p)
                                        return [...prev, { product, qty: 1 }]
                                    })
                                }} className={cn(
                                    "bg-white p-6 rounded-[2.5rem] border-2 flex flex-col text-left transition-all active:scale-95 relative group shadow-sm",
                                    qty > 0 ? "border-primary ring-4 ring-primary/10" : "border-transparent"
                                )}>
                                    <div className="flex justify-between mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-xs text-slate-300 italic uppercase">{product.name.charAt(0)}</div>
                                        {qty > 0 && <span className="bg-black text-white text-[10px] font-black px-2 py-1 rounded-lg">x{qty}</span>}
                                    </div>
                                    <h4 className="font-black italic text-sm text-slate-900 uppercase leading-tight line-clamp-2">{product.name}</h4>
                                    <p className="text-sm font-black italic text-primary mt-2">{formatPrice(product.price)}</p>
                                </button>
                            )
                        })}
                    </div>
                </main>

                {/* Resumen Lateral */}
                {cart.length > 0 && (
                    <div className="w-96 bg-white border-l border-slate-100 flex flex-col shadow-2xl z-20 absolute inset-y-0 right-0 lg:static animate-in slide-in-from-right duration-300">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-black italic uppercase tracking-tighter text-lg">Resumen</h3>
                            <span className="bg-black text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">{cart.length} SKUs</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 space-y-6">
                            {cart.map(item => (
                                <div key={item.product.id} className="flex justify-between gap-4">
                                    <div className="flex-1">
                                        <p className="font-black italic text-sm text-slate-900 uppercase leading-tight">{item.product.name}</p>
                                        <p className="text-xs font-bold text-slate-400 mt-1 italic">{formatPrice(item.product.price)}</p>
                                    </div>
                                    <div className="flex items-center gap-3 bg-slate-50 rounded-2xl p-2 h-12">
                                        <button onClick={() => setCart(c => c.map(p => p.product.id === item.product.id ? { ...p, qty: p.qty - 1 } : p).filter(p => p.qty > 0))} className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-rose-500 font-black">-</button>
                                        <span className="font-black italic text-sm w-4 text-center">{item.qty}</span>
                                        <button onClick={() => setCart(c => c.map(p => p.product.id === item.product.id ? { ...p, qty: p.qty + 1 } : p))} className="w-8 h-8 rounded-lg bg-black text-white shadow-sm flex items-center justify-center font-black">+</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-8 border-t border-slate-100 bg-slate-50/50">
                            <div className="flex justify-between items-end mb-8">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Total a Marchar</span>
                                <span className="text-3xl font-black italic text-slate-900 leading-none">{formatPrice(cartTotal)}</span>
                            </div>
                            <Button onClick={handleMarchar} disabled={submitting} className="w-full h-16 bg-black text-white hover:bg-primary hover:text-black rounded-[1.5rem] font-black italic uppercase text-sm tracking-widest shadow-2xl active:scale-95 transition-all gap-4">
                                {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <ChefHat className="w-6 h-6" />}
                                MARCHAR COMANDA
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
