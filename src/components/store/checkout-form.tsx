
"use client"

import { useState } from "react"
import { useCart } from "./cart-context"
import { Button } from "@/components/ui/button"
import { Loader2, CreditCard, Banknote } from "lucide-react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"

export function CheckoutForm() {
    const { items, cartTotal, clearCart } = useCart()
    const [loading, setLoading] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'cash'>('stripe')
    const router = useRouter()

    // Form fields
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        address: '',
        city: '',
        phone: ''
    })

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

            // 2. Prepare Order Data
            const deliveryFee = 2.50
            const total = cartTotal + deliveryFee

            const orderData = {
                user_id: user?.id || null,
                guest_info: user ? null : {
                    name: `${formData.firstName} ${formData.lastName}`,
                    phone: formData.phone
                },
                status: 'pending',
                order_type: 'delivery',
                delivery_address: {
                    street: formData.address,
                    city: formData.city,
                    phone: formData.phone
                },
                subtotal: cartTotal,
                delivery_fee: deliveryFee,
                total: total,
                payment_method: paymentMethod,
                payment_status: paymentMethod === 'cash' ? 'pending' : 'paid', // Simulating paid for stripe
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

    return (
        <div className="grid md:grid-cols-2 gap-12">
            {/* Resumen */}
            <div className="space-y-6">
                <h2 className="text-2xl font-bold">Resumen del Pedido</h2>
                <div className="space-y-4 bg-card/50 p-6 rounded-2xl border border-white/5">
                    {items.map(item => (
                        <div key={item.uniqueId} className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <span className="font-bold text-primary">{item.quantity}x</span>
                                <span>{item.name}</span>
                            </div>
                            <span>{(item.price * item.quantity).toFixed(2)}€</span>
                        </div>
                    ))}
                    <div className="border-t border-white/10 pt-4 mt-4 space-y-2">
                        <div className="flex justify-between text-muted-foreground">
                            <span>Subtotal</span>
                            <span>{cartTotal.toFixed(2)}€</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                            <span>Envío</span>
                            <span>2.50€</span>
                        </div>
                        <div className="flex justify-between text-xl font-bold pt-2 border-t border-white/10 text-primary">
                            <span>Total</span>
                            <span>{(cartTotal + 2.50).toFixed(2)}€</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Formulario */}
            <div className="space-y-6">
                <h2 className="text-2xl font-bold">Datos de Entrega</h2>
                <form onSubmit={handleCheckout} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <input name="firstName" onChange={handleInputChange} placeholder="Nombre" className="bg-white/5 border border-white/10 rounded-lg p-3 w-full" required />
                        <input name="lastName" onChange={handleInputChange} placeholder="Apellidos" className="bg-white/5 border border-white/10 rounded-lg p-3 w-full" required />
                    </div>
                    <input name="address" onChange={handleInputChange} placeholder="Dirección completa" className="bg-white/5 border border-white/10 rounded-lg p-3 w-full" required />
                    <div className="grid grid-cols-2 gap-4">
                        <input name="city" onChange={handleInputChange} placeholder="Ciudad" className="bg-white/5 border border-white/10 rounded-lg p-3 w-full" required />
                        <input name="phone" onChange={handleInputChange} placeholder="Teléfono" className="bg-white/5 border border-white/10 rounded-lg p-3 w-full" required />
                    </div>

                    <div className="space-y-3">
                        <label className="font-medium">Método de Pago</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setPaymentMethod('stripe')}
                                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-colors ${paymentMethod === 'stripe' ? 'bg-primary/10 border-primary text-primary' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                            >
                                <CreditCard className="w-6 h-6" />
                                <span className="text-sm font-medium">Tarjeta / Bizum</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaymentMethod('cash')}
                                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-colors ${paymentMethod === 'cash' ? 'bg-primary/10 border-primary text-primary' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                            >
                                <Banknote className="w-6 h-6" />
                                <span className="text-sm font-medium">Efectivo</span>
                            </button>
                        </div>
                    </div>

                    <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" /> : `Pagar ${(cartTotal + 2.50).toFixed(2)}€`}
                    </Button>
                </form>
            </div>
        </div>
    )
}
