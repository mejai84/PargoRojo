
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
    ArrowLeft,
    Loader2,
    Receipt,
    LogOut,
    AlertCircle,
    MessageSquare,
    RefreshCw,
    ArrowRight,
    MoveHorizontal
} from "lucide-react"

import { cn } from "@/lib/utils"
import Image from "next/image"


// --- Types ---
interface Category { id: string; name: string; slug: string; image_url: string | null }
interface Product { id: string; name: string; price: number; image_url: string | null; category_id: string; description?: string }
interface OrderItem { product_id: string; name: string; price: number; quantity: number; notes?: string }
interface Table { id: string; table_number: number; table_name: string; status: 'available' | 'occupied' | 'reserved' | 'cleaning'; location: string; capacity: number }
interface Profile { id: string; full_name: string; role: string }

const categoryIcons: { [key: string]: string } = {
    "pescados-y-mariscos": "🐟",
    "ricuras-region": "🍲",
    "cortes-gruesos": "🥩",
    "especialidades-brasa": "🔥",
    "cerdo": "🐷",
    "arroces": "🍚",
    "pollos": "🍗",
    "pastas": "🍝",
    "comida-montanera": "🏔️",
    "lasanas": "🧀",
    "comidas-rapidas": "🍔",
    "menu-infantil": "👶",
    "entradas": "🥗",
    "asados": "🔥",
    "desayunos": "☀️",
    "adicionales-bebidas": "🍹",
}

const categoryColors: { [key: string]: string } = {
    "pescados-y-mariscos": "bg-blue-50 hover:bg-blue-100 border-blue-100",
    "ricuras-region": "bg-amber-50 hover:bg-amber-100 border-amber-100",
    "cortes-gruesos": "bg-red-50 hover:bg-red-100 border-red-100",
    "especialidades-brasa": "bg-orange-50 hover:bg-orange-100 border-orange-100",
    "cerdo": "bg-pink-50 hover:bg-pink-100 border-pink-100",
    "arroces": "bg-yellow-50 hover:bg-yellow-100 border-yellow-100",
    "pollos": "bg-amber-50 hover:bg-amber-100 border-amber-100",
    "pastas": "bg-orange-50 hover:bg-orange-100 border-orange-100",
    "comida-montanera": "bg-green-50 hover:bg-green-100 border-green-100",
    "lasanas": "bg-red-50 hover:bg-red-100 border-red-100",
    "comidas-rapidas": "bg-yellow-50 hover:bg-yellow-100 border-yellow-100",
    "menu-infantil": "bg-purple-50 hover:bg-purple-100 border-purple-100",
    "entradas": "bg-green-50 hover:bg-green-100 border-green-100",
    "asados": "bg-red-50 hover:bg-amber-100 border-red-100",
    "desayunos": "bg-yellow-50 hover:bg-orange-100 border-yellow-100",
    "adicionales-bebidas": "bg-teal-50 hover:bg-cyan-100 border-teal-100",
}


export default function WaiterPortalPage() {
    const [view, setView] = useState<'tables' | 'order' | 'my-orders' | 'table-detail'>('tables')
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
    const [currentTableOrder, setCurrentTableOrder] = useState<any>(null)
    const [fetchingOrder, setFetchingOrder] = useState(false)

    // Customization Modal State
    const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null)
    const [productNotes, setProductNotes] = useState("")

    // Bill Modal State
    const [showBill, setShowBill] = useState(false)

    // Transfer Modals State
    const [showTransferModal, setShowTransferModal] = useState<'table' | 'product' | null>(null)
    const [transferTargetTableId, setTransferTargetTableId] = useState<string>("")
    const [transferProductItemId, setTransferProductItemId] = useState<string>("")
    const [isTransferring, setIsTransferring] = useState(false)


    useEffect(() => {
        loadInitialData()
        const tablesSubscription = supabase.channel('waiter-tables')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, () => fetchTables())
            .subscribe()
        return () => { supabase.removeChannel(tablesSubscription) }
    }, [])

    const loadInitialData = async () => {
        setLoading(true)
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
            const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
            setProfile(profileData)
        }
        await Promise.all([fetchTables(), fetchCategories(), fetchProducts(), fetchMyOrders()])
        setLoading(false)
    }

    const fetchTables = async () => {
        const { data } = await supabase.from('tables').select('*').eq('active', true).order('table_number', { ascending: true })
        setTables(data || [])
    }

    const fetchCategories = async () => {
        const { data } = await supabase.from('categories').select('*').eq('is_active', true).order('order_position', { ascending: true })
        setCategories(data || [])
        // Inicialmente no seleccionamos ninguna para mostrar la cuadrícula de categorías
        setActiveCategory(null)
    }


    const fetchProducts = async () => {
        const { data } = await supabase.from('products').select('*').eq('is_available', true).order('name')
        setProducts(data || [])
    }

    const fetchMyOrders = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return
        const { data } = await supabase.from('orders').select(`*, tables (table_name), order_items (quantity, products (name))`)
            .eq('waiter_id', session.user.id).in('status', ['pending', 'preparing', 'ready']).order('created_at', { ascending: false })
        setActiveOrders(data || [])
    }

    const handleSelectTable = async (table: Table) => {
        setSelectedTable(table)
        if (table.status === 'occupied') {
            setFetchingOrder(true)
            setView('table-detail') // Mostrar pantalla de carga o detalle inmediatamente

            const { data: order, error } = await supabase
                .from('orders')
                .select('*, order_items(*, products(name))')
                .eq('table_id', table.id)
                .in('status', ['pending', 'preparing', 'ready'])
                .order('created_at', { ascending: false })
                .limit(1)

            if (order && order.length > 0) {
                setCurrentTableOrder(order[0])
            } else {
                // Si la mesa dice ocupada pero no hay órden activa, permitir crear una
                setCurrentTableOrder(null)
            }
            setFetchingOrder(false)
        } else {
            setView('order')
        }
    }

    const addToCart = (product: Product, notes?: string) => {
        setCart(prev => {
            // Si tiene notas, lo tratamos como un item único siempre para no mezclar observaciones
            if (notes) {
                return [...prev, { product_id: product.id, name: product.name, price: product.price, quantity: 1, notes }];
            }

            const exists = prev.find(i => i.product_id === product.id && !i.notes);
            if (exists) return prev.map(i => (i.product_id === product.id && !i.notes) ? { ...i, quantity: i.quantity + 1 } : i);
            return [...prev, { product_id: product.id, name: product.name, price: product.price, quantity: 1 }];
        })
        setCustomizingProduct(null)
        setProductNotes("")
    }

    const handleTransferTable = async () => {
        if (!selectedTable || !transferTargetTableId || !currentTableOrder) return
        setIsTransferring(true)
        try {
            // 1. Mover la orden a la nueva mesa
            const { error: orderError } = await supabase
                .from('orders')
                .update({ table_id: transferTargetTableId })
                .eq('id', currentTableOrder.id)

            if (orderError) throw orderError

            // 2. Liberar mesa vieja
            await supabase.from('tables').update({ status: 'available' }).eq('id', selectedTable.id)

            // 3. Ocupar mesa nueva
            await supabase.from('tables').update({ status: 'occupied' }).eq('id', transferTargetTableId)

            alert("¡Mesa cambiada exitosamente! 🔄")
            setShowTransferModal(null)
            setView('tables')
            fetchTables()
        } catch (error: any) {
            alert("Error al transferir: " + error.message)
        } finally {
            setIsTransferring(false)
        }
    }

    const handleTransferProduct = async () => {
        if (!transferProductItemId || !transferTargetTableId || !currentTableOrder) return
        setIsTransferring(true)
        try {
            // 1. Buscar si la mesa destino ya tiene una orden activa
            const { data: targetOrders } = await supabase
                .from('orders')
                .select('id, total')
                .eq('table_id', transferTargetTableId)
                .in('status', ['pending', 'preparing', 'ready'])
                .limit(1)

            let targetOrderId = targetOrders?.[0]?.id

            // 2. Si no tiene, crear una nueva
            if (!targetOrderId) {
                const { data: newOrder, error: orderError } = await supabase.from('orders').insert([{
                    table_id: transferTargetTableId,
                    waiter_id: profile?.id,
                    total: 0,
                    status: 'pending',
                    order_type: 'pickup',
                    guest_info: { name: tables.find(t => t.id === transferTargetTableId)?.table_name },
                    payment_status: 'pending'
                }]).select().single()
                if (orderError) throw orderError
                targetOrderId = newOrder.id
                await supabase.from('tables').update({ status: 'occupied' }).eq('id', transferTargetTableId)
            }

            // 3. Mover el item
            const { error: itemError } = await supabase
                .from('order_items')
                .update({ order_id: targetOrderId })
                .eq('id', transferProductItemId)

            if (itemError) throw itemError

            // 4. Actualizar totales (la base de datos debería tener triggers para esto, 
            // pero podemos hacerlo manual si es necesario)
            // Por simplicidad en este MVP, asumiremos que se refresca al cargar

            alert("¡Producto movido exitosamente! 🥗")
            setShowTransferModal(null)
            setView('tables')
            fetchTables()
        } catch (error: any) {
            alert("Error al mover producto: " + error.message)
        } finally {
            setIsTransferring(false)
        }
    }

    const submitOrder = async () => {
        if (cart.length === 0 || !selectedTable || !profile) return
        setSubmitting(true)
        try {
            const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)
            let orderId = currentTableOrder?.id

            if (!orderId) {
                const { data: newOrder, error: orderError } = await supabase.from('orders').insert([{
                    table_id: selectedTable.id,
                    waiter_id: profile.id,
                    total,
                    subtotal: total,
                    status: 'pending',
                    order_type: 'pickup',
                    guest_info: { name: selectedTable.table_name },
                    payment_status: 'pending',
                    payment_method: 'cash'
                }]).select().single()
                if (orderError) throw orderError
                orderId = newOrder.id
                // Asegurar que la mesa esté ocupada
                await supabase.from('tables').update({ status: 'occupied' }).eq('id', selectedTable.id)
            } else {
                // Actualizar total de la orden existente
                await supabase.from('orders').update({ total: currentTableOrder.total + total }).eq('id', orderId)
            }

            const itemsToInsert = cart.map(item => ({
                order_id: orderId,
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.price,
                customizations: item.notes ? { notes: item.notes } : null
            }))
            await supabase.from('order_items').insert(itemsToInsert)

            setCart([])
            setSelectedTable(null)
            setCurrentTableOrder(null)
            setView('tables')
            fetchMyOrders()
            alert("¡Pedido enviado a cocina! 🔥")
        } catch (error: any) { alert("Error: " + error.message) }
        finally { setSubmitting(false) }
    }

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans">
            {/* Header Sticky Profesional */}
            <header className="sticky top-0 z-40 bg-white border-b border-gray-100 p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    {view !== 'tables' && (
                        <Button variant="ghost" size="icon" onClick={() => { setView('tables'); setSelectedTable(null); setCurrentTableOrder(null); setCart([]); }} className="rounded-full">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    )}
                    <div>
                        <h1 className="text-xl font-black tracking-tight uppercase">
                            {view === 'tables' ? 'Portal Mesero' : selectedTable?.table_name}
                        </h1>
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest leading-none">
                            {profile?.full_name || 'Personal'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setView('my-orders')} className="relative rounded-xl bg-gray-50 h-10 w-10">
                        <ChefHat className="w-5 h-5 text-gray-500" />
                        {activeOrders.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                                {activeOrders.length}
                            </span>
                        )}
                    </Button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto">
                {/* VISTA: SELECTOR DE MESAS */}
                {view === 'tables' && (
                    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-in fade-in duration-300">
                        {tables.map(table => (
                            <button
                                key={table.id}
                                onClick={() => handleSelectTable(table)}
                                className={cn(
                                    "h-40 rounded-[2.5rem] border-2 flex flex-col items-center justify-center transition-all p-4 active:scale-95 shadow-sm group",
                                    table.status === 'available' ? "bg-white border-gray-100 hover:border-green-200" : "bg-orange-50 border-orange-200"
                                )}
                            >
                                <span className="text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest">{table.location}</span>
                                <span className="text-5xl font-black text-gray-900 group-hover:text-primary transition-colors">{table.table_number}</span>
                                <div className={cn(
                                    "mt-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                    table.status === 'available' ? "bg-green-100 text-green-700" : "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                                )}>
                                    {table.status === 'available' ? 'LIBRE' : 'OCUPADA'}
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* VISTA: DETALLE DE MESA OCUPADA */}
                {view === 'table-detail' && (
                    <div className="p-6 max-w-2xl mx-auto space-y-6 animate-in slide-in-from-bottom-10 duration-500">
                        {fetchingOrder ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                <p className="font-bold text-gray-400 uppercase text-xs tracking-widest">Buscando cuenta...</p>
                            </div>
                        ) : !currentTableOrder ? (
                            <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-xl text-center space-y-6">
                                <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto">
                                    <AlertCircle className="w-10 h-10 text-orange-400" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black">Mesa sin Pedido Activo</h2>
                                    <p className="text-gray-500 mt-2">La mesa está marcada como ocupada pero no se encontró un pedido pendiente. ¿Deseas iniciar uno nuevo?</p>
                                </div>
                                <Button onClick={() => setView('order')} className="w-full h-16 rounded-2xl bg-primary text-white font-black text-lg gap-3">
                                    <Plus className="w-6 h-6" /> INICIAR NUEVO PEDIDO
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-xs font-black text-gray-400 tracking-[0.2em] uppercase">Consumo de la Mesa</h2>
                                        <span className="text-xs font-mono font-bold text-gray-300">ID: {currentTableOrder.id.split('-')[0].toUpperCase()}</span>
                                    </div>

                                    <div className="space-y-4 mb-8">
                                        {currentTableOrder.order_items.map((item: any, i: number) => (
                                            <div key={i} className="flex justify-between items-center group">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center font-black text-sm text-gray-400">{item.quantity}</span>
                                                    <span className="font-bold text-gray-700">{item.products?.name}</span>
                                                </div>
                                                <span className="font-mono text-gray-400">${(item.unit_price * item.quantity).toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-6 border-t border-gray-100 flex justify-between items-end">
                                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Total a Pagar</span>
                                        <span className="text-4xl font-black text-primary leading-none">${currentTableOrder.total.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Button onClick={() => setView('order')} className="h-20 rounded-[1.5rem] bg-gray-900 hover:bg-gray-800 text-white font-black text-lg gap-3 shadow-xl shadow-gray-900/10">
                                        <Plus className="w-6 h-6" /> AÑADIR MÁS
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowBill(true)}
                                        className="h-20 rounded-[1.5rem] border-gray-200 bg-white hover:bg-gray-50 font-black text-lg gap-3 shadow-sm"
                                    >
                                        <Receipt className="w-6 h-6" /> VER CUENTA
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => setShowTransferModal('table')}
                                        className="h-16 rounded-[1.5rem] text-gray-500 font-bold text-xs uppercase tracking-widest gap-2 hover:bg-white hover:text-primary transition-all col-span-1"
                                    >
                                        <RefreshCw className="w-4 h-4" /> Cambiar Mesa
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => setShowTransferModal('product')}
                                        className="h-16 rounded-[1.5rem] text-gray-500 font-bold text-xs uppercase tracking-widest gap-2 hover:bg-white hover:text-primary transition-all col-span-1"
                                    >
                                        <ArrowRight className="w-4 h-4" /> Mover Producto
                                    </Button>

                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* VISTA: TOMAR PEDIDO (PRODUCTOS) */}
                {view === 'order' && (
                    <div className="flex flex-col h-full bg-white animate-in slide-in-from-right-10 duration-500">
                        {/* Buscador y Header de Vista */}
                        <div className="p-4 bg-white sticky top-0 z-30 space-y-4">
                            <div className="flex items-center gap-3">
                                {activeCategory && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setActiveCategory(null)}
                                        className="rounded-full bg-gray-50"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </Button>
                                )}
                                <h2 className="text-xl font-black uppercase tracking-tight">
                                    {!activeCategory ? "¿Qué desea el cliente?" : categories.find(c => c.id === activeCategory)?.name}
                                </h2>
                            </div>

                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                                <input
                                    className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold text-gray-900 placeholder:text-gray-300 shadow-sm"
                                    placeholder={!activeCategory ? "Buscar plato o bebida..." : `Buscar en ${categories.find(c => c.id === activeCategory)?.name}...`}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* SUBVISTA 1: GRID DE CATEGORÍAS (Si no hay categoría activa ni búsqueda) */}
                        {!activeCategory && !searchTerm && (
                            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-in fade-in duration-500">
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCategory(cat.id)}
                                        className={cn(
                                            "relative h-40 rounded-[2.5rem] border-2 p-0 text-left transition-all active:scale-95 group overflow-hidden bg-white hover:border-primary/50 shadow-sm hover:shadow-xl",
                                            activeCategory === cat.id ? "border-primary ring-4 ring-primary/20" : "border-gray-100"
                                        )}
                                    >
                                        {/* Imagen de Fondo / Icono */}
                                        <div className="absolute inset-0 z-0">
                                            {cat.image_url ? (
                                                <Image
                                                    src={cat.image_url}
                                                    alt={cat.name}
                                                    fill
                                                    className="object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-4xl bg-gray-50">
                                                    {categoryIcons[cat.slug] || "🍽️"}
                                                </div>
                                            )}
                                        </div>

                                        {/* Overlay degradado para texto */}
                                        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent z-10" />

                                        <h3 className="absolute bottom-4 left-4 right-4 text-center text-sm font-black text-white uppercase tracking-wider z-20 leading-tight drop-shadow-md">
                                            {cat.name}
                                        </h3>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* SUBVISTA 2: GRID DE PRODUCTOS (Si hay categoría seleccionada o búsqueda activa) */}
                        {(activeCategory || searchTerm) && (
                            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {products
                                    .filter(p => !activeCategory || p.category_id === activeCategory)
                                    .filter(p => !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                    .map(product => (
                                        <button
                                            key={product.id}
                                            onClick={() => addToCart(product)}
                                            className="group bg-white border border-gray-100 rounded-[2rem] p-2 text-left shadow-sm hover:shadow-md hover:border-primary/30 active:scale-95 transition-all flex flex-col gap-2 h-full min-h-[180px]"
                                        >
                                            <div className="relative aspect-square w-full rounded-[1.5rem] overflow-hidden bg-gray-50 mb-1">
                                                {product.image_url ? (
                                                    <Image
                                                        src={product.image_url}
                                                        alt={product.name}
                                                        fill
                                                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Utensils className="w-8 h-8 text-gray-200" />
                                                    </div>
                                                )}
                                                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm w-7 h-7 rounded-full flex items-center justify-center shadow-sm">
                                                    <Plus className="w-4 h-4 text-primary" />
                                                </div>
                                            </div>
                                            <div className="px-1 flex flex-col justify-between flex-1">
                                                <div>
                                                    <h3 className="font-bold text-[11px] leading-tight line-clamp-2 text-gray-800 group-hover:text-primary transition-colors">{product.name}</h3>
                                                </div>
                                                <div className="flex items-center justify-between mt-1 relative z-10">
                                                    <p className="text-primary font-black text-sm">${product.price.toLocaleString()}</p>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className={cn(
                                                            "h-8 w-8 rounded-full transition-all",
                                                            "hover:bg-primary/20 hover:text-primary bg-gray-50 text-gray-400",
                                                            customizingProduct?.id === product.id && "bg-primary text-white"
                                                        )}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setCustomizingProduct(product);
                                                        }}
                                                    >
                                                        <MessageSquare className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                            </div>
                        )}

                        {(activeCategory || searchTerm) && (
                            <div className="p-10 text-center opacity-40">
                                <Utensils className="w-8 h-8 mx-auto mb-2" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Fin del catálogo</p>
                            </div>
                        )}
                    </div>
                )}

                {/* MODAL DE OBSERVACIONES */}
                {customizingProduct && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                        <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="text-xl font-black">OBSERVACIONES</h3>
                                <Button variant="ghost" size="icon" onClick={() => setCustomizingProduct(null)}>
                                    <X className="w-6 h-6" />
                                </Button>
                            </div>
                            <div className="p-8 space-y-4">
                                <p className="font-bold text-gray-500 uppercase text-xs tracking-widest">{customizingProduct.name}</p>
                                <textarea
                                    className="w-full h-32 bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-gray-900 placeholder:text-gray-300 resize-none"
                                    placeholder="Ej: Sin cebolla, término medio, etc..."
                                    value={productNotes}
                                    onChange={(e) => setProductNotes(e.target.value)}
                                    autoFocus
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <Button variant="outline" className="h-14 rounded-xl font-bold" onClick={() => setCustomizingProduct(null)}>CANCELAR</Button>
                                    <Button className="h-14 rounded-xl bg-primary text-white font-black" onClick={() => addToCart(customizingProduct, productNotes)}>AGREGAR</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* VISTA: MIS ORDNENES ACTIVAS */}
                {view === 'my-orders' && (
                    <div className="p-6 space-y-4 max-w-xl mx-auto animate-in fade-in duration-300">
                        <h2 className="text-xs font-black text-gray-400 tracking-[0.2em] uppercase mb-4">Pedidos de hoy</h2>
                        {activeOrders.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-[2.5rem] border border-gray-100">
                                <Utensils className="w-12 h-12 text-gray-100 mx-auto mb-4" />
                                <p className="font-bold text-gray-400">No tienes pedidos activos</p>
                            </div>
                        ) : (
                            activeOrders.map(order => (
                                <div key={order.id} className="bg-white border border-gray-100 rounded-[1.5rem] p-5 shadow-sm space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-2xl font-black text-gray-900">{order.tables?.table_name || 'MOSTRADOR'}</span>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Hace {Math.floor((new Date().getTime() - new Date(order.created_at).getTime()) / 60000)} min</p>
                                        </div>
                                        <div className={cn(
                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                            order.status === 'pending' ? "bg-orange-500 text-white" : "bg-green-100 text-green-700"
                                        )}>
                                            {order.status === 'pending' ? 'ESPERANDO' : order.status === 'preparing' ? 'COCINANDO' : 'LISTO'}
                                        </div>
                                    </div>
                                    <div className="text-sm font-medium text-gray-500">
                                        {order.order_items.map((i: any) => `${i.quantity}x ${i.products?.name}`).join(', ')}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Barra de Carrito Flotante */}
            {cart.length > 0 && view === 'order' && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent z-50">
                    <div className="max-w-2xl mx-auto bg-primary text-white p-5 rounded-[2rem] shadow-2xl flex items-center justify-between animate-in slide-in-from-bottom-5 duration-300">
                        <div className="ml-2">
                            <span className="text-[10px] font-black text-white/60 uppercase tracking-widest block mb-1">Añadiendo a la cuenta</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black">${cart.reduce((a, b) => a + (b.price * b.quantity), 0).toLocaleString()}</span>
                                <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">{cart.reduce((a, b) => a + b.quantity, 0)} platos</span>
                            </div>
                        </div>
                        <Button
                            onClick={submitOrder}
                            disabled={submitting}
                            className="h-14 px-8 rounded-2xl bg-white text-primary hover:bg-gray-50 font-black text-lg gap-3 shadow-lg active:scale-95 transition-all"
                        >
                            {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Flame className="w-6 h-6 font-primary text-primary" />}
                            ENVIAR PEDIDO
                        </Button>
                    </div>
                </div>
            )}

            {/* MODAL DE CUENTA (FACTURA) */}
            {showBill && currentTableOrder && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md">
                    <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 bg-primary text-white text-center">
                            <Receipt className="w-12 h-12 mx-auto mb-3 opacity-80" />
                            <h3 className="text-2xl font-black uppercase tracking-tight">Cuenta Total</h3>
                            <p className="text-white/60 font-bold uppercase text-[10px] tracking-[0.2em]">{selectedTable?.table_name}</p>
                        </div>
                        <div className="p-8 space-y-4 max-h-[50vh] overflow-y-auto custom-scrollbar">
                            {currentTableOrder.order_items.map((item: any, i: number) => (
                                <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-black text-primary text-xs">{item.quantity}x</span>
                                            <span className="font-bold text-gray-800 text-sm">{item.products?.name}</span>
                                        </div>
                                        {item.customizations?.notes && (
                                            <p className="text-[10px] text-gray-400 italic ml-6">{item.customizations.notes}</p>
                                        )}
                                    </div>
                                    <span className="font-mono font-bold text-gray-400 text-sm">${(item.unit_price * item.quantity).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                        <div className="p-8 bg-gray-50 space-y-6">
                            <div className="flex justify-between items-end">
                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total a Pagar</span>
                                <span className="text-4xl font-black text-primary leading-none">${currentTableOrder.total.toLocaleString()}</span>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                <Button
                                    className="h-16 rounded-2xl bg-primary text-white font-black text-lg gap-3 shadow-xl hover:bg-primary/90"
                                    onClick={async () => {
                                        try {
                                            await supabase
                                                .from('orders')
                                                .update({ status: 'payment_pending' })
                                                .eq('id', currentTableOrder.id)

                                            // Actualizar mesa a 'cleaning' o mantener ocupada pero marcar visualmente?
                                            // Por ahora mantenemos ocupada hasta que cajero libere o mesero limpie

                                            setShowBill(false)
                                            setView('tables')
                                            setSelectedTable(null)
                                            setCurrentTableOrder(null)
                                            alert("¡Cuenta solicitada a caja! 💰")
                                            fetchTables() // Refrescar estado si cambiara algo visual
                                        } catch (e) {
                                            alert("Error al solicitar cuenta")
                                        }
                                    }}
                                >
                                    <Receipt className="w-6 h-6" /> SOLICITAR CUENTA A CAJA
                                </Button>

                                <Button
                                    variant="secondary"
                                    className="h-14 rounded-2xl font-bold bg-white border border-gray-200"
                                    onClick={() => {
                                        window.print();
                                    }}
                                >
                                    IMPRIMIR PRE-CUENTA
                                </Button>

                                <Button
                                    variant="ghost"
                                    className="font-bold text-gray-400"
                                    onClick={() => setShowBill(false)}
                                >
                                    VOLVER
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* 🔄 MODAL CAMBIO DE MESA */}
            {showTransferModal === 'table' && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-md">
                    <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-8 space-y-8 animate-in zoom-in-95">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <RefreshCw className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-black uppercase italic">Cambio de Mesa</h3>
                            <p className="text-gray-500 text-sm italic">Transfiere toda la cuenta de la {selectedTable?.table_name} a otra</p>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Selecciona Mesa Destino</label>
                            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-2">
                                {tables.filter(t => t.id !== selectedTable?.id).map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setTransferTargetTableId(t.id)}
                                        className={cn(
                                            "h-12 rounded-xl border text-sm font-black transition-all",
                                            transferTargetTableId === t.id ? "bg-primary border-primary text-white" : "bg-gray-50 border-gray-100 text-gray-400",
                                            t.status === 'occupied' && "opacity-50 ring-2 ring-orange-200"
                                        )}
                                    >
                                        {t.table_number}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="ghost" onClick={() => setShowTransferModal(null)} className="flex-1 rounded-2xl font-bold h-14">CANCELAR</Button>
                            <Button
                                disabled={!transferTargetTableId || isTransferring}
                                onClick={handleTransferTable}
                                className="flex-[2] rounded-2xl bg-primary text-white font-black italic h-14 gap-2"
                            >
                                {isTransferring ? <Loader2 className="w-5 h-5 animate-spin" /> : "CONFIRMAR CAMBIO"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* 🥗 MODAL MOVER PRODUCTO */}
            {showTransferModal === 'product' && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-md">
                    <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-8 space-y-8 animate-in zoom-in-95">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MoveHorizontal className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-black uppercase italic">Mover Producto</h3>
                            <p className="text-gray-500 text-sm italic">Pasa un ítem a otra cuenta</p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">1. ¿Qué producto mover?</label>
                                <div className="space-y-1">
                                    {currentTableOrder?.order_items.map((item: any) => (
                                        <button
                                            key={item.id}
                                            onClick={() => setTransferProductItemId(item.id)}
                                            className={cn(
                                                "w-full px-4 py-3 rounded-xl border flex justify-between text-left transition-all",
                                                transferProductItemId === item.id ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-bold" : "border-gray-100 text-gray-400"
                                            )}
                                        >
                                            <span className="text-xs">{item.quantity}x {item.products.name}</span>
                                            <span className="font-mono text-[10px]">${(item.unit_price * item.quantity).toLocaleString()}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">2. Mesa Destino</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {tables.filter(t => t.id !== selectedTable?.id).map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => setTransferTargetTableId(t.id)}
                                            className={cn(
                                                "h-12 rounded-xl border text-sm font-black transition-all",
                                                transferTargetTableId === t.id ? "bg-emerald-500 border-emerald-500 text-white" : "bg-gray-50 border-gray-100 text-gray-400"
                                            )}
                                        >
                                            {t.table_number}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="ghost" onClick={() => setShowTransferModal(null)} className="flex-1 rounded-2xl font-bold h-14">CANCELAR</Button>
                            <Button
                                disabled={!transferProductItemId || !transferTargetTableId || isTransferring}
                                onClick={handleTransferProduct}
                                className="flex-[2] rounded-2xl bg-emerald-500 text-white font-black italic h-14 gap-2"
                            >
                                {isTransferring ? <Loader2 className="w-5 h-5 animate-spin" /> : "MOVER PRODUCTO"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

