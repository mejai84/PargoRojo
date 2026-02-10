"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useOrderNotifications } from "@/hooks/use-order-notifications"
import { Toaster, toast } from "sonner"
import {
    LayoutDashboard,
    ShoppingBag,
    UtensilsCrossed,
    Settings,
    LogOut,
    Users,
    User,
    Menu,
    ChefHat,
    BarChart3,
    Calendar,
    QrCode,
    Package,
    Tag,
    Wallet,
    BadgeDollarSign,
    Printer,
    Utensils,
    Truck,
    Bike,
    Zap,
    ShieldCheck,
    ChevronRight,
    Search,
    Bell,
    X,
    ShieldAlert,
    Clock,
    History,
    Server
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { NotificationBell } from "@/components/admin/notification-bell"
import { PargoBot } from "@/components/admin/pargo-bot"
import { IncomingOrderAlert } from "@/components/admin/incoming-order-alert"
import { ShiftGuard } from "@/components/admin/shift-guard"
import { useRestaurant } from "@/providers/RestaurantProvider"
import { BusinessSelector } from "@/components/admin/business-selector"
import { QuickBusinessSwitch } from "@/components/admin/quick-business-switch"

const sidebarSections = [
    {
        title: "OPERACIONES POS",
        items: [
            { icon: LayoutDashboard, label: "Vista General", href: "/admin", roles: ['admin', 'manager', 'cashier'] },
            { icon: BadgeDollarSign, label: "Control de Caja", href: "/admin/cashier", roles: ['admin', 'manager', 'cashier'] },
            { icon: Utensils, label: "Portal Mesero", href: "/admin/waiter", roles: ['admin', 'manager', 'waiter'] },
            { icon: ChefHat, label: "Cocina (KDS)", href: "/admin/kitchen", roles: ['admin', 'manager', 'cook', 'chef'] },
            { icon: ShoppingBag, label: "Listado Pedidos", href: "/admin/orders", roles: ['admin', 'manager', 'cashier', 'waiter'] },
        ]
    },
    {
        title: "CLIENTES & RESERVAS",
        items: [
            { icon: Calendar, label: "Reservas / Agenda", href: "/admin/reservations", roles: ['admin', 'manager', 'host', 'cashier'] },
            { icon: Users, label: "CRM & Fidelización", href: "/admin/customers", roles: ['admin', 'manager', 'cashier'] },
            { icon: QrCode, label: "Mesas & QR", href: "/admin/tables", roles: ['admin', 'manager', 'waiter', 'cashier'] },
            { icon: Truck, label: "Delivery App", href: "/admin/delivery-config", roles: ['admin'] },
            { icon: Bike, label: "Repartidores", href: "/admin/drivers", roles: ['admin', 'manager'] },
        ]
    },
    {
        title: "CONTROL DE ASISTENCIA",
        items: [
            { icon: Clock, label: "Mi Turno / Entrada", href: "/admin/cashier/start-shift", roles: ['admin', 'manager', 'staff', 'waiter', 'cook', 'chef', 'cashier', 'cleaner', 'host', 'driver'] },
            { icon: History, label: "Historial Turnos", href: "/admin/payroll", roles: ['admin', 'manager'] },
        ]
    },
    {
        title: "TALENTO HUMANO",
        items: [
            { icon: Users, label: "Gestión de Personal", href: "/admin/employees", roles: ['admin', 'manager'] },
            { icon: BadgeDollarSign, label: "Nómina y Pagos", href: "/admin/payroll", roles: ['admin', 'manager'] },
        ]
    },
    {
        title: "BACKOFFICE & STOCK",
        items: [
            { icon: Package, label: "Stock e Insumos", href: "/admin/inventory", roles: ['admin', 'manager', 'chef'] },
            { icon: Truck, label: "Proveedores", href: "/admin/inventory/suppliers", roles: ['admin', 'manager'] },
            { icon: ShoppingBag, label: "Compras / Ingresos", href: "/admin/inventory/purchases", roles: ['admin', 'manager'] },
            { icon: UtensilsCrossed, label: "Menú & Productos", href: "/admin/products", roles: ['admin', 'manager', 'chef'] },
            { icon: ChefHat, label: "Libro de Recetas", href: "/admin/inventory/recipes", roles: ['admin', 'manager', 'chef'] },
            { icon: Tag, label: "Promociones / Cupones", href: "/admin/coupons", roles: ['admin', 'manager'] },
            { icon: BarChart3, label: "Reportes Avanzados", href: "/admin/reports", roles: ['admin', 'manager'] },
            { icon: Wallet, label: "Caja Menor / Gastos", href: "/admin/petty-cash", roles: ['admin', 'manager', 'cashier'] },
        ]
    },
    {
        title: "ESTRATEGIA & SAAS",
        items: [
            { icon: Zap, label: "Pargo Hub Live", href: "/admin/hub", roles: ['admin'] },
            { icon: ShieldCheck, label: "Auditoría / Roles", href: "/admin/employees", roles: ['admin'] },
            { icon: ShieldAlert, label: "Trazabilidad SaaS", href: "/admin/audit", roles: ['admin'] },
        ]
    },
    {
        title: "INFRAESTRUCTURA",
        items: [
            { icon: Settings, label: "Configuración", href: "/admin/settings", roles: ['admin'] },
            { icon: Printer, label: "Soporte Impresoras", href: "/admin/settings/printers", roles: ['admin', 'manager'] },
            { icon: Server, label: "Infraestructura Core", href: "/admin/settings/infrastructure", roles: ['admin'] },
        ]
    },
    {
        title: "MI CUENTA",
        items: [
            { icon: User, label: "Mi Perfil", href: "/admin/me", roles: ['admin', 'manager', 'cashier', 'waiter', 'cook', 'chef', 'cleaner', 'host'] },
        ]
    }
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const { restaurant, loading: restaurantLoading } = useRestaurant()
    const [loading, setLoading] = useState(true)
    const [authorized, setAuthorized] = useState(false)
    const [userRole, setUserRole] = useState<string>("")
    const [userName, setUserName] = useState<string>("")
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")

    // Activar Notificaciones Real-Time Globales
    useOrderNotifications()

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()

                if (!session) {
                    router.push("/login")
                    return
                }

                const { data, error: profileError } = await supabase
                    .from('profiles')
                    .select('role, full_name')
                    .eq('id', session.user.id)
                    .maybeSingle()

                if (profileError) throw profileError

                const allowedRoles = ['admin', 'staff', 'manager', 'cashier', 'waiter', 'cook', 'chef', 'cleaner', 'host', 'driver']

                if (!data || !allowedRoles.includes(data.role)) {
                    router.push("/")
                    return
                }

                setUserRole(data.role)
                setUserName(data.full_name || "Admin")
                setAuthorized(true)
            } catch (err) {
                console.error("Auth check failed:", err)
                router.push("/")
            } finally {
                setLoading(false)
            }
        }

        if (!restaurantLoading) {
            checkAuth()
        }
    }, [router, restaurantLoading])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-6">
                    <Zap className="w-12 h-12 text-primary animate-pulse" />
                    <div className="space-y-2 text-center">
                        <p className="font-black italic uppercase text-[10px] tracking-[0.4em] text-primary">Encriptando Sesión</p>
                        <p className="text-muted-foreground text-[9px] font-bold uppercase tracking-widest">Jamali Cloud Framework</p>
                    </div>
                </div>
            </div>
        )
    }

    if (!authorized) return null

    return (
        <ShiftGuard>
            <div className="flex min-h-screen bg-[#020406] text-foreground transition-colors duration-300 selection:bg-primary selection:text-black">
                {/* 🏰 JAMALI OS ELITE SIDEBAR (AURA STYLE) */}
                <aside className="w-72 border-r border-white/5 bg-[#0a0b0d]/80 backdrop-blur-[40px] hidden lg:flex flex-col sticky top-0 h-screen z-50 relative overflow-hidden">
                    {/* Background Decorative Glows */}
                    <div className="absolute -top-20 -left-20 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px] pointer-events-none" />
                    <div className="absolute bottom-40 -right-20 w-40 h-40 bg-primary/5 rounded-full blur-[60px] pointer-events-none" />

                    {/* Brand Header */}
                    <div className="p-10 pb-6 flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-primary/20 blur-md rounded-full scale-0 group-hover:scale-150 transition-transform duration-500" />
                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center relative z-10">
                                    <Zap className="w-6 h-6 text-primary" />
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xl font-black italic uppercase tracking-tighter text-white leading-none">
                                    JAMALI<span className="text-primary italic">OS</span>
                                </span>
                                <span className="text-[8px] font-black text-slate-600 tracking-[0.4em] uppercase mt-1">Aura Enterprise</span>
                            </div>
                        </div>
                    </div>

                    {/* Business Selector at Top */}
                    <div className="px-8 mb-4 relative z-10">
                        <BusinessSelector />
                    </div>

                    {/* Navigation Search */}
                    <div className="px-8 mb-8 relative z-10">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-primary transition-colors" />
                            <input
                                type="search"
                                name="pargo-master-search-no-autofill"
                                autoComplete="new-password"
                                placeholder="Buscar módulos..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full h-11 pl-12 pr-4 rounded-xl bg-white/[0.02] border border-white/5 outline-none focus:border-primary/30 text-[10px] font-bold uppercase tracking-[0.1em] placeholder:text-slate-700 transition-all font-sans text-white"
                            />
                        </div>
                    </div>

                    <QuickBusinessSwitch />

                    <div className="flex-1 overflow-y-auto px-6 custom-scrollbar space-y-12 pb-10 relative z-10">
                        {sidebarSections.map((section, idx) => {
                            const filteredItems = section.items.filter(item => {
                                const hasRole = userRole === 'admin' || item.roles.includes(userRole)
                                const matchesSearch = item.label.toLowerCase().includes(searchTerm.toLowerCase())
                                return hasRole && matchesSearch
                            })

                            if (filteredItems.length === 0) return null

                            return (
                                <div key={idx} className="space-y-4">
                                    <h4 className="px-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">{section.title}</h4>
                                    <div className="space-y-1">
                                        {filteredItems.map((item) => {
                                            const Icon = item.icon
                                            const isActive = pathname === item.href

                                            return (
                                                <Link key={item.href} href={item.href} className="block group relative">
                                                    {/* Active Indicator Bar */}
                                                    {isActive && (
                                                        <div className="absolute left-[-24px] top-1/2 -translate-y-1/2 w-1.5 h-8 bg-primary rounded-r-full shadow-[4px_0_15px_rgba(249,115,22,0.5)] animate-in slide-in-from-left-2 duration-300" />
                                                    )}

                                                    <div className={cn(
                                                        "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 relative group/item",
                                                        isActive
                                                            ? "bg-white/[0.04] text-white border border-white/5"
                                                            : "text-slate-500 hover:text-slate-200"
                                                    )}>
                                                        <div className="relative">
                                                            {isActive && (
                                                                <div className="absolute inset-0 bg-primary/20 blur-md rounded-full scale-150" />
                                                            )}
                                                            <Icon className={cn(
                                                                "w-5 h-5 transition-all relative z-10",
                                                                isActive ? "text-primary scale-110" : "group-hover:text-primary/70"
                                                            )} />
                                                        </div>
                                                        <span className={cn(
                                                            "text-xs font-bold tracking-wide transition-all",
                                                            isActive ? "text-white" : "group-hover:translate-x-1"
                                                        )}>
                                                            {item.label}
                                                        </span>
                                                    </div>
                                                </Link>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Footer / Profile Section at BOTTOM (Exact AURA match) */}
                    <div className="p-8 pb-10 border-t border-white/5 bg-[#0a0b0d]/50 relative z-10 space-y-8">
                        {/* Profile Section */}
                        <div className="flex items-center gap-4 group cursor-default">
                            <div className="relative">
                                {/* Orange Glow behind profile */}
                                <div className="absolute inset-0 bg-orange-500/30 blur-xl rounded-full scale-125" />
                                <div className="w-12 h-12 rounded-full border border-white/10 overflow-hidden relative z-10 flex items-center justify-center bg-slate-900 shadow-2xl group-hover:border-primary/50 transition-all duration-500">
                                    <span className="text-white font-black italic text-lg">{userName.charAt(0)}</span>
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[13px] font-black text-white tracking-wide uppercase italic">{userName}</span>
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">{userRole}</span>
                            </div>
                        </div>

                        {/* Logout / System Action */}
                        <Button
                            variant="ghost"
                            className="w-full justify-start gap-4 h-12 text-[9px] font-black uppercase italic tracking-[0.3em] text-rose-500/70 hover:bg-rose-500/10 hover:text-rose-400 rounded-xl transition-all border border-rose-500/5 group"
                            onClick={async () => {
                                await supabase.auth.signOut()
                                router.push("/login")
                            }}
                        >
                            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            CERRAR SESIÓN
                        </Button>
                    </div>
                </aside>

                {/* 📺 MAIN COMMAND CENTER */}
                <main className="flex-1 flex flex-col min-w-0">
                    {/* Mobile Floating Header */}
                    <header className="h-16 border-b border-border flex items-center px-6 lg:hidden justify-between bg-card/80 backdrop-blur-md sticky top-0 z-50">
                        <div className="flex items-center gap-3">
                            {restaurant?.logo_url ? (
                                <img src={restaurant.logo_url} className="w-6 h-6 object-contain" alt="Logo" />
                            ) : (
                                <Zap className="w-5 h-5 text-primary" />
                            )}
                            <span className="font-black italic text-sm tracking-tighter uppercase text-foreground">
                                {restaurant?.name || "JAMALI OS"} <span className="text-primary italic">JAMALI OS</span>
                            </span>
                        </div>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="rounded-xl border border-border active:scale-90 transition-transform"
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <Menu className="w-5 h-5" />
                        </Button>
                    </header>

                    {/* 📱 MOBILE SIDEBAR OVERLAY (AURA ELITE) */}
                    {isMobileMenuOpen && (
                        <div className="fixed inset-0 z-[100] lg:hidden">
                            <div
                                className="absolute inset-0 bg-[#020406]/90 backdrop-blur-xl animate-in fade-in duration-500"
                                onClick={() => setIsMobileMenuOpen(false)}
                            />
                            <aside className="absolute left-0 top-0 bottom-0 w-[300px] bg-[#0a0b0d] border-r border-white/5 flex flex-col animate-in slide-in-from-left duration-500 shadow-3xl overflow-hidden">
                                {/* Decorative Glow */}
                                <div className="absolute top-0 left-0 w-full h-64 bg-orange-500/5 blur-[80px] pointer-events-none" />

                                <div className="p-8 border-b border-white/5 flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                                            <Zap className="w-5 h-5 text-primary" />
                                        </div>
                                        <span className="font-black italic text-base tracking-tighter uppercase text-white">JAMALI <span className="text-primary">OS</span></span>
                                    </div>
                                    <Button size="icon" variant="ghost" className="rounded-xl hover:bg-white/5" onClick={() => setIsMobileMenuOpen(false)}>
                                        <X className="w-5 h-5 text-slate-500" />
                                    </Button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar relative z-10">
                                    {sidebarSections.map((section, idx) => {
                                        const filteredItems = section.items.filter(item => userRole === 'admin' || item.roles.includes(userRole))
                                        if (filteredItems.length === 0) return null

                                        return (
                                            <div key={idx} className="space-y-4">
                                                <h4 className="px-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">{section.title}</h4>
                                                <div className="space-y-1">
                                                    {filteredItems.map((item) => {
                                                        const Icon = item.icon
                                                        const isActive = pathname === item.href

                                                        return (
                                                            <Link
                                                                key={item.href}
                                                                href={item.href}
                                                                onClick={() => setIsMobileMenuOpen(false)}
                                                                className="block group relative"
                                                            >
                                                                <div className={cn(
                                                                    "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 relative",
                                                                    isActive
                                                                        ? "bg-white/[0.04] text-white border border-white/5 shadow-lg"
                                                                        : "text-slate-500 hover:text-slate-200"
                                                                )}>
                                                                    <Icon className={cn(
                                                                        "w-5 h-5 transition-all",
                                                                        isActive ? "text-primary scale-110" : "group-hover:text-primary/70"
                                                                    )} />
                                                                    <span className={cn(
                                                                        "text-[10px] font-black uppercase italic tracking-widest transition-all",
                                                                        isActive ? "text-white" : "group-hover:translate-x-1"
                                                                    )}>
                                                                        {item.label}
                                                                    </span>
                                                                </div>
                                                            </Link>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>

                                <div className="p-8 border-t border-white/5 bg-black/20 relative z-10">
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-start gap-4 h-14 text-[10px] font-black uppercase italic tracking-[0.3em] text-rose-500/70 hover:bg-rose-500/10 hover:text-rose-400 rounded-xl transition-all border border-rose-500/5 group"
                                        onClick={async () => {
                                            await supabase.auth.signOut()
                                            router.push("/login")
                                        }}
                                    >
                                        <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                        CERRAR SESIÓN
                                    </Button>
                                </div>
                            </aside>
                        </div>
                    )}

                    <div className="flex-1 relative overflow-y-auto custom-scrollbar">
                        {children}
                    </div>
                    <PargoBot />
                    <IncomingOrderAlert />
                    <Toaster />
                </main>

                <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
            `}</style>
            </div>
        </ShiftGuard>
    )
}
