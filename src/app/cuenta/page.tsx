
"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { LogOut, User, ShoppingBag, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/store/navbar"

export default function CuentaPage() {
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const getProfile = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push("/login")
                return
            }
            setUser(session.user)

            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single()

            setProfile(data)
            setLoading(false)
        }
        getProfile()
    }, [router])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push("/")
        router.refresh()
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="container mx-auto px-6 pt-32 pb-20">
                <div className="max-w-2xl mx-auto space-y-8">
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-bold">Mi Cuenta</h1>
                        <Button
                            variant="destructive"
                            className="gap-2"
                            onClick={handleLogout}
                        >
                            <LogOut className="w-4 h-4" />
                            Cerrar Sesión
                        </Button>
                    </div>

                    <div className="grid gap-6">
                        <div className="p-6 rounded-3xl bg-card border border-white/5 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold">
                                    {profile?.full_name?.[0] || user?.email?.[0].toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">{profile?.full_name || "Usuario"}</h2>
                                    <p className="text-muted-foreground">{user?.email}</p>
                                </div>
                                <div className="ml-auto">
                                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase">
                                        {profile?.role || "Cliente"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {profile?.role === 'admin' && (
                            <div className="p-6 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-2xl bg-primary/20 text-primary">
                                        <User className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold">Acceso Administrativo</h3>
                                        <p className="text-sm text-muted-foreground">Tienes permisos para gestionar el restaurante.</p>
                                    </div>
                                </div>
                                <Button onClick={() => router.push("/admin")} className="font-bold">
                                    Ir al Panel
                                </Button>
                            </div>
                        )}

                        <div className="p-12 rounded-3xl bg-card border border-white/5 text-center space-y-4">
                            <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground opacity-20" />
                            <h3 className="font-bold text-xl">Mis Pedidos</h3>
                            <p className="text-muted-foreground">Aún no has realizado ningún pedido.</p>
                            <Button variant="outline" onClick={() => router.push("/menu")}>
                                Ver Menú
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
