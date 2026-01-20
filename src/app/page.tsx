
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
      <section className="w-full pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/20 blur-[120px] rounded-full -z-10" />

        <div className="container mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-6 items-start text-left animate-in fade-in slide-in-from-bottom-5 duration-700">
            <span className="px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-bold border border-secondary/20 flex items-center gap-2">
              <Star className="w-4 h-4 fill-secondary" />
              Las mejores de Asturias
            </span>
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight">
              Hamburguesas que <br />
              <span className="text-gradient">Dejan Huella</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              Ingredientes premium, carne 100% ternera asturiana y recetas únicas. Pide online y disfruta del verdadero sabor del Pozu.
            </p>
            <div className="flex items-center gap-4 mt-2">
              <Link href="/menu">
                <Button size="lg" className="h-12 px-8 text-base">
                  Ver Carta Completa
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base bg-white/5 border-white/10 hover:bg-white/10">
                Reservar Mesa
              </Button>
            </div>

            <div className="flex items-center gap-8 mt-8 pt-8 border-t border-white/5 w-full">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary" />
                <div className="flex flex-col text-sm">
                  <span className="font-bold text-foreground">15-20 min</span>
                  <span className="text-muted-foreground">Tiempo entrega</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-primary" />
                <div className="flex flex-col text-sm">
                  <span className="font-bold text-foreground">Pola de Laviana</span>
                  <span className="text-muted-foreground">Asturias</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative group animate-in fade-in slide-in-from-right-5 duration-1000 delay-200">
            <div className="relative z-10 transform group-hover:scale-105 transition-transform duration-500 ease-out">
              <Image
                src="/images/burgers/pozu.png"
                alt="Hamburguesa Pozu Especial"
                width={800}
                height={800}
                priority
                className="w-full h-auto drop-shadow-2xl"
              />
            </div>
            {/* Floating badges */}
            <div className="absolute top-10 right-10 bg-card/80 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-xl z-20 animate-bounce delay-1000 duration-[3000ms]">
              <span className="text-2xl font-bold text-primary block">12,00€</span>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Pozu Especial</span>
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
              <h2 className="text-3xl md:text-4xl font-bold">Visítanos en el Pozu</h2>
              <p className="text-muted-foreground text-lg">
                Ven a disfrutar del ambiente rockero y la mejor comida de la cuenca.
              </p>
            </div>

            <div className="h-[400px] w-full rounded-3xl overflow-hidden border border-white/10 relative group">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2909.103098523674!2d-5.5645!3d43.2458!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd367b660a0a0a0a%3A0x0!2sC.%20R%C3%ADo%20Cares%2C%202%2C%2033980%20Pola%20de%20Laviana%2C%20Asturias!5e0!3m2!1ses!2ses!4v1642150000000!5m2!1ses!2ses"
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
                  <span className="font-bold text-sm">C. Río Cares, 2, Pola de Laviana</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Mar-Dom: 19:30 - 23:30</span>
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
