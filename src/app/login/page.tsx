"use client"

import { AuthForm } from "@/components/auth/auth-form"
import Link from "next/link"
import { Navbar } from "@/components/store/navbar"
import { useRestaurant } from "@/providers/RestaurantProvider"

export default function LoginPage() {
    const { restaurant } = useRestaurant()

    return (
        <div className="min-h-screen flex flex-col items-center bg-background">
            <Navbar />

            <div className="flex-1 flex flex-col items-center justify-center w-full px-6 py-20">
                <div className="w-full max-w-md p-8 rounded-3xl bg-card/50 border border-white/5 backdrop-blur-sm flex flex-col items-center gap-6 shadow-2xl">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight">
                            Bienvenido a {restaurant?.name || "Pargo Rojo"}
                        </h1>
                        <p className="text-muted-foreground">
                            Ingresa tu correo para gestionar tu negocio o hacer pedidos.
                        </p>
                    </div>

                    <AuthForm />

                    <div className="text-center w-full pt-4 border-t border-white/5">
                        <p className="text-sm text-muted-foreground">
                            ¿Aún no tienes cuenta?{' '}
                            <Link href="/register" className="font-bold text-primary hover:underline">
                                Regístrate aquí
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
