
import Link from "next/link"
import Image from "next/image"
import { Shield, Instagram, Facebook, MapPin, Phone, Mail } from "lucide-react"

export function Footer() {
    return (
        <footer className="w-full bg-gray-50 border-t border-gray-100 pt-16 pb-8">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Logo & Info */}
                    <div className="space-y-6">
                        <Link href="/" className="flex items-center gap-3">
                            <Image
                                src="/images/logo.jpg"
                                alt="Pargo Rojo Logo"
                                width={40}
                                height={40}
                                className="rounded-full"
                            />
                            <span className="text-xl font-bold tracking-tighter text-gray-900">Pargo Rojo</span>
                        </Link>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            Lo mejor en comida de mar, Pescados y Mariscos. Espectaculares asados en Caucasia, Antioquia.
                        </p>
                        <div className="flex items-center gap-4">
                            <a href="#" className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-primary hover:text-white transition-all text-gray-600">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-primary hover:text-white transition-all text-gray-600">
                                <Facebook className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-6">
                        <h4 className="font-bold uppercase tracking-wider text-sm text-gray-900">Navegación</h4>
                        <ul className="space-y-4 text-sm text-gray-600">
                            <li><Link href="/menu" className="hover:text-primary transition-colors">Nuestra Carta</Link></li>
                            <li><Link href="/combos" className="hover:text-primary transition-colors">Combos Especiales</Link></li>
                            <li><Link href="/nosotros" className="hover:text-primary transition-colors">Sobre Nosotros</Link></li>
                            <li><Link href="/cuenta" className="hover:text-primary transition-colors">Mi Cuenta</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="space-y-6">
                        <h4 className="font-bold uppercase tracking-wider text-sm text-gray-900">Contacto</h4>
                        <ul className="space-y-4 text-sm text-gray-600">
                            <li className="flex items-center gap-3">
                                <MapPin className="w-4 h-4 text-primary" />
                                <span>C.Cial. Cauca Centro, Caucasia</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="w-4 h-4 text-primary" />
                                <span>320 784 8287</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="w-4 h-4 text-primary" />
                                <span>contacto@pargorojo.com</span>
                            </li>
                        </ul>
                    </div>

                    {/* Admin Access (Restricted) */}
                    <div className="space-y-6">
                        <h4 className="font-bold uppercase tracking-wider text-sm text-gray-900">Personal</h4>
                        <p className="text-xs text-gray-600">
                            Si eres parte del equipo de Pargo Rojo, accede aquí para gestionar pedidos y productos.
                        </p>
                        <Link
                            href="/admin"
                            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-100 transition-all group text-gray-700"
                        >
                            <Shield className="w-4 h-4 group-hover:text-primary transition-colors" />
                            Acceso Personal
                        </Link>
                    </div>
                </div>

                <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
                    <p>© {new Date().getFullYear()} PARGO ROJO. Todos los derechos reservados.</p>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-gray-900">Privacidad</a>
                        <a href="#" className="hover:text-gray-900">Términos</a>
                        <a href="#" className="hover:text-gray-900">Cookies</a>
                    </div>
                </div>
            </div>
        </footer>
    )
}
