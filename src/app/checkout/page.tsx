
import { Navbar } from "@/components/store/navbar"
import { CheckoutForm } from "@/components/store/checkout-form"

export default function CheckoutPage() {
    return (
        <div className="min-h-screen bg-background pb-20">
            <Navbar />

            <div className="container mx-auto px-6 pt-32">
                <h1 className="text-4xl font-bold mb-8 text-center">Finalizar Pedido</h1>

                <CheckoutForm />
            </div>
        </div>
    )
}
