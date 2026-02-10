"use client"

import { getUserPermissions, checkPermission, UserPermissions } from "@/lib/permissions"
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
    Edit,
    Calendar,
    Receipt
} from "lucide-react"
import { cn, formatPrice } from "@/lib/utils"
import { toast } from "sonner"

interface Employee {
    id: string
    email: string
    full_name: string | null
    phone: string | null
    role: 'admin' | 'staff' | 'waiter' | 'cook' | 'cashier' | 'customer'
    document_id: string | null
    hire_date: string | null
    waiter_pin: string | null
    food_discount_pct: number
    max_credit: number
    current_credit_spent: number
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
        role: "staff",
        document_id: "",
        waiter_pin: "",
        food_discount_pct: 0,
        max_credit: 0,
        hire_date: new Date().toISOString().split('T')[0]
    })
    const [submitting, setSubmitting] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [businessInfo, setBusinessInfo] = useState<any>({ name: "PARGO ROJO" })
    const [currentUserPerms, setCurrentUserPerms] = useState<UserPermissions | null>(null)

    useEffect(() => {
        fetchEmployees()
        fetchBusinessInfo()
        loadPermissions()
    }, [])

    async function loadPermissions() {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const perms = await getUserPermissions(user.id)
            setCurrentUserPerms(perms)
        }
    }

    async function fetchBusinessInfo() {
        const { data } = await supabase.from('settings').select('value').eq('key', 'business_info').single()
        if (data?.value) setBusinessInfo(data.value)
    }

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
            role: "staff",
            document_id: "",
            waiter_pin: "",
            food_discount_pct: 0,
            max_credit: 0,
            hire_date: new Date().toISOString().split('T')[0]
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
            role: emp.role,
            document_id: emp.document_id || "",
            waiter_pin: emp.waiter_pin || "",
            food_discount_pct: emp.food_discount_pct || 0,
            max_credit: emp.max_credit || 0,
            hire_date: emp.hire_date || ""
        })
        setIsEditModalOpen(true)
    }

    const handleCreateEmployee = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)

        try {
            // 1. Create Auth User WITH ROLE IN METADATA (para que el trigger lo tome)
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.full_name,
                        role: formData.role  // ← CRÍTICO: El trigger busca esto
                    }
                }
            })

            if (authError) throw authError
            if (!authData.user) throw new Error("No se pudo crear el usuario")

            // 2. Fetch current restaurant ID
            const { data: { user: currentUser } } = await supabase.auth.getUser()
            const { data: myProfile } = await supabase.from('profiles').select('restaurant_id').eq('id', currentUser?.id).single()
            const restaurantId = myProfile?.restaurant_id || (await supabase.from('restaurants').select('id').single()).data?.id

            // 3. Update Profile (El trigger lo creó, ahora lo completamos con datos adicionales)
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: authData.user.id,
                    email: formData.email,
                    full_name: formData.full_name,
                    phone: formData.phone,
                    role: formData.role,
                    document_id: formData.document_id,
                    waiter_pin: formData.waiter_pin,
                    food_discount_pct: formData.food_discount_pct,
                    max_credit: formData.max_credit,
                    hire_date: formData.hire_date,
                    restaurant_id: restaurantId,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'id'  // Update si ya existe
                })

            if (profileError) throw profileError

            toast.success("Empleado creado exitosamente. Se ha enviado un correo de confirmación.")
            setIsAddModalOpen(false)
            fetchEmployees()
        } catch (error: any) {
            toast.error(error.message || "Error al crear empleado")
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
                    role: formData.role,
                    document_id: formData.document_id,
                    waiter_pin: formData.waiter_pin,
                    food_discount_pct: formData.food_discount_pct,
                    max_credit: formData.max_credit,
                    hire_date: formData.hire_date
                })
                .eq('id', selectedEmployee.id)

            if (error) throw error

            toast.success("Empleado actualizado correctamente")
            setIsEditModalOpen(false)
            fetchEmployees()
        } catch (error: any) {
            toast.error(error.message || "Error al actualizar")
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
            default: return { label: 'STAFF', color: 'bg-muted text-muted-foreground border-border', icon: Users };
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 bg-transparent text-foreground p-4 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight uppercase text-foreground">Equipo <span className="text-primary italic">{businessInfo.name}</span></h1>
                    <p className="text-muted-foreground font-medium mt-1 italic">Gestión integral de personal y jerarquías operativos.</p>
                </div>
                <Button
                    onClick={handleAddOpen}
                    className="h-14 px-8 bg-primary text-primary-foreground border-none rounded-2xl font-black uppercase tracking-widest italic hover:scale-105 transition-all gap-2 shadow-xl shadow-primary/20"
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
                            className="w-full h-14 pl-12 pr-6 rounded-3xl bg-card border border-border focus:border-primary/50 outline-none transition-all shadow-xl font-medium text-foreground placeholder:text-muted-foreground/30"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {loading ? (
                            Array(4).fill(0).map((_, i) => (
                                <div key={i} className="h-32 bg-card animate-pulse rounded-[2rem] border border-border" />
                            ))
                        ) : filteredEmployees.length === 0 ? (
                            <div className="col-span-full py-20 text-center bg-muted/20 rounded-[3rem] border border-dashed border-border animate-in fade-in">
                                <Users className="w-16 h-16 mx-auto mb-4 opacity-10 text-muted-foreground" />
                                <p className="text-xl font-bold opacity-30 uppercase tracking-widest text-muted-foreground italic">No hay personal que coincida</p>
                            </div>
                        ) : filteredEmployees.map((emp) => {
                            const badge = getRoleBadge(emp.role);
                            const Icon = badge.icon;
                            return (
                                <div key={emp.id} className="group bg-card hover:bg-muted/30 border border-border rounded-[2.5rem] p-6 transition-all hover:border-primary/30 shadow-xl flex flex-col justify-between">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex gap-4 min-w-0">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-black text-2xl text-primary border border-primary/20 shrink-0">
                                                {emp.full_name?.charAt(0) || emp.email.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-black text-lg leading-tight mb-1 group-hover:text-primary transition-colors text-foreground truncate">
                                                    {emp.full_name || 'Sin nombre'}
                                                </h3>
                                                <div className={cn(
                                                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest border italic",
                                                    badge.color
                                                )}>
                                                    <Icon className="w-3 h-3" />
                                                    {badge.label}
                                                </div>
                                                {emp.document_id && (
                                                    <span className="text-[9px] font-bold text-muted-foreground/60 ml-2 uppercase italic tracking-widest whitespace-nowrap">ID: {emp.document_id}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="rounded-xl h-10 w-10 hover:bg-muted text-muted-foreground hover:text-foreground"
                                                onClick={() => handleEditOpen(emp)}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            {currentUserPerms && checkPermission(currentUserPerms, 'manage_employees') && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="rounded-xl h-10 w-10 hover:bg-rose-500/10 hover:text-rose-500 text-muted-foreground"
                                                    onClick={() => handleDeleteEmployee(emp.id)}
                                                >
                                                    <Trash2 className="w-4 h-4 pointer-events-none" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
                                        <div className="space-y-2 min-w-0">
                                            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground truncate">
                                                <Mail className="w-3.5 h-3.5 opacity-50 shrink-0" />
                                                <span className="truncate">{emp.email}</span>
                                            </div>
                                            {emp.phone && (
                                                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground truncate">
                                                    <Phone className="w-3.5 h-3.5 opacity-50 shrink-0" />
                                                    <span className="truncate">{emp.phone}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-1 text-right shrink-0">
                                            <div className="text-[10px] font-black text-emerald-500 uppercase italic whitespace-nowrap">Disc: {emp.food_discount_pct}%</div>
                                            <div className="text-[10px] font-black text-primary uppercase italic whitespace-nowrap">Créd: {formatPrice(emp.max_credit)}</div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Info Sidebar */}
                <div className="space-y-6">
                    <div className="bg-primary/5 border border-primary/10 rounded-[2.5rem] p-8 space-y-6 shadow-sm">
                        <div className="flex items-center gap-3 text-primary">
                            <ShieldCheck className="w-8 h-8" />
                            <h3 className="font-black text-xl uppercase tracking-tighter italic">Niveles de Acceso</h3>
                        </div>
                        <div className="space-y-6 text-sm">
                            {[
                                { r: 'ADMIN', d: 'Control total de finanzas, productos y personal operativo.', c: 'text-primary' },
                                { r: 'CAJERO', d: 'Manejo de pedidos, caja menor y reportes de turno.', c: 'text-emerald-500' },
                                { r: 'MESERO', d: 'Acceso exclusivo al Portal Mesero para toma de pedidos.', c: 'text-blue-500' },
                                { r: 'COCINA', d: 'Gestión exclusiva del sistema KDS (Control de cocina).', c: 'text-orange-500' },
                            ].map((role, i) => (
                                <div key={i} className="space-y-1 group/role">
                                    <div className={cn("font-black uppercase text-[10px] tracking-[0.3em] transition-colors", role.c)}>{role.r}</div>
                                    <p className="text-muted-foreground font-medium italic leading-relaxed group-hover/role:text-foreground transition-colors">{role.d}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-[2.5rem] p-8 space-y-4 shadow-xl">
                        <h3 className="font-black uppercase tracking-widest text-[10px] text-muted-foreground/60 text-center italic">Resumen de Plantilla</h3>
                        <div className="flex justify-around items-center">
                            <div className="text-center group/kpi">
                                <div className="text-3xl font-black text-primary transition-transform group-hover/kpi:scale-110">{employees.length}</div>
                                <div className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest italic">Total</div>
                            </div>
                            <div className="w-[1px] h-10 bg-border" />
                            <div className="text-center group/kpi">
                                <div className="text-3xl font-black text-emerald-500 transition-transform group-hover/kpi:scale-110">{employees.filter(e => e.role === 'admin' || e.role === 'cashier').length}</div>
                                <div className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest italic">Gestión</div>
                            </div>
                            <div className="w-[1px] h-10 bg-border" />
                            <div className="text-center group/kpi">
                                <div className="text-3xl font-black text-orange-500 transition-transform group-hover/kpi:scale-110">{employees.filter(e => e.role === 'waiter' || e.role === 'cook').length}</div>
                                <div className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest italic">Staff</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {(isAddModalOpen || isEditModalOpen) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-card w-full max-w-xl rounded-[3rem] border border-border shadow-3xl overflow-hidden flex flex-col animate-in zoom-in-95 shadow-black/40">
                        <div className="p-10 pb-4 flex justify-between items-center bg-muted/30 border-b border-border/50">
                            <h2 className="text-3xl font-black tracking-tight uppercase italic text-foreground leading-none">
                                {isAddModalOpen ? 'Nuevo Colaborador' : 'Editar Expediente'}
                            </h2>
                            <Button variant="ghost" size="icon" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="rounded-xl hover:bg-background transition-colors">
                                <X className="w-6 h-6 text-muted-foreground" />
                            </Button>
                        </div>

                        <form onSubmit={isAddModalOpen ? handleCreateEmployee : handleUpdateEmployee} className="p-10 pt-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-4 italic">Nombre Completo</label>
                                        <div className="relative">
                                            <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
                                            <input
                                                required
                                                className="w-full bg-muted border border-border rounded-2xl py-4 pl-14 pr-6 outline-none focus:border-primary/50 transition-all font-bold text-foreground placeholder:text-muted-foreground/20 shadow-inner"
                                                placeholder="EJ: JUAN PÉREZ"
                                                value={formData.full_name}
                                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-4 italic">Teléfono Móvil</label>
                                        <div className="relative">
                                            <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
                                            <input
                                                className="w-full bg-muted border border-border rounded-2xl py-4 pl-14 pr-6 outline-none focus:border-primary/50 transition-all font-bold text-foreground placeholder:text-muted-foreground/20 shadow-inner"
                                                placeholder="+57 300..."
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-4 italic">Documento de Identidad</label>
                                        <div className="relative">
                                            <Shield className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
                                            <input
                                                required
                                                className="w-full bg-muted border border-border rounded-2xl py-4 pl-14 pr-6 outline-none focus:border-primary/50 transition-all font-bold text-foreground placeholder:text-muted-foreground/20 shadow-inner"
                                                placeholder="C.C. / C.E."
                                                value={formData.document_id}
                                                onChange={(e) => setFormData({ ...formData, document_id: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-4 italic">Fecha de Vinculación</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 pointer-events-none" />
                                            <input
                                                required
                                                type="date"
                                                className="w-full bg-muted border border-border rounded-2xl py-4 pl-14 pr-6 outline-none focus:border-primary/50 transition-all font-bold text-foreground shadow-inner cursor-pointer"
                                                value={formData.hire_date}
                                                onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-4 italic">% Descuento Staff</label>
                                        <div className="relative">
                                            <Utensils className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
                                            <input
                                                type="number"
                                                className="w-full bg-muted border border-border rounded-2xl py-4 pl-14 pr-6 outline-none focus:border-primary/50 transition-all font-bold text-foreground shadow-inner"
                                                value={formData.food_discount_pct}
                                                onChange={(e) => setFormData({ ...formData, food_discount_pct: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-4 italic">Límite de Consumo Cr.</label>
                                        <div className="relative">
                                            <Receipt className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
                                            <input
                                                type="number"
                                                className="w-full bg-muted border border-border rounded-2xl py-4 pl-14 pr-6 outline-none focus:border-primary/50 transition-all font-bold text-foreground shadow-inner"
                                                value={formData.max_credit}
                                                onChange={(e) => setFormData({ ...formData, max_credit: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-4 italic">Correo Corporativo</label>
                                        <div className="relative">
                                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
                                            <input
                                                required
                                                type="email"
                                                disabled={isEditModalOpen}
                                                className="w-full bg-muted border border-border rounded-2xl py-4 pl-14 pr-6 outline-none focus:border-primary/50 transition-all font-bold text-foreground disabled:opacity-30 shadow-inner"
                                                placeholder="email@pargorojo.com"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-4 italic">PIN de Seguridad (4 dígitos)</label>
                                        <div className="relative">
                                            <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
                                            <input
                                                required={formData.role === 'waiter'}
                                                maxLength={4}
                                                className="w-full bg-muted border border-border rounded-2xl py-4 pl-14 pr-6 outline-none focus:border-primary/50 transition-all font-bold text-foreground placeholder:text-muted-foreground/20 shadow-inner"
                                                placeholder="EJ: 1234"
                                                value={formData.waiter_pin}
                                                onChange={(e) => setFormData({ ...formData, waiter_pin: e.target.value.replace(/\D/g, '') })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {isAddModalOpen && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-4 italic">Contraseña Inicial</label>
                                        <div className="relative">
                                            <Shield className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
                                            <input
                                                required
                                                type={showPassword ? "text" : "password"}
                                                className="w-full bg-muted border border-border rounded-2xl py-4 pl-14 pr-14 outline-none focus:border-primary/50 transition-all font-bold text-foreground placeholder:text-muted-foreground/20 shadow-inner"
                                                placeholder="Min. 8 caracteres"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-4 italic">Designación de Rango / Sistema</label>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                        {[
                                            { id: 'admin', label: 'Admin', icon: ShieldCheck, color: 'hover:border-primary active:bg-primary/20' },
                                            { id: 'cashier', label: 'Cajero', icon: Shield, color: 'hover:border-emerald-500 active:bg-emerald-500/20' },
                                            { id: 'waiter', label: 'Mesero', icon: Utensils, color: 'hover:border-blue-500 active:bg-blue-500/20' },
                                            { id: 'cook', label: 'Cocina', icon: ChefHat, color: 'hover:border-orange-500 active:bg-orange-500/20' },
                                        ].map((role) => (
                                            <button
                                                key={role.id}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, role: role.id })}
                                                className={cn(
                                                    "flex flex-col items-center justify-center p-5 rounded-[2rem] border-2 transition-all gap-2 shadow-sm",
                                                    formData.role === role.id
                                                        ? "bg-primary/10 border-primary text-primary"
                                                        : "bg-muted/50 border-border/50 text-muted-foreground",
                                                    role.color
                                                )}
                                            >
                                                <role.icon className="w-7 h-7" />
                                                <span className="text-[10px] font-black uppercase tracking-widest italic">{role.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 pt-6">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                                    className="flex-1 h-16 rounded-2xl font-black uppercase tracking-widest text-muted-foreground hover:bg-muted"
                                >
                                    CANCELAR
                                </Button>
                                <Button
                                    disabled={submitting}
                                    type="submit"
                                    className="flex-[2] h-16 rounded-2xl bg-foreground text-background font-black uppercase tracking-widest italic hover:bg-primary hover:text-background transition-all border-none text-lg shadow-xl"
                                >
                                    {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : isAddModalOpen ? 'OPERATIVIZAR PERFIL' : 'ACTUALIZAR DATOS'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
            `}</style>
        </div>
    )
}
