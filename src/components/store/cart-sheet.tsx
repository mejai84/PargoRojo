
"use client"

import { useCart } from "./cart-context"
import { Button } from "@/components/ui/button"
import { X, Plus, Minus, ShoppingBag } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function CartSheet() {
    const { items, removeItem, updateQuantity, cartTotal, isCartOpen, toggleCart } = useCart()

    if (!isCartOpen) return null

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
                onClick={toggleCart}
            />

            {/* Panel */}
            <div className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-card border-l border-white/10 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-primary" />
                        Tu Pedido
                    </h2>
                    <Button variant="ghost" size="icon" onClick={toggleCart}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                                <ShoppingBag className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground text-lg">Tu carrito está vacío</p>
                            <Button onClick={toggleCart} variant="outline">
                                Volver a la carta
                            </Button>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.uniqueId} className="flex gap-4">
                                <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
                                    <Image
                                        src={item.image || "/images/placeholder.png"}
                                        alt={item.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div className="flex-1 flex flex-col justify-between">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-semibold">{item.name}</h3>
                                        <span className="font-bold text-primary">
                                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(item.price * item.quantity)}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3 mt-2">
                                        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
                                            <button
                                                className="w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded"
                                                onClick={() => updateQuantity(item.uniqueId, item.quantity - 1)}
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="w-8 text-center text-sm font-medium">
                                                {item.quantity}
                                            </span>
                                            <button
                                                className="w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded"
                                                onClick={() => updateQuantity(item.uniqueId, item.quantity + 1)}
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => removeItem(item.uniqueId)}
                                            className="text-xs text-muted-foreground hover:text-destructive underline"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {items.length > 0 && (
                    <div className="p-6 border-t border-white/10 bg-white/5 space-y-4">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-muted-foreground">
                                <span>Subtotal</span>
                                <span>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(cartTotal)}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                                <span>Envío estimado</span>
                                <span>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(5000)}</span>
                            </div>
                            <div className="flex justify-between text-xl font-bold pt-2 border-t border-white/10">
                                <span>Total</span>
                                <span>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(cartTotal + 5000)}</span>
                            </div>
                        </div>
                        <Link href="/checkout" onClick={toggleCart}>
                            <Button className="w-full h-12 text-lg font-bold">
                                Tramitar Pedido
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </>
    )
}
