"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
    Plus,
    ArrowLeft,
    Save,
    X,
    ChefHat,
    Scale,
    MessageSquare,
    Trash2,
    Search,
    Loader2,
    ChevronRight
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

type Product = {
    id: string
    name: string
}

type Ingredient = {
    id: string
    name: string
    unit: string
}

type Recipe = {
    id: string
    product_id: string
    ingredient_id: string
    quantity: number
    notes: string
    products: { name: string }
    ingredients: { name: string; unit: string }
}

export default function RecipesPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [ingredients, setIngredients] = useState<Ingredient[]>([])
    const [recipes, setRecipes] = useState<Recipe[]>([])
    const [selectedProduct, setSelectedProduct] = useState<string>("")
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        const [prodRes, ingRes, recRes] = await Promise.all([
            supabase.from('products').select('id, name').eq('is_available', true).order('name'),
            supabase.from('ingredients').select('id, name, unit').eq('active', true).order('name'),
            supabase.from('recipes').select(`*, products (name), ingredients (name, unit)`).order('created_at', { ascending: false })
        ])

        setProducts(prodRes.data || [])
        setIngredients(ingRes.data || [])
        setRecipes(recRes.data as any || [])
        setLoading(false)
    }

    const filteredRecipes = recipes.filter(r => {
        const matchesProduct = !selectedProduct || r.product_id === selectedProduct
        const matchesSearch = r.products?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.ingredients?.name.toLowerCase().includes(searchTerm.toLowerCase())
        return matchesProduct && matchesSearch
    })

    const groupedRecipes = filteredRecipes.reduce((acc, recipe) => {
        const productName = recipe.products?.name || 'Sin producto'
        if (!acc[productName]) acc[productName] = []
        acc[productName].push(recipe)
        return acc
    }, {} as Record<string, Recipe[]>)

    if (loading) return (
        <div className="min-h-screen bg-transparent flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
    )

    return (
        <div className="min-h-screen bg-transparent text-slate-900 p-4 md:p-8 font-sans selection:bg-primary selection:text-black">
            <div className="max-w-6xl mx-auto space-y-10">

                {/* 🔝 HEADER */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="space-y-1">
                        <div className="flex items-center gap-4">
                            <Link href="/admin/inventory">
                                <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-sm">
                                    <ArrowLeft className="w-5 h-5 text-slate-900" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-4xl font-black tracking-tighter uppercase italic text-slate-900">Libro de <span className="text-primary">Recetas</span></h1>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic leading-none">Ficha técnica y composición de productos</p>
                            </div>
                        </div>
                    </div>
                    <Button className="h-14 px-8 bg-primary text-black rounded-2xl font-black uppercase text-[10px] tracking-widest italic hover:bg-slate-900 hover:text-white transition-all shadow-xl shadow-primary/20 gap-2 border-none">
                        <Plus className="w-5 h-5" /> CREAR RECETA
                    </Button>
                </div>

                {/* 🔍 FILTERS */}
                <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <div className="flex-1 relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar por producto o ingrediente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-14 pl-14 pr-6 rounded-2xl bg-slate-50 border border-slate-100 focus:border-primary focus:outline-none font-bold text-sm italic transition-all text-slate-900 shadow-inner"
                        />
                    </div>
                    <select
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.target.value)}
                        className="h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 focus:border-primary outline-none font-black text-[10px] uppercase tracking-widest appearance-none cursor-pointer hover:bg-slate-100 transition-all md:min-w-[300px] text-slate-900 italic shadow-inner"
                    >
                        <option value="" className="bg-white">Filtrar por platillo...</option>
                        {products.map(product => (
                            <option key={product.id} value={product.id} className="bg-white">{product.name.toUpperCase()}</option>
                        ))}
                    </select>
                </div>

                {/* 🥘 RECIPES GRID */}
                <div className="grid grid-cols-1 gap-8">
                    {Object.entries(groupedRecipes).length > 0 ? (
                        Object.entries(groupedRecipes).map(([productName, productRecipes]) => (
                            <div key={productName} className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4">
                                <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-primary/5 rounded-2xl border border-primary/10 flex items-center justify-center text-primary">
                                            <ChefHat className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 leading-none mb-1">{productName}</h2>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest italic">{productRecipes.length} Componentes activos</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-6 h-6 text-slate-300" />
                                </div>

                                <div className="p-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {productRecipes.map(recipe => (
                                            <div
                                                key={recipe.id}
                                                className="group p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary/20 hover:bg-white transition-all flex items-start gap-4 relative shadow-inner hover:shadow-sm"
                                            >
                                                <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center shrink-0">
                                                    <Scale className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <p className="font-black italic uppercase text-sm tracking-tight text-slate-900">{recipe.ingredients?.name}</p>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-xl font-black text-primary italic leading-none">{recipe.quantity}</span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase italic">{recipe.ingredients?.unit}</span>
                                                    </div>
                                                    {recipe.notes && (
                                                        <p className="text-[10px] text-slate-400 italic mt-2 border-l-2 border-slate-200 pl-2">
                                                            "{recipe.notes}"
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary hover:text-black">
                                                        <Save className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-rose-500 hover:text-white">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-24 bg-white rounded-[3rem] border border-slate-200 border-dashed animate-in zoom-in-95 duration-700">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100">
                                <ChefHat className="w-10 h-10 text-slate-200" />
                            </div>
                            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">Sin recetas configuradas</h2>
                            <p className="text-slate-400 font-medium italic uppercase text-[10px] tracking-widest mt-2 max-w-xs mx-auto">Empieza a definir la composición de tus platillos para automatizar el stock.</p>
                            <Button className="mt-8 h-14 px-8 bg-primary text-black rounded-2xl font-black uppercase text-[10px] tracking-widest italic hover:bg-slate-900 hover:text-white transition-all shadow-xl shadow-primary/20 border-none">
                                <Plus className="w-5 h-5 mr-2" /> CREAR MI PRIMERA FICHA
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
