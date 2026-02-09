"use client"

import { useRestaurant } from "@/providers/RestaurantProvider"
import { cn } from "@/lib/utils"
import { Building2 } from "lucide-react"

export function QuickBusinessSwitch() {
    const { restaurant, accessibleRestaurants } = useRestaurant()

    if (accessibleRestaurants.length <= 1) return null

    const handleSwitch = (subdomain: string) => {
        const hostname = window.location.hostname
        let newUrl = ""

        if (hostname === 'localhost' || hostname.includes('127.0.0.1')) {
            alert(`Cambiando al subdominio: ${subdomain}.jamalios.com`)
            return
        }

        const domainParts = hostname.split('.')
        if (domainParts.length >= 2) {
            const domain = domainParts.slice(-2).join('.')
            newUrl = `${window.location.protocol}//${subdomain}.${domain}${window.location.port ? ':' + window.location.port : ''}/admin`
        } else {
            newUrl = `${window.location.protocol}//${subdomain}.jamalios.com/admin`
        }

        window.location.href = newUrl
    }

    return (
        <div className="px-4 mb-6">
            <p className="px-4 text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono mb-3">Cambio Rápido</p>
            <div className="flex flex-wrap gap-3 px-2">
                {accessibleRestaurants.map((res) => (
                    <button
                        key={res.id}
                        onClick={() => handleSwitch(res.subdomain)}
                        title={res.name}
                        className={cn(
                            "w-10 h-10 rounded-2xl border-2 transition-all flex items-center justify-center overflow-hidden hover:scale-110 active:scale-90 shadow-sm",
                            restaurant?.id === res.id
                                ? "border-primary bg-primary/5 ring-4 ring-primary/10"
                                : "border-slate-100 bg-white opacity-60 hover:opacity-100 hover:border-slate-300"
                        )}
                    >
                        {res.logo_url ? (
                            <img src={res.logo_url} className="w-full h-full object-contain p-1" alt={res.name} />
                        ) : (
                            <Building2 className="w-4 h-4 text-slate-400" />
                        )}
                    </button>
                ))}
            </div>
        </div>
    )
}
