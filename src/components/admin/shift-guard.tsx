"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Clock, LogOut, Power } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"

export function ShiftGuard({ children }: { children: React.ReactNode }) {
    const [hasActiveShift, setHasActiveShift] = useState<boolean | null>(null)
    const [loading, setLoading] = useState(true)
    const [userRole, setUserRole] = useState<string>("")
    const [userId, setUserId] = useState<string>("")
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        checkShift()
    }, [pathname])

    const checkShift = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        setUserId(user.id)

        // Get Role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const role = profile?.role || ''
        setUserRole(role)

        // REDIRECCIÓN AUTOMÁTICA SEGÚN EL ROL (solo para /admin exacto)
        if (pathname === '/admin') {
            const roleRedirects: Record<string, string> = {
                'cashier': '/admin/cashier/start-shift',
                'waiter': '/admin/waiter',
                'cook': '/admin/kitchen',
                'chef': '/admin/kitchen',
                'host': '/admin/reservations',
                'driver': '/admin/driver'
            }

            if (roleRedirects[role]) {
                router.push(roleRedirects[role])
                return
            }
        }

        // Rutas permitidas sin turno activo (para evitar bloqueo circular)
        const allowedWithoutShift = [
            '/admin/cashier/start-shift',
            '/admin/cashier/open-box'
        ]

        // Admin, Owner y Manager no necesitan turno obligatorio para entrar
        if (['admin', 'owner', 'manager'].includes(role)) {
            setHasActiveShift(true)
            setLoading(false)
            return
        }

        // Si está en una ruta permitida sin turno, permitir acceso
        if (allowedWithoutShift.includes(pathname)) {
            setHasActiveShift(true)
            setLoading(false)
            return
        }

        // Check active shift
        const { data: shift } = await supabase
            .from('shifts')
            .select('*')
            .eq('user_id', user.id)
            .is('ended_at', null)
            .maybeSingle()

        setHasActiveShift(!!shift)
        setLoading(false)
    }

    const startShift = async () => {
        setLoading(true)
        try {
            // 1. Obtener restaurant_id del perfil
            const { data: profile } = await supabase
                .from('profiles')
                .select('restaurant_id')
                .eq('id', userId)
                .single()

            if (!profile?.restaurant_id) {
                throw new Error("No tienes un restaurante asignado.")
            }

            // 2. Intentar obtener una definición de turno automática
            const { data: defs } = await supabase
                .from('shift_definitions')
                .select('*')
                .eq('is_active', true)

            let shiftDefId = null
            let shiftType = 'General'

            if (defs && defs.length > 0) {
                const currentHour = new Date().getHours()
                const recommended = defs.find(s => {
                    const startArr = s.start_time.split(':')
                    const endArr = s.end_time.split(':')
                    const start = parseInt(startArr[0])
                    const end = parseInt(endArr[0])
                    if (start > end) return currentHour >= start || currentHour < end
                    return currentHour >= start && currentHour < end
                })
                if (recommended) {
                    shiftDefId = recommended.id
                    shiftType = recommended.name
                } else {
                    shiftDefId = defs[0].id
                    shiftType = defs[0].name
                }
            }

            const { error } = await supabase.from('shifts').insert({
                user_id: userId,
                restaurant_id: profile.restaurant_id,
                status: 'OPEN',
                shift_type: shiftType,
                shift_definition_id: shiftDefId,
                started_at: new Date().toISOString()
            })

            if (error) throw error
            setHasActiveShift(true)
        } catch (error: any) {
            console.error(error)
            alert("Error al iniciar turno: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push("/login")
    }

    if (loading) return null // O un spinner global

    if (hasActiveShift) {
        return <>{children}</>
    }

    return (
        <div className="fixed inset-0 z-[200] bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full text-center space-y-8 animate-in zoom-in duration-300 shadow-2xl">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clock className="w-12 h-12 text-primary" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">
                        Iniciar Jornada
                    </h1>
                    <p className="text-slate-500 font-medium">
                        Debes marcar tu entrada para poder acceder al sistema.
                    </p>
                </div>

                <div className="space-y-4">
                    <Button
                        onClick={startShift}
                        className="w-full h-16 text-lg font-black uppercase tracking-widest italic rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
                    >
                        <Power className="w-6 h-6 mr-3" />
                        Marcar Entrada
                    </Button>

                    <Button
                        onClick={handleLogout}
                        variant="ghost"
                        className="w-full text-rose-500 font-bold hover:bg-rose-50 hover:text-rose-600"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Cerrar Sesión
                    </Button>
                </div>

                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
                    Jamali OS • Time Tracking
                </p>
            </div>
        </div>
    )
}
