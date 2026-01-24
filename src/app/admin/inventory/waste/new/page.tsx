"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
    Plus,
    X,
    Save,
    ArrowLeft,
    Trash2,
    AlertTriangle,
    Loader2,
    CheckCircle2,
    History
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

type Ingredient = { id: string, name: string, unit: string, cost_per_unit: number, current_stock: number }

const WASTE_REASONS = [
    { id: 'expired', label: 'CADUCIDAD', icon: '⏰' },
    { id: 'damaged', label: 'DAÑO FÍSICO / CAÍDA', icon: '💥' },
    { id: 'poor_quality', label: 'MALA CALIDAD / DESCOMPUESTO', icon: '🤢' },
    { id: 'overproduction', label: 'SOBREPRODUCCIÓN', icon: '🍳' },
    { id: 'error', label: 'ERROR DE PREPARACIÓN', icon: '❌' }
]

export default function NewWastePage() {
    const router = useRouter()
    const [ingredients, setIngredients] = useState<Ingredient[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Form State
    const [ingredientId, setIngredientId] = useState("")
    const [quantity, setQuantity] = useState(0)
    const [reason, setReason] = useState("damaged")
    const [notes, setNotes] = useState("")

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        const { data } = await supabase
            .from('ingredients')
            .select('id, name, unit, cost_per_unit, current_stock')
            .eq('active', true)
            .order('name')
        setIngredients(data || [])
        setLoading(false)
    }

    const selectedIngredient = ingredients.find(i => i.id === ingredientId)
    const totalLostValue = (selectedIngredient?.cost_per_unit || 0) * (quantity || 0)

    const handleSubmit = async () => {
        if (!ingredientId || quantity <= 0 || !reason) {
            alert("Por favor completa los campos obligatorios")
            return
        }

        if (selectedIngredient && quantity > selectedIngredient.current_stock) {
            const confirm = window.confirm(`Estás reportando una merma de ${quantity} ${selectedIngredient.unit}, pero el sistema solo registra ${selectedIngredient.current_stock} en stock. ¿Deseas continuar?`)
            if (!confirm) return
        }

        setSaving(true)
        try {
            const { error } = await supabase
                .from('inventory_waste')
                .insert([{
                    ingredient_id: ingredientId,
                    quantity: quantity,
                    reason: reason,
                    cost_at_waste: selectedIngredient?.cost_per_unit,
                    notes: notes,
                    reported_by: (await supabase.auth.getUser()).data.user?.id
                }])

            if (error) throw error

            router.push('/admin/inventory')
        } catch (err: any) {
            alert("Error: " + err.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
    )

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-10 font-sans">
            <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700">

                {/* 🔝 HEADER */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <Link href="/admin/inventory">
                            <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 hover:bg-white hover:text-black transition-all">
                                <ArrowLeft className="w-6 h-6" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-4xl font-black tracking-tighter uppercase italic">Registro de <span className="text-rose-500">Mermas</span></h1>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1 italic">Control de desperdicios y pérdidas de inventario</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

                    {/* 📝 FORM LEFT */}
                    <div className="lg:col-span-3 space-y-8">
                        <div className="bg-[#111] p-10 rounded-[3rem] border border-white/5 space-y-10 shadow-3xl">

                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">¿Qué insumo se perdió?</label>
                                <select
                                    value={ingredientId}
                                    onChange={(e) => setIngredientId(e.target.value)}
                                    className="w-full h-16 px-6 rounded-2xl bg-black border border-white/5 focus:border-rose-500 outline-none font-black text-xs uppercase tracking-widest appearance-none transition-all"
                                >
                                    <option value="">Seleccionar Insumo...</option>
                                    {ingredients.map(ing => (
                                        <option key={ing.id} value={ing.id}>
                                            {ing.name.toUpperCase()} (Stock: {ing.current_stock} {ing.unit})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Cantidad Perdida ({selectedIngredient?.unit || 'N/A'})</label>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={quantity || ''}
                                        onChange={(e) => setQuantity(Number(e.target.value))}
                                        className="w-full h-16 px-6 rounded-2xl bg-black border border-white/5 focus:border-rose-500 outline-none font-black text-xl italic transition-all"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Motivo de la merma</label>
                                    <select
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        className="w-full h-16 px-6 rounded-2xl bg-black border border-white/5 focus:border-rose-500 outline-none font-black text-xs uppercase tracking-widest appearance-none transition-all"
                                    >
                                        {WASTE_REASONS.map(r => <option key={r.id} value={r.id}>{r.icon} {r.label}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Observaciones (Opcional)</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Detalla qué sucedió..."
                                    className="w-full h-32 p-6 rounded-2xl bg-black border border-white/5 focus:border-rose-500 outline-none font-bold text-sm italic transition-all resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 📊 SUMMARY RIGHT */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-[#111] p-10 rounded-[3rem] border border-white/5 shadow-3xl space-y-10 sticky top-10">

                            <div className="space-y-4 text-center">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 italic">Impacto Económico</p>
                                <div className="space-y-1">
                                    <h2 className="text-6xl font-black italic tracking-tighter text-rose-500 leading-none">
                                        -${totalLostValue.toLocaleString()}
                                    </h2>
                                    <p className="text-[10px] font-black text-rose-500/50 uppercase tracking-widest italic">PÉRDIDA ESTIMADA</p>
                                </div>
                            </div>

                            <div className="space-y-6 pt-10 border-t border-white/5">
                                <div className="p-6 rounded-[2rem] bg-rose-500/5 border border-rose-500/10 flex gap-4">
                                    <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0" />
                                    <p className="text-[10px] font-black text-rose-500 leading-relaxed uppercase italic">
                                        Este registro es irreversible y afectará directamente la rentabilidad del periodo. El stock se descontará de inmediato.
                                    </p>
                                </div>
                            </div>

                            <Button
                                onClick={handleSubmit}
                                disabled={saving || !ingredientId || quantity <= 0}
                                className="w-full h-20 bg-rose-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] italic hover:bg-rose-500 transition-all shadow-2xl shadow-rose-900/20 gap-3"
                            >
                                {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                                {saving ? 'CONFIRMANDO...' : 'REGISTRAR PÉRDIDA'}
                            </Button>

                            <Button variant="ghost" className="w-full h-16 text-gray-600 hover:text-white uppercase text-[9px] font-black tracking-widest italic gap-2 transition-all">
                                <History className="w-4 h-4" /> VER HISTORIAL DE MERMAS
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
