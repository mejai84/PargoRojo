"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Plus, QrCode, Download, Edit, Trash2, MapPin, Users, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import QRCodeStyling from "qr-code-styling"

type Table = {
    id: string
    table_number: number
    table_name: string
    capacity: number
    qr_code: string
    status: string
    location: string
    active: boolean
    parent_table_id?: string
    is_merged?: boolean
}

export default function TablesAdminPage() {
    const [tables, setTables] = useState<Table[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedTable, setSelectedTable] = useState<Table | null>(null)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState<string | null>(null)

    useEffect(() => {
        loadTables()
    }, [])

    const loadTables = async () => {
        const { data, error } = await supabase
            .from('tables')
            .select('*')
            .order('table_number', { ascending: true })

        if (!error && data) {
            setTables(data)
        }
        setLoading(false)
    }

    const generateQRCode = (table: Table) => {
        const qrCode = new QRCodeStyling({
            width: 400,
            height: 400,
            type: "svg",
            data: `${window.location.origin}/menu-qr?table=${table.qr_code}`,
            image: "/images/logo.jpg",
            dotsOptions: {
                color: "#ff6b35",
                type: "rounded"
            },
            backgroundOptions: {
                color: "#000000",
            },
            imageOptions: {
                crossOrigin: "anonymous",
                margin: 10,
                imageSize: 0.4
            },
            cornersSquareOptions: {
                color: "#ff6b35",
                type: "extra-rounded"
            },
            cornersDotOptions: {
                color: "#ff6b35",
                type: "dot"
            }
        })

        qrCode.download({
            name: `mesa-${table.table_number}-qr`,
            extension: "png"
        })
    }

    const downloadAllQRCodes = () => {
        tables.forEach((table, index) => {
            setTimeout(() => generateQRCode(table), index * 500)
        })
    }

    const updateTableStatus = async (tableId: string, status: string) => {
        await supabase
            .from('tables')
            .update({ status })
            .eq('id', tableId)

        loadTables()
    }

    const deleteTable = async (table: Table) => {
        if (!confirm(`¿Estás seguro de que quieres eliminar la ${table.table_name}? Esta acción no se puede deshacer.`)) return

        setIsDeleting(table.id)
        const { error } = await supabase
            .from('tables')
            .delete()
            .eq('id', table.id)

        if (error) {
            alert("Error al eliminar la mesa: " + error.message)
        } else {
            loadTables()
        }
        setIsDeleting(null)
    }

    const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!selectedTable) return

        const formData = new FormData(e.currentTarget)
        const { error } = await supabase
            .from('tables')
            .update({
                table_number: parseInt(formData.get('table_number') as string),
                table_name: formData.get('table_name'),
                capacity: parseInt(formData.get('capacity') as string),
                location: formData.get('location'),
                parent_table_id: formData.get('parent_table_id') || null,
                is_merged: !!formData.get('parent_table_id'),
                active: formData.get('active') === 'on'
            })
            .eq('id', selectedTable.id)

        if (error) {
            alert("Error al actualizar la mesa: " + error.message)
        } else {
            setIsEditModalOpen(false)
            setSelectedTable(null)
            loadTables()
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'available': return 'bg-green-500/20 text-green-500 border-green-500/30'
            case 'occupied': return 'bg-red-500/20 text-red-500 border-red-500/30'
            case 'reserved': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'
            case 'cleaning': return 'bg-blue-500/20 text-blue-500 border-blue-500/30'
            default: return 'bg-gray-500/20 text-gray-500 border-gray-500/30'
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'available': return 'Disponible'
            case 'occupied': return 'Ocupada'
            case 'reserved': return 'Reservada'
            case 'cleaning': return 'Limpieza'
            default: return status
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/admin">
                            <Button variant="outline" size="icon">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold">Gestión de Mesas</h1>
                            <p className="text-muted-foreground">Administra las mesas y códigos QR</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={downloadAllQRCodes} variant="outline" className="gap-2">
                            <Download className="w-4 h-4" />
                            Descargar QR
                        </Button>
                        <Button
                            className="gap-2"
                            onClick={() => setIsAddModalOpen(true)}
                        >
                            <Plus className="w-4 h-4" />
                            Nueva Mesa
                        </Button>
                    </div>
                </div>

                {/* Modal para Nueva Mesa */}
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-card border border-white/10 w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                            <h2 className="text-2xl font-bold mb-6 text-white uppercase tracking-tighter">Agregar Nueva Mesa</h2>
                            <form className="space-y-4" onSubmit={async (e) => {
                                e.preventDefault()
                                try {
                                    const formData = new FormData(e.currentTarget)
                                    const table_number = parseInt(formData.get('table_number') as string)

                                    // Check if number exists
                                    const { data: existing } = await supabase.from('tables').select('id').eq('table_number', table_number).single()
                                    if (existing) {
                                        alert("El número de mesa ya existe.")
                                        return
                                    }

                                    const { error } = await supabase.from('tables').insert([{
                                        table_number,
                                        table_name: formData.get('table_name'),
                                        capacity: parseInt(formData.get('capacity') as string),
                                        location: formData.get('location'),
                                        parent_table_id: formData.get('parent_table_id') || null,
                                        is_merged: !!formData.get('parent_table_id'),
                                        qr_code: `TABLE-${table_number}-${Date.now()}`,
                                        status: 'available',
                                        active: true
                                    }])

                                    if (error) throw error

                                    setIsAddModalOpen(false)
                                    loadTables()
                                } catch (error: any) {
                                    console.error(error)
                                    alert("Error al crear mesa: " + (error.message || "Error desconocido. Verifique los permisos RLS."))
                                }
                            }}>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Número de Mesa</label>
                                    <input name="table_number" type="number" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-primary" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Nombre Comercial</label>
                                    <input name="table_name" type="text" placeholder="ej: Mesa 1, VIP 2" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-primary" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Capacidad</label>
                                        <input name="capacity" type="number" defaultValue={4} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-primary" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Ubicación</label>
                                        <select name="location" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-primary text-white">
                                            <option value="Interior" className="bg-slate-900">Interior</option>
                                            <option value="Terraza" className="bg-slate-900">Terraza</option>
                                            <option value="Barra" className="bg-slate-900">Barra</option>
                                            <option value="Salon VIP" className="bg-slate-900">Salón VIP</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Unir con (Mesa Principal)</label>
                                    <select name="parent_table_id" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-primary text-white">
                                        <option value="" className="bg-slate-900">-- Ninguna (Mesa Independiente) --</option>
                                        {tables.filter(t => !t.is_merged).map(t => (
                                            <option key={t.id} value={t.id} className="bg-slate-900">{t.table_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsAddModalOpen(false)}>Cancelar</Button>
                                    <Button type="submit" className="flex-1 font-bold">Guardar Mesa</Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                {/* Modal para Editar Mesa */}
                {isEditModalOpen && selectedTable && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-card border border-white/10 w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                            <h2 className="text-2xl font-bold mb-6 text-white uppercase tracking-tighter">Editar {selectedTable.table_name}</h2>
                            <form className="space-y-4" onSubmit={handleEditSubmit}>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Número de Mesa</label>
                                    <input name="table_number" type="number" defaultValue={selectedTable.table_number} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-primary text-white" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Nombre Comercial</label>
                                    <input name="table_name" type="text" defaultValue={selectedTable.table_name} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-primary text-white" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Capacidad</label>
                                        <input name="capacity" type="number" defaultValue={selectedTable.capacity} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-primary text-white" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Ubicación</label>
                                        <select name="location" defaultValue={selectedTable.location} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-primary text-white">
                                            <option value="Interior" className="bg-slate-900">Interior</option>
                                            <option value="Terraza" className="bg-slate-900">Terraza</option>
                                            <option value="Barra" className="bg-slate-900">Barra</option>
                                            <option value="Salon VIP" className="bg-slate-900">Salón VIP</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white">Unir con (Mesa Principal)</label>
                                    <select name="parent_table_id" defaultValue={selectedTable.parent_table_id || ""} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-primary text-white">
                                        <option value="" className="bg-slate-900">-- Ninguna (Mesa Independiente) --</option>
                                        {tables.filter(t => t.id !== selectedTable.id && !t.parent_table_id).map(t => (
                                            <option key={t.id} value={t.id} className="bg-slate-900">{t.table_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-center gap-2 py-2">
                                    <input type="checkbox" name="active" defaultChecked={selectedTable.active} id="active-check" className="w-4 h-4 accent-primary" />
                                    <label htmlFor="active-check" className="text-sm text-white">Mesa Activa (visible en el sistema)</label>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <Button type="button" variant="ghost" className="flex-1" onClick={() => { setIsEditModalOpen(false); setSelectedTable(null); }}>Cancelar</Button>
                                    <Button type="submit" className="flex-1 font-bold">Actualizar Mesa</Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="p-6 rounded-2xl bg-card border border-white/10">
                        <div className="text-sm text-muted-foreground mb-1">Total Mesas</div>
                        <div className="text-3xl font-bold">{tables.length}</div>
                    </div>
                    <div className="p-6 rounded-2xl bg-green-500/10 border border-green-500/20">
                        <div className="text-sm text-green-600 mb-1">Disponibles</div>
                        <div className="text-3xl font-bold text-green-500">
                            {tables.filter(t => t.status === 'available').length}
                        </div>
                    </div>
                    <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20">
                        <div className="text-sm text-red-600 mb-1">Ocupadas</div>
                        <div className="text-3xl font-bold text-red-500">
                            {tables.filter(t => t.status === 'occupied').length}
                        </div>
                    </div>
                    <div className="p-6 rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
                        <div className="text-sm text-yellow-600 mb-1">Reservadas</div>
                        <div className="text-3xl font-bold text-yellow-500">
                            {tables.filter(t => t.status === 'reserved').length}
                        </div>
                    </div>
                </div>

                {/* Tables Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {tables.map(table => (
                        <div
                            key={table.id}
                            className="p-6 rounded-2xl bg-card border border-white/10 hover:border-white/20 transition-all"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-xl font-bold mb-1">
                                        {table.table_name}
                                        {table.parent_table_id && (
                                            <span className="ml-2 text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full uppercase tracking-widest">Unida</span>
                                        )}
                                    </h3>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <MapPin className="w-4 h-4" />
                                        {table.location}
                                        {table.parent_table_id && (
                                            <span className="text-xs text-primary italic"> (→ Mesa {tables.find(t => t.id === table.parent_table_id)?.table_number})</span>
                                        )}
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(table.status)}`}>
                                    {getStatusLabel(table.status)}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                                <Users className="w-4 h-4" />
                                Capacidad: {table.capacity} personas
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    onClick={() => generateQRCode(table)}
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 gap-2"
                                >
                                    <QrCode className="w-4 h-4" />
                                    QR
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setSelectedTable(table)
                                        setIsEditModalOpen(true)
                                    }}
                                    className="gap-2"
                                >
                                    <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        deleteTable(table);
                                    }}
                                    disabled={isDeleting === table.id}
                                    className="gap-2 text-red-500 hover:bg-red-500/10 border-red-500/20"
                                >
                                    {isDeleting === table.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 pointer-events-none" />}
                                </Button>
                            </div>

                            {/* Quick Status Change */}
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <div className="text-xs text-muted-foreground mb-2">Cambiar estado:</div>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => updateTableStatus(table.id, 'available')}
                                        className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-500 hover:bg-green-500/30"
                                    >
                                        Disponible
                                    </button>
                                    <button
                                        onClick={() => updateTableStatus(table.id, 'occupied')}
                                        className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-500 hover:bg-red-500/30"
                                    >
                                        Ocupada
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div >
    )
}
