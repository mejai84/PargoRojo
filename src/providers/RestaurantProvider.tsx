"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { supabase } from "@/lib/supabase/client"

interface Restaurant {
    id: string
    name: string
    subdomain: string
    logo_url: string | null
    primary_color: string
    theme?: 'light' | 'dark'
    apply_service_charge?: boolean
    service_charge_percentage?: number
    loyalty_points_per_1000?: number
    currency_symbol?: string
    tax_percentage?: number
    whatsapp_number?: string
    enable_whatsapp_receipts?: boolean
    landing_page_config?: any
}

interface RestaurantContextType {
    restaurant: Restaurant | null
    loading: boolean
    accessibleRestaurants: Restaurant[]
}

const RestaurantContext = createContext<RestaurantContextType>({
    restaurant: null,
    loading: true,
    accessibleRestaurants: []
})

export const useRestaurant = () => useContext(RestaurantContext)

export const RestaurantProvider = ({ children }: { children: ReactNode }) => {
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
    const [loading, setLoading] = useState(true)
    const [accessibleRestaurants, setAccessibleRestaurants] = useState<Restaurant[]>([])

    useEffect(() => {
        const initRestaurant = async () => {
            try {
                setLoading(true)
                const hostname = typeof window !== 'undefined' ? window.location.hostname : ''

                // 1. Resolver por Subdominio (Prioridad Máxima)
                let currentRes: Restaurant | null = null
                const isSystemDomain = hostname.includes('.vercel.app') || hostname === 'localhost' || hostname.includes('127.0.0.1')
                const isCustomDomain = hostname.includes('.jamalios.com')

                if (isCustomDomain || (!isSystemDomain && hostname.includes('.'))) {
                    const subdomain = isCustomDomain ? hostname.split('.')[0] : hostname
                    const { data: resBySub } = await supabase
                        .from('restaurants')
                        .select('*')
                        .eq('subdomain', subdomain)
                        .maybeSingle()

                    if (resBySub) currentRes = resBySub
                }

                // Fallback para dominios de sistema (Vercel, localhost)
                if (!currentRes && isSystemDomain) {
                    const { data: firstRes } = await supabase
                        .from('restaurants')
                        .select('*')
                        .limit(1)
                        .maybeSingle()

                    if (firstRes) currentRes = firstRes
                }

                // 2. Obtener Sesión y Perfil
                const { data: { session } } = await supabase.auth.getSession()

                if (session?.user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*, restaurants(*)')
                        .eq('id', session.user.id)
                        .maybeSingle()

                    // 3. Si no hay restaurante por subdominio, usar el del perfil
                    if (!currentRes && profile?.restaurant_id) {
                        const { data: resData } = await supabase
                            .from('restaurants')
                            .select('*')
                            .eq('id', profile.restaurant_id)
                            .maybeSingle()
                        if (resData) currentRes = resData
                    }

                    // 4. Lógica Multi-Negocio para Propietarios/Admins
                    if (profile?.role === 'admin' || profile?.role === 'super_admin') {
                        // Si es super_admin, puede ver TODOS los restaurantes
                        if (profile.role === 'super_admin') {
                            const { data: allRes } = await supabase
                                .from('restaurants')
                                .select('*')
                                .eq('is_active', true)
                                .order('name')
                            if (allRes) setAccessibleRestaurants(allRes)
                        } else {
                            // TODO: Implementar tabla restaurant_access para propietarios con múltiples locales
                            // Por ahora solo el de su perfil
                            if (currentRes) setAccessibleRestaurants([currentRes])
                        }
                    }
                }

                if (currentRes) {
                    setRestaurant(currentRes)
                    applyBranding(currentRes)
                }

            } catch (error) {
                console.error("Error context initializing:", error)
            } finally {
                setLoading(false)
            }
        }

        initRestaurant()
    }, [])

    const applyBranding = (res: Restaurant) => {
        // 1. Aplicar color primario dinámicamente
        if (res.primary_color) {
            document.documentElement.style.setProperty('--primary', res.primary_color)
            const r = parseInt(res.primary_color.slice(1, 3), 16)
            const g = parseInt(res.primary_color.slice(3, 5), 16)
            const b = parseInt(res.primary_color.slice(5, 7), 16)
            document.documentElement.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`)
        }

        // 2. Aplicar Tema (Oscuro/Claro)
        if (res.theme === 'dark') {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }

        // 3. Aplicar Fondo Personalizado (si existe en config)
        if (res.landing_page_config?.styles?.background_color) {
            document.documentElement.style.setProperty('--background', res.landing_page_config.styles.background_color)
        } else {
            document.documentElement.style.removeProperty('--background')
        }
    }

    return (
        <RestaurantContext.Provider value={{ restaurant, loading, accessibleRestaurants }}>
            {children}
        </RestaurantContext.Provider>
    )
}
