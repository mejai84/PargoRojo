"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    ShoppingBag,
    UtensilsCrossed,
    Settings,
    LogOut,
    Users,
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
    X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { NotificationBell } from "@/components/admin/notification-bell"
import { PargoBot } from "@/components/admin/pargo-bot"

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
        title: "BACKOFFICE & STOCK",
        items: [
            { icon: Package, label: "Inventario / Fisico", href: "/admin/inventory", roles: ['admin', 'manager', 'chef'] },
            { icon: UtensilsCrossed, label: "Menú & Recetas", href: "/admin/products", roles: ['admin', 'manager', 'chef'] },
            { icon: Tag, label: "Promociones / Cupones", href: "/admin/coupons", roles: ['admin', 'manager'] },
            { icon: BarChart3, label: "Reportes Avanzados", href: "/admin/reports", roles: ['admin', 'manager'] },
            { icon: Wallet, label: "Caja Menor / Gastos", href: "/admin/petty-cash", roles: ['admin', 'manager', 'cashier'] },
        ]
    },
    {
        title: "Negocio & Estrategia",
        items: [
            { icon: Zap, label: "Pargo Hub Live", href: "/admin/hub", roles: ['admin'] },
            { icon: BarChart3, label: "Reportes & Analytics", href: "/admin/reports", roles: ['admin'] },
            { icon: ShieldCheck, label: "Seguridad & Roles", href: "/admin/employees", roles: ['admin'] },
        ]
    },
    {
        title: "INFRAESTRUCTURA",
        items: [
            { icon: Settings, label: "Configuración", href: "/admin/settings", roles: ['admin'] },
            { icon: Printer, label: "Soporte Impresoras", href: "/admin/settings/printers", roles: ['admin', 'manager'] },
        ]
    }
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [authorized, setAuthorized] = useState(false)
    const [userRole, setUserRole] = useState<string>("")
    const [userName, setUserName] = useState<string>("")
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [businessInfo, setBusinessInfo] = useState<any>({ name: "PARGO OS", logo_url: "" })

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                router.push("/login")
                return
            }

            const [{ data }, { data: settings }] = await Promise.all([
                supabase.from('profiles').select('role, full_name').eq('id', session.user.id).single(),
                supabase.from('settings').select('value').eq('key', 'business_info').single()
            ])

            if (settings?.value) setBusinessInfo(settings.value)

            const allowedRoles = ['admin', 'staff', 'manager', 'cashier', 'waiter', 'cook', 'chef', 'cleaner', 'host']

            if (!data || !allowedRoles.includes(data.role)) {
                router.push("/")
                return
            }

            setUserRole(data.role)
            setUserName(data.full_name || "Admin")
            setAuthorized(true)
            setLoading(false)
        }

        checkAuth()
    }, [router])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="flex flex-col items-center gap-6">
                    <Zap className="w-12 h-12 text-primary animate-pulse" />
                    <div className="space-y-2 text-center">
                        <p className="font-black italic uppercase text-[10px] tracking-[0.4em] text-primary">Encriptando Sesión</p>
                        <p className="text-gray-600 text-[9px] font-bold uppercase tracking-widest">Pargo Rojo Cloud Framework</p>
                    </div>
                </div>
            </div>
        )
    }

    if (!authorized) return null

    return (
        <div className="flex min-h-screen bg-slate-50/50 selection:bg-primary selection:text-black">
            {/* 🏰 ENTERPRISE SIDEBAR */}
            <aside className="w-72 border-r border-slate-200 bg-white hidden lg:flex flex-col sticky top-0 h-screen shadow-sm">

                {/* Brand Header */}
                <div className="p-8 pb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-secondary p-0.5 shadow-lg shadow-primary/20">
                            <div className="w-full h-full bg-white rounded-[0.9rem] flex items-center justify-center overflow-hidden">
                                {businessInfo.logo_url ? (
                                    <img src={businessInfo.logo_url} className="w-full h-full object-contain" alt="Logo" />
                                ) : (
                                    <Zap className="w-5 h-5 text-primary" />
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-black italic uppercase tracking-tighter text-slate-900">{businessInfo.name} <span className="text-primary italic">OS</span></span>
                            <span className="text-[8px] font-bold text-slate-400 tracking-[0.2em] uppercase">Enterprise v1.6</span>
                        </div>
                    </div>
                </div>

                {/* Profile Card Mini */}
                <div className="px-6 py-4 mb-4">
                    <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-sm font-black text-primary italic">
                            {userName.charAt(0)}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-xs font-black italic text-slate-900 uppercase truncate">{userName}</span>
                            <div className="flex items-center gap-1.5 pt-0.5">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{userRole}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation Search */}
                <div className="px-6 mb-6">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar módulo..."
                            className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-primary/50 text-[10px] font-bold uppercase tracking-widest placeholder:text-slate-300 transition-all"
                        />
                    </div>
                </div>

                {/* Sections ScrollArea */}
                <div className="flex-1 overflow-y-auto px-4 custom-scrollbar space-y-8 pb-10">
                    {sidebarSections.map((section, idx) => (
                        <div key={idx} className="space-y-3">
                            <h4 className="px-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono">{section.title}</h4>
                            <div className="space-y-1">
                                {section.items
                                    .filter(item => userRole === 'admin' || item.roles.includes(userRole))
                                    .map((item) => {
                                        const Icon = item.icon
                                        const isActive = pathname === item.href

                                        return (
                                            <Link key={item.href} href={item.href} className="block group">
                                                <div className={cn(
                                                    "flex items-center justify-between px-4 py-3 rounded-2xl transition-all relative overflow-hidden",
                                                    isActive
                                                        ? "bg-primary text-black shadow-lg shadow-primary/20"
                                                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                                )}>
                                                    <div className="flex items-center gap-3 relative z-10">
                                                        <Icon className={cn("w-4 h-4", isActive ? "text-black" : "group-hover:text-primary transition-colors")} />
                                                        <span className="text-[10px] font-black uppercase italic tracking-widest">{item.label}</span>
                                                    </div>
                                                    {isActive && <ChevronRight className="w-4 h-4" />}
                                                </div>
                                            </Link>
                                        )
                                    })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-slate-100 space-y-4">
                    <NotificationBell />
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-4 h-12 text-[10px] font-black uppercase italic tracking-widest text-rose-600 hover:bg-rose-50 hover:text-white rounded-[1.5rem] transition-all"
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
                <header className="h-16 border-b border-slate-200 flex items-center px-6 lg:hidden justify-between bg-white/80 backdrop-blur-md sticky top-0 z-50">
                    <div className="flex items-center gap-3">
                        {businessInfo.logo_url ? (
                            <img src={businessInfo.logo_url} className="w-6 h-6 object-contain" alt="Logo" />
                        ) : (
                            <Zap className="w-5 h-5 text-primary" />
                        )}
                        <span className="font-black italic text-sm tracking-tighter uppercase text-slate-900">{businessInfo.name} <span className="text-primary italic">OS</span></span>
                    </div>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="rounded-xl border border-slate-200 active:scale-90 transition-transform"
                        onClick={() => setIsMobileMenuOpen(true)}
                    >
                        <Menu className="w-5 h-5" />
                    </Button>
                </header>

                {/* 📱 MOBILE SIDEBAR OVERLAY */}
                {isMobileMenuOpen && (
                    <div className="fixed inset-0 z-[100] lg:hidden">
                        <div
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                        <aside className="absolute left-0 top-0 bottom-0 w-[280px] bg-white border-r border-slate-200 flex flex-col animate-in slide-in-from-left duration-300 shadow-2xl">
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Zap className="w-5 h-5 text-primary" />
                                    <span className="font-black italic text-sm tracking-tighter uppercase text-slate-900">PARGO <span className="text-primary italic">OS</span></span>
                                </div>
                                <Button size="icon" variant="ghost" onClick={() => setIsMobileMenuOpen(false)}>
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
                                {sidebarSections.map((section, idx) => (
                                    <div key={idx} className="space-y-3">
                                        <h4 className="px-4 text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">{section.title}</h4>
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
                                                                isActive ? "bg-primary text-black" : "text-slate-500 hover:text-slate-900"
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

                            <div className="p-6 border-t border-slate-100">
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
    )
}
