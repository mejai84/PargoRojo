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
    ArrowLeft
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
            toast.error("PIN de Acceso Denegado")
            setPin("")
            return
        }

        setWaiterUser(data)
        setIsAuthenticated(true)
        toast.success(`Protocolo Iniciado: ${data.full_name}`)
    }

    const handleMarchar = async () => {
        if (!selectedTable || cart.length === 0 || submitting) return
        setSubmitting(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            const userId = user?.id || waiterUser?.id
            if (!userId) throw new Error("Terminal no autorizada")

            const items = cart.map(i => ({
                product_id: i.product.id,
                quantity: i.qty,
                unit_price: i.product.price,
                subtotal: i.product.price * i.qty
            }))

            if (selectedTable.status === 'occupied' && selectedTableOrder) {
                await addItemsToOrder(selectedTableOrder.id, items)
                toast.success("Adición enviada al Kernel de Cocina")
            } else {
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
                toast.success("Misión de Comanda Iniciada")
            }

            setCart([])
            setView('tables')
            setSelectedTableOrder(null)
            fetchTables()
        } catch (e: any) {
            toast.error("Error de Sincronización: " + e.message)
        } finally {
            setSubmitting(false)
        }
    }

    // ----------------------------------------------------------------------
    // UI SCREENS
    // ----------------------------------------------------------------------

    // A. LOGIN (PIN PAD REFINED)
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-[#0a0a0b] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
                {/* 🌌 AMBIANCE */}
                <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-primary/10 via-primary/[0.02] to-transparent pointer-events-none z-0" />
                <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none opacity-40 z-0 animate-pulse" />

                <div className="relative z-10 text-center mb-12">
                    <div className="w-24 h-24 bg-primary rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-3xl shadow-primary/20 animate-bounce relative group">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 group-hover:scale-175 transition-transform" />
                        <Lock className="w-10 h-10 text-black relative z-10" />
                    </div>
                    <h1 className="text-5xl font-black italic mb-4 tracking-tighter uppercase text-white leading-none">JAMALI<span className="text-primary italic">OS</span></h1>
                    <div className="flex items-center justify-center gap-3">
                        <div className="h-[2px] w-8 bg-primary/20" />
                        <p className="text-primary/60 font-black uppercase tracking-[0.5em] text-[10px] italic">WAITER TERMINAL v8.4</p>
                        <div className="h-[2px] w-8 bg-primary/20" />
                    </div>
                </div>

                <div className="bg-card/40 backdrop-blur-3xl p-12 rounded-[4.5rem] shadow-3xl border border-white/5 w-full max-w-sm flex flex-col items-center animate-in zoom-in-95 duration-500">
                    <div className="flex gap-6 mb-12">
                        {[0, 1, 2, 3].map((i) => (
                            <div key={i} className={cn(
                                "w-6 h-6 rounded-2xl transition-all duration-500 border-4",
                                i < pin.length ? "bg-primary border-primary scale-125 shadow-[0_0_20px_rgba(255,77,0,0.6)]" : "bg-white/5 border-white/10"
                            )} />
                        ))}
                    </div>

                    <div className="grid grid-cols-3 gap-6 w-full">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                            <button key={num} onClick={() => {
                                const newPin = pin + num
                                if (newPin.length <= 4) setPin(newPin)
                                if (newPin.length === 4) verifyPin(newPin)
                            }} className="h-24 rounded-[2rem] bg-white/5 border border-white/10 text-3xl font-black italic text-white active:bg-primary active:text-black transition-all active:scale-90 shadow-xl">{num}</button>
                        ))}
                        <div />
                        <button onClick={() => {
                            const newPin = pin + "0"
                            if (newPin.length <= 4) setPin(newPin)
                            if (newPin.length === 4) verifyPin(newPin)
                        }} className="h-24 rounded-[2rem] bg-white/5 border border-white/10 text-3xl font-black italic text-white active:bg-primary active:text-black transition-all active:scale-90 shadow-xl">0</button>
                        <button onClick={() => setPin(pin.slice(0, -1))} className="h-24 rounded-[2rem] bg-red-500/10 text-red-500 flex items-center justify-center active:bg-red-500 active:text-white transition-all active:scale-90 border border-red-500/20 shadow-xl"><ArrowRight className="w-10 h-10 rotate-180" /></button>
                    </div>
                </div>

                <div className="mt-12 text-white/20 text-[9px] font-black uppercase tracking-[0.8em] italic">SECURE NODE SHA-256</div>
            </div>
        )
    }

    // B. SALÓN (Mesas REFINED)
    if (view === 'tables') {
        return (
            <div className="min-h-screen bg-[#0a0a0b] pb-32 font-sans selection:bg-primary selection:text-black">
                {/* 🌌 AMBIANCE */}
                <div className="fixed top-0 left-0 w-full h-[600px] bg-gradient-to-b from-primary/10 via-primary/[0.02] to-transparent pointer-events-none z-0" />

                <header className="px-10 py-10 flex justify-between items-center sticky top-0 z-[50] border-b border-white/5 backdrop-blur-[100px] bg-black/40 relative h-32">
                    <div className="flex items-center gap-8">
                        <div className="w-16 h-16 rounded-2xl bg-primary text-black flex items-center justify-center shadow-3xl">
                            <Utensils className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white leading-none">MATRIZ <span className="text-primary italic">SALÓN</span></h2>
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <p className="text-[10px] text-primary/60 font-black uppercase tracking-[0.5em] italic">{waiterUser?.full_name}</p>
                            </div>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => { setIsAuthenticated(false); setWaiterUser(null); setPin(""); }} className="rounded-[1.5rem] w-16 h-16 bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all group">
                        <LogOut className="w-7 h-7 text-red-500 group-hover:text-white transition-colors" />
                    </Button>
                </header>

                <div className="p-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-8 relative z-10 max-w-[1800px] mx-auto">
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
                            "aspect-square rounded-[3.5rem] flex flex-col items-center justify-center gap-4 border-4 transition-all shadow-3xl active:scale-[0.9] relative overflow-hidden group",
                            table.status === 'free' ? "bg-card/40 border-white/5 hover:border-primary/40" : "bg-red-500/5 border-red-500/20"
                        )}>
                            <div className={cn(
                                "w-20 h-20 rounded-[2rem] flex items-center justify-center transition-all duration-700",
                                table.status === 'free' ? "bg-white/5 text-white/20 group-hover:bg-primary group-hover:text-black group-hover:rotate-12" : "bg-red-500 text-white animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.4)]"
                            )}>
                                {table.status === 'free' ? <Utensils className="w-10 h-10" /> : <Users className="w-10 h-10" />}
                            </div>
                            <div className="text-center space-y-1">
                                <span className="text-4xl font-black italic text-white tracking-tighter group-hover:scale-110 transition-transform block leading-none">{table.table_name}</span>
                                <span className={cn(
                                    "text-[9px] font-black uppercase tracking-[0.4em] italic",
                                    table.status === 'free' ? "text-white/20" : "text-red-500"
                                )}>{table.status === 'free' ? 'ESTRUCTURA LIBRE' : 'NODO OCUPADO'}</span>
                            </div>
                            {table.status === 'occupied' && (
                                <div className="absolute top-10 right-10 w-4 h-4 bg-red-500 rounded-full ring-8 ring-red-500/10 animate-ping" />
                            )}
                            <div className="absolute inset-x-0 bottom-0 h-1.5 bg-current opacity-5" />
                        </button>
                    ))}
                </div>

                {/* 🛸 GLOBAL METRIC BAR */}
                <div className="fixed bottom-10 left-10 right-10 z-[100] p-8 bg-foreground rounded-[3.5rem] text-background flex items-center justify-between shadow-3xl group/metric relative overflow-hidden animate-in slide-in-from-bottom-20 duration-1000 max-w-5xl mx-auto">
                    <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover/metric:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-8 relative z-10">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-background/10 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-2xl group-hover/metric:rotate-12 transition-transform duration-500">
                            <Activity className="w-8 h-8 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-xl font-black italic uppercase tracking-tighter text-primary">Master Waiter Cluster</h4>
                            <p className="text-[9px] text-background/40 font-black uppercase tracking-[0.4em] italic leading-none">
                                SECURE NODE v8.42 • SYSTEM OK
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-10 relative z-10">
                        <div className="text-right">
                            <p className="text-[8px] font-black uppercase tracking-[0.5em] text-white/20 mb-1 italic">Sincronización</p>
                            <div className="flex items-center justify-end gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                <p className="text-lg font-black italic tracking-tighter text-white">LIVE_STREAM</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // C. OPCIONES (Mesa Dashboard REFINED)
    if (view === 'options') {
        const currentTotal = selectedTableOrder?.total || 0
        return (
            <div className="min-h-screen bg-[#0a0a0b] flex flex-col p-10 relative overflow-hidden font-sans">
                {/* 🌌 AMBIANCE */}
                <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-primary/10 via-primary/[0.02] to-transparent pointer-events-none z-0" />
                <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none opacity-20 z-0 animate-pulse" />

                <header className="flex justify-between items-center mb-16 relative z-10">
                    <Button variant="ghost" className="h-20 px-10 rounded-[2.5rem] bg-card/40 border border-white/10 font-black italic uppercase text-white shadow-3xl hover:bg-muted active:scale-95 transition-all gap-5 group" onClick={() => { setView('tables'); setSelectedTableOrder(null); }}>
                        <ArrowLeft className="w-8 h-8 group-hover:-translate-x-1 transition-transform" /> VOLVER AL SALÓN
                    </Button>
                    <div className="px-10 py-4 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-black text-primary tracking-[0.5em] italic uppercase shadow-xl animate-pulse">
                        SESSION ACTIVE: {waiterUser?.full_name}
                    </div>
                </header>

                <div className="flex flex-col items-center mb-16 relative z-10">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-red-500 blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity" />
                        <div className="w-32 h-32 bg-red-500 rounded-[3rem] flex items-center justify-center shadow-3xl shadow-red-500/20 mb-8 relative z-10 animate-bounce-slow">
                            <Users className="w-14 h-14 text-white" />
                        </div>
                    </div>
                    <h2 className="text-6xl md:text-7xl font-black italic uppercase tracking-tighter text-white group-hover:scale-110 transition-transform duration-700">{selectedTable?.table_name}</h2>
                    <p className="text-primary font-black italic text-5xl md:text-6xl mt-6 drop-shadow-[0_0_20px_rgba(255,77,0,0.4)]">{formatPrice(currentTotal)}</p>
                    <p className="text-[12px] font-black text-white/20 tracking-[0.6em] uppercase mt-6 italic flex items-center gap-4">
                        <Signal className="w-4 h-4 text-primary animate-pulse" /> NODO BAJO CARGA DE SERVICIO
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full relative z-10 mb-20">
                    <button onClick={() => setView('order')} className="bg-card/40 backdrop-blur-xl p-12 rounded-[4.5rem] border border-white/5 shadow-3xl flex flex-col items-center gap-8 hover:border-primary/40 active:scale-95 transition-all duration-500 group relative overflow-hidden">
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-primary transition-all duration-700 shadow-2xl group-hover:rotate-12">
                            <Plus className="w-10 h-10 text-white group-hover:text-black" />
                        </div>
                        <div className="text-center space-y-1">
                            <span className="font-black italic uppercase tracking-tighter text-xl text-white block">ADICIONAR</span>
                            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20 italic">KERNEL DE PRODUCTOS</span>
                        </div>
                    </button>

                    <button onClick={() => setIsTransferModalOpen(true)} className="bg-card/40 backdrop-blur-xl p-12 rounded-[4.5rem] border border-white/5 shadow-3xl flex flex-col items-center gap-8 hover:border-emerald-500/40 active:scale-95 transition-all duration-500 group relative overflow-hidden">
                        <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500 transition-all duration-700 shadow-2xl group-hover:-rotate-12">
                            <ArrowLeftRight className="w-10 h-10 text-white" />
                        </div>
                        <div className="text-center space-y-1">
                            <span className="font-black italic uppercase tracking-tighter text-xl text-white block">TRASPASAR</span>
                            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20 italic">GEOMETRÍA DE SALÓN</span>
                        </div>
                    </button>

                    <button
                        disabled={!selectedTableOrder?.id}
                        onClick={() => router.push(`/admin/orders?order=${selectedTableOrder.id}`)}
                        className={cn(
                            "bg-foreground p-12 rounded-[4.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] flex flex-col items-center gap-8 active:scale-95 transition-all duration-700 group col-span-1 md:col-span-2 disabled:opacity-50 disabled:grayscale relative overflow-hidden"
                        )}
                    >
                        <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="w-24 h-24 bg-background/10 rounded-[2rem] flex items-center justify-center group-hover:bg-primary transition-all duration-700 shadow-3xl group-hover:scale-110">
                            {loadingOrder ? <Loader2 className="w-10 h-10 text-white animate-spin" /> : <Receipt className="w-10 h-10 text-white group-hover:text-black" />}
                        </div>
                        <div className="text-center space-y-1">
                            <span className="font-black italic uppercase tracking-[0.2em] text-2xl text-white block">
                                {loadingOrder ? "SINCRONIZANDO..." : "PROCEDER AL CIERRE"}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary italic">AUTORIZAR COBRO FINAL</span>
                        </div>
                    </button>
                </div>

                {/* Resumen Consumo REFINED */}
                <div className="relative z-10 max-w-2xl mx-auto w-full opacity-80 group/items">
                    <h3 className="text-[11px] font-black text-white/20 uppercase tracking-[0.8em] mb-10 text-center italic group-hover/items:text-primary transition-colors">Manifesto de Consumo</h3>
                    <div className="space-y-4 bg-card/40 backdrop-blur-2xl p-12 rounded-[4.5rem] border border-white/5 shadow-3xl">
                        {loadingOrder ? (
                            <div className="py-12 flex justify-center">
                                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                            </div>
                        ) : selectedTableOrder?.order_items?.length > 0 ? selectedTableOrder?.order_items?.map((item: any, i: number) => (
                            <div key={i} className="flex justify-between items-center py-5 border-b border-dashed border-white/5 last:border-0 group/row">
                                <div className="space-y-1">
                                    <span className="font-black italic uppercase text-lg text-white group-hover/row:text-primary transition-colors">{item.products?.name}</span>
                                    <p className="text-[9px] font-black text-white/20 uppercase tracking-widest italic leading-none">CANTIDAD PROCESADA: {item.quantity}</p>
                                </div>
                                <span className="font-black italic text-primary text-xl tracking-tighter">{formatPrice(item.subtotal)}</span>
                            </div>
                        )) : (
                            <p className="py-12 text-center text-[10px] font-black uppercase tracking-[0.4em] text-white/10 italic">KERNEL DE CONSUMO VACÍO</p>
                        )}
                    </div>
                </div>

                {/* Modal Traspaso REFINED */}
                {isTransferModalOpen && (
                    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-500">
                        <div className="bg-card border-4 border-primary/20 w-full max-w-lg rounded-[5rem] p-16 shadow-[0_0_100px_rgba(255,77,0,0.1)] relative overflow-hidden group/modal">
                            <div className="absolute top-0 right-0 p-16 opacity-[0.03] pointer-events-none -mr-16 -mt-16 group-hover/modal:scale-110 transition-transform duration-1000 rotate-12">
                                <ArrowLeftRight className="w-[400px] h-[400px]" />
                            </div>

                            <div className="flex justify-between items-start mb-16 relative z-10">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-3xl animate-pulse">
                                            <ArrowLeftRight className="w-8 h-8" />
                                        </div>
                                        <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white leading-none">Traspaso <span className="text-emerald-500 italic">Core</span></h2>
                                    </div>
                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic pl-20">REACCIÓN GEOMÉTRICA DE SALÓN</p>
                                </div>
                                <Button variant="ghost" className="h-16 w-16 rounded-[1.5rem] bg-white/5 border border-white/10 hover:bg-emerald-500 hover:text-white transition-all active:scale-90" onClick={() => setIsTransferModalOpen(false)}>
                                    <X className="w-8 h-8" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-16 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar relative z-10">
                                {realTables.filter(t => t.id !== selectedTable?.id).map(t => (
                                    <button key={t.id} onClick={() => setTargetTableId(t.id)} className={cn(
                                        "h-24 rounded-[2rem] border-4 font-black italic text-xl tracking-tighter uppercase transition-all duration-500 active:scale-90",
                                        targetTableId === t.id ? "border-emerald-500 bg-emerald-500 text-white shadow-[0_0_30px_rgba(16,185,129,0.3)]" : "border-white/5 bg-white/5 text-white/20 hover:border-white/20"
                                    )}>{t.table_name}</button>
                                ))}
                            </div>

                            <div className="flex flex-col gap-6 relative z-10">
                                <Button className="h-24 rounded-[2.5rem] bg-emerald-500 text-white hover:bg-emerald-600 font-black italic uppercase tracking-[0.4em] text-lg shadow-3xl shadow-emerald-500/20 active:scale-95 transition-all" onClick={async () => {
                                    if (!targetTableId || !selectedTableOrder) return
                                    try {
                                        const { transferOrderBetweenTables } = await import("@/actions/orders-fixed")
                                        await transferOrderBetweenTables({ order_id: selectedTableOrder.id, target_table_id: targetTableId, user_id: waiterUser.id })
                                        toast.success("Mesa traspasada exitosamente")
                                        setView('tables')
                                        fetchTables()
                                    } catch (e: any) { toast.error(e.message) }
                                }}>EJECUTAR TRASPASO</Button>
                                <Button variant="ghost" className="h-16 font-black italic uppercase text-white/20 hover:text-red-500 transition-colors tracking-widest text-[11px]" onClick={() => setIsTransferModalOpen(false)}>ABORTAR PROTOCOLO</Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    // D. MENU (Carta REFINED)
    const filteredProducts = activeCategory === 'all' ? products : products.filter(p => p.category_id === activeCategory)
    const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.qty), 0)

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-[#0a0a0b] font-sans">
            {/* 🪐 KERNEL HEADER */}
            <header className="bg-black/60 backdrop-blur-2xl border-b border-white/5 flex items-center justify-between px-10 shrink-0 h-32 relative z-50">
                <div className="flex items-center gap-8">
                    <Button variant="ghost" className="h-20 w-20 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-primary hover:text-black transition-all group active:scale-90 shadow-2xl" onClick={() => { setView(selectedTable?.status === 'occupied' ? 'options' : 'tables'); setCart([]); }}>
                        <ArrowLeft className="w-10 h-10 group-hover:-translate-x-1 transition-transform" />
                    </Button>
                    <div className="space-y-1">
                        <div className="flex items-center gap-4">
                            <h2 className="text-4xl font-black italic text-white leading-none tracking-tighter uppercase">{selectedTable?.table_name}</h2>
                            <div className="px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-[9px] font-black text-primary tracking-[0.4em] italic uppercase">
                                {selectedTable?.status === 'occupied' ? 'ADICIÓN_MODE' : 'NEW_SESSION'}
                            </div>
                        </div>
                        <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.5em] mt-1 italic">CLUSTER_WAITER: {waiterUser?.full_name}</p>
                    </div>
                </div>
                <div className="text-right group cursor-pointer active:scale-95 transition-all">
                    <p className="text-[9px] font-black uppercase text-primary/40 tracking-[0.8em] italic mb-1 group-hover:text-primary transition-colors">ACUMULADO_SESSION</p>
                    <p className="text-5xl font-black italic text-primary drop-shadow-[0_0_20px_rgba(255,77,0,0.5)] transition-all group-hover:scale-110">{formatPrice(cartTotal)}</p>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden relative">
                <main className="flex-1 flex flex-col min-w-0 bg-[#0a0a0b] relative z-10">
                    <div className="h-24 overflow-x-auto flex items-center gap-6 px-10 bg-black/40 shrink-0 scrollbar-hide border-b border-white/5 backdrop-blur-md">
                        {['all', ...categories.map(c => c.id)].map(catId => {
                            const name = catId === 'all' ? 'Todo el Cluster' : categories.find(c => c.id === catId)?.name
                            return (
                                <button key={catId} onClick={() => setActiveCategory(catId)} className={cn(
                                    "px-10 h-14 rounded-full text-[11px] font-black uppercase tracking-[0.3em] transition-all border-2 shrink-0 italic active:scale-90",
                                    activeCategory === catId ? "bg-primary text-black border-primary shadow-[0_0_30px_rgba(255,77,0,0.3)]" : "bg-white/5 border-white/10 text-white/20 hover:border-white/40"
                                )}>{name}</button>
                            )
                        })}
                    </div>

                    <div className="flex-1 overflow-y-auto p-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 content-start custom-scrollbar h-full bg-slate-50 relative bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
                        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0b] via-transparent to-transparent pointer-events-none" />

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
                                    "bg-card/40 backdrop-blur-xl p-10 rounded-[3.5rem] border-4 flex flex-col text-left transition-all active:scale-[0.85] relative group shadow-3xl h-[280px] justify-between overflow-hidden",
                                    qty > 0 ? "border-primary ring-8 ring-primary/10" : "border-white/5 hover:border-white/10"
                                )}>
                                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="flex justify-between items-start relative z-10">
                                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-2xl text-white/20 italic uppercase group-hover:bg-primary group-hover:text-black transition-all group-hover:rotate-12">{product.name.charAt(0)}</div>
                                        {qty > 0 && (
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-primary blur-xl animate-pulse" />
                                                <span className="bg-black text-white text-xl font-black px-4 py-2 rounded-2xl relative z-10 border border-primary/40 shadow-2xl">x{qty}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="relative z-10 space-y-3">
                                        <h4 className="font-black italic text-xl text-white uppercase leading-none tracking-tighter group-hover:text-primary transition-colors">{product.name}</h4>
                                        <p className="text-2xl font-black italic text-primary/60 drop-shadow-[0_0_15px_rgba(255,77,0,0.3)]">{formatPrice(product.price)}</p>
                                    </div>

                                    {/* MICRO INTERACTIONS */}
                                    <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0 translate-x-4">
                                        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-3xl text-black">
                                            <Plus className="w-7 h-7" />
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </main>

                {/* Resumen Lateral REFINED */}
                {cart.length > 0 && (
                    <div className="w-[500px] bg-card/60 backdrop-blur-3xl border-l border-white/10 flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.5)] z-[100] absolute inset-y-0 right-0 lg:static animate-in slide-in-from-right-12 duration-700 font-sans">
                        <div className="p-12 border-b border-white/5 flex justify-between items-center bg-black/40">
                            <div className="space-y-1">
                                <h3 className="font-black italic uppercase tracking-tighter text-3xl text-white">Consolidado</h3>
                                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] italic">KERNEL_DISPATCH_QUEUE</p>
                            </div>
                            <div className="px-5 py-2 bg-primary/10 border border-primary/20 rounded-full text-[11px] font-black text-primary uppercase tracking-widest">{cart.length} SKUs</div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-12 space-y-10 custom-scrollbar bg-black/20">
                            {cart.map(item => (
                                <div key={item.product.id} className="flex justify-between gap-8 group/item animate-in slide-in-from-right-4">
                                    <div className="flex-1 space-y-2">
                                        <p className="font-black italic text-xl text-white uppercase leading-none tracking-tighter group-hover/item:text-primary transition-colors">{item.product.name}</p>
                                        <p className="text-xs font-black text-white/20 mt-1 italic tracking-widest uppercase">{formatPrice(item.product.price)} / UNIT</p>
                                    </div>
                                    <div className="flex items-center gap-6 bg-white/5 border border-white/10 rounded-3xl p-3 h-20 shadow-xl group-hover/item:border-primary/20 transition-all">
                                        <button onClick={() => setCart(c => c.map(p => p.product.id === item.product.id ? { ...p, qty: p.qty - 1 } : p).filter(p => p.qty > 0))} className="w-12 h-12 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all shadow-3xl flex items-center justify-center font-black text-2xl active:scale-75">-</button>
                                        <span className="font-black italic text-2xl w-8 text-center text-white">{item.qty}</span>
                                        <button onClick={() => setCart(c => c.map(p => p.product.id === item.product.id ? { ...p, qty: p.qty + 1 } : p))} className="w-12 h-12 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white transition-all shadow-3xl flex items-center justify-center font-black text-2xl active:scale-75">+</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-12 border-t border-white/5 bg-black/60 shadow-[0_-50px_100px_rgba(0,0,0,0.3)]">
                            <div className="flex justify-between items-end mb-12">
                                <div className="space-y-1 text-left">
                                    <span className="text-[11px] font-black uppercase text-white/30 tracking-[0.6em] italic block">Gran Total a Liquidar</span>
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(255,77,0,0.8)]" />
                                        <span className="text-primary font-black uppercase italic tracking-widest text-[10px]">VERIFIED_LEDGER</span>
                                    </div>
                                </div>
                                <span className="text-6xl font-black italic text-white tracking-tighter leading-none drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">{formatPrice(cartTotal)}</span>
                            </div>
                            <Button onClick={handleMarchar} disabled={submitting} className="w-full h-28 bg-foreground text-background hover:bg-primary hover:text-black rounded-[2.5rem] font-black italic uppercase text-xl md:text-2xl tracking-[0.4em] shadow-3xl active:scale-95 transition-all gap-8 border-none group relative overflow-hidden">
                                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                {submitting ? <Loader2 className="w-10 h-10 animate-spin" /> : <ChefHat className="w-10 h-10 group-hover:rotate-12 transition-transform" />}
                                MARCHAR COMANDA
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <style jsx global>{`
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 4s ease-in-out infinite;
                }
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 20px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,102,0,0.2); }
            `}</style>
        </div>
    )
}
