
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Star, Clock, MapPin } from "lucide-react";
import { Navbar } from "@/components/store/navbar";
import { ProductCard } from "@/components/store/product-card";
import { products } from "@/lib/data";

export default function Home() {
  // Filtrar productos para la home
  const featuredBurgers = [
    products.find(p => p.id === "pozu"),
    products.find(p => p.id === "gourmet"),
    products.find(p => p.id === "selecta"),
    products.find(p => p.id === "oikos")
  ].filter((p): p is typeof products[0] => Boolean(p));

  return (
    <div className="min-h-screen flex flex-col items-center">
      <Navbar />

      {/* Hero Section */}
      <section className="w-full pt-32 pb-20 px-6 relative overflow-hidden bg-[url('/images/hero-bg.jpg')] bg-cover bg-center">
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-0"></div>

        {/* Background glow effects */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/20 blur-[120px] rounded-full z-0" />

        <div className="container mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="flex flex-col gap-6 items-start text-left animate-in fade-in slide-in-from-bottom-5 duration-700">
            <span className="px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-bold border border-secondary/20 flex items-center gap-2">
              <Star className="w-4 h-4 fill-secondary" />
              El mejor sabor del Caribe
            </span>
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight">
              Pescados y <br />
              <span className="text-gradient">Mariscos Frescos</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              Disfruta del auténtico Pargo Rojo, cazuelas y los mejores asados de Caucasia. Tradición y sabor en cada plato.
            </p>
            <div className="flex items-center gap-4 mt-2">
              <Link href="/menu">
                <Button size="lg" className="h-12 px-8 text-base font-bold shadow-lg shadow-primary/25">
                  Ver Carta Completa
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base bg-white/5 border-white/10 hover:bg-white/10 hover:text-primary">
                Reservar Mesa
              </Button>
            </div>

            <div className="flex items-center gap-8 mt-8 pt-8 border-t border-white/5 w-full">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary" />
                <div className="flex flex-col text-sm">
                  <span className="font-bold text-foreground">30-45 min</span>
                  <span className="text-muted-foreground">Tiempo entrega</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-primary" />
                <div className="flex flex-col text-sm">
                  <span className="font-bold text-foreground">Caucasia</span>
                  <span className="text-muted-foreground">Antioquia</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative group animate-in fade-in slide-in-from-right-5 duration-1000 delay-200">
            <div className="relative z-10 transform group-hover:scale-105 transition-transform duration-500 ease-out">
              {/* Using a placeholder or generic seafood image until actual assets are uploaded */}
              <div className="w-[600px] h-[500px] bg-gradient-to-br from-red-900/20 to-orange-900/20 rounded-[3rem] border border-white/10 flex items-center justify-center relative overflow-hidden backdrop-blur-md">
                <div className="absolute inset-0 bg-black/20"></div>
                <span className="text-muted-foreground/50 font-bold text-xl relative z-10">Imagen Pargo Rojo</span>
                {/*  Ideally here we would use specific food images like /images/pargo.png */}
              </div>
            </div>
            {/* Floating badges */}
            <div className="absolute top-10 right-10 bg-card/80 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-xl z-20 animate-bounce delay-1000 duration-[3000ms]">
              <span className="text-2xl font-bold text-primary block">Cazuela</span>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Gran Rafa</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="w-full py-20 bg-card/30 border-t border-white/5">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center text-center mb-16 gap-3">
            <h2 className="text-3xl md:text-5xl font-bold">Nuestros Favoritos</h2>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Una selección de las hamburguesas más pedidas por nuestros clientes. ¿Cuál te atreves a probar hoy?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredBurgers.map((burger) =>
              <ProductCard key={burger.id} product={burger} />
            )}
          </div>
        </div>
      </section>

      {/* Location & Reviews Section */}
      <section className="w-full py-20 relative overflow-hidden">
        <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-12">
          {/* Map & Info */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">Visítanos en Gran Rafa</h2>
              <p className="text-muted-foreground text-lg">
                Ven a disfrutar del mejor ambiente familiar y la autentica comida de mar.
              </p>
            </div>

            <div className="h-[400px] w-full rounded-3xl overflow-hidden border border-white/10 relative group">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3945.7171458778656!2d-75.1966!3d7.9833!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e503b8e5c5a5a5b%3A0x0!2sCaucasia%2C%20Antioquia!5e0!3m2!1ses!2sco!4v1642150000000!5m2!1ses!2sco"
                width="100%"
                height="100%"
                style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }}
                allowFullScreen
                loading="lazy"
                className="grayscale hover:grayscale-0 transition-all duration-700"
              ></iframe>
              <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur p-4 rounded-xl border border-white/10 shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span className="font-bold text-sm">C.Cial. Cauca Centro, Caucasia</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Todos los días: 07:00 - 22:00</span>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews */}
          <div className="flex flex-col justify-center space-y-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                <span className="font-bold text-green-500">4.8</span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-3 h-3 fill-green-500 text-green-500" />)}
                </div>
              </div>
              <span className="text-sm text-muted-foreground">Basado en +120 reseñas de Google</span>
            </div>

            <div className="space-y-4">
              {[
                {
                  name: "David G.",
                  text: "Las mejores hamburguesas de Laviana sin duda. La carne es espectacular y el trato de 10. ¡Repetiremos seguro!",
                  bg: "bg-white/5"
                },
                {
                  name: "Laura M.",
                  text: "Un sitio con mucho rollo. La hamburguesa Pozu es brutal, y las patatas con 4 salsas son obligatorias.",
                  bg: "bg-white/[0.02]"
                },
                {
                  name: "Javi F.",
                  text: "Calidad precio inmejorable. Se nota que los ingredientes son frescos. El servicio a domicilio funciona genial, llega todo caliente.",
                  bg: "bg-white/5"
                }
              ].map((review, i) => (
                <div key={i} className={`p-6 rounded-2xl border border-white/5 ${review.bg} hover:border-primary/30 transition-colors`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold">{review.name}</span>
                    <div className="flex text-secondary">
                      {[1, 2, 3, 4, 5].map(star => <Star key={star} className="w-3 h-3 fill-secondary" />)}
                    </div>
                  </div>
                  <p className="text-muted-foreground italic">"{review.text}"</p>
                </div>
              ))}
            </div>

            <Button variant="outline" className="self-start gap-2">
              Ver todas las reseñas en Google
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
