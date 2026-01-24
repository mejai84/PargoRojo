
"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useCart } from "@/components/store/cart-context"
import type { Product } from "@/lib/data"

export function ProductCard({ product, showImages = true }: { product: Product, showImages?: boolean }) {
    const { addItem } = useCart()

    return (
        <div className={`group relative bg-white border border-gray-100 rounded-3xl p-4 hover:border-primary/30 hover:shadow-xl transition-all duration-300 flex flex-col h-full card-shadow hover-lift ${!showImages ? 'justify-between' : ''}`}>
            {showImages && (
                <Link href={`/producto/${product.id}`} className="block relative aspect-square mb-6 overflow-hidden rounded-2xl bg-gray-50 cursor-pointer">
                    <Image
                        src={product.image || "/images/placeholder.png"}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {product.badge && (
                        <span className="absolute top-3 left-3 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                            {product.badge}
                        </span>
                    )}
                </Link>
            )}

            <div className={`flex flex-col gap-3 px-2 flex-1 ${!showImages ? 'pt-2' : ''}`}>
                <Link href={`/producto/${product.id}`} className="block flex-1">
                    <div className="flex justify-between items-start gap-4">
                        <h3 className={`font-bold text-gray-900 group-hover:text-primary transition-colors ${showImages ? 'text-xl' : 'text-lg'}`}>
                            {product.name}
                        </h3>
                        <span className={`font-bold text-primary shrink-0 ${showImages ? 'text-lg' : 'text-base'}`}>
                            ${product.price.toLocaleString('es-CO')}
                        </span>
                    </div>
                    {product.badge && !showImages && (
                        <span className="inline-block bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full mt-1 mb-1">
                            {product.badge}
                        </span>
                    )}
                    <p className="text-sm text-gray-500 line-clamp-2 mt-2">
                        {product.ingredients?.join(", ") || product.description}
                    </p>
                </Link>

                <Button
                    className="w-full mt-4 group-hover:bg-primary group-hover:text-white transition-all bg-gray-50 text-gray-900 border border-gray-200 hover:border-primary z-20 relative rounded-xl font-bold"
                    onClick={(e) => {
                        e.preventDefault();
                        addItem(product);
                    }}
                >
                    Añadir al carrito
                </Button>
            </div>
        </div>
    )
}
