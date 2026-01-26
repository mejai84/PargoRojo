import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/store/cart-context";
import { CartSheet } from "@/components/store/cart-sheet";
import { Footer } from "@/components/store/footer";
import { WhatsAppButton } from "@/components/store/whatsapp-button";
import { ClientBot } from "@/components/store/client-bot";
import { RestaurantProvider } from "@/providers/RestaurantProvider";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Pargo Rojo - Gran Rafa | Restaurante",
    description: "Lo mejor en comida de mar, Pescados y Mariscos. Espectaculares asados en Caucasia.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es" className="light" suppressHydrationWarning>
            <body className={`${outfit.className} bg-white text-gray-900 antialiased`}>
                <RestaurantProvider>
                    <CartProvider>
                        <div className="flex flex-col min-h-screen">
                            <main className="flex-1">
                                {children}
                            </main>
                            <Footer />
                        </div>
                        <CartSheet />
                        <ClientBot />
                        <WhatsAppButton />
                    </CartProvider>
                </RestaurantProvider>
            </body>
        </html>
    );
}
