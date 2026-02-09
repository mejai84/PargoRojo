/**
 * COMPONENTE DE VENTA OPTIMIZADO - PARGO ROJO POS (ELITE EDITION)
 * 
 * Implementa el flujo de venta crítico con estética Jamali OS:
 * - Validación de stock preventiva
 * - Transacciones atómicas
 * - Estética Industrial / Premium
 * - UX optimizada para velocidad táctil
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
    ShoppingCart,
    Plus,
    Minus,
    Trash2,
    DollarSign,
    CreditCard,
    Loader2,
    AlertTriangle,
    CheckCircle2,
    X,
    Sparkles,
    Flame,
    Zap,
    Box,
    Signal,
    ChevronRight,
    Activity,
    Layers,
    ArrowRight
} from 'lucide-react'
import {
    completeSaleAtomic,
    validateProductStock,
    validateCashboxOpen,
    type SaleItem,
    type CompleteSaleData
} from '@/actions/sales-optimized'
import { cn } from '@/lib/utils'
import { toast } from "sonner"

// ============================================================================
// TIPOS
// ============================================================================

interface Product {
    id: string;
    name: string;
    price: number;
    image_url?: string;
    stock_quantity: number;
    track_inventory: boolean;
}

interface CartItem extends SaleItem {
    product_name: string;
    available_stock?: number;
}

interface OptimizedSaleProps {
    restaurantId: string;
    userId: string;
    cashboxSessionId: string;
    products: Product[];
    onSaleCompleted?: (orderId: string) => void;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function OptimizedSale({
    restaurantId,
    userId,
    cashboxSessionId,
    products,
    onSaleCompleted
}: OptimizedSaleProps) {

    const [cart, setCart] = useState<CartItem[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash')

    // ========================================================================
    // CÁLCULOS
    // ========================================================================

    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0)
    const tax = 0 // Configurable según negocio
    const total = subtotal + tax

    // ========================================================================
    // AGREGAR PRODUCTO AL CARRITO (con validación preventiva)
    // ========================================================================

    const addToCart = useCallback(async (product: Product, quantity: number = 1) => {
        setError(null)

        // Buscar si ya está en el carrito
        const existingItem = cart.find(item => item.product_id === product.id)
        const currentQuantity = existingItem ? existingItem.quantity : 0
        const newQuantity = currentQuantity + quantity

        // ✅ VALIDACIÓN PREVENTIVA DE STOCK
        const stockValidation = await validateProductStock(
            product.id,
            newQuantity,
            restaurantId
        )

        if (!stockValidation.available) {
            toast.error(`${product.name}: ${stockValidation.reason}. Disponible: ${stockValidation.stock_available || 0}`)
            return false
        }

        // Agregar o actualizar en carrito
        if (existingItem) {
            setCart(cart.map(item =>
                item.product_id === product.id
                    ? {
                        ...item,
                        quantity: newQuantity,
                        subtotal: newQuantity * item.unit_price,
                        available_stock: stockValidation.stock_available
                    }
                    : item
            ))
        } else {
            setCart([...cart, {
                product_id: product.id,
                product_name: product.name,
                quantity: quantity,
                unit_price: product.price,
                subtotal: quantity * product.price,
                available_stock: stockValidation.stock_available
            }])
        }

        toast.success(`${product.name} añadido al flujo`, { duration: 1000 })
        return true
    }, [cart, restaurantId])

    const updateQuantity = useCallback(async (productId: string, delta: number) => {
        const item = cart.find(i => i.product_id === productId)
        if (!item) return

        const newQuantity = item.quantity + delta

        if (newQuantity <= 0) {
            removeFromCart(productId)
            return
        }

        const validation = await validateProductStock(productId, newQuantity, restaurantId)

        if (!validation.available) {
            toast.error(`Stock insuficiente. Disponible: ${validation.stock_available}`)
            return
        }

        setCart(cart.map(i =>
            i.product_id === productId
                ? {
                    ...i,
                    quantity: newQuantity,
                    subtotal: newQuantity * i.unit_price,
                    available_stock: validation.stock_available
                }
                : i
        ))
    }, [cart, restaurantId])

    const removeFromCart = useCallback((productId: string) => {
        setCart(cart.filter(item => item.product_id !== productId))
    }, [cart])

    const processSale = useCallback(async () => {
        if (cart.length === 0) {
            toast.error("El carrito está vacío")
            return
        }

        setLoading(true)
        setError(null)

        try {
            const cashboxOpen = await validateCashboxOpen(cashboxSessionId)
            if (!cashboxOpen) {
                throw new Error('La caja está cerrada. No se puede procesar la venta.')
            }

            const saleData: CompleteSaleData = {
                restaurant_id: restaurantId,
                user_id: userId,
                cashbox_session_id: cashboxSessionId,
                items: cart.map(({ product_id, quantity, unit_price, subtotal }) => ({
                    product_id, quantity, unit_price, subtotal
                })),
                payment_method: paymentMethod,
                subtotal, tax, total
            }

            const result = await completeSaleAtomic(saleData)

            if (result.success) {
                setSuccess(true)
                setCart([])
                toast.success("TRANSACCIÓN ELITE COMPLETADA")

                if (onSaleCompleted && result.data?.order_id) {
                    onSaleCompleted(result.data.order_id)
                }

                setTimeout(() => setSuccess(false), 3000)
            }

        } catch (err: any) {
            console.error('Error procesando venta:', err)
            setError(err.message || 'Error al procesar la venta')
            toast.error(err.message || "Error en procesador atómico")
        } finally {
            setLoading(false)
        }
    }, [cart, cashboxSessionId, restaurantId, userId, paymentMethod, subtotal, tax, total, onSaleCompleted])

    return (
        <div className="flex flex-col xl:flex-row gap-12 h-full animate-in fade-in duration-700">

            {/* 🍱 PANEL DE PRODUCTOS MASTER */}
            <div className="flex-1 space-y-8">
                <div className="flex items-center justify-between border-b-4 border-border/20 pb-6">
                    <div className="space-y-2">
                        <h2 className="text-4xl font-black italic uppercase tracking-tighter text-foreground">
                            MATRIZ <span className="text-primary italic">PRODUCTOS</span>
                        </h2>
                        <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.4em] italic flex items-center gap-3">
                            <Activity className="w-4 h-4 text-primary" /> VALIDACIÓN DE STOCK_SYNC ACTIVA
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                    {products.map(product => (
                        <button
                            key={product.id}
                            onClick={() => addToCart(product)}
                            disabled={loading}
                            className={cn(
                                "group relative bg-card/40 backdrop-blur-md rounded-[2.5rem] p-6 text-left border-4 border-border/40 hover:border-primary/40 transition-all duration-500 shadow-xl hover:shadow-primary/5 active:scale-95",
                                "disabled:opacity-50 disabled:cursor-not-allowed"
                            )}
                        >
                            {product.image_url ? (
                                <div className="aspect-square w-full rounded-2xl overflow-hidden mb-5 border-2 border-border/20 group-hover:border-primary/20 transition-all">
                                    <img
                                        src={product.image_url}
                                        alt={product.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                                    />
                                </div>
                            ) : (
                                <div className="aspect-square w-full rounded-2xl bg-muted/40 flex flex-col items-center justify-center mb-5 border-2 border-border/20 group-hover:border-primary/20 text-muted-foreground/10 group-hover:text-primary/10 transition-all">
                                    <Box className="w-16 h-16" />
                                </div>
                            )}

                            <h3 className="font-black text-base italic uppercase tracking-tighter text-foreground line-clamp-1 mb-3 group-hover:text-primary transition-colors">
                                {product.name}
                            </h3>

                            <div className="flex items-center justify-between pt-4 border-t-2 border-border/20 group-hover:border-primary/10">
                                <span className="text-xl font-black italic tracking-tighter text-primary">
                                    ${product.price.toLocaleString()}
                                </span>

                                {product.track_inventory && (
                                    <div className={cn(
                                        "px-3 py-1.5 rounded-xl border-2 flex items-center gap-2",
                                        product.stock_quantity > 10
                                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                                            : product.stock_quantity > 0
                                                ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                                                : "bg-rose-500/10 border-rose-500/20 text-rose-500"
                                    )}>
                                        <Signal className="w-3 h-3" />
                                        <span className="text-[9px] font-black uppercase tracking-widest italic">{product.stock_quantity}</span>
                                    </div>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* 🛒 PANEL DE CARRITO ELITE */}
            <div className="xl:w-[450px] bg-card/60 backdrop-blur-3xl rounded-[4rem] border-4 border-border/20 p-10 flex flex-col shadow-3xl relative overflow-hidden group/sidebar">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-primary rotate-12 group-hover/sidebar:rotate-0 transition-all duration-1000 pointer-events-none">
                    <ShoppingCart className="w-48 h-48" />
                </div>

                {/* Header */}
                <div className="flex items-center gap-6 mb-12 relative z-10">
                    <div className="w-20 h-20 rounded-[2rem] bg-primary text-black flex items-center justify-center shadow-3xl">
                        <ShoppingCart className="w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-3xl font-black italic uppercase tracking-tighter text-foreground">
                            CHECKOUT <span className="text-primary">HUB</span>
                        </h2>
                        <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.4em] italic leading-none">
                            {cart.length} SKUS EN COLA DE PROCESAMIENTO
                        </p>
                    </div>
                </div>

                {/* Items del carrito */}
                <div className="flex-1 space-y-5 overflow-auto custom-scrollbar mb-10 relative z-10 pr-2">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-8 opacity-20">
                            <Box className="w-24 h-24 text-muted-foreground animate-pulse" />
                            <p className="text-[12px] font-black uppercase tracking-[0.6em] italic text-muted-foreground">COLA_VACÍA_STATUS</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div
                                key={item.product_id}
                                className="flex items-center gap-6 p-6 bg-muted/30 rounded-[2.5rem] border-2 border-border/40 hover:border-primary/20 transition-all group/item"
                            >
                                <div className="flex-1 space-y-2">
                                    <h4 className="font-black text-sm italic uppercase tracking-tighter text-foreground group-hover/item:text-primary transition-colors">
                                        {item.product_name}
                                    </h4>
                                    <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.3em] italic">
                                        ${item.unit_price.toLocaleString()} UNIT_PRICE
                                    </p>
                                </div>

                                <div className="flex items-center bg-card/80 p-1.5 rounded-2xl border-2 border-border/40 shadow-xl">
                                    <button
                                        onClick={() => updateQuantity(item.product_id, -1)}
                                        disabled={loading}
                                        className="w-10 h-10 rounded-xl hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all active:scale-75"
                                    >
                                        <Minus className="w-5 h-5" />
                                    </button>

                                    <span className="w-10 text-center font-black italic text-lg tracking-tighter">
                                        {item.quantity}
                                    </span>

                                    <button
                                        onClick={() => updateQuantity(item.product_id, 1)}
                                        disabled={loading}
                                        className="w-10 h-10 rounded-xl hover:bg-emerald-500 hover:text-white flex items-center justify-center transition-all active:scale-75"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="text-right min-w-[100px]">
                                    <p className="text-xl font-black italic tracking-tighter text-primary">
                                        ${item.subtotal.toLocaleString()}
                                    </p>
                                </div>

                                <button
                                    onClick={() => removeFromCart(item.product_id)}
                                    disabled={loading}
                                    className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center shadow-md active:scale-75"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Método de pago */}
                {cart.length > 0 && (
                    <div className="space-y-6 mb-10 relative z-10">
                        <label className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.5em] ml-6 italic flex items-center gap-3">
                            <Layers className="w-4 h-4" /> SELECCIONAR PROCESADOR_DE_PAGO
                        </label>

                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { id: 'cash', label: 'EFECTIVO', icon: DollarSign },
                                { id: 'card', label: 'TARJETA', icon: CreditCard },
                                { id: 'transfer', label: 'TRANSF.', icon: Zap }
                            ].map((method) => (
                                <button
                                    key={method.id}
                                    onClick={() => setPaymentMethod(method.id as any)}
                                    className={cn(
                                        "flex flex-col items-center gap-3 p-5 rounded-[2rem] border-4 transition-all active:scale-90",
                                        paymentMethod === method.id
                                            ? "bg-primary border-primary text-black shadow-primary/20 shadow-2xl"
                                            : "bg-muted/30 border-border/40 text-muted-foreground/40 hover:border-primary/40"
                                    )}
                                >
                                    <method.icon className={cn("w-7 h-7", paymentMethod === method.id ? "scale-110" : "opacity-40")} />
                                    <span className="text-[9px] font-black uppercase tracking-widest italic">{method.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Totales */}
                <div className="space-y-4 py-8 border-t-4 border-border/20 relative z-10">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.4em] italic text-muted-foreground/40 ml-4 pr-4">
                        <span>SUBTOTAL_BASE</span>
                        <span className="text-base text-foreground tracking-tighter">${subtotal.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center p-8 bg-foreground rounded-[2.5rem] text-background shadow-3xl group/total active:scale-95 transition-all">
                        <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-[0.6em] text-background/30 italic">TOTAL_TRANSACCIÓN</p>
                            <h3 className="text-4xl font-black italic tracking-tighter text-primary drop-shadow-[0_0_15px_rgba(255,77,0,0.6)]">
                                ${total.toLocaleString()}
                            </h3>
                        </div>
                        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 group-hover/total:rotate-6 transition-transform">
                            <Flame className="w-8 h-8 text-primary" />
                        </div>
                    </div>
                </div>

                {/* Alertas */}
                {error && (
                    <div className="flex items-start gap-4 p-6 bg-rose-500/10 border-4 border-rose-500/20 rounded-[2.5rem] mb-6 animate-in slide-in-from-bottom-4 duration-500">
                        <AlertTriangle className="w-8 h-8 text-rose-500 flex-shrink-0 mt-1" />
                        <div className="space-y-1 flex-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 italic">GATEWAY_ERROR_EXCEPTION</p>
                            <p className="text-sm font-black italic tracking-tight text-foreground/80 leading-tight uppercase">{error}</p>
                        </div>
                        <button onClick={() => setError(null)} className="p-2 hover:bg-rose-500/20 rounded-xl transition-all">
                            <X className="w-5 h-5 text-rose-500" />
                        </button>
                    </div>
                )}

                {/* Botón de procesar venta */}
                <Button
                    onClick={processSale}
                    disabled={loading || cart.length === 0}
                    className="w-full h-24 bg-primary text-black hover:bg-primary/90 hover:scale-[1.02] active:scale-95 transition-all rounded-[2.5rem] shadow-5xl shadow-primary/20 border-none group relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                    <div className="flex items-center justify-center gap-6 relative z-10 px-6">
                        {loading ? (
                            <>
                                <Loader2 className="w-10 h-10 animate-spin" />
                                <span className="text-2xl font-black italic uppercase tracking-tighter">PROCESANDO_ATOMIC...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-10 h-10 group-hover:rotate-12 transition-transform" />
                                <span className="text-3xl font-black italic uppercase tracking-tighter">FINALIZAR VENTA_PRO</span>
                                <ArrowRight className="w-10 h-10 group-hover:translate-x-3 transition-transform" />
                            </>
                        )}
                    </div>
                </Button>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,102,0,0.1); border-radius: 20px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,102,0,0.3); }
            `}</style>
        </div>
    )
}
