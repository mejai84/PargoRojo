"use client"

import { useState, useEffect, Suspense } from "react"
import { Search, ShoppingBasket, HelpCircle, Plus, Info, Loader2 } from "lucide-react"
import Image from "next/image"
import { supabase } from "@/lib/supabase/client"
import { useCart } from "@/components/store/cart-context"

// Tipos de datos actualizados para coincidir con la base de datos
interface Product {
    id: string
    name: string
    description: string
    price: number
    image_url: string
    category_id: string
    weight?: string
    calories?: string
}

interface Category {
    id: string
    name: string
    order_position: number
}

function ModernMenuContent() {
    const { addItem, items } = useCart()
    const [activeCategory, setActiveCategory] = useState("all")
    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    const cartCount = items.reduce((sum, item) => sum + item.quantity, 0)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            // Cargar categorías
            const { data: catData } = await supabase
                .from('categories')
                .select('*')
                .eq('is_active', true)
                .order('order_position')

            if (catData) setCategories(catData)

            // Cargar productos
            const { data: prodData } = await supabase
                .from('products')
                .select('*')
                .eq('is_available', true)
                .is('deleted_at', null)

            if (prodData) {
                // Mapear campos de base de datos a los que usamos en la UI
                const mappedProducts = prodData.map(p => ({
                    ...p,
                    weight: p.weight || (Math.floor(Math.random() * 200) + 150) + " g", // Mock data si no existe
                    calories: p.calories || (Math.floor(Math.random() * 300) + 300) + " Cal"
                }))
                setProducts(mappedProducts)
            }
        } catch (error) {
            console.error("Error fetching data:", error)
        }
        setLoading(false)
    }

    const filteredProducts = products.filter(p => {
        const matchesCategory = activeCategory === "all" || p.category_id === activeCategory
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
        return matchesCategory && matchesSearch
    })

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8F9FE] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-[#FF0075]" />
                <p className="text-[#1E2022] font-bold animate-pulse font-outfit">Preparando menú premium...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#F8F9FE] text-[#1E2022] font-sans overflow-x-hidden selection:bg-[#FF0075]/20">
            {/* Header */}
            <header className="px-8 py-6 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <h1 className="text-[28px] font-black tracking-tight text-[#1E2022] font-outfit uppercase">
                        Pargo Rojo
                    </h1>
                </div>

                <div className="flex-1 max-w-md mx-8 relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <Search className="w-4 h-4" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar plato..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#F3F4F9] border-none rounded-xl py-2.5 pl-11 pr-4 text-sm focus:ring-2 focus:ring-[#FF0075]/10 outline-none transition-all"
                    />
                </div>

                <div className="flex items-center gap-8">
                    <HelpCircle className="w-6 h-6 text-gray-300 cursor-pointer hover:text-gray-500 transition-colors" />
                    <span className="font-bold text-gray-300 cursor-pointer hover:text-gray-500 transition-colors uppercase text-[13px]">
                        En
                    </span>
                    <div className="relative bg-[#1E2235] text-white p-3 rounded-2xl shadow-lg cursor-pointer hover:scale-105 transition-all">
                        <ShoppingBasket className="w-6 h-6" />
                        {cartCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-[#FF0075] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                                {cartCount}
                            </span>
                        )}
                    </div>
                </div>
            </header>

            {/* Category Navigation */}
            <nav className="px-8 mt-4">
                <div className="flex items-center gap-10 overflow-x-auto no-scrollbar py-4 border-b border-gray-100">
                    <div className="relative pb-4 flex-shrink-0">
                        <button
                            onClick={() => setActiveCategory("all")}
                            className={`text-[20px] font-bold transition-all ${activeCategory === "all" ? 'text-[#FF0075]' : 'text-gray-300 hover:text-gray-400'}`}
                        >
                            Todo
                        </button>
                        {activeCategory === "all" && (
                            <div className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#FF0075] rounded-full" />
                        )}
                    </div>
                    {categories.map(cat => (
                        <div key={cat.id} className="relative pb-4 flex-shrink-0">
                            <button
                                onClick={() => setActiveCategory(cat.id)}
                                className={`text-[20px] font-bold transition-all ${activeCategory === cat.id ? 'text-[#FF0075]' : 'text-gray-300 hover:text-gray-400'}`}
                            >
                                {cat.name}
                            </button>
                            {activeCategory === cat.id && (
                                <div className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#FF0075] rounded-full" />
                            )}
                        </div>
                    ))}
                </div>
            </nav>

            {/* Product Grid */}
            <main className="px-8 py-10 pb-32">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12 max-w-[1600px] mx-auto">
                    {filteredProducts.map(product => (
                        <div key={product.id} className="group flex flex-col">
                            {/* Card Image Container */}
                            <div className="relative aspect-[1.1/1] rounded-[2.8rem] overflow-hidden bg-white shadow-xl shadow-gray-200/50 mb-6 group-hover:shadow-2xl group-hover:-translate-y-1 transition-all duration-500">
                                <Image
                                    src={product.image_url || "/images/placeholder.png"}
                                    alt={product.name}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                />

                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />

                                {/* Buttons inside image */}
                                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                                    <button className="bg-[#1E2235]/95 backdrop-blur-md text-white px-8 py-3.5 rounded-2xl text-[14px] font-bold hover:bg-[#1E2235] transition-all shadow-lg">
                                        Detalles
                                    </button>
                                    <button
                                        onClick={() => addItem(product as any)}
                                        className="bg-[#FF0075] text-white p-4 rounded-2xl shadow-xl shadow-[#FF0075]/30 hover:scale-110 active:scale-95 transition-all"
                                    >
                                        <Plus className="w-5 h-5 stroke-[3.5px]" />
                                    </button>
                                </div>
                            </div>

                            {/* Info below image */}
                            <div className="px-2">
                                <h3 className="text-[18px] font-bold leading-[1.3] text-[#1E2022] mb-3 pr-4 group-hover:text-[#FF0075] transition-colors">
                                    {product.name}
                                </h3>
                                <div className="flex items-center justify-between text-[#B0B2B8] text-[15px] font-semibold">
                                    <span>{product.weight}</span>
                                    <span>{product.calories}</span>
                                </div>
                                <div className="mt-2 text-[#1E2235] font-black text-lg">
                                    ${product.price.toLocaleString('es-CO')}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredProducts.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-gray-400 text-xl font-medium">No se encontraron platos en esta categoría.</p>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex items-center justify-between px-12 py-6 z-50">
                <div className="flex gap-12">
                    <div className="flex gap-3">
                        <span className="text-[#B0B2B8] font-bold text-[16px]">Mesa:</span>
                        <span className="text-[#1E2022] font-black text-[16px]">2</span>
                    </div>
                    <div className="flex gap-3">
                        <span className="text-[#B0B2B8] font-bold text-[16px]">Personas:</span>
                        <span className="text-[#1E2022] font-black text-[16px]">4</span>
                    </div>
                </div>

                <div className="flex items-center gap-4 cursor-pointer group">
                    <span className="text-[#B0B2B8] font-bold text-[15px] group-hover:text-[#1E2022] transition-colors">Llamar al Mesero</span>
                    <div className="bg-[#1E2235] text-white p-2.5 rounded-xl group-hover:scale-110 transition-all shadow-lg">
                        <svg className="w-5 h-5 rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="16" x2="12" y2="12" />
                            <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                    </div>
                </div>
            </footer>

            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
                
                .font-outfit {
                    font-family: 'Outfit', sans-serif;
                }

                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                
                body {
                    font-family: 'Outfit', sans-serif;
                    -webkit-font-smoothing: antialiased;
                }

                .text-gradient {
                    background: linear-gradient(to right, #FF0075, #FF5090);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
            `}</style>
        </div>
    )
}

export default function ModernMenuPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#F8F9FE] flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-[#FF0075]" />
            </div>
        }>
            <ModernMenuContent />
        </Suspense>
    )
}
