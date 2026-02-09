"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useOrderNotifications } from "@/hooks/use-order-notifications"
import { Toaster } from "@/components/ui/sonner"
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
            <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300 selection:bg-primary selection:text-black">
                {/* 🏰 ENTERPRISE SIDEBAR */}
                <aside className="w-72 border-r border-border bg-card hidden lg:flex flex-col sticky top-0 h-screen shadow-sm">

                    {/* Brand Header */}
                    <div className="p-8 pb-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-secondary p-0.5 shadow-lg shadow-primary/20">
                                <div className="w-full h-full bg-card rounded-[0.9rem] flex items-center justify-center overflow-hidden">
                                    {restaurant?.logo_url ? (
                                        <img src={restaurant.logo_url} className="w-full h-full object-contain" alt="Logo" />
                                    ) : (
                                        <Zap className="w-5 h-5 text-primary" />
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-black italic uppercase tracking-tighter text-foreground">
                                    {restaurant?.name || "RESTAURANTE"} <span className="text-primary italic">JAMALI OS</span>
                                </span>
                                <span className="text-[8px] font-bold text-muted-foreground tracking-[0.2em] uppercase">Enterprise v2.0</span>
                            </div>
                        </div>
                    </div>

                    {/* Profile Card Mini */}
                    <div className="px-6 py-4 mb-4">
                        <BusinessSelector />

                        <div className="p-4 rounded-3xl bg-muted/50 border border-border flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center border border-border shadow-sm font-black text-primary italic">
                                {userName.charAt(0)}
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-xs font-black italic text-foreground uppercase truncate">{userName}</span>
                                <div className="flex items-center gap-1.5 pt-0.5">
                                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{userRole}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Search */}
                    <div className="px-6 mb-6">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Buscar módulo..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full h-10 pl-10 pr-4 rounded-xl bg-background border border-border outline-none focus:border-primary/50 text-[10px] font-bold uppercase tracking-widest placeholder:text-muted-foreground/50 transition-all font-sans"
                            />
                        </div>
                    </div>

                    <QuickBusinessSwitch />

                    <div className="flex-1 overflow-y-auto px-4 custom-scrollbar space-y-8 pb-10">
                        {sidebarSections.map((section, idx) => {
                            const filteredItems = section.items.filter(item => {
                                const hasRole = userRole === 'admin' || item.roles.includes(userRole)
                                const matchesSearch = item.label.toLowerCase().includes(searchTerm.toLowerCase())
                                return hasRole && matchesSearch
                            })

                            if (filteredItems.length === 0) return null

                            return (
                                <div key={idx} className="space-y-3">
                                    <h4 className="px-4 text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] font-mono">{section.title}</h4>
                                    <div className="space-y-1">
                                        {filteredItems.map((item) => {
                                            const Icon = item.icon
                                            const isActive = pathname === item.href

                                            return (
                                                <Link key={item.href} href={item.href} className="block group">
                                                    <div className={cn(
                                                        "flex items-center justify-between px-4 py-3 rounded-2xl transition-all relative overflow-hidden",
                                                        isActive
                                                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                                    )}>
                                                        <div className="flex items-center gap-3 relative z-10">
                                                            <Icon className={cn("w-4 h-4", isActive ? "text-primary-foreground" : "group-hover:text-primary transition-colors")} />
                                                            <span className="text-[10px] font-black uppercase italic tracking-widest">{item.label}</span>
                                                        </div>
                                                        {isActive && <ChevronRight className="w-4 h-4" />}
                                                    </div>
                                                </Link>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-border space-y-4">
                        <NotificationBell />
                        <Button
                            variant="ghost"
                            className="w-full justify-start gap-4 h-12 text-[10px] font-black uppercase italic tracking-widest text-rose-600 hover:bg-destructive/10 hover:text-destructive rounded-[1.5rem] transition-all"
                            onClick={async () => {
                                await supabase.auth.signOut()
                                router.push("/login")
                            }}
                        >
                            <LogOut className="w-4 h-4" />
                            DESCONECTAR SISTEMA
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

                    {/* 📱 MOBILE SIDEBAR OVERLAY */}
                    {isMobileMenuOpen && (
                        <div className="fixed inset-0 z-[100] lg:hidden">
                            <div
                                className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300"
                                onClick={() => setIsMobileMenuOpen(false)}
                            />
                            <aside className="absolute left-0 top-0 bottom-0 w-[280px] bg-background border-r border-border flex flex-col animate-in slide-in-from-left duration-300 shadow-2xl">
                                <div className="p-6 border-b border-border flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Zap className="w-5 h-5 text-primary" />
                                        <span className="font-black italic text-sm tracking-tighter uppercase text-foreground">JAMALI <span className="text-primary italic">OS</span></span>
                                    </div>
                                    <Button size="icon" variant="ghost" onClick={() => setIsMobileMenuOpen(false)}>
                                        <X className="w-5 h-5" />
                                    </Button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
                                    {sidebarSections.map((section, idx) => (
                                        <div key={idx} className="space-y-3">
                                            <h4 className="px-4 text-[8px] font-black text-muted-foreground uppercase tracking-[0.3em]">{section.title}</h4>
                                            <div className="space-y-1">
                                                {section.items
                                                    .filter(item => userRole === 'admin' || item.roles.includes(userRole))
                                                    .map((item) => {
                                                        const Icon = item.icon
                                                        const isActive = pathname === item.href

                                                        return (
                                                            <Link
                                                                key={item.href}
                                                                href={item.href}
                                                                onClick={() => setIsMobileMenuOpen(false)}
                                                                className="block"
                                                            >
                                                                <div className={cn(
                                                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                                                                    isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                                                                )}>
                                                                    <Icon className="w-4 h-4" />
                                                                    <span className="text-[10px] font-black uppercase italic tracking-widest">{item.label}</span>
                                                                </div>
                                                            </Link>
                                                        )
                                                    })}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-6 border-t border-border">
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-start gap-4 h-12 text-[10px] font-black uppercase italic tracking-widest text-rose-600"
                                        onClick={async () => {
                                            await supabase.auth.signOut()
                                            router.push("/login")
                                        }}
                                    >
                                        <LogOut className="w-4 h-4" />
                                        SALIR
                                    </Button>
                                </div>
                            </aside>
                        </div>
                    )}

                    <div className="flex-1 p-6 md:p-12 overflow-y-auto">
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
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
            </div>
        </ShiftGuard>
    )
}
