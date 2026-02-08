'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { openCashbox, getPosStatus } from "@/actions/pos"
import { supabase } from "@/lib/supabase/client"
import { Loader2, Wallet, ArrowRight, Banknote, ShieldCheck } from "lucide-react"

export default function OpenBoxPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [validating, setValidating] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [shiftId, setShiftId] = useState<string | null>(null)
    const [amount, setAmount] = useState<string>("")
    const [notes, setNotes] = useState("")

    // Validar que tenga turno activo antes de permitir abrir caja
    useEffect(() => {
        const validateState = async () => {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/login')
                return
            }

            setUser(user)

            // Usamos la Server Action para validar estado fiable
            const status = await getPosStatus(user.id)

            if (!status.hasActiveShift) {
                alert("Debes iniciar turno primero")
                router.push('/admin/cashier/start-shift')
                return
            }

            if (status.hasOpenCashbox) {
                // Ya tiene caja, ir al dashboard
                router.push('/admin/cashier')
                return
            }

            setShiftId(status.activeShift.id)
            setValidating(false)
        }
        validateState()
    }, [router])

    const handleOpenBox = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!shiftId || !user || !amount) return

        setLoading(true)
        try {
            const result = await openCashbox(user.id, shiftId, parseFloat(amount), notes)
            if (result.success) {
                router.push("/admin/cashier") // Éxito, ir al dashboard
            } else {
                alert("Atención: " + (result.error || "Error al abrir caja"))
                setLoading(false)
            }
        } catch (error: any) {
            alert("Error crítico: " + error.message)
            setLoading(false)
        }
    }

    if (validating) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4">
            <div className="max-w-lg w-full space-y-8 animate-in fade-in zoom-in-95 duration-500">

                <div className="text-center space-y-4">
                    <div className="inline-flex p-4 rounded-3xl bg-emerald-500/10 text-emerald-500 mb-4 ring-1 ring-emerald-500/20">
                        <Wallet className="w-12 h-12" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter uppercase italic text-slate-900">
                        Apertura de <span className="text-emerald-600">Caja</span>
                    </h1>
                    <p className="text-slate-500 font-medium max-w-xs mx-auto">
                        Ingresa el saldo base inicial para comenzar a operar.
                    </p>
                </div>

                <form onSubmit={handleOpenBox} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Saldo Inicial (Base)</label>
                        <div className="relative group">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-black text-emerald-600 italic">$</span>
                            <input
                                type="number"
                                autoFocus
                                required
                                min="0"
                                className="w-full h-24 bg-white border-2 border-slate-200 group-focus-within:border-emerald-500 rounded-[2rem] pl-12 pr-6 outline-none text-5xl font-black text-slate-900 text-center transition-all placeholder:text-slate-200 shadow-sm"
                                placeholder="0"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Observaciones (Opcional)</label>
                        <textarea
                            className="w-full h-24 bg-white border border-slate-200 focus:border-emerald-500 rounded-2xl p-4 outline-none resize-none text-sm font-medium transition-all shadow-sm"
                            placeholder="Ej: Entrega de base turno anterior..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    <div className="pt-4">
                        <Button
                            type="submit"
                            disabled={loading || !amount}
                            className="w-full h-20 rounded-[2rem] bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-lg tracking-widest italic shadow-xl shadow-emerald-600/20 hover:scale-[1.02] transition-all"
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "CONFIRMAR APERTURA"}
                            {!loading && <ArrowRight className="w-6 h-6 ml-2" />}
                        </Button>

                        <p className="text-center mt-6 text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center justify-center gap-2">
                            <ShieldCheck className="w-3 h-3 text-emerald-500" /> Transacción Segura y Auditada
                        </p>
                    </div>
                </form>
            </div>
        </div>
    )
}
