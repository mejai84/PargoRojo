"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
    LayoutGrid,
    ShoppingBag,
    Clock,
    ChefHat,
    Plus,
    Minus,
    Trash2,
    Search,
    CheckCircle2,
    Flame,
    Users,
    X,
    Utensils,
    Coffee,
    Pizza,
    IceCream,
    User,
    ArrowLeft,
    Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"

// --- Types ---

interface Category {
    id: string
    name: string
    slug: string
    image_url: string | null
}

interface Product {
    id: string
    name: string
    price: number
    image_url: string | null
    category_id: string
}

interface OrderItem {
    product_id: string
    name: string
    price: number
    quantity: number
    notes?: string
}

interface Table {
    id: string
    table_number: number
    table_name: string
    status: 'available' | 'occupied' | 'reserved' | 'cleaning'
    location: string
    capacity: number
}

interface Profile {
    id: string
    full_name: string
    role: string
}

// --- Main Component ---

export default function WaiterPortalPage() {
    const [view, setView] = useState<'tables' | 'order' | 'my-orders'>('tables')
    const [selectedTable, setSelectedTable] = useState<Table | null>(null)
    const [categories, setCategories] = useState<Category[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [tables, setTables] = useState<Table[]>([])
    const [profile, setProfile] = useState<Profile | null>(null)
    const [cart, setCart] = useState<OrderItem[]>([])
    const [activeCategory, setActiveCategory] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [activeOrders, setActiveOrders] = useState<any[]>([])

    // Customization Modal State
    const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null)
    const [productNotes, setProductNotes] = useState("")
    const [isCartOpen, setIsCartOpen] = useState(false)

    useEffect(() => {
        loadInitialData()

        // Subscribe to table changes
        const tablesSubscription = supabase
            .channel('waiter-tables')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, () => {
                fetchTables()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(tablesSubscription)
        }
    }, [])

    const loadInitialData = async () => {
        setLoading(true)
        const { data: { session } } = await supabase.auth.getSession()

        if (session) {
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single()
            setProfile(profileData)
        }

        await Promise.all([
            fetchTables(),
            fetchCategories(),
            fetchProducts(),
            fetchMyOrders()
        ])

        setLoading(false)
    }

    const fetchTables = async () => {
        const { data } = await supabase
            .from('tables')
            .select('*')
            .eq('active', true)
            .order('table_number', { ascending: true })
        setTables(data || [])
    }

    const fetchCategories = async () => {
        const { data } = await supabase
            .from('categories')
            .select('*')
            .order('sort_order', { ascending: true })
        setCategories(data || [])
        if (data && data.length > 0) setActiveCategory(data[0].id)
    }

    const fetchProducts = async () => {
        const { data } = await supabase
            .from('products')
            .select('*')
            .is('deleted_at', null)
        setProducts(data || [])
    }

    const fetchMyOrders = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const { data } = await supabase
            .from('orders')
            .select(`
                *,
                tables (table_name),
                order_items (
                    quantity,
                    products (name)
                )
            `)
            .eq('waiter_id', session.user.id)
            .in('status', ['pending', 'preparing', 'ready'])
            .order('created_at', { ascending: false })

        setActiveOrders(data || [])
    }

    // --- Actions ---

    const handleSelectTable = (table: Table) => {
        setSelectedTable(table)
        setView('order')
    }

    const openCustomizer = (product: Product) => {
        setCustomizingProduct(product)
        setProductNotes("")
    }

    const addToCartWithNotes = () => {
        if (!customizingProduct) return

        setCart(prev => {
            const existingIndex = prev.findIndex(item => item.product_id === customizingProduct.id && item.notes === productNotes)
            if (existingIndex > -1) {
                const newCart = [...prev]
                newCart[existingIndex].quantity += 1
                return newCart
            }
            return [...prev, {
                product_id: customizingProduct.id,
                name: customizingProduct.name,
                price: customizingProduct.price,
                quantity: 1,
                notes: productNotes
            }]
        })
        setCustomizingProduct(null)
    }

    const removeFromCart = (productId: string, notes?: string) => {
        setCart(prev => {
            const existingIndex = prev.findIndex(item => item.product_id === productId && item.notes === notes)
            if (existingIndex > -1) {
                const item = prev[existingIndex]
                if (item.quantity > 1) {
                    const newCart = [...prev]
                    newCart[existingIndex].quantity -= 1
                    return newCart
                }
                return prev.filter((_, i) => i !== existingIndex)
            }
            return prev
        })
    }

    const submitOrder = async () => {
        if (cart.length === 0 || !selectedTable || !profile) return

        setSubmitting(true)
        try {
            const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)

            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert([{
                    table_id: selectedTable.id,
                    waiter_id: profile.id,
                    total: total,
                    subtotal: total,
                    status: 'pending',
                    order_type: 'pickup',
                    guest_info: { name: selectedTable.table_name },
                    payment_status: 'pending',
                    payment_method: 'cash'
                }])
                .select()
                .single()

            if (orderError) throw orderError

            const itemsToInsert = cart.map(item => ({
                order_id: order.id,
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.price,
                customizations: item.notes ? { notes: item.notes } : null
            }))

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(itemsToInsert)

            if (itemsError) throw itemsError

            // Update table status
            await supabase
                .from('tables')
                .update({ status: 'occupied' })
                .eq('id', selectedTable.id)

            setCart([])
            setSelectedTable(null)
            setView('tables')
            fetchMyOrders()
            alert("¡Orden enviada a cocina! 🔥")
        } catch (error: any) {
            console.error(error)
            alert("Error al enviar orden: " + error.message)
        } finally {
            setSubmitting(false)
        }
    }

    // --- Renders ---

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    <p className="text-xl font-bold tracking-widest uppercase opacity-50">Cargando Portal...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header Sticky */}
            <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {view !== 'tables' && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                if (view === 'order' && cart.length > 0) {
                                    if (confirm("¿Deseas descartar el pedido actual?")) {
                                        setCart([])
                                        setView('tables')
                                    }
                                } else {
                                    setView('tables')
                                }
                            }}
                            className="rounded-full"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    )}
                    <div>
                        <h1 className="text-xl font-bold tracking-tighter uppercase">
                            {view === 'tables' ? 'Selector de Mesas' :
                                view === 'order' ? `Mesa ${selectedTable?.table_number}` :
                                    'Mis Ordenes'}
                        </h1>
                        <p className="text-[10px] text-primary font-bold uppercase tracking-widest">
                            Mesero: {profile?.full_name}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant={view === 'my-orders' ? 'default' : 'ghost'}
                        size="icon"
                        onClick={() => setView('my-orders')}
                        className="relative rounded-xl"
                    >
                        <ChefHat className="w-5 h-5" />
                        {activeOrders.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                                {activeOrders.length}
                            </span>
                        )}
                    </Button>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto">
                {view === 'tables' && (
                    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {tables.map(table => (
                            <button
                                key={table.id}
                                onClick={() => handleSelectTable(table)}
                                className={cn(
                                    "relative h-32 rounded-3xl border-2 flex flex-col items-center justify-center transition-all p-4 active:scale-95",
                                    table.status === 'available'
                                        ? "bg-green-500/5 border-green-500/20 hover:border-green-500/50"
                                        : "bg-orange-500/10 border-orange-500/50"
                                )}
                            >
                                <span className="text-sm font-black uppercase opacity-50 mb-1">{table.location}</span>
                                <span className="text-4xl font-black">{table.table_number}</span>
                                <div className={cn(
                                    "mt-2 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                                    table.status === 'available' ? "bg-green-500 text-black" : "bg-orange-500 text-white"
                                )}>
                                    {table.status === 'available' ? 'Libre' : 'Ocupada'}
                                </div>
                                {table.status === 'occupied' && (
                                    <div className="absolute top-2 right-2">
                                        <Users className="w-4 h-4 text-orange-500" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                )}

                {view === 'order' && (
                    <div className="flex flex-col h-full animate-in fade-in duration-300">
                        {/* Categories Horizontal Scroll */}
                        <div className="sticky top-0 z-20 bg-background border-b border-white/5 py-4 overflow-x-auto scroller-hide">
                            <div className="flex px-4 gap-2">
                                {categories.map(cat => (
                                    <Button
                                        key={cat.id}
                                        variant={activeCategory === cat.id ? 'default' : 'outline'}
                                        onClick={() => setActiveCategory(cat.id)}
                                        className="rounded-full flex-shrink-0 font-bold px-6"
                                    >
                                        {cat.name}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Search Bar Plugin */}
                        <div className="p-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                <input
                                    className="w-full bg-card border border-white/10 rounded-2xl py-3 pl-10 pr-4 outline-none focus:border-primary/50 transition-all font-medium"
                                    placeholder="Buscar plato o bebida..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Product Grid */}
                        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {products
                                .filter(p => !activeCategory || p.category_id === activeCategory)
                                .filter(p => !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                .map(product => (
                                    <button
                                        key={product.id}
                                        onClick={() => openCustomizer(product)}
                                        className="bg-card border border-white/10 rounded-3xl overflow-hidden hover:border-primary/50 transition-all active:scale-95 flex flex-col items-start text-left group"
                                    >
                                        {product.image_url ? (
                                            <div className="w-full h-32 overflow-hidden relative">
                                                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                            </div>
                                        ) : (
                                            <div className="w-full h-32 bg-white/5 flex items-center justify-center">
                                                <Utensils className="w-8 h-8 opacity-20" />
                                            </div>
                                        )}
                                        <div className="p-3 w-full">
                                            <h3 className="font-bold text-sm leading-tight mb-1 line-clamp-2">{product.name}</h3>
                                            <div className="flex justify-between items-center">
                                                <p className="text-primary font-black text-sm">
                                                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(product.price)}
                                                </p>
                                                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                                                    <Plus className="w-3 h-3 text-primary" />
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            }
                        </div>
                    </div>
                )}

                {view === 'my-orders' && (
                    <div className="p-4 space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        {activeOrders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-30">
                                <ShoppingBag className="w-16 h-16 mb-4" />
                                <p className="text-xl font-black">SIN ORDENES ACTIVAS</p>
                            </div>
                        ) : (
                            activeOrders.map(order => (
                                <div key={order.id} className="bg-card border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-3">
                                        <div className={cn(
                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                            order.status === 'pending' ? "bg-blue-500 text-white" :
                                                order.status === 'preparing' ? "bg-orange-500 text-white" :
                                                    "bg-green-500 text-black"
                                        )}>
                                            {order.status === 'pending' ? 'En Espera' :
                                                order.status === 'preparing' ? 'Cocinando 🔥' :
                                                    '¡Listo! ✅'}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 font-black text-xl">
                                            {order.tables?.table_name?.match(/\d+/)?.[0] || 'M'}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-lg">{order.tables?.table_name}</h3>
                                            <p className="text-[10px] text-muted-foreground font-bold flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> Hace {Math.floor((new Date().getTime() - new Date(order.created_at).getTime()) / 60000)} min
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        {order.order_items?.map((item: any, idx: number) => (
                                            <div key={idx} className="flex justify-between text-sm">
                                                <span className="font-bold opacity-70">{item.quantity}x {item.products?.name}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                                        <span className="font-black text-primary">
                                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(order.total)}
                                        </span>
                                        <Button variant="ghost" size="sm" className="rounded-full text-[10px] font-black uppercase" onClick={() => {
                                            // TODO: Ver detalle o añadir items
                                        }}>
                                            Ver Detalle
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Bottom Floating Cart Bar */}
            {view === 'order' && cart.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-background via-background to-transparent">
                    <div className="bg-primary text-black rounded-[2.5rem] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-between">
                        <div className="flex flex-col ml-2">
                            <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 opacity-70">Subtotal</span>
                            <span className="text-2xl font-black tabular-nums">
                                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
                                    cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)
                                )}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsCartOpen(true)}
                                className="bg-black/10 hover:bg-black/20 rounded-2xl h-14 w-14 relative"
                            >
                                <ShoppingBag className="w-6 h-6" />
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                    {cart.reduce((acc, item) => acc + item.quantity, 0)}
                                </span>
                            </Button>

                            <Button
                                disabled={submitting}
                                onClick={submitOrder}
                                className="h-14 px-8 bg-black text-white hover:bg-black/90 rounded-2xl font-black text-lg gap-2"
                            >
                                {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Flame className="w-6 h-6" />}
                                ENVIAR A COCINA
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Product Customizer Modal */}
            {customizingProduct && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-300">
                    <div className="bg-card w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
                        <div className="p-8 border-b border-white/5 flex justify-between items-start">
                            <div className="flex gap-4">
                                {customizingProduct.image_url && (
                                    <img src={customizingProduct.image_url} alt="" className="w-16 h-16 rounded-2xl object-cover" />
                                )}
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight">{customizingProduct.name}</h2>
                                    <p className="text-primary font-black">
                                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(customizingProduct.price)}
                                    </p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setCustomizingProduct(null)}>
                                <X className="w-6 h-6" />
                            </Button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase tracking-widest opacity-50 flex items-center gap-2">
                                    <Clock className="w-3 h-3" /> Instrucciones Especiales
                                </label>
                                <textarea
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-primary/50 transition-all font-medium min-h-[120px] resize-none"
                                    placeholder="Ej: Sin cebolla, bien cocido, salsa aparte..."
                                    value={productNotes}
                                    onChange={(e) => setProductNotes(e.target.value)}
                                />
                                <div className="flex gap-2 flex-wrap pt-2">
                                    {['Sin Cebolla', 'Término Medio', 'Bien Cocido', 'Salsa Aparte'].map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => setProductNotes(prev => prev ? `${prev}, ${tag}` : tag)}
                                            className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase hover:bg-primary/10 hover:text-primary transition-all"
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-8 pt-0">
                            <Button
                                onClick={addToCartWithNotes}
                                className="w-full h-16 bg-primary text-black font-black text-xl rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all"
                            >
                                AÑADIR A LA MESA
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cart Drawer (Summary) */}
            {isCartOpen && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-md p-0 animate-in fade-in duration-300">
                    <div
                        className="absolute inset-0"
                        onClick={() => setIsCartOpen(false)}
                    />
                    <div className="relative bg-card w-full max-w-2xl rounded-t-[3rem] border-t border-white/10 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom duration-300">
                        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-4 mb-2" />

                        <div className="p-8 flex justify-between items-center bg-white/5 border-b border-white/5">
                            <div>
                                <h2 className="text-2xl font-black tracking-tight">RESUMEN DEL PEDIDO</h2>
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Mesa {selectedTable?.table_number}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setIsCartOpen(false)}>
                                <X className="w-6 h-6" />
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-4">
                            {cart.length === 0 ? (
                                <div className="text-center py-20 opacity-20">
                                    <ShoppingBag className="w-20 h-20 mx-auto" />
                                    <p className="font-black text-xl mt-4">CARRITO VACÍO</p>
                                </div>
                            ) : (
                                cart.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-4 bg-white/5 rounded-3xl border border-white/5 group">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <span className="font-black text-primary text-lg">{item.quantity}x</span>
                                                <h4 className="font-bold">{item.name}</h4>
                                            </div>
                                            {item.notes && (
                                                <p className="text-xs text-orange-400 font-bold uppercase mt-1 ml-9">
                                                    "{item.notes}"
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="font-mono font-bold">
                                                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(item.price * item.quantity)}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-500"
                                                    onClick={() => removeFromCart(item.product_id, item.notes)}
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-full bg-white/5 hover:bg-green-500/20 hover:text-green-500"
                                                    onClick={() => {
                                                        const p = products.find(prod => prod.id === item.product_id);
                                                        if (p) addToCartWithNotes_v2(p, item.notes);
                                                    }}
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-8 bg-black/40 border-t border-white/10 space-y-6">
                            <div className="flex justify-between items-end">
                                <span className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Total del Pedido</span>
                                <span className="text-4xl font-black text-primary">
                                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
                                        cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)
                                    )}
                                </span>
                            </div>
                            <Button
                                disabled={submitting || cart.length === 0}
                                onClick={submitOrder}
                                className="w-full h-20 bg-primary text-black font-black text-2xl rounded-[2rem] shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                {submitting ? <Loader2 className="w-8 h-8 animate-spin" /> : <Flame className="w-8 h-8" />}
                                ENVIAR A COCINA
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .scroller-hide::-webkit-scrollbar {
                    display: none;
                }
                .scroller-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                @keyframes slide-up {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
            `}</style>
        </div>
    )

    // Helper function for adding items with same notes within the cart drawer
    function addToCartWithNotes_v2(product: Product, notes?: string) {
        setCart(prev => {
            const existingIndex = prev.findIndex(item => item.product_id === product.id && item.notes === notes)
            if (existingIndex > -1) {
                const newCart = [...prev]
                newCart[existingIndex].quantity += 1
                return newCart
            }
            return prev
        })
    }
}
