
import { AuthForm } from "@/components/auth/auth-form"
import Link from "next/link"
import { Navbar } from "@/components/store/navbar"

export default function LoginPage() {
    return (
        <div className="min-h-screen flex flex-col items-center bg-background">
            <Navbar />

            <div className="flex-1 flex flex-col items-center justify-center w-full px-6 py-20">
                <div className="w-full max-w-md p-8 rounded-3xl bg-card/50 border border-white/5 backdrop-blur-sm flex flex-col items-center gap-6 shadow-2xl">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight">Bienvenido a Pargo Rojo</h1>
                        <p className="text-muted-foreground">
                            Ingresa tu correo para hacer un pedido o ver el estado de tu compra.
                        </p>
                    </div>

                    <AuthForm />
                </div>
            </div>
        </div>
    )
}
