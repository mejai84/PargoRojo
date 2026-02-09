"use client"

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Star, Clock, MapPin, ChefHat, Utensils, Users, Loader2, Zap, ArrowRight, Play, Award, Heart, ShoppingBag, Sparkles } from "lucide-react";
import { Navbar } from "@/components/store/navbar";
import { ProductCard } from "@/components/store/product-card";
import { Footer } from "@/components/store/footer";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function Home() {
  const [loading, setLoading] = useState(true)
  const [featuredDishes, setFeaturedDishes] = useState<any[]>([])
  const [businessInfo, setBusinessInfo] = useState<any>({
    name: "PARGO ROJO",
    logo_url: "",
    tagline: "Gran Rafa | Experiencia Gastronómica de Mar",
    address: "C.Cial. Cauca Centro, Caucasia"
  })
  const [landingConfig, setLandingConfig] = useState<any>(null)
  const [showImages, setShowImages] = useState(true)

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      // 1. Obtener restaurante por el subdominio actual (o el primero por defecto para testing)
      const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
      const subdomain = hostname.includes('.jamalios.com') ? hostname.split('.')[0] : null

      let query = supabase.from('restaurants').select('*')
      if (subdomain) {
        query = query.eq('subdomain', subdomain)
      }

      const { data: resData } = await query.limit(1).single()

      if (resData) {
        setBusinessInfo({
          ...resData,
          name: resData.name || "NEGOCIO",
          tagline: resData.landing_page_config?.hero?.tagline || "Experiencia Gastronómica"
        })
        if (resData.landing_page_config) {
          setLandingConfig(resData.landing_page_config)
          if (resData.landing_page_config.feature_flags) {
            setShowImages(resData.landing_page_config.feature_flags.menu_show_images ?? true)
          }
        }
      }

      // Fallback a settings solo si no se obtuvo la flag arriba
      if (resData?.landing_page_config?.feature_flags?.menu_show_images === undefined) {
        const { data: settings } = await supabase.from('settings').select('*')
        if (settings) {
          const flags = settings.find(s => s.key === 'feature_flags')
          if (flags && flags.value) {
            try {
              const parsedFlags = typeof flags.value === 'string' ? JSON.parse(flags.value) : flags.value
              setShowImages(parsedFlags.menu_show_images ?? true)
            } catch (e) {
              console.warn('Error parsing feature_flags:', e)
            }
          }
        }
      }

      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('is_available', true)
        .limit(4)

      if (products) {
        setFeaturedDishes(products.map(p => ({
          ...p,
          image: p.image_url || "/images/placeholder.png"
        })))
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6">
      <Zap className="w-16 h-16 text-primary animate-pulse" />
      <div className="text-center">
        <p className="text-white font-black uppercase tracking-[0.5em] italic text-xs">Pargo OS</p>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2">Elevando la gastronomía costera</p>
      </div>
    </div>
  )

  // Configuración por defecto si no hay en la DB
  const config = landingConfig || {
    hero: {
      image_url: "/premium_seafood_hero_1769294804705.png",
      title_part1: businessInfo.name?.split(' ')[0] || "PARGO",
      title_part2: businessInfo.name?.split(' ').slice(1).join(' ') || "ROJO",
      tagline: businessInfo.tagline,
      est_year: "2012",
      location_city: "Caucasia, Antioquia"
    },
    essence: [
      {
        title: "Ingredientes Premium",
        desc: "Seleccionamos diariamente la pesca más fresca y los cortes de carne más exclusivos de la región.",
        icon: "Award"
      },
      {
        title: "Maestría en Brasa",
        desc: "Nuestra técnica de asado tradicional resalta los sabores naturales con el toque único.",
        icon: "ChefHat"
      },
      {
        title: "Legado Familiar",
        desc: "Más que un restaurante, somos una tradición que celebra el sabor auténtico.",
        icon: "Heart"
      }
    ],
    experience: {
      image_url: "/premium_restaurant_interior_1769294818416.png",
      title_part1: "Un espacio diseñado para",
      title_part2: "Celebrar",
      description: `En ${businessInfo.name}, cada rincón cuenta una historia. Hemos creado una atmósfera que combina la calidez tropical con la sofisticación moderna.`,
      tour_link: "#"
    }
  }

  return (
    <div className="min-h-screen bg-white selection:bg-primary selection:text-black">
      <Navbar />

      {/* 🎥 CINEMATIC HERO SECTION */}
      <section className="relative h-[95vh] w-full flex items-center justify-center overflow-hidden">
        {/* Background Image with Parallax-like effect */}
        <div className="absolute inset-0 z-0">
          <Image
            src={config.hero.image_url || "/premium_seafood_hero_1769294804705.png"}
            alt="Premium Seafood"
            fill
            className="object-cover scale-105"
            priority
          />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
        </div>

        <div className="container relative z-10 px-6 text-center space-y-8 animate-in fade-in zoom-in duration-1000">
          <div className="flex flex-col items-center gap-4">
            <span className="px-6 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase tracking-[0.4em] italic shadow-2xl">
              Est. {config.hero.est_year} • {config.hero.location_city}
            </span>
            <h1 className="text-6xl md:text-9xl font-black text-white italic tracking-tighter leading-none uppercase">
              {config.hero.title_part1} <span className="text-primary">{config.hero.title_part2}</span>
            </h1>
            <p className="text-white/80 text-xl md:text-2xl font-medium tracking-wide max-w-3xl mx-auto italic">
              "{config.hero.tagline}"
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-10">
            <Link href="/menu">
              <Button size="lg" className="h-20 px-12 bg-primary text-black hover:bg-white transition-all rounded-full font-black italic uppercase tracking-widest text-sm shadow-[0_20px_50px_rgba(255,107,53,0.3)]">
                Explorar la Carta <ArrowRight className="ml-3 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/reservar">
              <Button size="lg" variant="ghost" className="h-20 px-12 text-white hover:bg-white/10 rounded-full font-black italic uppercase tracking-widest text-sm border-2 border-white/20 backdrop-blur-md transition-all">
                Reservar Mesa
              </Button>
            </Link>
          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-50">
            <span className="text-[10px] font-black text-white uppercase tracking-[0.3em] italic">Desliza para descubrir</span>
            <div className="w-px h-16 bg-gradient-to-b from-primary to-transparent" />
          </div>
        </div>
      </section>

      {/* ✨ THE ESSENCE SECTION (Features) */}
      <section className="py-32 bg-white relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-16">
            {config.essence.map((item: any, i: number) => {
              const Icon = item.icon === 'Award' ? Award :
                item.icon === 'ChefHat' ? ChefHat :
                  item.icon === 'Star' ? Star :
                    item.icon === 'Sparkles' ? Sparkles :
                      item.icon === 'Zap' ? Zap : Heart;
              return (
                <EssenceItem
                  key={i}
                  icon={<Icon className="w-10 h-10" />}
                  title={item.title}
                  desc={item.desc}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* 🛖 EXPERIENCE SECTION (Interior) */}
      <section className="relative h-[80vh] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={config.experience.image_url || "/premium_restaurant_interior_1769294818416.png"}
            alt="Restaurant Interior"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px]" />
        </div>

        <div className="container relative z-10 px-6 grid lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8 animate-in slide-in-from-left-10 duration-1000">
            <span className="text-primary font-black uppercase tracking-[0.4em] italic text-xs">Ambiente & Confort</span>
            <h2 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter uppercase leading-none">
              {config.experience.title_part1} <br /> <span className="text-primary">{config.experience.title_part2}</span>
            </h2>
            <p className="text-white/70 text-lg leading-relaxed font-medium">
              {config.experience.description}
            </p>
            <div className="pt-6">
              <Link href={config.experience.tour_link || "#"}>
                <Button className="h-16 px-10 bg-white text-black hover:bg-primary transition-all rounded-2xl font-black italic uppercase tracking-widest text-xs">
                  Tour Virtual <Play className="ml-3 w-4 h-4 fill-current" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="hidden lg:grid grid-cols-2 gap-6 rotate-3">
            <div className="space-y-6 mt-12">
              <div className="aspect-[3/4] rounded-[2rem] border-4 border-white/10 overflow-hidden shadow-2xl relative">
                <Image src={config.experience.image_url || "/premium_restaurant_interior_1769294818416.png"} alt="Chef" fill className="object-cover" />
              </div>
            </div>
            <div className="space-y-6">
              <div className="aspect-[3/4] rounded-[2rem] border-4 border-white/10 overflow-hidden shadow-2xl relative">
                <Image src={config.hero.image_url || "/premium_seafood_hero_1769294804705.png"} alt="Detail" fill className="object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🍽️ SIGNATURE DISHES (Featured) */}
      <section className="py-32 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-8 text-center md:text-left">
            <div className="space-y-4">
              <span className="text-primary font-black uppercase tracking-[0.4em] italic text-xs">Selección del Chef</span>
              <h2 className="text-5xl md:text-7xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">
                Platos <span className="text-primary">Insignia</span>
              </h2>
            </div>
            <Link href="/menu">
              <Button variant="ghost" className="text-slate-400 hover:text-primary transition-all font-black uppercase tracking-widest italic text-xs gap-3">
                Ver toda la carta <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {featuredDishes.length > 0 ? featuredDishes.map((dish) => (
              <div key={dish.id} className="group animate-in fade-in duration-700">
                <ProductCard product={dish} showImages={showImages} />
              </div>
            )) : Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-[400px] bg-white rounded-[2.5rem] border border-slate-100 flex flex-col items-center justify-center gap-4 text-slate-300">
                <ShoppingBag className="w-10 h-10 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest">Próximamente</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 📍 PREMIUM LOCATION SECTION */}
      <section className="py-32 bg-white relative overflow-hidden">
        <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">
          <div className="order-2 lg:order-1 h-[600px] w-full rounded-[3.5rem] overflow-hidden border border-slate-200 shadow-[0_40px_100px_rgba(0,0,0,0.1)] relative group">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3945.726277638686!2d-75.19835822414777!3d7.982367705973789!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e503b8603685609%3A0x5825287d377484e0!2sCauca%20Centro!5e0!3m2!1ses!2sco!4v1705800000000!5m2!1ses!2sco"
              width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy"
              className="grayscale contrast-[1.1] group-hover:grayscale-0 transition-all duration-1000"
            ></iframe>
            <div className="absolute inset-x-0 bottom-0 p-10 bg-gradient-to-t from-white to-transparent">
              <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white inline-flex flex-col gap-2 shadow-2xl">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span className="font-black italic text-slate-900 uppercase tracking-tighter">Punto Estratégico</span>
                </div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider pl-8">{businessInfo.address}</p>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2 space-y-10 animate-in slide-in-from-right-10 duration-1000">
            <span className="text-primary font-black uppercase tracking-[0.4em] italic text-xs">Ubicación Privilegiada</span>
            <h2 className="text-5xl md:text-7xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">
              Encuéntranos en <br /> <span className="text-primary">{businessInfo.name}</span>
            </h2>
            <div className="space-y-6">
              <p className="text-slate-500 text-lg leading-relaxed font-medium italic">
                {businessInfo.tagline}. Ofrecemos un refugio gastronómico donde el confort y el sabor se encuentran.
              </p>
              <div className="grid grid-cols-2 gap-8 pt-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Horario de Atención</p>
                  <p className="text-sm font-black text-slate-900 italic uppercase">Lunes a Domingo</p>
                  <p className="text-xs font-bold text-slate-500">07:00 AM - 10:00 PM</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Reservas Directas</p>
                  <p className="text-sm font-black text-slate-900 italic uppercase">Llamada o WhatsApp</p>
                  <p className="text-xs font-bold text-slate-500">{businessInfo.whatsapp_number || "Contactar Soporte"}</p>
                </div>
              </div>
            </div>
            <div className="pt-6">
              <Button className="h-16 px-10 bg-slate-900 text-white hover:bg-primary hover:text-black transition-all rounded-2xl font-black italic uppercase tracking-widest text-xs shadow-xl">
                Cómo Llegar <ArrowRight className="ml-3 w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function EssenceItem({ icon, title, desc }: any) {
  return (
    <div className="group space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black group-hover:rotate-6 transition-all duration-500 shadow-sm group-hover:shadow-xl group-hover:shadow-primary/20">
        {icon}
      </div>
      <div className="space-y-4">
        <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-slate-500 leading-relaxed font-bold text-sm">
          {desc}
        </p>
      </div>
      <div className="w-12 h-1 bg-slate-100 group-hover:w-20 group-hover:bg-primary transition-all duration-500" />
    </div>
  )
}
