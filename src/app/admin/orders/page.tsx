
"use client"

import { Button } from "@/components/ui/button"
import { Clock, MapPin, Bike, CheckCircle2, ChefHat, AlertCircle, X, User, Phone, Map, RefreshCcw, Plus, Trash2, Search, ArrowLeft, Receipt, ShoppingBag, Minus } from "lucide-react"
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
    status: 'pending' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled'
    order_type: 'pickup' | 'delivery'
    total: number
    subtotal: number
    guest_info: {
        name: string
        phone?: string
    }
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
    const [selectedTableId, setSelectedTableId] = useState<string>("")
    const [tables, setTables] = useState<any[]>([])
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [searchTerm, setSearchTerm] = useState("")

    const fetchOrders = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                order_items (
                    *,
                    products (name)
                ),
                waiter:profiles!orders_waiter_id_fkey (full_name),
                tables (table_name)
            `)
            .order('created_at', { ascending: false })

        if (error) {
            console.error(error)
        } else {
            setOrders(data || [])
        }
        setLoading(false)
    }

    const fetchProductsData = async () => {
        const { data } = await supabase.from('products').select('*').eq('is_available', true).order('name')
        setProducts(data || [])
    }

    const fetchInitialData = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
            setCurrentUser(profile)
        }

        const { data: tablesData } = await supabase.from('tables').select('*').eq('active', true).order('table_number', { ascending: true })
        setTables(tablesData || [])
    }

    useEffect(() => {
        fetchOrders()
        fetchProductsData()
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
                    phone: ""
                },
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

            const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert)
            if (itemsError) throw itemsError

            if (selectedTableId) {
                await supabase.from('tables').update({ status: 'occupied' }).eq('id', selectedTableId)
            }

            setIsCreateOpen(false)
            setNewOrderItems([])
            setCustomerName("")
            setSelectedTableId("")
            fetchOrders()
            alert("Pedido creado correctamente ✅")
        } catch (e: any) {
            alert("Error al crear: " + e.message)
        }
    }

    const addToNewOrder = (product: Product) => {
        const existing = newOrderItems.find(i => i.id === product.id)
        if (existing) {
            setNewOrderItems(prev => prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i))
        } else {
            setNewOrderItems(prev => [...prev, { ...product, quantity: 1 }])
        }
    }

    const removeFromNewOrder = (productId: string) => {
        setNewOrderItems(prev => prev.filter(i => i.id !== productId))
    }

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const activeProcessing = orders.filter(o => ['pending', 'preparing', 'ready', 'out_for_delivery'].includes(o.status))
    const completedOrders = orders.filter(o => ['delivered', 'cancelled'].includes(o.status))

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-gray-900 font-sans">
            {/* Header Profesional */}
            <div className="max-w-[1600px] mx-auto mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-gray-900">
                        GESTIÓN DE <span className="text-primary italic">PEDIDOS</span>
                    </h1>
                    <p className="text-gray-500 font-medium">Control centralizado de producción y ventas</p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => setIsCreateOpen(true)}
                        className="bg-primary hover:bg-primary/90 text-white font-black px-8 h-14 rounded-2xl shadow-lg shadow-primary/20 gap-3"
                    >
                        <Plus className="w-6 h-6" /> NUEVO PEDIDO
                    </Button>
                    <Link href="/admin/kitchen">
                        <Button variant="outline" className="h-14 px-6 rounded-2xl border-gray-200 bg-white font-bold gap-3">
                            <ChefHat className="w-5 h-5" /> COCINA (KDS)
                        </Button>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={fetchOrders} className={cn("h-14 w-14 rounded-2xl border border-gray-100 bg-white", loading && "animate-spin")}>
                        <RefreshCcw className="w-5 h-5 text-gray-400" />
                    </Button>
                </div>
            </div>


            {/* Tablero de Pedidos */}
            <div className="max-w-[1600px] mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Columna: En Producción */}
                    <div className="flex flex-col gap-4 h-[calc(100vh-200px)]">
                        <div className="flex items-center justify-between px-2 mb-2 shrink-0">
                            <h2 className="text-xs font-black text-gray-400 tracking-[0.2em] uppercase">En Cocina / Listos ({activeProcessing.length})</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 pb-10">
                            {activeProcessing.map(order => (
                                <OrderCard key={order.id} order={order} onView={() => setSelectedOrder(order)} />
                            ))}
                            {activeProcessing.length === 0 && (
                                <div className="border-2 border-dashed border-gray-100 rounded-[2rem] h-32 flex items-center justify-center text-gray-300 font-bold">
                                    TODO AL DÍA
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Columna: Finalizados */}
                    <div className="flex flex-col gap-4 h-[calc(100vh-200px)]">
                        <div className="flex items-center justify-between px-2 mb-2 shrink-0">
                            <h2 className="text-xs font-black text-gray-400 tracking-[0.2em] uppercase">Historial Reciente ({completedOrders.length})</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 pb-10 opacity-60">
                            {completedOrders.slice(0, 20).map(order => (
                                <OrderCard key={order.id} order={order} onView={() => setSelectedOrder(order)} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL NUEVO PEDIDO - REDISEÑADO Y COMPLETO */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-6xl h-full md:h-[80vh] md:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Header Modal */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white z-10">
                            <div>
                                <h1 className="text-2xl font-black tracking-tight text-gray-900">NUEVO PEDIDO</h1>
                                <p className="text-xs text-gray-500 font-medium">Completa el pedido manual de forma rápida</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setIsCreateOpen(false)} className="rounded-full w-10 h-10 hover:bg-gray-100">
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Body Modal */}
                        <div className="flex-1 min-h-0 overflow-hidden grid md:grid-cols-12">
                            {/* Selector de Productos */}
                            <div className="md:col-span-7 p-8 border-r border-gray-100 flex flex-col h-full overflow-hidden bg-gray-50/30">
                                <div className="relative mb-6">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        className="w-full h-14 bg-white border border-gray-200 rounded-2xl pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-lg shadow-sm"
                                        placeholder="Buscar plato o bebida..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto pr-2 custom-scrollbar">
                                    {filteredProducts.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => addToNewOrder(p)}
                                            className="p-4 rounded-2xl bg-white border border-gray-100 hover:border-primary hover:shadow-md transition-all text-left flex flex-col gap-1 active:scale-[0.98]"
                                        >
                                            <span className="font-bold text-gray-900 leading-tight">{p.name}</span>
                                            <span className="text-xs text-gray-400 line-clamp-1">{p.description}</span>
                                            <span className="text-primary font-black mt-1">${p.price.toLocaleString()}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Resumen y Configuración */}
                            <div className="md:col-span-5 flex flex-col h-full bg-white min-h-0">
                                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
                                    {/* Configuración de Mesa y Cliente */}
                                    <div className="space-y-4">
                                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Mesa</label>
                                            <select
                                                className="w-full bg-transparent border-none p-0 font-black text-xl text-gray-900 outline-none appearance-none cursor-pointer"
                                                value={selectedTableId}
                                                onChange={e => setSelectedTableId(e.target.value)}
                                            >
                                                <option value="">PARA LLEVAR / BARRA</option>
                                                {tables.map(t => (
                                                    <option key={t.id} value={t.id}>{t.table_name} - {t.location}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Nombre del Cliente</label>
                                            <input
                                                className="w-full bg-transparent border-none p-0 font-black text-xl text-gray-900 outline-none placeholder:text-gray-300"
                                                placeholder="EJ: JUAN PEREZ"
                                                value={customerName}
                                                onChange={e => setCustomerName(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Lista de Items en Cesta */}
                                    <div className="space-y-3">
                                        <h3 className="text-xs font-black text-gray-400 tracking-[0.2em] uppercase">Items Seleccionados</h3>
                                        {newOrderItems.length === 0 ? (
                                            <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-3xl opacity-40">
                                                <ShoppingBag className="w-10 h-10 mb-2" />
                                                <p className="font-bold text-sm">SIN PRODUCTOS</p>
                                            </div>
                                        ) : (
                                            newOrderItems.map(item => (
                                                <div key={item.id} className="flex justify-between items-center p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                                                    <div className="flex-1">
                                                        <p className="font-bold text-gray-900">{item.name}</p>
                                                        <p className="text-xs text-gray-400">${item.price.toLocaleString()} c/u</p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center bg-gray-100 rounded-xl px-2 py-1 gap-3">
                                                            <button
                                                                onClick={() => {
                                                                    if (item.quantity > 1) {
                                                                        setNewOrderItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i))
                                                                    } else {
                                                                        removeFromNewOrder(item.id)
                                                                    }
                                                                }}
                                                                className="w-6 h-6 flex items-center justify-center hover:bg-white rounded-lg transition-all"
                                                            >
                                                                <Minus className="w-4 h-4" />
                                                            </button>
                                                            <span className="font-black text-sm">{item.quantity}</span>
                                                            <button
                                                                onClick={() => addToNewOrder(item)}
                                                                className="w-6 h-6 flex items-center justify-center hover:bg-white rounded-lg transition-all"
                                                            >
                                                                <Plus className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                        <button onClick={() => removeFromNewOrder(item.id)} className="text-red-400 hover:text-red-500 p-2">
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Footer New Order */}
                                <div className="p-6 border-t border-gray-100 bg-gray-50/30">
                                    <div className="flex justify-between items-end mb-3">
                                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none mb-1">TOTAL</span>
                                        <span className="text-3xl font-black text-primary leading-none">
                                            ${newOrderItems.reduce((acc, i) => acc + (i.price * i.quantity), 0).toLocaleString()}
                                        </span>
                                    </div>
                                    <Button
                                        onClick={handleCreateOrder}
                                        disabled={newOrderItems.length === 0}
                                        className="w-full h-14 bg-primary text-white font-black text-lg rounded-2xl shadow-xl shadow-primary/20 active:scale-95 transition-all gap-4"
                                    >
                                        <CheckCircle2 className="w-6 h-6" /> CONFIRMAR PEDIDO
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DETALLE DE PEDIDO EXISTENTE */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Detail Header */}
                        <div className={cn(
                            "p-8 flex justify-between items-start text-white",
                            selectedOrder.status === 'pending' ? 'bg-blue-600' :
                                selectedOrder.status === 'preparing' ? 'bg-orange-500' :
                                    selectedOrder.status === 'ready' ? 'bg-purple-600' : 'bg-gray-800'
                        )}>
                            <div>
                                <h2 className="text-4xl font-black tracking-tighter uppercase mb-1">
                                    {selectedOrder.tables?.table_name || 'MOSTRADOR'}
                                </h2>
                                <p className="text-xs font-bold opacity-80 uppercase tracking-widest">PEDIDO #{selectedOrder.id.split('-')[0].toUpperCase()}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="text-white hover:bg-black/10 rounded-full" onClick={() => setSelectedOrder(null)}>
                                <X className="w-6 h-6" />
                            </Button>
                        </div>

                        {/* Detail Body */}
                        <div className="p-8 space-y-6">
                            <div className="flex justify-between items-center text-sm font-bold text-gray-500 uppercase tracking-widest">
                                <span>Contenido del Pedido</span>
                                <span className="bg-gray-100 px-3 py-1 rounded-full text-[10px] text-gray-900">{selectedOrder.status.toUpperCase()}</span>
                            </div>

                            <div className="space-y-3 overflow-y-auto max-h-[40vh] pr-2 custom-scrollbar">
                                {selectedOrder.order_items?.map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <div className="flex items-center gap-4">
                                            <span className="font-black text-lg text-primary">{item.quantity}x</span>
                                            <span className="font-bold text-gray-900">{item.products?.name || "Producto"}</span>
                                        </div>
                                        <span className="font-mono font-bold">${(item.unit_price * item.quantity).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
                                <span className="font-bold text-gray-400">Total Facturado</span>
                                <span className="text-3xl font-black text-gray-900">${selectedOrder.total.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Detail Footer Actions */}
                        <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-4">
                            {selectedOrder.status === 'pending' && (
                                <Button
                                    className="h-16 flex-[2] bg-orange-500 hover:bg-orange-600 text-white font-black text-lg rounded-2xl shadow-lg shadow-orange-500/10 gap-3"
                                    onClick={async () => {
                                        await supabase.from('orders').update({ status: 'preparing' }).eq('id', selectedOrder.id)
                                        fetchOrders()
                                        setSelectedOrder(null)
                                    }}
                                >
                                    <ChefHat className="w-6 h-6" /> ENVIAR A COCINA
                                </Button>
                            )}
                            {selectedOrder.status === 'preparing' && (
                                <Button
                                    className="h-16 flex-[2] bg-purple-600 hover:bg-purple-700 text-white font-black text-lg rounded-2xl shadow-lg shadow-purple-500/10 gap-3"
                                    onClick={async () => {
                                        await supabase.from('orders').update({ status: 'ready' }).eq('id', selectedOrder.id)
                                        fetchOrders()
                                        setSelectedOrder(null)
                                    }}
                                >
                                    <CheckCircle2 className="w-6 h-6" /> MARCAR LISTO
                                </Button>
                            )}
                            <Button variant="outline" className="h-16 flex-1 rounded-2xl border-gray-200 font-bold" onClick={() => setSelectedOrder(null)}>
                                CERRAR
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #e5e7eb;
                    border-radius: 10px;
                }
            `}</style>
        </div>
    )
}

function OrderCard({ order, onView }: { order: Order; onView: () => void }) {
    const elapsed = getElapsed(order.created_at)

    return (
        <div
            onClick={onView}
            className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
        >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-black text-gray-400 tracking-widest uppercase">
                            {order.tables?.table_name || 'MOSTRADOR'}
                        </span>
                        <div className={cn(
                            "w-2 h-2 rounded-full",
                            order.status === 'pending' ? 'bg-blue-500' :
                                order.status === 'preparing' ? 'bg-orange-500 animate-pulse' :
                                    'bg-green-500'
                        )} />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight group-hover:text-primary transition-colors">
                        #{order.id.split('-')[0].toUpperCase()}
                    </h3>
                </div>
                <div className="text-right">
                    <span className="text-xs font-black text-gray-400 font-mono">{elapsed}</span>
                </div>
            </div>

            <div className="space-y-2 mb-4">
                <p className="text-sm font-bold text-gray-600 capitalize">
                    {order.guest_info?.name || "Sin nombre"}
                </p>
                <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-black text-gray-500 uppercase">
                        {order.order_items?.length || 0} ITEMS
                    </span>
                    <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-black text-gray-500 uppercase">
                        {order.order_type === 'pickup' ? 'CASA' : 'DELIVERY'}
                    </span>
                </div>
            </div>

            <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                <span className="text-lg font-black text-gray-900">${order.total.toLocaleString()}</span>
                <div className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    <Receipt className="w-5 h-5" />
                </div>
            </div>
        </div>
    )
}
