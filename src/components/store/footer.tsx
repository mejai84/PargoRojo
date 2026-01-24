"use client"

import Link from "next/link"
import { Shield, Instagram, Facebook, MapPin, Phone, Mail, Zap, Video, Youtube, Twitter, Link2 } from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"

export function Footer() {
    const [info, setInfo] = useState<any>({
        name: "PARGO ROJO",
        logo_url: "",
        address: "C.Cial. Cauca Centro, Caucasia",
        phone: "320 784 8287",
        email: "contacto@pargorojo.com",
        instagram_url: "",
        facebook_url: "",
        tiktok_url: "",
        youtube_url: "",
        threads_url: "",
        twitter_url: ""
    })

    useEffect(() => {
        const fetchInfo = async () => {
            const { data } = await supabase.from('settings').select('value').eq('key', 'business_info').single()
            if (data?.value) setInfo(data.value)
        }
        fetchInfo()
    }, [])

    const socialLinks = [
        { url: info.instagram_url, icon: <Instagram className="w-5 h-5" />, color: "hover:bg-pink-500 hover:text-white" },
        { url: info.facebook_url, icon: <Facebook className="w-5 h-5" />, color: "hover:bg-blue-600 hover:text-white" },
        { url: info.tiktok_url, icon: <Video className="w-5 h-5" />, color: "hover:bg-black hover:text-white" },
        { url: info.youtube_url, icon: <Youtube className="w-5 h-5" />, color: "hover:bg-red-600 hover:text-white" },
        { url: info.threads_url, icon: <Link2 className="w-5 h-5" />, color: "hover:bg-slate-900 hover:text-white" },
        { url: info.twitter_url, icon: <Twitter className="w-5 h-5" />, color: "hover:bg-slate-800 hover:text-white" },
    ].filter(link => link.url && link.url !== "" && link.url !== "#")

    return (
        <footer className="w-full bg-white border-t border-slate-100 pt-20 pb-10">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-16">
                    {/* Logo & Info */}
                    <div className="space-y-8">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white font-black italic shadow-lg shadow-primary/20 overflow-hidden">
                                {info.logo_url ? (
                                    <img src={info.logo_url} className="w-full h-full object-contain" alt="Logo" />
                                ) : (
                                    <Zap className="w-6 h-6" />
                                )}
                            </div>
                            <span className="text-2xl font-black tracking-tighter text-slate-900 group-hover:text-primary transition-colors uppercase italic">{info.name}</span>
                        </Link>
                        <p className="text-slate-500 text-sm leading-relaxed font-medium">
                            {info.tagline || "Lo mejor de la cocina de mar, pescados y asados premium. Tradición familiar en el corazón de Caucasia."}
                        </p>

                        {socialLinks.length > 0 && (
                            <div className="flex flex-wrap gap-3">
                                {socialLinks.map((link, idx) => (
                                    <a
                                        key={idx}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center transition-all text-slate-400 ${link.color} shadow-sm`}
                                    >
                                        {link.icon}
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-8">
                        <h4 className="font-black uppercase tracking-[0.2em] text-[10px] text-slate-400 italic">Navegación</h4>
                        <ul className="space-y-4 text-sm font-bold text-slate-600">
                            <li><Link href="/menu" className="hover:text-primary transition-colors uppercase italic tracking-wider">Nuestra Carta</Link></li>
                            <li><Link href="/combos" className="hover:text-primary transition-colors uppercase italic tracking-wider">Combos</Link></li>
                            <li><Link href="/nosotros" className="hover:text-primary transition-colors uppercase italic tracking-wider">Nosotros</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="space-y-8">
                        <h4 className="font-black uppercase tracking-[0.2em] text-[10px] text-slate-400 italic">Contacto Directo</h4>
                        <ul className="space-y-5 text-sm font-bold text-slate-600">
                            <li className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-primary shrink-0" />
                                <span className="leading-tight">{info.address}</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-primary" />
                                <span>{info.phone}</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-primary" />
                                <span className="truncate">{info.email}</span>
                            </li>
                        </ul>
                    </div>

                    {/* Admin Access (Restricted) */}
                    <div className="space-y-8">
                        <h4 className="font-black uppercase tracking-[0.2em] text-[10px] text-slate-400 italic">Terminal Admin</h4>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed">
                            Acceso restringido para el personal operativo de {info.name}.
                        </p>
                        <Link
                            href="/admin"
                            className="inline-flex items-center gap-3 px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest italic hover:bg-primary hover:text-black transition-all"
                        >
                            <Shield className="w-4 h-4" />
                            PANEL OS
                        </Link>
                    </div>
                </div>

                <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                    <p>© {new Date().getFullYear()} {info.name} OS. Powered by Antigravity.</p>
                    <div className="flex gap-10">
                        <Link href="/privacidad" className="hover:text-slate-900">Privacidad</Link>
                        <Link href="/terminos" className="hover:text-slate-900">Términos</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
