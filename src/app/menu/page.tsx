"use client"

import { Navbar } from "@/components/store/navbar"
import { ProductCard } from "@/components/store/product-card"
import { supabase } from "@/lib/supabase/client"
import { useEffect, useState, Suspense } from "react"
import { Search, Loader2, ChevronLeft, ArrowRight, Utensils } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Image from "next/image"

// Iconos para cada categoría (Fallback)
const categoryIcons: { [key: string]: string } = {
    "pescados-y-mariscos": "🐟",
    "ricuras-region": "🍲",
    "cortes-gruesos": "🥩",
    "especialidades-brasa": "🔥",
    "cerdo": "🐷",
    "arroces": "🍚",
    "pollos": "🍗",
    "pastas": "🍝",
    "comida-montanera": "🏔️",
    "lasanas": "🧀",
    "comidas-rapidas": "🍔",
    "menu-infantil": "👶",
    "entradas": "🥗",
    "asados": "🔥",
    "desayunos": "☀️",
    "adicionales-bebidas": "🍹",
}

function MenuContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [products, setProducts] = useState<any[]>([])
    const [categories, setCategories] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedCategory, setSelectedCategory] = useState<any | null>(null)
    const [productCounts, setProductCounts] = useState<{ [key: string]: number }>({})
    const [showImages, setShowImages] = useState(false)
    const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({})

    const fetchData = async () => {
        setLoading(true)

        try {
            const { data: settingsData } = await supabase
                .from('settings')
                .select('value')
                .eq('key', 'feature_flags')
                .single()

            if (settingsData?.value && settingsData.value.menu_show_images !== undefined) {
                setShowImages(settingsData.value.menu_show_images)
            } else {
                setShowImages(true) // Forzar imagenes por defecto si no hay flag
            }

            const { data: catData, error: catError } = await supabase
                .from('categories')
                .select('*')
                .eq('is_active', true)
                .order('order_position')

            if (catData) {
                setCategories(catData)
                const counts: { [key: string]: number } = {}
                for (const cat of catData) {
                    const { count } = await supabase
                        .from('products')
                        .select('*', { count: 'exact', head: true })
                        .eq('category_id', cat.id)
                        .eq('is_available', true)
                    counts[cat.id] = count || 0
                }
                setProductCounts(counts)
            }

            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('is_available', true)
                .order('name')

            if (data) setProducts(data)

            const catParam = searchParams.get("category")
            if (catParam && catData) {
                const found = catData.find(c => c.id === catParam || c.slug === catParam)
                if (found) setSelectedCategory(found)
            }

        } catch (err) {
            console.error(err)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [])

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
        const matchesCategory = selectedCategory ? product.category_id === selectedCategory.id : true
        return matchesSearch && matchesCategory
    })

    const handleCategorySelect = (category: any) => {
        setSelectedCategory(category)
        setSearchTerm("")
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleBackToCategories = () => {
        setSelectedCategory(null)
        setSearchTerm("")
    }

    const getIcon = (slug: string) => categoryIcons[slug] || "🍽️"

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    <p className="text-gray-500 animate-pulse font-medium text-lg">Cargando nuestra carta...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Navbar />

            <div className="pt-28 container mx-auto px-6">

                {!selectedCategory ? (
                    <>
                        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-5 duration-500">
                            <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-4">
                                Menú Completo
                            </span>
                            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
                                ¿Qué deseas <span className="text-gradient">comer hoy</span>?
                            </h1>
                            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                                Explora nuestras categorías y descubre los mejores sabores de la cocina de mar.
                            </p>
                        </div>

                        <div className="max-w-xl mx-auto mb-12">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar en todo el menú..."
                                    className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-lg shadow-sm text-gray-900 placeholder-gray-400"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {searchTerm ? (
                            <div className="animate-in fade-in duration-300">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900">Resultados para "{searchTerm}"</h2>
                                    <button onClick={() => setSearchTerm("")} className="text-primary font-bold hover:underline">Limpiar búsqueda</button>
                                </div>
                                {filteredProducts.length === 0 ? (
                                    <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
                                        <span className="text-6xl mb-4 block">🔍</span>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">No encontramos resultados</h3>
                                        <p className="text-gray-500">Intenta con otro término de búsqueda</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {filteredProducts.map(product => (
                                            <ProductCard
                                                key={product.id}
                                                product={{ ...product, image: product.image_url || product.image }}
                                                showImages={showImages}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-5 duration-700">
                                {categories.map((category, index) => {
                                    const hasError = imageErrors[category.id]
                                    return (
                                        <button
                                            key={category.id}
                                            onClick={() => handleCategorySelect(category)}
                                            className="group relative h-48 md:h-64 rounded-[2.5rem] overflow-hidden border border-white shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.03] bg-white"
                                            style={{ animationDelay: `${index * 50}ms` }}
                                        >
                                            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 group-hover:bg-gray-100 transition-colors">
                                                {!hasError ? (
                                                    <Image
                                                        src={`/categories/${category.slug}.png`}
                                                        alt={category.name}
                                                        fill
                                                        className="object-cover p-0 transition-all duration-700 group-hover:scale-110"
                                                        onError={() => setImageErrors(prev => ({ ...prev, [category.id]: true }))}
                                                        priority={index < 8}
                                                    />
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <span className="text-6xl drop-shadow-lg">{getIcon(category.slug)}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Overlay Glassmorphism */}
                                            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-6 md:p-8">
                                                <h3 className="text-xl md:text-2xl font-black text-white leading-tight mb-1 drop-shadow-xl italic uppercase tracking-tighter">
                                                    {category.name}
                                                </h3>
                                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] opacity-90">
                                                    {productCounts[category.id] || 0} PLATILLOS
                                                </p>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="animate-in fade-in slide-in-from-right-5 duration-500">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                            <div className="flex items-center gap-6">
                                <Button
                                    variant="ghost"
                                    onClick={handleBackToCategories}
                                    className="h-14 w-14 rounded-2xl bg-white border border-gray-100 shadow-sm hover:bg-primary hover:text-black transition-all"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </Button>
                                <div>
                                    <div className="flex items-center gap-4">
                                        <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter italic uppercase">
                                            {selectedCategory.name}
                                        </h1>
                                    </div>
                                    <p className="text-gray-500 font-bold uppercase text-xs tracking-widest mt-2 px-1">
                                        {productCounts[selectedCategory.id] || 0} OPCIONES DISPONIBLES
                                    </p>
                                </div>
                            </div>

                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder={`Buscar en esta categoría...`}
                                    className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-14 pr-6 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-gray-900 shadow-sm font-medium"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Quick Navigation Scroll */}
                        <div className="flex gap-3 overflow-x-auto pb-6 mb-8 scrollbar-hide no-scrollbar">
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => handleCategorySelect(cat)}
                                    className={`px-8 py-3 rounded-2xl whitespace-nowrap font-black uppercase text-[10px] tracking-[0.2em] transition-all border italic ${selectedCategory.id === cat.id
                                        ? "bg-primary text-black border-primary shadow-xl shadow-primary/20 scale-105"
                                        : "bg-white text-gray-500 border-gray-100 hover:border-primary hover:text-primary"
                                        }`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>

                        {filteredProducts.length === 0 ? (
                            <div className="text-center py-24 bg-white rounded-[3rem] border border-gray-100 shadow-sm">
                                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Utensils className="w-10 h-10 text-gray-300" />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase italic">Sin resultados</h3>
                                <p className="text-gray-500 font-medium">No encontramos platos que coincidan con tu búsqueda.</p>
                                <Button onClick={() => setSearchTerm("")} variant="link" className="text-primary font-black uppercase tracking-widest text-xs mt-4">Ver todo</Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                {filteredProducts.map(product => (
                                    <ProductCard
                                        key={product.id}
                                        product={{ ...product, image: product.image_url || product.image }}
                                        showImages={showImages}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style jsx global>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    )
}

export default function MenuPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        }>
            <MenuContent />
        </Suspense>
    )
}
