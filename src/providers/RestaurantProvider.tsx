"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { supabase } from "@/lib/supabase/client"

interface Restaurant {
    id: string
    name: string
    subdomain: string
    logo_url: string | null
    primary_color: string
}

interface RestaurantContextType {
    restaurant: Restaurant | null
    loading: boolean
}

const RestaurantContext = createContext<RestaurantContextType>({
    restaurant: null,
    loading: true
})

export const useRestaurant = () => useContext(RestaurantContext)

export const RestaurantProvider = ({ children }: { children: ReactNode }) => {
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchRestaurantData = async () => {
            try {
                setLoading(true)

                // 1. Obtener la sesión actual
                const { data: { session } } = await supabase.auth.getSession()

                if (session && session.user) {
                    try {
                        // 2. Si hay sesión, buscamos el restaurant_id en el perfil
                        const { data: profile, error: profileError } = await supabase
                            .from('profiles')
                            .select('restaurant_id')
                            .eq('id', session.user.id)
                            .maybeSingle() // IMPORTANTE: Usa maybeSingle en vez de single para evitar error si no existe

                        if (profileError) {
                            console.warn("⚠️ Error leyendo perfil:", profileError);
                        }

                        if (profile?.restaurant_id) {
                            const { data: resData, error: restError } = await supabase
                                .from('restaurants')
                                .select('*')
                                .eq('id', profile.restaurant_id)
                                .maybeSingle()

                            if (restError) console.warn("⚠️ Error leyendo restaurante:", restError);

                            if (resData) {
                                setRestaurant(resData)
                                applyBranding(resData)
                                return
                            }
                        }
                    } catch (innerError) {
                        console.error("🔥 Error interno en Provider:", innerError);
                    }
                }

                // 3. Intento por subdominio (Opcional por ahora, pero preparado)
                // const hostname = window.location.hostname
                // if (hostname.includes('.') && !hostname.startsWith('localhost')) {
                //   const subdomain = hostname.split('.')[0]
                //   const { data: resBySub } = await supabase.from('restaurants').select('*').eq('subdomain', subdomain).single()
                //   if (resBySub) {
                //     setRestaurant(resBySub)
                //     applyBranding(resBySub)
                //   }
                // }

            } catch (error) {
                console.error("Error fetching restaurant context:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchRestaurantData()
    }, [])

    const applyBranding = (res: Restaurant) => {
        // Aplicar color primario dinámicamente al CSS
        if (res.primary_color) {
            document.documentElement.style.setProperty('--primary', res.primary_color)
            const r = parseInt(res.primary_color.slice(1, 3), 16)
            const g = parseInt(res.primary_color.slice(3, 5), 16)
            const b = parseInt(res.primary_color.slice(5, 7), 16)
            document.documentElement.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`)
        }
    }

    return (
        <RestaurantContext.Provider value={{ restaurant, loading }}>
            {children}
        </RestaurantContext.Provider>
    )
}
