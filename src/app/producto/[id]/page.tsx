
import { Navbar } from "@/components/store/navbar"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { ArrowLeft, Minus, Plus, Info } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { AddToCartButton } from "@/components/store/add-to-cart-button"
import { supabase } from "@/lib/supabase/client"

// Ya no generamos estáticos por defecto para que se actualice al instante (SSR)
export const revalidate = 0; // Desactivar caché para ver cambios inmediatos en desarrollo

async function getProduct(id: string) {
    const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()

    if (error || !product) return null
    return product
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const product = await getProduct(resolvedParams.id)

    if (!product) {
        // Fallback temporal si intentas acceder con IDs antiguos (pozu, gourmet...) que no están en la DB
        // Esto es solo para que no rompa si usas URLs viejas mientras migras
        const { products: mockProducts } = await import("@/lib/data")
        const mockProduct = mockProducts.find(p => p.id === resolvedParams.id)
        if (mockProduct) {
            // Adaptar mock a la estructura DB
            return <ProductView product={{ ...mockProduct, is_available: true, category_id: mockProduct.category_id, image_url: mockProduct.image }} />
        }
        notFound()
    }

    return <ProductView product={product} />
}

function ProductView({ product }: { product: any }) {
    // Datos mock adicionales para simular la vista tipo McDonalds (estos no los tenemos en DB aun)
    const nutritionalInfo = {
        calories: "540 kcal",
        protein: "32g",
        fat: "28g",
        carbs: "45g"
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <div className="pt-24 pb-20 container mx-auto px-6">
                {/* Back Button */}
                <Link href="/menu" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
                    <ArrowLeft className="w-4 h-4" />
                    Volver al menú
                </Link>

                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Imagen Principal */}
                    <div className="relative aspect-square w-full max-w-[600px] mx-auto bg-card/30 rounded-3xl p-8 border border-white/5 flex items-center justify-center group">
                        {/* Círculo decorativo de fondo */}
                        <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl scale-75 group-hover:scale-90 transition-transform duration-700" />

                        <div className="relative w-full h-full animate-in zoom-in duration-500">
                            <Image
                                src={product.image_url || product.image || "/images/placeholder.png"}
                                alt={product.name}
                                fill
                                className="object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                                priority
                            />
                        </div>
                    </div>

                    {/* Detalles del Producto */}
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{product.name}</h1>
                            <div className="text-3xl font-bold text-primary">{product.price.toFixed(2)}€</div>
                            <p className="text-xl text-muted-foreground leading-relaxed">
                                {product.description || "Deliciosa combinación de ingredientes frescos y carne de primera calidad."}
                            </p>
                        </div>

                        {/* Ingredientes REALES de la DB */}
                        {product.ingredients && product.ingredients.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="font-bold flex items-center gap-2">
                                    <Info className="w-4 h-4 text-primary" />
                                    Ingredientes principales
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {product.ingredients.map((ing: string, i: number) => (
                                        <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-sm">
                                            {ing}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Info Nutricional Mock */}
                        <div className="grid grid-cols-4 gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 text-center">
                            <div>
                                <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Calorías</div>
                                <div className="font-bold">{nutritionalInfo.calories}</div>
                            </div>
                            <div>
                                <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Proteína</div>
                                <div className="font-bold">{nutritionalInfo.protein}</div>
                            </div>
                            <div>
                                <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Grasas</div>
                                <div className="font-bold">{nutritionalInfo.fat}</div>
                            </div>
                            <div>
                                <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Carb.</div>
                                <div className="font-bold">{nutritionalInfo.carbs}</div>
                            </div>
                        </div>

                        {/* Add to Cart */}
                        <div className="pt-6 border-t border-white/10">
                            <AddToCartButton product={product} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
