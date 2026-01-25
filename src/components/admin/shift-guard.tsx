"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Clock, LogOut, Power } from "lucide-react"
import { useRouter } from "next/navigation"

export function ShiftGuard({ children }: { children: React.ReactNode }) {
    const [hasActiveShift, setHasActiveShift] = useState<boolean | null>(null)
    const [loading, setLoading] = useState(true)
    const [userRole, setUserRole] = useState<string>("")
    const [userId, setUserId] = useState<string>("")
    const router = useRouter()

    useEffect(() => {
        checkShift()
    }, [])

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

        // Admin, Owner y Manager no necesitan turno obligatorio para entrar
        if (['admin', 'owner', 'manager'].includes(role)) {
            setHasActiveShift(true)
            setLoading(false)
            return
        }

        // Check active shift
        const { data: shift } = await supabase
            .from('shifts')
            .select('*')
            .eq('user_id', user.id)
            .is('end_time', null)
            .maybeSingle()

        setHasActiveShift(!!shift)
        setLoading(false)
    }

    const startShift = async () => {
        setLoading(true)
        try {
            const { error } = await supabase.from('shifts').insert({
                user_id: userId,
                start_time: new Date().toISOString()
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
                    Pargo OS • Time Tracking
                </p>
            </div>
        </div>
    )
}
