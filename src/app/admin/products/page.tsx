
"use client"

import { Button } from "@/components/ui/button"
import { Plus, Pencil, Trash2, Search, X, Loader2, Save, RotateCcw, Archive } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { categories } from "@/lib/data"

type Product = {
    id: string
    name: string
    category_id: string
    price: number
    description: string | null
    image_url: string | null
    is_available: boolean
    ingredients: string[] | null
    deleted_at: string | null
}

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [showDeleted, setShowDeleted] = useState(false) // Toggle para ver papelera
    const [editingId, setEditingId] = useState<string | null>(null) // ID del producto a editar

    // Form State
    const [formData, setFormData] = useState<Partial<Product>>({
        name: '',
        price: 0,
        category_id: 'cat_burgers',
        description: '',
        image_url: '',
        ingredients: []
    })

    // Cargar productos
    const fetchProducts = async () => {
        setLoading(true)
        // Traemos TODO y filtramos en cliente o traemos según el estado
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) console.error('Error fetching products:', error)
        else setProducts(data || [])

        setLoading(false)
    }

    useEffect(() => {
        fetchProducts()
    }, [])

    // Preparar edición
    const handleEdit = (product: Product) => {
        setEditingId(product.id)
        setFormData({
            name: product.name,
            price: product.price,
            category_id: product.category_id,
            description: product.description,
            image_url: product.image_url,
            ingredients: product.ingredients
        })
        setIsEditing(true)
    }

    // Resetear form
    const resetForm = () => {
        setEditingId(null)
        setFormData({ name: '', price: 0, category_id: 'cat_burgers', description: '', image_url: '', ingredients: [] })
        setIsEditing(false)
    }

    // Guardar (Crear o Editar)
    const handleSave = async () => {
        if (!formData.name || !formData.price) return alert("Nombre y Precio son obligatorios")

        const productData = {
            name: formData.name,
            price: parseFloat(formData.price.toString()),
            category_id: formData.category_id,
            description: formData.description,
            image_url: formData.image_url,
            ingredients: Array.isArray(formData.ingredients) ? formData.ingredients : []
        }

        let error;

        if (editingId) {
            // UPDATE
            const res = await supabase.from('products').update(productData).eq('id', editingId)
            error = res.error
        } else {
            // INSERT
            const res = await supabase.from('products').insert([productData])
            error = res.error
        }

        if (error) {
            alert("Error al guardar: " + error.message)
        } else {
            resetForm()
            fetchProducts()
        }
    }

    // Soft Delete (Mover a papelera)
    const handleDelete = async (id: string) => {
        if (!confirm("¿Mover este producto a la papelera?")) return

        // Actualizamos deleted_at a la fecha actual
        const { error } = await supabase
            .from('products')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id)

        if (error) {
            // Fallback si no existe la columna deleted_at (para evitar bloqueo si el usuario no ejecutó el SQL)
            if (error.message.includes('deleted_at')) {
                if (confirm("La columna 'deleted_at' no existe. ¿Quieres borrarlo permanentemente?")) {
                    await supabase.from('products').delete().eq('id', id)
                }
            } else {
                alert("Error al eliminar: " + error.message)
            }
        }

        fetchProducts()
    }

    // Restaurar de papelera
    const handleRestore = async (id: string) => {
        const { error } = await supabase
            .from('products')
            .update({ deleted_at: null })
            .eq('id', id)

        if (error) alert("Error al restaurar")
        else fetchProducts()
    }

    const displayedProducts = products.filter(p => showDeleted ? p.deleted_at : !p.deleted_at)

    return (
        <div className="space-y-8 relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {showDeleted ? 'Papelera de Reciclaje' : 'Productos'}
                    </h1>
                    <p className="text-muted-foreground">
                        {showDeleted ? 'Recupera productos eliminados.' : 'Gestiona tu catálogo en tiempo real.'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={showDeleted ? "outline" : "ghost"}
                        onClick={() => setShowDeleted(!showDeleted)}
                        className={showDeleted ? "bg-red-500/10 text-red-500 border-red-500/20" : "text-muted-foreground"}
                    >
                        {showDeleted ? <Archive className="w-4 h-4 mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                        {showDeleted ? 'Ver Activos' : 'Papelera'}
                    </Button>
                    {!showDeleted && (
                        <Button className="gap-2" onClick={() => { resetForm(); setIsEditing(true); }}>
                            <Plus className="w-4 h-4" /> Nuevo Producto
                        </Button>
                    )}
                </div>
            </div>

            {/* Editor Overlay (Modal) */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card w-full max-w-lg rounded-3xl border border-white/10 p-6 shadow-2xl animate-in zoom-in-95 duration-200 lg:max-w-2xl">
                        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                            <h2 className="text-xl font-bold">
                                {editingId ? 'Editar Producto' : 'Nuevo Producto'}
                            </h2>
                            <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nombre</label>
                                    <input
                                        className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Ej: Hamburguesa Pozu"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Precio (€)</label>
                                    <input
                                        type="number"
                                        className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Categoría</label>
                                    <select
                                        className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 [&>option]:text-black"
                                        value={formData.category_id}
                                        onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                                    >
                                        {categories.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">URL de Imagen</label>
                                    <input
                                        className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10"
                                        value={formData.image_url || ''}
                                        onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                                        placeholder="/images/burgers/pozu.png"
                                    />
                                    {formData.image_url && (
                                        <div className="relative w-full h-32 rounded-lg overflow-hidden border border-white/10 mt-2">
                                            <Image src={formData.image_url} alt="Preview" fill className="object-cover" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 mt-4">
                            <label className="text-sm font-medium">Ingredientes Principales (separados por coma)</label>
                            <textarea
                                className="w-full h-16 p-3 rounded-lg bg-white/5 border border-white/10 resize-none"
                                value={Array.isArray(formData.ingredients) ? formData.ingredients.join(', ') : ''}
                                onChange={e => setFormData({
                                    ...formData,
                                    ingredients: e.target.value.split(',').map(i => i.trim()).filter(i => i !== '')
                                })}
                                placeholder="Ej: Ternera, Queso Cheddar, Bacon, Salsa BBQ"
                            />
                            <p className="text-xs text-muted-foreground">Estos aparecerán destacados en la página de detalle.</p>
                        </div>

                        <div className="space-y-2 mt-4">
                            <label className="text-sm font-medium">Descripción (Marketing)</label>
                            <textarea
                                className="w-full h-20 p-3 rounded-lg bg-white/5 border border-white/10 resize-none"
                                value={formData.description || ''}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Una experiencia única con sabor ahumado..."
                            />
                        </div>

                        <div className="flex gap-4 mt-6">
                            <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                                Cancelar
                            </Button>
                            <Button onClick={handleSave} className="flex-1 font-bold gap-2">
                                <Save className="w-4 h-4" /> {editingId ? 'Guardar Cambios' : 'Crear Producto'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabla de Productos */}
            <div className="bg-card border border-white/10 rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="p-20 flex justify-center text-muted-foreground">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                ) : displayedProducts.length === 0 ? (
                    <div className="p-20 text-center text-muted-foreground">
                        {showDeleted
                            ? "La papelera está vacía."
                            : "No tienes productos activos."}
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-xs uppercase font-bold text-muted-foreground">
                            <tr>
                                <th className="p-4">Producto</th>
                                <th className="p-4 hidden md:table-cell">Categoría</th>
                                <th className="p-4">Precio</th>
                                <th className="p-4 text-center">Estado</th>
                                <th className="p-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {displayedProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-white/5 relative overflow-hidden shrink-0 opacity-80">
                                                <Image
                                                    src={product.image_url || "/images/placeholder.png"}
                                                    alt={product.name}
                                                    fill
                                                    className={`object-cover ${product.deleted_at ? 'grayscale' : ''}`}
                                                />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className={`font-medium ${product.deleted_at ? 'text-muted-foreground line-through' : ''}`}>
                                                    {product.name}
                                                </span>
                                                {product.deleted_at && (
                                                    <span className="text-[10px] text-red-400">Eliminado</span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-muted-foreground capitalize hidden md:table-cell">
                                        {categories.find(c => c.id === product.category_id)?.name || product.category_id}
                                    </td>
                                    <td className="p-4 font-mono">
                                        {product.price.toFixed(2)}€
                                    </td>
                                    <td className="p-4 text-center">
                                        {product.deleted_at ? (
                                            <span className="inline-flex px-2 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                                                Eliminado
                                            </span>
                                        ) : (
                                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold border ${product.is_available ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                                {product.is_available ? 'Activo' : 'Agotado'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {showDeleted ? (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="gap-2 text-green-500 hover:text-green-400 border-green-500/20 hover:bg-green-500/10"
                                                    onClick={() => handleRestore(product.id)}
                                                >
                                                    <RotateCcw className="w-3 h-3" /> Restaurar
                                                </Button>
                                            ) : (
                                                <>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary" onClick={() => handleEdit(product)}>
                                                        <Pencil className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 hover:text-destructive"
                                                        onClick={() => handleDelete(product.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
