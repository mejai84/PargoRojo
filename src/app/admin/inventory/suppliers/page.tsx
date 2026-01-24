"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
    Plus,
    Users,
    Mail,
    Phone,
    MapPin,
    ArrowLeft,
    Search,
    Edit,
    Trash2,
    Loader2,
    Briefcase,
    FileText,
    ExternalLink
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

type Supplier = {
    id: string
    name: string
    contact_name: string
    email: string
    phone: string
    address: string
    tax_id: string
    category: string
    notes: string
    is_active: boolean
}

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        loadSuppliers()
    }, [])

    const loadSuppliers = async () => {
        const { data, error } = await supabase
            .from('suppliers')
            .select('*')
            .eq('is_active', true)
            .order('name')

        if (data) setSuppliers(data)
        setLoading(false)
    }

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.contact_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
    )

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-10">

                {/* 🔝 HEADER */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/inventory">
                            <Button variant="ghost" size="icon" className="rounded-2xl bg-white/5 border border-white/10 hover:bg-white hover:text-black">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-4xl font-black tracking-tighter uppercase italic">Directorio de <span className="text-primary">Proveedores</span></h1>
                            <p className="text-xs text-gray-500 font-medium italic">Gestión de alianzas estratégicas y cadena de suministro</p>
                        </div>
                    </div>
                    <Button className="h-14 px-8 bg-primary text-black rounded-2xl font-black uppercase text-[10px] tracking-widest italic hover:bg-white transition-all shadow-xl shadow-primary/10 gap-2">
                        <Plus className="w-5 h-5" /> REGISTRAR PROVEEDOR
                    </Button>
                </div>

                {/* 🔍 SEARCH */}
                <div className="relative group max-w-2xl">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, contacto o rubro..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-14 pl-14 pr-6 rounded-2xl bg-[#111] border border-white/5 focus:border-primary focus:outline-none font-bold text-sm italic transition-all"
                    />
                </div>

                {/* 📋 SUPPLIERS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredSuppliers.map(supplier => (
                        <div key={supplier.id} className="bg-[#111] border border-white/5 rounded-[2.5rem] p-8 space-y-6 group hover:border-primary/30 transition-all hover:bg-black/40 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-all text-primary">
                                <Briefcase className="w-20 h-20" />
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-start relative z-10">
                                    <div className="space-y-1">
                                        <span className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-lg text-[8px] font-black text-primary tracking-widest uppercase italic">
                                            {supplier.category || 'SIN RUBRO'}
                                        </span>
                                        <h2 className="text-2xl font-black italic uppercase tracking-tighter group-hover:text-primary transition-colors">
                                            {supplier.name}
                                        </h2>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-white/5 border border-white/5 hover:bg-white hover:text-black">
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4">
                                    <div className="flex items-center gap-3 text-sm text-gray-400">
                                        <Users className="w-4 h-4 text-primary" />
                                        <span className="font-bold">{supplier.contact_name || 'Sin contacto directo'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-400">
                                        <Mail className="w-4 h-4 text-primary" />
                                        <span className="font-medium truncate">{supplier.email || 'No registra email'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-400">
                                        <Phone className="w-4 h-4 text-primary" />
                                        <span className="font-black italic">{supplier.phone || 'No registra teléfono'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-400">
                                        <MapPin className="w-4 h-4 text-primary" />
                                        <span className="text-xs truncate">{supplier.address || 'Sin dirección física'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-white/5 flex gap-2">
                                <Button variant="ghost" className="flex-1 h-12 rounded-xl bg-white/2 border border-white/5 text-[10px] font-black uppercase tracking-widest italic hover:bg-white hover:text-black">
                                    VER PRODUCTOS
                                </Button>
                                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl bg-white/2 border border-white/5 text-gray-500 hover:text-rose-500 hover:bg-rose-500/10">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredSuppliers.length === 0 && (
                    <div className="text-center py-24 bg-[#111] rounded-[3rem] border border-white/5 border-dashed">
                        <Users className="w-16 h-16 text-gray-800 mx-auto mb-6" />
                        <h3 className="text-xl font-black italic uppercase tracking-tighter">No hay proveedores registrados</h3>
                        <p className="text-gray-500 font-medium italic">Empieza a construir tu red de suministros para un control total.</p>
                        <Button className="mt-8 h-12 px-8 bg-primary text-black rounded-xl font-black uppercase text-[10px] tracking-widest italic">NUEVO PROVEEDOR</Button>
                    </div>
                )}
            </div>
        </div>
    )
}
