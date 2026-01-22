"use client"

import { Navbar } from "@/components/store/navbar"
import { ProductCard } from "@/components/store/product-card"
import { supabase } from "@/lib/supabase/client"
import { useEffect, useState, Suspense } from "react"
import { Search, Loader2, ChevronLeft, ArrowRight, Utensils } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Image from "next/image"

// Iconos para cada categoría
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

// Colores de fondo para las categorías
const categoryColors: { [key: string]: string } = {
    "pescados-y-mariscos": "from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100",
    "ricuras-region": "from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100",
    "cortes-gruesos": "from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100",
    "especialidades-brasa": "from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100",
    "cerdo": "from-pink-50 to-rose-50 hover:from-pink-100 hover:to-rose-100",
    "arroces": "from-yellow-50 to-amber-50 hover:from-yellow-100 hover:to-amber-100",
    "pollos": "from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100",
    "pastas": "from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100",
    "comida-montanera": "from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100",
    "lasanas": "from-red-50 to-orange-50 hover:from-red-100 hover:to-orange-100",
    "comidas-rapidas": "from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100",
    "menu-infantil": "from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100",
    "entradas": "from-green-50 to-lime-50 hover:from-green-100 hover:to-lime-100",
    "asados": "from-red-50 to-amber-50 hover:from-red-100 hover:to-amber-100",
    "desayunos": "from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100",
    "adicionales-bebidas": "from-teal-50 to-cyan-50 hover:from-teal-100 hover:to-cyan-100",
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

    const fetchData = async () => {
        setLoading(true)

        try {
            // Fetch Categories
            const { data: catData, error: catError } = await supabase
                .from('categories')
                .select('*')
                .eq('is_active', true)
                .order('order_position')

            if (catError) console.error("Error cargando categorías:", catError)
            if (catData && catData.length > 0) {
                setCategories(catData)

                // Contar productos por categoría
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

            // Fetch Products
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('is_available', true)
                .order('name')

            if (error) console.error("Error cargando productos:", error)

            if (data && data.length > 0) {
                setProducts(data)
            }

            // Check URL params for category
            const catParam = searchParams.get("category")
            if (catParam && catData) {
                const found = catData.find(c => c.id === catParam || c.slug === catParam)
                if (found) setSelectedCategory(found)
            }

        } catch (err) {
            console.error("Error crítico en fetchData:", err)
        }

        setLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [])

    // Filtrar productos por categoría seleccionada y búsqueda
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
        const matchesCategory = selectedCategory ? product.category_id === selectedCategory.id : true
        return matchesSearch && matchesCategory
    })

    // Handler para seleccionar categoría
    const handleCategorySelect = (category: any) => {
        setSelectedCategory(category)
        setSearchTerm("")
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // Handler para volver a categorías
    const handleBackToCategories = () => {
        setSelectedCategory(null)
        setSearchTerm("")
    }

    // Función para obtener icono
    const getIcon = (slug: string) => {
        return categoryIcons[slug] || "🍽️"
    }

    // Función para obtener color
    const getColor = (slug: string) => {
        return categoryColors[slug] || "from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200"
    }

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

                {/* NIVEL 1: Vista de Categorías */}
                {!selectedCategory ? (
                    <>
                        {/* Header */}
                        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-5 duration-500">
                            <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-4">
                                Menú Completo
                            </span>
                            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
                                ¿Qué deseas <span className="text-gradient">comer hoy</span>?
                            </h1>
                            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                                Explora nuestras categorías y descubre los mejores sabores de la cocina colombiana
                            </p>
                        </div>

                        {/* Buscador Global */}
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

                        {/* Si hay búsqueda, mostrar productos filtrados */}
                        {searchTerm ? (
                            <div className="animate-in fade-in duration-300">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        Resultados para "{searchTerm}"
                                    </h2>
                                    <button
                                        onClick={() => setSearchTerm("")}
                                        className="text-primary font-bold hover:underline"
                                    >
                                        Limpiar búsqueda
                                    </button>
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
                                                product={{
                                                    ...product,
                                                    image: product.image_url || product.image
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Grid de Categorías */
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-5 duration-700">
                                {categories.map((category, index) => (
                                    <button
                                        key={category.id}
                                        onClick={() => handleCategorySelect(category)}
                                        className="group relative h-48 md:h-64 rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        {/* Imagen de Fondo / Icono */}
                                        <div className="absolute inset-0 bg-white">
                                            {category.image_url ? (
                                                <Image
                                                    src={category.image_url}
                                                    alt={category.name}
                                                    fill
                                                    className="object-contain p-6 group-hover:scale-110 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-50 text-6xl">
                                                    {getIcon(category.slug)}
                                                </div>
                                            )}
                                        </div>

                                        {/* Overlay degradado */}
                                        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-6">
                                            <h3 className="text-lg md:text-xl font-black text-white leading-tight mb-1 drop-shadow-md">
                                                {category.name}
                                            </h3>
                                            <p className="text-xs font-bold text-gray-200 uppercase tracking-wider opacity-80">
                                                {productCounts[category.id] || 0} opciones
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    /* NIVEL 2: Vista de Productos de la Categoría */
                    <div className="animate-in fade-in slide-in-from-right-5 duration-500">
                        {/* Header con botón de volver */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="outline"
                                    onClick={handleBackToCategories}
                                    className="rounded-full border-gray-200 hover:border-primary hover:text-primary"
                                >
                                    <ChevronLeft className="w-5 h-5 mr-1" />
                                    Volver
                                </Button>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">{getIcon(selectedCategory.slug)}</span>
                                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                                            {selectedCategory.name}
                                        </h1>
                                    </div>
                                    <p className="text-gray-500 mt-1">
                                        {productCounts[selectedCategory.id] || 0} {productCounts[selectedCategory.id] === 1 ? 'plato disponible' : 'platos disponibles'}
                                    </p>
                                </div>
                            </div>

                            {/* Buscador dentro de categoría */}
                            <div className="relative w-full md:w-80">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder={`Buscar en ${selectedCategory.name}...`}
                                    className="w-full bg-white border border-gray-200 rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-gray-900 placeholder-gray-400"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Navegación rápida entre categorías (Grid 2 filas con scroll horizontal) */}
                        <div className="grid grid-rows-2 grid-flow-col gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide auto-cols-max">
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => handleCategorySelect(cat)}
                                    className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-all border text-sm flex items-center gap-2 ${selectedCategory.id === cat.id
                                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                        : "bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary"
                                        }`}
                                >
                                    {/* Mini vista previa de imagen si existe, sino icono */}
                                    {cat.image_url ? (
                                        <div className="relative w-6 h-6 rounded-full overflow-hidden bg-white">
                                            <Image
                                                src={cat.image_url}
                                                alt=""
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <span>{getIcon(cat.slug)}</span>
                                    )}
                                    {cat.name}
                                </button>
                            ))}
                        </div>

                        {/* Grid de Productos */}
                        {filteredProducts.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
                                <span className="text-6xl mb-4 block">🍽️</span>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                    {searchTerm ? `No hay resultados para "${searchTerm}"` : "No hay productos en esta categoría"}
                                </h3>
                                <p className="text-gray-500 mb-4">
                                    {searchTerm ? "Intenta con otro término" : "Pronto agregaremos más opciones"}
                                </p>
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm("")}
                                        className="text-primary font-bold hover:underline"
                                    >
                                        Ver todos los productos
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                )}
            </div>
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
