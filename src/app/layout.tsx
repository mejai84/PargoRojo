import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/store/cart-context";
import { CartSheet } from "@/components/store/cart-sheet";
import { Footer } from "@/components/store/footer";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "POZU 2.0 | Hamburguesas Artesanales",
    description: "Las mejores hamburguesas artesanales de la ciudad. Realiza tu pedido online ahora.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es" className="dark" suppressHydrationWarning>
            <body className={`${outfit.className} bg-black text-white antialiased`}>
                <CartProvider>
                    <div className="flex flex-col min-h-screen">
                        <main className="flex-1">
                            {children}
                        </main>
                        <Footer />
                    </div>
                    <CartSheet />
                </CartProvider>
            </body>
        </html>
    );
}
