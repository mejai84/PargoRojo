"use client"

import { Navbar } from "@/components/store/navbar"
import Image from "next/image"
import { Star, ShieldCheck, Heart, MapPin } from "lucide-react"

export default function NosotrosPage() {
    return (
        <div className="min-h-screen bg-background pb-20">
            <Navbar />

            {/* Hero Section */}
            <section className="pt-32 pb-20 relative overflow-hidden">
                <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-8">
                        <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold border border-primary/20">
                            Nuestra Historia
                        </span>
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
                            Más que una <span className="text-gradient">Hamburguesería</span>
                        </h1>
                        <p className="text-xl text-muted-foreground leading-relaxed">
                            Nacimos en el corazón de Pola de Laviana con una misión clara: elevar el concepto de la hamburguesa artesanal usando producto de nuestra tierra.
                        </p>

                        <div className="grid grid-cols-2 gap-8 pt-8">
                            <div>
                                <div className="text-4xl font-bold text-primary mb-2">+10k</div>
                                <p className="text-muted-foreground">Clientes satisfechos</p>
                            </div>
                            <div>
                                <div className="text-4xl font-bold text-primary mb-2">100%</div>
                                <p className="text-muted-foreground">Ternera Asturiana</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative aspect-video lg:aspect-square rounded-3xl overflow-hidden border border-white/10 group">
                        <Image
                            src="/images/logo.jpg"
                            alt="Interior del local"
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-6 left-6 right-6 p-6 glass rounded-2xl border border-white/10">
                            <p className="text-lg font-medium italic">"El sabor del Pozu no se explica, se siente en cada mordisco."</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-20 bg-card/30 border-y border-white/5">
                <div className="container mx-auto px-6">
                    <div className="grid md:grid-cols-3 gap-12 text-center text-pretty">
                        <div className="space-y-4">
                            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                                <ShieldCheck className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-2xl font-bold">Calidad Suprema</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Seleccionamos personalmente cada ingrediente. Nuestra carne nunca ha sido congelada y nuestro pan se hornea a diario.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                                <Heart className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-2xl font-bold">Hecho a Mano</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Aquí no hay máquinas procesadoras. Cada hamburguesa es boleada y aplastada a mano para mantener su jugosidad.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                                <Star className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-2xl font-bold">Esencia Rockera</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Somos Pozu por la mina y por el espíritu. Un ambiente joven, dinámico y con la mejor música de fondo.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Map Section Redirect */}
            <section className="py-20">
                <div className="container mx-auto px-6 text-center space-y-8">
                    <h2 className="text-3xl md:text-5xl font-bold">¿Dónde encontrarnos?</h2>
                    <div className="flex flex-col items-center gap-4">
                        <MapPin className="w-12 h-12 text-primary animate-bounce" />
                        <p className="text-xl font-bold">Calle Río Cares, 2 - Pola de Laviana</p>
                        <p className="text-muted-foreground">Asturias (España)</p>
                    </div>
                </div>
            </section>
        </div>
    )
}
