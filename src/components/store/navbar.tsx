"use client"

import Link from "next/link"
import Image from "next/image"
import { useCart } from "@/components/store/cart-context"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Menu, User, X, ChevronRight, ShieldCheck, ChevronDown, Utensils } from "lucide-react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { User as SupabaseUser } from "@supabase/supabase-js"

export function Navbar() {
    const { toggleCart, cartCount } = useCart()
    const pathname = usePathname()
    const [user, setUser] = useState<SupabaseUser | null>(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isProductMenuOpen, setIsProductMenuOpen] = useState(false)
    const [products, setProducts] = useState<any[]>([])
    const [categories, setCategories] = useState<any[]>([])

    const [showCombos, setShowCombos] = useState(false)

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            const currentUser = session?.user ?? null
            setUser(currentUser)
            if (currentUser) checkAdmin(currentUser.id)
        })

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const currentUser = session?.user ?? null
            setUser(currentUser)
            if (currentUser) checkAdmin(currentUser.id)
            else setIsAdmin(false)
        })

        // Fetch data for the quick menu
        fetchQuickData()
        fetchSettings()

        return () => subscription.unsubscribe()
    }, [])

    const checkAdmin = async (userId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single()

        if (!error && data) {
            setIsAdmin(data.role === 'admin' || data.role === 'staff')
        }
    }

    const fetchSettings = async () => {
        const { data } = await supabase
            .from('settings')
            .select('value')
            .eq('key', 'feature_flags')
            .single()

        if (data?.value) {
            const features = data.value as any
            setShowCombos(!!features.enable_combos)
        }
    }

    const fetchQuickData = async () => {
        const { data: productsData } = await supabase
            .from('products')
            .select('id, name, category_id, image_url, price')
            .is('deleted_at', null)
            .eq('is_available', true)
            .limit(8)

        const { data: categoriesData } = await supabase
            .from('categories')
            .select('*')
            .eq('is_active', true)
            .order('order_position')

        if (productsData) setProducts(productsData)
        if (categoriesData) setCategories(categoriesData)
    }

    const isActive = (path: string) => pathname === path

    const navLinks: { href: string; label: string; hasDropdown?: boolean }[] = [
        { href: "/", label: "Inicio" },
        { href: "/menu", label: "Menú" },
        ...(showCombos ? [{ href: "/combos", label: "Combos" }] : []),
        { href: "/nosotros", label: "Nosotros" },
    ]

    return (
        <>
            <nav className="fixed top-0 w-full z-50 glass border-b border-white/5">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <Image
                            src="/images/logo.jpg"
                            alt="Pargo Rojo Logo"
                            width={48}
                            height={48}
                            className="rounded-full border-2 border-white/10 group-hover:border-primary/50 transition-colors"
                        />
                        <span className="text-xl font-bold tracking-tighter text-gradient uppercase">
                            Pargo Rojo
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center gap-4 text-sm font-medium text-muted-foreground">
                        {navLinks.map((link) => (
                            <div
                                key={link.href}
                                className="relative group/link"
                                onMouseEnter={() => link.hasDropdown && setIsProductMenuOpen(true)}
                                onMouseLeave={() => link.hasDropdown && setIsProductMenuOpen(false)}
                            >
                                <Link
                                    href={link.href}
                                    className={cn(
                                        "px-4 py-2 hover:text-foreground transition-colors flex items-center gap-1 rounded-full hover:bg-white/5",
                                        isActive(link.href) && "text-primary hover:text-primary bg-primary/5"
                                    )}
                                >
                                    {link.label}
                                    {link.hasDropdown && <ChevronDown className={cn("w-4 h-4 transition-transform", isProductMenuOpen && "rotate-180")} />}
                                </Link>

                                {link.hasDropdown && (
                                    <div className={cn(
                                        "absolute top-full left-0 w-[600px] bg-background/95 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl transition-all duration-300 transform origin-top-left z-50 mt-1",
                                        isProductMenuOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-4 pointer-events-none"
                                    )}>
                                        <div className="grid grid-cols-2 gap-8">
                                            <div>
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-4">Categorías</h4>
                                                <div className="grid gap-2">
                                                    {categories.map(cat => (
                                                        <Link
                                                            key={cat.id}
                                                            href={`/menu?category=${cat.id}`}
                                                            className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors group/item"
                                                        >
                                                            <span className="text-foreground group-hover/item:text-primary transition-colors font-medium">{cat.name}</span>
                                                            <ChevronRight className="w-4 h-4 opacity-0 group-hover/item:opacity-100 group-hover/item:translate-x-1 transition-all" />
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-4">Nuestros Favoritos</h4>
                                                <div className="grid gap-3">
                                                    {products.slice(0, 4).map(prod => (
                                                        <Link
                                                            key={prod.id}
                                                            href={`/producto/${prod.id}`}
                                                            className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group/item"
                                                        >
                                                            <div className="w-12 h-12 relative rounded-lg overflow-hidden bg-white/5">
                                                                <Image src={prod.image_url || "/images/placeholder.png"} alt={prod.name} fill className="object-cover" />
                                                            </div>
                                                            <div>
                                                                <div className="text-foreground font-bold text-sm group-hover/item:text-primary transition-colors">{prod.name}</div>
                                                                <div className="text-xs text-muted-foreground">{prod.price.toFixed(2)}€</div>
                                                            </div>
                                                        </Link>
                                                    ))}
                                                    <Link href="/menu" className="mt-2 block text-center p-3 border border-primary/20 rounded-xl text-primary font-bold hover:bg-primary/10 transition-colors">
                                                        Ver Carta Completa
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        {isAdmin && (
                            <Link
                                href="/admin"
                                className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-all font-bold border border-primary/20 ml-2"
                            >
                                <ShieldCheck className="w-4 h-4" />
                                Panel Admin
                            </Link>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        {/* User Button */}
                        {user ? (
                            <Link href="/cuenta">
                                <Button variant="ghost" size="icon" className="hover:bg-white/5 rounded-full">
                                    <User className="w-5 h-5" />
                                </Button>
                            </Link>
                        ) : (
                            <Link href="/login">
                                <Button variant="ghost" size="sm" className="hidden md:flex hover:bg-white/5 rounded-full">
                                    Inicia Sesión
                                </Button>
                            </Link>
                        )}

                        <Button variant="ghost" size="icon" className="relative group hover:bg-white/5 rounded-full" onClick={toggleCart}>
                            <ShoppingCart className="w-5 h-5 group-hover:text-primary transition-colors" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-[10px] text-white rounded-full flex items-center justify-center font-bold animate-in zoom-in">
                                    {cartCount}
                                </span>
                            )}
                        </Button>
                        <Link href="/menu" className="hidden md:block">
                            <Button className="font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform bg-primary hover:bg-primary/90">
                                Hacer Pedido
                            </Button>
                        </Link>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden hover:bg-white/5 rounded-full"
                            onClick={() => setIsMenuOpen(true)}
                        >
                            <Menu className="w-6 h-6" />
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Drawer */}
            <div className={cn(
                "fixed inset-0 z-[60] bg-background/98 backdrop-blur-xl transition-all duration-500 md:hidden",
                isMenuOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
            )}>
                <div className="flex flex-col h-full bg-background/50">
                    <div className="h-20 flex items-center justify-between px-6 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <Utensils className="w-6 h-6 text-primary" />
                            <span className="text-xl font-bold tracking-tight">CARTA POZU</span>
                        </div>
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/5" onClick={() => setIsMenuOpen(false)}>
                            <X className="w-7 h-7" />
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-10">
                        {/* Main Links */}
                        <div className="grid gap-3">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={cn(
                                        "flex items-center justify-between p-5 rounded-2xl text-xl font-bold transition-all border",
                                        isActive(link.href)
                                            ? "bg-primary/10 text-primary border-primary/20"
                                            : "bg-white/5 text-foreground border-transparent active:scale-95"
                                    )}
                                >
                                    {link.label}
                                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                </Link>
                            ))}
                            {isAdmin && (
                                <Link
                                    href="/admin"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-4 p-5 rounded-2xl text-xl font-bold bg-secondary text-white shadow-xl shadow-secondary/20 mt-2 active:scale-95 transition-transform"
                                >
                                    <ShieldCheck className="w-7 h-7" />
                                    Panel Administración
                                </Link>
                            )}
                        </div>

                        {/* Quick Product Access */}
                        <div className="space-y-5">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Recomendados</h3>
                                <Link href="/menu" onClick={() => setIsMenuOpen(false)} className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors">VER TODO</Link>
                            </div>
                            <div className="grid gap-3">
                                {products.map((product) => (
                                    <Link
                                        key={product.id}
                                        href={`/producto/${product.id}`}
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-primary/50 transition-all group active:bg-white/10"
                                    >
                                        <div className="w-14 h-14 relative rounded-xl overflow-hidden bg-primary/10">
                                            <Image src={product.image_url || "/images/placeholder.png"} alt={product.name} fill className="object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-lg group-hover:text-primary transition-colors">{product.name}</div>
                                            <div className="text-primary font-bold">{product.price.toFixed(2)}€</div>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-8 border-t border-white/5 bg-white/[0.02]">
                        {!user ? (
                            <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                                <Button className="w-full h-16 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20">
                                    Inicia Sesión
                                </Button>
                            </Link>
                        ) : (
                            <Link href="/cuenta" onClick={() => setIsMenuOpen(false)}>
                                <Button variant="outline" className="w-full h-16 text-lg font-bold rounded-2xl border-white/10 hover:bg-white/5">
                                    Mi Cuenta
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}
