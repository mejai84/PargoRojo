"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Plus, ArrowLeft, Save, X } from "lucide-react"
import Link from "next/link"

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

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        // Load products
        const { data: productsData } = await supabase
            .from('products')
            .select('id, name')
            .eq('available', true)
            .order('name')

        // Load ingredients
        const { data: ingredientsData } = await supabase
            .from('ingredients')
            .select('id, name, unit')
            .eq('active', true)
            .order('name')

        // Load recipes
        const { data: recipesData } = await supabase
            .from('recipes')
            .select(`
                *,
                products (name),
                ingredients (name, unit)
            `)
            .order('created_at', { ascending: false })

        setProducts(productsData || [])
        setIngredients(ingredientsData || [])
        setRecipes(recipesData as any || [])
        setLoading(false)
    }

    const filteredRecipes = selectedProduct
        ? recipes.filter(r => r.product_id === selectedProduct)
        : recipes

    const groupedRecipes = filteredRecipes.reduce((acc, recipe) => {
        const productName = recipe.products?.name || 'Sin producto'
        if (!acc[productName]) {
            acc[productName] = []
        }
        acc[productName].push(recipe)
        return acc
    }, {} as Record<string, Recipe[]>)

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/inventory">
                            <Button variant="outline" size="icon">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold">Recetas de Productos</h1>
                            <p className="text-muted-foreground">Define qué ingredientes usa cada producto</p>
                        </div>
                    </div>
                    <Button className="gap-2">
                        <Plus className="w-4 h-4" />
                        Nueva Receta
                    </Button>
                </div>

                {/* Filter */}
                <div className="mb-6">
                    <select
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.target.value)}
                        className="w-full md:w-96 px-4 py-3 rounded-xl bg-card border border-white/10 focus:border-primary focus:outline-none"
                    >
                        <option value="">Todos los productos</option>
                        {products.map(product => (
                            <option key={product.id} value={product.id}>
                                {product.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Recipes by Product */}
                <div className="space-y-6">
                    {Object.entries(groupedRecipes).map(([productName, productRecipes]) => (
                        <div key={productName} className="bg-card rounded-2xl border border-white/10 overflow-hidden">
                            <div className="p-6 border-b border-white/10 bg-white/5">
                                <h2 className="text-2xl font-bold">{productName}</h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {productRecipes.length} ingrediente{productRecipes.length !== 1 ? 's' : ''}
                                </p>
                            </div>

                            <div className="p-6">
                                <div className="grid gap-4">
                                    {productRecipes.map(recipe => (
                                        <div
                                            key={recipe.id}
                                            className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
                                        >
                                            <div className="flex-1">
                                                <div className="font-bold text-lg mb-1">
                                                    {recipe.ingredients?.name}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    Cantidad: <span className="font-bold text-primary">
                                                        {recipe.quantity} {recipe.ingredients?.unit}
                                                    </span>
                                                </div>
                                                {recipe.notes && (
                                                    <div className="text-sm text-muted-foreground mt-1">
                                                        Nota: {recipe.notes}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <Button variant="ghost" size="sm">
                                                    <Save className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="text-destructive">
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {Object.keys(groupedRecipes).length === 0 && (
                    <div className="text-center py-12 bg-card rounded-2xl border border-white/10">
                        <div className="text-6xl mb-4">🍳</div>
                        <h3 className="text-xl font-bold mb-2">No hay recetas configuradas</h3>
                        <p className="text-muted-foreground mb-6">
                            Comienza agregando ingredientes a tus productos
                        </p>
                        <Button className="gap-2">
                            <Plus className="w-4 h-4" />
                            Crear Primera Receta
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
