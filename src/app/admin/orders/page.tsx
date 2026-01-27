"use client"

import { Button } from "@/components/ui/button"
import { Clock, MapPin, Bike, CheckCircle2, ChefHat, AlertCircle, X, User, Phone, Map, RefreshCcw, Plus, Trash2, Search, ArrowLeft, Receipt, ShoppingBag, Minus, Star, MessageCircle, ArrowUpRight, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

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

export default function AdminOrdersPage() {
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

    // Customer Search State
    const [allCustomers, setAllCustomers] = useState<any[]>([])
    const [customerSearch, setCustomerSearch] = useState("")

    const fetchOrders = async () => {
        setLoading(true)
        try {
            // Simplified query without problematic foreign key reference
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
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Error fetching orders:', error)
                // Try even simpler query as fallback
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
        fetchOrders()
        fetchInitialData()
        const interval = setInterval(() => fetchOrders(), 30000)
        return () => clearInterval(interval)
    }, [])

    const handleCreateOrder = async () => {
        if (newOrderItems.length === 0) return alert("Añade productos")

        try {
            const total = newOrderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0)
            const orderData = {
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
        } catch (e: any) {
            alert("Error al crear: " + e.message)
        }
    }

    const selectCustomer = (c: any) => {
        setSelectedCustomerId(c.id)
        setCustomerName(c.full_name)
        setCustomerPhone(c.phone || "")
        setCustomerSearch("")
    }

    const activeProcessing = orders.filter(o => ['pending', 'preparing', 'ready', 'out_for_delivery'].includes(o.status))
    const paymentPending = orders.filter(o => o.status === 'payment_pending')
    const completedOrders = orders.filter(o => ['delivered', 'cancelled'].includes(o.status))

    return (
        <div className="min-h-screen bg-transparent text-slate-900 p-4 md:p-8 font-sans selection:bg-primary">

            {/* 👑 ENTERPRISE ORDERS HEADER */}
            <div className="max-w-[1600px] mx-auto mb-12 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 animate-in fade-in duration-700">
                <div>
                    <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none">Control de <span className="text-primary">Pedidos</span></h1>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-3 italic flex items-center gap-2">
                        <ShoppingBag className="w-3 h-3 text-primary" /> Auditoría de comanda y despacho
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Button onClick={() => setIsCreateOpen(true)} className="h-14 px-8 bg-primary text-black rounded-2xl font-black uppercase text-[10px] tracking-widest italic hover:bg-white transition-all shadow-xl shadow-primary/20 gap-3">
                        <Plus className="w-5 h-5" /> NUEVO PEDIDO
                    </Button>
                    <Link href="/admin/kitchen">
                        <Button variant="ghost" className="h-14 px-6 rounded-2xl bg-white/5 border border-white/5 font-black uppercase text-[10px] tracking-widest italic hover:bg-white hover:text-black transition-all gap-3">
                            <ChefHat className="w-5 h-5" /> COCINA
                        </Button>
                    </Link>
                    <Button onClick={fetchOrders} variant="ghost" className={cn("h-14 w-14 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 transition-all", loading && "animate-spin")}>
                        <RefreshCcw className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* Tablero de Pedidos Industrial */}
            <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">

                {/* Columna: PRODUCCIÓN */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <h2 className="text-[10px] font-black text-gray-500 tracking-[0.3em] uppercase italic">Producción Activa ({activeProcessing.length})</h2>
                    </div>
                    <div className="space-y-4">
                        {activeProcessing.map(order => (
                            <OrderCard key={order.id} order={order} onView={() => setSelectedOrder(order)} />
                        ))}
                        {activeProcessing.length === 0 && (
                            <div className="h-40 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex items-center justify-center text-slate-300 font-black italic uppercase text-[10px] tracking-widest">
                                COMANDAS AL DÍA
                            </div>
                        )}
                    </div>
                </div>

                {/* Columna: POR COBRAR (Critical) */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce shadow-lg shadow-primary/40" />
                        <h2 className="text-[10px] font-black text-primary tracking-[0.3em] uppercase italic flex items-center gap-2">
                            <Receipt className="w-3.5 h-3.5" /> PENDIENTE DE CIERRE ({paymentPending.length})
                        </h2>
                    </div>
                    <div className="space-y-4">
                        {paymentPending.map(order => (
                            <OrderCard key={order.id} order={order} onView={() => setSelectedOrder(order)} />
                        ))}
                    </div>
                </div>

                {/* Columna: RECIENTES */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 px-2 opacity-40">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <h2 className="text-[10px] font-black text-gray-500 tracking-[0.3em] uppercase italic">DESPACHADOS RECIENTES ({completedOrders.length})</h2>
                    </div>
                    <div className="space-y-4 opacity-40 hover:opacity-100 transition-opacity">
                        {completedOrders.slice(0, 10).map(order => (
                            <OrderCard key={order.id} order={order} onView={() => setSelectedOrder(order)} />
                        ))}
                    </div>
                </div>
            </div>

            {/* 🛠️ MODAL NUEVO PEDIDO + LOYALTY LINKING */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-0 md:p-8 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-7xl h-full md:h-[90vh] md:rounded-[4rem] border border-slate-200 shadow-2xl flex flex-col overflow-hidden relative">
                        <div className="p-8 md:p-12 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h2 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">Ingreso de <span className="text-primary">Comanda Industrial</span></h2>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">{currentUser?.full_name} @ Terminal POS-01</p>
                            </div>
                            <Button onClick={() => setIsCreateOpen(false)} variant="ghost" className="h-16 w-16 rounded-[2rem] bg-white border border-slate-200 hover:bg-slate-100 text-slate-400 hover:text-slate-900"><X className="w-8 h-8" /></Button>
                        </div>

                        <div className="flex-1 grid lg:grid-cols-12 overflow-hidden">
                            {/* Prods Selector */}
                            <div className="lg:col-span-8 p-10 bg-white overflow-y-auto custom-scrollbar">
                                <div className="relative mb-10 group">
                                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-primary transition-all" />
                                    <input
                                        className="w-full h-18 bg-slate-50 border border-slate-200 rounded-[2rem] pl-16 pr-6 outline-none focus:border-primary/50 text-xl font-black italic text-slate-900 placeholder:text-slate-300 transition-all font-mono"
                                        placeholder="BUSCAR SKU..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                                        <button key={p.id} onClick={() => {
                                            const exist = newOrderItems.find(i => i.id === p.id)
                                            if (exist) setNewOrderItems(prev => prev.map(i => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i))
                                            else setNewOrderItems(prev => [...prev, { ...p, quantity: 1 }])
                                        }} className="p-5 rounded-[2rem] bg-slate-50 border border-slate-100 hover:border-primary transition-all text-left flex flex-col group active:scale-95 shadow-sm">
                                            <span className="font-black italic uppercase text-sm text-slate-400 group-hover:text-slate-900 transition-colors">{p.name}</span>
                                            <span className="text-primary font-black text-xl italic mt-1">${p.price.toLocaleString()}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Resumen & Logic */}
                            <div className="lg:col-span-4 bg-white border-l border-slate-100 flex flex-col overflow-hidden">
                                <div className="p-8 space-y-8 flex-1 overflow-y-auto custom-scrollbar">

                                    {/* 🧪 LOYALTY ENGINE LINKING */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-2"> <Star className="w-3 h-3 text-primary" /> Fidelización Elite</h3>
                                            {selectedCustomerId && <button onClick={() => setSelectedCustomerId(null)} className="text-[8px] font-bold text-rose-500 uppercase">Eliminar</button>}
                                        </div>

                                        {!selectedCustomerId ? (
                                            <div className="relative">
                                                <input
                                                    className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none text-xs font-bold text-slate-900 mb-2"
                                                    placeholder="BUSCAR CLIENTE POR CELULAR O NOMBRE..."
                                                    value={customerSearch}
                                                    onChange={e => setCustomerSearch(e.target.value)}
                                                />
                                                {customerSearch && (
                                                    <div className="absolute top-16 left-0 right-0 bg-white border border-slate-200 rounded-2xl p-2 z-50 shadow-3xl max-h-40 overflow-y-auto">
                                                        {allCustomers.filter(c => c.full_name?.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone?.includes(customerSearch)).map(c => (
                                                            <button key={c.id} onClick={() => selectCustomer(c)} className="w-full p-3 text-left hover:bg-slate-50 rounded-xl flex justify-between items-center transition-all group">
                                                                <div>
                                                                    <p className="text-xs font-black uppercase italic text-slate-400 group-hover:text-slate-900">{c.full_name}</p>
                                                                    <p className="text-[8px] font-bold text-slate-400">{c.phone}</p>
                                                                </div>
                                                                <span className="text-primary font-black italic text-[10px]">{c.loyalty_points} PTS</span>
                                                            </button>
                                                        ))}
                                                        {allCustomers.length === 0 && <p className="p-4 text-center text-[8px] text-slate-400">No hay clientes registrados</p>}
                                                    </div>
                                                )}
                                                <div className="grid grid-cols-2 gap-2">
                                                    <input value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold" placeholder="NOMBRE GUEST" />
                                                    <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold" placeholder="TELÉFONO" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-5 bg-primary/10 border border-primary/20 rounded-[1.5rem] flex items-center justify-between animate-in zoom-in-95">
                                                <div>
                                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest italic">Cliente Vinculado</p>
                                                    <p className="text-xl font-black italic text-slate-900 uppercase">{customerName}</p>
                                                </div>
                                                <ShieldCheck className="w-8 h-8 text-primary opacity-40" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-2"> <MapPin className="w-3 h-3" /> UBICACIÓN DE SERVICIO</h3>
                                        <select value={selectedTableId} onChange={e => setSelectedTableId(e.target.value)} className="w-full h-14 bg-slate-50 border border-slate-200 rounded-[1.5rem] px-6 text-xs font-black italic uppercase text-slate-900 outline-none">
                                            <option value="">SERVICIO RÁPIDO / MOSTRADOR</option>
                                            {tables.map(t => <option key={t.id} value={t.id}>{t.table_name} ({t.location})</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">DETALLE DE CESTA ({newOrderItems.length})</h3>
                                        <div className="space-y-2">
                                            {newOrderItems.map(item => (
                                                <div key={item.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center group">
                                                    <div className="flex-1">
                                                        <p className="font-black italic uppercase text-xs text-slate-900 leading-none mb-1">{item.name}</p>
                                                        <p className="text-[9px] font-bold text-slate-400 italic">${item.price.toLocaleString()}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => {
                                                            if (item.quantity > 1) setNewOrderItems(p => p.map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i))
                                                            else setNewOrderItems(p => p.filter(i => i.id !== item.id))
                                                        }} className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"><Minus className="w-3.5 h-3.5" /></button>
                                                        <span className="w-6 text-center font-black text-slate-900 italic">{item.quantity}</span>
                                                        <button onClick={() => setNewOrderItems(p => p.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))} className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-primary hover:text-black transition-all"><Plus className="w-3.5 h-3.5" /></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-10 border-t border-slate-100 bg-slate-50">
                                    <div className="flex justify-between items-end mb-8">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">TOTAL CONSOLIDADO</span>
                                        <span className="text-5xl font-black italic tracking-tighter text-primary">${newOrderItems.reduce((a, b) => a + (b.price * b.quantity), 0).toLocaleString()}</span>
                                    </div>
                                    <Button onClick={handleCreateOrder} disabled={newOrderItems.length === 0} className="w-full h-20 bg-primary text-black rounded-[1.5rem] font-black text-2xl italic tracking-tighter uppercase shadow-3xl shadow-primary/20 hover:bg-slate-900 hover:text-white transition-all gap-4">
                                        DESPACHAR COMANDA <ArrowUpRight className="w-8 h-8" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 📋 DETAIL MODAL (Updated with Loyalty and WhatsApp Center) */}
            {selectedOrder && (
                <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 rounded-[4rem] w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-300 shadow-3xl">
                        <div className={cn(
                            "p-12 border-b border-slate-100 flex justify-between items-start text-slate-900 relative",
                            selectedOrder.status === 'payment_pending' ? 'bg-primary/10 border-primary/20' : 'bg-slate-50/50'
                        )}>
                            <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic mb-2">ORDEN ACTIVA #{selectedOrder.id.split('-')[0].toUpperCase()}</p>
                                <h2 className="text-6xl font-black italic uppercase tracking-tighter leading-none">{selectedOrder.tables?.table_name || 'MOSTRADOR'}</h2>
                                <div className="flex gap-2 mt-4">
                                    <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[8px] font-black uppercase tracking-widest italic text-slate-400">{selectedOrder.status}</span>
                                    <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[8px] font-black uppercase tracking-widest italic text-slate-400">{selectedOrder.order_type}</span>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-16 w-16 rounded-[2rem] bg-white border border-slate-200" onClick={() => setSelectedOrder(null)}>
                                <X className="w-8 h-8" />
                            </Button>
                            {selectedOrder.status === 'payment_pending' && <Receipt className="absolute -bottom-10 -right-10 w-64 h-64 text-primary opacity-5" />}
                        </div>

                        <div className="p-12 space-y-10">
                            <div className="grid grid-cols-2 gap-10">
                                <div className="space-y-6">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">CONSOLidado de SKU</h3>
                                    <div className="space-y-3">
                                        {selectedOrder.order_items?.map((item: any, i: number) => (
                                            <div key={i} className="flex justify-between items-center group">
                                                <div className="flex items-center gap-4">
                                                    <span className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-primary italic text-xs">{item.quantity}</span>
                                                    <span className="font-black italic uppercase text-xs text-slate-900 group-hover:text-primary transition-colors">{item.products?.name}</span>
                                                </div>
                                                <span className="font-black italic text-slate-400">${(item.unit_price * item.quantity).toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-6 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">INTELIGENCIA CLIENTE</h3>
                                    <div>
                                        <p className="text-xl font-black italic text-slate-900 uppercase tracking-tighter">{selectedOrder.guest_info?.name}</p>
                                        <p className="text-[9px] font-bold text-slate-400 italic mt-1">{selectedOrder.guest_info?.phone || 'Sin número registrado'}</p>
                                    </div>
                                    <div className="pt-6 border-t border-slate-100">
                                        <p className="text-[8px] font-bold text-primary uppercase tracking-widest italic mb-2">POTENCIAL DE LEALTAD</p>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary"><Star className="w-5 h-5 fill-primary" /></div>
                                            <p className="text-sm font-black italic uppercase text-slate-900">GANA {Math.floor(selectedOrder.total / 1000)} PUNTOS</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-10 border-t border-slate-100 flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic mb-2">SUBTOTAL NETO</p>
                                    <p className="text-5xl font-black italic tracking-tighter text-slate-900 leading-none">${selectedOrder.total.toLocaleString()}</p>
                                </div>
                                <div className="flex gap-4">
                                    {selectedOrder.status === 'payment_pending' && (
                                        <div className="flex gap-3">
                                            <Button
                                                onClick={async () => {
                                                    if (!currentUser) return alert("Error de sesión")
                                                    if (!confirm("¿Confirmas el pago en EFECTIVO? Se registrará en Caja.")) return

                                                    try {
                                                        const { processOrderPayment } = await import("@/actions/pos")
                                                        await processOrderPayment(selectedOrder.id, currentUser.id, 'cash', selectedOrder.total)
                                                        fetchOrders(); setSelectedOrder(null)
                                                        alert("✅ Venta Efectivo Registrada")
                                                    } catch (e: any) {
                                                        alert("Error: " + e.message)
                                                    }
                                                }}
                                                className="h-20 px-6 bg-emerald-500 text-white rounded-[1.5rem] font-black text-lg italic tracking-tighter uppercase shadow-xl shadow-emerald-500/20 hover:scale-105 transition-all gap-2"
                                            >
                                                EFECTIVO 💵
                                            </Button>
                                            <Button
                                                onClick={async () => {
                                                    if (!currentUser) return alert("Error de sesión")

                                                    try {
                                                        const { processOrderPayment } = await import("@/actions/pos")
                                                        await processOrderPayment(selectedOrder.id, currentUser.id, 'card', selectedOrder.total)
                                                        fetchOrders(); setSelectedOrder(null)
                                                        alert("✅ Venta Tarjeta Registrada")
                                                    } catch (e: any) {
                                                        alert("Error: " + e.message)
                                                    }
                                                }}
                                                className="h-20 px-6 bg-indigo-500 text-white rounded-[1.5rem] font-black text-lg italic tracking-tighter uppercase shadow-xl shadow-indigo-500/20 hover:scale-105 transition-all gap-2"
                                            >
                                                TARJETA 💳
                                            </Button>
                                        </div>
                                    )}
                                    {selectedOrder.status === 'pending' && <Button onClick={async () => { await supabase.from('orders').update({ status: 'preparing' }).eq('id', selectedOrder.id); fetchOrders(); setSelectedOrder(null) }} className="h-20 px-10 bg-slate-900 text-white rounded-[1.5rem] font-black text-xl italic tracking-tighter uppercase gap-4 shadow-xl shadow-slate-900/20">MARCAR PREPARANDO <ChefHat className="w-6 h-6" /></Button>}
                                    {selectedOrder.status === 'preparing' && <Button onClick={async () => { await supabase.from('orders').update({ status: 'ready' }).eq('id', selectedOrder.id); fetchOrders(); setSelectedOrder(null) }} className="h-20 px-10 bg-purple-600 text-white rounded-[1.5rem] font-black text-xl italic tracking-tighter uppercase gap-4 shadow-xl shadow-purple-600/20">MARCAR LISTO <CheckCircle2 className="w-6 h-6" /></Button>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
            `}</style>
        </div>
    )
}

function OrderCard({ order, onView }: { order: Order; onView: () => void }) {
    const elapsed = getElapsed(order.created_at)

    return (
        <div
            onClick={onView}
            className="bg-white p-8 rounded-[3rem] border border-slate-200 hover:border-primary/50 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group relative overflow-hidden"
        >
            <div className="flex justify-between items-start mb-6">
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic mb-2 flex items-center gap-2">
                        {order.tables?.table_name || 'MOSTRADOR'}
                        <span className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            order.status === 'pending' ? 'bg-blue-500' :
                                order.status === 'preparing' ? 'bg-orange-500 animate-pulse' :
                                    order.status === 'payment_pending' ? 'bg-primary animate-bounce' : 'bg-emerald-500'
                        )} />
                    </p>
                    <h3 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 group-hover:text-primary transition-colors leading-none">
                        #{order.id.split('-')[0].toUpperCase()}
                    </h3>
                </div>
                <div className="bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl text-[9px] font-black font-mono text-slate-400 italic uppercase">
                    {elapsed}
                </div>
            </div>

            <div className="space-y-3 mb-8">
                <p className="text-sm font-black italic uppercase text-slate-500 truncate">
                    {order.guest_info?.name || "CLIENTE ANÓNIMO"}
                </p>
                <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-[8px] font-black text-slate-400 uppercase italic">
                        {order.order_items?.length || 0} ITEMS
                    </span>
                    <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-[8px] font-black text-slate-400 uppercase italic">
                        {order.order_type === 'pickup' ? 'CASA' : 'DELIVERY'}
                    </span>
                </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-between items-center relative z-10">
                <span className="text-2xl font-black italic tracking-tighter text-slate-900">${order.total.toLocaleString()}</span>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowUpRight className="w-8 h-8 text-primary" />
                </div>
            </div>

            {order.status === 'payment_pending' && <Receipt className="absolute -bottom-6 -right-6 w-32 h-32 text-primary opacity-5 group-hover:scale-110 transition-transform" />}
        </div>
    )
}
