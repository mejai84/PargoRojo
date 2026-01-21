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
}

export default function TablesAdminPage() {
    const [tables, setTables] = useState<Table[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedTable, setSelectedTable] = useState<Table | null>(null)

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
                            Descargar Todos los QR
                        </Button>
                        <Button className="gap-2">
                            <Plus className="w-4 h-4" />
                            Nueva Mesa
                        </Button>
                    </div>
                </div>

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
                                    <h3 className="text-xl font-bold mb-1">{table.table_name}</h3>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <MapPin className="w-4 h-4" />
                                        {table.location}
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
                                    className="gap-2"
                                >
                                    <Edit className="w-4 h-4" />
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
        </div>
    )
}
