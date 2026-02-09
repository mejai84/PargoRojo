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
    TrendingUp,
    Trash2,
    Search,
    Loader2,
    ChevronRight,
    DollarSign,
    Target,
    Activity,
    AlertCircle,
    Copy
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// --- TYPES ---
type Product = {
    id: string
    name: string
    price: number
}

type Ingredient = {
    id: string
    name: string
    unit: string
    cost_per_unit: number
}

type RecipeItem = {
    id?: string
    ingredient_id: string
    quantity: number
    notes?: string
    ingredient?: Ingredient
}

type Recipe = {
    id: string
    name: string
    description: string
    is_sub_recipe: boolean
    portions: number
    product_id?: string
    product?: Product
    items: RecipeItem[]
}

export default function RecipesPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [ingredients, setIngredients] = useState<Ingredient[]>([])
    const [recipes, setRecipes] = useState<Recipe[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingRecipe, setEditingRecipe] = useState<Partial<Recipe> | null>(null)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const [prodRes, ingRes, recRes] = await Promise.all([
                supabase.from('products').select('id, name, price').eq('is_available', true).order('name'),
                supabase.from('ingredients').select('id, name, unit, cost_per_unit').eq('active', true).order('name'),
                supabase.from('recipes_new').select(`
                    *,
                    product:products(id, name, price),
                    items:recipe_items(
                        *,
                        ingredient:ingredients(id, name, unit, cost_per_unit)
                    )
                `).order('name')
            ])

            if (prodRes.error) throw prodRes.error
            if (ingRes.error) throw ingRes.error
            if (recRes.error) throw recRes.error

            setProducts(prodRes.data || [])
            setIngredients(ingRes.data || [])
            setRecipes(recRes.data as any || [])
        } catch (error: any) {
            toast.error("Error al cargar datos: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateNew = () => {
        setEditingRecipe({
            name: '',
            description: '',
            is_sub_recipe: false,
            portions: 1,
            items: []
        })
        setIsModalOpen(true)
    }

    const handleEdit = (recipe: Recipe) => {
        setEditingRecipe(recipe)
        setIsModalOpen(true)
    }

    const addIngredientToRecipe = () => {
        if (!editingRecipe) return
        const newItems = [...(editingRecipe.items || []), { ingredient_id: '', quantity: 0 }]
        setEditingRecipe({ ...editingRecipe, items: newItems })
    }

    const removeIngredientFromRecipe = (index: number) => {
        if (!editingRecipe) return
        const newItems = [...(editingRecipe.items || [])]
        newItems.splice(index, 1)
        setEditingRecipe({ ...editingRecipe, items: newItems })
    }

    const updateItem = (index: number, field: keyof RecipeItem, value: any) => {
        if (!editingRecipe) return
        const newItems = [...(editingRecipe.items || [])]
        newItems[index] = { ...newItems[index], [field]: value }

        // Auto-link ingredient data for real-time cost
        if (field === 'ingredient_id') {
            const ing = ingredients.find(i => i.id === value)
            if (ing) newItems[index].ingredient = ing
        }

        setEditingRecipe({ ...editingRecipe, items: newItems })
    }

    const calculateRecipeCost = (items: RecipeItem[]) => {
        return items.reduce((sum, item) => {
            const cost = item.ingredient?.cost_per_unit || 0
            return sum + (cost * item.quantity)
        }, 0)
    }

    const saveRecipe = async () => {
        if (!editingRecipe || !editingRecipe.name) {
            toast.error("El nombre es obligatorio")
            return
        }

        setSubmitting(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()

            // 1. Get restaurant_id
            const { data: profile } = await supabase.from('profiles').select('restaurant_id').eq('id', user?.id).single()

            const recipeData = {
                name: editingRecipe.name,
                description: editingRecipe.description,
                is_sub_recipe: editingRecipe.is_sub_recipe,
                portions: editingRecipe.portions,
                product_id: editingRecipe.product_id || null,
                restaurant_id: profile?.restaurant_id
            }

            let recipeId = editingRecipe.id

            if (recipeId) {
                // Update header
                await supabase.from('recipes_new').update(recipeData).eq('id', recipeId)
                // Delete old items
                await supabase.from('recipe_items').delete().eq('recipe_id', recipeId)
            } else {
                // Create header
                const { data: newRec, error: insErr } = await supabase.from('recipes_new').insert(recipeData).select().single()
                if (insErr) throw insErr
                recipeId = newRec.id
            }

            // Insert new items
            if (editingRecipe.items && editingRecipe.items.length > 0) {
                const itemsToIns = editingRecipe.items.map(it => ({
                    recipe_id: recipeId,
                    ingredient_id: it.ingredient_id,
                    quantity: it.quantity,
                    notes: it.notes
                }))
                const { error: itemErr } = await supabase.from('recipe_items').insert(itemsToIns)
                if (itemErr) throw itemErr
            }

            toast.success("Receta guardada con éxito")
            setIsModalOpen(false)
            loadData()
        } catch (error: any) {
            console.error(error)
            toast.error("Error al guardar: " + error.message)
        } finally {
            setSubmitting(false)
        }
    }

    const filteredRecipes = recipes.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.product?.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) return (
        <div className="min-h-screen bg-transparent flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
    )

    return (
        <div className="min-h-screen bg-transparent text-slate-900 p-4 md:p-8 font-sans selection:bg-primary selection:text-black">
            <div className="max-w-[1400px] mx-auto space-y-12">

                {/* 🔝 HEADER */}
                <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-4 duration-700 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 text-white font-black italic text-[10px] uppercase tracking-[0.2em]">
                                <ChefHat className="w-3.5 h-3.5 text-primary" />
                                Ingeniería de Menú & Costos
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-5xl font-black italic tracking-tighter text-slate-900 uppercase leading-none">
                                    Kernel de <span className="text-primary italic">Recetas</span>
                                </h1>
                                <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px]">
                                    Control de escandallos y márgenes de rentabilidad
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <Link href="/admin/inventory">
                                <Button variant="outline" className="h-14 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest italic border-slate-200 hover:bg-slate-50 transition-all gap-2">
                                    <ArrowLeft className="w-4 h-4" /> Volver
                                </Button>
                            </Link>
                            <Button onClick={handleCreateNew} className="h-14 px-8 bg-primary text-black rounded-2xl font-black uppercase text-[10px] tracking-widest italic hover:bg-slate-900 hover:text-white transition-all shadow-xl shadow-primary/20 gap-2 border-none">
                                <Plus className="w-5 h-5 font-bold" /> Crear Ficha Técnica
                            </Button>
                        </div>
                    </div>
                </div>

                {/* 🔍 SEARCH */}
                <div className="relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar por producto, base o ingrediente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-16 pl-16 pr-8 rounded-3xl bg-white border border-slate-200 focus:border-primary focus:outline-none font-bold text-sm italic transition-all text-slate-900 shadow-sm"
                    />
                </div>

                {/* 🍱 GRID DE RECETAS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredRecipes.map(recipe => {
                        const totalCost = calculateRecipeCost(recipe.items)
                        const price = recipe.product?.price || 0
                        const margin = price > 0 ? ((price - totalCost) / price) * 100 : 0

                        return (
                            <div key={recipe.id} className="group bg-white border border-slate-200 rounded-[2.5rem] p-8 space-y-6 hover:border-primary/50 transition-all hover:shadow-2xl hover:shadow-primary/5 relative overflow-hidden">
                                {recipe.is_sub_recipe && (
                                    <div className="absolute top-6 right-6 px-3 py-1 bg-blue-500/10 text-blue-600 text-[10px] font-black uppercase italic rounded-full border border-blue-500/20">
                                        SUB-RECETA
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">{recipe.name}</h3>
                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest italic">{recipe.items.length} Componentes</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Costo Total</p>
                                        <p className="text-lg font-black text-rose-500 italic leading-none">${totalCost.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Margen (%)</p>
                                        <p className={cn(
                                            "text-lg font-black italic leading-none",
                                            margin > 60 ? "text-emerald-500" : margin > 40 ? "text-amber-500" : "text-rose-500"
                                        )}>
                                            {margin.toFixed(1)}%
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => handleEdit(recipe)}
                                        className="flex-1 h-12 rounded-xl bg-slate-900 text-white hover:bg-primary hover:text-black font-black uppercase text-[10px] tracking-widest italic transition-all"
                                    >
                                        Editar Ficha
                                    </Button>
                                    <Button variant="outline" className="h-12 w-12 rounded-xl border-slate-200">
                                        <Trash2 className="w-5 h-5 text-rose-500" />
                                    </Button>
                                </div>
                            </div>
                        )
                    })}

                    {filteredRecipes.length === 0 && (
                        <div className="col-span-full py-24 text-center space-y-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem]">
                            <ChefHat className="w-16 h-16 text-slate-200 mx-auto" />
                            <div className="space-y-1">
                                <h3 className="text-xl font-black italic uppercase text-slate-400">Sin Inteligencia de Costos</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Define tu primera receta para ver márgenes de ganancia</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 🛠️ MODAL DE EDICIÓN / CREACIÓN */}
            {isModalOpen && editingRecipe && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-black shadow-lg shadow-primary/20">
                                    <ChefHat className="w-7 h-7" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
                                        {editingRecipe.id ? 'Editar Ficha' : 'Nueva Ficha'}
                                    </h2>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic mt-1">Configuración técnica de escandallo</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="rounded-full h-12 w-12 hover:bg-rose-50 text-rose-500">
                                <X className="w-6 h-6" />
                            </Button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">

                            {/* General Data */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-bold">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest italic text-slate-400 px-1">Nombre de la Receta / Platillo</label>
                                    <input
                                        type="text"
                                        placeholder="Eje: Hamburguesa Especial"
                                        value={editingRecipe.name}
                                        onChange={(e) => setEditingRecipe({ ...editingRecipe, name: e.target.value })}
                                        className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 focus:border-primary outline-none transition-all italic text-slate-900"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest italic text-slate-400 px-1">Producto Final Vinculado</label>
                                    <select
                                        value={editingRecipe.product_id || ''}
                                        onChange={(e) => setEditingRecipe({ ...editingRecipe, product_id: e.target.value })}
                                        className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 focus:border-primary outline-none transition-all italic text-slate-900 appearance-none cursor-pointer"
                                    >
                                        <option value="">Selecciona un producto (opcional)...</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 font-bold">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest italic text-slate-400 px-1">Rendimiento (Porciones)</label>
                                    <input
                                        type="number"
                                        value={editingRecipe.portions}
                                        onChange={(e) => setEditingRecipe({ ...editingRecipe, portions: Number(e.target.value) })}
                                        className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 focus:border-primary outline-none transition-all italic text-slate-900"
                                    />
                                </div>
                                <div className="pt-8 flex items-center gap-4">
                                    <button
                                        onClick={() => setEditingRecipe({ ...editingRecipe, is_sub_recipe: !editingRecipe.is_sub_recipe })}
                                        className={cn(
                                            "h-14 flex-1 rounded-2xl border-2 transition-all flex items-center justify-center gap-2 uppercase text-[10px] italic font-black tracking-widest",
                                            editingRecipe.is_sub_recipe ? "bg-blue-500 border-blue-500 text-white" : "border-slate-100 text-slate-400 hover:border-blue-200"
                                        )}
                                    >
                                        {editingRecipe.is_sub_recipe ? 'Sub-Receta Activa' : '¿Es Sub-Receta?'}
                                    </button>
                                </div>
                            </div>

                            {/* Ingredients Builder */}
                            <div className="space-y-6">
                                <div className="flex justify-between items-center px-1">
                                    <h3 className="text-lg font-black italic uppercase text-slate-900">Composición de Insumos</h3>
                                    <Button onClick={addIngredientToRecipe} size="sm" className="bg-slate-900 text-white hover:bg-primary hover:text-black rounded-xl h-10 px-4 font-black text-[10px] uppercase italic gap-2 transition-all">
                                        <Plus className="w-4 h-4" /> Agregar Insumo
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    {editingRecipe.items?.map((item, idx) => (
                                        <div key={idx} className="grid grid-cols-12 gap-3 items-center group animate-in slide-in-from-left-4 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                                            <div className="col-span-6">
                                                <select
                                                    value={item.ingredient_id}
                                                    onChange={(e) => updateItem(idx, 'ingredient_id', e.target.value)}
                                                    className="w-full h-12 px-5 rounded-xl bg-slate-50 border border-slate-100 focus:border-primary outline-none text-xs font-bold italic text-slate-900"
                                                >
                                                    <option value="">Selecciona ingrediente...</option>
                                                    {ingredients.map(ing => (
                                                        <option key={ing.id} value={ing.id}>{ing.name.toUpperCase()} ({ing.unit})</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-span-3">
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                                                        className="w-full h-12 pl-4 pr-12 rounded-xl bg-slate-50 border border-slate-100 focus:border-primary outline-none text-xs font-black italic text-slate-900"
                                                        placeholder="Cant."
                                                    />
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300 uppercase italic">
                                                        {item.ingredient?.unit || 'UNI'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="col-span-2 text-right">
                                                <p className="text-[10px] font-black text-rose-500 italic">
                                                    ${((item.ingredient?.cost_per_unit || 0) * item.quantity).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="col-span-1 flex justify-end">
                                                <Button onClick={() => removeIngredientFromRecipe(idx)} variant="ghost" size="icon" className="h-10 w-10 text-slate-300 hover:text-rose-500 rounded-lg">
                                                    <X className="w-5 h-5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}

                                    {(!editingRecipe.items || editingRecipe.items.length === 0) && (
                                        <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl text-slate-300">
                                            <Activity className="w-8 h-8 mb-2 opacity-50" />
                                            <p className="text-[10px] font-black uppercase italic tracking-widest">Sin insumos agregados</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer / Intelligence Bar */}
                        <div className="p-8 bg-slate-900 text-white flex flex-col md:flex-row justify-between items-center gap-8 border-t border-slate-800">
                            <div className="flex gap-10">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Costo de Producción</p>
                                    <p className="text-3xl font-black italic text-primary leading-none">
                                        ${calculateRecipeCost(editingRecipe.items || []).toLocaleString()}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Costo por Porción</p>
                                    <p className="text-3xl font-black italic text-white/90 leading-none">
                                        ${((calculateRecipeCost(editingRecipe.items || [])) / (editingRecipe.portions || 1)).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 w-full md:w-auto">
                                <Button
                                    onClick={() => setIsModalOpen(false)}
                                    variant="ghost"
                                    className="h-16 px-8 text-slate-400 hover:text-white font-black uppercase text-[10px] tracking-widest italic rounded-2xl"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={saveRecipe}
                                    disabled={submitting}
                                    className="h-16 px-12 bg-primary text-black hover:bg-white transition-all font-black uppercase text-xs tracking-[0.3em] italic rounded-2xl min-w-[200px]"
                                >
                                    {submitting ? (
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5 mr-3" /> GUARDAR FICHA
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>

        </div>
    )
}
