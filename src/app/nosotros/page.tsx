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
                            Pasión por la <span className="text-gradient">Comida de Mar</span>
                        </h1>
                        <p className="text-xl text-muted-foreground leading-relaxed">
                            Desde nuestros inicios en Caucasia, nos hemos dedicado a traer los sabores más frescos del Caribe a tu mesa. Pargo Rojo es tradición y calidad.
                        </p>

                        <div className="grid grid-cols-2 gap-8 pt-8">
                            <div>
                                <div className="text-4xl font-bold text-primary mb-2">+15</div>
                                <p className="text-muted-foreground">Años de experiencia</p>
                            </div>
                            <div>
                                <div className="text-4xl font-bold text-primary mb-2">100%</div>
                                <p className="text-muted-foreground">Pesca Fresca</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative aspect-video lg:aspect-square rounded-3xl overflow-hidden border border-white/10 group">
                        {/* Placeholder image until user uploads specific "About" image */}
                        <div className="absolute inset-0 bg-[url('/images/hero-bg.jpg')] bg-cover bg-center"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-6 left-6 right-6 p-6 glass rounded-2xl border border-white/10">
                            <p className="text-lg font-medium italic">"El verdadero sabor del mar, preparado con el alma."</p>
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
                            <h3 className="text-2xl font-bold">Frescura Garantizada</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Seleccionamos el mejor pescado y marisco diariamente. Del mar a tu plato, garantizando la máxima calidad en cada bocado.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                                <Heart className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-2xl font-bold">Sazón Tradicional</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Nuestras recetas conservan el toque casero y tradicional de la cocina costeña, preparadas con amor y dedicación.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                                <Star className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-2xl font-bold">Ambiente Familiar</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                En Gran Rafa, te sentirás como en casa. Un espacio acogedor pensado para disfrutar en familia y con amigos.
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
                        <p className="text-xl font-bold">C.Cial. Cauca Centro - Caucasia</p>
                        <p className="text-muted-foreground">Antioquia, Colombia</p>
                    </div>
                </div>
            </section>
        </div>
    )
}
