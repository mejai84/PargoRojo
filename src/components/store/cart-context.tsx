
"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import type { Product } from "@/lib/data"

export type CartItem = Product & {
    quantity: number
    uniqueId: string // Para diferenciar items iguales con distintas opciones (futuro)
}

type CartContextType = {
    items: CartItem[]
    addItem: (product: Product) => void
    removeItem: (uniqueId: string) => void
    updateQuantity: (uniqueId: string, quantity: number) => void
    clearCart: () => void
    cartCount: number
    cartTotal: number
    isCartOpen: boolean
    toggleCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([])
    const [isCartOpen, setIsCartOpen] = useState(false)
    const [isMounted, setIsMounted] = useState(false)

    // Persistir en localStorage
    useEffect(() => {
        setIsMounted(true)
        const savedCart = localStorage.getItem("pargo-rojo-cart")
        if (savedCart) {
            try {
                setItems(JSON.parse(savedCart))
            } catch (e) {
                console.error("Error loading cart", e)
            }
        }
    }, [])

    useEffect(() => {
        if (isMounted) {
            localStorage.setItem("pargo-rojo-cart", JSON.stringify(items))
        }
    }, [items, isMounted])

    const addItem = (product: Product) => {
        setItems((prev) => {
            const existing = prev.find((item) => item.id === product.id)
            if (existing) {
                return prev.map((item) =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            }
            return [...prev, { ...product, quantity: 1, uniqueId: crypto.randomUUID() }]
        })
        setIsCartOpen(true)
    }

    const removeItem = (uniqueId: string) => {
        setItems((prev) => prev.filter((item) => item.uniqueId !== uniqueId))
    }

    const updateQuantity = (uniqueId: string, quantity: number) => {
        if (quantity < 1) {
            removeItem(uniqueId)
            return
        }
        setItems((prev) =>
            prev.map((item) =>
                item.uniqueId === uniqueId ? { ...item, quantity } : item
            )
        )
    }

    const clearCart = () => setItems([])

    const toggleCart = () => setIsCartOpen(!isCartOpen)

    const cartCount = items.reduce((acc, item) => acc + item.quantity, 0)
    const cartTotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0)

    return (
        <CartContext.Provider
            value={{
                items,
                addItem,
                removeItem,
                updateQuantity,
                clearCart,
                cartCount,
                cartTotal,
                isCartOpen,
                toggleCart,
            }}
        >
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider")
    }
    return context
}
