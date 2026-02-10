"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { useRestaurant } from "@/providers/RestaurantProvider"
import {
    Truck,
    Plus,
    Search,
    Mail,
    Phone,
    MapPin,
    MoreVertical,
    Edit2,
    Trash2,
    ExternalLink,
    Package,
    Building2
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface Supplier {
    id: string
    name: string
    contact_name: string
    email: string
    phone: string
    address: string
    tax_id: string
    category: string
    is_active: boolean
}

export default function SuppliersPage() {
    const { restaurant } = useRestaurant()
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        const fetchSuppliers = async () => {
            if (!restaurant) return
            try {
                setLoading(true)
                const { data, error } = await supabase
                    .from('suppliers')
                    .select('*')
                    .eq('restaurant_id', restaurant.id)
                    .order('name')

                if (error) throw error
                setSuppliers(data || [])
            } catch (error) {
                console.error("Error fetching suppliers:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchSuppliers()
    }, [restaurant])

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.category?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-slate-900/40 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 font-black italic text-[10px] uppercase tracking-[0.2em] border border-orange-500/20">
                        <Truck className="w-3 h-3" />
                        GESTIÓN DE ABASTECIMIENTO
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase leading-none">
                            PROVEEDORES <span className="text-orange-500 italic">SaaS</span>
                        </h1>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">
                            Directorio centralizado de suministros y contactos clave
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-orange-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar proveedor..."
                            className="w-full md:w-64 h-12 pl-12 pr-4 rounded-2xl bg-white/[0.02] border border-white/10 outline-none focus:border-orange-500/30 text-xs font-bold uppercase tracking-widest placeholder:text-slate-700 transition-all text-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button className="h-12 px-6 rounded-2xl bg-orange-600 hover:bg-orange-700 text-black font-black uppercase italic tracking-widest text-[10px] gap-2 shadow-lg shadow-orange-500/20">
                        <Plus className="w-4 h-4" />
                        NUEVO PROVEEDOR
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: "Total Proveedores", value: suppliers.length, icon: Building2, color: "text-white" },
                    { label: "Activos", value: suppliers.filter(s => s.is_active).length, icon: Package, color: "text-emerald-500" },
                    { label: "Categorías", value: new Set(suppliers.map(s => s.category)).size, icon: Truck, color: "text-orange-500" },
                    { label: "Pendientes", value: 0, icon: ShieldAlert, color: "text-rose-500" },
                ].map((stat, i) => (
                    <div key={i} className="bg-slate-900/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white/5 shadow-2xl flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
                            <p className={`text-2xl font-black italic tracking-tighter uppercase ${stat.color}`}>{stat.value}</p>
                        </div>
                        <stat.icon className={`w-8 h-8 ${stat.color} opacity-20`} />
                    </div>
                ))}
            </div>

            {/* Grid de Proveedores */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-64 bg-slate-900/10 rounded-[2.5rem] border border-white/5 animate-pulse" />
                    ))
                ) : filteredSuppliers.length > 0 ? (
                    filteredSuppliers.map((supplier) => (
                        <div key={supplier.id} className="bg-slate-900/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 shadow-2xl hover:border-orange-500/30 transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:bg-orange-500/5 transition-colors" />

                            <div className="relative z-10 space-y-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <span className="px-3 py-1 rounded-full bg-white/5 text-slate-400 text-[9px] font-black uppercase tracking-widest border border-white/5">
                                            {supplier.category || "General"}
                                        </span>
                                        <h3 className="text-xl font-black italic tracking-tighter text-white uppercase leading-none">
                                            {supplier.name}
                                        </h3>
                                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                                            NIT/ID: {supplier.tax_id || "No registrado"}
                                        </p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/5">
                                        <MoreVertical className="w-4 h-4 text-slate-600" />
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-slate-400">
                                        <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                                            <User className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="text-xs font-bold uppercase tracking-wide truncate">{supplier.contact_name || "Sin contacto"}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-400">
                                        <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                                            <Phone className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="text-xs font-bold uppercase tracking-wide">{supplier.phone || "---"}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-400">
                                        <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                                            <Mail className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="text-xs font-bold uppercase tracking-wide truncate">{supplier.email || "---"}</span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <div className={`w-2 h-2 rounded-full ${supplier.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                            {supplier.is_active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>
                                    <Button variant="ghost" className="text-[9px] font-black uppercase italic tracking-widest text-orange-500 gap-2 hover:bg-orange-500/10 rounded-xl">
                                        Ver Historial
                                        <ExternalLink className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-20 bg-slate-900/20 rounded-[2.5rem] border border-dashed border-white/5 flex flex-col items-center gap-4">
                        <Truck className="w-16 h-16 text-slate-800" />
                        <div className="text-center space-y-1">
                            <p className="text-xs font-black italic text-slate-600 uppercase tracking-widest">No se encontraron proveedores</p>
                            <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest underline cursor-pointer">Registrar el primer proveedor</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// Re-importing Lucide icons to avoid missing scope
import { ShieldAlert, User } from "lucide-react"
