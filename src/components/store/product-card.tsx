
"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useCart } from "@/components/store/cart-context"
import type { Product } from "@/lib/data"

export function ProductCard({ product }: { product: Product }) {
    const { addItem } = useCart()

    return (
        <div className="group relative bg-card border border-white/5 rounded-3xl p-4 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 flex flex-col h-full">
            <Link href={`/producto/${product.id}`} className="block relative aspect-square mb-6 overflow-hidden rounded-2xl bg-white/5 cursor-pointer">
                <Image
                    src={product.image || "/images/placeholder.png"}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                {product.badge && (
                    <span className="absolute top-3 left-3 bg-secondary text-secondary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                        {product.badge}
                    </span>
                )}
            </Link>

            <div className="flex flex-col gap-3 px-2 flex-1">
                <Link href={`/producto/${product.id}`} className="block flex-1">
                    <div className="flex justify-between items-start">
                        <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                            {product.name}
                        </h3>
                        <span className="font-bold text-lg">{product.price.toFixed(2)}€</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                        {product.ingredients?.join(", ") || product.description}
                    </p>
                </Link>

                <Button
                    className="w-full mt-4 group-hover:bg-primary group-hover:text-white transition-all bg-card border border-white/10 hover:border-primary z-20 relative"
                    onClick={(e) => {
                        e.preventDefault(); // Evitar navegación si se hace clic en el botón
                        addItem(product);
                    }}
                >
                    Añadir al carrito
                </Button>
            </div>
        </div>
    )
}
