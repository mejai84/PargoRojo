"use client"

import { Button } from "@/components/ui/button"
import {
    Clock,
    MapPin,
    Bike,
    CheckCircle2,
    ChefHat,
    AlertCircle,
    X,
    User,
    Phone,
    Map,
    RefreshCcw,
    Plus,
    Trash2,
    Search,
    ArrowLeft,
    Receipt,
    ShoppingBag,
    Minus,
    Star,
    MessageCircle,
    ArrowUpRight,
    ShieldCheck,
    Heart,
    Activity,
    Box,
    Sparkles,
    MonitorIcon,
    ArrowRight,
    Signal,
    Layers,
    Cpu,
    Zap,
    Flame
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { useRestaurant } from "@/providers/RestaurantProvider"
import { splitOrder } from "@/actions/orders-fixed"
import { toast } from "sonner"

// Helper para tiempo transcurrido
const getElapsed = (dateString: string) => {
    const start = new Date(dateString).getTime()
    const now = new Date().getTime()
    const diff = Math.floor((now - start) / 60000) // minutos
    if (diff < 1) return "Ahora"
    if (diff < 60) return `${diff} min`
    const hours = Math.floor(diff / 60)
    const mins = diff % 60
    return `${hours}h ${mins}m`
}

interface Product {
    id: string
    name: string
    price: number
    description: string | null
    image_url: string | null
}

interface OrderItem {
    id: string
    order_id: string
    product_id: string
    quantity: number
    unit_price: number
    products: {
        name: string
    } | null
}

interface Order {
    id: string
    created_at: string
    status: 'pending' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'payment_pending'
    order_type: 'pickup' | 'delivery'
    total: number
    subtotal: number
    guest_info: {
        name: string
        phone?: string
    }
    user_id?: string
    order_items: OrderItem[]
    payment_method: string
    payment_status: string
    delivery_address?: {
        street: string
        city: string
        phone: string
    }
    notes?: string
    waiter_id?: string
    table_id?: string
    waiter?: { full_name: string }
    tables?: { table_name: string }
}

function OrdersContent() {
    const { restaurant } = useRestaurant()
    const searchParams = useSearchParams()
    const orderIdFromUrl = searchParams.get('order')

    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [orders, setOrders] = useState<Order[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)

    // Create Modal State
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [newOrderItems, setNewOrderItems] = useState<(Product & { quantity: number })[]>([])
    const [customerName, setCustomerName] = useState("")
    const [customerPhone, setCustomerPhone] = useState("")
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
    const [selectedTableId, setSelectedTableId] = useState<string>("")
    const [tables, setTables] = useState<any[]>([])
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [includeTip, setIncludeTip] = useState(true)

    // Split Order State
    const [isSplitting, setIsSplitting] = useState(false)
    const [selectedItemsForSplit, setSelectedItemsForSplit] = useState<{ itemId: string, quantity: number }[]>([])

    // Customer Search State
    const [allCustomers, setAllCustomers] = useState<any[]>([])
    const [customerSearch, setCustomerSearch] = useState("")

    const fetchOrders = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    order_items (
                        *,
                        products (name)
                    ),
                    tables (table_name)
                `)
                .eq('restaurant_id', restaurant?.id)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Error fetching orders:', error)
                const { data: simpleData } = await supabase
                    .from('orders')
                    .select('*')
                    .order('created_at', { ascending: false })

                setOrders(simpleData?.map(order => ({ ...order, order_items: [], tables: null })) || [])
            } else {
                setOrders(data || [])
            }
        } catch (err) {
            console.error('Unexpected error:', err)
            setOrders([])
        } finally {
            setLoading(false)
        }
    }

    const fetchInitialData = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
            setCurrentUser(profile)
        }

        const { data: tablesData } = await supabase.from('tables').select('*').eq('active', true).order('table_number', { ascending: true })
        setTables(tablesData || [])

        const { data: customers } = await supabase.from('profiles').select('id, full_name, phone, loyalty_points')
        setAllCustomers(customers || [])

        const { data: prodData } = await supabase.from('products').select('*').eq('is_available', true).order('name')
        setProducts(prodData || [])
    }

    useEffect(() => {
        if (restaurant) {
            fetchOrders()
            fetchInitialData()
        }
        const interval = setInterval(() => {
            if (restaurant) fetchOrders()
        }, 30000)
        return () => clearInterval(interval)
    }, [restaurant])

    useEffect(() => {
        if (orderIdFromUrl && orders.length > 0) {
            const ord = orders.find(o => o.id === orderIdFromUrl)
            if (ord) setSelectedOrder(ord)
        }
    }, [orderIdFromUrl, orders])

    const handleCreateOrder = async () => {
        if (newOrderItems.length === 0) return alert("Añade productos")

        try {
            const total = newOrderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0)
            const orderData = {
                restaurant_id: restaurant?.id,
                status: 'pending',
                order_type: 'pickup',
                total: total,
                subtotal: total,
                guest_info: {
                    name: customerName || (selectedTableId ? tables.find(t => t.id === selectedTableId)?.table_name : "Cliente Casa"),
                    phone: customerPhone
                },
                user_id: selectedCustomerId,
                payment_method: 'cash',
                payment_status: 'pending',
                waiter_id: currentUser?.id,
                table_id: selectedTableId || null
            }

            const { data: order, error } = await supabase.from('orders').insert([orderData]).select().single()
            if (error) throw error

            const itemsToInsert = newOrderItems.map(item => ({
                order_id: order.id,
                product_id: item.id,
                quantity: item.quantity,
                unit_price: item.price
            }))

            await supabase.from('order_items').insert(itemsToInsert)

            if (selectedTableId) {
                await supabase.from('tables').update({ status: 'occupied' }).eq('id', selectedTableId)
            }

            setIsCreateOpen(false)
            setNewOrderItems([])
            setCustomerName(""); setCustomerPhone(""); setSelectedCustomerId(null); setSelectedTableId("")
            fetchOrders()
            toast.success("ORDEN DE COMANDA REGISTRADA")
        } catch (e: any) {
            toast.error("Error al crear: " + e.message)
        }
    }

    const selectCustomer = (c: any) => {
        setSelectedCustomerId(c.id)
        setCustomerName(c.full_name)
        setCustomerPhone(c.phone || "")
        setCustomerSearch("")
    }

    const activeProcessing = orders.filter(o => ['pending', 'preparing'].includes(o.status))
    const paymentPending = orders.filter(o => ['ready', 'payment_pending', 'out_for_delivery'].includes(o.status))
    const completedOrders = orders.filter(o => ['delivered', 'cancelled'].includes(o.status))

    return (
        <div className="min-h-screen bg-transparent text-foreground p-4 md:p-12 font-sans selection:bg-primary selection:text-primary-foreground relative overflow-hidden">

            {/* 🌌 AMBIANCE LAYER */}
            <div className="fixed top-0 left-0 w-full h-[600px] bg-gradient-to-b from-primary/10 via-primary/[0.02] to-transparent pointer-events-none z-0" />
            <div className="fixed -bottom-40 -right-40 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none opacity-20 z-0 animate-pulse" />

            <div className="max-w-[1700px] mx-auto space-y-16 animate-in fade-in duration-1000 relative z-10">

                {/* 🚀 ORDERS CONTROL HEADER */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-12 border-b border-border/50 pb-12">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-10">
                        <Link href="/admin">
                            <Button variant="ghost" size="icon" className="h-20 w-20 rounded-[2.5rem] bg-card border border-border shadow-3xl hover:bg-muted active:scale-90 transition-all group overflow-hidden relative">
                                <ArrowLeft className="w-10 h-10 group-hover:-translate-x-1 transition-transform relative z-10" />
                            </Button>
                        </Link>
                        <div className="space-y-6">
                            <div className="flex flex-wrap items-center gap-4">
                                <h1 className="text-6xl md:text-7xl font-black italic tracking-tighter uppercase leading-none text-foreground text-glow whitespace-nowrap">CENTRO DE <span className="text-primary italic">PEDIDOS</span></h1>
                                <div className="px-5 py-2 bg-primary/10 border-2 border-primary/20 rounded-[1.5rem] text-[11px] font-black text-primary tracking-[0.3em] italic uppercase shadow-xl animate-pulse flex items-center gap-3">
                                    <ShoppingBag className="w-4 h-4" />
                                    OPERATIONS_ENGINE_V4
                                </div>
                            </div>
                            <p className="text-[11px] text-muted-foreground font-black uppercase tracking-[0.5em] italic flex items-center gap-4 opacity-60">
                                <Zap className="w-5 h-5 text-primary" /> Auditoría de Comanda, Despacho & Flujo de Caja
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6">
                        <Button
                            onClick={() => setIsCreateOpen(true)}
                            className="h-20 px-10 bg-foreground text-background hover:bg-primary hover:text-white font-black uppercase text-xs tracking-[0.4em] italic rounded-[2.5rem] shadow-3xl transition-all gap-5 border-none group active:scale-95 whitespace-nowrap"
                        >
                            <Plus className="w-7 h-7 group-hover:scale-110 transition-transform" />
                            NUEVO PEDIDO ELITE
                        </Button>
                        <Link href="/admin/kitchen">
                            <Button variant="ghost" className="h-20 px-10 rounded-[2.5rem] bg-card border-4 border-border/40 font-black uppercase text-xs tracking-[0.4em] italic shadow-3xl transition-all gap-5 hover:border-primary/40 group active:scale-95">
                                <ChefHat className="w-7 h-7 group-hover:scale-110 transition-transform text-primary" />
                                MONITOR COCINA
                            </Button>
                        </Link>
                        <Button onClick={fetchOrders} variant="ghost" className="h-20 w-20 bg-card border-4 border-border/40 rounded-[2.5rem] hover:text-primary hover:border-primary/40 shadow-3xl transition-all group/btn active:scale-95">
                            <RefreshCcw className={cn("w-8 h-8 group-hover/btn:rotate-180 transition-transform duration-700", loading && "animate-spin")} />
                        </Button>
                    </div>
                </div>

                {/* 📊 KPI DASHBOARD */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <OrderKPI
                        label="En Producción"
                        value={activeProcessing.length}
                        color="text-amber-500"
                        icon={<ChefHat className="w-20 h-20" />}
                        sub="KITCHEN_NODES"
                        delay={0}
                        highlight={activeProcessing.length > 5}
                    />
                    <OrderKPI
                        label="Por Cobrar"
                        value={paymentPending.length}
                        color="text-primary"
                        icon={<Receipt className="w-20 h-20" />}
                        sub="CASH_DUE_NOW"
                        delay={100}
                        highlight={paymentPending.length > 0}
                    />
                    <OrderKPI
                        label="Despachos Hoy"
                        value={completedOrders.length}
                        color="text-emerald-500"
                        icon={<CheckCircle2 className="w-20 h-20" />}
                        sub="COMPLETED_SYC"
                        delay={200}
                    />
                    <OrderKPI
                        label="Ventas Brutas"
                        value={`$${orders.reduce((a, b) => a + b.total, 0).toLocaleString()}`}
                        color="text-blue-500"
                        icon={<Activity className="w-20 h-20" />}
                        sub="TOTAL_GROSS_REVENUE"
                        delay={300}
                    />
                </div>

                {/* 🛡️ ORDERS KANBAN ENGINE */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Columna: PRODUCCIÓN */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-4 px-8 py-4 bg-blue-500/5 border-2 border-blue-500/20 rounded-[2rem] w-fit">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                            <h2 className="text-[11px] font-black text-blue-500 tracking-[0.4em] uppercase italic leading-none">Producción Activa</h2>
                        </div>
                        <div className="space-y-6">
                            {activeProcessing.map((order, idx) => (
                                <OrderCard key={order.id} order={order} onView={() => setSelectedOrder(order)} delay={idx * 50} />
                            ))}
                            {activeProcessing.length === 0 && (
                                <EmptyState label="LISTA DE COMANDA VACÍA" sub="NO SE DETECTAN PEDIDOS EN TRÁNSITO DE FOGÓN" icon={<Cpu className="w-16 h-16" />} />
                            )}
                        </div>
                    </div>

                    {/* Columna: POR COBRAR */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-4 px-8 py-4 bg-primary/5 border-2 border-primary/20 rounded-[2rem] w-fit shadow-lg shadow-primary/10">
                            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" />
                            <h2 className="text-[11px] font-black text-primary tracking-[0.4em] uppercase italic leading-none">Pendiente de Cierre</h2>
                        </div>
                        <div className="space-y-6">
                            {paymentPending.map((order, idx) => (
                                <OrderCard key={order.id} order={order} onView={() => setSelectedOrder(order)} delay={idx * 50} isCritical />
                            ))}
                            {paymentPending.length === 0 && (
                                <EmptyState label="SIN CUENTAS PENDIENTES" sub="TODAS LAS MESAS HAN SIDO CONCILIADAS" icon={<ShieldCheck className="w-16 h-16" />} />
                            )}
                        </div>
                    </div>

                    {/* Columna: RECIENTES */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-4 px-8 py-4 bg-emerald-500/5 border-2 border-emerald-500/20 rounded-[2rem] w-fit opacity-60">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            <h2 className="text-[11px] font-black text-emerald-500 tracking-[0.4em] uppercase italic leading-none">Historial Reciente</h2>
                        </div>
                        <div className="space-y-6 opacity-60 hover:opacity-100 transition-opacity">
                            {completedOrders.slice(0, 10).map((order, idx) => (
                                <OrderCard key={order.id} order={order} onView={() => setSelectedOrder(order)} delay={idx * 50} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* 🏷️ GLOBAL METRIC HUB */}
                <div className="p-10 bg-foreground rounded-[4rem] text-background flex flex-col md:flex-row items-center justify-between shadow-3xl group/metric relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover/metric:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-10 relative z-10">
                        <div className="w-20 h-20 rounded-[2rem] bg-background/10 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-2xl group-hover/metric:rotate-12 transition-transform duration-500">
                            <MonitorIcon className="w-10 h-10 text-primary drop-shadow-[0_0_15px_rgba(255,77,0,0.6)]" />
                        </div>
                        <div className="space-y-2 text-center md:text-left">
                            <h4 className="text-2xl font-black italic uppercase tracking-tighter text-primary">Master Operations Hub</h4>
                            <p className="text-[10px] text-background/40 font-black uppercase tracking-[0.4em] italic leading-none">
                                SYSTEM v8.42 • KERNEL OPTIMIZED FOR POS_REALTIME_SYNC
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-12 mt-8 md:mt-0 relative z-10">
                        <div className="text-right">
                            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white/20 mb-1 italic">Active Nodes</p>
                            <p className="text-2xl font-black italic tracking-tighter text-emerald-500">{orders.length} PEDIDOS ACTIVOS</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white/20 mb-1 italic">Network Health</p>
                            <p className="text-2xl font-black italic tracking-tighter text-white">SA-EAST_TRANSIT</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 🛠️ MODAL NUEVO PEDIDO ELITE */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-card border-4 border-primary/20 rounded-[5rem] w-full max-w-7xl h-[90vh] flex flex-col shadow-[0_0_150px_rgba(255,102,0,0.15)] relative overflow-hidden group/modal animate-in zoom-in-95 duration-500">
                        <div className="p-12 border-b-4 border-border/40 flex justify-between items-center bg-muted/20 relative z-20">
                            <div className="space-y-3">
                                <h2 className="text-5xl font-black italic uppercase tracking-tighter text-foreground leading-none">NUEVA <span className="text-primary">COMANDA_ENGINE</span></h2>
                                <p className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.4em] italic pl-2 italic">TERMINAL TÁCTICA DE INGRESO RÁPIDO</p>
                            </div>
                            <Button variant="ghost" className="h-16 w-16 rounded-[1.5rem] bg-muted/40 hover:bg-primary hover:text-white transition-all active:scale-90" onClick={() => setIsCreateOpen(false)}>
                                <X className="w-8 h-8" />
                            </Button>
                        </div>

                        <div className="flex-1 flex overflow-hidden relative z-10">
                            {/* Products Selector Matrix */}
                            <div className="flex-1 p-12 overflow-y-auto custom-scrollbar space-y-10">
                                <div className="relative group/search">
                                    <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-8 h-8 text-muted-foreground group-focus-within/search:text-primary transition-colors" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="LOCALIZAR SKU POR NOMBRE O ESTRATEGIA..."
                                        className="w-full h-24 pl-24 pr-10 rounded-[3rem] bg-muted/40 border-4 border-border/40 focus:border-primary/50 outline-none font-black text-xl italic tracking-[0.1em] uppercase transition-all text-foreground placeholder:text-muted-foreground/20 shadow-inner"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => {
                                                const exist = newOrderItems.find(i => i.id === p.id)
                                                if (exist) setNewOrderItems(prev => prev.map(i => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i))
                                                else setNewOrderItems(prev => [...prev, { ...p, quantity: 1 }])
                                            }}
                                            className="group/btn bg-card/60 border-4 border-border/40 p-8 rounded-[3rem] text-left hover:border-primary/40 hover:bg-primary/5 transition-all relative overflow-hidden active:scale-95 shadow-lg"
                                        >
                                            <div className="absolute top-0 right-0 p-8 opacity-0 group-hover/btn:opacity-10 transition-opacity">
                                                <ShoppingBag className="w-16 h-16 text-primary" />
                                            </div>
                                            <div className="space-y-4">
                                                <h4 className="text-xl font-black italic uppercase tracking-tighter text-foreground group-hover/btn:text-primary transition-colors leading-tight">{p.name}</h4>
                                                <div className="flex justify-between items-end">
                                                    <span className="text-3xl font-black italic text-primary">${p.price.toLocaleString()}</span>
                                                    <div className="w-12 h-12 rounded-2xl bg-foreground text-background flex items-center justify-center opacity-0 group-hover/btn:opacity-100 transition-opacity">
                                                        <Plus className="w-6 h-6" />
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Summary Console */}
                            <div className="w-[450px] bg-card/40 border-l-4 border-border/40 backdrop-blur-3xl flex flex-col">
                                <div className="flex-1 p-10 overflow-y-auto custom-scrollbar space-y-12">
                                    {/* Loyalty / Customer Field */}
                                    <div className="space-y-6">
                                        <label className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.5em] ml-10 italic flex items-center gap-3">
                                            <Star className="w-4 h-4 text-primary" /> FIDELIZACIÓN_CLIENTE
                                        </label>
                                        {!selectedCustomerId ? (
                                            <div className="space-y-4">
                                                <div className="relative group/field">
                                                    <input
                                                        value={customerSearch}
                                                        onChange={e => setCustomerSearch(e.target.value)}
                                                        placeholder="VINCULAR CLIENTE..."
                                                        className="w-full h-16 bg-muted/40 border-4 border-border rounded-[2rem] px-8 outline-none text-foreground focus:border-primary font-black italic text-xs tracking-wider transition-all uppercase placeholder:text-muted-foreground/10"
                                                    />
                                                    {customerSearch && (
                                                        <div className="absolute top-20 left-4 right-4 bg-card border-4 border-primary/20 rounded-[2.5rem] p-4 z-50 shadow-5xl animate-in fade-in slide-in-from-top-4">
                                                            {allCustomers.filter(c => c.full_name?.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone?.includes(customerSearch)).map(c => (
                                                                <button key={c.id} onClick={() => selectCustomer(c)} className="w-full p-6 text-left hover:bg-primary/5 rounded-[1.5rem] flex justify-between items-center transition-all group/res">
                                                                    <div>
                                                                        <p className="text-sm font-black italic uppercase text-foreground group-hover/res:text-primary transition-colors">{c.full_name}</p>
                                                                        <p className="text-[10px] font-bold text-muted-foreground/40">{c.phone}</p>
                                                                    </div>
                                                                    <div className="bg-primary/10 px-4 py-1.5 rounded-full text-[10px] font-black text-primary italic">{c.loyalty_points} PTS</div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-1 gap-4">
                                                    <input value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full h-16 bg-muted/40 border-4 border-border rounded-[2rem] px-8 outline-none font-bold italic text-xs uppercase text-foreground focus:border-primary transition-all shadow-inner" placeholder="NOMBRE GUEST" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-primary p-8 rounded-[2.5rem] text-black relative overflow-hidden group/active">
                                                <ShieldCheck className="absolute -right-6 -bottom-6 w-32 h-32 opacity-10 group-hover/active:scale-110 transition-transform" />
                                                <div className="flex justify-between items-start mb-4">
                                                    <p className="text-[10px] font-black uppercase tracking-widest italic opacity-60">Socio Vinculado</p>
                                                    <button onClick={() => setSelectedCustomerId(null)} className="p-2 hover:bg-black/10 rounded-xl transition-colors"><X className="w-4 h-4" /></button>
                                                </div>
                                                <p className="text-3xl font-black italic uppercase tracking-tighter leading-none">{customerName}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Table Assignment */}
                                    <div className="space-y-6">
                                        <label className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.5em] ml-10 italic flex items-center gap-3">
                                            <MapPin className="w-4 h-4 text-primary" /> NODO_MESA
                                        </label>
                                        <select
                                            value={selectedTableId}
                                            onChange={e => setSelectedTableId(e.target.value)}
                                            className="w-full h-20 bg-muted/40 border-4 border-border rounded-[2.5rem] px-8 outline-none font-black italic text-xs tracking-widest uppercase transition-all shadow-inner"
                                        >
                                            <option value="">SERVICIO RÁPIDO / HUB</option>
                                            {tables.map(t => <option key={t.id} value={t.id}>{t.table_name.toUpperCase()} - {t.location.toUpperCase()}</option>)}
                                        </select>
                                    </div>

                                    {/* Order Items List */}
                                    <div className="space-y-6 flex-1">
                                        <label className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.5em] ml-10 italic flex items-center gap-3">
                                            <Layers className="w-4 h-4 text-primary" /> CESTA_ACTIVA ({newOrderItems.length})
                                        </label>
                                        <div className="space-y-4">
                                            {newOrderItems.map(item => (
                                                <div key={item.id} className="group/item bg-muted/20 border-4 border-border/40 p-6 rounded-[2.5rem] flex justify-between items-center hover:border-primary/20 transition-all shadow-inner">
                                                    <div className="flex-1 pr-4">
                                                        <p className="text-sm font-black italic uppercase text-foreground leading-none mb-1 group-hover/item:text-primary transition-colors">{item.name}</p>
                                                        <p className="text-[10px] font-bold text-muted-foreground/40 italic">${item.price.toLocaleString()}</p>
                                                    </div>
                                                    <div className="flex items-center gap-4 bg-card rounded-2xl border-2 border-border p-2">
                                                        <button onClick={() => item.quantity > 1 ? setNewOrderItems(p => p.map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i)) : setNewOrderItems(p => p.filter(i => i.id !== item.id))} className="w-10 h-10 flex items-center justify-center hover:bg-rose-500 hover:text-white rounded-xl transition-all">
                                                            <Minus className="w-4 h-4" />
                                                        </button>
                                                        <span className="w-8 text-center font-black italic text-lg">{item.quantity}</span>
                                                        <button onClick={() => setNewOrderItems(p => p.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))} className="w-10 h-10 flex items-center justify-center hover:bg-primary hover:text-black rounded-xl transition-all">
                                                            <Plus className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Checkout Footer */}
                                <div className="p-10 bg-card border-t-4 border-border/40 space-y-8">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.5em] italic">TOTAL_ESTIMADO</span>
                                        <span className="text-5xl font-black italic tracking-tighter text-primary animate-pulse">
                                            ${newOrderItems.reduce((a, b) => a + (b.price * b.quantity), 0).toLocaleString()}
                                        </span>
                                    </div>
                                    <Button
                                        onClick={handleCreateOrder}
                                        disabled={newOrderItems.length === 0}
                                        className="w-full h-24 bg-foreground text-background hover:bg-primary hover:text-white rounded-[3rem] font-black text-2xl italic tracking-tighter uppercase shadow-5xl transition-all border-none gap-6 active:scale-95 group/check"
                                    >
                                        DESPACHAR COMANDA <ArrowRight className="w-8 h-8 group-hover/check:translate-x-3 transition-transform" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 📋 DETAIL MODAL ELITE */}
            {selectedOrder && (
                <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-card border-4 border-primary/20 rounded-[5rem] w-full max-w-4xl max-h-[92vh] flex flex-col shadow-5xl animate-in zoom-in-95 duration-500 overflow-hidden relative">
                        <div className={cn(
                            "p-16 border-b-4 flex justify-between items-start transition-colors relative overflow-hidden group/head",
                            selectedOrder.status === 'payment_pending' ? 'bg-primary/10 border-primary/20' : 'bg-muted/20 border-border/40'
                        )}>
                            <div className="relative z-10 space-y-4">
                                <p className="text-[11px] font-black uppercase text-primary/40 tracking-[0.5em] italic flex items-center gap-3">
                                    <Cpu className="w-4 h-4" /> NODE_ORDER_{selectedOrder.id.split('-')[0].toUpperCase()}
                                </p>
                                <h2 className="text-7xl font-black italic uppercase tracking-tighter text-foreground leading-none">{selectedOrder.tables?.table_name || 'MOSTRADOR_HUB'}</h2>
                                <div className="flex gap-4">
                                    <div className="px-5 py-2 bg-foreground text-background rounded-full text-[10px] font-black uppercase italic tracking-widest">{selectedOrder.status}</div>
                                    <div className="px-5 py-2 bg-muted/40 border-2 border-border text-muted-foreground rounded-full text-[10px] font-black uppercase italic tracking-widest">{selectedOrder.order_type}</div>
                                </div>
                            </div>
                            <Button variant="ghost" className="h-20 w-20 rounded-[2.5rem] bg-card border-4 border-border/40 hover:bg-primary hover:border-primary/40 hover:text-white transition-all active:scale-90 relative z-10" onClick={() => setSelectedOrder(null)}>
                                <X className="w-10 h-10" />
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-16 space-y-16 custom-scrollbar relative z-10">
                            {/* Inner Grid */}
                            <div className="grid md:grid-cols-2 gap-16">
                                {/* Order Details */}
                                <div className="space-y-10">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.5em] ml-10 italic flex items-center gap-3">
                                            <Layers className="w-4 h-4" /> REGLAS_COMANDA
                                        </h3>
                                        {!['delivered', 'cancelled'].includes(selectedOrder.status) && (
                                            <Button
                                                variant="ghost"
                                                onClick={() => { setIsSplitting(!isSplitting); setSelectedItemsForSplit([]); }}
                                                className={cn(
                                                    "px-6 h-10 rounded-full font-black uppercase text-[9px] tracking-widest italic border-2 transition-all",
                                                    isSplitting ? "bg-rose-500 text-white border-rose-500" : "bg-muted/40 text-muted-foreground border-border/40"
                                                )}
                                            >
                                                {isSplitting ? "CANCELAR" : "DIVIDIR CUENTA"}
                                            </Button>
                                        )}
                                    </div>
                                    <div className="space-y-4">
                                        {selectedOrder.order_items?.map((item: any, i: number) => {
                                            const isSelected = selectedItemsForSplit.find(si => si.itemId === item.id)
                                            return (
                                                <div
                                                    key={i}
                                                    onClick={() => {
                                                        if (!isSplitting) return
                                                        isSelected
                                                            ? setSelectedItemsForSplit(p => p.filter(si => si.itemId !== item.id))
                                                            : setSelectedItemsForSplit(p => [...p, { itemId: item.id, quantity: item.quantity }])
                                                    }}
                                                    className={cn(
                                                        "group/item flex items-center justify-between p-6 rounded-[2.5rem] border-4 transition-all relative overflow-hidden",
                                                        isSplitting ? "cursor-pointer" : "",
                                                        isSelected ? "bg-primary/10 border-primary shadow-lg shadow-primary/10" : "bg-muted/20 border-border/40 hover:border-primary/20"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-6">
                                                        <div className={cn(
                                                            "w-14 h-14 rounded-2xl flex items-center justify-center font-black italic text-2xl border-2 transition-all shadow-xl",
                                                            isSelected ? "bg-primary text-black border-primary scale-110" : "bg-card border-border text-primary"
                                                        )}>
                                                            {item.quantity}
                                                        </div>
                                                        <span className="font-black italic uppercase text-lg text-foreground group-hover/item:text-primary transition-colors">{item.products?.name}</span>
                                                    </div>
                                                    <span className="font-black italic text-muted-foreground/60 text-xl">${(item.unit_price * item.quantity).toLocaleString()}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Intelligence Hub */}
                                <div className="space-y-10">
                                    <div className="bg-muted/30 border-4 border-border/40 p-12 rounded-[4rem] space-y-10 shadow-inner">
                                        <div className="space-y-3">
                                            <h3 className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.5em] italic flex items-center gap-3"> <Signal className="w-4 h-4 text-primary" /> TITULAR_NODAL</h3>
                                            <p className="text-4xl font-black italic uppercase tracking-tighter text-foreground leading-none">{selectedOrder.guest_info?.name}</p>
                                            <p className="text-sm font-black text-muted-foreground/40 italic">{selectedOrder.guest_info?.phone || 'ANÓNIMO_SYNC'}</p>
                                        </div>

                                        <div className="pt-10 border-t-4 border-border/40 space-y-6">
                                            <p className="text-[11px] font-black text-primary uppercase tracking-[0.5em] italic">LOYALTY_MATRIX</p>
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 rounded-[1.5rem] bg-primary/20 flex items-center justify-center text-primary shadow-lg shadow-primary/10 animate-pulse">
                                                    <Star className="w-8 h-8 fill-primary" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-2xl font-black italic uppercase tracking-tighter text-foreground">PROYECCIÓN: +{Math.floor(selectedOrder.total / 1000)} PTS</p>
                                                    <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em] italic">Socio de Alta Franja</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment / Action Matrix */}
                            <div className="pt-16 border-t-4 border-border/40 space-y-16">
                                <div className="flex flex-col md:flex-row justify-between items-center gap-10">
                                    <div className="space-y-4 w-full md:w-auto">
                                        <p className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.5em] italic flex items-center gap-3"> <Signal className="w-4 h-4 text-primary" /> FACTURACIÓN</p>
                                        <div className="space-y-2">
                                            <p className="text-4xl font-black italic tracking-tighter text-muted-foreground/30 leading-none">NETO: ${selectedOrder.total.toLocaleString()}</p>
                                            <p className="text-7xl font-black italic tracking-tighter text-foreground leading-none animate-in slide-in-from-left-4 transition-all">
                                                TOTAL: ${(selectedOrder.total + (includeTip && restaurant?.apply_service_charge ? (selectedOrder.total * (restaurant.service_charge_percentage! / 100)) : 0)).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    {restaurant?.apply_service_charge && (
                                        <div className="bg-primary/5 border-4 border-primary/20 p-8 rounded-[3rem] w-full md:w-[450px] space-y-6 shadow-2xl">
                                            <div className="flex items-center gap-4">
                                                <Heart className="w-8 h-8 text-primary fill-primary/20" />
                                                <p className="text-[11px] font-black uppercase text-foreground tracking-[0.3em] italic leading-tight">MÓDULO DE PROPINA SUGERIDA ({restaurant.service_charge_percentage}%)</p>
                                            </div>
                                            <div className="flex gap-4">
                                                <button onClick={() => setIncludeTip(true)} className={cn("flex-1 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all border-4", includeTip ? "bg-primary text-black border-primary shadow-xl" : "bg-card border-border/40 text-muted-foreground")}>SÍ_INCLUIR</button>
                                                <button onClick={() => setIncludeTip(false)} className={cn("flex-1 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all border-4", !includeTip ? "bg-foreground text-background border-foreground shadow-xl" : "bg-card border-border/40 text-muted-foreground")}>NO_EXCLUIR</button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-wrap justify-end gap-6 pb-8">
                                    {['ready', 'payment_pending', 'out_for_delivery'].includes(selectedOrder.status) && (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full">
                                            <PaymentButton label="EFECTIVO" icon="💵" color="bg-emerald-500" onClick={() => handlePayment('cash', selectedOrder)} />
                                            <PaymentButton label="TARJETA" icon="💳" color="bg-indigo-500" onClick={() => handlePayment('card', selectedOrder)} />
                                            <PaymentButton label="TRANSF." icon="🏦" color="bg-cyan-500" onClick={() => handlePayment('transfer', selectedOrder)} />
                                            <PaymentButton label="CRÉDITO" icon="📋" color="bg-amber-500" onClick={() => handlePayment('credit', selectedOrder)} />
                                        </div>
                                    )}
                                    {selectedOrder.status === 'pending' && <ActionBtn label="MARCHAR PREPARANDO" icon={<ChefHat className="w-8 h-8" />} color="bg-foreground" onClick={() => updateStatus(selectedOrder.id, 'preparing')} />}
                                    {selectedOrder.status === 'preparing' && <ActionBtn label="MARCAR FINALIZADO" icon={<CheckCircle2 className="w-8 h-8" />} color="bg-purple-600" onClick={() => updateStatus(selectedOrder.id, 'ready')} />}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,102,0,0.1); border-radius: 20px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,102,0,0.3); }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .text-glow { text-shadow: 0 0 20px rgba(255,102,0,0.2); }
            `}</style>
        </div>
    )

    async function updateStatus(id: string, status: string) {
        await supabase.from('orders').update({ status }).eq('id', id)
        fetchOrders()
        setSelectedOrder(null)
        toast.info(`Estado de orden actualizado a ${status.toUpperCase()}`)
    }

    async function handlePayment(method: string, order: Order) {
        if (!currentUser) return toast.error("Sesión no detectada")
        const tip = includeTip && restaurant?.apply_service_charge ? (order.total * (restaurant.service_charge_percentage! / 100)) : 0
        const total = order.total + tip

        if (method === 'cash' || method === 'credit') {
            if (!confirm(`¿Confirmas el pago via ${method.toUpperCase()} por $${total.toLocaleString()}?`)) return
        }

        try {
            const { processOrderPayment } = await import("@/actions/pos")
            const res = await processOrderPayment(order.id, currentUser.id, method, total, tip)

            if (res.success) {
                fetchOrders()
                setSelectedOrder(null)
                toast.success(`VENTA REGISTRADA [$${method.toUpperCase()}]`)
            } else {
                toast.error(res.error)
            }
        } catch (e: any) {
            toast.error(e.message)
        }
    }
}

function OrderKPI({ label, value, color, icon, sub, delay, highlight }: any) {
    return (
        <div className={cn(
            "bg-card border-4 p-10 rounded-[4rem] shadow-3xl relative overflow-hidden group transition-all duration-700 animate-in fade-in slide-in-from-bottom-8",
            highlight ? "border-primary shadow-primary/20 bg-primary/[0.03]" : "border-border/40 hover:border-primary/40"
        )} style={{ animationDelay: `${delay}ms` }}>
            <div className={cn(
                "absolute -top-6 -right-6 p-12 opacity-[0.05] group-hover:scale-125 group-hover:rotate-12 group-hover:opacity-20 transition-all duration-1000",
                color
            )}>
                {icon}
            </div>

            <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-3">
                    <div className={cn("w-2 h-2 rounded-full", color.replace('text', 'bg'))} />
                    <p className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground italic leading-none">{label}</p>
                </div>
                <div className="space-y-2">
                    <span className={cn("text-5xl font-black tracking-tighter italic leading-none", color)}>{value}</span>
                    {sub && <p className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.3em] italic leading-none">{sub}</p>}
                </div>
            </div>
        </div>
    )
}

function OrderCard({ order, onView, delay, isCritical }: any) {
    const elapsed = getElapsed(order.created_at)
    return (
        <div
            onClick={onView}
            className={cn(
                "group/card bg-card border-4 p-10 rounded-[4rem] shadow-3xl hover:border-primary transition-all duration-500 cursor-pointer relative overflow-hidden animate-in fade-in slide-in-from-bottom-8",
                isCritical ? "border-primary shadow-primary/10" : "border-border/40"
            )}
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="absolute top-0 right-0 p-12 opacity-[0.02] text-primary rotate-12 group-hover/card:scale-110 group-hover/card:opacity-[0.05] transition-all">
                <ShoppingBag className="w-48 h-48 -mr-16 -mt-16" />
            </div>

            <div className="flex justify-between items-start mb-10 relative z-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "w-3 h-3 rounded-full",
                            order.status === 'pending' ? 'bg-blue-500 animate-pulse' :
                                order.status === 'preparing' ? 'bg-amber-500 animate-pulse' :
                                    order.status === 'ready' || order.status === 'payment_pending' ? 'bg-primary animate-bounce shadow-[0_0_10px_rgba(255,77,0,0.5)]' : 'bg-emerald-500'
                        )} />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60 italic leading-none">{order.tables?.table_name || 'HUB_PICKUP'}</span>
                    </div>
                    <h3 className="text-4xl font-black italic uppercase tracking-tighter text-foreground group-hover/card:text-primary transition-colors leading-none">#{order.id.split('-')[0].toUpperCase()}</h3>
                </div>
                <div className="px-5 py-2 bg-muted/40 border-2 border-border text-[9px] font-black text-muted-foreground italic rounded-2xl tracking-widest">{elapsed}</div>
            </div>

            <div className="space-y-3 mb-12 relative z-10">
                <p className="text-xl font-black italic uppercase text-foreground group-hover/card:translate-x-1 transition-transform">{order.guest_info?.name || 'ANÓNIMO_SYC'}</p>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest italic"><Layers className="w-3 h-3" /> {order.order_items?.length || 0} SKU</div>
                    <div className="flex items-center gap-2 text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest italic"><MapPin className="w-3 h-3" /> {order.order_type === 'pickup' ? 'CASA' : 'HUB'}</div>
                </div>
            </div>

            <div className="pt-8 border-t-2 border-border/20 flex justify-between items-end relative z-10">
                <div className="space-y-1">
                    <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.4em] italic leading-none">VALOR_ORDEN</p>
                    <p className="text-3xl font-black italic tracking-tighter text-foreground">${order.total.toLocaleString()}</p>
                </div>
                <div className="w-14 h-14 rounded-[1.5rem] bg-foreground text-background flex items-center justify-center group-hover/card:bg-primary group-hover/card:text-white transition-all shadow-xl active:scale-75">
                    <ArrowUpRight className="w-7 h-7" />
                </div>
            </div>
        </div>
    )
}

function PaymentButton({ label, icon, color, onClick }: any) {
    return (
        <Button
            onClick={onClick}
            className={cn(
                "h-24 rounded-[2.5rem] flex flex-col items-center justify-center gap-2 font-black italic uppercase text-[11px] tracking-[0.3em] transition-all shadow-3xl hover:scale-105 active:scale-95 border-none text-white",
                color
            )}
        >
            <span className="text-3xl">{icon}</span>
            {label}
        </Button>
    )
}

function ActionBtn({ label, icon, color, onClick }: any) {
    return (
        <Button
            onClick={onClick}
            className={cn(
                "h-24 px-12 rounded-[3rem] font-black italic uppercase text-xl tracking-tighter transition-all shadow-5xl hover:scale-105 active:scale-95 border-none gap-6 text-white",
                color
            )}
        >
            {label} {icon}
        </Button>
    )
}

function EmptyState({ label, sub, icon }: any) {
    return (
        <div className="py-24 border-4 border-dashed border-border/20 rounded-[4rem] flex flex-col items-center justify-center gap-8 text-center opacity-20">
            <div className="text-primary">{icon}</div>
            <div className="space-y-2">
                <h4 className="text-3xl font-black italic uppercase tracking-tighter text-foreground">{label}</h4>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] italic px-10">{sub}</p>
            </div>
        </div>
    )
}

export default function AdminOrdersPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-transparent">
                <div className="flex flex-col items-center gap-8">
                    <Loader2 className="w-16 h-16 text-primary animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary italic">Sincronizando Historial Táctico...</p>
                </div>
            </div>
        }>
            <OrdersContent />
        </Suspense>
    )
}
