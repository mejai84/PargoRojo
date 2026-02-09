"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
    Loader2,
    UserPlus,
    Bike,
    Star,
    Phone,
    Search,
    MoreVertical,
    X,
    CheckCircle,
    Ban,
    ArrowLeft,
    ShieldCheck,
    Zap,
    Briefcase,
    Activity,
    ChevronRight,
    Truck,
    MapPin,
    Smartphone,
    CreditCard,
    Signal,
    Award
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

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
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, email, phone')
            .order('full_name')

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
                user_id: newDriver.user_id || null
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

        fetchDrivers()
    }

    const filteredDrivers = drivers.filter(d =>
        d.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.phone?.includes(searchQuery)
    )

    return (
        <div className="min-h-screen bg-transparent text-foreground p-4 md:p-12 font-sans selection:bg-primary selection:text-primary-foreground relative overflow-hidden">

            {/* 🌌 AMBIANCE LAYER */}
            <div className="fixed top-0 left-0 w-full h-[600px] bg-gradient-to-b from-primary/10 via-primary/[0.02] to-transparent pointer-events-none z-0" />
            <div className="fixed -top-40 -right-40 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none opacity-40 z-0 animate-pulse" />

            <div className="max-w-[1600px] mx-auto space-y-16 animate-in fade-in duration-1000 relative z-10">

                {/* 🛵 FLEET COMMAND HEADER */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-12 border-b border-border/50 pb-12">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-10">
                        <Link href="/admin">
                            <Button variant="ghost" size="icon" className="h-20 w-20 rounded-[2.5rem] bg-card border border-border shadow-3xl hover:bg-muted active:scale-90 transition-all group overflow-hidden relative">
                                <ArrowLeft className="w-10 h-10 group-hover:-translate-x-1 transition-transform relative z-10" />
                            </Button>
                        </Link>
                        <div className="space-y-6">
                            <div className="flex flex-wrap items-center gap-4">
                                <h1 className="text-6xl md:text-7xl font-black italic tracking-tighter uppercase leading-none text-foreground">FLOTA <span className="text-primary italic">REPARTO</span></h1>
                                <div className="px-5 py-2 bg-primary/10 border-2 border-primary/20 rounded-[1.5rem] text-[11px] font-black text-primary tracking-[0.3em] italic uppercase shadow-xl animate-pulse flex items-center gap-3">
                                    <Signal className="w-4 h-4" />
                                    DRIVERS ACTIVE
                                </div>
                            </div>
                            <p className="text-[11px] text-muted-foreground font-black uppercase tracking-[0.5em] italic flex items-center gap-4 opacity-60">
                                <Bike className="w-5 h-5 text-primary" /> Gestión de Flota de Reparto, Calificaciones & Desempeño Logístico
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-8 bg-card border border-border p-3 rounded-[3rem] shadow-3xl">
                        <div className="relative group/search shrink-0">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within/search:text-primary transition-colors" />
                            <input
                                placeholder="IDENTIFICAR REPARTIDOR..."
                                className="h-20 w-[350px] bg-muted/20 border border-border rounded-[2.5rem] pl-16 pr-8 outline-none focus:border-primary font-black italic text-xs tracking-[0.2em] uppercase transition-all shadow-inner"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button
                            onClick={openAddModal}
                            className="h-20 px-12 bg-foreground text-background hover:bg-primary hover:text-primary-foreground font-black uppercase text-xs tracking-[0.4em] italic rounded-[2.5rem] shadow-3xl shadow-primary/20 transition-all gap-5 border-none group active:scale-95"
                        >
                            <UserPlus className="w-7 h-7 group-hover:scale-110 transition-transform" />
                            ALTA DE REPARTIDOR
                        </Button>
                    </div>
                </div>

                {/* 📊 FLEET DASHBOARD GRID */}
                {loading ? (
                    <div className="py-32 flex flex-col items-center justify-center gap-8">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 blur-3xl animate-pulse" />
                            <Loader2 className="w-16 h-16 text-primary animate-spin relative z-10" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary italic animate-pulse">Sincronizando Estado de Flota...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                        {filteredDrivers.map(driver => (
                            <div key={driver.id} className="bg-card border border-border rounded-[4.5rem] p-12 shadow-3xl hover:border-primary/40 transition-all duration-700 group relative overflow-hidden active:scale-[0.98]">
                                <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none -mr-8 -mt-8 group-hover:scale-110 transition-transform duration-1000">
                                    <Bike className="w-48 h-48" />
                                </div>

                                {/* STATUS INDICATOR */}
                                <div className="absolute top-10 left-10 flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted/40 border border-border/50 text-[8px] font-black uppercase italic tracking-widest relative z-10">
                                    <div className={cn("w-2 h-2 rounded-full", driver.is_active ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
                                    {driver.is_active ? "SERVICIO ACTIVO" : "FUERA DE ÓRBITA"}
                                </div>

                                <div className="mt-12 flex items-center gap-8 relative z-10">
                                    <div className="relative group/avatar">
                                        <div className="absolute inset-0 bg-primary blur-2xl opacity-0 group-hover:opacity-20 transition-opacity" />
                                        <div className="w-24 h-24 rounded-[2rem] bg-muted border-4 border-card flex items-center justify-center shadow-2xl overflow-hidden relative z-10">
                                            <Bike className="w-10 h-10 text-primary" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-3xl font-black italic uppercase tracking-tighter text-foreground group-hover:text-primary transition-colors leading-none">{driver.full_name}</h3>
                                        <div className="flex items-center gap-4 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] italic">
                                            <Phone className="w-3.5 h-3.5" /> {driver.phone}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6 mt-12 relative z-10">
                                    <div className="p-6 bg-muted/20 border border-border/50 rounded-[2rem] flex flex-col items-center justify-center gap-2 group-hover:bg-primary/5 transition-colors">
                                        <Award className="w-6 h-6 text-amber-500" />
                                        <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest italic leading-none">Rating</p>
                                        <p className="text-xl font-black italic text-foreground tracking-tighter leading-none">{driver.rating || 5.0}</p>
                                    </div>
                                    <div className="p-6 bg-muted/20 border border-border/50 rounded-[2rem] flex flex-col items-center justify-center gap-2 group-hover:bg-primary/5 transition-colors">
                                        <Briefcase className="w-6 h-6 text-primary" />
                                        <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest italic leading-none">Entregas</p>
                                        <p className="text-xl font-black italic text-foreground tracking-tighter leading-none">{driver.total_deliveries}</p>
                                    </div>
                                </div>

                                <div className="mt-8 p-6 bg-foreground rounded-[2rem] shadow-2xl relative overflow-hidden group/pre">
                                    <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover/pre:opacity-100 transition-opacity" />
                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="flex items-center gap-4">
                                            <Truck className="w-6 h-6 text-primary" />
                                            <div className="text-left">
                                                <p className="font-black italic text-background uppercase tracking-tight leading-none text-xs">{driver.vehicle_type === 'motorcycle' ? 'MOTO' : driver.vehicle_type.toUpperCase()}</p>
                                                <p className="text-[8px] font-black text-background/30 uppercase tracking-[0.2em] italic">PLACA: {driver.license_plate || 'SIN ASIGNAR'}</p>
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center">
                                            <ChevronRight className="w-4 h-4 text-white/40" />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 flex gap-4 relative z-10">
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "flex-1 h-14 rounded-2xl font-black text-[10px] uppercase italic tracking-[0.3em] transition-all active:scale-95",
                                            driver.is_active ? "border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white" : "border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white"
                                        )}
                                        onClick={() => toggleStatus(driver.id, driver.is_active)}
                                    >
                                        {driver.is_active ? (
                                            <>
                                                <Ban className="w-4 h-4 mr-3" /> SUSPENDER
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-4 h-4 mr-3" /> ACTIVAR
                                            </>
                                        )}
                                    </Button>
                                    <Button variant="ghost" className="h-14 w-14 rounded-2xl bg-muted border border-border/50 hover:bg-primary hover:text-white transition-all">
                                        <Settings className="w-6 h-6" />
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {filteredDrivers.length === 0 && (
                            <div className="col-span-full py-32 flex flex-col items-center justify-center gap-8 bg-card/40 rounded-[4.5rem] border-4 border-dashed border-border/50">
                                <Search className="w-20 h-20 text-muted-foreground/10" />
                                <div className="text-center space-y-3">
                                    <p className="text-3xl font-black italic uppercase tracking-tighter text-muted-foreground/40">Sin Registros en Cluster</p>
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/20 italic">LA BÚSQUEDA NO HA PRODUCIDO RESULTADOS EN LA FLOTA.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 🏷️ GLOBAL METRIC */}
                <div className="p-12 bg-foreground rounded-[4.5rem] text-background flex flex-col xl:flex-row items-center justify-between shadow-3xl group/metric relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover/metric:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-12 relative z-10">
                        <div className="w-24 h-24 rounded-[2.5rem] bg-background/10 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-3xl group-hover/metric:rotate-12 transition-transform duration-500">
                            <Activity className="w-12 h-12 text-primary drop-shadow-[0_0_20px_rgba(255,77,0,0.6)]" />
                        </div>
                        <div className="space-y-3 text-center xl:text-left">
                            <h4 className="text-3xl font-black italic uppercase tracking-tighter text-primary">Master Fleet Status</h4>
                            <p className="text-[11px] text-background/40 font-black uppercase tracking-[0.5em] italic leading-none">
                                SYSTEM v8.42 • KERNEL OPTIMIZED FOR REAL-TIME LOGISTICS TRACKING
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap justify-center items-center gap-16 mt-12 xl:mt-0 relative z-10">
                        <div className="text-center xl:text-right">
                            <p className="text-[10px] font-black uppercase tracking-[0.6em] text-white/20 mb-1 italic">Fleet Utilization</p>
                            <p className="text-3xl font-black italic tracking-tighter text-emerald-500">94.2% ACTIVE</p>
                        </div>
                        <div className="text-center xl:text-right">
                            <p className="text-[10px] font-black uppercase tracking-[0.6em] text-white/20 mb-1 italic">Avg. Delivery</p>
                            <p className="text-3xl font-black italic tracking-tighter text-white">28.4 MINS</p>
                        </div>
                        <div className="text-center xl:text-right">
                            <p className="text-[10px] font-black uppercase tracking-[0.6em] text-white/20 mb-1 italic">Security Hub</p>
                            <p className="text-3xl font-black italic tracking-tighter text-primary flex items-center gap-4">
                                AES-256 <ShieldCheck className="w-8 h-8" />
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Add Driver - REFINED */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-3xl flex items-center justify-center z-[100] p-6 animate-in fade-in duration-300">
                    <div className="bg-card border-4 border-primary/20 rounded-[4rem] w-full max-w-2xl p-16 shadow-[0_0_100px_rgba(255,77,0,0.1)] relative overflow-hidden group/modal animate-in zoom-in-95 duration-500">
                        <div className="absolute top-0 right-0 p-16 opacity-[0.03] pointer-events-none -mr-16 -mt-16 group-hover/modal:scale-110 transition-transform duration-1000 rotate-12">
                            <UserPlus className="w-[400px] h-[400px]" />
                        </div>

                        <div className="flex justify-between items-start mb-16 relative z-10">
                            <div className="space-y-4">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-3xl">
                                        <UserPlus className="w-8 h-8" />
                                    </div>
                                    <h2 className="text-5xl font-black italic uppercase tracking-tighter text-foreground">Alta de <span className="text-primary italic">Repartidor</span></h2>
                                </div>
                                <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.4em] italic pl-20">ESTABLECER NUEVO NODO DE DISTRIBUCIÓN</p>
                            </div>
                            <Button variant="ghost" className="h-16 w-16 rounded-[1.5rem] bg-muted/40 hover:bg-primary hover:text-white transition-all active:scale-90" onClick={() => setShowAddModal(false)}>
                                <X className="w-8 h-8" />
                            </Button>
                        </div>

                        <form onSubmit={handleCreateDriver} className="space-y-10 relative z-10">
                            <div className="space-y-4 group/input">
                                <label className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.5em] ml-10 italic flex items-center gap-3">
                                    <Signal className="w-4 h-4 text-primary" /> VINCULAR PERFIL DE USUARIO
                                </label>
                                <div className="relative group/sel">
                                    <select
                                        className="w-full h-20 bg-muted/30 border-4 border-border rounded-[2.5rem] px-10 outline-none focus:border-primary transition-all font-black text-lg italic text-foreground uppercase tracking-tighter appearance-none shadow-inner cursor-pointer"
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
                                        <option value="">-- SELECCIONAR DEL CLUSTER --</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>{u.full_name} ({u.email?.split('@')[0]})</option>
                                        ))}
                                    </select>
                                    <ArrowLeft className="absolute right-10 top-1/2 -translate-y-1/2 w-6 h-6 rotate-90 opacity-20" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4 group/input">
                                    <label className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.5em] ml-10 italic">IDENTIFICADOR NOMINAL</label>
                                    <input
                                        className="w-full h-18 bg-muted/30 border-4 border-border rounded-[2rem] px-10 outline-none focus:border-primary transition-all font-black text-xl italic text-foreground tracking-tighter shadow-inner uppercase"
                                        required
                                        value={newDriver.full_name}
                                        onChange={(e) => setNewDriver({ ...newDriver, full_name: e.target.value.toUpperCase() })}
                                    />
                                </div>

                                <div className="space-y-4 group/input">
                                    <label className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.5em] ml-10 italic">TERMINAL MÓVIL (LINK)</label>
                                    <input
                                        className="w-full h-18 bg-muted/30 border-4 border-border rounded-[2rem] px-10 outline-none focus:border-primary transition-all font-black text-xl italic text-foreground tracking-tighter shadow-inner"
                                        required
                                        value={newDriver.phone}
                                        onChange={(e) => setNewDriver({ ...newDriver, phone: e.target.value })}
                                        placeholder="+57 300 000 0000"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4 group/input">
                                    <label className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.5em] ml-10 italic">CATEGORÍA VEHÍCULO</label>
                                    <div className="relative group/sel">
                                        <select
                                            className="w-full h-18 bg-muted/30 border-4 border-border rounded-[2rem] px-10 outline-none focus:border-primary transition-all font-black text-lg italic text-foreground uppercase tracking-tighter appearance-none shadow-inner cursor-pointer"
                                            value={newDriver.vehicle_type}
                                            onChange={(e) => setNewDriver({ ...newDriver, vehicle_type: e.target.value })}
                                        >
                                            <option value="motorcycle">MOTOCICLETA</option>
                                            <option value="bike">BICICLETA / E-BIKE</option>
                                            <option value="car">VECTOR AUTOMOTRIZ</option>
                                            <option value="foot">NODO PEATONAL</option>
                                        </select>
                                        <ArrowLeft className="absolute right-8 top-1/2 -translate-y-1/2 w-5 h-5 rotate-90 opacity-20" />
                                    </div>
                                </div>
                                <div className="space-y-4 group/input">
                                    <label className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.5em] ml-10 italic">IDENTIFICADOR PLACA</label>
                                    <input
                                        className="w-full h-18 bg-muted/30 border-4 border-border rounded-[2rem] px-10 outline-none focus:border-primary transition-all font-black text-xl italic text-foreground tracking-tighter shadow-inner uppercase"
                                        value={newDriver.license_plate}
                                        onChange={(e) => setNewDriver({ ...newDriver, license_plate: e.target.value.toUpperCase() })}
                                        placeholder="HEX-000"
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full h-24 bg-foreground text-background hover:bg-primary hover:text-white transition-all text-xl font-black uppercase tracking-[0.5em] italic rounded-[3rem] shadow-3xl group/btn overflow-hidden relative active:scale-95">
                                <div className="absolute inset-x-0 bottom-0 h-2 bg-primary/20" />
                                <Save className="w-8 h-8 mr-6 group-hover/btn:translate-y-1 transition-transform" /> AUTORIZAR REPARTIDOR
                            </Button>
                        </form>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
            `}</style>
        </div>
    )
}
