"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
    Users,
    UserPlus,
    Shield,
    ShieldCheck,
    Mail,
    Phone,
    Trash2,
    MoreVertical,
    Search,
    Loader2,
    X,
    Save,
    User,
    ChefHat,
    Utensils,
    Eye,
    EyeOff,
    Edit
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Employee {
    id: string
    email: string
    full_name: string | null
    phone: string | null
    role: 'admin' | 'staff' | 'waiter' | 'cook' | 'cashier' | 'customer'
    created_at: string
}

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)

    // Form State
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        full_name: "",
        phone: "",
        role: "staff"
    })
    const [submitting, setSubmitting] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    useEffect(() => {
        fetchEmployees()
    }, [])

    async function fetchEmployees() {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .neq('role', 'customer')
                .order('created_at', { ascending: false })

            if (error) throw error
            setEmployees(data || [])
        } catch (error) {
            console.error('Error fetching employees:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddOpen = () => {
        setFormData({
            email: "",
            password: "",
            full_name: "",
            phone: "",
            role: "staff"
        })
        setIsAddModalOpen(true)
    }

    const handleEditOpen = (emp: Employee) => {
        setSelectedEmployee(emp)
        setFormData({
            email: emp.email,
            password: "", // Not editable here
            full_name: emp.full_name || "",
            phone: emp.phone || "",
            role: emp.role
        })
        setIsEditModalOpen(true)
    }

    const handleCreateEmployee = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)

        try {
            // 1. Create Auth User
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.full_name,
                    }
                }
            })

            if (authError) throw authError
            if (!authData.user) throw new Error("No se pudo crear el usuario")

            // 2. Profile is usually created by trigger, but we update role and info
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.full_name,
                    phone: formData.phone,
                    role: formData.role
                })
                .eq('id', authData.user.id)

            if (profileError) throw profileError

            alert("Empleado creado exitosamente. Se ha enviado un correo de confirmación.")
            setIsAddModalOpen(false)
            fetchEmployees()
        } catch (error: any) {
            alert(error.message || "Error al crear empleado")
        } finally {
            setSubmitting(false)
        }
    }

    const handleUpdateEmployee = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedEmployee) return
        setSubmitting(true)

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.full_name,
                    phone: formData.phone,
                    role: formData.role
                })
                .eq('id', selectedEmployee.id)

            if (error) throw error

            alert("Empleado actualizado correctamente")
            setIsEditModalOpen(false)
            fetchEmployees()
        } catch (error: any) {
            alert(error.message || "Error al actualizar")
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteEmployee = async (id: string) => {
        if (!confirm("¿Está seguro de eliminar este empleado? Esta acción no puede deshacerse de forma sencilla (afecta el historial de órdenes si las tiene).")) return

        try {
            // Note: In most systems we don't delete auth users from client for security.
            // We just set role to 'customer' or 'disabled'
            const { error } = await supabase
                .from('profiles')
                .update({ role: 'customer' })
                .eq('id', id)

            if (error) throw error
            fetchEmployees()
        } catch (error) {
            alert("Error al eliminar")
        }
    }

    const filteredEmployees = employees.filter(emp =>
        emp.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin': return { label: 'ADMIN', color: 'bg-primary/20 text-primary border-primary/20', icon: ShieldCheck };
            case 'waiter': return { label: 'MESERO', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: Utensils };
            case 'cook': return { label: 'COCINA', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20', icon: ChefHat };
            case 'cashier': return { label: 'CAJERO', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: Shield };
            default: return { label: 'STAFF', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20', icon: Users };
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight uppercase">Equipo <span className="text-primary italic">Pargo Rojo</span></h1>
                    <p className="text-muted-foreground font-medium mt-1">Gestión integral de personal y jerarquías operativos.</p>
                </div>
                <Button
                    onClick={handleAddOpen}
                    className="h-12 px-6 rounded-2xl bg-primary text-black font-black hover:scale-105 transition-all gap-2 shadow-lg shadow-primary/20"
                >
                    <UserPlus className="w-5 h-5" />
                    AÑADIR PERSONAL
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Main List */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email o cargo..."
                            className="w-full h-14 pl-12 pr-6 rounded-3xl bg-card border border-white/5 focus:border-primary/50 outline-none transition-all shadow-2xl font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {loading ? (
                            Array(4).fill(0).map((_, i) => (
                                <div key={i} className="h-32 bg-card/50 animate-pulse rounded-[2rem] border border-white/5" />
                            ))
                        ) : filteredEmployees.length === 0 ? (
                            <div className="col-span-full py-20 text-center bg-card/30 rounded-[3rem] border border-dashed border-white/10">
                                <Users className="w-16 h-16 mx-auto mb-4 opacity-10" />
                                <p className="text-xl font-bold opacity-30 uppercase tracking-widest">No hay personal que coincida</p>
                            </div>
                        ) : filteredEmployees.map((emp) => {
                            const badge = getRoleBadge(emp.role);
                            const Icon = badge.icon;
                            return (
                                <div key={emp.id} className="group bg-card hover:bg-white/5 border border-white/5 rounded-[2.5rem] p-6 transition-all hover:border-primary/20 shadow-xl flex flex-col justify-between">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-black text-2xl text-primary border border-primary/20">
                                                {emp.full_name?.charAt(0) || emp.email.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-lg leading-tight mb-1 group-hover:text-primary transition-colors">
                                                    {emp.full_name || 'Sin nombre'}
                                                </h3>
                                                <div className={cn(
                                                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest border",
                                                    badge.color
                                                )}>
                                                    <Icon className="w-3 h-3" />
                                                    {badge.label}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opactiy-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="rounded-xl h-10 w-10 hover:bg-white/5"
                                                onClick={() => handleEditOpen(emp)}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="rounded-xl h-10 w-10 hover:bg-red-500/10 hover:text-red-500"
                                                onClick={() => handleDeleteEmployee(emp.id)}
                                            >
                                                <Trash2 className="w-4 h-4 pointer-events-none" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2 border-t border-white/5 pt-4">
                                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                                            <Mail className="w-3.5 h-3.5 opacity-50" />
                                            {emp.email}
                                        </div>
                                        {emp.phone && (
                                            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                                                <Phone className="w-3.5 h-3.5 opacity-50" />
                                                {emp.phone}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Info Sidebar */}
                <div className="space-y-6">
                    <div className="bg-primary/5 border border-primary/10 rounded-[2.5rem] p-8 space-y-6">
                        <div className="flex items-center gap-3 text-primary">
                            <ShieldCheck className="w-8 h-8" />
                            <h3 className="font-black text-xl uppercase tracking-tighter">Niveles de Acceso</h3>
                        </div>
                        <div className="space-y-6 text-sm">
                            {[
                                { r: 'ADMIN', d: 'Control total de finanzas, productos y personal.', c: 'text-primary' },
                                { r: 'CAJERO', d: 'Manejo de pedidos, caja menor y reportes de hoy.', c: 'text-emerald-400' },
                                { r: 'MESERO', d: 'Acceso exclusivo al Portal Mesero para toma de pedidos.', c: 'text-blue-400' },
                                { r: 'COCINA', d: 'Gestión exclusiva del sistema KDS (Pantalla de pedidos).', c: 'text-orange-400' },
                            ].map((role, i) => (
                                <div key={i} className="space-y-1">
                                    <div className={cn("font-black uppercase text-[10px] tracking-widest", role.c)}>{role.r}</div>
                                    <p className="text-muted-foreground font-medium italic">{role.d}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-card border border-white/5 rounded-[2.5rem] p-8 space-y-4 shadow-xl">
                        <h3 className="font-black uppercase tracking-widest text-xs opacity-50 text-center">Resumen de Plantilla</h3>
                        <div className="flex justify-around items-center">
                            <div className="text-center">
                                <div className="text-3xl font-black text-primary">{employees.length}</div>
                                <div className="text-[10px] font-black opacity-50 uppercase tracking-widest">Total</div>
                            </div>
                            <div className="w-[1px] h-10 bg-white/5" />
                            <div className="text-center">
                                <div className="text-3xl font-black text-emerald-400">{employees.filter(e => e.role === 'admin' || e.role === 'cashier').length}</div>
                                <div className="text-[10px] font-black opacity-50 uppercase tracking-widest">Gestión</div>
                            </div>
                            <div className="w-[1px] h-10 bg-white/5" />
                            <div className="text-center">
                                <div className="text-3xl font-black text-orange-400">{employees.filter(e => e.role === 'waiter' || e.role === 'cook').length}</div>
                                <div className="text-[10px] font-black opacity-50 uppercase tracking-widest">Operativos</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {(isAddModalOpen || isEditModalOpen) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-card w-full max-w-xl rounded-[3rem] border border-white/10 shadow-3xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
                        <div className="p-8 pb-4 flex justify-between items-center">
                            <h2 className="text-3xl font-black tracking-tight uppercase">
                                {isAddModalOpen ? 'Nuevo Empleado' : 'Editar Información'}
                            </h2>
                            <Button variant="ghost" size="icon" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="rounded-full">
                                <X className="w-6 h-6" />
                            </Button>
                        </div>

                        <form onSubmit={isAddModalOpen ? handleCreateEmployee : handleUpdateEmployee} className="p-8 pt-4 space-y-6">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-4">Nombre Completo</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                                            <input
                                                required
                                                className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-primary/50 transition-all font-bold"
                                                value={formData.full_name}
                                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-4">Teléfono</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                                            <input
                                                className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-primary/50 transition-all font-bold"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-4">Correo Electrónico</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                                        <input
                                            required
                                            type="email"
                                            disabled={isEditModalOpen}
                                            className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-primary/50 transition-all font-bold disabled:opacity-50"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {isAddModalOpen && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-4">Contraseña Temporal</label>
                                        <div className="relative">
                                            <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                                            <input
                                                required
                                                type={showPassword ? "text" : "password"}
                                                className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-12 pr-12 outline-none focus:border-primary/50 transition-all font-bold"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30 hover:opacity-100"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-4">Cargo / Rol en el Sistema</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {[
                                            { id: 'admin', label: 'Admin', icon: ShieldCheck },
                                            { id: 'cashier', label: 'Cajero', icon: Shield },
                                            { id: 'waiter', label: 'Mesero', icon: Utensils },
                                            { id: 'cook', label: 'Cocina', icon: ChefHat },
                                        ].map((role) => (
                                            <button
                                                key={role.id}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, role: role.id })}
                                                className={cn(
                                                    "flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-all gap-2",
                                                    formData.role === role.id
                                                        ? "bg-primary/20 border-primary text-primary"
                                                        : "bg-white/5 border-white/5 hover:bg-white/10"
                                                )}
                                            >
                                                <role.icon className="w-6 h-6" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">{role.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                                    className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest"
                                >
                                    CANCELAR
                                </Button>
                                <Button
                                    disabled={submitting}
                                    type="submit"
                                    className="flex-[2] h-14 rounded-2xl bg-primary text-black font-black uppercase tracking-widest shadow-xl shadow-primary/20"
                                >
                                    {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : isAddModalOpen ? 'CREAR PERFIL' : 'GUARDAR CAMBIOS'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
