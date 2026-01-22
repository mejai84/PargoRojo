
"use client"

import { Button } from "@/components/ui/button"
import { Clock, MapPin, Bike, CheckCircle2, ChefHat, AlertCircle, X, User, Phone, Map, RefreshCcw, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"

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
    deleted_at: string | null
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
    const [products, setProducts] = useState<Product[]>([]) // Para el selector
    const [loading, setLoading] = useState(true)

    // Create Modal State
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [newOrderItems, setNewOrderItems] = useState<(Product & { quantity: number })[]>([])
    const [customerName, setCustomerName] = useState("")
    const [selectedTableId, setSelectedTableId] = useState<string>("")
    const [tables, setTables] = useState<any[]>([])
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [searchTerm, setSearchTerm] = useState("")

    // Fetch orders real
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

    // Fetch products for dropdown
    const fetchProducts = async () => {
        const { data } = await supabase.from('products').select('*')
        setProducts(data || [])
    }

    const fetchInitialData = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single()
            setCurrentUser(profile)
        }

        const { data: tablesData } = await supabase
            .from('tables')
            .select('*')
            .eq('active', true)
            .order('table_number', { ascending: true })
        setTables(tablesData || [])
    }

    useEffect(() => {
        fetchOrders()
        fetchProducts()
        fetchInitialData()
        const interval = setInterval(() => {
            fetchOrders()
        }, 30000)
        return () => clearInterval(interval)
    }, [])

    const handleCreateOrder = async () => {
        if (newOrderItems.length === 0) return alert("Añade productos")

        try {
            // Calcular total
            const total = newOrderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0)

            const orderData = {
                status: 'pending',
                order_type: 'pickup',
                total: total,
                subtotal: total,
                guest_info: {
                    name: customerName || (selectedTableId ? tables.find(t => t.id === selectedTableId)?.table_name : "Cliente Presencial"),
                    phone: ""
                },
                payment_method: 'cash',
                payment_status: 'pending',
                waiter_id: currentUser?.id,
                table_id: selectedTableId || null
            }

            const { data: order, error } = await supabase.from('orders').insert([orderData]).select().single()
            if (error) throw error

            // Insert items
            const itemsToInsert = newOrderItems.map(item => ({
                order_id: order.id,
                product_id: item.id,
                quantity: item.quantity,
                unit_price: item.price
            }))

            const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert)
            if (itemsError) throw itemsError

            setIsCreateOpen(false)
            setNewOrderItems([])
            setCustomerName("")
            setSearchTerm("")
            fetchOrders()
            alert("Pedido creado correctamente ✅")

            // Clear state
            setNewOrderItems([])
            setCustomerName("")
            setSelectedTableId("")
            setIsCreateOpen(false)
            fetchOrders()

            // Update table status if selected
            if (selectedTableId) {
                await supabase.from('tables').update({ status: 'occupied' }).eq('id', selectedTableId)
            }

        } catch (e: any) {
            alert("Error al crear: " + e.message)
        }
    }

    const addToNewOrder = (productId: string) => {
        const product = products.find(p => p.id === productId)
        if (!product) return

        const existing = newOrderItems.find(i => i.id === productId)
        if (existing) {
            setNewOrderItems(prev => prev.map(i => i.id === productId ? { ...i, quantity: i.quantity + 1 } : i))
        } else {
            setNewOrderItems(prev => [...prev, { ...product, quantity: 1 }])
        }
        setSearchTerm("") // Clear search after adding
    }

    const removeFromNewOrder = (productId: string) => {
        setNewOrderItems(prev => prev.filter(i => i.id !== productId))
    }

    const getCustomerName = (order: any) => {
        if (order.guest_info?.name) return order.guest_info.name
        return "Cliente Registrado"
    }

    const filteredProducts = products.filter(p =>
        !p.deleted_at && (
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.description?.toLowerCase().includes(searchTerm.toLowerCase())
        )
    )

    const pendingOrders = orders.filter(o => o.status === 'pending')
    const preparingOrders = orders.filter(o => o.status === 'preparing')
    const readyOrders = orders.filter(o => o.status === 'ready' || o.status === 'out_for_delivery')
    const completedOrders = orders.filter(o => o.status === 'delivered' || o.status === 'cancelled')

    return (
        <div className="h-full flex flex-col space-y-6 relative">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Pedidos en Curso</h1>
                    <p className="text-muted-foreground">Gestiona el flujo de cocina y reparto.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setIsCreateOpen(true)} className="bg-primary text-black hover:bg-primary/90 font-bold gap-2">
                        <Plus className="w-5 h-5" /> Nuevo Pedido Manual
                    </Button>
                    <Button variant="ghost" size="icon" onClick={fetchOrders}>
                        <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Link href="/admin/kitchen">
                        <Button variant="outline" className="gap-2">
                            <ChefHat className="w-4 h-4" /> Vista Cocina (KDS)
                        </Button>
                    </Link>
                </div>
            </div>

            {pendingOrders.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl flex items-center justify-between mb-4 animate-pulse">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                        <div>
                            <h3 className="text-lg font-bold text-red-500">¡ATENCIÓN CAJA! Hay {pendingOrders.length} pedidos por aprobar</h3>
                            <p className="text-sm text-muted-foreground">Revisa los pedidos nuevos antes de enviarlos a cocina.</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-x-auto">
                <div className="flex gap-6 min-w-[1000px] h-full pb-4">
                    <OrderColumn title="Nuevos" color="border-blue-500/50" count={pendingOrders.length} icon={AlertCircle}>
                        {pendingOrders.map(order => (
                            <OrderCard key={order.id} order={order} onView={() => setSelectedOrder(order)} customerName={getCustomerName(order)} />
                        ))}
                    </OrderColumn>

                    <OrderColumn title="En Cocina" color="border-yellow-500/50" count={preparingOrders.length} icon={ChefHat}>
                        {preparingOrders.map(order => (
                            <OrderCard key={order.id} order={order} onView={() => setSelectedOrder(order)} customerName={getCustomerName(order)} />
                        ))}
                    </OrderColumn>

                    <OrderColumn title="Listo / Reparto" color="border-purple-500/50" count={readyOrders.length} icon={Bike}>
                        {readyOrders.map(order => (
                            <OrderCard key={order.id} order={order} onView={() => setSelectedOrder(order)} customerName={getCustomerName(order)} />
                        ))}
                    </OrderColumn>

                    <OrderColumn title="Completados / Historial" color="border-green-500/50" count={completedOrders.length} icon={CheckCircle2} opacity="opacity-70">
                        {completedOrders.slice(0, 10).map(order => (
                            <OrderCard key={order.id} order={order} onView={() => setSelectedOrder(order)} customerName={getCustomerName(order)} />
                        ))}
                    </OrderColumn>
                </div>
            </div>

            {/* CREATE ORDER MODAL */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card w-full max-w-4xl rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <div>
                                <h2 className="text-2xl font-bold flex items-center gap-2"><Plus className="w-6 h-6 text-primary" /> Nuevo Pedido</h2>
                                <p className="text-sm text-muted-foreground">Selecciona productos para crear una comanda manual.</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setIsCreateOpen(false)}><X /></Button>
                        </div>

                        <div className="flex-1 overflow-hidden grid md:grid-cols-2">
                            {/* Left: Product Selector */}
                            <div className="p-6 border-r border-white/10 flex flex-col h-full overflow-hidden">
                                <label className="text-sm font-bold uppercase text-muted-foreground mb-3">Catálogo</label>
                                <div className="relative mb-4">
                                    <input
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 pl-10 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                        placeholder="Buscar producto..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && filteredProducts.length > 0) {
                                                addToNewOrder(filteredProducts[0].id)
                                            }
                                        }}
                                    />
                                    <Clock className="w-4 h-4 text-muted-foreground absolute left-3 top-3.5" />
                                </div>

                                <div className="space-y-2 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                    {filteredProducts.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => addToNewOrder(p.id)}
                                            className="product-item w-full text-left p-4 rounded-xl bg-white/5 hover:bg-white/10 hover:border-primary/30 border border-white/5 flex justify-between items-center transition-all group"
                                        >
                                            <div>
                                                <span className="font-bold block group-hover:text-primary transition-colors">{p.name}</span>
                                                <span className="text-xs text-muted-foreground line-clamp-1">{p.description}</span>
                                            </div>
                                            <span className="font-mono text-primary font-bold bg-primary/10 px-2 py-1 rounded">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(p.price)}</span>
                                        </button>
                                    ))}
                                    {filteredProducts.length === 0 && (
                                        <p className="text-center text-muted-foreground py-10 italic">No se encontraron productos</p>
                                    )}
                                </div>
                            </div>

                            {/* Right: Order Summary */}
                            <div className="p-6 flex flex-col h-full bg-white/5">
                                <label className="text-sm font-bold uppercase text-muted-foreground mb-3">Detalles del Pedido</label>

                                {/* Waiter Label */}
                                {currentUser && (
                                    <div className="mb-4 flex items-center gap-2 text-xs text-primary font-bold uppercase tracking-wider bg-primary/10 w-fit px-3 py-1 rounded-full border border-primary/20">
                                        <User className="w-3 h-3" /> Mesero: {currentUser.full_name}
                                    </div>
                                )}

                                {/* Table & Customer Selection */}
                                <div className="mb-6 space-y-4">
                                    <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                        <label className="text-xs text-muted-foreground block mb-2">Seleccionar Mesa</label>
                                        <select
                                            className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg p-3 outline-none focus:border-primary font-bold text-white appearance-none"
                                            value={selectedTableId}
                                            onChange={e => setSelectedTableId(e.target.value)}
                                        >
                                            <option value="" className="bg-[#1a1a1a] text-white">-- Sin Mesa (Para Llevar) --</option>
                                            {tables.map(t => (
                                                <option key={t.id} value={t.id} className="bg-[#1a1a1a] text-white">
                                                    {t.table_name} - {t.location} ({t.status})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                        <label className="text-xs text-muted-foreground block mb-1">Nombre del Cliente (Opcional)</label>
                                        <input
                                            className="w-full bg-transparent border-none p-0 text-lg font-bold placeholder:text-muted-foreground/30 focus:ring-0"
                                            placeholder="Nombre para el pedido..."
                                            value={customerName}
                                            onChange={e => setCustomerName(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Current Items List */}
                                <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                                    {newOrderItems.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-white/10 rounded-xl">
                                            <span className="text-4xl mb-2">🛒</span>
                                            <p>Cesta vacía</p>
                                        </div>
                                    ) : (
                                        newOrderItems.map(item => (
                                            <div key={item.id} className="flex justify-between items-center p-3 rounded-xl bg-black/20 border border-white/5 animate-in slide-in-from-right-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-2 bg-white/10 rounded-lg px-2 py-1 border border-white/5">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (item.quantity > 1) {
                                                                    setNewOrderItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i))
                                                                } else {
                                                                    removeFromNewOrder(item.id)
                                                                }
                                                            }}
                                                            className="hover:text-primary w-6 h-6 flex items-center justify-center transition-colors"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="font-bold text-primary w-4 text-center">{item.quantity}</span>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                addToNewOrder(item.id);
                                                            }}
                                                            className="hover:text-primary w-6 h-6 flex items-center justify-center transition-colors"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                    <span className="font-medium">{item.name}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-mono">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(item.price * item.quantity)}</span>
                                                    <button onClick={() => removeFromNewOrder(item.id)} className="text-muted-foreground hover:text-red-500 transition-colors p-2">
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Total & Actions */}
                                <div className="mt-6 pt-4 border-t border-white/10 space-y-4">
                                    <div className="flex justify-between items-end">
                                        <span className="text-muted-foreground">Total a pagar</span>
                                        <span className="text-3xl font-black text-primary">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(newOrderItems.reduce((acc, i) => acc + (i.price * i.quantity), 0))}</span>
                                    </div>

                                    <Button
                                        onClick={handleCreateOrder}
                                        disabled={newOrderItems.length === 0}
                                        className={`w-full h-14 text-lg font-bold transition-all ${newOrderItems.length > 0 ? 'bg-green-600 hover:bg-green-500 shadow-lg shadow-green-900/20' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                                    >
                                        {newOrderItems.length > 0 ? '✅ Confirmar Pedido' : 'Selecciona productos'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* DETAIL MODAL (Ya existente) */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card w-full max-w-2xl rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <div>
                                <h2 className="text-2xl font-bold">Pedido #{selectedOrder.id.split('-')[0].toUpperCase()}</h2>
                                <p className="text-muted-foreground text-sm flex items-center gap-2">
                                    <Clock className="w-3 h-3" /> Hace {getElapsed(selectedOrder.created_at)}
                                    <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                                        {selectedOrder.status}
                                    </span>
                                    {selectedOrder.waiter && (
                                        <span className="flex items-center gap-1 text-primary">
                                            <User className="w-3 h-3" /> {selectedOrder.waiter.full_name}
                                        </span>
                                    )}
                                    {selectedOrder.tables && (
                                        <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] uppercase font-bold">
                                            {selectedOrder.tables.table_name}
                                        </span>
                                    )}
                                </p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(null)}>
                                <X className="w-6 h-6" />
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            <div>
                                <h3 className="text-sm font-bold uppercase text-muted-foreground mb-4">Productos</h3>
                                <div className="space-y-3">
                                    {selectedOrder.order_items?.map((item: any) => {
                                        const productName = item.products?.name || item.customizations?.name || "Producto desconocido";
                                        return (
                                            <div key={item.id} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                                                <div className="flex items-center gap-4">
                                                    <span className="font-bold text-lg text-primary w-8 text-center">{item.quantity}x</span>
                                                    <span className="font-medium">{productName}</span>
                                                </div>
                                                <span className="text-muted-foreground font-mono">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(item.unit_price * item.quantity)}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className="mt-4 flex justify-between items-center pt-4 border-t border-white/10 text-xl font-bold">
                                    <span>Total</span>
                                    <span>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(selectedOrder.total)}</span>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-sm font-bold uppercase text-muted-foreground mb-4">Cliente / Entrega</h3>
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                                            <User className="w-5 h-5 text-muted-foreground" />
                                            <div>
                                                <div className="font-medium">{getCustomerName(selectedOrder)}</div>
                                                {selectedOrder.guest_info?.phone && <div className="text-sm text-muted-foreground">{selectedOrder.guest_info.phone}</div>}
                                            </div>
                                        </div>
                                        {selectedOrder.delivery_address && (
                                            <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                                                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                                                <div>
                                                    <div className="font-medium">{selectedOrder.delivery_address.street}</div>
                                                    <div className="text-sm text-muted-foreground">{selectedOrder.delivery_address.city}</div>
                                                    {selectedOrder.delivery_address.phone && (
                                                        <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                                                            <Phone className="w-3 h-3" /> {selectedOrder.delivery_address.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        {selectedOrder.notes && (
                                            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-sm">
                                                <span className="font-bold block mb-1">Notas:</span>
                                                {selectedOrder.notes}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-white/10 bg-white/5 flex flex-col md:flex-row justify-between gap-4">
                            <div className="flex gap-2">
                                {selectedOrder.status === 'pending' && (
                                    <Button
                                        className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold h-12 px-6"
                                        onClick={async () => {
                                            const { error } = await supabase.from('orders').update({ status: 'preparing' }).eq('id', selectedOrder.id)
                                            if (error) {
                                                alert("Error al actualizar: " + error.message)
                                                console.error(error)
                                            } else {
                                                fetchOrders()
                                                setSelectedOrder(null)
                                            }
                                        }}
                                    >
                                        👨‍🍳 Enviar a Cocina
                                    </Button>
                                )}

                                {selectedOrder.status === 'preparing' && (
                                    <Button
                                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold h-12 px-6"
                                        onClick={async () => {
                                            const { error } = await supabase.from('orders').update({ status: 'ready' }).eq('id', selectedOrder.id)
                                            if (error) {
                                                alert("Error al actualizar: " + error.message)
                                            } else {
                                                fetchOrders()
                                                setSelectedOrder(null)
                                            }
                                        }}
                                    >
                                        ✅ Pedido Listo
                                    </Button>
                                )}

                                {(selectedOrder.status === 'ready' || selectedOrder.status === 'out_for_delivery') && (
                                    <Button
                                        className="bg-green-600 hover:bg-green-700 text-white font-bold h-12 px-6"
                                        onClick={async () => {
                                            const { error } = await supabase.from('orders').update({ status: 'delivered' }).eq('id', selectedOrder.id)
                                            if (error) {
                                                alert("Error al actualizar: " + error.message)
                                            } else {
                                                fetchOrders()
                                                setSelectedOrder(null)
                                            }
                                        }}
                                    >
                                        🛵 Marcar Entregado
                                    </Button>
                                )}
                            </div>

                            <div className="flex gap-3 ml-auto">
                                <Button variant="outline" className="text-destructive hover:bg-destructive/10 border-destructive/20" onClick={async () => {
                                    if (confirm("¿Cancelar este pedido?")) {
                                        await supabase.from('orders').update({ status: 'cancelled' }).eq('id', selectedOrder.id)
                                        fetchOrders()
                                        setSelectedOrder(null)
                                    }
                                }}>
                                    Cancelar
                                </Button>
                                <Button variant="outline" onClick={() => setSelectedOrder(null)}>Cerrar</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function OrderColumn({ title, count, children, color, icon: Icon, opacity = "" }: any) {
    return (
        <div className={`flex-1 flex flex-col bg-card/30 rounded-2xl border border-white/5 h-full ${opacity}`}>
            <div className={`p-4 border-b border-white/5 flex items-center justify-between ${color} border-t-4 rounded-t-2xl`}>
                <div className="flex items-center gap-2 font-bold">
                    <Icon className="w-4 h-4" />
                    {title}
                </div>
                <span className="bg-white/10 px-2 py-0.5 rounded text-xs font-mono">{count}</span>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto flex-1 h-[600px] scrollbar-hide">
                {children}
                {(!children || children.length === 0) && (
                    <div className="h-24 flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed border-white/5 rounded-xl">
                        Vacío
                    </div>
                )}
            </div>
        </div>
    )
}

function OrderCard({ order, onView, customerName }: any) {
    const elapsed = getElapsed(order.created_at)

    return (
        <div onClick={onView} className="bg-card p-4 rounded-xl border border-white/10 hover:border-primary/50 transition-colors cursor-pointer shadow-sm group">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <span className="font-bold text-lg">#{order.id.split('-')[0].toUpperCase()}</span>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                        {order.tables?.table_name && <span className="text-primary font-bold">{order.tables.table_name}</span>}
                        {order.tables?.table_name && customerName && <span>•</span>}
                        <span>{customerName}</span>
                    </div>
                </div>
                <span className="bg-white/5 px-2 py-1 rounded text-xs font-mono text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors whitespace-nowrap">
                    {elapsed}
                </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                {order.order_type === 'pickup' ? <div className="flex items-center gap-1 text-orange-400 font-bold"><User className="w-3 h-3" /> Recogida/Local</div> : <div className="flex items-center gap-1"><Bike className="w-3 h-3" /> Delivery</div>}
                <span>•</span>
                <span>{order.order_items?.length || 0} items</span>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-white/5">
                <span className="font-bold">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(order.total)}</span>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); onView(); }}>
                    Ver
                </Button>
            </div>
        </div>
    )
}
