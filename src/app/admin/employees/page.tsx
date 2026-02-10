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
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

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

            toast.success("Empleado creado exitosamente.")
            setIsAddModalOpen(false)
            setTimeout(() => fetchEmployees(), 500) // Pequeño delay para asegurar que el trigger termine
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
            setTimeout(() => fetchEmployees(), 500)
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
            case 'admin': return { label: 'ADMIN', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20', icon: ShieldCheck };
            case 'waiter': return { label: 'MESERO', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: Utensils };
            case 'cook': return { label: 'COCINA', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20', icon: ChefHat };
            case 'cashier': return { label: 'CAJERO', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: Shield };
            default: return { label: 'STAFF', color: 'bg-white/5 text-slate-500 border-white/5', icon: Users };
        }
    }

    return (
        <div className="min-h-screen bg-[#020406] text-white font-sans selection:bg-orange-500 overflow-x-hidden flex flex-col h-screen relative">

            {/* 🌌 FONDO ESTRUCTURAL AURA */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-orange-500/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full opacity-50" />
            </div>

            {/* HEADER DE ELITE TÁCTICA */}
            <div className="relative z-30 p-6 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 bg-slate-900/40 backdrop-blur-3xl shrink-0">
                <div className="flex items-center gap-4 md:gap-8">
                    <Link href="/admin/hub">
                        <Button variant="ghost" size="icon" className="h-12 w-12 md:h-16 md:w-16 rounded-xl md:rounded-[1.5rem] bg-white/5 border border-white/5 hover:bg-orange-600 hover:text-black transition-all group">
                            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 group-hover:-translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                    <div className="space-y-1 md:space-y-2">
                        <div className="flex items-center gap-2">
                            <Users className="w-3 h-3 md:w-4 md:h-4 text-orange-500" />
                            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-orange-500 italic">Intelligence & Talent</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black italic tracking-tighter uppercase leading-none text-white">Equipo <span className="text-orange-500">Core</span></h1>
                    </div>
                </div>

                <Button
                    onClick={handleAddOpen}
                    className="h-14 md:h-16 px-8 md:px-12 bg-orange-600 hover:bg-orange-500 text-black font-black uppercase text-[10px] md:text-xs italic tracking-widest rounded-xl md:rounded-2xl shadow-3xl shadow-orange-600/20 active:scale-95 transition-all gap-4 w-full md:w-auto"
                >
                    <UserPlus className="w-5 h-5 md:w-6 md:h-6" /> Expandir Nómina
                </Button>
            </div>

            <div className="relative z-10 p-4 md:p-10 lg:p-12 flex-1 flex flex-col gap-6 md:gap-10 max-w-[1800px] mx-auto w-full overflow-y-auto custom-scrollbar">

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-10">
                    <div className="lg:col-span-3 space-y-6 md:space-y-8">
                        {/* Buscador */}
                        <div className="relative group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-700 group-focus-within:text-orange-500 transition-all" />
                            <input
                                type="text"
                                placeholder="BUSCAR POR NOMBRE O CARGO..."
                                className="w-full h-16 md:h-20 pl-16 pr-8 rounded-2xl md:rounded-[2.5rem] bg-white/[0.02] border border-white/5 focus:border-orange-500/20 outline-none transition-all shadow-xl font-black uppercase tracking-[0.2em] text-white text-[10px] md:text-xs placeholder:text-slate-800 italic"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Lista de Empleados */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4 md:gap-8">
                            {loading ? (
                                Array(4).fill(0).map((_, i) => (
                                    <div key={i} className="h-64 bg-slate-900/20 animate-pulse rounded-[3rem] border border-white/5" />
                                ))
                            ) : filteredEmployees.length === 0 ? (
                                <div className="col-span-full py-32 text-center bg-white/[0.02] backdrop-blur-3xl rounded-[4rem] border border-dashed border-white/5 animate-in fade-in">
                                    <Users className="w-20 h-20 mx-auto mb-6 text-slate-800 opacity-20" />
                                    <p className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-600 italic">No se detectaron perfiles activos en la zona</p>
                                </div>
                            ) : filteredEmployees.map((emp) => {
                                const badge = getRoleBadge(emp.role);
                                const Icon = badge.icon;
                                return (
                                    <div key={emp.id} className="group/card bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 transition-all duration-500 hover:border-orange-500/20 shadow-3xl flex flex-col justify-between relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/[0.02] rounded-full -mr-20 -mt-20 group-hover/card:bg-orange-500/5 group-hover/card:scale-110 transition-all duration-1000" />
                                        <div className="flex justify-between items-start mb-8 relative z-10">
                                            <div className="flex gap-6 min-w-0">
                                                <div className="w-20 h-20 rounded-[1.5rem] bg-orange-500/10 flex items-center justify-center font-black text-3xl text-orange-500 border border-orange-500/10 shrink-0 shadow-inner italic">
                                                    {emp.full_name?.charAt(0) || emp.email.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0 space-y-2">
                                                    <h3 className="font-black text-2xl italic tracking-tighter uppercase group-hover/card:text-orange-500 transition-colors text-white truncate leading-none">
                                                        {emp.full_name || 'Anonymous_User'}
                                                    </h3>
                                                    <div className={cn(
                                                        "inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black tracking-[0.2em] border italic leading-none shadow-sm",
                                                        badge.color
                                                    )}>
                                                        <Icon className="w-3.5 h-3.5" />
                                                        {badge.label}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover/card:opacity-100 transition-all duration-500 translate-x-4 group-hover/card:translate-x-0">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="rounded-xl h-12 w-12 bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                                                    onClick={() => handleEditOpen(emp)}
                                                >
                                                    <Edit className="w-5 h-5" />
                                                </Button>
                                                {currentUserPerms && checkPermission(currentUserPerms, 'manage_employees') && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="rounded-xl h-12 w-12 bg-rose-500/5 border border-white/5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/20"
                                                        onClick={() => handleDeleteEmployee(emp.id)}
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-8 border-t border-white/5 pt-8 relative z-10">
                                            <div className="space-y-3 min-w-0">
                                                <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500 truncate italic">
                                                    <Mail className="w-4 h-4 text-orange-500 opacity-40 shrink-0" />
                                                    <span className="truncate uppercase">{emp.email}</span>
                                                </div>
                                                {emp.phone && (
                                                    <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500 truncate italic">
                                                        <Phone className="w-4 h-4 text-orange-500 opacity-40 shrink-0" />
                                                        <span className="truncate">{emp.phone}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right flex flex-col justify-center gap-2">
                                                <div className="px-3 py-1.5 bg-emerald-500/5 rounded-xl border border-emerald-500/10 inline-block self-end">
                                                    <span className="text-[10px] font-black text-emerald-500 uppercase italic tracking-widest">PRO_DISC {emp.food_discount_pct}%</span>
                                                </div>
                                                <div className="px-3 py-1.5 bg-orange-500/5 rounded-xl border border-orange-500/10 inline-block self-end">
                                                    <span className="text-[10px] font-black text-orange-500 uppercase italic tracking-widest">LIMIT {formatPrice(emp.max_credit)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Panel Lateral de Protocolos (Sticky) */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-0 space-y-6 md:space-y-8">
                            <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-3xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:scale-110 transition-transform duration-1000">
                                    <ShieldCheck className="w-40 h-40" />
                                </div>
                                <div className="relative z-10 space-y-6 md:space-y-8">
                                    <div className="space-y-2">
                                        <h3 className="text-xl md:text-2xl font-black italic tracking-tighter uppercase text-white">Consola de <span className="text-orange-500">Acceso</span></h3>
                                        <p className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest italic opacity-70">Monitoreo de privilegios del sistema.</p>
                                    </div>

                                    <div className="space-y-3">
                                        {[
                                            { label: 'ADMINS ACTIVOS', val: employees.filter(e => e.role === 'admin').length, color: 'bg-orange-500' },
                                            { label: 'STAFF OPERATIVO', val: employees.filter(e => e.role !== 'admin').length, color: 'bg-white/20' },
                                            { label: 'NÓMINA TOTAL', val: formatPrice(employees.reduce((acc, e) => acc + (e.food_discount_pct || 0), 0) * 1000), color: 'bg-white/10' }
                                        ].map((stat, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", stat.color)} />
                                                    <span className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest italic">{stat.label}</span>
                                                </div>
                                                <span className="text-xs md:text-sm font-black text-white italic">{stat.val}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modales Responsive */}
                {(isAddModalOpen || isEditModalOpen) && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-300 overflow-y-auto">
                        <div className="bg-slate-950 border border-white/10 w-full max-w-2xl rounded-2xl md:rounded-[3rem] shadow-3xl overflow-hidden flex flex-col animate-in zoom-in-95 relative my-auto">
                            <div className="absolute top-0 left-0 w-full h-32 md:h-64 bg-gradient-to-b from-orange-500/10 to-transparent pointer-events-none" />
                            <div className="p-6 md:p-10 pb-4 md:pb-6 flex justify-between items-center border-b border-white/5 relative z-10">
                                <h2 className="text-2xl md:text-3xl font-black tracking-tight uppercase italic text-white leading-none">
                                    {isAddModalOpen ? 'Nuevo Colaborador' : 'Editar Expediente'}
                                </h2>
                                <Button variant="ghost" size="icon" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="rounded-xl hover:bg-white/5 transition-colors">
                                    <X className="w-5 h-5 md:w-6 md:h-6 text-slate-500" />
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
                                                    className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 pl-14 pr-6 outline-none focus:border-orange-500/40 transition-all font-bold text-white placeholder:text-slate-700 shadow-inner"
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
                                                    className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 pl-14 pr-6 outline-none focus:border-orange-500/40 transition-all font-bold text-white placeholder:text-slate-700 shadow-inner"
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
                                                    className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 pl-14 pr-6 outline-none focus:border-orange-500/40 transition-all font-bold text-white placeholder:text-slate-700 shadow-inner"
                                                    placeholder="C.C. / C.E."
                                                    value={formData.document_id}
                                                    onChange={(e) => setFormData({ ...formData, document_id: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-4 italic">Fecha de Vinculación</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
                                                <input
                                                    required
                                                    type="date"
                                                    className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 pl-14 pr-6 outline-none focus:border-orange-500/40 transition-all font-bold text-white shadow-inner cursor-pointer"
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
                                                    className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 pl-14 pr-6 outline-none focus:border-orange-500/40 transition-all font-bold text-white shadow-inner"
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
                                                    className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 pl-14 pr-6 outline-none focus:border-orange-500/40 transition-all font-bold text-white shadow-inner"
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
                                                    className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 pl-14 pr-6 outline-none focus:border-orange-500/40 transition-all font-bold text-white disabled:opacity-30 shadow-inner"
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
                                                    className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 pl-14 pr-6 outline-none focus:border-orange-500/40 transition-all font-bold text-white placeholder:text-slate-700 shadow-inner"
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
                                                    className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 pl-14 pr-14 outline-none focus:border-orange-500/40 transition-all font-bold text-white placeholder:text-slate-700 shadow-inner"
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

                                <div className="flex flex-col sm:flex-row gap-4 pt-6 relative z-10">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                                        className="flex-1 h-16 rounded-2xl font-black uppercase tracking-widest text-slate-400 hover:bg-white/5 border border-white/5"
                                    >
                                        CANCELAR
                                    </Button>
                                    <Button
                                        disabled={submitting}
                                        type="submit"
                                        className="flex-[2] h-16 rounded-2xl bg-orange-600 text-black font-black uppercase tracking-widest italic hover:bg-orange-500 transition-all border-none text-lg shadow-2xl shadow-orange-500/20 active:scale-95"
                                    >
                                        {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : isAddModalOpen ? 'OPERATIVIZAR PERFIL' : 'ACTUALIZAR DATOS'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
                }

                <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
            `}</style>
            </div>
        </div>
    )
}
