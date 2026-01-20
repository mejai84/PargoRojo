
import Link from "next/link"
import Image from "next/image"
import { Shield, Instagram, Facebook, MapPin, Phone, Mail } from "lucide-react"

export function Footer() {
    return (
        <footer className="w-full bg-card/30 border-t border-white/5 pt-16 pb-8">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Logo & Info */}
                    <div className="space-y-6">
                        <Link href="/" className="flex items-center gap-3">
                            <Image
                                src="/images/logo.jpg"
                                alt="Pozu 2.0 Logo"
                                width={40}
                                height={40}
                                className="rounded-full"
                            />
                            <span className="text-xl font-bold tracking-tighter">POZU 2.0</span>
                        </Link>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Las mejores hamburguesas artesanales de Asturias. Calidad premium y sabor inigualable en cada bocado.
                        </p>
                        <div className="flex items-center gap-4">
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all">
                                <Facebook className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-6">
                        <h4 className="font-bold uppercase tracking-wider text-sm">Navegación</h4>
                        <ul className="space-y-4 text-sm text-muted-foreground">
                            <li><Link href="/menu" className="hover:text-primary transition-colors">Nuestra Carta</Link></li>
                            <li><Link href="/combos" className="hover:text-primary transition-colors">Combos Especiales</Link></li>
                            <li><Link href="/nosotros" className="hover:text-primary transition-colors">Sobre Nosotros</Link></li>
                            <li><Link href="/cuenta" className="hover:text-primary transition-colors">Mi Cuenta</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="space-y-6">
                        <h4 className="font-bold uppercase tracking-wider text-sm">Contacto</h4>
                        <ul className="space-y-4 text-sm text-muted-foreground">
                            <li className="flex items-center gap-3">
                                <MapPin className="w-4 h-4 text-primary" />
                                <span>C. Río Cares, 2, Pola de Laviana</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="w-4 h-4 text-primary" />
                                <span>+34 987 654 321</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="w-4 h-4 text-primary" />
                                <span>hola@pozu.com</span>
                            </li>
                        </ul>
                    </div>

                    {/* Admin Access (Restricted) */}
                    <div className="space-y-6">
                        <h4 className="font-bold uppercase tracking-wider text-sm">Personal</h4>
                        <p className="text-xs text-muted-foreground">
                            Si eres parte del equipo de Pozu, accede aquí para gestionar pedidos y productos.
                        </p>
                        <Link
                            href="/admin"
                            className="inline-flex items-center gap-2 px-4 py-2 border border-white/10 rounded-xl text-sm font-bold hover:bg-white/5 transition-all group"
                        >
                            <Shield className="w-4 h-4 group-hover:text-primary transition-colors" />
                            Acceso Staff
                        </Link>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
                    <p>© {new Date().getFullYear()} POZU 2.0. Todos los derechos reservados.</p>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-foreground">Privacidad</a>
                        <a href="#" className="hover:text-foreground">Términos</a>
                        <a href="#" className="hover:text-foreground">Cookies</a>
                    </div>
                </div>
            </div>
        </footer>
    )
}
