"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
    Plus,
    X,
    Save,
    ArrowLeft,
    Box,
    Truck,
    Receipt,
    Calendar,
    DollarSign,
    Trash2,
    CheckCircle2,
    Loader2
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

type Supplier = { id: string, name: string }
type Ingredient = { id: string, name: string, unit: string, cost_per_unit: number }

type PurchaseItem = {
    ingredient_id: string
    quantity: number
    unit_cost: number
    total_cost: number
}

export default function NewPurchasePage() {
    const router = useRouter()
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [ingredients, setIngredients] = useState<Ingredient[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Form State
    const [supplierId, setSupplierId] = useState("")
    const [invoiceNumber, setInvoiceNumber] = useState("")
    const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])
    const [items, setItems] = useState<PurchaseItem[]>([{
        ingredient_id: "",
        quantity: 0,
        unit_cost: 0,
        total_cost: 0
    }])

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        const [supRes, ingRes] = await Promise.all([
            supabase.from('suppliers').select('id, name').eq('is_active', true).order('name'),
            supabase.from('ingredients').select('id, name, unit, cost_per_unit').eq('active', true).order('name')
        ])
        setSuppliers(supRes.data || [])
        setIngredients(ingRes.data || [])
        setLoading(false)
    }

    const addItem = () => {
        setItems([...items, { ingredient_id: "", quantity: 0, unit_cost: 0, total_cost: 0 }])
    }

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index))
    }

    const updateItem = (index: number, field: keyof PurchaseItem, value: any) => {
        const newItems = [...items]
        const item = { ...newItems[index], [field]: value }

        // Auto-calculate total or unit cost
        if (field === 'ingredient_id') {
            const ing = ingredients.find(i => i.id === value)
            if (ing) item.unit_cost = ing.cost_per_unit
        }

        if (field === 'quantity' || field === 'unit_cost') {
            item.total_cost = Number(item.quantity) * Number(item.unit_cost)
        }

        newItems[index] = item
        setItems(newItems)
    }

    const totalOrder = items.reduce((sum, item) => sum + item.total_cost, 0)

    const handleSubmit = async () => {
        if (!supplierId || items.some(i => !i.ingredient_id || i.quantity <= 0)) {
            alert("Por favor completa todos los campos correctamente")
            return
        }

        setSaving(true)
        try {
            const { data: purchaseData, error: pError } = await supabase
                .from('inventory_purchases')
                .insert([{
                    supplier_id: supplierId,
                    invoice_number: invoiceNumber,
                    purchase_date: new Date(purchaseDate).toISOString(),
                    total_amount: totalOrder,
                    payment_status: 'paid',
                    created_by: (await supabase.auth.getUser()).data.user?.id
                }])
                .select()
                .single()

            if (pError) throw pError

            const purchaseId = purchaseData.id
            const { error: iError } = await supabase
                .from('inventory_purchase_items')
                .insert(items.map(i => ({
                    purchase_id: purchaseId,
                    ingredient_id: i.ingredient_id,
                    quantity: i.quantity,
                    unit_cost: i.unit_cost,
                    total_cost: i.total_cost
                })))

            if (iError) throw iError

            router.push('/admin/inventory')
        } catch (err: any) {
            alert("Error: " + err.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen bg-transparent flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
    )

    return (
        <div className="min-h-screen bg-transparent text-slate-900 p-4 md:p-10 font-sans selection:bg-primary">
            <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700">

                {/* 🔝 HEADER */}
                <div className="flex justify-between items-center animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="flex items-center gap-6">
                        <Link href="/admin/inventory">
                            <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-sm">
                                <ArrowLeft className="w-6 h-6 text-slate-900" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-4xl font-black tracking-tighter uppercase italic text-slate-900">Registro de <span className="text-primary">Suministros</span></h1>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic leading-none">Entrada formal de mercancía al almacén</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* 📝 FORM LEFT */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 space-y-8 shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 italic">
                                        <Truck className="w-3 h-3 text-primary" /> PROVEEDOR
                                    </label>
                                    <select
                                        value={supplierId}
                                        onChange={(e) => setSupplierId(e.target.value)}
                                        className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 focus:border-primary outline-none font-black text-xs uppercase tracking-widest appearance-none transition-all text-slate-900 shadow-inner italic"
                                    >
                                        <option value="">Seleccionar Proveedor...</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 italic">
                                        <Receipt className="w-3 h-3 text-primary" /> FACTURA / REMISIÓN
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ej: FE-12345"
                                        value={invoiceNumber}
                                        onChange={(e) => setInvoiceNumber(e.target.value)}
                                        className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 focus:border-primary outline-none font-black text-xs uppercase tracking-widest transition-all text-slate-900 shadow-inner italic"
                                    />
                                </div>
                            </div>

                            <div className="space-y-6 pt-6">
                                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                                    <h3 className="text-sm font-black uppercase tracking-widest italic text-primary">Detalle de Insumos</h3>
                                    <Button onClick={addItem} variant="ghost" className="h-10 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:bg-slate-900 hover:text-white transition-all font-black text-[9px] uppercase tracking-widest italic">
                                        <Plus className="w-3 h-3 mr-2" /> AGREGAR ITEM
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    {items.map((item, index) => (
                                        <div key={index} className="grid grid-cols-12 gap-3 items-end animate-in slide-in-from-right-2 duration-300">
                                            <div className="col-span-12 md:col-span-5 space-y-2">
                                                <select
                                                    value={item.ingredient_id}
                                                    onChange={(e) => updateItem(index, 'ingredient_id', e.target.value)}
                                                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-100 focus:border-primary outline-none font-bold text-[10px] uppercase tracking-tighter text-slate-900 italic shadow-inner"
                                                >
                                                    <option value="">Seleccionar Insumo...</option>
                                                    {ingredients.map(ing => <option key={ing.id} value={ing.id}>{ing.name.toUpperCase()} ({ing.unit})</option>)}
                                                </select>
                                            </div>
                                            <div className="col-span-4 md:col-span-2 space-y-2">
                                                <input
                                                    type="number"
                                                    placeholder="Cant"
                                                    value={item.quantity || ''}
                                                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-100 focus:border-primary outline-none font-black text-xs text-slate-900 shadow-inner italic"
                                                />
                                            </div>
                                            <div className="col-span-4 md:col-span-2 space-y-2">
                                                <div className="relative">
                                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-emerald-500" />
                                                    <input
                                                        type="number"
                                                        placeholder="Costo"
                                                        value={item.unit_cost || ''}
                                                        onChange={(e) => updateItem(index, 'unit_cost', e.target.value)}
                                                        className="w-full h-12 pl-8 pr-4 rounded-xl bg-slate-50 border border-slate-100 focus:border-primary outline-none font-black text-xs text-slate-900 shadow-inner"
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-span-3 md:col-span-2 h-12 flex items-center justify-end font-black italic text-emerald-600 text-xs text-right overflow-hidden tracking-tighter">
                                                ${(item.total_cost).toLocaleString()}
                                            </div>
                                            <div className="col-span-1 h-12 flex items-center justify-center">
                                                <button onClick={() => removeItem(index)} className="text-slate-200 hover:text-rose-500 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 💳 SUMMARY RIGHT */}
                    <div className="space-y-6">
                        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-8 sticky top-10">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Total de la entrada</p>
                                <h2 className="text-5xl font-black italic tracking-tighter text-emerald-600 leading-none">
                                    ${totalOrder.toLocaleString()}
                                </h2>
                            </div>

                            <div className="space-y-4 pt-6 border-t border-slate-100">
                                <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest italic">
                                    <span className="text-slate-400">Items registrados</span>
                                    <span className="text-slate-900">{items.length}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest italic">
                                    <span className="text-slate-400">Fecha de ingreso</span>
                                    <input
                                        type="date"
                                        value={purchaseDate}
                                        onChange={(e) => setPurchaseDate(e.target.value)}
                                        className="bg-transparent border-none text-slate-900 font-black italic text-right focus:outline-none cursor-pointer"
                                    />
                                </div>
                            </div>

                            <Button
                                onClick={handleSubmit}
                                disabled={saving}
                                className="w-full h-20 bg-primary text-black rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] italic hover:bg-slate-900 hover:text-white transition-all shadow-xl shadow-primary/20 gap-3 border-none"
                            >
                                {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                                {saving ? 'PROCESANDO...' : 'CONFIRMAR ENTRADA'}
                            </Button>

                            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100 flex gap-4">
                                <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                                <p className="text-[9px] font-bold text-emerald-600 leading-relaxed uppercase italic">
                                    Al confirmar esta entrada, el stock de los insumos se actualizará automáticamente y se generará el registro en el historial de costos.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
