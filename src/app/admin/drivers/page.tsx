"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Loader2, UserPlus, Bike, Star, Phone, Search, MoreVertical, X, CheckCircle, Ban } from "lucide-react"

export default function DriversPage() {
    const [loading, setLoading] = useState(true)
    const [drivers, setDrivers] = useState<any[]>([])
    const [users, setUsers] = useState<any[]>([])
    const [showAddModal, setShowAddModal] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")

    // New Driver Form State
    const [newDriver, setNewDriver] = useState({
        user_id: "",
        full_name: "",
        phone: "",
        vehicle_type: "motorcycle",
        license_plate: ""
    })

    useEffect(() => {
        fetchDrivers()
    }, [])

    const fetchDrivers = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('delivery_drivers')
            .select('*')
            .order('created_at', { ascending: false })

        if (data) setDrivers(data)
        setLoading(false)
    }

    const fetchPotentialDrivers = async () => {
        // Fetch users who are NOT already drivers
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, email, phone')
            .order('full_name')

        // Filter out existing drivers
        const existingDriverIds = drivers.map(d => d.user_id)
        const potential = profiles?.filter(p => !existingDriverIds.includes(p.id)) || []

        setUsers(potential)
    }

    const openAddModal = () => {
        fetchPotentialDrivers()
        setShowAddModal(true)
    }

    const handleCreateDriver = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const driverToInsert = {
                ...newDriver,
                user_id: newDriver.user_id || null // Convert empty string to null
            }

            const { error } = await supabase
                .from('delivery_drivers')
                .insert([driverToInsert])

            if (error) throw error

            setShowAddModal(false)
            setNewDriver({
                user_id: "",
                full_name: "",
                phone: "",
                vehicle_type: "motorcycle",
                license_plate: ""
            })
            fetchDrivers()
        } catch (error: any) {
            alert('Error: ' + error.message)
        }
    }

    const toggleStatus = async (driverId: string, currentStatus: boolean) => {
        await supabase
            .from('delivery_drivers')
            .update({ is_active: !currentStatus })
            .eq('id', driverId)

        fetchDrivers() // Refresh
    }

    const filteredDrivers = drivers.filter(d =>
        d.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.phone?.includes(searchQuery)
    )

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Bike className="w-8 h-8 text-primary" />
                        Gestión de Repartidores
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Control de flota, asignaciones y estado de repartidores
                    </p>
                </div>
                <Button onClick={openAddModal} className="h-12 px-6 text-lg font-bold gap-2">
                    <UserPlus className="w-5 h-5" />
                    Nuevo Repartidor
                </Button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6 flex gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        placeholder="Buscar por nombre o teléfono..."
                        className="pl-10 h-12 text-lg w-full rounded-lg border px-3"
                        value={searchQuery}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDrivers.map(driver => (
                        <div key={driver.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                        <Bike className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{driver.full_name}</h3>
                                        <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase ${driver.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {driver.is_active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>
                                </div>
                                <button className="text-gray-400 hover:text-gray-600">
                                    <MoreVertical className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Phone className="w-4 h-4" />
                                    <span>{driver.phone}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Star className="w-4 h-4 text-yellow-500" />
                                    <span>{driver.rating || 5.0} Rating</span>
                                    <span className="text-gray-300">|</span>
                                    <span className="font-bold">{driver.total_deliveries} Entregas</span>
                                </div>
                                <div className="text-sm text-gray-500 bg-gray-50 p-2 rounded-lg">
                                    🚗 {driver.vehicle_type} • Placa: {driver.license_plate || 'N/A'}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => toggleStatus(driver.id, driver.is_active)}
                                >
                                    {driver.is_active ? 'Desactivar' : 'Activar'}
                                </Button>
                                <Button variant="secondary" className="flex-1">
                                    Editar
                                </Button>
                            </div>
                        </div>
                    ))}

                    {filteredDrivers.length === 0 && (
                        <div className="col-span-full p-12 text-center text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                            No se encontraron repartidores
                        </div>
                    )}
                </div>
            )}

            {/* Modal Add Driver */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Nuevo Repartidor</h2>
                            <button onClick={() => setShowAddModal(false)}>
                                <X className="w-6 h-6 text-gray-400" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateDriver} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold">Seleccionar Usuario Existente (Opcional)</label>
                                <select
                                    className="w-full h-10 rounded-lg border px-3"
                                    onChange={(e) => {
                                        const user = users.find(u => u.id === e.target.value)
                                        if (user) {
                                            setNewDriver({
                                                ...newDriver,
                                                user_id: user.id,
                                                full_name: user.full_name,
                                                phone: user.phone || ''
                                            })
                                        }
                                    }}
                                >
                                    <option value="">-- Seleccionar Usuario --</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold">Nombre Completo *</label>
                                <input
                                    className="w-full h-10 rounded-lg border px-3"
                                    required
                                    value={newDriver.full_name}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDriver({ ...newDriver, full_name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold">Teléfono *</label>
                                <input
                                    className="w-full h-10 rounded-lg border px-3"
                                    required
                                    value={newDriver.phone}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDriver({ ...newDriver, phone: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold">Vehículo</label>
                                    <select
                                        className="w-full h-10 rounded-lg border px-3"
                                        value={newDriver.vehicle_type}
                                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewDriver({ ...newDriver, vehicle_type: e.target.value })}
                                    >
                                        <option value="motorcycle">Moto</option>
                                        <option value="bike">Bicicleta</option>
                                        <option value="car">Carro</option>
                                        <option value="foot">A pie</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold">Placa</label>
                                    <input
                                        className="w-full h-10 rounded-lg border px-3"
                                        value={newDriver.license_plate}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDriver({ ...newDriver, license_plate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full h-12 text-lg font-bold mt-4">
                                Guardar Repartidor
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
