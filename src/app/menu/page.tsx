"use client"

import { Navbar } from "@/components/store/navbar"
import { ProductCard } from "@/components/store/product-card"
import { supabase } from "@/lib/supabase/client"
import { useEffect, useState, Suspense } from "react"
import { Search, Loader2 } from "lucide-react"
import { useSearchParams } from "next/navigation"

function MenuContent() {
    const searchParams = useSearchParams()
    const [products, setProducts] = useState<any[]>([])
    const [categories, setCategories] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [activeCategory, setActiveCategory] = useState(searchParams.get("category") || "all")

    useEffect(() => {
        const cat = searchParams.get("category")
        if (cat) setActiveCategory(cat)
    }, [searchParams])

    const fetchData = async () => {
        setLoading(true)
        console.log("Iniciando carga de datos...");

        try {
            // Fetch Categories
            const { data: catData, error: catError } = await supabase
                .from('categories')
                .select('*')
                .eq('is_active', true)
                .is('deleted_at', null)
                .order('order_position')

            if (catError) console.error("Error cargando categorías:", catError);
            if (catData && catData.length > 0) {
                setCategories(catData)
            } else {
                const { categories: localCats } = await import("@/lib/data")
                setCategories(localCats)
            }

            // Fetch Products
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .is('deleted_at', null)
                .eq('is_available', true)
                .order('name')

            if (error) console.error("Error cargando productos:", error);

            if (data && data.length > 0) {
                console.log(`${data.length} productos cargados desde Supabase`);
                setProducts(data)
            } else {
                console.warn("No se encontraron productos en Supabase, usando datos locales...");
                const { products: localProducts } = await import("@/lib/data")
                setProducts(localProducts)
            }
        } catch (err) {
            console.error("Error crítico en fetchData:", err);
            const { products: localProducts, categories: localCats } = await import("@/lib/data")
            setProducts(localProducts)
            setCategories(localCats)
        }

        setLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [])

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
        const matchesCategory = activeCategory === "all" || product.category_id === activeCategory
        return matchesSearch && matchesCategory
    })

    return (
        <div className="min-h-screen bg-background pb-20">
            <Navbar />

            <div className="pt-32 container mx-auto px-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">Nuestra <span className="text-gradient">Carta</span></h1>
                        <p className="text-muted-foreground text-lg max-w-xl">
                            Desde los clásicos de la casa hasta nuestras creaciones más especiales.
                            Pescado fresco del día, mariscos seleccionados y el mejor sazón de la costa.
                        </p>
                    </div>

                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar en el menú..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary/50 transition-all text-lg"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Categories Filter - Sticky implementation */}
                <div className="sticky top-20 z-30 bg-background/80 backdrop-blur-md -mx-6 px-6 py-4 border-b border-white/5 mb-8">
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide no-scrollbar">
                        <button
                            onClick={() => setActiveCategory("all")}
                            className={`px-6 py-2.5 rounded-full whitespace-nowrap font-bold transition-all border ${activeCategory === "all"
                                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                : "bg-white/5 text-muted-foreground border-white/5 hover:bg-white/10"
                                }`}
                        >
                            Todos
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`px-6 py-2.5 rounded-full whitespace-nowrap font-bold transition-all border ${activeCategory === cat.id
                                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                    : "bg-white/5 text-muted-foreground border-white/5 hover:bg-white/10"
                                    }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Products Grid */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                        <p className="text-muted-foreground animate-pulse font-medium">Cocinando la carta...</p>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                        <span className="text-6xl">🍔</span>
                        <h3 className="text-2xl font-bold">No encontramos lo que buscas</h3>
                        <p className="text-muted-foreground">Prueba con otro término o categoría.</p>
                        <button
                            onClick={() => { setSearchTerm(""); setActiveCategory("all"); }}
                            className="text-primary font-bold hover:underline"
                        >
                            Ver todo el menú
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-in fade-in duration-500">
                        {filteredProducts.map(product => (
                            <ProductCard
                                key={product.id}
                                product={{
                                    ...product,
                                    image: product.image_url || product.image
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default function MenuPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        }>
            <MenuContent />
        </Suspense>
    )
}
