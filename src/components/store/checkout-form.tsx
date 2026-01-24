"use client"

import { useState } from "react"
import { useCart } from "./cart-context"
import { Button } from "@/components/ui/button"
import { Loader2, CreditCard, Banknote } from "lucide-react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { formatPrice } from "@/lib/utils"
import { useEffect } from "react"

export function CheckoutForm() {
    const { items, cartTotal, clearCart } = useCart()
    const [loading, setLoading] = useState(false)
    const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery')
    const [paymentMethod, setPaymentMethod] = useState<string>('nequi_daviplata')
    const router = useRouter()

    // Form fields
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        address: '',
        city: '',
        phone: '',
        pickupTime: ''
    })

    const [profile, setProfile] = useState<any>(null)
    const [pointsToRedeem, setPointsToRedeem] = useState(0)
    const [pointsDiscount, setPointsDiscount] = useState(0)
    const [deliverySettings, setDeliverySettings] = useState<any>(null)
    const [businessInfo, setBusinessInfo] = useState<any>(null)
    const [loadingSettings, setLoadingSettings] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            // Fetch delivery settings & business info
            const [{ data: settings }, { data: bInfo }] = await Promise.all([
                supabase.from('delivery_settings').select('*').single(),
                supabase.from('settings').select('value').eq('key', 'business_info').single()
            ])

            if (settings) setDeliverySettings(settings)
            if (bInfo?.value) setBusinessInfo(bInfo.value)
            setLoadingSettings(false)

            // Fetch user profile
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single()
                setProfile(data)

                // Pre-fill form with profile data if available
                if (data) {
                    setFormData(prev => ({
                        ...prev,
                        firstName: data.full_name?.split(' ')[0] || '',
                        lastName: data.full_name?.split(' ').slice(1).join(' ') || '',
                        phone: data.phone || '',
                        address: data.address || '',
                        city: data.city || ''
                    }))
                }
            }
        }
        fetchData()
    }, [])

    const handleRedeemPoints = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value) || 0
        const maxPoints = profile?.loyalty_points || 0
        const validatedPoints = Math.min(value, maxPoints)
        setPointsToRedeem(validatedPoints)
        setPointsDiscount(validatedPoints * 10) // 1 point = 10 COP
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // 1. Get current user (can be null for guests)
            const { data: { session } } = await supabase.auth.getSession()
            const user = session?.user

            // 2. Prepare Order Data - Calculate delivery fee from backend settings
            const baseDeliveryFee = orderType === 'delivery' && deliverySettings.delivery_fee_enabled
                ? deliverySettings.delivery_fee
                : 0

            // Check free delivery threshold
            const applicableDeliveryFee = deliverySettings.free_delivery_threshold && cartTotal >= deliverySettings.free_delivery_threshold
                ? 0
                : baseDeliveryFee

            const total = Math.max(0, cartTotal + applicableDeliveryFee - pointsDiscount)

            const orderData = {
                user_id: user?.id || null,
                guest_info: user ? null : {
                    name: `${formData.firstName} ${formData.lastName}`,
                    phone: formData.phone
                },
                status: 'pending',
                order_type: orderType,
                delivery_address: orderType === 'delivery' ? {
                    street: formData.address,
                    city: formData.city,
                    phone: formData.phone
                } : null,
                subtotal: cartTotal,
                delivery_fee: applicableDeliveryFee,
                total: total,
                payment_method: paymentMethod,
                payment_status: paymentMethod === 'cash' ? 'pending' : 'paid',
                notes: [
                    pointsToRedeem > 0 ? `Redimidos ${pointsToRedeem} puntos ($${pointsDiscount})` : null,
                    orderType === 'pickup' && formData.pickupTime ? `Hora de recogida: ${formData.pickupTime}` : null
                ].filter(Boolean).join(' | ') || null
            }

            // 3. Insert Order
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert([orderData])
                .select()
                .single()

            if (orderError) throw new Error(orderError.message)

            // 4. Insert Order Items
            const orderItems = items.map(item => {
                // Check if ID is UUID (real product) or string (mock)
                const isRealProduct = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id)

                return {
                    order_id: order.id,
                    product_id: isRealProduct ? item.id : null,
                    quantity: item.quantity,
                    unit_price: item.price,
                    customizations: {
                        name: item.name, // Save name in case product is deleted or null
                        mock_id: !isRealProduct ? item.id : null
                    }
                }
            })

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems)

            if (itemsError) throw new Error(itemsError.message)

            // 5. If points were used, register the transaction
            if (pointsToRedeem > 0 && user) {
                await supabase
                    .from('loyalty_transactions')
                    .insert([{
                        user_id: user.id,
                        order_id: order.id,
                        amount: -pointsToRedeem,
                        transaction_type: 'redemption',
                        description: `Redención de puntos en pedido #${order.id}`
                    }])
            }

            // Success
            clearCart()
            router.push('/checkout/success')

        } catch (error: any) {
            console.error(error)
            alert("Error al procesar el pedido: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    if (items.length === 0) {
        return <div>Tu carrito está vacío.</div>
    }

    if (loadingSettings || !deliverySettings) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    // Verificar si los servicios están activos
    const isDeliveryAvailable = deliverySettings.delivery_active
    const isPickupAvailable = deliverySettings.pickup_active

    // Si el tipo seleccionado no está disponible, cambiar al disponible
    if (orderType === 'delivery' && !isDeliveryAvailable && isPickupAvailable) {
        setOrderType('pickup')
    } else if (orderType === 'pickup' && !isPickupAvailable && isDeliveryAvailable) {
        setOrderType('delivery')
    }

    // Calculate delivery fee based on order type and backend settings
    const deliveryFee = orderType === 'delivery' && deliverySettings.delivery_fee_enabled
        ? deliverySettings.delivery_fee
        : 0

    // Check free delivery threshold
    const isFreeDelivery = deliverySettings.free_delivery_threshold
        && cartTotal >= deliverySettings.free_delivery_threshold

    const finalDeliveryFee = isFreeDelivery ? 0 : deliveryFee
    const finalTotal = Math.max(0, cartTotal + finalDeliveryFee - pointsDiscount)

    return (
        <div className="grid md:grid-cols-2 gap-12">
            {/* Resumen */}
            <div className="space-y-6">
                <h2 className="text-2xl font-bold">Resumen del Pedido</h2>

                {/* ORDER TYPE SELECTOR */}
                <div className="space-y-3 bg-primary/5 p-6 rounded-2xl border border-primary/20">
                    <label className="font-bold text-sm uppercase tracking-wider">Tipo de Pedido</label>

                    {!isDeliveryAvailable && !isPickupAvailable && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                            <p className="text-red-700 font-bold">⚠️ Los pedidos están temporalmente deshabilitados</p>
                            <p className="text-sm text-red-600 mt-1">Por favor intenta más tarde</p>
                        </div>
                    )}

                    {(isDeliveryAvailable || isPickupAvailable) && (
                        <div className={`grid ${isDeliveryAvailable && isPickupAvailable ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                            {isDeliveryAvailable && (
                                <button
                                    type="button"
                                    onClick={() => setOrderType('delivery')}
                                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${orderType === 'delivery'
                                        ? 'bg-primary border-primary text-white shadow-lg scale-105'
                                        : 'bg-white border-gray-200 hover:border-primary/30 hover:bg-primary/5'
                                        }`}
                                >
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                                    </svg>
                                    <span className="text-sm font-bold">Entrega a Domicilio</span>
                                    {deliverySettings.delivery_fee_enabled && !isFreeDelivery ? (
                                        <span className="text-xs opacity-80">+ {formatPrice(deliverySettings.delivery_fee)}</span>
                                    ) : (
                                        <span className="text-xs opacity-80 text-green-500 font-bold">GRATIS</span>
                                    )}
                                </button>
                            )}

                            {isPickupAvailable && (
                                <button
                                    type="button"
                                    onClick={() => setOrderType('pickup')}
                                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${orderType === 'pickup'
                                        ? 'bg-primary border-primary text-white shadow-lg scale-105'
                                        : 'bg-white border-gray-200 hover:border-primary/30 hover:bg-primary/5'
                                        }`}
                                >
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                    <span className="text-sm font-bold">Recoger en Local</span>
                                    <span className="text-xs opacity-80">Sin costo</span>
                                </button>
                            )}
                        </div>
                    )}

                    {isFreeDelivery && orderType === 'delivery' && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                            <p className="text-sm text-green-700 font-bold">
                                🎉 ¡Envío gratis! Tu pedido supera {formatPrice(deliverySettings.free_delivery_threshold)}
                            </p>
                        </div>
                    )}
                </div>

                <div className="space-y-4 bg-card/50 p-6 rounded-2xl border border-white/5">
                    {items.map(item => (
                        <div key={item.uniqueId} className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <span className="font-bold text-primary">{item.quantity}x</span>
                                <span>{item.name}</span>
                            </div>
                            <span>{formatPrice(item.price * item.quantity)}</span>
                        </div>
                    ))}
                    <div className="border-t border-white/10 pt-4 mt-4 space-y-2">
                        <div className="flex justify-between text-muted-foreground">
                            <span>Subtotal</span>
                            <span>{formatPrice(cartTotal)}</span>
                        </div>
                        {orderType === 'delivery' && (
                            <div className={`flex justify-between ${finalDeliveryFee === 0 ? 'text-green-500 font-medium' : 'text-muted-foreground'}`}>
                                <span>Envío {isFreeDelivery ? '(Envío gratis por pedido mínimo)' : ''}</span>
                                <span>{finalDeliveryFee === 0 ? 'GRATIS' : formatPrice(finalDeliveryFee)}</span>
                            </div>
                        )}
                        {orderType === 'pickup' && (
                            <div className="flex justify-between text-green-500 font-medium">
                                <span>Envío (Recoges en local)</span>
                                <span>GRATIS</span>
                            </div>
                        )}
                        {pointsDiscount > 0 && (
                            <div className="flex justify-between text-green-500 font-medium">
                                <span>Descuento Puntos</span>
                                <span>-{formatPrice(pointsDiscount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-xl font-bold pt-2 border-t border-white/10 text-primary">
                            <span>Total</span>
                            <span>{formatPrice(finalTotal)}</span>
                        </div>
                    </div>
                </div>

                {profile && profile.loyalty_points > 0 && (
                    <div className="p-6 rounded-2xl bg-primary/10 border border-primary/20 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="font-bold">Puntos Disponibles:</span>
                                <span className="text-primary font-bold">{profile.loyalty_points}</span>
                            </div>
                            <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">1 pt = $10</span>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">¿Cuántos puntos deseas redimir?</label>
                            <input
                                type="number"
                                value={pointsToRedeem}
                                onChange={handleRedeemPoints}
                                max={profile.loyalty_points}
                                min={0}
                                className="w-full bg-background border border-white/10 rounded-xl p-3 outline-none focus:border-primary"
                                placeholder="Escribe la cantidad..."
                            />
                            {pointsDiscount > 0 && (
                                <p className="text-xs text-green-500 font-bold">¡Ahorrarás {formatPrice(pointsDiscount)}!</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Formulario */}
            <div className="space-y-6">
                <h2 className="text-2xl font-bold">
                    {orderType === 'delivery' ? 'Datos de Entrega' : 'Datos de Contacto'}
                </h2>
                <form onSubmit={handleCheckout} className="space-y-6">
                    {/* DATOS BÁSICOS - Siempre visible */}
                    <div className="grid grid-cols-2 gap-4">
                        <input
                            name="firstName"
                            onChange={handleInputChange}
                            value={formData.firstName}
                            placeholder="Nombre"
                            className="bg-white/5 border border-white/10 rounded-lg p-3 w-full"
                            required
                        />
                        <input
                            name="lastName"
                            onChange={handleInputChange}
                            value={formData.lastName}
                            placeholder="Apellidos"
                            className="bg-white/5 border border-white/10 rounded-lg p-3 w-full"
                            required
                        />
                    </div>

                    <input
                        name="phone"
                        onChange={handleInputChange}
                        value={formData.phone}
                        placeholder="Teléfono de contacto"
                        className="bg-white/5 border border-white/10 rounded-lg p-3 w-full"
                        required
                    />

                    {/* CAMPOS ESPECÍFICOS PARA DELIVERY */}
                    {orderType === 'delivery' && (
                        <>
                            <input
                                name="address"
                                onChange={handleInputChange}
                                value={formData.address}
                                placeholder="Dirección completa"
                                className="bg-white/5 border border-white/10 rounded-lg p-3 w-full"
                                required
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    name="city"
                                    onChange={handleInputChange}
                                    value={formData.city}
                                    placeholder="Ciudad / Barrio"
                                    className="bg-white/5 border border-white/10 rounded-lg p-3 w-full"
                                    required
                                />
                                <div className="text-sm text-muted-foreground flex items-center justify-center bg-primary/5 rounded-lg border border-primary/10">
                                    <span>🚚 Entrega a domicilio</span>
                                </div>
                            </div>
                        </>
                    )}

                    {/* CAMPOS ESPECÍFICOS PARA PICKUP */}
                    {orderType === 'pickup' && (
                        <div className="space-y-4 bg-green-50 p-6 rounded-2xl border border-green-200">
                            <div className="flex items-start gap-3">
                                <svg className="w-6 h-6 text-green-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="flex-1">
                                    <h4 className="font-bold text-green-900 mb-1">¡Perfecto! Recogerás tu pedido en local</h4>
                                    <p className="text-sm text-green-700 leading-relaxed">
                                        📍 <strong>Dirección:</strong> {businessInfo?.address || deliverySettings.restaurant_address || 'Calle Principal #123'}<br />
                                        📞 <strong>Teléfono:</strong> {businessInfo?.phone || deliverySettings.restaurant_phone || '+57 300 123 4567'}<br />
                                        ✉️ <strong>Email:</strong> {businessInfo?.email || 'contacto@pargorojo.com'}<br />
                                        ⏰ <strong>Tiempo estimado:</strong> {deliverySettings.estimated_delivery_time_min}-{deliverySettings.estimated_delivery_time_max} minutos
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-green-900">¿A qué hora pasarías a recoger? (Opcional)</label>
                                <input
                                    type="time"
                                    name="pickupTime"
                                    onChange={handleInputChange}
                                    value={formData.pickupTime}
                                    className="bg-white border border-green-300 rounded-lg p-3 w-full font-bold"
                                />
                                <p className="text-xs text-green-600">
                                    Tu pedido estará listo en aproximadamente {deliverySettings.estimated_delivery_time_min}-{deliverySettings.estimated_delivery_time_max} minutos
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        <label className="font-medium">Método de Pago</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setPaymentMethod('nequi_daviplata' as any)}
                                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-colors ${paymentMethod === ('nequi_daviplata' as any) ? 'bg-primary/10 border-primary text-primary' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                            >
                                <CreditCard className="w-6 h-6" />
                                <span className="text-sm font-medium">Nequi / Daviplata</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaymentMethod('cash')}
                                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-colors ${paymentMethod === 'cash' ? 'bg-primary/10 border-primary text-primary' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                            >
                                <Banknote className="w-6 h-6" />
                                <span className="text-sm font-medium">
                                    {orderType === 'delivery' ? 'Efectivo / Contraentrega' : 'Efectivo en Local'}
                                </span>
                            </button>
                        </div>
                    </div>

                    <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" /> : `Confirmar Pedido - ${formatPrice(finalTotal)}`}
                    </Button>
                </form>
            </div>
        </div>
    )
}
