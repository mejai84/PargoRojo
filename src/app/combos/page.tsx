"use client"

import { Navbar } from "@/components/store/navbar"
import { LayoutDashboard, Rocket, Zap, Heart } from "lucide-react"

export default function CombosPage() {
    return (
        <div className="min-h-screen bg-background pb-20">
            <Navbar />

            <div className="pt-32 container mx-auto px-6">
                <div className="max-w-4xl mx-auto text-center space-y-8">
                    <div className="inline-flex p-4 rounded-3xl bg-primary/10 border border-primary/20 animate-bounce">
                        <Zap className="w-12 h-12 text-primary" />
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                        Próximamente: <span className="text-gradient">Combos Gran Rafa</span>
                    </h1>

                    <p className="text-xl text-muted-foreground leading-relaxed">
                        Estamos diseñando las mejores combinaciones para que ahorres y disfrutes al máximo.
                        Pronto podrás pedir tus menús completos con un solo click.
                    </p>

                    <div className="grid md:grid-cols-3 gap-6 pt-12">
                        {[
                            { icon: Rocket, title: "Envío Prioritario", desc: "Los combos salen volando de cocina." },
                            { icon: Heart, title: "Hechos con Amor", desc: "La combinación perfecta de sabores." },
                            { icon: LayoutDashboard, title: "Personalizables", desc: "Tú eliges el refresco y el acompañante." }
                        ].map((feature, i) => (
                            <div key={i} className="bg-card/50 border border-white/5 p-8 rounded-3xl hover:border-primary/30 transition-colors">
                                <feature.icon className="w-8 h-8 text-primary mb-4 mx-auto" />
                                <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                                <p className="text-sm text-muted-foreground">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
