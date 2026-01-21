"use client"
export const dynamic = "force-dynamic"


import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Plus, Minus, ChevronRight, Loader2, MapPin } from "lucide-react"
import Image from "next/image"

type Product = {
    id: string
    name: string
    description: string
    price: number
    image_url: string
    category: string
    available: boolean
}

type CartItem = {
    product: Product
    quantity: number
}

function MenuQRContent() {
    const searchParams = useSearchParams()
    const tableCode = searchParams.get('table')

    const [table, setTable] = useState<any>(null)
    const [products, setProducts] = useState<Product[]>([])
    const [cart, setCart] = useState<CartItem[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedCategory, setSelectedCategory] = useState<string>('all')

    useEffect(() => {
        loadData()
    }, [tableCode])

    const loadData = async () => {
        setLoading(true)

        // Load table info
        if (tableCode) {
            const { data: tableData } = await supabase
                .from('tables')
                .select('*')
                .eq('qr_code', tableCode)
                .single()

            setTable(tableData)
        }

        // Load products
        const { data: productsData } = await supabase
            .from('products')
            .select('*')
            .eq('available', true)
            .order('category', { ascending: true })
            .order('name', { ascending: true })

        setProducts(productsData || [])
        setLoading(false)
    }

    const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))]

    const filteredProducts = selectedCategory === 'all'
        ? products
        : products.filter(p => p.category === selectedCategory)

    const addToCart = (product: Product) => {
        const existing = cart.find(item => item.product.id === product.id)
        if (existing) {
            setCart(cart.map(item =>
                item.product.id === product.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ))
        } else {
            setCart([...cart, { product, quantity: 1 }])
        }
    }

    const removeFromCart = (productId: string) => {
        const existing = cart.find(item => item.product.id === productId)
        if (existing && existing.quantity > 1) {
            setCart(cart.map(item =>
                item.product.id === productId
                    ? { ...item, quantity: item.quantity - 1 }
                    : item
            ))
        } else {
            setCart(cart.filter(item => item.product.id !== productId))
        }
    }

    const getCartQuantity = (productId: string) => {
        return cart.find(item => item.product.id === productId)?.quantity || 0
    }

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
    const totalPrice = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)

    const handleOrder = () => {
        // Redirect to checkout with cart and table info
        const cartData = encodeURIComponent(JSON.stringify(cart))
        const tableId = table?.id || ''
        window.location.href = `/checkout?cart=${cartData}&table=${tableId}`
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black text-white pb-24">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-gradient-to-b from-black via-black/95 to-black/80 backdrop-blur-xl border-b border-white/10">
                <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h1 className="text-2xl font-bold">Pargo Rojo</h1>
                            <p className="text-sm text-primary">Gran Rafa</p>
                        </div>
                        {table && (
                            <div className="text-right">
                                <div className="flex items-center gap-2 text-primary">
                                    <MapPin className="w-4 h-4" />
                                    <span className="font-bold">{table.table_name}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">{table.location}</p>
                            </div>
                        )}
                    </div>

                    {/* Categories */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`
                                    px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
                                    ${selectedCategory === cat
                                        ? 'bg-primary text-black'
                                        : 'bg-white/10 text-white hover:bg-white/20'
                                    }
                                `}
                            >
                                {cat === 'all' ? 'Todo' : cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Products Grid */}
            <div className="p-4 space-y-3">
                {filteredProducts.map(product => {
                    const quantity = getCartQuantity(product.id)

                    return (
                        <div
                            key={product.id}
                            className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl overflow-hidden border border-white/10"
                        >
                            <div className="flex gap-4 p-4">
                                {product.image_url && (
                                    <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-white/5">
                                        <Image
                                            src={product.image_url}
                                            alt={product.name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                )}

                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-lg mb-1 line-clamp-1">
                                        {product.name}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                        {product.description}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xl font-bold text-primary">
                                            ${product.price.toLocaleString('es-CO')}
                                        </span>

                                        {quantity === 0 ? (
                                            <Button
                                                onClick={() => addToCart(product)}
                                                size="sm"
                                                className="rounded-full h-9 px-4"
                                            >
                                                <Plus className="w-4 h-4 mr-1" />
                                                Agregar
                                            </Button>
                                        ) : (
                                            <div className="flex items-center gap-2 bg-primary/20 rounded-full p-1">
                                                <button
                                                    onClick={() => removeFromCart(product.id)}
                                                    className="w-8 h-8 rounded-full bg-primary text-black flex items-center justify-center"
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                                <span className="font-bold text-primary w-8 text-center">
                                                    {quantity}
                                                </span>
                                                <button
                                                    onClick={() => addToCart(product)}
                                                    className="w-8 h-8 rounded-full bg-primary text-black flex items-center justify-center"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Floating Cart Button */}
            {totalItems > 0 && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black to-transparent">
                    <Button
                        onClick={handleOrder}
                        className="w-full h-14 text-lg font-bold rounded-2xl bg-primary hover:bg-primary/90 text-black shadow-2xl shadow-primary/50"
                    >
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Ver Pedido ({totalItems}) • ${totalPrice.toLocaleString('es-CO')}
                        <ChevronRight className="w-5 h-5 ml-auto" />
                    </Button>
                </div>
            )}
        </div>
    )
}

export default function MenuQRPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        }>
            <MenuQRContent />
        </Suspense>
    )
}

