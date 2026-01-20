
"use client"

import { useState } from "react"
import { useCart } from "@/components/store/cart-context"
import { Button } from "@/components/ui/button"
import { type Product } from "@/lib/data"
import { Minus, Plus, ShoppingBag } from "lucide-react"

export function AddToCartButton({ product }: { product: Product }) {
    const [quantity, setQuantity] = useState(1)
    const { addItem } = useCart()

    const handleAdd = () => {
        // Por ahora simulamos añadir N veces, en el futuro el addItem podría aceptar cantidad
        for (let i = 0; i < quantity; i++) {
            addItem(product)
        }
    }

    return (
        <div className="flex flex-col sm:flex-row gap-4">
            {/* Quantity Selector */}
            <div className="flex items-center gap-4 bg-white/5 rounded-full p-2 border border-white/10 w-fit">
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full w-10 h-10 hover:bg-white/10"
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                >
                    <Minus className="w-4 h-4" />
                </Button>
                <span className="text-xl font-bold w-12 text-center">{quantity}</span>
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full w-10 h-10 hover:bg-white/10"
                    onClick={() => setQuantity(q => q + 1)}
                >
                    <Plus className="w-4 h-4" />
                </Button>
            </div>

            {/* Main CTA */}
            <Button
                onClick={handleAdd}
                size="lg"
                className="flex-1 h-14 rounded-full text-lg font-bold shadow-xl shadow-primary/20"
            >
                <ShoppingBag className="mr-2 w-5 h-5" />
                Añadir al Pedido - {(product.price * quantity).toFixed(2)}€
            </Button>
        </div>
    )
}
