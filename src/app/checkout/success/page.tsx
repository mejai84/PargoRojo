
import { Navbar } from "@/components/store/navbar"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import Link from "next/link"

export default function CheckoutSuccessPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center">
            <Navbar />

            <div className="flex-1 flex flex-col items-center justify-center container mx-auto px-6 text-center space-y-6">
                <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center animate-in zoom-in duration-500">
                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>

                <h1 className="text-4xl font-bold">¡Pedido Confirmado!</h1>
                <p className="text-muted-foreground max-w-md text-lg">
                    Gracias por tu compra. Hemos recibido tu pedido y la cocina ya está preparándolo.
                </p>

                <div className="flex gap-4 pt-4">
                    <Link href="/">
                        <Button variant="outline">Volver al Inicio</Button>
                    </Link>
                    <Link href="/menu">
                        <Button>Pedir algo más</Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
