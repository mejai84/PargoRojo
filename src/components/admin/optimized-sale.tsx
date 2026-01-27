/**
 * COMPONENTE DE VENTA OPTIMIZADO - PARGO ROJO POS
 * 
 * Implementa el flujo de venta crítico con las siguientes optimizaciones:
 * - Validación de stock preventiva
 * - Transacciones atómicas
 * - Manejo robusto de errores
 * - UX optimizada para velocidad
 * 
 * Fecha: 27 de enero de 2026
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
    X
} from 'lucide-react'
import {
    completeSaleAtomic,
    validateProductStock,
    validateCashboxOpen,
    type SaleItem,
    type CompleteSaleData
} from '@/actions/sales-optimized'
import { cn } from '@/lib/utils'

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
            setError(
                `${product.name}: ${stockValidation.reason}. ` +
                `Disponible: ${stockValidation.stock_available || 0}`
            )
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

        return true
    }, [cart, restaurantId])

    // ========================================================================
    // ACTUALIZAR CANTIDAD
    // ========================================================================

    const updateQuantity = useCallback(async (productId: string, delta: number) => {
        const item = cart.find(i => i.product_id === productId)
        if (!item) return

        const newQuantity = item.quantity + delta

        if (newQuantity <= 0) {
            removeFromCart(productId)
            return
        }

        // Validar stock para nueva cantidad
        const validation = await validateProductStock(
            productId,
            newQuantity,
            restaurantId
        )

        if (!validation.available) {
            setError(`Stock insuficiente. Disponible: ${validation.stock_available}`)
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

        setError(null)
    }, [cart, restaurantId])

    // ========================================================================
    // REMOVER DEL CARRITO
    // ========================================================================

    const removeFromCart = useCallback((productId: string) => {
        setCart(cart.filter(item => item.product_id !== productId))
        setError(null)
    }, [cart])

    // ========================================================================
    // PROCESAR VENTA (TRANSACCIÓN ATÓMICA)
    // ========================================================================

    const processSale = useCallback(async () => {
        if (cart.length === 0) {
            setError('El carrito está vacío')
            return
        }

        setLoading(true)
        setError(null)

        try {
            // 1. Verificar que la caja siga abierta
            const cashboxOpen = await validateCashboxOpen(cashboxSessionId)
            if (!cashboxOpen) {
                throw new Error('La caja está cerrada. No se puede procesar la venta.')
            }

            // 2. Preparar datos de la venta
            const saleData: CompleteSaleData = {
                restaurant_id: restaurantId,
                user_id: userId,
                cashbox_session_id: cashboxSessionId,
                items: cart.map(({ product_id, quantity, unit_price, subtotal }) => ({
                    product_id,
                    quantity,
                    unit_price,
                    subtotal
                })),
                payment_method: paymentMethod,
                subtotal,
                tax,
                total
            }

            // 3. ✅ EJECUTAR VENTA ATÓMICA
            const result = await completeSaleAtomic(saleData)

            if (result.success) {
                setSuccess(true)
                setCart([])

                // Llamar callback si existe
                if (onSaleCompleted && result.data?.order_id) {
                    onSaleCompleted(result.data.order_id)
                }

                // Auto-limpiar mensaje de éxito después de 3s
                setTimeout(() => {
                    setSuccess(false)
                }, 3000)
            }

        } catch (err: any) {
            console.error('Error procesando venta:', err)
            setError(err.message || 'Error al procesar la venta')
        } finally {
            setLoading(false)
        }
    }, [cart, cashboxSessionId, restaurantId, userId, paymentMethod, subtotal, tax, total, onSaleCompleted])

    // ========================================================================
    // RENDER
    // ========================================================================

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full">

            {/* PANEL DE PRODUCTOS */}
            <div className="flex-1 space-y-4">
                <h2 className="text-2xl font-black uppercase tracking-tight">
                    Productos
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {products.map(product => (
                        <button
                            key={product.id}
                            onClick={() => addToCart(product)}
                            disabled={loading}
                            className={cn(
                                "group relative bg-white rounded-2xl p-4 text-left",
                                "border-2 border-slate-200 hover:border-primary",
                                "transition-all duration-200",
                                "hover:shadow-lg hover:-translate-y-1",
                                "disabled:opacity-50 disabled:cursor-not-allowed"
                            )}
                        >
                            {product.image_url && (
                                <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="w-full h-32 object-cover rounded-xl mb-3"
                                />
                            )}

                            <h3 className="font-bold text-sm line-clamp-2 mb-2">
                                {product.name}
                            </h3>

                            <div className="flex items-center justify-between">
                                <span className="text-lg font-black text-primary">
                                    ${product.price.toLocaleString()}
                                </span>

                                {product.track_inventory && (
                                    <span className={cn(
                                        "text-xs font-bold px-2 py-1 rounded-full",
                                        product.stock_quantity > 10
                                            ? "bg-green-100 text-green-700"
                                            : product.stock_quantity > 0
                                                ? "bg-amber-100 text-amber-700"
                                                : "bg-red-100 text-red-700"
                                    )}>
                                        Stock: {product.stock_quantity}
                                    </span>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* PANEL DE CARRITO */}
            <div className="lg:w-96 bg-white rounded-2xl border-2 border-slate-200 p-6 flex flex-col">

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-primary/10 rounded-xl">
                        <ShoppingCart className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight">
                            Carrito
                        </h2>
                        <p className="text-sm text-slate-500">
                            {cart.length} {cart.length === 1 ? 'producto' : 'productos'}
                        </p>
                    </div>
                </div>

                {/* Items del carrito */}
                <div className="flex-1 space-y-3 overflow-auto mb-6">
                    {cart.length === 0 ? (
                        <div className="text-center text-slate-400 py-12">
                            <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>Carrito vacío</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div
                                key={item.product_id}
                                className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"
                            >
                                <div className="flex-1">
                                    <h4 className="font-bold text-sm line-clamp-1">
                                        {item.product_name}
                                    </h4>
                                    <p className="text-xs text-slate-500">
                                        ${item.unit_price.toLocaleString()} c/u
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => updateQuantity(item.product_id, -1)}
                                        disabled={loading}
                                        className="p-1 hover:bg-white rounded-lg transition"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>

                                    <span className="w-8 text-center font-bold">
                                        {item.quantity}
                                    </span>

                                    <button
                                        onClick={() => updateQuantity(item.product_id, 1)}
                                        disabled={loading}
                                        className="p-1 hover:bg-white rounded-lg transition"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="text-right">
                                    <p className="font-black text-primary">
                                        ${item.subtotal.toLocaleString()}
                                    </p>
                                </div>

                                <button
                                    onClick={() => removeFromCart(item.product_id)}
                                    disabled={loading}
                                    className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg transition"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Método de pago */}
                {cart.length > 0 && (
                    <div className="space-y-3 mb-6">
                        <label className="text-sm font-bold text-slate-700">
                            Método de Pago
                        </label>

                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => setPaymentMethod('cash')}
                                className={cn(
                                    "p-3 rounded-xl border-2 transition-all",
                                    paymentMethod === 'cash'
                                        ? "border-primary bg-primary/5 text-primary"
                                        : "border-slate-200 hover:border-slate-300"
                                )}
                            >
                                <DollarSign className="w-5 h-5 mx-auto mb-1" />
                                <span className="text-xs font-bold">Efectivo</span>
                            </button>

                            <button
                                onClick={() => setPaymentMethod('card')}
                                className={cn(
                                    "p-3 rounded-xl border-2 transition-all",
                                    paymentMethod === 'card'
                                        ? "border-primary bg-primary/5 text-primary"
                                        : "border-slate-200 hover:border-slate-300"
                                )}
                            >
                                <CreditCard className="w-5 h-5 mx-auto mb-1" />
                                <span className="text-xs font-bold">Tarjeta</span>
                            </button>

                            <button
                                onClick={() => setPaymentMethod('transfer')}
                                className={cn(
                                    "p-3 rounded-xl border-2 transition-all",
                                    paymentMethod === 'transfer'
                                        ? "border-primary bg-primary/5 text-primary"
                                        : "border-slate-200 hover:border-slate-300"
                                )}
                            >
                                <DollarSign className="w-5 h-5 mx-auto mb-1" />
                                <span className="text-xs font-bold">Transfer</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Totales */}
                <div className="space-y-2 py-4 border-t-2 border-slate-200">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Subtotal</span>
                        <span className="font-bold">${subtotal.toLocaleString()}</span>
                    </div>

                    {tax > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Impuestos</span>
                            <span className="font-bold">${tax.toLocaleString()}</span>
                        </div>
                    )}

                    <div className="flex justify-between text-xl pt-2">
                        <span className="font-black uppercase">Total</span>
                        <span className="font-black text-primary">
                            ${total.toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Mensajes */}
                {error && (
                    <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-xl mb-4">
                        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 text-sm text-red-700">{error}</div>
                        <button onClick={() => setError(null)}>
                            <X className="w-4 h-4 text-red-600" />
                        </button>
                    </div>
                )}

                {success && (
                    <div className="flex items-center gap-3 p-4 bg-green-50 border-2 border-green-200 rounded-xl mb-4">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-bold text-green-700">
                            ¡Venta procesada exitosamente!
                        </span>
                    </div>
                )}

                {/* Botón de procesar venta */}
                <Button
                    onClick={processSale}
                    disabled={loading || cart.length === 0}
                    className="w-full h-14 text-lg font-black uppercase"
                    size="lg"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Procesando...
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="w-5 h-5 mr-2" />
                            Procesar Venta
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
