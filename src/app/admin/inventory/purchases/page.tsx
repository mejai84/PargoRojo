"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { useRestaurant } from "@/providers/RestaurantProvider"
import {
    ShoppingBag,
    Plus,
    Search,
    Calendar,
    Truck,
    DollarSign,
    Eye,
    FileText,
    AlertTriangle
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"

interface Purchase {
    id: string
    supplier_id: string
    total_amount: number
    status: string
    invoice_number: string
    created_at: string
    suppliers: {
        name: string
    }
}

export default function PurchasesPage() {
    const { restaurant } = useRestaurant()
    const [purchases, setPurchases] = useState<Purchase[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        const fetchPurchases = async () => {
            if (!restaurant) return
            try {
                setLoading(true)
                const { data, error } = await supabase
                    .from('inventory_purchases')
                    .select(`
            *,
            suppliers (name)
          `)
                    .eq('restaurant_id', restaurant.id)
                    .order('created_at', { ascending: false })

                if (error) throw error
                setPurchases(data || [])
            } catch (error) {
                console.error("Error fetching purchases:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchPurchases()
    }, [restaurant])

    const filteredPurchases = purchases.filter(p =>
        p.suppliers?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-slate-900/40 backdrop-blur-3xl p-10 rounded-[2.5rem] border border-white/5 shadow-2xl">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-white/5 text-orange-500 font-black italic text-[10px] uppercase tracking-[0.3em]">
                        <ShoppingBag className="w-4 h-4 text-orange-600" />
                        Control de Abastecimiento
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-5xl font-black italic tracking-tighter text-white uppercase leading-none">
                            Compras e <span className="text-orange-500 italic">Ingresos</span>
                        </h1>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs italic">
                            Registro de facturas y actualización automática de stock
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 group-focus-within:text-orange-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="BUSCAR POR FACTURA O PROVEEDOR..."
                            className="w-full md:w-80 h-14 pl-14 pr-6 rounded-[1.5rem] bg-white/[0.02] border border-white/5 outline-none focus:border-orange-500/30 text-[10px] font-black uppercase tracking-[0.2em] text-white placeholder:text-slate-800 transition-all italic"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button className="h-14 px-8 rounded-[1.5rem] bg-orange-600 text-black hover:bg-orange-500 font-black uppercase italic tracking-widest text-[11px] gap-3 border-none shadow-3xl shadow-orange-500/10 active:scale-95 transition-all">
                        <Plus className="w-5 h-5 text-black" />
                        Nueva Compra
                    </Button>
                </div>
            </div>

            {/* Main Content Table */}
            <div className="bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-700">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-white/[0.02] border-b border-white/5">
                                <th className="px-10 py-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Factura / Fecha</th>
                                <th className="px-10 py-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Proveedor</th>
                                <th className="px-10 py-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Estado</th>
                                <th className="px-10 py-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Total</th>
                                <th className="px-10 py-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-slate-400 font-bold">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-8 py-6 h-16 bg-slate-50/20" />
                                    </tr>
                                ))
                            ) : filteredPurchases.length > 0 ? (
                                filteredPurchases.map((purchase) => (
                                    <tr key={purchase.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-10 py-8">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-black italic text-white uppercase tracking-tighter">
                                                    #{purchase.invoice_number || "S/N"}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-3 h-3 text-orange-500/60" />
                                                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic leading-none">
                                                        {format(new Date(purchase.created_at), "dd MMM, yyyy", { locale: es })}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-3">
                                                <Truck className="w-4 h-4 text-orange-500/40" />
                                                <span className="text-[11px] font-black text-slate-300 uppercase tracking-[0.1em] italic">
                                                    {purchase.suppliers?.name || "Proveedor Desconocido"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] italic border ${purchase.status === 'COMPLETED'
                                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                }`}>
                                                {purchase.status === 'COMPLETED' ? 'Recibido' : 'Pendiente'}
                                            </span>
                                        </td>
                                        <td className="px-10 py-8">
                                            <span className="text-base font-black italic text-orange-500">
                                                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(purchase.total_amount)}
                                            </span>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <div className="flex items-center justify-end gap-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="icon" variant="ghost" className="rounded-xl h-10 w-10 hover:text-orange-500 hover:bg-orange-500/10 transition-all active:scale-90">
                                                    <Eye className="w-5 h-5" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="rounded-xl h-10 w-10 hover:text-white hover:bg-white/5 transition-all active:scale-90">
                                                    <FileText className="w-5 h-5" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                                                <ShoppingBag className="w-8 h-8 text-slate-200" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs font-black italic text-slate-400 uppercase tracking-widest">No hay registros de compras</p>
                                                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest underline cursor-pointer">Registrar el primer ingreso de stock</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
