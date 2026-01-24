
"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useCart } from "@/components/store/cart-context"
import { cn } from "@/lib/utils"
import type { Product } from "@/lib/data"

export function ProductCard({ product, showImages = true }: { product: Product, showImages?: boolean }) {
    const { addItem } = useCart()

    return (
        <div className={cn(
            "group relative bg-white border border-gray-100 rounded-3xl hover:border-primary/30 hover:shadow-xl transition-all duration-300 flex flex-col h-full card-shadow hover-lift",
            showImages ? "p-4" : "p-3"
        )}>
            {showImages && (
                <Link href={`/producto/${product.id}`} className="block relative aspect-square mb-6 overflow-hidden rounded-2xl bg-gray-50 cursor-pointer">
                    <img
                        src={product.image || "/images/placeholder.png"}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = "/images/placeholder.png";
                            (e.target as HTMLImageElement).className = "w-full h-full object-contain opacity-20 p-8";
                        }}
                    />
                    {product.badge && (
                        <span className="absolute top-3 left-3 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                            {product.badge}
                        </span>
                    )}
                </Link>
            )}

            <div className={cn(
                "flex flex-col gap-3 px-2 flex-1",
                !showImages ? "pt-1" : ""
            )}>
                <Link href={`/producto/${product.id}`} className="block flex-1">
                    <div className="flex justify-between items-start gap-4">
                        <h3 className={cn(
                            "font-black italic uppercase tracking-tighter text-gray-900 group-hover:text-primary transition-colors",
                            showImages ? "text-xl" : "text-sm"
                        )}>
                            {product.name}
                        </h3>
                        <span className={cn(
                            "font-black italic text-primary shrink-0",
                            showImages ? "text-lg" : "text-sm"
                        )}>
                            ${product.price.toLocaleString('es-CO')}
                        </span>
                    </div>
                    {product.badge && !showImages && (
                        <span className="inline-block bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mt-1 mb-1">
                            {product.badge}
                        </span>
                    )}
                    <p className={cn(
                        "text-gray-500 font-medium italic mt-2",
                        showImages ? "text-sm line-clamp-2" : "text-[10px] line-clamp-1"
                    )}>
                        {product.ingredients?.join(", ") || product.description}
                    </p>
                </Link>

                <Button
                    className={cn(
                        "w-full group-hover:bg-primary group-hover:text-black transition-all bg-slate-50 text-slate-900 border border-slate-200 hover:border-primary z-20 relative rounded-xl font-black italic uppercase tracking-widest",
                        showImages ? "mt-4 h-12 text-xs" : "mt-2 h-9 text-[9px]"
                    )}
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
