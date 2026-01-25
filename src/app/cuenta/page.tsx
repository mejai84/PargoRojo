
"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { LogOut, User, ShoppingBag, Loader2, Save, Edit3, Phone, Mail, X, Check } from "lucide-react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/store/navbar"
import { CustomerNotifications } from "@/components/store/customer-notifications"

export default function CuentaPage() {
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const router = useRouter()

    // Editable fields
    const [editData, setEditData] = useState({
        full_name: "",
        phone: "",
        address: ""
    })

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
            if (data) {
                setEditData({
                    full_name: data.full_name || "",
                    phone: data.phone || "",
                    address: data.address || ""
                })
            }
            setLoading(false)
        }
        getProfile()
    }, [router])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push("/")
        router.refresh()
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: editData.full_name,
                    phone: editData.phone,
                    address: editData.address,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id)

            if (error) throw error

            // Update local state
            setProfile({ ...profile, ...editData })
            setIsEditing(false)
            alert("✅ Información actualizada correctamente")
        } catch (error: any) {
            alert("Error al guardar: " + error.message)
        } finally {
            setSaving(false)
        }
    }

    const cancelEdit = () => {
        setEditData({
            full_name: profile?.full_name || "",
            phone: profile?.phone || "",
            address: profile?.address || ""
        })
        setIsEditing(false)
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
                        {/* Profile Card with Edit Functionality */}
                        <div className="p-6 rounded-3xl bg-card border border-white/5 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold">
                                        {(editData.full_name || user?.email)?.[0]?.toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">{profile?.full_name || "Usuario"}</h2>
                                        <p className="text-muted-foreground flex items-center gap-2">
                                            <Mail className="w-4 h-4" />
                                            {user?.email}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase">
                                        {profile?.role || "Cliente"}
                                    </span>
                                    {!isEditing && (
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setIsEditing(true)}
                                            className="rounded-full"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Edit Form */}
                            {isEditing ? (
                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Nombre Completo</label>
                                        <input
                                            type="text"
                                            className="w-full h-12 px-4 rounded-xl bg-background border border-white/10 focus:border-primary outline-none transition-all"
                                            value={editData.full_name}
                                            onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                                            placeholder="Tu nombre completo"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <Phone className="w-4 h-4" /> Teléfono / Móvil
                                        </label>
                                        <input
                                            type="tel"
                                            className="w-full h-12 px-4 rounded-xl bg-background border border-white/10 focus:border-primary outline-none transition-all"
                                            value={editData.phone}
                                            onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                                            placeholder="Ej: +57 300 123 4567"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Dirección (opcional)</label>
                                        <input
                                            type="text"
                                            className="w-full h-12 px-4 rounded-xl bg-background border border-white/10 focus:border-primary outline-none transition-all"
                                            value={editData.address}
                                            onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                                            placeholder="Tu dirección de entrega"
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-4">
                                        <Button
                                            variant="outline"
                                            className="flex-1 h-12 gap-2"
                                            onClick={cancelEdit}
                                            disabled={saving}
                                        >
                                            <X className="w-4 h-4" /> Cancelar
                                        </Button>
                                        <Button
                                            className="flex-1 h-12 gap-2"
                                            onClick={handleSave}
                                            disabled={saving}
                                        >
                                            {saving ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Check className="w-4 h-4" />
                                            )}
                                            Guardar Cambios
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="pt-4 border-t border-white/5 space-y-3">
                                    <div className="flex items-center gap-3 text-muted-foreground">
                                        <Phone className="w-4 h-4" />
                                        <span>{profile?.phone || "Sin teléfono registrado"}</span>
                                    </div>
                                    {profile?.address && (
                                        <div className="flex items-center gap-3 text-muted-foreground">
                                            <span>📍</span>
                                            <span>{profile.address}</span>
                                        </div>
                                    )}
                                </div>
                            )}
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

                        {/* Puntos Gran Rafa Card */}
                        <div className="p-8 rounded-[2.5xl] bg-gradient-to-br from-primary/20 to-secondary/20 border border-white/10 relative overflow-hidden group">
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/20 blur-[60px] rounded-full group-hover:bg-primary/30 transition-all duration-700" />

                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-primary font-bold tracking-wider uppercase text-xs">
                                        <div className="w-8 h-0.5 bg-primary" />
                                        Puntos Gran Rafa
                                    </div>
                                    <h3 className="text-4xl font-extrabold tracking-tight">
                                        {profile?.loyalty_points || 0} <span className="text-xl text-muted-foreground font-medium">Puntos</span>
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Equivale a <span className="text-foreground font-bold">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format((profile?.loyalty_points || 0) * 10)}</span> de descuento en tu próximo pedido.
                                    </p>
                                </div>
                                <Button variant="outline" className="h-12 px-8 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 hover:text-primary transition-all font-bold">
                                    ¿Cómo ganar más?
                                </Button>
                            </div>
                        </div>

                        {/* Notificaciones del Cliente */}
                        <CustomerNotifications />

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
