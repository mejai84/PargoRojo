
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Star, Clock, MapPin, ChefHat, Utensils, Users } from "lucide-react";
import { Navbar } from "@/components/store/navbar";
import { ProductCard } from "@/components/store/product-card";
import { products } from "@/lib/data";

export default function Home() {
  // Filtrar productos para la home
  const featuredDishes = [
    products.find(p => p.id === "pargo_rojo"),
    products.find(p => p.id === "cazuela_mariscos"),
    products.find(p => p.id === "churrasco"),
    products.find(p => p.id === "arroz_marinera")
  ].filter((p): p is typeof products[0] => Boolean(p));

  return (
    <div className="min-h-screen flex flex-col items-center bg-white">
      <Navbar />

      {/* Hero Section - Moderno Coral */}
      <section className="w-full pt-32 pb-20 px-6 relative overflow-hidden bg-gradient-to-br from-gray-50 to-white">
        {/* Elementos geométricos decorativos */}
        <div className="absolute top-20 right-10 w-32 h-32 border-2 border-primary/20 rotate-45 hidden lg:block" />
        <div className="absolute bottom-20 left-10 w-24 h-24 border-2 border-primary/10 rotate-12 hidden lg:block" />
        <div className="absolute top-40 left-1/4 w-16 h-16 bg-primary/5 rotate-45 hidden lg:block" />

        <div className="container mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="flex flex-col gap-6 items-start text-left animate-in fade-in slide-in-from-bottom-5 duration-700">
            <span className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold border border-primary/20 flex items-center gap-2">
              <Star className="w-4 h-4 fill-primary" />
              El mejor sabor del Caribe
            </span>
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight text-gray-900">
              <span className="text-gradient">Gran Rafa</span> <br />
              Auténtica Cocina de Mar Colombiana
            </h1>
            <p className="text-lg text-gray-600 max-w-xl leading-relaxed">
              Disfruta del auténtico Pargo Rojo, cazuelas y los mejores asados de Caucasia. Tradición y sabor en cada plato.
            </p>
            <div className="flex items-center gap-4 mt-2">
              <Link href="/menu">
                <Button size="lg" className="h-14 px-10 text-base font-bold shadow-lg shadow-primary/25 bg-primary hover:bg-primary/90 rounded-full">
                  Ver Menú
                </Button>
              </Link>
              <Link href="/reservar">
                <Button size="lg" variant="outline" className="h-14 px-10 text-base rounded-full border-2 border-gray-200 hover:border-primary hover:text-primary bg-white">
                  Reservar
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-8 mt-8 pt-8 border-t border-gray-100 w-full">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div className="flex flex-col text-sm">
                  <span className="font-bold text-gray-900">30-45 min</span>
                  <span className="text-gray-500">Tiempo de entrega</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div className="flex flex-col text-sm">
                  <span className="font-bold text-gray-900">Caucasia</span>
                  <span className="text-gray-500">Antioquia</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative group animate-in fade-in slide-in-from-right-5 duration-1000 delay-200">
            <div className="relative z-10 transform group-hover:scale-105 transition-transform duration-500 ease-out">
              <div className="w-full max-w-[550px] aspect-square bg-white rounded-[3rem] border border-gray-100 shadow-2xl shadow-gray-200/50 flex items-center justify-center relative overflow-hidden">
                <Image
                  src="/images/pargo-hero.jpg"
                  alt="Pargo Rojo Gran Rafa"
                  fill
                  className="object-cover"
                  priority
                />
                {/* Overlay sutil */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            </div>
            {/* Badges flotantes */}
            <div className="absolute top-10 -right-4 bg-white border border-gray-100 p-4 rounded-2xl shadow-xl z-20 animate-bounce duration-[3000ms]">
              <span className="text-2xl font-bold text-primary block">Especialidad</span>
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Pargo Rojo</span>
            </div>
            <div className="absolute -bottom-4 -left-4 bg-white border border-gray-100 p-4 rounded-2xl shadow-xl z-20">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                </div>
                <span className="font-bold text-gray-900">4.8</span>
              </div>
              <span className="text-xs text-gray-500">+120 reseñas</span>
            </div>
          </div>
        </div>
      </section>

      {/* Categorías Section */}
      <section className="w-full py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Entradas */}
            <div className="group p-8 bg-gray-50 rounded-3xl border border-gray-100 hover:border-primary/30 hover:shadow-xl transition-all duration-300 relative overflow-hidden">
              <div className="absolute -top-6 -right-6 w-24 h-24 border-2 border-primary/10 rotate-45 group-hover:border-primary/30 transition-colors" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <Utensils className="w-6 h-6 text-primary" />
                Entradas
              </h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                  Ceviche Mixto
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                  Coctel de Camarones
                </li>
              </ul>
            </div>

            {/* Platos Fuertes */}
            <div className="group p-8 bg-gray-50 rounded-3xl border border-gray-100 hover:border-primary/30 hover:shadow-xl transition-all duration-300 relative overflow-hidden">
              <div className="absolute -top-6 -right-6 w-24 h-24 border-2 border-primary/10 rotate-45 group-hover:border-primary/30 transition-colors" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <ChefHat className="w-6 h-6 text-primary" />
                Platos Fuertes
              </h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                  Pargo Rojo Frito
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                  Cazuela de Mariscos
                </li>
              </ul>
            </div>

            {/* Bebidas */}
            <div className="group p-8 bg-gray-50 rounded-3xl border border-gray-100 hover:border-primary/30 hover:shadow-xl transition-all duration-300 relative overflow-hidden">
              <div className="absolute -top-6 -right-6 w-24 h-24 border-2 border-primary/10 rotate-45 group-hover:border-primary/30 transition-colors" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <Users className="w-6 h-6 text-primary" />
                Bebidas
              </h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                  Jugos Naturales
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                  Limonada de Coco
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Nuestra Historia Section */}
      <section className="w-full py-20 bg-gray-50 relative overflow-hidden">
        {/* Elemento decorativo */}
        <div className="absolute top-10 right-20 w-40 h-40 border-2 border-primary/10 rotate-45 hidden lg:block" />

        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
                <div className="aspect-[4/3] relative">
                  <Image
                    src="/images/chef.jpg"
                    alt="Nuestra Historia"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              {/* Decoraciones */}
              <div className="absolute -bottom-6 -left-6 w-32 h-32 border-2 border-primary/20 rounded-3xl -z-10" />
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/10 rounded-3xl -z-10" />
            </div>

            <div className="space-y-6">
              <span className="text-primary font-bold uppercase tracking-wider text-sm">Sobre Nosotros</span>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
                Nuestra Historia
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                En Pargo Rojo - Gran Rafa, llevamos más de una década sirviendo los mejores platos de mar de Caucasia. Nuestra pasión por la cocina tradicional colombiana se refleja en cada uno de nuestros platillos.
              </p>
              <p className="text-gray-600 text-lg leading-relaxed">
                Desde el pescado fresco hasta nuestras recetas familiares, ofrecemos una experiencia gastronómica única que combina tradición, sabor y el mejor servicio.
              </p>
              <div className="flex gap-4 pt-4">
                <Link href="/nosotros">
                  <Button className="rounded-full bg-primary hover:bg-primary/90 font-bold px-8">
                    Conoce Más
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Productos Destacados */}
      <section className="w-full py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center text-center mb-16 gap-3">
            <span className="text-primary font-bold uppercase tracking-wider text-sm">Nuestro Menú</span>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900">Nuestros Favoritos</h2>
            <p className="text-gray-600 text-lg max-w-2xl">
              Una selección de los platos más pedidos por nuestros clientes. ¿Cuál te atreves a probar hoy?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredDishes.map((dish) =>
              <ProductCard key={dish.id} product={dish} />
            )}
          </div>

          <div className="text-center mt-12">
            <Link href="/menu">
              <Button size="lg" className="rounded-full bg-primary hover:bg-primary/90 font-bold px-12 h-14">
                Ver Menú Completo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Location & Reviews Section */}
      <section className="w-full py-20 relative overflow-hidden bg-gray-50">
        <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-12">
          {/* Map & Info */}
          <div className="space-y-8">
            <div className="space-y-4">
              <span className="text-primary font-bold uppercase tracking-wider text-sm">Ubicación</span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Visítanos en Gran Rafa</h2>
              <p className="text-gray-600 text-lg">
                Ven a disfrutar del mejor ambiente familiar y la auténtica comida de mar.
              </p>
            </div>

            <div className="h-[400px] w-full rounded-3xl overflow-hidden border border-gray-200 relative group shadow-lg">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3945.726277638686!2d-75.19835822414777!3d7.982367705973789!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e503b8603685609%3A0x5825287d377484e0!2sCauca%20Centro!5e0!3m2!1ses!2sco!4v1705800000000!5m2!1ses!2sco"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                className="grayscale-[30%] hover:grayscale-0 transition-all duration-700"
              ></iframe>
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur p-4 rounded-xl border border-gray-200 shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span className="font-bold text-sm text-gray-900">C.Cial. Cauca Centro, Caucasia</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="text-sm text-gray-600">Todos los días: 07:00 - 22:00</span>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews */}
          <div className="flex flex-col justify-center space-y-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1 bg-green-50 px-4 py-2 rounded-full border border-green-200">
                <span className="font-bold text-green-600 text-lg">4.8</span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 fill-green-500 text-green-500" />)}
                </div>
              </div>
              <span className="text-sm text-gray-600">Basado en +120 reseñas de Google</span>
            </div>

            <div className="space-y-4">
              {[
                {
                  name: "María G.",
                  text: "La mejor cazuela de mariscos de todo Caucasia. El sabor es auténtico y la atención es inmejorable.",
                },
                {
                  name: "Carlos P.",
                  text: "Un sitio espectacular para ir en familia. El Pargo Rojo frito es enorme y delicioso. ¡100% recomendado!",
                },
                {
                  name: "Ana L.",
                  text: "Me encanta el ambiente y la comida. Los precios son muy justos para la calidad que ofrecen. Volveré seguro.",
                }
              ].map((review, i) => (
                <div key={i} className={`p-6 rounded-2xl border border-gray-100 bg-white hover:border-primary/30 hover:shadow-lg transition-all duration-300`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-gray-900">{review.name}</span>
                    <div className="flex text-yellow-400">
                      {[1, 2, 3, 4, 5].map(star => <Star key={star} className="w-4 h-4 fill-yellow-400" />)}
                    </div>
                  </div>
                  <p className="text-gray-600 italic">"{review.text}"</p>
                </div>
              ))}
            </div>

            <Button variant="outline" className="self-start gap-2 rounded-full border-2 border-gray-200 hover:border-primary hover:text-primary">
              Ver todas las reseñas en Google
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
