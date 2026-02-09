
"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useCart } from "@/components/store/cart-context"
import { cn } from "@/lib/utils"
import type { Product } from "@/lib/data"

export function ProductCard({ product, showImages = true }: { product: Product, showImages?: boolean }) {
    const { addItem } = useCart()

    if (!showImages) {
        return (
            <div className="group relative bg-white border border-gray-100 rounded-2xl hover:border-primary/40 hover:shadow-lg transition-all duration-300 p-4 card-shadow flex flex-col gap-2">
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                        <h3 className="font-black italic uppercase tracking-tighter text-gray-900 group-hover:text-primary transition-colors text-sm line-clamp-1">
                            {product.name}
                        </h3>
                        <p className="text-gray-400 font-medium italic text-[10px] line-clamp-1 mt-0.5">
                            {product.ingredients?.join(", ") || product.description}
                        </p>
                    </div>
                    <span className="font-black italic text-primary shrink-0 text-sm">
                        ${product.price.toLocaleString('es-CO')}
                    </span>
                </div>

                <Button
                    className="w-full h-9 bg-slate-50 hover:bg-primary hover:text-black text-slate-900 border border-slate-100 hover:border-primary rounded-xl font-black italic uppercase tracking-widest text-[9px] mt-1 transition-all"
                    onClick={() => addItem(product)}
                >
                    Añadir al carrito
                </Button>
            </div>
        )
    }

    return (
        <div className="group relative bg-white border border-gray-100 rounded-[2.5rem] hover:border-primary/30 hover:shadow-2xl transition-all duration-500 flex flex-col h-full card-shadow hover-lift p-5">
            <Link href={`/producto/${product.id}`} className="block relative aspect-square mb-6 overflow-hidden rounded-[2rem] bg-gray-50 cursor-pointer">
                <img
                    src={product.image || "/images/placeholder.png"}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/placeholder.png";
                        (e.target as HTMLImageElement).className = "w-full h-full object-contain opacity-20 p-12";
                    }}
                />
                {product.badge && (
                    <span className="absolute top-4 left-4 bg-primary text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-xl">
                        {product.badge}
                    </span>
                )}
            </Link>

            <div className="flex flex-col flex-1 gap-4">
                <Link href={`/producto/${product.id}`} className="block flex-1">
                    <div className="flex justify-between items-start gap-4">
                        <h3 className="font-black italic uppercase tracking-tighter text-gray-900 group-hover:text-primary transition-colors text-2xl leading-none">
                            {product.name}
                        </h3>
                        <div className="text-right shrink-0">
                            <span className="font-black italic text-primary text-xl block leading-none">
                                ${product.price.toLocaleString('es-CO')}
                            </span>
                        </div>
                    </div>
                    <p className="text-gray-500 font-medium italic mt-3 text-sm line-clamp-2 leading-relaxed">
                        {product.ingredients?.join(", ") || product.description}
                    </p>
                </Link>

                <Button
                    className="w-full h-14 bg-slate-950 text-white hover:bg-primary hover:text-black transition-all rounded-[1.2rem] font-black italic uppercase tracking-widest text-xs mt-auto flex items-center justify-center gap-2 group/btn"
                    onClick={(e) => {
                        e.preventDefault();
                        addItem(product);
                    }}
                >
                    <span>Añadir al carrito</span>
                    <span className="text-lg translate-y-[1px] group-hover/btn:translate-x-1 transition-transform">➕</span>
                </Button>
            </div>
        </div>
    )
}
