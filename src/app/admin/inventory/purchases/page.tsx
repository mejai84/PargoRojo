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
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white font-black italic text-[10px] uppercase tracking-[0.2em]">
                        <ShoppingBag className="w-3 h-3 text-primary" />
                        Control de Abastecimiento
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black italic tracking-tighter text-slate-900 uppercase">
                            Compras e <span className="text-primary italic">Ingresos</span>
                        </h1>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                            Registro de facturas y actualización automática de stock
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar por factura o proveedor..."
                            className="w-full md:w-64 h-12 pl-12 pr-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-primary/50 text-xs font-bold uppercase tracking-widest placeholder:text-slate-300 transition-all font-mono"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button className="h-12 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase italic tracking-widest text-[10px] gap-2">
                        <Plus className="w-4 h-4 text-primary" />
                        Nueva Compra
                    </Button>
                </div>
            </div>

            {/* Main Content Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-200">
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Factura / Fecha</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Proveedor</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Estado</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-8 py-6 h-16 bg-slate-50/20" />
                                    </tr>
                                ))
                            ) : filteredPurchases.length > 0 ? (
                                filteredPurchases.map((purchase) => (
                                    <tr key={purchase.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black italic text-slate-900 uppercase">
                                                    #{purchase.invoice_number || "S/N"}
                                                </span>
                                                <div className="flex items-center gap-1.5 pt-0.5">
                                                    <Calendar className="w-3 h-3 text-slate-400" />
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        {format(new Date(purchase.created_at), "dd MMM, yyyy", { locale: es })}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <Truck className="w-4 h-4 text-primary opacity-50" />
                                                <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                                                    {purchase.suppliers?.name || "Proveedor Desconocido"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${purchase.status === 'COMPLETED'
                                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                                    : 'bg-amber-100 text-amber-700 border-amber-200'
                                                }`}>
                                                {purchase.status === 'COMPLETED' ? 'Recibido' : 'Pendiente'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-xs font-black text-slate-900">
                                                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(purchase.total_amount)}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="icon" variant="ghost" className="rounded-xl hover:text-primary hover:bg-primary/5">
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="rounded-xl hover:text-slate-900 hover:bg-slate-100">
                                                    <FileText className="w-4 h-4" />
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
